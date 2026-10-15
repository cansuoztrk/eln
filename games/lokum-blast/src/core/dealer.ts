import { Board, SIZE } from './board';
import { makePiece, SHAPES, type Piece, type Shape, type Tier } from './pieces';
import type { Rng } from './rng';

export interface DealOptions {
  /** 0 (gentle) .. 1 (brutal). */
  difficulty: number;
  /** Probability that the tray contains at least one piece completing a line. */
  help: number;
  /** Probability we insist the whole tray can be placed in some order. */
  solvable: number;
  /** Flavor ids available in this mode. */
  flavors: readonly number[];
  /** Flavors that should appear more often (journey goals). */
  favor?: readonly number[];
  /** Per-piece chance of carrying one golden lokum. */
  goldChance: number;
}

function tierWeight(tier: Tier, difficulty: number, fill: number): number {
  const crowd = Math.max(0, fill - 0.45) * 2; // 0..1.1 when board is getting full
  switch (tier) {
    case 'small':
      return 1.15 - 0.55 * difficulty + 0.9 * crowd;
    case 'medium':
      return 1;
    case 'large':
      return Math.max(0.15, 0.45 + 1.0 * difficulty - 0.8 * crowd);
  }
}

function pickShape(rng: Rng, difficulty: number, fill: number): Shape {
  const weights = SHAPES.map((s) => s.weight * tierWeight(s.tier, difficulty, fill));
  return rng.weighted(SHAPES, weights);
}

/** Max number of lines a single placement of `shape` can complete right now. */
export function bestClearLines(board: Board, shape: Shape): number {
  let best = 0;
  for (let r = 0; r <= SIZE - shape.h; r++) {
    for (let c = 0; c <= SIZE - shape.w; c++) {
      if (!board.canPlace(shape, r, c)) continue;
      const { rows, cols } = board.previewLines(shape, r, c);
      const n = rows.length + cols.length;
      if (n > best) best = n;
    }
  }
  return best;
}

/** Cheap placement heuristic used to keep the solvability search small. */
function rankPositions(board: Board, shape: Shape, limit: number): Array<[number, number]> {
  const scored: Array<[number, number, number]> = [];
  for (let r = 0; r <= SIZE - shape.h; r++) {
    for (let c = 0; c <= SIZE - shape.w; c++) {
      if (!board.canPlace(shape, r, c)) continue;
      const { rows, cols } = board.previewLines(shape, r, c);
      let touch = 0;
      for (const [dr, dc] of shape.cells) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr === 0 || board.isFilled((rr - 1) * SIZE + cc)) touch++;
        if (rr === SIZE - 1 || board.isFilled((rr + 1) * SIZE + cc)) touch++;
        if (cc === 0 || board.isFilled(rr * SIZE + cc - 1)) touch++;
        if (cc === SIZE - 1 || board.isFilled(rr * SIZE + cc + 1)) touch++;
      }
      scored.push([r, c, (rows.length + cols.length) * 20 + touch]);
    }
  }
  scored.sort((a, b) => b[2] - a[2]);
  return scored.slice(0, limit).map(([r, c]) => [r, c]);
}

/**
 * Is there an order and placement in which all shapes fit (clearing lines in
 * between)? Bounded search: only the most promising positions are explored.
 */
export function canPlaceAll(board: Board, shapes: readonly Shape[], breadth = 10): boolean {
  if (shapes.length === 0) return true;
  if (shapes.length === 1) return board.anyFit(shapes[0]);
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const rest = shapes.filter((_, k) => k !== i);
    for (const [r, c] of rankPositions(board, shape, breadth)) {
      const b = board.clone();
      b.place(shape, r, c, 0);
      const { rows, cols } = b.fullLines();
      if (rows.length || cols.length) b.clearLines(rows, cols);
      if (canPlaceAll(b, rest, Math.max(4, breadth >> 1))) return true;
    }
  }
  return false;
}

export function dealTray(board: Board, rng: Rng, opts: DealOptions): Piece[] {
  const fill = board.filledCount() / (SIZE * SIZE);
  const wantSolvable = rng.chance(opts.solvable);
  const wantHelp = rng.chance(opts.help);

  let shapes: Shape[] = [];
  let ok = false;
  for (let attempt = 0; attempt < 14 && !ok; attempt++) {
    // Each failed attempt eases difficulty a little so we converge quickly.
    const d = Math.max(0, opts.difficulty - attempt * 0.08);
    shapes = [pickShape(rng, d, fill), pickShape(rng, d, fill), pickShape(rng, d, fill)];

    if (wantHelp && !shapes.some((s) => bestClearLines(board, s) > 0)) {
      const helpers = SHAPES.filter((s) => bestClearLines(board, s) > 0);
      if (helpers.length) {
        const weights = helpers.map((s) => s.weight * (1 + bestClearLines(board, s)));
        shapes[rng.int(0, 2)] = rng.weighted(helpers, weights);
      }
    }

    if (wantSolvable) ok = canPlaceAll(board, shapes);
    else ok = shapes.some((s) => board.anyFit(s));
  }

  if (!ok) {
    // Last resort: make sure at least something fits if the board has room.
    const fitting = SHAPES.filter((s) => board.anyFit(s));
    if (fitting.length && !shapes.some((s) => board.anyFit(s))) {
      shapes[0] = rng.weighted(fitting, fitting.map((s) => (s.tier === 'small' ? 4 : 1)));
    }
  }

  return shapes.map((s) => {
    const favor = opts.favor ?? [];
    const flavorWeights = opts.flavors.map((f) => (favor.includes(f) ? 2.2 : 1));
    const flavor = rng.weighted(opts.flavors, flavorWeights);
    const gold = rng.chance(opts.goldChance) ? rng.int(0, s.cells.length - 1) : -1;
    return makePiece(s, flavor, gold);
  });
}

/** Classic-mode difficulty curve driven by score. */
export function classicDealOptions(score: number, flavors: readonly number[]): DealOptions {
  const d = Math.min(1, score / 12000);
  return {
    difficulty: 0.15 + 0.75 * d,
    help: 0.55 - 0.3 * d,
    solvable: 0.97 - 0.3 * d,
    flavors,
    goldChance: 0.06,
  };
}
