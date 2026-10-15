// Composes store screenshots: headline + device mockup + Istanbul decorations.
//   node --experimental-strip-types store/frames.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { catSVG, foodSVG, seagullSVG, tulipIcon } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const font = join(here, '..', 'node_modules/@fontsource/baloo-2/files');

const SIZES = {
  iphone: { w: 1290, h: 2796, dir: 'appstore-iphone-6.9' },
  ipad: { w: 2064, h: 2752, dir: 'appstore-ipad-13' },
  android: { w: 1080, h: 2160, dir: 'googleplay-phone' },
};

const SLIDES = [
  {
    id: 'stands',
    bg: ['#ff9a5c', '#d6402a'],
    tr: ['İstanbul’da Lezzet<br>İmparatorluğu Kur!', 'Simit arabasından kebap salonuna'],
    en: ['Build an Istanbul<br>Food Empire!', 'From a simit cart to a kebab palace'],
    deco: ['simit', 'cay'],
    cat: 0,
  },
  {
    id: 'cats',
    bg: ['#2a9d8f', '#0f3550'],
    tr: ['Sevimli Kedi<br>Müdürler', 'Sen yokken bile satış yaparlar'],
    en: ['Adorable Cat<br>Managers', 'They sell even while you are away'],
    deco: ['balik', 'pogaca'],
    cat: 6,
  },
  {
    id: 'districts',
    bg: ['#f6a96c', '#6a4c93'],
    tr: ['8 Efsane Semt,<br>Sonsuz Tur', 'Karaköy’den Adalar’a taşın'],
    en: ['Tour 8 Iconic<br>Districts', 'From Karaköy to the Princes’ Islands'],
    deco: ['lokum', 'dondurma'],
    cat: 9,
  },
  {
    id: 'night',
    bg: ['#3f3a7a', '#0b1430'],
    tr: ['Martıyı Yakala,<br>Vapuru Karşıla!', 'İzdiham saatinde gelir ×3'],
    en: ['Catch Seagulls,<br>Meet the Ferry!', 'Rush hour: income ×3'],
    deco: ['midye', 'kebap'],
    gull: true,
  },
  {
    id: 'offline',
    bg: ['#ffcf5a', '#e8892e'],
    tr: ['Sen Yokken de<br>Kazan!', 'Kedilerin dükkânı çalıştırır'],
    en: ['Earn While<br>You’re Away!', 'Your cats keep the shop running'],
    deco: ['simit', 'doner'],
    cat: 1,
  },
  {
    id: 'recipes',
    bg: ['#ff7aa2', '#b5179e'],
    tr: ['Gizli Tarifler,<br>×3 Kâr', 'Usta tarifinden kozmik tarife'],
    en: ['Secret Recipes,<br>×3 Profit', 'From master’s recipe to cosmic'],
    deco: ['kumpir', 'cay'],
    cat: 8,
  },
  {
    id: 'welcome',
    bg: ['#ffafcc', '#52b788'],
    tr: ['Yeni Semt,<br>Yeni Lezzet', 'Lale topla, gelirini katla'],
    en: ['New District,<br>New Flavours', 'Collect tulips, multiply your income'],
    deco: ['lokum', 'simit'],
    tulips: true,
  },
];

const fontCSS = `@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-800-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-ext-800-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-600-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+2000-206F}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-ext-600-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+20A0-20C0}`;

const float = (html, x, y, size, rot, blur = 0) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform:rotate(${rot}deg);filter:${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 ${size * 0.06}px ${size * 0.08}px rgba(0,0,0,.3))">${html}</div>`;

