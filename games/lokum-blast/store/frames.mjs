// Composes store screenshots: headline + device mockup + decorations.
//   node --experimental-strip-types store/frames.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { tekirSVG } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const font = join(here, '..', 'node_modules/@fontsource/baloo-2/files');

const SIZES = {
  iphone: { w: 1290, h: 2796, dir: 'appstore-iphone-6.9' },
  ipad: { w: 2064, h: 2752, dir: 'appstore-ipad-13' },
  android: { w: 1080, h: 2160, dir: 'googleplay-phone' },
};

const SLIDES = [
  {
    id: 'combo',
    bg: ['#ff5fa2', '#7b2ff7'],
    tr: ['Tatlı Bloklar,<br>Dev Kombolar!', 'Satırları doldur, lokumları patlat'],
    en: ['Sweet Blocks,<br>Huge Combos!', 'Fill the lines, pop the lokums'],
    cat: false,
  },
  {
    id: 'journey',
    bg: ['#19c3b4', '#3b2a9b'],
    tr: ['300+ Seviyelik<br>Tatlı Macera', 'Zümrütleri topla, kasaları kır'],
    en: ['300+ Levels of<br>Sweet Adventure', 'Collect emeralds, smash crates'],
    cat: false,
  },
  {
    id: 'bazaar',
    bg: ['#ffb321', '#d6334f'],
    tr: ['Kapalıçarşı’yı<br>Yeniden Canlandır', 'Yıldız kazan, 12 dükkânı yenile'],
    en: ['Bring the Grand<br>Bazaar to Life', 'Earn stars, restore 12 shops'],
    cat: true,
  },
  {
    id: 'theme',
    bg: ['#2b2bd1', '#0a0326'],
    tr: ['Göz Alıcı<br>Temalar', 'Neon, İznik çinisi, Altın Saray…'],
    en: ['Stunning<br>Themes', 'Neon, İznik tiles, Golden Palace…'],
    cat: false,
  },
  {
    id: 'saray',
    bg: ['#c9283f', '#3d0a1e'],
    tr: ['Rekorunu<br>Kır!', 'Klasik modda sonsuz eğlence'],
    en: ['Beat Your<br>Best Score!', 'Endless fun in Classic mode'],
    cat: false,
  },
  {
    id: 'wheel',
    bg: ['#a855f7', '#ff5fa2'],
    tr: ['Her Gün Hediye<br>ve Çarkıfelek', 'Görevler, seriler, sürprizler'],
    en: ['Daily Gifts &<br>Lucky Wheel', 'Quests, streaks and surprises'],
    cat: true,
  },
  {
    id: 'home',
    bg: ['#5a37c4', '#160f38'],
    tr: ['Fesli Tekir’le<br>Tanış!', 'İstanbul’un en tatlı kedisi'],
    en: ['Meet Tekir,<br>the Fez Cat!', 'Istanbul’s sweetest cat'],
    cat: false,
  },
];

const fontCSS = `@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-800-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-ext-800-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-600-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+2000-206F}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-ext-600-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+20A0-20C0}`;

