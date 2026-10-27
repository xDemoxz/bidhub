// /api/auctions/[id]/bids
//   GET  -> historial público de ofertas, con alias parcial del postor (regla 18)
//   POST -> crear una oferta (RF-5, reglas 6 a 11)
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors, type IdContext } from "@/server/http";
import { listBidsOfAuction, placeBid } from "@/server/services/bid-service";
import { bidSchema, parseBody } from "@/server/validation";

export const GET = withErrors(async (_request: NextRequest, { params }: IdContext) => {
  const { id } = await params;
  return NextResponse.json(await listBidsOfAuction(id));
});

export const POST = withErrors(async (request: NextRequest, { params }: IdContext) => {
  const session = await requireUser(request);
  const { id } = await params;
  const { amount } = await parseBody(request, bidSchema);
  const placed = await placeBid(session.userId, id, amount);
  return NextResponse.json(placed, { status: 201 });
});
