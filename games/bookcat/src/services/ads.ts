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

class AdService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private rewardedReady = false;
  private interstitialReady = false;

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

  private async preloadRewarded(): Promise<void> {
    if (!isNative || !this.initialized) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({ adId: this.units.rewarded, isTesting: CONFIG.admob.testing });
      this.rewardedReady = true;
    } catch {
      this.rewardedReady = false;
    }
  }

  private async preloadInterstitial(): Promise<void> {
    if (!isNative || !this.initialized) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareInterstitial({ adId: this.units.interstitial, isTesting: CONFIG.admob.testing });
      this.interstitialReady = true;
    } catch {
      this.interstitialReady = false;
    }
  }

  /** Shows a rewarded video. Resolves true only if the reward was earned. */
  async rewarded(placement: RewardPlacement): Promise<boolean> {
    track('ad_rewarded_request', { placement });
    await this.init();
    let earned = false;
    audio.setSuspended(true);
    try {
      if (!isNative) {
        earned = await webMockAd(true);
      } else {
        if (!this.rewardedReady) await this.preloadRewarded();
        if (!this.rewardedReady) return false;
        const { AdMob } = await import('@capacitor-community/admob');
        this.rewardedReady = false;
        const reward = await AdMob.showRewardVideoAd();
        earned = !!reward;
        void this.preloadRewarded();
      }
    } catch {
      earned = false;
    } finally {
      audio.setSuspended(false);
    }
    if (earned) {
      store.update((d) => {
        d.stats.adsWatched++;
      });
      track('ad_rewarded_earned', { placement });
    }
    return earned;
  }

  interstitialEligible(_trigger: InterstitialTrigger): boolean {
    if (hasNoAds()) return false;
    const d = store.data;
    const cfg = CONFIG.ads;
    if (d.level <= cfg.firstLevelWithAds) return false;
    if (Date.now() - d.ads.lastInterstitial < cfg.minIntervalSec * 1000) return false;
    return d.ads.sinceInterstitial + 1 >= cfg.everyNLevels;
  }

  /** Call at natural breaks. Applies pacing rules and may show an interstitial. */
  async maybeInterstitial(trigger: InterstitialTrigger): Promise<void> {
    if (!this.interstitialEligible(trigger)) {
      store.update((d) => {
        d.ads.sinceInterstitial++;
      });
      return;
    }
    await this.init();
    audio.setSuspended(true);
    try {
      if (!isNative) {
        await webMockAd(false);
      } else {
        if (!this.interstitialReady) await this.preloadInterstitial();
        if (!this.interstitialReady) return;
        const { AdMob } = await import('@capacitor-community/admob');
        this.interstitialReady = false;
        await AdMob.showInterstitial();
        void this.preloadInterstitial();
      }
      store.update((d) => {
        d.ads.lastInterstitial = Date.now();
        d.ads.sinceInterstitial = 0;
      });
      track('ad_interstitial_shown', { trigger });
    } catch {
      /* no fill — fine */
    } finally {
      audio.setSuspended(false);
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
