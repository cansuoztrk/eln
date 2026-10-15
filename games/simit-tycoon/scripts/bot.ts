/**
 * Pacing bot: plays Simit Tycoon like a sensible human (taps the best idle
 * stand, buys whatever pays back fastest, hires cats, moves district as
 * soon as its goal is met) so we can measure and tune the economy.
 */
import * as E from '../src/core/economy';

export interface BotOptions {
  /** Seconds between taps while actively playing. */
  tapInterval: number;
  /** Product of permanent multipliers (IAP). */
  permanent: number;
  /** Keeps the ×2 ad boost running during play and the first 8 h away. */
  adBoost: boolean;
  /** Doubles offline earnings with a rewarded ad on return. */
  adOffline: boolean;
  /** Offline earnings cap in hours. */
  offlineCapH: number;
  dt: number;
}

export const DEFAULT_BOT: BotOptions = {
  tapInterval: 0.45,
  permanent: 1,
  adBoost: false,
  adOffline: false,
  offlineCapH: 4,
  dt: 0.1,
};

interface Candidate {
  kind: 'buy' | 'manager' | 'upgrade';
  i: number;
  count: number;
  id?: string;
  cost: number;
  gain: number;
}

export class Bot {
  run = E.newRun();
  lale = 0;
  laleEarned = 0;
  lifetime = 0;
  district = 0;
  t = 0;
  activeTime = 0;
  tapTimer = 0;
  purchases = 0;
  events: { t: number; active: number; what: string }[] = [];
  private seen = new Set<string>();

  constructor(public o: BotOptions = DEFAULT_BOT) {}

  mods(temp = 1): E.Modifiers {
    return { lale: this.lale, districts: this.district, permanent: this.o.permanent, temp };
  }

  private mark(what: string): void {
    if (this.seen.has(what)) return;
    this.seen.add(what);
    this.events.push({ t: this.t, active: this.activeTime, what });
  }

  /** Realized income/s: unmanaged stands only run when tapped (≈50%). */
  private realized(i: number, level: number, managed: boolean, mult: number[], g: number): number {
    if (level <= 0) return 0;
    const inc = (E.BUSINESSES[i].revenue * level * mult[i] * g) / E.cycleTime(i, level);
    return managed ? inc : inc * 0.5;
  }

  private totalRealized(mult: number[], g: number): number {
    let s = 0;
    for (let i = 0; i < E.N; i++) s += this.realized(i, this.run.levels[i], this.run.managers[i], mult, g);
    return s;
  }

  /** Best candidate by (payback + wait); also the best one affordable right now. */
  private best(): { best: Candidate | null; affordable: Candidate | null; wait: number } {
    const r = this.run;
    const mult = E.businessMultipliers(r);
    const g = E.globalMultiplier(this.mods());
    const income = Math.max(1e-9, this.totalRealized(mult, g));
    const festNow = E.festivalsReached(r.levels, r.stands);
    let best: Candidate | null = null;
    let bestScore = Infinity;
    let affordable: Candidate | null = null;
    let affScore = Infinity;
    const consider = (c: Candidate) => {
      if (c.gain <= 0 || !Number.isFinite(c.cost)) return;
      const payback = c.cost / c.gain;
      const score = payback + Math.max(0, c.cost - r.cash) / income;
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
      if (c.cost <= r.cash && payback < affScore) {
        affScore = payback;
        affordable = c;
      }
    };
    for (let i = 0; i < r.stands; i++) {
      const lvl = r.levels[i];
      // Only the next locked stand is visible/unlockable.
      if (lvl === 0 && i > 0 && r.levels[i - 1] === 0) continue;
      const cur = this.realized(i, lvl, r.managers[i], mult, g);
      const counts = new Set([1, E.nextMilestone(lvl) - lvl]);
      const nf = E.nextFestival(r.levels, r.stands);
      if (nf && lvl < nf) counts.add(nf - lvl);
      for (const count of counts) {
        if (count <= 0 || count > 400) continue;
        const nl = lvl + count;
        const m2 = mult.slice();
        m2[i] = (mult[i] / 2 ** E.profitMilestones(lvl)) * 2 ** E.profitMilestones(nl);
        let gain = this.realized(i, nl, r.managers[i], m2, g) - cur;
        // Festival reached by this purchase doubles everything.
        const levels2 = r.levels.slice();
        levels2[i] = nl;
        const festGain = E.festivalsReached(levels2, r.stands) - festNow;
        if (festGain > 0) gain += (this.totalRealized(mult, g) - cur + this.realized(i, nl, r.managers[i], m2, g)) * (2 ** festGain - 1);
        consider({ kind: 'buy', i, count, cost: E.costFor(i, lvl, count), gain });
      }
      if (lvl > 0 && !r.managers[i]) {
        consider({ kind: 'manager', i, count: 0, cost: E.BUSINESSES[i].managerCost, gain: cur });
      }
    }
    for (const u of E.nextUpgrades(r, 6)) {
      if (!E.upgradeAvailable(r, u)) continue;
      let base = 0;
      if (u.target < 0) base = this.totalRealized(mult, g);
      else base = this.realized(u.target, r.levels[u.target], r.managers[u.target], mult, g);
      consider({ kind: 'upgrade', i: u.target, count: 0, id: u.id, cost: u.cost, gain: base * (u.mult - 1) });
    }
    const b = best as Candidate | null;
    const wait = b ? Math.max(0, b.cost - r.cash) / income : 0;
    return { best: b, affordable: affordable as Candidate | null, wait };
  }

