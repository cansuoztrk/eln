import { CONFIG } from '../config';
import { currentLang, LANG_LIST, num, setLang, t, tk } from '../i18n';
import { PRODUCTS, type Grant, type Product } from '../meta/catalog';
import { CHAPTERS } from '../meta/chapters';
import { chestReady, claimChest, claimQuest, dailyDone, dailyStreak, ensureQuests, LOGIN_REWARDS, loginClaimable, QUEST_CHEST } from '../meta/daily';
import { addCoins, DAILY_REWARD, MAX_REWARDED_COINS_PER_DAY, REWARDED_COINS } from '../meta/economy';
import { store } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { cancelNotifications, requestNotifications } from '../services/notify';
import { bookCover, coinIcon, ICONS, tekirSVG } from './art';
import { h } from './dom';
import { confirmDialog, modal, toast } from './modal';
import { todayKey } from '../meta/daily';

// ───────────── shared bits ─────────────

function grantChips(g: Grant): HTMLElement {
  const row = h('div', { class: 'grant' });
  if (g.coins) row.append(h('span', { class: 'chip', html: `${coinIcon(20)}<b>${num(g.coins)}</b>` }));
  if (g.boosters?.hint) row.append(h('span', { class: 'chip', html: `<i class="ico">${ICONS.hint}</i><b>×${g.boosters.hint}</b>` }));
  if (g.boosters?.paw) row.append(h('span', { class: 'chip', html: `<i class="ico">${ICONS.paw}</i><b>×${g.boosters.paw}</b>` }));
  if (g.removeAds) row.append(h('span', { class: 'chip', html: `<i class="ico">${ICONS.noads}</i>` }));
  return row;
}

// ───────────── daily shelf ─────────────

export function showDaily(play: () => void): void {
  const done = dailyDone();
  const streak = dailyStreak();
  const d = store.data.daily;
  const today = d.results[todayKey()];
  const body = h(
    'div',
    { class: 'modal-body' },
    h('div', { class: 'mascot', html: tekirSVG(110, done ? 'happy' : 'read') }),
    h('p', { class: 'modal-text' }, done ? t('daily.done') : t('daily.body')),
    h('div', { class: 'stat-row' }, h('span', { class: 'chip', html: `<i class="ico">${ICONS.flame}</i><b>${t('daily.streak', { n: streak })}</b>` }), h('span', { class: 'chip' }, t('daily.best', { n: d.best }))),
    today ? h('div', { class: 'daily-result' }, '⭐'.repeat(today.stars) + '☆'.repeat(3 - today.stars), h('small', {}, ` · ${today.moves}`)) : null,
    !done ? h('div', { class: 'grant', html: `<span class="chip">${coinIcon(20)}<b>${t('daily.reward', { n: DAILY_REWARD + Math.min(50, streak * 10) })}</b></span>` }) : null,
    !done ? h('button', { class: 'btn btn-green btn-wide', html: `${ICONS.play}<span>${t('daily.play')}</span>`, onclick: () => { m.close(); play(); } }) : null,
  );
  const m = modal(body, { title: t('daily.title') });
}

// ───────────── collection ─────────────

export function showCollection(): void {
  const owned = new Set(store.data.books);
  const lang = currentLang();
  const shelf = h('div', { class: 'book-shelf' });
  CHAPTERS.forEach((ch, i) => {
    const has = owned.has(i);
    shelf.append(
      h(
        'div',
        { class: `book ${has ? '' : 'locked'}`, title: has ? ch.book[lang] : t('collection.locked', { chapter: ch.name }) },
        h('div', { html: bookCover(ch.color, ch.book[lang], 64, !has) }),
        h('small', {}, has ? ch.book[lang] : ch.name),
      ),
    );
  });
  modal(
    h('div', { class: 'modal-body' }, h('p', { class: 'modal-text' }, t('collection.sub')), h('b', { class: 'count-line' }, t('collection.count', { n: owned.size, total: CHAPTERS.length })), shelf),
    { title: t('collection.title'), className: 'wide' },
  );
}

// ───────────── quests ─────────────

export function showQuests(): void {
  const body = h('div', { class: 'modal-body' });
  const render = () => {
    const list = ensureQuests();
    body.replaceChildren(
      ...list.map((q, i) => {
        const doneQ = q.progress >= q.target;
        return h(
          'div',
          { class: `quest ${q.claimed ? 'claimed' : ''}` },
          h('div', { class: 'quest-main' }, h('b', {}, t(`quest.${q.id}` as 'quest.win', { n: q.target })), h('div', { class: 'qbar' }, h('i', { style: `width:${(q.progress / q.target) * 100}%` })), h('small', {}, `${q.progress}/${q.target}`)),
          q.claimed
            ? h('span', { class: 'quest-done', html: ICONS.check })
            : h('button', {
                class: 'btn small',
                disabled: !doneQ,
                html: `${coinIcon(18)}<span>${q.reward}</span>`,
                onclick: () => {
                  if (claimQuest(i)) {
                    audio.coin();
                    render();
                  }
                },
              }),
        );
      }),
      h(
        'div',
        { class: 'chest' },
        h('p', {}, t('quests.chest')),
        grantChips(QUEST_CHEST),
        h('button', {
          class: 'btn btn-green small',
          disabled: !chestReady(),
          onclick: () => {
            if (claimChest()) {
              audio.purchase();
              render();
            }
          },
        }, store.data.quests.chest ? t('common.claimed') : t('quests.chestOpen')),
      ),
    );
  };
  render();
  modal(body, { title: t('quests.title') });
}

