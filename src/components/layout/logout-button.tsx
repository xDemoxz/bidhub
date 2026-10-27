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
    // Recarga completa a propósito: así los layouts del servidor leen la sesión nueva.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/${locale}`);
  }

  return (
    <Button variant="secondary" onClick={logout}>
      {t("logout")}
    </Button>
  );
}
