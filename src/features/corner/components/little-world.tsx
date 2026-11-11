"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Bow, Heart, Kitten, Sparkle } from "@/components/decor";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { savePreferencesAction } from "../actions";
import { BOWS, MAX_STICKERS, STICKER_TYPES, THEMES, type Preferences, type Sticker, type StickerType } from "../schema";

const STICKER_LABEL: Record<StickerType, string> = { bow: "Fiyonk", heart: "Kalp", sparkle: "Yıldız", kitten: "Kedi" };

function StickerArt({ type, tone, className }: { type: StickerType; tone: number; className?: string }) {
  const colours = BOWS[tone] ?? BOWS[0];
  const style = { "--bow-fill": colours.fill, "--bow-knot": colours.knot, color: colours.knot } as CSSProperties;
  if (type === "bow") return <Bow className={cn("w-16", className)} style={{ ...style, color: "#4a3b37" }} />;
  if (type === "kitten") return <Kitten className={cn("size-16", className)} style={{ ...style, color: "#4a3b37" }} />;
  if (type === "heart") return <Heart className={cn("size-10", className)} style={{ color: colours.fill === "#fffdfa" ? colours.knot : colours.fill }} />;
  return <Sparkle className={cn("size-9", className)} style={style} />;
}

/**
 * Eln's Little World: the playful corner. A kitten that answers a tap, bows to
 * choose from, a colour for the whole site, and a board to decorate. Whatever
 * she arranges here is hers alone — nobody else sees it.
 */
