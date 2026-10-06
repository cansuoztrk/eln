/* Kale 2.0 — Taşınma: kale yeni bir adrese geçtiğinde eski adresteki köprü sayfası (kopru/) bu cihazda biriken her şeyi
   (çıkartmalar, sarılma borcu, bahçe, mühürler, ayarlar...) adresin #tasi: kısmında buraya getirir. Bu dosya diğer
   modüllerden önce çalışır: veriyi yerel depoya yazar, adresi temizler ve sayfayı bir kez yeniler.
   Kasa anahtarı taşınmaz; yeni adreste şifre bir kez yeniden girilir. */
(function () {
  'use strict';
  const PREFIX = 'eln-krallik:';
  const SKIP = ['vault', 'cloudCfg', 'weather', 'presence', 'presenceAt', 'presenceInfo'];
  const h = location.hash || '';
  if (h.indexOf('#tasi:') !== 0) {
    // Taşınmadan sonraki ilk açılışta küçük bir not
    try {
      const done = JSON.parse(localStorage.getItem(PREFIX + 'tasiOk') || 'null');
      if (done && !done.shown && window.K) {
        window.K.on('built', () =>
          setTimeout(() => {
            window.K.fx.toast(`📦 <b>Kale yeni adresine taşındı.</b> ${done.n} eşyan da seninle geldi.`, { duration: 5000 });
            done.shown = true;
            localStorage.setItem(PREFIX + 'tasiOk', JSON.stringify(done));
          }, 2500)
        );
      }
    } catch (e) {}
    return;
  }
  document.documentElement.classList.add('tasiniyor');
  const raw = h.slice(6);
  const b64 = (s) => {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  };
  async function decode() {
    const kind = raw.slice(0, 2);
    const bytes = b64(raw.slice(2));
    if (kind === 'z.') {
      const ds = new DecompressionStream('deflate-raw');
      const out = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
      return JSON.parse(new TextDecoder().decode(out));
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function write(p) {
    const keys = p && p.keys ? p.keys : {};
    const local = Object.keys(localStorage).filter((k) => k.indexOf(PREFIX) === 0);
    const fresh = local.length < 12;
    let n = 0;
    Object.keys(keys).forEach((k) => {
      if (SKIP.includes(k) || typeof keys[k] !== 'string') return;
      const key = PREFIX + k;
      const cur = localStorage.getItem(key);
      try {
        if (cur == null || fresh) localStorage.setItem(key, keys[k]);
        else if (k === 'stickers') localStorage.setItem(key, JSON.stringify(Object.assign({}, JSON.parse(keys[k]), JSON.parse(cur))));
        else if (k === 'hugs') localStorage.setItem(key, JSON.stringify(Math.max(+JSON.parse(cur) || 0, +JSON.parse(keys[k]) || 0)));
        else return;
        n++;
      } catch (e) {}
    });
    localStorage.setItem(PREFIX + 'tasiOk', JSON.stringify({ at: Date.now(), n, from: p.from || '', shown: false }));
    return p.room || '';
  }
  decode()
    .then(write, () => '')
    .then((room) => {
      const clean = location.pathname + location.search + (room && room[0] === '#' && room.indexOf('#tasi') !== 0 ? room : '');
      history.replaceState(null, '', clean);
      location.reload();
    });
})();
