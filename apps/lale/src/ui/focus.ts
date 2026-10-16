import { rarityFor, VARIETY_BY_ID } from '../core/garden';
import { minutesOn, questionsOn } from '../core/records';
import { dayKey } from '../core/streak';
import { clock, type Mode } from '../core/timer';
import { currentLang, dur, t, type Key } from '../i18n';
import { subjects } from '../meta/actions';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { ICONS, tulipSVG } from './art';
import { h } from './dom';

const PREVIEW: Record<string, string> = { common: 'kirmizi', uncommon: 'gulhane', rare: 'istanbul', epic: 'laledevri' };
const DIAL_MAX = 120;

/** Focus tab: pick a mode, a length and a subject, then start. */
export class FocusScreen {
  readonly el = h('section', { class: 'screen focus' });
  private unsub: () => void;
  private dragging = false;

  constructor(private onStart: () => void) {
    this.unsub = store.subscribe(() => !this.dragging && this.render());
    this.render();
  }

  destroy(): void {
    this.unsub();
  }

  private minutes(): number {
    const tm = store.data.timer;
    return tm.mode === 'pomodoro' ? tm.pomodoro.focus : tm.minutes;
  }

  private setMinutes(m: number): void {
    store.quiet((d) => {
      if (d.timer.mode === 'pomodoro') d.timer.pomodoro.focus = Math.max(10, Math.min(90, m));
      else d.timer.minutes = Math.max(5, Math.min(DIAL_MAX, m));
    });
  }

  render(): void {
    const d = store.data;
    const tm = d.timer;
    const lang = currentLang();
    const subs = subjects();
    if (!subs.some((s) => s.id === tm.subject) && tm.subject !== 'general') {
      store.quiet((x) => {
        x.timer.subject = subs[0]?.id ?? 'general';
      });
    }
    const today = dayKey(Date.now());
    const mins = minutesOn(d.sessions, today);
    const qs = questionsOn(d.questions, today);

    const modes: Mode[] = ['pomodoro', 'timer', 'stopwatch'];
    const seg = h(
      'div',
      { class: 'seg', role: 'tablist' },
      ...modes.map((m) =>
        h('button', { 'aria-pressed': String(tm.mode === m), onclick: () => this.setMode(m) }, t(`mode.${m}` as Key)),
      ),
    );

    const dial = this.dial();
    const help =
      tm.mode === 'stopwatch'
        ? t('focus.stopwatchHelp')
        : tm.mode === 'pomodoro'
          ? t('focus.pomodoroHelp', { f: tm.pomodoro.focus, s: tm.pomodoro.short, l: tm.pomodoro.long, e: tm.pomodoro.every })
          : t('focus.drag');

    const chips = h(
      'div',
      { class: 'chips', role: 'listbox', 'aria-label': t('focus.subject') },
      ...subs.map((s) =>
        h(
          'button',
          {
            class: 'chip',
            style: `--h:${s.hue}`,
            'aria-pressed': String(tm.subject === s.id),
            onclick: () => {
              audio.tap();
              store.update((x) => {
                x.timer.subject = s.id;
              });
            },
          },
          h('span', { class: 'dot' }),
          s.name[lang],
        ),
      ),
    );

    const strict = h('button', {
      class: `switch ${tm.strict ? 'on' : ''}`,
      role: 'switch',
      'aria-checked': String(tm.strict),
      'aria-label': t('focus.strict'),
      onclick: () => {
        haptic('select');
        store.update((x) => {
          x.timer.strict = !x.timer.strict;
        });
      },
    });

    const goalPct = Math.min(100, (mins / d.goals.minutes) * 100);
    const qPct = d.goals.questions ? Math.min(100, (qs / d.goals.questions) * 100) : 0;

    this.el.replaceChildren(
      h(
        'div',
        { class: 'stack' },
        h('div', { class: 'card focus-hero' }, seg, dial, h('p', { class: 'focus-help muted small' }, help)),
        h('div', { class: 'card' }, h('div', { class: 'card-title' }, t('focus.subject')), chips),
        h(
          'div',
          { class: 'card row strict-row' },
          h('div', { class: 'grow' }, h('div', { class: 'title' }, t('focus.strict')), h('div', { class: 'muted small' }, t('focus.strictHelp'))),
          strict,
        ),
        h('button', { class: 'btn btn-primary btn-wide btn-start', html: `${ICONS.play}<span>${t('focus.start')}</span>`, onclick: () => this.start() }),
        h(
          'div',
          { class: 'card today-card' },
          h('div', { class: 'row' }, h('span', { class: 'ico-sm', html: ICONS.target }), h('b', {}, mins >= d.goals.minutes ? t('focus.goalDone') : t('focus.today', { m: mins, g: d.goals.minutes })), h('span', { class: 'spacer' }), h('span', { class: 'muted small' }, dur(mins))),
          h('div', { class: 'bar' }, h('i', { style: `width:${goalPct}%` })),
          d.goals.questions
            ? h('div', { class: 'row small muted' }, h('span', {}, t('track.today', { n: qs, g: d.goals.questions })), h('span', { class: 'spacer' }), h('div', { class: 'bar mini' }, h('i', { style: `width:${qPct}%;background:var(--gold)` })))
            : null,
        ),
      ),
    );
  }

