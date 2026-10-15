import { duration, num, t } from '../i18n';
import type { Grant } from '../meta/catalog';
import { lives, MAX_LIVES, msToNextLife, unlimitedLives } from '../meta/economy';
import { store, type BoosterId } from '../meta/state';
import { audio } from '../services/audio';
import { BOOSTER_ART, coinIcon, heartIcon, ICONS } from './art';
import { h } from './dom';

/** Shared screen chrome: top bar (lives, coins, settings) and reward chips. */
export interface TopBar {
  el: HTMLElement;
  coinEl: HTMLElement;
  update(): void;
}

export function topBar(opts: { onCoins: () => void; onLives: () => void; onSettings: () => void; showLives?: boolean }): TopBar {
  const coinVal = h('span', { class: 'pill-val' }, num(store.data.coins));
  const coinEl = h('button', { class: 'pill pill-coins', onclick: () => (audio.tap(), opts.onCoins()) }, h('span', { class: 'pill-ico', html: coinIcon(26) }), coinVal, h('span', { class: 'pill-plus', html: ICONS.plus }));
  const lifeVal = h('span', { class: 'pill-val' });
  const lifeSub = h('span', { class: 'pill-sub' });
  const lifeEl = h('button', { class: 'pill pill-lives', onclick: () => (audio.tap(), opts.onLives()) }, h('span', { class: 'pill-ico heart', html: heartIcon(26) }), h('span', { class: 'pill-stack' }, lifeVal, lifeSub));
  const gear = h('button', { class: 'icon-btn', 'aria-label': t('settings.title'), html: ICONS.gear, onclick: () => (audio.tap(), opts.onSettings()) });
  const el = h('div', { class: 'topbar' }, opts.showLives === false ? h('span') : lifeEl, coinEl, gear);

  let shownCoins = store.data.coins;
  const update = () => {
    const c = store.data.coins;
    if (c !== shownCoins) {
      coinVal.textContent = num(c);
      coinEl.classList.remove('bump');
      void coinEl.offsetWidth;
      coinEl.classList.add('bump');
      shownCoins = c;
    }
    if (unlimitedLives()) {
      lifeVal.innerHTML = ICONS.infinity;
      lifeSub.textContent = '';
    } else {
      const l = lives();
      lifeVal.textContent = String(l);
      lifeSub.textContent = l >= MAX_LIVES ? t('lives.full') : duration(msToNextLife());
    }
  };
  update();
  return { el, coinEl, update };
}

export function grantChips(g: Grant): HTMLElement {
  const wrap = h('div', { class: 'grant' });
  if (g.coins) wrap.append(h('div', { class: 'chip' }, h('span', { html: coinIcon(28) }), h('b', {}, num(g.coins))));
  if (g.boosters) {
    for (const [k, v] of Object.entries(g.boosters)) {
      if (!v) continue;
      wrap.append(h('div', { class: 'chip' }, h('span', { class: 'chip-boost', html: BOOSTER_ART[k] }), h('b', {}, `×${v}`)));
    }
  }
  if (g.unlimitedLivesHours) wrap.append(h('div', { class: 'chip' }, h('span', { html: heartIcon(28) }), h('b', {}, `∞ ${g.unlimitedLivesHours}h`)));
  if (g.themes) for (const th of g.themes) wrap.append(h('div', { class: 'chip chip-theme' }, h('b', {}, t(`theme.${th}` as never))));
  if (g.removeAds) wrap.append(h('div', { class: 'chip' }, h('b', {}, t('vip.perk1'))));
  return wrap;
}

export function boosterName(id: BoosterId): string {
  return t(`booster.${id}` as never);
}
