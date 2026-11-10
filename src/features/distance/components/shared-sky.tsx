"use client";

import { Moon, Sparkle } from "@/components/decor";
import { useNow } from "@/components/time/live-clock";
import { cn } from "@/lib/cn";
import { BAKU, ISTANBUL, moonPhase, SKY_PHASE_TR, skyPhase, sunElevation, type City } from "@/lib/dates/sky";

/** A sky colour for a sun height: deep rose night below the horizon, blush day above it. */
function skyColour(elevation: number): [string, string] {
  if (elevation <= -8) return ["#241a1e", "#3a2930"];
  if (elevation <= -2) return ["#3a2930", "#7a4a5a"];
  if (elevation <= 4) return ["#7a4a5a", "#d9a1a8"];
  if (elevation <= 12) return ["#e9b9c1", "#f6dcd0"];
  return ["#f9e3e6", "#fbf2e6"];
}

const STARS = [
  [6, 22], [14, 58], [21, 34], [29, 14], [36, 66], [43, 28], [57, 20], [63, 62], [71, 36], [79, 16], [86, 52], [93, 30],
] as const;

/**
 * One sky over both cities. Each side is coloured by the sun over that city;
 * the moon in the middle is the real moon tonight — the same one, whichever
 * city you look up from.
 */
export function SharedSky({ leftName, rightName }: { leftName: string; rightName: string }) {
  const now = useNow(60_000);
  const sides: { name: string; city: City }[] = [
    { name: leftName, city: ISTANBUL },
    { name: rightName, city: BAKU },
  ];
  const state = now
    ? sides.map((side) => {
        const elevation = sunElevation(side.city, now);
        return { ...side, elevation, phase: skyPhase(side.city, now), colours: skyColour(elevation) };
      })
    : null;
  const moon = now ? moonPhase(now) : null;
  const dark = state ? state.every((s) => s.elevation <= 4) : true;

  return (
    <figure className="overflow-hidden rounded-[2rem] border border-line shadow-lift">
      <div
        className="relative h-72 transition-[background] duration-[3000ms] md:h-96"
        style={{
          background: state
            ? `linear-gradient(90deg, ${state[0].colours[0]} 0%, ${state[0].colours[1]} 38%, ${state[1].colours[1]} 62%, ${state[1].colours[0]} 100%)`
            : "linear-gradient(90deg,#241a1e,#3a2930,#241a1e)",
        }}
        role="img"
        aria-label={
          state && moon
            ? `${state[0].name} üzerinde ${SKY_PHASE_TR[state[0].phase]}, ${state[1].name} üzerinde ${SKY_PHASE_TR[state[1].phase]}. Ay: ${moon.name}.`
            : "İki şehrin gökyüzü"
        }
      >
        {state
          ? STARS.map(([x, y], i) => {
              const side = x < 50 ? state[0] : state[1];
              const visible = side.elevation <= -4;
              return (
                <Sparkle
                  key={i}
                  className={cn("absolute size-1.5 text-champagne transition-opacity duration-[2000ms]", visible ? "animate-twinkle opacity-100" : "opacity-0")}
                  style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.7}s` }}
                />
              );
            })
          : null}

        {moon ? (
          <Moon
            illumination={moon.illumination}
            waxing={moon.waxing}
            className={cn("absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-[60%] md:size-32", dark ? "text-pearl" : "text-pearl/90")}
          />
        ) : null}

        <div className={cn("absolute inset-x-0 bottom-0 flex justify-between px-6 pb-5 text-[11px] tracking-[0.28em] uppercase md:px-10", dark ? "text-pearl/75" : "text-ink-soft/80")}>
          {sides.map((side, i) => (
            <span key={side.name} suppressHydrationWarning>
              {side.name}
              {state ? ` · ${SKY_PHASE_TR[state[i].phase]}` : ""}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="bg-pearl px-6 py-5 text-center md:px-10" suppressHydrationWarning>
        {moon ? (
          <>
            <span className="font-display text-2xl text-ink italic">{moon.name}</span>
            <span className="mt-1 block text-sm text-muted">
              Ayın %{Math.round(moon.illumination * 100)}&apos;i aydınlık — {leftName}&apos;dan da {rightName}&apos;den de bakınca aynı ay.
            </span>
          </>
        ) : (
          <span className="text-sm text-muted">Gökyüzü hesaplanıyor…</span>
        )}
      </figcaption>
    </figure>
  );
}
