/**
 * Release configuration. Replace the REPLACE_ME values before publishing
 * (see README › Yayın öncesi). With an empty `apiUrl` the AI features run in
 * demo mode with sample results, so the app is fully usable offline.
 */
export const CONFIG = {
  /** Lokma AI backend (services/lokma-api), e.g. https://lokma-api.example.workers.dev */
  apiUrl: '',
  revenuecat: {
    ios: 'appl_REPLACE_ME',
    android: 'goog_REPLACE_ME',
  },
  /** RevenueCat entitlement that unlocks Pro. */
  entitlement: 'pro',
  /** Free AI analyses before the paywall (photo or text). */
  freeAiScans: 3,
  privacyUrl: 'https://tekirstudios.com/lokma/gizlilik',
  termsUrl: 'https://tekirstudios.com/lokma/kosullar',
  supportEmail: 'destek@tekirstudios.com',
  /** Open Food Facts asks every app to identify itself. */
  offUserAgent: 'Lokma/1.0 (destek@tekirstudios.com)',
};
