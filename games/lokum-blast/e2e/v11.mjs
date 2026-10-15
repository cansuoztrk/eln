// v1.1 feature check: pass modal, colorblind mode, idle hint.
import { chromium } from 'playwright-core';
const base = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? '/tmp/shots';
const today = new Date();
const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'tr-TR' });
await ctx.addInitScript((k) => localStorage.setItem('lokumblast.save.v1', JSON.stringify({ login: { last: k, streak: 3, day: 2 }, stats: { games: 0, levelsWon: 0, sessions: 3 }, settings: { colorblind: true, sound: false, music: false } })), key);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base + '?e2e');
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const st = window.__lokum.store;
  st.data.pass.points = 470;
  window.__lokum.app.home();
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/v11-home.png` });
await page.locator('.side-btn').nth(2).click({ force: true });
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/v11-pass.png` });
await page.locator('.pass-claim-all').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/v11-pass-claimed.png` });
await page.locator('.reward-modal .btn-primary').click();
await page.waitForTimeout(300);
await page.locator('.pass-buy').click();
await page.waitForTimeout(400);
await page.locator('.modal-card .btn-primary').last().click(); // confirm demo purchase
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/v11-pass-premium.png` });
console.log('premium:', await page.evaluate(() => window.__lokum.store.data.pass.premium));
await page.locator('.pass-modal .modal-x').click();
await page.waitForTimeout(300);
// level 1 with colorblind symbols; wait for idle hint
await page.locator('.btn-play').click({ force: true });
await page.waitForTimeout(400);
await page.locator('.level-modal .btn-primary').click();
await page.waitForTimeout(800);
await page.evaluate(() => { const g = window.__game.debug(); const mv = window.__lokum.bestMove(g.session); g.place(mv.slot, mv.r, mv.c); });
await page.waitForTimeout(10500);
await page.screenshot({ path: `${out}/v11-colorblind-hint.png` });
console.log('hint visible:', await page.evaluate(() => !!window.__game.debug().scene['hint']));
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
