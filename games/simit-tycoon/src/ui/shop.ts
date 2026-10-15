import { CONFIG } from '../config';
import { currentLang, duration, t } from '../i18n';
import { freeGoldLeft, grantFreeGold } from '../meta/daily';
import { FREE_GOLD_PER_AD, OFFLINE_CAP_COSTS, OFFLINE_CAPS_H, PRODUCT_BY_ID, PRODUCTS, TIME_WARPS, type Product } from '../meta/catalog';
import { adFree, game, isClub, offlineCapHours } from '../meta/game';
import { store } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { BADGE_ICONS, catSVG, goldIcon, ICONS, tekirSVG } from './art';
import { h } from './dom';
import { money } from './format';
import { toast } from './modal';

/** Shop tab: Kedi Kulübü, starter pack, permanent upgrades, gold, gold shop. */
export class ShopView {
  el: HTMLElement;
  private body: HTMLElement;
  private sig = '';
  private dyn: Array<() => void> = [];

  constructor(private onChange: () => void) {
    this.body = h('div', { class: 'shop-body' });
    this.el = h('div', { class: 'tab tab-shop' }, this.body);
  }

  private async buy(id: string): Promise<void> {
    audio.tap();
    if (await iap.purchase(id)) {
      audio.purchase();
      toast(t('toast.purchased'), 'good');
      this.onChange();
      this.sig = '';
      this.render();
    }
  }

  private badge(p: Product): HTMLElement | null {
    return p.badge ? h('span', { class: `ribbon ribbon-${p.badge}` }, t(`badge.${p.badge}` as never)) : null;
  }

