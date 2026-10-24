import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

export function SectionHeader({ eyebrow, title, description, href, linkLabel = "Tümünü gör", className, aside }: { eyebrow?: string; title: string; description?: ReactNode; href?: string; linkLabel?: string; className?: string; aside?: ReactNode }) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 className="font-display text-[22px] font-[650] leading-tight tracking-[-0.015em] md:text-[26px]">{title}</h2>
        {description ? <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{description}</p> : null}
      </div>
      {aside}
      {href ? (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-brand-ink hover:underline underline-offset-4">
          {linkLabel}
          <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-page py-8 md:py-10">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="font-display text-[28px] font-[680] leading-[1.1] tracking-[-0.02em] md:text-[38px]">{title}</h1>
        {description ? <div className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-2">{description}</div> : null}
        {children}
      </div>
    </div>
  );
}
