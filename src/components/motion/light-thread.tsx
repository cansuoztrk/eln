"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { EASE_SILK } from "./reveal";

/**
 * The thread of light between two cities. An arc that draws itself once, and
 * a small glow that keeps travelling along it — distance as a bond, not a gap.
 */
export function LightThread({
  className,
  tone = "dusk",
  labels,
}: {
  className?: string;
  tone?: "dusk" | "day";
  /** City names shown under each end. */
  labels?: [string, string];
}) {
  const id = useId();
  const reduce = useReducedMotion();
  const path = "M24 96 C 130 8, 290 8, 396 96";
  const line = tone === "dusk" ? ["#ead9bb", "#f3c9d1", "#fffdfa"] : ["#b98a78", "#c98b96", "#b8996a"];

  return (
    <svg
      viewBox="0 0 420 132"
      fill="none"
      className={cn("h-auto w-full overflow-visible", className)}
      role="img"
      aria-label={labels ? `${labels[0]} ile ${labels[1]} arasında bir ışık çizgisi` : "İki şehir arasında bir ışık çizgisi"}
    >
      <defs>
        <linearGradient id={`${id}-line`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={line[0]} stopOpacity="0.15" />
          <stop offset="0.5" stopColor={line[1]} stopOpacity="1" />
          <stop offset="1" stopColor={line[0]} stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={line[2]} stopOpacity="1" />
          <stop offset="0.4" stopColor={line[1]} stopOpacity="0.55" />
          <stop offset="1" stopColor={line[1]} stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={path} stroke={line[1]} strokeOpacity="0.16" strokeWidth="1" strokeDasharray="2 7" strokeLinecap="round" />
      <motion.path
        d={path}
        stroke={`url(#${id}-line)`}
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 2.4, ease: EASE_SILK }}
      />

      {reduce ? (
        <circle cx="210" cy="30" r="9" fill={`url(#${id}-glow)`} />
      ) : (
        <circle r="9" fill={`url(#${id}-glow)`}>
          <animateMotion dur="7s" repeatCount="indefinite" path={path} keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
        </circle>
      )}

      {[24, 396].map((x) => (
        <g key={x}>
          <circle cx={x} cy="96" r="9" fill={line[1]} fillOpacity="0.16" />
          <circle cx={x} cy="96" r="3.2" fill={line[2]} stroke={line[1]} strokeWidth="1" />
        </g>
      ))}

      {labels ? (
        <g
          fontFamily="var(--font-sans)"
          fontSize="10"
          letterSpacing="2.6"
          fill={tone === "dusk" ? "rgb(255 253 250 / 0.75)" : "var(--color-taupe)"}
        >
          <text x="24" y="122" textAnchor="start">
            {labels[0].toLocaleUpperCase("tr-TR")}
          </text>
          <text x="396" y="122" textAnchor="end">
            {labels[1].toLocaleUpperCase("tr-TR")}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
