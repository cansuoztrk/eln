/* Eln'in Krallığı — kasa: şifreli fotoğrafları ve özel içeriği tarayıcıda çözer (AES-GCM + PBKDF2) */
(function () {
  'use strict';
  const K = window.K;
  const BASE = 'assets/vault/';
  const subtle = window.crypto && window.crypto.subtle;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const b64 = (u8) => btoa(String.fromCharCode.apply(null, u8));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const passNorm = (s) => K.norm(s).replace(/ /g, '');

  let metaP = null;
  let key = null;
  const urls = {};

  function meta() {
    if (!metaP)
      metaP = fetch(BASE + 'keys.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    return metaP;
  }
  async function derive(pass, saltB64, iter) {
    const base = await subtle.importKey('raw', enc.encode(passNorm(pass)), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'PBKDF2', salt: unb64(saltB64), iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  async function decrypt(k, bytes) {
    return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, k, bytes.slice(12)));
  }
  async function fetchBytes(path) {
    const r = await fetch(BASE + path);
    if (!r.ok) throw new Error('kasa-dosyasi-yok');
    return new Uint8Array(await r.arrayBuffer());
  }
  async function useRaw(raw, m) {
    key = await subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const data = JSON.parse(dec.decode(await decrypt(key, await fetchBytes('private.bin'))));
    V.data = data;
    V.ok = true;
    K.store.set('vault', { kid: m.kid, k: b64(raw) });
    K.emit('unlocked', data);
    return true;
  }

  const V = (K.vault = {
    ok: false,
    data: null,
    // Kasa bu ortamda var mı? (keys.json okunabiliyor ve tarayıcı şifre çözebiliyor mu)
    async available() {
      return Boolean(subtle && (await meta()));
    },
    // Daha önce açılmışsa kayıtlı anahtarla sessizce aç
    async restore() {
      if (V.ok) return true;
      const m = await meta();
      const saved = K.store.get('vault');
      if (!m || !subtle || !saved || saved.kid !== m.kid) return false;
      try {
        return await useRaw(unb64(saved.k), m);
      } catch (e) {
        K.store.del('vault');
        return false;
      }
    },
    // Kapıdaki cevapla aç. Cümlenin tamamı ve tek tek kelimeleri denenir.
    async unlock(input) {
      const m = await meta();
      if (!m || !subtle) return false;
      const w = K.norm(input).split(' ').filter(Boolean);
      // "Ad ♡ Ad", "ad ve ad", "Ad Ad" gibi yazımların hepsi denensin
      const cands = [w.join(''), w.length > 1 ? w[0] + w[w.length - 1] : '', ...w.slice(0, -1).map((x, i) => x + w[i + 1]), ...w];
      const tries = [...new Set(cands)].filter((x) => x.length >= 3).slice(0, 6);
      for (const t of tries) {
        const k = await derive(t, m.salt, m.iter);
        for (const wrap of m.wraps) {
          let raw = null;
          try {
            raw = await decrypt(k, unb64(wrap));
          } catch (e) {}
          if (raw) return useRaw(raw, m);
        }
      }
      return false;
    },
    // Şifreli fotoğrafı çözüp gösterilebilir bir adres döndürür (önbellekli)
    async url(name, thumb) {
      if (!key) throw new Error('kasa-kilitli');
      const file = name + (thumb ? '.thumb' : '');
      if (!urls[file]) {
        urls[file] = (async () => {
          const bytes = await decrypt(key, await fetchBytes('p/' + file + '.bin'));
          return URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
        })();
      }
      return urls[file];
    },
    // <img data-vault="ad" data-thumb> etiketlerini doldurur
    fill(root) {
      if (!V.ok) return;
      K.$$('img[data-vault]:not([data-filled])', root).forEach(async (img) => {
        img.setAttribute('data-filled', '1');
        try {
          img.src = await V.url(img.dataset.vault, img.hasAttribute('data-thumb'));
        } catch (e) {
          img.removeAttribute('data-filled');
        }
      });
    },
    // Ayrı şifreyle mühürlenmiş içerik (ör. ilk sarılma mektubu)
    async sealed(id, pass) {
      const m = await meta();
      if (!m || !m.sealed || !m.sealed[id]) return null;
      try {
        const k = await derive(pass, m.sealed[id].salt, m.iter);
        return JSON.parse(dec.decode(await decrypt(k, await fetchBytes('s/' + id + '.bin'))));
      } catch (e) {
        return null;
      }
    },
  });
})();
