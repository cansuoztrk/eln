// Cloudflare Pages işlevi: /push/… — kalenin kendi iPhone bildirimleri (Web Push). Ana ekrana eklenmiş kale bir
// abonelik açar; bu işlev aboneliği saklar ve bildirimi doğrudan Apple/Google'ın push sunucusuna, uçtan uca şifreli
// (RFC 8291, aes128gcm) ve VAPID imzalı (RFC 8292) olarak gönderir. ntfy uygulamasına gerek kalmaz.
// Kurulum (Pages → Settings → Variables and Secrets): VAPID_PUBLIC (base64url, 65 bayt), VAPID_PRIVATE (JWK, JSON),
// VAPID_SUB (ör. mailto:adresin) · Sonsuz Arşiv'in R2 bağı ARSIV ve erişim anahtarı ARSIV_KEY (abonelikler orada durur).
// Yollar: GET /push/anahtar · POST /push/abone {who, sub} · POST /push/gonder {to, title, body, url, tag} · GET /push/durum
const yanit = (body, status = 200, h = {}) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: Object.assign({ 'cache-control': 'no-store', 'content-type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json' }, h) });
function esit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const b64u = {
  enc(buf) {
    const u = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    const s = atob(String(str).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(str).length + 3) % 4));
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  },
};
const enc = new TextEncoder();
const birlestir = (...l) => {
  const n = l.reduce((a, x) => a + x.length, 0), o = new Uint8Array(n);
  let i = 0;
  l.forEach((x) => (o.set(x, i), (i += x.length)));
  return o;
};
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

/* ---------- VAPID (RFC 8292): ES256 imzalı JWT ---------- */
async function vapid(env, endpoint) {
  const aud = new URL(endpoint).origin;
  const bas = b64u.enc(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const govde = b64u.enc(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUB || 'mailto:kale@example.com' })));
  const jwk = JSON.parse(env.VAPID_PRIVATE);
  const k = await crypto.subtle.importKey('jwk', Object.assign({}, jwk, { ext: true }), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, enc.encode(bas + '.' + govde));
  return `vapid t=${bas}.${govde}.${b64u.enc(imza)}, k=${env.VAPID_PUBLIC}`;
}

/* ---------- İçerik şifreleme (RFC 8291, aes128gcm) ---------- */
async function sifrele(sub, metin) {
  const uaPub = b64u.dec(sub.keys.p256dh), auth = b64u.dec(sub.keys.auth);
  const es = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', es.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, es.privateKey, 256));
  const prkKey = await hmac(auth, ecdh);
  const ikm = (await hmac(prkKey, birlestir(enc.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])))).slice(0, 32);
  const tuz = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(tuz, ikm);
  const cek = (await hmac(prk, birlestir(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, birlestir(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const sifreli = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, birlestir(enc.encode(metin), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return birlestir(tuz, rs, new Uint8Array([asPub.length]), asPub, sifreli);
}
async function gonder(env, sub, veri) {
  const body = await sifrele(sub, JSON.stringify(veri));
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: await vapid(env, sub.endpoint), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: veri.acil ? 'high' : 'normal' }, body });
  return r.status;
}

/* ---------- Abonelik deposu (R2) ---------- */
const anahtar = (who) => `push/${who === 'me' ? 'me' : 'her'}.json`;
async function aboneler(env, who) {
  const o = await env.ARSIV.get(anahtar(who));
  return o ? JSON.parse(await o.text()) : [];
}
const yaz = (env, who, l) => env.ARSIV.put(anahtar(who), JSON.stringify(l.slice(-6)), { httpMetadata: { contentType: 'application/json' } });

export async function onRequest({ request, env, params }) {
  const yol = [].concat(params.path || []).join('/');
  if (yol === 'anahtar') return env.VAPID_PUBLIC ? yanit(env.VAPID_PUBLIC) : yanit('kurulmamis', 501);
  if (!env.ARSIV || !env.ARSIV_KEY || !env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return yanit('kurulmamis', 501);
  if (!esit(request.headers.get('x-kale') || '', env.ARSIV_KEY)) return yanit('yetkisiz', 401);
  if (yol === 'durum' && request.method === 'GET') {
    const [me, her] = await Promise.all([aboneler(env, 'me'), aboneler(env, 'her')]);
    return yanit({ me: me.length, her: her.length });
  }
  if (request.method !== 'POST') return yanit('izin yok', 405, { allow: 'GET, POST' });
  const j = await request.json().catch(() => null);
  if (!j) return yanit('gecersiz', 400);
  if (yol === 'abone') {
    if (!j.sub || !j.sub.endpoint || !j.sub.keys || !/^https:\/\//.test(j.sub.endpoint)) return yanit('gecersiz', 400);
    const l = (await aboneler(env, j.who)).filter((s) => s.endpoint !== j.sub.endpoint);
    l.push({ endpoint: j.sub.endpoint, keys: { p256dh: j.sub.keys.p256dh, auth: j.sub.keys.auth }, at: Date.now() });
    await yaz(env, j.who, l);
    return yanit({ ok: true, n: l.length });
  }
  if (yol === 'gonder') {
    const l = await aboneler(env, j.to);
    if (!l.length) return yanit({ ok: false, n: 0 });
    const veri = { title: String(j.title || '').slice(0, 120), body: String(j.body || '').slice(0, 400), url: String(j.url || '/'), tag: String(j.tag || ''), acil: Boolean(j.acil) };
    const sonuc = await Promise.all(l.map((s) => gonder(env, s, veri).catch(() => 0)));
    // 404/410: abonelik ölmüş, sil
    const kalan = l.filter((s, i) => sonuc[i] !== 404 && sonuc[i] !== 410);
    if (kalan.length !== l.length) await yaz(env, j.to, kalan);
    return yanit({ ok: sonuc.some((s) => s >= 200 && s < 300), n: kalan.length, sonuc });
  }
  return yanit('yok', 404);
}
