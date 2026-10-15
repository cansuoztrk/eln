import { duration, num, t } from '../i18n';
import { PRODUCT_BY_ID, type Grant } from '../meta/catalog';
import { canClaim, claimAll, claimTier, ensureSeason, FREE_TRACK, passPoints, POINTS_PER_TIER, PREMIUM_TRACK, seasonEndsAt, seasonTheme, TIERS, unlockedTiers, type Track } from '../meta/pass';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { BOOSTER_ART, coinIcon, heartIcon, ICONS } from './art';
import { showReward } from './dialogs';
import { h } from './dom';
import { modal, toast } from './modal';

// The menu screen behind is refreshed only when the pass closes (onChange):
// refreshing it earlier would rebuild the screen and close this modal.

/** Compact single-line reward label for a pass tier cell. */
function rewardMini(g: Grant): HTMLElement {
  const el = h('div', { class: 'pr' });
  if (g.themes?.length) el.append(h('span', { class: 'pr-theme' }, t(`theme.${g.themes[0]}` as never)));
  if (g.coins) el.append(h('span', { class: 'pr-item', html: `${coinIcon(18)}<b>${num(g.coins)}</b>` }));
  if (g.boosters) {
    for (const [k, v] of Object.entries(g.boosters)) {
      if (v) el.append(h('span', { class: 'pr-item', html: `<i class="pr-boost">${BOOSTER_ART[k]}</i><b>×${v}</b>` }));
    }
  }
  if (g.unlimitedLivesHours) el.append(h('span', { class: 'pr-item', html: `${heartIcon(18)}<b>∞${g.unlimitedLivesHours}h</b>` }));
  return el;
}

export function showPass(onChange: () => void): void {
  ensureSeason();
  let m: { el: HTMLElement; close: () => void } | null = null;

  const render = (): HTMLElement => {
    const points = passPoints();
    const tiers = unlockedTiers(points);
    const premium = store.data.pass.premium;
    const inTier = tiers >= TIERS ? POINTS_PER_TIER : points % POINTS_PER_TIER;

    const head = h(
      'div',
      { class: 'pass-head' },
      h('div', { class: 'pass-season' }, t(`pass.season.${seasonTheme()}` as never)),
      h('div', { class: 'pass-ends' }, t('pass.ends', { t: duration(seasonEndsAt() - Date.now()) })),
      h(
        'div',
        { class: 'pass-progress' },
        h('span', { class: 'pass-level' }, String(Math.min(TIERS, tiers + (tiers < TIERS ? 1 : 0)))),
        h('div', { class: 'q-bar' }, h('div', { class: 'q-fill', style: `width:${(inTier / POINTS_PER_TIER) * 100}%` }), h('span', { class: 'q-num' }, tiers >= TIERS ? '✓' : `${inTier}/${POINTS_PER_TIER}`)),
      ),
      h('p', { class: 'pass-howto' }, t('pass.howto')),
    );

    const cta = premium
      ? h('div', { class: 'pass-active', html: `${ICONS.crown}<span>${t('pass.active')}</span>` })
      : h(
          'button',
          {
            class: 'btn btn-buy btn-wide pass-buy',
            onclick: async () => {
              audio.tap();
              if (await iap.purchase('pass_premium')) {
                audio.purchase();
                toast(t('toast.purchased'), 'good');
                refresh();
              }
            },
          },
          h('span', { class: 'pass-buy-txt' }, h('b', {}, t('pass.unlock')), h('small', {}, t('pass.premium.desc'))),
          h('span', { class: 'btn-price' }, iap.price(PRODUCT_BY_ID.pass_premium.id)),
        );

    const claimable = (() => {
      let n = 0;
      for (let i = 1; i <= tiers; i++) {
        if (canClaim('free', i)) n++;
        if (canClaim('premium', i)) n++;
      }
      return n;
    })();
    const claimAllBtn =
      claimable > 1
        ? h(
            'button',
            {
              class: 'btn btn-primary small pass-claim-all',
              onclick: () => {
                const g = claimAll();
                if (g) {
                  refresh();
                  showReward(t('pass.title'), g);
                }
              },
            },
            t('pass.claimAll'),
          )
        : null;

    const cell = (track: Track, tier: number) => {
      const g = (track === 'free' ? FREE_TRACK : PREMIUM_TRACK)[tier - 1];
      const claimed = (track === 'free' ? store.data.pass.claimedFree : store.data.pass.claimedPremium).includes(tier);
      const unlocked = tier <= tiers;
      const locked = track === 'premium' && !premium;
      const state = claimed ? 'claimed' : unlocked && !locked ? 'ready' : 'locked';
      const node = h('div', { class: `pc pc-${track} pc-${state}` }, rewardMini(g));
      if (state === 'ready') {
        node.append(
          h(
            'button',
            {
              class: 'btn btn-primary small',
              onclick: () => {
                const got = claimTier(track, tier);
                if (got) {
                  audio.coin();
                  refresh();
                }
              },
            },
            t('btn.claim'),
          ),
        );
      } else if (claimed) node.append(h('span', { class: 'pc-check', html: ICONS.check }));
      else if (locked) node.append(h('span', { class: 'pc-lock', html: ICONS.lock }));
      return node;
    };

    const rows = h(
      'div',
      { class: 'pass-rows' },
      h('div', { class: 'pass-row pass-row-head' }, h('span', {}, t('pass.free')), h('span'), h('span', {}, t('pass.premium'))),
      ...Array.from({ length: TIERS }, (_, i) => {
        const tier = i + 1;
        return h('div', { class: `pass-row ${tier <= tiers ? 'done' : ''} ${tier === tiers + 1 ? 'next' : ''}` }, cell('free', tier), h('div', { class: 'pass-tier' }, String(tier)), cell('premium', tier));
      }),
    );
    return h('div', { class: 'modal-body pass' }, head, cta, claimAllBtn, rows);
  };

  const refresh = () => {
    if (!m) return;
    const body = m.el.querySelector('.pass');
    const scroll = body?.querySelector('.pass-rows')?.scrollTop ?? 0;
    const cardScroll = m.el.scrollTop;
    body?.replaceWith(render());
    m.el.scrollTop = cardScroll;
    const rows = m.el.querySelector('.pass-rows');
    if (rows) rows.scrollTop = scroll;
  };

  m = modal(render(), { title: t('pass.title'), className: 'pass-modal', onClose: onChange });
  // Further into the season, scroll the next tier into view (early on the header matters more).
  if (unlockedTiers() >= 6) requestAnimationFrame(() => m?.el.querySelector('.pass-row.next')?.scrollIntoView({ block: 'center' }));
}
