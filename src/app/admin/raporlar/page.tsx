import { runScheduleNow } from "@/app/admin/actions";
import { AdminPage, Panel, SubmitButton, Table, Td } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";

export const metadata = { title: "Raporlar" };

type Freshness = { key: string; name: string; status: string; offers: number; freshOffers: number; freshRatio: number | null; jobs: Record<string, number> }[];
type Trends = { slug: string; name: string; priceDrops: number; avgVerifiedDiscountPct: number | null; clicks: number }[];
type Quality = { offersByStatus: Record<string, number>; suspicious: number; pendingMatches: number; productsWithoutImage: number; uncategorized: number };

export default async function AdminReports() {
  await requireStaff("EDITOR");
  const [quality, freshness, trends, schedule] = await Promise.all([
    db.report.findFirst({ where: { type: "WEEKLY_QUALITY" }, orderBy: { periodStart: "desc" } }),
    db.report.findFirst({ where: { type: "FRESHNESS" }, orderBy: { periodStart: "desc" } }),
    db.report.findFirst({ where: { type: "CATEGORY_TRENDS" }, orderBy: { periodStart: "desc" } }),
    db.jobSchedule.findUnique({ where: { key: "maintenance.weekly-report" } }),
  ]);
  const q = quality?.data as Quality | undefined;
  return (
    <AdminPage
      title="Raporlar"
      description="Haftalık görevle üretilir: veri kalitesi, kaynak bazında tazelik ve kategori trendleri. Veri olmayan dönemler için rapor üretilmez."
      actions={
        schedule ? (
          <form action={runScheduleNow.bind(null, schedule.id)}>
            <SubmitButton variant="secondary">Raporları şimdi üret</SubmitButton>
          </form>
        ) : null
      }
    >
      {!quality ? <p className="text-[13px] text-ink-3">Henüz rapor üretilmedi.</p> : null}
      {q ? (
        <Panel title={`Veri kalitesi · ${formatDateTime(quality!.periodEnd)}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 text-[13px]">
            <div>Şüpheli fiyat: <strong>{q.suspicious}</strong></div>
            <div>Eşleştirme bekleyen: <strong>{q.pendingMatches}</strong></div>
            <div>Görselsiz ürün: <strong>{q.productsWithoutImage}</strong></div>
            <div>Sınıflandırılmamış: <strong>{q.uncategorized}</strong></div>
            <div>
              Teklif durumları:{" "}
              <span className="font-mono text-[12px]">
                {Object.entries(q.offersByStatus)
                  .map(([k, v]) => `${k} ${v}`)
                  .join(" · ")}
              </span>
            </div>
          </div>
        </Panel>
      ) : null}
      {freshness ? (
        <Panel title="Kaynak tazeliği">
          <Table head={["Kaynak", "Durum", "Teklif", "Güncel oranı", "Görevler (7 g)"]}>
            {(freshness.data as Freshness).map((f) => (
              <tr key={f.key}>
                <Td>{f.name}</Td>
                <Td className="font-mono text-[12px]">{f.status}</Td>
                <Td>{f.offers}</Td>
                <Td>{f.freshRatio === null ? "—" : `%${Math.round(f.freshRatio * 100)}`}</Td>
                <Td className="font-mono text-[12px]">
                  {Object.entries(f.jobs)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ") || "—"}
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      ) : null}
      {trends ? (
        <Panel title="Kategori trendleri (son 7 gün)">
          <Table head={["Kategori", "Fiyat düşüşü", "Ort. doğrulanmış indirim", "Tıklama"]}>
            {(trends.data as Trends)
              .filter((t) => t.priceDrops || t.clicks || t.avgVerifiedDiscountPct)
              .sort((a, b) => b.priceDrops - a.priceDrops)
              .map((t) => (
                <tr key={t.slug}>
                  <Td>{t.name}</Td>
                  <Td>{t.priceDrops}</Td>
                  <Td>{t.avgVerifiedDiscountPct ? `%${t.avgVerifiedDiscountPct.toFixed(1)}` : "—"}</Td>
                  <Td>{t.clicks}</Td>
                </tr>
              ))}
          </Table>
        </Panel>
      ) : null}
    </AdminPage>
  );
}
