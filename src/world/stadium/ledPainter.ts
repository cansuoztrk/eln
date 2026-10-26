/**
 * Content for the LED ribbons, perimeter boards and screens. Text content is
 * original project text; no sponsor, broadcast or club-owned material.
 */
import * as THREE from 'three';
import type { LedMode } from '@/core/model/design';

export const LED_W = 2048;
export const LED_H = 64;

export function createLedTexture() {
  const c = document.createElement('canvas');
  c.width = LED_W;
  c.height = LED_H;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return { canvas: c, ctx: c.getContext('2d')!, tex };
}

export function paintLed(ctx: CanvasRenderingContext2D, mode: LedMode, primary: string, secondary: string) {
  const W = LED_W;
  const H = LED_H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, W, H);
  if (mode === 'off') return;
  if (mode === 'colors') {
    const n = 16;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? secondary : primary;
      ctx.fillRect((i * W) / n, 0, W / n + 1, H);
    }
  } else if (mode === 'wave') {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? secondary : primary);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, primary);
    g.addColorStop(1, '#2a0008');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = secondary;
    ctx.font = `800 ${Math.round(H * 0.56)}px "Space Grotesk Variable", Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    const msg =
      mode === 'match'
        ? ['EV SAHİBİ 2 – 1 KONUK', "67'", 'ÖRNEK VERİ', 'ASLAN 2035']
        : ['ASLAN 2035 OMEGA', 'BİR EFSANEYİ İZLEME', 'GELECEĞİNİ TASARLA', 'KONSEPT ÇALIŞMA'];
    let x = 30;
    let i = 0;
    while (x < W) {
      const t = msg[i % msg.length];
      // mirrored so the text reads correctly from inside the bowl
      ctx.save();
      ctx.scale(-1, 1);
      ctx.fillText(t, -x - ctx.measureText(t).width, H / 2 + 2);
      ctx.restore();
      x += ctx.measureText(t).width + 70;
      ctx.fillStyle = i % 2 ? secondary : '#ffffff';
      i++;
    }
  }
}

/** Large end-screen content (512 × 256). */
export function paintScreen(ctx: CanvasRenderingContext2D, primary: string, secondary: string, label: string) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b0d12');
  g.addColorStop(1, '#1b0a10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = primary;
  ctx.fillRect(0, H - 18, W / 2, 18);
  ctx.fillStyle = secondary;
  ctx.fillRect(W / 2, H - 18, W / 2, 18);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 64px "Space Grotesk Variable", Arial, sans-serif`;
  ctx.fillText('ASLAN 2035', W / 2, H / 2 - 6);
  ctx.fillStyle = secondary;
  ctx.font = `600 26px "Space Grotesk Variable", Arial, sans-serif`;
  ctx.fillText(label, W / 2, H / 2 + 40);
}
