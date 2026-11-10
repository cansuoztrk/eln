"use client";

import { Switch as RadixSwitch } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Switch({ className, ...props }: ComponentProps<typeof RadixSwitch.Root>) {
  return (
    <RadixSwitch.Root
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line-strong bg-beige",
        "transition-colors duration-300 data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block size-5 translate-x-1 rounded-full bg-pearl shadow-paper transition-transform duration-300 ease-soft data-[state=checked]:translate-x-6" />
    </RadixSwitch.Root>
  );
}
