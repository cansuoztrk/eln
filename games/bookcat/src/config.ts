/**
 * Release configuration. Replace the placeholders before publishing:
 *  - AdMob: create the app + ad units in https://admob.google.com and paste the IDs.
 *    The defaults are Google's official TEST ids (safe for TestFlight / internal testing only).
 *  - RevenueCat: create a project at https://app.revenuecat.com and paste the public SDK keys.
 */
export const CONFIG = {
  appName: 'Bookcat',
  studio: 'Tekir Studios',
  supportEmail: 'destek@tekirstudios.com',
  privacyUrl: 'https://tekirstudios.com/kitap-kedisi/gizlilik',
  termsUrl: 'https://tekirstudios.com/kitap-kedisi/kosullar',

  admob: {
    testing: true,
    ios: {
      interstitial: 'ca-app-pub-3940256099942544/4411468910',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
    android: {
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
    },
  },

  revenuecat: {
    ios: 'appl_REPLACE_ME',
    android: 'goog_REPLACE_ME',
  },

  /**
   * Interstitial pacing — the main lever between ad revenue and retention.
   * Never before level 12, never mid-level, never after a loss, at most one
   * every 3 levels and 150 seconds; never for "Reklamsız Okuma" owners.
   */
  ads: {
    firstLevelWithAds: 12,
    everyNLevels: 3,
    minIntervalSec: 150,
  },
} as const;
