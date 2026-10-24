import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { FareCalendar } from "@/components/flights/fare-calendar";
import { FlightAlertForm } from "@/components/flights/flight-alert-form";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { Icon } from "@/components/icons";
import { TestDataBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section";
import { DAY } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { routeDetail } from "@/server/flights/deals";

function parse(pair: string) {
  const m = pair.toUpperCase().match(/^([A-Z]{3})-([A-Z]{3})$/);
  return m ? { origin: m[1], destination: m[2] } : null;
}

export async function generateMetadata(props: PageProps<"/ucak-bileti/rota/[pair]">): Promise<Metadata> {
  const p = parse((await props.params).pair);
  if (!p) return {};
  const [a, b] = await Promise.all([db.airport.findUnique({ where: { iata: p.origin } }), db.airport.findUnique({ where: { iata: p.destination } })]);
  return { title: `${a?.city ?? p.origin} – ${b?.city ?? p.destination} uçak bileti fiyatları`, alternates: { canonical: `/ucak-bileti/rota/${p.origin}-${p.destination}` } };
}

export default async function RoutePage(props: PageProps<"/ucak-bileti/rota/[pair]">) {
  const p = parse((await props.params).pair);
  if (!p) notFound();
  const [detail, user, a, b] = await Promise.all([routeDetail(p.origin, p.destination), getCurrentUser(), db.airport.findUnique({ where: { iata: p.origin } }), db.airport.findUnique({ where: { iata: p.destination } })]);
  const days = detail.calendar.map((c) => ({ day: new Date(c.day.getTime() - c.day.getTimezoneOffset() * 60000).toISOString().slice(0, 10), minor: c.minor, currency: c.currency, stops: c.stops }));
  const isTest = detail.calendar.some((c) => c.isTestData);
  const cheapest = days.length ? days.reduce((m, d) => (d.minor < m.minor ? d : m)) : null;
  const now = Date.now();
  const historySeries = detail.history.length >= 2
    ? [{ key: "route", label: "Önümüzdeki uçuşların en düşük gösterge fiyatı", slot: 0, points: Array.from({ length: 90 }, (_, i) => {
        const t = now - (89 - i) * DAY;
        const dayKey = new Date(t).toISOString().slice(0, 10);
        const hit = detail.history.find((h) => h.day.toISOString().slice(0, 10) === dayKey);
        return { t, v: hit ? hit.minor : null };
      }) }]
    : [];

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-8">
          <p className="eyebrow mb-2">Rota</p>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-[28px] font-[680] tracking-tight md:text-[36px]">
            {a?.city ?? p.origin} <Icon name="arrowRight" className="size-6 text-ink-3" /> {b?.city ?? p.destination}
            {isTest ? <TestDataBadge /> : null}
          </h1>
          <p className="mt-2 text-[14px] text-ink-2">
            {p.origin} → {p.destination}
            {detail.route ? " · izlenen rota, fiyatlar otomatik güncellenir" : " · bu rota henüz otomatik izlenmiyor; arama yapabilirsiniz"}
            {cheapest ? ` · önümüzdeki dönemin en düşüğü ${formatMoney(cheapest.minor, cheapest.currency)}` : ""}
          </p>
          <div className="mt-6">
            <FlightSearchForm d={{ from: p.origin, to: p.destination, depart: cheapest?.day }} compact />
          </div>
        </div>
      </div>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <SectionHeader title="Fiyat takvimi" description="Tek yön, günlük en düşük fiyat. Bir güne tıklayarak o günün uçuşlarını arayın." />
          {days.length ? (
            <div className="card p-4">
              <FareCalendar days={days} origin={p.origin} destination={p.destination} />
            </div>
          ) : (
            <EmptyState icon="calendar" title="Bu rota için takvim verisi yok">
              Rota bir sağlayıcı tarafından izlenmediğinde veya sağlayıcı bağlı olmadığında takvim oluşmaz.
            </EmptyState>
          )}
          {historySeries.length ? (
            <div className="mt-10">
              <SectionHeader title="Rota fiyatının değişimi" description="Her kontrol gününde, önümüzdeki uçuşlar için görülen en düşük gösterge fiyat." />
              <div className="card p-4">
                <PriceHistoryChart series={historySeries} currency={cheapest?.currency ?? "TRY"} firstTrackedAt={detail.history[0].day.toISOString()} />
              </div>
            </div>
          ) : null}
        </section>
        <aside className="space-y-6">
          <div className="card p-5" id="alarm">
            <h2 className="mb-1 flex items-center gap-2 font-display text-[18px] font-[650]">
              <Icon name="bellPlus" className="size-5 text-brand-ink" /> Uçuş alarmı
            </h2>
            <p className="mb-4 text-[13px] text-ink-2">Seçtiğiniz tarih aralığında fiyat hedefin altına inerse haber verelim.</p>
            <FlightAlertForm origin={p.origin} destination={p.destination} suggestedMinor={cheapest?.minor ?? null} loggedIn={Boolean(user)} />
          </div>
        </aside>
      </div>
    </>
  );
}
