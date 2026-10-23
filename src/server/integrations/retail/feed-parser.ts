/**
 * Ürün veri akışı (product feed) ayrıştırıcıları — saf fonksiyonlar.
 *
 * Desteklenen biçimler:
 *  - Google Merchant Center XML (RSS 2.0 veya Atom, g: ad alanı)
 *  - YML (Yandex Market Language; Admitad gibi satış ortaklığı ağlarının yaygın biçimi)
 *  - CSV (virgül, noktalı virgül veya sekme ayraçlı; Google Merchant sütun adları)
 *  - JSON (Google Merchant alan adlarıyla nesne dizisi)
 *
 * Bu biçimler mağazaların veya satış ortaklığı ağlarının YETKİLİ olarak sunduğu feed'ler içindir.
 * Ayrıştırıcı hiçbir değeri tahmin etmez: fiyat çözümlenemeyen kayıtlar hata olarak raporlanır.
 */

import { XMLParser } from "fast-xml-parser";
import { fromMinor, parseAmountWithCurrency, parsePriceToMinor } from "@/lib/money";
import { normalizeGtin, normalizeMpn } from "@/lib/text";
import type { ListingError, NormalizedListing } from "../types";

export type FeedFormat = "google-merchant" | "yml" | "csv" | "json" | "auto";

export type FeedParseOptions = {
  format: FeedFormat;
  defaultCurrency: string;
  /** Kargo bilgisi feed'de yoksa kullanılacak değer. Varsayılan null = bilinmiyor. */
  defaultShippingMinor?: number | null;
  /** Ücretsiz kargo eşiği (mağaza politikası feed'de yoksa yapılandırmadan). */
  freeShippingThresholdMinor?: number | null;
  now?: Date;
};

export type FeedParseResult = { listings: NormalizedListing[]; errors: ListingError[]; format: Exclude<FeedFormat, "auto"> };

type Raw = Record<string, unknown>;

export function detectFeedFormat(body: string): Exclude<FeedFormat, "auto"> {
  const head = body.slice(0, 2000).trimStart();
  if (head.startsWith("[") || head.startsWith("{")) return "json";
  if (/<yml_catalog/i.test(head)) return "yml";
  if (head.startsWith("<")) return "google-merchant";
  return "csv";
}

export function parseFeed(body: string, opts: FeedParseOptions): FeedParseResult {
  const format = opts.format === "auto" ? detectFeedFormat(body) : opts.format;
  switch (format) {
    case "google-merchant":
      return { format, ...parseGoogleMerchantXml(body, opts) };
    case "yml":
      return { format, ...parseYml(body, opts) };
    case "csv":
      return { format, ...mapGoogleRecords(parseCsv(body), opts) };
    case "json": {
      let data: unknown;
      try {
        data = JSON.parse(body);
      } catch {
        return { format, listings: [], errors: [{ reason: "JSON feed ayrıştırılamadı" }] };
      }
      const items = Array.isArray(data) ? data : Array.isArray((data as Raw)?.items) ? ((data as Raw).items as unknown[]) : [];
      return { format, ...mapGoogleRecords(items as Raw[], opts) };
    }
  }
}

// ───────────────────────────── Google Merchant ─────────────────────────────

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  removeNSPrefix: true, // g:price → price
  textNodeName: "#text",
  parseTagValue: false, // fiyatları sayıya çevirme; ayrıştırıcımız biçimleri doğru yönetir
  trimValues: true,
  isArray: (name) => ["item", "entry", "offer", "shipping", "product_detail", "param", "category", "picture", "additional_image_link"].includes(name),
  processEntities: true,
});

function text(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === "object") {
    const o = v as Raw;
    if ("#text" in o) return text(o["#text"]);
    if ("@href" in o) return text(o["@href"]);
    return null;
  }
  const s = String(v).trim();
  return s.length ? s : null;
}

export function parseGoogleMerchantXml(body: string, opts: FeedParseOptions): { listings: NormalizedListing[]; errors: ListingError[] } {
  let doc: Raw;
  try {
    doc = xml.parse(body) as Raw;
  } catch (err) {
    return { listings: [], errors: [{ reason: `XML ayrıştırılamadı: ${(err as Error).message}` }] };
  }
  const rss = doc.rss as Raw | undefined;
  const items = (((rss?.channel as Raw | undefined)?.item as Raw[] | undefined) ?? ((doc.feed as Raw | undefined)?.entry as Raw[] | undefined) ?? []) as Raw[];
  if (!rss && !doc.feed) return { listings: [], errors: [{ reason: "Google Merchant biçimi tanınmadı (rss/channel veya feed/entry bulunamadı)" }] };
  const records: Raw[] = items.map((it) => {
    const r: Raw = {};
    for (const [k, v] of Object.entries(it)) r[k] = v;
    // Atom'da link bir öznitelik olabilir
    if (!text(r.link) && Array.isArray(r.link)) r.link = (r.link as Raw[])[0]?.["@href"];
    return r;
  });
  return mapGoogleRecords(records, opts);
}

