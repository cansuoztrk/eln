"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Tone = "dusk" | "day";

const PALETTES: Record<Tone, string[]> = {
  // Champagne and pearl on the dark rose sky.
  dusk: ["255,253,250", "234,217,187", "243,201,209", "255,244,230"],
  // Barely-there motes of rose and gold on ivory.
  day: ["201,139,150", "184,153,106", "243,201,209"],
};

type Star = { x: number; y: number; r: number; base: number; speed: number; phase: number; drift: number; color: string };

/**
 * A quiet field of stars on a canvas. It never fights the content: low
 * density, slow twinkle, and it stops drawing whenever it is off-screen, the
 * tab is hidden, or the person prefers reduced motion (then it renders once,
 * still).
 */
export function StarField({
  tone = "dusk",
  density = 1,
  className,
}: {
  tone?: Tone;
  /** 1 is the default amount; phones automatically get about half. */
  density?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    const palette = PALETTES[tone];

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = 0;

    const seed = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(220, Math.round(((width * height) / 9000) * density * (small ? 0.55 : 1)));
      stars = Array.from({ length: count }, () => {
        const big = Math.random() > 0.93;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: big ? 1.4 + Math.random() * 0.9 : 0.4 + Math.random() * 0.9,
          base: tone === "dusk" ? 0.35 + Math.random() * 0.55 : 0.12 + Math.random() * 0.22,
          speed: 0.25 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 3,
          color: palette[Math.floor(Math.random() * palette.length)],
        };
      });
    };

    const draw = (time: number) => {
      const t = time / 1000;
      context.clearRect(0, 0, width, height);
      for (const star of stars) {
        const twinkle = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * star.speed + star.phase);
        const y = reduce ? star.y : (star.y + t * star.drift + height) % height;
        context.beginPath();
        context.fillStyle = `rgba(${star.color},${(star.base * twinkle).toFixed(3)})`;
        context.arc(star.x, y, star.r, 0, Math.PI * 2);
        context.fill();
        if (star.r > 1.4) {
          context.beginPath();
          context.fillStyle = `rgba(${star.color},${(star.base * twinkle * 0.14).toFixed(3)})`;
          context.arc(star.x, y, star.r * 3.4, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const loop = (time: number) => {
      // ~30fps is plenty for a slow twinkle and halves the work.
      if (time - last > 32) {
        draw(time);
        last = time;
      }
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (reduce) {
        draw(0);
      } else if (visible && !document.hidden) {
        frame = requestAnimationFrame(loop);
      }
    };

    seed();
    start();

    const resize = new ResizeObserver(() => {
      seed();
      start();
    });
    resize.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersection.observe(canvas);

    const onVisibility = () => start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tone, density]);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 size-full", className)} />;
}
