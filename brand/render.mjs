// Renders the Tekir Studios brand kit (SVG + PNG).
//   node --experimental-strip-types brand/render.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../games/lokum-blast/node_modules/playwright-core/index.mjs';
import { tekirSVG } from '../games/lokum-blast/src/ui/art.ts';

const here = dirname(fileURLToPath(import.meta.url));
const font = join(here, '../games/lokum-blast/node_modules/@fontsource/baloo-2/files');
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const C = { night: '#1a1238', plum: '#2a1b5c', gold: '#ffc94d', rose: '#ff6fa5', mint: '#3fd6c8', fez: '#d61f38', cream: '#fff6e8' };

const mascot = (mood) => tekirSVG(512, mood, false).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

/** Horizontal lockup: mascot badge + wordmark. */
function lockup(label, accent, dark = true) {
  const text = dark ? '#ffffff' : C.night;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1260" height="320" viewBox="0 0 1260 320">
<defs><clipPath id="badge"><circle cx="160" cy="160" r="128"/></clipPath></defs>
<circle cx="160" cy="160" r="140" fill="${accent}"/><circle cx="160" cy="160" r="128" fill="${C.night}"/>
<g clip-path="url(#badge)"><g transform="translate(36 40) scale(1.24)">${inner(tekirSVG(200, 'happy', false))}</g></g>
<text x="330" y="186" font-family="'Baloo 2'" font-weight="800" font-size="132" fill="${text}">Tekir <tspan fill="${accent}">${label}</tspan></text>
<text x="336" y="256" font-family="'Baloo 2'" font-weight="600" font-size="38" fill="${dark ? '#c9c0f5' : '#5a4d8f'}" letter-spacing="6">İSTANBUL · GAMES &amp; APPS</text>
</svg>`;
}

/** Square app-store style studio avatar (social profiles, developer page). */
const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><radialGradient id="a" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#5a37c4"/><stop offset="1" stop-color="${C.night}"/></radialGradient></defs>
<rect width="1024" height="1024" fill="url(#a)"/><g transform="translate(112 90) scale(4)">${inner(tekirSVG(200, 'happy', false))}</g></svg>`;

const files = {
  'logo/tekir-studios-dark.svg': lockup('Studios', C.gold, true),
  'logo/tekir-studios-light.svg': lockup('Studios', '#e0a400', false),
  'logo/tekir-games.svg': lockup('Games', C.rose, true),
  'logo/tekir-labs.svg': lockup('Labs', C.mint, true),
  'logo/tekir-avatar.svg': avatar,
  'mascot/tekir-idle.svg': mascot('idle'),
  'mascot/tekir-happy.svg': mascot('happy'),
  'mascot/tekir-sad.svg': mascot('sad'),
};

const fontCSS = `@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-800-normal.woff2')}@font-face{font-family:'Baloo 2';font-weight:800;src:url('file://${font}/baloo-2-latin-ext-800-normal.woff2');unicode-range:U+0100-02BA}@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-600-normal.woff2')}@font-face{font-family:'Baloo 2';font-weight:600;src:url('file://${font}/baloo-2-latin-ext-600-normal.woff2');unicode-range:U+0100-02BA}`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
for (const [name, svg] of Object.entries(files)) {
  const svgPath = join(here, name);
  mkdirSync(dirname(svgPath), { recursive: true });
  writeFileSync(svgPath, svg);
  const w = Number(svg.match(/width="(\d+)"/)[1]);
  const h = Number(svg.match(/height="(\d+)"/)[1]);
  const tmp = join(here, '.tmp.html');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS}html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`file://${tmp}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  await page.screenshot({ path: svgPath.replace('.svg', '.png'), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}
await browser.close();
console.log('brand kit rendered');
