import * as E from '../core/economy';
import { districtDef } from '../core/districts';
import { CONFIG } from '../config';
import { bizName, currentLang, districtNames, duration, LANGS, setLang, t } from '../i18n';
import { achievementList, claimAchievement, claimAllAchievements, isDone, type Achievement } from '../meta/achievements';
import { BOOST_HOURS_PER_AD, BOOST_MAX_HOURS, type Grant, type Product } from '../meta/catalog';
import { chestReady, claimChest, claimClubGift, claimLogin, claimQuest, clubGiftClaimable, ensureQuests, LOGIN_REWARDS, loginClaimable, QUEST_CHEST } from '../meta/daily';
import { adFree, game, type OfflineReport } from '../meta/game';
import { store } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { requestNotifications } from '../services/notify';
import { haptic, isNative } from '../services/platform';
import { BADGE_ICONS, catSVG, coinIcon, foodSVG, goldIcon, ICONS, tekirSVG, tulipIcon } from './art';
import { h } from './dom';
import { money, times } from './format';
import { fx } from './fx';
import { confirmDialog, modal, toast } from './modal';
import { skylineSVG } from './skyline';

// ───────────── shared bits ─────────────

export function rewardChips(g: Grant, compact = false): HTMLElement {
  const wrap = h('div', { class: `grant ${compact ? 'compact' : ''}` });
  if (g.gold) wrap.append(h('div', { class: 'chip-r', html: `${goldIcon(26)}<b>${g.gold}</b>` }));
  if (g.boostHours) wrap.append(h('div', { class: 'chip-r', html: `<span class="chip-boost">${BADGE_ICONS.boost}</span><b>${t('reward.boost', { h: g.boostHours })}</b>` }));
  if (g.warpHours) wrap.append(h('div', { class: 'chip-r', html: `<span class="chip-boost">${BADGE_ICONS.warp}</span><b>${compact ? t('reward.warpShort', { h: g.warpHours }) : t('reward.warp', { h: g.warpHours })}</b>` }));
  return wrap;
}

/** Slide-down banner for milestones, festivals and goals (non-blocking). */
export function banner(title: string, sub = '', icon = '', kind: 'gold' | 'pink' | 'mint' = 'gold'): void {
  const el = h('div', { class: `banner-toast bt-${kind}` }, icon ? h('span', { class: 'bt-ico', html: icon }) : '', h('div', {}, h('b', {}, title), sub ? h('small', {}, sub) : ''));
  document.getElementById('toasts')!.append(el);
  setTimeout(() => el.classList.add('out'), 2400);
  setTimeout(() => el.remove(), 2900);
}

// ───────────── welcome back (offline earnings) ─────────────

export function showOffline(report: OfflineReport, onDone: () => void): void {
  const free = adFree();
  const away = duration(report.away * 1000);
  let done = false;
  const finish = (mult: number) => {
    if (done) return;
    done = true;
    const cash = game.claimOffline(report, mult);
    audio.register();
    void haptic('success');
    const r = (m.el.querySelector('.offline-amount') as HTMLElement).getBoundingClientRect();
    fx.coins(r.left + r.width / 2, r.top + r.height / 2, 40, 30, 14);
    toast(`+${money(cash)}`, 'good');
    m.close();
  };
  const body = h(
    'div',
    { class: 'modal-body offline' },
    h('div', { class: 'offline-art', html: tekirSVG(110, 'happy') }),
    h('p', { class: 'modal-text' }, t('offline.body', { t: away })),
    h('div', { class: 'offline-amount', html: `${coinIcon(34)}<b>${money(report.earnings)}</b>` }),
    report.capped ? h('p', { class: 'fine warn' }, t('offline.capped', { h: Math.round(report.counted / 3600) })) : '',
    h(
      'div',
      { class: 'modal-actions' },
      h('button', { class: 'btn btn-ghost', onclick: () => finish(1) }, t('btn.collect')),
      h(
        'button',
        {
          class: 'btn btn-ad',
          onclick: async () => {
            audio.tap();
            if (await ads.rewarded('offline')) finish(2);
            else toast(t('toast.adFail'), 'bad');
          },
        },
        h('span', { html: free ? ICONS.check : ICONS.video }),
        h('span', {}, t('offline.double')),
      ),
    ),
  );
  const m = modal(body, { title: t('offline.title'), className: 'offline-modal', onClose: () => (finish(1), onDone()) });
}

// ───────────── boost ─────────────

