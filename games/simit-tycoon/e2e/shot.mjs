// Quick visual check: node e2e/shot.mjs <url> <outdir> [lang]
import { chromium } from 'playwright-core';
const url = process.argv[2] ?? 'http://127.0.0.1:5180/';
const out = process.argv[3] ?? '.';
const lang = process.argv[4] ?? 'tr';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: lang, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url + '?e2e', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/01-start.png` });
// Tap the simit cart several times and buy.
for (let k = 0; k < 12; k++) {
  await page.locator('.stand[data-i="0"] .stand-icon').dispatchEvent('pointerdown');
  await page.waitForTimeout(1050);
}
await page.screenshot({ path: `${out}/02-tapped.png` });
// Give cash and progress via debug hooks.
await page.evaluate(() => {
  const s = window.__simit;
  const g = s.game;
  g.run.cash = 5e5;
  s.app.refresh();
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/03-cash.png` });
console.log(JSON.stringify(errors));
await browser.close();
