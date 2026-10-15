import { Board, Kind, SIZE, type ClearResult } from './board';
import { classicDealOptions, dealTray, type DealOptions } from './dealer';
import { ALL_FLAVORS, type LevelDef } from './levels';
import { makePiece, SHAPE_BY_ID, type Piece } from './pieces';
import { Rng } from './rng';
import { ComboTracker, scoreMove, type MoveScore } from './scoring';

export type Mode = 'classic' | 'journey' | 'daily';

export interface SessionStats {
  pieces: number;
  lines: number;
  maxCombo: number;
  pureLines: number;
  boardClears: number;
  gold: number;
  multiClears: number; // moves that cleared 2+ lines
}

export interface MoveResult {
  placed: number[];
  clear: ClearResult | null;
  score: MoveScore;
  combo: number;
  gold: number;
  boardCleared: boolean;
  newTray: boolean;
}

export interface ClassicSave {
  board: { f: number[]; k: number[]; h: number[] };
  tray: Array<{ s: string; f: number; g: number } | null>;
  score: number;
  combo: [number, number];
  rng: number;
  stats: SessionStats;
  revives: number;
  coins: number;
}

interface Snapshot {
  board: Board;
  tray: (Piece | null)[];
  score: number;
  combo: [number, number];
  movesLeft: number;
  progress: number[];
  rng: number;
  stats: SessionStats;
  coins: number;
}

export const GOLD_COINS = 5;
const UNDO_DEPTH = 5;

export class Session {
  readonly mode: Mode;
  readonly level: LevelDef | null;
  board: Board;
  tray: (Piece | null)[] = [];
  score = 0;
  readonly combo = new ComboTracker();
  movesLeft: number;
  /** Progress per goal, same order as level.goals. */
  progress: number[];
  coins = 0;
  revives = 0;
  stats: SessionStats = { pieces: 0, lines: 0, maxCombo: 0, pureLines: 0, boardClears: 0, gold: 0, multiClears: 0 };
  private rng: Rng;
  private history: Snapshot[] = [];

  constructor(mode: Mode, level: LevelDef | null = null, seed = Date.now()) {
    this.mode = mode;
    this.level = level;
    this.board = level ? level.board.clone() : new Board();
    this.rng = new Rng(level ? (level.seed + Math.imul(seed, 7919)) >>> 0 : seed);
    this.movesLeft = level ? level.moves : Infinity;
    this.progress = level ? level.goals.map(() => 0) : [];
    this.tray = dealTray(this.board, this.rng, this.dealOptions());
  }

  get flavors(): readonly number[] {
    return this.level ? this.level.flavors : ALL_FLAVORS;
  }

  dealOptions(): DealOptions {
    if (!this.level) return classicDealOptions(this.score, this.flavors);
    const favor = this.level.goals.filter((g) => g.type === 'flavor').map((g) => g.flavor!);
    const d = this.level.difficulty;
    return {
      difficulty: 0.1 + d * 0.6,
      help: 0.6 - d * 0.25,
      solvable: 0.96 - d * 0.2,
      flavors: this.level.flavors,
      favor,
      goldChance: 0.04,
    };
  }

  canPlace(slot: number, r: number, c: number): boolean {
    const p = this.tray[slot];
    return !!p && this.board.canPlace(p.shape, r, c);
  }