export function showBoost(onChange: () => void): void {
  const free = adFree();
  const left = h('div', { class: 'boost-left' });
  const btn = h('button', { class: 'btn btn-ad btn-wide' }) as HTMLButtonElement;
  const refresh = () => {
    const ms = store.data.boostUntil - Date.now();
    left.innerHTML = ms > 0 ? `${BADGE_ICONS.boost}<b>${t('boost.left', { t: duration(ms) })}</b>` : `${BADGE_ICONS.boost}<b>×1</b>`;
    const can = game.canAddBoost();
    btn.disabled = !can;
    btn.innerHTML = '';
    btn.append(h('span', { html: free ? ICONS.check : ICONS.video }), h('span', {}, can ? t('boost.add') : t('boost.full')));
  };
  btn.addEventListener('click', async () => {
    if (!game.canAddBoost()) return;
    audio.tap();
    if (await ads.rewarded('boost')) {
      game.addBoost(BOOST_HOURS_PER_AD);
      audio.boost();
      void haptic('success');
      refresh();
      onChange();
    } else toast(t('toast.adFail'), 'bad');
  });
  refresh();
  const timer = setInterval(refresh, 1000);
  const body = h('div', { class: 'modal-body boost-modal-body' }, h('div', { class: 'boost-hero', html: BADGE_ICONS.boost }), h('p', { class: 'modal-text' }, free ? t('boost.descFree') : t('boost.desc')), left, h('div', { class: 'boost-meter' }, h('div', { class: 'boost-meter-fill' })), btn);
  const meter = body.querySelector('.boost-meter-fill') as HTMLElement;
  const meterTick = () => (meter.style.transform = `scaleX(${Math.min(1, Math.max(0, store.data.boostUntil - Date.now()) / (BOOST_MAX_HOURS * 3_600_000))})`);
  meterTick();
  const mt = setInterval(meterTick, 1000);
  modal(body, { title: t('boost.title'), onClose: () => (clearInterval(timer), clearInterval(mt)) });
}

// ───────────── daily login ─────────────

export function showDailyLogin(onDone: () => void): void {
  const idx = loginClaimable();
  const streak = store.data.login.streak;
  const grid = h('div', { class: 'login-grid' });
  LOGIN_REWARDS.forEach((g, k) => {
    const state = idx < 0 ? (k <= store.data.login.day ? 'done' : 'future') : k < idx ? 'done' : k === idx ? 'today' : 'future';
    grid.append(h('div', { class: `login-day ld-${state} ${k === 6 ? 'big' : ''}` }, h('span', { class: 'ld-label' }, t('login.day', { n: k + 1 })), rewardChips(g, true), state === 'done' ? h('span', { class: 'ld-check', html: ICONS.check }) : ''));
  });
  const claim = h(
    'button',
    {
      class: 'btn btn-primary btn-wide',
      disabled: idx < 0,
      onclick: () => {
        const g = claimLogin(game);
        if (g) {
          audio.gold();
          void haptic('success');
          const r = claim.getBoundingClientRect();
          fx.confetti(r.left + r.width / 2, r.top, 50);
        }
        m.close();
      },
    },
    t('btn.claim'),
  );
  const body = h('div', { class: 'modal-body' }, streak >= 2 ? h('p', { class: 'streak' }, `🔥 ${t('login.streak', { n: streak })}`) : '', grid, claim);
  const m = modal(body, { title: t('login.title'), className: 'login-modal', onClose: onDone });
}

export function showClubGift(onDone: () => void): void {
  if (!clubGiftClaimable()) return onDone();
  const body = h(
    'div',
    { class: 'modal-body center' },
    h('div', { class: 'club-gift-art', html: BADGE_ICONS.club }),
    h('p', { class: 'modal-text' }, t('club.gift', { n: 30 })),
    h(
      'button',
      {
        class: 'btn btn-gold btn-wide',
        onclick: () => {
          claimClubGift(game);
          audio.gold();
          m.close();
        },
      },
      t('btn.claim'),
    ),
  );
  const m = modal(body, { title: t('club.title'), onClose: onDone });
}

// ───────────── quests ─────────────

