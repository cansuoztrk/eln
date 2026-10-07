/* Sonsuz Arşiv — fotoğraflar, sesler ve videolar çoğaldıkça bulutun (Supabase, 500 MB) yerine Cloudflare R2'ye
   (10 GB'a kadar ücretsiz) gider; Supabase'te yalnızca küçük bir işaret kalır: {r2: anahtar, ...küçük alanlar}.
   İçerik R2'ye de kasanın anahtarıyla şifrelenmiş olarak gider (K.vault.seal); R2'deki dosya şifreyi bilmeyen için
   anlamsızdır. Kale işlevi /arsiv/<anahtar> (functions/arsiv) yalnız doğru erişim anahtarını taşıyan isteğe açılır.
   Kurulum (bir kerelik, README "Sonsuz Arşiv"): R2'de bir kova, Pages projesinde ARSIV bağlaması ve ARSIV_KEY gizli
   değişkeni, kasada config.arsivKey. Kurulmadıysa bu modül hiçbir şeyi değiştirmez.
   K.r2.ok() → Promise<bool> · K.r2.put(nesne) → anahtar · K.r2.get(anahtar) → nesne · K.r2.fill(satır) */
(function () {
  'use strict';
  const K = window.K;
  const C = window.ELN.config;

  // Büyük alanı olan (yalnızca kimliğiyle ayrıca getirilen) kayıt türleri; listelerde görünen küçük kayıtlar burada yok
  const KINDS = new Set(['tsses', 'photo', 'vaudio', 'sfimg', 'sahneimg', 'pcimg', 'ozurses', 'kfull', 'kareimg', 'hkses', 'hkimg', 'dvaudio', 'rotafoto', 'anlarvid', 'cerceveimg', 'cocukimg', 'vedaimg']);
  const ESIK = 60 * 1024; // bundan büyük alanlar R2'ye gider
  const yol = (k) => `${location.origin}/arsiv/${k}`;
  let durum = null;
  async function ok() {
    if (!C.arsivKey || !K.vault || !window.fetch) return false;
    if (durum && Date.now() - durum.t < 10 * 60e3) return durum.v;
    let v = false;
    try {
      const r = await fetch(yol('_ping'), { headers: { 'x-kale': C.arsivKey } });
      v = r.ok;
    } catch (e) {}
    durum = { t: Date.now(), v };
    return v;
  }
  const anahtar = (kind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  async function put(obj, kind = 'x') {
    const k = anahtar(kind);
    const body = await K.vault.seal(obj);
    const r = await fetch(yol(k), { method: 'PUT', headers: { 'x-kale': C.arsivKey, 'content-type': 'text/plain' }, body });
    if (!r.ok) throw new Error('r2 ' + r.status);
    return k;
  }
  const cache = {};
  function get(k) {
    if (!cache[k])
      cache[k] = (async () => {
        const r = await fetch(yol(k), { headers: { 'x-kale': C.arsivKey } });
        if (!r.ok) return null;
        return K.vault.unseal(await r.text());
      })().catch(() => null);
    return cache[k];
  }
  // R2'ye taşınmış bir kaydın büyük alanlarını geri koy
  async function fill(row) {
    if (!row || !row.data || !row.data.r2) return row;
    const big = await get(row.data.r2);
    if (!big) return row;
    const data = Object.assign({}, row.data, big);
    delete data.r2;
    return Object.assign({}, row, { data });
  }
  async function fillAll(rows, onp) {
    const out = [];
    let n = 0;
    for (const r of rows) {
      out.push(r.data && r.data.r2 ? await fill(r) : r);
      if (r.data && r.data.r2 && onp) onp(++n);
    }
    return out;
  }
  // K.cloud.add ve K.cloud.get'i sar: büyük medya R2'ye gider, okunurken geri gelir
  function sar() {
    if (!K.cloud || K.cloud._r2) return;
    K.cloud._r2 = true;
    const add = K.cloud.add.bind(K.cloud), get0 = K.cloud.get;
    K.cloud.add = async (kind, obj) => {
      if (obj && KINDS.has(kind) && (await ok())) {
        const big = {}, small = {};
        Object.keys(obj).forEach((f) => (typeof obj[f] === 'string' && obj[f].length > ESIK ? (big[f] = obj[f]) : (small[f] = obj[f])));
        if (Object.keys(big).length) {
          try {
            small.r2 = await put(big, kind);
            cache[small.r2] = Promise.resolve(big);
            return add(kind, small);
          } catch (e) {}
        }
      }
      return add(kind, obj);
    };
    K.cloud.get = async (id) => fill(await get0(id));
  }
  K.on('cloud', (on) => on && sar());
  K.r2 = { ok, put, get, fill, fillAll, KINDS, reset: () => (durum = null) };
})();
