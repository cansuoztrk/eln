import type { Metadata } from "next";
import Link from "next/link";
import { FlightDealCard } from "@/components/flights/flight-deal-card";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section";
import { db } from "@/server/db";
import { flightDealSections } from "@/server/flights/deals";
import { formatMoney, formatPercent } from "@/lib/money";
import { includeTestData } from "@/server/visibility";

export const metadata: Metadata = {
  title: "Uçak bileti fırsatları",
  description: "İstanbul, Ankara ve İzmir çıkışlı uygun uçuşlar, hafta sonu kaçamakları, direkt uçuşlar ve fiyatı düşen rotalar. Fiyatlar yetkili sağlayıcılardan; uydurma fiyat yok.",
  alternates: { canonical: "/ucak-bileti" },
};

export const dynamic = "force-dynamic";

export default async function FlightsHome() {
  const [sections, providers] = await Promise.all([
    flightDealSections(),
    db.dataSource.findMany({ where: { kind: "FLIGHT", ...(includeTestData() ? {} : { isTestData: false }) }, select: { name: true, status: true, isTestData: true, lastSuccessAt: true } }),
  ]);
  const anyData = sections.some((s) => s.items.length || s.drops?.length);
  const connected = providers.filter((p) => p.status === "CONNECTED" || p.status === "TEST_ONLY");

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-10 md:py-14">
          <p className="eyebrow mb-3">Uçak bileti</p>
          <h1 className="max-w-3xl font-display text-[34px] font-[700] leading-[1.05] tracking-[-0.03em] md:text-[48px]">Uygun uçuşu keşfet, fiyatı düşünce haber al.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">Fiyatlar yalnızca yetkili sağlayıcılardan gelir. Önbellek kaynaklı fiyatlar “gösterge fiyat” olarak işaretlenir; rezervasyon anında değişebilir.</p>
          <div className="mt-7">
            <FlightSearchForm />
          </div>
          <p className="mt-3 text-[12.5px] text-ink-3">
            Bağlı sağlayıcı: {connected.length ? connected.map((p) => p.name).join(", ") : "yok — canlı fiyat için bir sağlayıcı yapılandırılmalı"}
          </p>
        </div>
      </section>

      <div className="container-page space-y-14 py-12">
        {!anyData ? (
          <EmptyState icon="plane" title="Henüz rota fiyatı yok">
            İzlenen rotalar yönetim panelinde tanımlıdır; bir uçuş sağlayıcısı bağlandığında en uygun fiyatlar burada otomatik listelenir. Fiyatlar uydurulmaz.
          </EmptyState>
        ) : null}
        {sections.map((s) =>
          s.key === "fiyat-dusenler" ? (
            s.drops && s.drops.length ? (
              <section key={s.key}>
                <SectionHeader title={s.title} description={s.description} />
                <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {s.drops.map((d) => (
                    <li key={d.routeId}>
                      <Link href={`/ucak-bileti/rota/${d.origin}-${d.destination}`} className="card flex items-center justify-between gap-3 p-4 hover:border-line-strong">
                        <span className="font-mono text-[15px] font-semibold">
                          {d.origin} → {d.destination}
                        </span>
                        <span className="text-right text-[13px]">
                          <span className="block font-display text-[18px] font-[680] tabular">{formatMoney(d.now_min, d.currency)}</span>
                          <span className="inline-flex items-center gap-0.5 text-good-ink">
                            <Icon name="arrowDown" className="size-3" />
                            {formatPercent(d.dropPct)} · 7 gün önce {formatMoney(d.then_min, d.currency)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null
          ) : s.items.length ? (
            <section key={s.key}>
              <SectionHeader title={s.title} description={s.description} />
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((f) => (
                  <li key={f.id}>
                    <FlightDealCard f={f} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
        <section className="rounded-xl border border-line bg-surface p-6 text-[13.5px] leading-relaxed text-ink-2">
          <h2 className="mb-2 font-display text-[18px] font-[650] text-ink">Fiyatlar hakkında</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>“Gösterge fiyat”: sağlayıcının son 48 saatte bulduğu en düşük fiyattır; anlık rezervasyon fiyatı değildir.</li>
            <li>“Canlı teklif”: sağlayıcının o anki teklifidir; kısa süre geçerlidir ve rezervasyon anında değişebilir.</li>
            <li>Vergi/harç ve bagaj bilgisi sağlayıcı belirtmiyorsa “belirtilmiyor” yazarız; dâhilmiş gibi davranmayız.</li>
            <li>“Fiyat düştü” yalnızca en az 7 günlük karşılaştırılabilir kayıt varsa gösterilir.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
