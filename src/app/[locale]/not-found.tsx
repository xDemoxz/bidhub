import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="mx-auto flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-slate-600">{t("body")}</p>
      <Link href="/" className={buttonClass()}>
        {t("back")}
      </Link>
    </main>
  );
}
