import type { Card, Move, Source, Target } from '../core/rules';
import { runFrom, topRunLength } from '../core/rules';
import type { Session } from '../game/session';
import { h } from './dom';

/**
 * The card table. Every card is one absolutely positioned element keyed by
 * card id; after each state change the layout is recomputed and CSS
 * transitions animate cards to their new places (FLIP without the F).
 * Tap a card to auto-play it, or drag it (and the run above it) anywhere.
 */

export const SPINE_COLORS = ['#8a2f2a', '#2f6150', '#2b4a7a', '#b0801f', '#62407a', '#2a7176', '#a8582e'];

interface Metrics {
  W: number;
  H: number;
  cw: number;
  ch: number;
  gap: number;
  slotX: number[];
  slotY: number;
  colX: number[];
  colY: number;
  colBottom: number;
  stockX: number;
  wasteX: number;
  stockY: number;
}

interface Place {
  x: number;
  y: number;
  z: number;
  up: boolean;
  gone?: boolean;
}

export interface BoardCallbacks {
  /** Text for a card (word or category name). */
  label(card: Card): string;
  onMove?(): void;
  onInvalid?(cardIds: number[]): void;
  onDeck?(): void;
}

export class Board {
  readonly el: HTMLElement;
  private cards = new Map<number, HTMLElement>();
  private slots: HTMLElement[] = [];
  private stockEl: HTMLElement;
  private stockCount: HTMLElement;
  private m!: Metrics;
  private drag: { ids: number[]; src: Source; startX: number; startY: number; dx: number; dy: number; active: boolean; pointer: number } | null = null;
  private resizeObs: ResizeObserver;

  constructor(
    private session: Session,
    private cb: BoardCallbacks,
  ) {
    this.el = h('div', { class: 'board' });
    this.stockCount = h('span', { class: 'stock-count' });
    this.stockEl = h('button', { class: 'stock', 'aria-label': 'Deck', onclick: () => this.cb.onDeck?.() }, h('span', { class: 'stock-icon' }), this.stockCount);
    this.el.append(this.stockEl);
    const s = session.state;
    for (let i = 0; i < s.slots.length; i++) {
      const slot = h('div', { class: 'shelf', 'data-slot': String(i) }, h('i', { class: 'shelf-plank' }));
      this.slots.push(slot);
      this.el.append(slot);
    }
    for (const card of s.cards) {
      const el = this.makeCard(card);
      this.cards.set(card.id, el);
      this.el.append(el);
    }
    this.el.addEventListener('pointerdown', (e) => this.onDown(e));
    window.addEventListener('pointermove', this.onMoveBound);
    window.addEventListener('pointerup', this.onUpBound);
    window.addEventListener('pointercancel', this.onUpBound);
    this.resizeObs = new ResizeObserver(() => this.render(false));
    // Label heights depend on the web fonts; re-measure once they are in.
    void document.fonts?.ready.then(() => {
      this.peekCache.clear();
      this.render(false);
    });
    this.resizeObs.observe(this.el);
  }

  destroy(): void {
    window.removeEventListener('pointermove', this.onMoveBound);
    window.removeEventListener('pointerup', this.onUpBound);
    window.removeEventListener('pointercancel', this.onUpBound);
    this.resizeObs.disconnect();
  }

  private makeCard(card: Card): HTMLElement {
    const text = this.cb.label(card);
    const fit = fitText(text, card.kind);
    const front =
      card.kind === 'cat'
        ? h(
            'div',
            { class: 'face front', style: `--spine:${SPINE_COLORS[card.cat % SPINE_COLORS.length]}` },
            h('span', { class: 'cat-name', style: fit }, text),
            h('span', { class: 'cat-count' }, String(this.session.state.sizes[card.cat])),
          )
        : h('div', { class: 'face front' }, h('span', { class: 'word-text', style: fit }, text));
    const el = h('div', { class: `card ${card.kind}`, 'data-id': String(card.id) }, h('div', { class: 'inner' }, front, h('div', { class: 'face back' })));
    return el;
  }

  // ───────────── layout ─────────────

