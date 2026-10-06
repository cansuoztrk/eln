/* Kale 2.0 — Kitty'ye Sor, konuşan arama: arama kutusuna soru da yazılabilir. Kitty kalenin kayıtlarına bakıp cevaplar
   ve o ana götürür. Örnekler: "Geçen nisanda ne yaptık?", "Dün ne oldu?", "En son ne zaman barıştık?", "Pamuk'u en çok
   kim besledi?", "Kaç kez özledim dedik?", "İlk kavanoz notu ne zamandı?", "Kaç gündür birlikteyiz?", "Bakü'de saat kaç?".
   Cevap bir kart olarak aramanın en üstünde çıkar; altındaki bağlantı o güne (Gün Gün Biz) ya da odaya gider. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const MON = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
  const KINDS = [
    [/özle/, ['ozlem'], '"özledim"'],
    [/sarıl|kucak/, ['kucak', 'hug'], 'sarılma'],
    [/öp/, ['opucuk'], 'öpücük'],
    [/kavanoz|kalp at/, ['kalpk'], 'kavanoz kalbi'],
    [/düşün/, ['dusun'], '"seni düşünüyorum"'],
    [/selam|günaydın/, ['selam'], 'selam'],
    [/sesli|telesekreter|ses /, ['tsmesaj'], 'sesli mesaj'],
    [/minnet|teşekkür/, ['minnet'], 'minnet cümlesi'],
    [/iyilik/, ['iyilik'], 'iyilik'],
    [/söz/, ['soz'], 'söz'],
    [/hikaye|hikâye|fotoğraf|kare/, ['hikaye', 'kare'], 'fotoğraf'],
    [/barış/, ['baristi'], 'barış'],
    [/küs/, ['aramiz'], 'küslük'],
    [/rüya/, ['ruya'], 'rüya'],
    [/kartpostal/, ['postcard'], 'kartpostal'],
    [/besle|mama/, ['mama'], 'mama'],
    [/sev(di|mek)|okşa/, ['sev'], 'kedi sevme'],
    [/güneş/, ['gunes'], 'güneş notu'],
    [/adım|yürü/, ['adim'], 'adım kaydı'],
  ];
  const norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[’'`]/g, "'");
  const isQ = (q) => /\?$|ne (yaptık|oldu|zaman)|kaç|kim|en (son|çok|az)|ilk |hangi|nerede|saat/.test(norm(q));
  const card = (title, text, links = []) => ({ title, text, links });
  const dayKey = (ms) => T.key(T.baku(new Date(ms)));
  // "geçen nisan", "nisanda", "ekim'de", "dün", "bugün", "geçen hafta", "21 mayıs"
  function range(q) {
    const t = norm(q);
    const p = T.baku();
    const day = (y, m, d) => T.at(`${y}-${K.pad(m)}-${K.pad(d)}`).getTime();
    if (/\bdün\b/.test(t)) return { a: day(p.y, p.mo, p.d) - 864e5, b: day(p.y, p.mo, p.d), label: 'Dün' };
    if (/\bbugün\b/.test(t)) return { a: day(p.y, p.mo, p.d), b: Date.now(), label: 'Bugün' };
    if (/geçen hafta/.test(t)) return { a: Date.now() - 14 * 864e5, b: Date.now() - 7 * 864e5, label: 'Geçen hafta' };
    if (/bu hafta/.test(t)) return { a: Date.now() - 7 * 864e5, b: Date.now(), label: 'Bu hafta' };
    const dm = t.match(/(\d{1,2})\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/);
    if (dm) {
      const m = MON.indexOf(dm[2]) + 1;
      let y = p.y;
      if (day(y, m, +dm[1]) > Date.now()) y--;
      return { a: day(y, m, +dm[1]), b: day(y, m, +dm[1]) + 864e5, label: `${+dm[1]} ${K.MONTHS[m - 1]} ${y}`, day: `${y}-${K.pad(m)}-${K.pad(+dm[1])}` };
    }
    const mm = MON.findIndex((m) => t.includes(m));
    if (mm >= 0) {
      let y = p.y;
      if (mm + 1 > p.mo || (/geçen/.test(t) && mm + 1 === p.mo)) y--;
      const b = mm === 11 ? day(y + 1, 1, 1) : day(y, mm + 2, 1);
      return { a: day(y, mm + 1, 1), b, label: `${K.MONTHS[mm]} ${y}` };
    }
    if (/geçen ay/.test(t)) {
      const m = p.mo === 1 ? 12 : p.mo - 1, y = p.mo === 1 ? p.y - 1 : p.y;
      return { a: day(y, m, 1), b: day(p.y, p.mo, 1), label: `${K.MONTHS[m - 1]} ${y}` };
    }
    return null;
  }
  async function rows() {
    return K.akis && K.cloud && K.cloud.enabled ? K.akis.all() : [];
  }
  async function answer(q) {
    const t = norm(q);
    if (!t || t.length < 5 || !isQ(t)) return null;
    // Sabit cevaplar
    if (/kaç gün(dür)? birlikte|ne zamandır birlikte/.test(t)) return card(`${K.num(T.daysSince(C.togetherDate))} gündür birlikteyiz`, `${T.monthsTogether()}. ayımızdayız. ${T.fmt(C.togetherDate)} günü başladı.`, [{ room: 'ozet', label: 'Özetimize git' }]);
    if (/tanış/.test(t) && /kaç|ne zaman/.test(t)) return card(`Tanışalı ${K.num(T.daysSince(C.metDate))} gün`, `${T.fmt(C.metDate)}.`, [{ day: C.metDate, label: 'O güne in' }]);
    if (/yıldönüm/.test(t)) return card(`Yıldönümüne ${K.num(T.nextAnnual(C.togetherDate.slice(5)).days)} gün`, T.fmt(T.nextAnnual(C.togetherDate.slice(5)).date), [{ room: 'ozel', label: 'Özel Günler' }]);
    if (/saat kaç|saat\b/.test(t) && /bakü|istanbul|orada|onda/.test(t)) return card(`Bakü ${T.hm(C.tzBaku)} · İstanbul ${T.hm(C.tzIstanbul)}`, 'Bakü bir saat ileride.', []);
    if (/kavanoz/.test(t) && /kaç/.test(t) && K.kavanoz) return card(`Kavanozda ${K.num(K.kavanoz.count())} kalp var`, 'Her "seni seviyorum" bir kalp.', [{ room: 'kavanoz', label: 'Kavanoza git' }]);
    if (/kaç km|ne kadar uzak|mesafe/.test(t)) {
      const p = K.bulusalim && K.bulusalim.progress();
      return card(`${K.num(C.km || 1758)} km`, p ? `Ortada Buluşalım'da ${K.num(Math.round(Math.max(0, 1758 - p.me - p.her)))} km kaldı.` : 'İstanbul ile Bakü arası.', [{ room: 'bulusalim', label: 'Ortada Buluşalım' }]);
    }
    const all = await rows();
    if (!all.length) return null;
    const kind = KINDS.find(([re]) => re.test(t));
    // Bir zaman aralığında ne yaptık?
    const r = range(t);
    if (r && /ne (yaptık|oldu)|neler|ne yaptı/.test(t)) {
      const list = all.filter((x) => x.at >= r.a && x.at < r.b);
      if (!list.length) return card(`${r.label}: kalede kayıt yok`, 'O günlerde kale sessizmiş.', []);
      const by = {};
      list.forEach((x) => (by[x.title] = (by[x.title] || 0) + 1));
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${n > 1 ? n + ' × ' : ''}${k}`);
      const best = list.slice().sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
      const days = new Set(list.map((x) => x.day)).size;
      return card(`${r.label}: ${K.num(list.length)} an, ${days} gün`, `${top.join(' · ')}. En güzeli: ${nameOf(best.who)}, "${best.title}"${best.text ? ` (${String(best.text).slice(0, 70)})` : ''}.`, [{ day: r.day || best.day, label: r.day ? 'O güne in' : 'En güzel ana git' }]);
    }
    if (!kind) return null;
    const [, kinds, label] = kind;
    const list = all.filter((x) => kinds.includes(x.kind));
    const inRange = r ? list.filter((x) => x.at >= r.a && x.at < r.b) : list;
    if (/en son|son ne zaman/.test(t)) {
      const x = list.slice().sort((a, b) => b.at - a.at)[0];
      return x ? card(`En son ${K.ago(x.at)}: ${T.fmt(new Date(x.at))}`, `${nameOf(x.who)} · ${x.title}${x.text ? ` · ${String(x.text).slice(0, 80)}` : ''}`, [{ day: x.day, label: 'O güne in' }]) : card(`Hiç ${label} kaydı yok`, '', []);
    }
    if (/\bilk\b/.test(t)) {
      const x = list.slice().sort((a, b) => a.at - b.at)[0];
      return x ? card(`İlk ${label}: ${T.fmt(new Date(x.at))}`, `${nameOf(x.who)} · ${x.title}${x.text ? ` · ${String(x.text).slice(0, 80)}` : ''}`, [{ day: x.day, label: 'O güne in' }]) : card(`Hiç ${label} kaydı yok`, '', []);
    }
    if (/kim/.test(t) || /kaç/.test(t)) {
      const me = inRange.filter((x) => x.who === 'me').length, her = inRange.filter((x) => x.who === 'her').length;
      const lead = me === her ? 'Berabere' : me > her ? `${nameOf('me')} önde` : `${nameOf('her')} önde`;
      return card(`${r ? r.label + ': ' : ''}${K.num(me + her)} ${label}`, `${nameOf('her')}: ${K.num(her)} · ${nameOf('me')}: ${K.num(me)}. ${/kim/.test(t) ? lead + '.' : ''}`, [{ room: (inRange[0] || list[0] || {}).room || '', label: 'Odaya git' }]);
    }
    return null;
  }
  // Arama penceresine bağlan: her yazışta (gecikmeli) cevap kartı en üstte
  let seq = 0;
  function attach(box, q) {
    const my = ++seq;
    let c = K.$('.ara-cevap', box.parentNode);
    if (!c) {
      c = K.el('<div class="ara-cevap" aria-live="polite"></div>');
      box.parentNode.insertBefore(c, box);
    }
    if (!q || !isQ(q)) return (c.innerHTML = '');
    c.innerHTML = '<p class="ara-dusun">Kitty kayıtlara bakıyor...</p>';
    answer(q).then((a) => {
      if (my !== seq) return;
      if (!a) return (c.innerHTML = '');
      c.innerHTML = `<div class="ara-kitty"><span class="ara-kitty-ic">🎀</span><div><b>${K.esc(a.title)}</b>${a.text ? `<p>${K.esc(a.text)}</p>` : ''}${a.links.filter((l) => l.room || l.day).map((l) => `<button type="button" class="chip" data-sor-room="${K.esc(l.room || '')}" data-sor-day="${K.esc(l.day || '')}">${K.esc(l.label)} →</button>`).join('')}</div></div>`;
      K.stickers.award('kittyesor');
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sor-room], [data-sor-day]');
    if (!b || !b.closest('.ara-cevap')) return;
    K.ara && K.ara.close();
    const day = b.dataset.sorDay, room = b.dataset.sorRoom;
    setTimeout(() => (day && K.gungun ? K.gungun.open(day) : room && K.go(room)), 250);
  });
  K.sor = { answer, attach, isQ };
})();