function slideHTML(slide, lang, dev, shot) {
  const { w, h } = SIZES[dev];
  const tablet = dev === 'ipad';
  const [title, sub] = slide[lang];
  const k = w / 1290;
  const titleSize = Math.round((tablet ? 150 : 122) * k * (tablet ? 0.62 : 1));
  const subSize = Math.round((tablet ? 70 : 56) * k * (tablet ? 0.62 : 1));
  const devW = Math.round(w * 0.8);
  const bezel = Math.round(devW * (tablet ? 0.022 : 0.03));
  const top = Math.round(h * (tablet ? 0.215 : 0.245));
  const radius = Math.round(devW * (tablet ? 0.05 : 0.13));
  const screenW = devW - bezel * 2;
  const s = (v) => Math.round(v * w);
  const food = (id) => foodSVG(id, 400).replace('width="400" height="400"', 'width="100%" height="100%"');
  let deco = float(food(slide.deco[0]), s(-0.05), h * 0.16, s(0.2), -14) + float(food(slide.deco[1]), s(0.86), h * 0.12, s(0.17), 12) + float(food(slide.deco[0]), s(0.87), h * 0.66, s(0.12), 18, 3);
  if (slide.gull) deco += float(seagullSVG(400, true).replace(/width="400" height="[^"]+"/, 'width="100%" height="100%"'), s(0.77), h * (tablet ? 0.13 : 0.155), s(0.22), -6);
  if (slide.tulips) deco += float(tulipIcon(400).replace('width="400" height="400"', 'width="100%" height="100%"'), s(0.02), h * 0.8, s(0.14), -12) + float(tulipIcon(400).replace('width="400" height="400"', 'width="100%" height="100%"'), s(0.84), h * 0.42, s(0.12), 10);
  const cat =
    slide.cat !== undefined
      ? `<div style="position:absolute;right:${-w * 0.05}px;bottom:${h * 0.025}px;width:${w * 0.36}px;height:${w * 0.36}px;transform:rotate(-8deg);filter:drop-shadow(0 20px 30px rgba(0,0,0,.35))">${catSVG(slide.cat, 400, 'happy').replace('width="400" height="400"', 'width="100%" height="100%"')}</div>`
      : '';
  const sparkle = Array.from({ length: 16 }, (_, i) => {
    const x = (i * 197) % w;
    const y = (i * 331) % Math.round(h * 0.95);
    const z = 5 + ((i * 7) % 9);
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${z}px;height:${z}px;border-radius:50%;background:#fff;opacity:${0.3 + (i % 4) * 0.12}"></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,${slide.bg[0]} 0%,${slide.bg[1]} 78%)}
.skyline{position:absolute;left:0;right:0;bottom:0;height:${h * 0.2}px;opacity:.18;background:linear-gradient(transparent,rgba(0,0,0,.5))}
.title{position:absolute;left:0;right:0;top:${Math.round(h * (tablet ? 0.045 : 0.05))}px;text-align:center;font-family:'Baloo 2';font-weight:800;font-size:${titleSize}px;line-height:1.02;color:#fff;letter-spacing:.5px;text-shadow:0 ${8 * k}px 0 rgba(40,15,5,.5),0 0 ${40 * k}px rgba(0,0,0,.25)}
.sub{position:absolute;left:0;right:0;top:${Math.round(h * (tablet ? 0.045 : 0.05) + titleSize * 2.14)}px;text-align:center;font-family:'Baloo 2';font-weight:600;font-size:${subSize}px;color:rgba(255,255,255,.95);text-shadow:0 ${3 * k}px 0 rgba(40,15,5,.4)}
.device{position:absolute;left:${(w - devW) / 2}px;top:${top}px;width:${devW}px;padding:${bezel}px;box-sizing:border-box;border-radius:${radius}px;background:linear-gradient(145deg,#2c2a3a,#0b0a12);box-shadow:0 ${40 * k}px ${90 * k}px rgba(0,0,0,.5),inset 0 0 0 ${3 * k}px #4a4760}
.device img{display:block;width:${screenW}px;border-radius:${radius - bezel}px}
</style></head><body><div class="bg"></div><div class="skyline"></div>${sparkle}${deco}
<div class="device"><img src="file://${shot}"></div>${cat}
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
      await page.screenshot({ path: file, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: w, height: h } });
      n++;
    }
    console.log('framed', dev, lang);
  }
}
await browser.close();
