// Reglas de publicación, edición y cancelación de subastas.
// Son funciones PURAS: reciben datos ya cargados y lanzan un AppError si la
// regla se rompe. No tocan la base de datos, así se pueden probar solas
// (ver auction-rules.test.ts) y reutilizar si cambia la lógica.
import { RULES } from "@/server/domain/constants";
import { getAuctionStatus } from "@/server/domain/auction-status";
import { badRequest, conflict, forbidden } from "@/server/errors";

// REGLA 2: la fecha de cierre debe estar entre 1 hora y 7 días desde ahora.
export function assertValidClosingDate(endsAt: Date, now: Date): void {
  const diff = endsAt.getTime() - now.getTime();
  if (diff < RULES.minAuctionDurationMs || diff > RULES.maxAuctionDurationMs) {
    throw badRequest(
      "INVALID_CLOSING_DATE",
      "La fecha de cierre debe estar entre 1 hora y 7 días a partir de ahora",
      {
        min: new Date(now.getTime() + RULES.minAuctionDurationMs).toISOString(),
        max: new Date(now.getTime() + RULES.maxAuctionDurationMs).toISOString(),
      },
    );
  }
}

// REGLA 4: un vendedor puede tener como máximo 5 subastas activas a la vez.
export function assertSellerBelowActiveLimit(activeCount: number): void {
  if (activeCount >= RULES.maxActiveAuctionsPerSeller) {
    throw conflict(
      "MAX_ACTIVE_AUCTIONS",
      `Ya tienes ${RULES.maxActiveAuctionsPerSeller} subastas activas, el máximo permitido`,
    );
  }
}

export type ManagedAuction = {
  sellerId: string;
  cancelledAt: Date | null;
  endsAt: Date;
  bidsCount: number;
};

// REGLAS 19, 5: solo el vendedor edita, solo si está activa y sin ofertas.
export function assertSellerCanEdit(auction: ManagedAuction, userId: string, now: Date): void {
  assertIsSeller(auction, userId);
  assertActive(auction, now);
  if (auction.bidsCount > 0) {
    throw conflict("AUCTION_HAS_BIDS", "No puedes editar una subasta que ya tiene ofertas");
  }
}

// REGLAS 19, 14: solo el vendedor cancela, y solo si no tiene ofertas.
export function assertSellerCanCancel(auction: ManagedAuction, userId: string, now: Date): void {
  assertIsSeller(auction, userId);
  assertActive(auction, now);
  if (auction.bidsCount > 0) {
    throw conflict("AUCTION_HAS_BIDS", "No puedes cancelar una subasta que ya tiene ofertas");
  }
}

// REGLA 15: el administrador cancela cualquier subasta ACTIVA (aunque tenga
// ofertas), pero debe indicar un motivo, que queda registrado.
export function assertAdminCanCancel(auction: ManagedAuction, reason: string, now: Date): void {
  assertActive(auction, now);
  if (reason.trim().length === 0) {
    throw badRequest("CANCEL_REASON_REQUIRED", "El motivo de la cancelación es obligatorio");
  }
}

// REGLA 19: aunque el usuario cambie el id en la URL, no puede tocar subastas
// ajenas. Se valida en el backend contra el usuario de la sesión.
function assertIsSeller(auction: ManagedAuction, userId: string): void {
  if (auction.sellerId !== userId) {
    throw forbidden("NOT_AUCTION_OWNER", "Solo el vendedor puede realizar esta acción");
  }
}

function assertActive(auction: ManagedAuction, now: Date): void {
  if (getAuctionStatus(auction, now) !== "ACTIVE") {
    throw conflict("AUCTION_NOT_ACTIVE", "La subasta ya no está activa");
  }
}
