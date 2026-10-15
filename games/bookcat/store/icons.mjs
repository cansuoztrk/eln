// Renders the app icon, adaptive-icon layers, splash screens, the Play
// feature graphics (TR/EN) and the logo from the game's own vector art.
//   node --experimental-strip-types store/icons.mjs
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { tekirSVG } from '../src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fonts = join(root, 'node_modules/@fontsource');
const out = (p) => {
  const f = join(here, 'output', p);
  mkdirSync(dirname(f), { recursive: true });
  return f;
};
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const WOOD = `<defs><radialGradient id="wood" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#7a4a26"/><stop offset=".6" stop-color="#4f2f18"/><stop offset="1" stop-color="#2e1a0c"/></radialGradient>
<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e4c8"/></linearGradient></defs>`;

/** A playing card: a green shelf label or a lined paper word card. */
function card(x, y, w, rot, kind) {
  const h = w * 1.36;
  const r = w * 0.12;
  const face =
    kind === 'cat'
      ? `<rect width="${w}" height="${h}" rx="${r}" fill="#2f6150"/><rect x="${w * 0.06}" y="${w * 0.06}" width="${w * 0.88}" height="${h - w * 0.12}" rx="${r * 0.7}" fill="none" stroke="#e7bd5b" stroke-width="${w * 0.035}"/>
<rect x="${w * 0.2}" y="${h * 0.16}" width="${w * 0.6}" height="${w * 0.09}" rx="${w * 0.045}" fill="#f6dc95"/><rect x="${w * 0.28}" y="${h * 0.27}" width="${w * 0.44}" height="${w * 0.07}" rx="${w * 0.035}" fill="#f6dc95" opacity=".7"/>
<g transform="translate(${w * 0.5} ${h * 0.66})"><rect x="${-w * 0.2}" y="${-w * 0.16}" width="${w * 0.4}" height="${w * 0.32}" rx="${w * 0.16}" fill="#0006"/><path d="M${-w * 0.1} ${w * 0.08}v${-w * 0.16}h${w * 0.06}v${w * 0.16}zM${-w * 0.02} ${w * 0.08}v${-w * 0.16}h${w * 0.06}v${w * 0.16}zM${w * 0.06} ${w * 0.08}l${w * 0.03} ${-w * 0.16}l${w * 0.05} ${w * 0.01}l${-w * 0.03} ${w * 0.15}z" fill="#f6dc95"/></g>`
      : `<rect width="${w}" height="${h}" rx="${r}" fill="url(#paper)"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${w * 0.08}" y="${h * (0.3 + i * 0.115)}" width="${w * 0.84}" height="${w * 0.012}" fill="#d9c6a0"/>`).join('')}
<rect x="${w * 0.18}" y="${h * 0.1}" width="${w * 0.64}" height="${w * 0.1}" rx="${w * 0.05}" fill="#3b2a1f"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot} ${w / 2} ${h})"><rect x="${w * 0.03}" y="${w * 0.06}" width="${w}" height="${h}" rx="${r}" fill="#0007"/>${face}</g>`;
}

function iconArt(withBg = true) {
  const bg = withBg ? `<rect width="1024" height="1024" fill="url(#wood)"/><g opacity=".14" stroke="#000" stroke-width="5">${Array.from({ length: 11 }, (_, i) => `<path d="M0 ${60 + i * 96}q512 ${i % 2 ? 26 : -26} 1024 0" fill="none"/>`).join('')}</g>` : '';
  const cat = `<g transform="translate(212 300) scale(3)">${inner(tekirSVG(200, 'idle'))}</g>`;
  return `${WOOD}${bg}
${card(210, 150, 250, -16, 'word')}
${card(564, 150, 250, 16, 'word')}
${card(387, 110, 250, 0, 'cat')}
${cat}`;
}

const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${iconArt(true)}</svg>`;
const fgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g transform="translate(512 530) scale(.62) translate(-512 -540)">${iconArt(false)}</g></svg>`;
const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${WOOD}<rect width="1024" height="1024" fill="url(#wood)"/></svg>`;

/** Wordmark: gilded letters on a dark spine label. */
function logoSVG(title, sub, width = 600) {
  const h = width * 0.42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 600 252">
<defs><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".5" stop-color="#f0c04f"/><stop offset="1" stop-color="#b8801a"/></linearGradient></defs>
<text x="300" y="138" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="112" fill="#2b1a0d" stroke="#2b1a0d" stroke-width="26" stroke-linejoin="round">${title}</text>
<text x="300" y="138" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="112" fill="url(#gold)">${title}</text>
<rect x="150" y="166" width="300" height="52" rx="26" fill="#2f6150" stroke="#e7bd5b" stroke-width="4"/>
<text x="300" y="203" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="30" fill="#f6dc95" letter-spacing="3">${sub}</text></svg>`;
}