export function showQuests(onChange: () => void): void {
  let m: { el: HTMLElement; close: () => void } | null = null;
  const render = (): HTMLElement => {
    const list = ensureQuests();
    const rows = list.map((q, k) => {
      const done = q.progress >= q.target;
      return h(
        'div',
        { class: `quest ${q.claimed ? 'claimed' : done ? 'ready' : ''}` },
        h('div', { class: 'quest-info' }, h('b', {}, t(`quest.${q.id}` as never, { n: q.target })), h('div', { class: 'q-bar' }, h('div', { class: 'q-fill', style: `transform:scaleX(${q.progress / q.target})` }), h('span', { class: 'q-num' }, `${q.progress}/${q.target}`))),
        q.claimed
          ? h('span', { class: 'tag tag-ok', html: ICONS.check })
          : h(
              'button',
              {
                class: 'btn btn-gold small',
                disabled: !done,
                onclick: () => {
                  if (claimQuest(game, k)) {
                    audio.gold();
                    onChange();
                    refresh();
                  }
                },
              },
              h('span', { class: 'btn-price', html: `${goldIcon(16)}${q.reward}` }),
            ),
      );
    });
    const chestOk = chestReady();
    const chest = h(
      'div',
      { class: `quest chest ${store.data.quests.chest ? 'claimed' : chestOk ? 'ready' : ''}` },
      h('div', { class: 'chest-ico', html: BADGE_ICONS.gift }),
      h('div', { class: 'quest-info' }, h('b', {}, t('quests.chest')), h('small', {}, t('quests.chestDesc')), rewardChips(QUEST_CHEST)),
      store.data.quests.chest
        ? h('span', { class: 'tag tag-ok', html: ICONS.check })
        : h(
            'button',
            {
              class: 'btn btn-primary small',
              disabled: !chestOk,
              onclick: (e: Event) => {
                if (claimChest(game)) {
                  audio.register();
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  fx.confetti(r.left + r.width / 2, r.top, 50);
                  onChange();
                  refresh();
                }
              },
            },
            t('btn.claim'),
          ),
    );
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return h('div', { class: 'modal-body quests' }, ...rows, chest, h('p', { class: 'fine' }, t('quests.reset', { t: duration(midnight.getTime() - Date.now()) })));
  };
  const refresh = () => m?.el.querySelector('.quests')?.replaceWith(render());
  m = modal(render(), { title: t('quests.title'), className: 'quests-modal' });
}

// ───────────── achievements ─────────────

function achLabel(a: Achievement): string {
  switch (a.kind) {
    case 'stand':
      return t('ach.stand', { biz: bizName(E.BUSINESSES[a.stand!].id), n: a.label });
    case 'festival':
      return t('ach.festival', { n: a.label });
    case 'district':
      return t('ach.district', { n: a.label });
    case 'lifetime':
      return t('ach.lifetime', { v: money(a.target) });
    default:
      return t(`ach.${a.kind}` as never, { n: a.label });
  }
}

function achIcon(a: Achievement): string {
  if (a.kind === 'stand') return foodSVG(E.BUSINESSES[a.stand!].id, 40);
  const map: Record<string, string> = { festival: BADGE_ICONS.trophy, district: BADGE_ICONS.districts, lifetime: coinIcon(36), hires: BADGE_ICONS.cats, seagulls: BADGE_ICONS.boost, ferries: BADGE_ICONS.districts, taps: BADGE_ICONS.stands };
  return map[a.kind] ?? BADGE_ICONS.trophy;
}

export function showAchievements(onChange: () => void): void {
  let m: { el: HTMLElement; close: () => void } | null = null;
  const render = (): HTMLElement => {
    const list = achievementList();
    const ready = list.filter(isDone).length;
    const claimAll =
      ready > 1
        ? h(
            'button',
            {
              class: 'btn btn-gold small claim-all',
              onclick: () => {
                if (claimAllAchievements(game)) {
                  audio.gold();
                  onChange();
                  refresh();
                }
              },
            },
            t('btn.claimAll'),
          )
        : '';
    return h(
      'div',
      { class: 'modal-body achs' },
      claimAll,
      ...list.map((a) => {
        const done = isDone(a);
        const prog = a.kind === 'lifetime' ? Math.min(1, Math.log10(Math.max(1, a.value)) / Math.log10(a.target)) : Math.min(1, a.value / a.target);
        return h(
          'div',
          { class: `ach ${done ? 'ready' : ''}` },
          h('div', { class: 'ach-ico', html: achIcon(a) }),
          h('div', { class: 'quest-info' }, h('b', {}, achLabel(a)), h('div', { class: 'q-bar' }, h('div', { class: 'q-fill', style: `transform:scaleX(${prog})` }))),
          h(
            'button',
            {
              class: 'btn btn-gold small',
              disabled: !done,
              onclick: () => {
                if (claimAchievement(game, a.id)) {
                  audio.gold();
                  onChange();
                  refresh();
                }
              },
            },
            h('span', { class: 'btn-price', html: `${goldIcon(16)}${a.reward}` }),
          ),
        );
      }),
    );
  };
  const refresh = () => m?.el.querySelector('.achs')?.replaceWith(render());
  m = modal(render(), { title: t('ach.title'), className: 'ach-modal' });
}

