// Captures raw in-game screenshots for the store listings.
//   1) npm run build && npx vite preview --port 4174
//   2) node store/capture.mjs [baseUrl]
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] ?? 'http://localhost:4174/';
const now = Date.now();
const d = new Date();
const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const DEVICES = {
  iphone: { width: 430, height: 932, dpr: 3 }, // 1290 x 2796 (6.9")
  android: { width: 360, height: 720, dpr: 3 }, // 1080 x 2160
  ipad: { width: 1032, height: 1376, dpr: 2 }, // 2064 x 2752 (13")
};
const LANGS = ['tr', 'en'];

const all = (n, v) => Array(10).fill(0).map((_, i) => (i < n ? v(i) : typeof v(0) === 'boolean' ? false : 0));

function saveFor(lang, s) {
  return {
    v: 1,
    district: s.district,
    lale: s.lale,
    laleEarned: s.lale,
    lifetime: s.lifetime ?? s.earned * 1.3,
    gold: s.gold ?? 380,
    buyMode: s.buyMode ?? 10,
    // Filled in by the init script, relative to the page's own clock.
    boostUntil: 0,
    lastSeen: 0,
    run: {
      cash: s.cash,
      levels: s.levels,
      managers: s.managers,
      upgrades: s.upgrades ?? [],
      progress: s.levels.map((_, i) => ((i * 37) % 90) / 100),
      running: Array(10).fill(false),
      earnedRun: s.earned,
      stands: Math.min(10, 6 + s.district),
    },
    settings: { lang, sound: false, music: false, haptics: true, notifications: true },
    login: { last: todayKey, streak: 9, day: 1 },
    quests: { date: '', list: [], chest: false },
    achievements: { best: s.levels, festivals: 3, claimed: [] },
    stats: { sessions: 14, taps: 2400, seagulls: 41, ferries: 12, playSeconds: 30000, firstOpen: now - 9 * 86_400_000, lastOpen: now },
    tutorial: { step: 7, done: true, tips: ['gull', 'ferry', 'recipes-seen', 'boost-seen'] },
    starterOfferUntil: 0,
    owned: ['starter_pack'],
  };
}

const SCENES = {
  stands: {
    save: { district: 2, lale: 2190, earned: 4.2e16, cash: 3.4e15, boost: 3.2, levels: [210, 160, 140, 120, 104, 90, 75, 48, 0, 0], managers: all(8, () => true), upgrades: ['u0_0', 'u0_1', 'u0_2', 'u0_3', 'u0_4', 'u0_5', 'u0_all', 'u1_0'] },
    async act(page) {
      await page.evaluate(() => {
        const { app } = window.__simit;
        for (const i of [0, 2, 4]) {
          const r = document.querySelector(`.stand[data-i="${i}"] .stand-icon`).getBoundingClientRect();
          app.hud.coinBurst(r.left + r.width / 2, r.top + r.height / 3, ['+4,12T', '+880B', '+96,3T'][i / 2], 6);
        }
      });
      await page.waitForTimeout(420);
    },
  },
  cats: {
    save: { district: 3, lale: 85_000, earned: 1.2e19, cash: 3.1e9, levels: [140, 102, 96, 84, 70, 62, 41, 30, 12, 0], managers: [true, true, true, true, true, true, false, false, false, false] },
    async act(page) {
      await page.locator('.nav-btn[data-tab="cats"]').click({ force: true });
      await page.waitForTimeout(500);
    },
  },
  districts: {
    save: { district: 3, lale: 85_000, earned: 4.0e20, cash: 6.2e19, levels: [260, 210, 190, 180, 160, 140, 120, 101, 64, 0], managers: all(9, () => true) },
    async act(page) {
      await page.locator('.nav-btn[data-tab="districts"]').click({ force: true });
      await page.waitForTimeout(3300); // let the "goal reached" banner slide away
    },
  },
  night: {
    save: { district: 6, lale: 51_600_000_000, earned: 8.3e30, cash: 4.5e29, boost: 6.5, levels: [480, 410, 402, 398, 360, 333, 312, 305, 298, 260], managers: all(10, () => true) },
    async act(page) {
      await page.evaluate(() => window.__simit.app.hud.spawnSeagull(() => {}));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.__simit.app.hud.spawnFerry(() => {}));
      await page.waitForTimeout(2800);
    },
  },
  offline: {
    save: { district: 4, lale: 2_520_000, earned: 3.1e23, cash: 1.1e22, away: 3.6, levels: [330, 290, 260, 240, 220, 205, 190, 170, 150, 120], managers: all(10, () => true) },
    async act(page) {
      await page.waitForTimeout(600);
    },
  },
  recipes: {
    save: { district: 1, lale: 78, earned: 2.4e11, cash: 9.6e12, levels: [180, 120, 100, 80, 64, 52, 30, 0, 0, 0], managers: all(7, () => true), upgrades: ['u0_0', 'u0_1', 'u0_2'] },
    async act(page) {
      await page.locator('.nav-btn[data-tab="recipes"]').click({ force: true });
      await page.waitForTimeout(500);
    },
  },
  welcome: {
    save: { district: 6, lale: 51_600_000_000, earned: 2.2e31, cash: 3.1e29, levels: [500, 440, 420, 410, 380, 350, 330, 320, 300, 280], managers: all(10, () => true) },
    async act(page) {
      await page.waitForTimeout(3200);
      await page.evaluate(() => window.__simit.app.move());
      await page.waitForTimeout(900);
    },
  },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const devs = process.env.DEVICES ? process.env.DEVICES.split(',') : Object.keys(DEVICES);
const only = process.env.SCENES ? process.env.SCENES.split(',') : Object.keys(SCENES);
for (const dev of devs) {
  const dv = DEVICES[dev];
  for (const lang of LANGS) {
    for (const id of only) {
      const scene = SCENES[id];
      const ctx = await browser.newContext({ viewport: { width: dv.width, height: dv.height }, deviceScaleFactor: dv.dpr, isMobile: dev !== 'ipad', hasTouch: true, locale: lang === 'tr' ? 'tr-TR' : 'en-US' });
      const save = JSON.stringify(saveFor(lang, scene.save));
      await ctx.addInitScript(
        ({ s, away, boost }) => {
          if (!sessionStorage.getItem('seeded')) {
            const o = JSON.parse(s);
            const t = Date.now();
            o.lastSeen = t - away;
            o.boostUntil = boost ? t + boost : 0;
            localStorage.setItem('simittycoon.save.v1', JSON.stringify(o));
            sessionStorage.setItem('seeded', '1');
          }
        },
        { s: save, away: (scene.save.away ?? 0) * 3_600_000, boost: (scene.save.boost ?? 0) * 3_600_000 },
      );
      const page = await ctx.newPage();
      page.on('pageerror', (e) => console.error('pageerror', e.message));
      await page.goto(base + '?e2e');
      await page.waitForTimeout(1300);
      await scene.act(page);
      const file = join(here, 'raw', dev, lang, `${id}.png`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file });
      await ctx.close();
    }
    console.log('captured', dev, lang);
  }
}
await browser.close();
