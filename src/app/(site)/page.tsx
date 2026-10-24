import Link from "next/link";
import { HeroRadar } from "@/components/home/hero-radar";
import { HeroSearch } from "@/components/home/hero-search";
import { Icon } from "@/components/icons";
import { Freshness } from "@/components/price/freshness";
import { ProductCard, ProductGrid, ProductRail } from "@/components/product/product-card";
import { FlightDealCard } from "@/components/flights/flight-deal-card";
import { TestDataBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section";
import { getCurrentUser } from "@/server/auth/session";
import { getHomeData } from "@/server/catalog/home";
import { getNavCategories, getPopularSearches } from "@/server/catalog/nav";
import { getFavoriteIds } from "@/server/catalog/user";

export const dynamic = "force-dynamic";

const STATUS_TEXT: Record<string, { label: string; tone: string }> = {
  CONNECTED: { label: "Bağlı", tone: "bg-good" },
  TEST_ONLY: { label: "Test verisi", tone: "bg-warn" },
  DEGRADED: { label: "Sorunlu", tone: "bg-bad" },
  AWAITING_CREDENTIALS: { label: "Anahtar bekliyor", tone: "bg-line-strong" },
  AWAITING_INTEGRATION: { label: "Entegrasyon bekliyor", tone: "bg-line-strong" },
  DISABLED: { label: "Kapalı", tone: "bg-line-strong" },
};

export default async function HomePage() {
  const [data, user, popular, categories] = await Promise.all([getHomeData(), getCurrentUser(), getPopularSearches(), getNavCategories()]);
  const favs = user ? await getFavoriteIds(user.id) : [];
  const loggedIn = Boolean(user);
  const hasDeals = data.featured.length > 0;

  return (
    <>
      {/* ── Kahraman alanı */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_30%_20%,black_10%,transparent_70%)]" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="eyebrow mb-4 inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-good" aria-hidden />
              Türkiye fiyat radarı · e-ticaret ve uçak bileti
            </p>
            <h1 className="font-display text-[36px] font-[700] leading-[1.02] tracking-[-0.035em] sm:text-[48px] lg:text-[60px]">
              İyi fiyatı arama.
              <br />
              <span className="text-brand-ink">Gerçekten avantajlı</span> olanı gör.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-2">
              Mağazalar arası kargo dâhil karşılaştırma, kendi topladığımız fiyat geçmişi ve açıklanabilir fırsat puanı. Liste fiyatı değil, doğrulanmış indirim.
            </p>
            <div className="mt-7 max-w-2xl">
              <HeroSearch popular={popular} />
            </div>
            <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-[13px]">
              <div>
                <dt className="text-ink-3">Güncel teklif</dt>
                <dd className="font-display text-[20px] font-[680] tabular">{data.stats.offerCount.toLocaleString("tr-TR")}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Mağaza</dt>
                <dd className="font-display text-[20px] font-[680] tabular">{data.stats.retailerCount}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Son fiyat kontrolü</dt>
                <dd className="pt-1.5">
                  <Freshness at={data.stats.lastCheck} className="text-[12px]" />
                </dd>
              </div>
              {data.anyTestData ? (
                <div className="flex items-end pb-0.5">
                  <TestDataBadge />
                </div>
              ) : null}
            </dl>
          </div>
          <div className="hidden pb-8 lg:block">
            <HeroRadar items={data.featured} />
          </div>
        </div>
      </section>

      {data.anyTestData ? (
        <div className="border-b border-dashed border-warn bg-warn-soft">
          <p className="container-page py-2.5 text-[12.5px] text-warn-ink">
            <strong>Test ortamı:</strong> Bu sayfadaki ürünler, mağazalar ve fiyatlar kurgusal test verisidir; gerçek teklif değildir. Gerçek veri, yetkili kaynaklar bağlandığında görünür.
          </p>
        </div>
      ) : null}

      <div className="container-page space-y-16 py-12 md:py-16">
        {!hasDeals ? (
          <EmptyState
            title="Henüz doğrulanmış fırsat yok"
            action={
              <Link href="/veri-kaynaklari" className="text-sm font-medium text-brand-ink underline underline-offset-4">
                Veri kaynaklarının durumunu gör
              </Link>
            }
          >
            Fırsatlar yalnızca yetkili kaynaklardan gelen ve son kontrolde doğrulanan fiyatlarla gösterilir. Kaynaklar bağlandığında bu alan kendiliğinden dolar.
          </EmptyState>
        ) : null}

        {data.featured.length ? (
          <section>
            <SectionHeader eyebrow="Günün öne çıkanları" title="Fırsat puanı en yüksek ürünler" description="Puan; geçmiş fiyat, mağazalar arası fark, veri tazeliği ve stok durumundan hesaplanır. Sponsorlu yerleşimler puanı etkilemez." href="/firsatlar?sirala=avantaj" />
            <ProductGrid items={data.featured} loggedIn={loggedIn} favoriteIds={favs} priorityCount={4} />
          </section>
        ) : null}

        {data.advantageous.length || data.dropped.length ? (
          <section className="grid gap-10 xl:grid-cols-2">
            {data.advantageous.length ? (
              <div>
                <SectionHeader eyebrow="Doğrulanmış" title="Gerçekten avantajlı fiyatlar" description="30 günlük tipik fiyatın belirgin biçimde altında olanlar — mağazanın liste fiyatı değil, kendi kayıtlarımız." href="/firsatlar?etiket=gecmise-gore-avantajli" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {data.advantageous.map((p) => (
                    <ProductCard key={p.id} p={p} loggedIn={loggedIn} favorited={favs.includes(p.id)} />
                  ))}
                </div>
              </div>
            ) : null}
            {data.dropped.length ? (
              <div>
                <SectionHeader eyebrow="Son 7 gün" title="Fiyatı yeni düşenler" description="Bir hafta öncesine göre fiyatı en çok düşen ürünler." href="/firsatlar?sirala=dusus" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {data.dropped.map((p) => (
                    <ProductCard key={p.id} p={p} loggedIn={loggedIn} favorited={favs.includes(p.id)} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {data.tech.length ? (
          <section>
            <SectionHeader eyebrow="Teknoloji" title="Oyuncu ekipmanları ve teknoloji fırsatları" href="/kategori/teknoloji" />
            <ProductRail items={data.tech.slice(0, 8)} loggedIn={loggedIn} favoriteIds={favs} />
          </section>
        ) : null}

        {data.retailerTiles.length ? (
          <section>
            <SectionHeader eyebrow="Mağazalar" title="Mağazalara göre güncel teklifler" description="Her mağazanın teklif sayısı ve son başarılı veri güncellemesi." />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {data.retailerTiles.map((r) => (
                <li key={r.slug}>
                  <Link href={`/magaza/${r.slug}`} className="card flex h-full flex-col gap-3 p-4 transition-colors hover:border-line-strong">
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-md font-display text-[15px] font-bold text-white" style={{ background: r.color ?? "var(--ink-3)" }} aria-hidden>
                        {r.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold">{r.name}</span>
                        <span className="block text-[12px] text-ink-3 tabular">{r.offers} güncel teklif</span>
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <Freshness at={r.lastSuccessAt} prefix="güncellendi" />
                      {r.isTestData ? <TestDataBadge /> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.lowest30.length || data.fresh.length ? (
          <section className="grid gap-10 xl:grid-cols-2">
            {data.lowest30.length ? (
              <div>
                <SectionHeader eyebrow="Fiyat geçmişi" title="Son 30 günün en düşük fiyatında" href="/firsatlar?etiket=30-gunun-en-dusugu" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {data.lowest30.map((p) => (
                    <ProductCard key={p.id} p={p} loggedIn={loggedIn} favorited={favs.includes(p.id)} />
                  ))}
                </div>
              </div>
            ) : null}
            {data.fresh.length ? (
              <div>
                <SectionHeader eyebrow="Yeni" title="Yeni bulunan fırsatlar" description="Son 7 günde takibe alınan ürünler. Fiyat geçmişi birikene kadar geçmiş karşılaştırması yapılmaz." href="/firsatlar?sirala=yeni" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {data.fresh.map((p) => (
                    <ProductCard key={p.id} p={p} loggedIn={loggedIn} favorited={favs.includes(p.id)} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section>
          <SectionHeader eyebrow="Uçak bileti" title="Uygun uçuş fırsatları" description="İzlenen rotalarda sağlayıcıdan gelen en düşük fiyatlar. Önbellek fiyatları gösterge niteliğindedir." href="/ucak-bileti" />
          {data.flights.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.flights.map((f) => (
                <li key={f.id}>
                  <FlightDealCard f={f} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="plane" title="Uçuş sağlayıcısı henüz bağlı değil">
              Uçuş fiyatları uydurulmaz; yetkili bir sağlayıcı (ör. Travelpayouts) bağlandığında izlenen rotalar burada listelenir.
            </EmptyState>
          )}
        </section>

        {data.trackedCategories.length ? (
          <section>
            <SectionHeader eyebrow="Topluluk" title="En çok takip edilen kategoriler" description="Kullanıcıların aktif fiyat alarmları ve favorileri." />
            <ul className="flex flex-wrap gap-2">
              {data.trackedCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/kategori/${c.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] hover:border-line-strong">
                    <Icon name={c.icon ?? "grid"} className="size-4 text-ink-3" />
                    {c.name}
                    <span className="font-mono text-[11px] text-ink-3">
                      {c.alerts} alarm · {c.favorites} favori
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <SectionHeader eyebrow="Keşfet" title="Kategoriler" href="/kategoriler" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((c) => (
              <div key={c.slug} className="card p-4">
                <Link href={`/kategori/${c.slug}`} className="mb-3 flex items-center gap-2.5 font-semibold hover:text-brand-ink">
                  <span className="grid size-9 place-items-center rounded-md bg-brand-soft text-brand-ink">
                    <Icon name={c.icon ?? "grid"} className="size-[18px]" />
                  </span>
                  {c.name}
                </Link>
                <ul className="flex flex-wrap gap-1.5">
                  {c.children.slice(0, 8).map((ch) => (
                    <li key={ch.slug}>
                      <Link href={`/kategori/${ch.slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12.5px] text-ink-2 hover:border-line-strong hover:text-ink">
                        <Icon name={ch.icon ?? "spark"} className="size-3.5 text-ink-3" />
                        {ch.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Güven */}
        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
            <div className="p-6 md:p-8">
              <p className="eyebrow mb-2">Nasıl çalışır</p>
              <h2 className="font-display text-[24px] font-[680] tracking-tight">Neden bu fiyatlara güvenebilirsiniz?</h2>
              <ul className="mt-5 space-y-4 text-[14px] leading-relaxed text-ink-2">
                {[
                  ["shield", "Yalnızca yetkili kaynaklar", "Resmî API, satış ortaklığı feed'i veya izinli veri akışı. Erişim kontrollerini aşan scraping yok."],
                  ["clock", "Her fiyatın zaman damgası", "Son kontrol zamanı gösterilir. Güncelliği doğrulanamayan teklif aktif fırsat sayılmaz."],
                  ["chart", "Kendi fiyat geçmişimiz", "İndirim, mağazanın liste fiyatına göre değil; topladığımız doğrulanmış geçmişe göre hesaplanır."],
                  ["compare", "Toplam maliyet", "Kargo bilinmiyorsa “bilinmiyor” yazar; kuponlar doğrulanmadan fiyattan düşülmez."],
                ].map(([icon, title, text]) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
                      <Icon name={icon} className="size-4" />
                    </span>
                    <span>
                      <strong className="block text-ink">{title}</strong>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-4 text-[13px] font-medium">
                <Link href="/nasil-calisir" className="text-brand-ink underline underline-offset-4">
                  Fırsat puanı nasıl hesaplanır?
                </Link>
                <Link href="/veri-kaynaklari" className="text-brand-ink underline underline-offset-4">
                  Veri kaynakları
                </Link>
              </div>
            </div>
            <div className="border-t border-line bg-surface-2 p-6 md:p-8 lg:border-l lg:border-t-0">
              <p className="eyebrow mb-4">Kaynak durumu · canlı</p>
              <ul className="divide-y divide-line">
                {data.sources.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`size-2 shrink-0 rounded-full ${STATUS_TEXT[s.status]?.tone ?? "bg-line-strong"}`} aria-hidden />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="shrink-0 text-ink-3">{STATUS_TEXT[s.status]?.label ?? s.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
