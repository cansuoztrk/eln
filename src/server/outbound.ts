import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { clientIp } from "./rate-limit";

/**
 * Anonim ziyaretçi özeti: günlük dönen tuz + IP + tarayıcı → SHA-256 (ilk 16 karakter).
 * IP adresi veya tarayıcı bilgisi saklanmaz; özet ertesi gün başka bir değere dönüşür.
 */
export async function visitorHash(): Promise<string> {
  const h = await headers();
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.ANALYTICS_SALT || "dev-salt-change-me";
  return createHash("sha256").update(`${salt}|${day}|${clientIp(h)}|${h.get("user-agent") ?? ""}`).digest("hex").slice(0, 16);
}

export type AffiliateConfig = { type: "query"; param: string; value: string } | null;

/**
 * Satış ortaklığı parametresi yalnızca mağaza için resmî program etkinleştirilmişse ve bağlantıda
 * zaten bir ortaklık parametresi yoksa eklenir. Kullanıcıya ait olmayan bağlantı değiştirilmez.
 */
export function buildOutboundUrl(rawUrl: string, retailer: { affiliateEnabled: boolean; affiliateConfig: unknown }): { url: string; affiliate: boolean } | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const cfg = retailer.affiliateConfig as AffiliateConfig;
  if (retailer.affiliateEnabled && cfg?.type === "query" && /^[a-z0-9_]{1,30}$/i.test(cfg.param) && cfg.value) {
    if (!url.searchParams.has(cfg.param)) url.searchParams.set(cfg.param, cfg.value);
    return { url: url.toString(), affiliate: true };
  }
  // Kaynağın kendisi ortaklık bağlantısı veriyorsa (ör. Amazon Creators API'nin detailPageURL'i)
  const affiliate = url.searchParams.has("tag") || url.searchParams.has("marker");
  return { url: url.toString(), affiliate };
}
