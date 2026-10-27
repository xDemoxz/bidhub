// Idiomas de la aplicación (T11). La URL siempre lleva el idioma: /es/..., /en/...
// Esto permite que el Home se genere de forma estática (SSG) en cada idioma.
//
// ADAPTAR: para agregar un idioma, añadirlo aquí y crear messages/<codigo>.json.
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

// Zona horaria fija: si el servidor y el navegador formatearan fechas con zonas
// distintas, aparecerían errores de hidratación (T12).
export const APP_TIME_ZONE = "America/Bogota";
