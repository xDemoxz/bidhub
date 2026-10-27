// Barra de navegación de las páginas PÚBLICAS (layout del grupo (public)).
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthNav } from "@/components/layout/auth-nav";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export function Navbar() {
  const t = useTranslations("nav");
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-indigo-700">
            BidHub
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              {t("home")}
            </Link>
            <Link href="/auctions" className="hover:text-slate-900">
              {t("catalog")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
