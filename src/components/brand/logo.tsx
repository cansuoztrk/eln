import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

/**
 * Logo işareti: radar halkaları + taramanın yakaladığı fiyat izi (düşüş çizgisi) ve sinyal noktası.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="var(--brand)" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="var(--on-brand)" strokeOpacity="0.28" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="6" fill="none" stroke="var(--on-brand)" strokeOpacity="0.28" strokeWidth="1.4" />
      <path d="M16 16 L16 5 A11 11 0 0 1 26.5 12.6 Z" fill="var(--on-brand)" fillOpacity="0.16" />
      <path d="M6.5 11.5 L11.5 14.8 L15.8 13.2 L22 20.2" fill="none" stroke="var(--on-brand)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22.4" cy="20.6" r="3.1" fill="var(--on-brand)" />
      <circle cx="22.4" cy="20.6" r="1.4" fill="var(--brand)" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const name = brand.name;
  const accent = brand.accent;
  const split = accent && name.length > accent.length && name.endsWith(accent) ? [name, name.slice(0, -accent.length), accent] : null;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[19px] font-[680] tracking-[-0.02em] leading-none">
          {split ? (
            <>
              {split[1]}
              <span className="text-brand-ink">{split[2]}</span>
            </>
          ) : (
            name
          )}
        </span>
      )}
    </span>
  );
}
