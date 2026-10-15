// Calibrates district goals. Run with: npm run calibrate   (writes src/core/goals.json)
//
// A casual player (6 min every 2 h, 4 h offline cap, no ads, no purchases)
// plays district after district; each goal is set to what that player has
// earned in the district after the target number of hours, so moving out of
// district d takes TARGET_H[d] hours of real life for them. Engaged players
// and payers then progress faster (see the pacing report).
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import * as E from '../src/core/economy';
import { Bot, DEFAULT_BOT, fmtTime } from './bot';

if (process.env.TUNE) {
  Object.assign(E.TUNING, JSON.parse(process.env.TUNE));
  E.buildUpgrades();
}
import { runSchedule } from './schedule';

/** Real hours a casual player spends in each district (4 Istanbul tours). */
export const TARGET_H = [
  3, 5, 7, 10, 13, 17, 22, 28, // tour 1: Karaköy → Adalar ≈ day 4-5
  30, 33, 36, 39, 42, 45, 48, 52, // tour 2 ≈ day 18
  56, 60, 64, 68, 72, 76, 80, 84, // tour 3 ≈ day 40
  88, 92, 96, 100, 104, 108, 112, 116, // tour 4 ≈ day 70
];

/** Rounds down to 2 significant digits so goals read nicely (2.5T, 18Qa). */
function nice(x: number): number {
  const e = Math.floor(Math.log10(x)) - 1;
  return Math.floor(x / 10 ** e) * 10 ** e;
}

it('calibrate district goals', () => {
  const goals: number[] = [];
  const log: string[] = [];
  const bot = new Bot({ ...DEFAULT_BOT });
  for (let d = 0; d < TARGET_H.length; d++) {
    const start = bot.t;
    const target = TARGET_H[d] * 3600;
    runSchedule(bot, 6, 120, () => {
      // Move at the session closest to the target time.
      if (bot.t - start < target - 3600) return true;
      goals.push(nice(bot.run.earnedRun * 0.999));
      const before = E.globalMultiplier(bot.mods());
      const pend = bot.pendingLale();
      const after = E.globalMultiplier({ ...bot.mods(), lale: bot.lale + pend, districts: bot.district + 1 });
      log.push(`d${String(d).padStart(2)} goal=${E.formatBig(goals[d]).padStart(7)} after ${fmtTime(bot.t - start).padStart(6)} (total ${fmtTime(bot.t).padStart(6)}) lale ${E.formatBig(bot.lale)} → ${E.formatBig(bot.lale + pend)}  move=×${(after / before).toFixed(1)} income×${E.formatBig(after)}`);
      bot.move();
      return false;
    });
  }
  writeFileSync(process.env.GOALS ?? 'src/core/goals.json', JSON.stringify(goals) + '\n');
  writeFileSync(process.env.OUT ?? 'scripts/calibration.txt', `TUNING ${JSON.stringify(E.TUNING)}\n` + log.join('\n') + '\n');
}, 3_600_000);
