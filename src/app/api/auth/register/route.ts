// POST /api/auth/register  (RF-1)
// Crea la cuenta (siempre con rol USER) e inicia sesión con cookies httpOnly.
import { NextResponse } from "next/server";
import { setAuthCookies } from "@/server/auth/cookies";
import { withErrors } from "@/server/http";
import { register } from "@/server/services/auth-service";
import { parseBody, registerSchema } from "@/server/validation";

export const POST = withErrors(async (request: Request) => {
  const input = await parseBody(request, registerSchema);
  const { user, tokens } = await register(input);

  // Los tokens van SOLO en cookies; el body trae únicamente los datos del usuario.
  const response = NextResponse.json({ user }, { status: 201 });
  setAuthCookies(response, tokens);
  return response;
});
