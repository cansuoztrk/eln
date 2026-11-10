import type { Star } from "./queries";

export type Placed = Star & { x: number; y: number; z: number; phase: number };

/** A stable number in [0, 1) from a string — the same on every device and every visit. */
export function hash(text: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export const TONE_RGB: Record<Star["tone"], [number, number, number]> = {
  blush: [243, 201, 209],
  rose: [222, 150, 166],
  champagne: [234, 217, 187],
  pearl: [255, 253, 250],
  gold: [226, 196, 138],
};

/**
 * Places the stars on a tilted spiral. Dated things follow the spiral in the
 * order they happened, so the story can be traced outward from its first day;
 * the special days sit on an outer ring; everything else scatters on the disc.
 * Positions depend only on each star's id and its place in the order.
 */
export function placeStars(stars: Star[]): Placed[] {
  const dated = stars.filter((s) => s.date).sort((a, b) => a.date!.localeCompare(b.date!) || a.id.localeCompare(b.id));
  const ring = stars.filter((s) => s.kind === "day");
  const loose = stars.filter((s) => !s.date && s.kind !== "day");
  const placed: Placed[] = [];

  dated.forEach((star, i) => {
    const t = dated.length > 1 ? i / (dated.length - 1) : 0;
    const angle = t * Math.PI * 2 * Math.min(2.4, 0.6 + dated.length / 9) + hash(star.id) * 0.5;
    const radius = 70 + t * 210 + (hash(star.id, 1) - 0.5) * 34;
    placed.push({ ...star, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, y: (hash(star.id, 2) - 0.5) * 46, phase: hash(star.id, 3) * 6.28 });
  });

  ring.forEach((star, i) => {
    const angle = (i / Math.max(1, ring.length)) * Math.PI * 2 + 0.6;
    placed.push({ ...star, x: Math.cos(angle) * 320, z: Math.sin(angle) * 320, y: (hash(star.id, 2) - 0.5) * 30, phase: hash(star.id, 3) * 6.28 });
  });

  loose.forEach((star) => {
    const angle = hash(star.id) * Math.PI * 2;
    const radius = 110 + hash(star.id, 1) * 190;
    placed.push({ ...star, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, y: (hash(star.id, 2) - 0.5) * 60, phase: hash(star.id, 3) * 6.28 });
  });

  return placed;
}

/** The thread of the story: memories joined in the order they happened. */
export function storyPath(placed: Placed[]): [Placed, Placed][] {
  const memories = placed.filter((s) => s.kind === "memory" && s.date).sort((a, b) => a.date!.localeCompare(b.date!));
  return memories.slice(1).map((star, i) => [memories[i], star]);
}
