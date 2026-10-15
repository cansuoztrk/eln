import type { Entry, Food, FoodCategory, MealKey } from '../core/types';
import { num, t, type Key } from '../i18n';
import { h } from './dom';
import { foodArt, hasFoodArt } from './foodArt';
import { icon } from './icons';

// ───────────── progress ring ─────────────

export interface RingOptions {
  size: number;
  stroke: number;
  value: number;
  max: number;
  color: string;
  /** Colour of the part above `max` (drawn as a second lap). */
  overColor?: string;
  center?: Node;
  className?: string;
}

export function ring(o: RingOptions): HTMLElement {
  const r = (o.size - o.stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = o.max > 0 ? o.value / o.max : 0;
  const main = Math.min(1, frac);
  const over = Math.min(1, Math.max(0, frac - 1));
  const circle = (color: string, f: number, cls = '') =>
    `<circle class="${cls}" cx="${o.size / 2}" cy="${o.size / 2}" r="${r}" stroke="${color}" stroke-width="${o.stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}"/>`;
  const svg = `<svg viewBox="0 0 ${o.size} ${o.size}" aria-hidden="true">${circle('var(--track)', 1, 'ring-track')}${main > 0 ? circle(o.color, main) : ''}${over > 0 ? circle(o.overColor ?? 'var(--saffron)', over) : ''}</svg>`;
  const el = h('div', { class: `ring ${o.className ?? ''}`, style: `width:${o.size}px;height:${o.size}px`, html: svg });
  if (o.center) el.append(h('div', { class: 'ring-center' }, o.center));
  return el;
}

// ───────────── macro bars ─────────────

export function macroBar(label: string, value: number, goal: number, color: string): HTMLElement {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return h(
    'div',
    { class: 'macro' },
    h('div', { class: 'macro-head' }, h('span', {}, label), h('b', { class: 'num' }, `${num(value)} / ${num(goal)} g`)),
    h('div', { class: 'bar' }, h('i', { style: `width:${pct}%;background:${color}` })),
  );
}

// ───────────── food thumbnails ─────────────

const CAT_EMOJI: Record<FoodCategory, string> = {
  breakfast: '🧀', bakery: '🥖', dairy: '🥛', soup: '🍲', meat: '🍖', chicken: '🍗', fish: '🐟', legume: '🫘',
  grain: '🍚', 'olive-oil': '🫒', 'vegetable-dish': '🍆', salad: '🥗', street: '🌯', fastfood: '🍔', dessert: '🍮',
  drink: '🥤', fruit: '🍎', vegetable: '🥕', nut: '🌰', snack: '🍫', condiment: '🧂', basic: '🌾',
};

/** Foods drawn in the Tekir Studios house style. */
const ART_FOR: Record<string, string> = {
  simit: 'simit', cay: 'cay', pogaca: 'pogaca', 'balik-ekmek': 'balik', 'et-doner': 'doner', 'tavuk-doner': 'doner',
  kumpir: 'kumpir', 'midye-dolma': 'midye', dondurma: 'dondurma', lokum: 'lokum', 'adana-kebap': 'kebap', 'urfa-kebap': 'kebap',
};

export function foodThumb(food: Pick<Food, 'id' | 'cat'> | null, entry?: Pick<Entry, 'source'>): HTMLElement {
  const art = food ? ART_FOR[food.id] : undefined;
  if (art && hasFoodArt(art)) return h('div', { class: 'thumb', html: foodArt(art, 34) });
  if (food) return h('div', { class: 'thumb' }, CAT_EMOJI[food.cat] ?? '🍽️');
  if (entry?.source === 'ai-photo' || entry?.source === 'ai-text') return h('div', { class: 'thumb ai', html: icon('sparkle', 22) });
  if (entry?.source === 'barcode') return h('div', { class: 'thumb', html: icon('barcode', 22) });
  return h('div', { class: 'thumb' }, '🍽️');
}

export function categoryEmoji(cat: FoodCategory): string {
  return CAT_EMOJI[cat] ?? '🍽️';
}

// ───────────── small pieces ─────────────

export function mealLabel(meal: MealKey, ramadan: boolean): string {
  if (ramadan && meal === 'breakfast') return t('meal.sahur');
  if (ramadan && meal === 'dinner') return t('meal.iftar');
  return t(`meal.${meal}` as Key);
}

export function mealIcon(meal: MealKey, ramadan = false): string {
  if (ramadan && meal === 'breakfast') return icon('moon', 20);
  if (ramadan && meal === 'dinner') return icon('sunset', 20);
  return icon({ breakfast: 'sunrise', lunch: 'sun', dinner: 'moon', snack: 'apple' }[meal], 20);
}

export function kcalText(n: number): string {
  return `${num(Math.round(n))} ${t('common.kcal')}`;
}

export function segmented<T extends string>(options: { id: T; label: string }[], value: T, onPick: (id: T) => void): HTMLElement {
  const el = h('div', { class: 'seg', role: 'tablist' });
  for (const o of options) {
    el.append(
      h(
        'button',
        {
          class: o.id === value ? 'on' : '',
          role: 'tab',
          'aria-selected': o.id === value ? 'true' : 'false',
          onclick: () => {
            for (const b of el.children) b.classList.remove('on');
            el.children[options.indexOf(o)].classList.add('on');
            onPick(o.id);
          },
        },
        o.label,
      ),
    );
  }
  return el;
}

export function toggle(on: boolean, onChange: (v: boolean) => void, label?: string): HTMLElement {
  const el = h('button', { class: `switch ${on ? 'on' : ''}`, role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label ?? '' });
  el.addEventListener('click', () => {
    const next = !el.classList.contains('on');
    el.classList.toggle('on', next);
    el.setAttribute('aria-checked', next ? 'true' : 'false');
    onChange(next);
  });
  return el;
}

export function stepper(value: number, opts: { min?: number; max?: number; step?: number; format?: (v: number) => string; onChange: (v: number) => void }): HTMLElement {
  const { min = 0, max = 9999, step = 1, format = (v) => num(v, 2) } = opts;
  let v = value;
  const val = h('span', { class: 'val num' }, format(v));
  const set = (next: number) => {
    v = Math.min(max, Math.max(min, Math.round(next / step) * step));
    val.textContent = format(v);
    opts.onChange(v);
  };
  return h(
    'div',
    { class: 'stepper' },
    h('button', { 'aria-label': '−', onclick: () => set(v - step) }, '−'),
    val,
    h('button', { 'aria-label': '+', onclick: () => set(v + step) }, '+'),
  );
}

export function listRow(opts: { icon?: string; title: string; meta?: string; end?: Node | string; onClick?: () => void; chevron?: boolean }): HTMLElement {
  return h(
    'div',
    { class: `row ${opts.onClick ? 'tap' : ''}`, onclick: opts.onClick, role: opts.onClick ? 'button' : undefined },
    opts.icon ? h('div', { class: 'row-ico', html: opts.icon }) : null,
    h('div', { class: 'grow' }, h('div', { class: 'title' }, opts.title), opts.meta ? h('div', { class: 'meta' }, opts.meta) : null),
    opts.end === undefined ? null : typeof opts.end === 'string' ? h('div', { class: 'end' }, opts.end) : opts.end,
    opts.chevron ? h('span', { class: 'chev', html: icon('next', 18) }) : null,
  );
}
