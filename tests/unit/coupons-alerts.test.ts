import { describe, expect, it } from "vitest";
import { decideAlert } from "@/server/alerts/price-alerts";
import { bestApplicableCoupon, type CouponLike } from "@/server/pricing/coupons";

const now = new Date("2026-10-20T12:00:00Z");
const base: CouponLike = {
  id: "c1",
  retailerId: "r1",
  code: "X",
  title: "t",
  conditionType: "COUPON_CODE",
  discountType: "PERCENT",
  discountValue: 1000,
  maxDiscountMinor: null,
  minBasketMinor: null,
  currency: "TRY",
  validFrom: null,
  validUntil: new Date(now.getTime() + 86400000),
  categorySlugs: [],
  verificationStatus: "VERIFIED",
  isActive: true,
};
const offer = { retailerId: "r1", priceMinor: 100000, currency: "TRY" };

describe("bestApplicableCoupon", () => {
  it("yalnızca doğrulanmış ve geçerli kupon uygulanır", () => {
    expect(bestApplicableCoupon(offer, [], [base], now)?.savingMinor).toBe(10000);
    expect(bestApplicableCoupon(offer, [], [{ ...base, verificationStatus: "UNVERIFIED" }], now)).toBeNull();
    expect(bestApplicableCoupon(offer, [], [{ ...base, validUntil: new Date(now.getTime() - 1) }], now)).toBeNull();
  });
  it("koşullu avantajlar (üyelik/ödeme/cashback) fiyattan düşülmez", () => {
    for (const t of ["MEMBERSHIP", "PAYMENT_METHOD", "CASHBACK"] as const) expect(bestApplicableCoupon(offer, [], [{ ...base, conditionType: t }], now)).toBeNull();
  });
  it("minimum sepet, kategori ve tavan uygulanır; kuponlar toplanmaz", () => {
    expect(bestApplicableCoupon(offer, [], [{ ...base, minBasketMinor: 200000 }], now)).toBeNull();
    expect(bestApplicableCoupon(offer, ["kitaplar"], [{ ...base, categorySlugs: ["teknoloji"] }], now)).toBeNull();
    expect(bestApplicableCoupon(offer, [], [{ ...base, maxDiscountMinor: 5000 }], now)?.savingMinor).toBe(5000);
    const two = bestApplicableCoupon(offer, [], [base, { ...base, id: "c2", discountType: "AMOUNT", discountValue: 15000 }], now);
    expect(two).toMatchObject({ couponId: "c2", savingMinor: 15000 });
  });
});

describe("decideAlert", () => {
  const armed = { state: "ARMED" as const, targetMinor: 200000, lastTriggeredAt: null, lastTriggeredMinor: null };
  it("hedefe inince tetikler, güncel teklif yoksa tetiklemez", () => {
    expect(decideAlert(armed, 199000, now).action).toBe("TRIGGER");
    expect(decideAlert(armed, 210000, now).action).toBe("NONE");
    expect(decideAlert(armed, null, now).action).toBe("NONE");
  });
  it("aynı düşüş için tekrar bildirim yok; histerezisle yeniden kurulur", () => {
    const triggered = { state: "TRIGGERED" as const, targetMinor: 200000, lastTriggeredAt: new Date(now.getTime() - 3600_000), lastTriggeredMinor: 195000 };
    expect(decideAlert(triggered, 194000, now).action).toBe("NONE");
    expect(decideAlert(triggered, 203000, now).action).toBe("NONE"); // %2 eşiğin içinde
    expect(decideAlert(triggered, 205000, now).action).toBe("REARM");
  });
  it("bekleme süresi dolduktan sonra belirgin ek düşüşte yeniden bildirir", () => {
    const old = { state: "TRIGGERED" as const, targetMinor: 200000, lastTriggeredAt: new Date(now.getTime() - 13 * 3600_000), lastTriggeredMinor: 195000 };
    expect(decideAlert(old, 180000, now).action).toBe("TRIGGER");
    const recent = { ...old, lastTriggeredAt: new Date(now.getTime() - 3600_000) };
    expect(decideAlert(recent, 180000, now).action).toBe("NONE");
  });
});
