import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "brand" | "positive" | "warning" | "danger" | "sponsor" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  brand: "bg-brand-soft text-brand-ink border-transparent",
  positive: "bg-good-soft text-good-ink border-transparent",
  warning: "bg-warn-soft text-warn-ink border-transparent",
  danger: "bg-bad-soft text-bad-ink border-transparent",
  sponsor: "bg-sponsor-soft text-sponsor border-transparent",
  outline: "bg-transparent text-ink-2 border-line-strong",
};

export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-sm border px-2 text-[12px] font-medium leading-none whitespace-nowrap", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Test verisi rozeti — test kaynaklarından gelen her kayıtta görünür. */
export function TestDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex h-5 items-center gap-1 rounded-sm border border-dashed border-warn px-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-warn-ink", className)}
      title="Bu kayıt kurgusal test verisidir; gerçek bir ürün, fiyat veya mağaza değildir."
    >
      Test verisi
    </span>
  );
}
