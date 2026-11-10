import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Original decorative drawings for ELNARE. One line weight, soft fills,
 * colours from the palette. All are decoration: hidden from assistive tech
 * unless a `title` is given.
 *
 * The cat and the bows are our own characters. No licensed artwork is used
 * or imitated anywhere on the site.
 */

type DecorProps = Omit<ComponentProps<"svg">, "children"> & { title?: string };

function a11y(title?: string) {
  return title ? ({ role: "img", "aria-label": title } as const) : ({ "aria-hidden": true } as const);
}

/** A ribbon bow. `--bow-fill` and `--bow-knot` can be themed from outside. */
export function Bow({ className, title, ...props }: DecorProps) {
  return (
    <svg viewBox="0 0 120 84" fill="none" className={cn("h-auto w-16", className)} {...a11y(title)} {...props}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M55 46c-5 11-11 21-20 30l10-2 4 6c6-9 9-20 11-31"
          fill="var(--bow-fill, var(--color-powder))"
        />
        <path
          d="M65 46c5 11 11 21 20 30l-10-2-4 6c-6-9-9-20-11-31"
          fill="var(--bow-fill, var(--color-powder))"
        />
        <path
          d="M60 38C46 18 22 6 12 16S6 54 18 60c14 6 32-8 42-20Z"
          fill="var(--bow-fill, var(--color-powder))"
        />
        <path
          d="M60 38c14-20 38-32 48-22s6 38-6 44c-14 6-32-8-42-20Z"
          fill="var(--bow-fill, var(--color-powder))"
        />
        <path d="M52 38c-10-4-22-5-31-1M68 38c10-4 22-5 31-1" opacity=".45" />
        <ellipse cx="60" cy="39" rx="8.5" ry="10" fill="var(--bow-knot, var(--color-rose))" />
      </g>
    </svg>
  );
}

/** A four-point sparkle. */
export function Sparkle({ className, title, ...props }: DecorProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} {...a11y(title)} {...props}>
      <path
        fill="currentColor"
        d="M12 0c.8 7.5 4.5 11.2 12 12-7.5.8-11.2 4.5-12 12-.8-7.5-4.5-11.2-12-12 7.5-.8 11.2-4.5 12-12Z"
      />
    </svg>
  );
}

export function Heart({ className, title, ...props }: DecorProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} {...a11y(title)} {...props}>
      <path
        fill="currentColor"
        d="M12 21C5 15.5 2 12 2 8c0-3 2.5-5 5-5 2 0 4 1.200 5 3 1-1.800 3-3 5-3 2.500 0 5 2 5 5 0 4-3 7.500-10 13Z"
      />
    </svg>
  );
}

/**
 * Minnoş — the little cat of this world. Closed smiling eyes, a heart nose
 * and a bow at the collar.
 */
export function Kitten({ className, title, ...props }: DecorProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={cn("size-20", className)} {...a11y(title)} {...props}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d="M24 38 20 13l21 11Z" fill="var(--kitten-fur, var(--color-pearl))" />
        <path d="M72 38 76 13 55 24Z" fill="var(--kitten-fur, var(--color-pearl))" />
        <path d="m26 30-2-11 9 5M70 30l2-11-9 5" stroke="var(--color-powder)" strokeWidth="3" />
        <path
          d="M17 47c0-16 11-25 31-25s31 9 31 25c0 17-12 27-31 27S17 64 17 47Z"
          fill="var(--kitten-fur, var(--color-pearl))"
        />
        <path d="M32 48q4-5 8 0M56 48q4-5 8 0" />
        <path d="M48 58q-3 4-7 1.500M48 58q3 4 7 1.500" />
        <path d="M9 48h11M10 56l10-2M87 48H76M86 56l-10-2" opacity=".55" />
      </g>
      <circle cx="29" cy="56" r="4" fill="var(--color-powder)" opacity=".8" />
      <circle cx="67" cy="56" r="4" fill="var(--color-powder)" opacity=".8" />
      <path
        d="M48 57.500c-2.200-1.700-3.200-2.800-3.200-4a1.700 1.700 0 0 1 3.200-.800 1.700 1.700 0 0 1 3.200.800c0 1.200-1 2.300-3.200 4Z"
        fill="var(--color-rose)"
      />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M48 80c-5-6-13-8-15-5s0 9 4 9c4 .500 8-1 11-4Z" fill="var(--bow-fill, var(--color-powder))" />
        <path d="M48 80c5-6 13-8 15-5s0 9-4 9c-4 .500-8-1-11-4Z" fill="var(--bow-fill, var(--color-powder))" />
        <circle cx="48" cy="80" r="3.200" fill="var(--bow-knot, var(--color-rose))" />
      </g>
    </svg>
  );
}

export type SealGlyph = "heart" | "bow" | "star" | "cat" | "moon";

const SEAL_GLYPHS: Record<SealGlyph, string> = {
  heart: "M32 42c-7-5.500-10-9-10-13 0-3 2.500-5 5-5 2 0 4 1.200 5 3 1-1.800 3-3 5-3 2.500 0 5 2 5 5 0 4-3 7.500-10 13Z",
  star: "M32 20c.700 6.500 5.500 11.300 12 12-6.500.700-11.300 5.500-12 12-.700-6.500-5.500-11.300-12-12 6.500-.700 11.300-5.500 12-12Z",
  bow: "M32 32c-4-6-11-9-13-6s-1 10 2 12c4 2 8-2 11-6Zm0 0c4-6 11-9 13-6s1 10-2 12c-4 2-8-2-11-6Zm-2.500-1.500h5v5h-5Z",
  cat: "M22 24l2 9c0 6 3.500 10 8 10s8-4 8-10l2-9-6 4.500a8 8 0 0 0-8 0Z",
  moon: "M37 21a11.500 11.500 0 1 0 6.500 20A10 10 0 0 1 37 21Z",
};

