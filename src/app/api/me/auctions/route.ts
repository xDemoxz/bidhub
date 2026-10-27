// GET /api/me/auctions -> subastas publicadas por la persona autenticada (RF-6).
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors } from "@/server/http";
import { listAuctionsBySeller } from "@/server/services/auction-service";

export const GET = withErrors(async (request: NextRequest) => {
  const session = await requireUser(request);
  return NextResponse.json(await listAuctionsBySeller(session.userId));
});
