import { currentLang } from '../i18n';
import { categoryCount, useTable } from '../core/levels';
import { legalMoves } from '../core/rules';
import { hint } from '../core/solver';
import table from '../core/level-tuning.json';
import { warmLevels } from '../content';
import { dailySpec, journeySpec, type LevelSpec } from '../game/session';
import { claimLogin, ensureQuests, loginClaimable, todayKey } from '../meta/daily';
import { store } from '../meta/state';
import { audio } from '../services/audio';
import { onAppState, onBackButton } from '../services/platform';
import { rescheduleNotifications } from '../services/notify';
import { showCollection, showDaily, showLogin, showQuests, showSettings, showShop, maybeStarterOffer } from './dialogs';
import { GameScreen } from './game';
import { HomeScreen } from './home';
import { anyModal, closeAll, closeTop } from './modal';

useTable(table as never);

/** Screen router: home ⇄ game, plus the startup flow and lifecycle hooks. */
export class App {
  private root: HTMLElement;
  private home: HomeScreen | null = null;
  private game: GameScreen | null = null;
  /** Day the gift / offer flow last ran for ('' in debug sessions opened with ?level or ?daily). */
  private flowDay = '';
  /** The flow is due but waits until the player is back on the home screen. */
  private pendingFlow = false;

  constructor() {
    this.root = document.getElementById('app')!;
  }

  start(): void {
    ensureQuests();
    store.update((d) => {
      d.stats.sessions++;
      d.stats.lastOpen = Date.now();
    });
    // Category repeat-avoidance depends on earlier levels; warm the cache up to the next level.
    warmLevels(store.data.level + 1, categoryCount);
    const params = new URLSearchParams(location.search);
    if (params.has('level')) this.playLevel(Number(params.get('level')) || 1);
    else if (params.has('daily')) this.playSpec(dailySpec(todayKey(), currentLang()));
    else this.showHome();
    void onBackButton(() => {
      if (closeTop()) return;
      if (this.game) this.showHome();
    });
    void onAppState((active) => {
      if (!active) {
        void store.flush();
        void rescheduleNotifications();
        audio.setSuspended(true);
        return;
      }
      audio.setSuspended(false);
      // Back from the background on a new day: today's gift and quests are waiting.
      if (this.flowDay && this.flowDay !== todayKey()) {
        this.flowDay = todayKey();
        ensureQuests();
        this.startupFlow();
      }
    });
    if (!params.has('level') && !params.has('daily')) {
      this.flowDay = todayKey();
      setTimeout(() => this.startupFlow(), 500);
    }
  }

  /** Login gift, then the starter offer: only on the home screen, never over a level or another dialog. */
  private startupFlow(): void {
    if (!this.home || anyModal()) {
      this.pendingFlow = true;
      return;
    }
    this.pendingFlow = false;
    // No gift on the very first launch day of the very first session (the welcome is enough).
    const firstDay = store.data.stats.sessions <= 1 && todayKey(new Date(store.data.stats.firstOpen)) === todayKey();
    if (!firstDay && loginClaimable() >= 0) {
      showLogin(() => claimLogin(), () => maybeStarterOffer());
    } else maybeStarterOffer();
  }

  private clear(): void {
    this.home?.destroy();
    this.game?.destroy();
    this.home = null;
    this.game = null;
    this.root.replaceChildren();
  }

  showHome(): void {
    this.clear();
    this.home = new HomeScreen({
      play: () => this.playLevel(store.data.level),
      daily: () => showDaily(() => this.playSpec(dailySpec(todayKey(), currentLang()))),
      collection: () => showCollection(),
      quests: () => showQuests(),
      shop: () => showShop(),
      settings: () => showSettings(() => this.showHome()),
    });
    this.root.append(this.home.el);
    if (this.pendingFlow) setTimeout(() => this.home && this.startupFlow(), 400);
  }

  playLevel(n: number): void {
    this.playSpec(journeySpec(n, currentLang()));
  }

  playSpec(spec: LevelSpec): void {
    this.clear();
    this.game = new GameScreen(spec, {
      exit: () => this.showHome(),
      next: (n) => this.playLevel(n),
      restart: (s) => this.playSpec(s),
    });
    this.root.append(this.game.el);
  }

  /** Debug/e2e hook. */
  debug() {
    return {
      store,
      app: this,
      closeModals: closeAll,
      dialogs: {
        daily: () => showDaily(() => this.playSpec(dailySpec(todayKey(), currentLang()))),
        collection: showCollection,
        quests: showQuests,
        shop: showShop,
        settings: () => showSettings(() => this.showHome()),
        login: () => showLogin(() => claimLogin(), () => undefined),
        starter: maybeStarterOffer,
      },
      /** Plays one move ('best' follows the solver, 'deck' only draws); 'end' when nothing is left to do. */
      step: (mode: 'best' | 'deck' = 'best') => {
        const s = this.game?.session;
        if (!s || s.won || s.lost || document.querySelector('.modal-backdrop:not(.closing)')) return 'end';
        if (mode === 'deck') return s.deck() ? 'ok' : 'end';
        const m = hint(s.state) ?? legalMoves(s.state)[0];
        return m && s.move(m) ? 'ok' : 'end';
      },
    };
  }
}
