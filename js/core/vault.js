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
    // İkili dosya sunmayan önizleme sunucuları için kasanın base64 .txt kopyası (keys.json → b64: true)
    const b64 = Boolean((await meta() || {}).b64);
    const r = await fetch(BASE + path + (b64 ? '.txt' : ''));
    if (!r.ok) throw new Error('kasa-dosyasi-yok');
    return b64 ? unb64((await r.text()).trim()) : new Uint8Array(await r.arrayBuffer());
  }
  async function useRaw(raw, m, who) {
    key = await subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const data = JSON.parse(dec.decode(await decrypt(key, await fetchBytes('private.bin'))));
    V.data = data;
    V.ok = true;
    V.who = who || 'her';
    K.store.set('vault', { kid: m.kid, k: b64(raw), who: V.who });
    K.emit('unlocked', data);
    return true;
  }

  const V = (K.vault = {
    ok: false,
    data: null,
    who: 'her',
    // Buluta giden her şey içerik anahtarıyla şifrelenir; sunucu sadece anlamsız metin görür
    async seal(obj) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
      const out = new Uint8Array(12 + ct.length);
      out.set(iv);
      out.set(ct, 12);
      let s = '';
      for (let i = 0; i < out.length; i += 0x8000) s += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
      return btoa(s);
    },
    async unseal(str) {
      try {
        return JSON.parse(dec.decode(await decrypt(key, unb64(str))));
      } catch (e) {
        return null;
      }
    },
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
        return await useRaw(unb64(saved.k), m, saved.who);
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
        for (let wi = 0; wi < m.wraps.length; wi++) {
          let raw = null;
          try {
            raw = await decrypt(k, unb64(m.wraps[wi]));
          } catch (e) {}
          if (raw) return useRaw(raw, m, (m.roles || [])[wi] || 'her');
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
    // Şifreli sesli notu çözüp çalınabilir bir adres döndürür
    async audio(id) {
      if (!key) throw new Error('kasa-kilitli');
      const mime = ((V.data && V.data.config && V.data.config.voiceFiles) || {})[id];
      if (!mime) throw new Error('ses-yok');
      const file = 'a:' + id;
      if (!urls[file]) {
        urls[file] = (async () => URL.createObjectURL(new Blob([await decrypt(key, await fetchBytes('a/' + id + '.bin'))], { type: mime })))();
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
