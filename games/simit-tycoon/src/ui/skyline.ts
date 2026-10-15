import type { DistrictDef, Landmark } from '../core/districts';

/**
 * Procedural Istanbul skylines: one per district, each with its own time of
 * day and landmarks (Galata Tower, the Blue Mosque, Hagia Sophia, the
 * Bosphorus Bridge, Maiden's Tower, Balat's coloured houses …).
 * Pure SVG, 400×170 viewBox, drawn behind the HUD.
 */
const BASE = 118;
let sid = 0;

interface Ctx {
  near: string;
  far: string;
  lights: string;
  night: boolean;
}

const minaret = (x: number, h: number, s: number, color: string) =>
  `<rect x="${x - 1.8 * s}" y="${BASE - h}" width="${3.6 * s}" height="${h}" fill="${color}"/><rect x="${x - 2.8 * s}" y="${BASE - h * 0.72}" width="${5.6 * s}" height="${1.8 * s}" fill="${color}"/><path d="M${x - 2 * s} ${BASE - h}L${x} ${BASE - h - 10 * s}L${x + 2 * s} ${BASE - h}z" fill="${color}"/>`;

const dome = (x: number, y: number, r: number, color: string, flat = 1) => `<path d="M${x - r} ${y}A${r} ${r * flat} 0 0 1 ${x + r} ${y}z" fill="${color}"/>`;

function windows(x0: number, x1: number, y: number, c: Ctx, step = 6, w = 2, h = 3): string {
  if (!c.night) return '';
  let out = '';
  let k = 0;
  for (let x = x0; x < x1; x += step) {
    if ((k++ * 7) % 3 !== 0) out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.lights}" opacity=".9"/>`;
  }
  return out;
}

function mosque(x: number, s: number, c: Ctx, color = c.near, minarets: number[] = [-34, 34], minH = 62): string {
  let out = '';
  for (const m of minarets) out += minaret(x + m * s, (Math.abs(m) > 50 ? minH * 0.8 : minH) * s, s, color);
  out += `<rect x="${x - 40 * s}" y="${BASE - 22 * s}" width="${80 * s}" height="${22 * s}" fill="${color}"/>`;
  out += dome(x - 26 * s, BASE - 22 * s, 11 * s, color) + dome(x + 26 * s, BASE - 22 * s, 11 * s, color);
  out += `<rect x="${x - 23 * s}" y="${BASE - 28 * s}" width="${46 * s}" height="${7 * s}" fill="${color}"/>`;
  out += dome(x, BASE - 28 * s, 21 * s, color);
  out += `<rect x="${x - 0.7 * s}" y="${BASE - 57 * s}" width="${1.4 * s}" height="${9 * s}" fill="${color}"/><circle cx="${x}" cy="${BASE - 58 * s}" r="${1.8 * s}" fill="${color}"/>`;
  out += windows(x - 36 * s, x + 36 * s, BASE - 14 * s, c, 7 * s, 2 * s, 4 * s);
  return out;
}

function galata(x: number, s: number, c: Ctx): string {
  const col = c.near;
  let out = `<path d="M${x - 10 * s} ${BASE}L${x - 8.5 * s} ${BASE - 70 * s}h${17 * s}L${x + 10 * s} ${BASE}z" fill="${col}"/>`;
  out += `<rect x="${x - 12 * s}" y="${BASE - 74 * s}" width="${24 * s}" height="${4 * s}" rx="${1 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 9 * s}" y="${BASE - 86 * s}" width="${18 * s}" height="${12 * s}" fill="${col}"/>`;
  out += `<path d="M${x - 10 * s} ${BASE - 86 * s}L${x} ${BASE - 114 * s}L${x + 10 * s} ${BASE - 86 * s}z" fill="${col}"/><rect x="${x - 0.6 * s}" y="${BASE - 121 * s}" width="${1.2 * s}" height="${8 * s}" fill="${col}"/>`;
  const lit = c.night ? c.lights : 'rgba(255,255,255,.35)';
  for (let k = -1; k <= 1; k++) out += `<rect x="${x + k * 5 * s - 1.2 * s}" y="${BASE - 84 * s}" width="${2.4 * s}" height="${6 * s}" rx="${1.2 * s}" fill="${lit}"/>`;
  for (let k = 0; k < 4; k++) out += `<rect x="${x - 1 * s}" y="${BASE - (60 - k * 14) * s}" width="${2 * s}" height="${4 * s}" fill="${lit}" opacity=".8"/>`;
  // Neighbourhood around the tower.
  const houses = [
    [-34, 18, 14],
    [-20, 26, 12],
    [16, 22, 13],
    [30, 16, 15],
  ];
  for (const [dx, h, w] of houses) out += `<rect x="${x + dx * s}" y="${BASE - h * s}" width="${w * s}" height="${h * s}" fill="${col}"/><path d="M${x + dx * s - 1} ${BASE - h * s}l${(w * s) / 2 + 1} ${-5 * s} ${(w * s) / 2 + 1} ${5 * s}z" fill="${col}"/>${windows(x + dx * s + 2, x + (dx + w) * s - 2, BASE - (h - 6) * s, c, 5 * s, 1.6 * s, 2.4 * s)}`;
  return out;
}

