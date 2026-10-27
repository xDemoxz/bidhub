// Configuración de la CLI de Prisma 7 (migrate, generate, seed).
// La app en ejecución NO usa este archivo: se conecta desde src/server/db.ts.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npx prisma db seed` ejecuta este comando.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
