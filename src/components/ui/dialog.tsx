"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

type DialogContentProps = ComponentProps<typeof RadixDialog.Content> & {
  title: ReactNode;
  description?: ReactNode;
  /** Hide the heading visually while keeping it for screen readers. */
  hideTitle?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

export function DialogContent({
  title,
  description,
  hideTitle,
  size = "md",
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-night/45 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-[fade-up_0.3s_var(--ease-soft)_both]" />
      <RadixDialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden",
          "rounded-t-3xl border border-line bg-ivory shadow-lift",
          "sm:inset-x-4 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-3xl",
          "data-[state=open]:animate-[fade-up_0.45s_var(--ease-soft)_both]",
          sizes[size],
          className,
        )}
        {...props}
      >
        <div className={cn("flex items-start justify-between gap-6 px-6 pt-6 sm:px-8 sm:pt-8", hideTitle && "sr-only")}>
          <div className="space-y-1.5">
            <RadixDialog.Title className="font-display text-2xl leading-tight text-ink sm:text-3xl">
              {title}
            </RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="text-sm leading-relaxed text-muted">
                {description}
              </RadixDialog.Description>
            ) : null}
          </div>
        </div>
        <RadixDialog.Close
          aria-label="Kapat"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-taupe transition-colors hover:bg-beige hover:text-ink sm:top-5 sm:right-5"
        >
          <X className="size-5" aria-hidden="true" />
        </RadixDialog.Close>
        <div className="overflow-y-auto px-6 pt-5 pb-6 sm:px-8 sm:pb-8">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
