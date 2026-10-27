"use client";
// Panel del administrador (RF-7):
//   - Categorías: crear, renombrar y eliminar (regla 17: no se elimina una con subastas).
//   - Moderación: cancelar cualquier subasta activa con un motivo obligatorio (regla 15).
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import type { AuctionDto, CategoryDto } from "@/lib/types";
import { useErrorMessage } from "@/lib/use-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { DateTime, Money } from "@/components/ui/format";

export function AdminPanel() {
  const t = useTranslations("admin");
  const toMessage = useErrorMessage();
  const [categories, setCategories] = useState<CategoryDto[] | null>(null);
  const [auctions, setAuctions] = useState<AuctionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const [cats, active] = await Promise.all([
        apiFetch<CategoryDto[]>("/api/categories"),
        apiFetch<AuctionDto[]>("/api/auctions?status=ACTIVE"),
      ]);
      setCategories(cats);
      setAuctions(active);
    } catch (caught) {
      setError(toMessage(caught));
    }
  }, [toMessage]);

  useEffect(() => {
    // Carga inicial desde la API al montar (intencional).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ejecuta una acción del panel y recarga; cualquier error se muestra arriba.
  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await load();
    } catch (caught) {
      setError(toMessage(caught));
    }
  }

  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const name = new FormData(formElement).get("name");
    void run(async () => {
      await apiFetch("/api/categories", { json: { name } });
      formElement.reset();
    });
  }

  function renameCategory(category: CategoryDto) {
    const name = window.prompt(t("renamePrompt"), category.name);
    if (name && name !== category.name) {
      void run(() => apiFetch(`/api/categories/${category.id}`, { method: "PATCH", json: { name } }));
    }
  }

  function deleteCategory(category: CategoryDto) {
    if (window.confirm(t("confirmDelete", { name: category.name }))) {
      void run(() => apiFetch(`/api/categories/${category.id}`, { method: "DELETE" }));
    }
  }

  function cancelAuction(event: FormEvent, auction: AuctionDto) {
    event.preventDefault();
    void run(async () => {
      await apiFetch(`/api/admin/auctions/${auction.id}/cancel`, { json: { reason } });
      setCancelling(null);
      setReason("");
    });
  }

  if (!categories || !auctions) {
    return error ? <Alert>{error}</Alert> : <p className="text-slate-500">{t("loading")}</p>;
  }

  return (
    <div className="space-y-10">
      {error ? <Alert>{error}</Alert> : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("categories")}</h2>
        <form onSubmit={createCategory} className="flex max-w-md gap-2">
          <input name="name" required minLength={2} placeholder={t("newCategory")} className={inputClass} />
          <Button type="submit">{t("add")}</Button>
        </form>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                {category.name}{" "}
                <span className="text-xs text-slate-500">({t("auctionsCount", { count: category.auctionsCount ?? 0 })})</span>
              </span>
              <span className="flex gap-2">
                <Button variant="secondary" onClick={() => renameCategory(category)}>
                  {t("rename")}
                </Button>
                <Button variant="danger" onClick={() => deleteCategory(category)}>
                  {t("delete")}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("moderation")}</h2>
        {auctions.length === 0 ? (
          <p className="text-slate-500">{t("noActive")}</p>
        ) : (
          <ul className="space-y-3">
            {auctions.map((auction) => (
              <li key={auction.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/auctions/${auction.id}`} className="font-semibold hover:text-indigo-700">
                      {auction.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {auction.sellerAlias} · <Money value={auction.currentPrice} /> ·{" "}
                      {t("bids", { count: auction.bidsCount })} · <DateTime value={auction.endsAt} />
                    </p>
                  </div>
                  <Button variant="danger" onClick={() => setCancelling(cancelling === auction.id ? null : auction.id)}>
                    {t("cancelAuction")}
                  </Button>
                </div>
                {cancelling === auction.id ? (
                  <form onSubmit={(event) => cancelAuction(event, auction)} className="flex gap-2">
                    <input
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      required
                      minLength={3}
                      placeholder={t("reasonPlaceholder")}
                      className={inputClass}
                    />
                    <Button type="submit" variant="danger">
                      {t("confirm")}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
