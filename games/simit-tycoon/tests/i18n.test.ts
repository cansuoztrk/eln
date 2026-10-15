import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en';
import { TABLES } from '../src/i18n';

// District phrases may use the name, the "in …" or the "to …" form, whatever reads
// naturally in that language (all three are always passed).
const placeholders = (s: string) =>
  (s.match(/\{\w+\}/g) ?? [])
    .map((p) => (p === '{in}' || p === '{to}' || p === '{d}' ? '{place}' : p))
    .sort()
    .join(',');

describe('i18n', () => {
  for (const [lang, table] of Object.entries(TABLES)) {
    it(`${lang} has every key with matching placeholders`, () => {
      for (const [key, value] of Object.entries(en)) {
        const tr = (table as Record<string, string>)[key];
        expect(tr, `${lang}: ${key}`).toBeTypeOf('string');
        expect(tr.length, `${lang}: ${key}`).toBeGreaterThan(0);
        expect(placeholders(tr), `${lang}: ${key}`).toBe(placeholders(value));
      }
    });
  }
});
