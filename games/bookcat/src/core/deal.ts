import { Rng } from './rng';
import type { Card, State } from './rules';

/**
 * Turns an abstract level layout into a starting position. The layout only
 * knows category indices and word counts, so the same level plays identically
 * in every language; the words themselves are attached by the content layer.
 */
export interface Layout {
  /** Words per category (one category card each, plus these words). */
  sizes: number[];
  columns: number;
  slots: number;
  /** Face-down cards under the top card of each column. */
  depth: number[];
  seed: number;
  /**
   * Onboarding deals: a category card starts face up in the first column,
   * matching the word on top of the second column, so the very first move
   * the tutorial asks for is always available.
   */
  lead?: boolean;
}

export function buildCards(sizes: number[]): Card[] {
  const cards: Card[] = [];
  sizes.forEach((n, cat) => {
    cards.push({ id: cards.length, kind: 'cat', cat, word: -1 });
    for (let w = 0; w < n; w++) cards.push({ id: cards.length, kind: 'word', cat, word: w });
  });
  return cards;
}

export function deal(layout: Layout, moves = 999): State {
  const cards = buildCards(layout.sizes);
  const rng = new Rng(layout.seed);
  const order = rng.shuffle(cards.map((c) => c.id));
  if (layout.lead && layout.columns > 1) {
    const first = layout.depth[0] ?? 0;
    const second = first + 1 + (layout.depth[1] ?? 0);
    const want = cards[order[second]].cat;
    const at = order.findIndex((id) => cards[id].kind === 'cat' && cards[id].cat === want);
    [order[first], order[at]] = [order[at], order[first]];
  }
  const columns = Array.from({ length: layout.columns }, (_, i) => {
    const d = layout.depth[i] ?? 0;
    const down = order.splice(0, d);
    const up = order.splice(0, 1);
    return { down, up };
  });
  return {
    cards,
    sizes: layout.sizes.slice(),
    columns,
    stock: order,
    waste: [],
    slots: Array.from({ length: layout.slots }, () => null),
    done: [],
    movesLeft: moves,
    movesUsed: 0,
    recycles: 0,
  };
}

export function cardCount(layout: Pick<Layout, 'sizes'>): number {
  return layout.sizes.reduce((a, n) => a + n + 1, 0);
}
