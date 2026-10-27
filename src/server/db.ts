// Cliente único de Prisma para toda la app.
// Prisma 7 se conecta mediante un "driver adapter": aquí usamos el de pg.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// En desarrollo, Next recarga los módulos y crearía un cliente nuevo en cada
// cambio (agotando conexiones). Guardarlo en globalThis evita ese problema.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
