import { makeDaily, makeLevel, todayKey } from '../core/levels';
import type { ClassicSave } from '../core/session';
import { t } from '../i18n';
import { loginClaimable, vipGiftClaimable } from '../meta/daily';
import { canPlayLevel } from '../meta/economy';
import { store } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { rescheduleNotifications } from '../services/notify';
import { onAppState, onBackButton, track } from '../services/platform';
import { ICONS } from './art';
import { renderBazaar } from './bazaar';
import { topBar, type TopBar } from './chrome';
import { demoConfirm, showDailyLogin, showLives, showSettings, showStarterOffer, showVipGift, showWheel } from './dialogs';
import { h } from './dom';
import { GameController, startLevelPopup, type Nav } from './game';
import { navAttention, renderHome } from './home';
import { anyModal, closeAll, closeTop } from './modal';
import { renderQuests } from './quests';
import { renderShop } from './shop';

type Screen = 'home' | 'shop' | 'bazaar' | 'quests' | 'game';

export class App implements Nav {
  private ui: HTMLElement;
  private screen: Screen = 'home';
  private game: GameController | null = null;
  private top: TopBar | null = null;
  private navEl: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private offerShownThisSession = false;

  constructor(root: HTMLElement) {
    this.ui = root;
    iap.demoConfirm = demoConfirm;
    store.subscribe(() => {
      this.top?.update();
      this.updateNavBadges();
    });
    setInterval(() => this.top?.update(), 1000);
    void onBackButton(() => this.back());
    void onAppState((active) => {
      audio.setSuspended(!active);
      if (!active) {
        void store.flush();
        void rescheduleNotifications();
        this.game?.pause();
      }
    });
  }

  start(): void {
    store.update((d) => {
      d.stats.sessions++;
      d.stats.lastOpen = Date.now();
    });
    track('session_start', { n: store.data.stats.sessions });
    this.home();
    this.startupFlow();
    // Returning players: init ads early so rewarded videos are preloaded.
    if (store.data.stats.games >= 1) void ads.init();
  }

  /** Retention sequence on launch: daily gift → VIP gift → limited offer. */
  private startupFlow(): void {
    const steps: Array<(next: () => void) => void> = [];
    if (loginClaimable() >= 0) steps.push((next) => showDailyLogin(next));
    if (vipGiftClaimable()) steps.push((next) => showVipGift(next));
    const run = () => {
      const s = steps.shift();
      if (s) s(run);
      else this.maybeOffer();
    };
    setTimeout(run, 500);
  }

  private maybeOffer(): void {
    const d = store.data;
    if (this.offerShownThisSession || d.starterOfferUntil < Date.now() || d.owned.includes('starter_pack')) return;
    this.offerShownThisSession = true;
    showStarterOffer((id) => void this.buy(id));
  }

  private async buy(id: string): Promise<void> {
    const ok = await iap.purchase(id);
    if (ok) {
      audio.purchase();
      this.refresh();
    }
  }

  // ───────────── shell ─────────────

  private destroyGame(): void {
    this.game?.destroy();
    this.game = null;
  }

  private shell(screen: Exclude<Screen, 'game'>, content: HTMLElement): void {
    this.destroyGame();
    closeAll();
    this.screen = screen;
    this.top = topBar({
      onCoins: () => this.shop('coins'),
      onLives: () => showLives(() => this.refresh()),
      onSettings: () =>
        showSettings(
          () => {
            store.reset();
            this.home();
          },
          () => this.refresh(),
        ),
    });
    this.content = content;
    this.navEl = this.navbar();
    this.ui.replaceChildren(h('div', { class: `shell shell-${screen}` }, this.top.el, h('div', { class: 'content' }, content), this.navEl));
    this.updateNavBadges();
  }

