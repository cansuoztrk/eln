// Offline level calibration. Run: npm run calibrate
// For every journey level we let the bot play many seeds with unlimited moves,
// pick the board variant ("salt") that gets stuck least, and set the move
// budget to the quantile matching the target win-rate for that level.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { autoplay } from '../src/core/bot';
import { makeLevel } from '../src/core/levels';
import { Session } from '../src/core/session';

const LEVELS = Number(process.env.LEVELS ?? 200);
const SEEDS = Number(process.env.SEEDS ?? 20);
const SALTS = Number(process.env.SALTS ?? 6);

/** Desired bot win-rate given the move budget (humans also have boosters). */
export function targetWinRate(id: number): number {
  const pos = (id - 1) % 10;
  let base: number;
  if (id <= 5) base = 1;
  else if (id <= 20) base = 0.9;
  else if (id <= 50) base = 0.8;
  else if (id <= 100) base = 0.72;
  else base = 0.66;
  if (id > 10 && (pos === 6 || pos === 7)) base -= 0.08; // tension before the boss
  if (id > 10 && pos === 9) base -= 0.12; // boss
  if (id > 10 && (pos === 0 || pos === 1)) base += 0.06; // breather after the boss
  return Math.min(1, base);
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[i];
}

it('calibrate', () => {
  const out: Record<string, [number, number]> = {};
  const report: string[] = [];
  for (let id = 1; id <= LEVELS; id++) {
    let best: { salt: number; used: number[]; stuck: number; penalty: number } | null = null;
    for (let salt = 0; salt < SALTS; salt++) {
      const lvl = makeLevel(id, salt);
      const used: number[] = [];
      let stuck = 0;
      for (let s = 1; s <= SEEDS; s++) {
        const sess = new Session('journey', lvl, s);
        sess.movesLeft = Infinity;
        const res = autoplay(sess, 400);
        if (res.won) used.push(res.moves);
        else stuck++;
      }
      const med = quantile([...used].sort((a, b) => a - b), 0.5);
      // Prefer variants that rarely dead-end and whose median length sits in a
      // fun band (not a 3-move freebie, not a 60-move slog).
      const penalty = stuck * 10 + (med < 10 ? (10 - med) * 4 : 0) + (med > 40 ? med - 40 : 0);
      if (!best || penalty < best.penalty) best = { salt, used, stuck, penalty };
      if (penalty === 0) break;
    }
    const sorted = best!.used.sort((a, b) => a - b);
    const target = targetWinRate(id);
    // Stuck runs count as losses, so ask for a higher quantile of the wins.
    const winShare = sorted.length / SEEDS;
    const q = Math.min(1, target / Math.max(0.05, winShare));
    const med = quantile(sorted, 0.5);
    let moves = Math.min(quantile(sorted, Math.min(q, 0.97)), Math.ceil(med * 2.2));
    if (id <= 5) moves = Math.ceil(moves * 1.25) + 2; // first-time players need slack
    // Picking the best board variant on these seeds overfits a little: hold-out
    // runs on unseen seeds win ~8 points less often, so pay that back.
    else moves = Math.ceil(moves * 1.08);
    moves = Math.max(10, moves);
    out[String(id)] = [moves, best!.salt];
    report.push(`${String(id).padStart(3)} salt=${best!.salt} stuck=${best!.stuck}/${SEEDS} moves=${moves} target=${target.toFixed(2)} med=${quantile(sorted, 0.5)}`);
  }
  writeFileSync('src/core/level-tuning.json', JSON.stringify(out) + '\n');
  writeFileSync(process.env.OUT ?? '/tmp/calibrate.txt', report.join('\n'));
}, 3_600_000);
