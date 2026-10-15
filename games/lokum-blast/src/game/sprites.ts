import { Rng } from '../core/rng';
import { alpha, shade, type CellStyle, type Theme } from './themes';

/**
 * Procedural block art. Every cell look is drawn once into an offscreen canvas
 * (per theme, flavor and pixel size) and then blitted, which keeps the game at
 * 60fps on low-end Android phones.
 */
export type Ctx = CanvasRenderingContext2D;

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function sugarDust(ctx: Ctx, x: number, y: number, s: number, seed: number, density = 1): void {
  const rng = new Rng(seed);
  const n = Math.round(s * 0.9 * density);
  for (let i = 0; i < n; i++) {
    const px = x + s * (0.12 + rng.next() * 0.76);
    // more sugar near the top, like a dusted cube
    const py = y + s * (0.1 + Math.pow(rng.next(), 1.8) * 0.78);
    const r = s * (0.012 + rng.next() * 0.022);
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rng.next() * 0.55})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSugar(ctx: Ctx, x: number, y: number, s: number, color: string, seed: number): void {
  const p = s * 0.06;
  const w = s - p * 2;
  const r = s * 0.2;
  // drop shadow / bevel base
  roundRect(ctx, x + p, y + p + s * 0.03, w, w, r);
  ctx.fillStyle = shade(color, -0.45);
  ctx.fill();
  // body
  const g = ctx.createLinearGradient(0, y + p, 0, y + p + w);
  g.addColorStop(0, shade(color, 0.28));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, -0.18));
  roundRect(ctx, x + p, y + p, w, w * 0.96, r);
  ctx.fillStyle = g;
  ctx.fill();
  // sugar cap
  const cap = ctx.createLinearGradient(0, y + p, 0, y + p + w * 0.5);
  cap.addColorStop(0, 'rgba(255,255,255,0.55)');
  cap.addColorStop(1, 'rgba(255,255,255,0)');
  roundRect(ctx, x + p, y + p, w, w * 0.5, r);
  ctx.fillStyle = cap;
  ctx.fill();
  // glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + s * 0.34, y + s * 0.26, s * 0.16, s * 0.07, -0.5, 0, Math.PI * 2);
  ctx.fill();
  sugarDust(ctx, x, y, s, seed);
}

