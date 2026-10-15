import { todayKey } from '../core/levels';
import { duration, num, t } from '../i18n';
import { bazaarAttention } from '../meta/bazaar';
import { freeSpinAvailable, loginClaimable, questsAttention, vipGiftClaimable } from '../meta/daily';
import { DAILY_CHALLENGE_REWARD, isVip } from '../meta/economy';
import { claimableCount } from '../meta/pass';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { ICONS, logoSVG, starIcon, tekirSVG } from './art';
import { h } from './dom';

export interface HomeActions {
  playLevel(): void;
  playClassic(resume: boolean): void;
  playDaily(): void;
  login(): void;
  wheel(): void;
  offer(): void;
  vipGift(): void;
  pass(): void;
}

export function renderHome(a: HomeActions): HTMLElement {
  const d = store.data;
  const dailyDone = d.daily.lastWin === todayKey();
  const hasResume = !!d.classicSave;

  const side = h('div', { class: 'side-btns' });
  const sideBtn = (icon: string, label: string, fn: () => void, badge: boolean, extra?: string) =>
    h('button', { class: `side-btn ${badge ? 'attn' : ''}`, onclick: () => (audio.tap(), fn()) }, h('span', { class: 'side-ico', html: icon }), h('span', { class: 'side-lbl' }, extra ?? label), badge ? h('span', { class: 'dot' }) : null);
  side.append(sideBtn(ICONS.gift, t('login.title'), a.login, loginClaimable() >= 0));
  side.append(sideBtn(ICONS.wheel, t('nav.wheel'), a.wheel, freeSpinAvailable()));
  side.append(sideBtn(ICONS.ticket, t('pass.title'), a.pass, claimableCount() > 0));
  if (d.starterOfferUntil > Date.now() && !d.owned.includes('starter_pack')) {
    side.append(sideBtn(ICONS.shop, t('offer.starter.title'), a.offer, true, duration(d.starterOfferUntil - Date.now())));
  }
  if (vipGiftClaimable()) side.append(sideBtn(ICONS.crown, t('vip.gift'), a.vipGift, true, t('shop.vip')));

  const levelBtn = h(
    'button',
    { class: 'btn btn-play', onclick: () => (audio.tap(), a.playLevel()) },
    h('span', { class: 'play-ico', html: ICONS.play }),
    h('span', { class: 'play-txt' }, h('span', { class: 'play-main' }, t('home.level', { n: d.level })), h('span', { class: 'play-sub' }, t('home.journey'))),
  );
  const classicBtn = h(
    'button',
    { class: 'btn btn-mode', onclick: () => (audio.tap(), a.playClassic(hasResume)) },
    h('span', { class: 'mode-main' }, hasResume ? t('home.resume') : t('home.classic')),
    h('span', { class: 'mode-sub' }, t('home.classic.sub', { n: num(d.best) })),
  );
  const dailyBtn = h(
    'button',
    { class: `btn btn-mode daily ${dailyDone ? 'done' : ''}`, onclick: () => (audio.tap(), !dailyDone && a.playDaily()), disabled: dailyDone },
    h('span', { class: 'mode-main' }, t('home.daily')),
    h('span', { class: 'mode-sub' }, dailyDone ? t('home.daily.done') : t('home.daily.sub', { n: DAILY_CHALLENGE_REWARD })),
    d.daily.streak >= 2 && !dailyDone ? h('span', { class: 'mode-badge' }, `🔥 ${d.daily.streak}`) : null,
  );

  return h(
    'div',
    { class: 'screen home' },
    h('div', { class: 'home-bg' }),
    side,
    h('div', { class: 'home-hero' }, h('div', { class: 'home-logo', html: logoSVG(290) }), h('div', { class: 'home-cat', html: tekirSVG(190, 'idle', true) }), isVip() ? h('div', { class: 'vip-badge', html: `${ICONS.crown}<span>${t('shop.vip')}</span>` }) : null),
    h('div', { class: 'home-stars', html: `${starIcon(22)}<b>${num(d.stars)}</b>` }),
    h('div', { class: 'home-actions' }, levelBtn, h('div', { class: 'mode-row' }, classicBtn, dailyBtn)),
  );
}

export function navAttention(): { shop: boolean; bazaar: boolean; quests: number } {
  const d = store.data;
  return {
    shop: d.starterOfferUntil > Date.now() && !d.owned.includes('starter_pack'),
    bazaar: bazaarAttention(),
    quests: questsAttention(),
  };
}
