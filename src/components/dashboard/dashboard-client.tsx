"use client";
// Dashboard del usuario (CSR, RF-6): sus subastas y sus ofertas.
// Todo se carga desde la API en el navegador. Como los datos llegan DESPUÉS de
// montar, el HTML inicial del servidor es solo un "cargando": no hay
// diferencias de hidratación con fechas ni zonas horarias.
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import type { AuctionDto, MyBidDto } from "@/lib/types";
import { useErrorMessage } from "@/lib/use-error-message";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { DateTime, Money } from "@/components/ui/format";
import { StatusBadge } from "@/components/ui/status-badge";

type Tab = "auctions" | "bids";

export function DashboardClient() {
  const t = useTranslations("dashboard");
  const toMessage = useErrorMessage();
  const [tab, setTab] = useState<Tab>("auctions");
  const [auctions, setAuctions] = useState<AuctionDto[] | null>(null);
  const [bids, setBids] = useState<MyBidDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [mine, placed] = await Promise.all([
        apiFetch<AuctionDto[]>("/api/me/auctions"),
        apiFetch<MyBidDto[]>("/api/me/bids"),
      ]);
      setAuctions(mine);
      setBids(placed);
    } catch (caught) {
      setError(toMessage(caught));
    }
  }, [toMessage]);

  useEffect(() => {
    void load();
    // Se carga una sola vez al entrar; las acciones recargan manualmente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancel(auction: AuctionDto) {
    if (!window.confirm(t("confirmCancel", { title: auction.title }))) return;
    setError(null);
    try {
      await apiFetch(`/api/auctions/${auction.id}/cancel`, { method: "POST" });
      await load();
    } catch (caught) {
      setError(toMessage(caught));
    }
  }

  if (!auctions || !bids) {
    return error ? <Alert>{error}</Alert> : <p className="text-slate-500">{t("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      {error ? <Alert>{error}</Alert> : null}

      <div className="flex gap-2 border-b border-slate-200">
        {(["auctions", "bids"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === value ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500"
            }`}
          >
            {value === "auctions" ? t("myAuctions", { count: auctions.length }) : t("myBids", { count: bids.length })}
          </button>
        ))}
      </div>

      {tab === "auctions" ? (
        auctions.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-slate-500">{t("noAuctions")}</p>
            <Link href="/publish" className={buttonClass()}>
              {t("publishFirst")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {auctions.map((auction) => (
              <li
                key={auction.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="space-y-1">
                  <Link href={`/auctions/${auction.id}`} className="font-semibold hover:text-indigo-700">
                    {auction.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    <Money value={auction.currentPrice} /> · {t("bids", { count: auction.bidsCount })} ·{" "}
                    <DateTime value={auction.endsAt} />
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={auction.status} />
                  {/* Reglas 14 y 5: solo se puede cancelar si está activa y sin ofertas. */}
                  {auction.status === "ACTIVE" && auction.bidsCount === 0 ? (
                    <Button variant="danger" onClick={() => cancel(auction)}>
                      {t("cancelAuction")}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : bids.length === 0 ? (
        <p className="py-8 text-center text-slate-500">{t("noBids")}</p>
      ) : (
        <ul className="space-y-3">
          {bids.map((bid) => (
            <li
              key={bid.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="space-y-1">
                <Link href={`/auctions/${bid.auctionId}`} className="font-semibold hover:text-indigo-700">
                  {bid.auctionTitle}
                </Link>
                <p className="text-sm text-slate-500">
                  {t("yourBid")}: <Money value={bid.amount} /> · <DateTime value={bid.createdAt} />
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={bid.auctionStatus} />
                {bid.isHighest ? (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {bid.auctionStatus === "CLOSED" ? t("won") : t("highest")}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {t("outbid")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
