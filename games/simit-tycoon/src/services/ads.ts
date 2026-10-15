import { CONFIG } from '../config';
import { t } from '../i18n';
import { adFree } from '../meta/game';
import { store } from '../meta/state';
import { audio } from './audio';
import { isNative, platform, track } from './platform';

/**
 * Rewarded ads only (idle-genre best practice):
 *  - ×2 income boost (+2 h, stacks to 8 h)
 *  - ×2 offline earnings on the welcome-back screen
 *  - free gold (3 per day)
 * Always optional, always worth it. No interstitials, no banners.
 * "Reklamsız Ödüller" owners and Kedi Kulübü members get every reward
 * instantly without a video.
 */
export type RewardPlacement = 'boost' | 'offline' | 'gold';

class AdService {
  private initPromise: Promise<void> | null = null;
  private initialized = false;
  private ready = false;

  private get unit(): string {
    return platform === 'ios' ? CONFIG.admob.ios.rewarded : CONFIG.admob.android.rewarded;
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
        if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
        this.initialized = true;
        void this.preload();
      } catch (e) {
        console.warn('Ads init failed', e);
      }
    })();
    return this.initPromise;
  }

  private async preload(): Promise<void> {
    if (!isNative || !this.initialized) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({ adId: this.unit, isTesting: CONFIG.admob.testing });
      this.ready = true;
    } catch {
      this.ready = false;
    }
  }

  /** Shows a rewarded video. Resolves true only if the reward was earned. */
  async rewarded(placement: RewardPlacement): Promise<boolean> {
    if (adFree()) {
      track('ad_skipped_adfree', { placement });
      return true;
    }
    track('ad_rewarded_request', { placement });
    await this.init();
    let earned = false;
    audio.setSuspended(true);
    try {
      if (!isNative) earned = await webMockAd();
      else {
        if (!this.ready) await this.preload();
        if (!this.ready) return false;
        const { AdMob } = await import('@capacitor-community/admob');
        this.ready = false;
        const reward = await AdMob.showRewardVideoAd();
        earned = !!reward;
        void this.preload();
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
function webMockAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'mock-ad';
    let left = 3;
    el.innerHTML = `<div class="mock-ad-box"><div class="mock-ad-tag">${t('ad.test')}</div><div class="mock-ad-title">${t('ad.rewarded')}</div><div class="mock-ad-count">${left}</div><button class="btn btn-ghost mock-ad-close" disabled>${t('ad.close')}</button></div>`;
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
