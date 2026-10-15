import type { Card, Move } from '../core/rules';
import { remainingCards } from '../core/rules';
import { hint } from '../core/solver';
import { Session, type LevelSpec } from '../game/session';
import { cap, num, t } from '../i18n';
import { chapterInfo, CHAPTERS } from '../meta/chapters';
import { questEvent, shareStars, todayKey } from '../meta/daily';
import { BOOSTER_PRICE, buyBooster, coins, EXTRA_MOVES, EXTRA_MOVES_PRICE, MAX_MOVE_ADS_PER_LEVEL, spendCoins, useBooster } from '../meta/economy';
import { recordLoss, recordWin, type WinOutcome } from '../meta/progress';
import { store, type BoosterId } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { haptic, track } from '../services/platform';
import { maybeAskReview } from '../services/review';
import { bookCover, coinIcon, ICONS, starIcon, tekirSVG } from './art';
import { Board } from './board';
import { h } from './dom';
import { confirmDialog, modal, toast } from './modal';

export interface GameCallbacks {
  exit(): void;
  next(level: number): void;
  restart(spec: LevelSpec): void;
}

const LOW_MOVES = 5;

export class GameScreen {
  readonly el: HTMLElement;
  readonly session: Session;
  private board: Board;
  private movesEl: HTMLElement;
  private boosterEls = new Map<string, HTMLButtonElement>();
  private moveAds = 0;
  private moveBuys = 0;
  private tutStep = 0;
  private tutEl: HTMLElement | null = null;
  private ended = false;

  constructor(
    private spec: LevelSpec,
    private cb: GameCallbacks,
  ) {
    const saved = store.data.run && store.data.run.key === spec.key ? store.data.run : null;
    this.session = new Session(spec, saved);
    this.board = new Board(this.session, {
      label: (card) => this.label(card),
      onDeck: () => this.deck(),
      onInvalid: () => {
        audio.error();
        void haptic('warning');
      },
    });
    const info = spec.daily ? null : chapterInfo(spec.n);
    const kind = spec.def.kind;
    const sub = spec.daily ? todayKey() : `${info!.chapter.name}${kind === 'boss' ? ` · ${t('hud.boss')}` : kind === 'hard' ? ` · ${t('hud.hard')}` : ''}`;
    this.movesEl = h('div', { class: 'pill moves' });
    const hud = h(
      'header',
      { class: 'hud' },
      h('button', { class: 'icon-btn', 'aria-label': 'Home', html: ICONS.home, onclick: () => this.quit() }),
      h('div', { class: 'hud-title' }, h('b', {}, spec.daily ? t('hud.daily') : t('hud.level', { n: spec.n })), h('small', {}, sub)),
      this.movesEl,
    );
    const bar = h('nav', { class: 'boosters' });
    const booster = (id: string, icon: string, label: string, onclick: () => void) => {
      const b = h('button', { class: 'booster', onclick: () => onclick() }, h('span', { html: icon }), label, h('span', { class: 'count' })) as HTMLButtonElement;
      this.boosterEls.set(id, b);
      bar.append(b);
    };
    booster('undo', ICONS.undo, t('booster.undo'), () => this.undo());
    booster('hint', ICONS.hint, t('booster.hint'), () => void this.hint());
    booster('paw', ICONS.paw, t('booster.paw'), () => void this.paw());
    booster('moves', ICONS.moves, t('booster.moves'), () => void this.offerMoves(false));
    this.el = h('section', { class: `screen game ${store.data.settings.bigText ? 'big-text' : ''}` }, hud, this.board.el, bar);
    this.session.on((e) => {
      if (e.type === 'move') {
        if (e.move.type === 'draw' || e.move.type === 'recycle') audio.flip();
        else if (e.move.dst.to === 'slot') {
          const slot = e.result.state.slots[e.move.dst.slot];
          const opened = !!slot && slot.count === 0 && !e.result.completed.length;
          if (e.result.completed.length) this.onComplete(e.move.dst.slot);
          else if (opened) audio.place();
          else if (slot) audio.shelve(slot.count / this.session.state.sizes[slot.cat]);
          if (!opened) {
            const n = e.move.src.from === 'waste' ? 1 : e.move.src.count;
            questEvent({ type: 'shelve', n });
            store.quiet((d) => {
              d.stats.shelved += n;
            });
          }
        } else audio.place();
        if (e.result.revealed.length) setTimeout(() => audio.flip(), 120);
        void haptic('light');
        store.quiet((d) => {
          d.stats.moves++;
        });
      }
      if (e.type === 'paw' && e.result.completed.length) this.onComplete(e.slot);
      this.refresh();
      this.persist();
      if (e.type === 'win') setTimeout(() => this.win(), 700);
      if (e.type === 'lose') setTimeout(() => this.lose(), 450);
    });
    store.subscribe(() => this.updateBoosters());
    requestAnimationFrame(() => {
      this.board.render(false);
      this.refresh();
      if (spec.n === 1 && !spec.daily && !store.data.tutorial.done) this.tutorial();
    });
  }

