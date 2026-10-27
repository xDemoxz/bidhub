// POST /api/auth/logout
// Revoca el refresh token en la base de datos y borra las cookies.
import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, REFRESH_COOKIE } from "@/server/auth/cookies";
import { withErrors } from "@/server/http";
import { logout } from "@/server/services/auth-service";

export const POST = withErrors(async (request: NextRequest) => {
  await logout(request.cookies.get(REFRESH_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
});
