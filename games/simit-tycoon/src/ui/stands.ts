import * as E from '../core/economy';
import { districtDef } from '../core/districts';
import { bizName, districtNames, t } from '../i18n';
import { game } from '../meta/game';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { catSVG, coinIcon, FOOD_TINT, foodSVG, ICONS } from './art';
import { h } from './dom';
import { cycleLabel, money } from './format';

const MODES: E.BuyMode[] = [1, 10, 100, 'next', 'max'];

interface Card {
  i: number;
  el: HTMLElement;
  icon: HTMLElement;
  lvl: HTMLElement;
  fill: HTMLElement;
  rev: HTMLElement;
  time: HTMLElement;
  msFill: HTMLElement;
  msText: HTMLElement;
  buy: HTMLButtonElement;
  buyCount: HTMLElement;
  buyCost: HTMLElement;
  managed: boolean;
}

/** The main tab: every stand with its cycle bar, milestone bar and buy button. */
export class StandsView {
  el: HTMLElement;
  private list: HTMLElement;
  private modeBar: HTMLElement;
  private festText: HTMLElement;
  private festFill: HTMLElement;
  private cards: Card[] = [];
  private lockedEls: HTMLElement[] = [];
  private builtFor = '';
  private lastBurst: number[] = Array(E.N).fill(0);
  private lastAnyBurst = 0;

  constructor(private onBurst: (i: number, x: number, y: number, amount: number) => void) {
    this.modeBar = h('div', { class: 'modes', role: 'tablist' });
    for (const m of MODES) {
      this.modeBar.append(
        h(
          'button',
          {
            class: 'mode',
            'data-mode': String(m),
            onclick: () => {
              audio.tap();
              game.setBuyMode(m);
              this.syncModes();
              this.slowUpdate();
            },
          },
          m === 'next' ? t('buy.next') : m === 'max' ? t('buy.max') : `×${m}`,
        ),
      );
    }
    this.festFill = h('div', { class: 'fest-fill' });
    this.festText = h('span', { class: 'fest-text' });
    const fest = h('div', { class: 'fest' }, h('div', { class: 'fest-bar' }, this.festFill), this.festText);
    this.list = h('div', { class: 'stand-list' });
    this.el = h('div', { class: 'tab tab-stands' }, h('div', { class: 'tab-head' }, this.modeBar, fest), this.list);
    this.rebuild();
  }

  private syncModes(): void {
    for (const b of Array.from(this.modeBar.children) as HTMLElement[]) b.classList.toggle('on', b.dataset.mode === String(store.data.buyMode));
  }

  /** Rebuild cards when the set of open stands or managers changes. */
  rebuild(): void {
    const r = game.run;
    const sig = `${store.data.district}|${r.levels.map((l) => (l > 0 ? 1 : 0)).join('')}|${r.managers.map(Number).join('')}`;
    if (sig === this.builtFor) return;
    this.builtFor = sig;
    this.list.innerHTML = '';
    this.cards = [];
    this.lockedEls = [];
    this.syncModes();
    let shownNext = false;
    for (let i = 0; i < E.N; i++) {
      if (r.levels[i] > 0) {
        this.cards.push(this.card(i));
        this.list.append(this.cards[this.cards.length - 1].el);
      } else if (!shownNext) {
        shownNext = true;
        const el = i < r.stands ? this.unlockCard(i) : this.districtLockedCard(i);
        this.lockedEls.push(el);
        this.list.append(el);
      }
    }
    this.slowUpdate();
  }

