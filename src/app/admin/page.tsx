import Link from "next/link";
import { AdminPage, MiniBars, Panel, Stat, StatusBadge, Table, Td } from "@/components/admin/ui";
import { Freshness } from "@/components/price/freshness";
import { configWarnings } from "@/config/env";
import { DAY } from "@/lib/time";
import { formatShortDate } from "@/lib/time";
import { db } from "@/server/db";
import { jobLabel } from "@/server/jobs/registry";

export const metadata = { title: "Kontrol merkezi" };

export default async function AdminDashboard() {
  const now = new Date();
  const d1 = new Date(now.getTime() - DAY);
  const d7 = new Date(now.getTime() - 7 * DAY);
  const [products, activeOffers, deals, newDeals, staleOffers, suspicious, pendingMatches, jobs24, failedJobs, alertsNotif24, alertsNotif7, sources, usage, topClicked, topCategories, topRetailers, movements] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.offer.count({ where: { status: "ACTIVE" } }),
    db.product.count({ where: { bestOfferId: { not: null }, dealScore: { gte: 55 } } }),
    db.offer.count({ where: { status: "ACTIVE", firstSeenAt: { gte: d1 } } }),
    db.offer.count({ where: { status: { in: ["REVALIDATING", "STALE"] } } }),
    db.offer.count({ where: { flaggedSuspicious: true } }),
    db.matchCandidate.count({ where: { status: "PENDING" } }),
    db.ingestionJob.groupBy({ by: ["status"], where: { createdAt: { gte: d1 } }, _count: true }),
    db.ingestionJob.findMany({ where: { status: "FAILED", createdAt: { gte: d7 } }, orderBy: { createdAt: "desc" }, take: 6, include: { dataSource: { select: { name: true } } } }),
    db.notification.count({ where: { type: { in: ["PRICE_ALERT", "FLIGHT_ALERT"] }, createdAt: { gte: d1 } } }),
    db.notification.count({ where: { type: { in: ["PRICE_ALERT", "FLIGHT_ALERT"] }, createdAt: { gte: d7 } } }),
    db.dataSource.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    db.apiUsage.groupBy({ by: ["dataSourceId"], where: { day: { gte: d7 } }, _sum: { requests: true, errors: true, rateLimited: true } }),
    db.clickEvent.groupBy({ by: ["productId"], where: { createdAt: { gte: d7 }, productId: { not: null } }, _count: true, orderBy: { _count: { productId: "desc" } }, take: 6 }),
    db.clickEvent.groupBy({ by: ["categoryId"], where: { createdAt: { gte: d7 }, categoryId: { not: null } }, _count: true, orderBy: { _count: { categoryId: "desc" } }, take: 6 }),
    db.clickEvent.groupBy({ by: ["retailerId"], where: { createdAt: { gte: d7 }, retailerId: { not: null } }, _count: true, orderBy: { _count: { retailerId: "desc" } }, take: 6 }),
    db.$queryRaw<{ day: Date; drops: bigint; rises: bigint }[]>`
      SELECT date_trunc('day', "checkedAt") AS day,
        count(*) FILTER (WHERE prev IS NOT NULL AND "priceMinor" < prev) AS drops,
        count(*) FILTER (WHERE prev IS NOT NULL AND "priceMinor" > prev) AS rises
      FROM (SELECT "checkedAt", "priceMinor", lag("priceMinor") OVER (PARTITION BY "offerId" ORDER BY "checkedAt") AS prev
            FROM "PriceSnapshot" WHERE "checkedAt" >= ${new Date(now.getTime() - 8 * DAY)}) s
      WHERE "checkedAt" >= ${d7}
      GROUP BY 1 ORDER BY 1`,
  ]);
  const jobCount = (s: string) => jobs24.find((j) => j.status === s)?._count ?? 0;
  const [clickedProducts, clickedCats, clickedRetailers] = await Promise.all([
    db.product.findMany({ where: { id: { in: topClicked.map((t) => t.productId!) } }, select: { id: true, title: true, slug: true } }),
    db.category.findMany({ where: { id: { in: topCategories.map((t) => t.categoryId!) } }, select: { id: true, name: true } }),
    db.retailer.findMany({ where: { id: { in: topRetailers.map((t) => t.retailerId!) } }, select: { id: true, name: true } }),
  ]);
  const usageBy = new Map(usage.map((u) => [u.dataSourceId, u._sum]));
  const warnings = configWarnings();

  return (
    <AdminPage title="Kontrol merkezi" description="Otomatik çalışan platformun durumu. Manuel müdahale yalnızca istisnalar içindir: başarısız görevler, şüpheli fiyatlar ve eşleştirme incelemeleri.">
      {warnings.length ? (
        <div role="status" className="rounded-lg border border-warn/40 bg-warn-soft px-4 py-3 text-[13px] text-warn-ink">
          <p className="mb-1 font-semibold">Yapılandırma uyarıları</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Toplam ürün" value={products.toLocaleString("tr-TR")} href="/admin/urunler" />
        <Stat label="Aktif teklif" value={activeOffers.toLocaleString("tr-TR")} />
        <Stat label="Güncel fırsat (puan ≥ 55)" value={deals} />
        <Stat label="Son 24 saatte yeni" value={newDeals} />
        <Stat label="Güncellenemeyen teklif" value={staleOffers} tone={staleOffers ? "warn" : undefined} href="/admin/teklifler?durum=eski" />
        <Stat label="Şüpheli fiyat" value={suspicious} tone={suspicious ? "warn" : undefined} href="/admin/teklifler?durum=supheli" />
        <Stat label="Eşleştirme bekleyen" value={pendingMatches} tone={pendingMatches ? "warn" : undefined} href="/admin/eslestirme" />
        <Stat label="Alarm bildirimi (24 sa / 7 g)" value={`${alertsNotif24} / ${alertsNotif7}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Son 7 günün fiyat hareketleri">
          {movements.length ? (
            <MiniBars
              data={movements.map((m) => ({ label: formatShortDate(m.day), values: [Number(m.drops), Number(m.rises)] }))}
              series={[
                { name: "Fiyat düşüşü", color: "var(--series-3)" },
                { name: "Fiyat artışı", color: "var(--series-2)" },
              ]}
            />
          ) : (
            <p className="text-[13px] text-ink-3">Henüz fiyat değişimi kaydı yok.</p>
          )}
          <p className="mt-2 text-[11.5px] text-ink-3">Bir önceki doğrulanmış kayda göre fiyatı değişen gözlem sayısı.</p>
        </Panel>
        <Panel title="Görevler (son 24 saat)" actions={<Link href="/admin/gorevler" className="text-[12.5px] text-brand-ink">Tümü</Link>}>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(["SUCCEEDED", "FAILED", "RUNNING", "QUEUED"] as const).map((s) => (
              <div key={s} className="rounded-md bg-surface-2 p-2">
                <p className="font-display text-[22px] font-[650]">{jobCount(s)}</p>
                <StatusBadge status={s} />
              </div>
            ))}
          </div>
          <p className="mb-2 mt-4 text-[12px] font-semibold">Son başarısız görevler (7 gün)</p>
          {failedJobs.length ? (
            <ul className="space-y-1.5 text-[12.5px]">
              {failedJobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/admin/gorevler/${j.id}`} className="block rounded-md px-2 py-1.5 hover:bg-surface-2">
                    <span className="font-medium">{jobLabel(j.type)}</span> · {j.dataSource?.name ?? "genel"}
                    <span className="block truncate text-bad-ink">{j.error}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-ink-3">Başarısız görev yok.</p>
          )}
        </Panel>
      </div>

      <Panel title="Entegrasyonlar ve veri güncelliği" actions={<Link href="/admin/kaynaklar" className="text-[12.5px] text-brand-ink">Yönet</Link>}>
        <Table head={["Kaynak", "Durum", "Son başarılı", "Son hata", "Ardışık hata", "İstek / hata / 429 (7 g)"]}>
          {sources.map((s) => {
            const u = usageBy.get(s.id);
            return (
              <tr key={s.id}>
                <Td>
                  <Link href={`/admin/kaynaklar/${s.id}`} className="font-medium hover:text-brand-ink">
                    {s.name}
                  </Link>
                  <span className="block font-mono text-[11px] text-ink-3">{s.adapter}</span>
                </Td>
                <Td>
                  <StatusBadge status={s.status} />
                </Td>
                <Td>
                  <Freshness at={s.lastSuccessAt} windowMinutes={s.freshnessWindowMinutes} prefix="başarılı" compact />
                </Td>
                <Td className="max-w-[320px]">
                  <span className="line-clamp-2 text-[12px] text-ink-2">{s.lastError ?? "—"}</span>
                </Td>
                <Td>{s.consecutiveFailures}</Td>
                <Td className="font-mono text-[12px]">
                  {u?.requests ?? 0} / {u?.errors ?? 0} / {u?.rateLimited ?? 0}
                  {s.dailyQuota ? <span className="block text-ink-3">kota {s.dailyQuota}/gün</span> : null}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="En çok tıklanan fırsatlar (7 g)">
          <ol className="space-y-1.5 text-[13px]">
            {topClicked.length ? (
              topClicked.map((t) => {
                const p = clickedProducts.find((x) => x.id === t.productId);
                return (
                  <li key={t.productId} className="flex justify-between gap-2">
                    <Link href={`/urun/${p?.slug}`} className="truncate hover:text-brand-ink">
                      {p?.title}
                    </Link>
                    <span className="font-mono text-ink-3">{t._count}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-ink-3">Henüz tıklama yok.</li>
            )}
          </ol>
        </Panel>
        <Panel title="En çok ilgi gören kategoriler (7 g)">
          <ol className="space-y-1.5 text-[13px]">
            {topCategories.length ? (
              topCategories.map((t) => (
                <li key={t.categoryId} className="flex justify-between gap-2">
                  <span>{clickedCats.find((c) => c.id === t.categoryId)?.name}</span>
                  <span className="font-mono text-ink-3">{t._count}</span>
                </li>
              ))
            ) : (
              <li className="text-ink-3">Henüz tıklama yok.</li>
            )}
          </ol>
        </Panel>
        <Panel title="En iyi performans gösteren mağazalar (7 g)">
          <ol className="space-y-1.5 text-[13px]">
            {topRetailers.length ? (
              topRetailers.map((t) => (
                <li key={t.retailerId} className="flex justify-between gap-2">
                  <span>{clickedRetailers.find((c) => c.id === t.retailerId)?.name}</span>
                  <span className="font-mono text-ink-3">{t._count} tıklama</span>
                </li>
              ))
            ) : (
              <li className="text-ink-3">Henüz tıklama yok.</li>
            )}
          </ol>
        </Panel>
      </div>
    </AdminPage>
  );
}
