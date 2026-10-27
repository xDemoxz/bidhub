// Bloqueos de fila en PostgreSQL (SELECT ... FOR UPDATE).
//
// Problema que resuelven: si dos usuarios ofertan "al mismo tiempo", ambos
// podrían leer la misma oferta más alta, pasar la validación y guardar. Con el
// bloqueo, la segunda petición ESPERA a que termine la primera y entonces ve
// la oferta ya actualizada. Es el manejo de concurrencia que pide el punto extra.
//
// Solo se llaman dentro de una transacción (prisma.$transaction): el bloqueo
// se libera solo cuando la transacción termina.
import type { Prisma } from "@/generated/prisma/client";

export async function lockAuction(tx: Prisma.TransactionClient, auctionId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Auction" WHERE "id" = ${auctionId} FOR UPDATE`;
}

// Se bloquea al usuario al publicar para que dos publicaciones simultáneas no
// superen el límite de subastas activas (regla 4).
export async function lockUser(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
}
