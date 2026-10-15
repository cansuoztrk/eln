import { describe, expect, it } from 'vitest';
import { FOODS } from '../src/data/foods';
import { atwater } from '../src/core/nutrition';
import { FOOD_CATEGORIES, PORTION_UNITS } from '../src/core/types';

/**
 * Quality gate for the offline food database. Every food must be internally
 * consistent (energy ≈ macros), have sane household portions and names in all
 * app languages, and the canonical Turkish staples must all be present.
 */

const LIQUID_UNITS = new Set(['su-bardagi', 'cay-bardagi', 'fincan', 'kupa', 'kutu', 'sise', 'yemek-kasigi', 'tatli-kasigi', 'cay-kasigi', 'kase', 'kepce', 'porsiyon', 'paket', 'adet']);
const TAGS = new Set(['vegetarian', 'vegan', 'high-protein', 'gluten-free', 'sweet', 'ramazan', 'spicy', 'fried', 'street', 'whole-grain', 'low-calorie', 'kids']);

/** Canonical ids the app, the AI prompt and the tests refer to. */
export const MUST_HAVE = [
  // breakfast, bakery, dairy
  'simit', 'beyaz-peynir', 'kasar-peyniri', 'lor-peyniri', 'tulum-peyniri', 'siyah-zeytin', 'yesil-zeytin',
  'haslanmis-yumurta', 'sahanda-yumurta', 'menemen', 'omlet', 'sucuklu-yumurta', 'bal', 'tereyagi', 'kaymak', 'recel',
  'tahin-pekmez', 'beyaz-ekmek', 'tam-bugday-ekmegi', 'ramazan-pidesi', 'pogaca', 'acma', 'su-boregi', 'sigara-boregi',
  'gozleme', 'bazlama', 'sut', 'yogurt', 'ayran', 'kefir', 'sucuk', 'yulaf-ezmesi',
  // soups
  'mercimek-corbasi', 'ezogelin-corbasi', 'yayla-corbasi', 'tavuk-suyu-corbasi', 'domates-corbasi', 'iskembe-corbasi',
  'tarhana-corbasi', 'sehriye-corbasi',
  // mains
  'kuru-fasulye', 'nohut-yemegi', 'pirinc-pilavi', 'bulgur-pilavi', 'makarna', 'manti', 'karniyarik', 'imam-bayildi',
  'zeytinyagli-yaprak-sarma', 'biber-dolmasi', 'zeytinyagli-taze-fasulye', 'musakka', 'izmir-kofte', 'izgara-kofte',
  'adana-kebap', 'urfa-kebap', 'iskender', 'et-doner', 'tavuk-doner', 'tavuk-sis', 'tas-kebabi', 'hunkar-begendi',
  'tavuk-izgara', 'tavuk-sote', 'hamsi-tava', 'levrek-izgara', 'kiymali-pide', 'kasarli-pide', 'lahmacun', 'cig-kofte',
  'kokorec', 'midye-dolma', 'balik-ekmek', 'kumpir', 'patates-kizartmasi', 'ispanak-yemegi', 'turlu',
  // salads & mezes
  'coban-salata', 'mevsim-salata', 'piyaz', 'kisir', 'cacik', 'gavurdagi-salatasi', 'haydari', 'humus',
  // desserts
  'baklava', 'kunefe', 'sutlac', 'kazandibi', 'revani', 'sekerpare', 'lokum', 'tahin-helvasi', 'asure', 'dondurma',
  'irmik-helvasi', 'gullac', 'tulumba', 'lokma-tatlisi', 'trilece', 'profiterol',
  // drinks
  'cay', 'turk-kahvesi', 'salgam', 'boza', 'limonata', 'portakal-suyu', 'kola', 'maden-suyu', 'sahlep', 'latte', 'su',
  // fruit & veg
  'elma', 'muz', 'portakal', 'mandalina', 'uzum', 'karpuz', 'kavun', 'cilek', 'kiraz', 'incir', 'kayisi', 'seftali',
  'nar', 'armut', 'hurma', 'kuru-kayisi', 'domates', 'salatalik', 'yesil-biber', 'havuc',
  // nuts & snacks
  'findik', 'ceviz', 'badem', 'antep-fistigi', 'leblebi', 'ay-cekirdegi', 'cips', 'sutlu-cikolata', 'bitter-cikolata',
  'biskuvi', 'gofret',
  // condiments & fast food
  'zeytinyagi', 'aycicek-yagi', 'seker', 'domates-salcasi', 'mayonez', 'ketcap', 'nar-eksisi',
  'hamburger', 'pizza', 'kasarli-tost', 'tavuk-burger', 'sosisli',
] as const;

