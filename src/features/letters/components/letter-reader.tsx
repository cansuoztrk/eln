"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ALargeSmall, ArrowLeft, Maximize2, Minimize2, PenLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EASE_SOFT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Letter } from "../queries";
import { categoryLabel } from "../schema";
import { Envelope } from "./envelope";
import { LetterPaper } from "./letter-paper";

type Stage = "closed" | "opening" | "open";

/**
 * Reading a letter is a small ritual: an envelope, a seal, a flap that lifts,
 * a sheet that rises — and then just the words, with nothing around them.
 */
export function LetterReader({ letter, recipientName, editHref }: { letter: Letter; recipientName: string; editHref?: string }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("closed");
  const [font, setFont] = useState<"serif" | "hand">(letter.fontStyle);
  const [scale, setScale] = useState(1);
  const [focus, setFocus] = useState(false);

  function open() {
    if (stage !== "closed") return;
    if (reduce) {
      setStage("open");
      return;
    }
    setStage("opening");
    window.setTimeout(() => setStage("open"), 2100);
  }

  // Reading mode covers the page; Escape leaves it.
  useEffect(() => {
    if (!focus) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFocus(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [focus]);

  const toolbar = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <div role="group" aria-label="Yazı tipi" className="flex rounded-full border border-line-strong bg-pearl p-1">
        {(["serif", "hand"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={font === option}
            onClick={() => setFont(option)}
            className={cn(
              "h-8 rounded-full px-4 text-[13px] transition-colors",
              option === "hand" && "font-hand text-[17px]",
              font === option ? "bg-ink text-pearl" : "text-ink-soft hover:text-ink",
            )}
          >
            {option === "serif" ? "Basılı" : "El yazısı"}
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setScale((s) => (s >= 3 ? 0 : s + 1))}
        aria-label="Yazı boyutunu değiştir"
      >
        <ALargeSmall aria-hidden="true" />
        Boyut
      </Button>
      <Button variant="outline" size="sm" onClick={() => setFocus((f) => !f)} aria-pressed={focus}>
        {focus ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
        {focus ? "Okuma modundan çık" : "Okuma modu"}
      </Button>
    </div>
  );

  const paper = (
    <LetterPaper
      title={letter.title}
      body={letter.body}
      category={letter.category}
      writtenOn={letter.writtenOn}
      authorName={letter.authorName}
      fontStyle={font}
      scale={scale}
    />
  );

  return (
    <div className="shell-narrow pt-24 pb-10 md:pt-32">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/letters"
          className="inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-taupe transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tüm mektuplar
        </Link>
        {editHref ? (
          <Link
            href={editHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-taupe transition-colors hover:text-accent"
          >
            <PenLine className="size-3.5" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {stage !== "open" ? (
          <motion.div
            key="envelope"
            className="flex min-h-[62dvh] flex-col items-center justify-center text-center"
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.5, ease: EASE_SOFT }}
          >
            <p className="eyebrow">{categoryLabel(letter.category)}</p>
            <h1 className="mt-4 max-w-lg font-display text-4xl text-ink sm:text-5xl">{letter.title}</h1>

            <button
              type="button"
              onClick={open}
              disabled={stage === "opening"}
              aria-label={`"${letter.title}" mektubunun zarfını aç`}
              className="mt-14 w-full max-w-sm rounded-xl outline-offset-8 transition-transform duration-500 ease-soft hover:-translate-y-1 disabled:hover:translate-y-0 sm:max-w-md"
            >
              <Envelope
                styleName={letter.envelopeStyle}
                seal={letter.seal}
                state={stage === "opening" ? "open" : "closed"}
                interactive={stage === "closed"}
                paper={
                  <p className="font-hand text-[clamp(0.9rem,3.4vw,1.3rem)] leading-snug text-ink-soft/80">
                    {recipientName},
                  </p>
                }
              />
            </button>

            <motion.div animate={{ opacity: stage === "closed" ? 1 : 0 }} transition={{ duration: 0.3 }} className="mt-12">
              <Button variant="accent" size="lg" onClick={open} disabled={stage !== "closed"}>
                Zarfı aç
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="paper"
            initial={{ opacity: 0, y: reduce ? 0 : 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.3 : 1, ease: EASE_SOFT }}
          >
            {paper}
            <div className="mt-8">{toolbar}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {focus ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${letter.title} — okuma modu`}
          className="fixed inset-0 z-[60] overflow-y-auto bg-ivory"
        >
          <div className="shell-narrow py-10 sm:py-16">
            {paper}
            <div className="mt-8">{toolbar}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