function drawPaw(ctx: Ctx, x: number, y: number, s: number, color: string, seed: number): void {
  drawSugar(ctx, x, y, s, color, seed);
  const cx = x + s / 2;
  const cy = y + s * 0.54;
  ctx.fillStyle = alpha('#000000', 0.16);
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.08, s * 0.15, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes: Array<[number, number]> = [
    [-0.17, -0.08],
    [-0.06, -0.17],
    [0.06, -0.17],
    [0.17, -0.08],
  ];
  for (const [dx, dy] of toes) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * s, cy + dy * s, s * 0.055, s * 0.065, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.03, cy + s * 0.05, s * 0.05, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTile(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  const p = s * 0.05;
  const w = s - p * 2;
  const r = s * 0.12;
  roundRect(ctx, x + p, y + p + s * 0.025, w, w, r);
  ctx.fillStyle = shade(color, -0.5);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + s);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#e6eef7');
  roundRect(ctx, x + p, y + p, w, w * 0.97, r);
  ctx.fillStyle = g;
  ctx.fill();
  // coloured frame
  ctx.lineWidth = s * 0.07;
  ctx.strokeStyle = color;
  roundRect(ctx, x + p + s * 0.06, y + p + s * 0.06, w - s * 0.12, w * 0.97 - s * 0.12, r * 0.6);
  ctx.stroke();
  // Ottoman eight-pointed star (two overlapping squares) with a rosette centre
  const cx = x + s / 2;
  const cy = y + s / 2;
  const rs = s * 0.2;
  ctx.fillStyle = color;
  for (const rot of [0, Math.PI / 4]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillRect(-rs, -rs, rs * 2, rs * 2);
    ctx.restore();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(color, -0.3);
  for (let k = 0; k < 4; k++) {
    const a = (Math.PI / 2) * k;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * s * 0.05, cy + Math.sin(a) * s * 0.05, s * 0.045, s * 0.025, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(x + s * 0.3, y + s * 0.22, s * 0.14, s * 0.05, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawNeon(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  const p = s * 0.1;
  const w = s - p * 2;
  const r = s * 0.16;
  ctx.save();
  const g = ctx.createLinearGradient(0, y + p, 0, y + p + w);
  g.addColorStop(0, alpha(color.startsWith('#') ? color : '#ffffff', 0.35));
  g.addColorStop(1, alpha(color.startsWith('#') ? color : '#ffffff', 0.08));
  roundRect(ctx, x + p, y + p, w, w, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowColor = color;
  ctx.shadowBlur = s * 0.22;
  ctx.lineWidth = s * 0.075;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineWidth = s * 0.025;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  roundRect(ctx, x + p + s * 0.03, y + p + s * 0.03, w - s * 0.06, w - s * 0.06, r * 0.8);
  ctx.stroke();
  ctx.restore();
}

function drawGem(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  const p = s * 0.05;
  const x0 = x + p;
  const y0 = y + p;
  const w = s - p * 2;
  const inset = w * 0.24;
  const facet = (pts: number[], fill: string) => {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const x1 = x0 + w;
  const y1 = y0 + w;
  facet([x0, y0, x1, y0, x1 - inset, y0 + inset, x0 + inset, y0 + inset], shade(color, 0.45));
  facet([x1, y0, x1, y1, x1 - inset, y1 - inset, x1 - inset, y0 + inset], shade(color, -0.1));
  facet([x0, y1, x1, y1, x1 - inset, y1 - inset, x0 + inset, y1 - inset], shade(color, -0.4));
  facet([x0, y0, x0 + inset, y0 + inset, x0 + inset, y1 - inset, x0, y1], shade(color, 0.15));
  const g = ctx.createLinearGradient(x0 + inset, y0 + inset, x1 - inset, y1 - inset);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = g;
  ctx.fillRect(x0 + inset, y0 + inset, w - inset * 2, w - inset * 2);
  ctx.strokeStyle = 'rgba(255,230,150,0.9)';
  ctx.lineWidth = s * 0.03;
  ctx.strokeRect(x0, y0, w, w);
  // sparkle
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  star(ctx, x0 + inset * 1.3, y0 + inset * 1.3, s * 0.08);
}

function drawGlass(ctx: Ctx, x: number, y: number, s: number, color: string, seed: number): void {
  const p = s * 0.05;
  const w = s - p * 2;
  const r = s * 0.1;
  roundRect(ctx, x + p, y + p, w, w, r);
  ctx.fillStyle = '#2a1a0e';
  ctx.fill();
  ctx.save();
  roundRect(ctx, x + p + s * 0.04, y + p + s * 0.04, w - s * 0.08, w - s * 0.08, r * 0.7);
  ctx.clip();
  const rng = new Rng(seed);
  const cx = x + s * (0.4 + rng.next() * 0.2);
  const cy = y + s * (0.4 + rng.next() * 0.2);
  const pts = 7;
  for (let k = 0; k < pts; k++) {
    const a0 = (Math.PI * 2 * k) / pts + rng.next() * 0.3;
    const a1 = (Math.PI * 2 * (k + 1)) / pts + rng.next() * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * s, cy + Math.sin(a0) * s);
    ctx.lineTo(cx + Math.cos(a1) * s, cy + Math.sin(a1) * s);
    ctx.closePath();
    ctx.fillStyle = shade(color, (rng.next() - 0.5) * 0.6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,10,0.85)';
    ctx.lineWidth = s * 0.03;
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(x + s * 0.35, y + s * 0.3, 0, x + s * 0.35, y + s * 0.3, s * 0.6);
  glow.addColorStop(0, 'rgba(255,255,255,0.55)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, s, s);
  ctx.restore();
}

export function star(ctx: Ctx, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.32;
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawCellStyle(ctx: Ctx, style: CellStyle, x: number, y: number, s: number, color: string, seed: number): void {
  switch (style) {
    case 'sugar':
      return drawSugar(ctx, x, y, s, color, seed);
    case 'paw':
      return drawPaw(ctx, x, y, s, color, seed);
    case 'tile':
      return drawTile(ctx, x, y, s, color);
    case 'neon':
      return drawNeon(ctx, x, y, s, color);
    case 'gem':
      return drawGem(ctx, x, y, s, color);
    case 'glass':
      return drawGlass(ctx, x, y, s, color, seed);
  }
}

/** Golden lokum: always gold, regardless of theme, so players learn to spot it. */
function drawGold(ctx: Ctx, x: number, y: number, s: number): void {
  drawSugar(ctx, x, y, s, '#ffc531', 777);
  ctx.strokeStyle = 'rgba(255,248,200,0.95)';
  ctx.lineWidth = s * 0.05;
  roundRect(ctx, x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.77, s * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#fff6c7';
  star(ctx, x + s * 0.5, y + s * 0.5, s * 0.2);
}

/** Emerald embedded in a lokum — the journey "gem" goal. */
function drawGemOverlay(ctx: Ctx, x: number, y: number, s: number): void {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s * 0.26;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, '#b8fff0');
  g.addColorStop(0.5, '#19d3a2');
  g.addColorStop(1, '#047a62');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = s * 0.03;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, cy);
  ctx.lineTo(cx, cy - r * 0.5);
  ctx.lineTo(cx + r * 0.5, cy);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke();
}

/** Wooden crate obstacle; hp 2 adds iron bands that break off on the first hit. */
function drawCrate(ctx: Ctx, x: number, y: number, s: number, hp: number): void {
  const p = s * 0.05;
  const w = s - p * 2;
  roundRect(ctx, x + p, y + p, w, w, s * 0.08);
  const g = ctx.createLinearGradient(0, y, 0, y + s);
  g.addColorStop(0, '#d39a5a');
  g.addColorStop(1, '#a8692f');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#6b3d16';
  ctx.lineWidth = s * 0.06;
  ctx.stroke();
  ctx.lineWidth = s * 0.025;
  for (let k = 1; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(x + p, y + p + (w * k) / 3);
    ctx.lineTo(x + p + w, y + p + (w * k) / 3);
    ctx.stroke();
  }
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x + p + s * 0.08, y + p + s * 0.08);
  ctx.lineTo(x + p + w - s * 0.08, y + p + w - s * 0.08);
  ctx.stroke();
  if (hp >= 2) {
    ctx.fillStyle = '#7d8a99';
    ctx.fillRect(x + p, y + p + w * 0.12, w, s * 0.08);
    ctx.fillRect(x + p, y + p + w * 0.8, w, s * 0.08);
    ctx.fillStyle = '#d7dde5';
    for (const fy of [0.16, 0.84]) {
      for (const fx of [0.15, 0.85]) {
        ctx.beginPath();
        ctx.arc(x + p + w * fx, y + p + w * fy, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export interface SpriteSet {
  size: number;
  flavors: HTMLCanvasElement[];
  gold: HTMLCanvasElement;
  gem: HTMLCanvasElement;
  crate: HTMLCanvasElement[]; // index by hp: [1] plain, [2] iron-banded
  empty: HTMLCanvasElement;
  grey: HTMLCanvasElement;
}

function makeCanvas(px: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  return [c, c.getContext('2d')!];
}

/** Builds every sprite for a theme at the given device-pixel size. */
export function buildSprites(theme: Theme, px: number): SpriteSet {
  const flavors = theme.palette.map((color, i) => {
    const [c, ctx] = makeCanvas(px);
    drawCellStyle(ctx, theme.style, 0, 0, px, color, 1000 + i * 37);
    return c;
  });
  const [gold, gctx] = makeCanvas(px);
  drawGold(gctx, 0, 0, px);
  const [gem, gemCtx] = makeCanvas(px);
  drawGemOverlay(gemCtx, 0, 0, px);
  const crate = [1, 1, 2].map((hp) => {
    const [c, ctx] = makeCanvas(px);
    drawCrate(ctx, 0, 0, px, hp);
    return c;
  });
  const [empty, ectx] = makeCanvas(px);
  roundRect(ectx, px * 0.05, px * 0.05, px * 0.9, px * 0.9, px * 0.18);
  ectx.fillStyle = theme.empty;
  ectx.fill();
  ectx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ectx, px * 0.05, px * 0.05, px * 0.9, px * 0.12, px * 0.06);
  ectx.fill();
  const [grey, grctx] = makeCanvas(px);
  drawSugar(grctx, 0, 0, px, '#6f6a86', 99);
  return { size: px, flavors, gold, gem, crate, empty, grey };
}
