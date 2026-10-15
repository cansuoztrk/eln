import { todayKey } from '../core/levels';
import { buildSprites } from '../game/sprites';
import { THEMES, type Theme } from '../game/themes';
import { duration, num, t } from '../i18n';
import { DISTRICTS } from '../meta/bazaar';
import { PRODUCT_BY_ID, PRODUCTS, VIP_PERKS, type Product } from '../meta/catalog';
import { addCoins, boosterPackPrice, buyBooster, isVip, MAX_REWARDED_GIFTS_PER_DAY, REWARDED_COIN_GIFT, spendCoins } from '../meta/economy';
import { BOOSTERS, store } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { BOOSTER_ART, coinIcon, ICONS, tekirSVG } from './art';
import { boosterName, grantChips } from './chrome';
import { h } from './dom';
import { toast } from './modal';

export interface ShopActions {
  rerender(): void;
  purchased(p: Product): void;
}

function badge(p: Product): HTMLElement | null {
  if (!p.badge) return null;
  const key = { popular: 'shop.popular', best: 'shop.best', limited: 'shop.limited', new: 'shop.new' }[p.badge];
  return h('span', { class: `badge badge-${p.badge}` }, t(key as never));
}

async function buy(p: Product, a: ShopActions): Promise<void> {
  audio.tap();
  const ok = await iap.purchase(p.id);
  if (ok) {
    audio.purchase();
    toast(t('toast.purchased'), 'good');
    a.purchased(p);
  }
}

function themePreview(theme: Theme): string {
  const sp = buildSprites(theme, 40);
  const c = document.createElement('canvas');
  c.width = 132;
  c.height = 132;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = theme.board;
  ctx.fillRect(0, 0, 132, 132);
  const pattern = [0, 1, 2, 4, 3, 5, 6, 0, 1];
  pattern.forEach((f, i) => ctx.drawImage(sp.flavors[f], 6 + (i % 3) * 40, 6 + Math.floor(i / 3) * 40, 40, 40));
  return c.toDataURL();
}

