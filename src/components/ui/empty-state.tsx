import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

export function EmptyState({ icon = "radar", title, children, action, className }: { icon?: string; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center", className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-brand-soft text-brand-ink">
        <Icon name={icon} className="size-6" />
      </span>
      <h3 className="font-display text-lg font-[650] tracking-tight">{title}</h3>
      {children ? <div className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
