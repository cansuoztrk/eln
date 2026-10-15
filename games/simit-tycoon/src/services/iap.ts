import { CONFIG } from '../config';
import { currentLang } from '../i18n';
import { ENTITLEMENT_CLUB, ENTITLEMENT_NO_ADS, fallbackPrice, PRODUCT_BY_ID, PRODUCTS, type Product } from '../meta/catalog';
import type { Game } from '../meta/game';
import { store } from '../meta/state';
import { isNative, platform, track } from './platform';

/**
 * Purchases via RevenueCat (StoreKit 2 + Google Play Billing, server-side
 * receipt validation, entitlements, cross-device restore).
 *
 * RevenueCat dashboard setup:
 *  - Entitlement `no_ads` ← products: no_ads, club_monthly, club_yearly
 *  - Entitlement `club`   ← products: club_monthly, club_yearly
 *  - mult_x2 / mult_x3 are non-consumables (restored from purchase history)
 *  - gold_* and starter_pack are consumables.
 */
type StoreProduct = { identifier: string; priceString: string };
type ConfirmFn = (product: Product) => Promise<boolean>;

class IapService {
  private products = new Map<string, StoreProduct>();
  private configured = false;
  private game: Game | null = null;
  /** Web/demo builds ask the UI to confirm a simulated purchase. */
  demoConfirm: ConfirmFn = async () => true;

  get demo(): boolean {
    const key = platform === 'ios' ? CONFIG.revenuecat.ios : CONFIG.revenuecat.android;
    return !isNative || key.includes('REPLACE_ME');
  }

  async init(game: Game): Promise<void> {
    this.game = game;
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
      if (active[ENTITLEMENT_NO_ADS] && !d.owned.includes('no_ads') && !active[ENTITLEMENT_CLUB]) d.owned.push('no_ads');
      const club = active[ENTITLEMENT_CLUB];
      d.vipUntil = club ? (club.expirationDate ? Date.parse(club.expirationDate) : Date.now() + 30 * 86_400_000) : 0;
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
    track('iap_start', { id });
    let ok = false;
    if (this.demo) {
      ok = await this.demoConfirm(def);
      if (ok && def.type === 'subscription') {
        store.update((d) => {
          d.vipUntil = Date.now() + (def.period === 'year' ? 365 : 30) * 86_400_000;
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
      store.update((d) => {
        if (def.once && !d.owned.includes(id)) d.owned.push(id);
        d.stats.purchases++;
        if (id === 'starter_pack') d.starterOfferUntil = 0;
      });
      this.game?.applyGrant(def.grant);
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
      const info = customerInfo as unknown as { entitlements: { active: Record<string, unknown> }; allPurchasedProductIdentifiers?: string[] };
      const all = info.allPurchasedProductIdentifiers ?? [];
      store.update((d) => {
        for (const id of all) {
          const p = PRODUCT_BY_ID[id];
          if (p?.type === 'non_consumable' && !d.owned.includes(id)) d.owned.push(id);
        }
      });
      return Object.keys(info.entitlements.active).length > 0 || all.length > 0;
    } catch {
      return false;
    }
  }
}

export const iap = new IapService();
