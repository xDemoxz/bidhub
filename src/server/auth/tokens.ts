// Creación y verificación de los dos JWT (T9):
//   - access token:  corto (15m), identifica al usuario y su rol en cada petición.
//   - refresh token: largo (7d), solo sirve para pedir un access token nuevo.
// Cada uno se firma con un secreto distinto.
import { createHash, randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { getConfig } from "@/server/config";
import type { Role } from "@/lib/types";

export type AccessPayload = { sub: string; role: Role };

export async function signAccessToken(payload: AccessPayload): Promise<string> {
  const config = getConfig();
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTtlSeconds}s`)
    .sign(config.accessSecret);
}

// El jti (id único) hace que cada refresh token sea distinto aunque se emitan
// en el mismo segundo para el mismo usuario.
export async function signRefreshToken(userId: string): Promise<string> {
  const config = getConfig();
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${config.refreshTtlSeconds}s`)
    .sign(config.refreshSecret);
}

// Devuelve el payload o null si el token es inválido o expiró.
export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getConfig().accessSecret, { algorithms: ["HS256"] });
    const role = payload.role;
    if (!payload.sub || (role !== "USER" && role !== "ADMIN")) return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getConfig().refreshSecret, { algorithms: ["HS256"] });
    return payload.sub ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}

// El refresh token se guarda hasheado en la base de datos: si alguien lee la
// tabla, no puede usar los tokens. SHA-256 basta porque el token ya es un
// valor aleatorio largo (no es una contraseña elegida por una persona).
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
