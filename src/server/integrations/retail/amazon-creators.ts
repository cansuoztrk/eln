/**
 * Amazon Türkiye — Creators API adaptörü.
 *
 * Durum (Ekim 2026): PA-API 5.0 2026'da kullanımdan kaldırıldı; resmî halefi Creators API'dir.
 * Erişim, Amazon Ortaklık Programı (amazon.com.tr) hesabı ve Creators API onayı gerektirir.
 *
 * Doğrulanan bilgiler (kaynaklar docs/DATA-SOURCES.md içinde):
 *  - Kimlik doğrulama: OAuth 2.0 client_credentials, scope "creatorsapi::default".
 *  - Token uç noktası kimlik sürümüne göre: 3.1 (NA) api.amazon.com, 3.2 (EU — Türkiye dâhil)
 *    api.amazon.co.uk, 3.3 (FE) api.amazon.co.jp.
 *  - GetItems: POST https://creatorsapi.amazon/catalog/v1/getItems, istek başına en fazla 10 ASIN.
 *  - Zorunlu başlık: x-marketplace = www.amazon.com.tr; gövdede marketplace ve partnerTag.
 *  - Offers verisinin TTL'i 1 saattir; fiyatlar en az saatte bir yenilenmelidir.
 *
 * Doğrulanması gerekenler: SearchItems yol adı (/catalog/v1/searchItems varsayıldı, yapılandırılabilir),
 * hesabınıza tanımlı TPS limiti, kargo bilgisinin OffersV2'de bulunmaması (kargo "bilinmiyor" gösterilir).
 *
 * Ortam değişkenleri: AMAZON_CREATORS_CLIENT_ID, AMAZON_CREATORS_CLIENT_SECRET, AMAZON_PARTNER_TAG
 */

import { parsePriceToMinor } from "@/lib/money";
import { normalizeGtin, normalizeMpn } from "@/lib/text";
import { type AdapterContext, IntegrationError, type ListingError, type NormalizedListing, type RetailAdapter } from "../types";

type AmazonConfig = {
  clientIdEnv?: string;
  clientSecretEnv?: string;
  partnerTagEnv?: string;
  credentialVersion?: "3.1" | "3.2" | "3.3";
  marketplace?: string;
  apiBaseUrl?: string;
  searchPath?: string;
  /** Tam senkronda çalıştırılacak aramalar: [{ keywords, searchIndex?, pages? }] */
  searchQueries?: { keywords: string; searchIndex?: string; pages?: number }[];
};

