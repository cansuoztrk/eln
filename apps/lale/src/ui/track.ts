import { EXAMS, mocksFor, testById } from '../core/exams';
import { accuracy, examNet, mockMax, mockNet, validateScore, type Score } from '../core/net';
import { lastDays, questionsOn, subjectQuestions, type MockResult } from '../core/records';
import { dayKey } from '../core/streak';
import { currentLang, dateFmt, num, pct, t, tp } from '../i18n';
import { addMock, addQuestions, removeRecord, subjectName, subjects, subjectHue } from '../meta/actions';
import { profile, store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { ICONS, tekirSVG } from './art';
import { lineChart } from './charts';
import { h } from './dom';
import { confirmDialog, modal, toast } from './modal';

function stepper(value: number, onChange: (v: number) => void, max = 999): HTMLElement {
  const input = h('input', { type: 'number', inputmode: 'numeric', min: '0', max: String(max), value: String(value) }) as HTMLInputElement;
  const set = (v: number) => {
    const n = Math.max(0, Math.min(max, Math.floor(Number.isFinite(v) ? v : 0)));
    input.value = String(n);
    onChange(n);
  };
  input.addEventListener('input', () => set(Number(input.value)));
  input.addEventListener('focus', () => input.select());
  return h(
    'div',
    { class: 'stepper' },
    h('button', { 'aria-label': '−', html: ICONS.minus, onclick: () => (set(Number(input.value) - 1), haptic('select')) }),
    input,
    h('button', { 'aria-label': '+', html: ICONS.plus, onclick: () => (set(Number(input.value) + 1), haptic('select')) }),
  );
}

export class TrackScreen {
  readonly el = h('section', { class: 'screen track' });
  private tab: 'questions' | 'mocks' = 'questions';
  private draft: Score = { d: 0, y: 0, b: 0 };
  private subject = '';
  private trendKind = '';
  private unsub: () => void;

  constructor() {
    this.unsub = store.subscribe(() => this.render());
    this.render();
  }

  destroy(): void {
    this.unsub();
  }

  render(): void {
    const seg = h(
      'div',
      { class: 'seg' },
      h('button', { 'aria-pressed': String(this.tab === 'questions'), onclick: () => this.switch('questions') }, t('track.questions')),
      h('button', { 'aria-pressed': String(this.tab === 'mocks'), onclick: () => this.switch('mocks') }, t('track.mocks')),
    );
    this.el.replaceChildren(h('div', { class: 'stack' }, seg, ...(this.tab === 'questions' ? this.questions() : this.mocks())));
  }

  private switch(tab: 'questions' | 'mocks'): void {
    audio.tap();
    this.tab = tab;
    this.render();
  }

  // ───────────── questions ─────────────

  private questions(): HTMLElement[] {
    const d = store.data;
    const lang = currentLang();
    const subs = subjects();
    if (!subs.some((s) => s.id === this.subject)) this.subject = subs[0]?.id ?? '';
    const penalty = EXAMS[profile().exam].penalty;
    const netEl = h('span', { class: 'live-net' });
    const errEl = h('span', { class: 'live-err' });
    const refresh = () => {
      const n = examNet(profile().exam, this.draft);
      netEl.textContent = t('track.net', { n: num(n, 2) });
      errEl.textContent = '';
    };
    refresh();
    const addCard = h(
      'div',
      { class: 'card' },
      h('div', { class: 'card-title' }, t('track.addQuestions')),
      h(
        'div',
        { class: 'chips' },
        ...subs.map((s) =>
          h('button', { class: 'chip', style: `--h:${s.hue}`, 'aria-pressed': String(this.subject === s.id), onclick: () => ((this.subject = s.id), this.render()) }, h('span', { class: 'dot' }), s.name[lang]),
        ),
      ),
      h(
        'div',
        { class: 'dyb' },
        h('div', { class: 'dyb-col good' }, h('label', {}, t('track.correct')), stepper(this.draft.d, (v) => ((this.draft.d = v), refresh()))),
        h('div', { class: 'dyb-col bad' }, h('label', {}, t('track.wrong')), stepper(this.draft.y, (v) => ((this.draft.y = v), refresh()))),
        h('div', { class: 'dyb-col' }, h('label', {}, t('track.blank')), stepper(this.draft.b, (v) => ((this.draft.b = v), refresh()))),
      ),
      h('div', { class: 'row' }, netEl, h('span', { class: 'muted small' }, penalty ? t('track.penalty', { n: penalty }) : t('track.noPenalty')), errEl),
      h('button', {
        class: 'btn btn-primary btn-wide',
        html: `${ICONS.plus}<span>${t('common.add')}</span>`,
        onclick: () => {
          const total = this.draft.d + this.draft.y + this.draft.b;
          if (!total) return void toast(t('track.negative'));
          const bulb = addQuestions(this.subject, this.draft);
          audio.save();
          haptic('success');
          toast(t('track.added', { n: total }) + (bulb ? ' 🌷' : ''), 'good');
          this.draft = { d: 0, y: 0, b: 0 };
        },
      }),
    );

    const today = questionsOn(d.questions, dayKey(Date.now()));
    const todayCard = d.goals.questions
      ? h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', {}, t('track.today', { n: today, g: d.goals.questions }))), h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, (today / d.goals.questions) * 100)}%;background:var(--gold)` })))
      : null;

    const out: HTMLElement[] = [addCard];
    if (todayCard) out.push(todayCard);
    if (!d.questions.length) {
      out.push(h('div', { class: 'card empty' }, h('div', { html: tekirSVG(96, 'idle', 'none') }), t('track.noQuestions')));
      return out;
    }
    const days = new Set(lastDays(new Date(), 30));
    const per = subjectQuestions(d.questions, days);
    const rows = [...per.entries()].sort((a, b) => b[1].d + b[1].y + b[1].b - (a[1].d + a[1].y + a[1].b));
    out.push(
      h(
        'div',
        { class: 'card' },
        h('div', { class: 'card-title' }, t('track.bySubject')),
        ...rows.map(([sid, s]) => {
          const acc = accuracy(s);
          return h(
            'div',
            { class: 'list-row' },
            h('span', { class: 'swatch', style: `--h:${subjectHue(sid)}` }),
            h('div', { class: 'grow' }, h('div', { class: 'title' }, subjectName(sid, lang)), h('div', { class: 'sub' }, `${tp('common.questions', s.d + s.y + s.b)} · ${t('common.net')} ${num(examNet(profile().exam, s), 2)}`), h('div', { class: 'bar thin' }, h('i', { style: `width:${acc}%;background:hsl(${subjectHue(sid)} 60% 50%)` }))),
            h('div', { class: 'val' }, pct(acc)),
          );
        }),
      ),
    );
    const recent = d.questions.slice(-8).reverse();
    out.push(
      h(
        'div',
        { class: 'card' },
        h('div', { class: 'card-title' }, t('track.recent')),
        ...recent.map((q) =>
          h(
            'div',
            { class: 'list-row' },
            h('span', { class: 'swatch', style: `--h:${subjectHue(q.subject)}` }),
            h('div', { class: 'grow' }, h('div', { class: 'title' }, subjectName(q.subject, lang)), h('div', { class: 'sub' }, `${dateFmt(new Date(q.at), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${q.d}✓ ${q.y}✗ ${q.b}○`)),
            h('div', { class: 'val' }, num(examNet(profile().exam, q), 2)),
            h('button', { class: 'del', 'aria-label': t('common.delete'), html: ICONS.trash, onclick: () => this.del('questions', q.id) }),
          ),
        ),
      ),
    );
    return out;
  }

  private async del(kind: 'questions' | 'mocks', id: string): Promise<void> {
    if (await confirmDialog(t('common.delete'), t('common.deleteQ'), t('common.delete'), t('common.cancel'), true)) removeRecord(kind, id);
  }

  // ───────────── mocks ─────────────

  private mocks(): HTMLElement[] {
    const d = store.data;
    const p = profile();
    const lang = currentLang();
    const list = d.mocks.filter((m) => this.kindExam(m) === p.exam);
    const out: HTMLElement[] = [h('button', { class: 'btn btn-primary btn-wide', html: `${ICONS.plus}<span>${t('track.addMock')}</span>`, onclick: () => this.mockSheet() })];
    if (!list.length) {
      out.push(h('div', { class: 'card empty' }, h('div', { html: tekirSVG(96, 'happy', 'none') }), t('track.noMocks')));
      return out;
    }
    const kinds = [...new Set(list.map((m) => m.kind))];
    if (!kinds.includes(this.trendKind)) this.trendKind = list[list.length - 1].kind;
    const series = list.filter((m) => m.kind === this.trendKind);
    const nets = series.map((m) => mockNet(p.exam, m.scores));
    const max = mockMax(p.exam, Object.keys(series[0]?.scores ?? {}));
    out.push(
      h(
        'div',
        { class: 'card' },
        h('div', { class: 'card-title' }, t('track.trend'), h('span', { class: 'right' }, `/ ${max}`)),
        kinds.length > 1 ? h('div', { class: 'chips' }, ...kinds.map((k) => h('button', { class: 'chip', 'aria-pressed': String(k === this.trendKind), onclick: () => ((this.trendKind = k), this.render()) }, this.kindName(k)))) : null,
        h('div', { class: 'chart', html: lineChart(series.map((m, i) => ({ v: nets[i], label: dateFmt(new Date(m.at), { day: 'numeric', month: 'numeric' }) })), { max }) }),
        h(
          'div',
          { class: 'kpis' },
          h('div', {}, h('small', {}, t('track.last')), h('b', {}, num(nets[nets.length - 1], 2))),
          h('div', {}, h('small', {}, t('track.best')), h('b', {}, num(Math.max(...nets), 2))),
          h('div', {}, h('small', {}, t('track.avg')), h('b', {}, num(nets.reduce((a, b) => a + b, 0) / nets.length, 2))),
        ),
      ),
    );
    out.push(
      h(
        'div',
        { class: 'card' },
        h('div', { class: 'card-title' }, t('track.history')),
        ...[...list].reverse().map((m) =>
          h(
            'button',
            { class: 'list-row btn-row', onclick: () => this.mockDetail(m) },
            h('span', { class: 'ico', html: ICONS.doc }),
            h('div', { class: 'grow' }, h('div', { class: 'title' }, m.name || this.kindName(m.kind)), h('div', { class: 'sub' }, `${dateFmt(new Date(m.at), { day: 'numeric', month: 'long', year: 'numeric' })} · ${this.kindName(m.kind)}`)),
            h('div', { class: 'val' }, `${num(mockNet(p.exam, m.scores), 2)}`),
            h('span', { class: 'ico', html: ICONS.chevron }),
          ),
        ),
      ),
    );
    void lang;
    return out;
  }

  /** Which exam a stored mock belongs to (from its first test id). */
  private kindExam(m: MockResult): string {
    const first = Object.keys(m.scores)[0];
    for (const e of Object.values(EXAMS)) if (e.tests.some((x) => x.id === first)) return e.id;
    return profile().exam;
  }

  private kindName(kind: string): string {
    const p = profile();
    const lang = currentLang();
    if (kind.startsWith('branch:')) return `${t('track.branch')} · ${testById(p.exam, kind.slice(7))?.name[lang] ?? ''}`;
    return EXAMS[p.exam].mocks.find((m) => m.id === kind)?.name[lang] ?? kind;
  }

  private mockSheet(): void {
    const p = profile();
    const lang = currentLang();
    const kinds = mocksFor(p.exam, p.field);
    let kind = kinds[0].id;
    const scores: Record<string, Score> = {};
    const today = new Date();
    let date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let name = '';
    const body = h('div', { class: 'modal-body' });
    const totalEl = h('b', { class: 'total-net' });
    const testsFor = (k: string) => (k.startsWith('branch:') ? [k.slice(7)] : kinds.find((m) => m.id === k)?.tests ?? []);
    const updateTotal = () => {
      const tests = testsFor(kind);
      const sub: Record<string, Score> = {};
      for (const id of tests) if (scores[id]) sub[id] = scores[id];
      totalEl.textContent = `${num(mockNet(p.exam, sub), 2)} / ${mockMax(p.exam, tests)}`;
    };
    const render = () => {
      const tests = testsFor(kind);
      const branchTests = EXAMS[p.exam].tests.filter((x) => !p.field || kinds.some((k) => k.tests.includes(x.id)));
      body.replaceChildren(
        h('div', { class: 'field' }, h('label', {}, t('track.mockKind')), h('div', { class: 'chips wrap' }, ...kinds.map((k) => h('button', { class: 'chip', 'aria-pressed': String(kind === k.id), onclick: () => ((kind = k.id), render()) }, k.name[lang])))),
        h('div', { class: 'field' }, h('label', {}, t('track.branch')), h('div', { class: 'chips' }, ...branchTests.map((x) => h('button', { class: 'chip', 'aria-pressed': String(kind === `branch:${x.id}`), onclick: () => ((kind = `branch:${x.id}`), render()) }, x.name[lang])))),
        h(
          'div',
          { class: 'mock-tests' },
          ...tests.map((id) => {
            const test = testById(p.exam, id)!;
            const s = (scores[id] ??= { d: 0, y: 0, b: test.questions });
            const netEl = h('span', { class: 'net' });
            const err = h('span', { class: 'err' });
            const upd = () => {
              s.b = Math.max(0, test.questions - s.d - s.y);
              const e = validateScore(s, test.questions);
              err.textContent = e === 'tooMany' ? t('track.tooMany', { n: test.questions }) : '';
              netEl.textContent = num(examNet(p.exam, s), 2);
              updateTotal();
            };
            const row = h(
              'div',
              { class: 'mock-test' },
              h('div', { class: 'mt-head' }, h('b', {}, test.name[lang]), h('span', { class: 'muted small' }, `${test.questions}`), h('span', { class: 'spacer' }), netEl),
              h('div', { class: 'dyb two' }, h('div', { class: 'dyb-col good' }, h('label', {}, t('track.correct')), stepper(s.d, (v) => ((s.d = v), upd()), test.questions)), h('div', { class: 'dyb-col bad' }, h('label', {}, t('track.wrong')), stepper(s.y, (v) => ((s.y = v), upd()), test.questions))),
              err,
            );
            upd();
            return row;
          }),
        ),
        h('div', { class: 'row' }, h('span', { class: 'muted' }, t('track.totalNet')), h('span', { class: 'spacer' }), totalEl),
        h(
          'div',
          { class: 'row two-fields' },
          h('div', { class: 'field grow' }, h('label', {}, t('track.mockName')), h('input', { class: 'input', value: name, maxlength: '40', oninput: (e: Event) => (name = (e.target as HTMLInputElement).value) })),
          h('div', { class: 'field' }, h('label', {}, t('track.mockDate')), h('input', { class: 'input', type: 'date', value: date, oninput: (e: Event) => (date = (e.target as HTMLInputElement).value) })),
        ),
        h('button', {
          class: 'btn btn-primary btn-wide',
          onclick: () => {
            const sub: Record<string, Score> = {};
            for (const id of tests) {
              const test = testById(p.exam, id)!;
              const s = scores[id];
              if (validateScore(s, test.questions)) return void toast(t('track.tooMany', { n: test.questions }));
              sub[id] = { ...s };
            }
            const [y, mo, da] = date.split('-').map(Number);
            const at = y ? new Date(y, mo - 1, da, 12).getTime() : Date.now();
            addMock(kind, name.trim(), sub, at);
            this.trendKind = kind;
            audio.save();
            haptic('success');
            toast(t('track.mockSaved'), 'good');
            m.close();
          },
        }, t('common.save')),
      );
      updateTotal();
    };
    render();
    const m = modal(body, { title: t('track.addMock') });
  }

  private mockDetail(mock: MockResult): void {
    const p = profile();
    const lang = currentLang();
    const m = modal(
      h(
        'div',
        { class: 'modal-body' },
        h('p', { class: 'muted' }, `${dateFmt(new Date(mock.at), { day: 'numeric', month: 'long', year: 'numeric' })} · ${this.kindName(mock.kind)}`),
        ...Object.entries(mock.scores).map(([id, s]) =>
          h('div', { class: 'list-row' }, h('div', { class: 'grow' }, h('div', { class: 'title' }, testById(p.exam, id)?.name[lang] ?? id), h('div', { class: 'sub' }, `${s.d}✓ ${s.y}✗ ${s.b}○ · ${pct(accuracy(s))}`)), h('div', { class: 'val' }, num(examNet(p.exam, s), 2))),
        ),
        h('div', { class: 'row' }, h('b', {}, t('track.totalNet')), h('span', { class: 'spacer' }), h('b', { class: 'total-net' }, `${num(mockNet(p.exam, mock.scores), 2)} / ${mockMax(p.exam, Object.keys(mock.scores))}`)),
        h('button', {
          class: 'btn btn-ghost btn-wide danger',
          html: `${ICONS.trash}<span>${t('common.delete')}</span>`,
          onclick: async () => {
            m.close();
            await this.del('mocks', mock.id);
          },
        }),
      ),
      { title: mock.name || this.kindName(mock.kind) },
    );
  }
}
