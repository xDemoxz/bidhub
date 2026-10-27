import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Los tests prueban las reglas de negocio puras (src/server/domain), sin
// base de datos. El alias "@" replica el de tsconfig.json.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
