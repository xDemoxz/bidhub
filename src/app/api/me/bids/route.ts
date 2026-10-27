// GET /api/me/bids -> ofertas de la persona autenticada (RF-6, regla 20).
// El id sale de la sesión, no de la URL: nadie puede pedir las ofertas de otro.
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors } from "@/server/http";
import { listBidsByUser } from "@/server/services/bid-service";

export const GET = withErrors(async (request: NextRequest) => {
  const session = await requireUser(request);
  return NextResponse.json(await listBidsByUser(session.userId));
});
