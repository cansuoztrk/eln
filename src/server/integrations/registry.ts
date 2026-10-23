/**
 * Adaptör kayıt defteri. DataSource.adapter alanı buradaki anahtarlardan biridir.
 * Yeni bir mağaza veya sağlayıcı eklemek: adaptörü yaz → buraya kaydet → yönetim panelinden
 * veya seed ile DataSource oluştur.
 */

import { duffelAdapter } from "./flights/duffel";
import { fixtureFlightAdapter } from "./flights/fixture";
import { travelpayoutsAdapter } from "./flights/travelpayouts";
import { amazonCreatorsAdapter } from "./retail/amazon-creators";
import { fixtureAdapter } from "./retail/fixture";
import { hepsiburadaAdapter, trendyolAdapter } from "./retail/marketplace-pending";
import { productFeedAdapter } from "./retail/product-feed";
import type { FlightAdapter, RetailAdapter } from "./types";

export const retailAdapters: Record<string, RetailAdapter> = {
  [amazonCreatorsAdapter.key]: amazonCreatorsAdapter,
  [trendyolAdapter.key]: trendyolAdapter,
  [hepsiburadaAdapter.key]: hepsiburadaAdapter,
  [productFeedAdapter.key]: productFeedAdapter,
  [fixtureAdapter.key]: fixtureAdapter,
};

export const flightAdapters: Record<string, FlightAdapter> = {
  [travelpayoutsAdapter.key]: travelpayoutsAdapter,
  [duffelAdapter.key]: duffelAdapter,
  [fixtureFlightAdapter.key]: fixtureFlightAdapter,
};

export function getRetailAdapter(key: string): RetailAdapter | undefined {
  return retailAdapters[key];
}

export function getFlightAdapter(key: string): FlightAdapter | undefined {
  return flightAdapters[key];
}