function pier(x: number, s: number, c: Ctx): string {
  const col = c.near;
  let out = `<rect x="${x - 34 * s}" y="${BASE - 14 * s}" width="${68 * s}" height="${14 * s}" fill="${col}"/>`;
  out += `<path d="M${x - 37 * s} ${BASE - 14 * s}L${x} ${BASE - 26 * s}L${x + 37 * s} ${BASE - 14 * s}z" fill="${col}"/>`;
  out += `<circle cx="${x}" cy="${BASE - 18 * s}" r="${3.2 * s}" fill="${c.night ? c.lights : '#fff'}" opacity=".85"/>`;
  for (let k = -3; k <= 3; k++) if (k) out += `<path d="M${x + k * 9 * s - 3 * s} ${BASE}v${-6 * s}a${3 * s} ${3 * s} 0 0 1 ${6 * s} 0v${6 * s}z" fill="${c.night ? c.lights : 'rgba(255,255,255,.3)'}" opacity=".8"/>`;
  out += `<rect x="${x + 30 * s}" y="${BASE - 40 * s}" width="${1.2 * s}" height="${26 * s}" fill="${col}"/><path d="M${x + 31 * s} ${BASE - 40 * s}h${10 * s}v${6 * s}h${-10 * s}z" fill="#e63946"/>`;
  return out;
}

function haydarpasa(x: number, s: number, c: Ctx): string {
  const col = c.near;
  let out = `<rect x="${x - 36 * s}" y="${BASE - 30 * s}" width="${72 * s}" height="${30 * s}" fill="${col}"/>`;
  out += `<path d="M${x - 36 * s} ${BASE - 30 * s}L${x} ${BASE - 40 * s}L${x + 36 * s} ${BASE - 30 * s}z" fill="${col}"/>`;
  for (const dx of [-40, 28]) {
    out += `<rect x="${x + dx * s}" y="${BASE - 46 * s}" width="${12 * s}" height="${46 * s}" fill="${col}"/>`;
    out += `<path d="M${x + dx * s - 1.5 * s} ${BASE - 46 * s}L${x + (dx + 6) * s} ${BASE - 62 * s}L${x + (dx + 13.5) * s} ${BASE - 46 * s}z" fill="${col}"/>`;
  }
  const lit = c.night ? c.lights : 'rgba(255,255,255,.28)';
  for (let row = 0; row < 3; row++) for (let k = 0; k < 9; k++) out += `<rect x="${x - 31 * s + k * 7.4 * s}" y="${BASE - (26 - row * 8) * s}" width="${3 * s}" height="${4.4 * s}" fill="${lit}"/>`;
  return out;
}

function maiden(x: number, s: number, c: Ctx): string {
  const col = c.near;
  const y = BASE + 16 * s;
  let out = `<ellipse cx="${x}" cy="${y}" rx="${22 * s}" ry="${4 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 14 * s}" y="${y - 12 * s}" width="${28 * s}" height="${12 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 5 * s}" y="${y - 34 * s}" width="${10 * s}" height="${22 * s}" fill="${col}"/>`;
  out += `<path d="M${x - 6.5 * s} ${y - 34 * s}L${x} ${y - 48 * s}L${x + 6.5 * s} ${y - 34 * s}z" fill="${col}"/><rect x="${x - 0.5 * s}" y="${y - 56 * s}" width="${1 * s}" height="${9 * s}" fill="${col}"/><path d="M${x + 0.5 * s} ${y - 56 * s}h${7 * s}v${4 * s}h${-7 * s}z" fill="#e63946"/>`;
  out += `<rect x="${x - 2 * s}" y="${y - 28 * s}" width="${4 * s}" height="${5 * s}" rx="${2 * s}" fill="${c.night ? c.lights : 'rgba(255,255,255,.4)'}"/>`;
  return out;
}

