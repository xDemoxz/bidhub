// Barra de navegación del área privada y del panel de administración.
// Recibe el usuario ya cargado en el servidor (layout), por eso aquí sí se
// muestra el nombre desde el primer render.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SessionUser } from "@/lib/types";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { LogoutButton } from "@/components/layout/logout-button";

export function UserNavbar({ user, variant }: { user: SessionUser; variant: "private" | "admin" }) {
  const t = useTranslations("nav");
  const isAdminArea = variant === "admin";

  return (
    <header className={isAdminArea ? "bg-slate-900 text-white" : "border-b border-slate-200 bg-white"}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className={`text-lg font-bold ${isAdminArea ? "text-white" : "text-indigo-700"}`}>
            BidHub{isAdminArea ? " · Admin" : ""}
          </Link>
          <nav className={`flex items-center gap-4 text-sm ${isAdminArea ? "text-slate-300" : "text-slate-600"}`}>
            <Link href="/auctions">{t("catalog")}</Link>
            <Link href="/dashboard">{t("dashboard")}</Link>
            <Link href="/publish">{t("publish")}</Link>
            {user.role === "ADMIN" ? <Link href="/admin">{t("admin")}</Link> : null}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <span className={`text-sm ${isAdminArea ? "text-slate-300" : "text-slate-600"}`}>{user.name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
