import { version } from '../../package.json';
import { CONFIG } from '../config';
import { EXAM_ORDER, EXAMS, FIELD_NAMES, type ExamId, type YksField } from '../core/exams';
import { currentLang, dateFmt, dur, LANG_LIST, setLang, t, type Key } from '../i18n';
import { examTarget } from '../meta/actions';
import { defaultSave, isPremium, parseSave, profile, store, type Profile, type Theme } from '../meta/state';
import { audio } from '../services/audio';
import { copyText, pickTextFile, shareFile } from '../services/files';
import { iap } from '../services/iap';
import { requestNotifications, rescheduleReminders } from '../services/notify';
import { haptic } from '../services/platform';
import { updateWidget } from '../services/widget';
import { ICONS } from './art';
import { h } from './dom';
import { closeAll, confirmDialog, modal, toast } from './modal';
import { showPaywall } from './paywall';

type Child = HTMLElement | null;

function section(title: string, ...rows: Child[]): HTMLElement {
  return h('div', { class: 'set-section' }, h('div', { class: 'set-title' }, title), h('div', { class: 'set-card' }, ...rows));
}

function row(icon: string, label: string, control: HTMLElement | null, sub?: string, onclick?: () => void): HTMLElement {
  return h(
    onclick ? 'button' : 'div',
    { class: `set-row ${onclick ? 'tap' : ''}`, onclick: onclick ?? undefined },
    h('span', { class: 'set-ico', html: icon }),
    h('span', { class: 'set-main' }, h('span', { class: 'set-label' }, label), sub ? h('small', {}, sub) : null),
    control,
  );
}

function switchEl(on: boolean, label: string, change: (v: boolean) => void): HTMLElement {
  return h('button', {
    class: `switch ${on ? 'on' : ''}`,
    role: 'switch',
    'aria-checked': String(on),
    'aria-label': label,
    onclick: (e: Event) => {
      e.stopPropagation();
      haptic('select');
      change(!on);
    },
  });
}

function stepper(value: number, min: number, max: number, step: number, fmt: (v: number) => string, change: (v: number) => void): HTMLElement {
  const set = (v: number) => {
    const n = Math.max(min, Math.min(max, v));
    if (n === value) return haptic('warning');
    haptic('select');
    change(n);
  };
  return h(
    'div',
    { class: 'stepper sm' },
    h('button', { 'aria-label': '−', html: ICONS.minus, disabled: value <= min, onclick: () => set(value - step) }),
    h('output', {}, fmt(value)),
    h('button', { 'aria-label': '+', html: ICONS.plus, disabled: value >= max, onclick: () => set(value + step) }),
  );
}

const examLabel = (p: Profile) => `${EXAMS[p.exam].short}${p.field ? ` · ${FIELD_NAMES[p.field][currentLang()].replace(/\s*\(.*\)$/, '')}` : ''}`;

/** Grid of exams; resolves with the choice or null. Also used by onboarding. */
export function examPicker(current: ExamId | null, onPick: (e: ExamId) => void): HTMLElement {
  return h(
    'div',
    { class: 'exam-grid' },
    ...EXAM_ORDER.map((id) =>
      h(
        'button',
        { class: 'exam-opt', 'aria-pressed': String(id === current), onclick: () => onPick(id) },
        h('b', {}, id === 'other' ? '✦' : EXAMS[id].short),
        h('small', {}, t(`exam.tag.${id}` as Key)),
      ),
    ),
  );
}

export function fieldPicker(current: YksField | null, onPick: (f: YksField) => void): HTMLElement {
  const lang = currentLang();
  return h('div', { class: 'field-grid' }, ...(['say', 'ea', 'soz', 'dil'] as YksField[]).map((f) => h('button', { class: 'exam-opt', 'aria-pressed': String(f === current), onclick: () => onPick(f) }, h('b', {}, FIELD_NAMES[f][lang]), h('small', {}, t(`field.tag.${f}` as Key)))));
}

