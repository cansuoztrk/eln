/**
 * Bakım ve raporlama görevleri.
 */

import type { Prisma } from "@/generated/prisma/client";
import { DAY, isoWeekKey } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import type { Db } from "../db";
import { createNotification } from "../notifications/service";
import { includeTestData } from "../visibility";
import type { JobContext } from "./context";

export async function runDailyMaintenance(db: Db, ctx: JobContext) {
  const now = ctx.now;
  const [coupons, promos, sessions, tokens, flights, oldFlights, logs, outbox] = await Promise.all([
    db.coupon.updateMany({ where: { isActive: true, validUntil: { lt: now } }, data: { isActive: false, verificationStatus: "EXPIRED" } }),
    db.promotion.updateMany({ where: { isActive: true, endsAt: { lt: now } }, data: { isActive: false } }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.userToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null }, createdAt: { lt: new Date(now.getTime() - 7 * DAY) } }] } }),
    db.flightOffer.updateMany({ where: { isActive: true, OR: [{ expiresAt: { lt: now } }, { departAt: { lt: now } }] }, data: { isActive: false } }),
    db.flightOffer.deleteMany({ where: { departAt: { lt: new Date(now.getTime() - 30 * DAY) } } }),
    db.ingestionLog.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 90 * DAY) } } }),
    db.emailOutbox.deleteMany({ where: { status: { in: ["SENT", "SKIPPED"] }, createdAt: { lt: new Date(now.getTime() - 60 * DAY) } } }),
  ]);
  // Eski görev kayıtları (başarılı olanlar 30 gün, başarısızlar 90 gün saklanır)
  const jobs = await db.ingestionJob.deleteMany({
    where: {
      OR: [
        { status: "SUCCEEDED", createdAt: { lt: new Date(now.getTime() - 30 * DAY) } },
        { status: { in: ["FAILED", "CANCELLED"] }, createdAt: { lt: new Date(now.getTime() - 90 * DAY) } },
      ],
    },
  });
  const stats = {
    couponsExpired: coupons.count,
    promotionsEnded: promos.count,
    sessionsPurged: sessions.count,
    tokensPurged: tokens.count,
    flightOffersDeactivated: flights.count,
    flightOffersDeleted: oldFlights.count,
    logsPurged: logs.count,
    emailsPurged: outbox.count,
    jobsPurged: jobs.count,
  };
  ctx.log("INFO", "Günlük bakım tamamlandı", stats);
  return stats;
}

