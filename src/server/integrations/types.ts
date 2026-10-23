/**
 * Entegrasyon katmanı sözleşmeleri.
 *
 * Uygulamanın geri kalanı yalnızca bu tiplerle konuşur. Bir sağlayıcının API'si değiştiğinde
 * sadece ilgili adaptör dosyası güncellenir; ingestion, puanlama ve arayüz etkilenmez.
 */

export type IntegrationErrorCode =
  | "NOT_CONFIGURED" // kimlik bilgisi / izin yok
  | "AWAITING_INTEGRATION" // resmî erişim yolu henüz yok
  | "AUTH" // anahtar geçersiz / süresi dolmuş
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "UPSTREAM" // sağlayıcı 5xx
  | "NETWORK"
  | "FORMAT" // beklenmeyen yanıt biçimi (sağlayıcı formatı değiştirmiş olabilir)
  | "NOT_FOUND";

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: IntegrationErrorCode,
    message: string,
    opts: { retryable?: boolean; retryAfterMs?: number; details?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message, { cause: opts.cause });
    this.name = "IntegrationError";
    this.code = code;
    this.retryable = opts.retryable ?? ["RATE_LIMITED", "UPSTREAM", "NETWORK"].includes(code);
    this.retryAfterMs = opts.retryAfterMs;
    this.details = opts.details;
  }
}

export type LogFn = (level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, context?: Record<string, unknown>) => void;

export type DataSourceRecord = {
  id: string;
  key: string;
  name: string;
  adapter: string;
  kind: "RETAIL" | "FLIGHT" | "COUPON";
  isTestData: boolean;
  retailerId: string | null;
  config: Record<string, unknown>;
  rateLimitPerMinute: number;
  dailyQuota: number | null;
};

export type HttpClient = {
  request(url: string, init?: RequestInit & { timeoutMs?: number; maxBytes?: number }): Promise<Response>;
  json<T = unknown>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T>;
  text(url: string, init?: RequestInit & { timeoutMs?: number; maxBytes?: number }): Promise<{ body: string; response: Response }>;
};

export type AdapterContext = {
  source: DataSourceRecord;
  http: HttpClient;
  log: LogFn;
  secret: (envName: string | undefined) => string | undefined;
  now: Date;
  signal?: AbortSignal;
};

export type ConfigCheck = {
  ok: boolean;
  status: "CONNECTED" | "AWAITING_INTEGRATION" | "AWAITING_CREDENTIALS" | "TEST_ONLY";
  missing: string[];
  message: string;
};

// ───────────────────────────── E-ticaret ─────────────────────────────

export type NormalizedListing = {
  externalId: string;
  url: string;
  title: string;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  modelNumber: string | null;
  categoryPath: string | null; // kaynağın kategori yolu
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  listPriceMinor: number | null;
  shippingMinor: number | null; // null = bilinmiyor
  currency: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "UNKNOWN";
  sellerName: string | null;
  rating: number | null;
  ratingCount: number | null;
  attributes: { color?: string; size?: string; capacity?: string; connectivity?: "kablosuz" | "kablolu" | "bluetooth" };
  specs: Record<string, string>;
  promotion: { text: string; endsAt: Date | null } | null;
};

export type ListingError = { externalId?: string; reason: string; raw?: unknown };

export type RetailFetchRequest = {
  mode: "refresh" | "full";
  /** refresh modunda mevcut tekliflerin kaynak kimlikleri (API tabanlı kaynaklar için). */
  knownExternalIds: string[];
};

export type RetailFetchResult = {
  listings: NormalizedListing[];
  errors: ListingError[];
  /** Kaynağın açıkça "bulunamadı/satıştan kalktı" dediği kimlikler. */
  notFoundIds: string[];
  /** true ise sonuç kaynağın TÜM kataloğunu kapsar; listede olmayan teklifler EXPIRED yapılabilir. */
  completeCatalog: boolean;
  requests: number;
};

export type RetailAdapter = {
  key: string;
  displayName: string;
  description: string;
  /** Resmî dokümantasyon / başvuru adresi. */
  docsUrl: string;
  capabilities: { lookupByIds: boolean; search: boolean; fullCatalog: boolean };
  checkConfiguration(source: DataSourceRecord, secret: (name: string | undefined) => string | undefined): ConfigCheck;
  fetch(ctx: AdapterContext, request: RetailFetchRequest): Promise<RetailFetchResult>;
};

// ───────────────────────────── Uçuşlar ─────────────────────────────

export type FlightSearchQuery = {
  origin: string;
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate: string | null;
  adults: number;
  cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  directOnly: boolean;
  flexDays: number; // 0..3
};

export type NormalizedFlightOffer = {
  externalKey: string;
  origin: string;
  destination: string;
  originAirport: string;
  destinationAirport: string;
  departAt: Date;
  arriveAt: Date | null;
  returnAt: Date | null;
  oneWay: boolean;
  airlineCode: string | null;
  flightNumber: string | null;
  stops: number;
  returnStops: number | null;
  durationMinutes: number | null;
  durationOutMinutes: number | null;
  durationBackMinutes: number | null;
  cabin: FlightSearchQuery["cabin"];
  passengers: number;
  currency: string;
  priceMinor: number;
  priceKind: "LIVE_QUOTE" | "CACHED_INDICATIVE";
  priceIncludesTaxes: boolean | null;
  baggageIncluded: boolean | null;
  baggageInfo: string | null;
  fareConditions: string | null;
  deepLink: string | null;
  isAffiliateLink: boolean;
  foundAt: Date | null;
  expiresAt: Date;
};

export type FlightAdapter = {
  key: string;
  displayName: string;
  description: string;
  docsUrl: string;
  capabilities: {
    liveSearch: boolean;
    cachedRouteDeals: boolean;
    flexibleDates: boolean;
    baggageInfo: boolean;
    bookingLinks: boolean;
    /** Fiyatların vergi/harç içerip içermediği sağlayıcı tarafından belirtiliyor mu? */
    priceIncludesTaxes: boolean | null;
  };
  priceNote: string;
  checkConfiguration(source: DataSourceRecord, secret: (name: string | undefined) => string | undefined): ConfigCheck;
  search(ctx: AdapterContext, query: FlightSearchQuery): Promise<{ offers: NormalizedFlightOffer[]; requests: number }>;
  routeDeals(
    ctx: AdapterContext,
    route: { origin: string; destination: string },
    opts: { months: string[]; oneWay: boolean },
  ): Promise<{ offers: NormalizedFlightOffer[]; requests: number }>;
};