// ───────────── moving ─────────────

export function showMove(onConfirm: () => void): void {
  const d = store.data;
  const next = districtDef(d.district + 1);
  const names = districtNames(next.id);
  const newStand = E.standsIn(d.district + 1) > E.standsIn(d.district) ? E.BUSINESSES[E.standsIn(d.district)].id : null;
  const body = h(
    'div',
    { class: 'modal-body move' },
    h('div', { class: 'move-sky', html: skylineSVG(next, 'skyline mini') }),
    h(
      'ul',
      { class: 'perks big' },
      h('li', { html: `${tulipIcon(22)}<span>${t('districts.gain', { n: money(game.pendingLale(), 1) })}</span>` }),
      h('li', { html: `${BADGE_ICONS.districts}<span>${t('districts.badge')}</span>` }),
      newStand ? h('li', { html: `${foodSVG(newStand, 26)}<span>${t('districts.newStand', { biz: bizName(newStand) })}</span>` }) : '',
      h('li', { class: 'hl', html: `${ICONS.bolt}<b>${t('districts.income', { v: times(game.moveGain()).slice(1) })}</b>` }),
    ),
    h('p', { class: 'fine' }, t('districts.keep')),
    h('p', { class: 'fine warn' }, t('districts.reset')),
    h(
      'div',
      { class: 'modal-actions' },
      h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, t('btn.cancel')),
      h(
        'button',
        {
          class: 'btn btn-primary',
          onclick: () => {
            m.close();
            onConfirm();
          },
        },
        t('move.confirm'),
      ),
    ),
  );
  const m = modal(body, { title: t('move.title', names), className: 'move-modal' });
}

export function showWelcome(district: number, lale: number): void {
  const def = districtDef(district);
  const names = districtNames(def.id);
  const newStand = E.standsIn(district) > E.standsIn(district - 1) ? E.BUSINESSES[E.standsIn(district) - 1].id : null;
  const body = h(
    'div',
    { class: 'modal-body welcome' },
    h('div', { class: 'move-sky', html: skylineSVG(def, 'skyline mini') }),
    h('div', { class: 'welcome-cat', html: tekirSVG(96, 'happy') }),
    h('div', { class: 'welcome-gain', html: `${tulipIcon(26)}<b>+${money(lale, 1)}</b>` }),
    newStand ? h('p', { class: 'modal-text', html: `${t('districts.newStand', { biz: bizName(newStand) })}` }) : '',
    h('button', { class: 'btn btn-primary btn-wide', onclick: () => m.close() }, t('btn.continue')),
  );
  const m = modal(body, { title: t('move.welcome', names), className: 'welcome-modal' });
  setTimeout(() => fx.confetti(window.innerWidth / 2, window.innerHeight * 0.3, 90, 1.2), 150);
}

/** A little celebration card when a cat manager is hired for the first time. */
export function showHireCelebration(i: number): void {
  const body = h('div', { class: 'modal-body center hire' }, h('div', { class: 'hire-cat', html: catSVG(i, 150, 'happy') }), h('p', { class: 'modal-text' }, t(`cat.${i}` as never)), h('button', { class: 'btn btn-primary btn-wide', onclick: () => m.close() }, t('btn.continue')));
  const m = modal(body, { title: t('stand.working', { cat: ['Pamuk', 'Boncuk', 'Duman', 'Karamel', 'Fıstık', 'Zeytin', 'Paşa', 'Minnoş', 'Tarçın', 'Sultan'][i] }), className: 'hire-modal' });
}

// ───────────── purchases (demo builds) ─────────────

export function demoConfirm(p: Product): Promise<boolean> {
  const name = p.id.startsWith('gold_') ? t('product.gold', { n: p.grant.gold ?? 0 }) : p.id.startsWith('club') ? t('club.title') : t(`product.${p.id}` as never);
  return confirmDialog(t('demo.title'), t('demo.body', { p: name, price: iap.price(p.id) }), t('btn.ok'), t('btn.cancel'));
}

