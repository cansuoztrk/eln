"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, type KeyboardEvent } from "react";
import { EASE_SOFT } from "@/components/motion/reveal";
import { formatDate, parseISODate } from "@/lib/dates";
import type { Photo } from "../queries";

type Props = {
  photos: Photo[];
  /** Index of the open photo, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  memories?: Record<string, { id: string; title: string }[]>;
};

const SWIPE = 70;
const SWIPE_DOWN = 110;
/** A phone is handed the 1280px copy, a large screen the 2400px one. */
const srcSet = (photo: Photo) => `${photo.image.medium} 1280w, ${photo.image.large} 2400w`;

/**
 * One photograph, full screen, nothing over it. Arrow keys, the on-screen
 * arrows and a swipe all move through the set; Escape or a downward swipe
 * closes it.
 */
export function Lightbox({ photos, index, onIndexChange, memories = {} }: Props) {
  const reduce = useReducedMotion();
  const photo = index === null ? null : photos[index];
  const count = photos.length;

  const go = useCallback(
    (step: number) => {
      if (index === null || count < 2) return;
      onIndexChange((index + step + count) % count);
    },
    [index, count, onIndexChange],
  );

  // Warm up the neighbours so moving feels instant.
  useEffect(() => {
    if (index === null) return;
    for (const offset of [1, -1]) {
      const neighbour = photos[(index + offset + count) % count];
      if (!neighbour) continue;
      const warm = new window.Image();
      warm.sizes = "100vw";
      warm.srcset = srcSet(neighbour);
    }
  }, [index, photos, count]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  const date = photo?.takenOn ? parseISODate(photo.takenOn) : null;
  const linked = photo ? (memories[photo.id] ?? []) : [];

  return (
    <Dialog.Root open={photo !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-night data-[state=open]:animate-[fade-up_0.35s_ease_both]" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-[60] flex flex-col text-pearl outline-none"
        >
          <div className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
            <Dialog.Title className="text-[13px] tracking-[0.2em] text-pearl/70 tabular-nums">
              {index !== null ? `${index + 1} / ${count}` : ""}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Kapat"
              className="grid size-10 place-items-center rounded-full bg-pearl/10 transition-colors hover:bg-pearl/20"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {photo ? (
                <motion.div
                  key={photo.id}
                  className="absolute inset-0 flex touch-none items-center justify-center px-3 sm:px-20"
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE_SOFT }}
                  drag={reduce ? false : count > 1 ? true : "y"}
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={{ left: 0.35, right: 0.35, top: 0, bottom: 0.5 }}
                  onDragEnd={(_, info) => {
                    const sideways = Math.abs(info.offset.x) > Math.abs(info.offset.y);
                    if (!sideways && (info.offset.y > SWIPE_DOWN || info.velocity.y > 700)) onIndexChange(null);
                    else if (sideways && (info.offset.x < -SWIPE || info.velocity.x < -500)) go(1);
                    else if (sideways && (info.offset.x > SWIPE || info.velocity.x > 500)) go(-1);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed large variant, shown as-is */}
                  <img
                    src={photo.image.large}
                    srcSet={srcSet(photo)}
                    sizes="100vw"
                    alt={photo.altText || photo.caption || "Fotoğraf"}
                    draggable={false}
                    className="max-h-full max-w-full rounded-[3px] object-contain shadow-lift select-none"
                    style={{
                      backgroundImage: photo.image.placeholder ? `url(${photo.image.placeholder})` : undefined,
                      backgroundSize: "cover",
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Önceki fotoğraf"
                  className="absolute top-1/2 left-2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-pearl/10 transition-colors hover:bg-pearl/20 sm:grid"
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Sonraki fotoğraf"
                  className="absolute top-1/2 right-2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-pearl/10 transition-colors hover:bg-pearl/20 sm:grid"
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>

          <div className="safe-bottom shrink-0 px-5 pt-4 text-center sm:px-8" aria-live="polite">
            {photo?.caption ? (
              <p className="mx-auto max-w-2xl font-display text-xl leading-snug text-pearl italic sm:text-2xl">{photo.caption}</p>
            ) : null}
            <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] tracking-wide text-pearl/60">
              {photo?.isFavorite ? (
                <span className="inline-flex items-center gap-1 text-powder">
                  <Heart className="size-3 fill-current" aria-hidden="true" /> Favori
                </span>
              ) : null}
              {date ? <span>{formatDate(date)}</span> : null}
              {photo?.tags.map((tag) => (
                <Link key={tag} href={`/gallery?tag=${encodeURIComponent(tag)}`} className="hover:text-pearl">
                  #{tag}
                </Link>
              ))}
              {linked.map((memory) => (
                <Link key={memory.id} href={`/story/${memory.id}`} className="underline underline-offset-4 hover:text-pearl">
                  {memory.title}
                </Link>
              ))}
            </p>
            {count > 1 ? (
              <div className="mt-3 flex justify-center gap-3 sm:hidden">
                <button type="button" onClick={() => go(-1)} aria-label="Önceki fotoğraf" className="grid size-11 place-items-center rounded-full bg-pearl/10">
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Sonraki fotoğraf" className="grid size-11 place-items-center rounded-full bg-pearl/10">
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
