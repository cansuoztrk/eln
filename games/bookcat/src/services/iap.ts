import type { CustomerInfo, PurchasesStoreProduct } from '@revenuecat/purchases-capacitor';
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
 *
 * Delivery: every store transaction is granted exactly once through a ledger
 * in the save (SaveData.iap), whichever path reports it first — the purchase
 * call, the launch check, or the CustomerInfo listener. So a payment that
 * clears later (Google pending payments, iOS Ask to Buy) or a purchase whose
 * app died before the call returned is still delivered.
 */
type ConfirmFn = (product: Product) => Promise<boolean>;

/** The fields of a RevenueCat PurchasesStoreTransaction the ledger needs. */
export interface StoreTx {
  transactionIdentifier: string;
  productIdentifier: string;
  purchaseDate: string;
}

export type PurchaseResult = 'ok' | 'cancelled' | 'pending' | 'failed' | 'unavailable' | 'busy';

/**
 * Grants each transaction not yet in the ledger and returns the product ids
 * granted. Transactions dated before the ledger started (`iap.since`) were
 * handled by an earlier install or app version and are skipped, except
 * `fresh`: the one a purchase call has just returned. A once-only product
 * that is already owned is recorded without granting it again.
 */
export function grantTransactions(txs: readonly (StoreTx | null | undefined)[], fresh?: string): string[] {
  const out: string[] = [];
  for (const tx of txs) {
    const id = tx?.transactionIdentifier;
    const def = tx ? PRODUCT_BY_ID[tx.productIdentifier] : undefined;
    if (!tx || !id || !def || store.data.iap.granted.includes(id)) continue;
    if (id !== fresh && !(Date.parse(tx.purchaseDate) >= store.data.iap.since)) continue;
    const dup = !!def.once && store.data.owned.includes(def.id);
    store.update((d) => {
      d.iap.granted.push(id);
      if (dup) return;
      if (def.once) d.owned.push(def.id);
      d.stats.purchases++;
    });
    if (dup) continue;
    applyGrant(def.grant);
    out.push(def.id);
    track('iap_success', { id: def.id, usd: def.usd });
  }
  // A purchase is real money: do not wait for the debounced save.
  if (out.length) void store.flush();
  return out;
}

class IapService {
  private products = new Map<string, PurchasesStoreProduct>();
  private configured = false;
  private initPromise: Promise<void> | null = null;
  private initDone = false;
  private busy = false;
  /** Web/demo builds ask the UI to confirm a simulated purchase. */
  demoConfirm: ConfirmFn = async () => true;

  private get apiKey(): string {
    return platform === 'ios' ? CONFIG.revenuecat.ios : CONFIG.revenuecat.android;
  }

  /** The RevenueCat keys in config.ts are still the placeholders. */
  private get keyMissing(): boolean {
    return this.apiKey.includes('REPLACE_ME');
  }

  /**
   * Simulated purchases: web builds (browser play, screenshots, e2e) and
   * native dev builds without keys. A native release build with placeholder
   * keys is never a free shop: its store is unavailable instead.
   */
  get demo(): boolean {
    return !isNative || (import.meta.env.DEV && this.keyMissing);
  }

  /** True when the store cannot sell (native build without keys, or RevenueCat failed to start). */
  get unavailable(): boolean {
    return !this.demo && (this.keyMissing || (this.initDone && !this.configured));
  }

  init(): Promise<void> {
    this.initPromise ??= this.start().finally(() => {
      this.initDone = true;
    });
    return this.initPromise;
  }

  private async start(): Promise<void> {
    if (this.demo) return;
    if (this.keyMissing) {
      console.warn('IAP disabled: the RevenueCat keys in config.ts are placeholders');
      return;
    }
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      await Purchases.configure({ apiKey: this.apiKey });
      this.configured = true;
      // Fires with the cached info at once and whenever a transaction changes (e.g. a pending payment clears).
      await Purchases.addCustomerInfoUpdateListener((info) => this.onCustomerInfo(info));
      await this.loadProducts();
      const { customerInfo } = await Purchases.getCustomerInfo();
      this.onCustomerInfo(customerInfo);
    } catch (e) {
      console.warn('IAP init failed', e);
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const { Purchases, PRODUCT_CATEGORY } = await import('@revenuecat/purchases-capacitor');
      const res = await Purchases.getProducts({ productIdentifiers: PRODUCTS.map((p) => p.id), type: PRODUCT_CATEGORY.NON_SUBSCRIPTION });
      for (const p of res.products) this.products.set(p.identifier, p);
    } catch (e) {
      console.warn('IAP products failed', e);
    }
  }

  private onCustomerInfo(info: CustomerInfo | null | undefined): void {
    if (!info) return;
    this.applyEntitlements(info);
    grantTransactions(info.nonSubscriptionTransactions ?? []);
  }

  private applyEntitlements(info: CustomerInfo): void {
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

  /** Buys a product; one purchase at a time (a double tap does not start a second one). */
  async purchase(id: string): Promise<PurchaseResult> {
    const def = PRODUCT_BY_ID[id];
    if (!def || (def.once && this.owned(id))) return 'failed';
    if (this.busy) return 'busy';
    this.busy = true;
    try {
      track('iap_start', { id });
      return await (this.demo ? this.demoPurchase(def) : this.storePurchase(def));
    } finally {
      this.busy = false;
    }
  }

  private async demoPurchase(def: Product): Promise<PurchaseResult> {
    if (!(await this.demoConfirm(def))) return 'cancelled';
    if (def.once && this.owned(def.id)) return 'failed';
    applyGrant(def.grant);
    store.update((d) => {
      if (def.once && !d.owned.includes(def.id)) d.owned.push(def.id);
      d.stats.purchases++;
    });
    track('iap_success', { id: def.id, usd: def.usd });
    return 'ok';
  }

  private async storePurchase(def: Product): Promise<PurchaseResult> {
    await this.init();
    if (!this.configured) return 'unavailable';
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      // Products may have failed to load at launch (offline): try again now.
      if (!this.products.has(def.id)) await this.loadProducts();
      const product = this.products.get(def.id);
      if (!product) return 'unavailable';
      const res = await Purchases.purchaseStoreProduct({ product });
      this.applyEntitlements(res.customerInfo);
      grantTransactions([res.transaction, ...(res.customerInfo?.nonSubscriptionTransactions ?? [])], res.transaction?.transactionIdentifier);
      return 'ok';
    } catch (e) {
      const err = e as { code?: unknown; userCancelled?: boolean | null };
      const code = String(err?.code ?? '');
      if (code === '1' || err?.userCancelled) return 'cancelled'; // PURCHASE_CANCELLED_ERROR
      if (code === '20') return 'pending'; // PAYMENT_PENDING_ERROR: delivered by the listener once paid
      console.warn('purchase failed', e);
      return 'failed';
    }
  }

  async restore(): Promise<boolean> {
    if (this.demo) return false;
    await this.init();
    if (!this.configured) return false;
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();
      this.onCustomerInfo(customerInfo);
      const all = customerInfo.allPurchasedProductIdentifiers ?? [];
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
