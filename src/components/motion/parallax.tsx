"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useSyncExternalStore, type ReactNode } from "react";

function subscribeToWidth(callback: () => void) {
  const query = window.matchMedia("(min-width: 768px) and (pointer: fine)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** True on larger screens with a mouse — the only place parallax runs. */
export function useRichMotion(): boolean {
  const reduce = useReducedMotion();
  const capable = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia("(min-width: 768px) and (pointer: fine)").matches,
    () => false,
  );
  return capable && !reduce;
}

/**
 * Moves its children a little slower or faster than the page as it scrolls
 * past. Carefully small: `distance` is the total travel in px. Off on phones
 * and when motion is reduced.
 */
export function Parallax({
  children,
  className,
  distance = 60,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rich = useRichMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance / 2, -distance / 2]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={rich ? { y, willChange: "transform" } : undefined}>{children}</motion.div>
    </div>
  );
}