function houses(x: number, s: number, c: Ctx): string {
  const colors = ['#e76f51', '#f4a261', '#2a9d8f', '#e9c46a', '#8ab17d', '#e07a5f', '#6d597a', '#f28482'];
  const spec = [
    [-60, 28, 14],
    [-46, 34, 13],
    [-33, 26, 12],
    [-21, 36, 14],
    [-7, 30, 12],
    [5, 38, 14],
    [19, 28, 12],
    [31, 33, 14],
    [45, 25, 13],
  ];
  let out = '';
  spec.forEach(([dx, h, w], k) => {
    const color = c.night ? c.near : colors[k % colors.length];
    const x0 = x + dx * s;
    out += `<rect x="${x0}" y="${BASE - h * s}" width="${w * s}" height="${h * s}" fill="${color}"/>`;
    out += `<path d="M${x0 - 1.5 * s} ${BASE - h * s}L${x0 + (w * s) / 2} ${BASE - (h + 7) * s}L${x0 + (w + 1.5) * s} ${BASE - h * s}z" fill="${c.night ? c.near : '#8d3b2c'}"/>`;
    // Bay window (cumba) — the Ottoman house signature.
    out += `<rect x="${x0 + 2 * s}" y="${BASE - (h - 6) * s}" width="${(w - 4) * s}" height="${9 * s}" fill="${color}" stroke="${c.night ? c.near : 'rgba(0,0,0,.18)'}" stroke-width="${0.6 * s}"/>`;
    const lit = c.night ? c.lights : '#fff8e7';
    out += `<rect x="${x0 + 3.5 * s}" y="${BASE - (h - 8) * s}" width="${2.4 * s}" height="${3.4 * s}" fill="${lit}"/><rect x="${x0 + (w - 6) * s}" y="${BASE - (h - 8) * s}" width="${2.4 * s}" height="${3.4 * s}" fill="${lit}"/>`;
    out += `<rect x="${x0 + (w / 2 - 1.5) * s}" y="${BASE - 7 * s}" width="${3 * s}" height="${7 * s}" fill="${c.night ? c.lights : '#5b3a29'}" opacity=".85"/>`;
  });
  return out;
}

function school(x: number, s: number, c: Ctx): string {
  const col = c.night ? c.near : '#a63d40';
  const y = BASE - 14 * s;
  let out = `<path d="M${x - 70 * s} ${BASE}Q${x} ${y - 10 * s} ${x + 70 * s} ${BASE}z" fill="${c.far}"/>`;
  out += `<rect x="${x - 30 * s}" y="${y - 30 * s}" width="${60 * s}" height="${30 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 36 * s}" y="${y - 38 * s}" width="${10 * s}" height="${38 * s}" fill="${col}"/><rect x="${x + 26 * s}" y="${y - 38 * s}" width="${10 * s}" height="${38 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 10 * s}" y="${y - 40 * s}" width="${20 * s}" height="${10 * s}" fill="${col}"/>` + dome(x, y - 40 * s, 10 * s, col);
  out += `<path d="M${x - 37 * s} ${y - 38 * s}h${12 * s}l${-6 * s} ${-6 * s}zM${x + 25 * s} ${y - 38 * s}h${12 * s}l${-6 * s} ${-6 * s}z" fill="${col}"/>`;
  const lit = c.night ? c.lights : 'rgba(255,240,220,.55)';
  for (let row = 0; row < 2; row++) for (let k = 0; k < 7; k++) out += `<rect x="${x - 26 * s + k * 8 * s}" y="${y - (24 - row * 11) * s}" width="${3 * s}" height="${6 * s}" rx="${1.5 * s}" fill="${lit}"/>`;
  return out;
}

function bluemosque(x: number, s: number, c: Ctx): string {
  return mosque(x, s, c, c.near, [-30, 30, -44, 44, -60, 60], 66);
}

