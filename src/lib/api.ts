// Cliente HTTP para los componentes de cliente (CSR).
//
// Renovación automática de sesión: si una petición responde 401 (access token
// vencido), se llama UNA vez a /api/auth/refresh y se reintenta. La persona no
// nota nada ni vuelve a iniciar sesión mientras su refresh token siga vigente.
import type { ApiErrorBody } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Si varias peticiones reciben 401 a la vez, comparten UN solo refresh:
// hacer varios en paralelo dispararía la detección de reuso del token.
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

const NO_RETRY = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"];

type Options = { method?: string; json?: unknown };

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const send = () =>
    fetch(path, {
      method: options.method ?? (options.json !== undefined ? "POST" : "GET"),
      headers: options.json !== undefined ? { "content-type": "application/json" } : undefined,
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
    });

  let response = await send();
  if (response.status === 401 && !NO_RETRY.includes(path) && (await refreshSession())) {
    response = await send();
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN",
      error?.message ?? response.statusText,
      error?.details,
    );
  }
  return body as T;
}
