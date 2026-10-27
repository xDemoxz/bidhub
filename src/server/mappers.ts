// Convierte registros de la base de datos en los DTOs que ve el frontend.
// Aquí se calcula el estado, el precio actual y los alias; el frontend no
// recalcula nada de negocio.
import type { Prisma } from "@/generated/prisma/client";
import type { AuctionDto, BidDto } from "@/lib/types";
import { toAlias } from "@/server/domain/alias";
import { getAuctionStatus } from "@/server/domain/auction-status";
import { getMinimumNextBid } from "@/server/domain/bid-rules";

// Todo lo que hace falta cargar para armar un AuctionDto, en una sola consulta:
// categoría, vendedor, cantidad de ofertas y la oferta más alta.
export const auctionInclude = {
  category: true,
  seller: { select: { name: true } },
  _count: { select: { bids: true } },
  bids: {
    orderBy: { amount: "desc" },
    take: 1,
    include: { bidder: { select: { name: true } } },
  },
} satisfies Prisma.AuctionInclude;

export type AuctionRecord = Prisma.AuctionGetPayload<{ include: typeof auctionInclude }>;

export function toAuctionDto(auction: AuctionRecord, now: Date): AuctionDto {
  const highest = auction.bids[0] ?? null;
  const bidsCount = auction._count.bids;
  const status = getAuctionStatus(
    { cancelledAt: auction.cancelledAt, endsAt: auction.endsAt, bidsCount },
    now,
  );
  const highestBid = highest ? { amount: highest.amount, bidderId: highest.bidderId } : null;

  return {
    id: auction.id,
    title: auction.title,
    description: auction.description,
    imageUrl: auction.imageUrl,
    startingPrice: auction.startingPrice.toFixed(2),
    minIncrement: auction.minIncrement.toFixed(2),
    currentPrice: (highest?.amount ?? auction.startingPrice).toFixed(2),
    minNextBid: getMinimumNextBid(auction, highestBid).toFixed(2),
    endsAt: auction.endsAt.toISOString(),
    createdAt: auction.createdAt.toISOString(),
    status,
    bidsCount,
    category: { id: auction.category.id, name: auction.category.name },
    sellerId: auction.sellerId,
    sellerAlias: toAlias(auction.seller.name),
    // REGLA 12: el ganador es el autor de la oferta más alta de una subasta cerrada.
    winnerAlias: status === "CLOSED" && highest ? toAlias(highest.bidder.name) : null,
    cancelReason: auction.cancelReason,
  };
}

export function toBidDto(bid: {
  id: string;
  amount: Prisma.Decimal;
  createdAt: Date;
  bidder: { name: string };
}): BidDto {
  return {
    id: bid.id,
    amount: bid.amount.toFixed(2),
    createdAt: bid.createdAt.toISOString(),
    bidderAlias: toAlias(bid.bidder.name),
  };
}
