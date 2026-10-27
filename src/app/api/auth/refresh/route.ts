// Renovación del access token SIN que la persona vuelva a iniciar sesión.
//
//   POST /api/auth/refresh        -> lo usa el frontend (fetch) cuando recibe 401.
//   GET  /api/auth/refresh?next=  -> lo usa el proxy cuando alguien navega a una
//                                    página privada con el access token vencido:
//                                    renueva las cookies y vuelve a la página.
//
// En ambos casos el refresh token se ROTA (el viejo queda revocado).
import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/server/auth/cookies";
import { localeFromPath, safeNextPath } from "@/server/auth/redirects";
import { AppError } from "@/server/errors";
import { errorResponse, withErrors } from "@/server/http";
import { refresh } from "@/server/services/auth-service";

export const POST = withErrors(async (request: NextRequest) => {
  try {
    const { user, tokens } = await refresh(request.cookies.get(REFRESH_COOKIE)?.value);
    const response = NextResponse.json({ user });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    // Si el refresh falla, se limpian las cookies para forzar un login limpio.
    const response = errorResponse(error);
    if (error instanceof AppError && error.status === 401) clearAuthCookies(response);
    return response;
  }
});

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/");
  try {
    const { tokens } = await refresh(request.cookies.get(REFRESH_COOKIE)?.value);
    const response = NextResponse.redirect(new URL(next, request.url));
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    if (!(error instanceof AppError)) return errorResponse(error);
    const login = new URL(`/${localeFromPath(next)}/login`, request.url);
    login.searchParams.set("next", next);
    const response = NextResponse.redirect(login);
    clearAuthCookies(response);
    return response;
  }
}
