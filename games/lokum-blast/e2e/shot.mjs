// Quick visual check: node e2e/shot.mjs <url> <outDir>
import { chromium } from 'playwright-core';
const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? '/tmp/shots';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'tr-TR' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(url);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/01-home-login.png` });
// close daily login: claim
const claim = page.locator('.login-modal .btn-primary');
if (await claim.count()) { await claim.click(); await page.waitForTimeout(600); await page.screenshot({ path: `${out}/02-reward.png` }); await page.locator('.reward-modal .btn-primary').click(); await page.waitForTimeout(500); }
await page.screenshot({ path: `${out}/03-home.png` });
// classic game
await page.locator('.btn-mode').first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/04-classic.png` });
console.log(errors.join('\n') || 'no console errors');
await browser.close();
