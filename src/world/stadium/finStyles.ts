/**
 * Facade fin articulation per visual language, shared by the 3D facade and
 * the 2D plan so both draw the same fins. Free of three.js.
 */
import type { VisualLanguage } from '@/core/model/design';

export interface FinStyle {
  /** share of the fin slots used (rhythm) */
  density: number;
  /** thickness along the facade, m */
  width: number;
  /** outward lean, rad */
  tilt: number;
  /** radial depth at perimeter fraction s, m */
  depth: (s: number) => number;
  /** louvre angle about the vertical axis, rad */
  yaw: (s: number) => number;
  /** how far the fin top stays below the facade edge, m */
  drop: (s: number) => number;
}

/** fins start this far outside the facade line (negative: just inside the skin) */
export const FIN_INNER_OFFSET = -0.4;

const wave = (s: number, n: number, phase = 0) => 0.5 + 0.5 * Math.sin(s * Math.PI * 2 * n + phase);

/** Heritage keeps today's regular vertical rhythm; the other languages articulate it. */
export const FIN_STYLES: Record<VisualLanguage, FinStyle> = {
  heritage: { density: 1, width: 0.55, tilt: 0.045, depth: () => 2.6, yaw: () => 0, drop: () => 0 },
  minimal: { density: 0.5, width: 0.3, tilt: 0, depth: () => 1.1, yaw: () => 0, drop: () => 0 },
  iconic: { density: 1, width: 0.5, tilt: 0.045, depth: () => 3.4, yaw: () => 0.62, drop: () => 0 },
  futurist: { density: 1, width: 0.42, tilt: 0.03, depth: () => 3, yaw: (s) => 0.75 * Math.sin(s * Math.PI * 2 * 6), drop: () => 0 },
  organic: { density: 1, width: 0.55, tilt: 0.045, depth: (s) => 2.2 + 1.2 * wave(s, 5), yaw: (s) => 0.2 * Math.sin(s * Math.PI * 2 * 5 + 1.2), drop: (s) => 7 * wave(s, 5) },
};

export interface Fin {
  s: number;
  depth: number;
  width: number;
  yaw: number;
  tilt: number;
  drop: number;
}

/** The fins of a language around the facade; `slots` is the full-density count. */
export function finLayout(language: VisualLanguage, slots: number): Fin[] {
  const style = FIN_STYLES[language];
  const count = Math.round(slots * style.density);
  const fins: Fin[] = [];
  for (let i = 0; i < count; i++) {
    const s = (i + 0.5) / count;
    fins.push({ s, depth: style.depth(s), width: style.width, yaw: style.yaw(s), tilt: style.tilt, drop: style.drop(s) });
  }
  return fins;
}
