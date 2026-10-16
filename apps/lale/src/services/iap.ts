import { CONFIG } from '../config';
import { parseLocal } from '../core/exams';
import { currentLang } from '../i18n';
import { fallbackPrice, PRODUCT_BY_ID, PRODUCTS, type Product } from '../meta/catalog';
import { store } from '../meta/state';
import { isNative, platform, track } from './platform';

/**
 * Lale Bahçıvan purchases through RevenueCat (StoreKit 2 / Play Billing,
 * server-side receipt validation, restore across devices).
 *
 * RevenueCat setup:
 *  - Entitlement `bahcivan` ← lale_monthly, lale_yearly (auto-renewing),
 *    lale_lifetime (non-consumable).
 *  - lale_season_* are non-renewing subscriptions (App Store) / prepaid
 *    plans (Google Play); the app grants them until `Product.until`.
 *  - Enable Family Sharing for lale_yearly and lale_lifetime.
 */
type StoreProduct = { identifier: string; priceString: string; price?: number; currencyCode?: string };
export type PurchaseResult = 'ok' | 'cancelled' | 'pending' | 'failed' | 'unavailable';

class IapService {
  private products = new Map<string, StoreProduct>();
  private configured = false;
  private inFlight = new Set<string>();
  demoConfirm: (p: Product) => Promise<boolean> = async () => true;

  private get key(): string {
    return platform === 'ios' ? CONFIG.revenuecat.ios : CONFIG.revenuecat.android;
  }

  /**
   * Simulated purchases: web builds and native dev builds without real keys.
   * A native release build with placeholder keys must never hand out free
   * premium, so there the store is simply unavailable.
   */
  get demo(): boolean {
    return !isNative || (import.meta.env.DEV && this.key.includes('REPLACE_ME'));
  }

  get available(): boolean {
    return this.demo || this.configured;
  }

  async init(): Promise<void> {
    if (this.demo || this.key.includes('REPLACE_ME')) return;
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      await Purchases.configure({ apiKey: this.key });
      this.configured = true;
      // Pending payments (Play "slow card", Ask to Buy) and renewals arrive here.
      await Purchases.addCustomerInfoUpdateListener((info) => this.apply(info as never));
      await this.loadProducts();
      await this.refresh();
    } catch (e) {
      console.warn('IAP init failed', e);
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const subs = await Purchases.getProducts({ productIdentifiers: PRODUCTS.filter((p) => p.kind === 'subscription').map((p) => p.id) });
      const other = await Purchases.getProducts({ productIdentifiers: PRODUCTS.filter((p) => p.kind !== 'subscription').map((p) => p.id), type: 'NON_SUBSCRIPTION' as never });
      for (const p of [...subs.products, ...other.products]) this.products.set(p.identifier, p as StoreProduct);
    } catch {
      /* offline: retried on the next purchase */
    }
  }

  /** Pull entitlements and purchased products from RevenueCat into the save. */
  async refresh(): Promise<void> {
    if (!this.configured) return;
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.getCustomerInfo();
      this.apply(customerInfo as never);
    } catch {
      /* offline: keep the cached state */
    }
  }

  private apply(info: { entitlements?: { active?: Record<string, { productIdentifier?: string }> }; allPurchasedProductIdentifiers?: string[] }): void {
    const active = info?.entitlements?.active ?? {};
    const purchased = info?.allPurchasedProductIdentifiers ?? [];
    store.update((d) => {
      d.premium.subscription = Object.values(active).some((e) => e.productIdentifier === 'lale_monthly' || e.productIdentifier === 'lale_yearly');
      for (const id of purchased) {
        const p = PRODUCT_BY_ID[id];
        if (!p) continue;
        if ((p.kind === 'lifetime' || p.kind === 'season') && !d.premium.owned.includes(id)) d.premium.owned.push(id);
        if (p.kind === 'season' && p.until) d.premium.seasonUntil = Math.max(d.premium.seasonUntil, parseLocal(p.until).getTime());
      }
    });
  }

  price(id: string): string {
    const p = this.products.get(id);
    if (p) return p.priceString;
    const def = PRODUCT_BY_ID[id];
    return def ? fallbackPrice(def, currentLang()) : '';
  }

  /** Numeric price for comparisons (per-month equivalents, savings). */
  amount(id: string): { value: number; currency: string } | null {
    const p = this.products.get(id);
    if (p && typeof p.price === 'number' && p.currencyCode) return { value: p.price, currency: p.currencyCode };
    const def = PRODUCT_BY_ID[id];
    if (!def) return null;
    const lang = currentLang();
    return lang === 'tr' ? { value: def.try, currency: 'TRY' } : lang === 'de' || lang === 'es' ? { value: def.usd, currency: 'EUR' } : { value: def.usd, currency: 'USD' };
  }

  /** "₺29,17" for a yearly plan shown per month. */
  perMonth(id: string): string {
    const a = this.amount(id);
    if (!a) return '';
    try {
      return new Intl.NumberFormat(currentLang(), { style: 'currency', currency: a.currency, maximumFractionDigits: 2 }).format(a.value / 12);
    } catch {
      return (a.value / 12).toFixed(2);
    }
  }

  async purchase(id: string): Promise<PurchaseResult> {
    const def = PRODUCT_BY_ID[id];
    if (!def) return 'failed';
    if (this.inFlight.has(id)) return 'cancelled';
    this.inFlight.add(id);
    track('iap_start', { id });
    let res: PurchaseResult = 'failed';
    try {
      if (this.demo) {
        res = (await this.demoConfirm(def)) ? 'ok' : 'cancelled';
        if (res === 'ok') {
          store.update((d) => {
            if (def.kind === 'subscription') d.premium.subscription = true;
            else if (!d.premium.owned.includes(id)) d.premium.owned.push(id);
            if (def.kind === 'season' && def.until) d.premium.seasonUntil = Math.max(d.premium.seasonUntil, parseLocal(def.until).getTime());
          });
        }
      } else if (!this.configured) {
        res = 'unavailable';
      } else {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        if (!this.products.has(id)) await this.loadProducts();
        const product = this.products.get(id);
        if (!product) {
          res = 'unavailable';
        } else {
          try {
            const r = await Purchases.purchaseStoreProduct({ product: product as never });
            this.apply(r.customerInfo as never);
            res = 'ok';
          } catch (e) {
            const err = e as { code?: string; userCancelled?: boolean | null };
            res = err?.userCancelled || err?.code === '1' ? 'cancelled' : err?.code === '20' ? 'pending' : 'failed';
            if (res === 'failed') console.warn('purchase failed', e);
          }
        }
      }
    } finally {
      this.inFlight.delete(id);
    }
    if (res === 'ok') {
      track('iap_success', { id, usd: def.usd });
      await store.flush();
    }
    return res;
  }

  async restore(): Promise<boolean> {
    if (this.demo || !this.configured) return false;
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();
      this.apply(customerInfo as never);
      return ((customerInfo as unknown as { allPurchasedProductIdentifiers?: string[] }).allPurchasedProductIdentifiers ?? []).length > 0;
    } catch {
      return false;
    }
  }
}

export const iap = new IapService();
