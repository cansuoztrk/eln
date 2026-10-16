import { rarityFor, VARIETY_BY_ID, type Variety } from '../core/garden';
import { clock, elapsed, progress, remaining, type Running } from '../core/timer';
import { currentLang, t, type Key } from '../i18n';
import { subjectName } from '../meta/actions';
import { isPremium, store } from '../meta/state';
import { AMBIENTS, audio, FREE_AMBIENTS, type Ambient } from '../services/audio';
import { haptic } from '../services/platform';
import { ICONS, tekirSVG, tulipSVG } from './art';
import { h } from './dom';
import { modal } from './modal';

const PREVIEW: Record<string, string> = { common: 'kirmizi', uncommon: 'gulhane', rare: 'istanbul', epic: 'laledevri' };

export interface SessionCallbacks {
  pause(): void;
  resume(): void;
  giveUp(): void;
  finish(): void;
  skipBreak(): void;
  paywall(): void;
}

/** Full-screen view while a focus or break phase is running. */
export class SessionView {
  readonly el = h('section', { class: 'session' });
  private timeEl = h('div', { class: 'session-time' });
  private ringEl = h('div', { class: 'session-ring' });
  private plantEl = h('div', { class: 'session-plant' });
  private controls = h('div', { class: 'session-controls' });
  private lastGrowth = -1;
  private tip = 1 + Math.floor(Math.random() * 5);
  private tipTimer = 0;
  private variety: Variety;

  constructor(private r: Running, private cb: SessionCallbacks) {
    const minutes = r.planned ? r.planned / 60 : 90;
    this.variety = VARIETY_BY_ID.get(PREVIEW[rarityFor(minutes) ?? 'common'])!;
    this.build();
    this.tipTimer = window.setInterval(() => {
      this.tip = (this.tip % 5) + 1;
      const el = this.el.querySelector('.session-tip');
      if (el) el.textContent = t(`session.tip.${this.tip}` as Key);
    }, 45_000);
  }

  destroy(): void {
    clearInterval(this.tipTimer);
  }

  update(r: Running): void {
    const pausedChanged = !!r.pausedAt !== !!this.r.pausedAt;
    this.r = r;
    if (pausedChanged) this.build();
    this.tick();
  }

  private build(): void {
    const r = this.r;
    const focus = r.phase === 'focus';
    const lang = currentLang();
    this.lastGrowth = -1;
    const top = h(
      'div',
      { class: 'session-top' },
      h('span', { class: 'chip on-dark' }, focus ? subjectName(r.subject, lang) : t('session.break')),
      r.strict && focus ? h('span', { class: 'badge strict', html: `${ICONS.lock}<span>${t('session.strictOn')}</span>` }) : null,
      h('span', { class: 'spacer' }),
      h('button', { class: 'icon-btn ghost-dark', 'aria-label': t('session.ambient'), html: audio.ambient ? ICONS.sound : ICONS.mute, onclick: () => this.ambientSheet() }),
    );
    const status = r.pausedAt ? t('session.paused') : focus ? t('session.focus') : t('session.break');
    this.controls.replaceChildren(
      ...(focus
        ? [
            h('button', { class: 'btn btn-ghost-dark', onclick: () => this.cb.giveUp() }, t('session.giveUp')),
            r.planned === 0
              ? h('button', { class: 'btn btn-light', html: `${ICONS.check}<span>${t('session.finish')}</span>`, onclick: () => this.cb.finish() })
              : r.pausedAt
                ? h('button', { class: 'btn btn-light', html: `${ICONS.play}<span>${t('session.resume')}</span>`, onclick: () => this.cb.resume() })
                : h('button', { class: 'btn btn-light', html: `${ICONS.pause}<span>${t('session.pause')}</span>`, onclick: () => this.cb.pause() }),
          ]
        : [h('button', { class: 'btn btn-light btn-wide', onclick: () => this.cb.skipBreak() }, t('session.skipBreak'))]),
    );
    if (focus && r.planned === 0 && r.pausedAt === null) {
      // Stopwatch: pause lives next to the time.
    }
    this.el.className = `session ${focus ? 'phase-focus' : 'phase-break'} ${r.pausedAt ? 'paused' : ''}`;
    this.el.replaceChildren(
      top,
      h(
        'div',
        { class: 'session-main' },
        h('div', { class: 'session-status' }, status),
        h('div', { class: 'session-stage' }, this.ringEl, focus ? this.plantEl : h('div', { class: 'session-plant', html: tekirSVG(170, 'sleep', 'none') })),
        this.timeEl,
        h('p', { class: 'session-tip' }, focus ? t(`session.tip.${this.tip}` as Key) : ''),
      ),
      this.controls,
    );
    this.tick();
  }