  private metrics(): Metrics {
    const s = this.session.state;
    const W = this.el.clientWidth || 360;
    const H = this.el.clientHeight || 600;
    const cols = Math.max(s.columns.length, s.slots.length, 5);
    const gap = Math.max(6, Math.round(W * 0.018));
    const pad = gap;
    const byWidth = Math.floor((W - pad * 2 - gap * (cols - 1)) / cols);
    const cw = Math.min(96, byWidth, Math.floor(H / 5.4 / 1.36));
    const ch = Math.round(cw * 1.36);
    const rowW = (n: number) => n * cw + (n - 1) * gap;
    const slotStart = (W - rowW(s.slots.length)) / 2;
    const slotY = 24;
    const colStart = (W - rowW(s.columns.length)) / 2;
    const colY = slotY + ch + 30;
    const stockY = H - ch - 6;
    return {
      W, H, cw, ch, gap,
      slotX: s.slots.map((_, i) => slotStart + i * (cw + gap)),
      slotY,
      colX: s.columns.map((_, i) => colStart + i * (cw + gap)),
      colY,
      colBottom: stockY - 12,
      stockX: (W - (cw * 2 + gap * 3)) / 2,
      wasteX: (W - (cw * 2 + gap * 3)) / 2 + cw + gap * 3,
      stockY,
    };
  }

  private peekCache = new Map<number, number>();
  private peekCw = 0;

  /** Vertical offset that keeps a covered card's whole label visible. */
  private peek(id: number, m: Metrics): number {
    if (this.peekCw !== m.cw) {
      this.peekCache.clear();
      this.peekCw = m.cw;
    }
    let off = this.peekCache.get(id);
    if (off === undefined) {
      const label = this.cards.get(id)?.querySelector<HTMLElement>('.word-text, .cat-name');
      const text = label?.offsetHeight ?? 0;
      const top = label?.offsetTop ?? 0;
      off = text > 0 ? Math.round(top + text + m.ch * 0.06) : Math.round(m.ch * 0.3);
      off = Math.min(Math.round(m.ch * 0.6), Math.max(Math.round(m.ch * 0.24), off));
      if (text > 0) this.peekCache.set(id, off);
    }
    return off;
  }

  private places(m: Metrics): Map<number, Place> {
    const s = this.session.state;
    const out = new Map<number, Place>();
    const seen = new Set<number>();
    s.columns.forEach((col, ci) => {
      const downOff = Math.max(5, Math.round(m.ch * 0.09));
      // A covered card shows exactly its label: one-line words stack tighter than two-line ones.
      const offs = col.up.slice(0, -1).map((id) => this.peek(id, m));
      const need = col.down.length * downOff + offs.reduce((a, b) => a + b, 0) + m.ch;
      const avail = m.colBottom - m.colY;
      if (need > avail && offs.length) {
        const room = Math.max(offs.length * 14, avail - m.ch - col.down.length * downOff);
        const scale = room / offs.reduce((a, b) => a + b, 0);
        for (let i = 0; i < offs.length; i++) offs[i] = Math.max(14, Math.floor(offs[i] * scale));
      }
      let y = m.colY;
      let z = 10;
      for (const id of col.down) {
        out.set(id, { x: m.colX[ci], y, z: z++, up: false });
        seen.add(id);
        y += downOff;
      }
      col.up.forEach((id, i) => {
        out.set(id, { x: m.colX[ci], y, z: z++, up: true });
        seen.add(id);
        y += offs[i] ?? 0;
      });
    });
    s.stock.forEach((id, i) => {
      out.set(id, { x: m.stockX + Math.min(i, 3) * 0.6, y: m.stockY - Math.min(i, 3) * 0.6, z: 5 + i, up: false });
      seen.add(id);
    });
    const wl = s.waste.length;
    s.waste.forEach((id, i) => {
      const fromTop = wl - 1 - i;
      const shift = fromTop < 3 ? (2 - Math.min(2, fromTop)) * Math.round(m.cw * 0.22) : 0;
      out.set(id, { x: m.wasteX + shift - Math.round(m.cw * 0.44), y: m.stockY, z: 100 + i, up: true });
      seen.add(id);
    });
    // Shelved cards: everything of an open category that is no longer on the table.
    s.slots.forEach((slot, si) => {
      if (!slot) return;
      const members = s.cards.filter((c) => c.cat === slot.cat && !seen.has(c.id));
      const catCard = members.find((c) => c.kind === 'cat');
      const words = members.filter((c) => c.kind === 'word' && c.id !== slot.top);
      // Words slide under the shelf label, which stays on top and counts them.
      const ordered = [...words, ...(slot.top !== null ? [s.cards[slot.top]] : []), ...(catCard ? [catCard] : [])];
      ordered.forEach((c, k) => {
        const lift = c === catCard ? 0 : 2 + Math.min(words.length, 4) - Math.min(k, 4);
        out.set(c.id, { x: m.slotX[si], y: m.slotY + lift, z: 200 + k, up: true });
        seen.add(c.id);
      });
    });
    for (const c of s.cards) if (!seen.has(c.id)) out.set(c.id, { x: m.W / 2 - m.cw / 2, y: -m.ch * 1.4, z: 300, up: true, gone: true });
    return out;
  }

