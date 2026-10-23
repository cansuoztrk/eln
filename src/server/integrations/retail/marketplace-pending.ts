/**
 * Trendyol ve Hepsiburada adaptörleri — "entegrasyon bekliyor".
 *
 * Araştırma sonucu (Ekim 2026, ayrıntılar docs/DATA-SOURCES.md):
 *  - Trendyol'un herkese açık geliştirici API'si (developers.trendyol.com) yalnızca pazaryeri
 *    SATICILARININ kendi mağazalarını yönetmesi içindir; üçüncü taraf fiyat karşılaştırması için
 *    ürün/fiyat verisi sunan resmî bir API doğrulanamadı. Satış ortaklığı tarafı sosyal medya
 *    içerik üreticilerine yönelik Influencer programıdır ve ürün veri akışı sağladığı doğrulanmadı.
 *  - Hepsiburada'nın geliştirici portalı (developers.hepsiburada.com) da satıcı entegrasyonu
 *    içindir; güncel ve açık bir satış ortaklığı ürün API'si doğrulanamadı.
 *
 * Bu nedenle bu kaynaklar scraping ile DOLDURULMAZ. Platformla resmî bir veri ortaklığı veya
 * yetkili bir satış ortaklığı ağı üzerinden ürün feed'i elde edildiğinde, feed adresi
 * `partnerFeedUrlEnv` ile tanımlanır ve adaptör genel feed ayrıştırıcısını kullanarak çalışır.
 */

import { IntegrationError, type RetailAdapter } from "../types";
import { productFeedAdapter } from "./product-feed";

function pendingMarketplace(opts: { key: string; displayName: string; docsUrl: string; envDefault: string; note: string }): RetailAdapter {
  return {
    key: opts.key,
    displayName: opts.displayName,
    description: opts.note,
    docsUrl: opts.docsUrl,
    capabilities: { lookupByIds: false, search: false, fullCatalog: true },

    checkConfiguration(source, secret) {
      const envName = (source.config.partnerFeedUrlEnv as string | undefined) ?? opts.envDefault;
      if (!secret(envName)) {
        return {
          ok: false,
          status: "AWAITING_INTEGRATION",
          missing: [envName],
          message: `${opts.note} Yetkili bir veri akışı elde edildiğinde ${envName} ortam değişkenine tanımlanmalıdır.`,
        };
      }
      return { ok: true, status: "CONNECTED", missing: [], message: "Yetkili iş ortağı feed'i tanımlı." };
    },

    async fetch(ctx, request) {
      const envName = (ctx.source.config.partnerFeedUrlEnv as string | undefined) ?? opts.envDefault;
      if (!ctx.secret(envName)) {
        throw new IntegrationError("AWAITING_INTEGRATION", `${opts.displayName} için yetkili veri erişimi henüz yok.`, { retryable: false });
      }
      return productFeedAdapter.fetch(
        { ...ctx, source: { ...ctx.source, config: { ...ctx.source.config, feedUrlEnv: envName } } },
        request,
      );
    },
  };
}

export const trendyolAdapter = pendingMarketplace({
  key: "trendyol",
  displayName: "Trendyol",
  docsUrl: "https://developers.trendyol.com/",
  envDefault: "TRENDYOL_PARTNER_FEED_URL",
  note: "Trendyol'un açık API'si satıcılar içindir; fiyat karşılaştırması için resmî ürün verisi erişimi doğrulanamadı.",
});

export const hepsiburadaAdapter = pendingMarketplace({
  key: "hepsiburada",
  displayName: "Hepsiburada",
  docsUrl: "https://developers.hepsiburada.com/",
  envDefault: "HEPSIBURADA_PARTNER_FEED_URL",
  note: "Hepsiburada'nın geliştirici portalı satıcı entegrasyonu içindir; satış ortaklığı ürün API'si doğrulanamadı.",
});