function splashSVG(size, dark = false) {
  const s = size / 2732;
  const bg = dark ? '#1f130a' : '#3a2414';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/>
<circle cx="${size / 2}" cy="${size / 2}" r="${880 * s}" fill="#5a3820" opacity=".5"/>
<g transform="translate(${size / 2 - 600 * s} ${size / 2 - 640 * s}) scale(${2 * s})">${inner(logoSVG('Kitap Kedisi', 'KELİME SOLİTAİRE'))}</g>
<g transform="translate(${size / 2 - 330 * s} ${size / 2 - 60 * s}) scale(${3.3 * s})">${inner(tekirSVG(200, 'happy'))}</g></svg>`;
}

/** Shelf of spines for the feature graphic. */
function shelfRow(y, seed) {
  const colors = ['#8a2f2a', '#2f6150', '#2b4a7a', '#b0801f', '#62407a', '#2a7176', '#a8582e', '#e7bd5b'];
  let x = 0;
  let k = seed;
  let s = '';
  while (x < 1024) {
    const w = 22 + (k % 4) * 6;
    const h = 120 + ((k * 7) % 40);
    s += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="3" fill="${colors[k % colors.length]}"/><rect x="${x + 4}" y="${y - h + 16}" width="${w - 8}" height="5" fill="#e7bd5b" opacity=".55"/><rect x="${x + 4}" y="${y - 30}" width="${w - 8}" height="5" fill="#e7bd5b" opacity=".4"/>`;
    x += w + 3;
    k = (k * 13 + 5) % 97;
  }
  return s + `<rect x="0" y="${y}" width="1024" height="16" fill="#6b4528"/>`;
}

function featureHTML(title, sub, tagline) {
  return `<div style="width:1024px;height:500px;position:relative;overflow:hidden;font-family:'Baloo 2';background:#2e1a0c">
<svg width="1024" height="500" style="position:absolute;inset:0" viewBox="0 0 1024 500">${WOOD}<rect width="1024" height="500" fill="url(#wood)"/><g opacity=".55">${shelfRow(190, 3)}${shelfRow(400, 11)}</g></svg>
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(46,26,12,.95) 0%,rgba(46,26,12,.82) 46%,rgba(46,26,12,.1) 75%)"></div>
<div style="position:absolute;left:30px;top:60px;width:500px;text-align:center">${logoSVG(title, sub, 500)}<div style="color:#fff6e6;font-weight:800;font-size:30px;line-height:1.15;margin-top:6px;text-shadow:0 3px 0 #1a0e05">${tagline}</div></div>
<svg style="position:absolute;right:20px;top:30px" width="470" height="440" viewBox="0 0 1024 960">${WOOD}${card(150, 120, 270, -18, 'word')}${card(600, 120, 270, 18, 'word')}${card(377, 60, 270, 0, 'cat')}<g transform="translate(212 300) scale(3)">${inner(tekirSVG(200, 'happy'))}</g></svg>
</div>`;
}

const face = (fam, w, sub) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('file://${fonts}/${fam.toLowerCase().replace(' ', '-')}/files/${fam.toLowerCase().replace(' ', '-')}-${sub}-${w}-normal.woff2') format('woff2')}`;
const fontCSS = [face('Baloo 2', 800, 'latin'), face('Baloo 2', 800, 'latin-ext')].join('');

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
await render(iconSVG.replace('width="1024" height="1024"', 'width="512" height="512"'), 512, 512, out('play/play-icon-512.png'));
await render(fgSVG, 1024, 1024, out('icon/icon-foreground.png'), true);
await render(bgSVG, 1024, 1024, out('icon/icon-background.png'));
await render(splashSVG(2732), 2732, 2732, out('icon/splash-2732.png'));
await render(splashSVG(2732, true), 2732, 2732, out('icon/splash-dark-2732.png'));
await render(featureHTML('Kitap Kedisi', 'KELİME SOLİTAİRE', 'Kelimeleri raflara diz, sahafı toparla!'), 1024, 500, out('play/feature-graphic-tr.png'));
await render(featureHTML('Bookcat', 'WORD SOLITAIRE', 'Shelve the words, tidy the bookshop!'), 1024, 500, out('play/feature-graphic-en.png'));
await render(`<div style="background:#3a2414;padding:10px">${logoSVG('Kitap Kedisi', 'KELİME SOLİTAİRE')}</div>`, 620, 272, out('logo/logo-tr.png'));
await render(`<div style="padding:10px">${logoSVG('Bookcat', 'WORD SOLITAIRE')}</div>`, 620, 272, out('logo/logo-en-transparent.png'), true);
writeFileSync(out('icon/app-icon.svg'), iconSVG);

// Web manifest icons and inputs for `npx @capacitor/assets generate`.
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
