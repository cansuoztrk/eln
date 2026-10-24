import Link from "next/link";
import type { ProductCardData } from "@/server/catalog/queries";
import { formatMoney, formatPercent } from "@/lib/money";

/**
 * İmza öğesi: radar ekranı. Noktalar o anda en yüksek fırsat puanına sahip GERÇEK ürünlerdir;
 * merkeze yakınlık puanı temsil eder (daha yüksek puan → merkeze daha yakın). Veri yoksa yalnızca
 * halkalar ve tarama görünür.
 */
export function HeroRadar({ items }: { items: ProductCardData[] }) {
  const blips = items.filter((i) => i.best && i.dealScore !== null).slice(0, 7);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      <div className="absolute inset-0 rounded-full border border-line bg-[radial-gradient(circle_at_center,var(--surface)_0%,var(--bg)_72%)]" />
      {[0.25, 0.5, 0.75].map((r) => (
        <div key={r} className="absolute rounded-full border border-line" style={{ inset: `${r * 50}%` }} />
      ))}
      <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-line" />
      <div className="radar-sweep absolute inset-0 rounded-full" aria-hidden />
      <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" aria-hidden />
      {["0", "25", "50", "75"].map((v, i) => (
        <span key={v} className="absolute left-1/2 ml-1.5 font-mono text-[9.5px] text-ink-3" style={{ top: `${50 - (i + 1) * 12.5}%` }} aria-hidden>
          {100 - (i + 1) * 25}
        </span>
      ))}
      <ul aria-label="Şu anda radara takılan fırsatlar">
        {blips.map((b, i) => {
          const angle = (i / blips.length) * Math.PI * 2 - Math.PI / 2 + 0.35;
          const radius = 46 * (1 - Math.min(Math.max((b.dealScore ?? 0) / 100, 0), 1)) + 9;
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const right = x > 55;
          return (
            <li key={b.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
              <Link href={`/urun/${b.slug}`} className="group/blip relative -ml-2 -mt-2 grid size-4 place-items-center rounded-full focus-visible:outline-offset-4">
                <span className="blip size-2.5 rounded-full bg-brand ring-2 ring-surface" style={{ animationDelay: `${i * 0.4}s` }} />
                <span
                  className={`pointer-events-none absolute top-1/2 z-10 w-max max-w-[210px] -translate-y-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-left shadow-pop opacity-0 transition-opacity group-hover/blip:opacity-100 group-focus-visible/blip:opacity-100 ${right ? "right-6" : "left-6"}`}
                >
                  <span className="block truncate text-[12px] font-medium">{b.title}</span>
                  <span className="block font-mono text-[11px] text-ink-2 tabular">
                    {formatMoney(b.best!.totalMinor ?? b.best!.priceMinor, b.best!.currency)}
                    {b.discount ? ` · ${formatPercent(b.discount.percent)} ↓` : ""} · puan {Math.round(b.dealScore ?? 0)}
                  </span>
                </span>
                <span className="sr-only">
                  {b.title}, {formatMoney(b.best!.totalMinor ?? b.best!.priceMinor, b.best!.currency)}, fırsat puanı {Math.round(b.dealScore ?? 0)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="absolute -bottom-7 left-0 right-0 text-center font-mono text-[10.5px] text-ink-3">
        {blips.length ? "Merkeze yakın = daha yüksek fırsat puanı" : "Veri kaynağı bağlandığında fırsatlar burada görünür"}
      </p>
    </div>
  );
}
