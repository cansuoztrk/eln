/**
 * Release configuration. Replace the placeholders before publishing:
 *  - AdMob: create the app + a rewarded ad unit in https://admob.google.com
 *    and paste the IDs. The defaults are Google's official TEST ids (safe for
 *    TestFlight / internal testing only).
 *  - RevenueCat: create a project at https://app.revenuecat.com, add the iOS
 *    and Android apps and paste the public SDK keys.
 * Simit Tycoon shows rewarded ads only — no interstitials, no banners.
 */
export const CONFIG = {
  appName: 'Simit Tycoon',
  studio: 'Tekir Studios',
  supportEmail: 'destek@tekirstudios.com',
  privacyUrl: 'https://tekirstudios.com/simit-tycoon/gizlilik',
  termsUrl: 'https://tekirstudios.com/simit-tycoon/kosullar',

  admob: {
    testing: true,
    ios: { rewarded: 'ca-app-pub-3940256099942544/1712485313' },
    android: { rewarded: 'ca-app-pub-3940256099942544/5224354917' },
  },

  revenuecat: {
    ios: 'appl_REPLACE_ME',
    android: 'goog_REPLACE_ME',
  },
} as const;
