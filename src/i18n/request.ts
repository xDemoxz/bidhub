// Configuración de next-intl por petición: qué idioma y qué textos cargar.
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { APP_TIME_ZONE, routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: APP_TIME_ZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
