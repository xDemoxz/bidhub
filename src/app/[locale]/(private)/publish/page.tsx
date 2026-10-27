// PUBLICAR SUBASTA (RF-4): el servidor carga las categorías y las pasa al formulario.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublishForm } from "@/components/forms/publish-form";
import { listCategories } from "@/server/services/category-service";

export const dynamic = "force-dynamic";

export default async function PublishPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("publish");
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <PublishForm categories={categories.map(({ id, name }) => ({ id, name }))} />
    </div>
  );
}