function hagia(x: number, s: number, c: Ctx): string {
  const col = c.night ? c.near : '#b9776e';
  let out = '';
  for (const m of [-46, 46, -56, 56]) out += minaret(x + m * s, (Math.abs(m) > 50 ? 50 : 58) * s, s, col);
  out += `<path d="M${x - 44 * s} ${BASE}v${-20 * s}l${8 * s} ${-6 * s}h${72 * s}l${8 * s} ${6 * s}v${20 * s}z" fill="${col}"/>`;
  out += `<rect x="${x - 28 * s}" y="${BASE - 34 * s}" width="${56 * s}" height="${8 * s}" fill="${col}"/>`;
  out += dome(x, BASE - 34 * s, 27 * s, col, 0.62);
  out += dome(x - 31 * s, BASE - 26 * s, 9 * s, col) + dome(x + 31 * s, BASE - 26 * s, 9 * s, col);
  out += `<rect x="${x - 0.7 * s}" y="${BASE - 58 * s}" width="${1.4 * s}" height="${8 * s}" fill="${col}"/>`;
  out += windows(x - 22 * s, x + 22 * s, BASE - 31 * s, c, 4 * s, 1.6 * s, 3 * s);
  return out;
}

function clocktower(x: number, s: number, c: Ctx): string {
  const col = c.night ? c.near : '#e9dcc4';
  let out = `<rect x="${x - 8 * s}" y="${BASE - 34 * s}" width="${16 * s}" height="${34 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 10 * s}" y="${BASE - 36 * s}" width="${20 * s}" height="${3 * s}" fill="${col}"/>`;
  out += `<rect x="${x - 6 * s}" y="${BASE - 56 * s}" width="${12 * s}" height="${20 * s}" fill="${col}"/>`;
  out += `<circle cx="${x}" cy="${BASE - 47 * s}" r="${4.6 * s}" fill="#fff" stroke="${c.near}" stroke-width="${0.8 * s}"/><path d="M${x} ${BASE - 47 * s}v${-3 * s}M${x} ${BASE - 47 * s}h${2.4 * s}" stroke="#333" stroke-width="${0.7 * s}"/>`;
  out += dome(x, BASE - 56 * s, 6 * s, col) + `<rect x="${x - 0.5 * s}" y="${BASE - 68 * s}" width="${1 * s}" height="${7 * s}" fill="${col}"/>`;
  return out;
}

function palace(x: number, s: number, c: Ctx): string {
  const col = c.night ? c.near : '#f1e6d2';
  let out = `<rect x="${x - 62 * s}" y="${BASE - 20 * s}" width="${124 * s}" height="${20 * s}" fill="${col}"/>`;
  out += `<path d="M${x - 16 * s} ${BASE - 20 * s}L${x} ${BASE - 30 * s}L${x + 16 * s} ${BASE - 20 * s}z" fill="${col}"/>`;
  out += `<rect x="${x - 64 * s}" y="${BASE - 22 * s}" width="${128 * s}" height="${2.4 * s}" fill="${c.night ? c.near : '#d8c7a6'}"/>`;
  const lit = c.night ? c.lights : 'rgba(150,120,80,.35)';
  for (let k = 0; k < 24; k++) out += `<rect x="${x - 59 * s + k * 5 * s}" y="${BASE - 16 * s}" width="${2 * s}" height="${9 * s}" rx="${1 * s}" fill="${lit}"/>`;
  return out;
}

