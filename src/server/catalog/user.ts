import "server-only";
import { db } from "../db";

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const rows = await db.userFavorite.findMany({ where: { userId }, select: { productId: true } });
  return rows.map((r) => r.productId);
}