function availability(v: string | null): NormalizedListing["stockStatus"] {
  if (!v) return "UNKNOWN";
  const s = v.toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "in_stock" || s === "instock" || s === "true" || s === "1") return "IN_STOCK";
  if (s === "out_of_stock" || s === "outofstock" || s === "false" || s === "0" || s === "discontinued") return "OUT_OF_STOCK";
  if (s === "preorder" || s === "backorder") return "PREORDER";
  if (s === "limited_availability" || s === "low_stock") return "LOW_STOCK";
  return "UNKNOWN";
}

function salePriceActive(effective: string | null, now: Date): boolean {
  if (!effective) return true;
  const [from, to] = effective.split("/").map((s) => (s ? Date.parse(s.trim()) : NaN));
  if (Number.isFinite(from) && now.getTime() < from) return false;
  if (Number.isFinite(to) && now.getTime() > to) return false;
  return true;
}

function salePriceEnd(effective: string | null): Date | null {
  if (!effective) return null;
  const to = effective.split("/")[1];
  const t = to ? Date.parse(to.trim()) : NaN;
  return Number.isFinite(t) ? new Date(t) : null;
}

function field(r: Raw, ...names: string[]): string | null {
  for (const n of names) {
    const v = text(r[n]);
    if (v) return v;
  }
  return null;
}

export function mapGoogleRecords(records: Raw[], opts: FeedParseOptions): { listings: NormalizedListing[]; errors: ListingError[] } {
  const now = opts.now ?? new Date();
  const listings: NormalizedListing[] = [];
  const errors: ListingError[] = [];
  const seen = new Set<string>();

  for (const r of records) {
    const id = field(r, "id", "g:id", "sku");
    const title = field(r, "title", "g:title", "name");
    const link = field(r, "link", "g:link", "url");
    if (!id || !title || !link) {
      errors.push({ externalId: id ?? undefined, reason: "Zorunlu alan eksik (id, title veya link)" });
      continue;
    }
    if (seen.has(id)) {
      errors.push({ externalId: id, reason: "Feed içinde yinelenen ürün kimliği; ilk kayıt kullanıldı" });
      continue;
    }
    if (!/^https?:\/\//i.test(link)) {
      errors.push({ externalId: id, reason: "Ürün adresi geçerli bir http(s) adresi değil" });
      continue;
    }
    const condition = field(r, "condition");
    if (condition && condition.toLowerCase() !== "new") {
      errors.push({ externalId: id, reason: `Yeni olmayan ürün atlandı (condition=${condition})` });
      continue;
    }
    const regular = parseAmountWithCurrency(field(r, "price", "g:price"), opts.defaultCurrency);
    const saleRaw = field(r, "sale_price", "g:sale_price");
    const effective = field(r, "sale_price_effective_date");
    const sale = saleRaw && salePriceActive(effective, now) ? parseAmountWithCurrency(saleRaw, opts.defaultCurrency) : null;
    if (!regular && !sale) {
      errors.push({ externalId: id, reason: "Fiyat çözümlenemedi" });
      continue;
    }
    const current = sale ?? regular!;
    if (current.minor <= 0) {
      errors.push({ externalId: id, reason: "Sıfır veya geçersiz fiyat" });
      continue;
    }
    const listPrice = sale && regular && regular.minor > sale.minor && regular.currency === sale.currency ? regular.minor : null;

    // Kargo: feed'de varsa ülkesi TR olan (veya ülkesiz) ilk kayıt; yoksa yapılandırma; yoksa bilinmiyor.
    let shippingMinor: number | null = opts.defaultShippingMinor ?? null;
    const shipping = r.shipping as Raw[] | Raw | undefined;
    const shipList = Array.isArray(shipping) ? shipping : shipping ? [shipping] : [];
    const tr = shipList.find((s) => !text((s as Raw).country) || text((s as Raw).country)?.toUpperCase() === "TR");
    if (tr) {
      const sp = parseAmountWithCurrency(text((tr as Raw).price), current.currency);
      if (sp && sp.currency === current.currency) shippingMinor = sp.minor;
    } else if (typeof r.shipping === "string") {
      const sp = parseAmountWithCurrency(r.shipping, current.currency);
      if (sp) shippingMinor = sp.minor;
    }
    if (shippingMinor !== null && opts.freeShippingThresholdMinor && current.minor >= opts.freeShippingThresholdMinor) shippingMinor = 0;

    const specs: Record<string, string> = {};
    const details = r.product_detail as Raw[] | undefined;
    if (Array.isArray(details)) {
      for (const d of details) {
        const name = text(d.attribute_name);
        const value = text(d.attribute_value);
        if (name && value && Object.keys(specs).length < 40) specs[name.slice(0, 60)] = value.slice(0, 200);
      }
    }

    seen.add(id);
    listings.push({
      externalId: id.slice(0, 190),
      url: link,
      title: title.slice(0, 300),
      brand: field(r, "brand"),
      gtin: normalizeGtin(field(r, "gtin", "ean", "barcode")),
      mpn: normalizeMpn(field(r, "mpn")),
      modelNumber: field(r, "model", "mpn"),
      categoryPath: field(r, "product_type", "google_product_category", "category"),
      description: field(r, "description")?.slice(0, 4000) ?? null,
      imageUrl: field(r, "image_link", "image"),
      priceMinor: current.minor,
      listPriceMinor: listPrice,
      shippingMinor,
      currency: current.currency,
      stockStatus: availability(field(r, "availability")),
      sellerName: field(r, "seller", "store"),
      rating: null,
      ratingCount: null,
      attributes: {
        color: field(r, "color") ?? undefined,
        size: field(r, "size") ?? undefined,
      },
      specs,
      promotion: sale && listPrice ? { text: "Mağaza indirimi (feed: sale_price)", endsAt: salePriceEnd(effective) } : null,
    });
  }
  return { listings, errors };
}

