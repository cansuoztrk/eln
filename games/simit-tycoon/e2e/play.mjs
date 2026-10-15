// End-to-end playthrough with real taps and clicks (headless Chromium).
//   node e2e/play.mjs <url>
// Fails (exit 1) on any assertion or console error.
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://127.0.0.1:5180/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'tr', hasTouch: true });
// Simulates "the player left two hours ago": rewinds lastSeen before the app boots.
await ctx.addInitScript(() => {
  const k = 'simittycoon.save.v1';
  if (sessionStorage.getItem('rewind') && localStorage.getItem(k)) {
    const s = JSON.parse(localStorage.getItem(k));
    s.lastSeen = Date.now() - Number(sessionStorage.getItem('rewind'));
    localStorage.setItem(k, JSON.stringify(s));
    sessionStorage.removeItem('rewind');
  }
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!cond) failures++;
};
const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__simit.store.data)));
const click = (sel) => page.locator(sel).first().click({ force: true });
const tapStand = (i) => page.locator(`.stand[data-i="${i}"] .stand-icon`).dispatchEvent('pointerdown');
const buyStand = async (i) => {
  await page.locator(`.stand[data-i="${i}"] .stand-buy`).dispatchEvent('pointerdown');
  await page.locator(`.stand[data-i="${i}"] .stand-buy`).dispatchEvent('pointerup');
};

