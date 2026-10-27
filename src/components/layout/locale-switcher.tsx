"use client";
// Selector de idioma visible (T11). Cambia el prefijo de la URL (/es <-> /en)
// manteniendo la misma página.
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        aria-label={t("language")}
        onChange={(event) =>
          router.replace(pathname, { locale: event.target.value as (typeof routing.locales)[number] })
        }
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
