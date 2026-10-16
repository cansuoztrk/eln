import { DISTRICTS, VARIETY_BY_ID } from '../core/garden';
import { currentLang, t, type Key } from '../i18n';
import { subjectName, type FinishResult } from '../meta/actions';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { maybeAskReview } from '../services/review';
import { ICONS, tekirSVG, tulipSVG } from './art';
import { h } from './dom';
import { modal } from './modal';

export interface CelebrateActions {
  breakMinutes: number | null;
  onBreak(): void;
  onNext(): void;
  onGarden(): void;
}

/** The moment a session ends: the new tulip, what was earned, what comes next. */
export function celebrate(res: FinishResult, actions: CelebrateActions): void {
  const lang = currentLang();
  const v = res.variety;
  const s = res.session;
  const first = v ? store.data.collected[v.id] === 1 : false;
  if (res.wilted) audio.wilt();
  else if (v && (v.rarity === 'rare' || v.rarity === 'epic')) audio.rare();
  else audio.plant();
  haptic(res.wilted ? 'warning' : 'success');

  const garden = DISTRICTS.find((x) => x.id === (s?.garden ?? store.data.garden));
  const notes: HTMLElement[] = [];
  if (res.goalReached) notes.push(h('div', { class: 'note good', html: `${ICONS.target}<span>${t('done.goal')}</span>` }));
  if (res.bulbEarned) notes.push(h('div', { class: 'note gold', html: `${ICONS.bulb}<span>${t('done.bulb')}</span>` }));
  for (const id of res.unlocked) {
    const d = DISTRICTS.find((x) => x.id === id);
    if (d) notes.push(h('div', { class: 'note teal', html: `${ICONS.garden}<span>${t('done.unlocked', { name: d.name[lang] })}</span>` }));
  }

  let hero: HTMLElement;
  if (res.wilted) {
    hero = h('div', { class: 'celebrate-hero' }, h('div', { html: tulipSVG(VARIETY_BY_ID.get('kirmizi')!, { size: 120, wilted: true }) }), h('h2', {}, t('done.wilted')), h('p', { class: 'modal-text center' }, t('done.wiltedBody')));
  } else if (v) {
    hero = h(
      'div',
      { class: 'celebrate-hero' },
      h('div', { class: 'rays' }),
      h('div', { class: 'celebrate-tulip', html: tulipSVG(v, { size: 130, seed: 2 }) }),
      first ? h('span', { class: 'badge new' }, t('done.new')) : null,
      h('h2', {}, v.name[lang]),
      h('span', { class: `rarity r-${v.rarity}` }, t(`rarity.${v.rarity[0].toUpperCase()}${v.rarity.slice(1)}` as Key)),
      h('p', { class: 'muted center small' }, t('done.planted', { name: v.name[lang], garden: garden?.name[lang] ?? '' })),
    );
  } else {
    hero = h('div', { class: 'celebrate-hero' }, h('div', { html: tekirSVG(120, 'happy', 'can') }), h('h2', {}, t('done.short')), h('p', { class: 'modal-text center' }, t('done.noTulip')));
  }
  const sub = s ? h('div', { class: 'celebrate-sub' }, t('done.sub', { subject: subjectName(s.subject, lang), m: Math.round(s.sec / 60) })) : null;

  const m = modal(
    h(
      'div',
      { class: 'modal-body celebrate' },
      hero,
      sub,
      ...notes,
      h(
        'div',
        { class: 'modal-actions col' },
        actions.breakMinutes && !res.wilted
          ? h('button', { class: 'btn btn-teal', onclick: () => go(actions.onBreak) }, t('done.break', { n: actions.breakMinutes }))
          : h('button', { class: 'btn btn-primary', onclick: () => go(actions.onNext) }, t('done.next')),
        h('button', { class: 'btn btn-ghost', onclick: () => go(actions.onGarden) }, t('done.garden')),
      ),
    ),
    { center: true, className: 'celebrate-card' },
  );
  function go(fn: () => void) {
    m.close();
    fn();
  }
  if (res.goalReached) void maybeAskReview('goal');
  else if (v?.rarity === 'epic') void maybeAskReview('epic');
}
