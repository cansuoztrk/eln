import * as E from '../core/economy';
import { districtDef } from '../core/districts';
import { bizName, districtNames, t } from '../i18n';
import { clubGiftClaimable, ensureQuests, freeGoldLeft, loginClaimable, wireQuests } from '../meta/daily';
import { game, type OfflineReport } from '../meta/game';
import { store } from '../meta/state';
import { ads } from '../services/ads';
import { audio } from '../services/audio';
import { iap } from '../services/iap';
import { rescheduleNotifications, requestNotifications } from '../services/notify';
import { haptic, onAppState, onBackButton, track } from '../services/platform';
import { maybeAskReview } from '../services/review';
import { BADGE_ICONS, CATS, goldIcon, tekirSVG } from './art';
import { CatsView } from './cats';
import { banner, demoConfirm, showAchievements, showBoost, showClubGift, showDailyLogin, showHireCelebration, showMove, showOffline, showQuests, showSettings, showWelcome } from './dialogs';
import { DistrictsView } from './districts';
import { h } from './dom';
import { money } from './format';
import { floatText, fx } from './fx';
import { Hud } from './hud';
import { anyModal, closeAll, closeTop, modal } from './modal';
import { RecipesView } from './recipes';
import { ShopView } from './shop';
import { StandsView } from './stands';
import { Tutorial } from './tutorial';

type Tab = 'stands' | 'cats' | 'recipes' | 'districts' | 'shop';
const TABS: Tab[] = ['stands', 'cats', 'recipes', 'districts', 'shop'];

/** App shell: HUD, tab views, bottom nav, the game loop and event wiring. */
export class App {
  private hud!: Hud;
  private stands!: StandsView;
  private cats!: CatsView;
  private recipes!: RecipesView;
  private districts!: DistrictsView;
  private shop!: ShopView;
  private tutorial!: Tutorial;
  private tab: Tab = 'stands';
  private navBtns = new Map<Tab, HTMLElement>();
  private views = new Map<Tab, HTMLElement>();
  private last = 0;
  private slowTimer = 0;
  private gullTimer = 90;
  private ferryTimer = 360;
  private active = true;
  private paused = false;

  constructor(private root: HTMLElement) {
    iap.demoConfirm = demoConfirm;
  }

  start(): void {
    store.update((d) => {
      d.stats.sessions++;
      d.stats.lastOpen = Date.now();
    });
    track('session_start', { n: store.data.stats.sessions });
    // Measure the time away before the first frame moves lastSeen forward.
    const boot = game.offlineReport();
    if (boot.away < 60) game.catchUp();
    wireQuests(game);
    ensureQuests();
    this.build();
    this.wireGame();
    void onBackButton(() => this.back());
    void onAppState((active) => this.setActive(active));
    // Returning players: init ads early so rewarded videos are preloaded.
    if (store.data.stats.sessions > 1) void ads.init();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    this.startupFlow(boot);
  }

  /** Rebuilds the whole UI (language change). */
  rebuild(): void {
    closeAll();
    this.root.innerHTML = '';
    this.navBtns.clear();
    this.views.clear();
    this.build();
  }

  private build(): void {
    this.hud = new Hud({
      onGold: () => this.go('shop'),
      onSettings: () => showSettings(() => this.rebuild()),
      onDaily: () => {
        if (loginClaimable() >= 0) showDailyLogin(() => this.refresh());
        else if (clubGiftClaimable()) showClubGift(() => this.refresh());
        else showDailyLogin(() => this.refresh());
      },
      onQuests: () => showQuests(() => this.refresh()),
      onAchievements: () => showAchievements(() => this.refresh()),
      onBoost: () => {
        this.tutorial.seen('boost-seen');
        showBoost(() => this.refresh());
      },
      onDistrict: () => this.go('districts'),
    });
    this.stands = new StandsView((i, x, y, amount) => {
      this.hud.coinBurst(x, y, `+${money(amount)}`, i >= 6 ? 8 : 4);
    });
    this.cats = new CatsView((i) => this.onHired(i));
    this.recipes = new RecipesView(() => this.refresh());
    this.districts = new DistrictsView(() => {
      if (game.goalMet()) showMove(() => this.move());
    });
    this.shop = new ShopView(() => this.refresh());
    const content = h('main', { class: 'content' });
    const viewEls: Record<Tab, HTMLElement> = { stands: this.stands.el, cats: this.cats.el, recipes: this.recipes.el, districts: this.districts.el, shop: this.shop.el };
    for (const tab of TABS) {
      this.views.set(tab, viewEls[tab]);
      content.append(viewEls[tab]);
    }
    const icons: Record<Tab, string> = { stands: BADGE_ICONS.stands, cats: BADGE_ICONS.cats, recipes: BADGE_ICONS.recipes, districts: BADGE_ICONS.districts, shop: BADGE_ICONS.shop };
    const nav = h('nav', { class: 'nav' });
    for (const tab of TABS) {
      const btn = h('button', { class: 'nav-btn', 'data-tab': tab, onclick: () => (audio.tap(), this.go(tab)) }, h('span', { class: 'nav-ico', html: icons[tab] }), h('span', { class: 'nav-label' }, t(`tab.${tab}` as never)), h('span', { class: 'nav-dot' }));
      this.navBtns.set(tab, btn);
      nav.append(btn);
    }
    this.root.append(h('div', { class: 'shell' }, this.hud.el, content, nav));
    this.tutorial = new Tutorial(this.root);
    this.go(this.tab, true);
  }

