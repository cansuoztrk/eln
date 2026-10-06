/* Kale arşivi — kalenin bütün fotoğraflarını, notlarını ve seslerini tek yerden toplar. Kale Müzesi, Kalp Mozaiği,
   Zaman Tüneli Belgeseli, Doğum Günü Filmi, Yıllık Kitabı ve Kavuşma Kutusu bunu kullanır. Yalnızca küçük önizlemeler
   (thumb) liste olarak gelir; büyük fotoğraf istenince K.medya.rowUrl ile ayrıca getirilir.
   K.arsiv.photos() → [{id, kind, who, at, day, thumb, full, label, text}]
   K.arsiv.notes()  → [{id, kind, who, at, day, text, label}] · K.arsiv.voices() → [{id, who, at, audio, dur, tag}]
   K.arsiv.month('2026-10') → o ayın her şeyi (sayılar dahil) */
(function () {
  'use strict';
  const K = window.K;
  const T = K.time;

  // tür → [etiket, thumb alanı, büyük alan, yazı alanı]
  const PHOTO = {
    kare: ['Günün Karesi', 'thumb', 'full', 'p'],
    postcard: ['Kartpostal', 'thumb', 'full', 'text'],
    sahne: ['Filmimizden bir sahne', 'thumb', 'full', 'text'],
    hikaye: ['Hikâye', 'thumb', 'full', 'text'],
    pb: ['Fotoğraf kabini', 'thumb', '', ''],
    rotadurak: ['Rota durağı', 'thumb', 'foto', 'name'],
    mozaik: ['Mozaik karesi', 'thumb', '', ''],
    anlar: ['On saniyelik an', 'thumb', '', 'text'],
  };
  const NOTE = {
    kalpk: ['Kavanozdan bir kalp', 'note'],
    minnet: ['Minnet', 'text'],
    barissoz: ['Barış sözü', 'text'],
    soz: ['Söz', 'text'],
    gunes: ['Güneş postası', 'text'],
    ruya: ['Rüya', 'text'],
    pazar: ['Pazar sorusu', 'a'],
  };
  const dayOf = (at) => T.key(T.baku(new Date(at)));
  const cache = {};
  function once(key, fn) {
    const c = cache[key];
    if (c && Date.now() - c.t < 60000) return c.p;
    const p = fn().catch(() => []);
    cache[key] = { t: Date.now(), p };
    return p;
  }
  const ok = () => K.cloud && K.cloud.enabled;
  async function photos() {
    if (!ok()) return [];
    return once('photos', async () => {
      const rows = await K.cloud.many(Object.keys(PHOTO), { limit: 2000 });
      return rows
        .map((r) => {
          const [label, tf, ff, xf] = PHOTO[r.kind] || [];
          const thumb = r.data && r.data[tf];
          if (!thumb || !String(thumb).startsWith('data:image')) return null;
          // Perdeli anlar (onun bugünkü kartı/klibi) sen kendininkini koyana kadar başka odada da görünmesin
          if ((r.kind === 'anlar' || r.kind === 'kare') && r.data.day === T.todayKey() && r.who !== (K.isOwner() ? 'me' : 'her')) return null;
          return { id: r.id, kind: r.kind, who: r.who, at: r.at, day: r.data.day || r.data.date || dayOf(r.at), thumb, full: ff ? r.data[ff] || '' : '', label, text: xf ? String(r.data[xf] || '') : '' };
        })
        .filter(Boolean)
        .sort((a, b) => a.at - b.at);
    });
  }
  async function notes() {
    if (!ok()) return [];
    return once('notes', async () => {
      const rows = await K.cloud.many(Object.keys(NOTE), { limit: 3000 });
      return rows
        .map((r) => {
          const [label, f] = NOTE[r.kind] || [];
          let text = r.data && r.data[f];
          if (Array.isArray(text)) text = text.filter(Boolean).join(' · ');
          text = String(text || '').trim();
          return text ? { id: r.id, kind: r.kind, who: r.who, at: r.at, day: r.data.day || dayOf(r.at), text, label } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.at - b.at);
    });
  }
  async function voices() {
    if (!ok()) return [];
    return once('voices', async () => (await K.cloud.list('tsmesaj', 500)).map((r) => ({ id: r.id, who: r.who, at: r.at, audio: r.data.audio, dur: r.data.dur || 0, tag: r.data.tag || '' })).sort((a, b) => a.at - b.at));
  }
  async function counts(since, before) {
    if (!ok()) return {};
    const rows = await K.cloud.many(['kalpk', 'kucak', 'selam', 'tsmesaj', 'minnet', 'kare', 'postcard', 'mektup', 'gun', 'barissoz'], { since, before, limit: 5000 });
    const c = {};
    rows.forEach((r) => (c[r.kind] = (c[r.kind] || 0) + 1));
    return c;
  }
  const ymOf = (at) => dayOf(at).slice(0, 7);
  async function month(ym) {
    const [y, m] = ym.split('-').map(Number);
    const since = T.at(`${y}-${String(m).padStart(2, '0')}-01`).getTime(), before = T.at(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`).getTime();
    const [p, n, v, c] = await Promise.all([photos(), notes(), voices(), counts(since, before)]);
    const inM = (x) => ymOf(x.at) === ym;
    return { ym, photos: p.filter(inM), notes: n.filter(inM), voices: v.filter(inM), counts: c };
  }
  // Kaledeki ilk kaydın ayından bu aya kadar bütün aylar
  async function months() {
    const [p, n] = await Promise.all([photos(), notes()]);
    const first = Math.min(...[...p, ...n].map((x) => x.at), Date.now());
    const out = [];
    let [y, m] = dayOf(first).split('-').map(Number);
    const end = ymOf(Date.now());
    for (let i = 0; i < 240; i++) {
      const ym = `${y}-${String(m).padStart(2, '0')}`;
      out.push(ym);
      if (ym >= end) break;
      m++;
      if (m > 12) (m = 1), y++;
    }
    return out;
  }
  const monthName = (ym) => `${K.MONTHS[+ym.slice(5) - 1]} ${ym.slice(0, 4)}`;
  K.on('cloud', (on) => on && Object.keys(cache).forEach((k) => delete cache[k]));
  K.arsiv = { photos, notes, voices, counts, month, months, monthName, PHOTO, NOTE, clear: () => Object.keys(cache).forEach((k) => delete cache[k]) };
})();
