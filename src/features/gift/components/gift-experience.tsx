"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bow, Sparkle } from "@/components/decor";
import { SmartImage, type DisplayImage } from "@/components/media/smart-image";
import { LightThread } from "@/components/motion/light-thread";
import { EASE_SILK, EASE_SOFT, WordReveal } from "@/components/motion/reveal";
import { StarField } from "@/components/motion/star-field";
import { Button } from "@/components/ui/button";
import { Envelope } from "@/features/letters/components/envelope";
import { cn } from "@/lib/cn";
import { ablative, dative } from "@/lib/grammar";
import { GIFT_SEEN_KEY } from "../constants";
import { MusicToggle } from "./music-toggle";

type Scene = "quiet" | "dusk" | "photo" | "headline" | "envelope" | "enter";

export type GiftContent = {
  greeting: string;
  headline: string;
  letter: string;
  signature: string;
  enterLabel: string;
  /** A real photo chosen by Arda. When there is none, that scene is skipped. */
  photo: DisplayImage | null;
  photoAlt: string;
  cities: [string, string];
  song: { videoId: string | null; title: string; artist: string };
};

/** How long a scene rests before moving on by itself. Scenes not listed wait for the person. */
const AUTO_ADVANCE: Partial<Record<Scene, number>> = { quiet: 7000, dusk: 6500, photo: 8000, headline: 7500 };
/** Scenes that a tap, click or key press may move past. */
const TAP_ADVANCES: Scene[] = ["quiet", "dusk", "photo", "headline"];

/**
 * The first encounter. Six small scenes that tell one thing: this place was
 * made for you. Nothing plays by itself except light; the song waits to be
 * asked for, and every scene can be skipped.
 */
