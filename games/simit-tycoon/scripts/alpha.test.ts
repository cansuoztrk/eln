// Measures the in-run growth exponent α = dlog(income)/dlog(money spent) for a greedy spender.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import * as E from '../src/core/economy';

if (process.env.TUNE) {
  Object.assign(E.TUNING, JSON.parse(process.env.TUNE));
  E.buildUpgrades();
}

it('alpha', () => {
  const r = E.newRun(10);
  r.managers.fill(true);
  const m = { lale: 0, districts: 0, permanent: 1, temp: 1 };
  let spent = 0;
  const rows: string[] = [];
  let nextMark = 1e6;
  let lastInc = 0;
  let lastSpent = 0;
  for (let guard = 0; guard < 2_000_000 && spent < 1e120; guard++) {
    // Evaluate candidates by payback.
    const mult = E.businessMultipliers(r);
    const g = E.globalMultiplier(m);
    const inc = (i: number, lvl: number, mi: number) => (lvl <= 0 ? 0 : (E.BUSINESSES[i].revenue * lvl * mi * g) / E.cycleTime(i, lvl));
    const total = E.potentialIncome(r, m);
    let best: { cost: number; act: () => void } | null = null;
    let bestScore = Infinity;
    const festNow = E.festivalsReached(r.levels, r.stands);
    for (let i = 0; i < r.stands; i++) {
      const lvl = r.levels[i];
      for (const count of [1, E.nextMilestone(lvl) - lvl]) {
        const nl = lvl + count;
        const mi = (mult[i] / 2 ** E.profitMilestones(lvl)) * 2 ** E.profitMilestones(nl);
        let gain = inc(i, nl, mi) - inc(i, lvl, mult[i]);
        const lv2 = r.levels.slice();
        lv2[i] = nl;
        const fg = E.festivalsReached(lv2, r.stands) - festNow;
        if (fg > 0) gain += (total + gain) * (E.TUNING.festivalMult ** fg - 1);
        const cost = E.costFor(i, lvl, count);
        const sc = cost / gain;
        if (gain > 0 && sc < bestScore) {
          bestScore = sc;
          best = { cost, act: () => { r.levels[i] += count; } };
        }
      }
    }
    for (const u of E.nextUpgrades(r, 4)) {
      if (!E.upgradeAvailable(r, u)) continue;
      const base = u.target < 0 ? total : inc(u.target, r.levels[u.target], mult[u.target]);
      const sc = u.cost / (base * (u.mult - 1));
      if (sc < bestScore) {
        bestScore = sc;
        best = { cost: u.cost, act: () => { r.upgrades.push(u.id); } };
      }
    }
    if (!best) break;
    best.act();
    spent += best.cost;
    if (spent >= nextMark) {
      const incNow = E.potentialIncome(r, m);
      const alpha = lastInc ? Math.log(incNow / lastInc) / Math.log(spent / lastSpent) : 0;
      rows.push(`spent=${E.formatBig(spent).padStart(7)} income=${E.formatBig(incNow).padStart(7)} payback=${E.formatBig(spent / incNow).padStart(7)}s alpha=${alpha.toFixed(2)} minLvl=${Math.min(...r.levels)} maxLvl=${Math.max(...r.levels)} recipes=${r.upgrades.length} fest=${E.festivalsReached(r.levels, r.stands)}`);
      lastInc = incNow;
      lastSpent = spent;
      nextMark *= 1000;
    }
  }
  writeFileSync(process.env.OUT ?? 'alpha.txt', rows.join('\n') + '\n');
}, 600000);
