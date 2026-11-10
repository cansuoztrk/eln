import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-sans font-medium tracking-wide",
    "transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-300 ease-soft",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // The one confident action on a screen.
        primary: "bg-ink text-pearl hover:bg-ink-soft shadow-paper",
        // Warm emphasis, for the gift and for anything Eln is invited to open.
        accent: "bg-accent text-pearl hover:brightness-110 shadow-glow",
        soft: "bg-accent-wash text-ink hover:bg-accent-soft",
        outline: "border border-line-strong bg-pearl/60 text-ink hover:border-accent hover:text-accent",
        ghost: "text-ink-soft hover:bg-beige hover:text-ink",
        link: "text-accent underline-offset-4 hover:underline px-0!",
        danger: "bg-[#8c3b3b] text-pearl hover:bg-[#7a3131]",
        // On the dusk palette.
        light: "bg-pearl/95 text-ink hover:bg-pearl shadow-lift",
        "ghost-light": "text-pearl/80 hover:bg-pearl/10 hover:text-pearl",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-[13px] [&_svg]:size-4",
        md: "h-11 rounded-full px-6 text-sm [&_svg]:size-[18px]",
        lg: "h-13 rounded-full px-8 text-[15px] [&_svg]:size-5",
        icon: "size-11 rounded-full [&_svg]:size-5",
        "icon-sm": "size-9 rounded-full [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Link) with button styling. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}

export { buttonVariants };
