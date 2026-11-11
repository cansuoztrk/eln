"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_SOFT } from "@/components/motion/reveal";

/** A soft arrival for every page: the room fades in as you step through. */
export default function WorldTemplate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE_SOFT }}
    >
      {children}
    </motion.div>
  );
}
