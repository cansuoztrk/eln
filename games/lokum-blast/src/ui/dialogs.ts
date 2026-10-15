import { CONFIG } from '../config';
import { currentLang, duration, LANGS, num, setLang, t } from '../i18n';
import { PRODUCT_BY_ID, type Grant, type Product } from '../meta/catalog';
import { claimLogin, loginClaimable, LOGIN_REWARDS, adSpinsLeft, consumeSpin, freeSpinAvailable, grantWheel, rollWheel, WHEEL, wheelOdds, claimVipGift } from '../meta/daily';
import { addLives, boosterPackPrice, buyBooster, LIFE_REFILL_PRICE, lives, MAX_LIVES, msToNextLife, spendCoins, unlimitedLives } from '../meta/economy';
import { store, type BoosterId } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { requestNotifications } from '../services/notify';
import { haptic, isNative } from '../services/platform';
import { BOOSTER_ART, coinIcon, heartIcon, ICONS, tekirSVG } from './art';
import { boosterName, grantChips } from './chrome';
import { h } from './dom';
import { confirmDialog, modal, toast } from './modal';

// ───────────── reward popup ─────────────

export function showReward(title: string, g: Grant, onDone?: () => void): void {
  audio.purchase();
  void haptic('success');
  const m = modal(
    h('div', { class: 'modal-body center' }, h('div', { class: 'reward-burst' }), grantChips(g), h('button', { class: 'btn btn-primary btn-wide', onclick: () => (audio.tap(), m.close()) }, t('btn.claim'))),
    { title, className: 'reward-modal', onClose: onDone },
  );
}

// ───────────── settings ─────────────

