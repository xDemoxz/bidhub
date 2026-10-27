// Layout del grupo (private): navbar con menú de usuario (T4).
// Lee la sesión en el servidor para mostrar el nombre desde el primer render.
// (El proxy ya bloquea a quien no tiene sesión; esto es una segunda barrera.)
import { setRequestLocale } from "next-intl/server";
import { UserNavbar } from "@/components/layout/user-navbar";
import { redirect } from "@/i18n/navigation";
import { getSessionFromCookies } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { getUserById } from "@/server/services/auth-service";

export default async function PrivateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSessionFromCookies();
  if (!session) return redirect({ href: "/login", locale });

  const user = await getUserById(session.userId).catch((error: unknown) => {
    if (error instanceof AppError) return null;
    throw error;
  });
  if (!user) return redirect({ href: "/login", locale });

  return (
    <>
      <UserNavbar user={user} variant="private" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
