import { cn } from "@/lib/cn";

/** A recording drawn as bars. `progress` (0..1) tints the part already heard. */
export function Waveform({ bars, progress = 0, className }: { bars: number[]; progress?: number; className?: string }) {
  const values = bars.length > 0 ? bars : Array.from({ length: 48 }, () => 0.08);
  return (
    <div aria-hidden="true" className={cn("flex items-center gap-[2px]", className)}>
      {values.map((value, i) => (
        <span
          key={i}
          className={cn("min-h-[3px] flex-1 rounded-full transition-colors duration-150", i / values.length < progress ? "bg-accent" : "bg-accent-soft")}
          style={{ height: `${Math.max(6, value * 100)}%` }}
        />
      ))}
    </div>
  );
}
