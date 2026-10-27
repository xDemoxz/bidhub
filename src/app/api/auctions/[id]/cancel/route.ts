// POST /api/auctions/[id]/cancel
// El vendedor cancela su propia subasta (reglas 14 y 19). No se borra: queda CANCELLED.
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors, type IdContext } from "@/server/http";
import { cancelAuctionAsSeller } from "@/server/services/auction-service";

export const POST = withErrors(async (request: NextRequest, { params }: IdContext) => {
  const session = await requireUser(request);
  const { id } = await params;
  return NextResponse.json(await cancelAuctionAsSeller(session.userId, id));
});