  private navbar(): HTMLElement {
    const item = (s: Screen, icon: string, label: string, fn: () => void) =>
      h('button', { class: `nav-item ${this.screen === s ? 'active' : ''}`, 'data-nav': s, onclick: () => (audio.tap(), fn()) }, h('span', { class: 'nav-ico', html: icon }), h('span', { class: 'nav-lbl' }, label), h('span', { class: 'nav-badge hidden' }));
    return h(
      'nav',
      { class: 'navbar' },
      item('shop', ICONS.shop, t('nav.shop'), () => this.shop()),
      item('home', ICONS.home, t('nav.home'), () => this.home()),
      item('bazaar', ICONS.bazaar, t('nav.bazaar'), () => this.bazaar()),
      item('quests', ICONS.quests, t('nav.quests'), () => this.quests()),
    );
  }

  private updateNavBadges(): void {
    if (!this.navEl) return;
    const a = navAttention();
    const set = (s: string, on: boolean, text = '') => {
      const b = this.navEl!.querySelector(`[data-nav="${s}"] .nav-badge`) as HTMLElement | null;
      if (!b) return;
      b.classList.toggle('hidden', !on);
      b.textContent = text;
    };
    set('shop', a.shop, '!');
    set('bazaar', a.bazaar, '!');
    set('quests', a.quests > 0, String(a.quests));
  }

  /** Re-renders the current menu screen, keeping scroll position. */
  refresh(): void {
    if (this.screen === 'game') return;
    const scroller = this.content;
    const y = scroller?.scrollTop ?? 0;
    const map = { home: () => this.home(), shop: () => this.shop(), bazaar: () => this.bazaar(), quests: () => this.quests() };
    map[this.screen]();
    if (this.content) this.content.scrollTop = y;
  }

  // ───────────── navigation ─────────────

  home(): void {
    this.shell(
      'home',
      renderHome({
        playLevel: () => this.playLevel(),
        playClassic: (resume) => this.playClassic(resume),
        playDaily: () => this.playDaily(),
        login: () => showDailyLogin(() => this.refresh()),
        wheel: () => showWheel(() => this.top?.update()),
        offer: () => showStarterOffer((id) => void this.buy(id)),
        vipGift: () => showVipGift(() => this.refresh()),
      }),
    );
  }

  shop(section?: string): void {
    this.shell(
      'shop',
      renderShop({
        rerender: () => this.refresh(),
        purchased: () => this.refresh(),
      }),
    );
    if (section) requestAnimationFrame(() => document.getElementById(`shop-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  bazaar(): void {
    this.shell(
      'bazaar',
      renderBazaar(
        () => this.refresh(),
        () => this.playLevel(),
      ),
    );
  }

  quests(): void {
    this.shell('quests', renderQuests(() => this.refresh()));
  }

  private startGame(ctrl: GameController): void {
    this.destroyGame();
    closeAll();
    this.screen = 'game';
    this.top = null;
    this.navEl = null;
    this.content = null;
    this.game = ctrl;
    this.ui.replaceChildren(ctrl.el);
    ctrl.mount();
    if (location.search.includes('e2e')) (window as unknown as { __game: GameController }).__game = ctrl;
  }

  playLevel(): void {
    if (!canPlayLevel()) {
      if (this.screen === 'game') this.home();
      showLives(() => this.refresh());
      return;
    }
    const level = makeLevel(store.data.level);
    startLevelPopup(this, level, () => this.startGame(new GameController(this, { mode: 'journey', level })));
  }

  playClassic(resume = false): void {
    const save = resume ? (store.data.classicSave as ClassicSave | null) : null;
    if (!resume) store.update((d) => { d.classicSave = null; });
    this.startGame(new GameController(this, { mode: 'classic', resume: save ?? undefined }));
  }

  playDaily(): void {
    if (store.data.daily.lastWin === todayKey()) return;
    const level = makeDaily(todayKey());
    startLevelPopup(this, level, () => this.startGame(new GameController(this, { mode: 'daily', level })));
  }

  private back(): void {
    if (anyModal()) {
      closeTop();
      return;
    }
    if (this.screen === 'game') this.game?.pause();
    else if (this.screen !== 'home') this.home();
  }
}
