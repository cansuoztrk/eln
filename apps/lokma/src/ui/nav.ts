import type { Entry, Food, MealKey } from '../core/types';
import type { Tab, View } from './router';

/**
 * Navigation entry points shared by all screens. app.ts installs the real
 * implementations at startup; screens only depend on this tiny module, which
 * keeps the import graph acyclic.
 */
export interface Nav {
  go(tab: Tab): void;
  push(view: View): void;
  pop(): void;
  /** Opens the "what did you eat?" sheet. */
  add(meal?: MealKey): void;
  /** Opens a food's portion sheet (new entry). */
  food(food: Food, meal: MealKey): void;
  /** Opens an existing diary entry for editing. */
  entry(day: string, entry: Entry): void;
  search(meal: MealKey, query?: string): void;
  scan(meal: MealKey): void;
  describe(meal: MealKey, text?: string): void;
  barcode(meal: MealKey): void;
  quick(meal: MealKey): void;
  recipes(meal?: MealKey): void;
  paywall(source: string): void;
  karne(weekStart?: string): void;
  weight(): void;
  settings(page: 'reminders' | 'wardrobe' | 'plan' | 'privacy' | 'data'): void;
}

const noop = () => {};
export const nav: Nav = {
  go: noop,
  push: noop,
  pop: noop,
  add: noop,
  food: noop,
  entry: noop,
  search: noop,
  scan: noop,
  describe: noop,
  barcode: noop,
  quick: noop,
  recipes: noop,
  paywall: noop,
  karne: noop,
  weight: noop,
  settings: noop,
};
