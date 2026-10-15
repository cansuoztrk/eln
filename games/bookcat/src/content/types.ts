/** Content model: categories ("shelves") with words ("books") in every game language. */
export type Lang = 'tr' | 'en' | 'de' | 'es';
export const LANGS: readonly Lang[] = ['tr', 'en', 'de', 'es'];

export interface Category {
  /** kebab-case, unique, stable (saved progress and daily shares refer to it). */
  id: string;
  /** 1 obvious … 5 expert. Early levels use low tiers. */
  tier: 1 | 2 | 3 | 4 | 5;
  name: Record<Lang, string>;
  /** At least 8 words per language, most familiar first. */
  words: Record<Lang, string[]>;
  /** Categories sharing an exclusion tag never appear in the same level. */
  excl?: string[];
  /** Optional themed pack (e.g. 'istanbul') used by events and culture chapters. */
  pack?: string;
}

/**
 * Compact authoring helper: words are comma-separated per language.
 *   cat('fruits', 1, 'Meyveler|Fruits|Obst|Frutas', { tr: 'elma,armut', … })
 */
export function cat(
  id: string,
  tier: Category['tier'],
  names: string,
  words: Record<Lang, string>,
  opts: { excl?: string[]; pack?: string } = {},
): Category {
  const [tr, en, de, es] = names.split('|');
  const split = (s: string) => s.split(',').map((w) => w.trim()).filter(Boolean);
  return {
    id,
    tier,
    name: { tr, en, de, es },
    words: { tr: split(words.tr), en: split(words.en), de: split(words.de), es: split(words.es) },
    ...opts,
  };
}
