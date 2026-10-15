// Renders the app icon, adaptive-icon layers, splash screens, the Play
// feature graphic and the logo from the game's own vector art.
//   node --experimental-strip-types store/icons.mjs
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { catSVG, foodSVG, seagullSVG, tekirSVG } from '../src/ui/art.ts';
import { logoSVG } from '../src/ui/logo.ts';
import { skylineSVG } from '../src/ui/skyline.ts';
import { DISTRICTS } from '../src/core/districts.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const font = join(root, 'node_modules/@fontsource/baloo-2/files');
const out = (p) => {
  const f = join(here, 'output', p);
  mkdirSync(dirname(f), { recursive: true });
  return f;
};
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** A big glossy simit ring. */
function bigSimit(cx, cy, r, id) {
  const seeds = [];
  let s = 5;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 60; k++) {
    const a = rnd() * Math.PI * 2;
    const rr = r * (0.56 + rnd() * 0.36);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.96;
    seeds.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.035).toFixed(1)}" ry="${(r * 0.02).toFixed(1)}" fill="#fff4d6" transform="rotate(${Math.round(rnd() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  }
  const twist = Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r * 0.48;
    const y1 = cy + Math.sin(a) * r * 0.48;
    const x2 = cx + Math.cos(a + 0.35) * r * 0.96;
    const y2 = cy + Math.sin(a + 0.35) * r * 0.96;
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}Q${(cx + Math.cos(a + 0.05) * r * 0.8).toFixed(1)} ${(cy + Math.sin(a + 0.05) * r * 0.8).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#a5561a" stroke-width="${(r * 0.035).toFixed(1)}" fill="none" opacity=".5" stroke-linecap="round"/>`;
  }).join('');
  return `<defs><radialGradient id="${id}" cx=".42" cy=".34" r=".8"><stop offset="0" stop-color="#ffd59a"/><stop offset=".5" stop-color="#e6923f"/><stop offset="1" stop-color="#9c4f15"/></radialGradient>
<mask id="${id}m"><rect x="0" y="0" width="4000" height="4000" fill="#fff"/><ellipse cx="${cx}" cy="${cy}" rx="${r * 0.4}" ry="${r * 0.38}" fill="#000"/></mask></defs>
<ellipse cx="${cx}" cy="${cy + r * 0.1}" rx="${r * 1.02}" ry="${r * 0.98}" fill="#5a2d0c" opacity=".45" mask="url(#${id}m)"/>
<g mask="url(#${id}m)"><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.96}" fill="url(#${id})" stroke="#7a3d0c" stroke-width="${r * 0.04}"/>${twist}${seeds.join('')}
<path d="M${cx - r * 0.7} ${cy - r * 0.45}a${r * 0.86} ${r * 0.86} 0 0 1 ${r * 0.9} -${r * 0.42}" stroke="#ffe8bf" stroke-width="${r * 0.07}" fill="none" stroke-linecap="round" opacity=".75"/></g>`;
}

const SKY = `<defs><linearGradient id="isky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5c"/><stop offset=".55" stop-color="#ffcf8a"/><stop offset="1" stop-color="#ffe9c4"/></linearGradient>
<radialGradient id="isun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient></defs>`;

/** Icon: Tekir peeking through a giant simit over an Istanbul sunset. */
function iconArt(withBg = true) {
  const galata = `<g fill="#3d5a80" opacity=".9"><path d="M168 780l10-260h44l10 260z"/><rect x="160" y="500" width="80" height="22" rx="4"/><rect x="172" y="452" width="56" height="50"/><path d="M164 452L200 340l36 112z"/></g>
<g fill="#3d5a80" opacity=".9"><path d="M700 780V640h240v140z"/><path d="M712 640a108 108 0 0 1 216 0z"/><rect x="690" y="560" width="14" height="220"/><path d="M690 560l7-46 7 46z"/><rect x="936" y="560" width="14" height="220"/><path d="M936 560l7-46 7 46z"/></g>`;
  const bg = withBg
    ? `${SKY}<rect width="1024" height="1024" fill="url(#isky)"/><circle cx="512" cy="430" r="420" fill="url(#isun)"/>${galata}<rect y="780" width="1024" height="244" fill="#2f7fb0"/><rect y="780" width="1024" height="20" fill="#5fa8d3"/><g fill="#fff" opacity=".35"><rect x="80" y="840" width="160" height="8" rx="4"/><rect x="620" y="880" width="220" height="8" rx="4"/><rect x="300" y="940" width="140" height="8" rx="4"/></g>`
    : '';
  // Tekir's head sits inside the ring's hole; paws hold the ring.
  const cat = `<g transform="translate(286 196) scale(2.26)">${inner(tekirSVG(200, 'happy')).replace(/<g transform="translate\(64 138\)">[\s\S]*?<\/g>\s*<ellipse cx="66"[\s\S]*$/, '')}</g>`;
  return `${bg}
${bigSimit(512, 600, 330, 'ring')}
${cat}
<g transform="translate(0 0)"><ellipse cx="318" cy="742" rx="62" ry="48" fill="#b9aca1" stroke="#7d7067" stroke-width="6"/><ellipse cx="706" cy="742" rx="62" ry="48" fill="#b9aca1" stroke="#7d7067" stroke-width="6"/><path d="M290 734v18M318 728v22M346 734v18M678 734v18M706 728v22M734 734v18" stroke="#6d6058" stroke-width="7" stroke-linecap="round"/></g>`;
}

