/**
 * Idle economy core — pure functions, no DOM. Unit-tested (tests/) and
 * simulated by a bot (scripts/simulate.test.ts) to tune the pacing.
 *
 * Model (the proven "idle capitalist" family, Istanbul edition):
 *  - 10 businesses. Owning n of a business earns n × revenue per cycle.
 *  - The next unit costs cost × growth^n (exponential), so players keep
 *    spreading money across businesses.
 *  - Speed milestones (25, 50 … 400) halve the cycle time and later ones
 *    double profit: the big "aha" moments of every session.
 *  - Neighbourhood festivals: when EVERY business reaches a level, all
 *    profits double. This rewards balanced growth.
 *  - A business runs one cycle per tap until its cat manager is hired;
 *    managed businesses run forever, also while the app is closed.
 *  - Recipes (cash upgrades) multiply one business — or all — by 3.
 *  - Moving to a new district (prestige) resets the run but converts
 *    lifetime earnings into tulips (lale, +2% income each) and earns a
 *    district badge (permanent ×2). Each district has an earnings goal
 *    calibrated by a bot (scripts/calibrate.test.ts); the first five also
 *    open a new stand.
 */
import GOALS from './goals.json';

export interface BusinessDef {
  id: string;
  cost: number;
  growth: number;
  revenue: number;
  /** Base cycle time in seconds. */
  time: number;
  managerCost: number;
}

export const BUSINESSES: readonly BusinessDef[] = [
  { id: 'simit', cost: 4, growth: 1.07, revenue: 1, time: 1, managerCost: 1_000 },
  { id: 'cay', cost: 60, growth: 1.15, revenue: 60, time: 3, managerCost: 15_000 },
  { id: 'pogaca', cost: 720, growth: 1.14, revenue: 540, time: 6, managerCost: 100_000 },
  { id: 'balik', cost: 8_640, growth: 1.13, revenue: 4_320, time: 12, managerCost: 500_000 },
  { id: 'doner', cost: 103_680, growth: 1.12, revenue: 51_840, time: 24, managerCost: 1_200_000 },
  { id: 'kumpir', cost: 1_244_160, growth: 1.11, revenue: 388_800, time: 60, managerCost: 10_000_000 },
  { id: 'midye', cost: 14_929_920, growth: 1.1, revenue: 3_499_200, time: 180, managerCost: 111_111_111 },
  { id: 'dondurma', cost: 179_159_040, growth: 1.09, revenue: 34_992_000, time: 600, managerCost: 555_555_555 },
  { id: 'lokum', cost: 2_149_908_480, growth: 1.08, revenue: 314_928_000, time: 1_800, managerCost: 10_000_000_000 },
  { id: 'kebap', cost: 25_798_901_760, growth: 1.07, revenue: 5_794_920_000, time: 7_200, managerCost: 100_000_000_000 },
];

export const N = BUSINESSES.length;

/**
 * Balance knobs, tuned with the pacing bot (scripts/pacing-report.txt).
 * Mutable only so the simulator can try alternatives; the game never changes them.
 */
export const TUNING = {
  /** Tulips = floor(150 × (lifetime / laleScale) ^ lalePower). */
  laleScale: 1e10,
  lalePower: 0.4,
  /** Income bonus per tulip. */
  laleBonus: 0.02,
  /** Permanent profit multiplier earned for every district completed. */
  districtMult: 2,
  /** Recipe rounds get this much more expensive each round. */
  roundScale: 1e5,
  rounds: 25,
  /** Profit ×2 per festival (all stands at a level). */
  festivalMult: 2,
};

// ───────────── milestones ─────────────

/** Each speed milestone halves the cycle time of that business. */
export const SPEED_MILESTONES = [25, 50, 100, 200, 300, 400] as const;
/** From level 500 on, every 100 levels doubles that business's profit. */
export const PROFIT_FROM = 500;
export const PROFIT_STEP = 100;
/** Neighbourhood festivals: all businesses at these levels → all profits ×2. */
export const FESTIVALS = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;

export function speedMultiplier(level: number): number {
  let n = 0;
  for (const m of SPEED_MILESTONES) if (level >= m) n++;
  return 2 ** n;
}

export function profitMilestones(level: number): number {
  return level < PROFIT_FROM ? 0 : Math.floor((level - PROFIT_FROM) / PROFIT_STEP) + 1;
}

