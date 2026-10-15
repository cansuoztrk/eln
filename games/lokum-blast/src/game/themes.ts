/**
 * Visual themes. Each theme changes the block style, colour palette and the
 * page / board colours. Themes are a core soft-currency sink and a premium
 * IAP item (see meta/catalog.ts).
 */
export type CellStyle = 'sugar' | 'tile' | 'neon' | 'gem' | 'paw' | 'glass';

export interface ThemePrice {
  coins?: number;
  /** IAP product id that unlocks this theme. */
  product?: string;
  /** Unlocked by completing a bazaar district. */
  district?: number;
  /** Included in the VIP club. */
  vip?: boolean;
}

export interface Theme {
  id: string;
  style: CellStyle;
  palette: readonly string[];
  bgTop: string;
  bgBottom: string;
  board: string;
  boardEdge: string;
  empty: string;
  accent: string;
  price: ThemePrice;
}

export const THEMES: readonly Theme[] = [
  {
    id: 'lokum',
    style: 'sugar',
    // rose, pistachio, lemon, orange, mint, pomegranate, lavender
    palette: ['#ff6fa5', '#8fd14f', '#ffd447', '#ff9b3d', '#3fd6c8', '#ef3e5b', '#a77bff'],
    bgTop: '#2a1b5c',
    bgBottom: '#160f33',
    board: '#20184a',
    boardEdge: '#3b2d7a',
    empty: '#2b2260',
    accent: '#ffc94d',
    price: {},
  },
  {
    id: 'pati',
    style: 'paw',
    palette: ['#ffa3c4', '#b5e48c', '#ffe08a', '#ffb877', '#86e3d6', '#ff7b8a', '#c9b0ff'],
    bgTop: '#3b2a4a',
    bgBottom: '#1e1428',
    board: '#2c1f38',
    boardEdge: '#4d3963',
    empty: '#382a48',
    accent: '#ffb3cf',
    price: { coins: 2500 },
  },
  {
    id: 'iznik',
    style: 'tile',
    palette: ['#1f5fbf', '#1aa39a', '#d9412b', '#2f8f4e', '#3e3fa8', '#c2185b', '#0e7cb5'],
    bgTop: '#0f3a63',
    bgBottom: '#06213b',
    board: '#0b2d4f',
    boardEdge: '#1d4f7e',
    empty: '#123a61',
    accent: '#7fd8ff',
    price: { district: 1 },
  },
  {
    id: 'gece',
    style: 'neon',
    palette: ['#ff4fd8', '#5dff7a', '#ffe53d', '#ff9a3d', '#37f3ff', '#ff3d5e', '#9b6bff'],
    bgTop: '#0b0b1f',
    bgBottom: '#000008',
    board: '#090919',
    boardEdge: '#28285a',
    empty: '#14142e',
    accent: '#37f3ff',
    price: { coins: 6000 },
  },
  {
    id: 'cam',
    style: 'glass',
    palette: ['#ff5d8f', '#6bd66b', '#ffcc33', '#ff8a33', '#33d1ff', '#ff3344', '#9966ff'],
    bgTop: '#3a1f12',
    bgBottom: '#1a0c06',
    board: '#2a1609',
    boardEdge: '#6b3f1d',
    empty: '#3a2213',
    accent: '#ffb347',
    price: { district: 3 },
  },
  {
    id: 'saray',
    style: 'gem',
    palette: ['#ff4d8d', '#22c55e', '#facc15', '#fb923c', '#22d3ee', '#ef4444', '#a855f7'],
    bgTop: '#3d0a1e',
    bgBottom: '#1a030c',
    board: '#2a0715',
    boardEdge: '#c99a2e',
    empty: '#3d0d22',
    accent: '#ffd36b',
    price: { product: 'theme_saray', vip: true },
  },
];

export const THEME_BY_ID: Readonly<Record<string, Theme>> = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// ───────────── colour helpers ─────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** amt in [-1, 1]: negative darkens, positive lightens. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
