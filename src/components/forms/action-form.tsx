"use client";

import { useActionState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ActionResult = { ok?: boolean; error?: string; message?: string };

/** Sunucu eylemi formu: bekleme durumu ve sonuç mesajı (ekran okuyucular için role=status/alert). */
export function ActionForm({
  action,
  children,
  submitLabel,
  className,
  danger = false,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  danger?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {children}
      {state.error ? (
        <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p role="status" className="rounded-md bg-good-soft px-3 py-2 text-[13px] text-good-ink">
          {state.message}
        </p>
      ) : null}
      <button
        disabled={pending}
        className={cn(
          "h-10 rounded-md px-4 text-[13.5px] font-semibold transition-colors disabled:opacity-60",
          danger ? "bg-bad text-white hover:opacity-90" : "bg-brand text-on-brand hover:bg-brand-ink",
        )}
      >
        {pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
