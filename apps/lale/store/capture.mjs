// Captures raw app screenshots for the store listings.
//   1) npm run dev   2) node store/capture.mjs [baseUrl]
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] ?? 'http://localhost:5174/').replace(/\/$/, '');

const DEVICES = {
  iphone: { width: 430, height: 932, dpr: 3 }, // 1290 x 2796 (6.9")
  android: { width: 360, height: 720, dpr: 3 }, // 1080 x 2160
};
const LANGS = (process.env.LANGS ?? 'tr,en').split(',');

/** Six weeks of believable study: sessions, questions, mocks, a streak and a few friends. */
function seed(lang) {
  const { store } = window.lale;
  const now = Date.now();
  const day = 86_400_000;
  const iso = (dt) => {
    const d = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    const n = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - n);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return { year: d.getUTCFullYear(), week: Math.ceil(((d - y0) / day + 1) / 7) };
  };
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const subjects = ['matematik', 'turkce', 'fizik', 'kimya', 'biyoloji', 'geometri', 'tarih'];
  const byTier = { 0: ['kirmizi', 'sari', 'pembe', 'beyaz', 'turuncu', 'mor'], 1: ['gulhane', 'emirgan', 'bogaz', 'safran', 'leylak', 'mercan'], 2: ['istanbul', 'geceyarisi', 'alev', 'papagan', 'kartanesi', 'yakut'], 3: ['laledevri', 'sultan', 'zumrut', 'tekir'] };
  store.update((d) => {
    d.onboarded = true;
    d.name = lang === 'tr' ? 'Elif' : 'Emma';
    d.settings.lang = lang;
    d.settings.sound = false;
    d.settings.theme = 'light';
    d.profiles = [{ exam: 'yks', field: 'say', examDate: null }];
    d.goals = { minutes: 180, questions: 120 };
    d.sessions = [];
    d.questions = [];
    for (let i = 42; i >= 0; i--) {
      if (rnd() < 0.1 && i > 1) continue;
      const n = 2 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) {
        const at = new Date(now - i * day);
        at.setHours(9 + Math.floor(rnd() * 12), Math.floor(rnd() * 60), 0, 0);
        if (at.getTime() > now - 3600_000) continue;
        const min = [15, 25, 25, 25, 50, 40, 30, 60, 90][Math.floor(rnd() * 9)];
        const tier = min >= 90 ? 3 : min >= 50 ? 2 : min >= 25 ? 1 : 0;
        const pool = byTier[tier];
        d.sessions.push({ id: `s${i}-${k}`, at: at.getTime(), sec: min * 60, subject: subjects[Math.floor(rnd() * subjects.length)], mode: 'pomodoro', tulip: pool[Math.floor(rnd() * pool.length)], garden: i > 24 ? 'gulhane' : 'emirgan' });
      }
      if (rnd() < 0.85) d.questions.push({ id: `q${i}`, at: now - i * day - 7200_000, subject: subjects[Math.floor(rnd() * subjects.length)], d: 18 + Math.floor(rnd() * 30), y: Math.floor(rnd() * 9), b: Math.floor(rnd() * 6) });
    }
    d.sessions.sort((a, b) => a.at - b.at);
    d.collected = {};
    for (const x of d.sessions) if (x.tulip) d.collected[x.tulip] = (d.collected[x.tulip] ?? 0) + 1;
    d.garden = 'emirgan';
    d.mocks = [58.5, 63.25, 66, 71.5, 69.75, 76.25, 81].map((net, i) => ({ id: `m${i}`, at: now - (40 - i * 6) * day, kind: 'tyt', name: ['Limit', '345', 'Bilgi Sarmal', 'Apotemi', 'Limit', '3D', 'Özdebir'][i], scores: { 'tyt-tr': { d: 29 + i, y: 6, b: 5 - Math.min(5, i) }, 'tyt-sos': { d: 12 + (i % 3), y: 4, b: 4 - (i % 3) }, 'tyt-mat': { d: 18 + i * 2, y: 8, b: 14 - i * 2 }, 'tyt-fen': { d: 8 + i, y: 5, b: 7 - i } } }));
    const y = new Date(now - day);
    d.streak = { count: 23, best: 23, last: `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`, bulbs: 2 };
    const w = iso(new Date(now));
    const f = (name, minutes, questions, streak, tulips, exam = 'yks') => ({ code: `LALE-${name}`, added: now, summary: { name, exam, year: w.year, week: w.week, minutes, questions, streak, tulips } });
    d.friends = lang === 'tr' ? [f('Deniz', 905, 240, 31, 21), f('Mert', 610, 310, 9, 14), f('Zeynep', 480, 150, 12, 11), f('Can', 300, 90, 4, 6, 'lgs')] : [f('Noah', 905, 240, 31, 21), f('Mia', 610, 310, 9, 14), f('Liam', 480, 150, 12, 11), f('Ava', 300, 90, 4, 6)];
    d.timer.mode = 'timer';
    d.timer.minutes = 50;
    d.timer.subject = 'matematik';
    d.tips = ['seeded'];
  });
  return store.flush();
}

const SCENES = ['focus', 'session', 'garden', 'track', 'stats', 'friends'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const [dev, vp] of Object.entries(DEVICES)) {
  if (process.env.DEVICES && !process.env.DEVICES.split(',').includes(dev)) continue;
  for (const lang of LANGS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, locale: lang === 'tr' ? 'tr-TR' : 'en-US', hasTouch: true, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`${base}/?debug`);
    await page.waitForTimeout(700);
    await page.evaluate(seed, lang);
    await page.reload();
    await page.waitForTimeout(900);
    for (const id of SCENES) {
      await page.evaluate(() => window.lale.closeModals());
      if (id === 'session') {
        await page.evaluate(() => window.lale.tab('focus'));
        await page.waitForTimeout(300);
        await page.locator('.btn-start').click();
        await page.waitForTimeout(400);
        await page.evaluate(() => window.lale.skip(31 * 60 + 12));
      } else {
        if (await page.locator('.session').count()) await page.evaluate(() => window.lale.store.update((d) => void (d.running = null)));
        await page.evaluate((t) => window.lale.tab(t), id);
        if (id === 'track') await page.locator('.track .seg button').nth(1).click();
      }
      await page.waitForTimeout(1300);
      const file = join(here, 'raw', dev, lang, `${id}.png`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file });
    }
    await ctx.close();
    console.log('captured', dev, lang);
  }
}
await browser.close();
