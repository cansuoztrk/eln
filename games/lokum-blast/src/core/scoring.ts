/**
 * Scoring rules. Kept pure so they can be unit-tested and tuned in one place.
 *
 *  - every placed cell: +1
 *  - clearing L lines at once: 80, 240, 480, 800, 1200 ... (rewards multi-clears)
 *  - a "pure flavor" line (all one colour) counts double
 *  - combo streak multiplier: x1, x1.5, x2 ... capped at x5
 *  - wiping the whole board: +800 bonus
 */
export const POINTS_PER_CELL = 1;
export const LINE_BASE = 80;
export const BOARD_CLEAR_BONUS = 800;
export const COMBO_KEEP_MOVES = 3; // non-clearing moves allowed before the streak breaks
export const MAX_COMBO_MULT = 5;

export function linePoints(lines: number): number {
  if (lines <= 0) return 0;
  return Math.round(LINE_BASE * lines * (1 + (lines - 1) * 0.5));
}

export function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return Math.min(MAX_COMBO_MULT, 1 + (combo - 1) * 0.5);
}

export interface MoveScoreInput {
  cellsPlaced: number;
  lines: number;
  pureLines: number;
  combo: number;
  boardCleared: boolean;
}

export interface MoveScore {
  total: number;
  placement: number;
  clear: number;
  bonus: number;
  multiplier: number;
}

export function scoreMove(m: MoveScoreInput): MoveScore {
  const placement = m.cellsPlaced * POINTS_PER_CELL;
  const multiplier = m.lines > 0 ? comboMultiplier(m.combo) : 1;
  const base = linePoints(m.lines) + (m.lines > 0 ? m.pureLines * LINE_BASE : 0);
  const clear = Math.round(base * multiplier);
  const bonus = m.boardCleared ? BOARD_CLEAR_BONUS : 0;
  return { total: placement + clear + bonus, placement, clear, bonus, multiplier };
}

/** Tracks the combo streak across moves. */
export class ComboTracker {
  combo = 0;
  sinceClear = 0;

  /** Call after every placement. Returns the combo value to use for scoring. */
  register(cleared: boolean): number {
    if (cleared) {
      this.combo = this.sinceClear < COMBO_KEEP_MOVES ? this.combo + 1 : 1;
      this.sinceClear = 0;
    } else {
      this.sinceClear++;
      if (this.sinceClear >= COMBO_KEEP_MOVES) this.combo = 0;
    }
    return this.combo;
  }

  snapshot(): [number, number] {
    return [this.combo, this.sinceClear];
  }

  restore([c, s]: [number, number]): void {
    this.combo = c;
    this.sinceClear = s;
  }
}
