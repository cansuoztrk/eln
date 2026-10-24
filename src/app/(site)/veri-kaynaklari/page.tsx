import type { Metadata } from "next";
import Link from "next/link";
import { Freshness } from "@/components/price/freshness";
import { Badge, type Tone } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/section";
import { db } from "@/server/db";
import { includeTestData } from "@/server/visibility";

export const metadata: Metadata = { title: "Veri kaynakları ve güncellik", description: "Hangi mağazadan ve sağlayıcıdan veri aldığımız, nasıl ve ne sıklıkla güncellendiği.", alternates: { canonical: "/veri-kaynaklari" } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, [string, Tone]> = {
  CONNECTED: ["Bağlı", "positive"],
  TEST_ONLY: ["Test verisi", "warning"],
  DEGRADED: ["Sorunlu — son veriler korunuyor", "danger"],
  AWAITING_CREDENTIALS: ["Erişim anahtarı bekleniyor", "neutral"],
  AWAITING_INTEGRATION: ["Yetkili veri erişimi bekleniyor", "neutral"],
  DISABLED: ["Devre dışı", "neutral"],
};

export default async function DataSourcesPage() {
  const sources = await db.dataSource.findMany({ where: includeTestData() ? {} : { isTestData: false }, include: { retailer: true }, orderBy: [{ kind: "asc" }, { name: "asc" }] });
  const counts = await db.offer.groupBy({ by: ["dataSourceId", "status"], _count: true });
  return (
    <>
      <PageHeader
        eyebrow="Şeffaflık"
        title="Veri kaynakları ve güncellik"
        description="Fiyatları yalnızca resmî API'ler, satış ortaklığı programlarının ürün akışları veya izin verilen veri akışlarından alırız. Erişim kontrollerini aşan veri toplama, CAPTCHA aşma veya yetkisiz oturum kullanımı yoktur. Erişimi olmayan kaynaklar “bekliyor” olarak gösterilir ve sahte veriyle doldurulmaz."
      />
      <div className="container-page py-10">
        <div className="card divide-y divide-line">
          {sources.map((s) => {
            const [label, tone] = STATUS[s.status] ?? [s.status, "neutral" as Tone];
            const active = counts.find((c) => c.dataSourceId === s.id && c.status === "ACTIVE")?._count ?? 0;
            return (
              <div key={s.id} className="grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-3">{s.kind === "RETAIL" ? "E-ticaret" : s.kind === "FLIGHT" ? "Uçuş" : "Kupon"}{s.notes ? ` · ${s.notes}` : ""}</p>
                </div>
                <div>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <div className="text-[13px]">
                  <p className="text-ink-3">Güncelleme sıklığı</p>
                  <p>{s.refreshIntervalMinutes < 60 ? `${s.refreshIntervalMinutes} dakikada bir` : `${Math.round(s.refreshIntervalMinutes / 60)} saatte bir`}</p>
                  <p className="text-[12px] text-ink-3">Tazelik penceresi {Math.round(s.freshnessWindowMinutes / 60)} sa</p>
                </div>
                <div className="text-[13px]">
                  <p className="text-ink-3">Son başarılı güncelleme</p>
                  <Freshness at={s.lastSuccessAt} prefix="güncellendi" />
                  {s.kind === "RETAIL" ? <p className="text-[12px] text-ink-3">{active} güncel teklif</p> : null}
                </div>
              </div>
            );
          })}
        </div>
        <div className="prose-lite mt-10 max-w-3xl">
          <h2>“Güncel” ne demek?</h2>
          <p>Her kaynağın bir tazelik penceresi vardır (ör. Amazon için 75 dakika — Amazon, teklif verisinin en az saatte bir yenilenmesini ister). Son başarılı kontrol bu pencereden eskiyse teklif aktif fırsat listelerinden çıkar ve ürün sayfasında “Fiyat bilgisi yeniden kontrol ediliyor” olarak görünür.</p>
          <h2>Satış ortaklığı</h2>
          <p>
            Bazı bağlantılar satış ortaklığı bağlantısı olabilir; bu durum fiyatı veya sıralamayı değiştirmez. Ayrıntılar: <Link href="/satis-ortakligi">satış ortaklığı açıklaması</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
