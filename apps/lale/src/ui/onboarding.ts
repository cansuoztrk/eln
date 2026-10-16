import { EXAMS, type ExamId, type YksField } from '../core/exams';
import { MAX_NAME } from '../core/friends';
import { DISTRICTS, VARIETY_BY_ID } from '../core/garden';
import { dur, t } from '../i18n';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { requestNotifications, rescheduleReminders } from '../services/notify';
import { haptic, isNative, track } from '../services/platform';
import { updateWidget } from '../services/widget';
import { ICONS, tekirSVG } from './art';
import { h } from './dom';
import { gardenScene } from './garden';
import { examPicker, fieldPicker } from './settings';

type Step = 'welcome' | 'exam' | 'field' | 'name' | 'goal' | 'notif' | 'ready';

/** First run: a few friendly questions, then straight into the first session. */
export class Onboarding {
  readonly el = h('section', { class: 'onboard' });
  private step: Step = 'welcome';
  private history: Step[] = [];
  private exam: ExamId = 'yks';
  private field: YksField | null = 'say';
  private name = '';
  private minutes = 180;
  private questions = 100;

  constructor(private onDone: () => void) {
    track('onboard_start');
    this.render();
  }

  private steps(): Step[] {
    const list: Step[] = ['welcome', 'exam'];
    if (this.exam === 'yks') list.push('field');
    list.push('name', 'goal');
    if (isNative) list.push('notif');
    list.push('ready');
    return list;
  }

  private go(next: Step): void {
    audio.tap();
    haptic('light');
    this.history.push(this.step);
    this.step = next;
    this.render();
  }

  private next(): void {
    const list = this.steps();
    const i = list.indexOf(this.step);
    this.go(list[Math.min(list.length - 1, i + 1)]);
  }

  private back(): void {
    const prev = this.history.pop();
    if (!prev) return;
    audio.tap();
    this.step = prev;
    this.render();
  }

  /** Android back: step back instead of leaving the app. Returns false on the first step. */
  handleBack(): boolean {
    if (!this.history.length) return false;
    this.back();
    return true;
  }

  private render(): void {
    const list = this.steps();
    const idx = list.indexOf(this.step);
    const top =
      this.step === 'welcome'
        ? null
        : h(
            'div',
            { class: 'onboard-top' },
            h('button', { class: 'icon-btn', 'aria-label': 'Back', html: ICONS.back, onclick: () => this.back() }),
            h('div', { class: 'dots' }, ...list.slice(1).map((_, i) => h('i', { class: i < idx ? 'on' : '' }))),
            h('span', { class: 'muted small' }, t('onboard.step', { n: idx, t: list.length - 1 })),
          );
    this.el.replaceChildren(...[top, h('div', { class: `onboard-body step-${this.step}` }, ...this.body())].filter(Boolean) as HTMLElement[]);
  }

