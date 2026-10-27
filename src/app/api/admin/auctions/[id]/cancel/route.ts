// POST /api/admin/auctions/[id]/cancel  (moderación, solo administrador)
// Cancela cualquier subasta activa, incluso con ofertas. Motivo obligatorio (regla 15).
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { withErrors, type IdContext } from "@/server/http";
import { cancelAuctionAsAdmin } from "@/server/services/auction-service";
import { cancelByAdminSchema, parseBody } from "@/server/validation";

export const POST = withErrors(async (request: NextRequest, { params }: IdContext) => {
  const session = await requireAdmin(request);
  const { id } = await params;
  const { reason } = await parseBody(request, cancelByAdminSchema);
  return NextResponse.json(await cancelAuctionAsAdmin(session.userId, id, reason));
});
