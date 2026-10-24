import { DEAL_LABELS, type DealLabelKey } from "@/lib/deal-labels";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

const ICON: Record<DealLabelKey, string> = {
  VERIFIED_RECENTLY: "check",
  HISTORICALLY_GOOD: "chart",
  BEST_ACROSS_STORES: "compare",
  LOWEST_30D: "trendDown",
  COUPON_BETTER: "ticket",
  WATCH_CLOSELY: "bell",
  REVALIDATING: "refresh",
};

const TONE: Record<string, string> = {
  brand: "bg-brand-soft text-brand-ink",
  positive: "bg-good-soft text-good-ink",
  neutral: "bg-surface-2 text-ink-2",
  warning: "bg-warn-soft text-warn-ink",
};

/** Etiketler yalnızca fırsat motorunun koşulları sağladığı kayıtlar için gelir. */
export function DealLabels({ labels, max = 3, className, hideVerified = false }: { labels: DealLabelKey[]; max?: number; className?: string; hideVerified?: boolean }) {
  const order: DealLabelKey[] = ["REVALIDATING", "LOWEST_30D", "HISTORICALLY_GOOD", "BEST_ACROSS_STORES", "COUPON_BETTER", "WATCH_CLOSELY", "VERIFIED_RECENTLY"];
  const shown = order.filter((k) => labels.includes(k) && !(hideVerified && k === "VERIFIED_RECENTLY")).slice(0, max);
  if (shown.length === 0) return null;
  return (
    <ul className={cn("flex min-w-0 flex-wrap gap-1.5", className)}>
      {shown.map((k) => (
        <li key={k} title={DEAL_LABELS[k].help} className={cn("inline-flex h-6 max-w-full items-center gap-1 rounded-sm px-1.5 text-[11.5px] font-medium", TONE[DEAL_LABELS[k].tone])}>
          <Icon name={ICON[k]} className="size-3.5 shrink-0" />
          <span className="truncate">{DEAL_LABELS[k].text}</span>
        </li>
      ))}
    </ul>
  );
}
