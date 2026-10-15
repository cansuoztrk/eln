import { SIZE } from '../core/board';
import { bestMove } from '../core/bot';
import { starsFor, todayKey, type LevelDef } from '../core/levels';
import { Session, type ClassicSave, type Mode, type MoveResult } from '../core/session';
import { GameScene } from '../game/scene';
import { buildSprites } from '../game/sprites';
import { THEME_BY_ID } from '../game/themes';
import { num, t } from '../i18n';
import { questEvent, resetQuestTracking } from '../meta/daily';
import {
  addCoins,
  canPlayLevel,
  DAILY_CHALLENGE_REWARD,
  EXTRA_MOVES,
  EXTRA_MOVES_PRICE,
  loseLife,
  REVIVE_PRICE,
  spendCoins,
  useBooster,
} from '../meta/economy';
import { BOOSTERS, store, type BoosterId } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { haptic, track } from '../services/platform';
import { maybeAskReview } from '../services/review';
import { addPassPoints, classicPassPoints, PASS_POINTS } from '../meta/pass';
import { BOOSTER_ART, coinIcon, ICONS, starIcon, tekirSVG } from './art';
import { boosterName } from './chrome';
import { askNotifications, showBuyBooster, showLives } from './dialogs';
import { bump, countTo, h } from './dom';
import { anyModal, closeAll, modal, toast } from './modal';

export interface Nav {
  home(): void;
  shop(section?: string): void;
  bazaar(): void;
  playLevel(): void;
  playClassic(resume?: boolean): void;
  playDaily(): void;
}

export interface GameParams {
  mode: Mode;
  level?: LevelDef;
  resume?: ClassicSave;
}

const GOLD_COINS = 5;

