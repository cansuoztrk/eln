import { CONFIG } from '../config';
import { currentLang } from '../i18n';
import { ENTITLEMENT_NO_ADS, ENTITLEMENT_VIP, fallbackPrice, PRODUCT_BY_ID, PRODUCTS, type Product } from '../meta/catalog';
import { applyGrant } from '../meta/economy';
import { ensureSeason, unlockPremium } from '../meta/pass';
import { store } from '../meta/state';
import { isNative, platform, track } from './platform';

/**
 * Purchases via RevenueCat (StoreKit 2 + Google Play Billing, server-side
 * receipt validation, entitlements, cross-device restore).
 *
 * RevenueCat dashboard setup:
 *  - Entitlement `no_ads`  ← products: no_ads, vip_monthly, vip_yearly
 *  - Entitlement `vip`     ← products: vip_monthly, vip_yearly
 *  - Consumables (coins_*, starter_pack, bundle_*) need no entitlement.
 */
type StoreProduct = { identifier: string; priceString: string; productCategory?: string | null };

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
      await Purchases.addCustomerInfoUpdateListener((info) => this.applyEntitlements(info as never));
      const ids = PRODUCTS.map((p) => p.id);
      const [inapp, subs] = await Promise.all([
        Purchases.getProducts({ productIdentifiers: ids.filter((id) => PRODUCT_BY_ID[id].type !== 'subscription'), type: 'NON_SUBSCRIPTION' as never }),
        Purchases.getProducts({ productIdentifiers: ids.filter((id) => PRODUCT_BY_ID[id].type === 'subscription'), type: 'SUBSCRIPTION' as never }),
      ]);
      for (const p of [...inapp.products, ...subs.products]) this.products.set(p.identifier, p as StoreProduct);
      const { customerInfo } = await Purchases.getCustomerInfo();
      this.applyEntitlements(customerInfo as never);
    } catch (e) {
      console.warn('IAP init failed', e);
    }
  }

  private applyEntitlements(info: { entitlements: { active: Record<string, { expirationDate: string | null }> } }): void {
    const active = info?.entitlements?.active ?? {};
    store.update((d) => {
      if (active[ENTITLEMENT_NO_ADS]) d.removeAds = d.removeAds || !!active[ENTITLEMENT_NO_ADS];
      const vip = active[ENTITLEMENT_VIP];
      d.vipUntil = vip ? (vip.expirationDate ? Date.parse(vip.expirationDate) : Date.now() + 86400000 * 30) : 0;
      if (vip && !d.themes.includes('saray')) d.themes.push('saray');
    });
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
    if (id === 'pass_premium') {
      ensureSeason();
      if (store.data.pass.premium) return false;
    }
    track('iap_start', { id });
    let ok = false;
    if (this.demo) {
      ok = await this.demoConfirm(def);
      if (ok && def.type === 'subscription') {
        store.update((d) => {
          d.vipUntil = Date.now() + (def.period === 'year' ? 365 : 30) * 86400000;
          if (!d.themes.includes('saray')) d.themes.push('saray');
        });
      }
    } else if (this.configured) {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        const product = this.products.get(id);
        if (!product) return false;
        const res = await Purchases.purchaseStoreProduct({ product: product as never });
        this.applyEntitlements(res.customerInfo as never);
        ok = true;
      } catch (e) {
        // userCancelled is a normal outcome; anything else is logged.
        if (!(e as { userCancelled?: boolean })?.userCancelled) console.warn('purchase failed', e);
        ok = false;
      }
    }
    if (ok) {
      applyGrant(def.grant);
      if (id === 'pass_premium') unlockPremium();
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
      const active = (customerInfo as unknown as { entitlements: { active: Record<string, unknown> } }).entitlements.active;
      // Non-consumable themes are restored from the purchase history.
      const all = (customerInfo as unknown as { allPurchasedProductIdentifiers?: string[] }).allPurchasedProductIdentifiers ?? [];
      store.update((d) => {
        for (const id of all) {
          const p = PRODUCT_BY_ID[id];
          if (p?.type === 'non_consumable' && !d.owned.includes(id)) {
            d.owned.push(id);
            if (p.grant.themes) for (const th of p.grant.themes) if (!d.themes.includes(th)) d.themes.push(th);
            if (p.grant.removeAds) d.removeAds = true;
          }
        }
      });
      return Object.keys(active).length > 0 || all.length > 0;
    } catch {
      return false;
    }
  }
}

export const iap = new IapService();
