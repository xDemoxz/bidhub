// /api/auctions/[id]
//   GET   -> detalle público de la subasta (RF-3)
//   PATCH -> editar (solo el vendedor, sin ofertas y activa: reglas 5 y 19)
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors, type IdContext } from "@/server/http";
import { getAuction, updateAuction } from "@/server/services/auction-service";
import { parseBody, updateAuctionSchema } from "@/server/validation";

export const GET = withErrors(async (_request: NextRequest, { params }: IdContext) => {
  const { id } = await params;
  return NextResponse.json(await getAuction(id));
});

export const PATCH = withErrors(async (request: NextRequest, { params }: IdContext) => {
  const session = await requireUser(request);
  const { id } = await params;
  const input = await parseBody(request, updateAuctionSchema);
  return NextResponse.json(await updateAuction(session.userId, id, input));
});
