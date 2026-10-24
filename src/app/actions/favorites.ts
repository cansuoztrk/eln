"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";

const id = z.string().min(5).max(40);

export async function toggleFavorite(productId: string): Promise<{ ok: boolean; favorited?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş gerekli" };
  const parsed = id.safeParse(productId);
  if (!parsed.success) return { ok: false, error: "Geçersiz ürün" };
  const existing = await db.userFavorite.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (existing) {
    await db.userFavorite.delete({ where: { id: existing.id } });
    refresh();
    return { ok: true, favorited: false };
  }
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { ok: false, error: "Ürün bulunamadı" };
  await db.userFavorite.create({ data: { userId: user.id, productId } });
  refresh();
  return { ok: true, favorited: true };
}

/** Anonim kullanıcının tarayıcıda tuttuğu favorileri girişten sonra hesaba aktarır. */
export async function mergeLocalFavorites(productIds: string[]): Promise<{ merged: number }> {
  const user = await getCurrentUser();
  if (!user) return { merged: 0 };
  const ids = z.array(id).max(200).safeParse(productIds);
  if (!ids.success) return { merged: 0 };
  const existing = await db.product.findMany({ where: { id: { in: ids.data } }, select: { id: true } });
  const r = await db.userFavorite.createMany({ data: existing.map((p) => ({ userId: user.id, productId: p.id })), skipDuplicates: true });
  return { merged: r.count };
}
