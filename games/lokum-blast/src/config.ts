/**
 * Release configuration. Replace the placeholders before publishing:
 *  - AdMob: create the app + ad units in https://admob.google.com and paste the IDs.
 *    The defaults are Google's official TEST ids (safe to ship to TestFlight / internal testing only).
 *  - RevenueCat: create a project at https://app.revenuecat.com, add the iOS & Android apps
 *    and paste the public SDK keys.
 */
export const CONFIG = {
  appName: 'Lokum Blast',
  studio: 'Tekir Studios',
  supportEmail: 'destek@tekirstudios.com',
  privacyUrl: 'https://tekirstudios.com/lokum-blast/gizlilik',
  termsUrl: 'https://tekirstudios.com/lokum-blast/kosullar',

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

  /** Interstitial pacing — the main lever between ad revenue and retention. */
  ads: {
    minIntervalSec: 120,
    classicEveryNGames: 2,
    journeyEveryNLevels: 2,
    firstLevelWithAds: 8,
    graceGames: 3,
  },
} as const;