export function GiftExperience({ content, exitHref = "/", preview = false }: { content: GiftContent; exitHref?: string; preview?: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const scenes = useMemo<Scene[]>(
    () => ["quiet", "dusk", ...(content.photo ? (["photo"] as const) : []), "headline", "envelope", "enter"],
    [content.photo],
  );

  const [index, setIndex] = useState(0);
  const [untied, setUntied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);
  const scene = scenes[index];
  const dusk = scene !== "quiet";

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, scenes.length - 1)), [scenes.length]);
  const back = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
    setUntied(false);
    setOpened(false);
  }, []);

  const finish = useCallback(() => {
    if (!preview) {
      try {
        window.localStorage.setItem(GIFT_SEEN_KEY, "1");
      } catch {
        // Private mode: the gift simply plays again next time.
      }
    }
    setLeaving(true);
    window.setTimeout(() => router.replace(exitHref), reduce ? 250 : 1500);
  }, [exitHref, preview, reduce, router]);

  useEffect(() => {
    const wait = AUTO_ADVANCE[scene];
    if (!wait) return;
    const id = window.setTimeout(next, wait);
    return () => window.clearTimeout(id);
  }, [scene, next]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, iframe")) return;
      if ((event.key === "ArrowRight" || event.key === " " || event.key === "Enter") && TAP_ADVANCES.includes(scene)) {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene, next, back]);

  // When the letter appears, move focus to it so it can be read and scrolled at once.
  useEffect(() => {
    if (opened) letterRef.current?.focus({ preventScroll: true });
  }, [opened]);

  function untie() {
    if (untied) return;
    setUntied(true);
    window.setTimeout(() => setOpened(true), reduce ? 200 : 2000);
  }

  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduce ? 0.3 : 1.2, ease: EASE_SOFT } };

  return (
    <div
      role="region"
      aria-label="Sana hazırlanan hediye"
      className={cn("fixed inset-0 overflow-hidden transition-colors duration-[2000ms]", dusk ? "text-pearl" : "text-ink")}
    >
      {/* Day → dusk. The world's night is warm, never black. */}
      <div className="absolute inset-0 bg-ivory" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_42%,var(--color-blush)_0%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className={cn("dusk absolute inset-0 transition-opacity duration-[2400ms] ease-silk", dusk ? "opacity-100" : "opacity-0")}
      />
      {dusk ? (
        <motion.div {...fade} transition={{ duration: 3 }} className="absolute inset-0" aria-hidden="true">
          <StarField tone="dusk" density={1.1} />
          <div className="absolute top-[12%] left-[8%] size-[38vmax] animate-drift rounded-full bg-[radial-gradient(circle,rgb(243_201_209/0.16),transparent_65%)]" />
          <div className="absolute right-[4%] bottom-[6%] size-[32vmax] animate-drift rounded-full bg-[radial-gradient(circle,rgb(234_217_187/0.13),transparent_65%)] [animation-delay:-6s]" />
        </motion.div>
      ) : null}

      {/* A tap anywhere moves on, during the scenes that only ask to be watched. */}
      {TAP_ADVANCES.includes(scene) ? (
        <button type="button" onClick={next} aria-label="Devam et" className="absolute inset-0 z-10 cursor-pointer" />
      ) : null}

      <div className="pointer-events-none relative z-20 flex h-full flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {scene === "quiet" ? (
            <motion.div key="quiet" {...fade} className="flex flex-col items-center">
              <Sparkle className="mb-10 size-5 animate-breathe text-rose" />
              <p className="font-display text-display-lg leading-none text-ink italic">
                <WordReveal text={content.greeting} delay={0.6} />
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.2, duration: 1.4 }}
                className="eyebrow mt-14"
              >
                devam etmek için dokun
              </motion.p>
            </motion.div>
          ) : null}

          {scene === "dusk" ? (
            <motion.div key="dusk" {...fade} className="w-full max-w-2xl">
              <LightThread tone="dusk" labels={content.cities} />
              <p className="mt-12 font-display text-[clamp(1.75rem,6vw,2.75rem)] leading-tight text-pearl/90 italic">
                <WordReveal text={`${ablative(content.cities[0])} ${dative(content.cities[1])}`} delay={1.8} stagger={0.3} />
              </p>
            </motion.div>
          ) : null}

          {scene === "photo" && content.photo ? (
            <motion.figure key="photo" {...fade} className="relative">
              <motion.div
                initial={reduce ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.06, rotate: -4 }}
                animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)", scale: 1, rotate: -2 }}
                transition={{ duration: reduce ? 0.6 : 2.4, ease: EASE_SILK }}
                className="relative w-[min(74vw,21rem)] bg-pearl p-3 pb-12 shadow-lift sm:p-4 sm:pb-16"
              >
                <SmartImage
                  image={content.photo}
                  alt={content.photoAlt}
                  sizes="(min-width: 640px) 21rem, 74vw"
                  priority
                  mode="fill"
                  style={{ aspectRatio: Math.min(1.25, Math.max(0.62, content.photo.width / Math.max(1, content.photo.height))) }}
                />
                {reduce ? null : (
                  <motion.span
                    aria-hidden="true"
                    initial={{ x: "-140%" }}
                    animate={{ x: "240%" }}
                    transition={{ duration: 2.2, delay: 1.6, ease: EASE_SILK }}
                    className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-pearl/45 to-transparent"
                  />
                )}
              </motion.div>
              <Sparkle className="absolute -top-5 -right-5 size-5 animate-twinkle text-champagne" />
              <Sparkle className="absolute -bottom-3 -left-6 size-3 animate-twinkle text-powder [animation-delay:1.4s]" />
            </motion.figure>
          ) : null}

          {scene === "headline" ? (
            <motion.div key="headline" {...fade} className="max-w-3xl">
              <p className="font-display text-display leading-[1.08] text-pearl italic">
                <WordReveal text={content.headline} delay={0.3} stagger={0.14} />
              </p>
            </motion.div>
          ) : null}

          {scene === "envelope" ? (
            <motion.div key="envelope" {...fade} className="pointer-events-auto flex w-full max-w-xl flex-col items-center">
              <AnimatePresence mode="wait">
                {!opened ? (
                  <motion.div
                    key="closed"
                    exit={{ opacity: 0, y: 30, scale: 0.96 }}
                    transition={{ duration: 0.6, ease: EASE_SOFT }}
                    className="flex w-full flex-col items-center"
                  >
                    <button
                      type="button"
                      onClick={untie}
                      disabled={untied}
                      aria-label="Kurdeleyi çöz ve zarfı aç"
                      className="relative w-[min(82vw,24rem)] rounded-xl outline-offset-8 transition-transform duration-500 ease-soft hover:-translate-y-1 disabled:hover:translate-y-0"
                    >
                      <Envelope styleName="blush" seal="heart" state={untied ? "open" : "closed"} />
                      {/* The ribbon: two bands and a bow that let go when touched. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-y-0 left-1/2 z-30 w-3 -translate-x-1/2 bg-rose-deep/85 transition-transform duration-700 ease-silk",
                          untied ? "scale-y-0" : "scale-y-100",
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-0 top-[56%] z-30 h-3 -translate-y-1/2 bg-rose-deep/85 transition-transform duration-700 ease-silk",
                          untied ? "scale-x-0" : "scale-x-100",
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-[56%] left-1/2 z-40 -translate-x-1/2 -translate-y-[60%] transition-[transform,opacity] duration-[900ms] ease-soft",
                          untied ? "-translate-y-[220%] scale-125 rotate-12 opacity-0" : "opacity-100",
                        )}
                      >
                        <Bow className="w-24 text-rose-deep [--bow-fill:var(--color-powder)] sm:w-28" />
                      </span>
                    </button>
                    <motion.div animate={{ opacity: untied ? 0 : 1 }} className="mt-12">
                      <Button variant="light" size="lg" onClick={untie} disabled={untied}>
                        Kurdeleyi çöz
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="letter"
                    ref={letterRef}
                    tabIndex={-1}
                    initial={{ opacity: 0, y: reduce ? 0 : 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0.3 : 1.1, ease: EASE_SOFT }}
                    className="flex max-h-[82dvh] w-full flex-col items-center outline-none"
                  >
                    {/* The foot of the sheet fades, so a letter longer than the screen reads as "there is more". */}
                    <article className="paper paper-grain w-full overflow-y-auto px-7 py-9 pb-16 text-left [mask-image:linear-gradient(to_bottom,black_calc(100%_-_3.5rem),transparent)] sm:px-12 sm:py-12 sm:pb-20">
                      <p className="prose-letter font-display text-[19px] leading-[1.85] text-ink-soft sm:text-[21px]">
                        {content.letter}
                      </p>
                      {content.signature ? (
                        <p className="mt-8 text-right font-hand text-3xl text-accent">— {content.signature}</p>
                      ) : null}
                    </article>
                    <Button variant="light" size="lg" className="mt-7 shrink-0" onClick={next}>
                      Devam
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}

          {scene === "enter" ? (
            <motion.div key="enter" {...fade} className="pointer-events-auto flex flex-col items-center">
              <Bow className="mb-8 w-16 text-powder [--bow-fill:rgb(243_201_209/0.25)] [--bow-knot:var(--color-rose)]" />
              <p className="eyebrow">Beyond Distance</p>
              <p className="mt-4 font-display text-display-lg leading-none text-pearl italic">Elnare</p>
              <Button variant="light" size="lg" className="mt-12" onClick={finish} disabled={leaving}>
                {content.enterLabel || "İçeri gir"}
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Chrome: progress, the song (only if asked for), and a way out. */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          {content.song.videoId && dusk ? (
            <MusicToggle videoId={content.song.videoId} title={content.song.title} artist={content.song.artist} />
          ) : null}
        </div>
        <button
          type="button"
          onClick={finish}
          className={cn(
            "pointer-events-auto h-10 rounded-full px-4 text-[13px] font-medium tracking-wide transition-colors",
            dusk ? "text-pearl/60 hover:bg-pearl/10 hover:text-pearl" : "text-taupe hover:bg-ink/5 hover:text-ink",
          )}
        >
          {preview ? "Önizlemeden çık" : "Geç"}
        </button>
      </div>

      <ol aria-label="Sahne" className="absolute inset-x-0 bottom-6 z-30 flex justify-center gap-2 safe-bottom">
        {scenes.map((name, i) => (
          <li
            key={name}
            aria-current={i === index ? "step" : undefined}
            className={cn(
              "h-1 rounded-full transition-[width,background-color] duration-700 ease-soft",
              i === index ? "w-7" : "w-1.5",
              dusk ? (i <= index ? "bg-pearl/80" : "bg-pearl/25") : i <= index ? "bg-rose" : "bg-ink/15",
            )}
          >
            <span className="sr-only">
              {i + 1} / {scenes.length}
            </span>
          </li>
        ))}
      </ol>

      {/* Leaving: light opens outward, and the world is behind it. */}
      <AnimatePresence>
        {leaving ? (
          <motion.div
            aria-hidden="true"
            initial={reduce ? { opacity: 0 } : { clipPath: "circle(0% at 50% 58%)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "circle(150% at 50% 58%)" }}
            transition={{ duration: reduce ? 0.25 : 1.4, ease: EASE_SILK }}
            className="absolute inset-0 z-50 bg-ivory"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