export class GameController {
  readonly el: HTMLElement;
  private scene: GameScene;
  private session: Session;
  private mode: Mode;
  private level: LevelDef | null;
  private header!: HTMLElement;
  private boosterBar!: HTMLElement;
  private scoreEl!: HTMLElement;
  private chaseEl: HTMLElement | null = null;
  private movesEl: HTMLElement | null = null;
  private goalEls: HTMLElement[] = [];
  private coinPill!: HTMLElement;
  private coinVal!: HTMLElement;
  private boosterBtns = new Map<BoosterId, HTMLElement>();
  private targetBar!: HTMLElement;
  private tipEl!: HTMLElement;
  private shownScore = 0;
  private ended = false;
  private extraMovesBought = 0;
  private adReviveUsed = false;
  private madeMove = false;
  private onResize = () => this.layout();
  private unsub: () => void;
  private tipTimer: ReturnType<typeof setTimeout> | null = null;
  private goldTipShown = false;
  private lastInput = Date.now();
  private hintShown = false;
  private idleTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private nav: Nav, params: GameParams) {
    this.mode = params.mode;
    this.level = params.level ?? null;
    this.session = params.resume ? Session.restore(params.resume) : new Session(this.mode, this.level);
    this.shownScore = this.session.score;
    resetQuestTracking();

    this.el = h('div', { class: `screen game game-${this.mode}` });
    const canvas = h('canvas', { class: 'game-canvas' });
    this.el.append(canvas);
    this.buildHud();
    const theme = THEME_BY_ID[store.data.theme] ?? THEME_BY_ID.lokum;
    this.scene = new GameScene(canvas, theme, {
      onMove: (res) => this.onMove(res),
      onBoosterTarget: (kind, r, c) => this.onBoosterTarget(kind, r, c),
      goalTarget: (i) => this.centerOf(this.goalEls[i]),
      coinTarget: () => this.centerOf(this.coinPill),
      onCollect: (kind, i) => this.onCollect(kind, i),
      onInteract: () => {
        this.lastInput = Date.now();
        this.hideTip();
      },
    });
    this.scene.setSession(this.session);
    this.unsub = store.subscribe(() => this.updateCoins());
  }

  /** Call after the element is attached to the DOM. */
  mount(): void {
    window.addEventListener('resize', this.onResize);
    this.layout();
    this.renderGoalIcons();
    this.scene.start();
    this.scene.popAll();
    this.updateHud();
    track('game_start', { mode: this.mode, level: this.level?.id ?? 0 });
    this.maybeTutorial();
    this.idleTimer = setInterval(() => this.idleCheck(), 1000);
  }

  /**
   * New players who stall for a while get a gentle hint (the bot's best move).
   * Only early on: the first 12 journey levels and the first 3 classic games.
   */
  private idleCheck(): void {
    if (this.ended || this.hintShown || this.scene.mode !== 'play' || anyModal()) return;
    const early = this.mode === 'journey' ? (this.level?.id ?? 99) <= 12 : this.mode === 'classic' && store.data.stats.games < 3;
    if (!early || Date.now() - this.lastInput < 9000) return;
    const move = bestMove(this.session);
    if (!move) return;
    this.hintShown = true;
    this.scene.setHint(move);
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.unsub();
    this.scene.destroy();
    if (this.tipTimer) clearTimeout(this.tipTimer);
    if (this.idleTimer) clearInterval(this.idleTimer);
  }

  pause(): void {
    if (this.ended) return;
    this.showPause();
  }

  /** Test hook (enabled with ?e2e): direct access for automated play-throughs. */
  debug(): { session: Session; scene: GameScene; place: (slot: number, r: number, c: number) => boolean } {
    return {
      session: this.session,
      scene: this.scene,
      place: (slot, r, c) => {
        const res = this.session.place(slot, r, c);
        if (res) this.scene.afterPlace(res);
        return !!res;
      },
    };
  }

  // ───────────── HUD ─────────────

  private buildHud(): void {
    const pauseBtn = h('button', { class: 'icon-btn', 'aria-label': t('pause.title'), html: ICONS.pause, onclick: () => (audio.tap(), this.showPause()) });
    this.coinVal = h('span', { class: 'pill-val' }, num(store.data.coins));
    this.coinPill = h('button', { class: 'pill pill-coins small', onclick: () => (audio.tap(), this.nav.shop('coins')) }, h('span', { class: 'pill-ico', html: coinIcon(22) }), this.coinVal);

    let center: HTMLElement;
    if (this.mode === 'classic') {
      this.scoreEl = h('div', { class: 'hud-score' }, num(this.session.score));
      this.chaseEl = h('div', { class: 'hud-best' });
      center = h('div', { class: 'hud-center' }, this.scoreEl, this.chaseEl);
    } else {
      this.movesEl = h('div', { class: 'hud-moves-val' }, String(this.session.movesLeft));
      this.scoreEl = h('div', { class: 'hud-mini-score' }, num(this.session.score));
      const title = this.mode === 'daily' ? t('daily.title') : t('level.title', { n: this.level!.id });
      center = h('div', { class: 'hud-center' }, h('div', { class: 'hud-level' }, title), h('div', { class: 'hud-moves' }, this.movesEl, h('span', { class: 'hud-moves-lbl' }, t('hud.moves'))));
    }
    this.header = h('div', { class: 'hud-top' }, h('div', { class: 'hud-row' }, pauseBtn, center, this.coinPill));
    if (this.level) {
      const goals = h('div', { class: 'hud-goals' });
      this.goalEls = this.level.goals.map((g) => {
        const el = h('div', { class: 'goal' }, h('div', { class: 'goal-ico' }), h('div', { class: 'goal-count' }, String(g.count)));
        goals.append(el);
        return el;
      });
      this.header.append(goals);
    }

    this.boosterBar = h('div', { class: 'booster-bar' });
    for (const id of BOOSTERS) {
      const count = h('span', { class: 'b-count' });
      const btn = h('button', { class: 'booster', 'aria-label': boosterName(id), onclick: () => this.useBooster(id) }, h('span', { class: 'b-ico', html: BOOSTER_ART[id] }), count, h('span', { class: 'b-name' }, boosterName(id)));
      this.boosterBtns.set(id, btn);
      this.boosterBar.append(btn);
    }
    this.targetBar = h('div', { class: 'target-bar hidden' }, h('span', { class: 'target-hint' }), h('button', { class: 'btn btn-ghost small', onclick: () => this.cancelTarget() }, t('btn.cancel')));
    this.tipEl = h('div', { class: 'tip hidden' });
    this.el.append(this.header, this.boosterBar, this.targetBar, this.tipEl);
    this.updateBoosters();
  }

  private layout(): void {
    const top = this.header.getBoundingClientRect().bottom;
    const bottom = window.innerHeight - this.boosterBar.getBoundingClientRect().top;
    this.scene.resize(top + 4, bottom + 4);
    const br = this.scene.boardRect();
    this.tipEl.style.top = `${br.y + br.h + 6}px`;
  }

  private centerOf(el: HTMLElement | undefined): { x: number; y: number } | null {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  private renderGoalIcons(): void {
    if (!this.level) return;
    const theme = THEME_BY_ID[store.data.theme] ?? THEME_BY_ID.lokum;
    const sp = buildSprites(theme, 72, store.data.settings.colorblind);
    this.level.goals.forEach((g, i) => {
      const ico = this.goalEls[i].querySelector('.goal-ico') as HTMLElement;
      if (g.type === 'score') {
        ico.innerHTML = starIcon(30);
        return;
      }
      const src = g.type === 'gem' ? sp.gem : g.type === 'crate' ? sp.crate[1] : sp.flavors[g.flavor!];
      const img = new Image();
      img.src = (src as HTMLCanvasElement).toDataURL();
      img.alt = '';
      ico.innerHTML = '';
      if (g.type === 'gem') {
        const base = new Image();
        base.src = sp.flavors[this.level!.flavors[0]].toDataURL();
        base.className = 'goal-base';
        ico.append(base);
      }
      ico.append(img);
    });
  }

  private updateHud(): void {
    const s = this.session;
    if (s.score !== this.shownScore) {
      countTo(this.scoreEl, this.shownScore, s.score, 450, num);
      this.shownScore = s.score;
      bump(this.scoreEl);
    }
    if (this.mode === 'classic' && this.chaseEl) {
      const best = store.data.best;
      if (best > 0 && s.score > best) this.chaseEl.innerHTML = `👑 ${t('hud.newbest')}`;
      else if (best > 0 && best - s.score <= 500) this.chaseEl.textContent = t('hud.tobest', { n: num(best - s.score) });
      else this.chaseEl.innerHTML = best > 0 ? `👑 ${num(best)}` : '';
      this.chaseEl.classList.toggle('hot', best > 0 && best - s.score <= 500);
    }
    if (this.movesEl) {
      this.movesEl.textContent = String(Math.max(0, s.movesLeft));
      this.movesEl.parentElement!.classList.toggle('low', s.movesLeft <= 5);
    }
    if (this.level) {
      this.level.goals.forEach((g, i) => {
        const left = Math.max(0, g.count - s.progress[i]);
        const el = this.goalEls[i];
        const c = el.querySelector('.goal-count') as HTMLElement;
        if (left === 0) {
          if (!el.classList.contains('done')) {
            el.classList.add('done');
            c.innerHTML = ICONS.check;
            audio.star(0);
          }
        } else c.textContent = g.type === 'score' ? num(left) : String(left);
      });
    }
  }

  private updateCoins(): void {
    this.coinVal.textContent = num(store.data.coins);
    this.updateBoosters();
  }

  private updateBoosters(): void {
    for (const id of BOOSTERS) {
      const btn = this.boosterBtns.get(id)!;
      const n = store.data.boosters[id];
      const c = btn.querySelector('.b-count') as HTMLElement;
      if (n > 0) {
        c.textContent = String(n);
        c.classList.remove('plus');
      } else {
        c.innerHTML = ICONS.plus;
        c.classList.add('plus');
      }
    }
  }

  // ───────────── moves ─────────────

  private onMove(res: MoveResult): void {
    this.madeMove = true;
    this.lastInput = Date.now();
    this.hintShown = false;
    this.updateHud();
    questEvent({ type: 'move', stats: this.session.stats, mode: this.mode });
    if (res.gold > 0 && !this.goldTipShown && !store.data.tutorial.boosters) {
      this.goldTipShown = true;
      this.tip(t('tut.gold'), 2600);
    }
    if (this.mode === 'classic') {
      store.update((d) => {
        d.classicSave = this.session.serialize();
        if (this.session.score > d.best && d.best > 0 && !this.newBestCelebrated) {
          this.newBestCelebrated = true;
          this.scene.celebrate(t('hud.newbest'));
          audio.win();
        }
      });
      if (!store.data.tutorial.classic && res.clear) {
        store.update((d) => {
          d.tutorial.classic = true;
        });
      }
    }
    this.checkEnd(res.clear ? 650 : 350);
  }

  private newBestCelebrated = false;

  private checkEnd(delay: number): void {
    const s = this.session;
    if (this.level && s.goalsComplete()) {
      this.lock();
      setTimeout(() => this.win(), delay + 250);
      return;
    }
    if (s.outOfMoves()) {
      this.lock();
      setTimeout(() => this.failMoves(), delay);
      return;
    }
    if (s.stuck()) {
      this.lock();
      setTimeout(() => this.stuck(), delay + 150);
    }
  }

  private lock(): void {
    this.scene.mode = 'locked';
  }

  private unlock(): void {
    this.scene.mode = 'play';
    this.scene.refreshFits();
  }

  private onCollect(kind: 'goal' | 'coin', i: number): void {
    if (kind === 'coin') {
      addCoins(GOLD_COINS);
      bump(this.coinPill);
    } else {
      bump(this.goalEls[i]);
    }
  }

  // ───────────── boosters ─────────────

  private useBooster(id: BoosterId): void {
    audio.tap();
    if (this.ended || this.scene.mode === 'locked') return;
    if (store.data.boosters[id] <= 0) {
      showBuyBooster(id, () => this.updateBoosters());
      return;
    }
    switch (id) {
      case 'undo':
        if (!this.session.canUndo) return toast(t('booster.nothing'));
        useBooster('undo');
        this.session.undo();
        this.scene.spawnTray();
        audio.whoosh();
        this.afterBooster();
        break;
      case 'refresh':
        useBooster('refresh');
        this.session.refresh();
        this.scene.spawnTray();
        audio.whoosh();
        this.afterBooster();
        break;
      case 'hammer':
      case 'bomb':
        this.scene.mode = id;
        this.targetBar.classList.remove('hidden');
        (this.targetBar.querySelector('.target-hint') as HTMLElement).textContent = t(id === 'hammer' ? 'booster.hammer.hint' : 'booster.bomb.hint');
        this.boosterBar.classList.add('hidden');
        break;
    }
  }

  private cancelTarget(): void {
    audio.tap();
    this.scene.mode = 'play';
    this.targetBar.classList.add('hidden');
    this.boosterBar.classList.remove('hidden');
  }

  private onBoosterTarget(kind: 'hammer' | 'bomb', r: number, c: number): void {
    const i = r * SIZE + c;
    if (kind === 'hammer') {
      if (!this.session.board.isFilled(i)) return;
      useBooster('hammer');
      const res = this.session.hammer(i);
      if (res) this.scene.playClear(res, null, [i]);
      audio.hammer();
      void haptic('medium');
    } else {
      useBooster('bomb');
      const res = this.session.bomb(r, c);
      this.scene.bombAt(r, c);
      this.scene.playClear(res, null, [i]);
    }
    this.targetBar.classList.add('hidden');
    this.boosterBar.classList.remove('hidden');
    this.scene.mode = 'play';
    this.afterBooster();
  }

  private afterBooster(): void {
    questEvent({ type: 'booster' });
    track('booster_used', { mode: this.mode });
    store.update((d) => {
      d.tutorial.boosters = true;
      if (this.mode === 'classic') d.classicSave = this.session.serialize();
    });
    this.scene.refreshFits();
    this.updateHud();
    this.updateBoosters();
    this.checkEnd(500);
  }

  // ───────────── end states ─────────────

  private stuck(): void {
    audio.lose();
    void haptic('warning');
    if (this.mode === 'classic') this.offerRevive(() => this.classicOver());
    else this.offerRevive(() => this.levelFailed(t('level.fail.space')), t('level.fail.space'));
  }

  private offerRevive(onDecline: () => void, title = t('over.title')): void {
    const s = this.session;
    if (s.revives >= REVIVE_PRICE.length) return onDecline();
    const price = REVIVE_PRICE[s.revives];
    const revive = () => {
      m.close();
      const res = s.revive();
      this.scene.playClear(res, null);
      this.scene.spawnTray();
      this.scene.shake(6);
      audio.bomb();
      this.unlock();
      this.updateHud();
      if (this.mode === 'classic') store.update((d) => { d.classicSave = s.serialize(); });
      track('revive', { mode: this.mode, n: s.revives });
    };
    let accepted = false;
    const body = h(
      'div',
      { class: 'modal-body center' },
      h('div', { class: 'mascot-sm', html: tekirSVG(104, 'sad', false) }),
      this.mode === 'classic' ? h('div', { class: 'big-score' }, num(s.score)) : null,
      h('p', { class: 'modal-text' }, t('over.revive')),
      h(
        'div',
        { class: 'modal-actions col' },
        !this.adReviveUsed
          ? h(
              'button',
              {
                class: 'btn btn-video',
                onclick: async () => {
                  if (await ads.rewarded('revive')) {
                    this.adReviveUsed = true;
                    accepted = true;
                    revive();
                  } else toast(t('ad.unavailable'));
                },
              },
              h('span', { class: 'btn-ico', html: ICONS.video }),
              t('over.revive.ad'),
            )
          : null,
        h(
          'button',
          {
            class: 'btn btn-primary',
            onclick: () => {
              if (!spendCoins(price)) {
                toast(t('toast.nocoins'), 'bad');
                this.nav.shop('coins');
                return;
              }
              accepted = true;
              revive();
            },
          },
          t('btn.continue'),
          h('span', { class: 'btn-price', html: `${coinIcon(20)} ${num(price)}` }),
        ),
        h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, t('btn.giveup')),
      ),
    );
    const m = modal(body, { title, dismissable: false, onClose: () => !accepted && onDecline() });
  }

  private classicOver(): void {
    this.ended = true;
    this.scene.startGreyOut();
    const s = this.session;
    const prevBest = store.data.best;
    const newBest = s.score > prevBest;
    const payout = s.classicPayout();
    store.update((d) => {
      d.best = Math.max(d.best, s.score);
      d.stats.games++;
      d.stats.lines += s.stats.lines;
      d.stats.bestCombo = Math.max(d.stats.bestCombo, s.stats.maxCombo);
      d.classicSave = null;
      d.coins += payout;
    });
    questEvent({ type: 'game_end', score: s.score, mode: 'classic' });
    const passGained = addPassPoints(classicPassPoints(s.score));
    track('classic_end', { score: s.score, best: newBest });
    void ads.init();

    setTimeout(() => {
      if (newBest) {
        audio.win();
        this.scene.celebrate(t('over.newbest'));
      }
      let doubled = false;
      const scoreEl = h('div', { class: 'big-score' }, '0');
      const coinsLine = h('div', { class: 'earned' }, h('span', { html: coinIcon(24) }), h('b', {}, `+${num(payout)}`));
      const doubleBtn =
        payout > 0
          ? h(
              'button',
              {
                class: 'btn btn-video',
                onclick: async () => {
                  if (doubled) return;
                  if (await ads.rewarded('double')) {
                    doubled = true;
                    addCoins(payout);
                    (coinsLine.querySelector('b') as HTMLElement).textContent = `+${num(payout * 2)}`;
                    doubleBtn!.remove();
                    audio.coin();
                  } else toast(t('ad.unavailable'));
                },
              },
              h('span', { class: 'btn-ico', html: ICONS.video }),
              t('over.double'),
            )
          : null;
      const body = h(
        'div',
        { class: 'modal-body center' },
        h('div', { class: 'mascot-sm', html: tekirSVG(100, newBest ? 'happy' : 'idle', true) }),
        newBest ? h('div', { class: 'ribbon' }, t('over.newbest')) : null,
        h('div', { class: 'over-label' }, t('over.score')),
        scoreEl,
        h('div', { class: 'over-best' }, `👑 ${t('over.best')}: ${num(Math.max(prevBest, s.score))}`),
        h('div', { class: 'earned-row' }, coinsLine, passChip(passGained)),
        doubleBtn,
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => this.leave(() => this.nav.home()) }, t('btn.home')),
          h('button', { class: 'btn btn-primary', onclick: () => this.leave(() => this.nav.playClassic(false)) }, t('over.newgame')),
        ),
      );
      modal(body, { title: t('over.title'), dismissable: false, className: 'over-modal' });
      countTo(scoreEl, 0, s.score, 900, num);
      if (newBest && prevBest > 0) setTimeout(() => void maybeAskReview('record'), 1500);
    }, 900);
  }

  /** Closes modals, shows a paced interstitial at this natural break, then navigates. */
  private async leave(next: () => void): Promise<void> {
    audio.tap();
    closeAll();
    await ads.maybeInterstitial(this.mode === 'classic' ? 'classic_end' : 'level_end');
    next();
  }

  private failMoves(): void {
    audio.lose();
    const s = this.session;
    const i = Math.min(this.extraMovesBought, EXTRA_MOVES_PRICE.length - 1);
    const price = EXTRA_MOVES_PRICE[i];
    const goalsLeft = this.level!.goals.map((g, k) => ({ g, left: Math.max(0, g.count - s.progress[k]) }));
    const remaining = goalsLeft.reduce((a, x) => a + (x.g.type === 'score' ? x.left / 200 : x.left), 0);
    const add = () => {
      m.close();
      accepted = true;
      this.extraMovesBought++;
      s.addMoves(EXTRA_MOVES);
      this.unlock();
      this.updateHud();
      bump(this.movesEl);
      track('extra_moves', { level: this.level?.id ?? 0 });
    };
    let accepted = false;
    const goalsRow = h('div', { class: 'goals-left' });
    goalsLeft.forEach(({ left }, k) => {
      if (left <= 0) return;
      const src = this.goalEls[k].querySelector('.goal-ico') as HTMLElement;
      goalsRow.append(h('div', { class: 'goal' }, h('div', { class: 'goal-ico', html: src.innerHTML }), h('div', { class: 'goal-count' }, num(left))));
    });
    const body = h(
      'div',
      { class: 'modal-body center' },
      h('p', { class: 'modal-text' }, remaining <= 4 ? t('level.fail.almost') : t('level.goals')),
      goalsRow,
      h(
        'div',
        { class: 'modal-actions col' },
        h(
          'button',
          {
            class: 'btn btn-primary',
            onclick: () => {
              if (!spendCoins(price)) {
                toast(t('toast.nocoins'), 'bad');
                this.nav.shop('coins');
                return;
              }
              add();
            },
          },
          t('level.fail.extra', { n: EXTRA_MOVES }),
          h('span', { class: 'btn-price', html: `${coinIcon(20)} ${num(price)}` }),
        ),
        !this.adReviveUsed
          ? h(
              'button',
              {
                class: 'btn btn-video',
                onclick: async () => {
                  if (await ads.rewarded('moves')) {
                    this.adReviveUsed = true;
                    add();
                  } else toast(t('ad.unavailable'));
                },
              },
              h('span', { class: 'btn-ico', html: ICONS.video }),
              t('level.fail.extra', { n: EXTRA_MOVES }),
            )
          : null,
        h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, t('btn.giveup')),
        this.mode === 'journey' ? h('p', { class: 'modal-sub' }, t('level.fail.lose')) : null,
      ),
    );
    const m = modal(body, { title: t('level.fail.moves'), dismissable: false, onClose: () => !accepted && this.levelFailed(t('level.fail.moves')) });
  }

  private levelFailed(title: string): void {
    this.ended = true;
    if (this.mode === 'journey') loseLife();
    store.update((d) => {
      d.stats.games++;
    });
    track('level_fail', { mode: this.mode, level: this.level?.id ?? 0 });
    questEvent({ type: 'game_end', score: this.session.score, mode: this.mode });
    const body = h(
      'div',
      { class: 'modal-body center' },
      h('div', { class: 'mascot-sm', html: tekirSVG(104, 'sad', false) }),
      h(
        'div',
        { class: 'modal-actions' },
        h('button', { class: 'btn btn-ghost', onclick: () => this.leave(() => this.nav.home()) }, t('btn.home')),
        h(
          'button',
          {
            class: 'btn btn-primary',
            onclick: () => {
              if (this.mode === 'journey' && !canPlayLevel()) {
                closeAll();
                showLives(() => {});
                return;
              }
              void this.leave(() => (this.mode === 'daily' ? this.nav.playDaily() : this.nav.playLevel()));
            },
          },
          t('btn.retry'),
        ),
      ),
    );
    modal(body, { title, dismissable: false });
  }

  private win(): void {
    this.ended = true;
    const s = this.session;
    const level = this.level!;
    const stars = starsFor(s.movesLeft, level.moves);
    const bonus = Math.max(0, s.movesLeft) * 50;
    s.score += bonus;
    const isDaily = this.mode === 'daily';
    const reward = isDaily ? DAILY_CHALLENGE_REWARD : level.reward + Math.max(0, s.movesLeft) * 2;
    const firstWin = store.data.stats.levelsWon === 0;
    store.update((d) => {
      d.coins += reward;
      d.stats.games++;
      if (isDaily) {
        const today = todayKey();
        const y = new Date();
        y.setDate(y.getDate() - 1);
        d.daily.streak = d.daily.lastWin === todayKey(y) ? d.daily.streak + 1 : 1;
        d.daily.lastWin = today;
      } else {
        d.level = level.id + 1;
        d.stars += stars;
        d.totalStars += stars;
        d.levelStars[String(level.id)] = stars;
        d.stats.levelsWon++;
        if (level.id === 3 && !d.owned.includes('starter_pack')) d.starterOfferUntil = Date.now() + 72 * 3600_000;
      }
    });
    questEvent({ type: isDaily ? 'daily_won' : 'level_won' });
    questEvent({ type: 'game_end', score: s.score, mode: this.mode });
    const passGained = addPassPoints(isDaily ? PASS_POINTS.daily : PASS_POINTS.levelWin + stars * PASS_POINTS.perStar);
    track(isDaily ? 'daily_win' : 'level_win', { level: level.id, stars, movesLeft: s.movesLeft });
    void ads.init();

    audio.win();
    void haptic('success');
    this.scene.celebrate(t('level.win.title'));

    setTimeout(() => {
      let doubled = false;
      const starsRow = h('div', { class: 'stars-row' });
      if (!isDaily) {
        for (let k = 0; k < 3; k++) {
          const st = h('span', { class: 'star-slot', html: starIcon(64, false) });
          starsRow.append(st);
          if (k < stars) {
            setTimeout(() => {
              st.innerHTML = starIcon(64, true);
              st.classList.add('pop');
              audio.star(k);
              void haptic('light');
            }, 350 + k * 380);
          }
        }
      }
      const coinsLine = h('div', { class: 'earned' }, h('span', { html: coinIcon(24) }), h('b', {}, `+${num(reward)}`));
      const doubleBtn = h(
        'button',
        {
          class: 'btn btn-video',
          onclick: async () => {
            if (doubled) return;
            if (await ads.rewarded('double')) {
              doubled = true;
              addCoins(reward);
              (coinsLine.querySelector('b') as HTMLElement).textContent = `+${num(reward * 2)}`;
              doubleBtn.remove();
              audio.coin();
            } else toast(t('ad.unavailable'));
          },
        },
        h('span', { class: 'btn-ico', html: ICONS.video }),
        t('over.double'),
      );
      const body = h(
        'div',
        { class: 'modal-body center' },
        starsRow,
        isDaily ? h('div', { class: 'mascot-sm', html: tekirSVG(110, 'happy', true) }) : null,
        h('div', { class: 'over-label' }, isDaily ? t('daily.win.title') : t('level.win.sub', { n: level.id })),
        bonus > 0 ? h('div', { class: 'over-best' }, `${t('level.bonus')}: +${num(bonus)}`) : null,
        h('div', { class: 'earned-row' }, coinsLine, passChip(passGained)),
        doubleBtn,
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => this.leave(() => (isDaily ? this.nav.home() : this.nav.bazaar())) }, isDaily ? t('btn.home') : t('nav.bazaar')),
          h('button', { class: 'btn btn-primary', onclick: () => this.leave(() => (isDaily ? this.nav.home() : this.nav.playLevel())) }, isDaily ? t('btn.ok') : t('btn.next')),
        ),
      );
      modal(body, { title: t('level.win.title'), dismissable: false, className: 'win-modal', onClose: () => firstWin && setTimeout(askNotifications, 400) });
      if (!isDaily && stars === 3) setTimeout(() => void maybeAskReview('win3'), 1800);
    }, 1100);
  }

  // ───────────── pause ─────────────

  private showPause(): void {
    audio.tap();
    const losesLife = this.mode === 'journey' && this.madeMove;
    const go = (fn: () => void) => {
      closeAll();
      if (losesLife) loseLife();
      fn();
    };
    const m = modal(
      h(
        'div',
        { class: 'modal-body center' },
        h(
          'div',
          { class: 'modal-actions col' },
          h('button', { class: 'btn btn-primary', onclick: () => (audio.tap(), m.close()) }, t('pause.resume')),
          this.mode !== 'classic' || this.madeMove
            ? h(
                'button',
                {
                  class: 'btn btn-secondary',
                  onclick: () =>
                    go(() => {
                      if (this.mode === 'classic') {
                        store.update((d) => {
                          d.classicSave = null;
                        });
                        this.nav.playClassic(false);
                      } else if (this.mode === 'daily') this.nav.playDaily();
                      else if (canPlayLevel()) this.nav.playLevel();
                      else this.nav.home();
                    }),
                },
                t('pause.restart'),
              )
            : null,
          h('button', { class: 'btn btn-ghost', onclick: () => go(() => this.nav.home()) }, t('pause.home')),
          losesLife ? h('p', { class: 'modal-sub' }, t('pause.lose')) : null,
        ),
      ),
      { title: t('pause.title') },
    );
  }

  // ───────────── tutorial & tips ─────────────

  private maybeTutorial(): void {
    const d = store.data;
    const lvl = this.level?.id ?? 0;
    const firstClassic = this.mode === 'classic' && !d.tutorial.classic && this.session.score === 0;
    const firstJourney = this.mode === 'journey' && lvl === 1;
    if (firstClassic || firstJourney) {
      setTimeout(() => {
        if (this.session.stats.pieces > 0) return;
        this.scene.setHint(bestMove(this.session));
        this.tip(t('tut.drag'), 0);
      }, 600);
      return;
    }
    if (this.mode === 'journey') {
      const types = this.level!.goals.map((g) => g.type);
      if (lvl <= 3) this.tip(t('tut.goals'), 3200);
      else if (types.includes('gem') && lvl <= 6) this.tip(t('tut.gem'), 3600);
      else if (types.includes('crate') && lvl <= 8) this.tip(t('tut.crate'), 3600);
    }
  }

  private tip(text: string, ms: number): void {
    this.tipEl.textContent = text;
    this.tipEl.classList.remove('hidden');
    if (this.tipTimer) clearTimeout(this.tipTimer);
    if (ms > 0) this.tipTimer = setTimeout(() => this.hideTip(), ms);
  }

  private hideTip(): void {
    if (this.tipEl.textContent === t('tut.drag') && this.session.stats.pieces === 0) {
      // keep the drag hint until the first piece is placed
      setTimeout(() => {
        if (this.session.stats.pieces > 0) {
          this.tipEl.classList.add('hidden');
          this.tip(t('tut.lines'), 3000);
        }
      }, 400);
      return;
    }
    this.tipEl.classList.add('hidden');
  }
}