await page.goto(url + '?e2e', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// 1. First minute, as a new player.
check(await page.locator('.tut-bubble:not([hidden])').isVisible(), 'tutorial bubble greets the player');
for (let k = 0; k < 6; k++) {
  await tapStand(0);
  await page.waitForTimeout(1060);
}
let s = await state();
check(s.stats.taps >= 5, `tapping sells simit (taps=${s.stats.taps}, cash=${s.run.cash.toFixed(1)})`);
await buyStand(0);
await page.waitForTimeout(150);
s = await state();
check(s.run.levels[0] === 2, 'bought a second simit cart');

// 2. Open the tea house and hire Pamuk through the UI.
await page.evaluate(() => (window.__simit.game.run.cash += 1200));
await page.waitForTimeout(350);
await click('.stand[data-i="1"] .stand-buy');
await page.waitForTimeout(300);
s = await state();
check(s.run.levels[1] === 1, 'opened the tea house');
await click('.nav-btn[data-tab="cats"]');
await page.waitForTimeout(300);
await click('.cat-card .btn-buy.ok');
await page.waitForTimeout(400);
s = await state();
check(s.run.managers[0] === true, 'hired Pamuk the cat manager');
check(await page.locator('.hire-modal').isVisible(), 'hire celebration shows Pamuk');
await click('.hire-modal .btn-primary');
await page.waitForTimeout(300);

// 3. A managed stand earns on its own.
await click('.nav-btn[data-tab="stands"]');
const before = (await state()).run.earnedRun;
await page.waitForTimeout(2200);
const after = (await state()).run.earnedRun;
check(after > before, `Pamuk sells while idle (+${(after - before).toFixed(1)})`);

// 4. Recipes and buy-all.
await page.evaluate(() => (window.__simit.game.run.cash += 3e5));
await click('.nav-btn[data-tab="recipes"]');
await page.waitForTimeout(300);
await click('.tab-recipes .tab-intro .btn-primary');
await page.waitForTimeout(300);
s = await state();
check(s.run.upgrades.includes('u0_0'), 'bought the first recipe');

// 5. ×2 boost through the (mock) rewarded ad.
await click('.boost-btn');
await page.waitForTimeout(300);
await click('.boost-modal-body .btn-ad');
await page.waitForTimeout(3400);
await click('.mock-ad-close');
await page.waitForTimeout(400);
s = await state();
check(s.boostUntil > Date.now() + 3_500_000, 'rewarded ad gave a 2 h boost');
await page.locator('.modal-x').last().click({ force: true });
await page.waitForTimeout(300);

// 6. Seagull and ferry events.
const cash0 = (await state()).run.cash;
await page.evaluate(() => window.__simit.app.hud.spawnSeagull((g, x, y) => window.__simit.app.hud.coinBurst(x, y, '+', 3) || window.__simit.game.seagull(false)));
await page.waitForTimeout(3000);
await page.locator('.gull-fly').dispatchEvent('pointerdown');
await page.waitForTimeout(300);
check((await state()).run.cash > cash0, 'caught a seagull for a cash bonus');
await page.evaluate(() => window.__simit.app.hud.spawnFerry(() => window.__simit.game.startRush()));
await page.waitForTimeout(2800);
await click('.ferry-dock');
await page.waitForTimeout(200);
check(await page.evaluate(() => window.__simit.game.rushActive()), 'the ferry starts rush hour ×3');

// 7. Reach the goal and move to Kadıköy.
await page.evaluate(() => {
  const g = window.__simit.game;
  g.addCash(g.goal());
});
await page.waitForTimeout(400);
await click('.nav-btn[data-tab="districts"]');
await page.waitForTimeout(300);
check(!(await page.locator('.move-btn').isDisabled()), 'move button unlocks at the goal');
await click('.move-btn');
await page.waitForTimeout(300);
await click('.move-modal .btn-primary');
await page.waitForTimeout(600);
s = await state();
check(s.district === 1 && s.lale > 0 && s.run.stands === 7, `moved to Kadıköy (+${s.lale} tulips, 7 stands)`);
check(await page.locator('.welcome-modal').isVisible(), 'welcome screen celebrates the move');
await click('.welcome-modal .btn-primary');
await page.waitForTimeout(300);
check((await page.locator('.chip-district').innerText()).includes('Kadıköy'), 'HUD shows Kadıköy');

// 8. Cold start after two hours away: offline earnings, then the daily reward.
await page.evaluate(() => {
  const { game, store } = window.__simit;
  game.run.levels[0] = 30;
  game.run.managers[0] = true;
  sessionStorage.setItem('rewind', String(2 * 3600 * 1000));
  return store.flush();
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
check(await page.locator('.offline-modal').isVisible(), 'cold start shows the welcome-back offline earnings');
const c1 = (await state()).run.cash;
await click('.offline-modal .btn-ghost');
await page.waitForTimeout(600);
check((await state()).run.cash > c1, 'collected offline earnings');

// 9. Daily reward follows automatically, then quests and achievements.
check(await page.locator('.login-modal').isVisible(), 'daily reward follows the offline screen');
const g0 = (await state()).gold;
await click('.login-modal .btn-primary');
await page.waitForTimeout(300);
check((await state()).gold > g0, 'claimed the daily reward');
await page.waitForTimeout(500);
check(await page.locator('.offer-pop').isVisible(), 'starter pack offer appears after the first move');
await page.locator('.offer-pop .modal-x').click({ force: true });
await page.waitForTimeout(300);
await click('.side-ach');
await page.waitForTimeout(300);
check(await page.locator('.ach-modal').isVisible(), 'achievements open');
await page.locator('.modal-x').last().click({ force: true });
await page.waitForTimeout(250);

// 10. Shop: demo purchase of ×2 forever.
await click('.nav-btn[data-tab="shop"]');
await page.waitForTimeout(300);
await click('.perm .btn-buy');
await page.waitForTimeout(300);
await click('.modal-actions .btn-primary');
await page.waitForTimeout(400);
check((await state()).owned.includes('mult_x2'), 'bought Income ×2 forever (demo store)');

// 11. Language switch.
await click('.hud-right .icon-btn');
await page.waitForTimeout(300);
await page.selectOption('.set-select', 'en');
await page.waitForTimeout(500);
await page.evaluate(() => window.__simit.app.rebuild());
await page.waitForTimeout(400);
check((await page.locator('.nav-btn[data-tab="stands"]').innerText()).includes('Stands'), 'switched to English');

// 12. Save survives a reload.
await page.evaluate(() => window.__simit.store.flush());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
s = await state();
check(s.district === 1 && s.owned.includes('mult_x2'), 'progress persists across reloads');

check(errors.length === 0, `no console errors ${errors.length ? JSON.stringify(errors) : ''}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
