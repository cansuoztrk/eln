import { EXAMS, type ExamId } from '../core/exams';
import { decode, extractCode, isoWeek, MAX_NAME, type Summary } from '../core/friends';
import { dur, num, t } from '../i18n';
import { myCode, weekSummary } from '../meta/actions';
import { store, type Friend } from '../meta/state';
import { audio } from '../services/audio';
import { copyText, shareText } from '../services/files';
import { haptic, track } from '../services/platform';
import { ICONS, tekirSVG } from './art';
import { h } from './dom';
import { confirmDialog, modal, toast } from './modal';

const examShort = (id: string) => EXAMS[id as ExamId]?.short ?? id.toUpperCase();
const sameWeek = (s: Summary, now: Date) => {
  const w = isoWeek(now);
  return s.year === w.year && s.week === w.week;
};
/** A friend is the same person when name and exam match (codes carry no IDs on purpose). */
const friendKey = (s: Summary) => `${s.name.toLocaleLowerCase('tr')}|${s.exam}`;

/** Adds or refreshes a friend from a pasted message. Returns a toast-ready result. */
export function addFriendFromText(text: string, now = new Date()): { ok: boolean; message: string } {
  const code = extractCode(text);
  const s = code ? decode(code) : null;
  if (!code || !s) return { ok: false, message: t('friends.invalid') };
  if (code.toUpperCase() === myCode(now).toUpperCase()) {
    return { ok: false, message: t('friends.self') };
  }
  const existing = store.data.friends.find((f) => friendKey(f.summary) === friendKey(s));
  if (existing && (existing.summary.year > s.year || (existing.summary.year === s.year && existing.summary.week > s.week))) {
    return { ok: false, message: t('friends.older') };
  }
  store.update((d) => {
    d.friends = d.friends.filter((f) => friendKey(f.summary) !== friendKey(s));
    d.friends.push({ code: code.toUpperCase(), added: now.getTime(), summary: s });
  });
  track('friend_add', { updated: !!existing });
  const msg = existing ? t('friends.updated', { name: s.name }) : t('friends.added', { name: s.name });
  return { ok: true, message: sameWeek(s, now) ? msg : `${msg} ${t('friends.old')}` };
}

export class FriendsScreen {
  readonly el = h('section', { class: 'screen friends' });
  private unsub: () => void;

  constructor() {
    this.unsub = store.subscribe(() => this.render());
    this.render();
  }

  destroy(): void {
    this.unsub();
  }

