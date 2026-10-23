/**
 * Travelpayouts — Aviasales Data API adaptörü.
 *
 * Doğrulanan bilgiler (Travelpayouts yardım merkezi, Ağustos 2026 güncellemesi):
 *  - Erişim: Travelpayouts'a ücretsiz kayıt sonrası profildeki API token ile (X-Access-Token başlığı).
 *  - Veri, Aviasales kullanıcılarının son 48 saatteki aramalarından gelen ÖNBELLEK fiyatlarıdır
 *    (2–7 gün saklanır). Anlık rezervasyon fiyatı DEĞİLDİR; "gösterge fiyat" olarak sunulur.
 *  - v3/prices_for_dates: belirli tarih/ay için en ucuz biletler.
 *  - v3/grouped_prices: ay içindeki her gün için en ucuz bilet (takvim).
 *  - `link` alanı https://www.aviasales.com adresine eklenerek arama sonucu açılır.
 *  - Bagaj ve vergi dâhil olma bilgisi API'de belirtilmez → "bilinmiyor" gösterilir.
 *
 * Ortam değişkenleri: TRAVELPAYOUTS_TOKEN, (isteğe bağlı) TRAVELPAYOUTS_MARKER
 */

import { toMinor } from "@/lib/money";
import { HOUR } from "@/lib/time";
import { type AdapterContext, type FlightAdapter, IntegrationError, type NormalizedFlightOffer } from "../types";

type TpConfig = { tokenEnv?: string; markerEnv?: string; market?: string; currency?: string; linkBase?: string };

type TpTicket = {
  origin: string;
  destination: string;
  origin_airport?: string;
  destination_airport?: string;
  price: number;
  airline?: string;
  flight_number?: string | number;
  departure_at: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  link?: string;
};

function conf(c: Record<string, unknown>): Required<TpConfig> {
  const x = c as TpConfig;
  return {
    tokenEnv: x.tokenEnv ?? "TRAVELPAYOUTS_TOKEN",
    markerEnv: x.markerEnv ?? "TRAVELPAYOUTS_MARKER",
    market: x.market ?? "tr",
    currency: (x.currency ?? "try").toLowerCase(),
    linkBase: x.linkBase ?? "https://www.aviasales.com",
  };
}

function buildLink(ctx: AdapterContext, link: string | undefined): { url: string | null; affiliate: boolean } {
  if (!link) return { url: null, affiliate: false };
  const c = conf(ctx.source.config);
  let url: URL;
  try {
    url = new URL(link, c.linkBase);
  } catch {
    return { url: null, affiliate: false };
  }
  if (url.protocol !== "https:") return { url: null, affiliate: false };
  const marker = ctx.secret(c.markerEnv);
  if (marker) url.searchParams.set("marker", marker);
  return { url: url.toString(), affiliate: Boolean(marker) };
}

export function mapTpTicket(ctx: AdapterContext, t: TpTicket, opts: { currency: string; oneWay: boolean; passengers: number }): NormalizedFlightOffer | null {
  if (!t || typeof t.price !== "number" || t.price <= 0 || !t.departure_at) return null;
  const departAt = new Date(t.departure_at);
  if (Number.isNaN(departAt.getTime())) return null;
  const returnAt = t.return_at ? new Date(t.return_at) : null;
  const currency = opts.currency.toUpperCase();
  const { url, affiliate } = buildLink(ctx, t.link);
  const oneWay = opts.oneWay || !returnAt;
  return {
    externalKey: [t.origin_airport ?? t.origin, t.destination_airport ?? t.destination, t.departure_at, t.return_at ?? "", t.airline ?? "", t.flight_number ?? "", oneWay ? "ow" : "rt"].join("|"),
    origin: t.origin,
    destination: t.destination,
    originAirport: t.origin_airport ?? t.origin,
    destinationAirport: t.destination_airport ?? t.destination,
    departAt,
    arriveAt: null,
    returnAt: oneWay ? null : returnAt,
    oneWay,
    airlineCode: t.airline ?? null,
    flightNumber: t.flight_number !== undefined ? String(t.flight_number) : null,
    stops: t.transfers ?? 0,
    returnStops: oneWay ? null : (t.return_transfers ?? null),
    durationMinutes: t.duration ?? null,
    durationOutMinutes: t.duration_to ?? (oneWay ? (t.duration ?? null) : null),
    durationBackMinutes: oneWay ? null : (t.duration_back ?? null),
    cabin: "ECONOMY",
    passengers: opts.passengers,
    currency,
    priceMinor: toMinor(t.price, currency),
    priceKind: "CACHED_INDICATIVE",
    priceIncludesTaxes: null,
    baggageIncluded: null,
    baggageInfo: null,
    fareConditions: null,
    deepLink: url,
    isAffiliateLink: affiliate,
    foundAt: null,
    expiresAt: new Date(ctx.now.getTime() + 12 * HOUR),
  };
}

