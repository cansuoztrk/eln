/* Eln'in Krallığı — ortak yardımcılar (DOM, depolama, zaman, rastgelelik, paylaşım) */
(function () {
  'use strict';
  const K = (window.K = window.K || {});
  const C = window.ELN.config;

  /* ---------- DOM ---------- */
  K.$ = (sel, root = document) => root.querySelector(sel);
  K.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  K.el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  K.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Metindeki {herName} gibi alanları doldurur
  K.fill = (s) =>
    String(s).replace(/\{(\w+)\}/g, (m, k) => (k in C ? C[k] : K.tokens && k in K.tokens ? K.tokens[k]() : m));
  // Paragraf dizisini <p> etiketlerine çevirir
  K.paras = (arr) => arr.map((p) => `<p>${K.fill(K.esc(p))}</p>`).join('');

  K.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  K.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  K.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Oda kaydı (her oda dosyası K.room({...}) ile kendini ekler) ---------- */
  K.rooms = [];
  K.room = (def) => K.rooms.push(def);
  K.activeRoom = null;

  /* ---------- Olay yolu ---------- */
  const bus = {};
  K.on = (evt, fn) => (bus[evt] = bus[evt] || []).push(fn);
  K.emit = (evt, data) => (bus[evt] || []).forEach((fn) => fn(data));

  /* ---------- Depolama (her okuma/yazma korumalı) ---------- */
  const PREFIX = 'eln-krallik:';
  K.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    del(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (e) {}
    },
  };

  /* ---------- Zaman (Bakü UTC+4, İstanbul UTC+3; ikisinde de yaz saati yok) ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  K.pad = pad;
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  K.MONTHS = MONTHS;

  // ?tarih=2027-01-01 ya da ?tarih=2027-01-01T23:30 ile (Bakü saatine göre) tarih önizlemesi
  let offsetMs = 0;
  try {
    const q = new URLSearchParams(location.search).get('tarih');
    const m = q && q.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
    if (m) {
      const target = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0)) - C.tzBaku * 3600e3;
      offsetMs = target - Date.now();
      K.previewDate = true;
    }
  } catch (e) {}

  const T = (K.time = {
    now: () => new Date(Date.now() + offsetMs),
    parts(offsetH, date) {
      const d = new Date((date || T.now()).getTime() + offsetH * 3600e3);
      return {
        y: d.getUTCFullYear(),
        mo: d.getUTCMonth() + 1,
        d: d.getUTCDate(),
        h: d.getUTCHours(),
        mi: d.getUTCMinutes(),
        s: d.getUTCSeconds(),
        wd: d.getUTCDay(),
      };
    },
    baku: (date) => T.parts(C.tzBaku, date),
    ist: (date) => T.parts(C.tzIstanbul, date),
    hm: (offsetH) => {
      const p = T.parts(offsetH);
      return `${pad(p.h)}:${pad(p.mi)}`;
    },
    // 'YYYY-MM-DD' → o günün Bakü gece yarısı
    at(str) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d) - C.tzBaku * 3600e3);
    },
    key(p) {
      return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
    },
    todayKey: () => T.key(T.baku()),
    dayNumber(date) {
      const p = T.baku(date);
      return Math.floor(Date.UTC(p.y, p.mo - 1, p.d) / 864e5);
    },
    daysSince: (str) => T.dayNumber(T.now()) - T.dayNumber(T.at(str)),
    daysUntil: (str) => T.dayNumber(T.at(str)) - T.dayNumber(T.now()),
    // Her yıl tekrar eden gün (MM-DD). Bugünse days = 0.
    nextAnnual(mmdd) {
      const [mm, dd] = mmdd.split('-').map(Number);
      const p = T.baku();
      const today = Date.UTC(p.y, p.mo - 1, p.d);
      let y = p.y;
      let target = Date.UTC(y, mm - 1, dd);
      if (target < today) target = Date.UTC(++y, mm - 1, dd);
      return { year: y, days: Math.round((target - today) / 864e5), date: new Date(target - C.tzBaku * 3600e3) };
    },
    // Sevgili olduğumuz günden beri geçen tam ay sayısı (her ayın 21'i)
    monthsTogether() {
      const [y0, m0, d0] = C.togetherDate.split('-').map(Number);
      const p = T.baku();
      let months = (p.y - y0) * 12 + (p.mo - m0);
      if (p.d < d0) months--;
      return Math.max(0, months);
    },
    // ms → {d,h,m,s}
    split(ms) {
      ms = Math.max(0, ms);
      const s = Math.floor(ms / 1000);
      return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
    },
    fmt(strOrDate, withDay) {
      const p = typeof strOrDate === 'string' ? T.baku(T.at(strOrDate)) : T.baku(strOrDate);
      return `${p.d} ${MONTHS[p.mo - 1]} ${p.y}${withDay ? ', ' + DAYS[p.wd] : ''}`;
    },
    fmtShort(strOrDate) {
      const p = typeof strOrDate === 'string' ? T.baku(T.at(strOrDate)) : T.baku(strOrDate);
      return `${p.d} ${MONTHS[p.mo - 1]}`;
    },
    dayName: (p) => DAYS[p.wd],
  });

  K.num = (n) => Number(n).toLocaleString('tr-TR');

  // Metin içinde kullanılabilen canlı değerler: {together}, {met}, {bakuTime} ...
  K.tokens = {
    together: () => K.num(T.daysSince(C.togetherDate)),
    met: () => K.num(T.daysSince(C.metDate)),
    months: () => T.monthsTogether(),
    anniversary: () => K.num(Math.max(0, T.daysUntil(C.firstAnniversary))),
    herBirthdayIn: () => K.num(T.nextAnnual(C.herBirthday).days),
    myBirthdayIn: () => K.num(T.nextAnnual(C.myBirthday).days),
    bakuTime: () => T.hm(C.tzBaku),
    istTime: () => T.hm(C.tzIstanbul),
    km: () => K.num(C.distanceKm),
    hugs: () => K.num(K.hugDebt()),
    // Okuyana göre: öbürünün ve kendi evcil adı
    other: () => K.otherName(),
    otherPet: () => K.otherName(),
    mePet: () => (K.isOwner() ? C.myPet : C.herPet),
  };
  // Sarılma borcu: birlikte geçen her gün bir sarılma + uzaktan gönderilen her sarılma
  K.hugDebt = () => Math.max(0, T.daysSince(C.togetherDate)) + K.store.get('hugs', 0);
  // Kale sahibi (Arda) kendi şifresiyle girdiyse
  K.isOwner = () => Boolean(K.vault && K.vault.who === 'me');
  K.otherName = () => (K.isOwner() ? C.herPet : C.myPet);
  // Oda başlıkları metin ya da fonksiyon olabilir
  K.val = (v) => (typeof v === 'function' ? v() : v);

  /* ---------- Rastgelelik ---------- */
  K.hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  K.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  K.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  K.shuffle = (arr, r = Math.random) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Listeden her gün bir sonraki (liste bitene kadar tekrar etmez)
  K.daily = (arr, salt = 0) => arr[(T.dayNumber(T.now()) + salt) % arr.length];

  /* ---------- Türkçe/Azerbaycanca metin karşılaştırma ---------- */
  // Türkçe ek, ünlü uyumuyla: K.ek('Arda', 'in') → Arda'nın, K.ek('Bakü', 'e') → Bakü'ye
  K.ek = (w, t) => {
    const s = String(w || '');
    const low = s.toLocaleLowerCase('tr');
    const vs = low.match(/[aeıioöuü]/g) || ['e'];
    const v = vs[vs.length - 1];
    const endV = /[aeıioöuü]$/.test(low);
    const two = 'aıou'.includes(v) ? 'a' : 'e';
    const four = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v];
    const hard = /[çfhkpsşt]$/.test(low);
    const x = {
      in: (endV ? 'n' : '') + four + 'n',
      e: (endV ? 'y' : '') + two,
      i: (endV ? 'y' : '') + four,
      de: (hard ? 't' : 'd') + two,
      den: (hard ? 't' : 'd') + two + 'n',
      le: (endV ? 'y' : '') + 'l' + two,
    }[t];
    return `${s}'${x == null ? t : x}`;
  };
  K.norm = (s) =>
    String(s)
      .toLocaleLowerCase('tr')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/ə/g, 'e')
      .replace(/[âà]/g, 'a')
      .replace(/[îì]/g, 'i')
      .replace(/[ûù]/g, 'u')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  K.lev = (a, b) => {
    if (a === b) return 0;
    const m = a.length,
      n = b.length;
    if (!m || !n) return m || n;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  };

  /* ---------- Paylaşım, kopyalama, bildirim ---------- */
  K.copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e2) {
        return false;
      }
    }
  };
  // Önce cihazın paylaşım menüsü, olmazsa panoya kopyala. Sonucu metin olarak döndürür.
  K.share = async ({ title, text, file }) => {
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return 'shared';
      }
      if (!file && navigator.share) {
        await navigator.share({ title, text });
        return 'shared';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
    if (text && (await K.copy(text))) return 'copied';
    return 'failed';
  };
  // ntfy.sh ile telefona bildirim. K.notify: Eln → User155'in telefonu (config.ntfyTopic boşsa hiçbir şey göndermez).
  // K.ping: kim gönderirse göndersin öbürünün telefonuna (sahip → Eln'in kanalı config.ntfyTopicHer, Eln → K.notify)
  const ntfyPost = async (topic, title, message, tags, extra) => {
    if (!topic || K.previewDate) return false;
    try {
      const res = await fetch('https://ntfy.sh/', {
        method: 'POST',
        body: JSON.stringify(Object.assign({ topic, title, message, tags: tags || ['heart'], priority: 4 }, extra || {})),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };
  K.canNotify = () => Boolean(C.ntfyTopic);
  K.notify = (title, message, tags, extra) => ntfyPost(C.ntfyTopic, title, message, tags, extra);
  K.pingHer = (title, message, tags, extra) => (K.isOwner && K.isOwner() ? ntfyPost(C.ntfyTopicHer, title, message, tags, extra) : Promise.resolve(false));
  // Bildirimden cevap: sarılma, kalp, öpücük gibi bildirimlerin altında "Geri sarıl" ve "Kalp" düğmeleri. Düğme kale
  // açılmadan doğrudan öbürünün kanalına bildirim gönderir (ntfy http eylemi).
  const REPLY_TAGS = ['hugging_face', 'kiss', 'heart', 'sparkling_heart', 'two_hearts', 'revolving_hearts', 'heartpulse', 'wave', 'thought_balloon', 'pleading_face', 'heart_eyes', 'smiling_face_with_three_hearts', 'love_letter', 'cupid'];
  const replyActions = (click) => {
    const owner = K.isOwner && K.isOwner();
    const back = owner ? C.ntfyTopic : C.ntfyTopicHer;
    const who = owner ? C.herPet : C.myPet;
    if (!back) return null;
    const root = location.origin + location.pathname;
    const act = (label, title, tag) => ({ action: 'http', label, url: 'https://ntfy.sh/', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: back, title, message: 'Bildirimden, kale açılmadan 💌', tags: [tag], priority: 4, click: root }), clear: true });
    return [act('🤗 Geri sarıl', `🤗 ${who} da sana sarıldı`, 'hugging_face'), act('💗 Kalp', `💗 ${who} sana kalp gönderdi`, 'heart'), { action: 'view', label: 'Kaleyi aç', url: click || root }];
  };
  K.replyActions = replyActions;
  K.ping = (title, message, tags, extra) => {
    const x = Object.assign({ click: K.roomUrl('') }, extra || {});
    if (x.actions === undefined && (x.reply || (tags || []).some((t) => REPLY_TAGS.includes(t)))) {
      const a = replyActions(x.click);
      a && (x.actions = a);
    }
    if (x.actions === false) delete x.actions;
    delete x.reply;
    return K.isOwner && K.isOwner() ? K.pingHer(title, message, tags, x) : K.notify(title, message, tags, x);
  };
  // Rolden bağımsız: 'me' → User155'in kanalı, 'her' → Eln'in kanalı (hatırlatıcı gibi kendiliğinden gidenler için)
  K.ntfyTo = (who, title, message, tags, extra) => ntfyPost(who === 'her' ? C.ntfyTopicHer : C.ntfyTopic, title, message, tags, extra);
  // Eln'in kendi telefonuna deneme bildirimi (kurulum kartı için)
  K.pingSelf = (title, message, tags) => ntfyPost(C.ntfyTopicHer, title, message, tags);
  // Bildirimde gönderenin adı ve dokununca açılacak oda
  K.meName = () => (K.isOwner && K.isOwner() ? C.myPet : C.herName);
  K.roomUrl = (id) => location.origin + location.pathname + (id ? '#' + id : '');
  // ntfy'nin ileri tarihli gönderimi (en fazla 3 gün): zaman damgası → {delay}
  K.later = (at) => (at - Date.now() > 9e4 && at - Date.now() < 71 * 36e5 ? { delay: String(Math.round(at / 1000)) } : null);
  K.vibrate = (p) => {
    try {
      navigator.vibrate && navigator.vibrate(p);
    } catch (e) {}
  };

  /* ---------- Dosya indirme ---------- */
  K.download = (dataUrl, name) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  K.dataUrlToFile = async (dataUrl, name) => {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], name, { type: blob.type });
  };
})();