/** Number of milestones (speed + profit) a level has passed. */
export function milestonesReached(level: number): number {
  let n = 0;
  for (const m of SPEED_MILESTONES) if (level >= m) n++;
  return n + profitMilestones(level);
}

export function nextMilestone(level: number): number {
  for (const m of SPEED_MILESTONES) if (level < m) return m;
  if (level < PROFIT_FROM) return PROFIT_FROM;
  return PROFIT_FROM + profitMilestones(level) * PROFIT_STEP;
}

export function prevMilestone(level: number): number {
  let prev = 0;
  for (const m of SPEED_MILESTONES) if (level >= m) prev = m;
  if (level >= PROFIT_FROM) prev = PROFIT_FROM + (profitMilestones(level) - 1) * PROFIT_STEP;
  return prev;
}

export function cycleTime(i: number, level: number): number {
  return BUSINESSES[i].time / speedMultiplier(level);
}

/** Festivals count the stands open in this district (all 10 from Beşiktaş on). */
export function festivalsReached(levels: readonly number[], stands = levels.length): number {
  if (TUNING.festivalMult === 1) return 0;
  let min = Infinity;
  for (let i = 0; i < stands; i++) min = Math.min(min, levels[i]);
  let n = 0;
  for (const f of FESTIVALS) if (min >= f) n++;
  return n;
}

export function nextFestival(levels: readonly number[], stands = levels.length): number | null {
  let min = Infinity;
  for (let i = 0; i < stands; i++) min = Math.min(min, levels[i]);
  for (const f of FESTIVALS) if (min < f) return f;
  return null;
}

// ───────────── recipes (cash upgrades) ─────────────

export interface Upgrade {
  id: string;
  round: number;
  cost: number;
  /** Business index, or -1 for every business. */
  target: number;
  mult: number;
}

/** Round 0 prices (one ×3 per business, then a festival ×3 for everything). */
const ROUND_COSTS = [2.5e5, 5e5, 1e6, 5e6, 1e7, 2.5e7, 5e8, 1e10, 5e10, 2.5e11];
const ALL_COST = 1e12;
export let UPGRADES: readonly Upgrade[] = [];
export let UPGRADE_BY_ID: Readonly<Record<string, Upgrade>> = {};

/** (Re)builds the recipe list from TUNING. */
export function buildUpgrades(): void {
  const list: Upgrade[] = [];
  for (let round = 0; round < TUNING.rounds; round++) {
    const scale = TUNING.roundScale ** round;
    ROUND_COSTS.forEach((c, i) => list.push({ id: `u${round}_${i}`, round, cost: c * scale, target: i, mult: 3 }));
    list.push({ id: `u${round}_all`, round, cost: ALL_COST * scale, target: -1, mult: 3 });
  }
  UPGRADES = list.sort((a, b) => a.cost - b.cost);
  UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
}
buildUpgrades();

// ───────────── run state ─────────────

export interface RunState {
  cash: number;
  levels: number[];
  managers: boolean[];
  upgrades: string[];
  /** Cycle progress 0..1 per business. */
  progress: number[];
  /** Unmanaged businesses only run after a tap. */
  running: boolean[];
  /** Money earned during this district (shown on the move screen). */
  earnedRun: number;
  /** Stands available in this district (new districts open new stands). */
  stands: number;
}

export interface Modifiers {
  /** Tulips owned (+2% income each). */
  lale: number;
  /** Districts completed (each one is a permanent ×2). */
  districts: number;
  /** Product of permanent multipliers (IAP ×2/×3, club membership …). */
  permanent: number;
  /** Product of temporary multipliers (ad boost ×2, ferry rush ×3 …). */
  temp: number;
}

/** Karaköy opens with 6 stands; each of the next 4 districts adds one. */
export const START_STANDS = 6;
export function standsIn(district: number): number {
  return Math.min(N, START_STANDS + district);
}

export function newRun(district = 0): RunState {
  return {
    stands: standsIn(district),
    cash: 0,
    levels: [1, ...Array<number>(N - 1).fill(0)],
    managers: Array<boolean>(N).fill(false),
    upgrades: [],
    progress: Array<number>(N).fill(0),
    running: Array<boolean>(N).fill(false),
    earnedRun: 0,
  };
}

export function globalMultiplier(m: Modifiers): number {
  return (1 + TUNING.laleBonus * m.lale) * TUNING.districtMult ** m.districts * m.permanent * m.temp;
}