function bridge(x: number, s: number, c: Ctx): string {
  const col = c.near;
  const t1 = x - 70 * s;
  const t2 = x + 70 * s;
  const top = BASE - 64 * s;
  const deck = BASE - 16 * s;
  let out = `<rect x="${t1 - 160 * s}" y="${deck}" width="${(t2 - t1) + 320 * s}" height="${3 * s}" fill="${col}"/>`;
  for (const tx of [t1, t2]) out += `<rect x="${tx - 2.6 * s}" y="${top}" width="${2 * s}" height="${BASE - top}" fill="${col}"/><rect x="${tx + 0.6 * s}" y="${top}" width="${2 * s}" height="${BASE - top}" fill="${col}"/><rect x="${tx - 3 * s}" y="${top + 8 * s}" width="${6 * s}" height="${1.6 * s}" fill="${col}"/><rect x="${tx - 3 * s}" y="${top + 26 * s}" width="${6 * s}" height="${1.6 * s}" fill="${col}"/>`;
  const sag = deck - 6 * s;
  out += `<path d="M${t1} ${top}Q${x} ${sag + 12 * s} ${t2} ${top}" fill="none" stroke="${col}" stroke-width="${1.4 * s}"/>`;
  out += `<path d="M${t1} ${top}Q${t1 - 60 * s} ${deck - 18 * s} ${t1 - 150 * s} ${deck}M${t2} ${top}Q${t2 + 60 * s} ${deck - 18 * s} ${t2 + 150 * s} ${deck}" fill="none" stroke="${col}" stroke-width="${1.2 * s}"/>`;
  for (let k = 1; k < 14; k++) {
    const u = k / 14;
    const px = t1 + (t2 - t1) * u;
    const py = (1 - u) * (1 - u) * top + 2 * (1 - u) * u * (sag + 12 * s) + u * u * top;
    out += `<path d="M${px} ${py}V${deck}" stroke="${col}" stroke-width="${0.5 * s}"/>`;
  }
  if (c.night) {
    const cols = ['#7b61ff', '#ff4fd8', '#3fd6c8', '#ffd166'];
    for (let k = 0; k <= 20; k++) {
      const u = k / 20;
      const px = t1 + (t2 - t1) * u;
      const py = (1 - u) * (1 - u) * top + 2 * (1 - u) * u * (sag + 12 * s) + u * u * top;
      out += `<circle cx="${px}" cy="${py}" r="${1.3 * s}" fill="${cols[k % cols.length]}"/>`;
    }
    for (let k = 0; k < 30; k++) out += `<circle cx="${t1 - 140 * s + k * 10 * s}" cy="${deck + 1}" r="${0.9 * s}" fill="${c.lights}"/>`;
  }
  return out;
}

function ortakoy(x: number, s: number, c: Ctx): string {
  const col = c.night ? '#e9e4f5' : '#f6f1e7';
  let out = minaret(x - 20 * s, 46 * s, 0.9 * s, col) + minaret(x + 20 * s, 46 * s, 0.9 * s, col);
  out += `<rect x="${x - 17 * s}" y="${BASE - 22 * s}" width="${34 * s}" height="${22 * s}" fill="${col}"/>`;
  out += dome(x, BASE - 22 * s, 15 * s, col);
  out += `<rect x="${x - 0.6 * s}" y="${BASE - 43 * s}" width="${1.2 * s}" height="${7 * s}" fill="${col}"/>`;
  const lit = c.night ? c.lights : 'rgba(120,110,90,.35)';
  for (let k = 0; k < 4; k++) out += `<rect x="${x - 12 * s + k * 7 * s}" y="${BASE - 17 * s}" width="${3 * s}" height="${8 * s}" rx="${1.5 * s}" fill="${lit}"/>`;
  out += `<rect x="${x - 40 * s}" y="${BASE - 3 * s}" width="${80 * s}" height="${3 * s}" fill="${c.near}"/>`;
  return out;
}

