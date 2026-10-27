// Etiqueta con el estado de la subasta (ACTIVE, CLOSED, DESERTED, CANCELLED).
import { useTranslations } from "next-intl";
import type { AuctionStatus } from "@/lib/types";

const STYLES: Record<AuctionStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-800",
  DESERTED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: AuctionStatus }) {
  const t = useTranslations("status");
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {t(status)}
    </span>
  );
}
