// Composes store screenshots: headline + device mockup + floating tulips.
//   node --experimental-strip-types store/frames.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { VARIETY_BY_ID } from '../src/core/garden.ts';
import { tekirSVG, tulipSVG } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const font = join(here, '..', 'node_modules/@fontsource/baloo-2/files');

const SIZES = {
  iphone: { w: 1290, h: 2796, dir: 'appstore-iphone-6.9' },
  android: { w: 1080, h: 2160, dir: 'googleplay-phone' },
};

const SLIDES = [
  { id: 'focus', bg: ['#ffe3e6', '#fff6ec'], ink: '#2a2320', accent: '#d7263d', tr: ['Odaklan,<br>Laleni Büyüt', 'Ne kadar uzun, o kadar nadir lale'], en: ['Focus and<br>Grow a Tulip', 'The longer you focus, the rarer it blooms'], tulips: ['istanbul', 'sari'], mood: 'happy' },
  { id: 'session', bg: ['#3b6b5a', '#142824'], ink: '#ffffff', accent: '#ffd166', tr: ['Telefonu Bırak,<br>Lale Açsın', 'Sıkı mod: Çıkarsan lalen solar'], en: ['Put the Phone<br>Down, Let It Bloom', 'Strict mode: leave and it wilts'], tulips: ['alev', 'geceyarisi'] },
  { id: 'garden', bg: ['#ffd6a5', '#fff7e8'], ink: '#2a2320', accent: '#c1121f', tr: ['İstanbul’un<br>Lale Bahçeleri', '32 çeşit, 7 bahçe, Tekir bahçıvan'], en: ['Istanbul’s<br>Tulip Gardens', '32 varieties, 7 gardens, one cat gardener'], tulips: ['laledevri', 'emirgan'], mood: 'idle' },
  { id: 'track', bg: ['#dcf2ee', '#f7fffd'], ink: '#1f3d36', accent: '#2a9d8f', tr: ['Netin Anında<br>Hesaplansın', 'TYT, AYT, LGS, KPSS denemeleri'], en: ['Your Score,<br>Worked Out Instantly', 'Track practice questions and mocks'], tulips: ['bogaz', 'kartanesi'] },
  { id: 'stats', bg: ['#e8e4ff', '#fbfaff'], ink: '#2a2340', accent: '#5f6fd8', tr: ['Hangi Ders,<br>Ne Kadar?', 'Haftalık grafik, takvim, verimli saatler'], en: ['See Where<br>Your Time Goes', 'Weekly charts, calendar, best hours'], tulips: ['leylak', 'mor'] },
  { id: 'friends', bg: ['#fff0c9', '#fffaf0'], ink: '#3a2a06', accent: '#d7263d', tr: ['Sınıfça<br>Haftalık Sıralama', 'Hesap yok, reklam yok, hep ücretsiz'], en: ['A Weekly<br>Class Leaderboard', 'No account, no ads, always free'], tulips: ['papagan', 'safran'], mood: 'happy' },
];

const fontCSS = ['latin', 'latin-ext'].flatMap((sub) => [800, 600].map((w) => `@font-face{font-family:'Baloo 2';font-weight:${w};src:url('file://${font}/baloo-2-${sub}-${w}-normal.woff2') format('woff2')}`)).join('');
const fit = (svg) => svg.replace(/width="[\d.]+" height="[\d.]+"/, 'width="100%" height="100%"');
const floatTulip = (id, x, y, size, rot, blur = 0) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * 1.6}px;transform:rotate(${rot}deg);filter:${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 ${size * 0.05}px ${size * 0.07}px rgba(0,0,0,.18))">${fit(tulipSVG(VARIETY_BY_ID.get(id), { size: 100, seed: 3 }))}</div>`;

function slideHTML(slide, lang, dev, shot) {
  const { w, h } = SIZES[dev];
  const [title, sub] = slide[lang];
  const k = w / 1290;
  const titleSize = Math.round(112 * k);
  const subSize = Math.round(52 * k);
  const devW = Math.round(w * 0.8);
  const bezel = Math.round(devW * 0.03);
  const top = Math.round(h * 0.25);
  const radius = Math.round(devW * 0.13);
  const screenW = devW - bezel * 2;
  const deco = floatTulip(slide.tulips[0], -w * 0.05, h * 0.14, w * 0.17, -14) + floatTulip(slide.tulips[1], w * 0.86, h * 0.1, w * 0.15, 12) + floatTulip(slide.tulips[0], w * 0.88, h * 0.72, w * 0.1, 18, 3);
  const cat = slide.mood ? `<div style="position:absolute;right:${-w * 0.03}px;bottom:${h * 0.015}px;width:${w * 0.32}px;height:${w * 0.32}px;transform:rotate(-6deg);filter:drop-shadow(0 20px 30px rgba(0,0,0,.25))">${fit(tekirSVG(400, slide.mood, 'tulip'))}</div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,${slide.bg[0]} 0%,${slide.bg[1]} 85%)}
.title{position:absolute;left:0;right:0;top:${Math.round(h * 0.05)}px;text-align:center;font-family:'Baloo 2';font-weight:800;font-size:${titleSize}px;line-height:1.02;color:${slide.ink}}
.sub{position:absolute;left:0;right:0;top:${Math.round(h * 0.05 + titleSize * 2.14)}px;text-align:center;font-family:'Baloo 2';font-weight:600;font-size:${subSize}px;color:${slide.accent}}
.device{position:absolute;left:${(w - devW) / 2}px;top:${top}px;width:${devW}px;padding:${bezel}px;box-sizing:border-box;border-radius:${radius}px;background:linear-gradient(145deg,#2c2a3a,#0b0a12);box-shadow:0 ${40 * k}px ${90 * k}px rgba(40,20,10,.35),inset 0 0 0 ${3 * k}px #4a4760}
.device img{display:block;width:${screenW}px;border-radius:${radius - bezel}px}
</style></head><body><div class="bg"></div>${deco}
<div class="device"><img src="file://${shot}"></div>${cat}
<div class="title">${title}</div><div class="sub">${sub}</div></body></html>`;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
for (const dev of process.env.DEVICES ? process.env.DEVICES.split(',') : Object.keys(SIZES)) {
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
      await page.evaluate(() => document.fonts.load('800 40px "Baloo 2"').then(() => document.fonts.ready));
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
