"use server";

import { refresh, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { parsePriceToMinor } from "@/lib/money";
import { normalizeText, slugify } from "@/lib/text";
import { audit } from "@/server/audit";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { getFlightAdapter, getRetailAdapter } from "@/server/integrations/registry";
import { toSourceRecord } from "@/server/ingestion/retail";
import { enqueueJob, retryJobManually } from "@/server/jobs/queue";
import { ensureSchedules } from "@/server/jobs/scheduler";
import { invalidateCategoryCache } from "@/server/matching/classify";
import { DEFAULT_SCORING, mergeScoringConfig } from "@/server/pricing/config";
import { invalidateScoringConfigCache, recomputeProducts } from "@/server/pricing/recompute";
import { secretFromEnvSafe, SECRET_ENV_PREFIXES } from "@/server/secrets";

export type AdminResult = { ok?: boolean; error?: string; message?: string };

const id = z.string().min(5).max(40);
const reason = (fd: FormData) => String(fd.get("reason") ?? "").trim().slice(0, 300) || null;

// ───────────────────────────── Teklifler ─────────────────────────────

export async function setOfferDisabled(offerId: string, disabled: boolean, fd: FormData) {
  const u = await requireStaff("EDITOR");
  const before = await db.offer.findUniqueOrThrow({ where: { id: id.parse(offerId) }, select: { disabledByAdmin: true, disabledReason: true, productId: true } });
  const r = reason(fd);
  await db.offer.update({ where: { id: offerId }, data: { disabledByAdmin: disabled, disabledReason: disabled ? r : null, status: disabled ? "DISABLED" : "ACTIVE" } });
  await recomputeProducts(db, [before.productId]);
  await audit(db, { actorId: u.id, action: disabled ? "offer.disable" : "offer.enable", entityType: "Offer", entityId: offerId, before, after: { disabledByAdmin: disabled }, reason: r });
  refresh();
}

export async function setOfferFlag(offerId: string, flagged: boolean, fd: FormData) {
  const u = await requireStaff("EDITOR");
  const before = await db.offer.findUniqueOrThrow({ where: { id: id.parse(offerId) }, select: { flaggedSuspicious: true, suspiciousReason: true, productId: true } });
  const r = reason(fd);
  await db.offer.update({ where: { id: offerId }, data: { flaggedSuspicious: flagged, suspiciousAuto: false, suspiciousReason: flagged ? (r ?? "Yönetici tarafından işaretlendi") : null } });
  await recomputeProducts(db, [before.productId]);
  await audit(db, { actorId: u.id, action: flagged ? "offer.flag" : "offer.unflag", entityType: "Offer", entityId: offerId, before, after: { flaggedSuspicious: flagged }, reason: r });
  refresh();
}

/** Teklifi başka bir ürüne taşır (yanlış eşleşmeyi düzeltme). */
export async function moveOffer(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("EDITOR");
  const offerId = id.parse(fd.get("offerId"));
  const slug = String(fd.get("targetSlug") ?? "").trim();
  const target = await db.product.findUnique({ where: { slug } });
  if (!target) return { error: "Hedef ürün bulunamadı (slug)." };
  const r = await mergeOfferInto(offerId, target.id, u.id, reason(fd) ?? "Elle taşındı");
  return r ? { ok: true, message: "Teklif taşındı ve puanlar yeniden hesaplandı." } : { error: "Teklif taşınamadı." };
}

async function mergeOfferInto(offerId: string, targetProductId: string, actorId: string, why: string): Promise<boolean> {
  const offer = await db.offer.findUnique({ where: { id: offerId }, include: { variant: true } });
  if (!offer || offer.productId === targetProductId) return false;
  const sourceProductId = offer.productId;
  let targetVariant = await db.productVariant.findUnique({ where: { productId_variantKey: { productId: targetProductId, variantKey: offer.variant.variantKey } } });
  if (!targetVariant) {
    targetVariant = await db.productVariant.create({
      data: { productId: targetProductId, variantKey: offer.variant.variantKey, label: offer.variant.label, attributes: offer.variant.attributes as Prisma.InputJsonValue, mpn: offer.variant.mpn, imageUrl: offer.variant.imageUrl },
    });
  }
  await db.offer.update({ where: { id: offerId }, data: { productId: targetProductId, variantId: targetVariant.id, matchMethod: "MANUAL", matchConfidence: 1 } });
  const remaining = await db.offer.count({ where: { productId: sourceProductId } });
  if (remaining === 0) {
    // Kullanıcı verileri hedef ürüne aktarılır, boş kalan ürün pasifleşir
    const [favs, alerts] = await Promise.all([db.userFavorite.findMany({ where: { productId: sourceProductId } }), db.priceAlert.findMany({ where: { productId: sourceProductId } })]);
    await db.userFavorite.createMany({ data: favs.map((f) => ({ userId: f.userId, productId: targetProductId })), skipDuplicates: true });
    await db.priceAlert.updateMany({ where: { id: { in: alerts.map((a) => a.id) } }, data: { productId: targetProductId, variantId: null } });
    if (!offer.variant.gtin) await db.product.update({ where: { id: sourceProductId }, data: { isActive: false } });
    else {
      const gtin = offer.variant.gtin;
      await db.productVariant.update({ where: { id: offer.variantId }, data: { gtin: null } });
      if (!targetVariant.gtin) await db.productVariant.update({ where: { id: targetVariant.id }, data: { gtin } });
      await db.product.update({ where: { id: sourceProductId }, data: { isActive: false } });
    }
  }
  await recomputeProducts(db, [sourceProductId, targetProductId]);
  await audit(db, { actorId, action: "offer.move", entityType: "Offer", entityId: offerId, before: { productId: sourceProductId }, after: { productId: targetProductId }, reason: why });
  return true;
}

// ───────────────────────────── Eşleştirme ─────────────────────────────

export async function reviewMatch(candidateId: string, approve: boolean) {
  const u = await requireStaff("EDITOR");
  const c = await db.matchCandidate.findUniqueOrThrow({ where: { id: id.parse(candidateId) } });
  if (c.status !== "PENDING") return;
  if (approve) {
    await mergeOfferInto(c.offerId, c.candidateProductId, u.id, `Eşleştirme onayı (güven ${c.confidence.toFixed(2)})`);
    await db.matchCandidate.updateMany({ where: { offerId: c.offerId, status: "PENDING", id: { not: c.id } }, data: { status: "REJECTED", reviewedById: u.id, reviewedAt: new Date() } });
  }
  await db.matchCandidate.update({ where: { id: c.id }, data: { status: approve ? "APPROVED" : "REJECTED", reviewedById: u.id, reviewedAt: new Date() } });
  await audit(db, { actorId: u.id, action: approve ? "match.approve" : "match.reject", entityType: "MatchCandidate", entityId: c.id, after: { offerId: c.offerId, candidateProductId: c.candidateProductId } });
  refresh();
}

// ───────────────────────────── Ürünler ─────────────────────────────

export async function updateProduct(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("EDITOR");
  const parsed = z
    .object({
      productId: id,
      title: z.string().trim().min(2).max(300),
      categoryId: id,
      brandName: z.string().trim().max(80).optional(),
      modelNumber: z.string().trim().max(80).optional(),
      imageUrl: z.string().trim().max(1000).optional(),
      tags: z.string().max(500).optional(),
      isActive: z.enum(["on"]).optional(),
      reason: z.string().max(300).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Form geçersiz." };
  const d = parsed.data;
  if (d.imageUrl && !/^https:\/\//.test(d.imageUrl)) return { error: "Görsel adresi https ile başlamalı." };
  const before = await db.product.findUniqueOrThrow({ where: { id: d.productId }, select: { title: true, categoryId: true, brandId: true, modelNumber: true, imageUrl: true, tags: true, isActive: true } });
  let brandId: string | null = before.brandId;
  if (d.brandName !== undefined) {
    if (!d.brandName) brandId = null;
    else {
      const slug = slugify(d.brandName, 60);
      const b = await db.brand.upsert({ where: { slug }, create: { slug, name: d.brandName, aliases: [normalizeText(d.brandName)] }, update: {} });
      brandId = b.id;
    }
  }
  const after = {
    title: d.title,
    categoryId: d.categoryId,
    brandId,
    modelNumber: d.modelNumber || null,
    imageUrl: d.imageUrl || null,
    tags: (d.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20),
    isActive: d.isActive === "on",
  };
  const category = await db.category.findUnique({ where: { id: d.categoryId }, select: { name: true } });
  if (!category) return { error: "Kategori bulunamadı." };
  await db.product.update({ where: { id: d.productId }, data: { ...after, searchText: normalizeText(`${d.title} ${d.brandName ?? ""} ${d.modelNumber ?? ""} ${category.name} ${after.tags.join(" ")}`) } });
  await audit(db, { actorId: u.id, action: "product.update", entityType: "Product", entityId: d.productId, before, after, reason: d.reason || null });
  refresh();
  return { ok: true, message: "Ürün güncellendi; değişiklik denetim kaydına yazıldı." };
}

// ───────────────────────────── Veri kaynakları ─────────────────────────────

export async function updateSource(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z
    .object({
      sourceId: id,
      refreshIntervalMinutes: z.coerce.number().int().min(5).max(10080),
      fullSyncIntervalMinutes: z.coerce.number().int().min(15).max(43200),
      freshnessWindowMinutes: z.coerce.number().int().min(15).max(10080),
      rateLimitPerMinute: z.coerce.number().int().min(1).max(6000),
      dailyQuota: z.string().optional(),
      maxConsecutiveFailures: z.coerce.number().int().min(1).max(100),
      config: z.string().max(20000),
      isEnabled: z.enum(["on"]).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `Form geçersiz: ${parsed.error.issues[0]?.path.join(".")}` };
  const d = parsed.data;
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(d.config || "{}");
    if (typeof config !== "object" || Array.isArray(config)) throw new Error();
  } catch {
    return { error: "Yapılandırma geçerli bir JSON nesnesi olmalı." };
  }
  // Gizli değer veritabanına yazılmasın: *Env alanları yalnızca izinli önekli değişken adı olabilir.
  for (const [k, v] of Object.entries(config)) {
    if (k.toLowerCase().endsWith("env") && (typeof v !== "string" || !SECRET_ENV_PREFIXES.some((p) => v.startsWith(p)) || !/^[A-Z0-9_]+$/.test(v))) {
      return { error: `"${k}" yalnızca ${SECRET_ENV_PREFIXES.join(", ")} önekli bir ortam değişkeni ADI olabilir.` };
    }
    if (/(secret|password|token|apikey|api_key)$/i.test(k)) return { error: `"${k}" gizli değer gibi görünüyor; gizli değerleri ortam değişkeninde tutun ve burada yalnızca değişken adını verin.` };
  }
  const before = await db.dataSource.findUniqueOrThrow({ where: { id: d.sourceId } });
  const quota = d.dailyQuota ? Number(d.dailyQuota) : null;
  const data = {
    refreshIntervalMinutes: d.refreshIntervalMinutes,
    fullSyncIntervalMinutes: d.fullSyncIntervalMinutes,
    freshnessWindowMinutes: d.freshnessWindowMinutes,
    rateLimitPerMinute: d.rateLimitPerMinute,
    dailyQuota: quota && Number.isFinite(quota) && quota > 0 ? Math.round(quota) : null,
    maxConsecutiveFailures: d.maxConsecutiveFailures,
    config: config as Prisma.InputJsonValue,
    isEnabled: d.isEnabled === "on",
    ...(d.isEnabled !== "on" ? { status: "DISABLED" as const } : before.status === "DISABLED" ? { status: (before.isTestData ? "TEST_ONLY" : "AWAITING_CREDENTIALS") as "TEST_ONLY" | "AWAITING_CREDENTIALS" } : {}),
  };
  await db.dataSource.update({ where: { id: d.sourceId }, data });
  await ensureSchedules(db);
  await audit(db, { actorId: u.id, action: "source.update", entityType: "DataSource", entityId: d.sourceId, before: { ...before, config: before.config }, after: data });
  refresh();
  return { ok: true, message: "Kaynak ayarları kaydedildi ve zamanlamalar güncellendi." };
}

export async function runSourceNow(sourceId: string, type: string) {
  const u = await requireStaff("ADMIN");
  if (!["retail.refresh", "retail.full-sync", "flights.refresh-routes"].includes(type)) return;
  await enqueueJob(db, { type, dataSourceId: id.parse(sourceId), trigger: "MANUAL", priority: 10, triggeredById: u.id, dedupeKey: `manual:${type}:${sourceId}:${Date.now()}` });
  await audit(db, { actorId: u.id, action: "source.run", entityType: "DataSource", entityId: sourceId, after: { type } });
  refresh();
}

export async function testSource(_: AdminResult, fd: FormData): Promise<AdminResult> {
  await requireStaff("ADMIN");
  const s = await db.dataSource.findUniqueOrThrow({ where: { id: id.parse(fd.get("sourceId")) } });
  const adapter = s.kind === "FLIGHT" ? getFlightAdapter(s.adapter) : getRetailAdapter(s.adapter);
  if (!adapter) return { error: `Adaptör bulunamadı: ${s.adapter}` };
  const check = adapter.checkConfiguration(toSourceRecord(s), secretFromEnvSafe);
  if (!check.ok) {
    await db.dataSource.update({ where: { id: s.id }, data: { status: check.status } });
    refresh();
    return { error: `${check.message}${check.missing.length ? ` Eksik: ${check.missing.join(", ")}` : ""}` };
  }
  return { ok: true, message: `${check.message} Bağlantıyı doğrulamak için “Şimdi çalıştır” ile bir görev başlatın; sonuç görev günlüğünde görünür.` };
}

export async function createFeedSource(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      retailerName: z.string().trim().min(2).max(80),
      websiteUrl: z.string().trim().url(),
      feedUrlEnv: z.string().regex(/^FEED_[A-Z0-9_]{2,60}$/, "Değişken adı FEED_ ile başlamalı (ör. FEED_ORNEK_MAGAZA_URL)."),
      format: z.enum(["auto", "google-merchant", "yml", "csv", "json"]),
      currency: z.string().regex(/^[A-Z]{3}$/).default("TRY"),
      defaultShipping: z.string().optional(),
      freeShippingThreshold: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  const d = parsed.data;
  const slug = slugify(d.retailerName, 50);
  const retailer = await db.retailer.upsert({ where: { slug }, create: { slug, name: d.retailerName, websiteUrl: d.websiteUrl }, update: {} });
  const key = `feed-${slug}`;
  if (await db.dataSource.findUnique({ where: { key } })) return { error: "Bu mağaza için zaten bir feed kaynağı var." };
  const ship = d.defaultShipping ? parsePriceToMinor(d.defaultShipping, d.currency) : null;
  const free = d.freeShippingThreshold ? parsePriceToMinor(d.freeShippingThreshold, d.currency) : null;
  const created = await db.dataSource.create({
    data: {
      key,
      name: d.name,
      kind: "RETAIL",
      adapter: "product-feed",
      status: secretFromEnvSafe(d.feedUrlEnv) ? "CONNECTED" : "AWAITING_CREDENTIALS",
      retailerId: retailer.id,
      refreshIntervalMinutes: 180,
      fullSyncIntervalMinutes: 1440,
      freshnessWindowMinutes: 720,
      config: { feedUrlEnv: d.feedUrlEnv, format: d.format, currency: d.currency, defaultShippingMinor: ship, freeShippingThresholdMinor: free },
      notes: "Yönetim panelinden eklenen yetkili ürün feed'i.",
    },
  });
  await ensureSchedules(db);
  await audit(db, { actorId: u.id, action: "source.create", entityType: "DataSource", entityId: created.id, after: { key, feedUrlEnv: d.feedUrlEnv, format: d.format } });
  redirect(`/admin/kaynaklar/${created.id}`);
}

// ───────────────────────────── Görevler ─────────────────────────────

export async function retryJob(jobId: string) {
  const u = await requireStaff("ADMIN");
  const newId = await retryJobManually(db, id.parse(jobId), u.id);
  await audit(db, { actorId: u.id, action: "job.retry", entityType: "IngestionJob", entityId: jobId, after: { newJobId: newId } });
  refresh();
}

export async function cancelJob(jobId: string) {
  const u = await requireStaff("ADMIN");
  await db.ingestionJob.updateMany({ where: { id: id.parse(jobId), status: "QUEUED" }, data: { status: "CANCELLED", finishedAt: new Date() } });
  await audit(db, { actorId: u.id, action: "job.cancel", entityType: "IngestionJob", entityId: jobId });
  refresh();
}

export async function updateSchedule(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z.object({ scheduleId: id, intervalMinutes: z.coerce.number().int().min(5).max(43200), isEnabled: z.enum(["on"]).optional() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Geçersiz değer." };
  const s = await db.jobSchedule.findUniqueOrThrow({ where: { id: parsed.data.scheduleId } });
  await db.jobSchedule.update({ where: { id: s.id }, data: { intervalMinutes: parsed.data.intervalMinutes, isEnabled: parsed.data.isEnabled === "on" } });
  // Kaynak zamanlamaları kaynak ayarlarından da yönetilir; tutarlılık için kaynağa yansıt.
  if (s.dataSourceId) {
    const field = s.type === "retail.full-sync" ? "fullSyncIntervalMinutes" : "refreshIntervalMinutes";
    await db.dataSource.update({ where: { id: s.dataSourceId }, data: { [field]: parsed.data.intervalMinutes } });
  }
  await audit(db, { actorId: u.id, action: "schedule.update", entityType: "JobSchedule", entityId: s.id, before: { intervalMinutes: s.intervalMinutes, isEnabled: s.isEnabled }, after: parsed.data });
  refresh();
  return { ok: true, message: "Zamanlama güncellendi." };
}

export async function runScheduleNow(scheduleId: string) {
  const u = await requireStaff("ADMIN");
  const s = await db.jobSchedule.findUniqueOrThrow({ where: { id: id.parse(scheduleId) } });
  await enqueueJob(db, { type: s.type, dataSourceId: s.dataSourceId, payload: s.payload as Record<string, unknown>, trigger: "MANUAL", priority: 10, triggeredById: u.id, dedupeKey: `manual:${s.key}:${Date.now()}` });
  await audit(db, { actorId: u.id, action: "schedule.run", entityType: "JobSchedule", entityId: s.id });
  refresh();
}

// ───────────────────────────── Fırsat puanı ─────────────────────────────

export async function saveScoring(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const weights: Record<string, number> = {};
  for (const k of Object.keys(DEFAULT_SCORING.weights)) weights[k] = Number(fd.get(`w_${k}`));
  const thresholds: Record<string, number> = {};
  for (const k of Object.keys(DEFAULT_SCORING.thresholds)) thresholds[k] = Number(fd.get(`t_${k}`));
  const merged = mergeScoringConfig({ version: 0, weights, thresholds });
  if (Object.values(merged.weights).reduce((a, b) => a + b, 0) <= 0) return { error: "Ağırlıkların toplamı sıfırdan büyük olmalı." };
  const last = await db.scoringConfig.findFirst({ orderBy: { version: "desc" } });
  const version = (last?.version ?? 0) + 1;
  await db.$transaction([
    db.scoringConfig.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    db.scoringConfig.create({ data: { version, weights: merged.weights, thresholds: merged.thresholds, isActive: true, note: String(fd.get("note") ?? "").slice(0, 300) || null, createdById: u.id } }),
  ]);
  invalidateScoringConfigCache();
  await enqueueJob(db, { type: "scores.recompute-all", trigger: "MANUAL", priority: 8, triggeredById: u.id, dedupeKey: `scoring:v${version}` });
  await audit(db, { actorId: u.id, action: "scoring.update", entityType: "ScoringConfig", entityId: String(version), before: last ? { weights: last.weights, thresholds: last.thresholds } : null, after: merged });
  refresh();
  return { ok: true, message: `Sürüm ${version} etkinleştirildi. Tüm puanlar arka planda yeniden hesaplanıyor.` };
}

export async function activateScoringVersion(version: number) {
  const u = await requireStaff("ADMIN");
  await db.$transaction([db.scoringConfig.updateMany({ where: { isActive: true }, data: { isActive: false } }), db.scoringConfig.update({ where: { version }, data: { isActive: true } })]);
  invalidateScoringConfigCache();
  await enqueueJob(db, { type: "scores.recompute-all", trigger: "MANUAL", priority: 8, triggeredById: u.id, dedupeKey: `scoring:activate:${version}:${Date.now()}` });
  await audit(db, { actorId: u.id, action: "scoring.activate", entityType: "ScoringConfig", entityId: String(version) });
  refresh();
}

// ───────────────────────────── Kategoriler ─────────────────────────────

export async function upsertCategory(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z
    .object({
      categoryId: z.string().optional(),
      name: z.string().trim().min(2).max(80),
      slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/),
      parentId: z.string().optional(),
      icon: z.string().max(30).optional(),
      keywords: z.string().max(2000).optional(),
      description: z.string().max(500).optional(),
      sortOrder: z.coerce.number().int().min(0).max(999).default(0),
      filterSchema: z.string().max(5000).optional(),
      isActive: z.enum(["on"]).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `Form geçersiz: ${parsed.error.issues[0]?.path.join(".")}` };
  const d = parsed.data;
  let filterSchema: unknown = [];
  try {
    filterSchema = d.filterSchema ? JSON.parse(d.filterSchema) : [];
    if (!Array.isArray(filterSchema)) throw new Error();
  } catch {
    return { error: "Filtre şeması bir JSON dizisi olmalı." };
  }
  const data = {
    name: d.name,
    slug: d.slug,
    parentId: d.parentId || null,
    icon: d.icon || null,
    keywords: (d.keywords ?? "").split(",").map((k) => normalizeText(k)).filter(Boolean),
    description: d.description || null,
    sortOrder: d.sortOrder,
    filterSchema: filterSchema as Prisma.InputJsonValue,
    isActive: d.isActive === "on",
  };
  if (d.categoryId) {
    if (d.parentId === d.categoryId) return { error: "Kategori kendisinin üstü olamaz." };
    const before = await db.category.findUnique({ where: { id: d.categoryId } });
    await db.category.update({ where: { id: d.categoryId }, data });
    await audit(db, { actorId: u.id, action: "category.update", entityType: "Category", entityId: d.categoryId, before, after: data });
  } else {
    const c = await db.category.create({ data });
    await audit(db, { actorId: u.id, action: "category.create", entityType: "Category", entityId: c.id, after: data });
  }
  invalidateCategoryCache();
  revalidateTag("categories", "max");
  refresh();
  return { ok: true, message: "Kategori kaydedildi." };
}

export async function addCategoryMapping(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z.object({ pattern: z.string().trim().min(2).max(120), categoryId: id, dataSourceKey: z.string().max(60).optional(), priority: z.coerce.number().int().min(0).max(100).default(10) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Form geçersiz." };
  const m = await db.categoryMapping.create({ data: { pattern: normalizeText(parsed.data.pattern), categoryId: parsed.data.categoryId, dataSourceKey: parsed.data.dataSourceKey || null, priority: parsed.data.priority } }).catch(() => null);
  if (!m) return { error: "Bu eşleme zaten var." };
  invalidateCategoryCache();
  await audit(db, { actorId: u.id, action: "category.mapping.add", entityType: "CategoryMapping", entityId: m.id, after: parsed.data });
  refresh();
  return { ok: true, message: "Eşleme eklendi. Yeni gelen kayıtlar bu kurala göre sınıflandırılır." };
}

export async function deleteCategoryMapping(mappingId: string) {
  const u = await requireStaff("ADMIN");
  await db.categoryMapping.delete({ where: { id: id.parse(mappingId) } });
  invalidateCategoryCache();
  await audit(db, { actorId: u.id, action: "category.mapping.delete", entityType: "CategoryMapping", entityId: mappingId });
  refresh();
}

// ───────────────────────────── Kuponlar ─────────────────────────────

export async function upsertCoupon(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("EDITOR");
  const parsed = z
    .object({
      couponId: z.string().optional(),
      retailerId: id,
      code: z.string().trim().max(60).optional(),
      title: z.string().trim().min(2).max(160),
      description: z.string().max(1000).optional(),
      conditionType: z.enum(["PUBLIC", "MEMBERSHIP", "PAYMENT_METHOD", "MIN_BASKET", "COUPON_CODE", "CASHBACK"]),
      discountType: z.enum(["", "PERCENT", "AMOUNT"]).optional(),
      discountValue: z.string().optional(),
      minBasket: z.string().optional(),
      maxDiscount: z.string().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      categorySlugs: z.string().max(500).optional(),
      restrictions: z.string().max(1000).optional(),
      stackable: z.enum(["", "yes", "no"]).optional(),
      verificationStatus: z.enum(["UNVERIFIED", "VERIFIED", "FAILED", "EXPIRED"]),
      sourceUrl: z.string().max(1000).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `Form geçersiz: ${parsed.error.issues[0]?.path.join(".")}` };
  const d = parsed.data;
  const discountValue = d.discountType === "PERCENT" ? Math.round(Number((d.discountValue ?? "").replace(",", ".")) * 100) : d.discountType === "AMOUNT" ? parsePriceToMinor(d.discountValue ?? "") : null;
  if (d.discountType && (!discountValue || discountValue <= 0)) return { error: "İndirim değeri geçersiz." };
  if (d.discountType === "PERCENT" && discountValue! > 9000) return { error: "Yüzde indirim %90'ı aşamaz." };
  const data = {
    retailerId: d.retailerId,
    code: d.code || null,
    title: d.title,
    description: d.description || null,
    conditionType: d.conditionType,
    discountType: d.discountType || null,
    discountValue,
    minBasketMinor: d.minBasket ? parsePriceToMinor(d.minBasket) : null,
    maxDiscountMinor: d.maxDiscount ? parsePriceToMinor(d.maxDiscount) : null,
    validFrom: d.validFrom ? new Date(d.validFrom) : null,
    validUntil: d.validUntil ? new Date(`${d.validUntil}T23:59:59+03:00`) : null,
    categorySlugs: (d.categorySlugs ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    restrictions: d.restrictions || null,
    stackable: d.stackable === "yes" ? true : d.stackable === "no" ? false : null,
    verificationStatus: d.verificationStatus,
    verifiedAt: d.verificationStatus === "VERIFIED" ? new Date() : null,
    lastCheckedAt: new Date(),
    sourceUrl: d.sourceUrl || null,
    isActive: true,
  };
  if (d.couponId) {
    const before = await db.coupon.findUnique({ where: { id: d.couponId } });
    await db.coupon.update({ where: { id: d.couponId }, data });
    await audit(db, { actorId: u.id, action: "coupon.update", entityType: "Coupon", entityId: d.couponId, before, after: data });
  } else {
    const c = await db.coupon.create({ data });
    await audit(db, { actorId: u.id, action: "coupon.create", entityType: "Coupon", entityId: c.id, after: data });
  }
  // Kupon fiyat hesabını etkileyebilir: ilgili mağazanın ürünleri yeniden puanlanır
  const products = await db.offer.findMany({ where: { retailerId: d.retailerId, status: "ACTIVE" }, select: { productId: true }, distinct: ["productId"] });
  await recomputeProducts(db, products.map((p) => p.productId));
  refresh();
  return { ok: true, message: "Kupon kaydedildi; ilgili ürünlerin puanları güncellendi." };
}

export async function deactivateCoupon(couponId: string) {
  const u = await requireStaff("EDITOR");
  const c = await db.coupon.update({ where: { id: id.parse(couponId) }, data: { isActive: false } });
  const products = await db.offer.findMany({ where: { retailerId: c.retailerId, status: "ACTIVE" }, select: { productId: true }, distinct: ["productId"] });
  await recomputeProducts(db, products.map((p) => p.productId));
  await audit(db, { actorId: u.id, action: "coupon.deactivate", entityType: "Coupon", entityId: couponId });
  refresh();
}

// ───────────────────────────── Editoryal ─────────────────────────────

export async function upsertEditorial(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("EDITOR");
  const parsed = z
    .object({
      contentId: z.string().optional(),
      type: z.enum(["DAILY_PICKS", "WEEKLY_PICKS", "GUIDE", "COMPARISON", "FLIGHT_TIPS", "CAMPAIGN_NOTE"]),
      title: z.string().trim().min(3).max(160),
      slug: z.string().trim().regex(/^[a-z0-9-]{3,100}$/),
      summary: z.string().trim().min(10).max(500),
      body: z.string().max(30000).optional(),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      items: z.string().max(5000).optional(),
      seoTitle: z.string().max(160).optional(),
      seoDescription: z.string().max(300).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `Form geçersiz: ${parsed.error.issues[0]?.path.join(".")}` };
  const d = parsed.data;
  // Satır biçimi: "urun-slug | not"  veya  "rota:IST-AYT | not"
  const lines = (d.items ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40);
  const items: Prisma.EditorialItemCreateManyContentInput[] = [];
  for (const [i, line] of lines.entries()) {
    const [ref, ...noteParts] = line.split("|");
    const note = noteParts.join("|").trim() || null;
    const r = ref.trim();
    const route = r.match(/^rota:([A-Z]{3})-([A-Z]{3})$/i);
    if (route) items.push({ routeOrigin: route[1].toUpperCase(), routeDestination: route[2].toUpperCase(), note, sortOrder: i });
    else {
      const p = await db.product.findUnique({ where: { slug: r }, select: { id: true, bestOfferId: true } });
      if (!p) return { error: `Ürün bulunamadı: ${r}` };
      items.push({ productId: p.id, offerId: p.bestOfferId, note, sortOrder: i });
    }
  }
  const data = {
    type: d.type,
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    body: d.body ?? "",
    status: d.status,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
  };
  let contentId = d.contentId;
  if (contentId) {
    const before = await db.editorialContent.findUnique({ where: { id: contentId } });
    await db.editorialContent.update({ where: { id: contentId }, data: { ...data, publishedAt: d.status === "PUBLISHED" ? (before?.publishedAt ?? new Date()) : before?.publishedAt } });
    await db.editorialItem.deleteMany({ where: { contentId } });
    await audit(db, { actorId: u.id, action: "editorial.update", entityType: "EditorialContent", entityId: contentId, before, after: data });
  } else {
    const c = await db.editorialContent.create({ data: { ...data, authorId: u.id, publishedAt: d.status === "PUBLISHED" ? new Date() : null } });
    contentId = c.id;
    await audit(db, { actorId: u.id, action: "editorial.create", entityType: "EditorialContent", entityId: c.id, after: data });
  }
  if (items.length) await db.editorialItem.createMany({ data: items.map((it) => ({ ...it, contentId: contentId! })) });
  redirect(`/admin/icerik/${contentId}?kaydedildi=1`);
}

// ───────────────────────────── Uçuş rotaları ─────────────────────────────

export async function addRoute(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z
    .object({ origin: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/), destination: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/), tags: z.string().max(300).optional(), isInternational: z.enum(["on"]).optional(), lookaheadDays: z.coerce.number().int().min(7).max(360).default(90) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success || parsed.data.origin === parsed.data.destination) return { error: "Geçerli iki farklı IATA kodu girin." };
  const r = await db.flightRoute
    .create({ data: { origin: parsed.data.origin, destination: parsed.data.destination, tags: (parsed.data.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean), isInternational: parsed.data.isInternational === "on", lookaheadDays: parsed.data.lookaheadDays } })
    .catch(() => null);
  if (!r) return { error: "Bu rota zaten var." };
  await audit(db, { actorId: u.id, action: "route.create", entityType: "FlightRoute", entityId: r.id, after: parsed.data });
  refresh();
  return { ok: true, message: "Rota eklendi; bir sonraki rota güncellemesinde fiyatları çekilecek." };
}

export async function toggleRoute(routeId: string) {
  const u = await requireStaff("ADMIN");
  const r = await db.flightRoute.findUniqueOrThrow({ where: { id: id.parse(routeId) } });
  await db.flightRoute.update({ where: { id: r.id }, data: { isActive: !r.isActive } });
  await audit(db, { actorId: u.id, action: "route.toggle", entityType: "FlightRoute", entityId: r.id, after: { isActive: !r.isActive } });
  refresh();
}

// ───────────────────────────── Sponsorlu ve mağazalar ─────────────────────────────

export async function addPlacement(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z.object({ productSlug: z.string().trim(), sponsorName: z.string().trim().min(2).max(80), slot: z.string().trim().max(60).default("home"), startsAt: z.string(), endsAt: z.string() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Form geçersiz." };
  const p = await db.product.findUnique({ where: { slug: parsed.data.productSlug } });
  if (!p) return { error: "Ürün bulunamadı." };
  const placement = await db.sponsoredPlacement.create({ data: { productId: p.id, offerId: p.bestOfferId, sponsorName: parsed.data.sponsorName, slot: parsed.data.slot, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt) } });
  if (p.bestOfferId) await db.offer.update({ where: { id: p.bestOfferId }, data: { isSponsored: true } });
  await audit(db, { actorId: u.id, action: "sponsored.create", entityType: "SponsoredPlacement", entityId: placement.id, after: parsed.data });
  refresh();
  return { ok: true, message: "Sponsorlu yerleşim eklendi. Ürün “Sponsorlu” olarak işaretlenir; fırsat puanı etkilenmez." };
}

export async function endPlacement(placementId: string) {
  const u = await requireStaff("ADMIN");
  const pl = await db.sponsoredPlacement.update({ where: { id: id.parse(placementId) }, data: { isActive: false, endsAt: new Date() } });
  if (pl.offerId) {
    const others = await db.sponsoredPlacement.count({ where: { offerId: pl.offerId, isActive: true } });
    if (others === 0) await db.offer.update({ where: { id: pl.offerId }, data: { isSponsored: false } });
  }
  await audit(db, { actorId: u.id, action: "sponsored.end", entityType: "SponsoredPlacement", entityId: placementId });
  refresh();
}

export async function updateRetailerAffiliate(_: AdminResult, fd: FormData): Promise<AdminResult> {
  const u = await requireStaff("ADMIN");
  const parsed = z
    .object({ retailerId: id, affiliateEnabled: z.enum(["on"]).optional(), affiliateProgram: z.string().max(120).optional(), param: z.string().regex(/^[a-zA-Z0-9_]{0,30}$/).optional(), value: z.string().max(120).optional(), shippingNote: z.string().max(200).optional() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Form geçersiz." };
  const d = parsed.data;
  if (d.affiliateEnabled === "on" && !d.affiliateProgram) return { error: "Satış ortaklığını etkinleştirmek için onaylı programın adını girin." };
  const before = await db.retailer.findUniqueOrThrow({ where: { id: d.retailerId } });
  const data = {
    affiliateEnabled: d.affiliateEnabled === "on",
    affiliateProgram: d.affiliateProgram || null,
    affiliateConfig: d.param && d.value ? ({ type: "query", param: d.param, value: d.value } as Prisma.InputJsonValue) : undefined,
    shippingNote: d.shippingNote || null,
  };
  await db.retailer.update({ where: { id: d.retailerId }, data });
  await audit(db, { actorId: u.id, action: "retailer.affiliate", entityType: "Retailer", entityId: d.retailerId, before: { affiliateEnabled: before.affiliateEnabled, affiliateConfig: before.affiliateConfig }, after: data });
  refresh();
  return { ok: true, message: "Mağaza ayarları kaydedildi." };
}

// ───────────────────────────── Kullanıcılar ─────────────────────────────

export async function setUserRole(userId: string, role: "USER" | "EDITOR" | "ADMIN") {
  const u = await requireStaff("ADMIN");
  if (userId === u.id) return; // kendi yetkisini düşürmeyi engelle
  const before = await db.user.findUniqueOrThrow({ where: { id: id.parse(userId) }, select: { role: true } });
  await db.user.update({ where: { id: userId }, data: { role } });
  await db.session.deleteMany({ where: { userId } }); // yetki değişince oturumları yenilemeye zorla
  await audit(db, { actorId: u.id, action: "user.role", entityType: "User", entityId: userId, before, after: { role } });
  refresh();
}
