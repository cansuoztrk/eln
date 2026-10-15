/**
 * Shared data contracts for Lokma. Everything in core/ is pure (no DOM, no
 * storage) so it can be unit-tested and reused by scripts.
 */

export type Lang = 'tr' | 'en' | 'de';
export type Localized = Record<Lang, string>;

// ───────────── foods ─────────────

export type FoodCategory =
  | 'breakfast' // kahvaltılık: peynir, zeytin, yumurta, reçel, bal…
  | 'bakery' // ekmek, simit, poğaça, börek, pide hamuru…
  | 'dairy' // süt, yoğurt, ayran, kefir…
  | 'soup'
  | 'meat' // kırmızı et yemekleri, köfte, kebaplar
  | 'chicken'
  | 'fish'
  | 'legume' // kuru fasulye, nohut, mercimek yemekleri
  | 'grain' // pilav, bulgur, makarna, mantı
  | 'olive-oil' // zeytinyağlılar
  | 'vegetable-dish' // etli/etsiz sebze yemekleri, karnıyarık, musakka
  | 'salad'
  | 'street' // sokak lezzetleri: lahmacun, dürüm, kokoreç, midye
  | 'fastfood' // hamburger, pizza, patates kızartması…
  | 'dessert'
  | 'drink'
  | 'fruit'
  | 'vegetable' // çiğ sebze
  | 'nut' // kuruyemiş
  | 'snack' // cips, bisküvi, çikolata…
  | 'condiment' // sos, yağ, şeker, salça…
  | 'basic'; // temel malzemeler: un, pirinç (çiğ), et (çiğ)…

export const FOOD_CATEGORIES: readonly FoodCategory[] = [
  'breakfast', 'bakery', 'dairy', 'soup', 'meat', 'chicken', 'fish', 'legume', 'grain', 'olive-oil',
  'vegetable-dish', 'salad', 'street', 'fastfood', 'dessert', 'drink', 'fruit', 'vegetable', 'nut', 'snack',
  'condiment', 'basic',
];

/** Household measures. Grams (or ml for liquids) per unit live on each food. */
export type PortionUnit =
  | 'adet' // piece
  | 'dilim' // slice
  | 'porsiyon' // serving
  | 'kase' // bowl
  | 'kepce' // ladle
  | 'tabak' // plate
  | 'su-bardagi' // water glass (~200 ml)
  | 'cay-bardagi' // tea glass (~100 ml)
  | 'fincan' // coffee cup
  | 'kupa' // mug
  | 'yemek-kasigi' // tablespoon
  | 'tatli-kasigi' // dessert spoon
  | 'cay-kasigi' // teaspoon
  | 'avuc' // handful
  | 'durum' // wrap
  | 'kutu' // can / carton
  | 'sise' // bottle
  | 'paket' // pack
  | 'kup'; // cube (sugar)

export const PORTION_UNITS: readonly PortionUnit[] = [
  'adet', 'dilim', 'porsiyon', 'kase', 'kepce', 'tabak', 'su-bardagi', 'cay-bardagi', 'fincan', 'kupa',
  'yemek-kasigi', 'tatli-kasigi', 'cay-kasigi', 'avuc', 'durum', 'kutu', 'sise', 'paket', 'kup',
];

export interface Portion {
  unit: PortionUnit;
  /** Grams (ml for liquid foods) in ONE unit. */
  g: number;
}

export interface Nutrients {
  kcal: number;
  /** grams */
  p: number;
  c: number;
  f: number;
  fiber?: number;
  sugar?: number;
  /** milligrams */
  sodium?: number;
}

export interface Food {
  /** kebab-case ASCII, unique, stable forever (stored in diaries). */
  id: string;
  tr: string;
  en: string;
  de: string;
  /** Extra search terms: regional names, common spellings, brand-free synonyms. */
  aliases?: string[];
  cat: FoodCategory;
  /** Values per 100 g (per 100 ml when `liquid`). */
  per100: Nutrients;
  liquid?: boolean;
  /** First entry is the default portion shown in the picker. */
  portions: Portion[];
  /** Provenance, e.g. "usda:171287", "recipe", "label", "tuber". */
  src: string;
  tags?: string[];
}

// ───────────── diary ─────────────

export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEALS: readonly MealKey[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type EntrySource = 'db' | 'ai-photo' | 'ai-text' | 'barcode' | 'quick' | 'recipe' | 'custom';

export interface Entry extends Nutrients {
  id: string;
  meal: MealKey;
  /** Logged at (ms since epoch). */
  t: number;
  /** Display name captured at log time (already localized). */
  name: string;
  foodId?: string;
  source: EntrySource;
  qty: number;
  unit: PortionUnit | 'g' | 'ml';
  /** Total grams (ml for liquids). */
  g: number;
  /** AI confidence 0..1 when the entry came from an AI estimate. */
  conf?: number;
}

export interface DayLog {
  entries: Entry[];
  waterMl: number;
  tea: number;
  /** Sugar cubes added to tea (5 g, ~20 kcal each); logged as calories too. */
  teaSugar: number;
  weightKg?: number;
}

// ───────────── profile & targets ─────────────

export type Sex = 'female' | 'male' | 'other';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Goal = 'lose' | 'maintain' | 'gain' | 'healthy';
export type Diet = 'balanced' | 'high-protein' | 'low-carb' | 'vegetarian';
export type FastingStyle = 'ramadan' | 'intermittent' | 'none';

export interface Profile {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  targetKg: number;
  activity: Activity;
  goal: Goal;
  /** Desired change per week in kg (always positive; direction comes from goal). */
  paceKg: number;
  diet: Diet;
  fasting: FastingStyle;
}

export interface Targets {
  kcal: number;
  /** grams */
  p: number;
  c: number;
  f: number;
  fiber: number;
  waterMl: number;
}
