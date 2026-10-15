import { Board, Kind, SIZE } from './board';
import type { Session } from './session';

/**
 * Greedy one-ply player. Powers the in-game hint ("İpucu") and the automated
 * level-balance tests that make sure every journey level is beatable.
 */
export interface Move {
  slot: number;
  r: number;
  c: number;
  value: number;
}

function evaluate(session: Session, slot: number, r: number, c: number): number {
  const piece = session.tray[slot]!;
  const b: Board = session.board.clone();
  b.place(piece.shape, r, c, piece.flavor, piece.gold);
  const { rows, cols } = b.fullLines();
  const lines = rows.length + cols.length;
  let value = lines * 120 + (lines >= 2 ? lines * 60 : 0);

  if (lines) {
    const res = b.clearLines(rows, cols);
    const level = session.level;
    if (level) {
      level.goals.forEach((g, k) => {
        const left = g.count - session.progress[k];
        if (left <= 0) return;
        if (g.type === 'flavor') value += 25 * Math.min(left, res.removed.filter((x) => x.flavor === g.flavor && x.kind !== Kind.Crate).length);
        if (g.type === 'gem') value += 90 * res.removed.filter((x) => x.kind === Kind.Gem).length;
        if (g.type === 'crate') value += 70 * (res.cratesBroken + res.cratesHit.length * 0.6);
      });
    }
    value += res.removed.filter((x) => x.kind === Kind.Gold).length * 20;
    if (b.isEmpty()) value += 400;
  }

  // Board health: fewer holes, more contiguous empty space, more lines close to done.
  value -= b.holes() * 30;
  value -= b.filledCount() * 1.5;
  for (let i = 0; i < SIZE; i++) {
    let rowFill = 0;
    let colFill = 0;
    for (let k = 0; k < SIZE; k++) {
      if (b.isFilled(i * SIZE + k)) rowFill++;
      if (b.isFilled(k * SIZE + i)) colFill++;
    }
    if (rowFill >= 6) value += (rowFill - 5) * 4;
    if (colFill >= 6) value += (colFill - 5) * 4;
  }
  // Keep room for the other pieces in the tray.
  for (let s = 0; s < session.tray.length; s++) {
    const other = session.tray[s];
    if (s === slot || !other) continue;
    if (!b.anyFit(other.shape)) value -= 250;
  }
  return value;
}

export function bestMove(session: Session): Move | null {
  let best: Move | null = null;
  session.tray.forEach((piece, slot) => {
    if (!piece) return;
    for (let r = 0; r <= SIZE - piece.shape.h; r++) {
      for (let c = 0; c <= SIZE - piece.shape.w; c++) {
        if (!session.board.canPlace(piece.shape, r, c)) continue;
        const value = evaluate(session, slot, r, c);
        if (!best || value > best.value) best = { slot, r, c, value };
      }
    }
  });
  return best;
}

/** Plays a session to the end. Returns whether the level was won. */
export function autoplay(session: Session, maxMoves = 2000): { won: boolean; moves: number } {
  let moves = 0;
  while (moves < maxMoves) {
    if (session.goalsComplete()) return { won: true, moves };
    if (session.outOfMoves() || session.stuck()) return { won: false, moves };
    const m = bestMove(session);
    if (!m) return { won: false, moves };
    session.place(m.slot, m.r, m.c);
    moves++;
  }
  return { won: session.goalsComplete(), moves };
}
