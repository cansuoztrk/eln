import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

/**
 * Fiyat takvimi: önümüzdeki günlerin en düşük tek yön fiyatı. Renk yoğunluğu tek renkli sıralı
 * ölçektir (koyu = daha ucuz); değer her hücrede metin olarak da yazılır.
 */
export function FareCalendar({ days, origin, destination }: { days: { day: string; minor: number; currency: string; stops: number }[]; origin: string; destination: string }) {
  if (days.length === 0) return null;
  const min = Math.min(...days.map((d) => d.minor));
  const max = Math.max(...days.map((d) => d.minor));
  const byDay = new Map(days.map((d) => [d.day, d]));
  const first = new Date(`${days[0].day}T00:00:00Z`);
  const start = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * 86400000);
  const last = new Date(`${days[days.length - 1].day}T00:00:00Z`);
  const cells: string[] = [];
  for (let t = start.getTime(); t <= last.getTime(); t += 86400000) cells.push(new Date(t).toISOString().slice(0, 10));
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center font-mono text-[10.5px] text-ink-3">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const d = byDay.get(c);
          if (!d) return <div key={c} className="h-14 rounded-md bg-surface-2/50" aria-hidden />;
          const intensity = max === min ? 0.5 : 1 - (d.minor - min) / (max - min);
          return (
            <Link
              key={c}
              href={`/ucak-bileti/ara?from=${origin}&to=${destination}&depart=${c}`}
              className={cn("flex h-14 flex-col items-center justify-center rounded-md border text-center transition-colors hover:border-ink", d.minor === min ? "border-good" : "border-transparent")}
              style={{ background: `color-mix(in oklab, var(--brand) ${Math.round(6 + intensity * 26)}%, var(--surface))` }}
              title={`${c}: ${formatMoney(d.minor, d.currency)}${d.stops === 0 ? " · direkt" : ""}`}
            >
              <span className="font-mono text-[10.5px] text-ink-2">{Number(c.slice(8))}</span>
              <span className="text-[11.5px] font-semibold tabular text-ink">{formatMoney(d.minor, d.currency).replace(/,\d{2}/, "")}</span>
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-[11.5px] text-ink-3">Koyu hücreler daha düşük fiyat. Yeşil çerçeve: dönemin en düşüğü. Boş günler: sağlayıcıda veri yok.</p>
    </div>
  );
}
