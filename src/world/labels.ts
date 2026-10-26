import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

/** Small canvas texture with centred text (used for gate letters, pins, signage). */
export function labelTexture(text: string, opts: { bg?: string; fg?: string; w?: number; h?: number; font?: number } = {}) {
  const key = `${text}|${opts.bg}|${opts.fg}|${opts.w}|${opts.h}|${opts.font}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const w = opts.w ?? 128;
  const h = opts.h ?? 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = opts.bg ?? '#c8102e';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = opts.fg ?? '#ffffff';
  ctx.font = `800 ${opts.font ?? Math.round(h * 0.62)}px "Space Grotesk Variable", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}
