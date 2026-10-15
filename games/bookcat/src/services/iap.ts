import { CONFIG } from '../config';
import { currentLang } from '../i18n';
import { fallbackPrice, PRODUCT_BY_ID, PRODUCTS, type Product } from '../meta/catalog';
import { applyGrant } from '../meta/economy';
import { store } from '../meta/state';
import { isNative, platform, track } from './platform';

/**
 * Purchases via RevenueCat (StoreKit 2 + Google Play Billing, server-side
 * receipt validation, cross-device restore).
 *
 * RevenueCat dashboard setup:
 *  - Entitlement `no_ads` ← product no_ads (non-consumable)
 *  - coins_*, starter_pack and bundle_* are consumables.
 */
type StoreProduct = { identifier: string; priceString: string };
type ConfirmFn = (product: Product) => Promise<boolean>;

class IapService {
  private products = new Map<string, StoreProduct>();
  private configured = false;
  /** Web/demo builds ask the UI to confirm a simulated purchase. */
  demoConfirm: ConfirmFn = async () => true;

  get demo(): boolean {
    const key = platform === 'ios' ? CONFIG.revenuecat.ios : CONFIG.revenuecat.android;
    return !isNative || key.includes('REPLACE_ME');
  }

  async init(): Promise<void> {
    if (this.demo) return;
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const apiKey = platform === 'ios' ? CONFIG.revenuecat.ios : CONFIG.revenuecat.android;
      await Purchases.configure({ apiKey });
      this.configured = true;
      const res = await Purchases.getProducts({ productIdentifiers: PRODUCTS.map((p) => p.id), type: 'NON_SUBSCRIPTION' as never });
      for (const p of res.products) this.products.set(p.identifier, p as StoreProduct);
      const { customerInfo } = await Purchases.getCustomerInfo();
      this.applyEntitlements(customerInfo as never);
    } catch (e) {
      console.warn('IAP init failed', e);
    }
  }

  private applyEntitlements(info: { entitlements: { active: Record<string, unknown> } }): void {
    if (info?.entitlements?.active?.no_ads && !store.data.removeAds) {
      store.update((d) => {
        d.removeAds = true;
        if (!d.owned.includes('no_ads')) d.owned.push('no_ads');
      });
    }
  }

  /** Localized price from the store, or our suggested price as fallback. */
  price(id: string): string {
    const p = this.products.get(id);
    if (p) return p.priceString;
    const def = PRODUCT_BY_ID[id];
    return def ? fallbackPrice(def, currentLang()) : '';
  }

  owned(id: string): boolean {
    return store.data.owned.includes(id);
  }

  async purchase(id: string): Promise<boolean> {
    const def = PRODUCT_BY_ID[id];
    if (!def || (def.once && this.owned(id))) return false;
    track('iap_start', { id });
    let ok = false;
    if (this.demo) {
      ok = await this.demoConfirm(def);
    } else if (this.configured) {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        const product = this.products.get(id);
        if (!product) return false;
        const res = await Purchases.purchaseStoreProduct({ product: product as never });
        this.applyEntitlements(res.customerInfo as never);
        ok = true;
      } catch (e) {
        if (!(e as { userCancelled?: boolean })?.userCancelled) console.warn('purchase failed', e);
        ok = false;
      }
    }
    if (ok) {
      applyGrant(def.grant);
      store.update((d) => {
        if (def.once && !d.owned.includes(id)) d.owned.push(id);
        d.stats.purchases++;
      });
      track('iap_success', { id, usd: def.usd });
    }
    return ok;
  }

  async restore(): Promise<boolean> {
    if (this.demo || !this.configured) return false;
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();
      this.applyEntitlements(customerInfo as never);
      const all = (customerInfo as unknown as { allPurchasedProductIdentifiers?: string[] }).allPurchasedProductIdentifiers ?? [];
      store.update((d) => {
        for (const id of all) {
          const p = PRODUCT_BY_ID[id];
          if (p?.type === 'non_consumable' && !d.owned.includes(id)) {
            d.owned.push(id);
            if (p.grant.removeAds) d.removeAds = true;
          }
        }
      });
      return all.length > 0;
    } catch {
      return false;
    }
  }
}

export const iap = new IapService();
