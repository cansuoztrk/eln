import { describe, expect, it } from "vitest";
import { isoDurationMinutes, mapDuffelOffer } from "@/server/integrations/flights/duffel";
import { mapTpTicket } from "@/server/integrations/flights/travelpayouts";
import { createHttpClient } from "@/server/integrations/http";
import { mapAmazonItem } from "@/server/integrations/retail/amazon-creators";
import { IntegrationError, type AdapterContext } from "@/server/integrations/types";
import { buildOutboundUrl } from "@/server/outbound";
import { parseNaturalQuery } from "@/server/catalog/nl-query";

describe("Amazon Creators API eşlemesi", () => {
  it("OffersV2 fiyatı, liste fiyatı ve stok; kargo bilinmiyor", () => {
    const r = mapAmazonItem({
      asin: "B0TEST1234",
      detailPageURL: "https://www.amazon.com.tr/dp/B0TEST1234?tag=ornek-21",
      itemInfo: { title: { displayValue: "Ürün" }, byLineInfo: { brand: { displayValue: "Marka" } }, externalIds: { eans: { displayValues: ["4006381333931"] } } },
      offersV2: { listings: [{ isBuyBoxWinner: true, price: { money: { amount: 1299.9, currency: "TRY" }, savingBasis: { money: { amount: 1599.9, currency: "TRY" } } }, availability: { type: "IN_STOCK" }, condition: { value: "New" } }] },
    });
    expect(r.listing).toMatchObject({ externalId: "B0TEST1234", priceMinor: 129990, listPriceMinor: 159990, shippingMinor: null, stockStatus: "IN_STOCK", gtin: "04006381333931" });
  });
  it("teklifsiz ürün hata olarak döner (fiyat uydurulmaz)", () => {
    expect(mapAmazonItem({ asin: "B0X", detailPageURL: "https://a" }).error?.reason).toMatch(/Teklif/);
  });
});

const ctx = { source: { config: {} }, secret: (n?: string) => (n === "TRAVELPAYOUTS_MARKER" ? "12345" : undefined), now: new Date("2026-10-20T12:00:00Z") } as unknown as AdapterContext;

describe("uçuş adaptörleri", () => {
  it("Travelpayouts önbellek fiyatı gösterge fiyattır; vergi/bagaj bilinmiyor", () => {
    const o = mapTpTicket(ctx, { origin: "IST", destination: "AYT", price: 1850, airline: "PC", flight_number: 2014, departure_at: "2026-11-12T08:15:00+03:00", transfers: 0, duration: 85, link: "/search/IST1211AYT1?t=x" }, { currency: "try", oneWay: true, passengers: 1 })!;
    expect(o).toMatchObject({ priceMinor: 185000, currency: "TRY", priceKind: "CACHED_INDICATIVE", priceIncludesTaxes: null, baggageIncluded: null, stops: 0, isAffiliateLink: true });
    expect(o.deepLink).toMatch(/^https:\/\/www\.aviasales\.com\/search\/.*marker=12345/);
  });
  it("Duffel canlı teklifi: vergi dâhil, bagaj ve süre", () => {
    expect(isoDurationMinutes("PT2H35M")).toBe(155);
    expect(isoDurationMinutes("P1DT1H")).toBe(1500);
    const o = mapDuffelOffer(
      {
        id: "off_1",
        total_amount: "2450.00",
        total_currency: "TRY",
        owner: { iata_code: "TK" },
        slices: [{ origin: { iata_code: "IST" }, destination: { iata_code: "AYT" }, duration: "PT1H25M", segments: [{ departing_at: "2026-11-12T08:15:00", arriving_at: "2026-11-12T09:40:00", marketing_carrier: { iata_code: "TK" }, marketing_carrier_flight_number: "2410", passengers: [{ baggages: [{ type: "checked", quantity: 1 }, { type: "carry_on", quantity: 1 }] }] }] }],
      },
      { origin: "IST", destination: "AYT", departDate: "2026-11-12", returnDate: null, adults: 1, cabin: "ECONOMY", directOnly: false, flexDays: 0 },
      new Date(),
    )!;
    expect(o).toMatchObject({ priceMinor: 245000, priceKind: "LIVE_QUOTE", priceIncludesTaxes: true, baggageIncluded: true, stops: 0, deepLink: null, flightNumber: "TK2410" });
  });
});

