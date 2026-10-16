// Renders the app icon, adaptive-icon layers, splash screens, Play feature
// graphics (TR/EN) and the wordmark from the app's own vector art.
//   node --experimental-strip-types store/icons.mjs
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { VARIETY_BY_ID } from '../src/core/garden.ts';
import { tekirSVG, tulipSVG } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fonts = join(root, 'node_modules/@fontsource');
const out = (p) => {
  const f = join(here, 'output', p);
  mkdirSync(dirname(f), { recursive: true });
  return f;
};
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const V = (id) => VARIETY_BY_ID.get(id);

const DEFS = `<defs>
<radialGradient id="cream" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#fffaf2"/><stop offset=".65" stop-color="#ffeede"/><stop offset="1" stop-color="#ffd6d4"/></radialGradient>
<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9b949"/><stop offset="1" stop-color="#d7263d"/></linearGradient>
</defs>`;

/** One big Istanbul tulip inside a countdown ring: the timer and the garden in one mark. */
function iconArt(withBg = true) {
  const R = 360;
  const C = 2 * Math.PI * R;
  const bg = withBg ? `<rect width="1024" height="1024" fill="url(#cream)"/>` : '';
  const tulip = `<g transform="translate(322 150) scale(3.8)">${inner(tulipSVG(V('istanbul'), { size: 100, seed: 3 }))}</g>`;
  return `${DEFS}${bg}
<circle cx="512" cy="512" r="${R}" fill="none" stroke="#f4dccd" stroke-width="54"/>
<circle cx="512" cy="512" r="${R}" fill="none" stroke="url(#ring)" stroke-width="54" stroke-linecap="round" stroke-dasharray="${(C * 0.72).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 512 512)"/>
<circle cx="${(512 + R * Math.cos(0.72 * 2 * Math.PI - Math.PI / 2)).toFixed(1)}" cy="${(512 + R * Math.sin(0.72 * 2 * Math.PI - Math.PI / 2)).toFixed(1)}" r="40" fill="#fff" stroke="#d7263d" stroke-width="14"/>
${tulip}`;
}

const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${iconArt(true)}</svg>`;
const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g transform="translate(512 512) scale(.64) translate(-512 -512)">${iconArt(false)}</g></svg>`;
const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${DEFS}<rect width="1024" height="1024" fill="url(#cream)"/></svg>`;

function logoSVG(sub, width = 600, dark = false) {
  const h = width * 0.42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 600 252">
<g transform="translate(94 22) scale(.92)">${inner(tulipSVG(V('istanbul'), { size: 100, seed: 2, headOnly: true }))}</g>
<text x="330" y="150" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="150" fill="${dark ? '#fff4ec' : '#2a2320'}">Lale</text>
<text x="300" y="220" text-anchor="middle" font-family="'Baloo 2'" font-weight="700" font-size="30" fill="${dark ? '#ffb3bd' : '#d7263d'}" letter-spacing="1">${sub}</text></svg>`;
}

