import { duration, num, t } from '../i18n';
import { chestReady, claimChest, claimQuest, ensureQuests, QUEST_CHEST } from '../meta/daily';
import { claimableCount, passPoints, POINTS_PER_TIER, seasonEndsAt, TIERS, unlockedTiers } from '../meta/pass';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { coinIcon, ICONS } from './art';
import { grantChips } from './chrome';
import { showReward } from './dialogs';
import { h } from './dom';

function msToMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function renderQuests(rerender: () => void, openPass: () => void): HTMLElement {
  const list = ensureQuests();
  const items = list.map((q, i) => {
    const pct = Math.min(100, (q.progress / q.target) * 100);
    const ready = !q.claimed && q.progress >= q.target;
    return h(
      'div',
      { class: `quest ${q.claimed ? 'claimed' : ''} ${ready ? 'ready' : ''}` },
      h(
        'div',
        { class: 'q-main' },
        h('div', { class: 'q-title' }, t(`quest.${q.id}` as never, { n: num(q.target) })),
        h('div', { class: 'q-bar' }, h('div', { class: 'q-fill', style: `width:${pct}%` }), h('span', { class: 'q-num' }, `${num(q.progress)}/${num(q.target)}`)),
      ),
      q.claimed
        ? h('span', { class: 'task-check', html: ICONS.check })
        : h(
            'button',
            {
              class: `btn ${ready ? 'btn-primary' : 'btn-ghost'} small`,
              disabled: !ready,
              onclick: () => {
                const n = claimQuest(i);
                if (n) {
                  audio.coin();
                  rerender();
                }
              },
              html: `${coinIcon(18)} ${num(q.reward)}`,
            },
          ),
    );
  });
  const chestOpen = store.data.quests.chest;
  const chest = h(
    'div',
    { class: `quest-chest ${chestReady() ? 'ready' : ''} ${chestOpen ? 'open' : ''}` },
    h('div', { class: 'chest-ico', html: ICONS.gift }),
    h('div', { class: 'chest-info' }, h('b', {}, chestOpen ? t('btn.claimed') : t('quests.chest')), grantChips(QUEST_CHEST)),
    chestReady()
      ? h(
          'button',
          {
            class: 'btn btn-primary small',
            onclick: () => {
              const g = claimChest();
              if (g) showReward(t('quests.chest.open'), g, rerender);
            },
          },
          t('quests.chest.open'),
        )
      : null,
  );
  const pts = passPoints();
  const tiers = unlockedTiers(pts);
  const ready = claimableCount();
  const passCard = h(
    'button',
    { class: `pass-card ${ready ? 'ready' : ''}`, onclick: () => (audio.tap(), openPass()) },
    h('span', { class: 'pass-card-ico', html: ICONS.ticket }),
    h(
      'span',
      { class: 'pass-card-info' },
      h('b', {}, t('pass.title')),
      h('small', {}, t('pass.ends', { t: duration(seasonEndsAt() - Date.now()) })),
      h('span', { class: 'q-bar' }, h('span', { class: 'q-fill', style: `width:${(Math.min(TIERS, tiers) / TIERS) * 100}%` }), h('span', { class: 'q-num' }, t('pass.tier', { n: `${tiers}/${TIERS}` }))),
    ),
    ready ? h('span', { class: 'nav-badge' }, String(ready)) : h('span', { class: 'pass-card-pts' }, `${pts % POINTS_PER_TIER}/${POINTS_PER_TIER}`),
  );
  return h('div', { class: 'screen quests scroll' }, h('h1', { class: 'screen-title' }, t('quests.title')), h('p', { class: 'screen-sub' }, t('quests.reset', { t: duration(msToMidnight()) })), passCard, h('div', { class: 'quest-list' }, ...items), chest);
}