export function LittleWorld({ initial, message, name }: { initial: Preferences; message: string | null; name: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [prefs, setPrefs] = useState(initial);
  const [hearts, setHearts] = useState<number[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const first = useRef(true);
  const counter = useRef(0);
  const nextId = () => `s${(counter.current += 1)}-${initial.stickers.length}`;

  // Save a moment after the last change, so dragging does not flood the server.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const result = await savePreferencesAction(prefs);
      if (!result.ok) toast(result.error, "error");
      else router.refresh();
    }, 700);
    return () => window.clearTimeout(saveTimer.current);
  }, [prefs, router]);

  const bow = BOWS[prefs.bow] ?? BOWS[0];
  const update = (id: string, change: Partial<Sticker>) => setPrefs((p) => ({ ...p, stickers: p.stickers.map((s) => (s.id === id ? { ...s, ...change } : s)) }));

  function pet() {
    const id = (counter.current += 1);
    setHearts((list) => [...list.slice(-5), id]);
    window.setTimeout(() => setHearts((list) => list.filter((h) => h !== id)), 1600);
  }

  function addSticker(type: StickerType) {
    if (prefs.stickers.length >= MAX_STICKERS) {
      toast(`Pano doldu (en fazla ${MAX_STICKERS} sticker).`, "error");
      return;
    }
    const n = prefs.stickers.length;
    let id = nextId();
    while (prefs.stickers.some((s) => s.id === id)) id = nextId();
    const sticker: Sticker = { id, type, x: 18 + ((n * 23) % 64), y: 22 + ((n * 37) % 56), rotate: ((n * 17) % 31) - 15, tone: (prefs.bow + n) % BOWS.length };
    setPrefs((p) => ({ ...p, stickers: [...p.stickers, sticker] }));
    setActive(sticker.id);
  }

  function onPointerMove(event: PointerEvent) {
    const id = dragging.current;
    const rect = board.current?.getBoundingClientRect();
    if (!id || !rect) return;
    const x = Math.min(96, Math.max(4, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(94, Math.max(6, ((event.clientY - rect.top) / rect.height) * 100));
    update(id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  function onKey(event: KeyboardEvent, sticker: Sticker) {
    const step = event.shiftKey ? 6 : 2;
    const moves: Record<string, Partial<Sticker>> = {
      ArrowLeft: { x: Math.max(4, sticker.x - step) },
      ArrowRight: { x: Math.min(96, sticker.x + step) },
      ArrowUp: { y: Math.max(6, sticker.y - step) },
      ArrowDown: { y: Math.min(94, sticker.y + step) },
    };
    if (moves[event.key]) {
      event.preventDefault();
      update(sticker.id, moves[event.key]);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      setPrefs((p) => ({ ...p, stickers: p.stickers.filter((s) => s.id !== sticker.id) }));
    }
  }

  return (
    <div className="space-y-20">
      <section className="flex flex-col items-center text-center">
        <button type="button" onClick={pet} aria-label="Kediyi sev" className="relative rounded-full outline-offset-8 transition-transform duration-300 ease-soft hover:scale-105 active:scale-95">
          <Kitten className="size-36 text-ink-soft" style={{ "--bow-fill": bow.fill, "--bow-knot": bow.knot } as CSSProperties} />
          <AnimatePresence>
            {hearts.map((id, i) => (
              <motion.span
                key={id}
                aria-hidden="true"
                className="pointer-events-none absolute top-2 left-1/2"
                initial={{ opacity: 0, y: 0, x: "-50%", scale: 0.4 }}
                animate={reduce ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 0], y: -90, x: `${-50 + (i % 2 ? 60 : -60)}%`, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              >
                <Heart className="size-6 text-rose" />
              </motion.span>
            ))}
          </AnimatePresence>
        </button>
        <p className="mt-4 font-hand text-3xl text-accent">Merhaba {name}</p>
        {message ? (
          <Reveal>
            <p className="prose-letter mx-auto mt-6 max-w-md rounded-3xl bg-accent-wash px-7 py-5 font-display text-2xl leading-snug text-ink">{message}</p>
          </Reveal>
        ) : null}
      </section>

      <section aria-labelledby="theme-title">
        <h2 id="theme-title" className="text-center font-display text-display-sm italic">
          Bu dünyanın rengi
        </h2>
        <p className="mt-2 text-center text-sm text-muted">Yalnızca senin gördüğün hali değişir.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3" role="radiogroup" aria-label="Tema">
          {THEMES.map((theme) => {
            const chosen = prefs.theme === theme.value;
            return (
              <button
                key={theme.value}
                type="button"
                role="radio"
                aria-checked={chosen}
                onClick={() => setPrefs((p) => ({ ...p, theme: theme.value }))}
                className={cn("flex items-center gap-3 rounded-full border py-2 pr-5 pl-2 transition-colors", chosen ? "border-accent bg-pearl shadow-paper" : "border-line-strong hover:border-taupe")}
              >
                <span className="grid size-9 place-items-center rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${theme.swatch[0]} 50%, ${theme.swatch[1]} 50%)` }}>
                  {chosen ? <Check className="size-4 text-pearl drop-shadow" aria-hidden="true" /> : null}
                </span>
                <span className="text-[14px] font-medium text-ink">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="bows-title">
        <h2 id="bows-title" className="text-center font-display text-display-sm italic">
          Fiyonk koleksiyonu
        </h2>
        <p className="mt-2 text-center text-sm text-muted">Birini seç; kedinin fiyonğu da onu takar.</p>
        <ul className="mt-8 grid grid-cols-4 gap-2 sm:gap-4" role="radiogroup" aria-label="Fiyonk">
          {BOWS.map((item, index) => {
            const chosen = prefs.bow === index;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => setPrefs((p) => ({ ...p, bow: index }))}
                  className={cn("paper flex w-full flex-col items-center gap-2 px-1 py-4 transition-[transform,box-shadow,border-color] duration-300 ease-soft hover:-translate-y-1 hover:shadow-lift sm:gap-3 sm:px-4 sm:py-6", chosen && "border-accent ring-2 ring-accent-soft")}
                >
                  <Bow className="w-12 text-ink-soft sm:w-20" style={{ "--bow-fill": item.fill, "--bow-knot": item.knot } as CSSProperties} />
                  <span className="text-[11px] leading-tight font-medium text-ink sm:text-[13px]">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="board-title">
        <h2 id="board-title" className="text-center font-display text-display-sm italic">
          Sticker panosu
        </h2>
        <p className="mt-2 text-center text-sm text-muted">Ekle, sürükle, dilediğin gibi diz. Ok tuşlarıyla da taşıyabilir, Sil ile kaldırabilirsin.</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {STICKER_TYPES.map((type) => (
            <Button key={type} variant="outline" size="sm" onClick={() => addSticker(type)}>
              + {STICKER_LABEL[type]}
            </Button>
          ))}
          {prefs.stickers.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-taupe"
              onClick={() => {
                setPrefs((p) => ({ ...p, stickers: [] }));
                setActive(null);
              }}
            >
              <Trash2 aria-hidden="true" />
              Panoyu temizle
            </Button>
          ) : null}
        </div>

        <div
          ref={board}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragging.current = null)}
          onPointerLeave={() => (dragging.current = null)}
          className="paper paper-grain relative mx-auto mt-6 aspect-[4/5] w-full max-w-3xl touch-none overflow-hidden rounded-3xl select-none sm:aspect-[4/3]"
        >
          {prefs.stickers.length === 0 ? <p className="absolute inset-0 grid place-items-center px-8 text-center text-muted">Pano boş. Yukarıdan bir sticker ekle.</p> : null}
          {prefs.stickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              aria-label={`${STICKER_LABEL[sticker.type]} — taşımak için sürükle ya da ok tuşlarını kullan`}
              onPointerDown={(event) => {
                dragging.current = sticker.id;
                setActive(sticker.id);
                event.currentTarget.focus();
              }}
              onKeyDown={(event) => onKey(event, sticker)}
              onFocus={() => setActive(sticker.id)}
              style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, rotate: `${sticker.rotate}deg` }}
              className={cn("absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-xl p-1 drop-shadow-[0_3px_5px_rgb(74_59_55/0.18)] active:cursor-grabbing", active === sticker.id && "outline-2 outline-offset-4 outline-accent/60 outline-dashed")}
            >
              <StickerArt type={sticker.type} tone={sticker.tone} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
