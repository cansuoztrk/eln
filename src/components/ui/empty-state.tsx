import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  /** A decorative drawing — a bow, an envelope, a star. */
  art?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Shown where content has not been written yet. It says so plainly; it never
 * fills the gap with placeholder memories.
 */
export function EmptyState({ art, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center", className)}>
      {art ? <div className="mb-6 text-rose">{art}</div> : null}
      <h2 className="font-display text-2xl text-ink sm:text-3xl">{title}</h2>
      {children ? <div className="mt-3 text-[15px] leading-relaxed text-muted">{children}</div> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
