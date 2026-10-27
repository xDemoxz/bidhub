"use client";
// Parte de la barra de navegación que depende de la sesión (Login/Registro o
// Dashboard/Cerrar sesión).
//
// Es un componente de CLIENTE a propósito: las páginas públicas (Home en SSG)
// no pueden leer cookies en el servidor, porque dejarían de ser estáticas.
// Hidratación (T12): el primer render (servidor y cliente) no muestra nada;
// la sesión se consulta DESPUÉS de montar, así nunca hay diferencias.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/types";
import { buttonClass } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";

type State = { status: "loading" } | { status: "guest" } | { status: "user"; user: SessionUser };

export function AuthNav() {
  const t = useTranslations("nav");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    apiFetch<{ user: SessionUser }>("/api/auth/me")
      .then(({ user }) => setState({ status: "user", user }))
      .catch(() => setState({ status: "guest" }));
  }, []);

  if (state.status === "loading") return <div className="h-9 w-40" aria-hidden />;

  if (state.status === "guest") {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonClass("secondary")}>
          {t("login")}
        </Link>
        <Link href="/register" className={buttonClass("primary")}>
          {t("register")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {state.user.role === "ADMIN" ? (
        <Link href="/admin" className={buttonClass("secondary")}>
          {t("admin")}
        </Link>
      ) : null}
      <Link href="/dashboard" className={buttonClass("secondary")}>
        {t("dashboard")}
      </Link>
      <LogoutButton />
    </div>
  );
}
