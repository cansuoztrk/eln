import type { Metadata } from "next";
import Link from "next/link";
import { ComparePicker } from "@/components/compare/compare-picker";
import { Icon } from "@/components/icons";
import { Freshness } from "@/components/price/freshness";
import { SignalMeter } from "@/components/price/signal-meter";
import { ProductImage } from "@/components/product/product-image";
import { TestDataBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { db } from "@/server/db";
import { visibilityWhere } from "@/server/catalog/queries";
import { includeTestData } from "@/server/visibility";
import type { OfferMetrics } from "@/server/pricing/evaluate";
import { formatMoney, formatPercent } from "@/lib/money";

export const metadata: Metadata = {
  title: "Fiyat karşılaştırma",
  description: "Aynı ürünün mağazalar arasındaki kargo dâhil fiyat farkları ve ürünleri yan yana karşılaştırma.",
  alternates: { canonical: "/karsilastir" },
};

export default async function ComparePage(props: PageProps<"/karsilastir">) {
  const sp = await props.searchParams;
  const slugs = (typeof sp.urunler === "string" ? sp.urunler.split(",") : []).filter((s) => /^[a-z0-9-]{1,90}$/.test(s)).slice(0, 4);

  const spreads = await db.$queryRaw<{ id: string; slug: string; title: string; isTestData: boolean; retailers: bigint; min_total: number; max_total: number; currency: string; last: Date }[]>`
    SELECT p.id, p.slug, p.title, p."isTestData", count(DISTINCT o."retailerId") AS retailers,
      min(o."totalMinor") AS min_total, max(o."totalMinor") AS max_total, min(o.currency) AS currency, max(o."lastSuccessAt") AS last
    FROM "Product" p JOIN "Offer" o ON o."productId" = p.id
    WHERE o.status = 'ACTIVE' AND o."totalMinor" IS NOT NULL AND o."flaggedSuspicious" = false AND p."isActive" = true
      AND (${includeTestData()} OR p."isTestData" = false)
    GROUP BY p.id HAVING count(DISTINCT o."retailerId") >= 2 AND count(DISTINCT o.currency) = 1
    ORDER BY (max(o."totalMinor") - min(o."totalMinor"))::float / max(o."totalMinor") DESC
    LIMIT 20`;

  const products = slugs.length
    ? await db.product.findMany({
        where: { AND: [visibilityWhere(), { slug: { in: slugs } }] },
        include: { brand: true, category: true, offers: { where: { status: "ACTIVE" }, include: { retailer: true } } },
      })
    : [];
  const ordered = slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is (typeof products)[number] => Boolean(p));
  const specKeys = [...new Set(ordered.flatMap((p) => Object.keys((p.specs ?? {}) as Record<string, string>)))].slice(0, 16);

  return (
    <>
      <PageHeader eyebrow="Karşılaştırma" title="Fiyat karşılaştırma" description="Aynı ürünün farklı mağazalardaki kargo dâhil toplam fiyatları. Ürünleri yan yana koyup özellik ve fiyat geçmişi metriklerini de karşılaştırabilirsiniz." />
      <div className="container-page space-y-14 py-10">
        <section>
          <SectionHeader eyebrow="Yan yana" title="Ürünleri karşılaştır" description="En fazla 4 ürün. Liste bağlantısı paylaşılabilir." />
          <ComparePicker current={ordered.map((p) => p.slug)} />
          {ordered.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[13.5px]">
                <thead>
                  <tr>
                    <th className="w-40" />
                    {ordered.map((p) => (
                      <th key={p.id} className="px-3 pb-4 text-left align-top font-normal">
                        <div className="card overflow-hidden">
                          <div className="aspect-[4/3]">
                            <ProductImage src={p.imageUrl} alt={p.title} icon={p.category.icon} />
                          </div>
                          <div className="p-3">
                            <Link href={`/urun/${p.slug}`} className="line-clamp-2 font-medium hover:text-brand-ink">
                              {p.title}
                            </Link>
                            <div className="mt-2 flex items-center justify-between">
                              {p.isTestData ? <TestDataBadge /> : <span />}
                              <Link href={`/karsilastir?urunler=${ordered.filter((x) => x.id !== p.id).map((x) => x.slug).join(",")}`} className="text-[12px] text-ink-3 hover:text-bad-ink">
                                Kaldır
                              </Link>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="En iyi teklif (kargo dâhil)" cells={ordered.map((p) => (p.bestTotalMinor ? <strong key={p.id} className="font-display text-[17px] tabular">{formatMoney(p.bestTotalMinor, p.bestCurrency ?? "TRY")}</strong> : "Güncel teklif yok"))} />
                  <Row label="Mağaza sayısı" cells={ordered.map((p) => `${p.retailerCount}`)} />
                  <Row label="Fırsat puanı" cells={ordered.map((p) => <SignalMeter key={p.id} score={p.dealScore} />)} />
                  <Row
                    label="Doğrulanmış indirim"
                    cells={ordered.map((p) => (p.verifiedDiscountPct ? <span key={p.id} className="font-semibold text-good-ink">{formatPercent(p.verifiedDiscountPct, 1)}</span> : "—"))}
                  />
                  <Row
                    label="90 günlük en düşük"
                    cells={ordered.map((p) => {
                      const best = p.offers.find((o) => o.id === p.bestOfferId);
                      const m = best?.metrics as OfferMetrics | null | undefined;
                      return m?.d90.sufficient ? formatMoney(m.d90.lowMinor, best!.currency) : "Yetersiz geçmiş";
                    })}
                  />
                  <Row label="Son kontrol" cells={ordered.map((p) => <Freshness key={p.id} at={p.lastVerifiedAt} compact />)} />
                  <Row label="Marka" cells={ordered.map((p) => p.brand?.name ?? "—")} />
                  {specKeys.map((k) => (
                    <Row key={k} label={k} cells={ordered.map((p) => ((p.specs ?? {}) as Record<string, string>)[k] ?? "—")} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-ink-3">Karşılaştırmak istediğiniz ürünleri yukarıdan arayarak ekleyin veya ürün sayfalarındaki “Karşılaştır” bağlantısını kullanın.</p>
          )}
        </section>

        <section>
          <SectionHeader eyebrow="Mağazalar arası" title="Fiyat farkı en yüksek ürünler" description="Aynı ürün için güncel teklifler arasında kargo dâhil en büyük farklar. Doğru mağazayı seçmek ciddi tasarruf sağlayabilir." />
          {spreads.length ? (
            <div className="card divide-y divide-line">
              {spreads.map((s) => {
                const diff = s.max_total - s.min_total;
                return (
                  <Link key={s.id} href={`/urun/${s.slug}#teklifler`} className="grid items-center gap-2 p-4 hover:bg-surface-2 md:grid-cols-[1fr_auto_auto_auto]">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="truncate">{s.title}</span>
                      {s.isTestData ? <TestDataBadge /> : null}
                    </span>
                    <span className="text-[13px] text-ink-2 tabular">
                      {formatMoney(s.min_total, s.currency)} – {formatMoney(s.max_total, s.currency)}
                    </span>
                    <span className="text-[13px] font-semibold text-good-ink tabular">
                      {formatMoney(diff, s.currency)} fark ({formatPercent((diff / s.max_total) * 100)})
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] text-ink-3">
                      {Number(s.retailers)} mağaza <Icon name="chevronRight" className="size-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="compare" title="Henüz karşılaştırılabilir ürün yok">
              Aynı ürünün en az iki mağazada doğrulanmış teklifi olduğunda burada listelenir.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr>
      <th scope="row" className="border-t border-line py-3 pr-3 text-left align-top text-[12.5px] font-medium text-ink-3">
        {label}
      </th>
      {cells.map((c, i) => (
        <td key={i} className="border-t border-line px-3 py-3 align-top">
          {c}
        </td>
      ))}
    </tr>
  );
}
