// HOME: renderizado SSG (T6). No consulta la base de datos ni lee cookies, así
// Next la genera una sola vez al compilar (una por idioma) y la sirve estática.
// Todo lo que cambia (subastas, sesión) vive en otras páginas o se carga en el cliente.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const steps = ["step1", "step2", "step3"] as const;

  return (
    <div className="space-y-16">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-16 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight">{t("heroTitle")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-indigo-100">{t("heroSubtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/auctions" className={buttonClass("secondary")}>
            {t("ctaCatalog")}
          </Link>
          <Link href="/publish" className={buttonClass("primary", "ring-1 ring-white/60")}>
            {t("ctaPublish")}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-center text-2xl font-semibold">{t("howTitle")}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{t(`${step}Title`)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(`${step}Body`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
