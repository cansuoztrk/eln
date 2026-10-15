// Composes store screenshots: headline + device mockup + bookshop decorations.
//   node --experimental-strip-types store/frames.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { bookCover, tekirSVG } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const font = join(here, '..', 'node_modules/@fontsource/baloo-2/files');

const SIZES = {
  iphone: { w: 1290, h: 2796, dir: 'appstore-iphone-6.9' },
  ipad: { w: 2064, h: 2752, dir: 'appstore-ipad-13' },
  android: { w: 1080, h: 2160, dir: 'googleplay-phone' },
};

const SLIDES = [
  { id: 'board', bg: ['#8a5a33', '#2e1a0c'], tr: ['Kelimeleri<br>Raflara Diz!', 'Rahatlatıcı bir kelime solitaire'], en: ['Shelve<br>Every Word!', 'A cozy word solitaire'], books: ['#2f6150', '#8a2f2a'], mood: 'idle' },
  { id: 'stacks', bg: ['#2f6150', '#13261f'], tr: ['Aynı Kategoriyi<br>Üst Üste Topla', 'Toplu taşı, hamle kazan'], en: ['Stack Words of<br>One Category', 'Move them together, save moves'], books: ['#b0801f', '#2b4a7a'], mood: 'read' },
  { id: 'win', bg: ['#b0801f', '#4a2c0c'], tr: ['Her Bölüm<br>Çözülebilir', 'Reklam izlemeden kazanılır, garanti'], en: ['Every Level<br>Is Solvable', 'Winnable without ads, guaranteed'], books: ['#62407a', '#2f6150'], mood: 'happy' },
  { id: 'home', bg: ['#a8582e', '#3a1a0c'], tr: ['Tekir’in<br>Sahafına Hoş Geldin', 'İstanbul’un 30 semtini gez'], en: ['Welcome to<br>Tekir’s Bookshop', 'Tour 30 Istanbul districts'], books: ['#8a2f2a', '#2a7176'] },
  { id: 'daily', bg: ['#2b4a7a', '#0f1a30'], tr: ['Günün Rafı', 'Herkese aynı bulmaca, seriyi bozma!'], en: ['Daily Shelf', 'One puzzle for everyone, keep your streak'], books: ['#e7bd5b', '#8a2f2a'], mood: 'happy', single: true },
  { id: 'collection', bg: ['#62407a', '#1d1030'], tr: ['Nadir Kitapları<br>Topla', 'Her semt yeni bir hazine'], en: ['Collect<br>Rare Books', 'Every district hides a treasure'], books: ['#2f6150', '#b0801f'], mood: 'idle' },
];

const fontCSS = `@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-800-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-ext-800-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-600-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+2000-206F}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-ext-600-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+20A0-20C0}`;

const float = (html, x, y, size, rot, blur = 0) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;transform:rotate(${rot}deg);filter:${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 ${size * 0.06}px ${size * 0.08}px rgba(0,0,0,.35))">${html}</div>`;
const fit = (svg) => svg.replace(/width="[\d.]+" height="[\d.]+"/, 'width="100%" height="100%"');

function slideHTML(slide, lang, dev, shot) {
  const { w, h } = SIZES[dev];
  const tablet = dev === 'ipad';
  const [title, sub] = slide[lang];
  const k = w / 1290;
  const titleSize = Math.round((tablet ? 150 : 118) * k * (tablet ? 0.62 : 1));
  const subSize = Math.round((tablet ? 70 : 54) * k * (tablet ? 0.62 : 1));
  const lines = slide.single ? 1 : 2;
  const devW = Math.round(w * (tablet ? 0.78 : 0.8));
  const bezel = Math.round(devW * (tablet ? 0.022 : 0.03));
  const top = Math.round(h * (tablet ? 0.2 : 0.245) - (slide.single ? titleSize : 0));
  const radius = Math.round(devW * (tablet ? 0.05 : 0.13));
  const screenW = devW - bezel * 2;
  const s = (v) => Math.round(v * w);
  const deco =
    float(`<div style="aspect-ratio:80/110">${fit(bookCover(slide.books[0], '', 80))}</div>`, s(-0.04), h * 0.15, s(0.15), -16) +
    float(`<div style="aspect-ratio:80/110">${fit(bookCover(slide.books[1], '', 80))}</div>`, s(0.88), h * 0.11, s(0.13), 14) +
    float(`<div style="aspect-ratio:80/110">${fit(bookCover(slide.books[0], '', 80))}</div>`, s(0.89), h * 0.7, s(0.09), 20, 3);
  const cat = slide.mood
    ? `<div style="position:absolute;right:${-w * 0.04}px;bottom:${h * 0.02}px;width:${w * 0.34}px;height:${w * 0.34}px;transform:rotate(-6deg);filter:drop-shadow(0 20px 30px rgba(0,0,0,.4))">${fit(tekirSVG(400, slide.mood))}</div>`
    : '';
  const dust = Array.from({ length: 18 }, (_, i) => {
    const x = (i * 197) % w;
    const y = (i * 331) % Math.round(h * 0.95);
    const z = 4 + ((i * 7) % 8);
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${z}px;height:${z}px;border-radius:50%;background:#ffe9b0;opacity:${0.18 + (i % 4) * 0.1}"></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,${slide.bg[0]} 0%,${slide.bg[1]} 80%)}
.title{position:absolute;left:0;right:0;top:${Math.round(h * (tablet ? 0.04 : 0.05))}px;text-align:center;font-family:'Baloo 2';font-weight:800;font-size:${titleSize}px;line-height:1.02;color:#ffe9a8;letter-spacing:.5px;text-shadow:0 ${8 * k}px 0 rgba(30,12,4,.6),0 0 ${40 * k}px rgba(0,0,0,.3)}
.sub{position:absolute;left:0;right:0;top:${Math.round(h * (tablet ? 0.04 : 0.05) + titleSize * (lines * 1.07))}px;text-align:center;font-family:'Baloo 2';font-weight:600;font-size:${subSize}px;color:#fff6e6;text-shadow:0 ${3 * k}px 0 rgba(30,12,4,.5)}
.device{position:absolute;left:${(w - devW) / 2}px;top:${top}px;width:${devW}px;padding:${bezel}px;box-sizing:border-box;border-radius:${radius}px;background:linear-gradient(145deg,#2c2a3a,#0b0a12);box-shadow:0 ${40 * k}px ${90 * k}px rgba(0,0,0,.55),inset 0 0 0 ${3 * k}px #4a4760}
.device img{display:block;width:${screenW}px;border-radius:${radius - bezel}px}
</style></head><body><div class="bg"></div>${dust}${deco}
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
