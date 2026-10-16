import { EXAMS } from '../core/exams';
import { accuracy, examNet, mockNet } from '../core/net';
import { dailyMinutes, dailyQuestions, hourHistogram, lastDays, subjectMinutes, subjectQuestions, weekDays } from '../core/records';
import { dayKey } from '../core/streak';
import { currentLang, dateFmt, dur, num, pct, t } from '../i18n';
import { subjectHue, subjectName } from '../meta/actions';
import { isPremium, profile, store } from '../meta/state';
import { audio } from '../services/audio';
import { shareFile } from '../services/files';
import { ICONS, tekirSVG } from './art';
import { barChart, heatmap, hoursChart, lineChart } from './charts';
import { h } from './dom';
import { toast } from './modal';

type Range = 'week' | 'month' | 'all';

export class StatsScreen {
  readonly el = h('section', { class: 'screen stats' });
  private range: Range = 'week';
  private unsub: () => void;

  constructor(private paywall: () => void) {
    this.unsub = store.subscribe(() => this.render());
    this.render();
  }

  destroy(): void {
    this.unsub();
  }

  private days(): string[] {
    const now = new Date();
    if (this.range === 'week') return weekDays(now);
    if (this.range === 'month') return lastDays(now, 30);
    const first = store.data.sessions[0]?.at ?? Date.now();
    const span = Math.min(730, Math.max(30, Math.ceil((Date.now() - first) / 86_400_000) + 1));
    return lastDays(now, span);
  }

