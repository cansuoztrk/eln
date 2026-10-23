/**
 * Genel ürün veri akışı adaptörü.
 *
 * Mağazanın veya satış ortaklığı ağının (ör. Admitad, Awin, mağazanın kendi iş ortaklığı
 * programı) YETKİLİ olarak sağladığı feed adresini okur. Feed adresi çoğunlukla erişim anahtarı
 * içerdiğinden veritabanında değil ortam değişkeninde tutulur (config.feedUrlEnv).
 *
 * Yapılandırma (DataSource.config):
 *  {
 *    "feedUrlEnv": "FEED_ORNEK_MAGAZA_URL",   // gizli adres içeren ortam değişkeninin ADI
 *    "feedUrl": "https://...",                 // veya gizli olmayan, herkese açık feed adresi
 *    "format": "auto" | "google-merchant" | "yml" | "csv" | "json",
 *    "currency": "TRY",
 *    "defaultShippingMinor": null,             // mağaza politikası biliniyorsa
 *    "freeShippingThresholdMinor": null,
 *    "authHeaderEnv": "FEED_ORNEK_TOKEN"       // feed Bearer token istiyorsa
 *  }
 */

import { IntegrationError, type RetailAdapter } from "../types";
import { type FeedFormat, parseFeed } from "./feed-parser";

type FeedConfig = {
  feedUrlEnv?: string;
  feedUrl?: string;
  format?: FeedFormat;
  currency?: string;
  defaultShippingMinor?: number | null;
  freeShippingThresholdMinor?: number | null;
  authHeaderEnv?: string;
};

function resolveUrl(config: FeedConfig, secret: (n: string | undefined) => string | undefined): string | undefined {
  return secret(config.feedUrlEnv) ?? config.feedUrl;
}

export const productFeedAdapter: RetailAdapter = {
  key: "product-feed",
  displayName: "Ürün veri akışı (XML/CSV/JSON/YML)",
  description:
    "Mağazanın veya satış ortaklığı ağının izin verdiği ürün feed'ini okur. Google Merchant XML, YML (Admitad), CSV ve JSON biçimlerini destekler.",
  docsUrl: "https://support.google.com/merchants/answer/7052112",
  capabilities: { lookupByIds: false, search: false, fullCatalog: true },

  checkConfiguration(source, secret) {
    const config = source.config as FeedConfig;
    const url = resolveUrl(config, secret);
    if (!url) {
      return {
        ok: false,
        status: "AWAITING_CREDENTIALS",
        missing: [config.feedUrlEnv ?? "feedUrlEnv"],
        message: "Yetkili feed adresi tanımlı değil. Feed adresini içeren ortam değişkenini ayarlayın.",
      };
    }
    if (!/^https?:\/\//.test(url)) {
      return { ok: false, status: "AWAITING_CREDENTIALS", missing: ["feedUrl"], message: "Feed adresi http(s) ile başlamalı." };
    }
    if (config.authHeaderEnv && !secret(config.authHeaderEnv)) {
      return { ok: false, status: "AWAITING_CREDENTIALS", missing: [config.authHeaderEnv], message: "Feed erişim anahtarı eksik." };
    }
    return { ok: true, status: "CONNECTED", missing: [], message: "Feed adresi yapılandırılmış." };
  },

  async fetch(ctx) {
    const config = ctx.source.config as FeedConfig;
    const url = resolveUrl(config, ctx.secret);
    if (!url) throw new IntegrationError("NOT_CONFIGURED", "Feed adresi tanımlı değil", { retryable: false });

    const headers: Record<string, string> = { accept: "application/xml, text/xml, text/csv, application/json;q=0.9, */*;q=0.5" };
    const token = ctx.secret(config.authHeaderEnv);
    if (token) headers.authorization = `Bearer ${token}`;

    ctx.log("INFO", "Feed indiriliyor", { host: safeHost(url) });
    const { body, response } = await ctx.http.text(url, { headers, timeoutMs: 120_000 });
    if (!response.ok) {
      throw new IntegrationError(response.status === 404 ? "NOT_FOUND" : "UPSTREAM", `Feed ${response.status} döndürdü`, {
        retryable: response.status >= 500,
      });
    }
    const result = parseFeed(body, {
      format: config.format ?? "auto",
      defaultCurrency: config.currency ?? "TRY",
      defaultShippingMinor: config.defaultShippingMinor ?? null,
      freeShippingThresholdMinor: config.freeShippingThresholdMinor ?? null,
      now: ctx.now,
    });
    if (result.listings.length === 0 && result.errors.length > 0 && result.errors.length === 1 && !result.errors[0].externalId) {
      // Biçim tamamen tanınmadıysa sağlayıcı formatı değiştirmiş olabilir: kataloğu "boş" sanıp
      // tüm teklifleri sona erdirmemek için hata olarak yükseltilir.
      throw new IntegrationError("FORMAT", result.errors[0].reason, { retryable: false });
    }
    ctx.log("INFO", "Feed ayrıştırıldı", { format: result.format, listings: result.listings.length, errors: result.errors.length });
    return {
      listings: result.listings,
      errors: result.errors,
      notFoundIds: [],
      // Feed tam katalogdur; ancak boş feed'i (geçici sorun olabilir) tam katalog saymayız.
      completeCatalog: result.listings.length > 0,
      requests: 1,
    };
  },
};

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "?";
  }
}