export function showSettings(onReset: () => void, onLangChange: () => void): void {
  const s = store.data.settings;
  const toggle = (icon: string, label: string, get: () => boolean, set: (v: boolean) => void) => {
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
  const langSel = h('select', { class: 'set-select', 'aria-label': t('settings.language') });
  for (const l of LANGS) {
    const o = h('option', { value: l.id }, l.name);
    if (l.id === currentLang()) o.selected = true;
    langSel.append(o);
  }
  langSel.addEventListener('change', () => {
    store.update((d) => {
      d.settings.lang = langSel.value;
    });
    setLang(langSel.value);
    m.close();
    onLangChange();
  });
  const link = (icon: string, label: string, fn: () => void) =>
    h('button', { class: 'set-row set-link', onclick: () => (audio.tap(), fn()) }, h('span', { class: 'set-ico', html: icon }), h('span', { class: 'set-label' }, label), h('span', { class: 'set-chev' }, '›'));

  const body = h(
    'div',
    { class: 'modal-body settings' },
    toggle(ICONS.sound, t('settings.sound'), () => s.sound, (v) => store.update((d) => { d.settings.sound = v; audio.setSfx(v); })),
    toggle(ICONS.music, t('settings.music'), () => s.music, (v) => store.update((d) => { d.settings.music = v; audio.setMusic(v); })),
    toggle(ICONS.vibrate, t('settings.haptics'), () => s.haptics, (v) => store.update((d) => { d.settings.haptics = v; })),
    isNative
      ? toggle(ICONS.bell, t('settings.notifications'), () => s.notifications, (v) => {
          store.update((d) => {
            d.settings.notifications = v;
          });
          if (v) void requestNotifications();
        })
      : null,
    h('div', { class: 'set-row' }, h('span', { class: 'set-ico', html: ICONS.globe }), h('span', { class: 'set-label' }, t('settings.language')), langSel),
    h('div', { class: 'set-sep' }),
    link(ICONS.restore, t('shop.restore'), async () => {
      const ok = await iap.restore();
      toast(ok ? t('toast.restored') : t('toast.restore_none'), ok ? 'good' : 'info');
    }),
    isNative ? link(ICONS.shield, t('settings.consent'), () => void ads.privacyOptions()) : null,
    link(ICONS.doc, t('settings.privacy'), () => window.open(CONFIG.privacyUrl, '_blank')),
    link(ICONS.doc, t('settings.terms'), () => window.open(CONFIG.termsUrl, '_blank')),
    link(ICONS.mail, t('settings.support'), () => window.open(`mailto:${CONFIG.supportEmail}?subject=Lokum%20Blast`, '_blank')),
    link(ICONS.trash, t('settings.reset'), async () => {
      if (await confirmDialog(t('settings.reset'), t('settings.reset.confirm'), t('btn.ok'), t('btn.cancel'))) {
        m.close();
        onReset();
      }
    }),
    h('div', { class: 'set-foot' }, `${CONFIG.appName} • ${t('settings.version')} ${__APP_VERSION__} • © ${CONFIG.studio}`),
  );
  const m = modal(body, { title: t('settings.title'), className: 'settings-modal' });
}

// ───────────── lives ─────────────

export function showLives(onChange: () => void): void {
  const l = lives();
  const hearts = h('div', { class: 'hearts' });
  for (let i = 0; i < MAX_LIVES; i++) hearts.append(h('span', { class: i < l ? 'on' : 'off', html: heartIcon(36) }));
  const status = h('p', { class: 'modal-text' }, unlimitedLives() ? t('lives.unlimited') : l >= MAX_LIVES ? t('lives.allfull') : t('lives.next', { t: duration(msToNextLife()) }));
  const actions = h('div', { class: 'modal-actions col' });
  if (!unlimitedLives() && l < MAX_LIVES) {
    actions.append(
      h(
        'button',
        {
          class: 'btn btn-primary',
          onclick: () => {
            if (!spendCoins(LIFE_REFILL_PRICE)) return toast(t('toast.nocoins'), 'bad');
            addLives(MAX_LIVES);
            audio.purchase();
            m.close();
            onChange();
          },
        },
        t('lives.refill'),
        h('span', { class: 'btn-price', html: `${coinIcon(20)} ${num(LIFE_REFILL_PRICE)}` }),
      ),
      h(
        'button',
        {
          class: 'btn btn-video',
          onclick: async () => {
            if (await ads.rewarded('life')) {
              addLives(1);
              toast(t('toast.reward'), 'good');
              m.close();
              onChange();
            } else toast(t('ad.unavailable'));
          },
        },
        h('span', { class: 'btn-ico', html: ICONS.video }),
        t('lives.ad'),
      ),
    );
  }
  const m = modal(h('div', { class: 'modal-body center' }, hearts, status, actions), { title: t('lives.title') });
}

// ───────────── daily login calendar ─────────────

export function showDailyLogin(onDone: () => void): void {
  const today = loginClaimable();
  const grid = h('div', { class: 'login-grid' });
  LOGIN_REWARDS.forEach((g, i) => {
    const claimed = today >= 0 ? i < today : i <= store.data.login.day;
    const cls = `login-day ${i === today ? 'today' : ''} ${claimed ? 'claimed' : ''} ${i === 6 ? 'big' : ''}`;
    grid.append(
      h(
        'div',
        { class: cls },
        h('div', { class: 'login-day-n' }, t('login.day', { n: i + 1 })),
        h('div', { class: 'login-day-ico', html: i === 6 ? ICONS.gift : coinIcon(30) }),
        h('div', { class: 'login-day-val' }, num(g.coins ?? 0)),
        claimed ? h('div', { class: 'login-check', html: ICONS.check }) : null,
      ),
    );
  });
  const streak = store.data.login.streak;
  const body = h(
    'div',
    { class: 'modal-body center' },
    h('div', { class: 'mascot-sm', html: tekirSVG(96, 'happy', false) }),
    streak >= 2 ? h('div', { class: 'streak' }, `🔥 ${t('login.streak', { n: streak })}`) : null,
    grid,
    today >= 0
      ? h(
          'button',
          {
            class: 'btn btn-primary btn-wide',
            onclick: () => {
              const g = claimLogin();
              m.close();
              if (g) showReward(t('login.title'), g, onDone);
            },
          },
          t('login.claim'),
        )
      : h('p', { class: 'modal-text' }, t('login.comeback')),
  );
  const m = modal(body, { title: t('login.title'), className: 'login-modal', onClose: today < 0 ? onDone : undefined });
}

// ───────────── wheel ─────────────

export function showWheel(onChange: () => void): void {
  const n = WHEEL.length;
  const seg = 360 / n;
  const size = 280;
  const r = size / 2;
  const parts: string[] = [];
  WHEEL.forEach((p, i) => {
    const a0 = ((i * seg - 90 - seg / 2) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - 90 - seg / 2) * Math.PI) / 180;
    const x0 = r + r * Math.cos(a0);
    const y0 = r + r * Math.sin(a0);
    const x1 = r + r * Math.cos(a1);
    const y1 = r + r * Math.sin(a1);
    parts.push(`<path d="M${r} ${r}L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}z" fill="${p.color}" stroke="#fff" stroke-width="3"/>`);
    const am = ((i * seg - 90) * Math.PI) / 180;
    const tx = r + r * 0.66 * Math.cos(am);
    const ty = r + r * 0.66 * Math.sin(am);
    const label = /^\d+$/.test(p.label) ? `<text x="${tx}" y="${ty + 7}" text-anchor="middle" font-family="'Baloo 2',sans-serif" font-weight="800" font-size="22" fill="#fff" stroke="#3b1255" stroke-width="4" paint-order="stroke" transform="rotate(${i * seg} ${tx} ${ty})">${p.label}</text>` : `<g transform="translate(${tx - 17} ${ty - 17}) rotate(${i * seg} 17 17) scale(.72)">${BOOSTER_ART[p.label].replace(/<\/?svg[^>]*>/g, '')}</g>`;
    parts.push(label);
  });
  const wheel = h('div', { class: 'wheel', html: `<svg viewBox="0 0 ${size} ${size}" width="100%">${parts.join('')}<circle cx="${r}" cy="${r}" r="${r - 2}" fill="none" stroke="#c56a00" stroke-width="6"/><circle cx="${r}" cy="${r}" r="24" fill="#ffd447" stroke="#c56a00" stroke-width="4"/></svg>` });
  const pointer = h('div', { class: 'wheel-pointer' });
  const btn = h('button', { class: 'btn btn-primary btn-wide' });
  const odds = h('details', { class: 'odds' }, h('summary', {}, t('wheel.odds')), h('div', {}, wheelOdds().map((o) => `${/^\d+$/.test(o.label) ? `${o.label} 🪙` : boosterName(o.label as BoosterId)}: %${o.pct}`).join(' • ')));
  let rotation = 0;
  let spinning = false;

  const refresh = () => {
    btn.innerHTML = '';
    if (freeSpinAvailable()) btn.append(t('wheel.free'));
    else if (adSpinsLeft() > 0) {
      btn.className = 'btn btn-video btn-wide';
      btn.append(h('span', { class: 'btn-ico', html: ICONS.video }), t('wheel.ad', { n: adSpinsLeft() }));
    } else {
      btn.className = 'btn btn-ghost btn-wide';
      btn.append(t('wheel.tomorrow'));
      btn.disabled = true;
    }
  };
  btn.addEventListener('click', async () => {
    if (spinning) return;
    audio.unlock();
    const free = freeSpinAvailable();
    if (!free) {
      if (adSpinsLeft() <= 0) return;
      if (!(await ads.rewarded('wheel'))) return toast(t('ad.unavailable'));
    }
    consumeSpin(free ? 'free' : 'ad');
    spinning = true;
    const idx = rollWheel();
    const target = 360 * 6 + (360 - idx * seg);
    rotation = rotation - (rotation % 360) + target;
    const svg = wheel.firstElementChild as SVGElement;
    svg.style.transition = 'transform 4.2s cubic-bezier(.12,.75,.12,1)';
    svg.style.transform = `rotate(${rotation}deg)`;
    let ticks = 0;
    const tick = setInterval(() => {
      ticks++;
      audio.tick();
      if (ticks > 26) clearInterval(tick);
    }, 140);
    setTimeout(() => {
      spinning = false;
      clearInterval(tick);
      const g = grantWheel(idx);
      refresh();
      onChange();
      showReward(t('wheel.won'), g);
    }, 4400);
  });
  refresh();
  modal(h('div', { class: 'modal-body center' }, h('div', { class: 'wheel-wrap' }, wheel, pointer), btn, odds), { title: t('wheel.title'), className: 'wheel-modal' });
}

