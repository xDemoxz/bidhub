// DETALLE DE LA SUBASTA: renderizado SSR (T6) con ruta dinámica [id] (T2).
// Muestra los datos, la cuenta regresiva, el formulario de oferta y el
// historial público de ofertas.
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BidForm } from "@/components/auctions/bid-form";
import { BidHistory } from "@/components/auctions/bid-history";
import { Countdown } from "@/components/auctions/countdown";
import { Alert } from "@/components/ui/alert";
import { DateTime, Money } from "@/components/ui/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSessionFromCookies } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { getAuction } from "@/server/services/auction-service";
import { listBidsOfAuction } from "@/server/services/bid-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

// Si la subasta no existe, muestra la página 404 en vez de un error 500.
async function loadOr404<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const auction = await getAuction(id).catch(() => null);
  return { title: auction?.title ?? "BidHub" };
}

export default async function AuctionDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auction");

  const [auction, bids, session] = await Promise.all([
    loadOr404(getAuction(id)),
    loadOr404(listBidsOfAuction(id)),
    getSessionFromCookies(),
  ]);
  const isOwner = session?.userId === auction.sellerId;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={auction.imageUrl}
          alt={auction.title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={auction.status} />
            <span className="text-sm text-slate-500">{auction.category.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{auction.title}</h1>
          <p className="text-slate-600">{auction.description}</p>
          <p className="text-sm text-slate-500">
            {t("seller")}: {auction.sellerAlias}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <dt className="text-xs text-slate-500">{t("currentPrice")}</dt>
            <dd className="text-2xl font-bold text-indigo-700">
              <Money value={auction.currentPrice} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{t("timeLeft")}</dt>
            <dd className="text-2xl font-bold">
              {auction.status === "ACTIVE" ? <Countdown endsAt={auction.endsAt} /> : t("ended")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{t("startingPrice")}</dt>
            <dd>
              <Money value={auction.startingPrice} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{t("minIncrement")}</dt>
            <dd>
              <Money value={auction.minIncrement} />
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500">{t("endsAt")}</dt>
            <dd>
              <DateTime value={auction.endsAt} />
            </dd>
          </div>
        </dl>

        {auction.status === "CLOSED" && auction.winnerAlias ? (
          <Alert kind="success">{t("winner", { alias: auction.winnerAlias })}</Alert>
        ) : null}
        {auction.status === "DESERTED" ? <Alert>{t("deserted")}</Alert> : null}
        {auction.status === "CANCELLED" ? (
          <Alert>
            {t("cancelled")}
            {auction.cancelReason ? `: ${auction.cancelReason}` : ""}
          </Alert>
        ) : null}

        {auction.status === "ACTIVE" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            {/* key: al cambiar el mínimo (nueva oferta) el formulario se reinicia con el valor nuevo */}
            <BidForm
              key={auction.minNextBid}
              auctionId={auction.id}
              minNextBid={auction.minNextBid}
              isLoggedIn={Boolean(session)}
              isOwner={isOwner}
            />
          </div>
        ) : null}
      </div>

      <section className="space-y-3 lg:col-span-2">
        <h2 className="text-xl font-semibold">{t("bidsHistory")}</h2>
        <BidHistory bids={bids} />
      </section>
    </div>
  );
}
