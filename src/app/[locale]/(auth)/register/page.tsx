import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/forms/register-form";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("registerTitle")}</h1>
      <RegisterForm />
    </div>
  );
}