  private body(): HTMLElement[] {
    switch (this.step) {
      case 'welcome':
        return [
          h('div', { class: 'onboard-hero', html: tekirSVG(190, 'happy', 'tulip') }),
          h('h1', {}, t('onboard.welcome')),
          h('p', { class: 'lead' }, t('onboard.welcomeBody')),
          h('div', { class: 'grow' }),
          h('button', { class: 'btn btn-primary btn-wide btn-lg', onclick: () => this.next() }, t('onboard.start')),
          h('p', { class: 'muted small center', html: `${ICONS.shield}<span>${t('onboard.privacy')}</span>` }),
        ];
      case 'exam':
        return [
          h('h2', {}, t('onboard.exam')),
          examPicker(this.exam, (e) => {
            this.exam = e;
            this.field = e === 'yks' ? (this.field ?? 'say') : null;
            this.next();
          }),
        ];
      case 'field':
        return [
          h('h2', {}, t('onboard.field')),
          fieldPicker(this.field, (f) => {
            this.field = f;
            this.next();
          }),
        ];
      case 'name': {
        const input = h('input', { class: 'input big', type: 'text', maxlength: String(MAX_NAME), value: this.name, placeholder: 'Tekir', autocomplete: 'nickname', enterkeyhint: 'next' }) as HTMLInputElement;
        input.addEventListener('input', () => (this.name = input.value.replace(/\s+/g, ' ').trimStart().slice(0, MAX_NAME)));
        input.addEventListener('keydown', (e) => e.key === 'Enter' && this.next());
        setTimeout(() => input.focus(), 300);
        return [h('h2', {}, t('onboard.name')), input, h('p', { class: 'muted small' }, t('onboard.nameHelp')), h('div', { class: 'grow' }), h('button', { class: 'btn btn-primary btn-wide btn-lg', onclick: () => this.next() }, t('common.continue'))];
      }
      case 'goal': {
        const chips = (values: number[], cur: number, fmt: (v: number) => string, set: (v: number) => void) =>
          h(
            'div',
            { class: 'chips wrap' },
            ...values.map((v) =>
              h(
                'button',
                {
                  class: 'chip big',
                  'aria-pressed': String(v === cur),
                  onclick: () => {
                    haptic('select');
                    set(v);
                    this.render();
                  },
                },
                fmt(v),
              ),
            ),
          );
        const mins = this.exam === 'lgs' ? [60, 90, 120, 180, 240] : [60, 120, 180, 240, 360, 480];
        return [
          h('h2', {}, t('onboard.goal')),
          chips(mins, this.minutes, dur, (v) => (this.minutes = v)),
          h('h3', {}, t('settings.goalQuestions')),
          chips([0, 50, 100, 200, 300], this.questions, (v) => (v ? t('common.questions', { n: v }) : t('settings.off')), (v) => (this.questions = v)),
          h('p', { class: 'muted small' }, t('onboard.goalHelp')),
          h('div', { class: 'grow' }),
          h('button', { class: 'btn btn-primary btn-wide btn-lg', onclick: () => this.next() }, t('common.continue')),
        ];
      }
      case 'notif':
        return [
          h('div', { class: 'onboard-hero bell', html: ICONS.bell }),
          h('h2', {}, t('onboard.notif')),
          h('p', { class: 'lead' }, t('onboard.notifBody')),
          h('div', { class: 'grow' }),
          h(
            'button',
            {
              class: 'btn btn-primary btn-wide btn-lg',
              onclick: async () => {
                const ok = await requestNotifications();
                store.quiet((d) => void (d.settings.notifications = ok));
                track('notif_prompt', { granted: ok });
                this.next();
              },
            },
            t('onboard.notifYes'),
          ),
          h('button', { class: 'btn btn-ghost btn-wide', onclick: () => this.next() }, t('onboard.notifNo')),
        ];
      case 'ready': {
        const demo = ['kirmizi', 'sari', 'gulhane', 'istanbul', 'pembe'].map((id, i) => ({ id: `demo${i}`, v: VARIETY_BY_ID.get(id)! }));
        return [
          h('div', { class: 'onboard-garden', html: gardenScene(DISTRICTS[0], demo, { cat: true }) }),
          h('h2', {}, t('onboard.ready')),
          h('p', { class: 'lead' }, t('onboard.readyBody')),
          h('p', { class: 'muted small' }, `${EXAMS[this.exam].short} · ${dur(this.minutes)}`),
          h('div', { class: 'grow' }),
          h('button', { class: 'btn btn-primary btn-wide btn-lg', onclick: () => this.finish() }, t('onboard.go')),
        ];
      }
    }
  }

  private finish(): void {
    audio.unlock();
    audio.plant();
    haptic('success');
    store.update((d) => {
      d.onboarded = true;
      d.name = this.name.trim();
      d.profiles = [{ exam: this.exam, field: this.exam === 'yks' ? this.field : null, examDate: null }];
      d.active = 0;
      d.goals = { minutes: this.minutes, questions: this.questions };
      d.timer.mode = 'pomodoro';
      d.timer.subject = '';
    });
    void store.flush();
    void updateWidget();
    void rescheduleReminders();
    track('onboard_done', { exam: this.exam });
    this.onDone();
  }
}
