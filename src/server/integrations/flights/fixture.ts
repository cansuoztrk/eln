/**
 * TEST uçuş sağlayıcısı — deterministik kurgusal uçuşlar. Gerçek fiyat veya sefer değildir;
 * arayüzde "Test verisi" olarak işaretlenir. Havayolu kodları kurgusaldır ("T1", "T2", "T3").
 */

import { DAY, HOUR, MINUTE } from "@/lib/time";
import { hash01 } from "../retail/fixture-catalog";
import type { FlightAdapter, FlightSearchQuery, NormalizedFlightOffer } from "../types";

const TEST_AIRLINES = ["T1", "T2", "T3"];

function routeBase(origin: string, destination: string): number {
  const domestic = ["IST", "SAW", "ESB", "ADB", "AYT", "ADA", "TZX", "GZT", "DLM", "BJV", "VAN", "ERZ", "DIY", "KYA", "ASR", "SZF"];
  const isDomestic = domestic.includes(origin) && domestic.includes(destination);
  return isDomestic ? 1200 + hash01(`${origin}${destination}`) * 1400 : 3200 + hash01(`${origin}${destination}`) * 7000;
}

function makeOffer(origin: string, destination: string, date: Date, idx: number, oneWay: boolean, passengers: number, now: Date): NormalizedFlightOffer {
  const seed = `${origin}${destination}${date.toISOString().slice(0, 10)}${idx}`;
  const airline = TEST_AIRLINES[Math.floor(hash01(`${seed}a`) * TEST_AIRLINES.length)];
  const stops = hash01(`${seed}s`) < 0.6 ? 0 : 1;
  const hour = 5 + Math.floor(hash01(`${seed}h`) * 17);
  const minute = Math.floor(hash01(`${seed}m`) * 4) * 15;
  const departAt = new Date(date.getTime() + hour * HOUR + minute * MINUTE - 3 * HOUR);
  const duration = Math.round(60 + hash01(`${origin}${destination}d`) * 180 + stops * (70 + hash01(`${seed}l`) * 120));
  const daysOut = Math.max(1, (date.getTime() - now.getTime()) / DAY);
  const urgency = daysOut < 10 ? 1.35 : daysOut < 25 ? 1.1 : 1;
  const weekday = date.getUTCDay();
  const weekend = weekday === 5 || weekday === 0 ? 1.15 : 1;
  const base = routeBase(origin, destination) * urgency * weekend * (stops ? 0.86 : 1) * (0.85 + hash01(seed) * 0.35);
  const total = Math.round(base * (oneWay ? 1 : 1.85)) * 100 * passengers;
  const tripDays = 2 + Math.floor(hash01(`${seed}r`) * 4);
  const returnAt = oneWay ? null : new Date(departAt.getTime() + tripDays * DAY + 4 * HOUR);
  const baggage = hash01(`${seed}b`) < 0.5;
  return {
    externalKey: `fixture|${seed}|${oneWay ? "ow" : "rt"}|${passengers}`,
    origin,
    destination,
    originAirport: origin,
    destinationAirport: destination,
    departAt,
    arriveAt: new Date(departAt.getTime() + duration * MINUTE),
    returnAt,
    oneWay,
    airlineCode: airline,
    flightNumber: `${airline}${100 + Math.floor(hash01(`${seed}f`) * 899)}`,
    stops,
    returnStops: oneWay ? null : stops,
    durationMinutes: oneWay ? duration : duration * 2,
    durationOutMinutes: duration,
    durationBackMinutes: oneWay ? null : duration,
    cabin: "ECONOMY",
    passengers,
    currency: "TRY",
    priceMinor: total,
    priceKind: "CACHED_INDICATIVE",
    priceIncludesTaxes: null,
    baggageIncluded: baggage,
    baggageInfo: baggage ? "1 × 20 kg (test verisi)" : "Yalnızca kabin bagajı (test verisi)",
    fareConditions: "Test verisi — gerçek ücret koşulu değildir",
    deepLink: null,
    isAffiliateLink: false,
    foundAt: now,
    expiresAt: new Date(now.getTime() + 12 * HOUR),
  };
}

export const fixtureFlightAdapter: FlightAdapter = {
  key: "fixture-flights",
  displayName: "Test uçuş verisi",
  description: "Kurgusal uçuşlar (geliştirme ve testler için). Gerçek sefer veya fiyat değildir.",
  docsUrl: "docs/DATA-SOURCES.md#test-verisi",
  capabilities: { liveSearch: true, cachedRouteDeals: true, flexibleDates: true, baggageInfo: true, bookingLinks: false, priceIncludesTaxes: null },
  priceNote: "Test verisidir; gerçek bir uçuş veya fiyat değildir.",
  checkConfiguration() {
    return { ok: true, status: "TEST_ONLY", missing: [], message: "Test verisi üretir." };
  },
  async search(ctx, q: FlightSearchQuery) {
    const offers: NormalizedFlightOffer[] = [];
    const center = new Date(`${q.departDate}T00:00:00Z`);
    for (let d = -q.flexDays; d <= q.flexDays; d++) {
      const date = new Date(center.getTime() + d * DAY);
      if (date.getTime() < ctx.now.getTime() - DAY) continue;
      const count = d === 0 ? 6 : 2;
      for (let i = 0; i < count; i++) {
        const o = makeOffer(q.origin, q.destination, date, i, !q.returnDate, q.adults, ctx.now);
        if (q.directOnly && o.stops > 0) continue;
        offers.push(o);
      }
    }
    return { offers, requests: 0 };
  },
  async routeDeals(ctx, route, opts) {
    const offers: NormalizedFlightOffer[] = [];
    for (let day = 2; day < 75; day += 3) {
      const date = new Date(Math.floor(ctx.now.getTime() / DAY) * DAY + day * DAY);
      offers.push(makeOffer(route.origin, route.destination, date, 0, opts.oneWay, 1, ctx.now));
    }
    return { offers, requests: 0 };
  },
};
