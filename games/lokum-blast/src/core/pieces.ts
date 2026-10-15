/**
 * Piece catalogue. Shapes are written as ASCII art so they are easy to tweak.
 * `tier` drives the dealer: small pieces rescue a crowded board, large ones
 * create pressure as the game speeds up.
 */
export type Tier = 'small' | 'medium' | 'large';

export interface Shape {
  id: string;
  cells: ReadonlyArray<readonly [number, number]>; // [row, col]
  w: number;
  h: number;
  tier: Tier;
  /** Base weight for the random dealer. */
  weight: number;
}

function parse(id: string, art: string, tier: Tier, weight: number): Shape {
  const rows = art
    .trim()
    .split('\n')
    .map((r) => r.trim());
  const cells: [number, number][] = [];
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === 'X') cells.push([r, c]);
    });
  });
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return { id, cells, w, h, tier, weight };
}

export const SHAPES: readonly Shape[] = [
  parse('dot', 'X', 'small', 3),
  parse('i2h', 'XX', 'small', 5),
  parse('i2v', 'X\nX', 'small', 5),
  parse('i3h', 'XXX', 'medium', 6),
  parse('i3v', 'X\nX\nX', 'medium', 6),
  parse('i4h', 'XXXX', 'medium', 5),
  parse('i4v', 'X\nX\nX\nX', 'medium', 5),
  parse('i5h', 'XXXXX', 'large', 3),
  parse('i5v', 'X\nX\nX\nX\nX', 'large', 3),
  parse('o2', 'XX\nXX', 'medium', 7),
  parse('o3', 'XXX\nXXX\nXXX', 'large', 2.5),
  parse('r23', 'XXX\nXXX', 'large', 3),
  parse('r32', 'XX\nXX\nXX', 'large', 3),
  // small corners (3 cells)
  parse('c1', 'XX\nX.', 'small', 3),
  parse('c2', 'XX\n.X', 'small', 3),
  parse('c3', 'X.\nXX', 'small', 3),
  parse('c4', '.X\nXX', 'small', 3),
  // big corners (5 cells)
  parse('C1', 'XXX\nX..\nX..', 'large', 1.6),
  parse('C2', 'XXX\n..X\n..X', 'large', 1.6),
  parse('C3', 'X..\nX..\nXXX', 'large', 1.6),
  parse('C4', '..X\n..X\nXXX', 'large', 1.6),
  // L / J tetrominoes
  parse('L1', 'X.\nX.\nXX', 'medium', 2),
  parse('L2', 'XXX\nX..', 'medium', 2),
  parse('L3', 'XX\n.X\n.X', 'medium', 2),
  parse('L4', '..X\nXXX', 'medium', 2),
  parse('J1', '.X\n.X\nXX', 'medium', 2),
  parse('J2', 'X..\nXXX', 'medium', 2),
  parse('J3', 'XX\nX.\nX.', 'medium', 2),
  parse('J4', 'XXX\n..X', 'medium', 2),
  // T tetrominoes
  parse('T1', 'XXX\n.X.', 'medium', 2),
  parse('T2', '.X\nXX\n.X', 'medium', 2),
  parse('T3', '.X.\nXXX', 'medium', 2),
  parse('T4', 'X.\nXX\nX.', 'medium', 2),
  // S / Z
  parse('S1', '.XX\nXX.', 'medium', 1.6),
  parse('S2', 'X.\nXX\n.X', 'medium', 1.6),
  parse('Z1', 'XX.\n.XX', 'medium', 1.6),
  parse('Z2', '.X\nXX\nX.', 'medium', 1.6),
  // diagonals (tricky, rare)
  parse('d2a', 'X.\n.X', 'small', 1),
  parse('d2b', '.X\nX.', 'small', 1),
];

export const SHAPE_BY_ID: Readonly<Record<string, Shape>> = Object.fromEntries(
  SHAPES.map((s) => [s.id, s]),
);

/** A concrete piece in the tray: shape + flavor (+ optional golden cell). */
export interface Piece {
  shape: Shape;
  flavor: number;
  /** Index into shape.cells that is a golden lokum, or -1. */
  gold: number;
  uid: number;
}

let uidCounter = 1;
export function makePiece(shape: Shape, flavor: number, gold = -1): Piece {
  return { shape, flavor, gold, uid: uidCounter++ };
}
