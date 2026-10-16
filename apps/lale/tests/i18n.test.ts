import { describe, expect, it } from 'vitest';
import de from '../src/i18n/de';
import en from '../src/i18n/en';
import es from '../src/i18n/es';
import tr from '../src/i18n/tr';

describe('translations', () => {
  const keys = Object.keys(tr);
  for (const [name, table] of Object.entries({ en, de, es })) {
    it(`${name} is complete and keeps placeholders`, () => {
      expect(Object.keys(table).sort()).toEqual([...keys].sort());
      for (const k of keys) {
        const want = (tr[k as keyof typeof tr].match(/\{\w+\}/g) ?? []).sort();
        const got = (table[k as keyof typeof tr].match(/\{\w+\}/g) ?? []).sort();
        expect(got, `${name}:${k}`).toEqual(want);
        expect(table[k as keyof typeof tr].trim().length, `${name}:${k} empty`).toBeGreaterThan(0);
      }
    });
  }
});
