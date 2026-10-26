/**
 * Procedural canvas textures (no external image assets).
 */
import * as THREE from 'three';
import { PITCH } from './stadium/geometry';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

/** Pitch with mowing stripes and markings, mapped onto a plane of PITCH size + run-off. */
export function pitchTexture(runoff: number) {
  return cached(`pitch-${runoff}`, () => {
    const W = 1024;
    const L = PITCH.length + runoff * 2;
    const Wd = PITCH.width + runoff * 2;
    const H = Math.round((W * Wd) / L);
    const { c, ctx } = canvas(W, H);
    const sx = W / L;
    const ox = runoff * sx;
    const oy = runoff * sx;
    ctx.fillStyle = '#1d5a2a';
    ctx.fillRect(0, 0, W, H);
    const stripes = 18;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#2a7a39' : '#246d33';
      ctx.fillRect(ox + (i * PITCH.length * sx) / stripes, oy, (PITCH.length * sx) / stripes + 1, PITCH.width * sx);
    }
    const rnd = seeded(7);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},0.035)`;
      ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, 0.12 * sx);
    const X = (m: number) => ox + m * sx;
    const Y = (m: number) => oy + m * sx;
    ctx.strokeRect(X(0), Y(0), PITCH.length * sx, PITCH.width * sx);
    ctx.beginPath();
    ctx.moveTo(X(PITCH.length / 2), Y(0));
    ctx.lineTo(X(PITCH.length / 2), Y(PITCH.width));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(X(PITCH.length / 2), Y(PITCH.width / 2), 9.15 * sx, 0, Math.PI * 2);
    ctx.stroke();
    for (const side of [0, 1]) {
      const x0 = side ? PITCH.length - 16.5 : 0;
      ctx.strokeRect(X(x0), Y(PITCH.width / 2 - 20.16), 16.5 * sx, 40.32 * sx);
      const x1 = side ? PITCH.length - 5.5 : 0;
      ctx.strokeRect(X(x1), Y(PITCH.width / 2 - 9.16), 5.5 * sx, 18.32 * sx);
      ctx.beginPath();
      const px = side ? PITCH.length - 11 : 11;
      ctx.arc(X(px), Y(PITCH.width / 2), 9.15 * sx, side ? Math.PI - 0.93 : -0.93, side ? Math.PI + 0.93 : 0.93);
      ctx.stroke();
    }
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(X(PITCH.length / 2), Y(PITCH.width / 2), 0.3 * sx, 0, Math.PI * 2);
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

/** Repeating seat pattern (one seat per texel block) used as a roughness/bump detail. */
export function seatDetailTexture() {
  return cached('seat-detail', () => {
    const { c, ctx } = canvas(64, 64);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 2; i++) ctx.fillRect(i * 32 + 3, 0, 26, 64);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

/** Window-light texture for distant city towers. */
export function windowsTexture() {
  return cached('windows', () => {
    const { c, ctx } = canvas(128, 256);
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, 128, 256);
    const rnd = seeded(42);
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 16; x++) {
        const lit = rnd();
        if (lit > 0.8) {
          const warm = rnd() > 0.3;
          ctx.fillStyle = warm ? `rgba(255,${190 + rnd() * 50},${110 + rnd() * 60},${0.5 + rnd() * 0.5})` : `rgba(170,200,255,${0.4 + rnd() * 0.5})`;
          ctx.fillRect(x * 8 + 2, y * 4 + 1, 5, 2);
        }
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

/** Surface patterns for the Material Lab (greyscale, used as roughness + bump). */
export function patternTexture(kind: 'brushed' | 'speckle' | 'panel' | 'noise' | 'frit') {
  return cached(`pattern-${kind}`, () => {
    const S = 256;
    const { c, ctx } = canvas(S, S);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(0, 0, S, S);
    const rnd = seeded(kind.length * 977);
    if (kind === 'brushed') {
      for (let i = 0; i < 1400; i++) {
        const y = rnd() * S;
        ctx.strokeStyle = `rgba(${rnd() > 0.5 ? 255 : 40},${rnd() > 0.5 ? 255 : 40},${rnd() > 0.5 ? 255 : 40},0.08)`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(S, y + (rnd() - 0.5) * 2);
        ctx.stroke();
      }
    } else if (kind === 'speckle') {
      for (let i = 0; i < 5000; i++) {
        const g = Math.floor(rnd() * 255);
        ctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
        ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1 + rnd() * 3);
      }
    } else if (kind === 'panel') {
      ctx.strokeStyle = 'rgba(20,20,20,0.9)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * S) / 4);
        ctx.lineTo(S, (i * S) / 4);
        ctx.stroke();
      }
      for (let i = 0; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo((i * S) / 2, 0);
        ctx.lineTo((i * S) / 2, S);
        ctx.stroke();
      }
    } else if (kind === 'noise') {
      for (let i = 0; i < 9000; i++) {
        const g = 80 + Math.floor(rnd() * 120);
        ctx.fillStyle = `rgba(${g},${g},${g},0.35)`;
        ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
      }
      ctx.strokeStyle = 'rgba(40,40,40,0.5)';
      ctx.strokeRect(0, 0, S, S);
    } else if (kind === 'frit') {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        ctx.beginPath();
        ctx.arc(x * 16 + 8, y * 16 + 8, 3 + ((x + y) % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

/** Paved plaza pattern. */
export function pavingTexture(tint: string) {
  return cached(`paving-${tint}`, () => {
    const S = 256;
    const { c, ctx } = canvas(S, S);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 32);
      ctx.lineTo(S, i * 32);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 32 + (i % 2) * 16, 0);
      ctx.lineTo(i * 32 + (i % 2) * 16, S);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
