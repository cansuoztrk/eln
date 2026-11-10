import { ArrowDown } from "lucide-react";
import { Sparkle } from "@/components/decor";
import { LightThread } from "@/components/motion/light-thread";
import { Reveal, WordReveal } from "@/components/motion/reveal";
import { StarField } from "@/components/motion/star-field";
import { LiveClock } from "@/components/time/live-clock";

type Place = { name: string; city: string; timezone: string };

/** The first screen of the world: the name, the sentence, two clocks and the thread between them. */
export function Hero({
  greetingName,
  headline,
  note,
  owner,
  partner,
}: {
  greetingName: string;
  headline: string;
  note: string;
  owner: Place;
  partner: Place;
}) {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_30%,var(--color-blush)_0%,transparent_72%),radial-gradient(45%_40%_at_85%_90%,var(--color-champagne)_0%,transparent_70%)] opacity-80"
      />
      <StarField tone="day" density={0.6} />

      <div className="shell relative flex flex-1 flex-col items-center justify-center pt-28 pb-10 text-center">
        <Reveal y={8}>
          <p className="font-hand text-2xl text-accent sm:text-3xl">Hoş geldin, {greetingName}</p>
        </Reveal>
        <h1 className="mt-5 font-display text-display-lg leading-[0.9] font-medium tracking-tight text-ink italic">
          <WordReveal text="Elnare" delay={0.2} />
        </h1>
        <Reveal delay={0.5} y={10}>
          <p className="eyebrow mt-6 flex items-center gap-3">
            <Sparkle className="size-2.5 text-rose" />
            Beyond Distance
            <Sparkle className="size-2.5 text-rose" />
          </p>
        </Reveal>
        {headline ? (
          <Reveal delay={0.7}>
            <p className="mx-auto mt-9 max-w-2xl font-display text-display-sm leading-snug text-ink-soft">{headline}</p>
          </Reveal>
        ) : null}
        {note ? (
          <Reveal delay={0.85}>
            <p className="prose-letter mx-auto mt-6 max-w-xl text-[17px] text-muted">{note}</p>
          </Reveal>
        ) : null}
      </div>

      <Reveal delay={1} className="shell relative pb-10 md:pb-14">
        <div className="mx-auto grid max-w-3xl grid-cols-[auto_1fr_auto] items-end gap-3 sm:gap-6">
          {[owner, partner].map((place, i) => (
            <div key={place.city} className={i === 0 ? "order-1 text-left" : "order-3 text-right"}>
              <p className="eyebrow text-[10px]">{place.city}</p>
              <LiveClock
                timeZone={place.timezone}
                className="mt-1"
                timeClassName="font-display text-4xl leading-none text-ink sm:text-5xl"
              />
              <p className="mt-1.5 font-hand text-xl text-taupe">{place.name}</p>
            </div>
          ))}
          <div className="order-2 pb-6">
            <LightThread tone="day" />
          </div>
        </div>
        <ArrowDown className="mx-auto mt-8 hidden size-4 animate-drift text-taupe md:block" aria-hidden="true" />
      </Reveal>
    </section>
  );
}
