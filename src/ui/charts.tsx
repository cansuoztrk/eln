/**
 * Minimal accessible SVG charts (dark surface). Palette validated with the
 * dataviz validator against the panel surface (#141720): all checks pass.
 * Thin marks, hairline grid, crosshair tooltip, legend for ≥ 2 series and a
 * table view for screen readers / exact values.
 */
import { useId, useMemo, useState } from 'react';

export const SERIES = ['#3987e5', '#d95926', '#199e70'];

export interface Series {
  name: string;
  values: number[];
}

export function LineChart({
  title,
  x,
  series,
  yMax = 100,
  unit = '',
  height = 170,
}: {
  title: string;
  x: string[];
  series: Series[];
  yMax?: number;
  unit?: string;
  height?: number;
}) {
  const W = 360;
  const H = height;
  const pad = { l: 30, r: 14, t: 12, b: 22 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const id = useId();
  const xs = (i: number) => pad.l + (iw * i) / Math.max(1, x.length - 1);
  const ys = (v: number) => pad.t + ih - (ih * v) / yMax;
  const ticks = [0, yMax / 2, yMax];
  const paths = useMemo(
    () =>
      series.map((s) => {
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join('');
        const area = `${d}L${xs(s.values.length - 1)},${ys(0)}L${xs(0)},${ys(0)}Z`;
        return { d, area };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, yMax, x.length],
  );
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * iw;
    setHover(Math.max(0, Math.min(x.length - 1, Math.round((px / iw) * (x.length - 1)))));
  };
  return (
    <figure className="m-0">
      <figcaption className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[12.5px] font-semibold" id={`${id}-t`}>
          {title}
        </span>
        <button type="button" className="text-[11px] underline muted hover:text-text" onClick={() => setTable(!table)} aria-expanded={table}>
          {table ? 'Grafiği göster' : 'Tablo'}
        </button>
      </figcaption>
      {series.length > 1 && (
        <div className="flex gap-3 mb-1 text-[11px] text-muted" aria-hidden="true">
          {series.map((s, i) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[2px] rounded" style={{ background: SERIES[i] }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      {table ? (
        <table className="tbl" aria-labelledby={`${id}-t`}>
          <thead>
            <tr>
              <th scope="col">Zaman</th>
              {series.map((s) => (
                <th key={s.name} scope="col">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {x.map((lab, i) => (
              <tr key={lab}>
                <th scope="row" className="!font-normal">
                  {lab}
                </th>
                {series.map((s) => (
                  <td key={s.name} className="tabular-nums">
                    {Math.round(s.values[i])}
                    {unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-labelledby={`${id}-t`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={ys(t)} y2={ys(t)} stroke="#2a2f3b" strokeWidth="1" />
                <text x={pad.l - 6} y={ys(t) + 3.5} fontSize="9.5" textAnchor="end" fill="#8b919c">
                  {t}
                </text>
              </g>
            ))}
            {x.map((lab, i) =>
              i % Math.ceil(x.length / 6) === 0 || i === x.length - 1 ? (
                <text key={lab} x={xs(i)} y={H - 6} fontSize="9.5" textAnchor="middle" fill="#8b919c">
                  {lab}
                </text>
              ) : null,
            )}
            {paths.map((p, i) => (
              <g key={series[i].name}>
                <path d={p.area} fill={SERIES[i]} opacity="0.1" />
                <path d={p.d} fill="none" stroke={SERIES[i]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={xs(series[i].values.length - 1)} cy={ys(series[i].values[series[i].values.length - 1])} r="4" fill={SERIES[i]} stroke="#141720" strokeWidth="2" />
              </g>
            ))}
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={xs(hover)} x2={xs(hover)} y1={pad.t} y2={pad.t + ih} stroke="#8b919c" strokeWidth="1" />
                {series.map((s, i) => (
                  <circle key={s.name} cx={xs(hover)} cy={ys(s.values[hover])} r="4" fill={SERIES[i]} stroke="#141720" strokeWidth="2" />
                ))}
              </g>
            )}
            <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
          </svg>
          {hover !== null && (
            <div
              className="absolute pointer-events-none glass rounded-lg px-2 py-1.5 text-[11px] shadow-xl"
              style={{ left: `${(xs(hover) / W) * 100}%`, top: 0, transform: `translateX(${hover > x.length / 2 ? '-105%' : '5%'})` }}
            >
              <div className="font-semibold mb-0.5">{x[hover]}</div>
              {series.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: SERIES[i] }} />
                  {s.name}: <span className="tabular-nums">{Math.round(s.values[hover])}{unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** Horizontal bars (one series) with value at the tip. */
export function BarList({ title, items, max }: { title: string; items: { label: string; value: number; note?: string }[]; max?: number }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  return (
    <figure className="m-0">
      <figcaption id={id} className="text-[12.5px] font-semibold mb-1.5">
        {title}
      </figcaption>
      <ul aria-labelledby={id} className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={it.label} className="grid grid-cols-[110px_1fr_38px] items-center gap-2 text-[11.5px]" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <span className="truncate text-[#cfd3da]" title={it.note ?? it.label}>
              {it.label}
            </span>
            <span className="h-3 relative" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${(it.value / m) * 100}%`, maxWidth: '100%', background: SERIES[0], opacity: hover === null || hover === i ? 1 : 0.55 }} />
            </span>
            <span className="tabular-nums text-right text-[#cfd3da]">{Math.round(it.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
