import { describe, expect, it } from "vitest";
import { attributeConflicts, extractAttributes, modelTokens, variantKey, variantLabel } from "@/server/matching/attributes";
import { classifyPure } from "@/server/matching/classify";
import { familyKey, familyTitle, scoreCandidate } from "@/server/matching/similarity";

describe("varyant nitelikleri", () => {
  it("renk, bağlantı ve kapasiteyi çıkarır", () => {
    const a = extractAttributes("Lumo N9 Akıllı Telefon 256GB Siyah");
    expect(a).toMatchObject({ color: "siyah", capacity: "256gb" });
    expect(extractAttributes("Vektra V8 Kablosuz Oyuncu Faresi").connectivity).toBe("kablosuz");
    expect(extractAttributes("Gaming Mouse Wireless White")).toMatchObject({ connectivity: "kablosuz", color: "beyaz" });
    expect(variantKey({ color: "siyah", connectivity: "kablosuz" })).toBe("connectivity=kablosuz|color=siyah");
    expect(variantLabel({ color: "gumus", capacity: "1tb" })).toBe("1TB · Gümüş");
  });
  it("çelişen nitelikler", () => {
    expect(attributeConflicts({ connectivity: "kablosuz" }, { connectivity: "kablolu" })).toEqual(["connectivity"]);
    expect(attributeConflicts({ color: "siyah" }, {})).toEqual([]);
  });
});

describe("model kodu ve aile başlığı", () => {
  it("ölçü birimlerini model kodu saymaz", () => {
    expect(modelTokens("Vektra V8 Oyuncu Faresi 26000 DPI 2.4GHz")).toEqual(["v8"]);
    expect(modelTokens("Samsung SM-S921B 256GB")).toContain("sms921b");
  });
  it("Türkçe renk ve varyant sözcüklerini çıkarır, teknik ifadeleri korur", () => {
    expect(familyTitle("Sonora Buds ANC Kablosuz Kulak İçi Kulaklık Gümüş")).toBe("Sonora Buds ANC Kulak İçi Kulaklık");
    expect(familyTitle("Depo NV4 NVMe SSD 1 TB")).toBe("Depo NV4 NVMe SSD");
    expect(familyTitle("Vektra TKL Mekanik Klavye Kırmızı Switch")).toContain("Kırmızı Switch");
    expect(familyKey("Lumo N9 256GB Siyah")).toBe(familyKey("Lumo N9 512 GB Mavi"));
  });
});

describe("scoreCandidate", () => {
  it("farklı dildeki aynı model orta-yüksek güven alır (incelemeye düşer)", () => {
    const s = scoreCandidate({ title: "VEKTRA V-8 Gaming Mouse Wireless Black", brand: "VEKTRA" }, { title: "Vektra V8 Oyuncu Faresi 26000 DPI", brand: "Vektra" });
    expect(s.signals.brandMatch).toBe(true);
    expect(s.signals.sharedModelTokens).toEqual(["v8"]);
    expect(s.confidence).toBeGreaterThan(0.5);
  });
  it("model kodu çelişkisi güveni düşürür", () => {
    const s = scoreCandidate({ title: "Kalyon X60 Ekran Kartı", brand: "Kalyon" }, { title: "Kalyon X70 Ekran Kartı", brand: "Kalyon" });
    expect(s.signals.conflictingModelTokens).toBe(true);
    expect(s.confidence).toBeLessThan(0.5);
  });
  it("farklı marka sert ceza alır", () => {
    const s = scoreCandidate({ title: "Nordik Glide Mouse", brand: "Nordik" }, { title: "Vektra Glide Mouse", brand: "Vektra" });
    expect(s.confidence).toBeLessThan(0.3);
  });
});

describe("classifyPure", () => {
  const cats = [
    { id: "p", slug: "teknoloji", keywords: [], parentId: null },
    { id: "m", slug: "oyuncu-fareleri", keywords: ["mouse", "fare"], parentId: "p" },
    { id: "k", slug: "oyuncu-klavyeleri", keywords: ["klavye"], parentId: "p" },
    { id: "x", slug: "diger-firsatlar", keywords: [], parentId: "p" },
  ];
  it("eşleme > slug > anahtar kelime > yedek", () => {
    expect(classifyPure({ categoryPath: "Bilgisayar > Klavyeler", title: "abc", sourceKey: "s" }, cats, [{ pattern: "klavyeler", categoryId: "k", dataSourceKey: null, priority: 1 }]).categoryId).toBe("k");
    expect(classifyPure({ categoryPath: "test > oyuncu-fareleri", title: "x", sourceKey: "s" }, cats, []).categoryId).toBe("m");
    expect(classifyPure({ categoryPath: null, title: "Kablosuz Mouse", sourceKey: "s" }, cats, []).categoryId).toBe("m");
    expect(classifyPure({ categoryPath: null, title: "Tanımsız ürün", sourceKey: "s" }, cats, []).categoryId).toBe("x");
  });
  it("üst kategoriye atama yapmaz", () => {
    expect(classifyPure({ categoryPath: "teknoloji", title: "x", sourceKey: "s" }, cats, []).categoryId).toBe("x");
  });
});
