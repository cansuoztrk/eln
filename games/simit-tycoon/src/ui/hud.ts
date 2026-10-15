import { districtDef, tourOf } from '../core/districts';
import { duration, districtNames, t } from '../i18n';
import { achievementsClaimable } from '../meta/achievements';
import { clubGiftClaimable, loginClaimable, questsClaimable } from '../meta/daily';
import { game, RUSH_SECONDS } from '../meta/game';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { BADGE_ICONS, coinIcon, ferrySVG, goldIcon, ICONS, seagullSVG, tulipIcon } from './art';
import { h } from './dom';
import { money, perSec } from './format';
import { floatText, fx } from './fx';
import { skylineSVG } from './skyline';

export interface HudActions {
  onGold: () => void;
  onSettings: () => void;
  onDaily: () => void;
  onQuests: () => void;
  onAchievements: () => void;
  onBoost: () => void;
  onDistrict: () => void;
}

/** Top HUD (cash, income, gold) over the district skyline banner. */
export class Hud {
  el: HTMLElement;
  private cashVal: HTMLElement;
  private incomeVal: HTMLElement;
  private goldVal: HTMLElement;
  private goldPill: HTMLElement;
  private banner: HTMLElement;
  private sky: HTMLElement;
  private districtChip: HTMLElement;
  private laleVal: HTMLElement;
  private goalFill: HTMLElement;
  private goalText: HTMLElement;
  private goalBar: HTMLElement;
  private boostBtn: HTMLElement;
  private boostTime: HTMLElement;
  private rushChip: HTMLElement;
  private badges: Record<'daily' | 'quests' | 'ach', HTMLElement>;
  private eventsLayer: HTMLElement;
  private shownDistrict = -1;
  private shownGold = -1;
  private lastCashText = '';
  private ferryEl: HTMLElement | null = null;

  constructor(a: HudActions) {
    this.cashVal = h('span', { class: 'cash-val' }, '0');
    this.incomeVal = h('span', { class: 'cash-income' });
    this.goldVal = h('span', { class: 'pill-val' }, '0');
    this.goldPill = h(
      'button',
      { class: 'pill pill-gold', 'aria-label': t('shop.gold'), onclick: () => (audio.tap(), a.onGold()) },
      h('span', { class: 'pill-ico', html: goldIcon(24) }),
      this.goldVal,
      h('span', { class: 'pill-plus', html: ICONS.plus }),
    );
    const top = h(
      'div',
      { class: 'hud-top' },
      h('div', { class: 'cash' }, h('span', { class: 'cash-ico', html: coinIcon(30) }), h('div', { class: 'cash-stack' }, this.cashVal, this.incomeVal)),
      h('div', { class: 'hud-right' }, this.goldPill, h('button', { class: 'icon-btn', 'aria-label': t('settings.title'), html: ICONS.gear, onclick: () => (audio.tap(), a.onSettings()) })),
    );

    this.sky = h('div', { class: 'sky' });
    this.districtChip = h('button', { class: 'chip chip-district', onclick: () => (audio.tap(), a.onDistrict()) });
    this.laleVal = h('b', {}, '0');
    const laleChip = h('button', { class: 'chip chip-lale', onclick: () => (audio.tap(), a.onDistrict()) }, h('span', { html: tulipIcon(18) }), this.laleVal);
    this.goalFill = h('div', { class: 'goal-fill' });
    this.goalText = h('span', { class: 'goal-text' });
    this.goalBar = h('button', { class: 'goal-bar', onclick: () => (audio.tap(), a.onDistrict()) }, this.goalFill, this.goalText);

    const side = (key: 'daily' | 'quests' | 'ach', icon: string, label: string, fn: () => void) => {
      const badge = h('span', { class: 'side-badge' });
      return { badge, el: h('button', { class: `side-btn side-${key}`, 'aria-label': label, onclick: () => (audio.tap(), fn()) }, h('span', { class: 'side-ico', html: icon }), badge) };
    };
    const daily = side('daily', BADGE_ICONS.gift, t('login.title'), a.onDaily);
    const quests = side('quests', BADGE_ICONS.quests, t('quests.title'), a.onQuests);
    const ach = side('ach', BADGE_ICONS.trophy, t('ach.title'), a.onAchievements);
    this.badges = { daily: daily.badge, quests: quests.badge, ach: ach.badge };

    this.boostTime = h('span', { class: 'boost-time' });
    this.boostBtn = h('button', { class: 'boost-btn', 'aria-label': t('boost.title'), onclick: () => (audio.tap(), a.onBoost()) }, h('span', { class: 'boost-ico', html: BADGE_ICONS.boost }), h('span', { class: 'boost-x' }, '×2'), this.boostTime);
    this.rushChip = h('div', { class: 'rush-chip', hidden: true });
    this.eventsLayer = h('div', { class: 'sky-events' });

    this.banner = h(
      'div',
      { class: 'banner' },
      this.sky,
      this.eventsLayer,
      h('div', { class: 'banner-chips' }, this.districtChip, laleChip),
      h('div', { class: 'side-col' }, daily.el, quests.el, ach.el),
      h('div', { class: 'boost-col' }, this.boostBtn, this.rushChip),
      this.goalBar,
    );
    this.el = h('header', { class: 'hud' }, top, this.banner);
    this.refreshDistrict();
    this.slowUpdate();
  }

  /** Where flying coins should land. */
  cashTarget(): { x: number; y: number } {
    const r = this.cashVal.getBoundingClientRect();
    return { x: r.left + 14, y: r.top + r.height / 2 };
  }

