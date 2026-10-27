// Formato de montos y fechas según el idioma activo. Se usa tanto en
// componentes de servidor como de cliente. La zona horaria es fija
// (src/i18n/routing.ts), así servidor y navegador producen el MISMO texto.
import { useFormatter } from "next-intl";

export function Money({ value }: { value: string }) {
  const format = useFormatter();
  return <>{format.number(Number(value), { style: "currency", currency: "USD" })}</>;
}

export function DateTime({ value }: { value: string }) {
  const format = useFormatter();
  return <>{format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" })}</>;
}
