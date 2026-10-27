// Esquemas de validación de lo que llega por HTTP (Zod).
// Validan FORMA y RANGO del dato. Las reglas que dependen del estado (por
// ejemplo "la oferta debe superar a la más alta") viven en src/server/domain.
//
// ADAPTAR: campos nuevos o límites distintos (largo de título, etc.) se
// cambian aquí.
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AUCTION_STATUSES } from "@/server/domain/auction-status";
import { badRequest } from "@/server/errors";

// Mensajes de error de Zod en español (los que no definimos a mano).
z.config(z.locales.es());

// Acepta 10, "10", "10.5" o "10.50" (máx. 2 decimales) y lo vuelve Decimal.
const money = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, "Monto inválido: usa hasta 2 decimales"))
  .transform((value) => new Prisma.Decimal(value));

// REGLA 1: precio inicial e incremento mínimo deben ser mayores a cero.
const positiveMoney = money.refine((value) => value.gt(0), "El monto debe ser mayor a cero");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
  email: z.string().trim().toLowerCase().pipe(z.email("Correo inválido")),
  // bcrypt solo considera los primeros 72 bytes de la contraseña.
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Correo inválido")),
  password: z.string().min(1, "Requerida"),
});

const auctionFields = {
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  imageUrl: z.url({ protocol: /^https?$/ }),
  categoryId: z.string().min(1),
  startingPrice: positiveMoney,
  minIncrement: positiveMoney,
};

export const createAuctionSchema = z.object({
  ...auctionFields,
  endsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});

// REGLA 5: al editar no se cambia la fecha de cierre; cualquier otro campo sí.
export const updateAuctionSchema = z
  .object(auctionFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Envía al menos un campo para editar");

export const bidSchema = z.object({ amount: positiveMoney });

export const categorySchema = z.object({ name: z.string().trim().min(2).max(50) });

// REGLA 15: el motivo de la cancelación del admin es obligatorio.
export const cancelByAdminSchema = z.object({
  reason: z.string().trim().min(3, "El motivo es obligatorio").max(500),
});

export const listAuctionsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  status: z.enum(AUCTION_STATUSES).optional(),
});

// Lee el JSON del request y lo valida. Cualquier fallo se vuelve un 400.
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest("INVALID_JSON", "El cuerpo de la petición no es un JSON válido");
  }
  return parse(schema, raw);
}

export function parse<T extends z.ZodType>(schema: T, raw: unknown): z.output<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw badRequest("VALIDATION_ERROR", "Hay datos inválidos en la petición", {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}
