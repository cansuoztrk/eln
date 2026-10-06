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
  K.medya = { image, thumb, blobUrl, toB64, rowUrl };
})();
