// Casos de uso de categorías (RF-7). Reglas: 3 y 17.
import type { CategoryDto } from "@/lib/types";
import { prisma } from "@/server/db";
import { conflict, notFound } from "@/server/errors";

export async function listCategories(): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { auctions: true } } },
  });
  return categories.map((c) => ({ id: c.id, name: c.name, auctionsCount: c._count.auctions }));
}

export async function createCategory(name: string): Promise<CategoryDto> {
  await assertNameAvailable(name);
  const category = await prisma.category.create({ data: { name } });
  return { id: category.id, name: category.name, auctionsCount: 0 };
}

export async function updateCategory(id: string, name: string): Promise<CategoryDto> {
  await getCategoryOrThrow(id);
  await assertNameAvailable(name, id);
  const category = await prisma.category.update({ where: { id }, data: { name } });
  return { id: category.id, name: category.name };
}

// REGLA 17: una categoría con subastas asociadas no se puede eliminar.
export async function deleteCategory(id: string): Promise<void> {
  await getCategoryOrThrow(id);
  const auctionsCount = await prisma.auction.count({ where: { categoryId: id } });
  if (auctionsCount > 0) {
    throw conflict("CATEGORY_IN_USE", "No se puede eliminar una categoría con subastas asociadas", {
      auctionsCount,
    });
  }
  await prisma.category.delete({ where: { id } });
}

async function getCategoryOrThrow(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw notFound("CATEGORY_NOT_FOUND", "La categoría no existe");
  return category;
}

async function assertNameAvailable(name: string, exceptId?: string): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing && existing.id !== exceptId) {
    throw conflict("CATEGORY_EXISTS", "Ya existe una categoría con ese nombre");
  }
}
