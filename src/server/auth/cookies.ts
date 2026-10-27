// Cookies de sesión (T9). Ambos tokens viajan SOLO en cookies httpOnly:
//   - httpOnly: JavaScript del navegador no puede leerlas (protege de XSS).
//   - secure:   solo por HTTPS en producción.
//   - sameSite: "lax" evita que otros sitios las envíen en peticiones POST (CSRF).
// Nunca se guardan en localStorage ni se devuelven en el body de la respuesta.
import type { NextResponse } from "next/server";
import { getConfig } from "@/server/config";

export const ACCESS_COOKIE = "bidhub_access";
export const REFRESH_COOKIE = "bidhub_refresh";

function baseOptions() {
  return {
    httpOnly: true,
    secure: getConfig().isProduction,
    sameSite: "lax" as const,
    // Path "/" en ambas: el proxy necesita ver el refresh token al navegar a
    // una página privada para renovar la sesión sin pedir login otra vez.
    path: "/",
  };
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const config = getConfig();
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    maxAge: config.accessTtlSeconds,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    maxAge: config.refreshTtlSeconds,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", { ...baseOptions(), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...baseOptions(), maxAge: 0 });
}
