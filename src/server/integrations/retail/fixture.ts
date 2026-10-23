/**
 * TEST adaptörü — kurgusal katalogdan deterministik test teklifleri üretir.
 * Kaynak `isTestData = true` olarak kaydedilir; arayüz bu kayıtları "Test verisi" diye işaretler.
 */

import { DAY } from "@/lib/time";
import type { NormalizedListing, RetailAdapter } from "../types";
import { FIXTURE_PRODUCTS, FIXTURE_STORES, type FixtureProduct, type FixtureVariant, fixtureGtin, fixturePriceMinor, fixtureStock, hash01 } from "./fixture-catalog";

export function fixtureListingsFor(storeSlug: string, at: Date): NormalizedListing[] {
  const store = FIXTURE_STORES.find((s) => s.slug === storeSlug);
  if (!store) return [];
  const dayIndex = Math.floor(at.getTime() / DAY);
  const out: NormalizedListing[] = [];
  for (const p of FIXTURE_PRODUCTS) {
    if (!p.stores.includes(storeSlug)) continue;
    const variants: (FixtureVariant | null)[] = p.variants?.length ? p.variants : [null];
    variants.forEach((v, idx) => {
      // Her mağaza her varyantı listelemez (gerçekçi kapsama farkı)
      if (v && idx > 0 && hash01(`${p.key}:${storeSlug}:${v.suffix}:listed`) < 0.3) return;
      out.push(buildListing(p, v, store, dayIndex));
    });
  }
  return out;
}

function buildListing(p: FixtureProduct, v: FixtureVariant | null, store: (typeof FIXTURE_STORES)[number], dayIndex: number): NormalizedListing {
  const priceMinor = fixturePriceMinor(p, v, store.slug, dayIndex);
  const useAltTitle = p.altTitleStore?.store === store.slug && (!p.variants || v === p.variants[0]);
  const title = useAltTitle ? p.altTitleStore!.title : v ? `${p.title} ${v.suffix}` : p.title;
  const gtin = useAltTitle ? null : fixtureGtin(`${p.key}:${v?.suffix ?? "std"}`);
  const listPriceMinor =
    p.inflatedList && store.slug === "test-magaza-kervan"
      ? Math.round((priceMinor * 1.6) / 1000) * 1000 - 10
      : hash01(`${p.key}:${store.slug}:list`) < 0.5
        ? Math.round((p.basePrice + (v?.priceDelta ?? 0)) * 1.12) * 100 - 10
        : null;
  let shippingMinor: number | null = null;
  if (store.shipping === "free") shippingMinor = 0;
  else if (store.shipping === "flat") shippingMinor = priceMinor >= (store.freeOverMinor ?? Infinity) ? 0 : (store.flatMinor ?? 0);
  const externalId = `${p.key}${v ? `-${v.suffix.toLowerCase().replace(/\s+/g, "-")}` : ""}`;
  return {
    externalId,
    url: `https://test.invalid/${store.slug}/${externalId}`,
    title,
    brand: useAltTitle ? p.brand.toUpperCase() : p.brand,
    gtin,
    mpn: null,
    modelNumber: null,
    categoryPath: `test > ${p.category}`,
    description: `Test verisi: ${p.title}. Kurgusal ürün; gerçek bir ürün veya fiyat değildir.`,
    imageUrl: null,
    priceMinor,
    listPriceMinor: listPriceMinor && listPriceMinor > priceMinor ? listPriceMinor : null,
    shippingMinor,
    currency: "TRY",
    stockStatus: fixtureStock(p, store.slug, dayIndex),
    sellerName: store.name,
    rating: null,
    ratingCount: null,
    attributes: { color: v?.color, connectivity: v?.connectivity, capacity: v?.capacity },
    specs: p.specs ?? {},
    promotion: null,
  };
}

export const fixtureAdapter: RetailAdapter = {
  key: "fixture",
  displayName: "Test verisi (kurgusal katalog)",
  description: "Geliştirme ve testler için deterministik kurgusal ürünler. Canlı veri değildir.",
  docsUrl: "docs/DATA-SOURCES.md#test-verisi",
  capabilities: { lookupByIds: false, search: false, fullCatalog: true },
  checkConfiguration() {
    return { ok: true, status: "TEST_ONLY", missing: [], message: "Test verisi üretir; gerçek fiyat değildir." };
  },
  async fetch(ctx) {
    const store = String(ctx.source.config.store ?? "");
    const listings = fixtureListingsFor(store, ctx.now);
    return { listings, errors: [], notFoundIds: [], completeCatalog: listings.length > 0, requests: 0 };
  },
};
