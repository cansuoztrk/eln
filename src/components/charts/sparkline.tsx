/**
 * 30 günlük günlük-en-düşük fiyat sparkline'ı. Tek seri: lejant yok; veri olmayan günlerde çizgi
 * kesilir (boşluk uydurulmaz). Son nokta vurgu renginde işaretlenir.
 */
export function Sparkline({ values, width = 96, height = 28, className, label }: { values: (number | null)[]; width?: number; height?: number; className?: string; label?: string }) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 3) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = 3;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const segments: string[] = [];
  let current = "";
  values.forEach((v, i) => {
    if (v === null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (current) segments.push(current);
  const lastIndex = values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop()!;
  const last = values[lastIndex]!;
  const trendDown = last < nums[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={label ?? "Son 30 günün fiyat eğilimi"}>
      <line x1={pad} x2={width - pad} y1={y(min)} y2={y(min)} stroke="var(--grid)" strokeWidth="1" />
      {segments.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--ink-3)" strokeOpacity="0.55" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <circle cx={x(lastIndex)} cy={y(last)} r="3" fill={trendDown ? "var(--good)" : "var(--brand)"} stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
  );
}
