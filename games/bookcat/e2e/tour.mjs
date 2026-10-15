// Visual tour: home, every dialog, a mid-level board, the win and lose flows.
//   node e2e/tour.mjs <baseUrl> <outDir> [lang]   (lang: tr | en | de | es)
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [base = 'http://localhost:5173', outDir = 'test-results/tour', lang = 'tr'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: lang });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const wait = (ms) => page.waitForTimeout(ms);
const open = async (q = '') => {
  await page.goto(`${base.replace(/\/$/, '')}/?e2e${q}`);
  await wait(1200);
  await page.evaluate(() => window.__bookcat.closeModals());
  await wait(300);
};
const shot = (name) => page.screenshot({ path: `${outDir}/${lang}-${name}.png` });

await open();
await page.evaluate((l) => window.__bookcat.store.update((d) => {
  d.settings.lang = l; d.level = 24; d.coins = 1840; d.books = [0, 1]; d.tutorial.done = true; d.stats.sessions = 8;
}), lang);
await open();
await shot('home');
for (const name of ['daily', 'collection', 'quests', 'shop', 'settings', 'login']) {
  await page.evaluate((n) => window.__bookcat.dialogs[n](), name);
  await wait(600);
  await shot(name);
  await page.evaluate(() => window.__bookcat.closeModals());
  await wait(300);
}
await open('&level=160');
for (let i = 0; i < 12; i++) await page.evaluate(() => window.__bookcat.step());
await wait(900);
await shot('board');
await open('&level=3');
for (let i = 0; i < 300 && (await page.evaluate(() => window.__bookcat.step())) !== 'end'; i++) await wait(30);
await wait(1500);
await shot('win');
await open('&level=6');
for (let i = 0; i < 300 && (await page.evaluate(() => window.__bookcat.step('deck'))) !== 'end'; i++) await wait(30);
await wait(1200);
await shot('lose');
console.log(errors.length ? `errors: ${errors.join(' | ')}` : 'tour done, no errors');
await browser.close();