const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${iconArt(true)}</svg>`;
const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g transform="translate(512 540) scale(.64) translate(-512 -560)">${iconArt(false)}</g></svg>`;
const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${SKY}<rect width="1024" height="1024" fill="url(#isky)"/><circle cx="512" cy="460" r="420" fill="url(#isun)"/><rect y="800" width="1024" height="224" fill="#2f7fb0"/></svg>`;

function splashSVG(size, dark = false) {
  const s = size / 2732;
  const bg = dark ? '#0b2537' : '#0f3550';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/>
<circle cx="${size / 2}" cy="${size / 2}" r="${900 * s}" fill="#164a6e" opacity=".55"/>
<g transform="translate(${size / 2 - 640 * s} ${size / 2 - 700 * s}) scale(${4 * s})">${inner(logoSVG(320))}</g>
<g transform="translate(${size / 2 - 330 * s} ${size / 2 + 20 * s}) scale(${3.3 * s})">${inner(tekirSVG(200, 'happy'))}</g></svg>`;
}

const sky = skylineSVG(DISTRICTS[0]);
const featureHTML = `<div style="width:1024px;height:500px;position:relative;overflow:hidden;font-family:'Baloo 2';background:#0f3550">
<div style="position:absolute;inset:0">${sky.replace('<svg ', '<svg style="width:1024px;height:500px" ')}</div>
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,53,80,.92) 0%,rgba(15,53,80,.75) 42%,rgba(15,53,80,0) 70%)"></div>
<div style="position:absolute;left:40px;top:44px;width:470px;text-align:center">${logoSVG(420)}<div style="color:#fff;font-weight:800;font-size:32px;margin-top:2px;text-shadow:0 3px 0 #06202f">Idle Cat Café · İstanbul</div></div>
<div style="position:absolute;right:250px;bottom:30px">${catSVG(6, 150, 'happy')}</div>
<div style="position:absolute;right:120px;bottom:12px">${catSVG(9, 170, 'happy')}</div>
<div style="position:absolute;right:10px;bottom:36px">${catSVG(1, 130, 'happy')}</div>
<div style="position:absolute;right:390px;bottom:24px">${foodSVG('simit', 110)}</div>
<div style="position:absolute;right:300px;top:40px">${foodSVG('cay', 96)}</div>
<div style="position:absolute;right:60px;top:60px;transform:rotate(-8deg)">${seagullSVG(120)}</div>
</div>`;

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
await render(splashSVG(2732, true), 2732, 2732, out('icon/splash-dark-2732.png'));
await render(featureHTML, 1024, 500, out('play/feature-graphic-1024x500.png'));
await render(`<div style="background:#fff6e6;padding:10px">${logoSVG(600)}</div>`, 620, 340, out('logo/logo-600.png'));
await render(`<div style="padding:10px">${logoSVG(600)}</div>`, 620, 340, out('logo/logo-600-transparent.png'), true);
writeFileSync(out('icon/app-icon.svg'), iconSVG);
writeFileSync(out('logo/logo.svg'), logoSVG(640).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));

// Inputs for `npx @capacitor/assets generate` (native icon + splash sets).
const assets = join(root, 'assets');
mkdirSync(assets, { recursive: true });
copyFileSync(out('icon/app-icon-1024.png'), join(assets, 'icon-only.png'));
copyFileSync(out('icon/icon-foreground.png'), join(assets, 'icon-foreground.png'));
copyFileSync(out('icon/icon-background.png'), join(assets, 'icon-background.png'));
copyFileSync(out('icon/splash-2732.png'), join(assets, 'splash.png'));
copyFileSync(out('icon/splash-dark-2732.png'), join(assets, 'splash-dark.png'));
await browser.close();
console.log('icons rendered');