function lokum(x, y, size, c1, c2, rot, blur = 0) {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform:rotate(${rot}deg);filter:${blur ? `blur(${blur}px)` : 'none'} drop-shadow(0 ${size * 0.06}px 0 rgba(0,0,0,.25));border-radius:${size * 0.22}px;background:linear-gradient(${c1},${c2});box-shadow:inset 0 ${size * 0.18}px ${size * 0.12}px rgba(255,255,255,.45)"><div style="position:absolute;inset:0;border-radius:inherit;background-image:radial-gradient(circle at 20% 25%,#fff 0 3%,transparent 4%),radial-gradient(circle at 55% 18%,#fff 0 2.5%,transparent 3.5%),radial-gradient(circle at 78% 32%,#fff 0 3%,transparent 4%),radial-gradient(circle at 35% 50%,#fff 0 2%,transparent 3%),radial-gradient(circle at 66% 62%,#fff 0 2.5%,transparent 3.5%),radial-gradient(circle at 25% 75%,#fff 0 2%,transparent 3%);opacity:.85"></div></div>`;
}

function slideHTML(slide, lang, dev, shot) {
  const { w, h } = SIZES[dev];
  const tablet = dev === 'ipad';
  const [title, sub] = slide[lang];
  const k = w / 1290;
  const titleSize = Math.round((tablet ? 150 : 124) * k * (tablet ? 0.62 : 1));
  const subSize = Math.round((tablet ? 70 : 58) * k * (tablet ? 0.62 : 1));
  const devW = Math.round(w * (tablet ? 0.8 : 0.8));
  const bezel = Math.round(devW * (tablet ? 0.022 : 0.03));
  const top = Math.round(h * (tablet ? 0.215 : 0.245));
  const radius = Math.round(devW * (tablet ? 0.05 : 0.13));
  const screenW = devW - bezel * 2;
  const cats = slide.cat
    ? `<div style="position:absolute;right:${-w * 0.06}px;bottom:${h * 0.05}px;width:${w * 0.42}px;transform:rotate(-8deg);filter:drop-shadow(0 20px 30px rgba(0,0,0,.35))">${tekirSVG(Math.round(w * 0.42), 'happy', true)}</div>`
    : '';
  const deco = [
    lokum(w * -0.04, h * 0.17, w * 0.15, '#c8f27a', '#5fb52d', -18, 0),
    lokum(w * 0.88, h * 0.13, w * 0.13, '#fff1a0', '#ffc21a', 14, 0),
    lokum(w * 0.86, h * 0.62, w * 0.1, '#ffc1da', '#ff4f93', 22, 3),
    lokum(w * 0.02, h * 0.78, w * 0.09, '#b3f5ee', '#22c3b0', -10, 3),
  ].join('');
  const stars = Array.from({ length: 18 }, (_, i) => {
    const x = (i * 197) % w;
    const y = (i * 331) % Math.round(h * 0.95);
    const s = 4 + ((i * 7) % 9);
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;background:#fff;opacity:${0.35 + (i % 4) * 0.12}"></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,${slide.bg[0]} 0%,${slide.bg[1]} 75%)}
.title{position:absolute;left:0;right:0;top:${Math.round(h * (tablet ? 0.045 : 0.05))}px;text-align:center;font-family:'Baloo 2';font-weight:800;font-size:${titleSize}px;line-height:1.02;color:#fff;letter-spacing:.5px;text-shadow:0 ${8 * k}px 0 rgba(30,8,60,.55),0 0 ${40 * k}px rgba(0,0,0,.25)}
.sub{position:absolute;left:0;right:0;top:${Math.round(h * (tablet ? 0.045 : 0.05) + titleSize * 2.14)}px;text-align:center;font-family:'Baloo 2';font-weight:600;font-size:${subSize}px;color:rgba(255,255,255,.93);text-shadow:0 ${3 * k}px 0 rgba(30,8,60,.4)}
.device{position:absolute;left:${(w - devW) / 2}px;top:${top}px;width:${devW}px;padding:${bezel}px;box-sizing:border-box;border-radius:${radius}px;background:linear-gradient(145deg,#2c2a3a,#0b0a12);box-shadow:0 ${40 * k}px ${90 * k}px rgba(0,0,0,.5),inset 0 0 0 ${3 * k}px #4a4760}
.device img{display:block;width:${screenW}px;border-radius:${radius - bezel}px}
</style></head><body><div class="bg"></div>${stars}${deco}
<div class="device"><img src="file://${shot}"></div>${cats}
<div class="title">${title}</div><div class="sub">${sub}</div></body></html>`;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
const devs = process.env.DEVICES ? process.env.DEVICES.split(',') : Object.keys(SIZES);
for (const dev of devs) {
  const { w, h, dir } = SIZES[dev];
  await page.setViewportSize({ width: w, height: h });
  for (const lang of ['tr', 'en']) {
    let n = 1;
    for (const slide of SLIDES) {
      const shot = join(here, 'raw', dev, lang, `${slide.id}.png`);
      if (!existsSync(shot)) continue;
      const tmp = join(here, 'output', '.frame.html');
      mkdirSync(dirname(tmp), { recursive: true });
      writeFileSync(tmp, slideHTML(slide, lang, dev, shot));
      await page.goto(`file://${tmp}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      const file = join(here, 'output', dir, lang, `${String(n).padStart(2, '0')}-${slide.id}.jpg`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file, type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: w, height: h } });
      n++;
    }
    console.log('framed', dev, lang);
  }
}
await browser.close();