  goldTarget(): { x: number; y: number } {
    const r = this.goldPill.getBoundingClientRect();
    return { x: r.left + 16, y: r.top + r.height / 2 };
  }

  refreshDistrict(): void {
    const d = store.data.district;
    if (d === this.shownDistrict) return;
    this.shownDistrict = d;
    const def = districtDef(d);
    this.sky.innerHTML = skylineSVG(def);
    this.banner.dataset.district = def.id;
    this.banner.style.setProperty('--accent', def.accent);
    const tour = tourOf(d);
    this.districtChip.innerHTML = '';
    this.districtChip.append(h('span', { class: 'chip-pin', html: BADGE_ICONS.districts }), h('b', {}, districtNames(def.id).d), tour > 1 ? h('span', { class: 'chip-stars' }, `★${tour}`) : '');
  }

  /** Every frame: the cash counter. */
  update(): void {
    const text = money(game.run.cash);
    if (text !== this.lastCashText) {
      this.cashVal.textContent = text;
      this.lastCashText = text;
    }
  }

  /** A few times per second: income, goal, timers, badges. */
  slowUpdate(): void {
    const d = store.data;
    const now = Date.now();
    this.incomeVal.textContent = perSec(game.income());
    if (d.gold !== this.shownGold) {
      if (this.shownGold >= 0) {
        this.goldPill.classList.remove('bump');
        void this.goldPill.offsetWidth;
        this.goldPill.classList.add('bump');
      }
      this.goldVal.textContent = String(d.gold);
      this.shownGold = d.gold;
    }
    this.laleVal.textContent = money(d.lale, 1);
    const goal = game.goal();
    const k = Math.min(1, game.run.earnedRun / goal);
    this.goalFill.style.transform = `scaleX(${k})`;
    const done = k >= 1;
    this.goalBar.classList.toggle('done', done);
    this.goalText.textContent = done ? t('hud.goalDone') : t('hud.goal', { a: money(game.run.earnedRun, 1), b: money(goal, 1) });
    // Boost
    const left = d.boostUntil - now;
    this.boostBtn.classList.toggle('active', left > 0);
    this.boostTime.textContent = left > 0 ? duration(left) : '';
    // Rush
    const rushLeft = game.rushUntil - now;
    this.rushChip.hidden = rushLeft <= 0;
    this.banner.classList.toggle('rush', rushLeft > 0);
    if (rushLeft > 0) this.rushChip.textContent = `${t('hud.rush')} · ${Math.ceil(rushLeft / 1000)}`;
    // Badges
    const set = (el: HTMLElement, n: number) => {
      el.textContent = n > 0 ? String(n) : '';
      el.classList.toggle('on', n > 0);
    };
    set(this.badges.daily, (loginClaimable() >= 0 ? 1 : 0) + (clubGiftClaimable() ? 1 : 0));
    set(this.badges.quests, questsClaimable());
    set(this.badges.ach, achievementsClaimable());
  }

  pulseBoost(on: boolean): void {
    this.boostBtn.classList.toggle('pulse', on);
  }

  // ───────────── sky events ─────────────

  /** A seagull carrying a simit flies across; tap it for a reward. */
  spawnSeagull(onCatch: (golden: boolean, x: number, y: number) => void): void {
    const golden = Math.random() < 0.12;
    const fromLeft = Math.random() < 0.5;
    const y = 60 + Math.random() * 52;
    const el = h('button', { class: `gull-fly ${fromLeft ? 'ltr' : 'rtl'} ${golden ? 'golden' : ''}`, style: `top:${y}px`, 'aria-label': 'seagull', html: seagullSVG(54, golden) });
    let caught = false;
    el.addEventListener('pointerdown', (e) => {
      if (caught) return;
      caught = true;
      e.stopPropagation();
      const r = el.getBoundingClientRect();
      el.classList.add('caught');
      audio.catchGull();
      void haptic('success');
      onCatch(golden, r.left + r.width / 2, r.top + r.height / 2);
      setTimeout(() => el.remove(), 400);
    });
    el.addEventListener('animationend', () => el.remove());
    this.eventsLayer.append(el);
    audio.seagull();
  }

  /** The ferry docks; tapping it starts rush hour. Returns false if one is already here. */
  spawnFerry(onTap: () => void): boolean {
    if (this.ferryEl) return false;
    const cta = h('span', { class: 'ferry-cta' }, h('b', {}, t('ferry.arrived')), h('small', {}, t('ferry.tap')));
    const el = h('button', { class: 'ferry-dock', 'aria-label': t('ferry.arrived'), html: ferrySVG(130) }, cta);
    this.ferryEl = el;
    let used = false;
    const leave = () => {
      el.classList.add('leaving');
      setTimeout(() => {
        el.remove();
        if (this.ferryEl === el) this.ferryEl = null;
      }, 1600);
    };
    el.addEventListener('click', () => {
      if (used) return;
      used = true;
      el.classList.add('used');
      onTap();
      setTimeout(leave, RUSH_SECONDS * 1000);
    });
    this.eventsLayer.append(el);
    audio.ferryHorn();
    setTimeout(() => {
      if (!used) leave();
    }, 22_000);
    return true;
  }

  ferryHere(): boolean {
    return !!this.ferryEl;
  }

  /** Coins burst from a point into the cash counter. */
  coinBurst(x: number, y: number, amount: string, n = 5): void {
    const tgt = this.cashTarget();
    fx.coins(x, y, tgt.x, tgt.y, n);
    floatText(amount, x, y - 10, 'cash');
  }
}