export function renderShop(a: ShopActions): HTMLElement {
  const d = store.data;
  const sections: HTMLElement[] = [];
  const sec = (id: string, title: string, ...children: (HTMLElement | null)[]) => h('section', { class: 'shop-sec', id: `shop-${id}` }, h('h2', { class: 'sec-title' }, title), ...children);

  // Starter offer
  const starter = PRODUCT_BY_ID.starter_pack;
  if (d.starterOfferUntil > Date.now() && !iap.owned('starter_pack')) {
    sections.push(
      h(
        'div',
        { class: 'offer-card' },
        h('div', { class: 'offer-ribbon' }, t('offer.value')),
        h('div', { class: 'offer-cat', html: tekirSVG(92, 'happy', true) }),
        h('div', { class: 'offer-info' }, h('div', { class: 'offer-title' }, t('offer.starter.title')), grantChips(starter.grant), h('div', { class: 'offer-timer' }, t('offer.starter.sub', { t: duration(d.starterOfferUntil - Date.now()) }))),
        h('button', { class: 'btn btn-buy', onclick: () => buy(starter, a) }, iap.price(starter.id)),
      ),
    );
  }

  // VIP club
  const monthly = PRODUCT_BY_ID.vip_monthly;
  const yearly = PRODUCT_BY_ID.vip_yearly;
  const save = Math.round((1 - yearly.usd / (monthly.usd * 12)) * 100);
  const perks = h('ul', { class: 'vip-perks' }, ...['vip.perk1', 'vip.perk2', 'vip.perk3', 'vip.perk4', 'vip.perk5'].map((k) => h('li', { html: `${ICONS.check}<span>${t(k as never)}</span>` })));
  sections.push(
    sec(
      'vip',
      t('shop.vip'),
      h(
        'div',
        { class: 'vip-card' },
        h('div', { class: 'vip-head', html: `${ICONS.crown}<div><b>${t('vip.title')}</b><small>${t('vip.sub')}</small></div>` }),
        perks,
        isVip()
          ? h('div', { class: 'vip-active' }, `${t('vip.active')} • ${new Date(d.vipUntil).toLocaleDateString()}`)
          : h(
              'div',
              { class: 'vip-plans' },
              h('button', { class: 'plan', onclick: () => buy(monthly, a) }, h('span', { class: 'plan-name' }, t('product.vip_monthly')), h('span', { class: 'plan-price' }, iap.price(monthly.id)), h('span', { class: 'plan-per' }, t('vip.month'))),
              h('button', { class: 'plan best', onclick: () => buy(yearly, a) }, h('span', { class: 'badge badge-best' }, t('vip.save', { n: save })), h('span', { class: 'plan-name' }, t('product.vip_yearly')), h('span', { class: 'plan-price' }, iap.price(yearly.id)), h('span', { class: 'plan-per' }, t('vip.year'))),
            ),
        h('p', { class: 'fine' }, t('vip.terms')),
      ),
    ),
  );
  void VIP_PERKS;

  // Free gift via rewarded ad
  const giftsToday = d.gifts.date === todayKey() ? d.gifts.n : 0;
  const giftsLeft = MAX_REWARDED_GIFTS_PER_DAY - giftsToday;
  const coinCards = PRODUCTS.filter((p) => p.id.startsWith('coins_')).map((p) =>
    h(
      'button',
      { class: `coin-card ${p.badge ? `has-${p.badge}` : ''}`, onclick: () => buy(p, a) },
      badge(p),
      h('div', { class: 'coin-stack', html: coinIcon(p.grant.coins! >= 20000 ? 56 : p.grant.coins! >= 4000 ? 48 : 40) }),
      h('div', { class: 'coin-amt' }, num(p.grant.coins!)),
      p.bonus ? h('div', { class: 'coin-bonus' }, t('shop.bonus', { n: p.bonus })) : h('div', { class: 'coin-bonus empty' }, ' '),
      h('div', { class: 'coin-name' }, t(`product.${p.id}` as never)),
      h('div', { class: 'price' }, iap.price(p.id)),
    ),
  );
  const gift =
    giftsLeft > 0
      ? h(
          'button',
          {
            class: 'gift-card',
            onclick: async () => {
              if (await ads.rewarded('gift')) {
                addCoins(REWARDED_COIN_GIFT);
                store.update((s) => {
                  if (s.gifts.date !== todayKey()) s.gifts = { date: todayKey(), n: 0 };
                  s.gifts.n++;
                });
                audio.coin();
                toast(`+${REWARDED_COIN_GIFT}`, 'good');
                a.rerender();
              } else toast(t('ad.unavailable'));
            },
          },
          h('span', { class: 'gift-ico', html: ICONS.gift }),
          h('span', { class: 'gift-txt' }, h('b', {}, t('shop.gift')), h('small', {}, t('shop.gift.sub', { n: giftsLeft }))),
          h('span', { class: 'gift-val', html: `${coinIcon(22)} +${REWARDED_COIN_GIFT}` }),
        )
      : null;
  sections.push(sec('coins', t('shop.coins'), gift, h('div', { class: 'coin-grid' }, ...coinCards)));

  // Bundles & no-ads
  const bundleCard = (p: Product) =>
    h(
      'div',
      { class: 'bundle-card' },
      badge(p),
      h('div', { class: 'bundle-title' }, t(`product.${p.id}` as never)),
      grantChips(p.grant),
      p.id === 'no_ads' ? h('p', { class: 'fine' }, t('product.no_ads.desc')) : null,
      iap.owned(p.id) || (p.id === 'no_ads' && d.removeAds) ? h('div', { class: 'owned' }, t('shop.owned')) : h('button', { class: 'btn btn-buy', onclick: () => buy(p, a) }, iap.price(p.id)),
    );
  sections.push(sec('bundles', t('shop.bundles'), h('div', { class: 'bundle-list' }, bundleCard(PRODUCT_BY_ID.no_ads), bundleCard(PRODUCT_BY_ID.bundle_usta), bundleCard(PRODUCT_BY_ID.bundle_sultan))));

  // Boosters (soft currency)
  const boosterRows = BOOSTERS.map((id) =>
    h(
      'div',
      { class: 'booster-row' },
      h('span', { class: 'br-ico', html: BOOSTER_ART[id] }),
      h('div', { class: 'br-info' }, h('b', {}, `${boosterName(id)} `, h('small', {}, `×${d.boosters[id]}`)), h('small', {}, t(`booster.${id}.desc` as never))),
      h(
        'div',
        { class: 'br-buy' },
        h('button', { class: 'btn btn-coin small', onclick: () => (buyBooster(id, 1) ? (audio.purchase(), a.rerender()) : toast(t('toast.nocoins'), 'bad')), html: `×1 ${coinIcon(16)} ${num(boosterPackPrice(id, 1))}` }),
        h('button', { class: 'btn btn-coin small', onclick: () => (buyBooster(id, 3) ? (audio.purchase(), a.rerender()) : toast(t('toast.nocoins'), 'bad')), html: `×3 ${coinIcon(16)} ${num(boosterPackPrice(id, 3))}` }),
      ),
    ),
  );
  sections.push(sec('boosters', t('shop.boosters'), h('div', { class: 'booster-list' }, ...boosterRows)));

  // Themes
  const themeCards = THEMES.map((th) => {
    const owned = d.themes.includes(th.id);
    const active = d.theme === th.id;
    let action: HTMLElement;
    if (active) action = h('div', { class: 'owned' }, t('shop.equipped'));
    else if (owned)
      action = h(
        'button',
        {
          class: 'btn btn-secondary small',
          onclick: () => {
            store.update((s) => {
              s.theme = th.id;
            });
            audio.purchase();
            toast(t('toast.theme'), 'good');
            a.rerender();
          },
        },
        t('shop.equip'),
      );
    else if (th.price.coins)
      action = h('button', {
        class: 'btn btn-coin small',
        html: `${coinIcon(16)} ${num(th.price.coins)}`,
        onclick: () => {
          if (!spendCoins(th.price.coins!)) return toast(t('toast.nocoins'), 'bad');
          store.update((s) => {
            s.themes.push(th.id);
            s.theme = th.id;
          });
          audio.purchase();
          a.rerender();
        },
      });
    else if (th.price.product) {
      const p = PRODUCT_BY_ID[th.price.product];
      action = h('div', { class: 'theme-buy' }, th.price.vip ? h('small', {}, t('shop.unlock.vip')) : null, h('button', { class: 'btn btn-buy small', onclick: () => buy(p, a) }, iap.price(p.id)));
    } else {
      const dist = DISTRICTS[th.price.district ?? 0];
      action = h('div', { class: 'locked', html: `${ICONS.lock}<small>${t('shop.unlock.district', { name: t(`bazaar.d.${dist.key}` as never) })}</small>` });
    }
    return h('div', { class: `theme-card ${active ? 'active' : ''}` }, h('img', { class: 'theme-prev', src: themePreview(th), alt: '' }), h('div', { class: 'theme-name' }, t(`theme.${th.id}` as never)), action);
  });
  sections.push(sec('themes', t('shop.themes'), h('div', { class: 'theme-grid' }, ...themeCards)));

  sections.push(
    h(
      'div',
      { class: 'shop-foot' },
      h(
        'button',
        {
          class: 'btn btn-ghost small',
          onclick: async () => {
            const ok = await iap.restore();
            toast(ok ? t('toast.restored') : t('toast.restore_none'), ok ? 'good' : 'info');
            a.rerender();
          },
        },
        t('shop.restore'),
      ),
      iap.demo ? h('p', { class: 'fine' }, t('shop.demo')) : null,
      h('p', { class: 'fine' }, t('shop.legal')),
    ),
  );

  return h('div', { class: 'screen shop scroll' }, h('h1', { class: 'screen-title' }, t('shop.title')), ...sections);
}
