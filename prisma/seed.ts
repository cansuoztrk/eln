/**
 * Temel (referans) veriler: kategoriler, mağazalar, veri kaynakları, havalimanları, havayolları,
 * izlenen rota listesi, fırsat puanı yapılandırması ve zamanlanmış görevler.
 *
 * FİYAT VERİSİ İÇERMEZ. Gerçek fiyatlar yalnızca yapılandırılmış veri kaynaklarından gelir.
 * Yerel geliştirme için kurgusal test verisi: `npm run db:seed:demo`
 *
 * Tekrar çalıştırılabilir (idempotent): mevcut kayıtları korur, eksikleri ekler. Her dağıtımda
 * çalıştırılabilir; yönetim panelinde yapılan kategori düzenlemelerini ezmez.
 *
 * ADMIN_EMAIL ve ADMIN_PASSWORD tanımlıysa ve bu e-postayla hesap yoksa ilk yönetici oluşturulur.
 */
import "dotenv/config";
import type { Prisma } from "../src/generated/prisma/client";
import { normalizeText } from "../src/lib/text";
import { ensureBootstrapAdmin } from "../src/server/auth/bootstrap";
import { db } from "../src/server/db";
import { ensureSchedules } from "../src/server/jobs/scheduler";
import { DEFAULT_SCORING } from "../src/server/pricing/config";
import { AIRLINES, AIRPORTS, CITY_CODES, DEFAULT_ROUTES } from "./data/airports";
import { CATEGORY_TREE } from "./data/categories";

async function seedCategories() {
  let order = 0;
  for (const parent of CATEGORY_TREE) {
    const p = await db.category.upsert({
      where: { slug: parent.slug },
      create: { slug: parent.slug, name: parent.name, icon: parent.icon, description: parent.description, sortOrder: order++, keywords: [] },
      update: {},
    });
    let childOrder = 0;
    for (const c of parent.children ?? []) {
      await db.category.upsert({
        where: { slug: c.slug },
        create: {
          slug: c.slug,
          name: c.name,
          icon: c.icon,
          parentId: p.id,
          sortOrder: childOrder++,
          keywords: (c.keywords ?? []).map(normalizeText),
          filterSchema: (c.filters ?? []) as unknown as Prisma.InputJsonValue,
          description: c.description,
        },
        update: {},
      });
    }
  }
}

const RETAILERS = [
  { slug: "amazon-tr", name: "Amazon Türkiye", websiteUrl: "https://www.amazon.com.tr", logoText: "amazon", brandColor: "#ff9900", affiliateProgram: "Amazon Ortaklık Programı (amazon.com.tr)" },
  { slug: "trendyol", name: "Trendyol", websiteUrl: "https://www.trendyol.com", logoText: "trendyol", brandColor: "#f27a1a", affiliateProgram: null },
  { slug: "hepsiburada", name: "Hepsiburada", websiteUrl: "https://www.hepsiburada.com", logoText: "hepsiburada", brandColor: "#ff6000", affiliateProgram: null },
];

