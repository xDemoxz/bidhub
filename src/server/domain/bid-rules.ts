// Reglas de ofertas (6 a 11). Funciones PURAS, igual que auction-rules.ts.
//
// El orden de las comprobaciones importa: se informa primero el error de
// "quién eres" (403), luego el de "estado de la subasta" (409) y por último
// el del monto, para que el mensaje sea el más útil.
import type { Prisma } from "@/generated/prisma/client";
import { RULES } from "@/server/domain/constants";
import { getAuctionStatus } from "@/server/domain/auction-status";
import { conflict, forbidden } from "@/server/errors";

type Decimal = Prisma.Decimal;

export type BiddableAuction = {
  sellerId: string;
  startingPrice: Decimal;
  minIncrement: Decimal;
  endsAt: Date;
  cancelledAt: Date | null;
  bidsCount: number;
};

export type HighestBid = { amount: Decimal; bidderId: string } | null;

// REGLA 8: monto mínimo aceptado para la próxima oferta.
//   - primera oferta: >= precio inicial
//   - siguientes:     >= oferta más alta + incremento mínimo
export function getMinimumNextBid(
  auction: Pick<BiddableAuction, "startingPrice" | "minIncrement">,
  highest: HighestBid,
): Decimal {
  return highest ? highest.amount.plus(auction.minIncrement) : auction.startingPrice;
}

export function assertCanBid(params: {
  auction: BiddableAuction;
  highest: HighestBid;
  bidderId: string;
  amount: Decimal;
  now: Date;
}): void {
  const { auction, highest, bidderId, amount, now } = params;

  // REGLA 6: no se puede ofertar en la propia subasta.
  if (auction.sellerId === bidderId) {
    throw forbidden("OWN_AUCTION", "No puedes ofertar en tu propia subasta");
  }

  // REGLA 7: solo en subastas activas (no canceladas y con cierre no vencido).
  if (getAuctionStatus(auction, now) !== "ACTIVE") {
    throw conflict("AUCTION_NOT_ACTIVE", "La subasta ya no está activa");
  }

  // REGLA 9: quien ya tiene la oferta más alta no puede volver a ofertar.
  if (highest && highest.bidderId === bidderId) {
    throw conflict("ALREADY_HIGHEST_BIDDER", "Ya tienes la oferta más alta de esta subasta");
  }

  // REGLA 8: monto mínimo.
  const minimum = getMinimumNextBid(auction, highest);
  if (amount.lt(minimum)) {
    throw conflict("BID_TOO_LOW", `La oferta mínima es ${minimum.toFixed(2)}`, {
      minimum: minimum.toFixed(2),
    });
  }
}

// REGLA 11 (anti-sniping): si la oferta llega cuando faltan 5 minutos o menos
// para el cierre, el cierre se extiende 5 minutos más. Se repite cada vez que
// llegue otra oferta dentro de ese margen.
//
// Decisión tomada: los 5 minutos se SUMAN al cierre vigente (cierre + 5 min),
// no se reinician a "ahora + 5 min". ADAPTAR aquí si la prueba dice lo otro.
export function computeEndsAtAfterBid(endsAt: Date, now: Date): Date {
  const remaining = endsAt.getTime() - now.getTime();
  if (remaining <= RULES.extensionWindowMs) {
    return new Date(endsAt.getTime() + RULES.extensionMs);
  }
  return endsAt;
}
