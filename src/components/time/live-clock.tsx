"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { clockIn, formatDate, formatTime, weekdayOf } from "@/lib/dates";
import { cn } from "@/lib/cn";

const noop = () => () => {};

/** False during server render and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * The current instant, refreshed on an interval. Null until the component has
 * hydrated, so server and client never disagree about what time it is.
 */
export function useNow(intervalMs = 1000): Date | null {
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return hydrated ? now : null;
}

type Props = {
  /** IANA zone, e.g. "Europe/Istanbul". The clock ignores the device's own zone. */
  timeZone: string;
  showSeconds?: boolean;
  showDate?: boolean;
  className?: string;
  timeClassName?: string;
  dateClassName?: string;
};

/** A city's local time, correct wherever the person looking at it happens to be. */
export function LiveClock({ timeZone, showSeconds, showDate, className, timeClassName, dateClassName }: Props) {
  const now = useNow(showSeconds ? 1000 : 5000);
  const clock = now ? clockIn(timeZone, now) : null;

  return (
    <span className={cn("inline-flex flex-col tabular-nums", className)}>
      <time
        dateTime={now?.toISOString()}
        className={timeClassName}
        aria-label={clock ? `Saat ${formatTime(clock.hour, clock.minute)}` : undefined}
        suppressHydrationWarning
      >
        {clock ? (
          <>
            {formatTime(clock.hour, clock.minute)}
            {showSeconds ? <span className="opacity-50">:{String(clock.second).padStart(2, "0")}</span> : null}
          </>
        ) : (
          "––:––"
        )}
      </time>
      {showDate ? (
        <span className={dateClassName} suppressHydrationWarning>
          {clock ? `${weekdayOf(clock)}, ${formatDate({ month: clock.month, day: clock.day })}` : " "}
        </span>
      ) : null}
    </span>
  );
}