// The database is written in Lokma's next phase (see README › Durum). Until a
// single food exists this quality gate is pending instead of failing.
describe.skipIf(FOODS.length === 0)('food database', () => {
  it('has a substantial database', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(250);
  });

  it('contains every canonical staple', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    const missing = MUST_HAVE.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('uses unique kebab-case ids', () => {
    const seen = new Set<string>();
    for (const f of FOODS) {
      expect(f.id, f.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(seen.has(f.id), `duplicate ${f.id}`).toBe(false);
      seen.add(f.id);
    }
  });

  it('names every food in Turkish, English and German', () => {
    for (const f of FOODS) {
      for (const lang of ['tr', 'en', 'de'] as const) {
        expect(typeof f[lang] === 'string' && f[lang].trim().length > 1, `${f.id}.${lang}`).toBe(true);
      }
    }
  });

  it('uses known categories, tags and provenance', () => {
    for (const f of FOODS) {
      expect(FOOD_CATEGORIES, f.id).toContain(f.cat);
      expect(f.src.length, `${f.id}.src`).toBeGreaterThan(2);
      for (const t of f.tags ?? []) expect(TAGS.has(t), `${f.id} tag ${t}`).toBe(true);
    }
  });

  it('has physically plausible values per 100 g', () => {
    for (const f of FOODS) {
      const n = f.per100;
      for (const k of ['kcal', 'p', 'c', 'f'] as const) {
        expect(Number.isFinite(n[k]) && n[k] >= 0, `${f.id}.${k}`).toBe(true);
      }
      expect(n.kcal, `${f.id} kcal`).toBeLessThanOrEqual(900);
      const mass = n.p + n.c + n.f + (n.fiber ?? 0);
      expect(mass, `${f.id} macro mass ${mass}`).toBeLessThanOrEqual(101);
      if (n.sugar !== undefined) expect(n.sugar, `${f.id} sugar`).toBeLessThanOrEqual(n.c + 0.5);
      if (n.sodium !== undefined) expect(n.sodium, `${f.id} sodium`).toBeLessThanOrEqual(40000);
    }
  });

  it('has energy consistent with its macros (Atwater, EU carbohydrate convention)', () => {
    const bad: string[] = [];
    for (const f of FOODS) {
      const calc = atwater(f.per100);
      const tolerance = Math.max(15, f.per100.kcal * 0.12);
      if (Math.abs(calc - f.per100.kcal) > tolerance) bad.push(`${f.id}: ${f.per100.kcal} kcal vs ${calc.toFixed(0)} from macros`);
    }
    expect(bad).toEqual([]);
  });

  it('has sane household portions', () => {
    for (const f of FOODS) {
      expect(f.portions.length, `${f.id} portions`).toBeGreaterThan(0);
      const units = new Set<string>();
      for (const p of f.portions) {
        expect(PORTION_UNITS, `${f.id} unit ${p.unit}`).toContain(p.unit);
        expect(p.g > 0 && p.g <= 1500, `${f.id} ${p.unit} = ${p.g} g`).toBe(true);
        expect(units.has(p.unit), `${f.id} duplicate unit ${p.unit}`).toBe(false);
        units.add(p.unit);
      }
      if (f.liquid) {
        expect(f.portions.every((p) => LIQUID_UNITS.has(p.unit)), `${f.id} liquid units`).toBe(true);
      }
    }
  });

  it('keeps zero-calorie drinks at zero', () => {
    const water = FOODS.find((f) => f.id === 'su');
    expect(water?.per100.kcal).toBe(0);
  });
});