function island(x: number, s: number, c: Ctx): string {
  const hill = c.night ? c.near : '#6a994e';
  const pine = c.night ? c.near : '#386641';
  let out = `<path d="M${x - 110 * s} ${BASE}C${x - 80 * s} ${BASE - 40 * s} ${x - 30 * s} ${BASE - 46 * s} ${x} ${BASE - 30 * s}C${x + 30 * s} ${BASE - 50 * s} ${x + 80 * s} ${BASE - 36 * s} ${x + 110 * s} ${BASE}z" fill="${hill}"/>`;
  const trees = [-84, -70, -58, -40, -24, 14, 30, 48, 66, 82];
  for (const dx of trees) {
    const ty = BASE - (dx < 0 ? 26 + Math.sin(dx) * 6 : 30 + Math.cos(dx) * 6) * s;
    out += `<ellipse cx="${x + dx * s}" cy="${ty}" rx="${7 * s}" ry="${4 * s}" fill="${pine}"/><ellipse cx="${x + dx * s + 4 * s}" cy="${ty - 3 * s}" rx="${5 * s}" ry="${3 * s}" fill="${pine}"/><rect x="${x + dx * s - 0.6 * s}" y="${ty}" width="${1.2 * s}" height="${6 * s}" fill="${pine}"/>`;
  }
  const mansions = [
    [-50, 14, '#fefae0'],
    [-34, 12, '#ffc8dd'],
    [-12, 15, '#bde0fe'],
    [8, 12, '#fefae0'],
    [36, 14, '#ffafcc'],
    [56, 12, '#fefae0'],
  ] as const;
  for (const [dx, w, color] of mansions) {
    const col = c.night ? c.near : color;
    const x0 = x + dx * s;
    out += `<rect x="${x0}" y="${BASE - 14 * s}" width="${w * s}" height="${14 * s}" fill="${col}"/><path d="M${x0 - 1.5 * s} ${BASE - 14 * s}L${x0 + (w * s) / 2} ${BASE - 21 * s}L${x0 + (w + 1.5) * s} ${BASE - 14 * s}z" fill="${c.night ? c.near : '#9c6644'}"/>`;
    out += `<rect x="${x0 + 2.5 * s}" y="${BASE - 10 * s}" width="${2.4 * s}" height="${3.4 * s}" fill="${c.night ? c.lights : '#6c757d'}"/><rect x="${x0 + (w - 5) * s}" y="${BASE - 10 * s}" width="${2.4 * s}" height="${3.4 * s}" fill="${c.night ? c.lights : '#6c757d'}"/>`;
  }
  out += `<rect x="${x - 4 * s}" y="${BASE - 52 * s}" width="${8 * s}" height="${10 * s}" fill="${c.night ? c.near : '#fefae0'}"/>` + dome(x, BASE - 52 * s, 4 * s, c.night ? c.near : '#e63946');
  return out;
}

function lighthouse(x: number, s: number, c: Ctx): string {
  const y = BASE + 6 * s;
  let out = `<ellipse cx="${x}" cy="${y}" rx="${16 * s}" ry="${4 * s}" fill="${c.near}"/>`;
  out += `<path d="M${x - 5 * s} ${y}L${x - 3.6 * s} ${y - 34 * s}h${7.2 * s}L${x + 5 * s} ${y}z" fill="#ffffff"/>`;
  for (let k = 0; k < 3; k++) out += `<path d="M${x - (5 - k * 0.45) * s} ${y - (6 + k * 10) * s}h${(10 - k * 0.9) * s}l${-0.2 * s} ${-4 * s}h${-(9.6 - k * 0.9) * s}z" fill="#e63946"/>`;
  out += `<rect x="${x - 4.4 * s}" y="${y - 41 * s}" width="${8.8 * s}" height="${7 * s}" fill="${c.near}"/><rect x="${x - 3 * s}" y="${y - 40 * s}" width="${6 * s}" height="${5 * s}" fill="#ffe66d"/>`;
  out += `<path d="M${x - 5 * s} ${y - 41 * s}L${x} ${y - 47 * s}L${x + 5 * s} ${y - 41 * s}z" fill="${c.near}"/>`;
  out += `<path class="beam" d="M${x} ${y - 37.5 * s}L${x - 90 * s} ${y - 52 * s}L${x - 90 * s} ${y - 24 * s}z" fill="#fff7b0" opacity=".35"/>`;
  return out;
}

const DRAW: Record<Landmark, (x: number, s: number, c: Ctx) => string> = {
  galata,
  yenicami: (x, s, c) => mosque(x, s, c, c.near, [-34, 34], 56),
  pier,
  haydarpasa,
  maiden,
  houses,
  school,
  bluemosque,
  hagia,
  clocktower,
  palace,
  bridge,
  ortakoy,
  island,
  lighthouse,
};

/** Where each landmark sits for a given layout (x centre, scale). */
const LAYOUTS: Record<string, Array<[number, number]>> = {
  karakoy: [
    [96, 0.82],
    [235, 0.95],
    [330, 0.9],
  ],
  kadikoy: [
    [130, 1.05],
    [300, 1],
  ],
  balat: [
    [110, 0.9],
    [290, 1.05],
  ],
  sultanahmet: [
    [120, 1.05],
    [292, 1.05],
  ],
  besiktas: [
    [140, 1],
    [300, 1.15],
  ],
  galata: [
    [92, 0.72],
    [205, 1.05],
    [330, 0.8],
  ],
  ortakoy: [
    [250, 1.05],
    [128, 1.05],
  ],
  adalar: [
    [180, 1.1],
    [342, 0.95],
  ],
};

