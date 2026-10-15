import type { Food } from '../../core/types';
import breakfast from './breakfast.json';
import meals from './meals.json';
import more from './more.json';

/** Offline Turkish food database (values per 100 g, EU carbohydrate convention). */
export const FOODS: readonly Food[] = [...breakfast, ...meals, ...more] as unknown as Food[];

export const FOOD_BY_ID: ReadonlyMap<string, Food> = new Map(FOODS.map((f) => [f.id, f]));
