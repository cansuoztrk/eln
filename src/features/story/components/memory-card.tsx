import Link from "next/link";
import { SmartImage } from "@/components/media/smart-image";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { formatWithPrecision, MONTHS_TR, parseISODate } from "@/lib/dates";
import type { Memory } from "../queries";
import { memoryCategoryLabel } from "../schema";

/**
 * One memory on the timeline. With a photo it is an editorial spread that
 * alternates sides; without one it is a quiet typographic card that still
 * looks finished with nothing but a title and a date.
 */
export function MemoryCard({ memory, index, fallbackAlt }: { memory: Memory; index: number; fallbackAlt: string }) {
  const date = parseISODate(memory.happenedOn);
  const flip = index % 2 === 1;
  const second = memory.photos[1];

  const text = (
    <div className={cn("max-w-md", !memory.cover && "mx-auto text-center")}>
      <p className="eyebrow">{memoryCategoryLabel(memory.category)}</p>
      {date ? (
        <p className="mt-4 flex items-baseline gap-3 font-display text-ink">
          {memory.datePrecision === "day" ? <span className="text-7xl leading-none tabular-nums md:text-8xl">{date.day}</span> : null}
          <span className={cn("text-2xl leading-tight italic", !memory.cover && memory.datePrecision === "day" && "text-left")}>
            {memory.datePrecision === "year" ? date.year : (
              <>
                {MONTHS_TR[date.month - 1]}
                <br />
                {date.year}
              </>
            )}
          </span>
        </p>
      ) : null}
      <h3 className="mt-5 font-display text-4xl leading-tight text-ink transition-colors group-hover:text-accent md:text-5xl">
        {memory.title}
      </h3>
      {memory.summary ? <p className="mt-4 text-[17px] leading-relaxed text-muted">{memory.summary}</p> : null}
      <span className="mt-6 inline-block text-[13px] font-medium tracking-wide text-accent underline-offset-4 group-hover:underline">
        Anıyı aç
      </span>
    </div>
  );

  return (
    <Reveal as="article">
      <Link
        href={`/story/${memory.id}`}
        aria-label={`${memory.title}${date ? ` — ${formatWithPrecision(date, memory.datePrecision)}` : ""}`}
        className={cn(
          "group block",
          memory.cover ? "grid items-center gap-10 md:grid-cols-2 md:gap-16" : "paper mx-auto max-w-2xl px-8 py-14 md:py-20",
        )}
      >
        {memory.cover ? (
          <div className={cn("relative", flip && "md:order-2")}>
            <Parallax distance={50}>
              <SmartImage
                image={memory.cover.image}
                alt={memory.cover.altText || memory.cover.caption || fallbackAlt}
                sizes="(min-width: 768px) 44vw, 100vw"
                className="rounded-[3px] shadow-paper transition-shadow duration-700 group-hover:shadow-lift"
                imgClassName="transition-transform duration-[1600ms] ease-soft group-hover:scale-[1.03]"
              />
            </Parallax>
            {second ? (
              <Parallax distance={110} className={cn("absolute -bottom-10 hidden w-2/5 md:block", flip ? "-left-8" : "-right-8")}>
                <div className="bg-pearl p-2 pb-6 shadow-lift">
                  <SmartImage image={second.image} alt={second.altText || second.caption || fallbackAlt} sizes="18vw" mode="fill" className="aspect-square" />
                </div>
              </Parallax>
            ) : null}
          </div>
        ) : null}
        <div className={cn(memory.cover && flip && "md:order-1 md:justify-self-end")}>{text}</div>
      </Link>
    </Reveal>
  );
}