async function call<T>(ctx: AdapterContext, path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const c = conf(ctx.source.config);
  const token = ctx.secret(c.tokenEnv);
  if (!token) throw new IntegrationError("NOT_CONFIGURED", "Travelpayouts token tanımlı değil", { retryable: false });
  const url = new URL(`https://api.travelpayouts.com${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
  const res = await ctx.http.json<{ success?: boolean; data?: T; error?: string }>(url.toString(), {
    headers: { "x-access-token": token, accept: "application/json", "accept-encoding": "gzip" },
  });
  if (res.success === false) throw new IntegrationError("UPSTREAM", `Travelpayouts hata: ${res.error ?? "bilinmiyor"}`, { retryable: false });
  if (res.data === undefined) throw new IntegrationError("FORMAT", "Travelpayouts yanıtında data alanı yok", { retryable: false });
  return res.data;
}

function monthOf(date: string): string {
  return date.slice(0, 7);
}

export const travelpayoutsAdapter: FlightAdapter = {
  key: "travelpayouts",
  displayName: "Travelpayouts (Aviasales Data API)",
  description: "Aviasales kullanıcılarının son 48 saatte bulduğu önbellek fiyatları. Rota keşfi ve fiyat takvimi için uygundur.",
  docsUrl: "https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API",
  capabilities: { liveSearch: false, cachedRouteDeals: true, flexibleDates: true, baggageInfo: false, bookingLinks: true, priceIncludesTaxes: null },
  priceNote:
    "Gösterge fiyattır: Aviasales kullanıcılarının son 48 saatte bulduğu en düşük fiyattan alınır. Satış sayfasındaki güncel fiyat, vergi/harç ve bagaj koşulları farklı olabilir.",

  checkConfiguration(source, secret) {
    const c = conf(source.config);
    if (!secret(c.tokenEnv)) {
      return {
        ok: false,
        status: "AWAITING_CREDENTIALS",
        missing: [c.tokenEnv],
        message: "Travelpayouts hesabı açıp profildeki API token'ı TRAVELPAYOUTS_TOKEN değişkenine girin. Satış ortaklığı için TRAVELPAYOUTS_MARKER isteğe bağlıdır.",
      };
    }
    return { ok: true, status: "CONNECTED", missing: [], message: "Token tanımlı." };
  },

  async search(ctx, q) {
    const c = conf(ctx.source.config);
    let requests = 0;
    const offers: NormalizedFlightOffer[] = [];
    const oneWay = !q.returnDate;
    if (q.flexDays > 0) {
      // Esnek tarih: ayın gün gün en ucuz fiyatları, sonra ±flexDays süzgeci
      const months = new Set([monthOf(q.departDate)]);
      const d = new Date(`${q.departDate}T00:00:00Z`);
      months.add(monthOf(new Date(d.getTime() - q.flexDays * 86400000).toISOString()));
      months.add(monthOf(new Date(d.getTime() + q.flexDays * 86400000).toISOString()));
      for (const m of months) {
        const data = await call<Record<string, TpTicket>>(ctx, "/aviasales/v3/grouped_prices", {
          origin: q.origin,
          destination: q.destination,
          departure_at: m,
          group_by: "departure_at",
          direct: q.directOnly,
          currency: c.currency,
          market: c.market,
          ...(oneWay
            ? {}
            : {
                min_trip_duration: Math.max(1, daysBetween(q.departDate, q.returnDate!) - q.flexDays),
                max_trip_duration: daysBetween(q.departDate, q.returnDate!) + q.flexDays,
              }),
        });
        requests++;
        for (const t of Object.values(data ?? {})) {
          const o = mapTpTicket(ctx, t, { currency: c.currency, oneWay, passengers: q.adults });
          if (o && Math.abs(daysBetween(q.departDate, o.departAt.toISOString().slice(0, 10))) <= q.flexDays) offers.push(o);
        }
      }
    } else {
      const data = await call<TpTicket[]>(ctx, "/aviasales/v3/prices_for_dates", {
        origin: q.origin,
        destination: q.destination,
        departure_at: q.departDate,
        return_at: q.returnDate ?? undefined,
        one_way: oneWay,
        direct: q.directOnly,
        sorting: "price",
        currency: c.currency,
        market: c.market,
        limit: 30,
      });
      requests++;
      for (const t of data ?? []) {
        const o = mapTpTicket(ctx, t, { currency: c.currency, oneWay, passengers: q.adults });
        if (o) offers.push(o);
      }
    }
    return { offers, requests };
  },

  async routeDeals(ctx, route, opts) {
    const c = conf(ctx.source.config);
    let requests = 0;
    const offers: NormalizedFlightOffer[] = [];
    for (const month of opts.months) {
      const data = await call<Record<string, TpTicket>>(ctx, "/aviasales/v3/grouped_prices", {
        origin: route.origin,
        destination: route.destination,
        departure_at: month,
        group_by: "departure_at",
        currency: c.currency,
        market: c.market,
        ...(opts.oneWay ? {} : { min_trip_duration: 2, max_trip_duration: 7 }),
      });
      requests++;
      for (const t of Object.values(data ?? {})) {
        const o = mapTpTicket(ctx, t, { currency: c.currency, oneWay: opts.oneWay, passengers: 1 });
        if (o && o.departAt > ctx.now) offers.push(o);
      }
    }
    return { offers, requests };
  },
};

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86400000);
}
