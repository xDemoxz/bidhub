"use client";
// Formulario de inicio de sesión (RF-1).
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { useErrorMessage } from "@/lib/use-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const toMessage = useErrorMessage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        json: { email: form.get("email"), password: form.get("password") },
      });
      // Recarga completa: el servidor ya tiene las cookies y los layouts
      // privados leerán la sesión desde el primer render.
      window.location.assign(next);
    } catch (caught) {
      setError(toMessage(caught));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t("email")} htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label={t("password")} htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>
      {error ? <Alert>{error}</Alert> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("loggingIn") : t("loginSubmit")}
      </Button>
      <p className="text-center text-sm text-slate-600">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
