"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatDate, formatShortDate } from "@/lib/time";

export type ChartSeriesInput = {
  key: string;
  label: string;
  slot: number; // kategorik renk yuvası (mağazaya bağlı, sabit sıra)
  points: { t: number; v: number | null }[]; // günlük en düşük (minor unit); null = veri yok
};

const RANGES = [
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
  { days: 180, label: "180 gün" },
];

const SERIES_VARS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

function niceStep(range: number, ticks: number) {
  const raw = range / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

/**
 * Fiyat geçmişi grafiği — yalnızca gerçek kayıtlardan. Tek y ekseni; mağaza başına 2 px çizgi;
 * veri olmayan günlerde çizgi kesilir; artı imleç + ipucu; ≥2 seride lejant; tablo görünümü.
 */
export function PriceHistoryChart({ series, currency, firstTrackedAt }: { series: ChartSeriesInput[]; currency: string; firstTrackedAt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [range, setRange] = useState(90);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalDays = series[0]?.points.length ?? 0;
  const firstDataIndex = useMemo(() => {
    let first = totalDays;
    for (const s of series) {
      const i = s.points.findIndex((p) => p.v !== null);
      if (i >= 0) first = Math.min(first, i);
    }
    return first;
  }, [series, totalDays]);
  const availableDays = totalDays - firstDataIndex;

  const view = useMemo(() => {
    const days = Math.min(range, totalDays);
    return series.map((s) => ({ ...s, points: s.points.slice(totalDays - days) }));
  }, [series, range, totalDays]);

  const height = width < 520 ? 220 : 280;
  const m = { l: width < 520 ? 58 : 72, r: 14, t: 18, b: 28 };
  const innerW = width - m.l - m.r;
  const innerH = height - m.t - m.b;
  const n = view[0]?.points.length ?? 0;

  const values = view.flatMap((s) => s.points.map((p) => p.v)).filter((v): v is number => v !== null);
  const hasData = values.length >= 2 && availableDays >= 2;
  const minV = hasData ? Math.min(...values) : 0;
  const maxV = hasData ? Math.max(...values) : 1;
  const step = niceStep(Math.max(maxV - minV, maxV * 0.04), 4);
  const lo = Math.max(0, Math.floor((minV - step * 0.4) / step) * step);
  const hi = Math.ceil((maxV + step * 0.4) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1; v += step) ticks.push(v);

  const x = (i: number) => m.l + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const y = (v: number) => m.t + (1 - (v - lo) / (hi - lo || 1)) * innerH;

  const paths = view.map((s) => {
    let d = "";
    let pen = false;
    s.points.forEach((p, i) => {
      if (p.v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`;
      pen = true;
    });
    return d;
  });

  // En düşük nokta (tüm seriler) — tek seçici etiket
  let lowest: { i: number; v: number; s: number } | null = null;
  view.forEach((s, si) =>
    s.points.forEach((p, i) => {
      if (p.v !== null && (!lowest || p.v < lowest.v)) lowest = { i, v: p.v, s: si };
    }),
  );
  const low = lowest as { i: number; v: number; s: number } | null;

  const xTicks = n > 1 ? [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1] : [];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - m.l) / innerW) * (n - 1));
    setHover(i >= 0 && i < n ? i : null);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {view.length >= 2 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Lejant">
            {view.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-2 text-[12.5px] text-ink-2">
                <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES_VARS[s.slot % 4] }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-ink-2">{view[0]?.label ?? ""} · günlük en düşük fiyat</p>
        )}
        <div role="radiogroup" aria-label="Zaman aralığı" className="inline-flex rounded-md border border-line bg-surface-2 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              role="radio"
              aria-checked={range === r.days}
              onClick={() => setRange(r.days)}
              className={cn("h-7 rounded px-2.5 font-mono text-[11.5px]", range === r.days ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative w-full">
        {!hasData ? (
          <div className="grid h-[220px] place-items-center rounded-lg border border-dashed border-line-strong text-center text-[13px] text-ink-2">
            <p className="max-w-sm px-6">
              Henüz grafik için yeterli fiyat kaydı yok. Bu ürün {formatDate(firstTrackedAt)} tarihinden beri izleniyor; geçmiş biriktikçe grafik oluşur.
            </p>
          </div>
        ) : (
          <>
            <svg width={width} height={height} className="block touch-none select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`Fiyat geçmişi grafiği, son ${Math.min(range, availableDays)} gün`}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
                  <text x={m.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fill="var(--ink-3)" fontSize={11} fontFamily="var(--font-mono)" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatMoney(Math.round(t / 100) * 100, currency).replace(/,00(?=\s|$)/, "")}
                  </text>
                </g>
              ))}
              <line x1={m.l} x2={width - m.r} y1={m.t + innerH} y2={m.t + innerH} stroke="var(--axis)" strokeWidth={1} />
              {xTicks.map((i) => (
                <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fill="var(--ink-3)" fontSize={11} fontFamily="var(--font-mono)">
                  {formatShortDate(view[0].points[i].t)}
                </text>
              ))}
              {paths.map((d, si) => (
                <path key={view[si].key} d={d} fill="none" stroke={SERIES_VARS[view[si].slot % 4]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {view.map((s, si) => {
                const lastIdx = s.points.map((p, i) => (p.v === null ? -1 : i)).filter((i) => i >= 0).pop();
                if (lastIdx === undefined) return null;
                return <circle key={`end-${s.key}`} cx={x(lastIdx)} cy={y(s.points[lastIdx].v!)} r={4} fill={SERIES_VARS[s.slot % 4]} stroke="var(--surface)" strokeWidth={2} />;
              })}
              {low ? (
                <g>
                  <circle cx={x(low.i)} cy={y(low.v)} r={4.5} fill="var(--surface)" stroke={SERIES_VARS[view[low.s].slot % 4]} strokeWidth={2} />
                  <text x={Math.min(Math.max(x(low.i), m.l + 50), width - m.r - 50)} y={y(low.v) + 18} textAnchor="middle" fill="var(--ink-2)" fontSize={11} fontWeight={600}>
                    En düşük {formatMoney(low.v, currency)}
                  </text>
                </g>
              ) : null}
              {hover !== null ? (
                <g pointerEvents="none">
                  <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + innerH} stroke="var(--ink-3)" strokeWidth={1} />
                  {view.map((s) =>
                    s.points[hover]?.v !== null && s.points[hover] ? (
                      <circle key={`h-${s.key}`} cx={x(hover)} cy={y(s.points[hover].v!)} r={4.5} fill={SERIES_VARS[s.slot % 4]} stroke="var(--surface)" strokeWidth={2} />
                    ) : null,
                  )}
                </g>
              ) : null}
            </svg>
            {hover !== null ? (
              <div
                className="pointer-events-none absolute top-2 z-10 min-w-[180px] rounded-md border border-line bg-surface px-3 py-2 shadow-pop"
                style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 200) }}
              >
                <p className="mb-1 font-mono text-[11px] text-ink-3">{formatDate(view[0].points[hover].t)}</p>
                {view.map((s) => (
                  <p key={s.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="inline-flex items-center gap-1.5 text-ink-2">
                      <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES_VARS[s.slot % 4] }} />
                      {s.label}
                    </span>
                    <span className="font-semibold tabular text-ink">{s.points[hover]?.v !== null && s.points[hover] ? formatMoney(s.points[hover].v!, currency) : "veri yok"}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
      {availableDays < range && hasData ? (
        <p className="mt-2 text-[12px] text-ink-3">
          Seçilen aralığın yalnızca son {availableDays} günü için kayıt var; öncesi gösterilmez (veri uydurulmaz).
        </p>
      ) : null}
      {hasData ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12.5px] font-medium text-brand-ink">Tablo olarak göster</summary>
          <div className="mt-2 max-h-72 overflow-auto rounded-md border border-line">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Tarih</th>
                  {view.map((s) => (
                    <th key={s.key} className="px-3 py-2 text-right font-medium">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {view[0].points
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => view.some((s) => s.points[i].v !== null))
                  .reverse()
                  .map(({ p, i }) => (
                    <tr key={p.t} className="border-t border-line">
                      <td className="px-3 py-1.5 text-ink-2">{formatDate(p.t)}</td>
                      {view.map((s) => (
                        <td key={s.key} className="px-3 py-1.5 text-right">
                          {s.points[i].v !== null ? formatMoney(s.points[i].v!, currency) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