// ───────────────────────────── YML ─────────────────────────────

export function parseYml(body: string, opts: FeedParseOptions): { listings: NormalizedListing[]; errors: ListingError[] } {
  let doc: Raw;
  try {
    doc = xml.parse(body) as Raw;
  } catch (err) {
    return { listings: [], errors: [{ reason: `YML ayrıştırılamadı: ${(err as Error).message}` }] };
  }
  const shop = (doc.yml_catalog as Raw | undefined)?.shop as Raw | undefined;
  if (!shop) return { listings: [], errors: [{ reason: "YML biçimi tanınmadı (yml_catalog/shop yok)" }] };
  const categories = new Map<string, { name: string; parent?: string }>();
  for (const c of (((shop.categories as Raw | undefined)?.category as Raw[] | undefined) ?? []) as Raw[]) {
    const id = text(c["@id"]);
    if (id) categories.set(id, { name: text(c) ?? "", parent: text(c["@parentId"]) ?? undefined });
  }
  const path = (id: string | null): string | null => {
    const parts: string[] = [];
    let cur = id ? categories.get(id) : undefined;
    let guard = 0;
    while (cur && guard++ < 10) {
      parts.unshift(cur.name);
      cur = cur.parent ? categories.get(cur.parent) : undefined;
    }
    return parts.length ? parts.join(" > ") : null;
  };

  const records: Raw[] = [];
  for (const o of (((shop.offers as Raw | undefined)?.offer as Raw[] | undefined) ?? []) as Raw[]) {
    const vendor = text(o.vendor);
    const name = text(o.name) ?? [text(o.typePrefix), vendor, text(o.model)].filter(Boolean).join(" ");
    const params: Raw[] = (o.param as Raw[] | undefined) ?? [];
    const currency = text(o.currencyId) ?? opts.defaultCurrency;
    const priceMinor = parsePriceToMinor(text(o.price), currency);
    const oldMinor = parsePriceToMinor(text(o.oldprice), currency);
    const available = text(o["@available"]);
    records.push({
      id: text(o["@id"]),
      title: name,
      link: text(o.url),
      price: priceMinor !== null ? `${fromMinor(oldMinor && oldMinor > priceMinor ? oldMinor : priceMinor, currency)} ${currency}` : null,
      sale_price: oldMinor && priceMinor !== null && oldMinor > priceMinor ? `${fromMinor(priceMinor, currency)} ${currency}` : null,
      availability: available === null ? null : available === "true" ? "in_stock" : "out_of_stock",
      brand: vendor,
      gtin: text(o.barcode),
      mpn: text(o.vendorCode),
      model: text(o.model),
      image_link: text((o.picture as unknown[] | undefined)?.[0]),
      description: text(o.description),
      product_type: path(text(o.categoryId)),
      color: params.find((p) => /renk|color|цвет/i.test(text(p["@name"]) ?? "")) ? text(params.find((p) => /renk|color|цвет/i.test(text(p["@name"]) ?? ""))) : null,
      product_detail: params
        .map((p) => ({ attribute_name: text(p["@name"]), attribute_value: text(p) }))
        .filter((p) => p.attribute_name && p.attribute_value),
    });
  }
  return mapGoogleRecords(records, opts);
}

// ───────────────────────────── CSV ─────────────────────────────

export function parseCsv(body: string): Raw[] {
  const text = body.replace(/^\uFEFF/, "");
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
  const delimiter = [",", ";", "\t"].map((d) => ({ d, n: firstLine.split(d).length })).sort((a, b) => b.n - a.n)[0].d;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.length > 0)) rows.push(row);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/^g:/, "").replace(/\s+/g, "_"));
  return rows.slice(1).map((cells) => {
    const r: Raw = {};
    header.forEach((h, i) => {
      if (cells[i] !== undefined && cells[i] !== "") r[h] = cells[i].trim();
    });
    return r;
  });
}
