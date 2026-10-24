import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceAlertForm } from "@/components/alerts/price-alert-form";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { Icon } from "@/components/icons";
import { DealLabels } from "@/components/price/deal-labels";
import { Freshness } from "@/components/price/freshness";
import { Price, ShippingNote } from "@/components/price/price";
import { SignalMeter } from "@/components/price/signal-meter";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductGrid } from "@/components/product/product-card";
import { ProductImage } from "@/components/product/product-image";
import { Badge, TestDataBadge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section";
import { siteUrl } from "@/config/brand";
import { cn } from "@/lib/cn";
import { DEAL_LABELS } from "@/lib/deal-labels";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/time";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getProductDetail, type OfferRow } from "@/server/catalog/product";
import { summarizePriceHistory } from "@/server/pricing/summary";

const MATCH_TEXT: Record<string, string> = {
  GTIN: "GTIN/EAN barkodu ile birebir",
  BRAND_MPN: "Marka + üretici parça numarası ile",
  SOURCE_ID: "Kaynak kimliği ile",
  TITLE_SIMILARITY: "Aynı marka ve model ailesi (varyant nitelikleri ayrı)",
  NEW_PRODUCT: "Bu kaynaktan ilk kayıt",
  MANUAL: "Yönetici tarafından doğrulandı",
};

const STOCK_TEXT: Record<string, string> = { IN_STOCK: "Stokta", LOW_STOCK: "Az stok (kaynak bildirimi)", OUT_OF_STOCK: "Stokta yok", PREORDER: "Ön sipariş", UNKNOWN: "Stok bilgisi yok" };

export async function generateMetadata(props: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await db.product.findUnique({ where: { slug }, select: { title: true, slug: true, isTestData: true, bestTotalMinor: true, bestCurrency: true, imageUrl: true, brand: { select: { name: true } } } });
  if (!p) return {};
  const price = p.bestTotalMinor ? ` En iyi doğrulanmış teklif ${formatMoney(p.bestTotalMinor, p.bestCurrency ?? "TRY")}.` : "";
  return {
    title: `${p.title} fiyatları ve fiyat geçmişi`,
    description: `${p.title} için mağazalar arası kargo dâhil fiyat karşılaştırması, doğrulanmış fiyat geçmişi ve fiyat alarmı.${price}`,
    alternates: { canonical: `/urun/${p.slug}` },
    robots: p.isTestData ? { index: false, follow: false } : undefined,
    openGraph: { title: p.title, images: p.imageUrl ? [p.imageUrl] : undefined, type: "website" },
  };
}

export default async function ProductPage(props: PageProps<"/urun/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const detail = await getProductDetail(slug);
  if (!detail) notFound();
  const user = await getCurrentUser();
  const { product, offers, best, series, coupons } = detail;

  const [favorited, myAlert] = user
    ? await Promise.all([
        db.userFavorite.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }).then(Boolean),
        db.priceAlert.findFirst({ where: { userId: user.id, productId: product.id }, orderBy: { updatedAt: "desc" } }),
        db.recentlyViewed.upsert({ where: { userId_productId: { userId: user.id, productId: product.id } }, create: { userId: user.id, productId: product.id }, update: { viewedAt: new Date() } }),
      ])
    : [false, null];

  // Varyant seçimi (URL'de; paylaşılabilir)
  const variantParam = typeof sp.varyant === "string" ? sp.varyant : null;
  const bestVariantId = best?.variantId ?? offers[0]?.variantId ?? null;
  const selectedVariant = product.variants.length > 1 ? (product.variants.find((v) => v.id === variantParam)?.id ?? (variantParam === "tumu" ? null : bestVariantId)) : null;
  const shownOffers = selectedVariant ? offers.filter((o) => o.variantId === selectedVariant) : offers;
  const variantOfOffer = new Map(offers.map((o) => [o.id, o.variantId]));
  const retailerSlots = [...new Set(series.map((s) => s.retailerSlug))].sort();
  const chartSeries = series
    .filter((s) => !selectedVariant || variantOfOffer.get(s.offerId) === selectedVariant)
    .slice(0, 4)
    .map((s) => ({ key: s.offerId, label: product.variants.length > 1 && !selectedVariant ? `${s.retailerName} · ${s.variantLabel}` : s.retailerName, slot: retailerSlots.indexOf(s.retailerSlug), points: s.points }));

  const m = best?.metrics ?? null;
  const summary = best ? summarizePriceHistory(m, { currency: best.currency, retailerName: best.retailer.name, retailersCompared: new Set(offers.filter((o) => o.status === "ACTIVE").map((o) => o.retailer.slug)).size, priceMinor: best.priceMinor }) : [];
  const suggested = m?.d90.lowMinor ?? (best ? Math.round(best.priceMinor * 0.95) : null);
  const activeOffers = offers.filter((o) => o.status === "ACTIVE" && !o.isTestData);

  const jsonLd =
    !product.isTestData && activeOffers.length
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
          ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
          ...(product.variants[0]?.gtin ? { gtin14: product.variants[0].gtin } : {}),
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: activeOffers[0].currency,
            lowPrice: (Math.min(...activeOffers.map((o) => o.priceMinor)) / 100).toFixed(2),
            highPrice: (Math.max(...activeOffers.map((o) => o.priceMinor)) / 100).toFixed(2),
            offerCount: activeOffers.length,
          },
          url: siteUrl(`/urun/${product.slug}`),
        }
      : null;

  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}
      {product.isTestData ? (
        <div className="border-b border-dashed border-warn bg-warn-soft">
          <p className="container-page py-2.5 text-[12.5px] text-warn-ink">
            <strong>Test verisi:</strong> Bu ürün, mağazaları ve fiyat geçmişi kurgusaldır; gerçek bir teklif değildir.
          </p>
        </div>
      ) : null}

      <div className="container-page py-6 md:py-8">
        <nav aria-label="Konum" className="mb-5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-3">
          <Link href="/kategoriler" className="hover:text-ink">
            Kategoriler
          </Link>
          {product.category.parent ? (
            <>
              <Icon name="chevronRight" className="size-3.5" />
              <Link href={`/kategori/${product.category.parent.slug}`} className="hover:text-ink">
                {product.category.parent.name}
              </Link>
            </>
          ) : null}
          <Icon name="chevronRight" className="size-3.5" />
          <Link href={`/kategori/${product.category.slug}`} className="hover:text-ink">
            {product.category.name}
          </Link>
        </nav>

        {/* ── Üst bölüm */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <div>
            <div className="card relative aspect-square overflow-hidden">
              <ProductImage src={product.imageUrl} alt={product.title} icon={product.category.icon} priority />
              <div className="absolute right-3 top-3">
                <FavoriteButton productId={product.id} loggedIn={Boolean(user)} initial={Boolean(favorited)} />
              </div>
              {product.isTestData ? <TestDataBadge className="absolute left-3 top-3" /> : null}
            </div>
            {Object.keys(product.specs).length ? (
              <div className="card mt-4 p-4">
                <p className="eyebrow mb-3">Temel özellikler</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                  {Object.entries(product.specs)
                    .slice(0, 12)
                    .map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="text-ink-3">{k}</dt>
                        <dd className="truncate font-medium">{v}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-ink-3">
              {product.brand?.name ?? "Marka belirtilmemiş"}
              {product.modelNumber ? ` · Model ${product.modelNumber}` : ""}
            </p>
            <h1 className="mt-1.5 font-display text-[26px] font-[680] leading-[1.15] tracking-[-0.02em] md:text-[32px]">{product.title}</h1>

            {product.variants.length > 1 ? (
              <div className="mt-4">
                <p className="mb-2 text-[12.5px] text-ink-3">Varyant</p>
                <ul className="flex flex-wrap gap-1.5">
                  <li>
                    <Link href={`?varyant=tumu`} scroll={false} className={cn("inline-flex h-8 items-center rounded-md border px-3 text-[13px]", !selectedVariant ? "border-ink bg-ink text-bg" : "border-line hover:border-line-strong")}>
                      Tümü
                    </Link>
                  </li>
                  {product.variants.map((v) => (
                    <li key={v.id}>
                      <Link href={`?varyant=${v.id}`} scroll={false} className={cn("inline-flex h-8 items-center rounded-md border px-3 text-[13px]", selectedVariant === v.id ? "border-ink bg-ink text-bg" : "border-line hover:border-line-strong")}>
                        {v.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {best ? (
              <div className="card mt-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] text-ink-3">En iyi doğrulanmış teklif · {best.variantLabel}</p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Price minor={best.totalMinor ?? best.priceMinor} currency={best.currency} className="text-[36px] leading-none" />
                      {m?.verifiedDiscount ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-good-soft px-2 py-1 text-[13px] font-semibold text-good-ink">
                          <Icon name="arrowDown" className="size-3.5" />
                          {formatPercent(m.verifiedDiscount.percent, 1)}
                          <span className="font-normal">· {m.verifiedDiscount.reference === "MEDIAN_30" ? "30 günlük tipik fiyata göre" : "önceki doğrulanmış fiyata göre"}</span>
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink-2">
                      {best.totalMinor !== null && best.shippingMinor ? `${formatMoney(best.priceMinor, best.currency)} + ${formatMoney(best.shippingMinor, best.currency)} kargo` : <ShippingNote shippingMinor={best.shippingMinor} currency={best.currency} />}
                      {" · "}
                      <strong className="font-semibold text-ink">{best.retailer.name}</strong>
                      {best.sellerName && best.sellerName !== best.retailer.name ? ` (satıcı: ${best.sellerName})` : ""}
                    </p>
                  </div>
                  <SignalMeter score={best.dealScore} className="pt-1" />
                </div>
                {m?.listDiscount ? (
                  <p className={cn("mt-3 rounded-md px-3 py-2 text-[12.5px]", m.listDiscount.credible === false ? "bg-warn-soft text-warn-ink" : "bg-surface-2 text-ink-2")}>
                    Mağazanın gösterdiği eski/liste fiyatı {formatMoney(m.listDiscount.referenceMinor, best.currency)} (liste fiyatına göre {formatPercent(m.listDiscount.percent)}). {m.listDiscount.note ?? "Liste fiyatı mağaza beyanıdır; sıralamada kullanılmaz."}
                  </p>
                ) : null}
                <DealLabels labels={best.labels} max={5} className="mt-3.5" />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={`/git/${best.id}?yer=urun-ust`}
                    rel="nofollow sponsored noopener"
                    target="_blank"
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-[14px] font-semibold text-on-brand transition-colors hover:bg-brand-ink"
                  >
                    {best.retailer.name} mağazasına git
                    <Icon name="external" className="size-4" />
                  </a>
                  <a href="#alarm" className="inline-flex h-11 items-center gap-2 rounded-md border border-line-strong px-4 text-[14px] font-medium hover:bg-surface-2">
                    <Icon name="bellPlus" className="size-4" />
                    Fiyat alarmı
                  </a>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <Freshness at={best.lastSuccessAt} windowMinutes={best.freshnessWindowMinutes} source={best.sourceName} />
                  <span className="text-[11.5px] text-ink-3">{best.retailer.affiliateEnabled ? "Satış ortaklığı bağlantısı · fiyatı etkilemez" : "Doğrudan mağaza bağlantısı"}</span>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-warn bg-warn-soft p-4 text-[13.5px] text-warn-ink">
                Bu ürün için şu anda doğrulanmış güncel teklif yok. Aşağıdaki tekliflerin fiyatı yeniden doğrulanıyor veya stokta değil; son kontrol zamanları tabloda gösterilir.
              </div>
            )}

            {summary.length ? (
              <section className="mt-5" aria-labelledby="ozet">
                <h2 id="ozet" className="mb-2 flex items-center gap-2 text-[14px] font-semibold">
                  <Icon name="chart" className="size-4 text-ink-3" />
                  Fiyat geçmişi özeti
                </h2>
                <ul className="space-y-1.5 text-[13.5px] leading-relaxed">
                  {summary.map((l) => (
                    <li key={l.text} className="flex gap-2">
                      <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", l.tone === "positive" ? "bg-good" : l.tone === "warning" ? "bg-warn" : "bg-ink-3")} aria-hidden />
                      <span className="text-ink-2">{l.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11.5px] text-ink-3">Özet geçmiş kayıtlara dayanır; gelecekteki fiyatı tahmin etmez.</p>
              </section>
            ) : null}
          </div>
        </div>

        {/* ── Teklifler */}
        <section className="mt-12" id="teklifler">
          <SectionHeader eyebrow="Karşılaştırma" title="Mağazalardaki teklifler" description="Kargo dâhil toplam maliyete göre sıralanır. Kargo bedeli bilinmeyen tekliflerde toplam hesaplanmaz." />
          <OffersTable offers={shownOffers} />
        </section>

        {/* ── Fiyat geçmişi */}
        <section className="mt-12" id="gecmis">
          <SectionHeader eyebrow="Fiyat geçmişi" title="Fiyat nasıl değişti?" description={`Kendi doğruladığımız kayıtlar: günlük en düşük fiyat. İlk kayıt ${formatDate(detail.firstTrackedAt)}${detail.lastCheckedAt ? `, son kontrol ${formatDateTime(detail.lastCheckedAt)}` : ""}.`} />
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="card p-4 md:p-5">
              <PriceHistoryChart series={chartSeries} currency={best?.currency ?? offers[0]?.currency ?? "TRY"} firstTrackedAt={detail.firstTrackedAt} />
            </div>
            <WindowsTable m={m} currency={best?.currency ?? "TRY"} />
          </div>
        </section>

        {/* ── Kuponlar */}
        {coupons.length ? (
          <section className="mt-12" id="kuponlar">
            <SectionHeader eyebrow="Kupon ve kampanyalar" title="Uygulanabilecek avantajlar" description="Doğrulanmamış kuponlar fiyattan düşülmez; birden fazla kupon birlikte uygulanabileceği doğrulanmadıkça toplanmaz." />
            <ul className="grid gap-3 md:grid-cols-2">
              {coupons.map((c) => (
                <li key={c.id} className="card flex gap-4 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                    <Icon name="ticket" className="size-5" />
                  </span>
                  <div className="min-w-0 text-[13.5px]">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {c.title}
                      {c.isTestData ? <TestDataBadge /> : null}
                    </p>
                    <p className="mt-0.5 text-ink-2">
                      {c.retailer.name} · {c.conditionLabel}
                      {c.minBasketMinor ? ` · en az ${formatMoney(c.minBasketMinor)} sepet` : ""}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-2">
                      {c.code ? <code className="rounded border border-dashed border-line-strong px-2 py-0.5 font-mono text-[12.5px] font-semibold">{c.code}</code> : null}
                      <Badge tone={c.verificationStatus === "VERIFIED" ? "positive" : "neutral"}>{c.verificationStatus === "VERIFIED" ? "Doğrulandı" : "Doğrulanmadı"}</Badge>
                      {c.validUntil ? <span className="text-[12px] text-ink-3">Son geçerlilik {formatDate(c.validUntil)}</span> : null}
                    </p>
                    {best?.metrics?.coupon?.couponId === c.id ? (
                      <p className="mt-2 text-[12.5px] text-good-ink">Bu kuponla en iyi teklif yaklaşık {formatMoney(best.metrics.coupon.priceAfterMinor, best.currency)} olur (kargo hariç, mağaza koşullarına tabi).</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ── Alarm ve puan */}
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="card scroll-mt-32 p-5" id="alarm">
            <h2 className="mb-1 flex items-center gap-2 font-display text-[19px] font-[650]">
              <Icon name="bellPlus" className="size-5 text-brand-ink" />
              Fiyat alarmı kur
            </h2>
            <p className="mb-4 text-[13px] text-ink-2">“Bu ürün belirlediğim fiyatın altına düşerse haber ver.”</p>
            <PriceAlertForm
              productId={product.id}
              variants={product.variants.map((v) => ({ id: v.id, label: v.label }))}
              defaultVariantId={selectedVariant}
              suggestedMinor={suggested}
              currentMinor={best ? (best.totalMinor ?? best.priceMinor) : null}
              loggedIn={Boolean(user)}
              returnTo={`/urun/${product.slug}#alarm`}
              existingTargetMinor={myAlert?.targetMinor ?? null}
            />
          </div>
          <div className="card p-5" id="puan">
            <h2 className="mb-1 flex items-center justify-between gap-2 font-display text-[19px] font-[650]">
              Neden bu puan?
              <SignalMeter score={best?.dealScore} />
            </h2>
            <p className="mb-4 text-[13px] text-ink-2">
              Fırsat puanı açıklanabilir faktörlerin ağırlıklı toplamıdır.{" "}
              <Link href="/nasil-calisir" className="text-brand-ink underline">
                Ayrıntılar
              </Link>
            </p>
            {best?.breakdown ? (
              <>
                {best.breakdown.blockedReason ? <p className="mb-3 rounded-md bg-warn-soft px-3 py-2 text-[13px] text-warn-ink">{best.breakdown.blockedReason}</p> : null}
                <ul className="space-y-2.5">
                  {best.breakdown.factors
                    .filter((f) => f.weight > 0)
                    .map((f) => (
                      <li key={f.key} className="text-[12.5px]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{f.label}</span>
                          <span className="font-mono tabular text-ink-2">
                            +{f.points.toLocaleString("tr-TR")} <span className="text-ink-3">/ {Math.round((f.weight / best.breakdown!.factors.reduce((s, x) => s + x.weight, 0)) * 100)}</span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(f.value * 100)}%` }} />
                        </div>
                        <p className="mt-1 text-ink-3">{f.detail}</p>
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <p className="text-[13px] text-ink-3">Güncel teklif olmadığı için puan hesaplanmadı.</p>
            )}
          </div>
        </section>

        {/* ── Kaynak ve dayanak */}
        <section className="mt-12" id="kaynak">
          <SectionHeader eyebrow="Şeffaflık" title="Veri kaynağı ve karşılaştırmanın dayanağı" />
          <div className="card divide-y divide-line">
            {offers.map((o) => (
              <div key={o.id} className="grid gap-2 p-4 text-[13px] md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                <div>
                  <p className="font-semibold">{o.retailer.name}</p>
                  <p className="text-ink-3">{o.variantLabel}</p>
                </div>
                <div>
                  <p className="text-ink-3">Kaynak</p>
                  <p>{o.sourceName}</p>
                </div>
                <div>
                  <p className="text-ink-3">Eşleştirme</p>
                  <p>
                    {MATCH_TEXT[o.matchMethod] ?? o.matchMethod} <span className="font-mono text-[11.5px] text-ink-3">({Math.round(o.matchConfidence * 100)}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-ink-3">İlk / son kontrol</p>
                  <p className="tabular">
                    {formatDate(o.firstSeenAt)} · {formatDateTime(o.lastCheckedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            Fiyatlar yetkili kaynaklardan otomatik alınır ve kaynağa göre saatlik veya daha seyrek doğrulanır. Mağazada görülen fiyat bu kontrolden sonra değişmiş olabilir. Hata görürseniz bize bildirin.
          </p>
        </section>

        {detail.editorial.length ? (
          <section className="mt-12">
            <SectionHeader eyebrow="Editörden" title="Bu ürünün yer aldığı içerikler" />
            <ul className="flex flex-wrap gap-2">
              {detail.editorial.map((e) => (
                <li key={e.slug}>
                  <Link href={`/rehber/${e.slug}`} className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-[13px] hover:border-line-strong">
                    <Badge tone="brand">Editörün seçimi</Badge>
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {detail.cheaper.length ? (
          <section className="mt-14">
            <SectionHeader eyebrow="Bütçe dostu" title="Daha uygun alternatifler" description="Aynı kategoride en az %15 daha uygun, fırsat puanı yüksek modeller. Özellik karşılaştırmasını ürün sayfalarında yapabilirsiniz." />
            <ProductGrid items={detail.cheaper} loggedIn={Boolean(user)} />
          </section>
        ) : null}
        {detail.similar.length ? (
          <section className="mt-14">
            <SectionHeader eyebrow="Benzer" title={`${product.category.name} kategorisinde öne çıkanlar`} href={`/kategori/${product.category.slug}`} />
            <ProductGrid items={detail.similar.slice(0, 4)} loggedIn={Boolean(user)} />
          </section>
        ) : null}
      </div>
    </>
  );
}

function OffersTable({ offers }: { offers: OfferRow[] }) {
  if (offers.length === 0) return <p className="text-[13px] text-ink-3">Bu varyant için teklif yok.</p>;
  return (
    <div className="card overflow-hidden">
      <table className="hidden w-full text-[13.5px] md:table">
        <thead className="border-b border-line bg-surface-2 text-left text-[12px] text-ink-3">
          <tr>
            <th className="px-4 py-2.5 font-medium">Mağaza</th>
            <th className="px-4 py-2.5 font-medium">Fiyat</th>
            <th className="px-4 py-2.5 font-medium">Kargo</th>
            <th className="px-4 py-2.5 font-medium">Toplam</th>
            <th className="px-4 py-2.5 font-medium">Durum</th>
            <th className="px-4 py-2.5 font-medium">Son kontrol</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {offers.map((o, i) => (
            <tr key={o.id} className={cn(i === 0 && o.status === "ACTIVE" ? "bg-brand-soft/40" : "", o.status !== "ACTIVE" && "text-ink-3")}>
              <td className="px-4 py-3">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <span className="size-2 rounded-full" style={{ background: o.retailer.brandColor ?? "var(--ink-3)" }} aria-hidden />
                  {o.retailer.name}
                  {o.isTestData ? <TestDataBadge /> : null}
                  {o.isSponsored ? <Badge tone="sponsor">Sponsorlu</Badge> : null}
                </p>
                <p className="mt-0.5 max-w-[280px] truncate text-[12px] text-ink-3" title={o.title}>
                  {o.variantLabel} · {o.title}
                </p>
              </td>
              <td className="px-4 py-3 tabular">
                {formatMoney(o.priceMinor, o.currency)}
                {o.listPriceMinor ? <span className="block text-[11.5px] text-ink-3 line-through">{formatMoney(o.listPriceMinor, o.currency)}</span> : null}
              </td>
              <td className="px-4 py-3">
                <ShippingNote shippingMinor={o.shippingMinor} currency={o.currency} />
              </td>
              <td className="px-4 py-3 font-semibold tabular text-ink">{o.totalMinor !== null ? formatMoney(o.totalMinor, o.currency) : <span className="font-normal text-ink-3">hesaplanamadı</span>}</td>
              <td className="px-4 py-3">
                <OfferStatus o={o} />
              </td>
              <td className="px-4 py-3">
                <Freshness at={o.lastSuccessAt} windowMinutes={o.freshnessWindowMinutes} source={o.sourceName} compact />
              </td>
              <td className="px-4 py-3 text-right">
                <a href={`/git/${o.id}?yer=teklif-tablosu`} target="_blank" rel="nofollow sponsored noopener" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[12.5px] font-medium text-ink hover:bg-surface-2">
                  Mağazaya git
                  <Icon name="external" className="size-3.5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="divide-y divide-line md:hidden">
        {offers.map((o) => (
          <li key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  {o.retailer.name} {o.isTestData ? <TestDataBadge /> : null}
                </p>
                <p className="text-[12px] text-ink-3">{o.variantLabel}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-[19px] font-[680] tabular">{formatMoney(o.totalMinor ?? o.priceMinor, o.currency)}</p>
                <ShippingNote shippingMinor={o.shippingMinor} currency={o.currency} />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <OfferStatus o={o} />
              <Freshness at={o.lastSuccessAt} windowMinutes={o.freshnessWindowMinutes} compact />
            </div>
            <a href={`/git/${o.id}?yer=teklif-mobil`} target="_blank" rel="nofollow sponsored noopener" className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-md border border-line-strong text-[13px] font-medium">
              Mağazaya git <Icon name="external" className="size-3.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfferStatus({ o }: { o: OfferRow }) {
  if (o.status === "ACTIVE") {
    return (
      <span className="flex flex-col gap-1">
        <span className="text-[12.5px] text-ink-2">{STOCK_TEXT[o.stockStatus]}</span>
        {o.labels.includes("BEST_ACROSS_STORES") ? <span className="text-[11.5px] font-medium text-brand-ink">{DEAL_LABELS.BEST_ACROSS_STORES.text}</span> : null}
      </span>
    );
  }
  const map: Record<string, [string, string]> = {
    REVALIDATING: ["Fiyat yeniden doğrulanıyor", "text-warn-ink"],
    STALE: ["Güncelliği doğrulanamadı", "text-warn-ink"],
    OUT_OF_STOCK: ["Stokta yok", "text-ink-3"],
    DISABLED: ["Geçici olarak devre dışı", "text-ink-3"],
  };
  const [text, cls] = map[o.status] ?? [o.status, "text-ink-3"];
  return <span className={cn("text-[12.5px] font-medium", cls)}>{o.flaggedSuspicious ? "Fiyat inceleniyor" : text}</span>;
}

function WindowsTable({ m, currency }: { m: OfferRow["metrics"]; currency: string }) {
  const rows = m
    ? [
        ["30 gün", m.d30],
        ["90 gün", m.d90],
        ["180 gün", m.d180],
      ] as const
    : [];
  return (
    <div className="card p-4">
      <p className="eyebrow mb-3">Dönem karşılaştırması (en iyi teklif)</p>
      {m ? (
        <table className="w-full text-[13px]">
          <thead className="text-left text-[11.5px] text-ink-3">
            <tr>
              <th className="pb-2 font-medium">Dönem</th>
              <th className="pb-2 text-right font-medium">En düşük</th>
              <th className="pb-2 text-right font-medium">Tipik</th>
              <th className="pb-2 text-right font-medium">Kapsam</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map(([label, w]) => (
              <tr key={label} className="border-t border-line">
                <td className="py-2 font-medium">{label}</td>
                <td className="py-2 text-right">{w.sufficient ? formatMoney(w.lowMinor, currency) : "—"}</td>
                <td className="py-2 text-right">{w.sufficient ? formatMoney(w.medianMinor, currency) : "—"}</td>
                <td className={cn("py-2 text-right font-mono text-[11.5px]", w.sufficient ? "text-ink-2" : "text-warn-ink")}>{w.coverageDays.toLocaleString("tr-TR")} gün</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[13px] text-ink-3">Güncel teklif yok.</p>
      )}
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">“—”: dönemin en az üçte ikisi için doğrulanmış kayıt olmadığından karşılaştırma yapılmaz. Tipik = gün sonu fiyatlarının medyanı (bugün hariç).</p>
    </div>
  );
}
