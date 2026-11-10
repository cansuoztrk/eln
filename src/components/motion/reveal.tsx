"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE_SOFT = [0.22, 1, 0.36, 1] as const;
export const EASE_SILK = [0.65, 0, 0.35, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before this element starts. */
  delay?: number;
  /** Distance travelled upward, in px. Ignored when motion is reduced. */
  y?: number;
  duration?: number;
  as?: "div" | "section" | "li" | "article" | "p" | "span" | "figure" | "header";
};

/**
 * Fades content up as it enters the viewport, once. With reduced motion it
 * only fades.
 */
export function Reveal({ children, className, delay = 0, y = 22, duration = 0.9, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: reduce ? 0.3 : duration, delay, ease: EASE_SOFT }}
    >
      {children}
    </Component>
  );
}

const container: Variants = {
  hidden: {},
  shown: (stagger: number) => ({ transition: { staggerChildren: stagger, delayChildren: 0.05 } }),
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_SOFT } },
};

const itemReduced: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.3 } },
};

/** Reveals its `StaggerItem` children one after another. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={container}
      custom={stagger}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article" | "figure";
}) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component className={className} variants={reduce ? itemReduced : item}>
      {children}
    </Component>
  );
}

/** Reveals a line of text word by word. For the few sentences that deserve it. */
export function WordReveal({
  text,
  className,
  delay = 0,
  stagger = 0.09,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: reduce ? 0 : "0.9em" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.4 : 1.1, delay: delay + i * (reduce ? 0.02 : stagger), ease: EASE_SOFT }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
