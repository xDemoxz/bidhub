// /api/categories/[id]  (solo administrador)
//   PATCH  -> renombrar
//   DELETE -> eliminar (regla 17: 409 si tiene subastas asociadas)
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { withErrors, type IdContext } from "@/server/http";
import { deleteCategory, updateCategory } from "@/server/services/category-service";
import { categorySchema, parseBody } from "@/server/validation";

export const PATCH = withErrors(async (request: NextRequest, { params }: IdContext) => {
  await requireAdmin(request);
  const { id } = await params;
  const { name } = await parseBody(request, categorySchema);
  return NextResponse.json(await updateCategory(id, name));
});

export const DELETE = withErrors(async (request: NextRequest, { params }: IdContext) => {
  await requireAdmin(request);
  const { id } = await params;
  await deleteCategory(id);
  return new NextResponse(null, { status: 204 });
});
