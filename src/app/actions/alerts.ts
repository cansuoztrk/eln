"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { evaluatePriceAlerts } from "@/server/alerts/price-alerts";
import { parsePriceToMinor } from "@/lib/money";

export type AlertFormState = { ok?: boolean; error?: string; message?: string };

const createSchema = z.object({
  productId: z.string().min(5).max(40),
  variantId: z.string().max(40).optional().transform((v) => v || undefined),
  target: z.string().min(1).max(20),
  includeShipping: z.enum(["on"]).optional(),
});

export async function createPriceAlert(_prev: AlertFormState, formData: FormData): Promise<AlertFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Alarm kurmak için giriş yapmalısınız (bildirim gönderebilmemiz için)." };
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Form geçersiz." };
  const targetMinor = parsePriceToMinor(parsed.data.target, "TRY");
  if (!targetMinor || targetMinor < 100) return { error: "Geçerli bir hedef fiyat girin." };
  const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, variants: { select: { id: true } } } });
  if (!product) return { error: "Ürün bulunamadı." };
  if (parsed.data.variantId && !product.variants.some((v) => v.id === parsed.data.variantId)) return { error: "Varyant geçersiz." };
  const active = await db.priceAlert.count({ where: { userId: user.id, isActive: true } });
  if (active >= 100) return { error: "En fazla 100 aktif alarm kurabilirsiniz." };
  const existing = await db.priceAlert.findFirst({ where: { userId: user.id, productId: product.id, variantId: parsed.data.variantId ?? null } });
  if (existing) {
    await db.priceAlert.update({ where: { id: existing.id }, data: { targetMinor, includeShipping: Boolean(parsed.data.includeShipping), isActive: true, state: "ARMED" } });
  } else {
    await db.priceAlert.create({ data: { userId: user.id, productId: product.id, variantId: parsed.data.variantId ?? null, targetMinor, includeShipping: Boolean(parsed.data.includeShipping) } });
  }
  // Fiyat zaten hedefin altındaysa hemen bildirim (yalnızca taze, doğrulanmış tekliflerle)
  await evaluatePriceAlerts(db, [product.id]);
  refresh();
  return { ok: true, message: existing ? "Alarm güncellendi." : "Alarm kuruldu. Fiyat hedefinize indiğinde haber vereceğiz." };
}

const idSchema = z.string().min(5).max(40);

async function ownAlert(id: string) {
  const user = await getCurrentUser();
  if (!user || !idSchema.safeParse(id).success) return null;
  const alert = await db.priceAlert.findUnique({ where: { id } });
  return alert && alert.userId === user.id ? alert : null;
}

export async function togglePriceAlert(id: string) {
  const alert = await ownAlert(id);
  if (!alert) return { ok: false };
  await db.priceAlert.update({ where: { id }, data: { isActive: !alert.isActive, state: "ARMED" } });
  refresh();
  return { ok: true };
}

export async function deletePriceAlert(id: string) {
  const alert = await ownAlert(id);
  if (!alert) return { ok: false };
  await db.priceAlert.delete({ where: { id } });
  refresh();
  return { ok: true };
}

export async function updatePriceAlertTarget(id: string, target: string) {
  const alert = await ownAlert(id);
  if (!alert) return { ok: false, error: "Alarm bulunamadı" };
  const minor = parsePriceToMinor(target, alert.currency);
  if (!minor || minor < 100) return { ok: false, error: "Geçersiz fiyat" };
  await db.priceAlert.update({ where: { id }, data: { targetMinor: minor, state: "ARMED" } });
  await evaluatePriceAlerts(db, [alert.productId]);
  refresh();
  return { ok: true };
}
