/**
 * Fiyat alarmı değerlendirmesi.
 *
 * Kurallar:
 *  - Yalnızca TAZE ve AKTİF, şüpheli işaretlenmemiş, stokta olan tekliflerle değerlendirilir.
 *    Veri yenilenmemişse alarm tetiklenmez (eski fiyatla yanlış bildirim gönderilmez).
 *  - ARMED → hedefin altına inince bildirim + TRIGGERED.
 *  - TRIGGERED iken aynı düşüş için tekrar bildirim YOK. Fiyat hedefin %2 üzerine çıkarsa sessizce
 *    yeniden ARMED olur (histerezis). Son bildirimden sonra fiyat %5 daha düşerse ve bekleme süresi
 *    dolduysa yeni bir bildirim gönderilir.
 *  - Bildirim anahtarı `price-alert:<id>:<sayaç>` benzersizdir; görev tekrar çalışsa bile çift
 *    bildirim oluşmaz.
 */

import { formatMoney } from "@/lib/money";
import { HOUR } from "@/lib/time";
import type { Db } from "../db";
import { createNotification } from "../notifications/service";

export const ALERT_REARM_FACTOR = 1.02;
export const ALERT_FURTHER_DROP_FACTOR = 0.95;
export const ALERT_COOLDOWN_MS = 12 * HOUR;

export type AlertDecision = { action: "TRIGGER" | "REARM" | "NONE"; reason: string };

/** Saf karar fonksiyonu (birim testli). */
export function decideAlert(
  alert: { state: "ARMED" | "TRIGGERED"; targetMinor: number; lastTriggeredAt: Date | null; lastTriggeredMinor: number | null },
  bestMinor: number | null,
  now: Date,
): AlertDecision {
  if (bestMinor === null) return { action: "NONE", reason: "Güncel ve doğrulanmış teklif yok" };
  const cooledDown = !alert.lastTriggeredAt || now.getTime() - alert.lastTriggeredAt.getTime() >= ALERT_COOLDOWN_MS;
  if (alert.state === "ARMED") {
    if (bestMinor <= alert.targetMinor && cooledDown) return { action: "TRIGGER", reason: "Hedef fiyata ulaşıldı" };
    return { action: "NONE", reason: bestMinor <= alert.targetMinor ? "Bekleme süresi dolmadı" : "Hedefin üzerinde" };
  }
  if (bestMinor > alert.targetMinor * ALERT_REARM_FACTOR) return { action: "REARM", reason: "Fiyat hedefin üzerine çıktı" };
  if (alert.lastTriggeredMinor !== null && bestMinor <= alert.lastTriggeredMinor * ALERT_FURTHER_DROP_FACTOR && cooledDown) {
    return { action: "TRIGGER", reason: "Son bildirimden sonra belirgin ek düşüş" };
  }
  return { action: "NONE", reason: "Zaten bildirildi" };
}

export async function evaluatePriceAlerts(db: Db, productIds: string[] | "all", now = new Date()): Promise<{ evaluated: number; triggered: number }> {
  const where = productIds === "all" ? { isActive: true } : { isActive: true, productId: { in: productIds } };
  if (productIds !== "all" && productIds.length === 0) return { evaluated: 0, triggered: 0 };
  const alerts = await db.priceAlert.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, emailAlertsEnabled: true } },
      product: {
        select: {
          slug: true,
          title: true,
          offers: {
            where: { status: "ACTIVE", flaggedSuspicious: false, disabledByAdmin: false, stockStatus: { not: "OUT_OF_STOCK" } },
            select: { id: true, variantId: true, retailerId: true, priceMinor: true, totalMinor: true, currency: true, retailer: { select: { name: true } } },
          },
        },
      },
    },
  });

  let triggered = 0;
  for (const alert of alerts) {
    const candidates = alert.product.offers
      .filter((o) => o.currency === alert.currency)
      .filter((o) => !alert.variantId || o.variantId === alert.variantId)
      .filter((o) => alert.retailerIds.length === 0 || alert.retailerIds.includes(o.retailerId))
      .map((o) => ({ offer: o, price: alert.includeShipping ? (o.totalMinor ?? o.priceMinor) : o.priceMinor, shippingUnknown: alert.includeShipping && o.totalMinor === null }))
      .sort((a, b) => a.price - b.price);
    const best = candidates[0] ?? null;
    const decision = decideAlert(alert, best?.price ?? null, now);

    if (decision.action === "TRIGGER" && best) {
      const count = alert.triggerCount + 1;
      const priceText = formatMoney(best.price, alert.currency);
      const created = await db.$transaction(async (tx) => {
        const updated = await tx.priceAlert.updateMany({
          where: { id: alert.id, triggerCount: alert.triggerCount }, // iyimser kilit: eşzamanlı çift tetiklemeyi önler
          data: { state: "TRIGGERED", triggerCount: count, lastTriggeredAt: now, lastTriggeredMinor: best.price, lastEvaluatedAt: now },
        });
        if (updated.count === 0) return false;
        return createNotification(tx, {
          userId: alert.userId,
          type: "PRICE_ALERT",
          title: `${alert.product.title} hedef fiyatınıza indi`,
          body: `${best.offer.retailer.name} mağazasında ${priceText}${best.shippingUnknown ? " (kargo bedeli bilinmiyor, kargo hariç)" : alert.includeShipping ? " (kargo dâhil)" : ""}. Hedefiniz: ${formatMoney(alert.targetMinor, alert.currency)}. Fiyat ${new Date(now).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} itibarıyla doğrulandı; mağazada değişmiş olabilir.`,
          link: `/urun/${alert.product.slug}`,
          data: { alertId: alert.id, offerId: best.offer.id, priceMinor: best.price },
          dedupeKey: `price-alert:${alert.id}:${count}`,
          email: alert.user.emailAlertsEnabled ? { to: alert.user.email, subject: `Fiyat alarmı: ${alert.product.title} ${priceText}` } : null,
        });
      });
      if (created) triggered++;
    } else if (decision.action === "REARM") {
      await db.priceAlert.update({ where: { id: alert.id }, data: { state: "ARMED", lastEvaluatedAt: now } });
    } else {
      await db.priceAlert.update({ where: { id: alert.id }, data: { lastEvaluatedAt: now } });
    }
  }
  return { evaluated: alerts.length, triggered };
}
