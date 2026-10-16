/**
 * Tiny dependency-free SVG charts. Colours come from CSS variables so they
 * follow the light/dark theme automatically.
 */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Vertical bars with labels, an optional goal line and a highlighted bar. */
export function barChart(values: number[], labels: string[], opts: { goal?: number; highlight?: number; height?: number; unit?: (v: number) => string } = {}): string {
  const W = 320;
  const H = opts.height ?? 150;
  const pad = { t: 16, b: 22, l: 4, r: 4 };
  const max = Math.max(1, opts.goal ?? 0, ...values) * 1.12;
  const n = values.length;
  const slot = (W - pad.l - pad.r) / n;
  const bw = Math.min(30, slot * 0.62);
  let bars = '';
  values.forEach((v, i) => {
    const h = ((H - pad.t - pad.b) * v) / max;
    const x = pad.l + slot * i + (slot - bw) / 2;
    const y = H - pad.b - h;
    const hl = i === opts.highlight;
    const metGoal = opts.goal && v >= opts.goal;
    bars += `<rect x="${x.toFixed(1)}" y="${(H - pad.b - Math.max(h, 3)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h, 3).toFixed(1)}" rx="${Math.min(8, bw / 2).toFixed(1)}" fill="${metGoal ? 'var(--teal)' : hl ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 45%, var(--surface-2))'}"/>`;
    if (v > 0 && opts.unit && (hl || n <= 7)) bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="800" fill="var(--muted)">${esc(opts.unit(v))}</text>`;
    bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="${hl ? 900 : 700}" fill="${hl ? 'var(--ink)' : 'var(--muted)'}">${esc(labels[i] ?? '')}</text>`;
  });
  let goal = '';
  if (opts.goal) {
    const y = H - pad.b - ((H - pad.t - pad.b) * opts.goal) / max;
    goal = `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--teal)" stroke-width="1.5" stroke-dasharray="4 4" opacity=".8"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${goal}${bars}</svg>`;
}

/** Line chart for mock nets; points oldest first. */
export function lineChart(points: { v: number; label: string }[], opts: { max?: number; height?: number; color?: string } = {}): string {
  const W = 320;
  const H = opts.height ?? 160;
  const pad = { t: 18, b: 24, l: 30, r: 10 };
  if (!points.length) return '';
  const vals = points.map((p) => p.v);
  const hi = opts.max ?? Math.max(...vals) * 1.15;
  const lo = Math.max(0, Math.min(...vals) - (hi - Math.min(...vals)) * 0.25);
  const span = Math.max(1, hi - lo);
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : ((W - pad.l - pad.r) * i) / (points.length - 1));
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / span);
  const color = opts.color ?? 'var(--primary)';
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1).toFixed(1)} ${H - pad.b} L${x(0).toFixed(1)} ${H - pad.b}Z`;
  let grid = '';
  for (let k = 0; k <= 3; k++) {
    const v = lo + (span * k) / 3;
    const yy = y(v);
    grid += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pad.l - 6}" y="${(yy + 3.5).toFixed(1)}" text-anchor="end" font-size="10" font-weight="700" fill="var(--muted)">${Math.round(v)}</text>`;
  }
  const step = Math.ceil(points.length / 6);
  let dots = '';
  points.forEach((p, i) => {
    const last = i === points.length - 1;
    dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${last ? 5 : 3.5}" fill="${last ? color : 'var(--surface)'}" stroke="${color}" stroke-width="2.5"/>`;
    if (i % step === 0 || last) dots += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--muted)">${esc(p.label)}</text>`;
    if (last) dots += `<text x="${x(i).toFixed(1)}" y="${(y(p.v) - 10).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="900" fill="var(--ink)">${p.v.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img"><defs><linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#lcg)"/><path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
}

/** GitHub-style calendar: columns are weeks (Monday-first), oldest left. */
export function heatmap(days: { key: string; v: number; weekday: number }[], goal: number, monthLabels: { col: number; label: string }[]): string {
  const cell = 13;
  const gap = 3;
  const cols = Math.ceil((days.length + (days[0]?.weekday ?? 0)) / 7);
  const W = cols * (cell + gap) + 4;
  const H = 7 * (cell + gap) + 18;
  let out = '';
  const offset = days[0]?.weekday ?? 0;
  days.forEach((d, i) => {
    const idx = i + offset;
    const c = Math.floor(idx / 7);
    const r = idx % 7;
    const k = d.v <= 0 ? 0 : d.v < goal * 0.34 ? 1 : d.v < goal * 0.67 ? 2 : d.v < goal ? 3 : 4;
    const fill = ['var(--surface-2)', 'color-mix(in srgb, var(--primary) 25%, var(--surface-2))', 'color-mix(in srgb, var(--primary) 50%, var(--surface-2))', 'color-mix(in srgb, var(--primary) 78%, var(--surface-2))', 'var(--primary)'][k];
    out += `<rect x="${c * (cell + gap)}" y="${16 + r * (cell + gap)}" width="${cell}" height="${cell}" rx="3.5" fill="${fill}"><title>${d.key}: ${d.v}</title></rect>`;
  });
  for (const m of monthLabels) out += `<text x="${m.col * (cell + gap)}" y="10" font-size="10" font-weight="800" fill="var(--muted)">${esc(m.label)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">${out}</svg>`;
}

/** 24 thin bars for "best hours". */
export function hoursChart(values: number[]): string {
  const W = 320;
  const H = 90;
  const max = Math.max(1, ...values);
  const bw = W / 24;
  let out = '';
  values.forEach((v, i) => {
    const h = (60 * v) / max;
    out += `<rect x="${(i * bw + 1.5).toFixed(1)}" y="${(70 - Math.max(h, 2)).toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="2.5" fill="${v === max && v > 0 ? 'var(--primary)' : 'color-mix(in srgb, var(--teal) 55%, var(--surface-2))'}"/>`;
    if (i % 6 === 0) out += `<text x="${(i * bw + bw / 2).toFixed(1)}" y="86" text-anchor="middle" font-size="10" font-weight="700" fill="var(--muted)">${String(i).padStart(2, '0')}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${out}</svg>`;
}
