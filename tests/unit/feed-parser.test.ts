import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detectFeedFormat, parseCsv, parseFeed } from "@/server/integrations/retail/feed-parser";

const xml = readFileSync(new URL("../fixtures/google-merchant.xml", import.meta.url), "utf8");
const now = new Date("2026-10-20T12:00:00Z");

describe("Google Merchant XML", () => {
  const r = parseFeed(xml, { format: "auto", defaultCurrency: "TRY", now });
  it("biçimi algılar ve geçerli kayıtları normalize eder", () => {
    expect(r.format).toBe("google-merchant");
    expect(r.listings.map((l) => l.externalId)).toEqual(["SKU-100", "SKU-200"]);
    const a = r.listings[0];
    expect(a.priceMinor).toBe(119990); // sale_price
    expect(a.listPriceMinor).toBe(149990); // normal fiyat liste fiyatı olur
    expect(a.shippingMinor).toBe(0);
    expect(a.gtin).toBe("04006381333931");
    expect(a.mpn).toBe("Z5WLBK");
    expect(a.stockStatus).toBe("IN_STOCK");
    expect(a.specs.DPI).toBe("26000");
    expect(a.categoryPath).toContain("Oyuncu Faresi");
  });
  it("kargo bilgisi yoksa 'bilinmiyor' (null) bırakır, varsayım yapmaz", () => {
    expect(r.listings[1].shippingMinor).toBeNull();
    expect(r.listings[1].priceMinor).toBe(899900);
    expect(r.listings[1].stockStatus).toBe("OUT_OF_STOCK");
  });
  it("ikinci el, fiyatsız ve güvensiz bağlantılı kayıtları hata olarak raporlar", () => {
    const reasons = r.errors.map((e) => `${e.externalId}:${e.reason}`).join("\n");
    expect(reasons).toMatch(/SKU-300:.*Yeni olmayan/);
    expect(reasons).toMatch(/SKU-400:.*Fiyat çözümlenemedi/);
    expect(reasons).toMatch(/SKU-500:.*http/);
  });
  it("süresi geçmiş sale_price uygulanmaz", () => {
    const expired = xml.replace("<g:sale_price>1199.90 TRY</g:sale_price>", "<g:sale_price>1199.90 TRY</g:sale_price><g:sale_price_effective_date>2026-01-01T00:00+0300/2026-02-01T00:00+0300</g:sale_price_effective_date>");
    const p = parseFeed(expired, { format: "auto", defaultCurrency: "TRY", now });
    expect(p.listings[0].priceMinor).toBe(149990);
    expect(p.listings[0].listPriceMinor).toBeNull();
  });
});

describe("CSV / JSON / YML", () => {
  it("noktalı virgüllü CSV ve tırnaklı alanlar", () => {
    const csv = 'id;title;link;price;availability;brand\n"A-1";"Ürün ""özel"" model";https://m.test/a;"1.299,90 TL";in_stock;Marka\n';
    expect(detectFeedFormat(csv)).toBe("csv");
    expect(parseCsv(csv)[0].title).toBe('Ürün "özel" model');
    const r = parseFeed(csv, { format: "csv", defaultCurrency: "TRY" });
    expect(r.listings[0]).toMatchObject({ externalId: "A-1", priceMinor: 129990, currency: "TRY", brand: "Marka" });
  });
  it("JSON dizi", () => {
    const r = parseFeed(JSON.stringify([{ id: "J1", title: "Json ürün", link: "https://m.test/j", price: "250.00 TRY" }]), { format: "auto", defaultCurrency: "TRY" });
    expect(r.format).toBe("json");
    expect(r.listings[0].priceMinor).toBe(25000);
  });
  it("YML (Admitad) — oldprice liste fiyatı olur, kategori yolu kurulur", () => {
    const yml = `<?xml version="1.0"?><yml_catalog date="2026-10-20"><shop><categories><category id="1">Elektronik</category><category id="2" parentId="1">Kulaklık</category></categories><offers><offer id="Y1" available="true"><url>https://m.test/y1</url><price>999</price><oldprice>1299</oldprice><currencyId>TRY</currencyId><categoryId>2</categoryId><name>Kablosuz Kulaklık</name><vendor>Ses</vendor><barcode>4006381333931</barcode><param name="Renk">Beyaz</param></offer></offers></shop></yml_catalog>`;
    const r = parseFeed(yml, { format: "auto", defaultCurrency: "TRY" });
    expect(r.format).toBe("yml");
    expect(r.listings[0]).toMatchObject({ externalId: "Y1", priceMinor: 99900, listPriceMinor: 129900, categoryPath: "Elektronik > Kulaklık", stockStatus: "IN_STOCK" });
    expect(r.listings[0].attributes.color).toBe("Beyaz");
  });
  it("tanınmayan XML biçimi tek hata döner", () => {
    const r = parseFeed("<foo><bar/></foo>", { format: "auto", defaultCurrency: "TRY" });
    expect(r.listings).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
  });
});
