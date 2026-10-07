/* Kale 2.0 — ortak medya yardımcıları: fotoğrafı küçültüp JPEG'e çevirme (buluta sığsın), küçük önizleme, base64 ↔ adres.
   Rotalar, On Saniyelik Anlar, Kale Müzesi ve Kalp Mozaiği kullanır. */
(function () {
  'use strict';
  const K = window.K;

  async function bitmap(src) {
    if (typeof src === 'string') {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      await img.decode();
      return img;
    }
    if (window.createImageBitmap) {
      try {
        return await createImageBitmap(src, { imageOrientation: 'from-image' });
      } catch (e) {}
    }
    const url = URL.createObjectURL(src);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
  }
  // Dosya ya da adres → en uzun kenarı max piksel JPEG (dataURL)
  async function image(src, max = 1280, q = 0.78, square) {
    const b = await bitmap(src);
    const w = b.width || b.naturalWidth, h = b.height || b.naturalHeight;
    let sx = 0, sy = 0, sw = w, sh = h;
    if (square) {
      const s = Math.min(w, h);
      sx = (w - s) / 2;
      sy = (h - s) / 2;
      sw = sh = s;
    }
    const k = Math.min(1, max / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * k);
    c.height = Math.round(sh * k);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(b, sx, sy, sw, sh, 0, 0, c.width, c.height);
    b.close && b.close();
    return c.toDataURL('image/jpeg', q);
  }
  const thumb = (src, size = 160) => image(src, size, 0.7, true);
  function blobUrl(b64, mime) {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8], { type: mime }));
  }
  const toB64 = (blob) =>
    new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(';base64,')[1] || '');
      fr.onerror = () => res('');
      fr.readAsDataURL(blob);
    });
  // Kayıttaki büyük veriyi (fotoğraf/ses/video) bir kez getir, adresini önbellekte tut
  const cache = {};
  async function rowUrl(id, field = 'img') {
    if (!id) return null;
    const key = id + ':' + field;
    if (!cache[key]) {
      cache[key] = (async () => {
        const r = await K.cloud.get(id);
        if (!r || !r.data) return null;
        const v = r.data[field];
        if (!v) return null;
        if (String(v).startsWith('data:')) return v;
        return blobUrl(v, r.data.mime || 'application/octet-stream');
      })();
    }
    return cache[key];
  }
  // Düğmeli ses kaydı: ilk dokunuşta başlar, ikincide (ya da süre dolunca) biter; buluta yükler.
  // Döner: {audio: tsses kimliği, dur, url} ya da null. Kayıt sürerken düğme "⏹ Bitir (3 sn)" olur.
  const active = new WeakMap();
  async function kaydet(btn, max = 15) {
    const cur = active.get(btn);
    if (cur) return cur.stop(), null;
    const label = btn.textContent;
    const r = await K.mikrofon.start(max, (s) => (btn.textContent = `⏹ Bitir (${Math.round(s)} sn)`));
    if (!r) return null;
    active.set(btn, r);
    btn.classList.add('kayitta');
    const res = await r.done;
    active.delete(btn);
    btn.classList.remove('kayitta');
    btn.textContent = label;
    if (!res || res.dur < 0.6) return K.fx.toast('Kayıt çok kısa oldu.'), null;
    btn.disabled = true;
    const au = await K.mikrofon.upload(res.blob);
    btn.disabled = false;
    if (!au) return K.fx.toast('Ses kaydedilemedi; biraz daha kısa dene.'), null;
    return { audio: au.id, dur: res.dur, url: res.url };
  }
  // Bir ses kaydını çal (aynı anda tek ses); from/to saniye verilirse yalnız o aralık
  let now = null;
  async function cal(id, o = {}) {
    now && now.pause();
    const url = await rowUrl(id, 'b64');
    if (!url) return K.fx.toast('Ses açılamadı.'), null;
    const a = new Audio(url);
    a.volume = o.volume == null ? 1 : o.volume;
    if (o.from) a.currentTime = o.from;
    if (o.loop) a.loop = true;
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    a.play().catch(() => {});
    if (o.to) {
      const t = setInterval(() => {
        if (a.currentTime >= o.to || a.paused) clearInterval(t), a.pause(), o.onEnd && o.onEnd();
      }, 100);
    } else if (o.onEnd) a.onended = o.onEnd;
    now = a;
    return a;
  }
  const sus = () => now && (now.pause(), (now = null));
  K.medya = { image, thumb, blobUrl, toB64, rowUrl, kaydet, cal, sus };
})();
