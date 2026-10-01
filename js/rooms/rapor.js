/* Oda: Haftalık Kalp Raporu — her pazar akşamı (Bakü 20:00) haftanın kalbi: içimizin havası, kaleye uğradığımız günler,
   kalp menüsü, kavanoz, minnet, sesler, görev, birlikte uyunan geceler, gün batımları, barışlar. Yeni kayıt tutmaz;
   o haftanın kayıtlarını okur. Kavanozdan haftanın notu ve iki küçük öneri. Önceki haftalar gezilebilir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const RP = () => D.rapor || { intro: [], tips: {} };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const KINDS = ['hava', 'selam', 'kucak', 'dusun', 'ozlem', 'kalpk', 'minnet', 'tsmesaj', 'hikaye', 'kare', 'gorev', 'endise', 'guven', 'baristi', 'yarisma', 'ppwin', 'sleep', 'gunbatimi', 'kelime', 'tahmin', 'pin'];
  const HAVA = { gunes: ['☀️', 'Güneşli'], gokkusagi: ['🌈', 'Gökkuşağı'], parcali: ['⛅', 'Parçalı bulutlu'], sis: ['🌫️', 'Sisli'], yagmur: ['🌧️', 'Yağmurlu'], firtina: ['⛈️', 'Fırtınalı'], kar: ['❄️', 'Karlı'] };
  let root = null, week = null;
  const cache = {};

  function weekOf(k) {
    const d = new Date(k + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  const shift = (w, n) => {
    const d = new Date(w + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  // Bu haftanın raporu pazar 20:00'de açılır
  const opensAt = (w) => T.at(shift(w, 6)).getTime() + 20 * 36e5;
  const latest = () => {
    const w = weekOf(T.todayKey());
    return T.now().getTime() >= opensAt(w) ? w : shift(w, -7);
  };
  const dayOf = (at) => T.key(T.baku(new Date(at)));

  async function data(w) {
    if (cache[w]) return cache[w];
    const since = T.at(w).getTime(), before = T.at(shift(w, 7)).getTime();
    const rows = await K.cloud.many(KINDS, { since, before, limit: 3000 });
    return (cache[w] = compute(w, rows));
  }
  function compute(w, rows) {
    const by = (k, who) => rows.filter((r) => r.kind === k && (!who || r.who === who));
    const per = (fn) => ({ me: fn('me'), her: fn('her') });
    const days = per((x) => new Set(rows.filter((r) => r.who === x).map((r) => dayOf(r.at))).size);
    const kalp = per((x) => ['selam', 'kucak', 'dusun', 'ozlem'].reduce((s, k) => s + by(k, x).length, 0));
    const hv = {};
    by('hava').forEach((r) => (hv[r.data.type] = (hv[r.data.type] || 0) + 1));
    const top = Object.entries(hv).sort((a, b) => b[1] - a[1])[0];
    const hvOf = per((x) => {
      const c = {};
      by('hava', x).forEach((r) => (c[r.data.type] = (c[r.data.type] || 0) + 1));
      const t = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
      return t ? t[0] : null;
    });
    // Birlikte uyunan geceler
    const nights = {};
    by('sleep').forEach((r) => ((nights[T.key(T.baku(new Date(r.at - 12 * 36e5)))] = nights[T.key(T.baku(new Date(r.at - 12 * 36e5)))] || {})[r.who] = 1));
    const gb = {};
    by('gunbatimi').forEach((r) => ((gb[r.data.day] = gb[r.data.day] || {})[r.who] = 1));
    const gorevBoth = by('gorev', 'me').length && by('gorev', 'her').length;
    const notes = by('kalpk', other()).filter((r) => r.data.note);
    const stats = {
      days,
      kalp,
      ozlem: per((x) => by('ozlem', x).length),
      kavanoz: per((x) => by('kalpk', x).length),
      minnet: per((x) => by('minnet', x).length),
      ses: per((x) => by('tsmesaj', x).length),
      hikaye: per((x) => by('hikaye', x).length),
      kare: per((x) => by('kare', x).length),
      guven: per((x) => by('guven', x).length),
    };
    const firtina = (hv.firtina || 0) + (hv.yagmur || 0);
    const both = Math.min(days.me, days.her);
    const index = Math.min(100, Math.round(both * 7 + Math.min(18, (kalp.me + kalp.her) * 0.9) + Math.min(14, (stats.kavanoz.me + stats.kavanoz.her) * 1.4) + Math.min(10, (stats.minnet.me + stats.minnet.her) * 1.2) + Math.min(6, (stats.ses.me + stats.ses.her) * 2) + (gorevBoth ? 3 : 0)));
    const hi = [];
    if (gorevBoth) hi.push(['🏅', 'Haftanın görevini ikiniz de yaptınız']);
    const nb = Object.values(nights).filter((n) => n.me && n.her).length;
    if (nb) hi.push(['🌙', `${nb} gece birlikte uyudunuz`]);
    const gbn = Object.values(gb).filter((n) => n.me && n.her).length;
    if (gbn) hi.push(['🌅', `Güneşi ${gbn} kez birlikte uğurladınız`]);
    if (by('baristi').length) hi.push(['🕊️', 'Küçük bir bulut geçti ve barıştınız']);
    if (by('guven').length) hi.push(['🫧', `Birbirinize ${by('guven').length} kez güven verdiniz`]);
    const yw = by('yarisma').length + by('ppwin').length;
    if (yw) hi.push(['🎮', `${yw} oyun oynadınız`]);
    if (by('pin').length) hi.push(['📍', `Haritamıza ${by('pin').length} yeni iğne`]);
    if (by('kelime').filter((r) => r.data.won).length >= 2) hi.push(['🔤', `Günün Kelimesi ${by('kelime').filter((r) => r.data.won).length} kez bulundu`]);
    const T2 = RP().tips || {};
    const tips = [];
    if (by('baristi').length) tips.push(T2.baris);
    if (firtina >= 3) tips.push(T2.firtina);
    if (stats.ozlem.me + stats.ozlem.her >= 6) tips.push(T2.ozlem);
    if (!stats.ses.me && !stats.ses.her) tips.push(T2.ses);
    if (!stats.minnet.me && !stats.minnet.her) tips.push(T2.minnet);
    if ((by('gorev', 'me').length || by('gorev', 'her').length) && !gorevBoth) tips.push(T2.gorev);
    if (stats.kavanoz.me + stats.kavanoz.her < 3) tips.push(T2.kavanoz);
    if (both >= 6) tips.unshift(T2.harika);
    return { w, rows: rows.length, stats, top: top ? top[0] : null, hvOf, index, hi, note: notes.length ? K.pick(notes) : null, tips: tips.filter(Boolean).slice(0, 2) };
  }

  async function render() {
    if (!root || K.activeRoom !== 'rapor') return;
    const w = week || latest();
    const box = K.$('#rpBody', root);
    const open = T.now().getTime() >= opensAt(w);
    const isLatest = w === latest();
    K.$('#rpNav', root).innerHTML = `<button type="button" class="icon-btn" data-rp="-7" aria-label="Önceki hafta">‹</button><b>${K.esc(T.fmtShort(w))} – ${K.esc(T.fmtShort(shift(w, 6)))}</b><button type="button" class="icon-btn" data-rp="7" aria-label="Sonraki hafta" ${isLatest ? 'disabled' : ''}>›</button>`;
    if (!open) return (box.innerHTML = `<p class="muted center">Bu haftanın raporu pazar akşamı (Bakü 20:00) çıkacak.</p>`);
    box.innerHTML = '<p class="muted center">Rapor hazırlanıyor...</p>';
    const r = await data(w);
    if ((week || latest()) !== w || !root) return;
    if (!r.rows) return (box.innerHTML = '<p class="muted center">Bu hafta kalede kayıt yok.</p>');
    K.store.set('rapor-' + mine(), w);
    const hv = r.top ? HAVA[r.top] || ['☁️', r.top] : ['🌤️', 'Kayıt yok'];
    const s = r.stats;
    const max = (k) => Math.max(1, s[k].me, s[k].her);
    const row = (k, ic, l) => `<div class="rp-row"><span class="rp-l">${ic} ${K.esc(l)}</span>${['her', 'me'].map((x) => `<span class="rp-v ${x}"><i style="--p:${(s[k][x] / max(k)) * 100}%"></i><b class="tnum">${s[k][x]}</b></span>`).join('')}</div>`;
    box.innerHTML = `<div class="rp-top"><div class="rp-sky"><span class="rp-emo">${hv[0]}</span><small>Haftanın havası</small><b>${K.esc(hv[1])}</b></div>
        <div class="rp-index" style="--p:${r.index}"><span class="tnum">${r.index}</span><small>Kalp endeksi</small></div></div>
      <div class="rp-mood">${['her', 'me'].map((x) => `<span>${K.avatar(x, 'rp-av')}${K.esc(nameOf(x))}: ${r.hvOf[x] ? `${(HAVA[r.hvOf[x]] || [''])[0]} ${K.esc((HAVA[r.hvOf[x]] || ['', ''])[1])}` : 'hava paylaşmadı'}</span>`).join('')}</div>
      <div class="rp-table"><div class="rp-row rp-h"><span></span><span>${K.esc(C.herPet)}</span><span>${K.esc(C.myPet)}</span></div>
        ${row('days', '🏰', 'Kaleye uğradığı gün')}${row('kalp', '💗', 'Kalp menüsü')}${row('kavanoz', '🫙', 'Kavanoza kalp')}${row('minnet', '🙏', 'Minnet cümlesi')}${row('ses', '📼', 'Sesli mesaj')}${row('hikaye', '📸', 'Hikâye')}${row('kare', '🖼️', 'Günün Karesi')}</div>
      ${r.hi.length ? `<ul class="rp-hi">${r.hi.map(([e, t]) => `<li><span>${e}</span>${K.esc(t)}</li>`).join('')}</ul>` : ''}
      ${r.note ? `<div class="rp-note"><p class="card-eyebrow">Kavanozdan haftanın notu</p><p class="hand">${K.esc(r.note.data.note)}</p><small>— ${K.esc(nameOf(r.note.who))}</small></div>` : ''}
      ${r.tips.length ? `<div class="rp-tips"><p class="card-eyebrow">Gelecek hafta için</p>${r.tips.map((t) => `<p>💡 ${K.esc(t)}</p>`).join('')}</div>` : ''}`;
  }

  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.cloud || !K.cloud.enabled || !D.rapor) return [];
    const w = latest();
    if (K.store.get('rapor-' + mine()) === w || T.now().getTime() - opensAt(w) > 3 * 864e5) return [];
    return [{ icon: 'cloud', title: '📊 Haftalık Kalp Raporu hazır', text: `${T.fmtShort(w)} – ${T.fmtShort(shift(w, 6))}: haftanın havası, kalp endeksi ve küçük bir öneri.`, room: 'rapor', cta: 'Oku' }];
  });
  K.rapor = { latest, data };

  K.room({
    id: 'rapor',
    wing: 'kalp',
    title: 'Haftalık Kalp Raporu',
    sub: 'Her pazar akşamı haftanın kalbi',
    icon: 'cloud',
    color: '#E3F0FF',
    hidden: () => !D.rapor || !K.cloud || !K.cloud.enabled,
    badge: () => (K.cloud && K.cloud.enabled && K.store.get('rapor-' + mine()) !== latest() ? 'Yeni' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(RP().intro || [])}</div>
        <div class="rp-nav" id="rpNav"></div>
        <section class="card rp-card" id="rpBody"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-rp]');
        if (!b) return;
        const n = shift(week || latest(), +b.dataset.rp);
        if (n > latest()) return;
        week = n;
        render();
      });
    },
    enter() {
      week = null;
      delete cache[latest()];
      render();
    },
  });
})();
