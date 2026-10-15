// End-to-end checks in headless Chromium against a running build.
//   npm run dev   (or: npm run build && npx vite preview --port 4175)
//   node e2e/play.mjs http://localhost:5173/
// Every check prints ✓/✗; the process exits non-zero if any check fails.
import { chromium } from 'playwright-core';

const base = (process.argv[2] ?? 'http://localhost:5173/').replace(/\/$/, '');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'tr', hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let failed = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${extra ? ` (${extra})` : ''}`);
  if (!ok) failed++;
};
const wait = (ms) => page.waitForTimeout(ms);
const data = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__bookcat.store.data)));
const state = () => page.evaluate(() => {
  const s = window.__bookcat.app.game?.session;
  return s && { slots: s.state.slots, movesLeft: s.state.movesLeft, movesUsed: s.state.movesUsed, won: s.won, lost: s.lost, budget: s.budget };
});
const open = async (q = '') => {
  await page.goto(`${base}/?e2e${q}`);
  await wait(1200);
};
const closeModals = async () => {
  await page.evaluate(() => window.__bookcat.closeModals());
  await wait(250);
};
const playOut = async (mode = 'best', max = 400) => {
  for (let i = 0; i < max; i++) {
    if ((await page.evaluate((m) => window.__bookcat.step(m), mode)) === 'end') return;
    await wait(40);
  }
};
const click = (sel) => page.locator(sel).first().click({ force: true });
const booster = (i) => click(`.boosters .booster:nth-child(${i})`);

// 1. First launch
await open();
await page.evaluate(() => localStorage.clear());
await open();
await wait(600);
await closeModals();
let d = await data();
check('home screen renders', await page.locator('.screen.home').isVisible());
check('fresh save: level 1, 200 coins, 3 hints, 2 paws', d.level === 1 && d.coins === 200 && d.boosters.hint === 3 && d.boosters.paw === 2, JSON.stringify({ level: d.level, coins: d.coins, b: d.boosters }));

// 2. Tutorial and the onboarding deal
await click('.btn-play');
await wait(1200);
check('level 1 opens with the tutorial bubble', await page.locator('.tut').isVisible());
check('a category card starts face up', (await page.locator('.card.cat:not(.down)').count()) >= 1);

// 3. Tap-to-play and undo
await click('.card.cat:not(.down)');
await wait(500);
let s = await state();
check('tapping the shelf label opens a shelf (1 move)', s.slots.some(Boolean) && s.movesUsed === 1, JSON.stringify(s));
await booster(1);
await wait(400);
s = await state();
check('undo puts it back but keeps the move spent', !s.slots.some(Boolean) && s.movesUsed === 1, JSON.stringify(s));

// 4. Hint
await booster(2);
await wait(500);
d = await data();
check('hint highlights a move and costs one hint', (await page.locator('.hint').count()) > 0 && d.boosters.hint === 2, `hints ${d.boosters.hint}`);

// 5. Win level 1
const before = d.coins;
await closeModals();
await playOut();
await wait(1500);
d = await data();
check('level 1 is won by the solver line', (await state())?.won === true);
check('win dialog shows', (await page.locator('.modal-card').count()) > 0);
check('progress saved: level 2, coins up, tutorial done', d.level === 2 && d.coins > before && d.tutorial.done, JSON.stringify({ level: d.level, coins: d.coins }));
check('3 stars recorded for level 1', d.levelStars?.[0] === 3 || d.levelStars?.['1'] === 3 || d.totalStars >= 3, JSON.stringify(d.levelStars));
await page.locator('.modal-card .btn-green').first().click();
await wait(1500);
check('“Next level” opens level 2', (await page.locator('.hud').innerText().catch(() => '')).includes('2') || (await page.evaluate(() => window.__bookcat.app.game?.session.spec.n)) === 2);

// 6. Lose → buy moves with coins → lose again (price escalates) → watch an ad
await page.evaluate(() => window.__bookcat.store.update((x) => { x.coins = 1000; }));
await open('&level=5');
await closeModals();
await playOut('deck', 200);
await wait(1200);
const loseText = await page.locator('.modal-card').innerText().catch(() => '');
check('running out of moves offers +10 moves', loseText.includes('200'), loseText.replace(/\n/g, ' ').slice(0, 80));
await page.locator('.modal-card .btn-wide:not(.btn-video)').first().click();
await wait(600);
s = await state();
d = await data();
check('coins buy +10 moves (−200 coins)', s.movesLeft === 10 && d.coins === 800, JSON.stringify({ left: s.movesLeft, coins: d.coins }));
await playOut('deck', 50);
await wait(1200);
const lose2 = await page.locator('.modal-card').innerText().catch(() => '');
check('second refill costs 350', lose2.includes('350'));
await page.locator('.modal-card .btn-video').first().click();
await wait(500);
check('rewarded video shows the test ad', await page.locator('.mock-ad').isVisible());
await wait(3300);
await click('.mock-ad-close');
await wait(600);
s = await state();
check('watching the ad adds +10 moves', s.movesLeft === 10, `left ${s.movesLeft}`);
check('extra moves cap the result at one star', (await page.evaluate(() => window.__bookcat.app.game.session.stars())) === 1);

// 7. Retry resets the level
await playOut('deck', 50);
await wait(1200);
await page.locator('.modal-card .btn-wood').first().click();
await wait(1200);
s = await state();
check('“Try again” restarts with a full budget', s.movesUsed === 0 && s.movesLeft === s.budget, JSON.stringify(s));

// 8. Paw fetches a book for an open shelf
await open('&level=20');
await closeModals();
for (let i = 0; i < 30; i++) {
  const st = await state();
  if (st.slots.some((x) => x && x.count < 99)) break;
  await page.evaluate(() => window.__bookcat.step());
  await wait(40);
}
const pawsBefore = (await data()).boosters.paw;
const countBefore = (await state()).slots.reduce((a, x) => a + (x ? x.count : 0), 0) + (await page.evaluate(() => window.__bookcat.app.game.session.state.done.length)) * 100;
await booster(3);
await wait(700);
const countAfter = (await state()).slots.reduce((a, x) => a + (x ? x.count : 0), 0) + (await page.evaluate(() => window.__bookcat.app.game.session.state.done.length)) * 100;
check('paw shelves a book and costs one paw', countAfter > countBefore && (await data()).boosters.paw === pawsBefore - 1, `${countBefore}→${countAfter}`);

// 9. Resume a level in progress
const used = (await state()).movesUsed;
await click('.hud .icon-btn');
await wait(500);
const quit = page.locator('.modal-card .btn').first();
if (await quit.count()) await quit.click();
await wait(800);
await open('&level=20');
check('a level in progress resumes where it was left', (await state()).movesUsed === used, `${used} vs ${(await state()).movesUsed}`);

// 10. Daily Shelf
const coinsDaily = (await data()).coins;
await open('&daily');
await closeModals();
await playOut();
await wait(1500);
d = await data();
check('Daily Shelf win starts a streak and pays 100+', d.daily.streak === 1 && d.coins >= coinsDaily + 100, JSON.stringify({ streak: d.daily.streak, coins: d.coins - coinsDaily }));
const share = await page.locator('.modal-card').innerText().catch(() => '');
check('daily win offers sharing', share.length > 0);

// 11. Shop (demo purchases)
await open();
await closeModals();
const coinsShop = (await data()).coins;
await page.evaluate(() => window.__bookcat.dialogs.shop());
await wait(500);
const rows = page.locator('.modal-card .product');
const n = await rows.count();
let coinRow = null;
for (let i = 0; i < n; i++) if ((await rows.nth(i).innerText()).includes('24,99')) coinRow = rows.nth(i);
check('shop lists Turkish prices', coinRow !== null);
await coinRow.locator('.btn-buy').click();
await wait(400);
await page.locator('.modal-card .btn').filter({ hasText: /Satın al/ }).first().click();
await wait(800);
check('buying 600 coins adds 600', (await data()).coins === coinsShop + 600, `${coinsShop}→${(await data()).coins}`);

// 12. Interstitial pacing: never before level 12, then after wins only
await closeModals();
await page.evaluate(() => window.__bookcat.store.update((x) => { x.level = 14; x.ads.sinceInterstitial = 5; x.ads.lastInterstitial = 0; }));
await open('&level=14');
await closeModals();
await playOut();
await wait(1500);
await page.locator('.modal-card .btn-green').first().click();
await wait(900);
check('an interstitial follows a won level after level 12', await page.locator('.mock-ad').isVisible());
await wait(2300);
await click('.mock-ad-close');
await wait(600);

// 13. Language switch and persistence
await open();
await closeModals();
await page.evaluate(() => window.__bookcat.dialogs.settings());
await wait(400);
await page.locator('.modal-card button', { hasText: 'Deutsch' }).first().click();
await wait(900);
const home = await page.locator('.screen.home').innerText();
check('switching to German translates the shop front', home.includes('Regal des Tages') || home.includes('Level'), home.slice(0, 60).replace(/\n/g, ' '));
const saved = await data();
await page.reload();
await wait(1500);
const after = await data();
check('save survives a reload', after.coins === saved.coins && after.level === saved.level && after.settings.lang === 'de');

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
