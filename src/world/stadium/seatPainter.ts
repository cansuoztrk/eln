/**
 * Paints tribune textures pixel by pixel: seat colours (choreography),
 * crowd occupancy and the light-show "tribune lights" glow layer.
 * u = perimeter fraction (0 = centre of the main south stand), v = row (0 front … 1 back).
 */
import type { Choreography } from '@/core/model/design';
import { MIN_SHOW_LEVEL } from '@/core/model/lightshow';

export const SEAT_TEX_W = 1024;
export const SEAT_TEX_H = 64;

export interface SeatPaintParams {
  tier: 'lower' | 'upper';
  choreography: Choreography;
  primary: [number, number, number];
  secondary: [number, number, number];
  /** 0..1 */
  occupancy: number;
  /** 0..1 how strongly the choreography is shown above the crowd (card display) */
  tifo: number;
  time: number;
  show: null | {
    a: [number, number, number];
    b: [number, number, number];
    coverage: number;
    profile: number;
    hz: number;
    level: number;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hash2(x: number, y: number) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

const NEUTRAL: [number, number, number] = [58, 61, 68];
const DARK: [number, number, number] = [28, 31, 38];
const CROWD: [number, number, number][] = [
  [196, 26, 48],
  [232, 176, 44],
  [32, 32, 36],
  [210, 210, 214],
  [150, 22, 36],
  [80, 60, 50],
];

let maskCache: { key: string; data: Uint8ClampedArray } | null = null;

/** Text mask for the "mosaic-2035" choreography, mirrored so it reads from the pitch. */
function textMask(tier: 'lower' | 'upper'): Uint8ClampedArray {
  const key = tier;
  if (maskCache && maskCache.key === key) return maskCache.data;
  const c = document.createElement('canvas');
  c.width = SEAT_TEX_W;
  c.height = SEAT_TEX_H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SEAT_TEX_W, SEAT_TEX_H);
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${Math.round(SEAT_TEX_H * 0.78)}px "Space Grotesk Variable", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = tier === 'lower' ? 'ASLAN' : '2035';
  const draw = (x: number) => {
    ctx.save();
    ctx.translate(x, SEAT_TEX_H / 2 + 2);
    ctx.scale(-1, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  // main stand straddles u = 0 (canvas edges) and opposite stand at u = 0.5
  draw(0);
  draw(SEAT_TEX_W);
  draw(SEAT_TEX_W / 2);
  const data = ctx.getImageData(0, 0, SEAT_TEX_W, SEAT_TEX_H).data;
  maskCache = { key, data };
  return data;
}

function choreoColor(p: SeatPaintParams, u: number, v: number, x: number, y: number, mask: Uint8ClampedArray | null): [number, number, number] {
  switch (p.choreography) {
    case 'none':
      return NEUTRAL;
    case 'stripes':
      return Math.floor(u * 40) % 2 ? p.secondary : p.primary;
    case 'halves':
      return (u + 0.25) % 1 < 0.5 ? p.primary : p.secondary;
    case 'wave': {
      const edge = 0.5 + 0.32 * Math.sin(u * Math.PI * 2 * 4);
      return v < edge ? p.primary : p.secondary;
    }
    case 'stars': {
      const cx = Math.floor(x / 16);
      const cy = Math.floor(y / 16);
      const r = hash2(cx, cy + (p.tier === 'upper' ? 50 : 0));
      if (r > 0.72) {
        const dx = (x % 16) - 8;
        const dy = (y % 16) - 8;
        const ang = Math.atan2(dy, dx);
        const rad = Math.hypot(dx, dy);
        const star = 3 + 2.6 * Math.cos(ang * 5);
        if (rad < star) return p.secondary;
      }
      return DARK;
    }
    case 'mosaic-2035': {
      const m = mask ? mask[(y * SEAT_TEX_W + x) * 4] : 0;
      return m > 128 ? p.secondary : p.primary;
    }
  }
}

function showMix(u: number, t: number, profile: number): number {
  switch (profile) {
    case 0:
      return 0;
    case 1:
      return 0.3;
    case 2: {
      const f = (((u * 2 - t * 0.5) % 1) + 1) % 1;
      return f < 0.3 ? 1 : 0;
    }
    case 3:
      return 0.5 + 0.5 * Math.sin(Math.PI * 2 * (u * 3 - t * 0.5));
    case 4:
      return 0.5;
    default: {
      const f = (((u + t * 0.125) % 1) + 1) % 1;
      return f > 0.5 ? 1 : 0;
    }
  }
}

export function paintSeats(img: ImageData, glow: ImageData, p: SeatPaintParams) {
  const W = SEAT_TEX_W;
  const H = SEAT_TEX_H;
  const d = img.data;
  const g = glow.data;
  const mask = p.choreography === 'mosaic-2035' ? textMask(p.tier) : null;
  const t = p.show ? p.time * p.show.hz : 0;
  const shimmer = Math.floor(p.time * 3);
  for (let y = 0; y < H; y++) {
    // canvas row 0 = top = back rows (v = 1)
    const v = 1 - y / (H - 1);
    const rowShade = 0.86 + 0.14 * ((y % 2) ? 1 : 0.6);
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const i = (y * W + x) * 4;
      let [r, gg, b] = choreoColor(p, u, v, x, y, mask);
      // crowd
      if (p.occupancy > 0) {
        const h = hash2(x, y + (p.tier === 'upper' ? 999 : 0));
        if (h < p.occupancy) {
          const pick = CROWD[Math.floor(hash2(x + shimmer * 0.37, y * 3.1) * CROWD.length)];
          const k = 1 - p.tifo;
          r = r * (1 - k) + pick[0] * k;
          gg = gg * (1 - k) + pick[1] * k;
          b = b * (1 - k) + pick[2] * k;
        }
      }
      d[i] = r * rowShade;
      d[i + 1] = gg * rowShade;
      d[i + 2] = b * rowShade;
      d[i + 3] = 255;
      // glow layer
      let gr = 0;
      let gG = 0;
      let gb = 0;
      if (p.show && p.show.coverage > 0 && (x + y) % 2 === 0) {
        const du = Math.min(u, 1 - u);
        const inside = p.show.coverage >= 0.999 || du < p.show.coverage / 2;
        if (inside) {
          const m = showMix(u, t, p.show.profile);
          let level = p.show.level;
          if (p.show.profile === 1) level *= MIN_SHOW_LEVEL + (1 - MIN_SHOW_LEVEL) * (0.5 + 0.5 * Math.sin(Math.PI * 2 * t));
          if (p.show.profile === 4) level *= 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(Math.PI * 2 * t * (0.5 + 0.5 * hash2(x, y)) + hash2(y, x) * 6.28));
          gr = (p.show.a[0] * (1 - m) + p.show.b[0] * m) * level;
          gG = (p.show.a[1] * (1 - m) + p.show.b[1] * m) * level;
          gb = (p.show.a[2] * (1 - m) + p.show.b[2] * m) * level;
        }
      }
      g[i] = gr;
      g[i + 1] = gG;
      g[i + 2] = gb;
      g[i + 3] = 255;
    }
  }
}
