import { Board, Kind, SIZE } from './board';
import { hashSeed, Rng } from './rng';
import tuning from './level-tuning.json';

/** Offline-calibrated overrides: { [levelId]: [moves, salt] }. See scripts/calibrate.test.ts. */
const TUNING = tuning as unknown as Record<string, [number, number]>;

/**
 * Journey ("Yolculuk") levels are generated deterministically from the level
 * number, so we ship unlimited content without a level editor. The curve is a
 * saw-tooth: difficulty rises inside each block of 10 and every 10th level is
 * a "boss" with a bigger reward.
 */
export type GoalType = 'score' | 'flavor' | 'gem' | 'crate' | 'gold';

export interface Goal {
  type: GoalType;
  count: number;
  flavor?: number;
}

export interface LevelDef {
  id: number;
  seed: number;
  moves: number;
  goals: Goal[];
  flavors: number[];
  difficulty: number;
  boss: boolean;
  /** Prefilled board, applied on level start. */
  board: Board;
  /** Reward in coins on first completion. */
  reward: number;
}

export const FLAVOR_COUNT = 7;
export const ALL_FLAVORS = [0, 1, 2, 3, 4, 5, 6];

type Pattern = (r: number, c: number, rng: Rng) => boolean;

const PATTERNS: Record<string, Pattern> = {
  scatter: (_r, _c, rng) => rng.chance(0.22),
  border: (r, c) => r === 0 || c === 0 || r === SIZE - 1 || c === SIZE - 1,
  checker: (r, c) => (r + c) % 2 === 0 && r > 1 && r < 6,
  bottom: (r) => r >= 5,
  pillars: (_r, c) => c === 1 || c === 6,
  cross: (r, c) => r === 3 || r === 4 || c === 3 || c === 4,
  diamond: (r, c) => Math.abs(r - 3.5) + Math.abs(c - 3.5) <= 2.5,
  corners: (r, c) => (r < 3 || r > 4) && (c < 3 || c > 4),
  stairs: (r, c) => c <= r - 2,
  frame: (r, c) => (r === 1 || r === 6 || c === 1 || c === 6) && r >= 1 && r <= 6 && c >= 1 && c <= 6,
  heart: (r, c) => {
    const heart = ['........', '.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........'];
    return heart[r][c] === 'X';
  },
  tulip: (r, c) => {
    const t = ['........', '..X.X...', '.XXXXX..', '.XXXXX..', '..XXX...', '...X....', '.XXXXX..', '........'];
    return t[r][c] === 'X';
  },
};

const PATTERN_KEYS = Object.keys(PATTERNS);

/** Removes cells so no row/column starts full and leaves breathing room. */
function sanitize(board: Board, rng: Rng): void {
  for (let pass = 0; pass < 3; pass++) {
    const { rows, cols } = board.fullLines();
    if (!rows.length && !cols.length) break;
    for (const r of rows) board.clear(r * SIZE + rng.int(0, SIZE - 1));
    for (const c of cols) board.clear(rng.int(0, SIZE - 1) * SIZE + c);
  }
}