  private setMode(m: Mode): void {
    audio.tap();
    store.update((x) => {
      x.timer.mode = m;
    });
  }

  private start(): void {
    audio.unlock();
    audio.start();
    haptic('medium');
    this.onStart();
  }

  /** Circular duration picker with a live tulip preview in the middle. */
  private dial(): HTMLElement {
    const tm = store.data.timer;
    const stopwatch = tm.mode === 'stopwatch';
    const m = this.minutes();
    const tier = stopwatch ? 'epic' : rarityFor(m);
    const variety = VARIETY_BY_ID.get(PREVIEW[tier ?? 'common'])!;
    const R = 112;
    const C = 2 * Math.PI * R;
    const frac = stopwatch ? 1 : Math.min(1, m / DIAL_MAX);
    const ang = frac * 2 * Math.PI - Math.PI / 2;
    const kx = 140 + R * Math.cos(ang);
    const ky = 140 + R * Math.sin(ang);
    const ticks = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
      const r1 = R + 18;
      const r2 = R + (i % 6 === 0 ? 26 : 22);
      return `<line x1="${(140 + r1 * Math.cos(a)).toFixed(1)}" y1="${(140 + r1 * Math.sin(a)).toFixed(1)}" x2="${(140 + r2 * Math.cos(a)).toFixed(1)}" y2="${(140 + r2 * Math.sin(a)).toFixed(1)}" stroke="var(--line)" stroke-width="${i % 6 === 0 ? 3 : 2}" stroke-linecap="round"/>`;
    }).join('');
    const svg = `<svg class="dial-svg" viewBox="0 0 280 280" width="280" height="280">
${ticks}
<circle cx="140" cy="140" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="18"/>
<circle cx="140" cy="140" r="${R}" fill="none" stroke="url(#dialg)" stroke-width="18" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 140 140)" ${stopwatch ? 'opacity=".35"' : ''}/>
<defs><linearGradient id="dialg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--primary)"/></linearGradient></defs>
${stopwatch ? '' : `<circle class="knob" cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" r="15" fill="var(--surface)" stroke="var(--primary)" stroke-width="4"/>`}
</svg>`;
    const center = h(
      'div',
      { class: 'dial-center' },
      h('div', { class: 'dial-tulip', html: tulipSVG(variety, { size: 96, seed: 3 }) }),
      h('div', { class: 'dial-time' }, stopwatch ? '∞' : clock(m * 60)),
    );
    const preview = h('p', { class: 'dial-preview' }, stopwatch ? t('focus.preview', { n: 90, rarity: t('rarity.epic') }) : tier ? t('focus.preview', { n: m, rarity: t(`rarity.${tier}` as Key) }) : t('focus.previewNone'));
    const wrap = h('div', { class: `dial ${stopwatch ? 'off' : ''}`, html: svg }, center);
    if (!stopwatch) this.bindDrag(wrap);
    return h('div', { class: 'dial-wrap' }, wrap, preview);
  }

  private bindDrag(wrap: HTMLElement): void {
    const step = store.data.timer.mode === 'pomodoro' ? 5 : 5;
    let last = this.minutes();
    const fromEvent = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      let a = Math.atan2(y, x) + Math.PI / 2;
      if (a < 0) a += 2 * Math.PI;
      let m = Math.round(((a / (2 * Math.PI)) * DIAL_MAX) / step) * step;
      // Do not jump across the top from 120 to 5 while dragging.
      if (last >= 100 && m <= 20) m = DIAL_MAX;
      if (last <= 20 && m >= 100) m = 5;
      return Math.max(5, Math.min(DIAL_MAX, m));
    };
    const move = (e: PointerEvent) => {
      if (!this.dragging) return;
      const m = fromEvent(e);
      if (m !== last) {
        last = m;
        this.setMinutes(m);
        haptic('select');
        const fresh = this.dial();
        wrap.parentElement?.replaceWith(fresh);
        wrap = fresh.querySelector('.dial') as HTMLElement;
      }
    };
    const up = () => {
      if (!this.dragging) return;
      this.dragging = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      store.update(() => undefined);
    };
    wrap.addEventListener('pointerdown', (e) => {
      const target = e.target as Element;
      if (!target.closest('.dial-svg')) return;
      this.dragging = true;
      last = this.minutes();
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      move(e);
    });
  }
}
