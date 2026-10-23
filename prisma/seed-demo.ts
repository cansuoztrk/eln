/**
 * TEST VERİSİ (yalnızca yerel geliştirme / demo).
 *
 * Kurgusal mağazalar ve ürünler oluşturur, gerçek ingestion hattını (eşleştirme, puanlama,
 * alarm) bu kurgusal kaynak üzerinden çalıştırır. Grafiklerin görülebilmesi için test kaynağına
 * 180 günlük TEST fiyat geçmişi yazılır — bu geçmiş de kurgusaldır ve her yerde "Test verisi"
 * etiketiyle gösterilir. Üretimde SHOW_TEST_DATA=false iken bu kayıtlar herkese açık sayfalarda
 * görünmez.
 *
 *   npm run db:seed:demo
 */
import "dotenv/config";
import type { Prisma } from "../src/generated/prisma/client";
import { DAY } from "../src/lib/time";
import { db } from "../src/server/db";
import { FIXTURE_PRODUCTS, FIXTURE_STORES, fixturePriceMinor, fixtureStock } from "../src/server/integrations/retail/fixture-catalog";
import { syncRetailSource } from "../src/server/ingestion/retail";
import { refreshFlightRoutes } from "../src/server/ingestion/flights";
import { createJobLogger } from "../src/server/jobs/context";
import { ensureSchedules } from "../src/server/jobs/scheduler";
import { recomputeProducts } from "../src/server/pricing/recompute";

async function main() {
  const now = new Date();
  // 1) Kurgusal mağazalar ve test veri kaynakları
  for (const s of FIXTURE_STORES) {
    const retailer = await db.retailer.upsert({
      where: { slug: s.slug },
      create: { slug: s.slug, name: s.name, websiteUrl: `https://test.invalid/${s.slug}`, logoText: s.name.split(" ")[0], brandColor: s.color, shippingNote: s.shipping === "flat" ? "1.500 TL üzeri ücretsiz kargo (test)" : null },
      update: {},
    });
    await db.dataSource.upsert({
      where: { key: `fixture-${s.slug.replace("test-magaza-", "")}` },
      create: {
        key: `fixture-${s.slug.replace("test-magaza-", "")}`,
        name: `${s.name} (test verisi)`,
        kind: "RETAIL",
        adapter: "fixture",
        status: "TEST_ONLY",
        isTestData: true,
        retailerId: retailer.id,
        refreshIntervalMinutes: 60,
        fullSyncIntervalMinutes: 1440,
        freshnessWindowMinutes: 360,
        config: { store: s.slug },
        notes: "Kurgusal test verisi; gerçek fiyat değildir.",
      },
      update: {},
    });
  }
  await db.dataSource.upsert({
    where: { key: "fixture-flights" },
    create: { key: "fixture-flights", name: "Test uçuş verisi", kind: "FLIGHT", adapter: "fixture-flights", status: "TEST_ONLY", isTestData: true, refreshIntervalMinutes: 360, freshnessWindowMinutes: 720, config: {} },
    update: {},
  });

  // 2) Gerçek ingestion hattıyla ilk senkron (eşleştirme dâhil)
  const sources = await db.dataSource.findMany({ where: { adapter: "fixture" } });
  for (const s of sources) {
    const { log, flush } = createJobLogger(db, null, s.id);
    const stats = await syncRetailSource(db, s.id, "full", { jobId: null, dataSourceId: s.id, log, now });
    await flush();
    console.log(`${s.name}: ${stats.created} yeni, ${stats.updated} güncellenen, ${stats.reviewCandidates} eşleştirme adayı`);
  }

  // 3) TEST fiyat geçmişi (180 gün, kurgusal) — grafik ve geçmiş metriklerini göstermek için
  const offers = await db.offer.findMany({ where: { dataSource: { adapter: "fixture" } }, include: { retailer: true } });
  let written = 0;
  for (const o of offers) {
    const existing = await db.priceSnapshot.count({ where: { offerId: o.id } });
    if (existing > 3) continue;
    const product = FIXTURE_PRODUCTS.find((p) => o.externalId.startsWith(p.key));
    if (!product) continue;
    const variant = product.variants?.find((v) => o.externalId.endsWith(v.suffix.toLowerCase().replace(/\s+/g, "-"))) ?? null;
    const today = Math.floor(now.getTime() / DAY);
    const rows: Prisma.PriceSnapshotCreateManyInput[] = [];
    // Gerçek hatla aynı politika: günde bir doğrulama kaydı (heartbeat); fiyat o gün içinde sabit.
    for (let d = 180; d >= 1; d--) {
      const day = today - d;
      const price = fixturePriceMinor(product, variant, o.retailer.slug, day);
      const stock = fixtureStock(product, o.retailer.slug, day);
      rows.push({ offerId: o.id, priceMinor: price, listPriceMinor: o.listPriceMinor, shippingMinor: o.shippingMinor, currency: "TRY", stockStatus: stock, checkedAt: new Date(day * DAY + 9 * 3600_000), dataSourceId: o.dataSourceId });
    }
    await db.priceSnapshot.createMany({ data: rows, skipDuplicates: true });
    written += rows.length;
  }
  console.log(`${written} test fiyat geçmişi kaydı yazıldı.`);
  await recomputeProducts(db, [...new Set(offers.map((o) => o.productId))], now);

  // 4) Test kuponu (doğrulanmış olarak işaretli TEST kaydı)
  const atlas = await db.retailer.findUnique({ where: { slug: "test-magaza-atlas" } });
  const atlasSource = await db.dataSource.findUnique({ where: { key: "fixture-atlas" } });
  if (atlas && atlasSource && (await db.coupon.count({ where: { retailerId: atlas.id } })) === 0) {
    await db.coupon.createMany({
      data: [
        { retailerId: atlas.id, code: "TEST10", title: "Teknolojide %10 (test kuponu)", description: "Test verisi — gerçek bir kupon değildir.", conditionType: "COUPON_CODE", discountType: "PERCENT", discountValue: 1000, maxDiscountMinor: 50000, minBasketMinor: 100000, categorySlugs: ["teknoloji"], verificationStatus: "VERIFIED", verifiedAt: now, lastCheckedAt: now, validUntil: new Date(now.getTime() + 20 * DAY), dataSourceId: atlasSource.id },
        { retailerId: atlas.id, code: null, title: "Belirli kartlara ek indirim (test)", description: "Test verisi — ödeme yöntemine bağlı koşullu avantaj örneği.", conditionType: "PAYMENT_METHOD", discountType: "PERCENT", discountValue: 500, categorySlugs: [], verificationStatus: "UNVERIFIED", validUntil: new Date(now.getTime() + 10 * DAY), dataSourceId: atlasSource.id },
      ],
    });
    await recomputeProducts(db, (await db.product.findMany({ select: { id: true } })).map((p) => p.id), now);
  }

  // 5) Test uçuş verisi
  const flightSource = await db.dataSource.findUnique({ where: { key: "fixture-flights" } });
  if (flightSource) {
    const { log, flush } = createJobLogger(db, null, flightSource.id);
    const r = await refreshFlightRoutes(db, flightSource.id, { jobId: null, dataSourceId: flightSource.id, log, now });
    await flush();
    console.log("Test uçuşları:", r);
  }
  await ensureSchedules(db);
  console.log("Test verisi hazır. Arayüzde tüm bu kayıtlar 'Test verisi' olarak işaretlenir.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