// ───────────── settings ─────────────

export function showSettings(onChange: () => void): void {
  const d = store.data;
  const toggle = (label: string, icon: string, get: () => boolean, set: (v: boolean) => void) => {
    const sw = h('button', { class: `switch ${get() ? 'on' : ''}`, role: 'switch', 'aria-checked': String(get()), 'aria-label': label });
    sw.addEventListener('click', () => {
      const v = !get();
      set(v);
      sw.classList.toggle('on', v);
      sw.setAttribute('aria-checked', String(v));
      audio.tap();
    });
    return h('div', { class: 'set-row' }, h('span', { class: 'set-ico', html: icon }), h('span', { class: 'set-label' }, label), sw);
  };
  const lang = h('select', { class: 'set-select', 'aria-label': t('settings.language') });
  for (const l of LANGS) {
    const o = h('option', { value: l.id }, l.name);
    if (l.id === currentLang()) o.selected = true;
    lang.append(o);
  }
  lang.addEventListener('change', () => {
    store.update((s) => {
      s.settings.lang = (lang as HTMLSelectElement).value;
    });
    setLang((lang as HTMLSelectElement).value);
    m.close();
    onChange();
  });
  const link = (label: string, icon: string, href: string) => h('a', { class: 'set-row link', href, target: '_blank', rel: 'noopener' }, h('span', { class: 'set-ico', html: icon }), h('span', { class: 'set-label' }, label), h('span', { class: 'set-go', html: ICONS.arrow }));
  const stat = (label: string, value: string) => h('div', { class: 'stat' }, h('small', {}, label), h('b', {}, value));
  const body = h(
    'div',
    { class: 'modal-body settings' },
    toggle(
      t('settings.sound'),
      ICONS.sound,
      () => d.settings.sound,
      (v) => {
        store.update((s) => (s.settings.sound = v));
        audio.setSfx(v);
      },
    ),
    toggle(
      t('settings.music'),
      ICONS.music,
      () => d.settings.music,
      (v) => {
        store.update((s) => (s.settings.music = v));
        audio.setMusic(v);
      },
    ),
    toggle(
      t('settings.haptics'),
      ICONS.vibrate,
      () => d.settings.haptics,
      (v) => store.update((s) => (s.settings.haptics = v)),
    ),
    toggle(
      t('settings.notifications'),
      ICONS.bell,
      () => d.settings.notifications,
      (v) => {
        store.update((s) => (s.settings.notifications = v));
        if (v) void requestNotifications();
      },
    ),
    h('div', { class: 'set-row' }, h('span', { class: 'set-ico', html: ICONS.globe }), h('span', { class: 'set-label' }, t('settings.language')), lang),
    h('h3', { class: 'section-title' }, t('settings.stats')),
    h('div', { class: 'stats' }, stat(t('stats.lifetime'), money(d.lifetime)), stat(t('stats.played'), duration(d.stats.playSeconds * 1000)), stat(t('stats.districts'), String(d.district)), stat(t('stats.lale'), money(d.lale, 1))),
    h('h3', { class: 'section-title' }, ''),
    link(t('settings.privacy'), ICONS.shield, CONFIG.privacyUrl),
    link(t('settings.terms'), ICONS.doc, CONFIG.termsUrl),
    link(t('settings.support'), ICONS.mail, `mailto:${CONFIG.supportEmail}?subject=Simit%20Tycoon`),
    isNative ? h('button', { class: 'set-row link', onclick: () => void ads.privacyOptions() }, h('span', { class: 'set-ico', html: ICONS.shield }), h('span', { class: 'set-label' }, t('settings.privacyChoices')), h('span', { class: 'set-go', html: ICONS.arrow })) : '',
    h(
      'button',
      {
        class: 'set-row link danger',
        onclick: async () => {
          if (await confirmDialog(t('settings.reset'), t('settings.resetConfirm'), t('settings.reset'), t('btn.cancel'))) {
            store.reset();
            location.reload();
          }
        },
      },
      h('span', { class: 'set-ico', html: ICONS.trash }),
      h('span', { class: 'set-label' }, t('settings.reset')),
    ),
    h('p', { class: 'version' }, `Simit Tycoon v${__APP_VERSION__} · ${CONFIG.studio}`),
  );
  const m = modal(body, { title: t('settings.title'), className: 'settings-modal' });
}
