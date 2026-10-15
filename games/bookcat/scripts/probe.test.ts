import { appendFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { calibrate } from '../src/core/levels';
it('probe', () => {
  const out = process.env.OUT ?? '/tmp/probe.txt';
  writeFileSync(out, '');
  for (const n of (process.env.LEVELS ?? '1,2,5,10,15,20,30,45,60,80,100,121,150,200').split(',').map(Number)) {
    const t0 = performance.now();
    try {
      const l = calibrate(n);
      appendFileSync(out, `${n} ${l.kind} cards=${l.sizes.reduce((a, b) => a + b + 1, 0)} par=${l.par} moves=${l.moves} ${Math.round(performance.now() - t0)}ms\n`);
    } catch (e) {
      appendFileSync(out, `${n} FAIL ${String(e)} ${Math.round(performance.now() - t0)}ms\n`);
    }
  }
});
