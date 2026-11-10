"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Flourish } from "@/components/decor";
import { SmartImage } from "@/components/media/smart-image";
import { EASE_SOFT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { Capsule } from "../queries";
import { CapsuleArt } from "./capsule-art";

/** Opening a capsule whose day has come: the case parts, and what was kept inside appears. */
export function CapsuleOpener({ capsule, openedLabel }: { capsule: Capsule; openedLabel: string }) {
  const reduce = useReducedMotion();
  const [opened, setOpened] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!opened ? (
        <motion.div key="sealed" exit={{ opacity: 0, scale: reduce ? 1 : 1.08 }} transition={{ duration: 0.6, ease: EASE_SOFT }} className="flex min-h-[56dvh] flex-col items-center justify-center text-center">
          <p className="eyebrow">Time Capsule</p>
          <h1 className="mt-4 max-w-lg font-display text-display-sm text-ink">{capsule.title}</h1>
          <p className="mt-3 text-sm text-taupe">{openedLabel}</p>
          <button type="button" onClick={() => setOpened(true)} aria-label={`"${capsule.title}" kapsülünü aç`} className="mt-10 w-full max-w-xs rounded-[2.5rem] outline-offset-8 transition-transform duration-500 ease-soft hover:-translate-y-1">
            <CapsuleArt style={capsule.coverStyle} sealed={false} />
          </button>
          <Button variant="accent" size="lg" className="mt-10" onClick={() => setOpened(true)}>
            Kapsülü aç
          </Button>
        </motion.div>
      ) : (
        <motion.article key="open" initial={{ opacity: 0, y: reduce ? 0 : 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0.3 : 1.1, ease: EASE_SOFT }} className="paper paper-grain px-7 py-10 sm:px-14 sm:py-16">
          <header className="text-center">
            <p className="eyebrow">{openedLabel}</p>
            <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">{capsule.title}</h1>
            <Flourish className="mt-8" />
          </header>

          {capsule.message ? <p className="prose-letter mx-auto mt-10 max-w-[38rem] font-display text-[20px] leading-[1.85] text-ink-soft">{capsule.message}</p> : null}

          {capsule.images.length > 0 ? (
            <div className="mx-auto mt-10 grid max-w-[38rem] gap-4 sm:grid-cols-2">
              {capsule.images.map(({ assetId, image }) => (
                <SmartImage key={assetId} image={image} alt="Kapsülden bir fotoğraf" sizes="(min-width: 640px) 19rem, 100vw" className="rounded-[3px] shadow-paper" />
              ))}
            </div>
          ) : null}

          {capsule.audio.map(({ assetId, url }) => (
            <audio key={assetId} controls preload="none" src={url} className="mx-auto mt-8 block w-full max-w-[38rem]" aria-label="Kapsülden bir ses kaydı" />
          ))}

          {capsule.videoUrl ? (
            <p className="mt-8 text-center">
              <a href={capsule.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-accent underline-offset-4 hover:underline">
                Videoyu aç
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </p>
          ) : null}

          {capsule.note ? (
            <aside className="mx-auto mt-10 max-w-[38rem] -rotate-1 border-l-2 border-accent-soft bg-accent-wash/60 px-6 py-5">
              <p className="prose-letter font-hand text-2xl leading-snug text-accent">{capsule.note}</p>
            </aside>
          ) : null}

          <p className="mx-auto mt-10 max-w-[38rem] text-right font-hand text-3xl text-accent">— {capsule.authorName}</p>
        </motion.article>
      )}
    </AnimatePresence>
  );
}
