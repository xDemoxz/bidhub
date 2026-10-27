// Pruebas de integración: ejercitan los SERVICIOS contra una base de datos real.
// No corren por defecto (necesitan PostgreSQL). Para ejecutarlas:
//   RUN_DB_TESTS=1 npm test
// Crean sus propios datos con un sufijo único y los borran al terminar, así que
// son seguras sobre la base de desarrollo.
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { hashPassword } from "@/server/auth/password";
import { cancelAuctionAsAdmin, cancelAuctionAsSeller, createAuction, getAuction } from "@/server/services/auction-service";
import { listBidsOfAuction, placeBid } from "@/server/services/bid-service";
import { deleteCategory } from "@/server/services/category-service";
import { login, logout, refresh, register } from "@/server/services/auth-service";

const D = (value: string) => new Prisma.Decimal(value);
const run = `t${Date.now()}`;
const HOUR = 3600 * 1000;

async function errorOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return `${error.status}:${error.code}`;
    throw error;
  }
  return "OK";
}

describe.skipIf(!process.env.RUN_DB_TESTS)("reglas de negocio contra PostgreSQL", () => {
  let seller: { id: string };
  let bidderA: { id: string };
  let bidderB: { id: string };
  let admin: { id: string };
  let categoryId: string;

  const newAuction = (sellerId: string, hours = 24) =>
    createAuction(sellerId, {
      title: `Subasta ${run}`,
      description: "Descripción de prueba suficientemente larga",
      imageUrl: "https://picsum.photos/seed/x/800/600",
      categoryId,
      startingPrice: D("100"),
      minIncrement: D("10"),
      endsAt: new Date(Date.now() + hours * HOUR),
    });

  beforeAll(async () => {
    const passwordHash = await hashPassword("Test1234!");
    const mk = (name: string, role: "USER" | "ADMIN" = "USER") =>
      prisma.user.create({ data: { name: `${name} ${run}`, email: `${name}-${run}@test.com`, passwordHash, role } });
    [seller, bidderA, bidderB, admin] = await Promise.all([mk("Vendedor"), mk("Alice"), mk("Bruno"), mk("Admin", "ADMIN")]);
    categoryId = (await prisma.category.create({ data: { name: `Cat ${run}` } })).id;
  });

  afterAll(async () => {
    const userIds = (await prisma.user.findMany({ where: { email: { contains: run } }, select: { id: true } })).map((u) => u.id);
    await prisma.bid.deleteMany({ where: { OR: [{ bidderId: { in: userIds } }, { auction: { sellerId: { in: userIds } } }] } });
    await prisma.auction.deleteMany({ where: { sellerId: { in: userIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it("reglas 6, 8 y 9: ofertas válidas e inválidas", async () => {
    const auction = await newAuction(seller.id);
    expect(await errorOf(placeBid(seller.id, auction.id, D("100")))).toBe("403:OWN_AUCTION");
    expect(await errorOf(placeBid(bidderA.id, auction.id, D("99")))).toBe("409:BID_TOO_LOW");
    expect(await errorOf(placeBid(bidderA.id, auction.id, D("100")))).toBe("OK");
    expect(await errorOf(placeBid(bidderA.id, auction.id, D("500")))).toBe("409:ALREADY_HIGHEST_BIDDER");
    expect(await errorOf(placeBid(bidderB.id, auction.id, D("105")))).toBe("409:BID_TOO_LOW");
    expect(await errorOf(placeBid(bidderB.id, auction.id, D("110")))).toBe("OK");

    const history = await listBidsOfAuction(auction.id);
    expect(history.map((b) => b.amount)).toEqual(["110.00", "100.00"]);
    // REGLA 18: nunca aparece el nombre completo ni el correo.
    expect(JSON.stringify(history)).not.toContain("@");
    expect(history[0].bidderAlias).toMatch(/\*\*\*$/);
  });

  it("concurrencia: dos ofertas simultáneas del mismo monto, solo una gana", async () => {
    const auction = await newAuction(seller.id);
    const results = await Promise.all([
      errorOf(placeBid(bidderA.id, auction.id, D("100"))),
      errorOf(placeBid(bidderB.id, auction.id, D("100"))),
    ]);
    expect(results.filter((r) => r === "OK")).toHaveLength(1);
    expect(results.filter((r) => r === "409:BID_TOO_LOW")).toHaveLength(1);
    expect((await getAuction(auction.id)).bidsCount).toBe(1);
  });

  it("regla 11: una oferta en los últimos 5 minutos extiende el cierre 5 minutos", async () => {
    const auction = await prisma.auction.create({
      data: {
        title: `Por cerrar ${run}`, description: "Descripción de prueba suficientemente larga",
        imageUrl: "https://picsum.photos/seed/y/800/600", startingPrice: D("50"), minIncrement: D("5"),
        endsAt: new Date(Date.now() + 3 * 60 * 1000), sellerId: seller.id, categoryId,
      },
    });
    const before = auction.endsAt.getTime();
    const placed = await placeBid(bidderA.id, auction.id, D("50"));
    expect(placed.extended).toBe(true);
    expect(new Date(placed.endsAt).getTime()).toBe(before + 5 * 60 * 1000);
  });

  it("regla 7: no se oferta en una subasta vencida", async () => {
    const expired = await prisma.auction.create({
      data: {
        title: `Vencida ${run}`, description: "Descripción de prueba suficientemente larga",
        imageUrl: "https://picsum.photos/seed/z/800/600", startingPrice: D("50"), minIncrement: D("5"),
        endsAt: new Date(Date.now() - 1000), sellerId: seller.id, categoryId,
      },
    });
    expect(await errorOf(placeBid(bidderA.id, expired.id, D("50")))).toBe("409:AUCTION_NOT_ACTIVE");
    expect((await getAuction(expired.id)).status).toBe("DESERTED");
  });

  it("regla 4: máximo 5 subastas activas por vendedor", async () => {
    const solo = await prisma.user.create({
      data: { name: `Solo ${run}`, email: `solo-${run}@test.com`, passwordHash: "x" },
    });
    for (let i = 0; i < 5; i++) expect(await errorOf(newAuction(solo.id))).toBe("OK");
    expect(await errorOf(newAuction(solo.id))).toBe("409:MAX_ACTIVE_AUCTIONS");
  });

  it("regla 2: la fecha de cierre debe estar entre 1 hora y 7 días", async () => {
    expect(await errorOf(newAuction(seller.id, 0.5))).toBe("400:INVALID_CLOSING_DATE");
    expect(await errorOf(newAuction(seller.id, 24 * 8))).toBe("400:INVALID_CLOSING_DATE");
  });

  it("reglas 14, 15, 16 y 19: cancelación", async () => {
    const free = await newAuction(seller.id);
    expect(await errorOf(cancelAuctionAsSeller(bidderA.id, free.id))).toBe("403:NOT_AUCTION_OWNER");
    expect(await errorOf(cancelAuctionAsSeller(seller.id, free.id))).toBe("OK");
    expect((await getAuction(free.id)).status).toBe("CANCELLED");

    const withBids = await newAuction(seller.id);
    await placeBid(bidderA.id, withBids.id, D("100"));
    expect(await errorOf(cancelAuctionAsSeller(seller.id, withBids.id))).toBe("409:AUCTION_HAS_BIDS");
    expect(await errorOf(cancelAuctionAsAdmin(admin.id, withBids.id, "  "))).toBe("400:CANCEL_REASON_REQUIRED");
    expect(await errorOf(cancelAuctionAsAdmin(admin.id, withBids.id, "Artículo falso"))).toBe("OK");

    const cancelled = await getAuction(withBids.id);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancelReason).toBe("Artículo falso");
    expect(cancelled.bidsCount).toBe(1); // se conserva el historial
  });

  it("regla 17: no se elimina una categoría con subastas", async () => {
    expect(await errorOf(deleteCategory(categoryId))).toBe("409:CATEGORY_IN_USE");
  });

  it("auth: registro, login, rotación del refresh token y detección de reuso", async () => {
    const email = `nuevo-${run}@test.com`;
    const registered = await register({ name: "Nuevo Usuario", email, password: "Password1!" });
    expect(registered.user.role).toBe("USER");
    expect(await errorOf(register({ name: "Otro", email, password: "Password1!" }))).toBe("409:EMAIL_TAKEN");
    expect(await errorOf(login({ email, password: "incorrecta" }))).toBe("401:INVALID_CREDENTIALS");

    const first = (await login({ email, password: "Password1!" })).tokens;
    const rotated = (await refresh(first.refreshToken)).tokens;
    expect(rotated.refreshToken).not.toBe(first.refreshToken);

    // Usar otra vez el token viejo: se rechaza y se cierran TODAS las sesiones.
    expect(await errorOf(refresh(first.refreshToken))).toBe("401:REFRESH_REUSED");
    expect(await errorOf(refresh(rotated.refreshToken))).toBe("401:REFRESH_REUSED");

    // Logout revoca el refresh token.
    const again = (await login({ email, password: "Password1!" })).tokens;
    await logout(again.refreshToken);
    expect(await errorOf(refresh(again.refreshToken))).toBe("401:REFRESH_REUSED");

    // Lo guardado en la base es un hash, no el token.
    const stored = await prisma.refreshToken.findMany({ where: { user: { email } } });
    expect(stored.every((t) => t.tokenHash !== again.refreshToken && t.tokenHash.length === 64)).toBe(true);
  });
});
