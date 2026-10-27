// Contraseñas: nunca se guardan en claro, solo el hash de bcrypt (T9).
// Se usa bcryptjs (JavaScript puro) para no depender de módulos nativos que
// complican Docker y Vercel.
import bcrypt from "bcryptjs";

const COST = 10;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, COST);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
