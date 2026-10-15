// Run with: npx vitest run --config scripts/vitest.balance.ts
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { autoplay } from '../src/core/bot';
import { makeLevel } from '../src/core/levels';
import { Session } from '../src/core/session';

it('balance report', () => {
  const from = Number(process.env.FROM ?? 1);
  const to = Number(process.env.TO ?? 60);
  const seeds = Number(process.env.SEEDS ?? 6);
  const rows: string[] = [];
  let totalWins = 0;
  for (let id = from; id <= to; id++) {
    const lvl = makeLevel(id);
    let wins = 0;
    let movesLeftSum = 0;
    const offset = Number(process.env.OFFSET ?? 0);
    for (let s = 1 + offset; s <= seeds + offset; s++) {
      const sess = new Session('journey', lvl, s);
      const res = autoplay(sess);
      if (res.won) {
        wins++;
        movesLeftSum += sess.movesLeft;
      }
    }
    totalWins += wins;
    const goals = lvl.goals.map((g) => `${g.type}${g.flavor !== undefined ? g.flavor : ''}:${g.count}`).join(',');
    rows.push(`${String(id).padStart(3)} d=${lvl.difficulty.toFixed(2)} moves=${String(lvl.moves).padStart(3)} win=${wins}/${seeds} avgLeft=${wins ? (movesLeftSum / wins).toFixed(1) : '-'} ${goals}`);
  }
  rows.push(`overall ${((totalWins / ((to - from + 1) * seeds)) * 100).toFixed(1)}%`);
  writeFileSync(process.env.OUT ?? 'balance.txt', rows.join('\n'));
}, 600000);
