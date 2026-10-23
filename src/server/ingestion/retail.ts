/**
 * E-ticaret veri toplama hattı:
 *   adaptör → doğrulama → eşleştirme → teklif güncelleme → fiyat geçmişi → puanlama → alarmlar
 *
 * Hata yönetimi:
 *  - Adaptör tümüyle başarısız olursa son başarılı veri KORUNUR; kaynağın teklifleri
 *    "yeniden doğrulanıyor" durumuna geçer (lastCheckedAt > lastSuccessAt) ve tazelik penceresi
 *    aşılınca aktif fırsat listelerinden düşer.
 *  - Tek tek hatalı kayıtlar atlanır ve günlüğe yazılır; tüm görevi düşürmez.
 *  - Tam katalog kaynağında olağandışı küçülme (%50'den fazla) görülürse toplu "satıştan kalktı"
 *    işaretlemesi yapılmaz (kısmi feed koruması).
 */

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { HOUR } from "@/lib/time";
import { secretFromEnvSafe } from "../secrets";
import type { Db } from "../db";
import { createHttpClient, type UsageCounter } from "../integrations/http";
import { getRetailAdapter } from "../integrations/registry";
import { IntegrationError, type DataSourceRecord, type NormalizedListing } from "../integrations/types";
import type { JobContext } from "../jobs/context";
import { resolveListing } from "../matching/matcher";
import { evaluatePriceAlerts } from "../alerts/price-alerts";
import { DEFAULT_SCORING } from "../pricing/config";
import { detectSuspiciousChange } from "../pricing/evaluate";
import { loadScoringConfig, recomputeProducts } from "../pricing/recompute";
import { recordUsage, usageToday } from "./usage";

/** Fiyat değişmese de bu süre geçtiyse günlük "doğrulandı" kaydı yazılır (veri boşluğu tespiti için). */
export const SNAPSHOT_HEARTBEAT_MS = 20 * HOUR;

const listingSchema = z.object({
  externalId: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  title: z.string().min(2).max(400),
  priceMinor: z.number().int().positive().max(2_000_000_000),
  listPriceMinor: z.number().int().positive().nullable(),
  shippingMinor: z.number().int().min(0).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  imageUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://") || u.startsWith("http://"), "görsel adresi http(s) olmalı")
    .nullable(),
});

export type SyncStats = {
  skipped?: string;
  listingsReceived: number;
  listingErrors: number;
  invalid: number;
  created: number;
  updated: number;
  priceChanged: number;
  snapshotsWritten: number;
  expired: number;
  suspicious: number;
  reviewCandidates: number;
  productsRecomputed: number;
  alertsTriggered: number;
  requests: number;
};

function emptyStats(): SyncStats {
  return {
    listingsReceived: 0,
    listingErrors: 0,
    invalid: 0,
    created: 0,
    updated: 0,
    priceChanged: 0,
    snapshotsWritten: 0,
    expired: 0,
    suspicious: 0,
    reviewCandidates: 0,
    productsRecomputed: 0,
    alertsTriggered: 0,
    requests: 0,
  };
}

export function toSourceRecord(s: {
  id: string;
  key: string;
  name: string;
  adapter: string;
  kind: "RETAIL" | "FLIGHT" | "COUPON";
  isTestData: boolean;
  retailerId: string | null;
  config: Prisma.JsonValue;
  rateLimitPerMinute: number;
  dailyQuota: number | null;
}): DataSourceRecord {
  return { ...s, config: (s.config && typeof s.config === "object" && !Array.isArray(s.config) ? s.config : {}) as Record<string, unknown> };
}

export async function markSourceFailure(db: Db, sourceId: string, err: unknown, now: Date) {
  const message = err instanceof Error ? err.message : String(err);
  const code = err instanceof IntegrationError ? err.code : "UNKNOWN";
  const source = await db.dataSource.update({
    where: { id: sourceId },
    data: { lastRunAt: now, lastErrorAt: now, lastError: `[${code}] ${message}`.slice(0, 1000), consecutiveFailures: { increment: 1 } },
    select: { consecutiveFailures: true, maxConsecutiveFailures: true, status: true },
  });
  if (code === "AUTH") {
    await db.dataSource.update({ where: { id: sourceId }, data: { status: "AWAITING_CREDENTIALS" } });
  } else if (source.consecutiveFailures >= source.maxConsecutiveFailures && source.status !== "DISABLED") {
    await db.dataSource.update({ where: { id: sourceId }, data: { status: "DEGRADED" } });
  }
  // Son başarılı veri korunur; teklifler "yeniden doğrulanıyor" durumuna düşer.
  await db.offer.updateMany({ where: { dataSourceId: sourceId, status: { in: ["ACTIVE", "OUT_OF_STOCK"] } }, data: { lastCheckedAt: now } });
}

