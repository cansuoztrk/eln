// Pacing report. Run with: npm run simulate   (writes scripts/pacing-report.txt)
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import * as E from '../src/core/economy';
import { Bot, DEFAULT_BOT, fmtTime, type BotOptions } from './bot';
import { runSchedule } from './schedule';

// Try alternative balance without editing the game: TUNE='{"lalePower":0.4}' npm run simulate
if (process.env.TUNE) {
  Object.assign(E.TUNING, JSON.parse(process.env.TUNE));
  E.buildUpgrades();
}

function firstSession(minutes: number, o: Partial<BotOptions> = {}): string[] {
  const bot = new Bot({ ...DEFAULT_BOT, ...o });
  const out: string[] = [];
  const checkpoints = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120].filter((m) => m <= minutes);
  let done = 0;
  let lastPurchases = 0;
  for (const m of checkpoints) {
    bot.play((m - done) * 60);
    const per = (bot.purchases - lastPurchases) / (m - done);
    lastPurchases = bot.purchases;
    done = m;
    const lv = bot.run.levels.map((l, i) => (l ? `${E.BUSINESSES[i].id}${bot.run.managers[i] ? '*' : ''}:${l}` : '')).filter(Boolean).join(' ');
    out.push(`  ${String(m).padStart(3)}m cash=${E.formatBig(bot.run.cash).padStart(8)} life=${E.formatBig(bot.lifetime).padStart(8)} idle/s=${E.formatBig(E.idleIncome(bot.run, bot.mods())).padStart(8)} buys/min=${per.toFixed(1).padStart(5)} pendingLale=${bot.pendingLale()}  ${lv}`);
  }
  out.push('  events:');
  for (const e of bot.events) out.push(`    ${fmtTime(e.t).padStart(7)}  ${e.what}`);
  return out;
}

/** Real-life schedule: short sessions spread over waking hours, moving district as soon as each goal is met. */
function days(n: number, sessionMin: number, gapMin: number, o: Partial<BotOptions> = {}): string[] {
  const bot = new Bot({ ...DEFAULT_BOT, ...o });
  const out: string[] = [];
  const report = [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90];
  let reported = -1;
  runSchedule(bot, sessionMin, gapMin, (day) => {
    bot.maybePrestige();
    if (day !== reported && report.includes(day)) {
      reported = day;
      out.push(`  day ${String(day).padStart(2)}: district=${bot.district} (tour ${Math.floor(bot.district / 8) + 1}) lale=${E.formatBig(bot.lale)} income×${E.formatBig(E.globalMultiplier(bot.mods()))} lifetime=${E.formatBig(bot.lifetime)} goal=${E.formatBig(E.districtGoal(bot.district))} run=${E.formatBig(bot.run.earnedRun)} stands=${bot.run.levels.filter((l) => l > 0).length} recipes=${bot.run.upgrades.length} active=${fmtTime(bot.activeTime)}`);
    }
    return day < n;
  });
  out.push('  moves:');
  const moves = bot.events.filter((e) => e.what.startsWith('district'));
  for (const e of moves) out.push(`    ${fmtTime(e.t).padStart(7)} (active ${fmtTime(e.active).padStart(6)})  ${e.what}`);
  return out;
}

it('pacing report', () => {
  const lines: string[] = [];
  const t0 = Date.now();
  lines.push(`TUNING ${JSON.stringify(E.TUNING)}`, '');
  if (!process.env.BRIEF) {
    lines.push('== First session, active tapping, F2P ==', ...firstSession(120));
    lines.push('', '== First session with ×2 ad boost ==', ...firstSession(60, { adBoost: true }));
  }
  const D = Number(process.env.DAYS ?? 30);
  lines.push('', `== Casual F2P: 6 min every 2 h, 4 h offline cap (${D} days) — the calibration profile ==`, ...days(D, 6, 120));
  lines.push('', `== Light: 5 min every 4 h ==`, ...days(D, 5, 240));
  lines.push('', `== Engaged: 10 min every 90 min, ad boost + ad offline ×2, 8 h cap ==`, ...days(D, 10, 90, { adBoost: true, adOffline: true, offlineCapH: 8 }));
  lines.push('', `== Payer: engaged + permanent ×6 (×2, ×3 IAP) + club ×2 ==`, ...days(D, 10, 90, { adBoost: true, adOffline: true, offlineCapH: 24, permanent: 12 }));
  lines.push('', `(simulated in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  writeFileSync(process.env.OUT ?? 'scripts/pacing-report.txt', lines.join('\n') + '\n');
}, 1_800_000);
