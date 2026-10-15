import { describe, expect, it } from 'vitest';
import { CATEGORIES, compatible, levelCategories, materialize, normWord } from '../src/content';
import { LANGS } from '../src/content/types';
import table from '../src/core/level-tuning.json';
import { useTable, levelDef } from '../src/core/levels';

useTable(table as never);

describe('content quality', () => {
  it('has unique ids and complete names', () => {
    const ids = new Set<string>();
    for (const c of CATEGORIES) {
      expect(c.id, c.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ids.has(c.id), `duplicate ${c.id}`).toBe(false);
      ids.add(c.id);
      for (const l of LANGS) expect(c.name[l]?.length, `${c.id} name ${l}`).toBeGreaterThan(1);
    }
  });

  it('has at least 8 distinct, card-sized words per language', () => {
    for (const c of CATEGORIES) {
      for (const l of LANGS) {
        const words = c.words[l];
        expect(words.length, `${c.id} ${l} count`).toBeGreaterThanOrEqual(8);
        expect(new Set(words.map((w) => normWord(w, l))).size, `${c.id} ${l} duplicates`).toBe(words.length);
        for (const w of words) {
          expect(w.length, `${c.id} ${l} "${w}" too long`).toBeLessThanOrEqual(26);
          expect(normWord(w, l), `${c.id} ${l} word equals a category name`).not.toBe(normWord(c.name[l], l));
        }
      }
    }
  });

  it('never repeats a word in two categories that can share a level', () => {
    const clashes: string[] = [];
    for (const l of LANGS) {
      const seen = new Map<string, string>();
      for (const c of CATEGORIES) {
        for (const w of c.words[l]) {
          const k = normWord(w, l);
          const other = seen.get(k);
          if (other && other !== c.id) {
            const a = CATEGORIES.find((x) => x.id === other)!;
            if (!a.excl?.some((t) => c.excl?.includes(t))) clashes.push(`${l}: "${w}" in ${other} and ${c.id}`);
          }
          seen.set(k, c.id);
        }
      }
    }
    expect(clashes).toEqual([]);
  });

  it('fills the first 300 journey levels with compatible, fresh categories', () => {
    for (let n = 1; n <= 300; n++) {
      const def = levelDef(n);
      const ids = levelCategories(n, def.sizes.length);
      expect(ids.length, `level ${n}`).toBe(def.sizes.length);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        expect(compatible(CATEGORIES.find((c) => c.id === ids[i])!, CATEGORIES.find((c) => c.id === ids[j])!), `level ${n}`).toBe(true);
      }
      for (const lang of LANGS) {
        const picked = materialize(ids, def.sizes, lang, `level:${n}`, n < 30);
        picked.forEach((p, i) => expect(p.words.length).toBe(def.sizes[i]));
      }
    }
  });
});
