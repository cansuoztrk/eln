import { EXAMS } from '../core/exams';
import { newId } from '../core/records';
import { atRisk, dayKey } from '../core/streak';
import { comeBack, elapsed, isDone, leave, MAX_STOPWATCH_SEC, MIN_LOG_SEC, nextPomodoro, pause, resume, start, type Running } from '../core/timer';
import { currentLang, num, setLang, t, tp, type Key } from '../i18n';
import { daysLeft, examTarget, finishFocus, streakNow, subjects, type FinishResult } from '../meta/actions';
import { isPremium, profile, store } from '../meta/state';
import { audio, type Ambient } from '../services/audio';
import { iap } from '../services/iap';
import { rescheduleReminders, scheduleSessionEnd, strictWarning } from '../services/notify';
import { haptic, hideSplash, isNative, keepAwake, onAppState, onBackButton, setStatusBar, track } from '../services/platform';
import { updateWidget } from '../services/widget';
import { ICONS } from './art';
import { celebrate } from './celebrate';
import { h } from './dom';
import { FocusScreen } from './focus';
import { FriendsScreen } from './friends';
import { GardenScreen } from './garden';
import { anyModal, closeAll, closeTop, confirmDialog, modal, toast } from './modal';
import { Onboarding } from './onboarding';
import { showPaywall } from './paywall';
import { SessionView } from './session';
import { showSettings } from './settings';
import { StatsScreen } from './stats';
import { TrackScreen } from './track';

type Tab = 'focus' | 'track' | 'stats' | 'garden' | 'friends';
const TABS: Tab[] = ['focus', 'track', 'stats', 'garden', 'friends'];
interface Screen {
  el: HTMLElement;
  destroy(): void;
}

/** A pomodoro cycle continues if the next focus starts soon after a break. */
const CYCLE_KEEP_MS = 30 * 60_000;

export class App {
  private root = document.getElementById('app')!;
  private topbar = h('header', { class: 'topbar' });
  private main = h('main', { class: 'main' });
  private nav = h('nav', { class: 'nav' });
  private screen: Screen | null = null;
  private tab: Tab = 'focus';
  private session: SessionView | null = null;
  private onboarding: Onboarding | null = null;
  private lang = currentLang();
  private day = dayKey(Date.now());
  private cycle = { n: 0, until: 0 };
  private finishing = false;

