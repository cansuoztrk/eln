import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { includeTestData } from "../visibility";

export type RouteDeal = {
  id: string;
  origin: string;
  destination: string;
  departAt: string;
  returnAt: string | null;
  priceMinor: number;
  currency: string;
  stops: number;
  checkedAt: string;
  priceKind: string;
  isTestData: boolean;
  oneWay: boolean;
  airlineCode: string | null;
};

type Row = Omit<RouteDeal, "departAt" | "returnAt" | "checkedAt"> & { departAt: Date; returnAt: Date | null; checkedAt: Date };

async function cheapestPerRoute(extra: Prisma.Sql, limit = 6): Promise<RouteDeal[]> {
  const rows = await db.$queryRaw<Row[]>`
    SELECT * FROM (
      SELECT DISTINCT ON (f."routeId") f.id, f.origin, f.destination, f."departAt", f."returnAt", f."priceMinor", f.currency, f.stops,
        f."checkedAt", f."priceKind"::text AS "priceKind", d."isTestData", f."oneWay", f."airlineCode"
      FROM "FlightOffer" f
      JOIN "DataSource" d ON d.id = f."dataSourceId"
      JOIN "FlightRoute" r ON r.id = f."routeId"
      WHERE f."isActive" = true AND f."expiresAt" > now() AND f."departAt" > now() AND r."isActive" = true
        AND (${includeTestData()} OR d."isTestData" = false)
        ${extra}
      ORDER BY f."routeId", f."priceMinor" ASC
    ) x ORDER BY x."priceMinor" ASC LIMIT ${limit}`;
  return rows.map((r) => ({ ...r, departAt: r.departAt.toISOString(), returnAt: r.returnAt?.toISOString() ?? null, checkedAt: r.checkedAt.toISOString() }));
}

export async function flightDealSections() {
  const [ist, ank, izm, intl, weekend, direct, soon] = await Promise.all([
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = true AND 'istanbul-cikisli' = ANY(r.tags)`),
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = true AND 'ankara-cikisli' = ANY(r.tags)`),
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = true AND 'izmir-cikisli' = ANY(r.tags)`),
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = true AND r."isInternational" = true`),
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = false AND f."returnAt" IS NOT NULL
      AND extract(isodow from (f."departAt" AT TIME ZONE 'Europe/Istanbul')) IN (5, 6)
      AND extract(isodow from (f."returnAt" AT TIME ZONE 'Europe/Istanbul')) IN (7, 1)
      AND f."returnAt" - f."departAt" <= interval '4 days'`),
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = true AND f.stops = 0`),
    cheapestPerRoute(Prisma.sql`AND f."oneWay" = true AND f."departAt" <= now() + interval '14 days'`),
  ]);
  const drops = await routePriceDrops();
  return [
    { key: "istanbul-cikisli", title: "İstanbul çıkışlı uygun uçuşlar", description: "İstanbul'dan izlenen rotalarda en düşük tek yön fiyatlar.", items: ist },
    { key: "ankara-cikisli", title: "Ankara çıkışlı uygun uçuşlar", description: "Ankara'dan izlenen rotalar.", items: ank },
    { key: "izmir-cikisli", title: "İzmir çıkışlı uygun uçuşlar", description: "İzmir'den izlenen rotalar.", items: izm },
    { key: "yurt-disi", title: "Yurt dışı fırsatları", description: "Uluslararası rotalarda en düşük gösterge fiyatlar.", items: intl },
    { key: "hafta-sonu", title: "Hafta sonu kaçamakları", description: "Cuma/cumartesi gidiş, pazar/pazartesi dönüş; en fazla 4 gün.", items: weekend },
    { key: "direkt", title: "Direkt uçuş fırsatları", description: "Aktarmasız uçuşlarda en uygunlar.", items: direct },
    { key: "yakin-tarih", title: "Yakın tarihli fırsatlar", description: "Önümüzdeki 14 gün içinde kalkan uçuşlar.", items: soon },
    { key: "fiyat-dusenler", title: "Fiyatı düşen popüler rotalar", description: "Önümüzdeki 60 gün için en düşük fiyatın 7 gün öncesine göre değişimi (yeterli kayıt varsa).", items: [] as RouteDeal[], drops },
  ];
}

