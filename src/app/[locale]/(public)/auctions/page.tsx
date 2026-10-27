// CATÁLOGO: renderizado SSR (T6). Se genera en cada petición porque depende de
// la hora actual (el estado de cada subasta cambia con el tiempo) y de los
// filtros de la URL. Lee los datos directo del servicio, sin pasar por HTTP.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuctionCard } from "@/components/auctions/auction-card";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { AUCTION_STATUSES, type AuctionStatus } from "@/server/domain/auction-status";
import { listAuctions } from "@/server/services/auction-service";
import { listCategories } from "@/server/services/category-service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; status?: string }>;
};

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("catalog");
  const tStatus = await getTranslations("status");

  const status = AUCTION_STATUSES.find((value) => value === query.status) as AuctionStatus | undefined;
  const categoryId = query.category || undefined;

  const [categories, auctions] = await Promise.all([
    listCategories(),
    listAuctions({ categoryId, status }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {/* Filtros: un formulario GET normal; la URL guarda los filtros y funciona sin JavaScript. */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="space-y-1">
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            {t("filterCategory")}
          </label>
          <select id="category" name="category" defaultValue={categoryId ?? ""} className={inputClass}>
            <option value="">{t("all")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            {t("filterStatus")}
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className={inputClass}>
            <option value="">{t("all")}</option>
            {AUCTION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonClass()}>
          {t("apply")}
        </button>
        <Link href="/auctions" className={buttonClass("secondary")}>
          {t("clear")}
        </Link>
      </form>

      {auctions.length === 0 ? (
        <p className="py-12 text-center text-slate-500">{t("empty")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
