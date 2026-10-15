import * as E from '../core/economy';
import { BOOST_HOURS_PER_AD, BOOST_MAX_HOURS, CLUB_PERKS, OFFLINE_CAPS_H, type Grant } from './catalog';
import { store } from './state';

/**
 * Game controller: owns the running economy, applies every multiplier,
 * and turns player actions into state changes + events for the UI, quests
 * and achievements. Pure logic (no DOM), so it is unit-testable.
 */
export type GameEvent =
  | { type: 'cycle'; i: number; amount: number }
  | { type: 'buy'; i: number; count: number; unlocked: boolean }
  | { type: 'milestone'; i: number; level: number; count: number }
  | { type: 'festival'; level: number }
  | { type: 'hire'; i: number }
  | { type: 'recipe'; id: string }
  | { type: 'goal' }
  | { type: 'move'; district: number; lale: number }
  | { type: 'gold'; amount: number }
  | { type: 'boost' }
  | { type: 'rush'; on: boolean }
  | { type: 'seagull'; cash: number; gold: number }
  | { type: 'warp'; cash: number }
  | { type: 'tap'; i: number };

type Listener = (e: GameEvent) => void;

export const RUSH_SECONDS = 30;
export const RUSH_MULT = 3;
/** Seagull reward: this many seconds of potential income. */
export const SEAGULL_SECONDS = 60;
export const GOLDEN_SEAGULL_GOLD = 5;

export function isClub(now = Date.now()): boolean {
  return store.data.vipUntil > now;
}

/** Rewarded ads are skipped (reward granted instantly) for these players. */
export function adFree(): boolean {
  return store.data.owned.includes('no_ads') || isClub();
}

export function offlineCapHours(): number {
  const base = OFFLINE_CAPS_H[Math.min(store.data.offlineLevel, OFFLINE_CAPS_H.length - 1)];
  return isClub() ? Math.max(base, CLUB_PERKS.offlineCapH) : base;
}

export function permanentMultiplier(): number {
  let m = 1;
  const owned = store.data.owned;
  if (owned.includes('mult_x2')) m *= 2;
  if (owned.includes('mult_x3')) m *= 3;
  if (isClub()) m *= CLUB_PERKS.incomeMult;
  return m;
}

export interface OfflineReport {
  /** Real seconds away. */
  away: number;
  /** Seconds that earned (capped). */
  counted: number;
  capped: boolean;
  earnings: number;
}

export class Game {
  rushUntil = 0;
  private listeners = new Set<Listener>();
  private goalSeen = false;

  get run(): E.RunState {
    return store.data.run;
  }

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(e: GameEvent): void {
    for (const fn of this.listeners) fn(e);
  }

  // ───────────── multipliers ─────────────

  boostActive(now = Date.now()): boolean {
    return store.data.boostUntil > now;
  }

  rushActive(now = Date.now()): boolean {
    return this.rushUntil > now;
  }

  tempMultiplier(now = Date.now()): number {
    return (this.boostActive(now) ? 2 : 1) * (this.rushActive(now) ? RUSH_MULT : 1);
  }

  mods(withTemp = true, now = Date.now()): E.Modifiers {
    const d = store.data;
    return { lale: d.lale, districts: d.district, permanent: permanentMultiplier(), temp: withTemp ? this.tempMultiplier(now) : 1 };
  }

  /** Income/s shown in the HUD: managed stands plus manual stands that are running. */
  income(): number {
    const r = this.run;
    const m = this.mods();
    const mult = E.businessMultipliers(r);
    let sum = 0;
    for (let i = 0; i < E.N; i++) if (r.managers[i] || r.running[i]) sum += E.businessIncome(r, i, m, mult);
    return sum;
  }

  idleIncome(): number {
    return E.idleIncome(this.run, this.mods(false));
  }

  // ───────────── time ─────────────