  private snapshot(): void {
    this.history.push({
      board: this.board.clone(),
      tray: [...this.tray],
      score: this.score,
      combo: this.combo.snapshot(),
      movesLeft: this.movesLeft,
      progress: [...this.progress],
      rng: this.rng.state,
      stats: { ...this.stats },
      coins: this.coins,
    });
    if (this.history.length > UNDO_DEPTH) this.history.shift();
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  undo(): boolean {
    const s = this.history.pop();
    if (!s) return false;
    this.board = s.board;
    this.tray = s.tray;
    this.score = s.score;
    this.combo.restore(s.combo);
    this.movesLeft = s.movesLeft;
    this.progress = s.progress;
    this.rng.state = s.rng;
    this.stats = s.stats;
    this.coins = s.coins;
    return true;
  }

  place(slot: number, r: number, c: number): MoveResult | null {
    const piece = this.tray[slot];
    if (!piece || !this.board.canPlace(piece.shape, r, c)) return null;
    this.snapshot();

    const placed = this.board.place(piece.shape, r, c, piece.flavor, piece.gold);
    this.tray[slot] = null;
    this.stats.pieces++;
    if (this.level) this.movesLeft--;

    const { rows, cols } = this.board.fullLines();
    const lines = rows.length + cols.length;
    let clear: ClearResult | null = null;
    let gold = 0;
    if (lines > 0) {
      clear = this.board.clearLines(rows, cols);
      gold = this.applyClear(clear);
      this.stats.lines += lines;
      this.stats.pureLines += clear.pureLines;
      if (lines >= 2) this.stats.multiClears++;
    }
    const combo = this.combo.register(lines > 0);
    this.stats.maxCombo = Math.max(this.stats.maxCombo, combo);
    const boardCleared = lines > 0 && this.board.isEmpty();
    if (boardCleared) this.stats.boardClears++;

    const score = scoreMove({
      cellsPlaced: placed.length,
      lines,
      pureLines: clear?.pureLines ?? 0,
      combo,
      boardCleared,
    });
    this.score += score.total;
    this.updateScoreGoals();

    let newTray = false;
    if (this.tray.every((p) => p === null)) {
      this.tray = dealTray(this.board, this.rng, this.dealOptions());
      newTray = true;
    }
    return { placed, clear, score, combo, gold, boardCleared, newTray };
  }

  /** Updates goal progress & coins from a clear. Returns gold coins collected. */
  private applyClear(clear: ClearResult): number {
    let gold = 0;
    for (const cell of clear.removed) {
      if (cell.kind === Kind.Gold) gold++;
    }
    if (this.level) {
      this.level.goals.forEach((g, k) => {
        switch (g.type) {
          case 'flavor':
            this.progress[k] += clear.removed.filter((x) => x.flavor === g.flavor && x.kind !== Kind.Crate).length;
            break;
          case 'gem':
            this.progress[k] += clear.removed.filter((x) => x.kind === Kind.Gem).length;
            break;
          case 'crate':
            this.progress[k] += clear.cratesBroken;
            break;
          case 'gold':
            this.progress[k] += gold;
            break;
          default:
            break;
        }
        this.progress[k] = Math.min(this.progress[k], g.count);
      });
    }
    this.stats.gold += gold;
    this.coins += gold * GOLD_COINS;
    return gold;
  }

  private updateScoreGoals(): void {
    if (!this.level) return;
    this.level.goals.forEach((g, k) => {
      if (g.type === 'score') this.progress[k] = Math.min(g.count, this.score);
    });
  }

  goalsComplete(): boolean {
    if (!this.level) return false;
    return this.level.goals.every((g, k) => this.progress[k] >= g.count);
  }

  /** True if none of the remaining tray pieces fits anywhere. */
  stuck(): boolean {
    return this.tray.every((p) => p === null || !this.board.anyFit(p.shape));
  }

  outOfMoves(): boolean {
    return !!this.level && this.movesLeft <= 0 && !this.goalsComplete();
  }

  // ───────────── boosters ─────────────

  /** Hammer: removes one cell (crates lose one hp). */
  hammer(i: number): ClearResult | null {
    if (!this.board.isFilled(i)) return null;
    this.snapshot();
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const res = this.board.blast(r, c, 0);
    this.applyClear(res);
    return res;
  }

  /** Pomegranate bomb: clears a 3x3 area. */
  bomb(r: number, c: number): ClearResult {
    this.snapshot();
    const res = this.board.blast(r, c, 1);
    this.applyClear(res);
    this.updateScoreGoals();
    return res;
  }

  /** Refresh: deals a brand new tray. */
  refresh(): void {
    this.snapshot();
    this.tray = dealTray(this.board, this.rng, { ...this.dealOptions(), solvable: 1, help: 0.9 });
  }

  /** Revive after getting stuck: clears the densest 4x4 area and deals easy pieces. */
  revive(): ClearResult {
    this.revives++;
    let best = 0;
    let br = 0;
    let bc = 0;
    for (let r = 0; r <= SIZE - 4; r++) {
      for (let c = 0; c <= SIZE - 4; c++) {
        let n = 0;
        for (let dr = 0; dr < 4; dr++) for (let dc = 0; dc < 4; dc++) if (this.board.isFilled((r + dr) * SIZE + c + dc)) n++;
        if (n > best) {
          best = n;
          br = r;
          bc = c;
        }
      }
    }
    const res: ClearResult = { rows: [], cols: [], removed: [], cratesHit: [], cratesBroken: 0, pureLines: 0 };
    for (let dr = 0; dr < 4; dr++) {
      for (let dc = 0; dc < 4; dc++) {
        const part = this.board.blast(br + dr, bc + dc, 0);
        res.removed.push(...part.removed);
        res.cratesHit.push(...part.cratesHit);
        res.cratesBroken += part.cratesBroken;
      }
    }
    this.applyClear(res);
    this.tray = dealTray(this.board, this.rng, { ...this.dealOptions(), difficulty: 0, solvable: 1, help: 1 });
    this.history = [];
    return res;
  }

  addMoves(n: number): void {
    this.movesLeft += n;
  }

  /** Serializes an in-progress classic game so it can be resumed after the app is closed. */
  serialize(): ClassicSave {
    return {
      board: this.board.serialize(),
      tray: this.tray.map((p) => (p ? { s: p.shape.id, f: p.flavor, g: p.gold } : null)),
      score: this.score,
      combo: this.combo.snapshot(),
      rng: this.rng.state,
      stats: { ...this.stats },
      revives: this.revives,
      coins: this.coins,
    };
  }

  static restore(save: ClassicSave): Session {
    const s = new Session('classic', null, 1);
    s.board = Board.deserialize(save.board);
    s.tray = save.tray.map((p) => (p && SHAPE_BY_ID[p.s] ? makePiece(SHAPE_BY_ID[p.s], p.f, p.g) : null));
    if (s.tray.every((p) => p === null)) s.tray = dealTray(s.board, s.rng, s.dealOptions());
    s.score = save.score;
    s.combo.restore(save.combo);
    s.rng.state = save.rng;
    s.stats = { ...s.stats, ...save.stats };
    s.revives = save.revives;
    s.coins = save.coins;
    return s;
  }

  /** End-of-game coin payout for classic mode (gold is paid as you go). */
  classicPayout(): number {
    return Math.floor(this.score / 250);
  }
}