  destroy(): void {
    this.board.destroy();
    this.tutEl?.remove();
  }

  private label(card: Card): string {
    const c = this.spec.cats[card.cat];
    return card.kind === 'cat' ? c.name : cap(c.words[card.word]);
  }

  private persist(): void {
    if (this.ended) return;
    store.quiet((d) => {
      d.run = this.session.snapshot();
    });
  }

  private refresh(): void {
    this.board.render();
    const s = this.session.state;
    this.movesEl.innerHTML = '';
    this.movesEl.append(h('small', {}, t('hud.moves')), h('b', {}, num(s.movesLeft)));
    this.movesEl.classList.toggle('low', s.movesLeft <= LOW_MOVES && !this.session.won);
    this.updateBoosters();
    this.updateTutorial();
  }

  private updateBoosters(): void {
    const d = store.data;
    const set = (id: string, count: string, price: boolean, disabled = false) => {
      const b = this.boosterEls.get(id);
      if (!b) return;
      const c = b.querySelector('.count') as HTMLElement;
      c.textContent = count;
      c.classList.toggle('price', price);
      c.style.display = count ? '' : 'none';
      b.disabled = disabled;
    };
    set('undo', '', false, !this.session.canUndo);
    for (const id of ['hint', 'paw'] as BoosterId[]) {
      const n = d.boosters[id];
      set(id, n > 0 ? String(n) : String(BOOSTER_PRICE[id]), n <= 0, this.session.won);
    }
    set('moves', String(EXTRA_MOVES_PRICE[Math.min(this.moveBuys, EXTRA_MOVES_PRICE.length - 1)]), true, this.session.won);
  }

  // ───────────── actions ─────────────

  private deck(): void {
    if (this.session.state.movesLeft <= 0) return void this.lose();
    if (!this.session.deck()) audio.error();
  }

  private undo(): void {
    if (this.session.undo()) {
      audio.whoosh();
      if (!store.data.tutorial.tips.includes('undo')) {
        toast(t('booster.undoNote'));
        store.update((d) => {
          d.tutorial.tips.push('undo');
        });
      }
    }
  }

  private async ensureBooster(id: BoosterId): Promise<boolean> {
    if (store.data.boosters[id] > 0) return true;
    const name = t(id === 'hint' ? 'booster.hint' : 'booster.paw');
    const price = BOOSTER_PRICE[id];
    const ok = await confirmDialog(name, t('booster.buyQ', { name, n: 1, price }), t('common.buy'), t('common.cancel'));
    if (!ok) return false;
    if (!buyBooster(id, 1)) {
      audio.error();
      toast(t('common.notEnough'), 'bad');
      return false;
    }
    audio.coin();
    return true;
  }

  private async hint(): Promise<void> {
    if (this.session.won) return;
    if (!(await this.ensureBooster('hint'))) return;
    const m = this.session.hint();
    if (!m) return void toast(t('booster.noHint'));
    useBooster('hint');
    questEvent({ type: 'hint' });
    audio.booster();
    this.board.showHint(m as Move);
  }

  private async paw(): Promise<void> {
    if (this.session.won) return;
    if (!this.session.state.slots.some(Boolean)) return void toast(t('booster.noPaw'));
    if (!(await this.ensureBooster('paw'))) return;
    const r = this.session.paw();
    if (!r) return void toast(t('booster.noPaw'));
    useBooster('paw');
    audio.booster();
    toast(t('booster.pawDone'), 'good');
  }

  private onComplete(slot: number): void {
    audio.complete();
    void haptic('success');
    this.board.sparkle(slot);
    questEvent({ type: 'category' });
    store.quiet((d) => {
      d.stats.categories++;
    });
  }

  private async quit(): Promise<void> {
    if (this.session.won) return this.cb.exit();
    const ok = await confirmDialog(t('quit.title'), t('quit.body'), t('quit.yes'), t('common.cancel'));
    if (ok) {
      this.persist();
      void store.flush();
      this.cb.exit();
    }
  }

  // ───────────── moves offer / lose ─────────────

