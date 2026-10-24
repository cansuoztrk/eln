import { describe, expect, it } from "vitest";
import { discountPercent, formatMoney, parseAmountWithCurrency, parsePriceToMinor } from "@/lib/money";
import { foldTurkish, normalizeGtin, normalizeMpn, normalizeText, slugify } from "@/lib/text";

describe("parsePriceToMinor", () => {
  it.each([
    [1299.9, 129990],
    ["1299.90", 129990],
    ["1.299,90 TL", 129990],
    ["1,299.90 TRY", 129990],
    ["1299,90", 129990],
    ["12.999", 1299900],
    ["12.99", 1299],
    ["1,299", 129900],
    ["₺ 2.450", 245000],
  ])("%s → %d", (input, expected) => {
    expect(parsePriceToMinor(input)).toBe(expected);
  });

  it("geçersiz veya negatif değerlerde null döner (uydurma fiyat üretmez)", () => {
    expect(parsePriceToMinor("")).toBeNull();
    expect(parsePriceToMinor("abc")).toBeNull();
    expect(parsePriceToMinor("-5")).toBeNull();
    expect(parsePriceToMinor(Number.NaN)).toBeNull();
    expect(parsePriceToMinor("1,2,3")).toBeNull();
  });

  it("Google Merchant 'tutar PARA' biçimi", () => {
    expect(parseAmountWithCurrency("1499.00 TRY")).toEqual({ minor: 149900, currency: "TRY" });
    expect(parseAmountWithCurrency("19.99 EUR")).toEqual({ minor: 1999, currency: "EUR" });
  });
});

describe("discountPercent", () => {
  it("standart formül: (referans − güncel) / referans × 100", () => {
    expect(discountPercent(200000, 150000)).toBe(25);
    expect(discountPercent(null, 100)).toBeNull();
    expect(discountPercent(0, 100)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("Türkçe biçim, kuruşsuz tutarda ondalık yok", () => {
    expect(formatMoney(129990)).toMatch(/1\.299,90/);
    expect(formatMoney(150000)).toMatch(/1\.500/);
    expect(formatMoney(150000)).not.toMatch(/,00/);
    expect(formatMoney(null)).toBe("—");
  });
});

describe("Türkçe normalizasyon", () => {
  it("İ/ı ve diğer harfleri katlar", () => {
    expect(foldTurkish("İĞŞÇÖÜığşçöü")).toBe("igscouigscou");
    expect(normalizeText("KULAKLIK Kablosuz Gürültü Önleyici")).toBe("kulaklik kablosuz gurultu onleyici");
    expect(slugify("Vektra V8 Oyuncu Faresi — Kablosuz/Siyah")).toBe("vektra-v8-oyuncu-faresi-kablosuz-siyah");
  });
});

describe("normalizeGtin", () => {
  it("geçerli EAN-13'ü GTIN-14'e çevirir", () => {
    expect(normalizeGtin("4006381333931")).toBe("04006381333931");
  });
  it("hatalı kontrol basamağını reddeder (yanlış eşleşme riskine karşı)", () => {
    expect(normalizeGtin("4006381333932")).toBeNull();
    expect(normalizeGtin("123")).toBeNull();
    expect(normalizeGtin("0000000000000")).toBeNull();
  });
  it("MPN boşluk/tire farklarını yok sayar", () => {
    expect(normalizeMpn("sm-s921b/ds")).toBe("SMS921BDS");
    expect(normalizeMpn("ab")).toBeNull();
  });
});