// ───────────── booster purchase ─────────────

export function showBuyBooster(id: BoosterId, onBought: () => void): void {
  const buy = (qty: number) => {
    if (!buyBooster(id, qty)) return toast(t('toast.nocoins'), 'bad');
    audio.purchase();
    m.close();
    onBought();
  };
  const m = modal(
    h(
      'div',
      { class: 'modal-body center' },
      h('div', { class: 'booster-big', html: BOOSTER_ART[id] }),
      h('p', { class: 'modal-text' }, t(`booster.${id}.desc` as never)),
      h(
        'div',
        { class: 'modal-actions col' },
        h('button', { class: 'btn btn-primary', onclick: () => buy(3) }, t('booster.buy3', { n: '' }), h('span', { class: 'btn-price', html: `${coinIcon(20)} ${num(boosterPackPrice(id, 3))}` })),
        h('button', { class: 'btn btn-secondary', onclick: () => buy(1) }, t('booster.buy1', { n: '' }), h('span', { class: 'btn-price', html: `${coinIcon(20)} ${num(boosterPackPrice(id, 1))}` })),
        h(
          'button',
          {
            class: 'btn btn-video',
            onclick: async () => {
              if (await ads.rewarded('booster')) {
                store.update((d) => {
                  d.boosters[id]++;
                });
                m.close();
                onBought();
              } else toast(t('ad.unavailable'));
            },
          },
          h('span', { class: 'btn-ico', html: ICONS.video }),
          `+1 ${boosterName(id)}`,
        ),
      ),
    ),
    { title: t('booster.out', { name: boosterName(id) }) },
  );
}