  go(tab: Tab, silent = false): void {
    this.tab = tab;
    for (const [k, el] of this.views) el.classList.toggle('active', k === tab);
    for (const [k, b] of this.navBtns) b.classList.toggle('on', k === tab);
    if (tab === 'cats') this.cats.render();
    if (tab === 'recipes') {
      this.recipes.render();
      this.tutorial.seen('recipes-seen');
    }
    if (tab === 'districts') this.districts.render();
    if (tab === 'shop') this.shop.render();
    if (!silent) (this.views.get(tab) as HTMLElement).scrollTop = 0;
  }

  /** Re-render whatever is visible after a state change. */
  refresh(): void {
    this.hud.refreshDistrict();
    this.stands.rebuild();
    if (this.tab === 'cats') this.cats.render();
    if (this.tab === 'recipes') this.recipes.render();
    if (this.tab === 'districts') this.districts.render();
    if (this.tab === 'shop') this.shop.render();
    this.slowUpdate();
  }

  private back(): void {
    if (closeTop()) return;
    if (this.tab !== 'stands') this.go('stands');
  }

  // ───────────── loop ─────────────

  private frame(now: number): void {
    const dt = Math.min(0.25, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (this.active && !this.paused) {
      game.tick(dt);
      this.hud.update();
      if (this.tab === 'stands') this.stands.update();
      this.slowTimer += dt;
      if (this.slowTimer >= 0.25) {
        this.slowTimer = 0;
        this.slowUpdate();
      }
      this.events(dt);
      this.tutorial.update();
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  private slowUpdate(): void {
    this.hud.slowUpdate();
    if (this.tab === 'stands') this.stands.slowUpdate();
    if (this.tab === 'cats') this.cats.slowUpdate();
    if (this.tab === 'recipes') this.recipes.slowUpdate();
    if (this.tab === 'districts') this.districts.slowUpdate();
    if (this.tab === 'shop') this.shop.slowUpdate();
    const dot = (tab: Tab, on: boolean) => this.navBtns.get(tab)?.classList.toggle('attn', on && this.tab !== tab);
    dot('cats', CatsView.attention());
    dot('recipes', RecipesView.attention());
    dot('districts', DistrictsView.attention());
    dot('shop', (store.data.starterOfferUntil > Date.now() && !store.data.owned.includes('starter_pack')) || freeGoldLeft() > 0);
    this.hud.pulseBoost(store.data.tutorial.step === 5 && !game.boostActive());
  }

  /** Seagulls and ferries: the reasons to keep the app open. */
  private events(dt: number): void {
    const d = store.data;
    if (anyModal()) return;
    if (d.run.managers[0] || d.district > 0) {
      this.gullTimer -= dt;
      if (this.gullTimer <= 0) {
        this.gullTimer = 70 + Math.random() * 70;
        this.hud.spawnSeagull((golden, x, y) => {
          const res = game.seagull(golden);
          if (res.gold) {
            floatText(`+${res.gold}`, x, y, 'gold');
            const g = this.hud.goldTarget();
            fx.coins(x, y, g.x, g.y, 6);
          } else this.hud.coinBurst(x, y, `+${money(res.cash)}`, 8);
        });
        this.tutorial.tip('gull');
      }
    }
    if (d.run.managers.filter(Boolean).length >= 2 || d.district > 0) {
      this.ferryTimer -= dt;
      if (this.ferryTimer <= 0 && !game.rushActive()) {
        this.ferryTimer = 300 + Math.random() * 180;
        if (this.hud.spawnFerry(() => game.startRush())) this.tutorial.tip('ferry');
      }
    }
  }

  // ───────────── game events ─────────────

  private wireGame(): void {
    game.on((e) => {
      switch (e.type) {
        case 'cycle': {
          if (anyModal()) break;
          // Fast managed stands would clink non-stop: only audible cycles ≥ 0.4 s.
          const ct = E.cycleTime(e.i, game.run.levels[e.i]);
          if (ct >= 0.4 || !game.run.managers[e.i]) audio.cash(e.i >= 5);
          if (this.tab === 'stands') this.stands.cycle(e.i, e.amount);
          break;
        }
        case 'buy':
          if (e.unlocked) {
            audio.unlock2();
            this.stands.rebuild();
            const rect = this.stands.cardRect(e.i);
            if (rect) fx.confetti(rect.left + 40, rect.top + 30, 30, 0.6);
          }
          break;
        case 'milestone': {
          audio.milestone();
          void haptic('medium');
          const name = bizName(E.BUSINESSES[e.i].id);
          banner(e.level <= 400 ? t('milestone.speed', { biz: name }) : t('milestone.profit', { biz: name }), '', BADGE_ICONS.boost, 'mint');
          const rect = this.stands.cardRect(e.i);
          if (rect) fx.sparks(rect.left + 40, rect.top + rect.height / 2, 18);
          break;
        }
        case 'festival':
          audio.festival();
          void haptic('success');
          banner(t('festival.title'), t('festival.body', { n: e.level }), BADGE_ICONS.trophy, 'pink');
          fx.confetti(window.innerWidth / 2, window.innerHeight * 0.35, 80, 1.2);
          void maybeAskReview('festival');
          break;
        case 'recipe':
          this.stands.slowUpdate();
          break;
        case 'goal': {
          audio.register();
          const names = districtNames(districtDef(store.data.district + 1).id);
          banner(t('goal.reached', names), '', BADGE_ICONS.districts, 'gold');
          break;
        }
        case 'rush':
          if (e.on) {
            audio.rush();
            banner(t('ferry.rush'), '', BADGE_ICONS.boost, 'pink');
          }
          break;
        case 'gold':
          audio.gold();
          break;
      }
    });
  }

  private onHired(i: number): void {
    this.stands.rebuild();
    if (store.data.stats.hires === 1) {
      showHireCelebration(i);
      // A happy moment to ask for notification permission (the till-full reminder).
      setTimeout(() => void requestNotifications(), 1500);
    }
  }

  private move(): void {
    const res = game.move();
    if (!res) return;
    audio.move();
    void haptic('heavy');
    track('district_move', { district: res.district, lale: res.lale });
    const d = store.data;
    if (!d.owned.includes('starter_pack') && d.starterOfferUntil === 0) store.update((s) => (s.starterOfferUntil = Date.now() + 72 * 3_600_000));
    this.go('stands');
    this.refresh();
    showWelcome(res.district, res.lale);
    void maybeAskReview('move');
  }

  // ───────────── lifecycle ─────────────

  private setActive(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    audio.setSuspended(!active);
    if (!active) {
      store.data.lastSeen = Date.now();
      void store.flush();
      void rescheduleNotifications();
    } else {
      this.last = performance.now();
      const report = game.offlineReport();
      if (report.away < 60) game.catchUp();
      else this.welcomeBack(undefined, report);
    }
  }

  /** Offline earnings on launch or resume. Returns true if a dialog was shown. */
  private welcomeBack(onDone: () => void = () => {}, report: OfflineReport = game.offlineReport()): boolean {
    if (report.away >= 60 && report.earnings > 0) {
      this.paused = true;
      showOffline(report, () => {
        this.paused = false;
        this.refresh();
        onDone();
      });
      return true;
    }
    onDone();
    return false;
  }

  /** Launch sequence: offline earnings → daily reward → club gift → limited offer. */
  private startupFlow(boot: OfflineReport): void {
    const steps: Array<(next: () => void) => void> = [];
    steps.push((next) => {
      this.welcomeBack(next, boot);
    });
    if (loginClaimable() >= 0 && store.data.stats.sessions > 1) steps.push((next) => showDailyLogin(() => (this.refresh(), next())));
    if (clubGiftClaimable()) steps.push((next) => showClubGift(next));
    const run = () => {
      const s = steps.shift();
      if (s) s(run);
      else this.maybeOffer();
    };
    setTimeout(run, 400);
  }

  private maybeOffer(): void {
    const d = store.data;
    // Starter pack: unlocked by the first move or 30 minutes of play.
    if (!d.owned.includes('starter_pack') && d.starterOfferUntil === 0 && d.stats.playSeconds > 1800) store.update((s) => (s.starterOfferUntil = Date.now() + 72 * 3_600_000));
    if (d.starterOfferUntil > Date.now() && !d.owned.includes('starter_pack') && d.stats.sessions % 2 === 0) {
      const body = h(
        'div',
        { class: 'modal-body center offer-modal' },
        h('div', { class: 'offer-art', html: tekirSVG(110, 'happy') }),
        h('p', { class: 'modal-text' }, t('product.starter_pack.desc')),
        h('div', { class: 'offer-row', html: `${goldIcon(30)}<b>300</b><span>${BADGE_ICONS.boost}</span><b>24h ×2</b>` }),
        h(
          'button',
          {
            class: 'btn btn-buy btn-wide',
            onclick: async () => {
              m.close();
              if (await iap.purchase('starter_pack')) {
                audio.purchase();
                this.refresh();
              }
            },
          },
          iap.price('starter_pack'),
        ),
      );
      const m = modal(body, { title: t('product.starter_pack'), className: 'offer-pop' });
    }
  }

  /** Exposed for e2e tests and screenshots. */
  debug() {
    return { game, store, go: (tab: Tab) => this.go(tab), refresh: () => this.refresh(), cats: CATS };
  }
}
