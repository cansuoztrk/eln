import Link from "next/link";
import { runSourceNow } from "@/app/admin/actions";
import { AdminPage, StatusBadge, SubmitButton, Table, Td } from "@/components/admin/ui";
import { Freshness } from "@/components/price/freshness";
import { TestDataBadge } from "@/components/ui/badge";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { utcDay } from "@/server/ingestion/usage";

export const metadata = { title: "Veri kaynakları" };

export default async function AdminSources() {
  await requireStaff("ADMIN");
  const [sources, usage, offerCounts] = await Promise.all([
    db.dataSource.findMany({ include: { retailer: { select: { name: true } } }, orderBy: [{ kind: "asc" }, { isTestData: "asc" }, { name: "asc" }] }),
    db.apiUsage.findMany({ where: { day: utcDay(new Date()) } }),
    db.offer.groupBy({ by: ["dataSourceId", "status"], _count: true }),
  ]);
  return (
    <AdminPage
      title="Veri kaynakları"
      description="Her entegrasyonun bağlantı durumu, son çalışması, hatası ve kota kullanımı. Gizli anahtarlar yalnızca ortam değişkenlerinde tutulur; burada değişken adları görünür."
      actions={
        <Link href="/admin/kaynaklar/yeni" className="inline-flex h-9 items-center rounded-md bg-brand px-3.5 text-[13px] font-semibold text-on-brand">
          Ürün feed'i ekle
        </Link>
      }
    >
      <Table head={["Kaynak", "Durum", "Son çalışma / başarı", "Son hata", "Teklifler (aktif/toplam)", "Bugün istek", "İşlem"]}>
        {sources.map((s) => {
          const u = usage.find((x) => x.dataSourceId === s.id);
          const active = offerCounts.find((c) => c.dataSourceId === s.id && c.status === "ACTIVE")?._count ?? 0;
          const total = offerCounts.filter((c) => c.dataSourceId === s.id).reduce((a, c) => a + c._count, 0);
          const quotaPct = s.dailyQuota && u ? Math.round((u.requests / s.dailyQuota) * 100) : null;
          return (
            <tr key={s.id}>
              <Td>
                <Link href={`/admin/kaynaklar/${s.id}`} className="font-medium hover:text-brand-ink">
                  {s.name}
                </Link>
                <span className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-3">
                  {s.kind} · {s.adapter} {s.isTestData ? <TestDataBadge /> : null}
                </span>
              </Td>
              <Td>
                <StatusBadge status={s.isEnabled ? s.status : "DISABLED"} />
                {s.consecutiveFailures ? <span className="mt-1 block text-[11.5px] text-bad-ink">{s.consecutiveFailures} ardışık hata</span> : null}
              </Td>
              <Td>
                <Freshness at={s.lastRunAt} prefix="çalıştı" compact />
                <Freshness at={s.lastSuccessAt} windowMinutes={s.freshnessWindowMinutes} prefix="başarılı" compact />
              </Td>
              <Td className="max-w-[280px]">
                <span className="line-clamp-3 text-[12px] text-ink-2">{s.lastError ?? "—"}</span>
              </Td>
              <Td className="tabular">
                {active} / {total}
              </Td>
              <Td className="font-mono text-[12px]">
                {u?.requests ?? 0}
                {s.dailyQuota ? <span className={quotaPct !== null && quotaPct >= s.quotaWarnPercent ? "block text-warn-ink" : "block text-ink-3"}>kota %{quotaPct ?? 0}</span> : null}
              </Td>
              <Td>
                <form action={runSourceNow.bind(null, s.id, s.kind === "FLIGHT" ? "flights.refresh-routes" : "retail.refresh")}>
                  <SubmitButton variant="secondary">Şimdi çalıştır</SubmitButton>
                </form>
              </Td>
            </tr>
          );
        })}
      </Table>
    </AdminPage>
  );
}