// ───────────── shop ─────────────

function productRow(p: Product, refresh: () => void): HTMLElement {
  const owned = p.once && iap.owned(p.id);
  const btn = h('button', { class: 'btn small btn-buy', disabled: owned }, owned ? t('shop.owned') : iap.price(p.id)) as HTMLButtonElement;
  btn.onclick = async () => {
    btn.disabled = true;
    const ok = await iap.purchase(p.id);
    if (ok) {
      audio.purchase();
      toast(t('shop.thanks'), 'good');
    }
    btn.disabled = false;
    refresh();
  };
  const badge = p.badge === 'popular' ? t('shop.popular') : p.badge === 'best' ? t('shop.best') : p.badge === 'limited' ? t('shop.limited') : p.bonus ? t('shop.bonus', { n: p.bonus }) : '';
  return h(
    'div',
    { class: `product ${p.badge ?? ''}` },
    badge ? h('span', { class: 'pbadge' }, badge) : null,
    h('div', { class: 'pinfo' }, h('b', {}, tk(`product.${p.id}`, p.id)), p.id === 'no_ads' ? h('small', {}, t('product.no_ads.desc')) : grantChips(p.grant)),
    btn,
  );
}

export function showShop(): void {
  const body = h('div', { class: 'modal-body shop' });
  const render = () => {
    const today = todayKey();
    const used = store.data.freeHints.date === today ? store.data.freeHints.n : 0;
    const left = Math.max(0, MAX_REWARDED_COINS_PER_DAY - used);
    const freeBtn = h('button', { class: 'btn btn-video small', disabled: left <= 0, html: `${ICONS.video}<span>+${REWARDED_COINS}</span>` }) as HTMLButtonElement;
    freeBtn.onclick = async () => {
      freeBtn.disabled = true;
      if (await ads.rewarded('coins')) {
        addCoins(REWARDED_COINS);
        store.update((d) => {
          if (d.freeHints.date !== today) d.freeHints = { date: today, n: 0 };
          d.freeHints.n++;
        });
        audio.coin();
      }
      render();
    };
    body.replaceChildren(
      h('div', { class: 'coins-line big', html: `${coinIcon(30)}<b>${num(store.data.coins)}</b>` }),
      h('div', { class: 'product free' }, h('div', { class: 'pinfo' }, h('b', {}, t('shop.free')), h('small', {}, `${t('shop.freeAd', { n: REWARDED_COINS })} · ${t('shop.freeLeft', { n: left })}`)), freeBtn),
      h('h3', {}, t('shop.bundles')),
      ...PRODUCTS.filter((p) => p.type === 'non_consumable' || p.id.startsWith('bundle') || p.id === 'starter_pack').filter((p) => p.id !== 'starter_pack' || !iap.owned(p.id)).map((p) => productRow(p, render)),
      h('h3', {}, t('shop.coins')),
      ...PRODUCTS.filter((p) => p.id.startsWith('coins_')).map((p) => productRow(p, render)),
      h('button', {
        class: 'link',
        onclick: async () => {
          const ok = await iap.restore();
          toast(ok ? t('shop.restored') : t('shop.failed'));
          render();
        },
      }, t('shop.restore')),
    );
  };
  render();
  modal(body, { title: t('shop.title'), className: 'wide' });
}

/** One-time starter offer, shown from the 8th level on for 72 hours. */
export function maybeStarterOffer(): void {
  const d = store.data;
  if (iap.owned('starter_pack') || d.level < 8) return;
  const now = Date.now();
  if (!d.starterOfferUntil) {
    store.update((x) => {
      x.starterOfferUntil = now + 72 * 3_600_000;
    });
  }
  if (store.data.starterOfferUntil < now || d.stats.sessions % 2 !== 0) return;
  const p = PRODUCTS.find((x) => x.id === 'starter_pack')!;
  const m = modal(
    h(
      'div',
      { class: 'modal-body' },
      h('div', { class: 'mascot', html: tekirSVG(110, 'happy') }),
      h('p', { class: 'modal-text' }, t('starter.body')),
      grantChips(p.grant),
      h('button', {
        class: 'btn btn-wide',
        onclick: async () => {
          if (await iap.purchase(p.id)) {
            audio.purchase();
            toast(t('shop.thanks'), 'good');
            m.close();
          }
        },
      }, iap.price(p.id)),
    ),
    { title: t('starter.title') },
  );
}

