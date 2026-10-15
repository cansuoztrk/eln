// Renders the app icon, adaptive-icon layers, splash screens and the Play
// feature graphic from vector sources.
//   node --experimental-strip-types store/icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { logoSVG, tekirSVG } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const font = join(root, 'node_modules/@fontsource/baloo-2/files');
const out = (p) => {
  const f = join(here, 'output', p);
  mkdirSync(dirname(f), { recursive: true });
  return f;
};

const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function cube(x, y, w, h, c1, c2, base, id, rot = 0) {
  const dots = [];
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < Math.round(w / 9); i++) {
    const dx = x + w * (0.1 + rnd() * 0.8);
    const dy = y + h * (0.08 + Math.pow(rnd(), 1.8) * 0.8);
    dots.push(`<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${(w * (0.008 + rnd() * 0.014)).toFixed(1)}" fill="#fff" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}"/>`);
  }
  const r = w * 0.19;
  return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x="${x}" y="${y + h * 0.05}" width="${w}" height="${h}" rx="${r}" fill="${base}"/>
<rect x="${x}" y="${y}" width="${w}" height="${h * 0.96}" rx="${r}" fill="url(#${id})"/>
<rect x="${x}" y="${y}" width="${w}" height="${h * 0.5}" rx="${r}" fill="url(#${id}c)"/>
<ellipse cx="${x + w * 0.3}" cy="${y + h * 0.2}" rx="${w * 0.16}" ry="${h * 0.06}" fill="#fff" opacity=".4" transform="rotate(-20 ${x + w * 0.3} ${y + h * 0.2})"/>
${dots.join('')}</g>`;
}

function paws(scale = 1, ox = 0, oy = 0) {
  const p = (cx) => `<ellipse cx="${cx}" cy="0" rx="58" ry="42" fill="#b9aca1" stroke="#7d7067" stroke-width="5"/><path d="M${cx - 26} -6v14M${cx} -10v16M${cx + 26} -6v14" stroke="#6d6058" stroke-width="6" stroke-linecap="round"/>`;
  return `<g transform="translate(${ox} ${oy}) scale(${scale})">${p(-128)}${p(128)}</g>`;
}

/** The hero composition: Tekir hugging a giant rose lokum. */
function hero(cx, cy, s) {
  // cat head centre maps to (cx, cy - 190*s)
  const catScale = 3.6 * s;
  const tx = cx - 100 * catScale;
  const ty = cy - 190 * s - 98 * catScale;
  const cw = 580 * s;
  const ch = 400 * s;
  return `
${cube(cx - 410 * s, cy + 120 * s, 210 * s, 200 * s, '#c8f27a', '#5fb52d', '#3d7d1a', 'gc', -12)}
${cube(cx + 210 * s, cy + 140 * s, 200 * s, 190 * s, '#fff1a0', '#ffc21a', '#c98a00', 'yc', 10)}
<g transform="translate(${tx} ${ty}) scale(${catScale})">${inner(tekirSVG(200, 'idle', false))}</g>
${cube(cx - cw / 2, cy - 2 * s, cw, ch, '#ffc1da', '#ff4f93', '#b8235c', 'pc')}
${paws(s, cx, cy + 4 * s)}`;
}

function sparkles(list) {
  return list.map(([x, y, r]) => `<path d="M${x} ${y - r}l${r * 0.25} ${r * 0.75} ${r * 0.75} ${r * 0.25}-${r * 0.75} ${r * 0.25}-${r * 0.25} ${r * 0.75}-${r * 0.25}-${r * 0.75}-${r * 0.75}-${r * 0.25} ${r * 0.75}-${r * 0.25}z" fill="#fff"/>`).join('');
}

const BG = `<defs><radialGradient id="bg" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#5a37c4"/><stop offset=".55" stop-color="#2d1c6e"/><stop offset="1" stop-color="#160f38"/></radialGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff6fa5" stop-opacity=".55"/><stop offset="1" stop-color="#ff6fa5" stop-opacity="0"/></radialGradient></defs>`;

const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${BG}
<rect width="1024" height="1024" fill="url(#bg)"/><circle cx="512" cy="600" r="430" fill="url(#glow)"/>
${sparkles([[150, 170, 26], [880, 210, 20], [830, 470, 14], [190, 520, 12], [600, 110, 12]])}
${hero(512, 600, 1)}</svg>`;

const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${hero(512, 590, 0.62)}</svg>`;
const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${BG}<rect width="1024" height="1024" fill="url(#bg)"/><circle cx="512" cy="560" r="400" fill="url(#glow)"/>${sparkles([[220, 230, 22], [800, 250, 18], [780, 760, 14], [250, 780, 12]])}</svg>`;

function splashSVG(size) {
  const s = size / 2732;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${BG}<rect width="${size}" height="${size}" fill="#1a1238"/><circle cx="${size / 2}" cy="${size / 2}" r="${900 * s}" fill="url(#glow)"/>
<g transform="translate(${size / 2 - 520 * s} ${size / 2 - 560 * s}) scale(${3.47 * s})">${inner(logoSVG(300))}</g>
<g transform="translate(${size / 2 - 300 * s} ${size / 2 - 90 * s}) scale(${3 * s})">${inner(tekirSVG(200, 'happy', true))}</g></svg>`;
}

const featureHTML = `<div style="width:1024px;height:500px;position:relative;overflow:hidden;background:radial-gradient(120% 120% at 70% 30%,#5a37c4,#2a1b5c 55%,#120c2c);font-family:'Baloo 2'">
<svg width="1024" height="500" style="position:absolute;inset:0">${sparkles([[80, 70, 14], [520, 60, 10], [960, 420, 12], [430, 450, 9], [980, 80, 10]])}</svg>
<div style="position:absolute;left:46px;top:70px;width:470px">${logoSVG(440)}<div style="color:#fff;font-weight:800;font-size:34px;text-align:center;margin-top:6px;text-shadow:0 3px 0 #1a0f40">Tatlı İstanbul Blok Bulmacası</div></div>
<svg width="560" height="560" viewBox="0 0 1024 1024" style="position:absolute;right:-10px;top:-40px">${hero(512, 600, 0.95)}</svg></div>`;

const fontCSS = `@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-800-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-ext-800-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();

async function render(html, w, h, file, transparent = false) {
  const tmp = join(here, 'output', '.tmp.html');
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}html,body{margin:0;background:${transparent ? 'transparent' : '#000'}}svg{display:block}</style></head><body>${html}</body></html>`);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`file://${tmp}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
}

await render(iconSVG, 1024, 1024, out('icon/app-icon-1024.png'));
await render(fgSVG, 1024, 1024, out('icon/icon-foreground.png'), true);
await render(bgSVG, 1024, 1024, out('icon/icon-background.png'));
await render(splashSVG(2732), 2732, 2732, out('icon/splash-2732.png'));
await render(featureHTML, 1024, 500, out('play/feature-graphic-1024x500.png'));
writeFileSync(out('icon/app-icon.svg'), iconSVG);
await browser.close();
console.log('icons rendered');
