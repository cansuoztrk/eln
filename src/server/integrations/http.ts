/**
 * Sağlayıcı çağrıları için HTTP istemcisi:
 *  - İstek başına zaman aşımı (AbortController)
 *  - Dakika başına istek sınırı (token bucket; aynı kaynağın işleri tek seferde bir tane çalışır)
 *  - 429/5xx ve ağ hatalarında Retry-After'a saygılı, üstel geri çekilmeli tekrar deneme
 *  - Yanıt boyutu sınırı (dev ürün feed'lerinde bellek taşmasını önler)
 *  - Kullanım sayacı (ApiUsage tablosuna yazılır)
 */

import { type HttpClient, IntegrationError } from "./types";

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

async function takeToken(key: string, perMinute: number, signal?: AbortSignal): Promise<void> {
  if (perMinute <= 0) return;
  const capacity = Math.max(1, Math.min(perMinute, 10));
  const refillPerMs = perMinute / 60_000;
  for (;;) {
    const now = Date.now();
    const b = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
    b.tokens = Math.min(capacity, b.tokens + (now - b.updatedAt) * refillPerMs);
    b.updatedAt = now;
    if (b.tokens >= 1) {
      b.tokens -= 1;
      buckets.set(key, b);
      return;
    }
    buckets.set(key, b);
    const waitMs = Math.ceil((1 - b.tokens) / refillPerMs);
    await sleep(Math.min(waitMs, 5_000), signal);
  }
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new IntegrationError("NETWORK", "İstek iptal edildi", { retryable: false }));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new IntegrationError("NETWORK", "İstek iptal edildi", { retryable: false }));
      },
      { once: true },
    );
  });
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.min(secs * 1000, 120_000);
  const date = Date.parse(value);
  if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 120_000));
  return undefined;
}

export type UsageCounter = { requests: number; errors: number; rateLimited: number };

export function createHttpClient(opts: {
  key: string;
  rateLimitPerMinute: number;
  maxRetries?: number;
  defaultTimeoutMs?: number;
  userAgent?: string;
  usage: UsageCounter;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}): HttpClient {
  const maxRetries = opts.maxRetries ?? 3;
  const doFetch = opts.fetchImpl ?? fetch;

  async function request(url: string, init: RequestInit & { timeoutMs?: number; maxBytes?: number } = {}): Promise<Response> {
    let attempt = 0;
    for (;;) {
      await takeToken(opts.key, opts.rateLimitPerMinute, opts.signal);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? opts.defaultTimeoutMs ?? 20_000);
      const onAbort = () => controller.abort();
      opts.signal?.addEventListener("abort", onAbort, { once: true });
      opts.usage.requests++;
      try {
        const headers = new Headers(init.headers);
        if (!headers.has("user-agent")) headers.set("user-agent", opts.userAgent ?? "FirsatRadarBot/1.0 (+entegrasyon; yetkili API erisimi)");
        const res = await doFetch(url, { ...init, headers, signal: controller.signal });
        if (res.status === 429 || res.status >= 500) {
          if (res.status === 429) opts.usage.rateLimited++;
          else opts.usage.errors++;
          const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
          if (attempt < maxRetries) {
            attempt++;
            await res.body?.cancel().catch(() => {});
            await sleep(retryAfter ?? backoff(attempt), opts.signal);
            continue;
          }
          throw new IntegrationError(res.status === 429 ? "RATE_LIMITED" : "UPSTREAM", `Sağlayıcı ${res.status} döndürdü (${hostOf(url)})`, {
            retryAfterMs: retryAfter,
            details: { status: res.status },
          });
        }
        if (res.status === 401 || res.status === 403) {
          opts.usage.errors++;
          throw new IntegrationError("AUTH", `Yetkilendirme reddedildi (${res.status}, ${hostOf(url)}). API anahtarı veya erişim onayı kontrol edilmeli.`, {
            retryable: false,
            details: { status: res.status },
          });
        }
        return res;
      } catch (err) {
        if (err instanceof IntegrationError) throw err;
        opts.usage.errors++;
        if (attempt < maxRetries && !opts.signal?.aborted) {
          attempt++;
          await sleep(backoff(attempt), opts.signal);
          continue;
        }
        const aborted = (err as Error)?.name === "AbortError";
        throw new IntegrationError("NETWORK", aborted ? `Zaman aşımı (${hostOf(url)})` : `Ağ hatası (${hostOf(url)}): ${(err as Error)?.message}`, {
          cause: err,
        });
      } finally {
        clearTimeout(timeout);
        opts.signal?.removeEventListener("abort", onAbort);
      }
    }
  }

  async function text(url: string, init: RequestInit & { timeoutMs?: number; maxBytes?: number } = {}) {
    const response = await request(url, init);
    const maxBytes = init.maxBytes ?? 60 * 1024 * 1024;
    const declared = Number(response.headers.get("content-length") || 0);
    if (declared > maxBytes) throw new IntegrationError("FORMAT", `Yanıt çok büyük (${declared} bayt > ${maxBytes})`, { retryable: false });
    const reader = response.body?.getReader();
    if (!reader) return { body: "", response };
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new IntegrationError("FORMAT", `Yanıt boyutu sınırı aşıldı (${maxBytes} bayt)`, { retryable: false });
      }
      chunks.push(value);
    }
    const body = new TextDecoder("utf-8").decode(concat(chunks, total));
    return { body, response };
  }

  async function json<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
    const { body, response } = await text(url, init);
    if (!response.ok) {
      throw new IntegrationError(response.status === 404 ? "NOT_FOUND" : "UPSTREAM", `Beklenmeyen yanıt ${response.status} (${hostOf(url)}): ${body.slice(0, 300)}`, {
        retryable: false,
        details: { status: response.status },
      });
    }
    try {
      return JSON.parse(body) as T;
    } catch (err) {
      throw new IntegrationError("FORMAT", `JSON ayrıştırılamadı (${hostOf(url)})`, { retryable: false, cause: err });
    }
  }

  return { request, text, json };
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function backoff(attempt: number): number {
  const base = Math.min(30_000, 1_000 * 2 ** (attempt - 1));
  return base / 2 + Math.random() * (base / 2);
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "geçersiz-adres";
  }
}
