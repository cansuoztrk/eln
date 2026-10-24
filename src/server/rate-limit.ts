/**
 * Basit kayan pencere hız sınırlayıcı (süreç içi). Tek sunucu örneği için yeterlidir; çoklu
 * örnekte paylaşılan bir depo (Redis vb.) ile değiştirilmelidir (docs/DEPLOYMENT.md).
 */
type Entry = { hits: number[] };
const store = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((t) => now - t < windowMs);
  if (entry.hits.length >= limit) {
    store.set(key, entry);
    return { ok: false, retryAfterMs: windowMs - (now - entry.hits[0]) };
  }
  entry.hits.push(now);
  store.set(key, entry);
  if (store.size > 50_000) {
    for (const [k, v] of store) if (v.hits.every((t) => now - t > windowMs)) store.delete(k);
  }
  return { ok: true, retryAfterMs: 0 };
}

export function clientIp(h: Headers): string {
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
}