// ───────────── login gift ─────────────

export function showLogin(claim: () => Grant | null, after: () => void): void {
  const idx = loginClaimable();
  const grid = h('div', { class: 'login-grid' });
  LOGIN_REWARDS.forEach((g, i) => {
    grid.append(
      h(
        'div',
        { class: `login-day ${i < idx ? 'past' : ''} ${i === idx ? 'today' : ''} ${i === 6 ? 'big' : ''}` },
        h('small', {}, t('login.day', { n: i + 1 })),
        h('span', { html: i === 6 ? ICONS.gift : coinIcon(26) }),
        h('b', {}, num(g.coins ?? 0)),
      ),
    );
  });
  const m = modal(
    h(
      'div',
      { class: 'modal-body' },
      grid,
      h('button', {
        class: 'btn btn-green btn-wide',
        onclick: () => {
          const g = claim();
          if (g) audio.coin();
          m.close();
        },
      }, t('login.claim')),
    ),
    { title: t('login.title'), onClose: () => after() },
  );
}

// ───────────── settings ─────────────

export function showSettings(onLang: () => void): void {
  const d = store.data;
  const toggle = (icon: string, label: string, get: () => boolean, set: (v: boolean) => void) => {
    const btn = h('button', { class: `switch ${get() ? 'on' : ''}`, role: 'switch', 'aria-checked': String(get()), 'aria-label': label }) as HTMLButtonElement;
    btn.onclick = () => {
      const v = !get();
      set(v);
      btn.classList.toggle('on', v);
      btn.setAttribute('aria-checked', String(v));
      audio.tap();
    };
    return h('div', { class: 'set-row' }, h('span', { class: 'set-ico', html: icon }), h('span', { class: 'set-label' }, label), btn);
  };
  const lang = h(
    'div',
    { class: 'set-row langs' },
    h('span', { class: 'set-ico', html: ICONS.globe }),
    h('span', { class: 'set-label' }, t('settings.language')),
    h(
      'div',
      { class: 'lang-pick' },
      ...LANG_LIST.map((l) =>
        h('button', {
          class: `chip ${currentLang() === l.id ? 'on' : ''}`,
          onclick: () => {
            store.update((x) => {
              x.settings.lang = l.id;
              x.run = null;
            });
            setLang(l.id);
            m.close();
            onLang();
          },
        }, l.name),
      ),
    ),
  );
  const link = (icon: string, label: string, href: string) => h('a', { class: 'set-row link', href, target: '_blank', rel: 'noopener' }, h('span', { class: 'set-ico', html: icon }), h('span', { class: 'set-label' }, label), h('span', { class: 'set-go' }, '›'));
  const body = h(
    'div',
    { class: 'modal-body settings' },
    toggle(ICONS.sound, t('settings.sound'), () => store.data.settings.sound, (v) => {
      store.update((x) => {
        x.settings.sound = v;
      });
      audio.setSfx(v);
    }),
    toggle(ICONS.music, t('settings.music'), () => store.data.settings.music, (v) => {
      store.update((x) => {
        x.settings.music = v;
      });
      audio.setMusic(v);
    }),
    toggle(ICONS.vibrate, t('settings.haptics'), () => store.data.settings.haptics, (v) => store.update((x) => {
      x.settings.haptics = v;
    })),
    toggle(ICONS.bell, t('settings.notifications'), () => store.data.settings.notifications, (v) => {
      store.update((x) => {
        x.settings.notifications = v;
      });
      if (v) void requestNotifications();
      else void cancelNotifications();
    }),
    toggle(ICONS.text, t('settings.bigText'), () => store.data.settings.bigText, (v) => store.update((x) => {
      x.settings.bigText = v;
    })),
    lang,
    link(ICONS.shield, t('settings.privacy'), CONFIG.privacyUrl),
    link(ICONS.doc, t('settings.terms'), CONFIG.termsUrl),
    h('button', { class: 'set-row link', onclick: () => void ads.privacyOptions() }, h('span', { class: 'set-ico', html: ICONS.shield }), h('span', { class: 'set-label' }, t('settings.adPrivacy')), h('span', { class: 'set-go' }, '›')),
    link(ICONS.bell, `${t('settings.support')} · ${CONFIG.supportEmail}`, `mailto:${CONFIG.supportEmail}`),
    h('p', { class: 'set-stats' }, t('settings.stats', { wins: num(d.stats.wins), stars: num(d.totalStars), words: num(d.stats.shelved) })),
    h('button', {
      class: 'btn btn-ghost small danger',
      onclick: async () => {
        if (await confirmDialog(t('settings.reset'), t('settings.resetQ'), t('common.yes'), t('common.cancel'))) {
          await store.reset();
          m.close();
          onLang();
        }
      },
    }, t('settings.reset')),
    h('p', { class: 'version' }, t('settings.version', { v: __APP_VERSION__ })),
  );
  const m = modal(body, { title: t('settings.title') });
}
