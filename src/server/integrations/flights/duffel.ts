/**
 * Duffel adaptörü — canlı uçuş araması (Offer Requests).
 *
 * Doğrulanan bilgiler (duffel.com/pricing, Ekim 2026):
 *  - Kullandıkça öde: onaylanan sipariş başına 3 USD, Managed Content için sipariş tutarının %1'i,
 *    arama/rezervasyon oranı 1500:1'i aşan her arama için 0,005 USD, kur dönüşümünde %2.
 *  - Teklif fiyatı (total_amount) vergi ve harçları içerir; tax_amount ayrıca verilir.
 *  - Bagaj hakkı yolcu/segment bazında döner (baggages).
 *  - Duffel tüketiciye hazır bir "satın al" bağlantısı vermez; rezervasyon için kendi ödeme akışınız
 *    veya Duffel Links gibi bir ürün gerekir. Bu nedenle deepLink boş bırakılır.
 *
 * Arama başına maliyet riski nedeniyle bu adaptör yalnızca kullanıcı araması için çağrılır,
 * zamanlanmış rota taramasında kullanılmaz.
 *
 * Ortam değişkeni: DUFFEL_ACCESS_TOKEN (test anahtarı duffel_test_ ile başlar)
 */

import { parsePriceToMinor } from "@/lib/money";
import { type AdapterContext, type FlightAdapter, type FlightSearchQuery, IntegrationError, type NormalizedFlightOffer } from "../types";

type DuffelSegment = {
  departing_at: string;
  arriving_at: string;
  marketing_carrier?: { iata_code?: string };
  marketing_carrier_flight_number?: string;
  passengers?: { baggages?: { type: "checked" | "carry_on"; quantity: number }[] }[];
};
type DuffelSlice = { origin?: { iata_code?: string; iata_city_code?: string }; destination?: { iata_code?: string; iata_city_code?: string }; duration?: string; segments: DuffelSegment[] };
type DuffelOffer = {
  id: string;
  total_amount: string;
  total_currency: string;
  tax_amount?: string | null;
  expires_at?: string;
  owner?: { iata_code?: string; name?: string };
  slices: DuffelSlice[];
  conditions?: { refund_before_departure?: { allowed?: boolean } | null; change_before_departure?: { allowed?: boolean } | null };
};

