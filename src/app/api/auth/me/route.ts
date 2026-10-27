// GET /api/auth/me -> datos de la sesión actual (401 si no hay sesión).
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors } from "@/server/http";
import { getUserById } from "@/server/services/auth-service";

export const GET = withErrors(async (request: NextRequest) => {
  const session = await requireUser(request);
  return NextResponse.json({ user: await getUserById(session.userId) });
});
