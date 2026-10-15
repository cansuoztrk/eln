import { num, t } from '../i18n';
import { currentDistrict, DISTRICTS, districtProgress, restore, TASKS } from '../meta/bazaar';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { ICONS, starIcon, tekirSVG } from './art';
import { grantChips } from './chrome';
import { showReward } from './dialogs';
import { h } from './dom';
import { toast } from './modal';
import { stallSVG } from './stall';

export function renderBazaar(rerender: () => void, playLevel: () => void): HTMLElement {
  const d = currentDistrict();
  const stars = store.data.stars;
  const header = h('div', { class: 'bazaar-head' }, h('h1', { class: 'screen-title' }, t('bazaar.title')), h('div', { class: 'star-pill', html: `${starIcon(24)}<b>${num(stars)}</b>` }));

  if (!d) {
    return h('div', { class: 'screen bazaar scroll' }, header, h('div', { class: 'bazaar-done', html: tekirSVG(180, 'happy', true) }), h('p', { class: 'modal-text' }, t('bazaar.all')));
  }

  const { done } = districtProgress();
  const name = t(`bazaar.d.${d.key}` as never);
  const stall = h('div', { class: 'stall-wrap', html: stallSVG(d, done, name) });
  const progress = h('div', { class: 'district-progress' }, h('div', { class: 'dp-bar' }, h('div', { class: 'dp-fill', style: `width:${(done.length / TASKS.length) * 100}%` })), h('span', {}, t('bazaar.progress', { n: done.length })));

  const tasks = h(
    'div',
    { class: 'task-list' },
    ...TASKS.map((key, i) => {
      const isDone = done.includes(i);
      const cost = d.costs[i];
      return h(
        'div',
        { class: `task ${isDone ? 'done' : ''}` },
        h('span', { class: 'task-name' }, t(`bazaar.t.${key}` as never)),
        isDone
          ? h('span', { class: 'task-check', html: ICONS.check })
          : h(
              'button',
              {
                class: `btn btn-star small ${stars >= cost ? '' : 'poor'}`,
                html: `${starIcon(18)} ${cost}`,
                onclick: () => {
                  const res = restore(i);
                  if (!res.ok) {
                    audio.invalid();
                    if (res.reason === 'stars') toast(t('bazaar.need'), 'bad');
                    return;
                  }
                  audio.purchase();
                  void haptic('success');
                  rerender();
                  if (res.districtComplete) setTimeout(() => showReward(t('bazaar.complete', { name }), res.districtComplete!), 450);
                },
              },
            ),
      );
    }),
  );

  const map = h(
    'div',
    { class: 'district-map' },
    ...DISTRICTS.map((x) => {
      const cur = x.id === d.id;
      const passed = x.id < d.id;
      return h('div', { class: `dm-node ${cur ? 'cur' : ''} ${passed ? 'passed' : ''}`, title: t(`bazaar.d.${x.key}` as never) }, passed ? h('span', { html: ICONS.check }) : String(x.id + 1));
    }),
  );

  return h(
    'div',
    { class: 'screen bazaar scroll' },
    header,
    h('p', { class: 'screen-sub' }, t('bazaar.sub')),
    map,
    h('div', { class: 'district-name' }, name),
    stall,
    progress,
    tasks,
    h('div', { class: 'district-reward' }, h('span', {}, t('bazaar.reward')), grantChips(d.reward)),
    stars < (d.costs.find((_, i) => !done.includes(i)) ?? 0) ? h('button', { class: 'btn btn-primary btn-wide', onclick: () => (audio.tap(), playLevel()) }, t('home.level', { n: store.data.level })) : null,
  );
}
