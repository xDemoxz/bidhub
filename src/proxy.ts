// proxy.ts (antes "middleware"): se ejecuta ANTES de renderizar una página.
// Hace dos cosas (T10, T11):
//   1) Protege rutas: las privadas piden sesión y las de admin piden rol ADMIN.
//   2) Aplica el idioma de la URL (/es, /en) con next-intl.
//
// Importante: esto protege las PÁGINAS. La API se protege sola: cada route
// handler valida sesión y rol por su cuenta (src/server/auth/session.ts).
//
// ADAPTAR: si la prueba nueva tiene otras rutas privadas, se agregan en
// PRIVATE_PATHS o ADMIN_PATHS.
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/server/auth/cookies";
import { verifyAccessToken } from "@/server/auth/tokens";

const handleI18nRouting = createMiddleware(routing);

const PRIVATE_PATHS = ["/dashboard", "/publish"];
const ADMIN_PATHS = ["/admin"];
const GUEST_ONLY_PATHS = ["/login", "/register"];

const matches = (path: string, bases: string[]) =>
  bases.some((base) => path === base || path.startsWith(`${base}/`));

// "/es/dashboard" -> { locale: "es", path: "/dashboard" }
function splitLocale(pathname: string): { locale: string; path: string } | null {
  const [, first, ...rest] = pathname.split("/");
  if (!routing.locales.includes(first as (typeof routing.locales)[number])) return null;
  return { locale: first, path: `/${rest.join("/")}`.replace(/\/$/, "") || "/" };
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const parts = splitLocale(pathname);

  // Sin idioma en la URL: que next-intl redirija a /es/... y luego se evalúa.
  if (!parts) return handleI18nRouting(request);

  const { locale, path } = parts;
  const needsAdmin = matches(path, ADMIN_PATHS);
  const needsAuth = needsAdmin || matches(path, PRIVATE_PATHS);
  const guestOnly = matches(path, GUEST_ONLY_PATHS);

  if (needsAuth || guestOnly) {
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    const session = accessToken ? await verifyAccessToken(accessToken) : null;

    if (guestOnly && session) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    if (needsAuth && !session) {
      const next = `${pathname}${search}`;

      // Access token vencido pero hay refresh token: se renueva la sesión
      // sin pedir login (el handler vuelve a esta misma página).
      if (request.cookies.get(REFRESH_COOKIE)?.value) {
        const refresh = new URL("/api/auth/refresh", request.url);
        refresh.searchParams.set("next", next);
        return NextResponse.redirect(refresh);
      }

      const login = new URL(`/${locale}/login`, request.url);
      login.searchParams.set("next", next);
      return NextResponse.redirect(login);
    }

    // Con sesión pero sin rol ADMIN: se bloquea el panel de administración.
    if (needsAdmin && session?.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // No se ejecuta sobre la API, los archivos internos de Next ni los archivos
  // estáticos (cualquier ruta con punto: .png, .ico, etc.).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