export function showSettings(): void {
  const body = h('div', { class: 'modal-body settings' });
  const m = modal(body, { title: t('settings.title'), className: 'settings-card' });
  const render = () => {
    if (!document.body.contains(body)) return unsub();
    const scroll = body.parentElement?.scrollTop ?? 0;
    body.replaceChildren(...build(() => m.close()));
    if (body.parentElement) body.parentElement.scrollTop = scroll;
  };
  const unsub = store.subscribe(render);
  render();
}

function build(close: () => void): HTMLElement[] {
  const d = store.data;
  const s = d.settings;
  const lang = currentLang();
  const p = profile();
  const premium = isPremium();
  const target = examTarget();

  // ── Exam profile ──
  const changeExam = () => {
    const mm = modal(
      h(
        'div',
        { class: 'modal-body' },
        examPicker(p.exam, (e) => {
          audio.tap();
          mm.close();
          if (e === 'yks') return pickField(e);
          store.update((x) => {
            x.profiles[x.active] = { exam: e, field: null, examDate: null };
          });
          void updateWidget();
        }),
      ),
      { title: t('settings.exam') },
    );
  };
  const pickField = (e: ExamId) => {
    const mm = modal(
      h(
        'div',
        { class: 'modal-body' },
        fieldPicker(p.exam === 'yks' ? p.field : null, (f) => {
          audio.tap();
          mm.close();
          store.update((x) => {
            const cur = x.profiles[x.active];
            x.profiles[x.active] = { exam: e, field: f, examDate: cur.exam === e ? cur.examDate : null };
          });
          void updateWidget();
        }),
      ),
      { title: t('settings.field') },
    );
  };
  const dateInput = h('input', {
    class: 'input date',
    type: 'date',
    value: target ? `${target.at.getFullYear()}-${String(target.at.getMonth() + 1).padStart(2, '0')}-${String(target.at.getDate()).padStart(2, '0')}` : '',
    onchange: (e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
      const time = target ? `${String(target.at.getHours()).padStart(2, '0')}:${String(target.at.getMinutes()).padStart(2, '0')}` : '10:00';
      store.update((x) => {
        x.profiles[x.active].examDate = `${v}T${time}`;
      });
      void updateWidget();
    },
  });
  const profileRows: Child[] = [
    row(ICONS.target, t('settings.exam'), h('span', { class: 'set-value' }, EXAMS[p.exam].short, h('span', { class: 'chev', html: ICONS.chevron })), EXAMS[p.exam].name[lang], changeExam),
    p.exam === 'yks' ? row(ICONS.track, t('settings.field'), h('span', { class: 'set-value' }, p.field ? FIELD_NAMES[p.field][lang] : '—', h('span', { class: 'chev', html: ICONS.chevron })), undefined, () => pickField('yks')) : null,
    row(ICONS.calendar, t('settings.examDate'), dateInput, target ? (target.custom ? t('settings.examDateCustom') : t('settings.examDateHelp')) : t('header.noDate')),
    p.examDate
      ? row(ICONS.back, t('settings.examDateReset'), null, undefined, () => {
          store.update((x) => {
            x.profiles[x.active].examDate = null;
          });
          void updateWidget();
        })
      : null,
  ];
  // Other exam profiles (Bahçıvan).
  if (d.profiles.length > 1) {
    d.profiles.forEach((pr, i) => {
      if (i === d.active) return;
      profileRows.push(
        row(ICONS.friends, examLabel(pr), h('button', { class: 'icon-btn sm', 'aria-label': t('settings.profileRemove'), html: ICONS.trash, onclick: async (e: Event) => {
          e.stopPropagation();
          if (!(await confirmDialog(t('settings.profileRemove'), t('settings.profileRemoveQ', { name: examLabel(pr) }), t('common.delete'), t('common.cancel'), true))) return;
          store.update((x) => {
            const active = x.profiles[x.active];
            x.profiles.splice(i, 1);
            x.active = Math.max(0, x.profiles.indexOf(active));
          });
        } }), t('settings.profileSwitch'), () => {
          if (!premium) return showPaywall('profiles');
          store.update((x) => {
            x.active = i;
          });
          void updateWidget();
          toast(t('settings.profileActive', { name: examLabel(pr) }), 'good');
        }),
      );
    });
  }
  profileRows.push(
    row(ICONS.plus, t('settings.addProfile'), premium ? null : h('span', { class: 'mini-crown', html: ICONS.crown }), undefined, () => {
      if (!premium) return showPaywall('profiles');
      const mm = modal(
        h(
          'div',
          { class: 'modal-body' },
          examPicker(null, (e) => {
            mm.close();
            store.update((x) => {
              x.profiles.push({ exam: e, field: e === 'yks' ? 'say' : null, examDate: null });
              x.active = x.profiles.length - 1;
            });
            void updateWidget();
            if (e === 'yks') pickField('yks');
          }),
        ),
        { title: t('settings.addProfile') },
      );
    }),
  );

  // ── Goals and timer ──
  const goals = section(
    t('settings.goals'),
    row(ICONS.focus, t('settings.goalMinutes'), stepper(d.goals.minutes, 15, 960, 15, dur, (v) => store.update((x) => void (x.goals.minutes = v)))),
    row(ICONS.track, t('settings.goalQuestions'), stepper(d.goals.questions, 0, 2000, 10, (v) => (v ? String(v) : t('settings.off')), (v) => store.update((x) => void (x.goals.questions = v)))),
  );
  const pm = d.timer.pomodoro;
  const timer = section(
    t('settings.timer'),
    row(ICONS.play, t('settings.pFocus'), stepper(pm.focus, 10, 90, 5, (v) => t('common.min', { n: v }), (v) => store.update((x) => void (x.timer.pomodoro.focus = v)))),
    row(ICONS.pause, t('settings.pShort'), stepper(pm.short, 1, 30, 1, (v) => t('common.min', { n: v }), (v) => store.update((x) => void (x.timer.pomodoro.short = v)))),
    row(ICONS.moon, t('settings.pLong'), stepper(pm.long, 5, 60, 5, (v) => t('common.min', { n: v }), (v) => store.update((x) => void (x.timer.pomodoro.long = v)))),
    row(ICONS.calendar, t('settings.pEvery'), stepper(pm.every, 2, 8, 1, (v) => t('settings.pEveryVal', { n: v }), (v) => store.update((x) => void (x.timer.pomodoro.every = v)))),
    row(ICONS.lock, t('settings.strict'), switchEl(d.timer.strict, t('settings.strict'), (v) => store.update((x) => void (x.timer.strict = v))), t('focus.strictHelp')),
    row(ICONS.sun, t('settings.awake'), switchEl(s.awake, t('settings.awake'), (v) => store.update((x) => void (x.settings.awake = v)))),
  );

  // ── Look and feel ──
  const themes: Theme[] = ['auto', 'light', 'dark'];
  const look = section(
    t('settings.theme'),
    h('div', { class: 'set-row' }, h('div', { class: 'seg grow' }, ...themes.map((th) => h('button', { 'aria-pressed': String(s.theme === th), onclick: () => store.update((x) => void (x.settings.theme = th)) }, t(`settings.theme.${th}` as Key))))),
    row(
      ICONS.globe,
      t('settings.language'),
      h(
        'select',
        {
          class: 'input select',
          onchange: (e: Event) => {
            const v = (e.target as HTMLSelectElement).value;
            setLang(v);
            store.update((x) => void (x.settings.lang = v));
            void updateWidget();
            void rescheduleReminders();
          },
        },
        ...LANG_LIST.map((l) => h('option', { value: l.id, selected: l.id === lang }, l.name)),
      ),
    ),
    row(ICONS.sound, t('settings.sound'), switchEl(s.sound, t('settings.sound'), (v) => store.update((x) => void (x.settings.sound = v)))),
    row(ICONS.vibrate, t('settings.haptics'), switchEl(s.haptics, t('settings.haptics'), (v) => store.update((x) => void (x.settings.haptics = v)))),
  );

  // ── Reminders ──
  const reminders = section(
    t('settings.notifications'),
    row(
      ICONS.bell,
      t('settings.notifications'),
      switchEl(s.notifications, t('settings.notifications'), async (v) => {
        if (v && !(await requestNotifications())) return toast(t('settings.notifDenied'));
        store.update((x) => void (x.settings.notifications = v));
        void rescheduleReminders();
      }),
      t('onboard.notifBody'),
    ),
    s.notifications
      ? row(
          ICONS.calendar,
          t('settings.reminder'),
          h('input', {
            class: 'input time',
            type: 'time',
            value: s.reminder,
            onchange: (e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              if (!/^\d{2}:\d{2}$/.test(v)) return;
              store.update((x) => void (x.settings.reminder = v));
              void rescheduleReminders();
            },
          }),
        )
      : null,
  );

  // ── Premium ──
  const own = d.premium;
  const status = own.owned.includes('lale_lifetime')
    ? t('paywall.lifetime')
    : own.subscription
      ? t('settings.subActive')
      : own.seasonUntil > Date.now()
        ? t('paywall.until', { date: dateFmt(new Date(own.seasonUntil), { day: 'numeric', month: 'long', year: 'numeric' }) })
        : t('paywall.sub');
  const prem = section(
    t('settings.premium'),
    row(ICONS.crown, premium ? t('paywall.active') : t('settings.premium'), h('span', { class: 'chev', html: ICONS.chevron }), status, () => showPaywall('settings')),
    row(ICONS.download, t('settings.restore'), null, undefined, async () => {
      const ok = await iap.restore();
      toast(ok ? t('settings.restored') : t('settings.nothing'), ok ? 'good' : 'info');
    }),
  );

  // ── Data ──
  const data = section(
    t('settings.data'),
    row(ICONS.upload, t('settings.export'), null, undefined, async () => {
      const ok = await shareFile(`lale-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store.data), 'application/json');
      if (!ok) toast(t('paywall.failed'));
    }),
    row(ICONS.download, t('settings.import'), null, undefined, async () => {
      const raw = await pickTextFile();
      if (!raw) return;
      const parsed = parseSave(raw);
      if (!parsed || !parsed.onboarded) return toast(t('settings.importBad'));
      if (!(await confirmDialog(t('settings.import'), t('settings.importQ'), t('common.continue'), t('common.cancel'), true))) return;
      // Purchases belong to the store account, not to the file.
      parsed.premium = store.data.premium;
      await store.replace(parsed);
      setLang(parsed.settings.lang);
      toast(t('settings.importOk'), 'good');
    }),
    h('p', { class: 'set-note', html: `${ICONS.shield}<span>${t('settings.privacyNote')}</span>` }),
  );

  // ── About ──
  const about = section(
    t('settings.about'),
    row(ICONS.shield, t('settings.privacy'), h('span', { class: 'chev', html: ICONS.chevron }), undefined, () => window.open(CONFIG.privacyUrl, '_blank')),
    row(ICONS.doc, t('settings.terms'), h('span', { class: 'chev', html: ICONS.chevron }), undefined, () => window.open(CONFIG.termsUrl, '_blank')),
    row(ICONS.bell, t('settings.support'), h('span', { class: 'set-value small' }, CONFIG.supportEmail), undefined, async () => {
      if (await copyText(CONFIG.supportEmail)) toast(t('common.copied'), 'good');
    }),
    h('p', { class: 'set-note' }, t('settings.disclaimer')),
  );

  const reset = h('button', {
    class: 'btn btn-ghost danger btn-wide',
    html: `${ICONS.trash}<span>${t('settings.reset')}</span>`,
    onclick: async () => {
      if (!(await confirmDialog(t('settings.reset'), t('settings.resetQ'), t('common.delete'), t('common.cancel'), true))) return;
      const fresh = defaultSave();
      // Keep what the player paid for and how the app looks.
      fresh.premium = store.data.premium;
      fresh.settings = store.data.settings;
      fresh.stats = { ...store.data.stats };
      await store.replace(fresh);
      close();
      closeAll();
    },
  });

  return [
    section(t('settings.profile'), ...profileRows),
    goals,
    timer,
    look,
    reminders,
    prem,
    data,
    about,
    reset,
    h('p', { class: 'muted tiny center' }, `${CONFIG.appName} · ${t('settings.version', { v: version })} · ${CONFIG.studio}`),
  ];
}
