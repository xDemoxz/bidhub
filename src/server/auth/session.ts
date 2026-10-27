// Quién está haciendo la petición. Cada route handler llama a estas funciones
// por su cuenta: NO se confía solo en el proxy (T9), porque el proxy puede no
// ejecutarse (por ejemplo, si alguien llama la API directamente).
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/types";
import { ACCESS_COOKIE } from "@/server/auth/cookies";
import { verifyAccessToken } from "@/server/auth/tokens";
import { forbidden, unauthorized } from "@/server/errors";

export type SessionClaims = { userId: string; role: Role };

async function claimsFromToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload ? { userId: payload.sub, role: payload.role } : null;
}

// Para route handlers: lee la cookie del request.
export async function getSession(request: NextRequest): Promise<SessionClaims | null> {
  return claimsFromToken(request.cookies.get(ACCESS_COOKIE)?.value);
}

// Para Server Components (páginas y layouts): lee la cookie con next/headers.
export async function getSessionFromCookies(): Promise<SessionClaims | null> {
  const store = await cookies();
  return claimsFromToken(store.get(ACCESS_COOKIE)?.value);
}

// 401 si no hay sesión válida.
export async function requireUser(request: NextRequest): Promise<SessionClaims> {
  const session = await getSession(request);
  if (!session) throw unauthorized();
  return session;
}

// 401 sin sesión, 403 si la sesión no es de administrador.
export async function requireAdmin(request: NextRequest): Promise<SessionClaims> {
  const session = await requireUser(request);
  if (session.role !== "ADMIN") {
    throw forbidden("ADMIN_ONLY", "Esta acción es solo para administradores");
  }
  return session;
}