describe("HTTP istemcisi", () => {
  it("429'da Retry-After'a uyup tekrar dener", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return calls === 1 ? new Response("", { status: 429, headers: { "retry-after": "0" } }) : new Response('{"ok":true}', { status: 200 });
    }) as typeof fetch;
    const usage = { requests: 0, errors: 0, rateLimited: 0 };
    const http = createHttpClient({ key: "t1", rateLimitPerMinute: 600, usage, fetchImpl });
    expect(await http.json("https://api.test/x")).toEqual({ ok: true });
    expect(usage).toMatchObject({ requests: 2, rateLimited: 1 });
  });
  it("401 yeniden denenmez ve AUTH hatası verir", async () => {
    const fetchImpl = (async () => new Response("", { status: 401 })) as typeof fetch;
    const http = createHttpClient({ key: "t2", rateLimitPerMinute: 600, usage: { requests: 0, errors: 0, rateLimited: 0 }, fetchImpl });
    await expect(http.json("https://api.test/x")).rejects.toMatchObject({ code: "AUTH", retryable: false });
    await expect(http.json("https://api.test/x")).rejects.toBeInstanceOf(IntegrationError);
  });
  it("yanıt boyutu sınırı", async () => {
    const fetchImpl = (async () => new Response("x".repeat(2048))) as typeof fetch;
    const http = createHttpClient({ key: "t3", rateLimitPerMinute: 600, usage: { requests: 0, errors: 0, rateLimited: 0 }, fetchImpl });
    await expect(http.text("https://api.test/x", { maxBytes: 1024 })).rejects.toMatchObject({ code: "FORMAT" });
  });
});

describe("dışa yönlendirme", () => {
  it("satış ortaklığı yalnızca etkinse ve parametre yoksa eklenir", () => {
    const cfg = { type: "query", param: "aff", value: "fr" };
    expect(buildOutboundUrl("https://m.test/p", { affiliateEnabled: false, affiliateConfig: cfg })).toEqual({ url: "https://m.test/p", affiliate: false });
    expect(buildOutboundUrl("https://m.test/p", { affiliateEnabled: true, affiliateConfig: cfg })?.url).toBe("https://m.test/p?aff=fr");
    expect(buildOutboundUrl("https://m.test/p?aff=baska", { affiliateEnabled: true, affiliateConfig: cfg })?.url).toBe("https://m.test/p?aff=baska");
  });
  it("javascript: ve geçersiz adresleri reddeder", () => {
    expect(buildOutboundUrl("javascript:alert(1)", { affiliateEnabled: false, affiliateConfig: null })).toBeNull();
    expect(buildOutboundUrl("not a url", { affiliateEnabled: false, affiliateConfig: null })).toBeNull();
  });
});

describe("doğal dil araması", () => {
  const cats = [
    { id: "p", slug: "teknoloji", keywords: [], name: "Teknoloji", parentId: null },
    { id: "m", slug: "oyuncu-fareleri", keywords: ["mouse", "fare", "oyuncu faresi"], name: "Oyuncu fareleri", parentId: "p" },
    { id: "k", slug: "kulakliklar-ses", keywords: ["kulaklik"], name: "Kulaklıklar", parentId: "p" },
  ];
  it("“bütçem 1500 TL, kablosuz oyuncu faresi arıyorum” → filtreler", () => {
    const r = parseNaturalQuery("bütçem 1500 TL, kablosuz oyuncu faresi arıyorum", cats);
    expect(r).toMatchObject({ kategori: "oyuncu-fareleri", max: 150000, attrs: { connectivity: "kablosuz" } });
    expect(r.q).toBeUndefined();
  });
  it("aralık ve kapasite", () => {
    const r = parseNaturalQuery("1000-2000 tl arası 256gb bluetooth kulaklık", cats);
    expect(r).toMatchObject({ min: 100000, max: 200000, kategori: "kulakliklar-ses", attrs: { connectivity: "bluetooth", capacity: "256gb" } });
  });
});
