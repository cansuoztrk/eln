import * as E from '../core/economy';
import { DISTRICTS, districtDef, tourOf, TOUR } from '../core/districts';
import { bizName, districtNames, t } from '../i18n';
import { game, permanentMultiplier } from '../meta/game';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { BADGE_ICONS, ICONS, tulipIcon } from './art';
import { h } from './dom';
import { money, times } from './format';
import { skylineSVG } from './skyline';

/** Districts tab: the current goal, the move button and the Istanbul tour map. */
export class DistrictsView {
  el: HTMLElement;
  private body: HTMLElement;
  private sig = '';
  private goalFill: HTMLElement | null = null;
  private goalText: HTMLElement | null = null;
  private moveBtn: HTMLButtonElement | null = null;
  private gainText: HTMLElement | null = null;

  constructor(private onMove: () => void) {
    this.body = h('div', { class: 'district-body' });
    this.el = h('div', { class: 'tab tab-districts' }, this.body);
  }

  render(): void {
    const d = store.data;
    const sig = `${d.district}|${game.goalMet()}|${d.lale}|${d.owned.join(',')}`;
    if (sig === this.sig) return this.slowUpdate();
    this.sig = sig;
    const def = districtDef(d.district);
    const names = districtNames(def.id);
    const nextDef = districtDef(d.district + 1);
    const nextNames = districtNames(nextDef.id);
    const tour = tourOf(d.district);

    this.goalFill = h('div', { class: 'goal-fill' });
    this.goalText = h('span', { class: 'goal-text' });
    this.gainText = h('div', { class: 'move-gain' });
    this.moveBtn = h('button', { class: 'btn btn-primary btn-wide move-btn', onclick: () => (audio.tap(), this.onMove()) }, h('span', { html: ICONS.arrow }), h('span', {}, t('districts.move', nextNames))) as HTMLButtonElement;

    const newStand = E.standsIn(d.district + 1) > E.standsIn(d.district) ? E.BUSINESSES[E.standsIn(d.district)].id : null;
    const hero = h(
      'div',
      { class: 'district-hero', style: `--accent:${def.accent}` },
      h('div', { class: 'hero-sky', html: skylineSVG(def, 'skyline mini') }),
      h('div', { class: 'hero-title' }, h('h2', {}, names.d), h('span', { class: 'hero-tour' }, `${t('districts.tour', { n: tour })} · ${'★'.repeat(Math.min(tour, 5))}`)),
      h('p', { class: 'hero-goal-label' }, t('districts.goal', { v: money(game.goal(), 1), in: names.in })),
      h('div', { class: 'goal-bar big' }, this.goalFill, this.goalText),
      h(
        'div',
        { class: 'next-stop' },
        h('div', { class: 'next-sky', html: skylineSVG(nextDef, 'skyline mini') }),
        h('div', { class: 'next-info' }, h('small', {}, t('districts.next')), h('b', {}, nextNames.d), h('ul', { class: 'perks' }, h('li', { html: `${tulipIcon(16)}<span class="lale-gain"></span>` }), h('li', { html: `${BADGE_ICONS.districts}<span>${t('districts.badge')}</span>` }), newStand ? h('li', { html: `${ICONS.star}<span>${t('districts.newStand', { biz: bizName(newStand) })}</span>` }) : '')),
      ),
      this.gainText,
      this.moveBtn,
      h('p', { class: 'fine' }, `${t('districts.keep')} ${t('districts.reset')}`),
    );

    const lalePct = Math.round(E.TUNING.laleBonus * d.lale * 100);
    const badgeMult = E.TUNING.districtMult ** d.district;
    const perm = permanentMultiplier();
    const total = E.globalMultiplier(game.mods(false));
    const breakdown = h(
      'div',
      { class: 'card mult-card' },
      h('div', { class: 'mult-row' }, h('span', { html: tulipIcon(20) }), h('span', {}, t('districts.lale', { n: money(d.lale, 1), p: money(lalePct, 1) }))),
      h('div', { class: 'mult-row' }, h('span', { class: 'mi', html: BADGE_ICONS.districts }), h('span', {}, t('districts.badges', { n: d.district, v: times(badgeMult).slice(1) }))),
      perm > 1 ? h('div', { class: 'mult-row' }, h('span', { class: 'mi', html: BADGE_ICONS.club }), h('span', {}, `${t('shop.permanent')}: ${times(perm)}`)) : '',
      h('div', { class: 'mult-row total' }, h('span', { class: 'mi', html: ICONS.bolt }), h('b', {}, t('districts.total', { v: times(total).slice(1) }))),
    );

    const map = h('div', { class: 'tour-map' });
    DISTRICTS.forEach((x, k) => {
      const idx = (tour - 1) * TOUR + k;
      const state = idx < d.district ? 'done' : idx === d.district ? 'here' : 'next';
      map.append(h('div', { class: `stop stop-${state}`, style: `--accent:${x.accent}` }, h('span', { class: 'stop-dot', html: state === 'done' ? ICONS.check : state === 'here' ? BADGE_ICONS.districts : '' }), h('span', { class: 'stop-name' }, districtNames(x.id).d)));
    });

    this.body.innerHTML = '';
    this.body.append(hero, breakdown, h('h3', { class: 'section-title' }, `${t('districts.title')} · ${t('districts.tour', { n: tour })}`), map);
    this.slowUpdate();
  }

  slowUpdate(): void {
    if (!this.goalFill || !this.goalText || !this.moveBtn || !this.gainText) return;
    const goal = game.goal();
    const earned = game.run.earnedRun;
    const k = Math.min(1, earned / goal);
    this.goalFill.style.transform = `scaleX(${k})`;
    this.goalText.textContent = `${money(earned, 1)} / ${money(goal, 1)}`;
    const met = game.goalMet();
    this.moveBtn.disabled = !met;
    this.moveBtn.classList.toggle('pulse', met);
    const pending = game.pendingLale();
    const el = this.el.querySelector('.lale-gain');
    if (el) el.textContent = t('districts.gain', { n: money(pending, 1) });
    this.gainText.textContent = met ? t('districts.income', { v: times(game.moveGain()).slice(1) }) : t('districts.locked');
  }

  static attention(): boolean {
    return game.goalMet();
  }
}
