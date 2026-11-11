"use client";

import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";
import { Button } from "./button";

type ConfirmProps = {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
};

/**
 * Asks before doing something that matters. Nothing irreversible happens on
 * this site without passing through one of these.
 */
export function Confirm({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Vazgeç",
  tone = "default",
  onConfirm,
}: ConfirmProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-night/45 backdrop-blur-[3px] data-[state=open]:animate-[fade-up_0.3s_var(--ease-soft)_both]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-ivory p-7 shadow-lift data-[state=open]:animate-[fade-up_0.4s_var(--ease-soft)_both]">
          <AlertDialog.Title className="font-display text-2xl text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-sm leading-relaxed text-muted">{description}</div>
          </AlertDialog.Description>
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => void onConfirm()}>
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
