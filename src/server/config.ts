// Lectura y validación de las variables de entorno (T15).
// Si falta alguna, la app falla con un mensaje claro en vez de comportarse
// raro más tarde.
import { z } from "zod";

const envSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET debe tener al menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET debe tener al menos 32 caracteres"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
});

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

// "15m" -> 900, "7d" -> 604800. Se necesita en segundos para la cookie y el JWT.
export function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Duración inválida "${value}". Usa número + unidad (s, m, h, d), ej: 15m`);
  }
  return Number(match[1]) * UNIT_SECONDS[match[2] as keyof typeof UNIT_SECONDS];
}

let cached: ReturnType<typeof loadConfig> | undefined;

function loadConfig() {
  const env = envSchema.parse(process.env);
  return {
    accessSecret: new TextEncoder().encode(env.JWT_ACCESS_SECRET),
    refreshSecret: new TextEncoder().encode(env.JWT_REFRESH_SECRET),
    accessTtlSeconds: parseDurationToSeconds(env.ACCESS_TOKEN_EXPIRES_IN),
    refreshTtlSeconds: parseDurationToSeconds(env.REFRESH_TOKEN_EXPIRES_IN),
    isProduction: process.env.NODE_ENV === "production",
  };
}

// Se lee una sola vez (lazy) para no fallar durante el build si no hay .env.
export function getConfig() {
  cached ??= loadConfig();
  return cached;
}
