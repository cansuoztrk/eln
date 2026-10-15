import type { Shape } from './pieces';

export const SIZE = 8;
export const EMPTY = -1;

/** Cell kinds. Normal lokum, golden lokum (coins), gem (journey goal), crate (obstacle). */
export const Kind = {
  Normal: 0,
  Gold: 1,
  Gem: 2,
  Crate: 3,
} as const;
export type Kind = (typeof Kind)[keyof typeof Kind];

export interface CellInfo {
  idx: number;
  flavor: number;
  kind: Kind;
}

export interface ClearResult {
  rows: number[];
  cols: number[];
  /** Cells that were removed from the board. */
  removed: CellInfo[];
  /** Crate cells that took a hit but survived. */
  cratesHit: number[];
  /** Crate cells that were destroyed. */
  cratesBroken: number;
  /** Lines (row or col) in which every removed cell had the same flavor. */
  pureLines: number;
}

/**
 * 8x8 board stored as flat typed arrays for speed (the dealer and the bot
 * evaluate thousands of placements per move).
 */
export class Board {
  flavor = new Int8Array(SIZE * SIZE).fill(EMPTY);
  kind = new Uint8Array(SIZE * SIZE);
  hp = new Uint8Array(SIZE * SIZE);

  static idx(r: number, c: number): number {
    return r * SIZE + c;
  }

  clone(): Board {
    const b = new Board();
    b.flavor.set(this.flavor);
    b.kind.set(this.kind);
    b.hp.set(this.hp);
    return b;
  }

  copyFrom(other: Board): void {
    this.flavor.set(other.flavor);
    this.kind.set(other.kind);
    this.hp.set(other.hp);
  }

  isFilled(i: number): boolean {
    return this.flavor[i] !== EMPTY;
  }

  filledCount(): number {
    let n = 0;
    for (let i = 0; i < SIZE * SIZE; i++) if (this.flavor[i] !== EMPTY) n++;
    return n;
  }

  isEmpty(): boolean {
    for (let i = 0; i < SIZE * SIZE; i++) if (this.flavor[i] !== EMPTY) return false;
    return true;
  }

  countKind(k: Kind): number {
    let n = 0;
    for (let i = 0; i < SIZE * SIZE; i++) if (this.flavor[i] !== EMPTY && this.kind[i] === k) n++;
    return n;
  }

  set(i: number, flavor: number, kind: Kind = Kind.Normal, hp = 0): void {
    this.flavor[i] = flavor;
    this.kind[i] = kind;
    this.hp[i] = hp;
  }

  clear(i: number): void {
    this.flavor[i] = EMPTY;
    this.kind[i] = Kind.Normal;
    this.hp[i] = 0;
  }

  canPlace(shape: Shape, r: number, c: number): boolean {
    if (r < 0 || c < 0 || r + shape.h > SIZE || c + shape.w > SIZE) return false;
    for (const [dr, dc] of shape.cells) {
      if (this.flavor[(r + dr) * SIZE + c + dc] !== EMPTY) return false;
    }
    return true;
  }

  /** Places the shape and returns the board indices it occupies. */
  place(shape: Shape, r: number, c: number, flavor: number, goldCell = -1): number[] {
    const out: number[] = [];
    shape.cells.forEach(([dr, dc], k) => {
      const i = (r + dr) * SIZE + c + dc;
      this.set(i, flavor, k === goldCell ? Kind.Gold : Kind.Normal);
      out.push(i);
    });
    return out;
  }

  anyFit(shape: Shape): boolean {
    for (let r = 0; r <= SIZE - shape.h; r++) {
      for (let c = 0; c <= SIZE - shape.w; c++) {
        if (this.canPlace(shape, r, c)) return true;
      }
    }
    return false;
  }

