/**
 * Pazar (ülke/dil) yapılandırması. Yeni bir ülke eklemek için buraya bir giriş eklenir ve
 * MARKET ortam değişkeni ile seçilir. Tüm biçimlendirme (para, tarih, saat dilimi) buradan okunur.
 */
export type MarketConfig = {
  code: string;
  locale: string;
  currency: string;
  timeZone: string;
  country: string;
  homeAirports: string[];
};

const markets: Record<string, MarketConfig> = {
  tr: {
    code: "tr",
    locale: "tr-TR",
    currency: "TRY",
    timeZone: "Europe/Istanbul",
    country: "TR",
    homeAirports: ["IST", "SAW", "ESB", "ADB", "AYT"],
  },
};

export const market: MarketConfig = markets[process.env.NEXT_PUBLIC_MARKET || "tr"] ?? markets.tr;
