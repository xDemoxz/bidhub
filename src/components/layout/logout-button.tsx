"use client";
// Cierra la sesión: revoca el refresh token en el servidor y vuelve al inicio.
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("nav");
  const locale = useLocale();

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // Recarga completa para que ninguna página conserve datos de la sesión anterior.
    window.location.assign(`/${locale}`);
  }

  return (
    <Button variant="secondary" onClick={logout}>
      {t("logout")}
    </Button>
  );
}