// ───────────── starter offer ─────────────

export function showStarterOffer(onBuy: (id: string) => void): void {
  const p = PRODUCT_BY_ID.starter_pack;
  const left = Math.max(0, store.data.starterOfferUntil - Date.now());
  const m = modal(
    h(
      'div',
      { class: 'modal-body center' },
      h('div', { class: 'offer-ribbon' }, t('offer.value')),
      h('div', { class: 'mascot-sm', html: tekirSVG(110, 'happy', true) }),
      grantChips(p.grant),
      h('p', { class: 'modal-sub' }, t('offer.starter.sub', { t: duration(left) })),
      h('button', { class: 'btn btn-buy btn-wide', onclick: () => (m.close(), onBuy(p.id)) }, iap.price(p.id)),
    ),
    { title: t('offer.starter.title'), className: 'offer-modal' },
  );
}

// ───────────── notification pre-permission ─────────────

export function askNotifications(): void {
  if (!isNative) return;
  const m = modal(
    h(
      'div',
      { class: 'modal-body center' },
      h('div', { class: 'mascot-sm', html: tekirSVG(100, 'idle', false) }),
      h('p', { class: 'modal-text' }, t('notif.ask.body')),
      h(
        'div',
        { class: 'modal-actions col' },
        h('button', { class: 'btn btn-primary', onclick: async () => { m.close(); await requestNotifications(); } }, t('notif.ask.yes')),
        h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, t('notif.ask.no')),
      ),
    ),
    { title: t('notif.ask.title') },
  );
}

// ───────────── demo purchase confirm (web builds) ─────────────

export function demoConfirm(p: Product): Promise<boolean> {
  return confirmDialog(t('demo.title'), t('demo.body', { name: t(`product.${p.id}` as never), price: iap.price(p.id) }), t('demo.confirm'), t('btn.cancel'));
}

export function showVipGift(onDone: () => void): void {
  const g = claimVipGift();
  if (g) showReward(t('vip.gift'), g, onDone);
  else onDone();
}