  fitPositions(shape: Shape): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (let r = 0; r <= SIZE - shape.h; r++) {
      for (let c = 0; c <= SIZE - shape.w; c++) {
        if (this.canPlace(shape, r, c)) out.push([r, c]);
      }
    }
    return out;
  }

  fullLines(): { rows: number[]; cols: number[] } {
    const rows: number[] = [];
    const cols: number[] = [];
    for (let r = 0; r < SIZE; r++) {
      let full = true;
      for (let c = 0; c < SIZE; c++) {
        if (this.flavor[r * SIZE + c] === EMPTY) {
          full = false;
          break;
        }
      }
      if (full) rows.push(r);
    }
    for (let c = 0; c < SIZE; c++) {
      let full = true;
      for (let r = 0; r < SIZE; r++) {
        if (this.flavor[r * SIZE + c] === EMPTY) {
          full = false;
          break;
        }
      }
      if (full) cols.push(c);
    }
    return { rows, cols };
  }

  /**
   * Which lines *would* be completed if `shape` were placed at (r, c)?
   * Used for the glowing preview while dragging.
   */
  previewLines(shape: Shape, r: number, c: number): { rows: number[]; cols: number[] } {
    const occupied = new Set<number>();
    for (const [dr, dc] of shape.cells) occupied.add((r + dr) * SIZE + c + dc);
    const filled = (i: number) => this.flavor[i] !== EMPTY || occupied.has(i);
    const rows: number[] = [];
    const cols: number[] = [];
    const touchedRows = new Set<number>();
    const touchedCols = new Set<number>();
    for (const [dr, dc] of shape.cells) {
      touchedRows.add(r + dr);
      touchedCols.add(c + dc);
    }
    for (const row of touchedRows) {
      let full = true;
      for (let cc = 0; cc < SIZE; cc++) if (!filled(row * SIZE + cc)) { full = false; break; }
      if (full) rows.push(row);
    }
    for (const col of touchedCols) {
      let full = true;
      for (let rr = 0; rr < SIZE; rr++) if (!filled(rr * SIZE + col)) { full = false; break; }
      if (full) cols.push(col);
    }
    return { rows, cols };
  }

  /** Clears the given lines. Crates lose one hp per clear event instead of vanishing. */
  clearLines(rows: number[], cols: number[]): ClearResult {
    const targets = new Set<number>();
    let pureLines = 0;
    const lineCells: number[][] = [];
    for (const r of rows) lineCells.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c));
    for (const c of cols) lineCells.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c));
    for (const line of lineCells) {
      const f0 = this.flavor[line[0]];
      let pure = this.kind[line[0]] !== Kind.Crate;
      for (const i of line) {
        targets.add(i);
        if (pure && (this.flavor[i] !== f0 || this.kind[i] === Kind.Crate)) pure = false;
      }
      if (pure) pureLines++;
    }
    const removed: CellInfo[] = [];
    const cratesHit: number[] = [];
    let cratesBroken = 0;
    for (const i of targets) {
      if (this.kind[i] === Kind.Crate) {
        if (this.hp[i] > 1) {
          this.hp[i]--;
          cratesHit.push(i);
          continue;
        }
        cratesBroken++;
      }
      removed.push({ idx: i, flavor: this.flavor[i], kind: this.kind[i] as Kind });
      this.clear(i);
    }
    return { rows, cols, removed, cratesHit, cratesBroken, pureLines };
  }

  /** Removes everything inside a square area (bomb / revive). Crates take one hit. */
  blast(cr: number, cc: number, radius: number): ClearResult {
    const removed: CellInfo[] = [];
    const cratesHit: number[] = [];
    let cratesBroken = 0;
    for (let r = cr - radius; r <= cr + radius; r++) {
      for (let c = cc - radius; c <= cc + radius; c++) {
        if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) continue;
        const i = r * SIZE + c;
        if (this.flavor[i] === EMPTY) continue;
        if (this.kind[i] === Kind.Crate) {
          if (this.hp[i] > 1) {
            this.hp[i]--;
            cratesHit.push(i);
            continue;
          }
          cratesBroken++;
        }
        removed.push({ idx: i, flavor: this.flavor[i], kind: this.kind[i] as Kind });
        this.clear(i);
      }
    }
    return { rows: [], cols: [], removed, cratesHit, cratesBroken, pureLines: 0 };
  }

  /** Counts empty cells fully enclosed by filled cells / walls (bad for the player). */
  holes(): number {
    let n = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        if (this.flavor[i] !== EMPTY) continue;
        const up = r === 0 || this.flavor[i - SIZE] !== EMPTY;
        const down = r === SIZE - 1 || this.flavor[i + SIZE] !== EMPTY;
        const left = c === 0 || this.flavor[i - 1] !== EMPTY;
        const right = c === SIZE - 1 || this.flavor[i + 1] !== EMPTY;
        if (up && down && left && right) n++;
      }
    }
    return n;
  }

  serialize(): { f: number[]; k: number[]; h: number[] } {
    return { f: Array.from(this.flavor), k: Array.from(this.kind), h: Array.from(this.hp) };
  }

  static deserialize(d: { f: number[]; k: number[]; h: number[] }): Board {
    const b = new Board();
    b.flavor.set(d.f);
    b.kind.set(d.k);
    b.hp.set(d.h);
    return b;
  }
}