async function seedRetailersAndSources() {
  const ids: Record<string, string> = {};
  for (const r of RETAILERS) {
    const row = await db.retailer.upsert({ where: { slug: r.slug }, create: r, update: { name: r.name, websiteUrl: r.websiteUrl } });
    ids[r.slug] = row.id;
  }
  const sources: Prisma.DataSourceUncheckedCreateInput[] = [
    {
      key: "amazon-tr",
      name: "Amazon Türkiye · Creators API",
      kind: "RETAIL",
      adapter: "amazon-creators",
      status: "AWAITING_CREDENTIALS",
      retailerId: ids["amazon-tr"],
      refreshIntervalMinutes: 60,
      fullSyncIntervalMinutes: 1440,
      // Amazon: Offers verisinin TTL'i 1 saat; bu süreyi biraz aşan veri "güncel" gösterilmez.
      freshnessWindowMinutes: 75,
      rateLimitPerMinute: 50,
      docsUrl: "https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction",
      config: {
        credentialVersion: "3.2",
        marketplace: "www.amazon.com.tr",
        searchQueries: [
          { keywords: "oyuncu faresi", searchIndex: "Computers", pages: 2 },
          { keywords: "mekanik klavye", searchIndex: "Computers", pages: 2 },
          { keywords: "oyuncu monitörü", searchIndex: "Computers", pages: 2 },
          { keywords: "ekran kartı", searchIndex: "Computers", pages: 2 },
          { keywords: "nvme ssd", searchIndex: "Computers", pages: 1 },
          { keywords: "kablosuz kulaklık", searchIndex: "Electronics", pages: 1 },
        ],
      },
      notes: "Amazon Ortaklık Programı hesabı ve Creators API onayı gerekir. PA-API 5.0 2026'da kapatıldı.",
    },
    {
      key: "trendyol",
      name: "Trendyol",
      kind: "RETAIL",
      adapter: "trendyol",
      status: "AWAITING_INTEGRATION",
      retailerId: ids.trendyol,
      refreshIntervalMinutes: 180,
      fullSyncIntervalMinutes: 1440,
      freshnessWindowMinutes: 360,
      docsUrl: "https://developers.trendyol.com/",
      config: { partnerFeedUrlEnv: "TRENDYOL_PARTNER_FEED_URL" },
      notes: "Herkese açık API yalnızca satıcılar içindir. Yetkili veri ortaklığı/feed bekleniyor; scraping yapılmaz.",
    },
    {
      key: "hepsiburada",
      name: "Hepsiburada",
      kind: "RETAIL",
      adapter: "hepsiburada",
      status: "AWAITING_INTEGRATION",
      retailerId: ids.hepsiburada,
      refreshIntervalMinutes: 180,
      fullSyncIntervalMinutes: 1440,
      freshnessWindowMinutes: 360,
      docsUrl: "https://developers.hepsiburada.com/",
      config: { partnerFeedUrlEnv: "HEPSIBURADA_PARTNER_FEED_URL" },
      notes: "Geliştirici portalı satıcı entegrasyonu içindir. Yetkili veri ortaklığı/feed bekleniyor; scraping yapılmaz.",
    },
    {
      key: "travelpayouts",
      name: "Travelpayouts · Aviasales Data API",
      kind: "FLIGHT",
      adapter: "travelpayouts",
      status: "AWAITING_CREDENTIALS",
      refreshIntervalMinutes: 360,
      fullSyncIntervalMinutes: 1440,
      freshnessWindowMinutes: 720,
      rateLimitPerMinute: 30,
      docsUrl: "https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API",
      config: { market: "tr", currency: "try", monthsAhead: 3 },
      notes: "Önbellek (son 48 saat) gösterge fiyatları. Ücretsiz kayıt + API token.",
    },
    {
      key: "duffel",
      name: "Duffel · canlı arama",
      kind: "FLIGHT",
      adapter: "duffel",
      status: "AWAITING_CREDENTIALS",
      refreshIntervalMinutes: 1440,
      fullSyncIntervalMinutes: 1440,
      freshnessWindowMinutes: 30,
      rateLimitPerMinute: 20,
      docsUrl: "https://duffel.com/docs/api/overview/welcome",
      config: { apiVersion: "v2" },
      notes: "Canlı arama; sipariş başına ücret ve arama/rezervasyon oranı aşımında arama ücreti var (docs/DATA-SOURCES.md).",
    },
  ];
  for (const s of sources) {
    await db.dataSource.upsert({ where: { key: s.key }, create: s, update: { name: s.name, docsUrl: s.docsUrl, notes: s.notes } });
  }
}

async function seedAirports() {
  for (const a of [...CITY_CODES, ...AIRPORTS]) {
    const data = {
      name: a.name,
      city: a.city,
      cityCode: a.cityCode ?? null,
      country: a.country,
      countryCode: a.countryCode,
      isTurkey: a.countryCode === "TR",
      popularity: a.popularity ?? 0,
      searchText: normalizeText(`${a.iata} ${a.name} ${a.city} ${a.country}`),
    };
    await db.airport.upsert({ where: { iata: a.iata }, create: { iata: a.iata, ...data }, update: data });
  }
  for (const al of AIRLINES) await db.airline.upsert({ where: { iata: al.iata }, create: al, update: { name: al.name } });
  let order = 0;
  for (const r of DEFAULT_ROUTES) {
    await db.flightRoute.upsert({
      where: { origin_destination: { origin: r.origin, destination: r.destination } },
      create: { origin: r.origin, destination: r.destination, tags: r.tags, isInternational: Boolean(r.international), sortOrder: order++, label: r.label },
      update: {},
    });
  }
}

async function seedScoring() {
  const existing = await db.scoringConfig.findFirst({ where: { isActive: true } });
  if (!existing) {
    await db.scoringConfig.create({
      data: { version: 1, weights: DEFAULT_SCORING.weights, thresholds: DEFAULT_SCORING.thresholds, isActive: true, note: "Varsayılan yapılandırma" },
    });
  }
}

async function main() {
  await seedCategories();
  await seedRetailersAndSources();
  await seedAirports();
  await seedScoring();
  await ensureSchedules(db);
  console.log("Temel veriler hazır: kategoriler, mağazalar, veri kaynakları, havalimanları, rotalar, zamanlamalar.");
  const admin = await ensureBootstrapAdmin(db, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  const adminMessages = {
    created: "İlk yönetici hesabı oluşturuldu. Güvenlik için ADMIN_PASSWORD ortam değişkenini şimdi silebilirsiniz.",
    exists: "Yönetici hesabı zaten var; değiştirilmedi.",
    conflict: "UYARI: ADMIN_EMAIL ile açılmış normal bir hesap var; otomatik olarak yönetici yapılmadı.",
    skipped: null,
  } as const;
  if (adminMessages[admin]) console.log(adminMessages[admin]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
