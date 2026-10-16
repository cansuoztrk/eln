// Visual tour: onboarding, every tab, sheets and a full focus session.
// Usage: node e2e/tour.mjs [baseUrl] [outDir] [lang] [theme]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:5174/';
const OUT = process.argv[3] ?? 'e2e/shots';
const LANG = process.argv[4] ?? 'tr';
const THEME = process.argv[5] ?? 'light';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: LANG === 'tr' ? 'tr-TR' : LANG, colorScheme: THEME === 'dark' ? 'dark' : 'light' });
page.setDefaultTimeout(6000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => {
  await wait(450);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
};
const click = async (sel) => {
  await page.locator(sel).first().click();
  await wait(250);
};

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await wait(600);

// ── onboarding ──
await shot('01-welcome');
await click('.step-welcome .btn-primary');
await shot('02-exam');
await click('.exam-opt >> nth=0');
await shot('03-field');
await click('.field-grid .exam-opt >> nth=0');
await page.fill('.input.big', 'Elif');
await shot('04-name');
await click('.onboard-body .btn-primary');
await shot('05-goal');
await click('.onboard-body .btn-primary');
await shot('06-ready');
await click('.onboard-body .btn-primary');
await wait(400);
await shot('07-focus-empty');

// ── seed a realistic month of study ──
await page.evaluate((lang) => {
  const { store } = window.lale;
  const d = store.data;
  const subjects = ['matematik', 'turkce', 'fizik', 'kimya', 'biyoloji', 'geometri', 'tarih'];
  const tulips = ['kirmizi', 'sari', 'pembe', 'beyaz', 'turuncu', 'mor', 'gulhane', 'emirgan', 'bogaz', 'safran', 'leylak', 'mercan', 'istanbul', 'alev', 'papagan', 'yakut', 'laledevri', 'sultan'];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const now = Date.now();
  const day = 86_400_000;
  d.sessions = [];
  d.questions = [];
  for (let i = 40; i >= 0; i--) {
    if (rnd() < 0.12 && i > 2) continue;
    const n = 2 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const base = new Date(now - i * day);
      base.setHours(9 + Math.floor(rnd() * 12), Math.floor(rnd() * 60), 0, 0);
      if (base.getTime() > now) continue;
      const min = [25, 25, 25, 50, 40, 30, 90][Math.floor(rnd() * 7)];
      const tier = min >= 90 ? 16 : min >= 50 ? 12 : min >= 25 ? 6 : 0;
      d.sessions.push({ id: `s${i}-${k}`, at: base.getTime(), sec: min * 60, subject: subjects[Math.floor(rnd() * subjects.length)], mode: 'pomodoro', tulip: tulips[tier + Math.floor(rnd() * (tier === 16 ? 2 : 6))], garden: i > 20 ? 'gulhane' : 'emirgan' });
    }
    if (rnd() < 0.8) {
      const dd = 15 + Math.floor(rnd() * 30);
      const y = Math.floor(rnd() * 10);
      d.questions.push({ id: `q${i}`, at: now - i * day - 3600_000, subject: subjects[Math.floor(rnd() * subjects.length)], d: dd, y, b: Math.floor(rnd() * 6) });
    }
  }
  d.sessions.sort((a, b) => a.at - b.at);
  d.collected = {};
  for (const s of d.sessions) if (s.tulip) d.collected[s.tulip] = (d.collected[s.tulip] ?? 0) + 1;
  d.garden = 'emirgan';
  d.mocks = [62.5, 66.25, 71, 69.5, 75.75, 79].map((net, i) => ({ id: `m${i}`, at: now - (35 - i * 6) * day, kind: 'tyt', name: ['Limit', '345', 'Bilgi Sarmal', 'Apotemi', 'Limit', '3D'][i], scores: { 'tyt-tr': { d: 30 + i, y: 6, b: 4 - Math.min(4, i) }, 'tyt-sos': { d: 13, y: 4, b: 3 }, 'tyt-mat': { d: 20 + i * 2, y: 8, b: 12 - i * 2 }, 'tyt-fen': { d: 9 + i, y: 5, b: 6 - i } } }));
  d.streak = { count: 12, best: 19, last: new Date(now - day).toISOString().slice(0, 10), bulbs: 1 };
  void lang;
  store.update(() => undefined);
}, LANG);
await wait(300);
await page.evaluate(() => window.lale.tab('focus'));
await shot('08-focus');

// ── session ──
await click('.btn-start');
await wait(300);
await page.evaluate(() => window.lale.skip(14 * 60));
await shot('09-session');
await click('.session-top .icon-btn');
await shot('10-ambient');
await page.evaluate(() => window.lale.closeModals());
await page.evaluate(() => window.lale.skip(12 * 60));
await wait(1300);
await shot('11-celebrate');
await page.evaluate(() => window.lale.closeModals());

// ── tabs ──
await page.evaluate(() => window.lale.tab('track'));
await shot('12-track');
await click('.track .seg button >> nth=1');
await shot('13-mocks');
await page.evaluate(() => window.lale.tab('stats'));
await shot('14-stats');
await page.mouse.wheel(0, 700);
await shot('15-stats-2');
await page.evaluate(() => window.lale.tab('garden'));
await shot('16-garden');
await page.locator('.screen').evaluate((el) => el.scrollTo(0, 620));
await shot('17-album');
await page.evaluate(() => window.lale.tab('friends'));
await shot('18-friends');

// ── sheets ──
await click('.topbar .streak');
await shot('19-streak');
await page.evaluate(() => window.lale.closeModals());
await click('.topbar .icon-btn.crown');
await shot('20-paywall');
await page.locator('.modal-card').evaluate((el) => el.scrollTo(0, 600));
await shot('21-paywall-plans');
await page.evaluate(() => window.lale.closeModals());
await click('.topbar .icon-btn:not(.crown)');
await shot('22-settings');
await page.locator('.modal-card').evaluate((el) => el.scrollTo(0, 900));
await shot('23-settings-2');
await page.evaluate(() => window.lale.closeModals());

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
