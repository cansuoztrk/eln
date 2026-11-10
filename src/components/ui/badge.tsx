import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-beige text-ink-soft",
        blush: "bg-accent-wash text-accent",
        gold: "bg-champagne/70 text-[#6f5527]",
        draft: "border border-dashed border-line-strong text-muted",
        live: "bg-[#e3efe4] text-[#3f6b46]",
        sealed: "bg-plum/10 text-plum",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
