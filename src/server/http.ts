// Utilidades comunes de los route handlers: respuesta de error uniforme (T7).
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { AppError, type ErrorDetails } from "@/server/errors";

export function errorBody(code: string, message: string, details?: ErrorDetails) {
  return { error: { code, message, ...(details ? { details } : {}) } };
}

// Convierte CUALQUIER error en la respuesta JSON con el formato estándar.
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(errorBody(error.code, error.message, error.details), {
      status: error.status,
    });
  }

  // Red de seguridad: el servicio ya valida estos casos, pero si la base de
  // datos los rechaza igual (por una carrera), respondemos con el código justo.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(errorBody("ALREADY_EXISTS", "El recurso ya existe"), { status: 409 });
    }
    if (error.code === "P2025") {
      return NextResponse.json(errorBody("NOT_FOUND", "El recurso no existe"), { status: 404 });
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        errorBody("RELATION_CONFLICT", "La operación viola una relación con otros datos"),
        { status: 409 },
      );
    }
  }

  console.error("Error no controlado:", error);
  return NextResponse.json(errorBody("INTERNAL_ERROR", "Error interno del servidor"), {
    status: 500,
  });
}

// Envuelve un handler para que cualquier excepción salga con el formato
// estándar. Así los handlers solo se preocupan del caso feliz.
export function withErrors<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// Contexto de las rutas dinámicas /api/.../[id]. En Next 16 los params son
// una Promise y hay que esperarlos.
export type IdContext = { params: Promise<{ id: string }> };
