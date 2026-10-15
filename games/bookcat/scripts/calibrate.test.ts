import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { calibrate, toRow } from '../src/core/levels';

/** npm run calibrate → src/core/level-tuning.json (journey levels 1..LEVELS). */
it('calibrate journey levels', () => {
  const count = Number(process.env.LEVELS ?? 300);
  const rows = [];
  const report: string[] = [];
  for (let n = 1; n <= count; n++) {
    const l = calibrate(n);
    rows.push(toRow(l));
    if (n <= 20 || n % 10 === 0) report.push(`${n}\t${l.kind}\tcards=${l.sizes.reduce((a, b) => a + b + 1, 0)}\tcats=${l.sizes.length}\tpar=${l.par}\tmoves=${l.moves}`);
  }
  writeFileSync(new URL('../src/core/level-tuning.json', import.meta.url), JSON.stringify(rows));
  writeFileSync(new URL('./calibration.txt', import.meta.url), report.join('\n') + '\n');
});
