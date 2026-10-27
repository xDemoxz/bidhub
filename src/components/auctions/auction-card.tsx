// Tarjeta de una subasta para el catálogo y el dashboard.
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AuctionDto } from "@/lib/types";
import { DateTime, Money } from "@/components/ui/format";
import { StatusBadge } from "@/components/ui/status-badge";

export function AuctionCard({ auction }: { auction: AuctionDto }) {
  const t = useTranslations("auction");

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {/* next/image optimiza el tamaño y carga diferida de la imagen (T13) */}
        <Image
          src={auction.imageUrl}
          alt={auction.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">{auction.category.name}</span>
          <StatusBadge status={auction.status} />
        </div>
        <h3 className="line-clamp-2 font-semibold text-slate-900">{auction.title}</h3>
        <p className="text-lg font-bold text-indigo-700">
          <Money value={auction.currentPrice} />
        </p>
        <p className="text-xs text-slate-500">
          {t("bidsCount", { count: auction.bidsCount })} · <DateTime value={auction.endsAt} />
        </p>
      </div>
    </Link>
  );
}