export function isoDurationMinutes(d: string | undefined): number | null {
  if (!d) return null;
  const m = d.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

const CABIN: Record<FlightSearchQuery["cabin"], string> = { ECONOMY: "economy", PREMIUM_ECONOMY: "premium_economy", BUSINESS: "business", FIRST: "first" };

export function mapDuffelOffer(o: DuffelOffer, q: FlightSearchQuery, now: Date): NormalizedFlightOffer | null {
  const out = o.slices?.[0];
  if (!out?.segments?.length) return null;
  const back = o.slices[1];
  const priceMinor = parsePriceToMinor(o.total_amount, o.total_currency);
  if (priceMinor === null) return null;
  const first = out.segments[0];
  const last = out.segments[out.segments.length - 1];
  const bags = first.passengers?.[0]?.baggages ?? [];
  const checked = bags.filter((b) => b.type === "checked").reduce((s, b) => s + b.quantity, 0);
  const carry = bags.filter((b) => b.type === "carry_on").reduce((s, b) => s + b.quantity, 0);
  const conditions: string[] = [];
  if (o.conditions?.refund_before_departure) conditions.push(o.conditions.refund_before_departure.allowed ? "İade edilebilir (koşullu)" : "İade edilemez");
  if (o.conditions?.change_before_departure) conditions.push(o.conditions.change_before_departure.allowed ? "Değişiklik yapılabilir (koşullu)" : "Değişiklik yapılamaz");
  const outMin = isoDurationMinutes(out.duration);
  const backMin = back ? isoDurationMinutes(back.duration) : null;
  return {
    externalKey: `duffel|${o.id}`,
    origin: out.origin?.iata_city_code ?? q.origin,
    destination: out.destination?.iata_city_code ?? q.destination,
    originAirport: out.origin?.iata_code ?? q.origin,
    destinationAirport: out.destination?.iata_code ?? q.destination,
    departAt: new Date(first.departing_at),
    arriveAt: new Date(last.arriving_at),
    returnAt: back?.segments?.[0] ? new Date(back.segments[0].departing_at) : null,
    oneWay: !back,
    airlineCode: o.owner?.iata_code ?? first.marketing_carrier?.iata_code ?? null,
    flightNumber: first.marketing_carrier_flight_number ? `${first.marketing_carrier?.iata_code ?? ""}${first.marketing_carrier_flight_number}` : null,
    stops: out.segments.length - 1,
    returnStops: back ? back.segments.length - 1 : null,
    durationMinutes: outMin !== null ? outMin + (backMin ?? 0) : null,
    durationOutMinutes: outMin,
    durationBackMinutes: backMin,
    cabin: q.cabin,
    passengers: q.adults,
    currency: o.total_currency,
    priceMinor,
    priceKind: "LIVE_QUOTE",
    priceIncludesTaxes: true,
    baggageIncluded: bags.length ? checked > 0 : null,
    baggageInfo: bags.length ? `${checked} bagaj · ${carry} kabin bagajı (yolcu başına)` : null,
    fareConditions: conditions.length ? conditions.join(" · ") : null,
    deepLink: null,
    isAffiliateLink: false,
    foundAt: now,
    expiresAt: o.expires_at ? new Date(o.expires_at) : new Date(now.getTime() + 20 * 60_000),
  };
}

export const duffelAdapter: FlightAdapter = {
  key: "duffel",
  displayName: "Duffel (canlı arama)",
  description: "Havayolu tekliflerinin canlı araması. Fiyatlar vergi dâhil; bagaj ve ücret koşulları döner.",
  docsUrl: "https://duffel.com/docs/api/overview/welcome",
  capabilities: { liveSearch: true, cachedRouteDeals: false, flexibleDates: false, baggageInfo: true, bookingLinks: false, priceIncludesTaxes: true },
  priceNote: "Canlı teklif fiyatıdır ve vergi/harç içerir. Teklifler kısa süre geçerlidir; rezervasyon anında değişebilir.",

  checkConfiguration(source, secret) {
    const envName = (source.config.tokenEnv as string | undefined) ?? "DUFFEL_ACCESS_TOKEN";
    if (!secret(envName)) {
      return { ok: false, status: "AWAITING_CREDENTIALS", missing: [envName], message: "Duffel hesabından erişim anahtarı alınmalı (önce test modunda deneyin)." };
    }
    return { ok: true, status: "CONNECTED", missing: [], message: "Erişim anahtarı tanımlı." };
  },

  async search(ctx: AdapterContext, q) {
    const envName = (ctx.source.config.tokenEnv as string | undefined) ?? "DUFFEL_ACCESS_TOKEN";
    const token = ctx.secret(envName);
    if (!token) throw new IntegrationError("NOT_CONFIGURED", "Duffel erişim anahtarı yok", { retryable: false });
    const slices = [{ origin: q.origin, destination: q.destination, departure_date: q.departDate }];
    if (q.returnDate) slices.push({ origin: q.destination, destination: q.origin, departure_date: q.returnDate });
    const body = {
      data: {
        slices,
        passengers: Array.from({ length: Math.max(1, Math.min(q.adults, 9)) }, () => ({ type: "adult" })),
        cabin_class: CABIN[q.cabin],
        ...(q.directOnly ? { max_connections: 0 } : {}),
      },
    };
    const res = await ctx.http.json<{ data?: { offers?: DuffelOffer[] } }>("https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=20000", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "duffel-version": String(ctx.source.config.apiVersion ?? "v2"),
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      timeoutMs: 30_000,
    });
    const offers = (res.data?.offers ?? []).map((o) => mapDuffelOffer(o, q, ctx.now)).filter((o): o is NormalizedFlightOffer => o !== null);
    return { offers, requests: 1 };
  },

  async routeDeals() {
    // Canlı arama maliyetli olduğundan rota taraması desteklenmez.
    return { offers: [], requests: 0 };
  },
};