const TOKEN_ENDPOINTS: Record<string, string> = {
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

const RESOURCES = [
  "images.primary.large",
  "itemInfo.title",
  "itemInfo.byLineInfo",
  "itemInfo.externalIds",
  "itemInfo.manufactureInfo",
  "itemInfo.features",
  "itemInfo.classifications",
  "offersV2.listings.price",
  "offersV2.listings.availability",
  "offersV2.listings.condition",
  "offersV2.listings.merchantInfo",
  "offersV2.listings.isBuyBoxWinner",
  "offersV2.listings.dealDetails",
];

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function cfg(ctxConfig: Record<string, unknown>): Required<Omit<AmazonConfig, "searchQueries">> & { searchQueries: AmazonConfig["searchQueries"] } {
  const c = ctxConfig as AmazonConfig;
  return {
    clientIdEnv: c.clientIdEnv ?? "AMAZON_CREATORS_CLIENT_ID",
    clientSecretEnv: c.clientSecretEnv ?? "AMAZON_CREATORS_CLIENT_SECRET",
    partnerTagEnv: c.partnerTagEnv ?? "AMAZON_PARTNER_TAG",
    credentialVersion: c.credentialVersion ?? "3.2",
    marketplace: c.marketplace ?? "www.amazon.com.tr",
    apiBaseUrl: (c.apiBaseUrl ?? "https://creatorsapi.amazon").replace(/\/$/, ""),
    searchPath: c.searchPath ?? "/catalog/v1/searchItems",
    searchQueries: c.searchQueries ?? [],
  };
}

async function accessToken(ctx: AdapterContext): Promise<string> {
  const c = cfg(ctx.source.config);
  const clientId = ctx.secret(c.clientIdEnv);
  const clientSecret = ctx.secret(c.clientSecretEnv);
  if (!clientId || !clientSecret) throw new IntegrationError("NOT_CONFIGURED", "Creators API kimlik bilgileri eksik", { retryable: false });
  const cacheKey = `${clientId}:${c.credentialVersion}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const endpoint = TOKEN_ENDPOINTS[c.credentialVersion];
  const res = await ctx.http.request(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope: "creatorsapi::default" }),
  });
  const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
  if (!res.ok || !body?.access_token) {
    throw new IntegrationError("AUTH", `Creators API token alınamadı (${res.status}${body?.error ? `: ${body.error}` : ""})`, { retryable: false });
  }
  tokenCache.set(cacheKey, { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 });
  return body.access_token;
}

type AmazonItem = {
  asin?: string;
  detailPageURL?: string;
  images?: { primary?: { large?: { url?: string } } };
  itemInfo?: {
    title?: { displayValue?: string };
    byLineInfo?: { brand?: { displayValue?: string }; manufacturer?: { displayValue?: string } };
    externalIds?: { eans?: { displayValues?: string[] }; upcs?: { displayValues?: string[] } };
    manufactureInfo?: { model?: { displayValue?: string }; itemPartNumber?: { displayValue?: string } };
    features?: { displayValues?: string[] };
    classifications?: { binding?: { displayValue?: string }; productGroup?: { displayValue?: string } };
  };
  offersV2?: {
    listings?: {
      price?: { money?: { amount?: number; currency?: string }; savingBasis?: { money?: { amount?: number; currency?: string }; savingBasisType?: string } };
      availability?: { type?: string };
      condition?: { value?: string };
      merchantInfo?: { name?: string };
      isBuyBoxWinner?: boolean;
      dealDetails?: { endTime?: string; accessType?: string; badge?: string };
    }[];
  };
};

function mapAvailability(type: string | undefined): NormalizedListing["stockStatus"] {
  switch ((type ?? "").toUpperCase()) {
    case "IN_STOCK":
      return "IN_STOCK";
    case "IN_STOCK_SCARCE":
    case "LIMITED":
      return "LOW_STOCK";
    case "OUT_OF_STOCK":
    case "UNAVAILABLE":
      return "OUT_OF_STOCK";
    case "PREORDER":
    case "LEADTIME":
    case "AVAILABLE_DATE":
      return "PREORDER";
    default:
      return "UNKNOWN";
  }
}

export function mapAmazonItem(item: AmazonItem): { listing?: NormalizedListing; error?: ListingError } {
  const asin = item.asin;
  if (!asin || !item.detailPageURL) return { error: { externalId: asin, reason: "ASIN veya ürün adresi yok" } };
  const listings = item.offersV2?.listings ?? [];
  const listing = listings.find((l) => l.isBuyBoxWinner) ?? listings[0];
  const condition = listing?.condition?.value;
  if (!listing?.price?.money?.amount) return { error: { externalId: asin, reason: "Teklif/fiyat bilgisi yok (stokta olmayabilir)" } };
  if (condition && condition.toLowerCase() !== "new") return { error: { externalId: asin, reason: `Yeni olmayan teklif atlandı (${condition})` } };
  const currency = listing.price.money.currency ?? "TRY";
  const priceMinor = parsePriceToMinor(listing.price.money.amount, currency);
  if (priceMinor === null || priceMinor <= 0) return { error: { externalId: asin, reason: "Geçersiz fiyat" } };
  const basis = listing.price.savingBasis?.money;
  const listPriceMinor = basis?.amount && (basis.currency ?? currency) === currency ? parsePriceToMinor(basis.amount, currency) : null;
  const ean = item.itemInfo?.externalIds?.eans?.displayValues?.[0] ?? item.itemInfo?.externalIds?.upcs?.displayValues?.[0];
  const deal = listing.dealDetails;
  return {
    listing: {
      externalId: asin,
      url: item.detailPageURL,
      title: item.itemInfo?.title?.displayValue ?? asin,
      brand: item.itemInfo?.byLineInfo?.brand?.displayValue ?? item.itemInfo?.byLineInfo?.manufacturer?.displayValue ?? null,
      gtin: normalizeGtin(ean),
      mpn: normalizeMpn(item.itemInfo?.manufactureInfo?.itemPartNumber?.displayValue),
      modelNumber: item.itemInfo?.manufactureInfo?.model?.displayValue ?? null,
      categoryPath: item.itemInfo?.classifications?.productGroup?.displayValue ?? item.itemInfo?.classifications?.binding?.displayValue ?? null,
      description: item.itemInfo?.features?.displayValues?.join(" · ").slice(0, 4000) ?? null,
      imageUrl: item.images?.primary?.large?.url ?? null,
      priceMinor,
      listPriceMinor: listPriceMinor && listPriceMinor > priceMinor ? listPriceMinor : null,
      shippingMinor: null, // OffersV2 kargo bedeli vermiyor → bilinmiyor
      currency,
      stockStatus: mapAvailability(listing.availability?.type),
      sellerName: listing.merchantInfo?.name ?? null,
      rating: null,
      ratingCount: null,
      attributes: {},
      specs: {},
      promotion: deal ? { text: deal.badge ?? "Amazon fırsatı", endsAt: deal.endTime ? new Date(deal.endTime) : null } : null,
    },
  };
}

async function callApi<T>(ctx: AdapterContext, path: string, body: Record<string, unknown>): Promise<T> {
  const c = cfg(ctx.source.config);
  const token = await accessToken(ctx);
  return ctx.http.json<T>(`${c.apiBaseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-marketplace": c.marketplace },
    body: JSON.stringify(body),
  });
}

