import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductListing } from "@/components/listing/product-listing";
import { Freshness } from "@/components/price/freshness";
import { TestDataBadge } from "@/components/ui/badge";
import { db } from "@/server/db";
import { parseFilters } from "@/server/catalog/filters";
import { includeTestData } from "@/server/visibility";
import { CONDITION_LABELS } from "@/server/pricing/coupons";

const STATUS: Record<string, string> = {
  CONNECTED: "Bağlı — veriler otomatik güncelleniyor",
  TEST_ONLY: "Test verisi",
  DEGRADED: "Veri kaynağında sorun var; son başarılı veriler gösteriliyor",
  AWAITING_CREDENTIALS: "Entegrasyon hazır, erişim anahtarı bekleniyor",
  AWAITING_INTEGRATION: "Yetkili veri erişimi bekleniyor",
  DISABLED: "Devre dışı",
};

export async function generateMetadata(props: PageProps<"/magaza/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const r = await db.retailer.findUnique({ where: { slug } });
  return r ? { title: `${r.name} fırsatları ve fiyat karşılaştırma`, alternates: { canonical: `/magaza/${r.slug}` } } : {};
}

export default async function RetailerPage(props: PageProps<"/magaza/[slug]">) {
  const { slug } = await props.params;
  const retailer = await db.retailer.findUnique({ where: { slug }, include: { dataSources: true, coupons: { where: { isActive: true }, include: { dataSource: true } } } });
  if (!retailer) notFound();
  const isTest = retailer.dataSources.length > 0 && retailer.dataSources.every((d) => d.isTestData);
  if (isTest && !includeTestData()) notFound();
  const f = { ...parseFilters(await props.searchParams), magaza: [retailer.slug] };
  const lastSuccess = retailer.dataSources.reduce<Date | null>((m, d) => (d.lastSuccessAt && (!m || d.lastSuccessAt > m) ? d.lastSuccessAt : m), null);
  const coupons = retailer.coupons.filter((c) => includeTestData() || !c.dataSource?.isTestData);

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-14 place-items-center rounded-xl font-display text-[24px] font-bold text-white" style={{ background: retailer.brandColor ?? "var(--ink-3)" }} aria-hidden>
              {retailer.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-[28px] font-[680] tracking-tight">
                {retailer.name} {isTest ? <TestDataBadge /> : null}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
                {retailer.dataSources.map((d) => (
                  <span key={d.id}>{STATUS[d.status] ?? d.status}</span>
                ))}
                <Freshness at={lastSuccess} prefix="güncellendi" />
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">
            Bu sayfa {retailer.name} tekliflerini listeler. Aynı ürün başka mağazalarda da satılıyorsa ürün sayfasında kargo dâhil toplam maliyete göre karşılaştırma yapılır — amaç ürünü en uygun toplam maliyetle bulmanız.
          </p>
          {coupons.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {coupons.slice(0, 4).map((c) => (
                <Link key={c.id} href="/kuponlar" className="inline-flex items-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-1.5 text-[12.5px]">
                  <span className="font-mono font-semibold">{c.code ?? "Kodsuz"}</span>
                  <span className="text-ink-2">{c.title}</span>
                  <span className="text-ink-3">· {CONDITION_LABELS[c.conditionType]}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="container-page py-8">
        <ProductListing basePath={`/magaza/${retailer.slug}`} f={f} fixed={{ magaza: retailer.slug }} emptyHint="Bu mağazadan doğrulanmış güncel teklif yok. Veri kaynağı bağlandığında teklifler otomatik olarak listelenir." />
      </div>
    </>
  );
}
