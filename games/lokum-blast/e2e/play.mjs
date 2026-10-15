// End-to-end play-through with screenshots: node e2e/play.mjs <baseUrl> <outDir>
import { chromium } from 'playwright-core';

const base = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? '/tmp/shots';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'tr-TR' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const wait = (ms) => page.waitForTimeout(ms);
const closeAd = async () => {
  if (await page.locator('.mock-ad').count()) {
    await wait(3200);
    await page.locator('.mock-ad-close').click();
    await wait(400);
  }
};

await page.goto(base + '?e2e');
await wait(1200);
await page.locator('.login-modal .btn-primary').click();
await wait(500);
await page.locator('.reward-modal .btn-primary').click();
await wait(400);

// ── Classic with real mouse drags ──
await page.locator('.btn-mode').first().click();
await wait(900);
async function dragBest(holdShot) {
  const m = await page.evaluate(() => {
    const g = window.__game.debug();
    const mv = window.__lokum.bestMove(g.session);
    if (!mv) return null;
    const sc = g.scene;
    const piece = g.session.tray[mv.slot];
    const from = sc['slotCenter'](mv.slot);
    const lift = sc.cell * 0.4;
    const to = { x: sc.boardX + (mv.c + piece.shape.w / 2) * sc.cell, y: sc.boardY + (mv.r + piece.shape.h / 2) * sc.cell + lift };
    return { from, to };
  });
  if (!m) return false;
  await page.mouse.move(m.from.x, m.from.y);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(m.from.x + ((m.to.x - m.from.x) * k) / 12, m.from.y + ((m.to.y - m.from.y) * k) / 12);
  await wait(120);
  if (holdShot) await shot(holdShot);
  await page.mouse.up();
  await wait(450);
  return true;
}
for (let i = 0; i < 6; i++) await dragBest(i === 4 ? '10-classic-drag' : null);
await shot('11-classic-after-drags');
console.log('score after 6 real drags', await page.evaluate(() => window.__game.debug().session.score));

// Fast autoplay until stuck; capture a multi-line clear.
let captured = false;
for (let i = 0; i < 400; i++) {
  const r = await page.evaluate(() => {
    const g = window.__game.debug();
    if (g.session.stuck()) return { stuck: true };
    const mv = window.__lokum.bestMove(g.session);
    if (!mv) return { stuck: true };
    const piece = g.session.tray[mv.slot];
    const prev = g.session.board.previewLines(piece.shape, mv.r, mv.c);
    g.place(mv.slot, mv.r, mv.c);
    return { lines: prev.rows.length + prev.cols.length };
  });
  if (r.stuck) break;
  if (!captured && r.lines >= 2) {
    await wait(160);
    await shot('12-classic-multiclear');
    captured = true;
  }
  await wait(30);
}
await wait(1200);
await shot('13-classic-revive');
const giveup = page.locator('.modal-card .btn-ghost').last();
if (await giveup.count()) {
  await giveup.click();
  await wait(2200);
  await shot('14-classic-gameover');
}
console.log('classic final', JSON.stringify(await page.evaluate(() => ({ score: window.__game.debug().session.score, best: window.__lokum.store.data.best, coins: window.__lokum.store.data.coins }))));
await page.locator('.over-modal .btn-ghost').click();
await wait(1500);
await closeAd();

// ── Journey levels ──
for (let lvl = 1; lvl <= 3; lvl++) {
  await page.locator('.btn-play').click({ force: true });
  await wait(500);
  if (lvl === 1) await shot('20-level-popup');
  await page.locator('.level-modal .btn-primary').click();
  await wait(900);
  if (lvl === 1) await shot('21-level-start');
  for (let i = 0; i < 300; i++) {
    const st = await page.evaluate(() => {
      const g = window.__game.debug();
      const s = g.session;
      if (s.goalsComplete() || s.outOfMoves() || s.stuck()) return 'end';
      const mv = window.__lokum.bestMove(s);
      if (!mv) return 'end';
      g.place(mv.slot, mv.r, mv.c);
      return 'ok';
    });
    if (st === 'end') break;
    await wait(40);
  }
  await wait(2600);
  await shot(`22-level-${lvl}-end`);
  const win = await page.locator('.win-modal').count();
  console.log(`level ${lvl}:`, win ? 'WIN' : 'not win');
  if (win) await page.locator('.win-modal .btn-ghost').click();
  else {
    const b = page.locator('.modal-card .btn-ghost').last();
    if (await b.count()) await b.click();
    await wait(600);
    const h = page.locator('.modal-card .btn-ghost').first();
    if (await h.count()) await h.click();
  }
  await wait(1500);
  await closeAd();
  await page.locator('[data-nav="home"]').click();
  await wait(400);
}

// ── Bazaar ──
await page.locator('[data-nav="bazaar"]').click();
await wait(500);
await shot('30-bazaar');
for (let k = 0; k < 3; k++) {
  const b = page.locator('.task .btn-star:not(.poor)');
  if (await b.count()) {
    await b.first().click();
    await wait(500);
  }
}
await shot('31-bazaar-restored');

// ── Quests / Shop / Wheel / Settings ──
await page.locator('[data-nav="quests"]').click();
await wait(400);
await shot('40-quests');
await page.locator('[data-nav="shop"]').click();
await wait(600);
await shot('50-shop-top');
await page.evaluate(() => document.getElementById('shop-coins').scrollIntoView());
await wait(300);
await shot('51-shop-coins');
await page.evaluate(() => document.getElementById('shop-bundles').scrollIntoView());
await wait(300);
await shot('52-shop-bundles');
await page.evaluate(() => document.getElementById('shop-themes').scrollIntoView());
await wait(300);
await shot('53-shop-themes');
await page.locator('[data-nav="home"]').click();
await wait(400);
await shot('55-home-after');
await page.locator('.side-btn').nth(1).click({ force: true });
await wait(500);
await shot('60-wheel');
await page.locator('.wheel-modal .btn-primary').click();
await wait(4800);
await shot('61-wheel-won');
await page.locator('.reward-modal .btn-primary').click();
await wait(300);
await page.locator('.wheel-modal .modal-x').click();
await wait(300);
await page.locator('.topbar .icon-btn').click();
await wait(400);
await shot('70-settings');
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
