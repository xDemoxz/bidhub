// Casos de uso de ofertas. Reglas 6 a 11, 18 y 20.
import type { BidDto, MyBidDto } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { getAuctionStatus } from "@/server/domain/auction-status";
import { assertCanBid, computeEndsAtAfterBid } from "@/server/domain/bid-rules";
import { notFound } from "@/server/errors";
import { lockAuction } from "@/server/locks";
import { toBidDto } from "@/server/mappers";

export type PlacedBid = { bid: BidDto; endsAt: string; extended: boolean };

// RF-5: ofertar. Todo ocurre en UNA transacción con la subasta bloqueada:
// leer la oferta más alta, validar, guardar la oferta y (si aplica) extender
// el cierre. Así dos ofertas simultáneas se procesan una tras otra.
export async function placeBid(
  bidderId: string,
  auctionId: string,
  amount: Prisma.Decimal,
  now = new Date(),
): Promise<PlacedBid> {
  return prisma.$transaction(async (tx) => {
    await lockAuction(tx, auctionId);

    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: {
        _count: { select: { bids: true } },
        bids: { orderBy: { amount: "desc" }, take: 1 },
      },
    });
    if (!auction) throw notFound("AUCTION_NOT_FOUND", "La subasta no existe");

    const top = auction.bids[0] ?? null;
    assertCanBid({
      auction: {
        sellerId: auction.sellerId,
        startingPrice: auction.startingPrice,
        minIncrement: auction.minIncrement,
        endsAt: auction.endsAt,
        cancelledAt: auction.cancelledAt,
        bidsCount: auction._count.bids,
      },
      highest: top ? { amount: top.amount, bidderId: top.bidderId } : null,
      bidderId,
      amount,
      now,
    });

    // REGLA 11: una oferta de último minuto extiende el cierre.
    const newEndsAt = computeEndsAtAfterBid(auction.endsAt, now);
    const extended = newEndsAt.getTime() !== auction.endsAt.getTime();
    if (extended) {
      await tx.auction.update({ where: { id: auctionId }, data: { endsAt: newEndsAt } });
    }

    const bid = await tx.bid.create({
      data: { auctionId, bidderId, amount },
      include: { bidder: { select: { name: true } } },
    });

    return { bid: toBidDto(bid), endsAt: newEndsAt.toISOString(), extended };
  });
}

// RF-3 y REGLA 18: historial público; solo alias parcial del postor.
export async function listBidsOfAuction(auctionId: string): Promise<BidDto[]> {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId }, select: { id: true } });
  if (!auction) throw notFound("AUCTION_NOT_FOUND", "La subasta no existe");

  const bids = await prisma.bid.findMany({
    where: { auctionId },
    orderBy: { amount: "desc" },
    include: { bidder: { select: { name: true } } },
  });
  return bids.map(toBidDto);
}

// RF-6 y REGLA 20: cada usuario solo ve SUS ofertas (el id sale de la sesión,
// nunca de un parámetro que el cliente pueda cambiar).
export async function listBidsByUser(userId: string, now = new Date()): Promise<MyBidDto[]> {
  const bids = await prisma.bid.findMany({
    where: { bidderId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      bidder: { select: { name: true } },
      auction: {
        include: {
          _count: { select: { bids: true } },
          bids: { orderBy: { amount: "desc" }, take: 1, select: { id: true } },
        },
      },
    },
  });

  return bids.map((bid) => ({
    ...toBidDto(bid),
    auctionId: bid.auctionId,
    auctionTitle: bid.auction.title,
    auctionStatus: getAuctionStatus(
      {
        cancelledAt: bid.auction.cancelledAt,
        endsAt: bid.auction.endsAt,
        bidsCount: bid.auction._count.bids,
      },
      now,
    ),
    isHighest: bid.auction.bids[0]?.id === bid.id,
  }));
}
