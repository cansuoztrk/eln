import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

type Props = {
  /** The English name, small and spaced. */
  eyebrow: string;
  title: ReactNode;
  /** A sentence under the title. Leave out rather than fill with filler. */
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
};

/** The opening of every room: a small English label, a large serif title. */
export function PageHeader({ eyebrow, title, lead, align = "left", className, children }: Props) {
  return (
    <header
      className={cn(
        "shell pt-28 pb-10 md:pt-40 md:pb-16",
        align === "center" && "flex flex-col items-center text-center",
        className,
      )}
    >
      <Reveal y={10}>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h1 className="mt-4 font-display text-display leading-[0.98] font-medium">{title}</h1>
      </Reveal>
      {lead ? (
        <Reveal delay={0.18}>
          <p className={cn("mt-6 max-w-xl text-lg leading-relaxed text-muted", align === "center" && "mx-auto")}>
            {lead}
          </p>
        </Reveal>
      ) : null}
      {children ? <Reveal delay={0.26}>{children}</Reveal> : null}
    </header>
  );
}