export function makeLevel(id: number, saltOverride?: number): LevelDef {
  const tuned = TUNING[String(id)];
  const salt = saltOverride ?? (tuned ? tuned[1] : 0);
  const seed = hashSeed(salt ? `lokum-level-${id}-${salt}` : `lokum-level-${id}`);
  const rng = new Rng(seed);
  const block = Math.floor((id - 1) / 10);
  const inBlock = (id - 1) % 10; // 0..9
  const boss = inBlock === 9;
  const difficulty = Math.min(1, 0.08 + block * 0.07 + inBlock * 0.025 + (boss ? 0.08 : 0));

  // Fewer flavors early → goals are easier to read; more later.
  const flavorCount = Math.min(FLAVOR_COUNT, 4 + Math.floor(id / 12));
  const flavors = rng.shuffle([...ALL_FLAVORS]).slice(0, flavorCount).sort();

  const board = new Board();
  const goals: Goal[] = [];

  // Choose goal mix. Early levels introduce one mechanic at a time.
  let types: GoalType[];
  if (id <= 2) types = ['score'];
  else if (id <= 4) types = ['flavor'];
  else if (id <= 6) types = ['gem'];
  else if (id <= 8) types = ['crate'];
  else if (id === 9) types = ['flavor', 'gem'];
  else if (id === 10) types = ['crate', 'gem'];
  else {
    const pool: GoalType[] = ['flavor', 'gem', 'crate', 'score', 'flavor', 'gem', 'crate'];
    const n = boss || rng.chance(0.25 + difficulty * 0.35) ? 2 : 1;
    types = [];
    while (types.length < n) {
      const t = rng.pick(pool);
      if (!types.includes(t) && !(t === 'score' && n > 1)) types.push(t);
    }
  }

  // Prefill the board with a pattern if the goals need board content.
  const needsBoard = types.some((t) => t === 'gem' || t === 'crate');
  const patternKey = id <= 8 ? (['scatter', 'bottom', 'border', 'scatter'] as const)[id % 4] : rng.pick(PATTERN_KEYS);
  const pattern = PATTERNS[patternKey];
  let gemCount = 0;
  let crateCount = 0;
  if (needsBoard || rng.chance(0.35 + difficulty * 0.3)) {
    const density = 0.55 + difficulty * 0.35;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!pattern(r, c, rng) || !rng.chance(density)) continue;
        board.set(r * SIZE + c, rng.pick(flavors));
      }
    }
    sanitize(board, rng);
    const wantGems = types.includes('gem') ? 3 + Math.floor(difficulty * 7) + (boss ? 2 : 0) : 0;
    const wantCrates = types.includes('crate') ? 4 + Math.floor(difficulty * 8) + (boss ? 2 : 0) : 0;
    // Top up the board so there are enough cells to host gems / crates,
    // without ever completing a line.
    const lineCount = (i: number) => {
      const r = Math.floor(i / SIZE);
      const c = i % SIZE;
      let rn = 0;
      let cn = 0;
      for (let k = 0; k < SIZE; k++) {
        if (board.isFilled(r * SIZE + k)) rn++;
        if (board.isFilled(k * SIZE + c)) cn++;
      }
      return Math.max(rn, cn);
    };
    let guard = 0;
    while (board.filledCount() < wantGems + wantCrates + 6 && guard++ < 500) {
      const i = rng.int(0, SIZE * SIZE - 1);
      if (!board.isFilled(i) && lineCount(i) < SIZE - 1) board.set(i, rng.pick(flavors));
    }
    const usable: number[] = [];
    for (let i = 0; i < SIZE * SIZE; i++) if (board.isFilled(i)) usable.push(i);
    rng.shuffle(usable);
    gemCount = Math.min(wantGems, usable.length);
    for (let k = 0; k < gemCount; k++) board.kind[usable[k]] = Kind.Gem;
    crateCount = Math.min(wantCrates, usable.length - gemCount);
    for (let k = gemCount; k < gemCount + crateCount; k++) {
      board.kind[usable[k]] = Kind.Crate;
      board.hp[usable[k]] = difficulty > 0.35 && rng.chance(0.25 + difficulty * 0.4) ? 2 : 1;
    }
  }

  let movesNeeded = 0;
  for (const t of types) {
    switch (t) {
      case 'score': {
        const count = Math.round((600 + difficulty * 2400 + id * 30) / 50) * 50;
        goals.push({ type: 'score', count });
        movesNeeded += count / 55;
        break;
      }
      case 'flavor': {
        const f = rng.pick(flavors);
        const count = Math.round((14 + difficulty * 30) / 2) * 2;
        goals.push({ type: 'flavor', flavor: f, count });
        movesNeeded += count / (2.4 - flavors.length * 0.12);
        break;
      }
      case 'gem': {
        goals.push({ type: 'gem', count: gemCount });
        movesNeeded += 6 + gemCount * 1.6;
        break;
      }
      case 'crate': {
        let hp = 0;
        for (let i = 0; i < SIZE * SIZE; i++) if (board.kind[i] === Kind.Crate) hp += board.hp[i];
        goals.push({ type: 'crate', count: crateCount });
        movesNeeded += 6 + hp * 1.5;
        break;
      }
      case 'gold':
        break;
    }
  }
  // Slack shrinks with difficulty: generous early, tight later.
  const slack = 1.75 - difficulty * 0.55;
  const formulaMoves = Math.max(10, Math.round(movesNeeded * slack));
  const moves = tuned && saltOverride === undefined ? tuned[0] : formulaMoves;
  const reward = boss ? 120 : 30 + Math.floor(difficulty * 30);

  return { id, seed, moves, goals, flavors, difficulty, boss, board, reward };
}

/** Daily challenge: a mid-difficulty level seeded by the calendar date. */
export function makeDaily(dateKey: string): LevelDef {
  const seed = hashSeed(`lokum-daily-${dateKey}`);
  const pseudoId = 15 + (seed % 60);
  const lvl = makeLevel(pseudoId);
  return { ...lvl, id: -1, seed, reward: 150, boss: false };
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Stars earned for a completed level, based on moves left. */
export function starsFor(movesLeft: number, totalMoves: number): 1 | 2 | 3 {
  const ratio = movesLeft / Math.max(1, totalMoves);
  if (ratio >= 0.3) return 3;
  if (ratio >= 0.12) return 2;
  return 1;
}
