"use client";
// Cuenta regresiva del tiempo restante de una subasta (T12, hidratación).
//
// Por qué NO hay error de hidratación: calcular "el tiempo que falta" depende
// de la hora del navegador, que el servidor no conoce. Si se calculara en el
// primer render, el HTML del servidor y el del cliente serían distintos y React
// avisaría del error. La solución: el estado inicial es `null` (servidor y
// cliente pintan lo mismo, "--:--:--") y la hora real se asigna en useEffect,
// que SOLO corre en el navegador, después de la hidratación.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ endsAt, className = "" }: { endsAt: string; className?: string }) {
  const t = useTranslations("auction");
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    // Intencional: el reloj arranca en null para que servidor y cliente rendericen
    // lo mismo (sin error de hidratación) y se llena apenas monta el componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Si el cierre cambia (por ejemplo, una oferta de último minuto lo extendió),
  // se permite volver a refrescar cuando llegue al nuevo cierre.
  useEffect(() => {
    refreshed.current = false;
  }, [endsAt]);

  const remaining = now === null ? null : new Date(endsAt).getTime() - now;

  // Al llegar a cero se pide al servidor el estado actualizado (cerrada/desierta).
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [remaining, router]);

  if (remaining === null) {
    return <span className={`font-mono ${className}`}>--:--:--</span>;
  }
  if (remaining <= 0) {
    return <span className={className}>{t("ended")}</span>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className={`font-mono ${className}`}>
      {days > 0 ? `${days}d ` : ""}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
