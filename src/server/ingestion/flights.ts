/**
 * Uçuş verisi toplama: yapılandırılmış rota listesi için sağlayıcıdan (önbellek/gösterge)
 * fiyatları çeker, FlightOffer kayıtlarını günceller, rota bazlı fiyat geçmişi yazar ve
 * uçuş alarmlarını değerlendirir. Sabit/uydurma fiyat yoktur: rota listesi yönetim panelinden
 * gelir, fiyatlar yalnızca sağlayıcıdan.
 */

import type { Prisma } from "@/generated/prisma/client";
import { DAY, HOUR } from "@/lib/time";
import type { Db } from "../db";
import { evaluateFlightAlerts } from "../alerts/flight-alerts";
import { createHttpClient, type UsageCounter } from "../integrations/http";
import { getFlightAdapter } from "../integrations/registry";
import { IntegrationError, type NormalizedFlightOffer } from "../integrations/types";
import type { JobContext } from "../jobs/context";
import { secretFromEnvSafe } from "../secrets";
import { markSourceFailure, toSourceRecord } from "./retail";
import { recordUsage, usageToday } from "./usage";

const FLIGHT_SNAPSHOT_HEARTBEAT_MS = 20 * HOUR;

export function nextMonths(now: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export function flightOfferData(o: NormalizedFlightOffer, sourceId: string, routeId: string | null, now: Date, searchKey: string | null) {
  return {
    dataSourceId: sourceId,
    routeId,
    externalKey: o.externalKey.slice(0, 400),
    origin: o.origin,
    destination: o.destination,
    originAirport: o.originAirport,
    destinationAirport: o.destinationAirport,
    departAt: o.departAt,
    returnAt: o.returnAt,
    oneWay: o.oneWay,
    airlineCode: o.airlineCode,
    flightNumber: o.flightNumber,
    stops: o.stops,
    returnStops: o.returnStops,
    durationMinutes: o.durationMinutes,
    durationOutMinutes: o.durationOutMinutes,
    durationBackMinutes: o.durationBackMinutes,
    cabin: o.cabin,
    passengers: o.passengers,
    currency: o.currency,
    priceMinor: o.priceMinor,
    priceKind: o.priceKind,
    priceIncludesTaxes: o.priceIncludesTaxes,
    baggageIncluded: o.baggageIncluded,
    baggageInfo: o.baggageInfo,
    fareConditions: o.fareConditions,
    deepLink: o.deepLink,
    isAffiliateLink: o.isAffiliateLink,
    searchKey,
    foundAt: o.foundAt,
    checkedAt: now,
    expiresAt: o.expiresAt,
    isActive: true,
  } satisfies Prisma.FlightOfferUncheckedCreateInput;
}

export async function upsertFlightOffers(db: Db, offers: NormalizedFlightOffer[], sourceId: string, routeId: string | null, now: Date, searchKey: string | null): Promise<string[]> {
  const ids: string[] = [];
  for (const o of offers) {
    if (!(o.priceMinor > 0) || Number.isNaN(o.departAt.getTime())) continue;
    const data = flightOfferData(o, sourceId, routeId, now, searchKey);
    const row = await db.flightOffer.upsert({
      where: { dataSourceId_externalKey: { dataSourceId: sourceId, externalKey: data.externalKey } },
      create: data,
      update: data,
      select: { id: true },
    });
    ids.push(row.id);
  }
  return ids;
}

export async function refreshFlightRoutes(db: Db, sourceId: string, ctx: JobContext): Promise<Record<string, unknown>> {
  const now = ctx.now;
  const source = await db.dataSource.findUnique({ where: { id: sourceId } });
  if (!source || source.kind !== "FLIGHT") throw new Error("Uçuş veri kaynağı bulunamadı");
  if (!source.isEnabled || source.status === "DISABLED") return { skipped: "Kaynak devre dışı" };
  const adapter = getFlightAdapter(source.adapter);
  if (!adapter) throw new IntegrationError("NOT_CONFIGURED", `Uçuş adaptörü yok: ${source.adapter}`, { retryable: false });
  const record = toSourceRecord(source);
  const check = adapter.checkConfiguration(record, secretFromEnvSafe);
  if (!check.ok) {
    await db.dataSource.update({ where: { id: source.id }, data: { status: check.status, lastRunAt: now, lastError: check.message } });
    ctx.log("WARN", `Kaynak çalıştırılmadı: ${check.message}`);
    return { skipped: check.message };
  }
  if (!adapter.capabilities.cachedRouteDeals) return { skipped: "Sağlayıcı rota taramasını desteklemiyor (yalnızca canlı arama)" };
  if (source.dailyQuota && (await usageToday(db, source.id, now)) >= source.dailyQuota) {
    ctx.log("WARN", "Günlük kota doldu");
    return { skipped: "Günlük kota doldu" };
  }

  const routes = await db.flightRoute.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const usage: UsageCounter = { requests: 0, errors: 0, rateLimited: 0 };
  const http = createHttpClient({ key: source.key, rateLimitPerMinute: source.rateLimitPerMinute, usage, signal: ctx.signal });
  const monthsAhead = Number((source.config as Record<string, unknown>)?.monthsAhead ?? 3);
  const months = nextMonths(now, Math.max(1, Math.min(monthsAhead, 12)));

  let offersSaved = 0;
  let routesOk = 0;
  let routesFailed = 0;
  let lastError: unknown = null;
  for (const route of routes) {
    if (ctx.signal?.aborted) break;
    try {
      const touched: string[] = [];
      for (const oneWay of [true, false]) {
        const { offers } = await adapter.routeDeals({ source: record, http, log: ctx.log, secret: secretFromEnvSafe, now, signal: ctx.signal }, route, { months, oneWay });
        const inWindow = offers.filter((o) => o.departAt.getTime() <= now.getTime() + route.lookaheadDays * DAY);
        touched.push(...(await upsertFlightOffers(db, inWindow, source.id, route.id, now, null)));
        await writeRouteSnapshots(db, route.id, source.id, inWindow, oneWay, now);
      }
      // Bu turda gelmeyen eski teklifler pasifleşir (geçmiş kayıt olarak kalır)
      await db.flightOffer.updateMany({ where: { routeId: route.id, dataSourceId: source.id, isActive: true, id: { notIn: touched } }, data: { isActive: false } });
      offersSaved += touched.length;
      routesOk++;
    } catch (err) {
      routesFailed++;
      lastError = err;
      ctx.log("ERROR", `Rota güncellenemedi: ${route.origin}-${route.destination}: ${(err as Error).message}`);
      if (err instanceof IntegrationError && ["AUTH", "NOT_CONFIGURED", "QUOTA_EXCEEDED"].includes(err.code)) break;
    }
  }
  await recordUsage(db, source.id, usage, now);
  await db.flightOffer.updateMany({ where: { dataSourceId: source.id, isActive: true, OR: [{ expiresAt: { lt: now } }, { departAt: { lt: now } }] }, data: { isActive: false } });

  if (routesOk === 0 && routesFailed > 0) {
    await markSourceFailure(db, source.id, lastError, now);
    throw lastError;
  }
  await db.dataSource.update({
    where: { id: source.id },
    data: {
      status: source.isTestData ? "TEST_ONLY" : "CONNECTED",
      lastRunAt: now,
      lastSuccessAt: now,
      lastError: routesFailed ? `${routesFailed} rota güncellenemedi` : null,
      consecutiveFailures: 0,
      lastItemsSeen: offersSaved,
      lastItemsUpdated: offersSaved,
    },
  });
  const alerts = await evaluateFlightAlerts(db, now);
  return { routes: routes.length, routesOk, routesFailed, offersSaved, requests: usage.requests, alertsTriggered: alerts.triggered };
}

async function writeRouteSnapshots(db: Db, routeId: string, sourceId: string, offers: NormalizedFlightOffer[], oneWay: boolean, now: Date) {
  const minByDay = new Map<string, { minor: number; currency: string }>();
  for (const o of offers) {
    if (o.oneWay !== oneWay) continue;
    const day = o.departAt.toISOString().slice(0, 10);
    const cur = minByDay.get(day);
    if (!cur || o.priceMinor < cur.minor) minByDay.set(day, { minor: o.priceMinor, currency: o.currency });
  }
  if (minByDay.size === 0) return;
  const days = [...minByDay.keys()].map((d) => new Date(`${d}T00:00:00Z`));
  const latest = await db.flightPriceSnapshot.findMany({
    where: { routeId, oneWay, departDate: { in: days } },
    orderBy: { checkedAt: "desc" },
    distinct: ["departDate"],
    select: { departDate: true, minPriceMinor: true, checkedAt: true },
  });
  const last = new Map(latest.map((l) => [l.departDate.toISOString().slice(0, 10), l]));
  const rows: Prisma.FlightPriceSnapshotCreateManyInput[] = [];
  for (const [day, v] of minByDay) {
    const prev = last.get(day);
    if (prev && prev.minPriceMinor === v.minor && now.getTime() - prev.checkedAt.getTime() < FLIGHT_SNAPSHOT_HEARTBEAT_MS) continue;
    rows.push({ routeId, departDate: new Date(`${day}T00:00:00Z`), oneWay, minPriceMinor: v.minor, currency: v.currency, checkedAt: now, dataSourceId: sourceId });
  }
  if (rows.length) await db.flightPriceSnapshot.createMany({ data: rows, skipDuplicates: true });
}
