// POST /api/auth/login  (RF-1)
import { NextResponse } from "next/server";
import { setAuthCookies } from "@/server/auth/cookies";
import { withErrors } from "@/server/http";
import { login } from "@/server/services/auth-service";
import { loginSchema, parseBody } from "@/server/validation";

export const POST = withErrors(async (request: Request) => {
  const input = await parseBody(request, loginSchema);
  const { user, tokens } = await login(input);

  const response = NextResponse.json({ user });
  setAuthCookies(response, tokens);
  return response;
});
