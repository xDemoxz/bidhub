// /api/categories
//   GET  -> lista pública de categorías
//   POST -> crear (solo administrador)
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { withErrors } from "@/server/http";
import { createCategory, listCategories } from "@/server/services/category-service";
import { categorySchema, parseBody } from "@/server/validation";

export const GET = withErrors(async () => NextResponse.json(await listCategories()));

export const POST = withErrors(async (request: NextRequest) => {
  await requireAdmin(request);
  const { name } = await parseBody(request, categorySchema);
  return NextResponse.json(await createCategory(name), { status: 201 });
});