  /** +10 moves for a rewarded video (3 per level) or for coins (escalating). Resolves true if moves were added. */
  private async offerMoves(fromLose: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      let done = false;
      const price = EXTRA_MOVES_PRICE[Math.min(this.moveBuys, EXTRA_MOVES_PRICE.length - 1)];
      const left = remainingCards(this.session.state) + this.session.state.slots.filter(Boolean).length;
      const finish = (v: boolean) => {
        done = true;
        m.close();
        resolve(v);
      };
      const adBtn = h('button', { class: 'btn btn-video btn-wide', html: `${ICONS.video}<span>${t('lose.ad', { n: EXTRA_MOVES })}</span>` }) as HTMLButtonElement;
      adBtn.disabled = this.moveAds >= MAX_MOVE_ADS_PER_LEVEL;
      adBtn.onclick = async () => {
        adBtn.disabled = true;
        const ok = await ads.rewarded('moves');
        if (ok) {
          this.moveAds++;
          this.session.addMoves(EXTRA_MOVES, true);
          audio.booster();
          finish(true);
        } else {
          adBtn.disabled = false;
          toast(t('ad.unavailable'));
        }
      };
      const coinBtn = h('button', { class: 'btn btn-wide', html: `${coinIcon(24)}<span>${t('lose.coins', { n: EXTRA_MOVES, price: num(price) })}</span>` }) as HTMLButtonElement;
      coinBtn.disabled = coins() < price;
      coinBtn.onclick = () => {
        if (!spendCoins(price)) return;
        this.moveBuys++;
        this.session.addMoves(EXTRA_MOVES, true);
        audio.coin();
        finish(true);
      };
      const body = h(
        'div',
        { class: 'modal-body' },
        h('div', { class: 'mascot', html: tekirSVG(110, 'idle') }),
        h('p', { class: 'modal-text' }, fromLose ? t('lose.body', { n: Math.max(1, left) }) : t('booster.moves')),
        h('div', { class: 'coins-line', html: `${coinIcon(22)}<b>${num(coins())}</b>` }),
        h('div', { class: 'modal-actions col' }, adBtn, coinBtn),
      );
      if (fromLose) {
        body.append(
          h(
            'div',
            { class: 'modal-actions' },
            h('button', { class: 'btn btn-wood small', html: `${ICONS.restart}<span>${t('lose.retry')}</span>`, onclick: () => { finish(false); this.retry(); } }),
            h('button', { class: 'btn btn-ghost small', onclick: () => { finish(false); this.giveUp(); } }, t('lose.quit')),
          ),
          h('p', { class: 'tip' }, t('lose.tip')),
        );
      }
      const m = modal(body, {
        title: fromLose ? t('lose.title') : t('booster.moves'),
        dismissable: !fromLose,
        onClose: () => {
          if (!done) resolve(false);
        },
      });
    });
  }

  private lose(): void {
    if (this.ended || this.session.won || this.session.state.movesLeft > 0) return;
    audio.lose();
    void haptic('warning');
    track('level_fail', { key: this.spec.key });
    void this.offerMoves(true);
  }

  private retry(): void {
    recordLoss();
    store.update((d) => {
      d.run = null;
    });
    this.ended = true;
    this.cb.restart(this.spec);
  }

  private giveUp(): void {
    recordLoss();
    store.update((d) => {
      d.run = null;
    });
    this.ended = true;
    this.cb.exit();
  }

  // ───────────── win ─────────────

  private win(): void {
    if (this.ended) return;
    this.ended = true;
    const s = this.session.state;
    const stars = this.session.stars();
    const outcome = recordWin({ key: this.spec.key, level: this.spec.n, daily: this.spec.daily, stars, movesLeft: s.movesLeft, movesUsed: s.movesUsed, kind: this.spec.def.kind });
    questEvent({ type: 'win', stars });
    track('level_win', { key: this.spec.key, stars, moves: s.movesUsed });
    audio.win();
    void haptic('success');
    this.showWin(outcome);
    if (stars === 3) void maybeAskReview('win3');
  }

  private showWin(o: WinOutcome): void {
    const s = this.session.state;
    const starRow = h('div', { class: 'stars' });
    for (let i = 0; i < 3; i++) {
      const el = h('span', { class: `star ${i < o.stars ? 'on' : ''}`, style: `animation-delay:${0.15 + i * 0.18}s`, html: starIcon(56, i < o.stars) });
      starRow.append(el);
    }
    const coinsEl = h('b', {}, `+${num(o.coins)}`);
    const doubleBtn = h('button', { class: 'btn btn-video btn-wide', html: `${ICONS.video}<span>${t('win.double')}</span>` }) as HTMLButtonElement;
    doubleBtn.onclick = async () => {
      doubleBtn.disabled = true;
      if (await ads.rewarded('double')) {
        store.update((d) => {
          d.coins += o.coins;
        });
        coinsEl.textContent = `+${num(o.coins * 2)}`;
        audio.coin();
        doubleBtn.remove();
      } else doubleBtn.disabled = false;
    };
    const actions = h('div', { class: 'modal-actions col' });
    if (o.coins > 0) actions.append(doubleBtn);
    if (this.spec.daily) {
      actions.append(
        h('button', { class: 'btn btn-green btn-wide', html: `${ICONS.share}<span>${t('daily.share')}</span>`, onclick: () => void this.shareDaily(o.stars) }),
        h('button', { class: 'btn btn-wood btn-wide', onclick: () => { m.close(); this.cb.exit(); } }, t('win.home')),
      );
    } else {
      actions.append(
        h('button', { class: 'btn btn-green btn-wide', html: `${ICONS.play}<span>${t('win.next')}</span>`, onclick: () => { m.close(); void this.afterWin(o, true); } }),
        h('button', { class: 'btn btn-ghost small', onclick: () => { m.close(); void this.afterWin(o, false); } }, t('win.home')),
      );
    }
    const body = h(
      'div',
      { class: 'modal-body win' },
      starRow,
      h('div', { class: 'mascot', html: tekirSVG(120, 'happy') }),
      h('div', { class: 'earned', html: coinIcon(30) }, coinsEl),
      h('p', { class: 'modal-text' }, t('win.left', { n: s.movesLeft })),
      actions,
    );
    const m = modal(body, { title: this.spec.daily ? t('win.daily') : t('win.title'), dismissable: false });
  }

  private async afterWin(o: WinOutcome, next: boolean): Promise<void> {
    if (o.book !== null) await this.showBook(o.book, o.bookCoins);
    await ads.maybeInterstitial('level_end');
    if (next) this.cb.next(this.spec.n + 1);
    else this.cb.exit();
  }

  private showBook(index: number, reward: number): Promise<void> {
    return new Promise((resolve) => {
      const ch = CHAPTERS[index % CHAPTERS.length];
      const lang = document.documentElement.lang as 'tr' | 'en' | 'de' | 'es';
      const title = ch.book[lang] ?? ch.book.en;
      audio.complete();
      void maybeAskReview('chapter');
      const m = modal(
        h(
          'div',
          { class: 'modal-body' },
          h('p', { class: 'modal-text' }, t('chapter.body', { chapter: ch.name })),
          h('div', { class: 'book-reveal', html: bookCover(ch.color, title, 110) }),
          h('b', { class: 'book-title' }, title),
          h('div', { class: 'earned', html: coinIcon(26) }, h('b', {}, t('chapter.reward', { n: reward }))),
          h('button', { class: 'btn btn-green btn-wide', onclick: () => m.close() }, t('common.continue')),
        ),
        { title: t('chapter.title'), onClose: () => resolve() },
      );
    });
  }

  private async shareDaily(stars: number): Promise<void> {
    const text = t('daily.shareText', { date: todayKey(), stars: shareStars(stars), moves: this.session.state.movesUsed, streak: store.data.daily.streak });
    try {
      const { Share } = await import('@capacitor/share');
      if ((await Share.canShare()).value) {
        await Share.share({ text });
        return;
      }
    } catch {
      /* fall back to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(t('common.copied'), 'good');
    } catch {
      toast(text);
    }
  }

  // ───────────── tutorial ─────────────

  private tutorial(): void {
    this.tutStep = 1;
    this.tutEl = h('div', { class: 'tut' }, h('div', { class: 'tut-cat', html: tekirSVG(64, 'idle') }), h('p', {}), h('button', { class: 'btn small', onclick: () => this.skipTutorial() }, t('tut.ok')));
    this.el.append(this.tutEl);
    this.updateTutorial();
  }

  private skipTutorial(): void {
    this.tutStep = 0;
    this.tutEl?.remove();
    this.tutEl = null;
    store.update((d) => {
      d.tutorial.done = true;
    });
  }

  private updateTutorial(): void {
    if (!this.tutEl || !this.tutStep) return;
    const s = this.session.state;
    if (s.done.length >= 1 && this.tutStep < 4) this.tutStep = 4;
    else if (this.tutStep === 1 && s.slots.some(Boolean)) this.tutStep = 2;
    else if (this.tutStep === 2 && s.slots.some((x) => x && x.count > 0)) this.tutStep = 3;
    if (this.session.won) return this.skipTutorial();
    (this.tutEl.querySelector('p') as HTMLElement).textContent = t(`tut.${this.tutStep}` as 'tut.1');
    // Point at the move the step talks about (free: does not count as a hint used).
    const m = this.tutStep < 4 ? hint(s) : null;
    if (m) window.setTimeout(() => this.tutStep && this.board.showHint(m), 450);
  }
}
