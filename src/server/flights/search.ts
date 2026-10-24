import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { DAY, MINUTE } from "@/lib/time";
import { db } from "../db";
import { upsertFlightOffers } from "../ingestion/flights";
import { toSourceRecord } from "../ingestion/retail";
import { recordUsage } from "../ingestion/usage";
import { createHttpClient, type UsageCounter } from "../integrations/http";
import { getFlightAdapter } from "../integrations/registry";
import { IntegrationError, type FlightSearchQuery } from "../integrations/types";
import { secretFromEnvSafe } from "../secrets";
import { includeTestData } from "../visibility";

const iata = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const flightQuerySchema = z
  .object({
    from: iata,
    to: iata,
    depart: date,
    return: date.optional().or(z.literal("").transform(() => undefined)),
    adults: z.coerce.number().int().min(1).max(9).default(1),
    cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
    direct: z.enum(["1"]).optional(),
    flex: z.coerce.number().int().min(0).max(3).default(0),
  })
  .refine((q) => q.from !== q.to, { message: "Kalkış ve varış aynı olamaz." });

export type FlightQueryInput = z.infer<typeof flightQuerySchema>;

export function toAdapterQuery(q: FlightQueryInput): FlightSearchQuery {
  return { origin: q.from, destination: q.to, departDate: q.depart, returnDate: q.return ?? null, adults: q.adults, cabin: q.cabin, directOnly: q.direct === "1", flexDays: q.flex };
}

export function validateDates(q: FlightQueryInput, now = new Date()): string | null {
  const today = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  const d = Date.parse(`${q.depart}T00:00:00Z`);
  if (d < today) return "Gidiş tarihi geçmişte olamaz.";
  if (d > today + 360 * DAY) return "En fazla 1 yıl sonrası için arama yapılabilir.";
  if (q.return) {
    const r = Date.parse(`${q.return}T00:00:00Z`);
    if (r < d) return "Dönüş tarihi gidişten önce olamaz.";
  }
  return null;
}

export type ProviderStatus = { key: string; name: string; ok: boolean; message: string | null; kind: "live" | "cached" | "test"; priceNote: string };

export async function searchFlights(q: FlightQueryInput, now = new Date()) {
  const query = toAdapterQuery(q);
  const searchKey = createHash("sha256").update(JSON.stringify(query)).digest("hex").slice(0, 32);
  const sources = await db.dataSource.findMany({
    where: { kind: "FLIGHT", isEnabled: true, status: { not: "DISABLED" }, ...(includeTestData() ? {} : { isTestData: false }) },
    orderBy: { isTestData: "asc" },
  });
  const providers: ProviderStatus[] = [];
  const cacheCutoff = new Date(now.getTime() - 15 * MINUTE);

  for (const s of sources) {
    const adapter = getFlightAdapter(s.adapter);
    if (!adapter) continue;
    const record = toSourceRecord(s);
    const check = adapter.checkConfiguration(record, secretFromEnvSafe);
    const kind = s.isTestData ? "test" : adapter.capabilities.liveSearch ? "live" : "cached";
    if (!check.ok) {
      providers.push({ key: s.key, name: adapter.displayName, ok: false, message: check.message, kind, priceNote: adapter.priceNote });
      continue;
    }
    const cached = await db.flightOffer.count({ where: { dataSourceId: s.id, searchKey, checkedAt: { gte: cacheCutoff } } });
    if (cached > 0) {
      providers.push({ key: s.key, name: adapter.displayName, ok: true, message: null, kind, priceNote: adapter.priceNote });
      continue;
    }
    const usage: UsageCounter = { requests: 0, errors: 0, rateLimited: 0 };
    try {
      const http = createHttpClient({ key: s.key, rateLimitPerMinute: s.rateLimitPerMinute, usage, maxRetries: 1, defaultTimeoutMs: 25_000 });
      const { offers } = await adapter.search({ source: record, http, log: () => {}, secret: secretFromEnvSafe, now }, query);
      await upsertFlightOffers(db, offers, s.id, null, now, searchKey);
      providers.push({ key: s.key, name: adapter.displayName, ok: true, message: offers.length ? null : "Bu arama için sağlayıcıda sonuç yok.", kind, priceNote: adapter.priceNote });
    } catch (err) {
      const msg = err instanceof IntegrationError ? `${err.message}` : "Sağlayıcıya ulaşılamadı.";
      providers.push({ key: s.key, name: adapter.displayName, ok: false, message: msg, kind, priceNote: adapter.priceNote });
    } finally {
      await recordUsage(db, s.id, usage, now).catch(() => {});
    }
  }

  const rows = await db.flightOffer.findMany({
    where: { searchKey, checkedAt: { gte: cacheCutoff }, isActive: true, expiresAt: { gt: now }, dataSource: { isEnabled: true, ...(includeTestData() ? {} : { isTestData: false }) } },
    include: { dataSource: { select: { key: true, name: true, isTestData: true } } },
    orderBy: { priceMinor: "asc" },
    take: 300,
  });
  return { offers: rows, providers, searchKey };
}

export type FlightResult = Awaited<ReturnType<typeof searchFlights>>["offers"][number];
