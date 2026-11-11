import type { ReactNode } from "react";
import { Flourish } from "@/components/decor";
import { Reveal } from "@/components/motion/reveal";
import { MONTHS_TR, weekdayOf, type PlainDate } from "@/lib/dates";

/** A chapter opening: the date itself, set large, as the headline. */
export function ChapterHeading({
  eyebrow,
  title,
  date,
  children,
}: {
  eyebrow: string;
  title: string;
  /** Null when the year is unknown: then only the title is shown, with no date maths. */
  date: PlainDate | null;
  children?: ReactNode;
}) {
  return (
    <header className="shell py-16 text-center md:py-24">
      <Reveal y={10}>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      {date ? (
        <Reveal delay={0.1}>
          <p className="mt-6 font-display text-[clamp(7rem,26vw,17rem)] leading-[0.8] font-medium text-ink tabular-nums">{date.day}</p>
          <p className="mt-6 font-display text-display-sm text-ink-soft italic">
            {MONTHS_TR[date.month - 1]} {date.year}
          </p>
          <p className="mt-2 text-sm tracking-wide text-taupe">{weekdayOf(date)}</p>
        </Reveal>
      ) : null}
      <Reveal delay={0.2}>
        <h2 className="mt-8 font-display text-display-sm text-accent">{title}</h2>
        <Flourish className="mt-8" />
      </Reveal>
      {children}
    </header>
  );
}