export async function runWeeklyReport(db: Db, ctx: JobContext) {
  const now = ctx.now;
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - 7 * DAY);

  const [byStatus, suspicious, pendingMatches, noImage, uncategorized, sources] = await Promise.all([
    db.offer.groupBy({ by: ["status"], _count: true }),
    db.offer.count({ where: { flaggedSuspicious: true } }),
    db.matchCandidate.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { imageUrl: null, isActive: true } }),
    db.product.count({ where: { category: { slug: "diger-firsatlar" } } }),
    db.dataSource.findMany({ select: { id: true, key: true, name: true, status: true, lastSuccessAt: true, freshnessWindowMinutes: true } }),
  ]);

  const freshness = [];
  for (const s of sources) {
    const [total, fresh] = await Promise.all([
      db.offer.count({ where: { dataSourceId: s.id, status: { notIn: ["EXPIRED", "DISABLED"] } } }),
      db.offer.count({ where: { dataSourceId: s.id, status: "ACTIVE" } }),
    ]);
    const jobs = await db.ingestionJob.groupBy({ by: ["status"], where: { dataSourceId: s.id, createdAt: { gte: periodStart } }, _count: true });
    freshness.push({ key: s.key, name: s.name, status: s.status, lastSuccessAt: s.lastSuccessAt, offers: total, freshOffers: fresh, freshRatio: total ? fresh / total : null, jobs: Object.fromEntries(jobs.map((j) => [j.status, j._count])) });
  }

  // Kategori trendleri: haftalık fiyat düşüşü sayısı (snapshot karşılaştırması), ortalama doğrulanmış indirim ve tıklama
  const trendRows = await db.$queryRaw<{ slug: string; name: string; drops: bigint; avg_discount: number | null; clicks: bigint }[]>`
    SELECT c.slug, c.name,
      (SELECT count(*) FROM "Offer" o JOIN "Product" p ON p.id = o."productId"
        WHERE p."categoryId" = c.id AND o."lastPriceChangeAt" >= ${periodStart} AND o."previousPriceMinor" > o."priceMinor") AS drops,
      (SELECT avg(p."verifiedDiscountPct") FROM "Product" p WHERE p."categoryId" = c.id AND p."verifiedDiscountPct" IS NOT NULL) AS avg_discount,
      (SELECT count(*) FROM "ClickEvent" e WHERE e."categoryId" = c.id AND e."createdAt" >= ${periodStart}) AS clicks
    FROM "Category" c WHERE c."isActive" = true`;
  const trends = trendRows.map((r) => ({ slug: r.slug, name: r.name, priceDrops: Number(r.drops), avgVerifiedDiscountPct: r.avg_discount, clicks: Number(r.clicks) }));

  const quality = {
    offersByStatus: Object.fromEntries(byStatus.map((b) => [b.status, b._count])),
    suspicious,
    pendingMatches,
    productsWithoutImage: noImage,
    uncategorized,
  };
  await db.report.upsert({
    where: { type_periodStart: { type: "WEEKLY_QUALITY", periodStart: startOfWeek(now) } },
    create: { type: "WEEKLY_QUALITY", periodStart: startOfWeek(now), periodEnd, data: quality as Prisma.InputJsonValue },
    update: { periodEnd, data: quality as Prisma.InputJsonValue },
  });
  await db.report.upsert({
    where: { type_periodStart: { type: "FRESHNESS", periodStart: startOfWeek(now) } },
    create: { type: "FRESHNESS", periodStart: startOfWeek(now), periodEnd, data: JSON.parse(JSON.stringify(freshness)) },
    update: { periodEnd, data: JSON.parse(JSON.stringify(freshness)) },
  });
  await db.report.upsert({
    where: { type_periodStart: { type: "CATEGORY_TRENDS", periodStart: startOfWeek(now) } },
    create: { type: "CATEGORY_TRENDS", periodStart: startOfWeek(now), periodEnd, data: trends as unknown as Prisma.InputJsonValue },
    update: { periodEnd, data: trends as unknown as Prisma.InputJsonValue },
  });
  ctx.log("INFO", "Haftalık raporlar üretildi", { quality });
  return { quality, sources: freshness.length, categories: trends.length };
}

function startOfWeek(d: Date): Date {
  const day = d.getUTCDay() || 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1));
}

/** Haftalık özet: yalnızca doğrulanmış ve etiket koşulları sağlanan fırsatlar. */
export async function runWeeklyDigest(db: Db, ctx: JobContext) {
  const now = ctx.now;
  const week = isoWeekKey(now);
  const users = await db.user.findMany({ where: { digestOptIn: true }, select: { id: true, email: true, interests: { select: { categoryId: true } } } });
  if (users.length === 0) return { users: 0, sent: 0 };
  const testFilter = includeTestData() ? {} : { isTestData: false };
  let sent = 0;
  for (const u of users) {
    const categoryIds = u.interests.map((i) => i.categoryId);
    const products = await db.product.findMany({
      where: {
        isActive: true,
        bestOfferId: { not: null },
        verifiedDiscountPct: { gte: 8 },
        lastVerifiedAt: { gte: new Date(now.getTime() - DAY) },
        ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}),
        ...testFilter,
      },
      orderBy: [{ dealScore: "desc" }],
      take: 8,
      select: { slug: true, title: true, bestTotalMinor: true, bestCurrency: true, verifiedDiscountPct: true },
    });
    if (products.length === 0) continue;
    const lines = products.map((p) => `• ${p.title}: ${formatMoney(p.bestTotalMinor, p.bestCurrency ?? "TRY")} (30 günlük tipik fiyata göre %${Math.round(p.verifiedDiscountPct ?? 0)} düşük)`);
    const created = await createNotification(db, {
      userId: u.id,
      type: "DIGEST",
      title: `Haftanın doğrulanmış fırsatları (${week})`,
      body: `Fiyat geçmişine göre gerçekten avantajlı görünen ${products.length} ürün:\n${lines.join("\n")}\n\nFiyatlar son kontrol anına aittir ve değişebilir.`,
      link: "/firsatlar?sirala=avantaj",
      dedupeKey: `digest:${u.id}:${week}`,
      email: { to: u.email, subject: `FırsatRadar haftalık özet · ${week}` },
    });
    if (created) sent++;
  }
  return { users: users.length, sent };
}
