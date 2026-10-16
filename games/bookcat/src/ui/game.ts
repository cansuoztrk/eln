import type { Card, Move, State } from '../core/rules';
import { remainingCards } from '../core/rules';
import { hint } from '../core/solver';
import { Session, type LevelSpec } from '../game/session';
import { cap, num, t } from '../i18n';
import { chapterInfo, CHAPTERS } from '../meta/chapters';
import { questEvent, shareStars } from '../meta/daily';
import { addBooster, BOOSTER_PRICE, buyBooster, coins, EXTRA_MOVES, EXTRA_MOVES_PRICE, MAX_MOVE_ADS_PER_LEVEL, spendCoins, useBooster } from '../meta/economy';
import { recordLoss, recordWin, type WinOutcome } from '../meta/progress';
import { store, type BoosterId, type RunSlot } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { askNotificationsOnce } from '../services/notify';
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
  private readonly slot: RunSlot;
  private tutStep = 0;
  /** Tutorial step whose bubble the player closed with "Got it" (it returns at the next step). */
  private tutHidden = 0;
  private tutEl: HTMLElement | null = null;
  private tutTimer = 0;
  /** The run is over (won, retried or given up): nothing more is saved for it. */
  private ended = false;
  /** The screen was left: pending timers and dialogs must not act any more. */
  private dead = false;
  private timers = new Set<number>();
  private loseTimer = 0;
  private loseOpen = false;
  /** A +moves offer is on screen (from the booster bar or the lose dialog). */
  private offerOpen = false;
  /** A booster action is waiting for its buy prompt. */
  private busy = false;
  /** The state the last paid hint was shown for, so a double tap does not pay twice. */
  private hintFor: State | null = null;
  private lastHint: Move | null = null;
  private unsubStore: () => void;

  constructor(
    private spec: LevelSpec,
    private cb: GameCallbacks,
  ) {
    this.slot = spec.daily ? 'daily' : 'journey';
    const saved = store.data.runs[this.slot];
    this.session = new Session(spec, saved?.key === spec.key ? saved : null);
    // A run that no longer fits the level (retuned by an update, corrupt) is dropped.
    if (saved?.key === spec.key && !this.session.resumed) {
      store.quiet((d) => {
        d.runs[this.slot] = null;
      });
    }
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
    const sub = spec.daily ? this.puzzleDate : `${info!.chapter.name}${kind === 'boss' ? ` · ${t('hud.boss')}` : kind === 'hard' ? ` · ${t('hud.hard')}` : ''}`;
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
          if (e.result.completed.length) this.celebrate(e.move.dst.slot);
          else if (opened) audio.place();
          else if (slot) audio.shelve(slot.count / this.session.state.sizes[slot.cat]);
        } else audio.place();
        if (e.result.revealed.length) setTimeout(() => audio.flip(), 120);
        void haptic('light');
        this.credit(true);
        store.quiet((d) => {
          d.stats.moves++;
        });
      }
      if (e.type === 'paw') {
        if (e.result.completed.length) this.celebrate(e.slot);
        // Words fetched by the paw are not "shelved by the player"; a finished shelf still counts.
        this.credit(false);
      }
      this.refresh();
      this.persist();
      if (e.type === 'win') this.onWin(700);
      if (e.type === 'lose') {
        clearTimeout(this.loseTimer);
        this.loseTimer = this.later(() => this.lose(), 450);
      }
    });
    this.unsubStore = store.subscribe(() => this.updateBoosters());
    requestAnimationFrame(() => {
      if (this.dead) return;
      this.board.render(false);
      this.refresh();
      if (spec.n === 1 && !spec.daily && !store.data.tutorial.done) this.tutorial();
      // A run saved in a finished state (older versions saved won runs; a lost
      // run is saved at 0 moves) goes straight to its dialog instead of a dead board.
      if (this.session.won) this.onWin(0);
      else if (this.session.lost) this.lose();
    });
  }

  destroy(): void {
    this.dead = true;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    clearTimeout(this.tutTimer);
    this.unsubStore();
    this.board.destroy();
    this.tutEl?.remove();
  }

  /** setTimeout that is cancelled when the screen goes away. */
  private later(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (!this.dead) fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  private get puzzleDate(): string {
    return this.spec.key.slice(1);
  }

  private label(card: Card): string {
    const c = this.spec.cats[card.cat];
    return card.kind === 'cat' ? c.name : cap(c.words[card.word]);
  }

  /** Saves the run for resuming; a finished (won) run is never saved. */
  private persist(): void {
    if (this.ended || this.session.won) return;
    store.quiet((d) => {
      d.runs[this.slot] = this.session.snapshot();
    });
  }

  /** Counts new shelving progress for quests and stats (never twice for undo + redo). */
  private credit(words: boolean): void {
    const c = this.session.creditProgress();
    if (words && c.words > 0) {
      questEvent({ type: 'shelve', n: c.words });
      store.quiet((d) => {
        d.stats.shelved += c.words;
      });
    }
    for (let i = 0; i < c.cats.length; i++) questEvent({ type: 'category' });
    if (c.cats.length) {
      store.quiet((d) => {
        d.stats.categories += c.cats.length;
      });
    }
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
    set('moves', String(this.movesPrice), true, this.session.won);
  }

  // ───────────── actions ─────────────

  private get movesPrice(): number {
    return EXTRA_MOVES_PRICE[Math.min(this.session.moveBuys, EXTRA_MOVES_PRICE.length - 1)];
  }

  private deck(): void {
    if (this.session.state.movesLeft <= 0) return void this.lose();
    if (!this.session.deck()) audio.error();
  }

  private undo(): void {
    const undone = this.session.undo();
    if (undone) {
      audio.whoosh();
      if (undone === 'paw') {
        // The paid Paw comes back with its undo.
        addBooster('paw', 1);
        store.update((d) => {
          d.stats.pawsUsed = Math.max(0, d.stats.pawsUsed - 1);
        });
      }
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
    if (this.session.won || this.busy) return;
    // Same board as the last paid hint (double tap): show it again for free.
    if (this.hintFor === this.session.state && this.lastHint) return void this.board.showHint(this.lastHint);
    this.busy = true;
    try {
      if (!(await this.ensureBooster('hint')) || this.dead || this.session.won) return;
      const m = this.session.hint();
      if (!m) return void toast(t('booster.noHint'));
      useBooster('hint');
      questEvent({ type: 'hint' });
      audio.booster();
      this.hintFor = this.session.state;
      this.lastHint = m;
      this.board.showHint(m as Move);
    } finally {
      this.busy = false;
    }
  }

  private async paw(): Promise<void> {
    if (this.session.won || this.busy) return;
    if (!this.session.state.slots.some(Boolean)) return void toast(t('booster.noPaw'));
    this.busy = true;
    try {
      if (!(await this.ensureBooster('paw')) || this.dead || this.session.won) return;
      const r = this.session.paw();
      if (!r) return void toast(t('booster.noPaw'));
      useBooster('paw');
      audio.booster();
      toast(t('booster.pawDone'), 'good');
    } finally {
      this.busy = false;
    }
  }

  /** Sound, haptics and sparkle for a finished shelf (quests are counted by credit()). */
  private celebrate(slot: number): void {
    audio.complete();
    void haptic('success');
    this.board.sparkle(slot);
  }

  private async quit(): Promise<void> {
    if (this.session.won) return this.cb.exit();
    // A pending "out of moves" dialog waits for the answer instead of opening over it.
    clearTimeout(this.loseTimer);
    const ok = await confirmDialog(t('quit.title'), t('quit.body'), t('quit.yes'), t('common.cancel'));
    if (this.dead) return;
    if (ok) {
      this.persist();
      void store.flush();
      this.cb.exit();
    } else this.lose();
  }

  // ───────────── moves offer / lose ─────────────

  /** +10 moves for a rewarded video (3 per level) or for coins (escalating). Resolves true if moves were added. */
  private async offerMoves(fromLose: boolean): Promise<boolean> {
    if (this.dead || this.ended || this.offerOpen || this.session.won) return false;
    this.offerOpen = true;
    /** The dialog was closed while its video was still playing: the video's outcome decides what follows. */
    let closedPending = false;
    const added = await new Promise<boolean>((resolve) => {
      let done = false;
      let pending = false;
      const price = this.movesPrice;
      const left = remainingCards(this.session.state) + this.session.state.slots.filter(Boolean).length;
      const finish = (v: boolean) => {
        if (done) return;
        done = true;
        m.close();
        resolve(v);
      };
      const buttons: HTMLButtonElement[] = [];
      const adsLeft = () => this.session.moveAds < MAX_MOVE_ADS_PER_LEVEL;
      /** While a video is loading or playing nothing else in the dialog can be pressed. */
      const setPending = (v: boolean) => {
        pending = v;
        for (const b of buttons) b.disabled = v;
        if (!v) {
          adBtn.disabled = !adsLeft();
          coinBtn.disabled = coins() < price;
        }
      };
      const adBtn = h('button', { class: 'btn btn-video btn-wide', html: `${ICONS.video}<span>${t('lose.ad', { n: EXTRA_MOVES })}</span>` }) as HTMLButtonElement;
      adBtn.disabled = !adsLeft();
      adBtn.onclick = async () => {
        if (done || pending || !adsLeft()) return;
        setPending(true);
        const ok = await ads.rewarded('moves');
        if (this.dead) return;
        // A video watched to the end always pays, even if the dialog was closed meanwhile.
        if (ok && !this.ended && !this.session.won) {
          this.session.moveAds++;
          this.session.addMoves(EXTRA_MOVES, true);
          audio.booster();
          return finish(true);
        }
        setPending(false);
        if (!ok && !done) toast(t('ad.unavailable'));
        if (closedPending) this.lose();
      };
      const coinBtn = h('button', { class: 'btn btn-wide', html: `${coinIcon(24)}<span>${t('lose.coins', { n: EXTRA_MOVES, price: num(price) })}</span>` }) as HTMLButtonElement;
      coinBtn.disabled = coins() < price;
      coinBtn.onclick = () => {
        if (done || pending || !spendCoins(price)) return;
        this.session.moveBuys++;
        this.session.addMoves(EXTRA_MOVES, true);
        audio.coin();
        finish(true);
      };
      buttons.push(adBtn, coinBtn);
      const body = h(
        'div',
        { class: 'modal-body' },
        h('div', { class: 'mascot', html: tekirSVG(110, 'idle') }),
        h('p', { class: 'modal-text' }, fromLose ? t('lose.body', { n: Math.max(1, left) }) : t('booster.moves')),
        h('div', { class: 'coins-line', html: `${coinIcon(22)}<b>${num(coins())}</b>` }),
        h('div', { class: 'modal-actions col' }, adBtn, coinBtn),
      );
      if (fromLose) {
        const retry = h('button', { class: 'btn btn-wood small', html: `${ICONS.restart}<span>${t('lose.retry')}</span>`, onclick: () => {
          if (done || pending) return;
          finish(false);
          this.retry();
        } }) as HTMLButtonElement;
        const quit = h('button', { class: 'btn btn-ghost small', onclick: () => {
          if (done || pending) return;
          finish(false);
          this.giveUp();
        } }, t('lose.quit')) as HTMLButtonElement;
        buttons.push(retry, quit);
        body.append(h('div', { class: 'modal-actions' }, retry, quit), h('p', { class: 'tip' }, t('lose.tip')));
      }
      const m = modal(body, {
        title: fromLose ? t('lose.title') : t('booster.moves'),
        dismissable: !fromLose,
        onClose: () => {
          if (!done) {
            done = true;
            closedPending = pending;
            resolve(false);
          }
        },
      });
    });
    this.offerOpen = false;
    // Closed the booster offer without moves at 0 moves left: the level is lost.
    if (!added && !fromLose && !closedPending) this.lose();
    return added;
  }

  private lose(): void {
    if (this.dead || this.ended || this.loseOpen || this.offerOpen || this.session.won || this.session.state.movesLeft > 0) return;
    clearTimeout(this.loseTimer);
    this.loseOpen = true;
    audio.lose();
    void haptic('warning');
    track('level_fail', { key: this.spec.key });
    void this.offerMoves(true).then(() => {
      this.loseOpen = false;
    });
  }

  private retry(): void {
    this.endRun();
    this.cb.restart(this.spec);
  }

  private giveUp(): void {
    this.endRun();
    this.cb.exit();
  }

  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    recordLoss();
    store.update((d) => {
      if (d.runs[this.slot]?.key === this.spec.key) d.runs[this.slot] = null;
    });
  }

  // ───────────── win ─────────────

  /**
   * Records the win at once (so leaving or a killed app cannot lose it, and
   * the finished run is never resumed) and shows the dialog after `delay` ms,
   * once the last card has landed.
   */
  private onWin(delay: number): void {
    if (this.ended) return;
    this.ended = true;
    clearTimeout(this.loseTimer);
    const s = this.session.state;
    const stars = this.session.stars();
    const outcome = recordWin({ key: this.spec.key, level: this.spec.n, daily: this.spec.daily, stars, movesLeft: s.movesLeft, movesUsed: s.movesUsed, kind: this.spec.def.kind });
    questEvent({ type: 'win', stars });
    track('level_win', { key: this.spec.key, stars, moves: s.movesUsed });
    void store.flush();
    this.later(() => {
      audio.win();
      void haptic('success');
      this.showWin(outcome);
      if (stars === 3) void maybeAskReview('win3');
    }, delay);
  }

  private showWin(o: WinOutcome): void {
    const s = this.session.state;
    const starRow = h('div', { class: 'stars' });
    for (let i = 0; i < 3; i++) {
      const el = h('span', { class: `star ${i < o.stars ? 'on' : ''}`, style: `animation-delay:${0.15 + i * 0.18}s`, html: starIcon(56, i < o.stars) });
      starRow.append(el);
    }
    const coinsEl = h('b', {}, `+${num(o.coins)}`);
    let leaving = false;
    let pending = false;
    const doubleBtn = h('button', { class: 'btn btn-video btn-wide', html: `${ICONS.video}<span>${t('win.double')}</span>` }) as HTMLButtonElement;
    const actions = h('div', { class: 'modal-actions col' });
    const setPending = (v: boolean) => {
      pending = v;
      for (const b of actions.querySelectorAll('button')) b.disabled = v;
    };
    doubleBtn.onclick = async () => {
      if (leaving || pending) return;
      setPending(true);
      const ok = await ads.rewarded('double');
      setPending(false);
      if (ok) {
        store.update((d) => {
          d.coins += o.coins;
        });
        coinsEl.textContent = `+${num(o.coins * 2)}`;
        audio.coin();
        doubleBtn.remove();
      } else toast(t('ad.unavailable'));
    };
    /** One way out per dialog: a double tap must not run afterWin twice. */
    const go = (next: boolean) => {
      if (leaving || pending) return;
      leaving = true;
      m.close();
      void this.afterWin(o, next);
    };
    if (o.coins > 0) actions.append(doubleBtn);
    if (this.spec.daily) {
      actions.append(
        h('button', { class: 'btn btn-green btn-wide', html: `${ICONS.share}<span>${t('daily.share')}</span>`, onclick: () => void this.shareDaily(o.stars) }),
        h('button', { class: 'btn btn-wood btn-wide', onclick: () => go(false) }, t('win.home')),
      );
    } else {
      actions.append(
        h('button', { class: 'btn btn-green btn-wide', html: `${ICONS.play}<span>${t('win.next')}</span>`, onclick: () => go(true) }),
        h('button', { class: 'btn btn-ghost small', onclick: () => go(false) }, t('win.home')),
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
    if (this.dead) return;
    await ads.maybeInterstitial('level_end');
    if (this.dead) return;
    // Notification permission is asked once, at the happy moment after the first journey win.
    if (!this.spec.daily) await askNotificationsOnce();
    if (this.dead) return;
    if (next && !this.spec.daily) this.cb.next(this.spec.n + 1);
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
    const text = t('daily.shareText', { date: this.puzzleDate, stars: shareStars(stars), moves: this.session.state.movesUsed, streak: store.data.daily.streak });
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
    this.tutEl = h('div', { class: 'tut' }, h('div', { class: 'tut-cat', html: tekirSVG(64, 'idle') }), h('p', {}), h('button', { class: 'btn small', onclick: () => this.closeTutorialStep() }, t('tut.ok')));
    this.el.append(this.tutEl);
    this.updateTutorial();
  }

  /** "Got it" hides the current tip only; the next step shows again. After the last step it ends the tutorial. */
  private closeTutorialStep(): void {
    if (this.tutStep >= 4) return this.skipTutorial();
    this.tutHidden = this.tutStep;
    clearTimeout(this.tutTimer);
    if (this.tutEl) this.tutEl.hidden = true;
  }

  private skipTutorial(): void {
    this.tutStep = 0;
    clearTimeout(this.tutTimer);
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
    clearTimeout(this.tutTimer);
    this.tutEl.hidden = this.tutStep === this.tutHidden;
    if (this.tutEl.hidden) return;
    (this.tutEl.querySelector('p') as HTMLElement).textContent = t(`tut.${this.tutStep}` as 'tut.1');
    // Point at the move the step talks about (free: does not count as a hint used),
    // worked out for the board as it is when the pulse starts.
    if (this.tutStep < 4) {
      this.tutTimer = this.later(() => {
        if (!this.tutStep || this.tutEl?.hidden) return;
        const m = hint(this.session.state);
        if (m) this.board.showHint(m);
      }, 450);
    }
  }
}