  render(): void {
    const d = store.data;
    const sig = `${d.owned.join(',')}|${isClub()}|${d.starterOfferUntil > Date.now()}|${d.offlineLevel}|${currentLang()}`;
    if (sig === this.sig) return this.slowUpdate();
    this.sig = sig;
    this.dyn = [];
    const parts: HTMLElement[] = [];

    // ── Kedi Kulübü
    if (isClub()) {
      parts.push(h('div', { class: 'club club-active' }, h('div', { class: 'club-head', html: `${BADGE_ICONS.club}<b>${t('club.title')}</b>` }), h('p', {}, t('club.active', { d: new Date(d.vipUntil).toLocaleDateString(currentLang()) }))));
    } else {
      const m = PRODUCT_BY_ID.club_monthly;
      const y = PRODUCT_BY_ID.club_yearly;
      const save = Math.round((1 - y.usd / (m.usd * 12)) * 100);
      parts.push(
        h(
          'div',
          { class: 'club' },
          h('div', { class: 'club-cats', html: catSVG(9, 70, 'happy') + catSVG(6, 62, 'happy') + catSVG(0, 56, 'happy') }),
          h('div', { class: 'club-head', html: `${BADGE_ICONS.club}<b>${t('club.title')}</b>` }),
          h('ul', { class: 'club-perks' }, ...(['club.perk1', 'club.perk2', 'club.perk3', 'club.perk4'] as const).map((k) => h('li', { html: `${ICONS.check}<span>${t(k)}</span>` }))),
          h(
            'div',
            { class: 'club-buttons' },
            h('button', { class: 'btn btn-ghost club-btn', onclick: () => this.buy('club_monthly') }, h('small', {}, t('club.monthly')), h('b', {}, iap.price('club_monthly'))),
            h('button', { class: 'btn btn-gold club-btn', onclick: () => this.buy('club_yearly') }, h('span', { class: 'ribbon ribbon-best' }, t('club.save', { n: save })), h('small', {}, t('club.yearly')), h('b', {}, iap.price('club_yearly'))),
          ),
          h('p', { class: 'fine' }, t('club.terms')),
          h('p', { class: 'fine links' }, h('a', { href: CONFIG.termsUrl, target: '_blank', rel: 'noopener' }, t('settings.terms')), ' · ', h('a', { href: CONFIG.privacyUrl, target: '_blank', rel: 'noopener' }, t('settings.privacy'))),
        ),
      );
    }

    // ── Starter pack
    if (d.starterOfferUntil > Date.now() && !d.owned.includes('starter_pack')) {
      const timer = h('span', { class: 'offer-timer' });
      this.dyn.push(() => (timer.textContent = t('starter.ends', { t: duration(d.starterOfferUntil - Date.now()) })));
      parts.push(
        h(
          'div',
          { class: 'offer' },
          this.badge(PRODUCT_BY_ID.starter_pack),
          h('div', { class: 'offer-art', html: tekirSVG(86, 'happy') }),
          h('div', { class: 'offer-info' }, h('b', {}, t('product.starter_pack')), h('p', {}, t('product.starter_pack.desc')), timer),
          h('button', { class: 'btn btn-buy', onclick: () => this.buy('starter_pack') }, iap.price('starter_pack')),
        ),
      );
    }

    // ── Permanent
    const perm = (id: 'mult_x2' | 'mult_x3' | 'no_ads', icon: string, title: string, desc: string) => {
      const p = PRODUCT_BY_ID[id];
      const owned = d.owned.includes(id) || (id === 'no_ads' && isClub());
      return h(
        'div',
        { class: `perm ${owned ? 'owned' : ''}` },
        this.badge(p),
        h('div', { class: 'perm-ico', html: icon }),
        h('div', { class: 'perm-info' }, h('b', {}, title), h('small', {}, desc)),
        owned ? h('span', { class: 'tag tag-ok', html: `${ICONS.check}<span>${t('shop.owned')}</span>` }) : h('button', { class: 'btn btn-buy small', onclick: () => this.buy(id) }, iap.price(id)),
      );
    };
    parts.push(
      h('h3', { class: 'section-title' }, t('shop.permanent')),
      perm('mult_x2', `<span class="big-x">×2</span>`, t('product.mult_x2'), t('product.mult.desc')),
      perm('mult_x3', `<span class="big-x x3">×3</span>`, t('product.mult_x3'), t('product.mult.desc')),
      perm('no_ads', BADGE_ICONS.video, t('product.no_ads'), t('product.no_ads.desc')),
    );

    // ── Gold packs
    const grid = h('div', { class: 'gold-grid' });
    for (const p of PRODUCTS.filter((x) => x.id.startsWith('gold_'))) {
      const stack = Math.min(4, 1 + Math.floor(Math.log10(p.grant.gold ?? 1) - 1));
      grid.append(
        h(
          'button',
          { class: 'gold-pack', onclick: () => this.buy(p.id) },
          this.badge(p),
          h('div', { class: 'gold-art', html: Array.from({ length: stack }, () => goldIcon(34)).join('') }),
          h('b', { class: 'gold-amt' }, t('product.gold', { n: (p.grant.gold ?? 0).toLocaleString(currentLang()) })),
          p.bonus ? h('span', { class: 'gold-bonus' }, t('shop.bonus', { n: p.bonus })) : h('span', { class: 'gold-bonus empty' }),
          h('span', { class: 'gold-price' }, iap.price(p.id)),
        ),
      );
    }
    parts.push(h('h3', { class: 'section-title' }, t('shop.gold')), grid);

    // ── Gold shop: time warps, bigger till, free gold
    const warps = h('div', { class: 'warp-row' });
    for (const w of TIME_WARPS) {
      const value = h('small', {});
      const btn = h(
        'button',
        {
          class: 'warp',
          onclick: () => {
            if (game.idleIncome() <= 0) return toast(t('shop.warpNeedCat'), 'bad');
            if (!game.spendGold(w.gold)) return toast(t('shop.notEnoughGold'), 'bad');
            const cash = game.timeWarp(w.hours);
            audio.register();
            toast(`+${money(cash)}`, 'good');
            this.onChange();
          },
        },
        h('span', { class: 'warp-ico', html: BADGE_ICONS.warp }),
        h('b', {}, t('shop.warp', { h: w.hours })),
        value,
        h('span', { class: 'warp-cost', html: `${goldIcon(18)}${w.gold}` }),
      );
      this.dyn.push(() => {
        const v = game.warpValue(w.hours);
        value.textContent = v > 0 ? t('shop.warpDesc', { v: money(v) }) : t('shop.warpNeedCat');
        btn.classList.toggle('ok', v > 0 && store.data.gold >= w.gold);
      });
      warps.append(btn);
    }
    const lvl = d.offlineLevel;
    const nextLvl = Math.min(lvl + 1, OFFLINE_CAPS_H.length - 1);
    const maxed = lvl >= OFFLINE_CAPS_H.length - 1;
    const till = h(
      'div',
      { class: 'perm' },
      h('div', { class: 'perm-ico', html: BADGE_ICONS.till }),
      h('div', { class: 'perm-info' }, h('b', {}, t('shop.offline')), h('small', {}, t('shop.offlineDesc', { h: maxed ? offlineCapHours() : OFFLINE_CAPS_H[nextLvl] }))),
      maxed
        ? h('span', { class: 'tag tag-ok' }, t('shop.max'))
        : h(
            'button',
            {
              class: 'btn btn-gold small',
              onclick: () => {
                if (!game.spendGold(OFFLINE_CAP_COSTS[nextLvl])) return toast(t('shop.notEnoughGold'), 'bad');
                store.update((s) => {
                  s.offlineLevel = nextLvl;
                });
                audio.purchase();
                this.render();
              },
            },
            h('span', { class: 'btn-price', html: `${goldIcon(16)}${OFFLINE_CAP_COSTS[nextLvl]}` }),
          ),
    );
    const freeInfo = h('small', {});
    const freeBtn = h(
      'button',
      {
        class: 'btn btn-ad small',
        onclick: async () => {
          if (freeGoldLeft() <= 0) return;
          audio.tap();
          if (await ads.rewarded('gold')) {
            grantFreeGold(game);
            audio.gold();
            toast(t('toast.gold', { n: FREE_GOLD_PER_AD }), 'good');
          } else toast(t('toast.adFail'), 'bad');
        },
      },
      h('span', { html: adFree() ? ICONS.check : ICONS.video }),
      h('span', {}, adFree() ? t('btn.free') : `+${FREE_GOLD_PER_AD}`),
    ) as HTMLButtonElement;
    this.dyn.push(() => {
      const left = freeGoldLeft();
      freeInfo.textContent = t('shop.freeGoldDesc', { n: FREE_GOLD_PER_AD, left });
      freeBtn.disabled = left <= 0;
    });
    const free = h('div', { class: 'perm' }, h('div', { class: 'perm-ico', html: goldIcon(40) }), h('div', { class: 'perm-info' }, h('b', {}, t('shop.freeGold')), freeInfo), freeBtn);
    parts.push(h('h3', { class: 'section-title' }, t('shop.goldShop')), warps, till, free);

    parts.push(
      h(
        'button',
        {
          class: 'link-btn',
          onclick: async () => {
            const ok = await iap.restore();
            toast(ok ? t('toast.restored') : t('toast.nothing'), ok ? 'good' : 'info');
            this.sig = '';
            this.render();
          },
        },
        h('span', { html: ICONS.restore }),
        t('shop.restore'),
      ),
    );

    this.body.innerHTML = '';
    this.body.append(...parts);
    this.slowUpdate();
  }

  slowUpdate(): void {
    for (const f of this.dyn) f();
  }
}