  render(): void {
    const d = store.data;
    const lang = currentLang();
    const premium = isPremium();
    const seg = h(
      'div',
      { class: 'seg' },
      ...(['week', 'month', 'all'] as Range[]).map((r) =>
        h(
          'button',
          {
            'aria-pressed': String(this.range === r),
            onclick: () => {
              if (r !== 'week' && !premium) return this.paywall();
              audio.tap();
              this.range = r;
              this.render();
            },
          },
          t(r === 'week' ? 'stats.week' : r === 'month' ? 'stats.month' : 'stats.all'),
          r !== 'week' && !premium ? h('span', { class: 'lock', html: ICONS.lock }) : null,
        ),
      ),
    );
    if (!d.sessions.length && !d.questions.length) {
      this.el.replaceChildren(h('div', { class: 'stack' }, seg, h('div', { class: 'card empty' }, h('div', { html: tekirSVG(110, 'idle', 'tulip') }), t('stats.empty'))));
      return;
    }
    const days = this.days();
    const set = new Set(days);
    const mins = dailyMinutes(d.sessions, days);
    const qs = dailyQuestions(d.questions, days);
    const totalMin = mins.reduce((a, b) => a + b, 0);
    const totalQ = qs.reduce((a, b) => a + b, 0);
    const inRange = d.sessions.filter((s) => !s.wilted && set.has(dayKey(s.at)));
    const tulips = inRange.filter((s) => s.tulip).length;
    const activeDays = Math.max(1, this.range === 'week' ? Math.min(7, (new Date().getDay() + 6) % 7 + 1) : days.length);

    const kpi = (label: string, value: string, icon: string, color: string) => h('div', { class: 'kpi', style: `--c:${color}` }, h('span', { class: 'kpi-ico', html: icon }), h('b', {}, value), h('small', {}, label));
    const kpis = h(
      'div',
      { class: 'kpi-grid' },
      kpi(t('stats.focus'), dur(totalMin), ICONS.focus, 'var(--primary)'),
      kpi(t('stats.questions'), num(totalQ), ICONS.track, 'var(--gold)'),
      kpi(t('stats.sessions'), num(inRange.length), ICONS.check, 'var(--teal)'),
      kpi(t('stats.tulips'), num(tulips), ICONS.garden, '#e76f9b'),
    );

    let chart: string;
    if (this.range === 'week') {
      const labels = days.map((k) => {
        const [y, m, dd] = k.split('-').map(Number);
        return dateFmt(new Date(y, m - 1, dd), { weekday: 'short' }).slice(0, 3);
      });
      chart = barChart(mins, labels, { goal: d.goals.minutes, highlight: days.indexOf(dayKey(Date.now())), unit: (v) => (v >= 60 ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : `${v}′`) });
    } else if (this.range === 'month') {
      chart = barChart(mins, days.map((k, i) => (i % 5 === 4 ? String(Number(k.slice(8))) : '')), { goal: d.goals.minutes, highlight: days.length - 1 });
    } else {
      const byMonth = new Map<string, number>();
      days.forEach((k, i) => byMonth.set(k.slice(0, 7), (byMonth.get(k.slice(0, 7)) ?? 0) + mins[i]));
      const keys = [...byMonth.keys()].slice(-12);
      chart = barChart(keys.map((k) => Math.round((byMonth.get(k) ?? 0) / 60)), keys.map((k) => dateFmt(new Date(Number(k.slice(0, 4)), Number(k.slice(5)) - 1, 1), { month: 'short' })), { highlight: keys.length - 1, unit: (v) => `${v}` });
    }

    // Heatmap: last 16 weeks, Monday-first.
    const hmDays = lastDays(new Date(), 112);
    const hmMins = dailyMinutes(d.sessions, hmDays);
    const firstDate = new Date(Number(hmDays[0].slice(0, 4)), Number(hmDays[0].slice(5, 7)) - 1, Number(hmDays[0].slice(8)));
    const weekday0 = (firstDate.getDay() + 6) % 7;
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    hmDays.forEach((k, i) => {
      const m = Number(k.slice(5, 7));
      if (m !== lastMonth && Number(k.slice(8)) <= 7) {
        monthLabels.push({ col: Math.floor((i + weekday0) / 7), label: dateFmt(new Date(Number(k.slice(0, 4)), m - 1, 1), { month: 'short' }) });
        lastMonth = m;
      }
    });
    const hm = heatmap(hmDays.map((k, i) => ({ key: k, v: hmMins[i], weekday: i === 0 ? weekday0 : 0 })), d.goals.minutes, monthLabels);

    const subs = subjectMinutes(d.sessions, set);
    const maxSub = Math.max(1, ...subs.map((s) => s.minutes));
    const hours = hourHistogram(d.sessions);
    const best = hours.indexOf(Math.max(...hours));
    // Best 2-hour window.
    let bw = 0;
    let bwi = 0;
    for (let i = 0; i < 24; i++) {
      const v = hours[i] + hours[(i + 1) % 24];
      if (v > bw) {
        bw = v;
        bwi = i;
      }
    }

    const cards: HTMLElement[] = [
      seg,
      kpis,
      h('div', { class: 'card' }, h('div', { class: 'card-title' }, t('stats.focus'), h('span', { class: 'right' }, t('stats.avg', { m: dur(totalMin / activeDays) }))), h('div', { class: 'chart', html: chart })),
      h('div', { class: 'card' }, h('div', { class: 'card-title' }, t('stats.heatmap')), h('div', { class: 'heat-scroll', html: hm }), h('div', { class: 'heat-legend' }, h('span', {}, t('stats.less')), ...[0, 1, 2, 3, 4].map((k) => h('i', { class: `l${k}` })), h('span', {}, t('stats.more')))),
    ];
    if (subs.length) {
      cards.push(
        h(
          'div',
          { class: 'card' },
          h('div', { class: 'card-title' }, t('stats.subjects')),
          ...subs.map((s) =>
            h('div', { class: 'sub-row' }, h('span', { class: 'swatch', style: `--h:${subjectHue(s.subject)}` }), h('span', { class: 'sub-name' }, subjectName(s.subject, lang)), h('div', { class: 'bar grow' }, h('i', { style: `width:${(s.minutes / maxSub) * 100}%;background:hsl(${subjectHue(s.subject)} 62% 52%)` })), h('span', { class: 'sub-val' }, dur(s.minutes))),
          ),
        ),
      );
    }
    if (Math.max(...hours) > 0) {
      const fmt = (hh: number) => `${String(hh % 24).padStart(2, '0')}:00`;
      cards.push(h('div', { class: 'card' }, h('div', { class: 'card-title' }, t('stats.hours')), h('div', { class: 'chart', html: hoursChart(hours) }), h('p', { class: 'muted small' }, t('stats.hoursTip', { from: fmt(bwi), to: fmt(bwi + 2) }))));
      void best;
    }
    const p = profile();
    const mocks = d.mocks.filter((m) => Object.keys(m.scores).every((id) => EXAMS[p.exam].tests.some((x) => x.id === id)));
    if (mocks.length >= 2) {
      const kind = mocks[mocks.length - 1].kind;
      const series = mocks.filter((m) => m.kind === kind).slice(-12);
      cards.push(h('div', { class: 'card' }, h('div', { class: 'card-title' }, t('stats.mocks')), h('div', { class: 'chart', html: lineChart(series.map((m) => ({ v: mockNet(p.exam, m.scores), label: dateFmt(new Date(m.at), { day: 'numeric', month: 'numeric' }) }))) })));
    }
    // Premium: accuracy by subject + CSV report.
    const accCard = h('div', { class: `card ${premium ? '' : 'locked-card'}` }, h('div', { class: 'card-title' }, t('stats.subjectNets'), premium ? null : h('span', { class: 'badge', html: `${ICONS.crown}<span>${t('common.premium')}</span>` })));
    const per = subjectQuestions(d.questions, premium ? set : null);
    if (premium) {
      for (const [sid, s] of per) {
        const acc = accuracy(s);
        accCard.append(h('div', { class: 'sub-row' }, h('span', { class: 'swatch', style: `--h:${subjectHue(sid)}` }), h('span', { class: 'sub-name' }, subjectName(sid, lang)), h('div', { class: 'bar grow' }, h('i', { style: `width:${acc}%;background:${acc >= 75 ? 'var(--good)' : acc >= 50 ? 'var(--gold)' : 'var(--bad)'}` })), h('span', { class: 'sub-val' }, `${pct(acc)} · ${num(examNet(p.exam, s), 1)}`)));
      }
      if (!per.size) accCard.append(h('p', { class: 'muted small' }, t('track.noQuestions')));
      accCard.append(h('button', { class: 'btn btn-ghost btn-wide', html: `${ICONS.download}<span>${t('stats.export')}</span>`, onclick: () => void this.exportCsv() }));
    } else {
      accCard.append(h('p', { class: 'muted small' }, t('stats.premiumHint')), h('button', { class: 'btn btn-gold btn-wide', html: `${ICONS.crown}<span>${t('paywall.title')}</span>`, onclick: () => this.paywall() }));
    }
    cards.push(accCard);
    this.el.replaceChildren(h('div', { class: 'stack' }, ...cards));
  }

  private async exportCsv(): Promise<void> {
    const d = store.data;
    const lang = currentLang();
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = ['type,date,subject_or_test,minutes,correct,wrong,blank,net,tulip'];
    const p = profile();
    for (const s of d.sessions) rows.push(['focus', new Date(s.at).toISOString(), esc(subjectName(s.subject, lang)), Math.round(s.sec / 60), '', '', '', '', s.tulip ?? (s.wilted ? 'wilted' : '')].join(','));
    for (const q of d.questions) rows.push(['questions', new Date(q.at).toISOString(), esc(subjectName(q.subject, lang)), '', q.d, q.y, q.b, examNet(p.exam, q), ''].join(','));
    for (const m of d.mocks) for (const [id, s] of Object.entries(m.scores)) rows.push(['mock', new Date(m.at).toISOString(), esc(`${m.name || m.kind} / ${id}`), '', s.d, s.y, s.b, examNet(p.exam, s), ''].join(','));
    const ok = await shareFile(`lale-rapor-${dayKey(Date.now())}.csv`, '﻿' + rows.join('\n'), 'text/csv');
    if (!ok) toast(t('paywall.failed'));
  }
}
