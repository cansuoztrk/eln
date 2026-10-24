import { describe, expect, it } from "vitest";
import { getDb, silentCtx } from "../support/db";

async function makeUserAndProduct() {
  const db = await getDb();
  const user = await db.user.create({ data: { email: `alarm-${Date.now()}@test.local`, passwordHash: "x", kvkkAcceptedAt: new Date() } });
  const category = await db.category.findFirstOrThrow({ where: { slug: "oyuncu-fareleri" } });
  const retailer = await db.retailer.upsert({ where: { slug: "alarm-magaza" }, create: { slug: "alarm-magaza", name: "Alarm Mağaza", websiteUrl: "https://a.test" }, update: {} });
  const source = await db.dataSource.upsert({ where: { key: "alarm-src" }, create: { key: "alarm-src", name: "Alarm kaynak", kind: "RETAIL", adapter: "product-feed", status: "CONNECTED", retailerId: retailer.id, config: {} }, update: {} });
  const product = await db.product.create({ data: { slug: `alarm-urun-${Date.now()}`, title: "Alarm Ürünü", categoryId: category.id } });
  const variant = await db.productVariant.create({ data: { productId: product.id, variantKey: "default", label: "Standart" } });
  const now = new Date();
  const offer = await db.offer.create({
    data: { productId: product.id, variantId: variant.id, retailerId: retailer.id, dataSourceId: source.id, externalId: `a-${Date.now()}`, url: "https://a.test/p", title: "Alarm Ürünü", priceMinor: 250000, shippingMinor: 0, totalMinor: 250000, stockStatus: "IN_STOCK", status: "ACTIVE", matchMethod: "NEW_PRODUCT", matchConfidence: 1, lastCheckedAt: now, lastSuccessAt: now },
  });
  return { db, user, product, offer };
}

describe("fiyat alarmları", () => {
  it("hedefe inince tek bildirim üretir; tekrar değerlendirme çift bildirim üretmez; yükselince yeniden kurulur", async () => {
    const { db, user, product, offer } = await makeUserAndProduct();
    const { evaluatePriceAlerts } = await import("../../src/server/alerts/price-alerts");
    const alert = await db.priceAlert.create({ data: { userId: user.id, productId: product.id, targetMinor: 200000 } });

    expect((await evaluatePriceAlerts(db, [product.id])).triggered).toBe(0);
    await db.offer.update({ where: { id: offer.id }, data: { priceMinor: 190000, totalMinor: 190000 } });
    expect((await evaluatePriceAlerts(db, [product.id])).triggered).toBe(1);
    expect((await evaluatePriceAlerts(db, [product.id])).triggered).toBe(0);
    expect(await db.notification.count({ where: { userId: user.id, type: "PRICE_ALERT" } })).toBe(1);
    expect(await db.emailOutbox.count({ where: { toEmail: user.email } })).toBe(1);
    expect((await db.priceAlert.findUniqueOrThrow({ where: { id: alert.id } })).state).toBe("TRIGGERED");

    await db.offer.update({ where: { id: offer.id }, data: { priceMinor: 210000, totalMinor: 210000 } });
    await evaluatePriceAlerts(db, [product.id]);
    expect((await db.priceAlert.findUniqueOrThrow({ where: { id: alert.id } })).state).toBe("ARMED");
  });

  it("eski (doğrulanmamış) fiyatla tetiklenmez", async () => {
    const { db, user, product, offer } = await makeUserAndProduct();
    const { evaluatePriceAlerts } = await import("../../src/server/alerts/price-alerts");
    await db.priceAlert.create({ data: { userId: user.id, productId: product.id, targetMinor: 300000 } });
    await db.offer.update({ where: { id: offer.id }, data: { status: "STALE" } });
    expect((await evaluatePriceAlerts(db, [product.id])).triggered).toBe(0);
  });

  it("SMTP yoksa e-posta SKIPPED olur, site içi bildirim kalır", async () => {
    const db = await getDb();
    const { sendPendingEmails } = await import("../../src/server/notifications/mailer");
    delete process.env.SMTP_HOST;
    const r = await sendPendingEmails(db);
    expect(r.sent).toBe(0);
    expect(r.skipped).toBeGreaterThan(0);
    expect(await db.emailOutbox.count({ where: { status: "PENDING" } })).toBe(0);
  });
});

