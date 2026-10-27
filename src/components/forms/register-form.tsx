"use client";
// Formulario de registro (RF-1). Siempre crea un usuario normal: el rol de
// administrador no se puede elegir desde aquí (solo existe por seed).
import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { useErrorMessage } from "@/lib/use-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const toMessage = useErrorMessage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        json: {
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        },
      });
      // Recarga completa a propósito: así los layouts del servidor leen la sesión nueva.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/${locale}/dashboard`);
    } catch (caught) {
      setError(toMessage(caught));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t("name")} htmlFor="name">
        <input id="name" name="name" required minLength={2} autoComplete="name" className={inputClass} />
      </Field>
      <Field label={t("email")} htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label={t("password")} htmlFor="password" hint={t("passwordHint")}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("registering") : t("registerSubmit")}
      </Button>
      <p className="text-center text-sm text-slate-600">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
