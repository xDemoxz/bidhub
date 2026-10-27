// /api/auctions
//   GET  -> catálogo público, con filtros ?category=<id>&status=ACTIVE|CLOSED|DESERTED|CANCELLED (RF-2)
//   POST -> publicar una subasta (RF-4, usuario autenticado)
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { withErrors } from "@/server/http";
import { createAuction, listAuctions } from "@/server/services/auction-service";
import { createAuctionSchema, listAuctionsQuerySchema, parse, parseBody } from "@/server/validation";

export const GET = withErrors(async (request: NextRequest) => {
  // Los parámetros vacíos (?status=) se ignoran en vez de dar error.
  const params = Object.fromEntries(
    [...request.nextUrl.searchParams.entries()].filter(([, value]) => value !== ""),
  );
  const query = parse(listAuctionsQuerySchema, params);
  const auctions = await listAuctions({ categoryId: query.category, status: query.status });
  return NextResponse.json(auctions);
});

export const POST = withErrors(async (request: NextRequest) => {
  const session = await requireUser(request);
  const input = await parseBody(request, createAuctionSchema);
  const auction = await createAuction(session.userId, input);
  return NextResponse.json(auction, { status: 201 });
});
