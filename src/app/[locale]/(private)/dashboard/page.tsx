// DASHBOARD: renderizado CSR (T6). El servidor solo entrega la estructura; el
// contenido (mis subastas y mis ofertas) lo pide el navegador a la API después
// de cargar, y se puede actualizar sin recargar la página.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <DashboardClient />
    </div>
  );
}
