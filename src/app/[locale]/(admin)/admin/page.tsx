// PANEL DE ADMINISTRACIÓN (RF-7): gestión de categorías y moderación de subastas.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <AdminPanel />
    </div>
  );
}
