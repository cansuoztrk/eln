/**
 * Kupon uygulanabilirliği — saf fonksiyonlar.
 *
 * Kurallar:
 *  - Yalnızca VERIFIED, aktif ve geçerlilik penceresi içindeki kuponlar fiyat hesabına girer.
 *  - Üyelik, ödeme yöntemi ve cashback koşullu avantajlardır; "kupon sonrası fiyat"a dâhil edilmez,
 *    ayrıca listelenir.
 *  - Birleştirilebilirlik doğrulanmadıkça kuponlar TOPLANMAZ; en yüksek tasarruflu tek kupon seçilir.
 */

export type CouponLike = {
  id: string;
  retailerId: string;
  code: string | null;
  title: string;
  conditionType: "PUBLIC" | "MEMBERSHIP" | "PAYMENT_METHOD" | "MIN_BASKET" | "COUPON_CODE" | "CASHBACK";
  discountType: "PERCENT" | "AMOUNT" | null;
  discountValue: number | null;
  maxDiscountMinor: number | null;
  minBasketMinor: number | null;
  currency: string;
  validFrom: Date | null;
  validUntil: Date | null;
  categorySlugs: string[];
  verificationStatus: "UNVERIFIED" | "VERIFIED" | "FAILED" | "EXPIRED";
  isActive: boolean;
};

export type CouponApplication = {
  couponId: string;
  savingMinor: number;
  priceAfterMinor: number;
  conditionType: CouponLike["conditionType"];
};

export function isCouponCurrentlyValid(c: CouponLike, now: Date): boolean {
  if (!c.isActive) return false;
  if (c.validFrom && c.validFrom > now) return false;
  if (c.validUntil && c.validUntil < now) return false;
  return true;
}

export function couponSaving(c: CouponLike, priceMinor: number): number {
  if (!c.discountType || c.discountValue === null || c.discountValue <= 0) return 0;
  let saving = c.discountType === "PERCENT" ? Math.round((priceMinor * c.discountValue) / 10_000) : c.discountValue;
  if (c.maxDiscountMinor !== null) saving = Math.min(saving, c.maxDiscountMinor);
  return Math.max(0, Math.min(saving, priceMinor));
}

const PRICE_AFFECTING = new Set<CouponLike["conditionType"]>(["PUBLIC", "COUPON_CODE", "MIN_BASKET"]);

export function bestApplicableCoupon(
  offer: { retailerId: string; priceMinor: number; currency: string },
  categorySlugs: string[],
  coupons: CouponLike[],
  now: Date,
): CouponApplication | null {
  let best: CouponApplication | null = null;
  for (const c of coupons) {
    if (c.retailerId !== offer.retailerId) continue;
    if (c.verificationStatus !== "VERIFIED") continue;
    if (!PRICE_AFFECTING.has(c.conditionType)) continue;
    if (!isCouponCurrentlyValid(c, now)) continue;
    if (c.currency !== offer.currency) continue;
    if (c.categorySlugs.length > 0 && !c.categorySlugs.some((s) => categorySlugs.includes(s))) continue;
    if (c.minBasketMinor !== null && offer.priceMinor < c.minBasketMinor) continue;
    const saving = couponSaving(c, offer.priceMinor);
    if (saving <= 0) continue;
    if (!best || saving > best.savingMinor) {
      best = { couponId: c.id, savingMinor: saving, priceAfterMinor: offer.priceMinor - saving, conditionType: c.conditionType };
    }
  }
  return best;
}

export const CONDITION_LABELS: Record<CouponLike["conditionType"], string> = {
  PUBLIC: "Herkese açık indirim",
  MEMBERSHIP: "Üyelik gerektiren indirim",
  PAYMENT_METHOD: "Belirli ödeme yöntemine özel",
  MIN_BASKET: "Minimum sepet tutarına bağlı",
  COUPON_CODE: "Kupon koduyla",
  CASHBACK: "Sonradan kazanılan avantaj (cashback)",
};