describe("görev kuyruğu", () => {
  it("dedupeKey ikinci görevi engeller", async () => {
    const db = await getDb();
    const { enqueueJob } = await import("../../src/server/jobs/queue");
    const a = await enqueueJob(db, { type: "emails.send", dedupeKey: "dedupe-test-1" });
    const b = await enqueueJob(db, { type: "emails.send", dedupeKey: "dedupe-test-1" });
    expect(a).not.toBeNull();
    expect(b).toBeNull();
  });

  it("aynı kaynak için aynı anda tek görev çalışır", async () => {
    const db = await getDb();
    const { enqueueJob, claimNextJob } = await import("../../src/server/jobs/queue");
    await db.ingestionJob.deleteMany({ where: { status: { in: ["QUEUED", "RUNNING"] } } });
    const source = await db.dataSource.findFirstOrThrow({ where: { key: "alarm-src" } });
    await enqueueJob(db, { type: "retail.refresh", dataSourceId: source.id, dedupeKey: "c1" });
    await enqueueJob(db, { type: "retail.refresh", dataSourceId: source.id, dedupeKey: "c2" });
    const [j1, j2] = await Promise.all([claimNextJob(db, "w1"), claimNextJob(db, "w2")]);
    expect([j1, j2].filter(Boolean)).toHaveLength(1);
  });

  it("geçici hata yeniden planlanır, kalıcı hata başarısız olur, takılan görev kurtarılır", async () => {
    const db = await getDb();
    const { claimNextJob, enqueueJob, failJob, reapStuckJobs } = await import("../../src/server/jobs/queue");
    const { IntegrationError } = await import("../../src/server/integrations/types");
    await db.ingestionJob.deleteMany({ where: { status: { in: ["QUEUED", "RUNNING"] } } });
    await enqueueJob(db, { type: "emails.send", dedupeKey: `retry-${Date.now()}`, maxAttempts: 2 });
    const job = (await claimNextJob(db, "w"))!;
    expect(await failJob(db, job, Date.now(), new IntegrationError("UPSTREAM", "503"))).toBe("RETRY");
    const queued = await db.ingestionJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(queued.status).toBe("QUEUED");
    expect(queued.runAt.getTime()).toBeGreaterThan(Date.now());

    await enqueueJob(db, { type: "emails.send", dedupeKey: `perm-${Date.now()}` });
    const job2 = (await claimNextJob(db, "w"))!;
    expect(await failJob(db, job2, Date.now(), new IntegrationError("AUTH", "anahtar geçersiz"))).toBe("FAILED");

    await db.ingestionJob.update({ where: { id: job.id }, data: { status: "RUNNING", heartbeatAt: new Date(Date.now() - 3600_000) } });
    expect(await reapStuckJobs(db)).toBeGreaterThanOrEqual(1);
  });

  it("planlayıcı aynı zaman dilimi için tek görev ekler; tick görevleri çalıştırır", async () => {
    const db = await getDb();
    const { planDueJobs } = await import("../../src/server/jobs/scheduler");
    const { tick } = await import("../../src/server/jobs/runner");
    await db.jobSchedule.updateMany({ data: { nextRunAt: new Date(Date.now() - 1000) } });
    const first = await planDueJobs(db);
    const second = await planDueJobs(db);
    expect(first.enqueued).toBeGreaterThan(0);
    expect(second.enqueued).toBe(0);
    const r = await tick(db, { workerId: "test", budgetMs: 30_000, maxJobs: 50 });
    expect(r.outcomes.length).toBeGreaterThan(0);
    // Kimlik bilgisi olmayan kaynaklar başarısız olmaz, "atlandı" olarak raporlanır
    const amazon = await db.dataSource.findUniqueOrThrow({ where: { key: "amazon-tr" } });
    expect(amazon.status).toBe("AWAITING_CREDENTIALS");
    expect(r.outcomes.filter((o) => o.status === "FAILED")).toHaveLength(0);
  });
});

describe("uçuş verisi", () => {
  it("test sağlayıcısıyla rota fiyatları ve snapshot yazılır; uçuş alarmı tetiklenir", async () => {
    const db = await getDb();
    const { refreshFlightRoutes } = await import("../../src/server/ingestion/flights");
    const src = await db.dataSource.upsert({ where: { key: "fixture-flights" }, create: { key: "fixture-flights", name: "Test uçuş", kind: "FLIGHT", adapter: "fixture-flights", status: "TEST_ONLY", isTestData: true, config: {} }, update: {} });
    await db.flightRoute.updateMany({ where: { NOT: { origin: "IST", destination: "AYT" } }, data: { isActive: false } });
    const user = await db.user.create({ data: { email: `ucus-${Date.now()}@test.local`, passwordHash: "x", kvkkAcceptedAt: new Date() } });
    const from = new Date();
    await db.flightAlert.create({ data: { userId: user.id, origin: "IST", destination: "AYT", departFrom: from, departTo: new Date(from.getTime() + 80 * 86400000), targetMinor: 99_999_999 } });
    const r = await refreshFlightRoutes(db, src.id, silentCtx());
    expect(r).toMatchObject({ routesOk: 1, routesFailed: 0 });
    expect(await db.flightOffer.count({ where: { dataSourceId: src.id, isActive: true } })).toBeGreaterThan(10);
    expect(await db.flightPriceSnapshot.count()).toBeGreaterThan(0);
    expect(await db.notification.count({ where: { userId: user.id, type: "FLIGHT_ALERT" } })).toBe(1);
  });
});
