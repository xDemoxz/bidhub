"use client";
// Traduce un error de la API al idioma de la persona usando su código
// (messages/*.json -> "errors"). Si no hay traducción, usa el mensaje del servidor.
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";

export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations("errors");

  return (error: unknown) => {
    if (!(error instanceof ApiError)) return t("generic");
    if (error.code === "VALIDATION_ERROR") {
      const issues = error.details?.issues as { path: string; message: string }[] | undefined;
      const first = issues?.[0];
      return first ? `${t("VALIDATION_ERROR")} (${first.path}: ${first.message})` : t("VALIDATION_ERROR");
    }
    // Los detalles del error (por ejemplo, el monto mínimo) rellenan los {marcadores} del texto.
    const values = (error.details ?? {}) as Record<string, string | number>;
    return t.has(error.code) ? t(error.code, values) : error.message;
  };
}