  render(animate = true): void {
    const m = (this.m = this.metrics());
    const s = this.session.state;
    this.el.style.setProperty('--cw', `${m.cw}px`);
    this.el.style.setProperty('--ch', `${m.ch}px`);
    this.el.classList.toggle('no-anim', !animate);
    const places = this.places(m);
    for (const [id, p] of places) {
      const el = this.cards.get(id)!;
      el.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
      el.style.zIndex = String(p.z);
      el.classList.toggle('down', !p.up);
      el.classList.toggle('gone', !!p.gone);
    }
    // Playable cards get the pointer cursor and a subtle lift.
    for (const el of this.cards.values()) el.classList.remove('playable');
    const top = s.waste[s.waste.length - 1];
    if (top !== undefined) this.cards.get(top)!.classList.add('playable');
    s.columns.forEach((col, ci) => {
      const run = topRunLength(s, ci);
      col.up.slice(col.up.length - run).forEach((id) => this.cards.get(id)!.classList.add('playable'));
    });
    s.slots.forEach((slot, i) => {
      const el = this.slots[i];
      el.style.transform = `translate3d(${Math.round(m.slotX[i])}px, ${m.slotY}px, 0)`;
      el.classList.toggle('open', !!slot);
    });
    // Category cards count their shelved words while open, and show their size elsewhere.
    for (const card of s.cards) {
      if (card.kind !== 'cat') continue;
      const slot = s.slots.find((x) => x?.cat === card.cat);
      const el = this.cards.get(card.id)!;
      const count = el.querySelector('.cat-count') as HTMLElement;
      const text = slot ? `${slot.count}/${s.sizes[card.cat]}` : String(s.sizes[card.cat]);
      if (count.textContent !== text) {
        count.textContent = text;
        if (slot && slot.count > 0 && animate) {
          el.classList.remove('gulp');
          void el.offsetWidth;
          el.classList.add('gulp');
        }
      }
      el.classList.toggle('shelved', !!slot);
    }
    this.stockEl.style.transform = `translate3d(${Math.round(m.stockX)}px, ${m.stockY}px, 0)`;
    this.stockEl.classList.toggle('empty', !s.stock.length);
    this.stockEl.classList.toggle('recycle', !s.stock.length && s.waste.length > 1);
    this.stockCount.textContent = s.stock.length ? String(s.stock.length) : '';
    if (!animate) requestAnimationFrame(() => this.el.classList.remove('no-anim'));
  }

  // ───────────── effects ─────────────

  shake(ids: number[]): void {
    for (const id of ids) {
      const el = this.cards.get(id);
      if (!el) continue;
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    }
  }

  /** Pulses the source card(s) and destination of a hinted move. */
  showHint(move: Move): void {
    const s = this.session.state;
    const els: HTMLElement[] = [];
    if (move.type !== 'move') {
      els.push(this.stockEl);
    } else {
      const ids = move.src.from === 'waste' ? s.waste.slice(-1) : s.columns[move.src.col].up.slice(-move.src.count);
      for (const id of ids) els.push(this.cards.get(id)!);
      if (move.dst.to === 'slot') els.push(this.slots[move.dst.slot]);
      else {
        const col = s.columns[move.dst.col];
        const top = col.up[col.up.length - 1];
        if (top !== undefined) els.push(this.cards.get(top)!);
        else els.push(this.ghostAt(this.m.colX[move.dst.col], this.m.colY));
      }
    }
    for (const el of els) {
      el.classList.remove('hint');
      void el.offsetWidth;
      el.classList.add('hint');
      setTimeout(() => el.classList.remove('hint'), 2400);
    }
  }

  private ghostAt(x: number, y: number): HTMLElement {
    const g = h('div', { class: 'drop-ghost', style: `transform:translate3d(${x}px,${y}px,0)` });
    this.el.append(g);
    setTimeout(() => g.remove(), 2500);
    return g;
  }

  /** Celebration sparkle over a shelf that just completed. */
  sparkle(slot: number): void {
    const m = this.m;
    const burst = h('div', { class: 'burst', style: `transform:translate3d(${m.slotX[slot] + m.cw / 2}px, ${m.slotY + m.ch / 2}px, 0)` });
    for (let i = 0; i < 14; i++) burst.append(h('i', { style: `--a:${(i * 360) / 14}deg;--d:${0.6 + (i % 3) * 0.25}` }));
    this.el.append(burst);
    setTimeout(() => burst.remove(), 900);
  }

  slotCenter(slot: number): { x: number; y: number } {
    const r = this.el.getBoundingClientRect();
    return { x: r.left + this.m.slotX[slot] + this.m.cw / 2, y: r.top + this.m.slotY + this.m.ch / 2 };
  }

