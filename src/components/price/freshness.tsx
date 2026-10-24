import { cn } from "@/lib/cn";
import { formatDateTime, formatRelative, formatRelativeShort, MINUTE } from "@/lib/time";

/**
 * Veri tazeliği göstergesi. YALNIZCA gerçek zaman damgasıyla çalışır; damga yoksa "bilinmiyor".
 * Renk: tazelik penceresi içinde yeşil, aşıldıysa amber; her durumda metinle birlikte.
 */
export function Freshness({
  at,
  windowMinutes = 360,
  prefix = "kontrol",
  className,
  now = new Date(),
  source,
  compact = false,
}: {
  at: string | Date | null | undefined;
  windowMinutes?: number;
  prefix?: string;
  className?: string;
  now?: Date;
  source?: string;
  compact?: boolean;
}) {
  if (!at) {
    return <span className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-3", className)}>Kontrol zamanı bilinmiyor</span>;
  }
  const date = at instanceof Date ? at : new Date(at);
  const age = now.getTime() - date.getTime();
  const fresh = age <= windowMinutes * MINUTE;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] tabular text-ink-3", className)}
      title={`Son ${prefix}: ${formatDateTime(date)} (Türkiye saati)${source ? ` · Kaynak: ${source}` : ""}`}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", fresh ? "bg-good" : "bg-warn")} aria-hidden />
      <span>{compact ? formatRelativeShort(date, now) : `${formatRelative(date, now)} ${prefix === "kontrol" ? "kontrol edildi" : prefix}`}</span>
      <span className="sr-only">{fresh ? "(güncel)" : "(yeniden doğrulanıyor)"}</span>
    </span>
  );
}