/** Rota bazında 7 gün önceki ile bugünkü en düşük gösterge fiyat karşılaştırması (gerçek snapshot'lardan). */
export async function routePriceDrops() {
  const rows = await db.$queryRaw<{ routeId: string; origin: string; destination: string; now_min: number; then_min: number; currency: string }[]>`
    WITH cur AS (
      SELECT s."routeId", min(s."minPriceMinor") AS m, min(s.currency) AS currency
      FROM "FlightPriceSnapshot" s JOIN "DataSource" d ON d.id = s."dataSourceId"
      WHERE s."oneWay" = true AND s."checkedAt" >= now() - interval '1 day' AND s."departDate" BETWEEN current_date AND current_date + 60
        AND (${includeTestData()} OR d."isTestData" = false)
      GROUP BY s."routeId"
    ), prev AS (
      SELECT s."routeId", min(s."minPriceMinor") AS m
      FROM "FlightPriceSnapshot" s JOIN "DataSource" d ON d.id = s."dataSourceId"
      WHERE s."oneWay" = true AND s."checkedAt" BETWEEN now() - interval '8 days' AND now() - interval '6 days'
        AND s."departDate" BETWEEN current_date - 7 AND current_date + 53
        AND (${includeTestData()} OR d."isTestData" = false)
      GROUP BY s."routeId"
    )
    SELECT r.id AS "routeId", r.origin, r.destination, cur.m AS now_min, prev.m AS then_min, cur.currency
    FROM cur JOIN prev ON prev."routeId" = cur."routeId" JOIN "FlightRoute" r ON r.id = cur."routeId"
    WHERE cur.m < prev.m
    ORDER BY (prev.m - cur.m)::float / prev.m DESC LIMIT 6`;
  return rows.map((r) => ({ ...r, dropPct: ((r.then_min - r.now_min) / r.then_min) * 100 }));
}

export async function routeDetail(origin: string, destination: string) {
  const route = await db.flightRoute.findUnique({ where: { origin_destination: { origin, destination } } });
  const calendar = await db.$queryRaw<{ day: Date; minor: number; currency: string; offerId: string; stops: number; isTestData: boolean }[]>`
    SELECT DISTINCT ON (date_trunc('day', f."departAt" AT TIME ZONE 'Europe/Istanbul'))
      date_trunc('day', f."departAt" AT TIME ZONE 'Europe/Istanbul') AS day, f."priceMinor" AS minor, f.currency, f.id AS "offerId", f.stops, d."isTestData"
    FROM "FlightOffer" f JOIN "DataSource" d ON d.id = f."dataSourceId"
    WHERE f."isActive" = true AND f."expiresAt" > now() AND f."departAt" > now() AND f."oneWay" = true
      AND (f.origin = ${origin} OR f."originAirport" = ${origin}) AND (f.destination = ${destination} OR f."destinationAirport" = ${destination})
      AND (${includeTestData()} OR d."isTestData" = false)
    ORDER BY date_trunc('day', f."departAt" AT TIME ZONE 'Europe/Istanbul'), f."priceMinor" ASC
    LIMIT 120`;
  const history = route
    ? await db.$queryRaw<{ day: Date; minor: number }[]>`
        SELECT date_trunc('day', s."checkedAt") AS day, min(s."minPriceMinor") AS minor
        FROM "FlightPriceSnapshot" s JOIN "DataSource" d ON d.id = s."dataSourceId"
        WHERE s."routeId" = ${route.id} AND s."oneWay" = true AND s."checkedAt" >= now() - interval '90 days'
          AND (${includeTestData()} OR d."isTestData" = false)
        GROUP BY 1 ORDER BY 1`
    : [];
  return { route, calendar, history };
}