/** Per-business profit multipliers (recipes, profit milestones, festivals), excluding global modifiers. */
export function businessMultipliers(state: RunState): number[] {
  const out = Array<number>(N).fill(TUNING.festivalMult ** festivalsReached(state.levels, state.stands));
  for (const id of state.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (!u) continue;
    if (u.target < 0) for (let i = 0; i < N; i++) out[i] *= u.mult;
    else out[u.target] *= u.mult;
  }
  for (let i = 0; i < N; i++) out[i] *= 2 ** profitMilestones(state.levels[i]);
  return out;
}

export function revenuePerCycle(state: RunState, i: number, m: Modifiers, mult = businessMultipliers(state)): number {
  const level = state.levels[i];
  if (level <= 0) return 0;
  return BUSINESSES[i].revenue * level * mult[i] * globalMultiplier(m);
}

/** Income per second of one business (as if it ran continuously). */
export function businessIncome(state: RunState, i: number, m: Modifiers, mult = businessMultipliers(state)): number {
  if (state.levels[i] <= 0) return 0;
  return revenuePerCycle(state, i, m, mult) / cycleTime(i, state.levels[i]);
}

/** Income per second from managed businesses (what accrues while away). */
export function idleIncome(state: RunState, m: Modifiers): number {
  const mult = businessMultipliers(state);
  let sum = 0;
  for (let i = 0; i < N; i++) if (state.managers[i]) sum += businessIncome(state, i, m, mult);
  return sum;
}

/** Income per second if every owned business ran non-stop. */
export function potentialIncome(state: RunState, m: Modifiers): number {
  const mult = businessMultipliers(state);
  let sum = 0;
  for (let i = 0; i < N; i++) sum += businessIncome(state, i, m, mult);
  return sum;
}

// ───────────── buying ─────────────

export function costFor(i: number, level: number, count: number): number {
  const b = BUSINESSES[i];
  if (count <= 0) return 0;
  return (b.cost * b.growth ** level * (b.growth ** count - 1)) / (b.growth - 1);
}

export function maxAffordable(i: number, level: number, cash: number): number {
  const b = BUSINESSES[i];
  const first = b.cost * b.growth ** level;
  if (!(cash >= first)) return 0;
  let n = Math.floor(Math.log((cash * (b.growth - 1)) / first + 1) / Math.log(b.growth));
  // Guard against floating point drift at the boundary.
  while (n > 0 && costFor(i, level, n) > cash) n--;
  return Math.max(0, n);
}

export type BuyMode = 1 | 10 | 100 | 'next' | 'max';

/** How many levels a buy button buys in the given mode (at least 1). */
export function buyCount(state: RunState, i: number, mode: BuyMode): number {
  const level = state.levels[i];
  if (mode === 'max') return Math.max(1, maxAffordable(i, level, state.cash));
  if (mode === 'next') return nextMilestone(level) - level;
  return mode;
}

/** Buys `count` levels. Returns false if not affordable. */
export function buy(state: RunState, i: number, count: number): boolean {
  if (count <= 0 || i >= state.stands) return false;
  const cost = costFor(i, state.levels[i], count);
  if (!(cost <= state.cash)) return false;
  state.cash -= cost;
  state.levels[i] += count;
  return true;
}

export function canHire(state: RunState, i: number): boolean {
  return !state.managers[i] && state.levels[i] > 0 && state.cash >= BUSINESSES[i].managerCost;
}

export function hireManager(state: RunState, i: number): boolean {
  if (!canHire(state, i)) return false;
  state.cash -= BUSINESSES[i].managerCost;
  state.managers[i] = true;
  // A business that was mid-cycle keeps its progress and now loops forever.
  state.running[i] = false;
  return true;
}

export function upgradeAvailable(state: RunState, u: Upgrade): boolean {
  return !state.upgrades.includes(u.id) && (u.target < 0 || state.levels[u.target] > 0);
}

export function buyUpgrade(state: RunState, id: string): boolean {
  const u = UPGRADE_BY_ID[id];
  if (!u || !upgradeAvailable(state, u) || state.cash < u.cost) return false;
  state.cash -= u.cost;
  state.upgrades.push(id);
  return true;
}

