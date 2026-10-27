// Redirecciones seguras después de iniciar sesión o renovar el token.
import { routing } from "@/i18n/routing";

// Evita el "open redirect": solo se aceptan rutas internas ("/algo"), nunca
// "//otro-sitio.com", "https://..." ni rutas con "\".
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

// Extrae el idioma del inicio de una ruta ("/en/dashboard" -> "en").
export function localeFromPath(path: string): string {
  const first = path.split("/")[1];
  return routing.locales.includes(first as (typeof routing.locales)[number])
    ? first
    : routing.defaultLocale;
}
