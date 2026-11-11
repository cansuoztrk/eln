"use client";

import { BakuSkyline, IstanbulSkyline, Sparkle } from "@/components/decor";
import { LiveClock, useNow } from "@/components/time/live-clock";
import { cn } from "@/lib/cn";
import { BAKU, ISTANBUL, SKY_PHASE_TR, skyPhase, type SkyPhase } from "@/lib/dates/sky";

const ATMOSPHERE: Record<SkyPhase | "idle", { sky: string; text: string; soft: string; line: string }> = {
  idle: { sky: "bg-pearl", text: "text-ink", soft: "text-taupe", line: "text-rose/70" },
  night: {
    sky: "bg-[linear-gradient(180deg,#241a1e_0%,#3a2930_55%,#5b3a47_100%)]",
    text: "text-pearl",
    soft: "text-champagne/75",
    line: "text-champagne/55",
  },
  dawn: {
    sky: "bg-[linear-gradient(180deg,#5b3a47_0%,#c98b96_48%,#f3c9d1_78%,#ead9bb_100%)]",
    text: "text-pearl",
    soft: "text-pearl/80",
    line: "text-pearl/70",
  },
  day: {
    sky: "bg-[linear-gradient(180deg,#f9e3e6_0%,#fbf7f2_60%,#f3eae0_100%)]",
    text: "text-ink",
    soft: "text-taupe",
    line: "text-rosegold/80",
  },
  dusk: {
    sky: "bg-[linear-gradient(180deg,#3a2930_0%,#9c5565_46%,#c98b96_76%,#ead9bb_100%)]",
    text: "text-pearl",
    soft: "text-pearl/80",
    line: "text-pearl/65",
  },
};

type Props = {
  city: "istanbul" | "baku";
  cityName: string;
  personName: string;
  timeZone: string;
};

/**
 * A city's card. The clock comes from the city's time zone and the colour of
 * its sky from where the sun is over that city right now — neither depends
 * on where the person looking at it is.
 */
export function CityCard({ city, cityName, personName, timeZone }: Props) {
  const now = useNow(30_000);
  const phase = now ? skyPhase(city === "istanbul" ? ISTANBUL : BAKU, now) : null;
  const look = ATMOSPHERE[phase ?? "idle"];
  const Skyline = city === "istanbul" ? IstanbulSkyline : BakuSkyline;

  return (
    <article
      aria-label={`${cityName} — ${personName}`}
      className={cn("relative isolate flex min-h-[26rem] flex-col overflow-hidden rounded-[2rem] border border-line p-7 shadow-lift transition-colors duration-[2000ms] md:min-h-[30rem] md:p-9", look.text)}
    >
      <div aria-hidden="true" className={cn("absolute inset-0 -z-10 transition-opacity duration-[2000ms]", look.sky)} />
      {phase === "night" ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {[
            ["12%", "18%", "size-2", "0s"],
            ["70%", "12%", "size-1.5", "1.1s"],
            ["42%", "30%", "size-1", "2.3s"],
            ["84%", "38%", "size-2", "0.6s"],
            ["24%", "44%", "size-1.5", "1.8s"],
          ].map(([left, top, size, delay]) => (
            <Sparkle key={`${left}${top}`} className={cn("absolute animate-twinkle text-champagne", size)} style={{ left, top, animationDelay: delay }} />
          ))}
        </div>
      ) : null}

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("eyebrow", look.soft)} style={{ color: "inherit", opacity: 0.75 }}>
            {personName}
          </p>
          <h3 className={cn("mt-2 font-display text-5xl leading-none md:text-6xl", look.text)} style={{ color: "inherit" }}>
            {cityName}
          </h3>
        </div>
        <p className={cn("rounded-full border border-current/25 px-3 py-1 text-[12px] tracking-wide", look.soft)} aria-live="polite" suppressHydrationWarning>
          {phase ? SKY_PHASE_TR[phase] : " "}
        </p>
      </header>

      <div className="mt-auto pt-10">
        <LiveClock
          timeZone={timeZone}
          showSeconds
          showDate
          timeClassName="font-display text-7xl leading-none md:text-8xl"
          dateClassName={cn("mt-3 text-sm tracking-wide", look.soft)}
        />
      </div>

      <Skyline className={cn("mt-8 -mb-2", look.line)} />
    </article>
  );
}
