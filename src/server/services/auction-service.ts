// Casos de uso de subastas. Cada función orquesta: cargar datos -> aplicar las
// reglas de src/server/domain -> guardar -> devolver un DTO.
// Las que modifican datos usan una transacción con bloqueo de fila para que
// las reglas se cumplan aunque lleguen peticiones simultáneas.
import type { Prisma } from "@/generated/prisma/client";
import type { AuctionDto } from "@/lib/types";
import { prisma } from "@/server/db";
import {
  assertAdminCanCancel,
  assertSellerBelowActiveLimit,
  assertSellerCanCancel,
  assertSellerCanEdit,
  assertValidClosingDate,
} from "@/server/domain/auction-rules";
import { statusWhere, type AuctionStatus } from "@/server/domain/auction-status";
import { badRequest, notFound } from "@/server/errors";
import { lockAuction, lockUser } from "@/server/locks";
import { auctionInclude, toAuctionDto, type AuctionRecord } from "@/server/mappers";

const CATALOG_LIMIT = 100;

type CreateInput = {
  title: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  startingPrice: Prisma.Decimal;
  minIncrement: Prisma.Decimal;
  endsAt: Date;
};

type UpdateInput = Partial<Omit<CreateInput, "endsAt">>;

// RF-2: catálogo público con filtro por categoría y por estado.
export async function listAuctions(
  filters: { categoryId?: string; status?: AuctionStatus },
  now = new Date(),
): Promise<AuctionDto[]> {
  const auctions = await prisma.auction.findMany({
    where: {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.status ? statusWhere(filters.status, now) : {}),
    },
    include: auctionInclude,
    orderBy: { createdAt: "desc" },
    take: CATALOG_LIMIT,
  });
  return auctions.map((auction) => toAuctionDto(auction, now));
}

// RF-6: las subastas publicadas por el usuario (dashboard).
export async function listAuctionsBySeller(sellerId: string, now = new Date()): Promise<AuctionDto[]> {
  const auctions = await prisma.auction.findMany({
    where: { sellerId },
    include: auctionInclude,
    orderBy: { createdAt: "desc" },
  });
  return auctions.map((auction) => toAuctionDto(auction, now));
}

// RF-3: detalle de una subasta.
export async function getAuction(id: string, now = new Date()): Promise<AuctionDto> {
  const auction = await prisma.auction.findUnique({ where: { id }, include: auctionInclude });
  if (!auction) throw notFound("AUCTION_NOT_FOUND", "La subasta no existe");
  return toAuctionDto(auction, now);
}

// RF-4: publicar. Reglas 1, 2, 3 y 4.
export async function createAuction(
  sellerId: string,
  input: CreateInput,
  now = new Date(),
): Promise<AuctionDto> {
  // REGLA 2 (no necesita base de datos, se comprueba primero).
  assertValidClosingDate(input.endsAt, now);

  const auction = await prisma.$transaction(async (tx) => {
    // Bloquear al vendedor evita que dos publicaciones simultáneas pasen el
    // límite de subastas activas.
    await lockUser(tx, sellerId);

    await assertCategoryExists(tx, input.categoryId); // REGLA 3

    // REGLA 4: contar las subastas activas del vendedor.
    const activeCount = await tx.auction.count({
      where: { sellerId, ...statusWhere("ACTIVE", now) },
    });
    assertSellerBelowActiveLimit(activeCount);

    return tx.auction.create({
      data: { ...input, sellerId },
      include: auctionInclude,
    });
  });

  return toAuctionDto(auction, now);
}

// Editar. Reglas 5 y 19.
export async function updateAuction(
  userId: string,
  auctionId: string,
  input: UpdateInput,
  now = new Date(),
): Promise<AuctionDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const auction = await loadLocked(tx, auctionId);
    assertSellerCanEdit(toManaged(auction), userId, now);
    if (input.categoryId) await assertCategoryExists(tx, input.categoryId);

    return tx.auction.update({ where: { id: auctionId }, data: input, include: auctionInclude });
  });
  return toAuctionDto(updated, now);
}

// Cancelar como vendedor. Reglas 14, 16 y 19. No se borra: queda CANCELLED.
export async function cancelAuctionAsSeller(
  userId: string,
  auctionId: string,
  now = new Date(),
): Promise<AuctionDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const auction = await loadLocked(tx, auctionId);
    assertSellerCanCancel(toManaged(auction), userId, now);

    return tx.auction.update({
      where: { id: auctionId },
      data: { cancelledAt: now },
      include: auctionInclude,
    });
  });
  return toAuctionDto(updated, now);
}

// Moderación: cancelar como administrador. Reglas 15 y 16.
export async function cancelAuctionAsAdmin(
  adminId: string,
  auctionId: string,
  reason: string,
  now = new Date(),
): Promise<AuctionDto> {
  const updated = await prisma.$transaction(async (tx) => {
    const auction = await loadLocked(tx, auctionId);
    assertAdminCanCancel(toManaged(auction), reason, now);

    return tx.auction.update({
      where: { id: auctionId },
      data: { cancelledAt: now, cancelReason: reason.trim(), cancelledById: adminId },
      include: auctionInclude,
    });
  });
  return toAuctionDto(updated, now);
}

// --- helpers internos ---------------------------------------------------

// Bloquea la fila de la subasta y la devuelve. Si no existe, 404.
async function loadLocked(tx: Prisma.TransactionClient, auctionId: string): Promise<AuctionRecord> {
  await lockAuction(tx, auctionId);
  const auction = await tx.auction.findUnique({ where: { id: auctionId }, include: auctionInclude });
  if (!auction) throw notFound("AUCTION_NOT_FOUND", "La subasta no existe");
  return auction;
}

function toManaged(auction: AuctionRecord) {
  return {
    sellerId: auction.sellerId,
    cancelledAt: auction.cancelledAt,
    endsAt: auction.endsAt,
    bidsCount: auction._count.bids,
  };
}

// REGLA 3: la categoría debe existir.
async function assertCategoryExists(tx: Prisma.TransactionClient, categoryId: string): Promise<void> {
  const category = await tx.category.findUnique({ where: { id: categoryId } });
  if (!category) throw badRequest("CATEGORY_NOT_FOUND", "La categoría indicada no existe");
}
