/* Oda: Ders Arkadaşı Kitty — ikiniz aynı anda ders çalışırken iki masa yan yana görünür. Kitty süreyi tutar
   (25+5 ya da 50+10), molada öbürünün bıraktığı kısa bir sesi çalar, gün sonunda "bugün birlikte 3 saat çalıştınız" der.
   Canlı durum: K.cloud.send('calisma', {d}) (çalışıyor / mola / yok, konu, bitiş).
   Kayıtlar: calisma {bas, bit, dk, konu, day} (biten her çalışma bloğu) · calismases {audio, dur} (mola sesi) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const PLAN = { kisa: [25, 5], uzun: [50, 10] };
  let ben = K.store.get('calismaDurum', { d: 'yok' });
  let o = { d: 'yok' }, oAt = 0;
  let rows = [], sesler = [], root = null, tik = null;

  const kaydetDurum = () => K.store.set('calismaDurum', ben);
  function yay() {
    K.cloud && K.cloud.enabled && K.cloud.send('calisma', { d: ben });
  }
  function baslat(tur) {
    const [dk] = PLAN[tur];
    const konu = (K.$('#clKonu', root) && K.$('#clKonu', root).value.trim()) || ben.konu || '';
    ben = { d: 'calisiyor', tur, bas: Date.now(), bit: Date.now() + dk * 6e4, konu };
    kaydetDurum();
    yay();
    K.audio.sfx.chime();
    ciz();
  }
  async function blokBitti(erken) {
    if (ben.d !== 'calisiyor') return;
    const bit = erken ? Date.now() : ben.bit;
    const dk = Math.round((bit - ben.bas) / 6e4);
    if (dk >= 3 && K.cloud && K.cloud.enabled) {
      const r = await K.cloud.add('calisma', { bas: ben.bas, bit, dk, konu: ben.konu || '', day: T.todayKey() });
      r && (rows.some((x) => x.id === r.id) || rows.push(r));
    }
    const mola = PLAN[ben.tur || 'kisa'][1];
    ben = erken ? { d: 'yok', konu: ben.konu } : { d: 'mola', tur: ben.tur, bas: Date.now(), bit: Date.now() + mola * 6e4, konu: ben.konu };
    kaydetDurum();
    yay();
    if (!erken) {
      K.fx.toast(`☕ <b>Mola!</b> ${mola} dakika. Kitty sana ${K.esc(nameOf(other()))}'dan bir şey getirdi.`, { duration: 5000 });
      molaSesi();
      K.stickers.award('calisma');
    }
    ciz();
  }
  async function molaSesi() {
    const oSes = sesler.filter((r) => r.who === other());
    let havuz = oSes;
    if (!havuz.length && K.cloud && K.cloud.enabled) havuz = (await K.cloud.list('tsmesaj', 60)).filter((r) => r.who === other() && r.data.audio);
    if (!havuz.length) return K.audio.sfx.chime();
    const r = havuz[Math.floor(Math.random() * havuz.length)];
    K.medya.cal(r.data.audio);
  }
  function denetle() {
    if ((ben.d === 'calisiyor' || ben.d === 'mola') && Date.now() >= ben.bit) {
      if (ben.d === 'calisiyor') blokBitti(false);
      else {
        ben = { d: 'yok', konu: ben.konu };
        kaydetDurum();
        yay();
        K.audio.sfx.chime();
        K.fx.toast('📚 Mola bitti. Bir tur daha?', { duration: 4000 });
        ciz();
      }
    }
    if (root && K.activeRoom === 'calisma') saat();
  }

  /* ---------- Hesap: birlikte geçen dakikalar ---------- */
  function ortak(gun) {
    const a = rows.filter((r) => r.who === 'me' && r.data.day === gun), b = rows.filter((r) => r.who === 'her' && r.data.day === gun);
    let dk = 0;
    a.forEach((x) => b.forEach((y) => (dk += Math.max(0, Math.min(x.data.bit, y.data.bit) - Math.max(x.data.bas, y.data.bas)) / 6e4)));
    return Math.round(dk);
  }
  const toplam = (w, gun) => rows.filter((r) => r.who === w && r.data.day === gun).reduce((s, r) => s + r.data.dk, 0);
  const sa = (dk) => (dk >= 60 ? `${Math.floor(dk / 60)} sa${dk % 60 ? ' ' + (dk % 60) + ' dk' : ''}` : `${dk} dk`);

  /* ---------- Çizim ---------- */
  function masa(w, s) {
    const calis = s.d === 'calisiyor', mola = s.d === 'mola';
    const kalan = calis || mola ? Math.max(0, Math.ceil((s.bit - Date.now()) / 6e4)) : 0;
    return `<div class="cl-masa ${calis ? 'calis' : mola ? 'mola' : ''}">
      <svg viewBox="0 0 160 110" aria-hidden="true"><path d="M8 78 H152" stroke="#3A1F2D" stroke-width="4" stroke-linecap="round"/><path d="M20 78 V106 M140 78 V106" stroke="#3A1F2D" stroke-width="4" stroke-linecap="round"/>
        <path class="cl-lamba" d="M118 76 V44 L128 30 M120 30 H142 L136 18 H126 Z" fill="${calis ? '#FFE27A' : '#fff'}" stroke="#3A1F2D" stroke-width="3" stroke-linejoin="round"/>
        ${calis ? '<path class="cl-isik" d="M124 34 L104 76 H150 L138 34 Z" fill="#FFE27A" opacity=".35"/>' : ''}
        <path d="M40 76 L44 58 H86 L90 76 Z" fill="${w === 'me' ? '#9FD8FF' : '#FF8FB8'}" stroke="#3A1F2D" stroke-width="3" stroke-linejoin="round"/><path d="M50 64 H80" stroke="#fff" stroke-width="2.5"/>
        ${mola ? '<path d="M96 76 V66 H110 V76 Z" fill="#fff" stroke="#3A1F2D" stroke-width="3"/><path d="M100 62 C98 58 102 56 100 52" stroke="#3A1F2D" stroke-width="2" fill="none"/>' : ''}</svg>
      <b>${K.esc(nameOf(w))}</b><small>${calis ? `📚 ${K.esc(s.konu || 'Çalışıyor')} · ${kalan} dk` : mola ? `☕ Molada · ${kalan} dk` : w === mine() ? 'Masan boş' : 'Masası boş'}</small></div>`;
  }
  function saat() {
    const el = K.$('#clSaat', root);
    if (!el) return;
    const aktif = ben.d === 'calisiyor' || ben.d === 'mola';
    const top = aktif ? ben.bit - ben.bas : 1, kal = aktif ? Math.max(0, ben.bit - Date.now()) : 0;
    const pay = aktif ? 1 - kal / top : 0;
    const m = Math.floor(kal / 6e4), s = Math.floor((kal % 6e4) / 1000);
    el.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="#fff" stroke="#3A1F2D" stroke-width="4"/><circle cx="60" cy="60" r="44" fill="none" stroke="${ben.d === 'mola' ? '#9FE5C4' : '#FFB3CC'}" stroke-width="10" stroke-dasharray="${(pay * 276.5).toFixed(1)} 400" transform="rotate(-90 60 60)" stroke-linecap="round"/></svg>
      <div class="cl-saat-ic">${aktif ? `<b class="tnum">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</b><small>${ben.d === 'mola' ? 'mola' : 'çalışma'}</small>` : `<span class="cl-kitty">${A.kitty({ cls: 'is-happy' })}</span>`}</div>`;
  }
  function ciz() {
    if (!root || K.activeRoom !== 'calisma') return;
    const oCanli = Date.now() - oAt < 3 * 6e4 ? o : { d: 'yok' };
    const gun = T.todayKey();
    const birlikte = ortak(gun);
    K.$('#clMasalar', root).innerHTML = masa(mine(), ben) + masa(other(), oCanli);
    const aktif = ben.d !== 'yok';
    K.$('#clKontrol', root).innerHTML = aktif
      ? `<button class="btn ghost" type="button" data-cl="${ben.d === 'mola' ? 'atla' : 'bitir'}">${ben.d === 'mola' ? 'Molayı atla' : 'Şimdilik bitir'}</button>`
      : `<input class="input" id="clKonu" maxlength="40" placeholder="Ne çalışıyorsun? (ör. Anatomi)" value="${K.esc(ben.konu || '')}"><div class="cl-dugmeler"><button class="btn" type="button" data-cl="kisa">25 dk çalış</button><button class="btn soft" type="button" data-cl="uzun">50 dk çalış</button></div>
        ${oCanli.d === 'yok' && K.cloud && K.cloud.enabled ? `<button class="btn ghost small" type="button" data-cl="cagir">📚 ${K.esc(nameOf(other()))}'ı da çağır</button>` : ''}`;
    // Günün ve haftanın özeti
    const gunler = Array.from({ length: 7 }, (_, i) => T.key(T.baku(new Date(Date.now() - (6 - i) * 864e5))));
    const mx = Math.max(60, ...gunler.map((g) => Math.max(toplam('me', g), toplam('her', g))));
    K.$('#clOzet', root).innerHTML = `<p class="cl-buyuk">${birlikte ? `Bugün birlikte <b>${sa(birlikte)}</b> çalıştınız.` : toplam(mine(), gun) ? `Bugün <b>${sa(toplam(mine(), gun))}</b> çalıştın.` : 'Bugün henüz çalışılmadı.'}</p>
      <p class="muted small">${K.esc(nameOf('me'))}: ${sa(toplam('me', gun))} · ${K.esc(nameOf('her'))}: ${sa(toplam('her', gun))}</p>
      <div class="cl-hafta">${gunler.map((g) => `<div><span><i class="me" style="height:${(toplam('me', g) / mx) * 100}%"></i><i class="her" style="height:${(toplam('her', g) / mx) * 100}%"></i></span><small>${K.esc(T.dayName(T.baku(T.at(g))).slice(0, 2))}</small></div>`).join('')}</div>
      <p class="muted small">Bu hafta birlikte: <b>${sa(gunler.reduce((s, g) => s + ortak(g), 0))}</b></p>`;
    const benimSes = sesler.filter((r) => r.who === mine()).length;
    K.$('#clSes', root).innerHTML = `<p class="muted small">${K.esc(nameOf(other()))} molaya girince senin bıraktığın kısa seslerden biri çalar. Şu an ${benimSes} mola sesin var.</p><button class="btn soft small" type="button" data-cl="ses">🎙️ Mola sesi bırak (en fazla 10 sn)</button>`;
    saat();
  }

  K.room({
    id: 'calisma',
    wing: 'zaman',
    title: 'Ders Arkadaşı Kitty',
    sub: 'İki masa yan yana, Kitty süreyi tutar',
    icon: 'desk',
    color: '#E1F3FF',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Aynı anda çalışırken iki masa yan yana yanar. Kitty süreyi tutar; molada ${K.esc(nameOf(other()))}'ın bıraktığı kısa bir ses çalar. Akşam kaç saat birlikte çalıştığınızı söyler.</p></div>
        <div class="cl-masalar" id="clMasalar"></div>
        <div class="cl-merkez"><div class="cl-saat" id="clSaat"></div><div class="cl-kontrol" id="clKontrol"></div></div>
        <section class="card cl-ozet" id="clOzet"></section>
        <section class="card cl-ses" id="clSes"></section>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-cl]');
        if (!b) return;
        const k = b.dataset.cl;
        if (k === 'kisa' || k === 'uzun') baslat(k);
        if (k === 'bitir') blokBitti(true);
        if (k === 'atla') (ben = { d: 'yok', konu: ben.konu }), kaydetDurum(), yay(), ciz();
        if (k === 'cagir') K.ping(`📚 ${K.meName()} ders çalışmaya oturdu`, 'Gelir misin? İki masa yan yana daha kolay.', ['books'], { click: K.roomUrl('calisma') }), K.fx.toast('Çağırdın 📚');
        if (k === 'ses') {
          const r = await K.medya.kaydet(b, 10);
          if (!r) return;
          const row = await K.cloud.add('calismases', { audio: r.audio, dur: r.dur });
          row && sesler.push(row);
          K.fx.toast('Mola sesin kaydedildi 🎙️');
          ciz();
        }
      });
    },
    async enter() {
      if (K.cloud && K.cloud.enabled) {
        const since = Date.now() - 8 * 864e5;
        [rows, sesler] = await Promise.all([K.cloud.many(['calisma'], { since, limit: 800 }), K.cloud.list('calismases', 60)]);
      }
      ciz();
      clearInterval(tik);
      tik = setInterval(() => K.activeRoom === 'calisma' && saat(), 1000);
    },
    leave() {
      clearInterval(tik);
    },
  });
  K.on('built', () => {
    if (!K.cloud) return;
    K.cloud.onLive('calisma', (m) => {
      if (m.who === mine()) return;
      const once = o.d;
      o = m.d || { d: 'yok' };
      oAt = Date.now();
      if (once !== 'calisiyor' && o.d === 'calisiyor' && K.activeRoom !== 'calisma') K.fx.toast(`📚 <b>${K.esc(nameOf(other()))} ders çalışmaya oturdu.</b> <a href="#calisma">Masana geç ›</a>`, { duration: 6000 });
      ciz();
    });
    K.cloud.on && K.cloud.on('calisma', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), ciz()));
    K.cloud.onPresence && K.cloud.onPresence(() => ben.d !== 'yok' && yay());
  });
  setInterval(denetle, 5000);
  setInterval(() => ben.d !== 'yok' && yay(), 60000);
  K.calisma = { durum: () => ben, ortak };
})();