  private decide(): void {
    for (let guard = 0; guard < 300; guard++) {
      const { best, affordable, wait } = this.best();
      let c = best;
      // Saving up for something big? Still buy cheap things that pay back before then.
      if (c && c.cost > this.run.cash) c = affordable && affordable.cost / affordable.gain < wait ? affordable : null;
      if (!c) return;
      let ok = false;
      if (c.kind === 'buy') ok = E.buy(this.run, c.i, c.count);
      else if (c.kind === 'manager') ok = E.hireManager(this.run, c.i);
      else ok = E.buyUpgrade(this.run, c.id!);
      if (!ok) return;
      this.purchases++;
      if (c.kind === 'buy' && this.run.levels[c.i] === c.count) this.mark(`unlock ${E.BUSINESSES[c.i].id}`);
      if (c.kind === 'manager') this.mark(`manager ${E.BUSINESSES[c.i].id}`);
      if (c.kind === 'upgrade') this.mark(`first recipe`);
      const fest = E.festivalsReached(this.run.levels, this.run.stands);
      if (fest > 0) this.mark(`festival ${E.FESTIVALS[fest - 1]}`);
    }
  }

  /** Plays actively for `seconds`. */
  play(seconds: number): void {
    const dt = this.o.dt;
    const temp = this.o.adBoost ? 2 : 1;
    let decideTimer = 0;
    for (let s = 0; s < seconds; s += dt) {
      // Tap the most valuable idle unmanaged stand.
      this.tapTimer -= dt;
      if (this.tapTimer <= 0) {
        let bi = -1;
        let bv = 0;
        for (let i = 0; i < E.N; i++) {
          if (this.run.levels[i] > 0 && !this.run.managers[i] && !this.run.running[i]) {
            const v = E.BUSINESSES[i].revenue * this.run.levels[i];
            if (v > bv) {
              bv = v;
              bi = i;
            }
          }
        }
        if (bi >= 0) {
          E.tap(this.run, bi);
          this.tapTimer = this.o.tapInterval;
        }
      }
      const res = E.step(this.run, this.mods(temp), dt);
      this.lifetime += res.earned;
      decideTimer -= dt;
      if (decideTimer <= 0) {
        this.decide();
        decideTimer = 0.5;
      }
      this.t += dt;
      this.activeTime += dt;
    }
    this.marks();
  }

  /** Away for `seconds` (managed stands only, capped). */
  away(seconds: number): number {
    const capped = Math.min(seconds, this.o.offlineCapH * 3600);
    const boost = this.o.adBoost ? Math.min(capped, 8 * 3600) : 0;
    let earned = E.offlineEarnings(this.run, this.mods(), capped, boost);
    if (this.o.adOffline) earned *= 2;
    this.run.cash += earned;
    this.run.earnedRun += earned;
    this.lifetime += earned;
    this.t += seconds;
    this.decide();
    return earned;
  }

  pendingLale(): number {
    return E.totalLale(this.lifetime) - this.laleEarned;
  }

  goalMet(): boolean {
    return this.run.earnedRun >= E.districtGoal(this.district);
  }

  /** Moves district as soon as its goal is met. Returns true if moved. */
  maybePrestige(): boolean {
    if (!this.goalMet()) return false;
    this.move();
    return true;
  }

  move(): void {
    const pending = this.pendingLale();
    this.lale += pending;
    this.laleEarned += pending;
    this.district++;
    this.run = E.newRun(this.district);
    this.mark(`district ${this.district}`);
  }

  private marks(): void {
    for (const p of [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e30, 1e40, 1e50]) {
      if (this.lifetime >= p) this.mark(`lifetime ${E.formatBig(p)}`);
    }
  }
}

export function fmtTime(s: number): string {
  if (s < 60) return `${s.toFixed(0)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m${String(Math.floor(s % 60)).padStart(2, '0')}s`;
  if (s < 86400 * 2) return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
  return `${(s / 86400).toFixed(1)}d`;
}
