"use client";
// Formulario para publicar una subasta (RF-4). Reglas 1 a 4 las valida el
// backend; aquí solo se recogen los datos y se muestra su respuesta.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import type { AuctionDto, CategoryDto } from "@/lib/types";
import { useErrorMessage } from "@/lib/use-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

const HOUR = 3600 * 1000;

// Duraciones permitidas (regla 2: entre 1 hora y 7 días). Se evitan los
// extremos exactos (1 h y 7 d) porque la petición tarda unos milisegundos en
// llegar y quedaría fuera del rango.
const DURATIONS = [
  { key: "h2", ms: 2 * HOUR },
  { key: "h6", ms: 6 * HOUR },
  { key: "h24", ms: 24 * HOUR },
  { key: "d3", ms: 72 * HOUR },
  { key: "d6", ms: 144 * HOUR },
] as const;

export function PublishForm({ categories }: { categories: Pick<CategoryDto, "id" | "name">[] }) {
  const t = useTranslations("publish");
  const toMessage = useErrorMessage();
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const duration = DURATIONS.find((d) => d.key === form.get("duration")) ?? DURATIONS[2];
    setError(null);
    setLoading(true);
    try {
      const auction = await apiFetch<AuctionDto>("/api/auctions", {
        json: {
          title: form.get("title"),
          description: form.get("description"),
          imageUrl: form.get("imageUrl"),
          categoryId: form.get("categoryId"),
          startingPrice: form.get("startingPrice"),
          minIncrement: form.get("minIncrement"),
          endsAt: new Date(Date.now() + duration.ms).toISOString(),
        },
      });
      router.push(`/${locale}/auctions/${auction.id}`);
    } catch (caught) {
      setError(toMessage(caught));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <Field label={t("titleLabel")} htmlFor="title">
        <input id="title" name="title" required minLength={3} maxLength={120} className={inputClass} />
      </Field>
      <Field label={t("descriptionLabel")} htmlFor="description">
        <textarea id="description" name="description" required minLength={10} rows={4} className={inputClass} />
      </Field>
      <Field label={t("imageUrl")} htmlFor="imageUrl" hint={t("imageHint")}>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          required
          placeholder="https://picsum.photos/seed/mi-articulo/800/600"
          className={inputClass}
        />
      </Field>
      <Field label={t("category")} htmlFor="categoryId">
        <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            {t("selectCategory")}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("startingPrice")} htmlFor="startingPrice">
          <input id="startingPrice" name="startingPrice" type="number" step="0.01" min="0.01" required className={inputClass} />
        </Field>
        <Field label={t("minIncrement")} htmlFor="minIncrement">
          <input id="minIncrement" name="minIncrement" type="number" step="0.01" min="0.01" required className={inputClass} />
        </Field>
      </div>
      <Field label={t("duration")} htmlFor="duration" hint={t("durationHint")}>
        <select id="duration" name="duration" defaultValue="h24" className={inputClass}>
          {DURATIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {t(`durations.${d.key}`)}
            </option>
          ))}
        </select>
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={loading}>
        {loading ? t("publishing") : t("submit")}
      </Button>
    </form>
  );
}