/** The cheapest recipes not bought yet (what the recipe tab lists). */
export function nextUpgrades(state: RunState, n = 12): Upgrade[] {
  const out: Upgrade[] = [];
  for (const u of UPGRADES) {
    if (state.upgrades.includes(u.id)) continue;
    out.push(u);
    if (out.length >= n) break;
  }
  return out;
}

// ───────────── time ─────────────

/** Starts one manual cycle (tap). */
export function tap(state: RunState, i: number): boolean {
  if (state.levels[i] <= 0 || state.managers[i] || state.running[i]) return false;
  state.running[i] = true;
  return true;
}

export interface StepResult {
  earned: number;
  /** Business indices that completed at least one cycle this step. */
  completed: number[];
}

/**
 * Advances time by dt seconds. Fast businesses can finish many cycles per
 * frame; those are summed analytically instead of looped.
 */
export function step(state: RunState, m: Modifiers, dt: number): StepResult {
  let earned = 0;
  const completed: number[] = [];
  const mult = businessMultipliers(state);
  for (let i = 0; i < N; i++) {
    if (state.levels[i] <= 0) continue;
    const managed = state.managers[i];
    if (!managed && !state.running[i]) continue;
    const p = state.progress[i] + dt / cycleTime(i, state.levels[i]);
    if (p < 1) {
      state.progress[i] = p;
      continue;
    }
    const cycles = managed ? Math.floor(p) : 1;
    earned += cycles * revenuePerCycle(state, i, m, mult);
    completed.push(i);
    if (managed) state.progress[i] = p - cycles;
    else {
      state.progress[i] = 0;
      state.running[i] = false;
    }
  }
  state.cash += earned;
  state.earnedRun += earned;
  return { earned, completed };
}

/**
 * Offline earnings for `seconds` away: managed businesses only, without
 * temporary multipliers; the part of the absence still covered by an
 * active ×2 boost counts double.
 */
export function offlineEarnings(state: RunState, m: Modifiers, seconds: number, boostSeconds = 0): number {
  if (seconds <= 0) return 0;
  const base = idleIncome(state, { ...m, temp: 1 });
  const boosted = Math.min(seconds, Math.max(0, boostSeconds));
  return base * (seconds + boosted);
}

// ───────────── prestige ─────────────

/** Tulips (lale) earned in total for a lifetime of earnings. */
export function totalLale(lifetimeEarnings: number): number {
  if (!(lifetimeEarnings > 0)) return 0;
  return Math.floor(150 * (lifetimeEarnings / TUNING.laleScale) ** TUNING.lalePower);
}

/**
 * Earnings needed in district `d` (0 = Karaköy) before moving on. Calibrated
 * by scripts/calibrate.test.ts so a casual player (6 min every 2 h) spends
 * a target number of hours per district; extrapolated beyond the table.
 */
export function districtGoal(d: number): number {
  const g = GOALS as number[];
  if (d < g.length) return g[d];
  const last = g[g.length - 1];
  const ratio = last / g[g.length - 2];
  return last * ratio ** (d - g.length + 1);
}

/** Lifetime earnings needed for a given total of tulips (inverse of totalLale). */
export function earningsForLale(lale: number): number {
  return TUNING.laleScale * (lale / 150) ** (1 / TUNING.lalePower);
}

// ───────────── formatting ─────────────

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** Big-number formatting: 999, 1.23K, 45.6M … Dc, then aa, ab … zz. */
export function formatBig(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return `-${formatBig(-n, decimals)}`;
  if (n < 1000) return n < 10 && n % 1 !== 0 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.floor(n));
  let tier = Math.floor(Math.log10(n) / 3);
  let scaled = n / 1000 ** tier;
  // 999.996K must read 1.00M, not 1000.00K.
  if (scaled >= 999.995) {
    tier++;
    scaled /= 1000;
  }
  let suffix: string;
  if (tier < SUFFIXES.length) suffix = SUFFIXES[tier];
  else {
    const k = tier - SUFFIXES.length;
    suffix = String.fromCharCode(97 + (Math.floor(k / 26) % 26)) + String.fromCharCode(97 + (k % 26));
  }
  let digits = scaled >= 100 ? 0 : scaled >= 10 ? Math.min(1, decimals) : decimals;
  // 99.96 must not print as "100.0" (and 9.999 as "10.00").
  if (digits > 0 && Number(scaled.toFixed(digits)) >= (scaled >= 10 ? 100 : 10)) digits--;
  return `${scaled.toFixed(digits)}${suffix}`;
}
