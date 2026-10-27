// Casos de uso de autenticación (RF-1, T9).
//
// Flujo de tokens:
//   login/registro -> se crean un access token (15m) y un refresh token (7d).
//                     El refresh se guarda HASHEADO en la tabla RefreshToken.
//   access vencido -> el cliente llama a refresh: se valida el refresh token,
//                     se REVOCA y se emite un par nuevo ("rotación").
//   logout         -> se revoca el refresh token en la base de datos.
//   token ya usado -> si alguien presenta un refresh token YA revocado, se
//                     asume robo y se revocan todas las sesiones del usuario.
import type { SessionUser } from "@/lib/types";
import { getConfig } from "@/server/config";
import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/server/auth/tokens";
import { conflict, unauthorized } from "@/server/errors";

export type AuthResult = {
  user: SessionUser;
  tokens: { accessToken: string; refreshToken: string };
};

type UserRecord = { id: string; name: string; email: string; role: "USER" | "ADMIN" };

const toSessionUser = (user: UserRecord): SessionUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

async function issueTokens(user: UserRecord) {
  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + getConfig().refreshTtlSeconds * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict("EMAIL_TAKEN", "Ya existe una cuenta con ese correo");

  // El rol NO viene del cliente: el registro público siempre crea un USER.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: "USER",
    },
  });

  return { user: toSessionUser(user), tokens: await issueTokens(user) };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Mismo mensaje si el correo no existe o la contraseña falla: no se revela
  // cuál de los dos es incorrecto.
  const valid = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !valid) throw unauthorized("Correo o contraseña incorrectos", "INVALID_CREDENTIALS");

  return { user: toSessionUser(user), tokens: await issueTokens(user) };
}

// Renueva la sesión sin pedir login: valida y rota el refresh token.
export async function refresh(refreshToken: string | undefined): Promise<AuthResult> {
  if (!refreshToken) throw unauthorized("Sesión expirada", "REFRESH_REQUIRED");

  const claims = await verifyRefreshToken(refreshToken);
  if (!claims) throw unauthorized("Sesión expirada", "REFRESH_INVALID");

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });
  if (!stored || stored.userId !== claims.sub) {
    throw unauthorized("Sesión expirada", "REFRESH_INVALID");
  }

  if (stored.revokedAt) {
    // Token ya usado o cerrado: posible robo. Se cierran todas las sesiones.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized("Sesión inválida, inicia sesión de nuevo", "REFRESH_REUSED");
  }

  if (stored.expiresAt <= new Date()) throw unauthorized("Sesión expirada", "REFRESH_EXPIRED");

  // Revocar con condición: si dos peticiones llegan a la vez, solo una gana.
  const revoked = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (revoked.count === 0) throw unauthorized("Sesión expirada", "REFRESH_INVALID");

  return { user: toSessionUser(stored.user), tokens: await issueTokens(stored.user) };
}

// Es idempotente: cerrar sesión sin token o con un token ya revocado no falla.
export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized("La cuenta ya no existe", "USER_NOT_FOUND");
  return toSessionUser(user);
}
