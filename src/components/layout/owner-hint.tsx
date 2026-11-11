import { PenLine } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A note only Arda sees, where something is still empty: it points to the
 * place in the Studio that fills it. Eln never sees these.
 */
export function OwnerHint({ href, children, label = "Studio'da aç" }: { href: string; children: ReactNode; label?: string }) {
  return (
    <aside className="mx-auto flex max-w-xl flex-col items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-pearl/70 p-5 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
      <p className="leading-relaxed">
        <span className="mr-2 rounded-full bg-champagne/70 px-2 py-0.5 text-[10px] font-medium tracking-wider text-[#6f5527] uppercase">
          Yalnızca sen görürsün
        </span>
        {children}
      </p>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-pearl transition-colors hover:bg-ink-soft"
      >
        <PenLine className="size-3.5" aria-hidden="true" />
        {label}
      </Link>
    </aside>
  );
}
