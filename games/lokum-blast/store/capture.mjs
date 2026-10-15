// Captures raw in-game screenshots for the store listings.
//   1) npm run build && npx vite preview --port 4173
//   2) node store/capture.mjs [baseUrl]
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] ?? 'http://localhost:4173/';
const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

export const DEVICES = {
  iphone: { width: 430, height: 932, dpr: 3 }, // 1290 x 2796 (6.9")
  android: { width: 360, height: 720, dpr: 3 }, // 1080 x 2160
  ipad: { width: 1032, height: 1376, dpr: 2 }, // 2064 x 2752 (13")
};
const LANGS = ['tr', 'en'];

function saveFor(lang, extra = {}) {
  return {
    settings: { lang, sound: false, music: false, haptics: true, notifications: true },
    login: { last: todayKey, streak: 6, day: 5 },
    coins: 12450,
    level: 24,
    stars: 9,
    totalStars: 58,
    best: 18720,
    boosters: { undo: 3, hammer: 2, refresh: 4, bomb: 2 },
    themes: ['lokum', 'pati', 'iznik', 'gece', 'saray'],
    stats: { games: 40, sessions: 12, levelsWon: 23 },
    tutorial: { classic: true, journey: true, boosters: true },
    ...extra,
  };
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

async function newPage(dev, lang, extra) {
  const d = DEVICES[dev];
  const ctx = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.dpr, isMobile: dev !== 'ipad', hasTouch: true, locale: lang === 'tr' ? 'tr-TR' : 'en-US' });
  const save = JSON.stringify(saveFor(lang, extra));
  await ctx.addInitScript((s) => localStorage.setItem('lokumblast.save.v1', s), save);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(base + '?e2e');
  await page.waitForTimeout(900);
  return { page, ctx };
}

/** Classic board staged right before a triple clear. */
async function stageClassic(page, { score = 9840, combo = 2 } = {}) {
  await page.evaluate(
    ({ score, combo }) => {
      const L = window.__lokum;
      L.app.playClassic(false);
      const g = window.__game.debug();
      const s = g.session;
      const b = s.board;
      const pal = [0, 1, 2, 3, 4, 5, 6];
      let seed = 3;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const set = (r, c, f) => b.set(r * 8 + c, f ?? pal[Math.floor(rnd() * 7)]);
      for (let c = 0; c < 6; c++) {
        set(4, c, 0);
        set(5, c, c < 3 ? 6 : 4);
      }
      for (const r of [0, 1, 2, 3, 6, 7]) set(r, 7, 2);
      const extra = [
        [7, 0], [7, 1], [7, 2], [7, 4], [7, 5], [6, 0], [6, 1], [6, 3], [6, 4], [6, 5],
        [3, 0], [3, 1], [3, 2], [3, 5], [2, 1], [2, 2], [2, 5], [1, 2], [0, 4], [0, 5],
      ];
      for (const [r, c] of extra) set(r, c);
      b.kind[6 * 8 + 3] = 1; // a golden lokum
      s.tray = [L.makePiece(L.SHAPE_BY_ID.o2, 5), L.makePiece(L.SHAPE_BY_ID.T1, 1), L.makePiece(L.SHAPE_BY_ID.i3h, 3)];
      s.score = score;
      s.combo.combo = combo;
      g.scene.spawnTray();
      g.scene['spawnT'] = [1, 1, 1];
      g.scene.refreshFits();
      window.__game['shownScore'] = score;
      window.__game['scoreEl'].textContent = new Intl.NumberFormat(document.documentElement.lang).format(score);
    },
    { score, combo },
  );
  await page.waitForTimeout(400);
}

async function holdPreview(page, slot, r, c) {
  await page.evaluate(
    ({ slot, r, c }) => {
      const g = window.__game.debug();
      const sc = g.scene;
      const piece = g.session.tray[slot];
      const lift = sc.cell * 1.9;
      sc['drag'] = {
        slot,
        piece,
        x: sc.boardX + (c + piece.shape.w / 2) * sc.cell,
        y: sc.boardY + (r + piece.shape.h / 2 - 0.45) * sc.cell + lift,
        lift,
        grabT: 1,
        gr: -1,
        gc: -1,
        valid: false,
        preview: { rows: [], cols: [] },
      };
      sc['updateDragTarget']();
    },
    { slot, r, c },
  );
  await page.waitForTimeout(250);
}

const scenes = {
  async combo(page, file) {
    await stageClassic(page);
    await page.evaluate(() => window.__game.debug().place(0, 4, 6));
    await page.waitForTimeout(230);
    await page.screenshot({ path: file });
  },
  async preview(page, file) {
    await stageClassic(page, { score: 7260, combo: 0 });
    await holdPreview(page, 0, 4, 6);
    await page.screenshot({ path: file });
  },
  async journey(page, file) {
    await page.evaluate(() => {
      window.__lokum.store.data.level = 36;
      window.__lokum.app.playLevel();
    });
    await page.waitForTimeout(500);
    await page.locator('.level-modal .btn-primary').click();
    await page.waitForTimeout(700);
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const g = window.__game.debug();
        const mv = window.__lokum.bestMove(g.session);
        if (mv) g.place(mv.slot, mv.r, mv.c);
      });
      await page.waitForTimeout(260);
    }
    await page.waitForTimeout(1300);
    const mv = await page.evaluate(() => window.__lokum.bestMove(window.__game.debug().session));
    if (mv) await holdPreview(page, mv.slot, mv.r, mv.c);
    await page.screenshot({ path: file });
  },
  async bazaar(page, file) {
    await page.evaluate(() => {
      const st = window.__lokum.store;
      st.data.bazaar = { district: 2, done: [0, 1, 2, 3] };
      st.data.stars = 9;
      window.__lokum.app.bazaar();
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: file });
  },
  async theme(page, file) {
    await page.evaluate(() => {
      window.__lokum.store.data.theme = 'gece';
    });
    await stageClassic(page, { score: 15320, combo: 0 });
    await holdPreview(page, 0, 4, 6);
    await page.screenshot({ path: file });
  },
  async saray(page, file) {
    await page.evaluate(() => {
      window.__lokum.store.data.theme = 'saray';
      window.__lokum.store.data.best = 31250;
    });
    await stageClassic(page, { score: 21480, combo: 3 });
    await page.evaluate(() => window.__game.debug().place(0, 4, 6));
    await page.waitForTimeout(230);
    await page.screenshot({ path: file });
  },
  async wheel(page, file) {
    await page.evaluate(() => window.__lokum.app.home());
    await page.waitForTimeout(400);
    await page.locator('.side-btn').nth(1).click({ force: true });
    await page.waitForTimeout(700);
    await page.screenshot({ path: file });
  },
  async home(page, file) {
    await page.evaluate(() => window.__lokum.app.home());
    await page.waitForTimeout(900);
    await page.screenshot({ path: file });
  },
};

const only = process.env.SCENES ? process.env.SCENES.split(',') : Object.keys(scenes);
const devs = process.env.DEVICES ? process.env.DEVICES.split(',') : Object.keys(DEVICES);
for (const dev of devs) {
  for (const lang of LANGS) {
    for (const name of only) {
      const file = join(here, 'raw', dev, lang, `${name}.png`);
      mkdirSync(dirname(file), { recursive: true });
      const { page, ctx } = await newPage(dev, lang);
      try {
        await scenes[name](page, file);
        console.log('captured', dev, lang, name);
      } catch (e) {
        console.error('FAILED', dev, lang, name, e.message);
      }
      await ctx.close();
    }
  }
}
await browser.close();
