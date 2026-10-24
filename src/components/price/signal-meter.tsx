import { cn } from "@/lib/cn";

/**
 * Fırsat puanı göstergesi: sinyal çubukları (radar/sinyal metaforu) + sayı.
 * Renk tek başına anlam taşımaz; puan her zaman sayıyla birlikte gösterilir.
 */
export function SignalMeter({ score, className, showNumber = true }: { score: number | null | undefined; className?: string; showNumber?: boolean }) {
  if (score === null || score === undefined) {
    return <span className={cn("font-mono text-[11px] text-ink-3", className)}>Puan yok</span>;
  }
  const bars = Math.max(1, Math.min(5, Math.ceil(score / 20)));
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={`Fırsat puanı ${Math.round(score)}/100`}>
      <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px]", i <= bars ? "bg-brand" : "bg-line-strong")} style={{ height: `${30 + i * 14}%` }} />
        ))}
      </span>
      {showNumber ? (
        <span className="font-mono text-[11px] font-semibold tabular text-ink-2">
          {Math.round(score)}
          <span className="sr-only"> / 100 fırsat puanı</span>
        </span>
      ) : null}
    </span>
  );
}
