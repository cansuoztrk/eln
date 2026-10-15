// Visual tour of every screen with a seeded mid-game state.
//   node e2e/tour.mjs <url> <outdir> [lang]
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
await page.waitForTimeout(900);
const shot = async (name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/${name}.png` });
};
const closeModals = async () => {
  for (let k = 0; k < 4; k++) {
    const x = page.locator('.modal-x').last();
    if (await x.count()) await x.click({ force: true });
    await page.waitForTimeout(250);
  }
};
// Mid-game state in Karaköy.
await page.evaluate(() => {
  const { store, app } = window.__simit;
  const d = store.data;
  d.tutorial.done = true;
  d.run.levels = [152, 101, 77, 64, 52, 36, 0, 0, 0, 0];
  d.run.managers = [true, true, true, true, true, false, false, false, false, false];
  d.run.upgrades = ['u0_0', 'u0_1', 'u0_2'];
  d.run.cash = 8.4e6;
  d.run.earnedRun = 6.2e8;
  d.lifetime = 6.2e8;
  d.gold = 145;
  d.stats.sessions = 3;
  d.achievements.best = [152, 101, 77, 64, 52, 36, 0, 0, 0, 0];
  d.achievements.festivals = 1;
  app.refresh();
});
await shot('10-stands-mid');
await page.locator('.nav-btn[data-tab="cats"]').click({ force: true });
await shot('11-cats');
await page.locator('.nav-btn[data-tab="recipes"]').click({ force: true });
await shot('12-recipes');
await page.locator('.nav-btn[data-tab="districts"]').click({ force: true });
await shot('13-districts');
await page.evaluate(() => {
  const { store, app } = window.__simit;
  store.data.run.earnedRun = 2e9;
  store.data.lifetime = 2e9;
  app.refresh();
});
await shot('14-districts-goal');
await page.locator('.nav-btn[data-tab="shop"]').click({ force: true });
await shot('15-shop');
await page.evaluate(() => document.querySelector('.tab-shop').scrollTo(0, 700));
await shot('16-shop-2');
await page.evaluate(() => document.querySelector('.tab-shop').scrollTo(0, 99999));
await shot('17-shop-3');
await page.locator('.nav-btn[data-tab="stands"]').click({ force: true });
// Modals
await page.locator('.side-daily').click({ force: true });
await shot('20-daily');
await closeModals();
await page.locator('.side-quests').click({ force: true });
await shot('21-quests');
await closeModals();
await page.locator('.side-ach').click({ force: true });
await shot('22-achievements');
await closeModals();
await page.locator('.boost-btn').click({ force: true });
await shot('23-boost');
await closeModals();
await page.locator('.hud-right .icon-btn').click({ force: true });
await shot('24-settings');
await closeModals();
await page.evaluate(() => {
  const { store, app } = window.__simit;
  store.data.lastSeen = Date.now() - 3.2 * 3600 * 1000;
  app.welcomeBack();
});
await shot('25-offline');
await closeModals();
// Seagull + ferry
await page.evaluate(() => {
  const { app } = window.__simit;
  app.hud.spawnSeagull(() => {});
  app.hud.spawnFerry(() => {});
});
await page.waitForTimeout(2600);
await shot('26-events');
// Move
await page.locator('.nav-btn[data-tab="districts"]').click({ force: true });
await page.locator('.move-btn').click({ force: true });
await shot('27-move');
await page.locator('.move-modal .btn-primary').click({ force: true });
await shot('28-welcome');
await closeModals();
// Late game in Ortaköy (night)
await page.evaluate(() => {
  const { store, app } = window.__simit;
  const d = store.data;
  d.district = 6;
  d.lale = 2.1e6;
  d.laleEarned = 2.1e6;
  d.run.stands = 10;
  d.run.levels = [480, 410, 402, 398, 360, 333, 312, 305, 298, 260];
  d.run.managers = Array(10).fill(true);
  d.run.cash = 4.5e22;
  d.run.earnedRun = 1.1e24;
  d.boostUntil = Date.now() + 5.5 * 3600 * 1000;
  app.refresh();
  app.go('stands');
});
await shot('30-late-stands');
console.log(JSON.stringify(errors));
await browser.close();
