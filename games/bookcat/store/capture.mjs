// Captures raw in-game screenshots for the store listings.
//   1) npm run dev (or: npm run build && npx vite preview --port 4175)
//   2) node store/capture.mjs [baseUrl]
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] ?? 'http://localhost:4175/').replace(/\/$/, '');

export const DEVICES = {
  iphone: { width: 430, height: 932, dpr: 3 }, // 1290 x 2796 (6.9")
  android: { width: 360, height: 720, dpr: 3 }, // 1080 x 2160
  ipad: { width: 1032, height: 1376, dpr: 2 }, // 2064 x 2752 (13")
};
const LANGS = (process.env.LANGS ?? 'tr,en').split(',');

/** A believable mid-game save: chapter 3, a streak, a few rare books. */
function seed(lang) {
  window.__bookcat.store.update((d) => {
    d.settings.lang = lang;
    d.settings.sound = false;
    d.settings.music = false;
    d.level = 24;
    d.coins = 2350;
    d.totalStars = 64;
    d.books = [0, 1];
    d.tutorial.done = true;
    d.stats.sessions = 12;
    d.daily.best = 9;
    const y = new Date(Date.now() - 86_400_000);
    d.daily.last = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    d.daily.streak = 6;
  });
}

const SCENES = {
  board: { q: '&level=160', steps: 18 },
  stacks: { q: '&level=160', steps: 12 },
  win: { q: '&level=12', steps: 400 },
  home: { q: '' },
  daily: { q: '', dialog: 'daily' },
  collection: { q: '', dialog: 'collection', books: [0, 1, 2, 3, 4] },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const only = process.env.SCENES?.split(',');
for (const [dev, vp] of Object.entries(DEVICES)) {
  if (process.env.DEVICES && !process.env.DEVICES.split(',').includes(dev)) continue;
  for (const lang of LANGS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, locale: lang, hasTouch: dev !== 'ipad' });
    const page = await ctx.newPage();
    await page.goto(`${base}/?e2e`);
    await page.waitForTimeout(800);
    await page.evaluate(seed, lang);
    for (const [id, sc] of Object.entries(SCENES)) {
      if (only && !only.includes(id)) continue;
      if (sc.books) await page.evaluate((b) => window.__bookcat.store.update((d) => { d.books = b; }), sc.books);
      await page.goto(`${base}/?e2e${sc.q}`);
      await page.waitForTimeout(1300);
      await page.evaluate(() => window.__bookcat.closeModals());
      for (let i = 0; i < (sc.steps ?? 0); i++) {
        const r = await page.evaluate(() => window.__bookcat.step());
        if (r === 'end') break;
        await page.waitForTimeout(90);
      }
      if (sc.dialog) await page.evaluate((dlg) => window.__bookcat.dialogs[dlg](), sc.dialog);
      await page.waitForTimeout(1500);
      const file = join(here, 'raw', dev, lang, `${id}.png`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file });
    }
    await ctx.close();
    console.log('captured', dev, lang);
  }
}
await browser.close();