export const amazonCreatorsAdapter: RetailAdapter = {
  key: "amazon-creators",
  displayName: "Amazon Creators API",
  description: "Amazon Ortaklık Programı üzerinden resmî ürün ve teklif verisi (PA-API 5.0'ın halefi).",
  docsUrl: "https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction",
  capabilities: { lookupByIds: true, search: true, fullCatalog: false },

  checkConfiguration(source, secret) {
    const c = cfg(source.config);
    const missing = [c.clientIdEnv, c.clientSecretEnv, c.partnerTagEnv].filter((n) => !secret(n));
    if (missing.length) {
      return {
        ok: false,
        status: "AWAITING_CREDENTIALS",
        missing,
        message:
          "Amazon Ortaklık Programı (amazon.com.tr) hesabı ve Creators API onayı gerekir. Onay sonrası istemci kimliği, gizli anahtar ve partner tag ortam değişkenlerine girilmelidir.",
      };
    }
    return { ok: true, status: "CONNECTED", missing: [], message: "Kimlik bilgileri tanımlı." };
  },

  async fetch(ctx, request) {
    const c = cfg(ctx.source.config);
    const partnerTag = ctx.secret(c.partnerTagEnv);
    if (!partnerTag) throw new IntegrationError("NOT_CONFIGURED", "Partner tag eksik", { retryable: false });

    const listings: NormalizedListing[] = [];
    const errors: ListingError[] = [];
    const notFoundIds: string[] = [];
    const seen = new Set<string>();
    let requests = 0;

    const collect = (items: AmazonItem[] | undefined) => {
      for (const item of items ?? []) {
        const mapped = mapAmazonItem(item);
        if (mapped.listing && !seen.has(mapped.listing.externalId)) {
          seen.add(mapped.listing.externalId);
          listings.push(mapped.listing);
        } else if (mapped.error) errors.push(mapped.error);
      }
    };

    // 1) Bilinen ASIN'lerin güncel teklifleri (saatlik görev) — 10'arlı gruplar
    const ids = [...new Set(request.knownExternalIds)];
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      const res = await callApi<{ itemsResult?: { items?: AmazonItem[] }; errors?: { code?: string; message?: string }[] }>(ctx, "/catalog/v1/getItems", {
        itemIds: batch,
        itemIdType: "ASIN",
        marketplace: c.marketplace,
        partnerTag,
        resources: RESOURCES,
      });
      requests++;
      collect(res.itemsResult?.items);
      const returned = new Set((res.itemsResult?.items ?? []).map((x) => x.asin));
      for (const e of res.errors ?? []) {
        if (/ItemNotAccessible|InvalidParameterValue|NotFound/i.test(e.code ?? "")) {
          const asin = batch.find((a) => (e.message ?? "").includes(a));
          if (asin) notFoundIds.push(asin);
        } else {
          errors.push({ reason: `${e.code}: ${e.message}` });
        }
      }
      for (const a of batch) if (!returned.has(a) && !notFoundIds.includes(a)) ctx.log("DEBUG", "ASIN yanıtta yok", { asin: a });
    }

    // 2) Tam senkron: yapılandırılmış aramalarla yeni ürün keşfi (günlük görev)
    if (request.mode === "full") {
      for (const q of c.searchQueries ?? []) {
        const pages = Math.min(q.pages ?? 1, 10);
        for (let page = 1; page <= pages; page++) {
          const res = await callApi<{ searchResult?: { items?: AmazonItem[]; totalResultCount?: number } }>(ctx, c.searchPath, {
            keywords: q.keywords,
            searchIndex: q.searchIndex ?? "All",
            itemCount: 10,
            itemPage: page,
            condition: "New",
            marketplace: c.marketplace,
            partnerTag,
            resources: RESOURCES,
          });
          requests++;
          collect(res.searchResult?.items);
          if (!res.searchResult?.items?.length) break;
        }
      }
    }

    return { listings, errors, notFoundIds, completeCatalog: false, requests };
  },
};