  async start(): Promise<void> {
    store.update((d) => {
      d.stats.opens++;
      d.stats.lastOpen = Date.now();
    });
    this.applyTheme();
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => this.applyTheme());
    store.subscribe(() => this.onStore());
    void onAppState((active) => this.onAppState(active));
    void onBackButton(() => this.onBack());
    document.getElementById('boot')?.remove();
    if (!store.data.onboarded) this.showOnboarding();
    else this.showMain();
    void hideSplash();
    void iap.init();
    void updateWidget();
    window.setInterval(() => this.tick(), 1000);
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) this.exposeDebug();
  }

  // ───────────── shell ─────────────

  private showOnboarding(): void {
    this.screen?.destroy();
    this.screen = null;
    this.onboarding = new Onboarding(() => {
      this.onboarding = null;
      this.showMain();
    });
    this.root.replaceChildren(this.onboarding.el);
  }

  private showMain(): void {
    this.root.replaceChildren(this.topbar, this.main, this.nav);
    this.renderTopbar();
    this.renderNav();
    this.switchTab(this.tab, true);
    this.restoreRunning();
  }

  private switchTab(tab: Tab, force = false): void {
    if (tab === this.tab && this.screen && !force) {
      this.main.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.screen?.destroy();
    this.tab = tab;
    const paywall = (src: string) => () => showPaywall(src);
    this.screen =
      tab === 'focus'
        ? new FocusScreen(() => this.startFocus())
        : tab === 'track'
          ? new TrackScreen()
          : tab === 'stats'
            ? new StatsScreen(paywall('stats'))
            : tab === 'garden'
              ? new GardenScreen(paywall('garden'))
              : new FriendsScreen();
    this.main.replaceChildren(this.screen.el);
    this.main.scrollTop = 0;
    for (const b of this.nav.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.tab === tab));
    track('tab', { tab });
  }

  private renderNav(): void {
    this.nav.replaceChildren(
      ...TABS.map((tab) =>
        h(
          'button',
          {
            'data-tab': tab,
            'aria-current': String(tab === this.tab),
            onclick: () => {
              audio.tap();
              haptic('light');
              this.switchTab(tab);
            },
          },
          h('span', { class: 'nav-ico', html: ICONS[tab] }),
          h('span', { class: 'nav-label' }, t(`tab.${tab}` as Key)),
        ),
      ),
    );
  }

  private renderTopbar(): void {
    const p = profile();
    const exam = EXAMS[p.exam].short;
    const days = daysLeft();
    const target = examTarget();
    const countdown = h(
      'button',
      { class: 'countdown', onclick: () => showSettings(), 'aria-label': t('settings.examDate') },
      h('span', { class: 'cd-ico', html: ICONS.calendar }),
      days === null ? h('span', {}, t('header.noDate')) : days === 0 ? h('span', {}, t('header.today', { exam })) : h('span', {}, h('b', {}, num(days)), ' ', tp('header.dayWord', days), h('small', {}, ` · ${exam}`)),
      target?.estimated ? h('i', { class: 'est', title: t('common.estimated') }, '≈') : null,
    );
    const streak = streakNow();
    const risk = atRisk(store.data.streak, dayKey(Date.now()));
    const flame = h('button', { class: `streak ${streak ? 'on' : ''} ${risk ? 'risk' : ''}`, 'aria-label': tp('header.streak', streak), onclick: () => this.streakInfo() }, h('span', { html: ICONS.flame }), h('b', {}, num(streak)));
    const crown = isPremium() ? null : h('button', { class: 'icon-btn crown', 'aria-label': t('paywall.title'), html: ICONS.crown, onclick: () => showPaywall('topbar') });
    const gear = h('button', { class: 'icon-btn', 'aria-label': t('settings.title'), html: ICONS.settings, onclick: () => showSettings() });
    this.topbar.replaceChildren(countdown, h('span', { class: 'spacer' }), flame, crown ?? '', gear);
  }

  private streakInfo(): void {
    const s = store.data.streak;
    const cur = streakNow();
    modal(
      h(
        'div',
        { class: 'modal-body center streak-info' },
        h('div', { class: `big-flame ${cur ? 'on' : ''}`, html: ICONS.flame }),
        h('h2', {}, tp('header.streak', cur)),
        h('p', { class: 'muted' }, t('streak.best', { n: Math.max(s.best, cur) })),
        h('div', { class: 'bulbs' }, ...[0, 1].map((i) => h('span', { class: `bulb ${i < s.bulbs ? 'on' : ''}`, html: ICONS.bulb }))),
        h('p', { class: 'small' }, t('streak.bulbs', { n: s.bulbs })),
        h('p', { class: 'muted small' }, t('streak.body')),
      ),
      { center: true, title: t('streak.title') },
    );
  }

  private applyTheme(): void {
    const th = store.data.settings.theme;
    const dark = th === 'dark' || (th === 'auto' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1a1413' : '#fff8f0');
    void setStatusBar(dark);
  }

  private lastTheme = '';
  private lastProfile = '';

  private onStore(): void {
    const d = store.data;
    if (!d.onboarded && !this.onboarding) {
      this.stopSessionView();
      this.showOnboarding();
      return;
    }
    if (this.onboarding) return;
    if (d.settings.theme !== this.lastTheme) {
      this.lastTheme = d.settings.theme;
      this.applyTheme();
    }
    const langNow = currentLang();
    if (langNow !== this.lang) {
      this.lang = langNow;
      this.renderNav();
      this.switchTab(this.tab, true);
    }
    const prof = JSON.stringify(profile()) + d.active;
    if (prof !== this.lastProfile) {
      this.lastProfile = prof;
      void updateWidget();
    }
    this.renderTopbar();
    if (d.running && !this.session) this.showSession(d.running);
    else if (d.running && this.session) this.session.update(d.running);
    else if (!d.running && this.session) this.stopSessionView();
  }

  // ───────────── focus sessions ─────────────

  private startFocus(): void {
    const d = store.data;
    if (d.running) return;
    const subs = subjects();
    const subject = subs.some((s) => s.id === d.timer.subject) ? d.timer.subject : (subs[0]?.id ?? 'general');
    const now = Date.now();
    const cycle = d.timer.mode === 'pomodoro' && this.cycle.until > now ? this.cycle.n : 0;
    const minutes = d.timer.mode === 'pomodoro' ? d.timer.pomodoro.focus : d.timer.minutes;
    const r = start({ mode: d.timer.mode, subject, minutes, strict: d.timer.strict, now, id: newId('s', now), cycle });
    this.begin(r);
    track('focus_start', { mode: r.mode, minutes: r.planned / 60, strict: r.strict });
  }

  private begin(r: Running): void {
    store.update((d) => {
      d.running = r;
      d.timer.subject = r.phase === 'focus' ? r.subject : d.timer.subject;
    });
    void scheduleSessionEnd(r);
    void keepAwake(true);
    const amb = store.data.settings.ambient as Ambient | null;
    if (amb && !audio.ambient) audio.playAmbient(amb);
  }

  private showSession(r: Running): void {
    this.session?.destroy();
    this.session = new SessionView(r, {
      pause: () => this.mutate((x) => pause(x, Date.now())),
      resume: () => this.mutate((x) => resume(x, Date.now())),
      giveUp: () => void this.giveUp(),
      finish: () => this.completeFocus(),
      skipBreak: () => this.endBreak(true),
      paywall: () => showPaywall('ambient'),
    });
    document.body.append(this.session.el);
    document.body.classList.add('in-session');
  }

  private stopSessionView(): void {
    this.session?.destroy();
    this.session?.el.remove();
    this.session = null;
    document.body.classList.remove('in-session');
    document.title = 'Lale';
    void keepAwake(false);
    audio.stopAmbient();
  }

  private mutate(fn: (r: Running) => Running): void {
    const r = store.data.running;
    if (!r) return;
    const next = fn(r);
    store.update((d) => {
      d.running = next;
    });
    this.session?.update(next);
    void scheduleSessionEnd(next);
    haptic('light');
  }

  private async giveUp(): Promise<void> {
    const r = store.data.running;
    if (!r) return;
    const now = Date.now();
    if (elapsed(r, now) < MIN_LOG_SEC) {
      this.clearRunning();
      return;
    }
    const strict = r.strict;
    const ok = await confirmDialog(t('session.giveUp'), strict ? t('session.giveUpQ') : t('session.giveUpSoft'), t('session.giveUpYes'), t('common.cancel'), true);
    const cur = store.data.running;
    if (!ok || !cur || cur.id !== r.id) return;
    track('focus_give_up', { strict, sec: elapsed(cur, Date.now()) });
    this.finish(finishFocus(cur, Date.now(), strict, !strict), null);
  }

  private clearRunning(): void {
    store.update((d) => {
      d.running = null;
    });
    void scheduleSessionEnd(null);
  }

  /** A focus phase reached its end (or the stopwatch was stopped). */
  private completeFocus(): void {
    const r = store.data.running;
    if (!r || r.phase !== 'focus' || this.finishing) return;
    this.finishing = true;
    try {
      const res = finishFocus(r, Date.now());
      const next = r.mode === 'pomodoro' && res.session ? nextPomodoro(r, store.data.timer.pomodoro) : null;
      if (next) this.cycle = { n: next.cycle, until: Date.now() + CYCLE_KEEP_MS };
      track('focus_done', { mode: r.mode, sec: res.session?.sec ?? 0, tulip: res.variety?.id ?? '' });
      this.finish(res, next ? { r, minutes: next.minutes, cycle: next.cycle } : null);
    } finally {
      this.finishing = false;
    }
  }

  private finish(res: FinishResult, brk: { r: Running; minutes: number; cycle: number } | null): void {
    void scheduleSessionEnd(null);
    void strictWarning(false);
    this.stopSessionView();
    void rescheduleReminders();
    if (!res.session && !res.wilted) {
      toast(t('done.tooShort'));
      return;
    }
    celebrate(res, {
      breakMinutes: brk ? brk.minutes : null,
      onBreak: () => {
        if (!brk) return;
        const now = Date.now();
        this.begin(start({ mode: 'pomodoro', subject: brk.r.subject, minutes: brk.minutes, strict: false, now, id: newId('b', now), cycle: brk.cycle, phase: 'break' }));
      },
      onNext: () => this.switchTab('focus'),
      onGarden: () => this.switchTab('garden'),
    });
  }

  private endBreak(skipped: boolean): void {
    const r = store.data.running;
    if (!r || r.phase !== 'break') return;
    this.cycle = { n: r.cycle, until: Date.now() + CYCLE_KEEP_MS };
    this.clearRunning();
    if (skipped) return void this.switchTab('focus');
    audio.breakDone();
    haptic('success');
    const m = modal(
      h(
        'div',
        { class: 'modal-body center' },
        h('h2', {}, t('done.breakOver')),
        h('p', { class: 'muted' }, t('notif.break.body')),
        h(
          'div',
          { class: 'modal-actions col' },
          h('button', { class: 'btn btn-primary', html: `${ICONS.play}<span>${t('focus.start')}</span>`, onclick: () => { m.close(); this.switchTab('focus'); this.startFocus(); } }),
          h('button', { class: 'btn btn-ghost', onclick: () => { m.close(); this.switchTab('focus'); } }, t('common.close')),
        ),
      ),
      { center: true },
    );
  }

  /** Launch with a session saved in the store (the app was closed or killed). */
  private restoreRunning(): void {
    const r = store.data.running;
    if (!r) return;
    if (r.leftAt) {
      const back = comeBack(r, Date.now());
      if (back.wilted) return this.finish(finishFocus(back.running, back.running.leftAt ?? Date.now(), true), null);
      store.quiet((d) => void (d.running = back.running));
    }
    this.showSession(store.data.running!);
    this.tick();
  }

  private tick(): void {
    const today = dayKey(Date.now());
    if (today !== this.day) {
      this.day = today;
      if (!this.onboarding) this.renderTopbar();
      void updateWidget();
    }
    const r = store.data.running;
    if (!r || this.onboarding) return;
    const now = Date.now();
    if (r.phase === 'focus' && (isDone(r, now) || (!r.planned && elapsed(r, now) >= MAX_STOPWATCH_SEC))) return this.completeFocus();
    if (r.phase === 'break' && isDone(r, now)) return this.endBreak(false);
    this.session?.tick();
  }

  // ───────────── lifecycle ─────────────

  private onAppState(active: boolean): void {
    const r = store.data.running;
    const now = Date.now();
    if (!active) {
      if (r && r.phase === 'focus' && r.strict && !r.pausedAt) {
        store.quiet((d) => void (d.running = leave(r, now)));
        void strictWarning(true);
      }
      void rescheduleReminders();
      void updateWidget();
      void store.flush();
      audio.setSuspended(true);
      return;
    }
    audio.setSuspended(false);
    void strictWarning(false);
    void iap.refresh();
    if (r?.leftAt) {
      const back = comeBack(r, now);
      if (back.wilted) {
        track('focus_wilted', { sec: elapsed(r, r.leftAt) });
        this.finish(finishFocus(back.running, r.leftAt, true), null);
        return;
      }
      store.quiet((d) => void (d.running = back.running));
      this.session?.update(back.running);
    }
    this.tick();
  }

  private onBack(): void {
    if (closeTop()) return;
    if (this.onboarding) {
      if (!this.onboarding.handleBack()) void this.minimize();
      return;
    }
    if (store.data.running) return void this.minimize();
    if (this.tab !== 'focus') return this.switchTab('focus');
    void this.minimize();
  }

  private async minimize(): Promise<void> {
    if (!isNative) return;
    const { App: CapApp } = await import('@capacitor/app');
    await CapApp.minimizeApp();
  }

  // ───────────── debug (dev / ?debug) ─────────────

  private exposeDebug(): void {
    (window as unknown as { lale: unknown }).lale = {
      store,
      app: this,
      tab: (x: Tab) => this.switchTab(x),
      closeModals: () => closeAll(),
      anyModal,
      /** Jump a running session forward by n seconds. */
      skip: (sec: number) => {
        const r = store.data.running;
        if (!r) return;
        store.update((d) => void (d.running = { ...r, startedAt: r.startedAt - sec * 1000 }));
        this.tick();
      },
      setLang: (l: string) => {
        setLang(l);
        store.update((d) => void (d.settings.lang = l));
      },
    };
  }
}
