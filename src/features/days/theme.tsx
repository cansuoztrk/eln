import type { ReactNode } from "react";
import { Bow, Heart, Kitten, Sparkle } from "@/components/decor";
import type { SpecialDayTheme } from "./queries";

/** The small English label above a day — "your birthday" when the day belongs to whoever is reading. */
export function dayEyebrow(theme: SpecialDayTheme, viewer: "owner" | "partner"): string {
  if ((theme === "birthday-partner" && viewer === "partner") || (theme === "birthday-owner" && viewer === "owner")) return "Your birthday";
  return DAY_LOOK[theme].eyebrow;
}

/** Each special day's own, restrained identity: a tint and one small drawing. */
export const DAY_LOOK: Record<SpecialDayTheme, { surface: string; accent: string; motif: ReactNode; eyebrow: string }> = {
  "birthday-partner": {
    surface: "bg-[linear-gradient(160deg,var(--color-blush)_0%,var(--color-powder)_100%)]",
    accent: "text-rose-deep",
    motif: <Bow className="w-16 text-rose-deep" />,
    eyebrow: "Her birthday",
  },
  "birthday-owner": {
    surface: "bg-[linear-gradient(160deg,var(--color-beige)_0%,var(--color-champagne)_100%)]",
    accent: "text-[#7a5c2e]",
    motif: <Sparkle className="size-9 text-gold" />,
    eyebrow: "His birthday",
  },
  meeting: {
    surface: "bg-[linear-gradient(160deg,var(--color-pearl)_0%,var(--color-nude)_100%)]",
    accent: "text-rosegold",
    motif: <Sparkle className="size-9 text-rosegold" />,
    eyebrow: "The day we met",
  },
  together: {
    surface: "bg-[linear-gradient(160deg,var(--color-blush)_0%,var(--color-beige)_100%)]",
    accent: "text-rose-deep",
    motif: <Heart className="size-9 text-rose" />,
    eyebrow: "The day we became us",
  },
  "first-meeting": {
    surface: "bg-[linear-gradient(160deg,var(--color-pearl)_0%,var(--color-blush)_100%)]",
    accent: "text-rose-deep",
    motif: <Kitten className="size-14 text-rose-deep" />,
    eyebrow: "The day we finally meet",
  },
  classic: {
    surface: "bg-[linear-gradient(160deg,var(--color-pearl)_0%,var(--color-beige)_100%)]",
    accent: "text-accent",
    motif: <Sparkle className="size-9 text-rose" />,
    eyebrow: "A special day",
  },
};
