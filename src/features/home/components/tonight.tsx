"use client";

import Link from "next/link";
import { Moon } from "@/components/decor";
import { useNow } from "@/components/time/live-clock";
import { BAKU, ISTANBUL, moonPhase, SKY_PHASE_TR, skyPhase } from "@/lib/dates/sky";

/**
 * A small window onto the shared sky: tonight's real moon and what the sky is
 * doing over each city right now. It changes by itself, every day.
 */
export function Tonight({ ownerCity, partnerCity }: { ownerCity: string; partnerCity: string }) {
  const now = useNow(60_000);
  const moon = now ? moonPhase(now) : null;

  return (
    <Link href="/distance" className="dusk group relative flex h-full min-h-56 flex-col items-center justify-center overflow-hidden rounded-[2rem] px-6 py-10 text-center shadow-lift">
      <p className="eyebrow">The same sky</p>
      <div className="mt-5 h-16">{moon ? <Moon illumination={moon.illumination} waxing={moon.waxing} className="size-16 text-pearl" /> : null}</div>
      <p className="mt-4 font-display text-3xl text-pearl italic" suppressHydrationWarning>
        {moon ? moon.name : " "}
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-pearl/70" suppressHydrationWarning>
        {now ? (
          <>
            {ownerCity}: {SKY_PHASE_TR[skyPhase(ISTANBUL, now)]} · {partnerCity}: {SKY_PHASE_TR[skyPhase(BAKU, now)]}
          </>
        ) : (
          " "
        )}
      </p>
      <span className="mt-5 text-[13px] font-medium tracking-wide text-champagne underline-offset-4 group-hover:underline">Aynı gökyüzü</span>
    </Link>
  );
}
