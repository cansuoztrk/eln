"use client";

import { countdownParts } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { useNow } from "./live-clock";

type Props = {
  /** ISO instant to count down to — computed on the server from a real date. */
  target: string;
  /** Shown instead of zeros once the moment has arrived. */
  doneLabel?: string;
  tone?: "day" | "dusk";
  size?: "sm" | "lg";
  className?: string;
};

const UNITS = [
  ["days", "gün"],
  ["hours", "saat"],
  ["minutes", "dakika"],
  ["seconds", "saniye"],
] as const;

/**
 * A live countdown to a known instant. Only ever rendered for dates that
 * exist: a date nobody has set yet gets no counter at all.
 */
export function Countdown({ target, doneLabel = "Bugün", tone = "day", size = "lg", className }: Props) {
  const now = useNow(1000);
  const parts = now ? countdownParts(new Date(target), now) : null;

  if (parts?.done) {
    return (
      <p className={cn("font-display italic", size === "lg" ? "text-5xl" : "text-2xl", className)} role="status">
        {doneLabel}
      </p>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={
        parts ? `${parts.days} gün ${parts.hours} saat ${parts.minutes} dakika kaldı` : "Geri sayım yükleniyor"
      }
      className={cn("flex items-end", size === "lg" ? "gap-5 sm:gap-8" : "gap-3", className)}
    >
      {UNITS.map(([key, label]) => (
        <div key={key} className="flex flex-col items-center" aria-hidden="true">
          <span
            className={cn(
              "font-display leading-none tabular-nums",
              size === "lg" ? "text-5xl sm:text-7xl" : "text-2xl",
              tone === "dusk" ? "text-pearl" : "text-ink",
            )}
            suppressHydrationWarning
          >
            {parts ? String(parts[key]).padStart(key === "days" ? 1 : 2, "0") : "–"}
          </span>
          <span className={cn("eyebrow mt-2", size === "sm" && "text-[9px]", tone === "dusk" && "text-champagne/70")}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