  render(): void {
    const d = store.data;
    const now = new Date();
    const me = weekSummary(now);
    const code = myCode(now);
    const w = isoWeek(now);

    // ── My week ──
    const stat = (v: string, label: string, icon: string) => h('div', { class: 'mini-stat' }, h('span', { class: 'ico-sm', html: icon }), h('b', {}, v), h('small', {}, label));
    const nameBtn = h('button', { class: 'name-btn', html: `<span>${escapeHtml(d.name || t('friends.setName'))}</span>${ICONS.edit}`, onclick: () => this.editName() });
    const mine = h(
      'div',
      { class: 'card my-week' },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, t('friends.myWeek'), ' · ', t('friends.week', { n: w.week })), nameBtn), h('span', { class: 'badge soft' }, examShort(me.exam))),
      h('div', { class: 'mini-stats' }, stat(dur(me.minutes), t('stats.focus'), ICONS.focus), stat(num(me.questions), t('stats.questions'), ICONS.track), stat(num(me.streak), t('friends.streak'), ICONS.flame), stat(num(me.tulips), t('stats.tulips'), ICONS.garden)),
      h('div', { class: 'code-box', 'aria-label': t('friends.codeLabel') }, h('code', {}, code)),
      h(
        'div',
        { class: 'row gap' },
        h('button', {
          class: 'btn btn-primary grow',
          html: `${ICONS.share}<span>${t('friends.share')}</span>`,
          onclick: async () => {
            if (!d.name) return this.editName(true);
            audio.tap();
            const r = await shareText(t('friends.shareText', { code, m: me.minutes, q: me.questions }));
            track('friend_share', { via: r });
            if (r === 'copied') toast(t('common.copied'), 'good');
            else if (r === 'failed') toast(t('friends.copyFailed'));
          },
        }),
        h('button', {
          class: 'btn btn-ghost',
          'aria-label': t('common.copy'),
          html: ICONS.copy,
          onclick: async () => {
            if (!d.name) return this.editName();
            haptic('light');
            toast((await copyText(code)) ? t('common.copied') : t('friends.copyFailed'), 'good');
          },
        }),
      ),
      h('p', { class: 'muted small' }, t('friends.how')),
    );

    // ── Add a friend ──
    const input = h('input', { class: 'input', type: 'text', placeholder: t('friends.paste'), autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'done' }) as HTMLInputElement;
    const submit = () => {
      const v = input.value.trim();
      if (!v) return;
      const r = addFriendFromText(v);
      haptic(r.ok ? 'success' : 'warning');
      if (r.ok) audio.plant();
      toast(r.message, r.ok ? 'good' : 'info');
      if (r.ok) input.value = '';
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
    const add = h('div', { class: 'card' }, h('div', { class: 'card-title' }, t('friends.add')), h('div', { class: 'row gap' }, input, h('button', { class: 'btn btn-teal', html: ICONS.plus, 'aria-label': t('common.add'), onclick: submit })));

    // ── Leaderboard ──
    const current = d.friends.filter((f) => sameWeek(f.summary, now));
    const stale = d.friends.filter((f) => !sameWeek(f.summary, now));
    type Row = { s: Summary; me: boolean; f?: Friend };
    const rows: Row[] = [{ s: me, me: true }, ...current.map((f) => ({ s: f.summary, me: false, f }))].sort((a, b) => b.s.minutes - a.s.minutes || b.s.questions - a.s.questions);
    const max = Math.max(1, ...rows.map((r) => r.s.minutes));
    const medal = ['🥇', '🥈', '🥉'];
    const board = h(
      'div',
      { class: 'card' },
      h('div', { class: 'card-title' }, t('friends.board')),
      ...rows.map((r, i) =>
        h(
          'button',
          { class: `lb-row ${r.me ? 'me' : ''}`, onclick: () => (r.f ? this.friendSheet(r.f) : undefined) },
          h('span', { class: 'lb-rank' }, rows.length > 1 && i < 3 ? medal[i] : String(i + 1)),
          h(
            'div',
            { class: 'grow lb-main' },
            h('div', { class: 'lb-name' }, r.me ? `${r.s.name} (${t('friends.you')})` : r.s.name, h('span', { class: 'badge tiny' }, examShort(r.s.exam))),
            h('div', { class: 'bar mini' }, h('i', { style: `width:${(r.s.minutes / max) * 100}%` })),
            h('div', { class: 'lb-sub muted small' }, `${num(r.s.questions)} ${t('stats.questions').toLocaleLowerCase()} · ${num(r.s.tulips)} 🌷 · ${num(r.s.streak)} 🔥`),
          ),
          h('b', { class: 'lb-val' }, dur(r.s.minutes)),
        ),
      ),
      rows.length === 1 ? h('div', { class: 'empty-inline' }, h('div', { html: tekirSVG(84, 'idle', 'tulip') }), h('p', { class: 'muted small' }, t('friends.empty'))) : null,
    );

    const cards: HTMLElement[] = [mine, add, board];
    if (stale.length) {
      cards.push(
        h(
          'div',
          { class: 'card' },
          h('div', { class: 'card-title' }, t('friends.staleTitle')),
          ...stale.map((f) =>
            h(
              'button',
              { class: 'lb-row stale', onclick: () => this.friendSheet(f) },
              h('span', { class: 'lb-rank' }, '·'),
              h('div', { class: 'grow lb-main' }, h('div', { class: 'lb-name' }, f.summary.name, h('span', { class: 'badge tiny' }, examShort(f.summary.exam))), h('div', { class: 'muted small' }, `${t('friends.week', { n: f.summary.week })} · ${dur(f.summary.minutes)}`)),
              h('span', { class: 'muted small' }, t('friends.stale')),
            ),
          ),
        ),
      );
    }
    this.el.replaceChildren(h('div', { class: 'stack' }, ...cards));
  }

  private editName(thenShare = false): void {
    const input = h('input', { class: 'input', type: 'text', maxlength: String(MAX_NAME), value: store.data.name, placeholder: t('friends.namePh'), autocomplete: 'nickname' }) as HTMLInputElement;
    const save = () => {
      const v = input.value.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
      if (!v) return void input.focus();
      store.update((d) => {
        d.name = v;
      });
      m.close();
      if (thenShare) setTimeout(() => (this.el.querySelector('.my-week .btn-primary') as HTMLButtonElement | null)?.click(), 220);
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && save());
    const m = modal(h('div', { class: 'modal-body' }, h('p', { class: 'muted small' }, t('onboard.nameHelp')), input, h('div', { class: 'modal-actions' }, h('button', { class: 'btn btn-primary btn-wide', onclick: save }, t('common.save')))), { title: t('friends.name') });
    setTimeout(() => input.focus(), 250);
  }

  private friendSheet(f: Friend): void {
    const s = f.summary;
    const m = modal(
      h(
        'div',
        { class: 'modal-body' },
        h('div', { class: 'mini-stats' }, ...[
          [dur(s.minutes), t('stats.focus')],
          [num(s.questions), t('stats.questions')],
          [num(s.streak), t('friends.streak')],
          [num(s.tulips), t('stats.tulips')],
        ].map(([v, l]) => h('div', { class: 'mini-stat' }, h('b', {}, v), h('small', {}, l)))),
        h('p', { class: 'muted small' }, `${examShort(s.exam)} · ${t('friends.week', { n: s.week })} ${s.year}`),
        h(
          'div',
          { class: 'modal-actions' },
          h('button', {
            class: 'btn btn-ghost danger',
            html: `${ICONS.trash}<span>${t('friends.remove')}</span>`,
            onclick: async () => {
              m.close();
              if (!(await confirmDialog(t('friends.remove'), t('friends.removeQ', { name: s.name }), t('friends.remove'), t('common.cancel'), true))) return;
              store.update((d) => {
                d.friends = d.friends.filter((x) => x !== f && friendKey(x.summary) !== friendKey(s));
              });
            },
          }),
        ),
      ),
      { title: s.name },
    );
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