  tick(): void {
    const now = Date.now();
    const r = this.r;
    const focus = r.phase === 'focus';
    this.timeEl.textContent = r.planned ? clock(remaining(r, now)) : clock(elapsed(r, now));
    const p = progress(r, now);
    const R = 132;
    const C = 2 * Math.PI * R;
    this.ringEl.innerHTML = `<svg viewBox="0 0 300 300" width="300" height="300"><circle cx="150" cy="150" r="${R}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="8"/><circle cx="150" cy="150" r="${R}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 150 150)" opacity=".92"/></svg>`;
    if (focus) {
      // For the stopwatch the tulip tier follows the time already focused.
      if (!r.planned) {
        const tier = rarityFor(elapsed(r, now) / 60) ?? 'common';
        const v = VARIETY_BY_ID.get(PREVIEW[tier])!;
        if (v.id !== this.variety.id) {
          this.variety = v;
          this.lastGrowth = -1;
        }
      }
      const g = Math.round((r.planned ? p : Math.min(1, elapsed(r, now) / (25 * 60))) * 40) / 40;
      if (g !== this.lastGrowth) {
        this.lastGrowth = g;
        this.plantEl.innerHTML = tulipSVG(this.variety, { size: 150, growth: Math.max(0.04, g), seed: 5 });
      }
    }
    document.title = `${this.timeEl.textContent} · Lale`;
  }

  private ambientSheet(): void {
    const premium = isPremium();
    const body = h('div', { class: 'modal-body' });
    const render = () => {
      const cur = audio.ambient;
      body.replaceChildren(
        h(
          'div',
          { class: 'ambient-grid' },
          h('button', { class: 'amb', 'aria-pressed': String(!cur), onclick: () => pick(null) }, h('span', { class: 'amb-ico', html: ICONS.mute }), t('amb.none')),
          ...AMBIENTS.map((a) => {
            const locked = !premium && !FREE_AMBIENTS.includes(a);
            return h('button', { class: `amb ${locked ? 'locked' : ''}`, 'aria-pressed': String(cur === a), onclick: () => (locked ? this.cb.paywall() : pick(a)) }, h('span', { class: 'amb-ico', html: locked ? ICONS.lock : ICONS.sound }), t(`amb.${a}` as Key));
          }),
        ),
        h(
          'label',
          { class: 'field' },
          h('label', {}, t('session.volume')),
          h('input', {
            type: 'range',
            min: '0',
            max: '1',
            step: '0.05',
            value: String(store.data.settings.volume),
            oninput: (e: Event) => {
              const v = Number((e.target as HTMLInputElement).value);
              store.quiet((d) => {
                d.settings.volume = v;
              });
              audio.playAmbient(audio.ambient, v);
            },
          }),
        ),
      );
    };
    const pick = (a: Ambient | null) => {
      haptic('select');
      audio.playAmbient(a);
      store.update((d) => {
        d.settings.ambient = a;
      });
      render();
      this.build();
    };
    render();
    modal(body, { title: t('session.ambient') });
  }
}
