import type { Grant } from './catalog';
import { applyGrant } from './economy';
import { store } from './state';

/**
 * Meta progression: "Çarşıyı Canlandır". Stars earned in journey levels are
 * spent to restore the stalls of the Grand Bazaar, one district at a time.
 * Each district has 5 restoration steps that visibly change its illustration.
 */
export type Goods = 'lokum' | 'tea' | 'spice' | 'carpet' | 'lantern' | 'simit' | 'tile' | 'gold' | 'coffee' | 'icecream' | 'fish' | 'palace';

export interface District {
  id: number;
  key: string; // i18n: bazaar.d.<key>
  goods: Goods;
  awning: [string, string];
  wall: string;
  costs: number[]; // star cost per step
  reward: Grant;
}

export const TASKS = ['sign', 'awning', 'counter', 'goods', 'lights'] as const;
export type TaskKey = (typeof TASKS)[number];

export const DISTRICTS: readonly District[] = [
  { id: 0, key: 'lokumcu', goods: 'lokum', awning: ['#ff6fa5', '#fff1f6'], wall: '#f3d9b1', costs: [1, 1, 2, 2, 3], reward: { coins: 300, boosters: { hammer: 2 } } },
  { id: 1, key: 'cayocagi', goods: 'tea', awning: ['#d64545', '#fff4e6'], wall: '#e9cfa3', costs: [1, 2, 2, 3, 3], reward: { coins: 400, themes: ['iznik'] } },
  { id: 2, key: 'baharatci', goods: 'spice', awning: ['#f59e0b', '#7c2d12'], wall: '#e7c08d', costs: [2, 2, 3, 3, 4], reward: { coins: 500, boosters: { bomb: 2 } } },
  { id: 3, key: 'halici', goods: 'carpet', awning: ['#9f1239', '#fde68a'], wall: '#d9b48a', costs: [2, 3, 3, 4, 4], reward: { coins: 600, themes: ['cam'] } },
  { id: 4, key: 'fenerci', goods: 'lantern', awning: ['#7c3aed', '#fef3c7'], wall: '#cfae8c', costs: [2, 3, 4, 4, 5], reward: { coins: 700, boosters: { refresh: 3 } } },
  { id: 5, key: 'simitci', goods: 'simit', awning: ['#dc2626', '#ffffff'], wall: '#e8c9a0', costs: [3, 3, 4, 5, 5], reward: { coins: 800, unlimitedLivesHours: 6 } },
  { id: 6, key: 'cinici', goods: 'tile', awning: ['#1d4ed8', '#e0f2fe'], wall: '#dbc3a0', costs: [3, 4, 4, 5, 6], reward: { coins: 900, boosters: { bomb: 2, hammer: 2 } } },
  { id: 7, key: 'kuyumcu', goods: 'gold', awning: ['#b45309', '#fde68a'], wall: '#c9a27c', costs: [3, 4, 5, 5, 6], reward: { coins: 1000, boosters: { undo: 3, refresh: 2 } } },
  { id: 8, key: 'kahveci', goods: 'coffee', awning: ['#57301a', '#f5e1c8'], wall: '#d8b48e', costs: [4, 4, 5, 6, 6], reward: { coins: 1100, unlimitedLivesHours: 12 } },
  { id: 9, key: 'dondurmaci', goods: 'icecream', awning: ['#ec4899', '#ecfeff'], wall: '#efd3b5', costs: [4, 5, 5, 6, 7], reward: { coins: 1200, boosters: { bomb: 3 } } },
  { id: 10, key: 'balikci', goods: 'fish', awning: ['#0e7490', '#f0f9ff'], wall: '#c7d2da', costs: [4, 5, 6, 6, 7], reward: { coins: 1400, boosters: { hammer: 3, refresh: 3 } } },
  { id: 11, key: 'saray', goods: 'palace', awning: ['#7f1d1d', '#facc15'], wall: '#e5d1b0', costs: [5, 6, 6, 7, 8], reward: { coins: 3000, boosters: { undo: 5, hammer: 5, refresh: 5, bomb: 5 } } },
];

export function currentDistrict(): District | null {
  return DISTRICTS[store.data.bazaar.district] ?? null;
}

export function districtProgress(): { done: number[]; next: number } {
  const done = store.data.bazaar.done;
  const next = TASKS.findIndex((_, i) => !done.includes(i));
  return { done, next };
}

export type RestoreResult = { ok: false; reason: 'stars' | 'done' } | { ok: true; districtComplete: Grant | null };

export function restore(taskIdx: number): RestoreResult {
  const d = currentDistrict();
  if (!d || store.data.bazaar.done.includes(taskIdx)) return { ok: false, reason: 'done' };
  const cost = d.costs[taskIdx];
  if (store.data.stars < cost) return { ok: false, reason: 'stars' };
  let complete: Grant | null = null;
  store.update((s) => {
    s.stars -= cost;
    s.bazaar.done.push(taskIdx);
  });
  if (store.data.bazaar.done.length >= TASKS.length) {
    complete = d.reward;
    applyGrant(d.reward);
    store.update((s) => {
      s.bazaar.district++;
      s.bazaar.done = [];
    });
  }
  return { ok: true, districtComplete: complete };
}

export function bazaarAttention(): boolean {
  const d = currentDistrict();
  if (!d) return false;
  const { next } = districtProgress();
  return next >= 0 && store.data.stars >= d.costs[next];
}