/** A wax seal. The colour comes from `currentColor`. */
export function WaxSeal({ glyph = "heart", className, title, ...props }: DecorProps & { glyph?: SealGlyph }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-14", className)} {...a11y(title)} {...props}>
      <path
        fill="currentColor"
        d="M32 4c8-1 14 4 20 8s9 11 8 19c1 8-2 16-8 21s-13 9-21 8c-8 1-15-3-20-9S3 38 4 31c-1-8 3-15 9-20s12-7 19-7Z"
      />
      <circle cx="32" cy="32" r="19" fill="none" stroke="rgb(255 253 250 / .35)" strokeWidth="1.200" />
      <path d={SEAL_GLYPHS[glyph]} fill="rgb(255 253 250 / .92)" />
      <path
        d="M14 22c3-6 9-10 16-11"
        fill="none"
        stroke="rgb(255 253 250 / .4)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The moon as it actually looks tonight. */
export function Moon({
  illumination,
  waxing,
  className,
  title,
  ...props
}: DecorProps & { illumination: number; waxing: boolean }) {
  const lit = Math.min(1, Math.max(0, illumination));
  const rx = 50 * Math.abs(1 - 2 * lit);
  const limb = waxing ? 1 : 0;
  const terminator = lit > 0.5 === waxing ? 1 : 0;
  return (
    <svg viewBox="-6 -6 112 112" className={cn("size-16", className)} {...a11y(title)} {...props}>
      <circle cx="50" cy="50" r="50" fill="currentColor" opacity=".14" />
      {/* The rim keeps a new moon looking like a moon rather than an empty disc. */}
      <circle cx="50" cy="50" r="49.4" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".42" />
      <path
        fill="currentColor"
        d={`M50 0A50 50 0 0 ${limb} 50 100A${rx.toFixed(2)} 50 0 0 ${terminator} 50 0Z`}
        style={{ filter: "drop-shadow(0 0 10px rgb(255 253 250 / .45))" }}
      />
    </svg>
  );
}

/** İstanbul, in a single line: a tower, a mosque, a bridge over the water. */
export function IstanbulSkyline({ className, title, ...props }: DecorProps) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      className={cn("h-auto w-full", className)}
      {...a11y(title)}
      {...props}
    >
      <g stroke="currentColor" strokeWidth="1.400" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 108V64h26v44M31 64h32M36 64l11-30 11 30M47 34v-9" />
        <path d="M42 76h4M50 76h4M42 88h4M50 88h4" opacity=".5" />
        <path d="M150 108V86c0-26 80-26 80 0v22" />
        <path d="M126 108V96c0-13 24-13 24 0M230 96c0-13 24-13 24 0v12" />
        <path d="M190 66V52M187 52h6" />
        <path d="M110 108V40l3-14 3 14v68M270 108V40l3-14 3 14v68" />
        <path d="M136 108V58l2.500-10 2.500 10v50M244 108V58l2.500-10 2.500 10v50" />
        <path d="M107 62h12M267 62h12M107 80h12M267 80h12" opacity=".5" />
        <path d="M308 108V58M366 108V58" />
        <path d="M286 98q22-40 22-40 29 46 58 0 0 0 22 40M286 100h112" />
        <path d="M318 100V76M328 100V86M338 100V90M348 100V84M358 100V72" opacity=".45" />
        <path d="M0 108h400" />
        <path d="M20 114h40M96 116h56M196 114h44M292 116h60" opacity=".35" />
      </g>
    </svg>
  );
}

/** Bakü, in a single line: the old tower, three flames, the sea. */
export function BakuSkyline({ className, title, ...props }: DecorProps) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      className={cn("h-auto w-full", className)}
      {...a11y(title)}
      {...props}
    >
      <g stroke="currentColor" strokeWidth="1.400" strokeLinecap="round" strokeLinejoin="round">
        <path d="M58 108V62c0-5 30-5 30 0v46M55 62h36M58 56h4v6M68 56h4v6M78 56h4v6M88 62l14 6v40" />
        <path d="M66 76h3M76 76h3M66 90h3M76 90h3" opacity=".5" />
        <path d="M152 108c-5-27 1-52 20-80 7 23 13 52 9 80" />
        <path d="M186 108c-3-33 8-63 25-92 9 28 12 60 6 92" />
        <path d="M221 108c0-25 9-49 26-70 5 22 7 46 3 70" />
        <path d="M160 92c4-18 8-32 12-44M197 88c3-22 8-42 14-58M230 92c3-14 8-28 15-40" opacity=".4" />
        <path d="M304 108l8-48 3-40 3 40 8 48M308 72h14M310 60h10" />
        <path d="M112 108v-14h10v-8h10v22M262 108V92h12v-8h10v24M340 108V96h14v12" opacity=".7" />
        <path d="M0 108h400" />
        <path d="M30 114h52M130 116h44M222 114h60M318 116h46" opacity=".35" />
      </g>
    </svg>
  );
}

/** A hand-drawn divider: a line, a sparkle, a line. */
export function Flourish({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 text-rose", className)} aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-line-strong" />
      <Sparkle className="size-3" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-line-strong" />
    </div>
  );
}
