import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { FlightResultCard, type FlightCardData } from "@/components/flights/flight-result-card";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { AutoSubmitForm } from "@/components/listing/auto-submit";
import { FilterDrawer } from "@/components/listing/filter-drawer";
import { Icon } from "@/components/icons";
import { SaveSearchButton } from "@/components/account/save-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatShortDate, formatWeekday } from "@/lib/time";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { flightQuerySchema, searchFlights, validateDates } from "@/server/flights/search";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const metadata: Metadata = { title: "Uçuş arama", robots: { index: false, follow: true } };

const WINDOWS: Record<string, [number, number, string]> = {
  gece: [0, 5, "Gece (00–05)"],
  sabah: [5, 12, "Sabah (05–12)"],
  ogle: [12, 18, "Öğleden sonra (12–18)"],
  aksam: [18, 24, "Akşam (18–24)"],
};

function hourIst(iso: string | Date) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", hour12: false }).format(new Date(iso)));
}

export default async function FlightSearchPage(props: PageProps<"/ucak-bileti/ara">) {
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const many = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[]) : one(k) ? [one(k)!] : []);
  const parsed = flightQuerySchema.safeParse({ from: one("from"), to: one("to"), depart: one("depart"), return: one("return"), adults: one("adults"), cabin: one("cabin"), direct: one("direct"), flex: one("flex") });
  const defaults = { from: one("from"), to: one("to"), depart: one("depart"), return: one("return"), adults: Number(one("adults") ?? 1), cabin: one("cabin"), direct: one("direct") === "1", flex: Number(one("flex") ?? 0) };

  if (!parsed.success) {
    return (
      <div className="container-page py-10">
        <h1 className="mb-4 font-display text-[28px] font-[680]">Uçuş ara</h1>
        <FlightSearchForm d={defaults} />
        {one("from") || one("to") ? <p className="mt-4 rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">{parsed.error.issues[0]?.message ?? "Arama bilgileri eksik."} Lütfen kalkış, varış ve tarihi listeden seçin.</p> : null}
      </div>
    );
  }
  const q = parsed.data;
  const dateError = validateDates(q);
  const h = await headers();
  const limited = !rateLimit(`flight-search:${clientIp(h)}`, 30, 10 * 60_000).ok;
  const result = dateError || limited ? null : await searchFlights(q);
  const user = await getCurrentUser();
  const airlines = await db.airline.findMany();
  const airlineName = new Map(airlines.map((a) => [a.iata, a.name]));
  const [fromAp, toAp] = await Promise.all([db.airport.findUnique({ where: { iata: q.from } }), db.airport.findUnique({ where: { iata: q.to } })]);

  // ── Süzme (URL parametreleri; paylaşılabilir)
  const fAirlines = many("havayolu");
  const fStops = one("aktarma");
  const fMaxHours = Number(one("maxsure") ?? 0);
  const fMin = Number(one("min") ?? 0) * 100;
  const fMax = Number(one("max") ?? 0) * 100;
  const fBag = one("bagaj") === "1";
  const fDepWin = one("kalkis");
  const fArrWin = one("varis");
  const fDate = one("tarih");
  const sort = one("sirala") ?? "fiyat";

  const all: FlightCardData[] = (result?.offers ?? []).map((o) => ({
    id: o.id,
    origin: o.origin,
    destination: o.destination,
    originAirport: o.originAirport,
    destinationAirport: o.destinationAirport,
    departAt: o.departAt.toISOString(),
    returnAt: o.returnAt?.toISOString() ?? null,
    oneWay: o.oneWay,
    airlineCode: o.airlineCode,
    airlineName: o.airlineCode ? (airlineName.get(o.airlineCode) ?? null) : null,
    flightNumber: o.flightNumber,
    stops: o.stops,
    returnStops: o.returnStops,
    durationOutMinutes: o.durationOutMinutes,
    durationBackMinutes: o.durationBackMinutes,
    priceMinor: o.priceMinor,
    currency: o.currency,
    priceKind: o.priceKind,
    priceIncludesTaxes: o.priceIncludesTaxes,
    baggageIncluded: o.baggageIncluded,
    baggageInfo: o.baggageInfo,
    fareConditions: o.fareConditions,
    deepLink: o.deepLink,
    isAffiliateLink: o.isAffiliateLink,
    checkedAt: o.checkedAt.toISOString(),
    providerName: o.dataSource.name,
    isTestData: o.dataSource.isTestData,
    passengers: o.passengers,
  }));

  const dates = new Map<string, number>();
  for (const f of all) {
    const d = f.departAt.slice(0, 10);
    dates.set(d, Math.min(dates.get(d) ?? Infinity, f.priceMinor));
  }
  const filtered = all
    .filter((f) => !fDate || f.departAt.slice(0, 10) === fDate)
    .filter((f) => fAirlines.length === 0 || (f.airlineCode && fAirlines.includes(f.airlineCode)))
    .filter((f) => !fStops || (fStops === "0" ? f.stops === 0 : fStops === "1" ? f.stops <= 1 : true))
    .filter((f) => !fMaxHours || (f.durationOutMinutes !== null && f.durationOutMinutes <= fMaxHours * 60))
    .filter((f) => !fMin || f.priceMinor >= fMin)
    .filter((f) => !fMax || f.priceMinor <= fMax)
    .filter((f) => !fBag || f.baggageIncluded === true)
    .filter((f) => !fDepWin || !WINDOWS[fDepWin] || (hourIst(f.departAt) >= WINDOWS[fDepWin][0] && hourIst(f.departAt) < WINDOWS[fDepWin][1]))
    .filter((f) => {
      if (!fArrWin || !WINDOWS[fArrWin] || f.durationOutMinutes === null) return true;
      const h = hourIst(new Date(new Date(f.departAt).getTime() + f.durationOutMinutes * 60000));
      return h >= WINDOWS[fArrWin][0] && h < WINDOWS[fArrWin][1];
    })
    .sort((a, b) =>
      sort === "sure"
        ? (a.durationOutMinutes ?? 1e9) - (b.durationOutMinutes ?? 1e9)
        : sort === "kalkis"
          ? a.departAt.localeCompare(b.departAt)
          : a.priceMinor - b.priceMinor,
    );
  const cheapest = Math.min(...filtered.map((f) => f.priceMinor));
  const fastest = Math.min(...filtered.map((f) => f.durationOutMinutes ?? 1e9));
  filtered.forEach((f) => {
    f.cheapest = f.priceMinor === cheapest;
    f.fastest = f.durationOutMinutes === fastest && filtered.length > 1;
  });
  const airlineCodes = [...new Set(all.map((f) => f.airlineCode).filter((x): x is string => Boolean(x)))];

  const baseParams = new URLSearchParams();
  for (const k of ["from", "to", "depart", "return", "adults", "cabin", "direct", "flex"]) if (one(k)) baseParams.set(k, one(k)!);
  const fixed = Object.fromEntries(baseParams);
  const selfUrl = `/ucak-bileti/ara?${new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : v ? [[k, v]] : [])) as string[][]).toString()}`;

  const filters = (
    <AutoSubmitForm action="/ucak-bileti/ara" className="space-y-5 text-[13.5px]">
      {Object.entries(fixed).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {fDate ? <input type="hidden" name="tarih" value={fDate} /> : null}
      <fieldset>
        <legend className="mb-2 font-semibold">Sırala</legend>
        {[
          ["fiyat", "En ucuz"],
          ["sure", "En kısa süre"],
          ["kalkis", "En erken kalkış"],
        ].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 py-1 text-ink-2">
            <input type="radio" name="sirala" value={v} defaultChecked={sort === v} className="accent-[var(--brand)]" /> {l}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Aktarma</legend>
        {[
          ["", "Fark etmez"],
          ["0", "Yalnızca direkt"],
          ["1", "En fazla 1 aktarma"],
        ].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 py-1 text-ink-2">
            <input type="radio" name="aktarma" value={v} defaultChecked={(fStops ?? "") === v} className="accent-[var(--brand)]" /> {l}
          </label>
        ))}
      </fieldset>
      {airlineCodes.length ? (
        <fieldset>
          <legend className="mb-2 font-semibold">Havayolu</legend>
          {airlineCodes.map((c) => (
            <label key={c} className="flex items-center gap-2 py-1 text-ink-2">
              <input type="checkbox" name="havayolu" value={c} defaultChecked={fAirlines.includes(c)} className="accent-[var(--brand)]" /> {airlineName.get(c) ?? c}
            </label>
          ))}
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="mb-2 font-semibold">Kalkış saati</legend>
        <select name="kalkis" defaultValue={fDepWin ?? ""} className="field h-9">
          <option value="">Fark etmez</option>
          {Object.entries(WINDOWS).map(([k, [, , l]]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Varış saati</legend>
        <select name="varis" defaultValue={fArrWin ?? ""} className="field h-9">
          <option value="">Fark etmez</option>
          {Object.entries(WINDOWS).map(([k, [, , l]]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Uçuş süresi</legend>
        <select name="maxsure" defaultValue={fMaxHours ? String(fMaxHours) : ""} className="field h-9">
          <option value="">Fark etmez</option>
          {[2, 3, 5, 8, 12].map((hh) => (
            <option key={hh} value={hh}>
              En fazla {hh} saat
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Fiyat aralığı (TL)</legend>
        <div className="flex gap-2">
          <input name="min" inputMode="numeric" placeholder="En az" defaultValue={one("min")} className="field h-9" aria-label="En düşük fiyat" />
          <input name="max" inputMode="numeric" placeholder="En çok" defaultValue={one("max")} className="field h-9" aria-label="En yüksek fiyat" />
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-ink-2">
        <input type="checkbox" name="bagaj" value="1" defaultChecked={fBag} className="accent-[var(--brand)]" /> Yalnızca bagaj dâhil olanlar
      </label>
      <button className="h-10 w-full rounded-md bg-brand text-[14px] font-semibold text-on-brand">Uygula</button>
    </AutoSubmitForm>
  );

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-6">
          <h1 className="mb-1 flex flex-wrap items-center gap-2 font-display text-[24px] font-[680] tracking-tight md:text-[28px]">
            {fromAp?.city ?? q.from} <Icon name="arrowRight" className="size-5 text-ink-3" /> {toAp?.city ?? q.to}
          </h1>
          <p className="mb-4 text-[13px] text-ink-2">
            {formatWeekday(`${q.depart}T12:00:00Z`)} {formatShortDate(`${q.depart}T12:00:00Z`)}
            {q.return ? ` – ${formatShortDate(`${q.return}T12:00:00Z`)}` : " · tek yön"} · {q.adults} yetişkin
            {q.flex ? ` · ±${q.flex} gün esnek` : ""}
          </p>
          <FlightSearchForm d={defaults} compact />
        </div>
      </div>
      <div className="container-page py-8">
        {dateError ? <p className="mb-6 rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">{dateError}</p> : null}
        {limited ? <p className="mb-6 rounded-md bg-warn-soft px-3 py-2 text-[13px] text-warn-ink">Kısa sürede çok fazla arama yapıldı. Birkaç dakika sonra tekrar deneyin.</p> : null}
        {result ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {result.providers.map((p) => (
              <span key={p.key} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px]", p.ok ? "border-line text-ink-2" : "border-dashed border-line-strong text-ink-3")} title={p.message ?? p.priceNote}>
                <span className={cn("size-1.5 rounded-full", p.ok ? (p.kind === "test" ? "bg-warn" : "bg-good") : "bg-line-strong")} />
                {p.name}
                {!p.ok ? " · bağlı değil" : ""}
              </span>
            ))}
          </div>
        ) : null}

        {dates.size > 1 ? (
          <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
            <Link href={`/ucak-bileti/ara?${baseParams}`} className={cn("shrink-0 rounded-lg border px-3 py-2 text-[12.5px]", !fDate ? "border-ink bg-ink text-bg" : "border-line bg-surface")}>
              Tüm tarihler
            </Link>
            {[...dates.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([d, min]) => (
                <Link key={d} href={`/ucak-bileti/ara?${baseParams}&tarih=${d}`} className={cn("shrink-0 rounded-lg border px-3 py-2 text-center text-[12.5px]", fDate === d ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-line-strong")}>
                  <span className="block">
                    {formatWeekday(`${d}T12:00:00Z`)} {formatShortDate(`${d}T12:00:00Z`)}
                  </span>
                  <span className="block font-semibold tabular">{formatMoney(min, all[0]?.currency ?? "TRY")}</span>
                </Link>
              ))}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden lg:block">{filters}</aside>
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13.5px] text-ink-2">
                <strong className="text-ink">{filtered.length}</strong> uçuş {all.length !== filtered.length ? `(${all.length} sonuçtan)` : ""}
              </p>
              <div className="flex items-center gap-2">
                <FilterDrawer count={[fAirlines.length, fStops, fMaxHours, fMin, fMax, fBag, fDepWin, fArrWin].filter(Boolean).length}>{filters}</FilterDrawer>
                {user ? <SaveSearchButton kind="FLIGHT" query={selfUrl} defaultName={`${q.from} → ${q.to}`} /> : null}
                <Link href={`/ucak-bileti/rota/${q.from}-${q.to}`} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] hover:bg-surface-2">
                  <Icon name="bellPlus" className="size-4" /> Rota alarmı
                </Link>
              </div>
            </div>
            {filtered.length ? (
              <ul className="space-y-3">
                {filtered.slice(0, 60).map((f) => (
                  <li key={f.id}>
                    <FlightResultCard f={f} />
                  </li>
                ))}
              </ul>
            ) : result ? (
              <EmptyState icon="plane" title={result.providers.some((p) => p.ok) ? "Bu kriterlere uygun uçuş bulunamadı" : "Uçuş sağlayıcısı bağlı değil"}>
                {result.providers.some((p) => p.ok)
                  ? "Filtreleri gevşetin, esnek tarih seçin veya farklı bir havalimanı deneyin."
                  : "Gerçek uçuş fiyatları için yönetim panelinden bir sağlayıcı (ör. Travelpayouts veya Duffel) yapılandırılmalıdır. Fiyat uydurmuyoruz."}
              </EmptyState>
            ) : null}
            <p className="mt-6 text-[12px] leading-relaxed text-ink-3">
              Uçuş fiyatları sık değişir. Gösterge fiyatlar sağlayıcı önbelleğinden gelir; canlı teklifler kısa süre geçerlidir. Satın almadan önce satış sayfasındaki son fiyatı, vergi/harçları ve bagaj koşullarını kontrol edin.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