/** "+40 Pass" chip shown next to coin rewards on end screens. */
function passChip(n: number): HTMLElement | null {
  if (n <= 0) return null;
  return h('div', { class: 'earned pass-earned', title: t('pass.title') }, h('span', { html: ICONS.ticket }), h('b', {}, `+${n}`));
}

export function startLevelPopup(level: LevelDef, onStart: () => void): void {
  const goals = h('div', { class: 'goals-left big' });
  const theme = THEME_BY_ID[store.data.theme] ?? THEME_BY_ID.lokum;
  const sp = buildSprites(theme, 72, store.data.settings.colorblind);
  for (const g of level.goals) {
    let ico: string;
    if (g.type === 'score') ico = starIcon(40);
    else {
      const src = g.type === 'gem' ? sp.gem : g.type === 'crate' ? sp.crate[1] : sp.flavors[g.flavor!];
      ico = `${g.type === 'gem' ? `<img class="goal-base" src="${sp.flavors[level.flavors[0]].toDataURL()}" alt="">` : ''}<img src="${(src as HTMLCanvasElement).toDataURL()}" alt="">`;
    }
    const label =
      g.type === 'score'
        ? t('goal.score', { n: num(g.count) })
        : g.type === 'flavor'
          ? t('goal.flavor', { n: g.count, flavor: t(`flavor.${g.flavor}` as never) })
          : g.type === 'gem'
            ? t('goal.gem', { n: g.count })
            : t('goal.crate', { n: g.count });
    goals.append(h('div', { class: 'goal' }, h('div', { class: 'goal-ico', html: ico }), h('div', { class: 'goal-label' }, label)));
  }
  const m = modal(
    h(
      'div',
      { class: 'modal-body center' },
      level.boss ? h('div', { class: 'ribbon boss' }, t('level.boss')) : null,
      h('div', { class: 'over-label' }, t('level.goals')),
      goals,
      h('div', { class: 'moves-chip' }, t('level.moves', { n: level.moves })),
      h('button', { class: 'btn btn-primary btn-wide', onclick: () => (audio.tap(), m.close(), onStart()) }, t('level.start')),
    ),
    { title: level.id > 0 ? t('level.title', { n: level.id }) : t('daily.title'), className: 'level-modal' },
  );
}