export async function syncRetailSource(db: Db, sourceId: string, mode: "refresh" | "full", ctx: JobContext): Promise<SyncStats> {
  const stats = emptyStats();
  const now = ctx.now;
  const source = await db.dataSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Veri kaynağı bulunamadı: ${sourceId}`);
  if (source.kind !== "RETAIL") throw new Error("Bu görev yalnızca e-ticaret kaynakları içindir");
  if (!source.isEnabled || source.status === "DISABLED") {
    stats.skipped = "Kaynak devre dışı";
    return stats;
  }
  if (!source.retailerId) throw new Error("Kaynağa bağlı mağaza (retailer) tanımlı değil");

  const adapter = getRetailAdapter(source.adapter);
  if (!adapter) throw new IntegrationError("NOT_CONFIGURED", `Adaptör bulunamadı: ${source.adapter}`, { retryable: false });

  const record = toSourceRecord(source);
  const check = adapter.checkConfiguration(record, secretFromEnvSafe);
  if (!check.ok) {
    await db.dataSource.update({ where: { id: source.id }, data: { status: check.status, lastRunAt: now, lastError: check.message } });
    ctx.log("WARN", `Kaynak çalıştırılmadı: ${check.message}`, { missing: check.missing });
    stats.skipped = check.message;
    return stats;
  }

  if (source.dailyQuota) {
    const used = await usageToday(db, source.id, now);
    if (used >= source.dailyQuota) {
      ctx.log("WARN", "Günlük kota doldu; görev atlandı", { used, quota: source.dailyQuota });
      stats.skipped = "Günlük kota doldu";
      return stats;
    }
    if (used >= (source.dailyQuota * source.quotaWarnPercent) / 100) ctx.log("WARN", "Kota uyarı eşiği aşıldı", { used, quota: source.dailyQuota });
  }

  const usage: UsageCounter = { requests: 0, errors: 0, rateLimited: 0 };
  const http = createHttpClient({ key: source.key, rateLimitPerMinute: source.rateLimitPerMinute, usage, signal: ctx.signal });
  const known = adapter.capabilities.lookupByIds
    ? await db.offer.findMany({ where: { dataSourceId: source.id, status: { notIn: ["EXPIRED"] } }, select: { externalId: true } })
    : [];

  let result;
  try {
    result = await adapter.fetch(
      { source: record, http, log: ctx.log, secret: secretFromEnvSafe, now, signal: ctx.signal },
      { mode, knownExternalIds: known.map((k) => k.externalId) },
    );
  } catch (err) {
    await recordUsage(db, source.id, usage, now);
    await markSourceFailure(db, source.id, err, now);
    throw err;
  }
  await recordUsage(db, source.id, usage, now);
  stats.requests = result.requests;
  stats.listingsReceived = result.listings.length;
  stats.listingErrors = result.errors.length;
  for (const e of result.errors.slice(0, 20)) ctx.log("WARN", `Kayıt atlandı: ${e.reason}`, { externalId: e.externalId });
  if (result.errors.length > 20) ctx.log("WARN", `${result.errors.length - 20} kayıt hatası daha (özetlendi)`);

  const config = await loadScoringConfig(db).catch(() => DEFAULT_SCORING);
  const affected = new Set<string>();
  const seenIds = new Set<string>();

  for (const listing of result.listings) {
    if (ctx.signal?.aborted) throw new Error("Görev iptal edildi");
    const parsed = listingSchema.safeParse(listing);
    if (!parsed.success) {
      stats.invalid++;
      if (stats.invalid <= 10) ctx.log("WARN", "Geçersiz kayıt", { externalId: listing.externalId, issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) });
      continue;
    }
    seenIds.add(listing.externalId);
    try {
      const r = await upsertListing(db, listing, source, now, config.thresholds, ctx);
      affected.add(r.productId);
      if (r.created) stats.created++;
      else stats.updated++;
      if (r.priceChanged) stats.priceChanged++;
      if (r.snapshot) stats.snapshotsWritten++;
      if (r.suspicious) stats.suspicious++;
      stats.reviewCandidates += r.reviewCandidates;
    } catch (err) {
      stats.invalid++;
      ctx.log("ERROR", `Kayıt işlenemedi: ${(err as Error).message}`, { externalId: listing.externalId });
    }
  }

  // Satıştan kalkan ürünler
  if (result.notFoundIds.length) {
    const r = await db.offer.updateMany({ where: { dataSourceId: source.id, externalId: { in: result.notFoundIds } }, data: { status: "EXPIRED", lastCheckedAt: now } });
    stats.expired += r.count;
  }
  if (result.completeCatalog) {
    const activeBefore = await db.offer.count({ where: { dataSourceId: source.id, status: { notIn: ["EXPIRED"] } } });
    if (activeBefore > 20 && seenIds.size < activeBefore * 0.5) {
      ctx.log("WARN", "Katalog olağandışı küçüldü; toplu 'satıştan kalktı' işaretlemesi yapılmadı", { seen: seenIds.size, activeBefore });
    } else {
      const missing = await db.offer.findMany({
        where: { dataSourceId: source.id, status: { notIn: ["EXPIRED"] }, externalId: { notIn: [...seenIds] } },
        select: { id: true, productId: true },
      });
      if (missing.length) {
        await db.offer.updateMany({ where: { id: { in: missing.map((m) => m.id) } }, data: { status: "EXPIRED", lastCheckedAt: now } });
        missing.forEach((m) => affected.add(m.productId));
        stats.expired += missing.length;
      }
    }
  }

  const productIds = [...affected];
  const recomputed = await recomputeProducts(db, productIds, now);
  stats.productsRecomputed = recomputed.products;
  stats.alertsTriggered = (await evaluatePriceAlerts(db, productIds, now)).triggered;

  await db.dataSource.update({
    where: { id: source.id },
    data: {
      status: source.isTestData ? "TEST_ONLY" : "CONNECTED",
      lastRunAt: now,
      lastSuccessAt: now,
      lastError: null,
      consecutiveFailures: 0,
      lastItemsSeen: stats.listingsReceived,
      lastItemsUpdated: stats.created + stats.updated,
    },
  });
  ctx.log("INFO", "Senkron tamamlandı", stats as unknown as Record<string, unknown>);
  return stats;
}

type UpsertResult = { productId: string; created: boolean; priceChanged: boolean; snapshot: boolean; suspicious: boolean; reviewCandidates: number };

export async function upsertListing(
  db: Db,
  listing: NormalizedListing,
  source: { id: string; key: string; retailerId: string | null },
  now: Date,
  thresholds: typeof DEFAULT_SCORING.thresholds,
  ctx: Pick<JobContext, "log" | "jobId">,
): Promise<UpsertResult> {
  const existing = await db.offer.findUnique({
    where: { dataSourceId_externalId: { dataSourceId: source.id, externalId: listing.externalId } },
  });
  const totalMinor = listing.shippingMinor === null ? null : listing.priceMinor + listing.shippingMinor;

  if (existing) {
    const priceChanged = existing.priceMinor !== listing.priceMinor;
    const changed =
      priceChanged ||
      existing.listPriceMinor !== listing.listPriceMinor ||
      existing.shippingMinor !== listing.shippingMinor ||
      existing.stockStatus !== listing.stockStatus;
    // Yalnızca son veri tazeyse "tek kontrolde aşırı değişim" anlamlıdır.
    const prevFresh = now.getTime() - existing.lastSuccessAt.getTime() < 3 * 24 * HOUR;
    const suspiciousReason = priceChanged && prevFresh ? detectSuspiciousChange(existing.priceMinor, listing.priceMinor, thresholds) : null;

    let flaggedSuspicious = existing.flaggedSuspicious;
    let suspiciousAuto = existing.suspiciousAuto;
    let reason = existing.suspiciousReason;
    if (suspiciousReason) {
      flaggedSuspicious = true;
      suspiciousAuto = true;
      reason = suspiciousReason;
      ctx.log("WARN", "Şüpheli fiyat değişimi", { offerId: existing.id, from: existing.priceMinor, to: listing.priceMinor });
    } else if (existing.flaggedSuspicious && existing.suspiciousAuto && !priceChanged && now.getTime() - (existing.lastPriceChangeAt?.getTime() ?? 0) >= 6 * HOUR) {
      // Aynı fiyat en az 6 saat sonra tekrar doğrulandı → otomatik işaret kaldırılır
      flaggedSuspicious = false;
      suspiciousAuto = false;
      reason = null;
    }

    const needSnapshot = changed || !existing.lastSnapshotAt || now.getTime() - existing.lastSnapshotAt.getTime() >= SNAPSHOT_HEARTBEAT_MS;
    await db.offer.update({
      where: { id: existing.id },
      data: {
        url: listing.url,
        title: listing.title,
        imageUrl: listing.imageUrl ?? existing.imageUrl,
        sellerName: listing.sellerName,
        currency: listing.currency,
        priceMinor: listing.priceMinor,
        listPriceMinor: listing.listPriceMinor,
        shippingMinor: listing.shippingMinor,
        totalMinor,
        stockStatus: listing.stockStatus,
        status: existing.disabledByAdmin ? "DISABLED" : listing.stockStatus === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "ACTIVE",
        rating: listing.rating,
        ratingCount: listing.ratingCount,
        promotionText: listing.promotion?.text ?? null,
        lastCheckedAt: now,
        lastSuccessAt: now,
        ...(priceChanged ? { lastPriceChangeAt: now, previousPriceMinor: existing.priceMinor } : {}),
        flaggedSuspicious,
        suspiciousAuto,
        suspiciousReason: reason,
        ...(needSnapshot ? { lastSnapshotAt: now } : {}),
      },
    });
    if (needSnapshot) await writeSnapshot(db, existing.id, listing, source.id, now, ctx.jobId);
    await syncPromotion(db, existing.id, source, listing, now);
    return { productId: existing.productId, created: false, priceChanged, snapshot: needSnapshot, suspicious: Boolean(suspiciousReason), reviewCandidates: 0 };
  }

  if (!source.retailerId) throw new Error("Kaynakta mağaza tanımlı değil");
  const match = await resolveListing(db, listing, source);
  let offer;
  try {
    offer = await db.offer.create({
      data: {
        productId: match.productId,
        variantId: match.variantId,
        retailerId: source.retailerId,
        dataSourceId: source.id,
        externalId: listing.externalId,
        url: listing.url,
        title: listing.title,
        imageUrl: listing.imageUrl,
        sellerName: listing.sellerName,
        currency: listing.currency,
        priceMinor: listing.priceMinor,
        listPriceMinor: listing.listPriceMinor,
        shippingMinor: listing.shippingMinor,
        totalMinor,
        stockStatus: listing.stockStatus,
        status: listing.stockStatus === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "ACTIVE",
        rating: listing.rating,
        ratingCount: listing.ratingCount,
        promotionText: listing.promotion?.text ?? null,
        matchMethod: match.method,
        matchConfidence: match.confidence,
        lastCheckedAt: now,
        lastSuccessAt: now,
        lastSnapshotAt: now,
      },
    });
  } catch (err) {
    // Eşzamanlı başka bir görev aynı kaydı oluşturduysa (benzersizlik ihlali) mevcut kaydı güncelle.
    if ((err as { code?: string }).code === "P2002") return upsertListing(db, listing, source, now, thresholds, ctx);
    throw err;
  }
  await writeSnapshot(db, offer.id, listing, source.id, now, ctx.jobId);
  await syncPromotion(db, offer.id, source, listing, now);
  if (!listing.imageUrl) {
    /* görsel yoksa arayüz kategori illüstrasyonu gösterir */
  } else {
    await db.product.updateMany({ where: { id: match.productId, imageUrl: null }, data: { imageUrl: listing.imageUrl } });
  }
  if (match.reviewCandidates.length) {
    await db.matchCandidate.createMany({
      data: match.reviewCandidates.map((c) => ({
        offerId: offer.id,
        candidateProductId: c.productId,
        confidence: c.score.confidence,
        signals: c.score.signals as unknown as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
  }
  return { productId: match.productId, created: true, priceChanged: false, snapshot: true, suspicious: false, reviewCandidates: match.reviewCandidates.length };
}

async function writeSnapshot(db: Db, offerId: string, listing: NormalizedListing, dataSourceId: string, now: Date, jobId: string | null) {
  await db.priceSnapshot.createMany({
    data: [
      {
        offerId,
        priceMinor: listing.priceMinor,
        listPriceMinor: listing.listPriceMinor,
        shippingMinor: listing.shippingMinor,
        currency: listing.currency,
        stockStatus: listing.stockStatus,
        checkedAt: now,
        dataSourceId,
        jobId,
      },
    ],
    skipDuplicates: true, // (offerId, checkedAt) benzersiz → aynı kontrol iki kez yazılmaz
  });
}

async function syncPromotion(db: Db, offerId: string, source: { id: string; retailerId: string | null }, listing: NormalizedListing, now: Date) {
  if (!source.retailerId) return;
  const existing = await db.promotion.findFirst({ where: { offerId, dataSourceId: source.id, isActive: true } });
  if (!listing.promotion) {
    if (existing) await db.promotion.update({ where: { id: existing.id }, data: { isActive: false, lastCheckedAt: now } });
    return;
  }
  if (existing) {
    await db.promotion.update({ where: { id: existing.id }, data: { title: listing.promotion.text, endsAt: listing.promotion.endsAt, lastCheckedAt: now } });
  } else {
    await db.promotion.create({
      data: {
        offerId,
        retailerId: source.retailerId,
        title: listing.promotion.text,
        conditionType: "PUBLIC",
        endsAt: listing.promotion.endsAt,
        sourceText: listing.promotion.text,
        dataSourceId: source.id,
        lastCheckedAt: now,
      },
    });
  }
}
