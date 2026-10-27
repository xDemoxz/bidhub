// REGLAS 12 y 13: estado de una subasta.
//
// El estado NO se guarda en la base de datos: se calcula cada vez que se
// consulta, comparando la hora actual con la fecha de cierre. Por eso es
// correcto "en cualquier momento", sin cron ni procesos externos (regla 13).
//
// Esta es la ÚNICA fuente de verdad del estado. Catálogo, detalle, ofertas y
// dashboard usan estas funciones; nadie más compara fechas por su cuenta.
import type { Prisma } from "@/generated/prisma/client";

export const AUCTION_STATUSES = ["ACTIVE", "CLOSED", "DESERTED", "CANCELLED"] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

export type StatusInput = {
  cancelledAt: Date | null;
  endsAt: Date;
  bidsCount: number;
};

export function getAuctionStatus(input: StatusInput, now: Date): AuctionStatus {
  if (input.cancelledAt) return "CANCELLED";
  if (now < input.endsAt) return "ACTIVE";
  return input.bidsCount > 0 ? "CLOSED" : "DESERTED";
}

// La misma lógica, pero como filtro de base de datos. Se usa para el filtro
// por estado del catálogo y para contar las subastas activas de un vendedor.
// ADAPTAR: si cambia la definición de un estado, cambiar AMBAS funciones.
export function statusWhere(status: AuctionStatus, now: Date): Prisma.AuctionWhereInput {
  switch (status) {
    case "CANCELLED":
      return { cancelledAt: { not: null } };
    case "ACTIVE":
      return { cancelledAt: null, endsAt: { gt: now } };
    case "CLOSED":
      return { cancelledAt: null, endsAt: { lte: now }, bids: { some: {} } };
    case "DESERTED":
      return { cancelledAt: null, endsAt: { lte: now }, bids: { none: {} } };
  }
}
