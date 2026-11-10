"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { List, Minus, Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkle } from "@/components/decor";
import { SmartImage } from "@/components/media/smart-image";
import { EASE_SOFT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { hash, placeStars, storyPath, TONE_RGB, type Placed } from "../layout";
import type { Star } from "../queries";

type View = { yaw: number; pitch: number; zoom: number };
type Screen = { star: Placed; sx: number; sy: number; scale: number; depth: number };

const HOME: View = { yaw: 0.5, pitch: 0.95, zoom: 1 };
const FOCAL = 900;
const CONTROL = "grid size-11 place-items-center rounded-full bg-pearl/10 text-pearl backdrop-blur transition-colors hover:bg-pearl/20";
const KIND_LABEL: Record<Star["kind"], string> = { memory: "Anı", letter: "Mektup", sealed: "Mühürlü mektup", day: "Özel gün" };

/**
 * The Memory Universe: every memory, letter and special day as a star on a
 * slowly turning spiral. Drawn on a plain canvas with its own small 3D
 * projection, so it turns, tilts and zooms on a phone as smoothly as on a
 * desk — and loads no 3D engine to do it. A list of the same stars is always
 * one button away for keyboards and screen readers.
 */
export function Universe({ stars }: { stars: Star[] }) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = useRef<View>({ ...HOME });
  const target = useRef<View>({ ...HOME });
  const screen = useRef<Screen[]>([]);
  const hover = useRef<string | null>(null);
  const idleSince = useRef(0);
  const burst = useRef<{ id: string; at: number } | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const selectedRef = useRef<string | null>(null);

  const placed = useMemo(() => placeStars(stars), [stars]);
  const path = useMemo(() => storyPath(placed), [placed]);
  const selected = placed.find((s) => s.id === selectedId) ?? null;

  const select = useCallback(
    (id: string | null) => {
      selectedRef.current = id;
      setSelectedId(id);
      if (!id) return;
      burst.current = { id, at: performance.now() };
      const star = placed.find((s) => s.id === id);
      if (star) {
        // Turn the galaxy so the chosen star comes to the front.
        target.current = { ...target.current, yaw: Math.atan2(star.x, star.z) + Math.PI, zoom: Math.max(target.current.zoom, 1.45) };
        // Take the short way round.
        const delta = target.current.yaw - view.current.yaw;
        target.current.yaw = view.current.yaw + Math.atan2(Math.sin(delta), Math.cos(delta));
      }
    },
    [placed],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const small = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;

    // Dust: the quiet stars behind the ones that mean something.
    const dust = Array.from({ length: small ? 170 : 420 }, (_, i) => {
      const a = hash(`d${i}`) * Math.PI * 2;
      const arm = Math.floor(hash(`d${i}`, 5) * 3) * ((Math.PI * 2) / 3);
      const r = 30 + Math.pow(hash(`d${i}`, 1), 0.7) * 430;
      const swirl = r * 0.011 + arm + (hash(`d${i}`, 6) - 0.5) * 0.9;
      const spiral = hash(`d${i}`, 7) > 0.35;
      const angle = spiral ? swirl : a;
      return { x: Math.cos(angle) * r, z: Math.sin(angle) * r, y: (hash(`d${i}`, 2) - 0.5) * (90 - r * 0.12), s: 0.5 + hash(`d${i}`, 3) * 1.1, p: hash(`d${i}`, 4) * 6.28, c: i % 5 };
    });
    const dustTint = ["255,253,250", "234,217,187", "243,201,209", "255,253,250", "222,150,166"];
    const clouds = [
      { x: 0, z: 0, y: 0, r: 190, c: "243,201,209", a: 0.16 },
      { x: 170, z: -90, y: 10, r: 150, c: "185,138,120", a: 0.1 },
      { x: -190, z: 120, y: -10, r: 170, c: "156,85,101", a: 0.12 },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (x: number, y: number, z: number, v: View) => {
      const cy = Math.cos(v.yaw);
      const sy = Math.sin(v.yaw);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const cp = Math.cos(v.pitch);
      const sp = Math.sin(v.pitch);
      const y2 = y * sp - z1 * cp;
      const z2 = y * cp + z1 * sp;
      const fit = Math.min(width, height) / 760;
      const scale = (FOCAL / (FOCAL + z2)) * v.zoom * fit;
      return { sx: width / 2 + x1 * scale, sy: height / 2 - y2 * scale * 0.92, scale, depth: z2 };
    };

    const draw = (time: number) => {
      const v = view.current;
      const t = target.current;
      // Ease toward where the person asked to look.
      v.yaw += (t.yaw - v.yaw) * 0.08;
      v.pitch += (t.pitch - v.pitch) * 0.08;
      v.zoom += (t.zoom - v.zoom) * 0.08;
      // Left alone, the galaxy turns very slowly.
      if (!reduce && !selectedRef.current && time - idleSince.current > 2500) t.yaw += 0.00045;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const cloud of clouds) {
        const p = project(cloud.x, cloud.y, cloud.z, v);
        const r = cloud.r * p.scale;
        const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r);
        g.addColorStop(0, `rgba(${cloud.c},${cloud.a})`);
        g.addColorStop(1, `rgba(${cloud.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p.sx, p.sy, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const d of dust) {
        const p = project(d.x, d.y, d.z, v);
        const twinkle = reduce ? 0.8 : 0.6 + 0.4 * Math.sin(time / 1300 + d.p);
        ctx.fillStyle = `rgba(${dustTint[d.c]},${(0.5 * twinkle * Math.min(1, p.scale * 1.2)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(0.4, d.s * p.scale), 0, Math.PI * 2);
        ctx.fill();
      }

      const projected: Screen[] = placed.map((star) => ({ star, ...project(star.x, star.y, star.z, v) }));
      const at = new Map(projected.map((p) => [p.star.id, p]));

      // The thread of the story, from its first day outward.
      ctx.lineWidth = 1;
      for (const [a, b] of path) {
        const pa = at.get(a.id)!;
        const pb = at.get(b.id)!;
        const g = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
        g.addColorStop(0, "rgba(234,217,187,0.05)");
        g.addColorStop(0.5, "rgba(243,201,209,0.38)");
        g.addColorStop(1, "rgba(234,217,187,0.05)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.stroke();
      }

      projected.sort((a, b) => b.depth - a.depth);
      for (const p of projected) {
        const { star } = p;
        const [r, g, b] = TONE_RGB[star.tone];
        const active = star.id === selectedRef.current || star.id === hover.current;
        const pulse = reduce ? 1 : 0.86 + 0.14 * Math.sin(time / 900 + star.phase);
        const core = (2.2 + star.size * 1.5) * p.scale * (active ? 1.35 : 1);
        const glow = core * (star.kind === "sealed" ? 3.2 : 5.2) * pulse;

        const halo = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glow);
        halo.addColorStop(0, `rgba(${r},${g},${b},${active ? 0.75 : 0.5})`);
        halo.addColorStop(0.35, `rgba(${r},${g},${b},0.16)`);
        halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, glow, 0, Math.PI * 2);
        ctx.fill();

        if (star.kind === "sealed") {
          ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, core, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // A four-point sparkle for the big ones, a round star for the rest.
          ctx.fillStyle = `rgba(${Math.min(255, r + 14)},${Math.min(255, g + 14)},${Math.min(255, b + 14)},1)`;
          ctx.beginPath();
          if (star.size >= 4) {
            const len = core * 2.4;
            const w = core * 0.34;
            ctx.moveTo(p.sx, p.sy - len);
            ctx.quadraticCurveTo(p.sx + w, p.sy - w, p.sx + len, p.sy);
            ctx.quadraticCurveTo(p.sx + w, p.sy + w, p.sx, p.sy + len);
            ctx.quadraticCurveTo(p.sx - w, p.sy + w, p.sx - len, p.sy);
            ctx.quadraticCurveTo(p.sx - w, p.sy - w, p.sx, p.sy - len);
          } else {
            ctx.arc(p.sx, p.sy, core, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }

      // Opening a star: a ring of light leaves it.
      if (burst.current) {
        const age = (time - burst.current.at) / 900;
        const p = at.get(burst.current.id);
        if (age >= 1 || !p) burst.current = null;
        else if (!reduce) {
          ctx.strokeStyle = `rgba(255,253,250,${(0.7 * (1 - age)).toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 8 + age * 90, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Names: always for the one in focus, and for the brightest once you lean in.
      ctx.globalCompositeOperation = "source-over";
      ctx.textAlign = "center";
      for (const p of projected) {
        const active = p.star.id === selectedRef.current || p.star.id === hover.current;
        if (!active && !(p.star.size >= 4 && v.zoom > 0.85) && !(v.zoom > 1.7)) continue;
        const offset = (2.2 + p.star.size * 1.5) * p.scale * 2.6 + 14;
        ctx.font = `italic ${active ? 500 : 400} ${active ? 19 : 15}px "Cormorant Garamond Variable", Georgia, serif`;
        ctx.fillStyle = `rgba(255,253,250,${active ? 0.98 : 0.72})`;
        ctx.fillText(p.star.title.length > 34 ? `${p.star.title.slice(0, 33)}…` : p.star.title, p.sx, p.sy + offset);
      }

      screen.current = projected;
    };

    const loop = (time: number) => {
      if (!running) return;
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    const startLoop = () => {
      cancelAnimationFrame(frame);
      running = !document.hidden;
      if (running) frame = requestAnimationFrame(loop);
    };

    resize();
    startLoop();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", startLoop);
    // The names are drawn in the page's own fonts; redraw once they are ready.
    void document.fonts?.ready.then(resize);

    // --- pointer: drag to turn, pinch or wheel to zoom, tap a star to open it ---
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinch = 0;

    const nearest = (x: number, y: number) => {
      let best: Screen | null = null;
      let bestDistance = small ? 34 : 26;
      for (const p of screen.current) {
        const d = Math.hypot(p.sx - x, p.sy - y);
        if (d < bestDistance) {
          best = p;
          bestDistance = d;
        }
      }
      return best;
    };
    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const down = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const move = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        const hit = nearest(local(event).x, local(event).y);
        hover.current = hit?.star.id ?? null;
        canvas.style.cursor = hit ? "pointer" : "grab";
        return;
      }
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      idleSince.current = performance.now();
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) target.current.zoom = Math.min(3, Math.max(0.6, target.current.zoom * (distance / pinch)));
        pinch = distance;
        moved += 10;
        return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      target.current.yaw += dx * 0.006;
      target.current.pitch = Math.min(1.45, Math.max(0.35, target.current.pitch + dy * 0.004));
    };
    const up = (event: PointerEvent) => {
      const wasTap = pointers.size === 1 && moved < 8;
      pointers.delete(event.pointerId);
      pinch = 0;
      if (wasTap) {
        const hit = nearest(local(event).x, local(event).y);
        select(hit ? hit.star.id : null);
      }
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      idleSince.current = performance.now();
      target.current.zoom = Math.min(3, Math.max(0.6, target.current.zoom * (event.deltaY > 0 ? 0.92 : 1.08)));
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", startLoop);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [placed, path, reduce, select]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedRef.current) select(null);
      else setListOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  const zoomBy = (factor: number) => {
    idleSince.current = performance.now();
    target.current.zoom = Math.min(3, Math.max(0.6, target.current.zoom * factor));
  };
  const reset = () => {
    select(null);
    target.current = { ...HOME, yaw: view.current.yaw };
  };

  const clusters = useMemo(() => {
    const groups = new Map<string, Placed[]>();
    for (const star of placed) groups.set(star.clusterLabel, [...(groups.get(star.clusterLabel) ?? []), star]);
    return [...groups.entries()];
  }, [placed]);

  return (
    <div className="dusk fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full touch-none select-none"
        style={{ cursor: "grab" }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-20 px-5 text-center md:top-24">
        <p className="eyebrow">The Memory Universe</p>
        <h1 className="mt-2 font-display text-4xl text-pearl italic md:text-5xl">Anı Evreni</h1>
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-pearl/60">
          {placed.length === 0 ? "Henüz bir yıldız yok." : "Sürükleyerek çevir, yakınlaş, bir yıldıza dokun."}
        </p>
      </div>

      <div className="safe-bottom absolute bottom-24 left-4 flex flex-col gap-2 md:bottom-8 md:left-8">
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Yakınlaş" title="Yakınlaş" className={CONTROL}>
          <Plus className="size-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => zoomBy(0.8)} aria-label="Uzaklaş" title="Uzaklaş" className={CONTROL}>
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={reset} aria-label="Görünümü sıfırla" title="Görünümü sıfırla" className={CONTROL}>
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setListOpen(true)}
        aria-haspopup="dialog"
        className="safe-bottom absolute right-4 bottom-24 inline-flex h-11 items-center gap-2 rounded-full bg-pearl/10 px-5 text-[13px] font-medium text-pearl backdrop-blur transition-colors hover:bg-pearl/20 md:right-8 md:bottom-8"
      >
        <List className="size-4" aria-hidden="true" />
        Yıldız listesi ({placed.length})
      </button>

      <AnimatePresence>
        {selected ? (
          <motion.aside
            key={selected.id}
            role="dialog"
            aria-label={selected.title}
            initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: reduce ? 0.2 : 0.6, ease: EASE_SOFT }}
            className="safe-bottom absolute inset-x-3 bottom-20 z-10 max-h-[62dvh] overflow-y-auto rounded-3xl border border-pearl/15 bg-night/85 p-6 text-pearl shadow-lift backdrop-blur-md md:inset-x-auto md:top-28 md:right-8 md:bottom-auto md:w-[24rem]"
          >
            <button type="button" onClick={() => select(null)} aria-label="Kapat" className="absolute top-3 right-3 grid size-9 place-items-center rounded-full text-pearl/70 hover:bg-pearl/10 hover:text-pearl">
              <X className="size-4" aria-hidden="true" />
            </button>
            <p className="eyebrow flex items-center gap-2">
              <Sparkle className="size-2.5" style={{ color: `rgb(${TONE_RGB[selected.tone].join(",")})` }} />
              {KIND_LABEL[selected.kind]} · {selected.clusterLabel}
            </p>
            <h2 className="mt-3 pr-6 font-display text-3xl leading-tight text-pearl">{selected.title}</h2>
            {selected.dateLabel ? <p className="mt-1.5 font-display text-lg text-champagne italic">{selected.dateLabel}</p> : null}
            {selected.image ? (
              <SmartImage image={selected.image} alt={selected.imageAlt} sizes="24rem" className="mt-4 max-h-56 rounded-xl" fit="cover" />
            ) : null}
            {selected.text ? <p className="mt-4 text-[15px] leading-relaxed text-pearl/80">{selected.text}</p> : null}
            {selected.href ? (
              <Button asChild variant="light" className="mt-5">
                <Link href={selected.href}>{selected.action}</Link>
              </Button>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {listOpen ? (
        <div role="dialog" aria-modal="true" aria-label="Yıldız listesi" className="absolute inset-0 z-20 overflow-y-auto bg-night/92 backdrop-blur-md">
          <div className="shell-narrow py-24">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-4xl text-pearl italic">Bütün yıldızlar</h2>
              <button type="button" autoFocus onClick={() => setListOpen(false)} aria-label="Listeyi kapat" className="grid size-11 place-items-center rounded-full bg-pearl/10 text-pearl hover:bg-pearl/20">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            {clusters.length === 0 ? <p className="text-pearl/70">Henüz bir yıldız yok.</p> : null}
            {clusters.map(([label, group]) => (
              <section key={label} className="mb-8">
                <h3 className="eyebrow mb-2">{label}</h3>
                <ul className="divide-y divide-pearl/10 border-y border-pearl/10">
                  {group.map((star) => (
                    <li key={star.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setListOpen(false);
                          select(star.id);
                        }}
                        className={cn("flex w-full items-baseline justify-between gap-4 py-3.5 text-left transition-colors hover:text-powder", star.id === selectedId ? "text-powder" : "text-pearl")}
                      >
                        <span className="font-display text-2xl">{star.title}</span>
                        <span className="shrink-0 text-[13px] text-pearl/55">{star.dateLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
