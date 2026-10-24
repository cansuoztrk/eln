import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

export function Price({ minor, currency = "TRY", className }: { minor: number | null | undefined; currency?: string; className?: string }) {
  return <span className={cn("tabular font-display font-[680] tracking-[-0.02em]", className)}>{formatMoney(minor, currency)}</span>;
}

/** Kargo bilgisi satırı: dâhil / ücretsiz / bilinmiyor — asla varsayım yapmaz. */
export function ShippingNote({ shippingMinor, currency = "TRY", className }: { shippingMinor: number | null; currency?: string; className?: string }) {
  if (shippingMinor === null) return <span className={cn("text-[12px] text-ink-3", className)}>Kargo bedeli bilinmiyor</span>;
  if (shippingMinor === 0) return <span className={cn("text-[12px] text-good-ink", className)}>Kargo ücretsiz</span>;
  return <span className={cn("text-[12px] text-ink-3", className)}>+ {formatMoney(shippingMinor, currency)} kargo</span>;
}
