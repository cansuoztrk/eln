import type { Metadata } from "next";
import Link from "next/link";
import { AlertRowActions } from "@/components/account/alert-row-actions";
import { Freshness } from "@/components/price/freshness";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Fiyat alarmlarım", robots: { index: false } };

export default async function MyAlertsPage() {
  const user = await requireUser("/hesap/alarmlar");
  const alerts = await db.priceAlert.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    include: { product: { select: { slug: true, title: true, bestTotalMinor: true, bestCurrency: true, lastVerifiedAt: true } }, variant: { select: { label: true } } },
  });
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-[20px] font-[650]">Fiyat alarmlarım</h2>
        <p className="text-[12.5px] text-ink-3">Alarmlar her doğrulanmış fiyat güncellemesinde kontrol edilir. Aynı düşüş için tekrar bildirim gönderilmez.</p>
      </div>
      {alerts.length ? (
        <ul className="space-y-3">
          {alerts.map((a) => {
            const reached = a.product.bestTotalMinor !== null && a.product.bestTotalMinor <= a.targetMinor;
            return (
              <li key={a.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/urun/${a.product.slug}`} className="font-medium hover:text-brand-ink">
                      {a.product.title}
                    </Link>
                    <p className="mt-0.5 text-[12.5px] text-ink-3">
                      {a.variant?.label ?? "Tüm varyantlar"} · {a.includeShipping ? "kargo dâhil" : "kargo hariç"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!a.isActive ? <Badge>Duraklatıldı</Badge> : a.state === "TRIGGERED" ? <Badge tone="positive">Hedefe ulaştı · bildirildi</Badge> : <Badge tone="brand">Takipte</Badge>}
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                  <div>
                    <dt className="text-ink-3">Hedef</dt>
                    <dd className="font-semibold tabular">{formatMoney(a.targetMinor, a.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Şu anki en iyi</dt>
                    <dd className={reached ? "font-semibold text-good-ink tabular" : "tabular"}>{a.product.bestTotalMinor ? formatMoney(a.product.bestTotalMinor, a.product.bestCurrency ?? "TRY") : "Güncel teklif yok"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Son fiyat kontrolü</dt>
                    <dd>
                      <Freshness at={a.product.lastVerifiedAt} compact />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Son bildirim</dt>
                    <dd className="text-[12.5px]">{a.lastTriggeredAt ? formatDateTime(a.lastTriggeredAt) : "—"}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-line pt-3">
                  <AlertRowActions id={a.id} active={a.isActive} targetTl={String(a.targetMinor / 100)} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon="bell" title="Henüz alarm yok" action={<Link href="/firsatlar" className="text-sm font-medium text-brand-ink underline">Ürünlere göz at</Link>}>
          Bir ürün sayfasındaki “Fiyat alarmı” bölümünden hedef fiyat belirleyin.
        </EmptyState>
      )}
    </section>
  );
}
