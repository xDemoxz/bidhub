import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/forms/login-form";
import { safeNextPath } from "@/server/auth/redirects";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      {/* "next" se valida aquí también: nunca se redirige a otro sitio. */}
      <LoginForm next={safeNextPath(next, `/${locale}/dashboard`)} />
    </div>
  );
}
