// Historial público de ofertas (RF-3). REGLA 18: solo se muestra el monto, la
// fecha y un alias parcial del postor, nunca nombre completo ni correo.
import { useTranslations } from "next-intl";
import type { BidDto } from "@/lib/types";
import { DateTime, Money } from "@/components/ui/format";

export function BidHistory({ bids }: { bids: BidDto[] }) {
  const t = useTranslations("auction");

  if (bids.length === 0) {
    return <p className="text-sm text-slate-500">{t("noBids")}</p>;
  }

  return (
    <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {bids.map((bid, index) => (
        <li key={bid.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <div>
            <span className="font-medium text-slate-900">{bid.bidderAlias}</span>
            {index === 0 ? (
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {t("highestBid")}
              </span>
            ) : null}
            <p className="text-xs text-slate-500">
              <DateTime value={bid.createdAt} />
            </p>
          </div>
          <span className="font-semibold text-slate-900">
            <Money value={bid.amount} />
          </span>
        </li>
      ))}
    </ol>
  );
}
