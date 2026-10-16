import { CONFIG } from '../config';
import { EXAMS, parseLocal } from '../core/exams';
import { dateFmt, t, type Key } from '../i18n';
import { PRODUCTS, type Product } from '../meta/catalog';
import { isPremium, profile, store } from '../meta/state';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { haptic, track } from '../services/platform';
import { ICONS, tekirSVG, tulipSVG } from './art';
import { h } from './dom';
import { confirmDialog, modal, toast } from './modal';
import { VARIETY_BY_ID } from '../core/garden';

/** Plans that make sense right now: the season pass only for its own exam and before it ends. */
export function plansFor(now = Date.now()): Product[] {
  const exam = profile().exam;
  return PRODUCTS.filter((p) => p.kind !== 'season' || (p.exam === exam && p.until && parseLocal(p.until).getTime() > now));
}

function savings(): number | null {
  const y = iap.amount('lale_yearly');
  const m = iap.amount('lale_monthly');
  if (!y || !m || y.currency !== m.currency || !m.value) return null;
  const s = Math.round((1 - y.value / (m.value * 12)) * 100);
  return s >= 10 ? s : null;
}

let open = false;

/** Lale Bahçıvan sheet. `source` is only used for the local funnel counter. */
export function showPaywall(source: string): void {
  if (open) return;
  open = true;
  track('paywall_view', { source });
  const body = h('div', { class: 'modal-body paywall' });
  modal(body, { className: 'paywall-card', onClose: () => (open = false) });
  const render = () => {
    if (isPremium()) return body.replaceChildren(activeView());
    body.replaceChildren(...offerView(render));
  };
  render();
  const unsub = store.subscribe(() => {
    if (!document.body.contains(body)) return unsub();
    render();
  });
}

function activeView(): HTMLElement {
  const p = store.data.premium;
  const lifetime = p.owned.includes('lale_lifetime');
  const until = !lifetime && !p.subscription && p.seasonUntil > Date.now() ? dateFmt(new Date(p.seasonUntil), { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return h(
    'div',
    { class: 'center stack-sm' },
    h('div', { class: 'paywall-hero', html: tekirSVG(120, 'happy', 'tulip') }),
    h('h2', {}, t('paywall.active')),
    until ? h('p', { class: 'muted' }, t('paywall.until', { date: until })) : null,
    h('ul', { class: 'features' }, ...features()),
  );
}

function features(): HTMLElement[] {
  const icons = [ICONS.garden, ICONS.star, ICONS.sound, ICONS.stats, ICONS.target, ICONS.doc];
  return [1, 2, 3, 4, 5, 6].map((i) => h('li', {}, h('span', { class: 'feat-ico', html: icons[i - 1] }), t(`paywall.f${i}` as Key)));
}

function offerView(rerender: () => void): HTMLElement[] {
  const plans = plansFor();
  let selected = plans.find((p) => p.kind === 'season')?.id ?? 'lale_yearly';
  const save = savings();
  const exam = EXAMS[profile().exam].short;
  const heroTulips = ['cini', 'altinvarak', 'mehtap', 'lacivert', 'gokkusagi'].map((id, i) => h('span', { class: `pw-tulip t${i}`, html: tulipSVG(VARIETY_BY_ID.get(id)!, { size: 46, seed: i }) }));

  const planEls = plans.map((p) => {
    const title = p.kind === 'season' ? t('paywall.season', { exam }) : p.kind === 'lifetime' ? t('paywall.lifetime') : p.period === 'year' ? t('paywall.yearly') : t('paywall.monthly');
    const desc =
      p.kind === 'season'
        ? t('paywall.seasonDesc')
        : p.kind === 'lifetime'
          ? t('paywall.lifetimeDesc')
          : p.period === 'year'
            ? `${t('paywall.perMonth', { price: iap.perMonth(p.id) })} · ${t('paywall.yearlyDesc', { n: p.trialDays ?? 7, price: iap.price(p.id) })}`
            : t('paywall.monthlyDesc');
    const badge = p.badge === 'best' ? (save ? t('paywall.save', { n: save }) : t('paywall.best')) : p.badge === 'season' ? t('paywall.seasonBadge') : null;
    return h(
      'button',
      {
        class: `plan ${p.badge ?? ''}`,
        role: 'radio',
        'data-id': p.id,
        'aria-checked': String(p.id === selected),
        onclick: () => {
          haptic('select');
          selected = p.id;
          for (const el of planEls) el.setAttribute('aria-checked', String(el.dataset.id === selected));
          updateCta();
        },
      },
      h('span', { class: 'radio' }),
      h('span', { class: 'plan-main' }, h('b', {}, title), h('small', {}, desc)),
      h('span', { class: 'plan-price' }, iap.price(p.id)),
      badge ? h('span', { class: 'plan-badge' }, badge) : null,
    );
  });

  const cta = h('button', { class: 'btn btn-primary btn-wide btn-lg' });
  const updateCta = () => {
    const p = plans.find((x) => x.id === selected)!;
    cta.textContent = p.trialDays ? t('paywall.trialCta', { n: p.trialDays }) : `${t('paywall.buy')} · ${iap.price(p.id)}`;
  };
  updateCta();
  let busy = false;
  cta.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    cta.disabled = true;
    audio.tap();
    const res = await iap.purchase(selected);
    busy = false;
    cta.disabled = false;
    if (res === 'ok') {
      audio.rare();
      haptic('success');
      toast(t('paywall.thanks'), 'good');
      rerender();
    } else if (res === 'pending') toast(t('paywall.pending'));
    else if (res === 'unavailable') toast(t('paywall.unavailable'));
    else if (res === 'failed') toast(t('paywall.failed'));
  });

  const restore = h('button', {
    class: 'link',
    onclick: async () => {
      const ok = await iap.restore();
      toast(ok ? t('settings.restored') : t('settings.nothing'), ok ? 'good' : 'info');
    },
  }, t('settings.restore'));

  return [
    h('div', { class: 'paywall-hero' }, h('div', { class: 'pw-tulips' }, ...heroTulips), h('div', { class: 'pw-cat', html: tekirSVG(96, 'happy', 'can') })),
    h('h2', { class: 'center' }, t('paywall.title')),
    h('p', { class: 'muted center' }, t('paywall.sub')),
    h('ul', { class: 'features' }, ...features()),
    h('div', { class: 'plans', role: 'radiogroup' }, ...planEls),
    cta,
    h('p', { class: 'muted tiny center' }, t('paywall.family')),
    h('p', { class: 'free-note' }, h('span', { html: ICONS.check }), t('paywall.free')),
    h('div', { class: 'row center gap legal-links' }, restore, h('a', { class: 'link', href: CONFIG.termsUrl, target: '_blank', rel: 'noopener' }, t('settings.terms')), h('a', { class: 'link', href: CONFIG.privacyUrl, target: '_blank', rel: 'noopener' }, t('settings.privacy'))),
    h('p', { class: 'muted tiny' }, t('paywall.legal')),
  ];
}

/** Demo purchases ask first, so nobody thinks money changed hands. */
iap.demoConfirm = () => confirmDialog(t('paywall.title'), t('paywall.demoQ'), t('common.continue'), t('common.cancel'));