  private card(i: number): Card {
    const b = E.BUSINESSES[i];
    const [t1, t2] = FOOD_TINT[b.id];
    const managed = game.run.managers[i];
    const lvl = h('span', { class: 'stand-lvl' });
    const icon = h(
      'button',
      { class: `stand-icon ${managed ? 'managed' : ''}`, style: `--t1:${t1};--t2:${t2}`, 'aria-label': bizName(b.id) },
      h('span', { class: 'stand-food', html: foodSVG(b.id, 58) }),
      lvl,
      managed ? h('span', { class: 'stand-cat', html: catSVG(i, 30, 'happy') }) : h('span', { class: 'stand-tap' }, t('stand.tap')),
    );
    const fill = h('div', { class: 'stand-fill' });
    const rev = h('span', { class: 'stand-rev' });
    const time = h('span', { class: 'stand-time' });
    const msFill = h('div', { class: 'ms-fill' });
    const msText = h('span', { class: 'ms-text' });
    const buyCount = h('span', { class: 'buy-count' });
    const buyCost = h('span', { class: 'buy-cost' });
    const buy = h('button', { class: 'stand-buy' }, buyCount, buyCost) as HTMLButtonElement;
    const el = h(
      'div',
      { class: `stand ${managed ? 'is-managed' : ''}`, 'data-i': String(i) },
      icon,
      h('div', { class: 'stand-mid' }, h('div', { class: 'stand-name' }, bizName(b.id)), h('div', { class: 'stand-bar' }, fill, rev, time), h('div', { class: 'stand-ms' }, h('div', { class: 'ms-bar' }, msFill), msText)),
      buy,
    );
    const tapStand = (e: Event) => {
      e.preventDefault();
      if (game.tap(i)) {
        audio.tap();
        void haptic('light');
        icon.classList.remove('pop');
        void icon.offsetWidth;
        icon.classList.add('pop');
      }
    };
    icon.addEventListener('pointerdown', tapStand);
    el.querySelector('.stand-mid')!.addEventListener('pointerdown', tapStand);
    this.holdToBuy(buy, i);
    return { i, el, icon, lvl, fill, rev, time, msFill, msText, buy, buyCount, buyCost, managed };
  }

  /** Tap to buy once; hold to keep buying. */
  private holdToBuy(btn: HTMLButtonElement, i: number): void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let repeats = 0;
    const once = () => {
      const n = game.buy(i);
      if (n > 0) {
        audio.buy();
        void haptic('select');
        this.slowUpdate();
        return true;
      }
      return false;
    };
    const stop = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const loop = () => {
      repeats++;
      if (!once()) return stop();
      timer = setTimeout(loop, Math.max(45, 110 - repeats * 4));
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      repeats = 0;
      if (!once()) {
        audio.error();
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
        return;
      }
      timer = setTimeout(loop, 380);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
  }

  private unlockCard(i: number): HTMLElement {
    const b = E.BUSINESSES[i];
    const [t1, t2] = FOOD_TINT[b.id];
    const cost = h('span', { class: 'buy-cost' });
    const buy = h(
      'button',
      {
        class: 'stand-buy unlock',
        onclick: () => {
          if (game.buy(i) > 0) {
            audio.unlock2();
            void haptic('success');
            this.rebuild();
          } else audio.error();
        },
      },
      h('span', { class: 'buy-count' }, t('stand.open')),
      cost,
    );
    const el = h(
      'div',
      { class: 'stand locked', 'data-i': String(i) },
      h('div', { class: 'stand-icon dim', style: `--t1:${t1};--t2:${t2}` }, h('span', { class: 'stand-food', html: foodSVG(b.id, 58) })),
      h('div', { class: 'stand-mid' }, h('div', { class: 'stand-name' }, bizName(b.id)), h('div', { class: 'stand-sub' }, `+${money(b.revenue)} / ${cycleLabel(b.time)}`)),
      buy,
    );
    (el as unknown as { update: () => void }).update = () => {
      cost.innerHTML = `${coinIcon(16)}<b>${money(b.cost)}</b>`;
      buy.classList.toggle('ok', game.run.cash >= b.cost);
    };
    return el;
  }

  private districtLockedCard(i: number): HTMLElement {
    const b = E.BUSINESSES[i];
    // Stand i opens in the first district with enough stands.
    const opensAt = i - E.START_STANDS + 1;
    const names = districtNames(districtDef(opensAt).id);
    return h(
      'div',
      { class: 'stand locked district-locked' },
      h('div', { class: 'stand-icon dim' }, h('span', { class: 'stand-food', html: foodSVG(b.id, 58) }), h('span', { class: 'stand-lock', html: ICONS.lock })),
      h('div', { class: 'stand-mid' }, h('div', { class: 'stand-name' }, bizName(b.id)), h('div', { class: 'stand-sub' }, t('stand.opensIn', names))),
    );
  }