function splashSVG(size, dark = false) {
  const s = size / 2732;
  const bg = dark ? '#16120f' : '#fbf6ee';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/>
<circle cx="${size / 2}" cy="${size / 2}" r="${760 * s}" fill="${dark ? '#2b1d1d' : '#ffe9e6'}"/>
<g transform="translate(${size / 2 - 600 * s} ${size / 2 - 252 * s}) scale(${2 * s})">${inner(logoSVG('YKS Sayaç &amp; Ders Takibi', 600, dark))}</g></svg>`;
}

/** A strip of planted tulips for the feature graphic. */
function tulipRow(y, size, ids, gap, seed) {
  return ids.map((id, i) => `<g transform="translate(${i * gap + ((i * seed) % 7) * 3} ${y - size * 1.55})">${inner(tulipSVG(V(id), { size, seed: (i + seed) % 13 }))}</g>`).join('');
}

function featureHTML(sub, tagline, pill) {
  const back = ['kirmizi', 'sari', 'pembe', 'gulhane', 'beyaz', 'mor', 'emirgan', 'safran', 'kirmizi', 'leylak', 'sari', 'mercan', 'turuncu', 'pembe'];
  const front = ['istanbul', 'alev', 'laledevri', 'papagan', 'yakut', 'sultan', 'bogaz', 'tekir'];
  return `<div style="width:1024px;height:500px;position:relative;overflow:hidden;font-family:'Baloo 2';background:#fbf6ee">
<svg width="1024" height="500" style="position:absolute;inset:0" viewBox="0 0 1024 500"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd6a5"/><stop offset="1" stop-color="#fff7e8"/></linearGradient></defs>
<rect width="1024" height="500" fill="url(#sky)"/>
<g fill="#c99a8a" opacity=".55" transform="translate(560 0)"><path d="M110 330v-22a40 40 0 0 1 80 0v22z"/><path d="M92 330v-12a22 22 0 0 1 44 0v12zM164 330v-12a22 22 0 0 1 44 0v12z"/><rect x="80" y="266" width="5" height="64"/><path d="M78 268l4.5-16 4.5 16z"/><rect x="215" y="266" width="5" height="64"/><path d="M213 268l4.5-16 4.5 16z"/><path d="M300 330v-40h6v40z"/><path d="M299 292l4-14 4 14z"/></g>
<path d="M0 340 Q256 300 512 330 T1024 320 V500 H0Z" fill="#7cb66b"/><path d="M0 380 Q300 350 600 372 T1024 366 V500 H0Z" fill="#679e5e"/>
<g transform="translate(470 0)">${tulipRow(400, 40, back, 40, 3)}${tulipRow(492, 62, front, 66, 5)}</g>
<g transform="translate(860 300)">${inner(tekirSVG(150, 'happy', 'can'))}</g></svg>
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(251,246,238,.97) 0%,rgba(251,246,238,.9) 40%,rgba(251,246,238,0) 62%)"></div>
<div style="position:absolute;left:34px;top:70px;width:470px;text-align:center">${logoSVG(sub, 470)}
<div style="color:#2a2320;font-weight:800;font-size:27px;line-height:1.15;margin-top:4px">${tagline}</div>
<div style="display:inline-block;margin-top:16px;padding:8px 18px;border-radius:999px;background:#fff;box-shadow:0 6px 18px rgba(60,35,20,.12);font-weight:800;font-size:22px;color:#d7263d">${pill}</div></div>
</div>`;
}

const face = (fam, w, sub) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('file://${fonts}/${fam.toLowerCase().replace(' ', '-')}/files/${fam.toLowerCase().replace(' ', '-')}-${sub}-${w}-normal.woff2') format('woff2')}`;
const fontCSS = [face('Baloo 2', 800, 'latin'), face('Baloo 2', 800, 'latin-ext'), face('Baloo 2', 700, 'latin'), face('Baloo 2', 700, 'latin-ext')].join('');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();

async function render(html, w, h, file, transparent = false) {
  const tmp = join(here, 'output', '.tmp.html');
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}html,body{margin:0;background:${transparent ? 'transparent' : '#fff'}}svg{display:block}</style></head><body>${html}</body></html>`);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`file://${tmp}`);
  await page.evaluate(() => Promise.all([document.fonts.load('800 40px "Baloo 2"'), document.fonts.load('700 40px "Baloo 2"')]).then(() => document.fonts.ready));
  await page.waitForTimeout(150);
  await page.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
}

await render(iconSVG, 1024, 1024, out('icon/app-icon-1024.png'));
await render(iconSVG.replace('width="1024" height="1024"', 'width="512" height="512"'), 512, 512, out('play/play-icon-512.png'));
await render(fgSVG, 1024, 1024, out('icon/icon-foreground.png'), true);
await render(bgSVG, 1024, 1024, out('icon/icon-background.png'));
await render(splashSVG(2732), 2732, 2732, out('icon/splash-2732.png'));
await render(splashSVG(2732, true), 2732, 2732, out('icon/splash-dark-2732.png'));
await render(featureHTML('YKS Sayaç &amp; Ders Takibi', 'Odaklan, laleni büyüt, netini artır.', 'Reklamsız · Hesapsız · Ücretsiz'), 1024, 500, out('play/feature-graphic-tr.png'));
await render(featureHTML('Study Timer &amp; Focus Garden', 'Focus, grow tulips, raise your scores.', 'No ads · No account · Free'), 1024, 500, out('play/feature-graphic-en.png'));
await render(`<div style="padding:10px">${logoSVG('YKS Sayaç &amp; Ders Takibi')}</div>`, 620, 272, out('logo/logo-tr-transparent.png'), true);
await render(`<div style="padding:10px">${logoSVG('Study Timer &amp; Focus Garden')}</div>`, 620, 272, out('logo/logo-en-transparent.png'), true);
writeFileSync(out('icon/app-icon.svg'), iconSVG);

await render(iconSVG.replace('width="1024" height="1024"', 'width="192" height="192"'), 192, 192, join(root, 'public/icon-192.png'));
copyFileSync(out('play/play-icon-512.png'), join(root, 'public/icon-512.png'));
const assets = join(root, 'assets');
mkdirSync(assets, { recursive: true });
copyFileSync(out('icon/app-icon-1024.png'), join(assets, 'icon-only.png'));
copyFileSync(out('icon/icon-foreground.png'), join(assets, 'icon-foreground.png'));
copyFileSync(out('icon/icon-background.png'), join(assets, 'icon-background.png'));
copyFileSync(out('icon/splash-2732.png'), join(assets, 'splash.png'));
copyFileSync(out('icon/splash-dark-2732.png'), join(assets, 'splash-dark.png'));
await browser.close();
console.log('icons rendered');
