import * as E from '../core/economy';
import { t, type Key } from '../i18n';
import { game } from '../meta/game';
import { store } from '../meta/state';
import { track } from '../services/platform';
import { tekirSVG } from './art';
import { h } from './dom';
import { anyModal } from './modal';

/**
 * First-time user experience: Tekir explains one thing at a time, exactly
 * when it becomes relevant, and a paw points at the button to press.
 * Never blocks input; each step completes by doing the thing.
 */
interface Step {
  key: Key;
  /** Show the bubble only once this is true. */
  when: () => boolean;
  /** Step completes (advances) when this is true. */
  done: () => boolean;
  target: () => string | null;
}

const r = () => game.run;

const STEPS: Step[] = [
  { key: 'tut.0', when: () => true, done: () => store.data.stats.taps > 0, target: () => '.stand[data-i="0"] .stand-icon' },
  { key: 'tut.1', when: () => r().cash >= E.costFor(0, r().levels[0], 1), done: () => r().levels[0] >= 3, target: () => '.stand[data-i="0"] .stand-buy' },
  { key: 'tut.2', when: () => r().cash >= E.BUSINESSES[1].cost, done: () => r().levels[1] > 0, target: () => '.stand[data-i="1"] .stand-buy' },
  { key: 'tut.3', when: () => r().cash >= E.BUSINESSES[0].managerCost, done: () => r().managers[0], target: () => (document.querySelector('.tab-cats.active') ? '.cat-card .btn-buy' : '.nav-btn[data-tab="cats"]') },
  { key: 'tut.4', when: () => r().cash >= E.UPGRADES[0].cost * 0.8, done: () => r().upgrades.length > 0 || store.data.tutorial.tips.includes('recipes-seen'), target: () => '.nav-btn[data-tab="recipes"]' },
  { key: 'tut.5', when: () => r().managers.filter(Boolean).length >= 2, done: () => store.data.stats.boosts > 0 || store.data.tutorial.tips.includes('boost-seen'), target: () => '.boost-btn' },
  { key: 'tut.6', when: () => game.goalMet(), done: () => store.data.district > 0, target: () => (document.querySelector('.tab-districts.active') ? '.move-btn' : '.nav-btn[data-tab="districts"]') },
];

export class Tutorial {
  private bubble: HTMLElement;
  private text: HTMLElement;
  private paw: HTMLElement;
  private shownKey: Key | null = null;
  private tipUntil = 0;

  constructor(root: HTMLElement) {
    this.text = h('p', { class: 'tut-text' });
    this.bubble = h('div', { class: 'tut-bubble', hidden: true }, h('div', { class: 'tut-cat', html: tekirSVG(70, 'happy') }), this.text);
    this.paw = h('div', { class: 'tut-paw', hidden: true, html: `<svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true"><ellipse cx="20" cy="26" rx="9" ry="8" fill="#9c8f84" stroke="#5c514a" stroke-width="1.6"/><circle cx="10" cy="15" r="4" fill="#9c8f84" stroke="#5c514a" stroke-width="1.4"/><circle cx="17" cy="10" r="4" fill="#9c8f84" stroke="#5c514a" stroke-width="1.4"/><circle cx="25" cy="10" r="4" fill="#9c8f84" stroke="#5c514a" stroke-width="1.4"/><circle cx="31" cy="16" r="4" fill="#9c8f84" stroke="#5c514a" stroke-width="1.4"/><ellipse cx="20" cy="27" rx="5" ry="4" fill="#ffb7c5"/></svg>` });
    root.append(this.bubble, this.paw);
  }

  get active(): boolean {
    return !store.data.tutorial.done;
  }

  /** Mark a soft step as seen (e.g. the recipes tab was opened). */
  seen(tip: string): void {
    if (!store.data.tutorial.tips.includes(tip)) store.update((d) => d.tutorial.tips.push(tip));
  }

  /** One-off tips (seagull, ferry): shown for a few seconds the first time. */
  tip(id: 'gull' | 'ferry'): void {
    if (store.data.tutorial.tips.includes(id)) return;
    this.seen(id);
    this.tipUntil = Date.now() + 5000;
    this.show(id === 'gull' ? 'tut.gull' : 'tut.ferry');
  }

  private show(key: Key): void {
    if (this.shownKey !== key) {
      this.shownKey = key;
      this.text.textContent = t(key);
      this.bubble.hidden = false;
      this.bubble.classList.remove('in');
      void this.bubble.offsetWidth;
      this.bubble.classList.add('in');
    }
  }

  private hide(): void {
    this.shownKey = null;
    this.bubble.hidden = true;
    this.paw.hidden = true;
  }

  update(): void {
    if (Date.now() < this.tipUntil) {
      this.paw.hidden = true;
      return;
    }
    const d = store.data;
    if (d.tutorial.done || anyModal()) return this.hide();
    let step = STEPS[d.tutorial.step];
    while (step && step.done()) {
      track('tutorial_step', { step: d.tutorial.step });
      store.update((s) => s.tutorial.step++);
      step = STEPS[d.tutorial.step];
    }
    if (!step) {
      store.update((s) => (s.tutorial.done = true));
      track('tutorial_done');
      return this.hide();
    }
    if (!step.when()) return this.hide();
    this.show(step.key);
    const sel = step.target();
    const target = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
    if (!target || target.offsetParent === null) {
      this.paw.hidden = true;
      return;
    }
    const rect = target.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      this.paw.hidden = true;
      return;
    }
    this.paw.hidden = false;
    this.paw.style.transform = `translate(${rect.left + rect.width / 2 - 8}px, ${rect.top + rect.height / 2 - 4}px)`;
    // Keep the bubble out of the way of the target.
    this.bubble.classList.toggle('top', rect.top > window.innerHeight * 0.55);
  }
}
