import type { Metadata } from "next";
import Link from "next/link";
import { deleteFlightAlert, toggleFavoriteRoute, toggleFlightAlert } from "@/app/actions/flights";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Uçuş alarmlarım", robots: { index: false } };

export default async function FlightAlertsPage() {
  const user = await requireUser("/hesap/ucus-alarmlari");
  const [alerts, routes] = await Promise.all([
    db.flightAlert.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.favoriteRoute.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-[20px] font-[650]">Uçuş alarmlarım</h2>
        {alerts.length ? (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/ucak-bileti/rota/${a.origin}-${a.destination}`} className="font-mono text-[15px] font-semibold hover:text-brand-ink">
                    {a.origin} → {a.destination}
                  </Link>
                  <p className="text-[12.5px] text-ink-3">
                    {formatDate(a.departFrom)} – {formatDate(a.departTo)} · hedef {formatMoney(a.targetMinor, a.currency)}
                    {a.directOnly ? " · yalnızca direkt" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!a.isActive ? <Badge>Duraklatıldı</Badge> : a.state === "TRIGGERED" ? <Badge tone="positive">Bildirildi</Badge> : <Badge tone="brand">Takipte</Badge>}
                  <form action={toggleFlightAlert.bind(null, a.id)}>
                    <button className="h-8 rounded-md border border-line px-2.5 text-[12.5px] hover:bg-surface-2">{a.isActive ? "Duraklat" : "Devam ettir"}</button>
                  </form>
                  <form action={deleteFlightAlert.bind(null, a.id)}>
                    <button className="h-8 rounded-md border border-line px-2.5 text-[12.5px] text-bad-ink hover:bg-bad-soft">Sil</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="plane" title="Uçuş alarmı yok" action={<Link href="/ucak-bileti" className="text-sm font-medium text-brand-ink underline">Rotalara göz at</Link>}>
            Bir rota sayfasından tarih aralığı ve hedef fiyat belirleyerek alarm kurabilirsiniz.
          </EmptyState>
        )}
      </section>
      <section>
        <h2 className="mb-4 font-display text-[18px] font-[650]">Favori rotalar</h2>
        {routes.length ? (
          <ul className="flex flex-wrap gap-2">
            {routes.map((r) => (
              <li key={r.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-3 pr-1 text-[13px]">
                <Link href={`/ucak-bileti/rota/${r.origin}-${r.destination}`} className="font-mono font-semibold">
                  {r.origin} → {r.destination}
                </Link>
                <form action={toggleFavoriteRoute.bind(null, r.origin, r.destination)}>
                  <button className="grid size-6 place-items-center rounded-full text-ink-3 hover:bg-surface-2" aria-label="Favorilerden çıkar">
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-3">Uçuş alarmı kurduğunuz rotalar otomatik olarak favorilere eklenir.</p>
        )}
      </section>
    </div>
  );
}