  /** Every frame: cycle bars. */
  update(): void {
    const r = game.run;
    for (const c of this.cards) {
      const lvl = r.levels[c.i];
      const ct = E.cycleTime(c.i, lvl);
      const running = c.managed || r.running[c.i];
      const fast = c.managed && ct < 0.25;
      c.fill.style.transform = `scaleX(${fast ? 1 : running ? r.progress[c.i] : 0})`;
      c.el.classList.toggle('fast', fast);
      c.el.classList.toggle('idle', !running);
    }
  }

  /** A few times per second: labels, costs, affordability. */
  slowUpdate(): void {
    const r = game.run;
    const m = game.mods();
    const mult = E.businessMultipliers(r);
    for (const c of this.cards) {
      const i = c.i;
      const lvl = r.levels[i];
      c.lvl.textContent = String(lvl);
      c.rev.textContent = `+${money(E.revenuePerCycle(r, i, m, mult))}`;
      const ct = E.cycleTime(i, lvl);
      const running = c.managed || r.running[i];
      c.time.textContent = ct >= 1.5 && running ? cycleLabel(ct * (1 - r.progress[i])) : ct >= 1.5 ? cycleLabel(ct) : '';
      const prev = E.prevMilestone(lvl);
      const next = E.nextMilestone(lvl);
      c.msFill.style.transform = `scaleX(${(lvl - prev) / (next - prev)})`;
      c.msText.textContent = next <= 400 ? t('stand.speed', { n: next }) : t('stand.profit', { n: next });
      const q = game.buyQuote(i);
      c.buyCount.textContent = `×${q.count}`;
      c.buyCost.innerHTML = `${coinIcon(16)}<b>${money(q.cost)}</b>`;
      c.buy.classList.toggle('ok', q.cost <= r.cash);
    }
    for (const el of this.lockedEls) (el as unknown as { update?: () => void }).update?.();
    // Festival progress
    const nf = E.nextFestival(r.levels, r.stands);
    let min = Infinity;
    for (let i = 0; i < r.stands; i++) min = Math.min(min, r.levels[i]);
    if (nf) {
      const prev = E.FESTIVALS[E.FESTIVALS.indexOf(nf as (typeof E.FESTIVALS)[number]) - 1] ?? 0;
      this.festFill.style.transform = `scaleX(${Math.max(0, (min - prev) / (nf - prev))})`;
      this.festText.textContent = t('festival.next', { n: nf });
    } else {
      this.festFill.style.transform = 'scaleX(1)';
      this.festText.textContent = '';
    }
  }

  /**
   * Visual feedback when a stand completes a cycle. Throttled hard: fast
   * managed stands pay out continuously, so they only sparkle now and then,
   * and the whole screen never shows more than ~3 bursts a second.
   */
  cycle(i: number, amount: number): void {
    const c = this.cards.find((x) => x.i === i);
    if (!c) return;
    const now = performance.now();
    const ct = E.cycleTime(i, game.run.levels[i]);
    const gap = c.managed ? (ct < 1 ? 3200 : Math.max(1200, ct * 1000)) : 0;
    if (now - this.lastBurst[i] < gap || now - this.lastAnyBurst < 320) return;
    this.lastBurst[i] = now;
    this.lastAnyBurst = now;
    c.el.classList.remove('flash');
    void c.el.offsetWidth;
    c.el.classList.add('flash');
    const rect = c.icon.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    this.onBurst(i, rect.left + rect.width / 2, rect.top + rect.height / 3, amount);
  }

  cardRect(i: number): DOMRect | null {
    return this.cards.find((c) => c.i === i)?.el.getBoundingClientRect() ?? null;
  }
}
