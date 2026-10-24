import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb, silentCtx } from "../support/db";

const baseXml = readFileSync(new URL("../fixtures/google-merchant.xml", import.meta.url), "utf8");
let feedBody = baseXml;
let feedStatus = 200;
let server: Server;
const HOUR = 3600_000;

beforeAll(async () => {
  server = createServer((_, res) => {
    res.statusCode = feedStatus;
    res.setHeader("content-type", "application/xml");
    res.end(feedBody);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  process.env.FEED_TEST_MAGAZA_URL = `http://127.0.0.1:${port}/feed.xml`;
});
afterAll(() => server?.close());

async function setupSource() {
  const db = await getDb();
  const retailer = await db.retailer.upsert({ where: { slug: "ornek-magaza" }, create: { slug: "ornek-magaza", name: "Örnek Mağaza", websiteUrl: "https://ornek-magaza.test" }, update: {} });
  return db.dataSource.upsert({
    where: { key: "feed-ornek-test" },
    create: { key: "feed-ornek-test", name: "Örnek feed", kind: "RETAIL", adapter: "product-feed", status: "AWAITING_CREDENTIALS", retailerId: retailer.id, freshnessWindowMinutes: 360, config: { feedUrlEnv: "FEED_TEST_MAGAZA_URL", format: "auto" } },
    update: {},
  });
}

describe("ürün feed'i → ingestion hattı (uçtan uca)", () => {
  it("geçerli kayıtları ürün/teklif/fiyat geçmişi olarak kaydeder, geçersizleri atlar", async () => {
    const db = await getDb();
    const { syncRetailSource } = await import("../../src/server/ingestion/retail");
    const source = await setupSource();
    const t0 = new Date();
    const stats = await syncRetailSource(db, source.id, "full", silentCtx(t0));
    expect(stats).toMatchObject({ listingsReceived: 2, listingErrors: 3, created: 2, snapshotsWritten: 2 });
    const offer = await db.offer.findUniqueOrThrow({ where: { dataSourceId_externalId: { dataSourceId: source.id, externalId: "SKU-100" } }, include: { product: { include: { category: true } }, variant: true } });
    expect(offer).toMatchObject({ priceMinor: 119990, listPriceMinor: 149990, shippingMinor: 0, totalMinor: 119990, status: "ACTIVE", matchMethod: "NEW_PRODUCT" });
    expect(offer.variant.gtin).toBe("04006381333931");
    expect(offer.product.category.slug).toBe("oyuncu-fareleri"); // anahtar kelime sınıflandırması
    expect(offer.product.bestOfferId).toBe(offer.id);
    const monitor = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-200", dataSourceId: source.id } });
    expect(monitor.status).toBe("OUT_OF_STOCK");
    const updated = await db.dataSource.findUniqueOrThrow({ where: { id: source.id } });
    expect(updated.status).toBe("CONNECTED");
    expect(updated.lastSuccessAt).not.toBeNull();
  });

  it("aynı fiyat tekrar doğrulandığında yeni geçmiş kaydı yazmaz; fiyat değişince yazar", async () => {
    const db = await getDb();
    const { syncRetailSource } = await import("../../src/server/ingestion/retail");
    const source = await setupSource();
    const offerBefore = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-100", dataSourceId: source.id } });
    const countBefore = await db.priceSnapshot.count({ where: { offerId: offerBefore.id } });
    await syncRetailSource(db, source.id, "refresh", silentCtx(new Date(Date.now() + HOUR)));
    expect(await db.priceSnapshot.count({ where: { offerId: offerBefore.id } })).toBe(countBefore);

    feedBody = baseXml.replace("1199.90 TRY</g:sale_price>", "1099.90 TRY</g:sale_price>");
    const s = await syncRetailSource(db, source.id, "refresh", silentCtx(new Date(Date.now() + 2 * HOUR)));
    expect(s.priceChanged).toBe(1);
    const after = await db.offer.findUniqueOrThrow({ where: { id: offerBefore.id } });
    expect(after).toMatchObject({ priceMinor: 109990, previousPriceMinor: 119990 });
    expect(await db.priceSnapshot.count({ where: { offerId: offerBefore.id } })).toBe(countBefore + 1);
  });

  it("tek kontrolde aşırı düşüş şüpheli işaretlenir ve en iyi teklif olmaz", async () => {
    const db = await getDb();
    const { syncRetailSource } = await import("../../src/server/ingestion/retail");
    const source = await setupSource();
    feedBody = baseXml.replace("1199.90 TRY</g:sale_price>", "99.90 TRY</g:sale_price>");
    const s = await syncRetailSource(db, source.id, "refresh", silentCtx(new Date(Date.now() + 3 * HOUR)));
    expect(s.suspicious).toBe(1);
    const o = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-100", dataSourceId: source.id }, include: { product: true } });
    expect(o.flaggedSuspicious).toBe(true);
    expect(o.dealScore).toBeNull();
    expect(o.product.bestOfferId).not.toBe(o.id);
    feedBody = baseXml;
  });

  it("kaynak hata verirse son veri korunur ve teklifler 'yeniden doğrulanıyor' olur", async () => {
    const db = await getDb();
    const { syncRetailSource } = await import("../../src/server/ingestion/retail");
    const { recomputeProducts } = await import("../../src/server/pricing/recompute");
    const source = await setupSource();
    feedStatus = 500;
    const when = new Date(Date.now() + 4 * HOUR);
    await expect(syncRetailSource(db, source.id, "refresh", silentCtx(when))).rejects.toMatchObject({ code: "UPSTREAM" });
    const o = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-100", dataSourceId: source.id } });
    await recomputeProducts(db, [o.productId], when);
    const after = await db.offer.findUniqueOrThrow({ where: { id: o.id } });
    expect(after.status).toBe("REVALIDATING");
    expect(after.priceMinor).toBe(o.priceMinor); // son başarılı veri korunur
    expect((await db.dataSource.findUniqueOrThrow({ where: { id: source.id } })).consecutiveFailures).toBeGreaterThan(0);
    feedStatus = 200;
  });

  it("tazelik penceresi aşılınca teklif STALE olur ve fırsat listesinden çıkar", async () => {
    const db = await getDb();
    const { recomputeProducts } = await import("../../src/server/pricing/recompute");
    const o = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-100" } });
    await recomputeProducts(db, [o.productId], new Date(Date.now() + 30 * HOUR));
    const after = await db.offer.findUniqueOrThrow({ where: { id: o.id }, include: { product: true } });
    expect(after.status).toBe("STALE");
    expect(after.dealScore).toBeNull();
    expect(after.dealLabels).toEqual(["REVALIDATING"]);
    expect(after.product.bestOfferId).toBeNull();
  });

  it("biçimi bozuk feed tüm teklifleri 'satıştan kalktı' yapmaz", async () => {
    const db = await getDb();
    const { syncRetailSource } = await import("../../src/server/ingestion/retail");
    const source = await setupSource();
    feedBody = "<html><body>bakımdayız</body></html>";
    await expect(syncRetailSource(db, source.id, "full", silentCtx())).rejects.toMatchObject({ code: "FORMAT" });
    expect(await db.offer.count({ where: { dataSourceId: source.id, status: "EXPIRED" } })).toBe(0);
    feedBody = baseXml;
  });

  it("tam katalogdan çıkan ürün EXPIRED olur", async () => {
    const db = await getDb();
    const { syncRetailSource } = await import("../../src/server/ingestion/retail");
    const source = await setupSource();
    feedBody = baseXml.replace(/<item>\s*<g:id>SKU-200<\/g:id>[\s\S]*?<\/item>/, "");
    const s = await syncRetailSource(db, source.id, "full", silentCtx(new Date(Date.now() + 31 * HOUR)));
    expect(s.expired).toBe(1);
    expect((await db.offer.findFirstOrThrow({ where: { externalId: "SKU-200", dataSourceId: source.id } })).status).toBe("EXPIRED");
    feedBody = baseXml;
  });
});

describe("eşleştirme", () => {
  it("farklı kaynaktaki aynı GTIN aynı ürün varyantına bağlanır; yalnızca başlık eşleşmesi incelemeye düşer", async () => {
    const db = await getDb();
    const { upsertListing } = await import("../../src/server/ingestion/retail");
    const { DEFAULT_SCORING } = await import("../../src/server/pricing/config");
    const retailer = await db.retailer.upsert({ where: { slug: "ikinci-magaza" }, create: { slug: "ikinci-magaza", name: "İkinci Mağaza", websiteUrl: "https://iki.test" }, update: {} });
    const src = await db.dataSource.upsert({ where: { key: "feed-ikinci-test" }, create: { key: "feed-ikinci-test", name: "İkinci", kind: "RETAIL", adapter: "product-feed", status: "CONNECTED", retailerId: retailer.id, config: {} }, update: {} });
    const base = { url: "https://iki.test/p", brand: "Örnekmarka", mpn: null, modelNumber: null, categoryPath: null, description: null, imageUrl: null, listPriceMinor: null, shippingMinor: 0, currency: "TRY", stockStatus: "IN_STOCK" as const, sellerName: null, rating: null, ratingCount: null, attributes: {}, specs: {}, promotion: null };
    const viaGtin = await upsertListing(db, { ...base, externalId: "X1", title: "ORNEKMARKA Z-5 Wireless Gaming Mouse", gtin: "04006381333931", priceMinor: 115000 }, src, new Date(), DEFAULT_SCORING.thresholds, { log: () => {}, jobId: null });
    const original = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-100" } });
    expect(viaGtin.productId).toBe(original.productId);
    expect((await db.offer.findFirstOrThrow({ where: { externalId: "X1" } })).matchMethod).toBe("GTIN");

    const titleOnly = await upsertListing(db, { ...base, externalId: "X2", title: "Örnekmarka Z5 Gaming Mouse Kablosuz", gtin: null, priceMinor: 116000 }, src, new Date(), DEFAULT_SCORING.thresholds, { log: () => {}, jobId: null });
    expect(titleOnly.created).toBe(true);
    expect(titleOnly.productId).not.toBe(original.productId); // otomatik birleştirilmez
    expect(titleOnly.reviewCandidates).toBeGreaterThan(0);
    const cand = await db.matchCandidate.findFirstOrThrow({ where: { offer: { externalId: "X2" } } });
    expect(cand).toMatchObject({ candidateProductId: original.productId, status: "PENDING" });
  });
});

describe("arama", () => {
  it("yazım hatasına toleranslı ve Türkçe karakterden bağımsız", async () => {
    const { searchProductIds } = await import("../../src/server/catalog/queries");
    const db = await getDb();
    const target = await db.offer.findFirstOrThrow({ where: { externalId: "SKU-100" } });
    expect(await searchProductIds("ornekmarka z5")).toContain(target.productId);
    expect(await searchProductIds("örnekmarka oyuncu faresi")).toContain(target.productId);
    expect(await searchProductIds("ornekmrka")).toContain(target.productId);
  });
});