export function skylineSVG(def: DistrictDef, className = 'skyline'): string {
  const id = ++sid;
  const night = !!def.night;
  const c: Ctx = { near: def.near, far: def.far, lights: def.lights, night };
  const sunX = night ? 70 : 318;
  const sunY = night ? 38 : 46;
  const layout = LAYOUTS[def.id] ?? [
    [120, 1],
    [290, 1],
  ];
  const landmarks = def.landmarks.map((l, k) => DRAW[l](layout[k]?.[0] ?? 200, layout[k]?.[1] ?? 1, c)).join('');
  // Far shore hills.
  const far = `<path d="M0 ${BASE - 8}C40 ${BASE - 20} 80 ${BASE - 14} 120 ${BASE - 22}S200 ${BASE - 12} 250 ${BASE - 20} 340 ${BASE - 10} 400 ${BASE - 18}V${BASE}H0z" fill="${def.far}"/>`;
  const stars = night
    ? Array.from({ length: 40 }, (_, k) => {
        const x = (k * 97) % 400;
        const y = (k * 53) % 90;
        return `<circle class="star" cx="${x}" cy="${y + 4}" r="${k % 5 === 0 ? 1.3 : 0.8}" fill="#fff" opacity="${0.4 + ((k * 13) % 6) / 10}"/>`;
      }).join('')
    : '';
  const clouds = night
    ? ''
    : `<g class="clouds" fill="#fff" opacity=".85"><g class="cloud c1"><ellipse cx="60" cy="30" rx="22" ry="8"/><ellipse cx="74" cy="25" rx="14" ry="9"/><ellipse cx="48" cy="27" rx="11" ry="7"/></g><g class="cloud c2"><ellipse cx="210" cy="20" rx="18" ry="6"/><ellipse cx="222" cy="16" rx="11" ry="7"/></g><g class="cloud c3"><ellipse cx="370" cy="62" rx="16" ry="5"/><ellipse cx="380" cy="58" rx="9" ry="6"/></g></g>`;
  const sun = night
    ? `<circle cx="${sunX}" cy="${sunY}" r="16" fill="url(#gl${id})"/><circle cx="${sunX}" cy="${sunY}" r="11" fill="${def.sun}"/><circle cx="${sunX + 5}" cy="${sunY - 3}" r="10" fill="${def.sky[0]}"/>`
    : `<circle cx="${sunX}" cy="${sunY}" r="38" fill="url(#gl${id})"/><circle cx="${sunX}" cy="${sunY}" r="15" fill="${def.sun}"/>`;
  const shimmer = Array.from({ length: 9 }, (_, k) => `<rect class="shimmer s${k % 3}" x="${(k * 53) % 380}" y="${BASE + 8 + ((k * 17) % 40)}" width="${18 + ((k * 7) % 22)}" height="1.6" rx=".8" fill="#fff" opacity=".35"/>`).join('');
  const reflect = `<rect x="${sunX - 10}" y="${BASE + 2}" width="20" height="50" fill="${def.sun}" opacity="${night ? 0.18 : 0.28}" filter="url(#bl${id})"/>`;
  const boats = `<g class="boats" fill="${def.near}"><path d="M40 ${BASE + 20}h22l-3 4H43z"/><path d="M50 ${BASE + 20}v-9l6 8z" fill="#fff" opacity=".9"/><path d="M352 ${BASE + 34}h18l-2 3h-14z"/></g>`;
  return `<svg class="${className}" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
<linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${def.sky[0]}"/><stop offset="1" stop-color="${def.sky[1]}"/></linearGradient>
<linearGradient id="wa${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${def.water[0]}"/><stop offset="1" stop-color="${def.water[1]}"/></linearGradient>
<radialGradient id="gl${id}"><stop offset="0" stop-color="${def.sun}" stop-opacity=".9"/><stop offset="1" stop-color="${def.sun}" stop-opacity="0"/></radialGradient>
<filter id="bl${id}"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="400" height="170" fill="url(#sk${id})"/>
${stars}${sun}${clouds}
${far}
<rect y="${BASE}" width="400" height="${170 - BASE}" fill="url(#wa${id})"/>
${reflect}${shimmer}
${landmarks}
${boats}
</svg>`;
}