  // ───────────── input ─────────────

  private sourceFor(id: number): Source | null {
    const s = this.session.state;
    if (s.waste[s.waste.length - 1] === id) return { from: 'waste' };
    for (let ci = 0; ci < s.columns.length; ci++) {
      const idx = s.columns[ci].up.indexOf(id);
      if (idx >= 0) {
        const count = runFrom(s, ci, idx);
        return count ? { from: 'col', col: ci, count } : null;
      }
    }
    return null;
  }

  private idsFor(src: Source): number[] {
    const s = this.session.state;
    return src.from === 'waste' ? s.waste.slice(-1) : s.columns[src.col].up.slice(-src.count);
  }

  private onDown(e: PointerEvent): void {
    if (this.drag || e.button > 0) return;
    const cardEl = (e.target as HTMLElement).closest('.card') as HTMLElement | null;
    if (!cardEl) return;
    const id = Number(cardEl.dataset.id);
    const src = this.sourceFor(id);
    if (!src) {
      if (this.session.state.stock.includes(id)) this.cb.onDeck?.();
      else if (!cardEl.classList.contains('down')) this.cb.onInvalid?.([id]);
      return;
    }
    e.preventDefault();
    this.drag = { ids: this.idsFor(src), src, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, active: false, pointer: e.pointerId };
  }

  private onMoveBound = (e: PointerEvent) => this.onPointerMove(e);
  private onUpBound = (e: PointerEvent) => this.onPointerUp(e);

  private onPointerMove(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;
    if (!d.active && Math.hypot(d.dx, d.dy) > 8) {
      d.active = true;
      for (const id of d.ids) this.cards.get(id)!.classList.add('dragging');
    }
    if (d.active) {
      const places = this.places(this.m);
      d.ids.forEach((id, k) => {
        const p = places.get(id)!;
        const el = this.cards.get(id)!;
        el.style.transform = `translate3d(${p.x + d.dx}px, ${p.y + d.dy}px, 0) rotate(${Math.max(-6, Math.min(6, d.dx / 40))}deg)`;
        el.style.zIndex = String(1000 + k);
      });
    }
  }

  private onPointerUp(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    this.drag = null;
    for (const id of d.ids) this.cards.get(id)!.classList.remove('dragging');
    let result = null;
    if (!d.active) {
      result = this.session.tap(d.src);
      if (!result) {
        this.shake(d.ids);
        this.cb.onInvalid?.(d.ids);
      }
    } else {
      const dst = this.targetAt(e.clientX, e.clientY);
      if (dst) result = this.session.drop(d.src, dst);
      if (!result) {
        if (dst) this.cb.onInvalid?.(d.ids);
        this.render();
      }
    }
    if (result) this.cb.onMove?.();
  }

  private targetAt(cx: number, cy: number): Target | null {
    const r = this.el.getBoundingClientRect();
    const x = cx - r.left;
    const y = cy - r.top;
    const m = this.m;
    for (let i = 0; i < m.slotX.length; i++) {
      if (x >= m.slotX[i] - m.gap / 2 && x <= m.slotX[i] + m.cw + m.gap / 2 && y >= m.slotY - 24 && y <= m.slotY + m.ch + 14) return { to: 'slot', slot: i };
    }
    for (let i = 0; i < m.colX.length; i++) {
      if (x >= m.colX[i] - m.gap / 2 && x <= m.colX[i] + m.cw + m.gap / 2 && y >= m.colY - 14 && y <= m.colBottom + 10) return { to: 'col', col: i };
    }
    return null;
  }
}

/**
 * Font size as a fraction of the card width: as large as the base size, but
 * small enough that the longest word fits on one line (no mid-word breaks)
 * and long labels stay within three lines; very long words hyphenate.
 */
function fitText(text: string, kind: Card['kind']): string {
  const words = text.split(/\s+/);
  const longest = Math.max(...words.map((w) => [...w].length));
  const total = [...text].length;
  const em = kind === 'cat' ? 0.68 : 0.6;
  const room = kind === 'cat' ? 0.84 : 0.9;
  // Long compounds (German!) stop shrinking at a readable floor and hyphenate instead.
  const floor = kind === 'cat' ? 0.115 : 0.128;
  const size = (base: number) => Math.max(floor, Math.min(base, room / (longest * em), total > 16 ? base * 0.72 : base)).toFixed(3);
  return kind === 'cat' ? `--fs:${size(0.2)};--fsb:${size(0.22)}` : `--fs:${size(0.215)};--fsb:${size(0.24)}`;
}
