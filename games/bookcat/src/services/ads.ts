import { CONFIG } from '../config';
import { t } from '../i18n';
import { hasNoAds } from '../meta/economy';
import { store } from '../meta/state';
import { audio } from './audio';
import { isNative, platform, track } from './platform';

/**
 * Ad strategy — the fair answer to the genre's #1 complaint ("I watch more
 * ads than I play"):
 *  - Rewarded video is ALWAYS optional and always valuable (+10 moves,
 *    double coins, a free hint, free coins). Every level is winnable without it.
 *  - Interstitials only after a WIN (never mid-level, never after a loss),
 *    not before level 12, at most every 3 levels and 150 s, never for
 *    "Reklamsız Okuma" owners.
 *  - No banners: they earn little and cover the cards.
 */
export type RewardPlacement = 'moves' | 'double' | 'hint' | 'coins';
export type InterstitialTrigger = 'level_end';

/** Upper bound on a full-screen ad, so a lost dismiss event can never freeze the game. */
const AD_TIMEOUT_MS = 5 * 60_000;

class AdService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private rewardedReady = false;
  private interstitialReady = false;
  private rewardedLoading: Promise<void> | null = null;
  private interstitialLoading: Promise<void> | null = null;
  /** The interstitial being shown: a second call waits for it instead of showing another. */
  private showing: Promise<void> | null = null;

  private get units() {
    return platform === 'ios' ? CONFIG.admob.ios : CONFIG.admob.android;
  }

  /** Consent (UMP / GDPR / KVKK) → ATT on iOS → SDK init → preload. */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      if (!isNative) {
        this.initialized = true;
        return;
      }
      try {
        const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
        await AdMob.initialize({ initializeForTesting: CONFIG.admob.testing });
        const consent = await AdMob.requestConsentInfo();
        if (platform === 'ios') {
          const tracking = await AdMob.trackingAuthorizationStatus();
          if (tracking.status === 'notDetermined') await AdMob.requestTrackingAuthorization();
        }
        if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }
        this.initialized = true;
        void this.preloadRewarded();
        if (!hasNoAds()) void this.preloadInterstitial();
      } catch (e) {
        console.warn('Ads init failed', e);
      }
    })();
    return this.initPromise;
  }

  private preloadRewarded(): Promise<void> {
    if (!isNative || !this.initialized || this.rewardedReady) return Promise.resolve();
    this.rewardedLoading ??= (async () => {
      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.prepareRewardVideoAd({ adId: this.units.rewarded, isTesting: CONFIG.admob.testing });
        this.rewardedReady = true;
      } catch {
        this.rewardedReady = false;
      } finally {
        this.rewardedLoading = null;
      }
    })();
    return this.rewardedLoading;
  }

  private preloadInterstitial(): Promise<void> {
    if (!isNative || !this.initialized || this.interstitialReady) return Promise.resolve();
    this.interstitialLoading ??= (async () => {
      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.prepareInterstitial({ adId: this.units.interstitial, isTesting: CONFIG.admob.testing });
        this.interstitialReady = true;
      } catch {
        this.interstitialReady = false;
      } finally {
        this.interstitialLoading = null;
      }
    })();
    return this.interstitialLoading;
  }

  /**
   * Shows a rewarded video. Resolves true only if the reward was earned, and
   * only once the ad is closed. Never loads on demand: a video that pops up
   * seconds later would land mid-level or after the player moved on, so
   * without a preloaded ad it resolves false at once (callers say "no video
   * right now") and loads one for the next try.
   */
  async rewarded(placement: RewardPlacement): Promise<boolean> {
    track('ad_rewarded_request', { placement });
    await this.init();
    if (isNative && !this.rewardedReady) {
      void this.preloadRewarded();
      return false;
    }
    let earned = false;
    audio.setSuspended(true);
    try {
      earned = isNative ? await this.showRewardedNative() : await webMockAd(true);
    } catch {
      earned = false;
    } finally {
      audio.setSuspended(false);
      if (isNative) void this.preloadRewarded();
    }
    if (earned) {
      store.update((d) => {
        d.stats.adsWatched++;
        // A rewarded video counts as a full-screen ad for the interstitial gap.
        d.ads.lastInterstitial = Math.max(d.ads.lastInterstitial, Date.now());
      });
      track('ad_rewarded_earned', { placement });
    }
    return earned;
  }

  /**
   * In plugin 8.x showRewardVideoAd() resolves only when the reward is
   * earned and never settles when the ad is closed early or fails to show,
   * so the outcome is read from the Rewarded / Dismissed / FailedToShow events.
   */
  private async showRewardedNative(): Promise<boolean> {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
    this.rewardedReady = false;
    let got = false;
    let end: (v: boolean) => void = () => undefined;
    const closed = new Promise<boolean>((resolve) => {
      end = resolve;
    });
    const handles = await Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        got = true;
      }),
      // The reward callback can trail the dismissal by a moment on some devices.
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => setTimeout(() => end(got), got ? 0 : 500)),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => end(false)),
    ]);
    const guard = setTimeout(() => end(got), AD_TIMEOUT_MS);
    AdMob.showRewardVideoAd().then(
      () => {
        got = true;
      },
      () => end(got),
    );
    try {
      return await closed;
    } finally {
      clearTimeout(guard);
      for (const hnd of handles) void hnd.remove().catch(() => undefined);
    }
  }

  interstitialEligible(_trigger: InterstitialTrigger): boolean {
    if (hasNoAds()) return false;
    const d = store.data;
    const cfg = CONFIG.ads;
    if (d.level <= cfg.firstLevelWithAds) return false;
    if (Date.now() - d.ads.lastInterstitial < cfg.minIntervalSec * 1000) return false;
    return d.ads.sinceInterstitial + 1 >= cfg.everyNLevels;
  }

  /** Call at natural breaks. Applies pacing rules and may show an interstitial; resolves once it is closed. */
  maybeInterstitial(trigger: InterstitialTrigger): Promise<void> {
    if (this.showing) return this.showing;
    if (!this.interstitialEligible(trigger)) {
      store.update((d) => {
        d.ads.sinceInterstitial++;
      });
      return Promise.resolve();
    }
    this.showing = this.showInterstitial(trigger).finally(() => {
      this.showing = null;
    });
    return this.showing;
  }

  private async showInterstitial(trigger: InterstitialTrigger): Promise<void> {
    await this.init();
    if (isNative && !this.interstitialReady) {
      // Not loaded: skip this break rather than make the player wait for a load.
      void this.preloadInterstitial();
      return;
    }
    audio.setSuspended(true);
    try {
      const shown = isNative ? await this.showInterstitialNative() : await webMockAd(false);
      if (shown) {
        store.update((d) => {
          d.ads.lastInterstitial = Date.now();
          d.ads.sinceInterstitial = 0;
        });
        track('ad_interstitial_shown', { trigger });
      }
    } catch {
      /* no fill — fine */
    } finally {
      audio.setSuspended(false);
      if (isNative) void this.preloadInterstitial();
    }
  }

  /** showInterstitial() resolves when the ad appears; wait for Dismissed (or FailedToShow) instead. */
  private async showInterstitialNative(): Promise<boolean> {
    const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob');
    this.interstitialReady = false;
    let end: (v: boolean) => void = () => undefined;
    const closed = new Promise<boolean>((resolve) => {
      end = resolve;
    });
    const handles = await Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => end(true)),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => end(false)),
    ]);
    const guard = setTimeout(() => end(true), AD_TIMEOUT_MS);
    AdMob.showInterstitial().catch(() => end(false));
    try {
      return await closed;
    } finally {
      clearTimeout(guard);
      for (const hnd of handles) void hnd.remove().catch(() => undefined);
    }
  }

  /** Lets players in GDPR regions revisit their consent choice (Settings). */
  async privacyOptions(): Promise<void> {
    if (!isNative) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.showPrivacyOptionsForm();
    } catch {
      /* not required in this region */
    }
  }
}

/** Browser / demo stand-in so every ad flow is testable without the SDK. */
function webMockAd(rewarded: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'mock-ad';
    let left = rewarded ? 3 : 2;
    el.innerHTML = `<div class="mock-ad-box"><div class="mock-ad-tag">${t('ad.test')}</div><div class="mock-ad-title">${rewarded ? t('ad.rewarded') : t('ad.interstitial')}</div><div class="mock-ad-count">${left}</div><button class="btn btn-ghost mock-ad-close" disabled>${t('ad.close')}</button></div>`;
    document.body.appendChild(el);
    const count = el.querySelector('.mock-ad-count')!;
    const close = el.querySelector<HTMLButtonElement>('.mock-ad-close')!;
    const timer = setInterval(() => {
      left--;
      count.textContent = String(Math.max(0, left));
      if (left <= 0) {
        clearInterval(timer);
        close.disabled = false;
      }
    }, 1000);
    close.addEventListener('click', () => {
      el.remove();
      resolve(true);
    });
  });
}

export const ads = new AdService();