  tick(dt: number, now = Date.now()): E.StepResult {
    const m = this.mods(true, now);
    const res = E.step(this.run, m, dt);
    const d = store.data;
    d.lastSeen = now;
    d.stats.playSeconds += dt;
    if (res.earned > 0) {
      d.lifetime += res.earned;
      if (res.completed.length && this.listeners.size) {
        const mult = E.businessMultipliers(this.run);
        for (const i of res.completed) this.emit({ type: 'cycle', i, amount: E.revenuePerCycle(this.run, i, m, mult) });
      }
      store.touch();
    }
    this.checkGoal();
    if (this.rushUntil && now >= this.rushUntil) {
      this.rushUntil = 0;
      this.emit({ type: 'rush', on: false });
    }
    return res;
  }

  private checkGoal(): void {
    if (!this.goalSeen && this.goalMet()) {
      this.goalSeen = true;
      this.emit({ type: 'goal' });
    }
  }

  goal(): number {
    return E.districtGoal(store.data.district);
  }

  goalMet(): boolean {
    return this.run.earnedRun >= this.goal();
  }

  // ───────────── actions ─────────────

  tap(i: number): boolean {
    if (!E.tap(this.run, i)) return false;
    store.data.stats.taps++;
    this.emit({ type: 'tap', i });
    return true;
  }

  /** Cost and count of the buy button for stand i in the current buy mode. */
  buyQuote(i: number): { count: number; cost: number } {
    const r = this.run;
    const count = r.levels[i] === 0 ? 1 : E.buyCount(r, i, store.data.buyMode);
    return { count, cost: E.costFor(i, r.levels[i], count) };
  }

  buy(i: number): number {
    const r = this.run;
    const { count } = this.buyQuote(i);
    const before = r.levels[i];
    const festBefore = E.festivalsReached(r.levels, r.stands);
    if (!E.buy(r, i, count)) return 0;
    const after = r.levels[i];
    const d = store.data;
    d.stats.buys += count;
    if (after > d.achievements.best[i]) d.achievements.best[i] = after;
    this.emit({ type: 'buy', i, count, unlocked: before === 0 });
    const crossed = E.milestonesReached(after) - E.milestonesReached(before);
    if (crossed > 0) this.emit({ type: 'milestone', i, level: E.prevMilestone(after), count: crossed });
    const festAfter = E.festivalsReached(r.levels, r.stands);
    if (festAfter > festBefore) {
      if (festAfter > d.achievements.festivals) d.achievements.festivals = festAfter;
      this.emit({ type: 'festival', level: E.FESTIVALS[festAfter - 1] });
    }
    store.update(() => {});
    return count;
  }

  hire(i: number): boolean {
    if (!E.hireManager(this.run, i)) return false;
    store.update((d) => {
      d.stats.hires++;
    });
    this.emit({ type: 'hire', i });
    return true;
  }

  buyRecipe(id: string): boolean {
    if (!E.buyUpgrade(this.run, id)) return false;
    store.update((d) => {
      d.stats.recipes++;
    });
    this.emit({ type: 'recipe', id });
    return true;
  }

  /** Buys every affordable recipe, cheapest first. Returns how many. */
  buyAllRecipes(): number {
    let n = 0;
    for (const u of E.nextUpgrades(this.run, 400)) {
      if (u.cost > this.run.cash) break;
      if (E.upgradeAvailable(this.run, u) && this.buyRecipe(u.id)) n++;
    }
    return n;
  }

  setBuyMode(mode: E.BuyMode): void {
    store.update((d) => {
      d.buyMode = mode;
    });
  }

  // ───────────── districts ─────────────

  pendingLale(): number {
    const d = store.data;
    return Math.max(0, E.totalLale(d.lifetime) - d.laleEarned);
  }

  /** Income multiplier after moving now (vs. now). */
  moveGain(): number {
    const d = store.data;
    const before = E.globalMultiplier(this.mods(false));
    const after = E.globalMultiplier({ ...this.mods(false), lale: d.lale + this.pendingLale(), districts: d.district + 1 });
    return after / before;
  }

  move(): { district: number; lale: number } | null {
    if (!this.goalMet()) return null;
    const lale = this.pendingLale();
    store.update((d) => {
      d.lale += lale;
      d.laleEarned += lale;
      d.district++;
      d.run = E.newRun(d.district);
    });
    this.goalSeen = false;
    this.rushUntil = 0;
    const res = { district: store.data.district, lale };
    this.emit({ type: 'move', ...res });
    return res;
  }

