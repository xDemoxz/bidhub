"use client";
// Formulario para ofertar en el detalle de una subasta (RF-5).
// El navegador NO decide si la oferta es válida: solo la envía. Las reglas
// 6 a 11 las valida el backend y aquí se muestra su respuesta traducida.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { useErrorMessage } from "@/lib/use-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Money } from "@/components/ui/format";

type Props = {
  auctionId: string;
  minNextBid: string;
  isLoggedIn: boolean;
  isOwner: boolean;
};

export function BidForm({ auctionId, minNextBid, isLoggedIn, isOwner }: Props) {
  const t = useTranslations("auction");
  const toMessage = useErrorMessage();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const [amount, setAmount] = useState(minNextBid);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-slate-600">
        <Link
          href={{ pathname: "/login", query: { next: `/${locale}${pathname}` } }}
          className="font-medium text-indigo-600 hover:underline"
        >
          {t("loginToBid")}
        </Link>
      </p>
    );
  }
  if (isOwner) return <p className="text-sm text-slate-600">{t("ownAuction")}</p>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ extended: boolean }>(`/api/auctions/${auctionId}/bids`, {
        json: { amount },
      });
      setSuccess(result.extended ? t("bidExtended") : t("bidSuccess"));
      // Vuelve a pedir la página al servidor para ver el nuevo precio, el
      // historial y el cierre actualizado.
      router.refresh();
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field
        label={t("bidAmount")}
        htmlFor="bid-amount"
        hint={t("minNextBidHint")}
      >
        <input
          id="bid-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={inputClass}
        />
      </Field>
      <p className="text-xs text-slate-500">
        {t("minNextBid")}: <Money value={minNextBid} />
      </p>
      {error ? <Alert>{error}</Alert> : null}
      {success ? <Alert kind="success">{success}</Alert> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t("placingBid") : t("placeBid")}
      </Button>
    </form>
  );
}
