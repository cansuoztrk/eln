import "server-only";
import { DAY } from "@/lib/time";
import { db } from "../db";
import { includeTestData } from "../visibility";
import { productCardsWhere, visibilityWhere } from "./queries";

/** Ana sayfa verileri. Her bölüm yalnızca gerçek kayıtlardan oluşur; veri yoksa boş döner ve gizlenir. */
export async function getHomeData() {
  const now = new Date();
  const testFilter = includeTestData() ? {} : { dataSource: { isTestData: false } };
  const current = { bestOfferId: { not: null } };

  const [featured, advantageous, dropped, tech, lowest30, fresh, offerCount, retailerRows, lastCheck, productCount] = await Promise.all([
    productCardsWhere({ ...current, dealScore: { not: null } }, [{ dealScore: "desc" }], 8),
    productCardsWhere({ ...current, offers: { some: { status: "ACTIVE", dealLabels: { has: "HISTORICALLY_GOOD" } } } }, [{ verifiedDiscountPct: { sort: "desc", nulls: "last" } }], 4),
    productCardsWhere({ ...current, recentDropPct: { gt: 1 } }, [{ recentDropPct: { sort: "desc", nulls: "last" } }], 4),
    productCardsWhere({ ...current, category: { parent: { slug: "teknoloji" } } }, [{ dealScore: { sort: "desc", nulls: "last" } }], 8),
    productCardsWhere({ ...current, offers: { some: { status: "ACTIVE", dealLabels: { has: "LOWEST_30D" } } } }, [{ dealScore: { sort: "desc", nulls: "last" } }], 4),
    productCardsWhere({ ...current, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } }, [{ createdAt: "desc" }], 4),
    db.offer.count({ where: { status: "ACTIVE", ...testFilter } }),
    db.offer.groupBy({ by: ["retailerId"], where: { status: "ACTIVE", ...testFilter }, _count: true }),
    db.offer.aggregate({ where: { status: "ACTIVE", ...testFilter }, _max: { lastSuccessAt: true } }),
    db.product.count({ where: { ...visibilityWhere(), bestOfferId: { not: null } } }),
  ]);

  const retailers = await db.retailer.findMany({
    where: { id: { in: retailerRows.map((r) => r.retailerId) } },
    select: { id: true, slug: true, name: true, brandColor: true, dataSources: { select: { lastSuccessAt: true, isTestData: true, name: true } } },
  });
  const retailerTiles = retailers
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      color: r.brandColor,
      offers: retailerRows.find((x) => x.retailerId === r.id)?._count ?? 0,
      lastSuccessAt: r.dataSources.reduce<Date | null>((m, d) => (d.lastSuccessAt && (!m || d.lastSuccessAt > m) ? d.lastSuccessAt : m), null)?.toISOString() ?? null,
      isTestData: r.dataSources.length > 0 && r.dataSources.every((d) => d.isTestData),
    }))
    .sort((a, b) => b.offers - a.offers);

  // Uçuş fırsatları: rota başına en ucuz, süresi dolmamış teklif
  const flightRows = await db.$queryRaw<{ id: string; origin: string; destination: string; departAt: Date; returnAt: Date | null; priceMinor: number; currency: string; stops: number; checkedAt: Date; priceKind: string; isTestData: boolean; oneWay: boolean }[]>`
    SELECT DISTINCT ON (f."routeId") f.id, f.origin, f.destination, f."departAt", f."returnAt", f."priceMinor", f.currency, f.stops, f."checkedAt", f."priceKind"::text AS "priceKind", d."isTestData", f."oneWay"
    FROM "FlightOffer" f JOIN "DataSource" d ON d.id = f."dataSourceId"
    WHERE f."isActive" = true AND f."expiresAt" > now() AND f."departAt" > now() AND f."oneWay" = true AND f."routeId" IS NOT NULL
      AND (${includeTestData()} OR d."isTestData" = false)
    ORDER BY f."routeId", f."priceMinor" ASC`;
  const flights = flightRows.sort((a, b) => a.priceMinor - b.priceMinor).slice(0, 6);

  // Takip edilen kategoriler: alarm + favori sayıları (gerçek kullanıcı etkileşimi)
  const tracked = await db.$queryRaw<{ slug: string; name: string; icon: string | null; alerts: bigint; favorites: bigint }[]>`
    SELECT c.slug, c.name, c.icon,
      (SELECT count(*) FROM "PriceAlert" a JOIN "Product" p ON p.id = a."productId" WHERE p."categoryId" = c.id AND a."isActive" = true) AS alerts,
      (SELECT count(*) FROM "UserFavorite" f JOIN "Product" p ON p.id = f."productId" WHERE p."categoryId" = c.id) AS favorites
    FROM "Category" c WHERE c."parentId" IS NOT NULL`;
  const trackedCategories = tracked
    .map((t) => ({ slug: t.slug, name: t.name, icon: t.icon, alerts: Number(t.alerts), favorites: Number(t.favorites) }))
    .filter((t) => t.alerts + t.favorites > 0)
    .sort((a, b) => b.alerts + b.favorites - (a.alerts + a.favorites))
    .slice(0, 6);

  const sources = await db.dataSource.findMany({ where: includeTestData() ? {} : { isTestData: false }, select: { key: true, name: true, kind: true, status: true, lastSuccessAt: true, isTestData: true }, orderBy: { kind: "asc" } });

  return {
    featured,
    advantageous,
    dropped,
    tech,
    lowest30,
    fresh,
    retailerTiles,
    flights: flights.map((f) => ({ ...f, departAt: f.departAt.toISOString(), returnAt: f.returnAt?.toISOString() ?? null, checkedAt: f.checkedAt.toISOString() })),
    trackedCategories,
    stats: { offerCount, retailerCount: retailerRows.length, productCount, lastCheck: lastCheck._max.lastSuccessAt?.toISOString() ?? null },
    sources,
    anyTestData: featured.some((f) => f.isTestData),
  };
}