  // ───────────── boosts & bonuses ─────────────

  /** Adds ×2 boost hours. Ad boosts stop at BOOST_MAX_HOURS ahead; purchased ones do not. */
  addBoost(hours = BOOST_HOURS_PER_AD, capped = true, now = Date.now()): void {
    store.update((d) => {
      const base = Math.max(now, d.boostUntil);
      let until = base + hours * 3_600_000;
      if (capped) until = Math.min(until, Math.max(d.boostUntil, now + BOOST_MAX_HOURS * 3_600_000));
      d.boostUntil = until;
      d.stats.boosts++;
    });
    this.emit({ type: 'boost' });
  }

  /** True when another ad boost would add time. */
  canAddBoost(now = Date.now()): boolean {
    return store.data.boostUntil < now + (BOOST_MAX_HOURS - 0.05) * 3_600_000;
  }

  startRush(now = Date.now()): void {
    this.rushUntil = now + RUSH_SECONDS * 1000;
    store.update((d) => {
      d.stats.ferries++;
    });
    this.emit({ type: 'rush', on: true });
  }

  seagull(golden: boolean): { cash: number; gold: number } {
    const cash = golden ? 0 : Math.max(25, E.potentialIncome(this.run, this.mods()) * SEAGULL_SECONDS);
    const gold = golden ? GOLDEN_SEAGULL_GOLD : 0;
    this.addCash(cash);
    store.update((d) => {
      d.gold += gold;
      d.stats.seagulls++;
    });
    this.emit({ type: 'seagull', cash, gold });
    return { cash, gold };
  }

  /** Cash for `hours` of idle income (managed stands, permanent multipliers). */
  warpValue(hours: number): number {
    return this.idleIncome() * hours * 3600;
  }

  timeWarp(hours: number): number {
    const cash = this.warpValue(hours);
    this.addCash(cash);
    store.update((d) => {
      d.stats.warps++;
    });
    this.emit({ type: 'warp', cash });
    return cash;
  }

  spendGold(amount: number): boolean {
    if (store.data.gold < amount) return false;
    store.update((d) => {
      d.gold -= amount;
    });
    return true;
  }

  addGold(amount: number): void {
    if (amount <= 0) return;
    store.update((d) => {
      d.gold += amount;
    });
    this.emit({ type: 'gold', amount });
  }

  addCash(cash: number): void {
    if (!(cash > 0)) return;
    const r = this.run;
    r.cash += cash;
    r.earnedRun += cash;
    store.data.lifetime += cash;
    store.touch();
    this.checkGoal();
  }

  applyGrant(g: Grant): void {
    if (g.gold) this.addGold(g.gold);
    if (g.boostHours) this.addBoost(g.boostHours, false);
    if (g.warpHours) this.timeWarp(g.warpHours);
  }

  // ───────────── offline ─────────────

  /** What the player earned while away (not yet credited). */
  offlineReport(now = Date.now()): OfflineReport {
    const d = store.data;
    const away = Math.max(0, (now - d.lastSeen) / 1000);
    const cap = offlineCapHours() * 3600;
    const counted = Math.min(away, cap);
    const boostSeconds = Math.max(0, (Math.min(d.boostUntil, now) - d.lastSeen) / 1000);
    const earnings = E.offlineEarnings(this.run, this.mods(false), counted, Math.min(boostSeconds, counted));
    return { away, counted, capped: away > cap, earnings };
  }

  /** Credits offline earnings × mult and resets the clock. */
  claimOffline(report: OfflineReport, mult = 1, now = Date.now()): number {
    const cash = report.earnings * mult;
    store.data.lastSeen = now;
    this.addCash(cash);
    store.update(() => {});
    return cash;
  }

  /** Short gaps (< 1 min) are simply simulated, no welcome-back screen. */
  catchUp(now = Date.now()): void {
    const gap = Math.max(0, (now - store.data.lastSeen) / 1000);
    if (gap > 0) this.tick(Math.min(gap, 60), now);
  }
}

export const game = new Game();
