import { readFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { calibrate, toRow } from '../src/core/levels';

/** Recalibrates only levels FROM..TO inside level-tuning.json (e.g. after a rules tweak). */
it('patch journey levels', () => {
  const from = Number(process.env.FROM ?? 1);
  const to = Number(process.env.TO ?? from);
  const url = new URL('../src/core/level-tuning.json', import.meta.url);
  const rows = JSON.parse(readFileSync(url, 'utf8'));
  for (let n = from; n <= to; n++) {
    const l = calibrate(n);
    rows[n - 1] = toRow(l);
    console.log(n, JSON.stringify(rows[n - 1]));
  }
  writeFileSync(url, JSON.stringify(rows));
});
