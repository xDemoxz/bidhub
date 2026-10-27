// Tipos de lo que viaja entre el backend y el frontend (DTOs).
// Este archivo NO importa nada del servidor, para que los componentes de
// cliente puedan usarlo sin arrastrar código de backend al navegador.
//
// ADAPTAR: si cambia la forma de una entidad, se cambia aquí y en
// src/server/mappers.ts (que es quien arma estos objetos).

export type AuctionStatus = "ACTIVE" | "CLOSED" | "DESERTED" | "CANCELLED";
export type Role = "USER" | "ADMIN";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type CategoryDto = {
  id: string;
  name: string;
  auctionsCount?: number;
};

export type AuctionDto = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  // Los montos viajan como texto con 2 decimales para no perder precisión.
  startingPrice: string;
  minIncrement: string;
  currentPrice: string;
  minNextBid: string;
  endsAt: string;
  createdAt: string;
  status: AuctionStatus;
  bidsCount: number;
  category: CategoryDto;
  sellerId: string;
  sellerAlias: string;
  // Solo cuando status = CLOSED (regla 12): el ganador es la oferta más alta.
  winnerAlias: string | null;
  cancelReason: string | null;
};

export type BidDto = {
  id: string;
  amount: string;
  createdAt: string;
  // REGLA 18: alias parcial, nunca nombre completo ni correo.
  bidderAlias: string;
};

export type MyBidDto = BidDto & {
  auctionId: string;
  auctionTitle: string;
  auctionStatus: AuctionStatus;
  // true si esta oferta es hoy la más alta de su subasta.
  isHighest: boolean;
};

export type ApiErrorBody = {
  error: { code: string; message: string; details?: Record<string, unknown> };
};
