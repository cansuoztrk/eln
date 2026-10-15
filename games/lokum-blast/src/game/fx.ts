/** Lightweight effect primitives: easing, particles, floating text, flyers. */

export const ease = {
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'square' | 'dot' | 'star' | 'chip';
  rot: number;
  vr: number;
  g: number;
  delay: number;
}

export interface Floater {
  text: string;
  x: number;
  y: number;
  t: number;
  dur: number;
  size: number;
  color: string;
  delay: number;
}

export interface Banner {
  text: string;
  sub?: string;
  t: number;
  dur: number;
  hue: 'gold' | 'pink' | 'mint';
}

/** A sprite that flies from the board to a HUD target (coins, goal items). */
export interface Flyer {
  sprite: CanvasImageSource;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  t: number;
  dur: number;
  delay: number;
  size: number;
  done?: () => void;
}

export interface Dying {
  sprite: CanvasImageSource;
  x: number;
  y: number;
  size: number;
  t: number;
  delay: number;
  dur: number;
  rot: number;
}
