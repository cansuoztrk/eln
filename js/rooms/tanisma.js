/* Oda: Tanıştığımız Gece — 6 Aralık 2025 gecesinin saat saat canlandırması: o grup, ilk mesajlar, ilk "iyi geceler".
   Tanışmanın birinci yıl dönümünde (6 Aralık 2026) açılır; o güne kadar kapı kilitli ve geri sayıyor. Kale sahibi
   gece boyunca olanları saat saat yazar (isteğe bağlı fotoğrafla), önizler; açılınca film gibi oynar.
   Kayıt: tanismaan {saat, metin, kim, foto} · tanismasil {ref} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const ACILIS = '2026-12-06';
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const acik = () => T.todayKey() >= ACILIS;
  const ISKELET = [
    ['21:00', 'Bir Instagram grubu. Kalabalık, gürültülü bir sohbet.'],
    ['21:40', 'Bir isim gözüme takıldı.'],
    ['22:15', 'İlk mesaj.'],
    ['23:30', 'Saatler geçti, konuşma bitmedi.'],
    ['01:10', 'İlk "iyi geceler".'],
  ];
  let rows = [], root = null;

  const anlar = () => {
    const l = rows.map((r) => Object.assign({ id: r.id }, r.data));
    const k = (s) => (s < '12:00' ? '1' : '0') + s; // gece yarısından sonrası sona
    return l.sort((a, b) => k(a.saat).localeCompare(k(b.saat)));
  };
  function oynat() {
    const l = anlar().length ? anlar() : ISKELET.map(([saat, metin]) => ({ saat, metin }));
    const yildiz = Array.from({ length: 70 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 90}%;--d:${(i % 9) * 0.3}s"></i>`).join('');
    const scenes = [{ type: 'ozel', html: `<div class="tn-gok">${yildiz}<div class="tn-ay"></div><p class="tn-tarih">6 Aralık 2025</p><p class="tn-alt">Bir cumartesi gecesi. Henüz birbirimizi tanımıyorduk.</p></div>`, dur: 6000 }];
    l.forEach((a) => {
      if (a.foto) scenes.push({ type: 'foto', src: a.foto, caption: a.saat, sub: a.metin });
      else scenes.push({ type: 'yazi', text: a.metin, by: a.saat + (a.kim ? ' · ' + nameOf(a.kim) : '') });
    });
    scenes.push({ type: 'kapanis', text: 'Bir yıl önce bu gece.', sub: `O günden beri ${K.num(T.daysSince(C.metDate))} gün geçti. Hepsi o ilk mesajla başladı.` });
    K.belgesel.play(scenes, { mood: 'gece', label: 'Tanıştığımız gece' });
    K.stickers.award('tanisma');
  }
  function ciz() {
    if (!root || K.activeRoom !== 'tanisma') return;
    const kal = Math.max(0, Math.round((T.at(ACILIS) - Date.now()) / 864e5));
    const sahip = K.isOwner();
    const l = anlar();
    K.$('#tnIcerik', root).innerHTML = `<section class="card tn-kapi ${acik() ? 'acik' : ''}">${acik()
      ? `<p class="card-eyebrow">Birinci yıl dönümü</p><h3>Bir yıl önce bu gece tanıştık.</h3><button class="btn" type="button" data-tn="oynat">🌙 O geceyi oynat</button>`
      : `<p class="card-eyebrow">Kilitli kapı</p><p class="tn-sayac"><b class="tnum">${kal}</b> gün</p><p>Bu kapı 6 Aralık 2026'da, tanışmamızın birinci yılında açılır.</p>${sahip ? '<button class="btn ghost small" type="button" data-tn="oynat">Önizle (yalnızca sen görürsün)</button>' : ''}`}</section>
      ${sahip ? `<section class="card tn-yaz"><p class="card-eyebrow">O geceyi saat saat yaz</p><p class="muted small">Ne zaman ne oldu? Grup, ilk mesaj, ilk şaka, ilk "iyi geceler". Fotoğraf eklersen o saatte ekranı kaplar. Boş kalırsa kale genel bir taslak oynatır.</p>
        <ol class="tn-liste">${l.map((a) => `<li><time>${K.esc(a.saat)}</time><p>${K.esc(a.metin)}</p>${a.foto ? '<span>🖼️</span>' : ''}<button type="button" class="linkish" data-tn-sil="${a.id}">sil</button></li>`).join('') || ISKELET.map(([s, m]) => `<li class="taslak"><time>${s}</time><p>${K.esc(m)}</p></li>`).join('')}</ol>
        <div class="hc-alanlar"><input class="input" id="tnSaat" type="time" value="22:00"><select class="input" id="tnKim"><option value="">—</option><option value="me">${K.esc(nameOf('me'))}</option><option value="her">${K.esc(nameOf('her'))}</option></select></div>
        <textarea class="textarea" id="tnMetin" rows="2" maxlength="300" placeholder="O saatte ne oldu?"></textarea>
        <div class="cl-dugmeler"><label class="btn ghost small">🖼️ Fotoğraf<input type="file" accept="image/*" hidden id="tnFoto"></label><button class="btn" type="button" data-tn="ekle">Ekle</button></div></section>` : ''}`;
  }
  K.room({
    id: 'tanisma',
    wing: 'anilar',
    title: 'Tanıştığımız Gece',
    sub: () => (acik() ? '6 Aralık 2025, saat saat' : 'Birinci yıl dönümünde açılır'),
    icon: 'stars2',
    color: '#DCD6F7',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (acik() && !K.stickers.got().tanisma ? 'Açıldı' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>6 Aralık 2025 gecesi: bir grup, ilk mesajlar, ilk "iyi geceler". O gece saat saat burada canlanıyor.</p></div><div id="tnIcerik"></div>`;
      let foto = null;
      el.addEventListener('change', async (e) => {
        if (e.target.id !== 'tnFoto' || !e.target.files[0]) return;
        foto = await K.medya.image(e.target.files[0], 900, 0.78);
        K.fx.toast('Fotoğraf eklendi; şimdi "Ekle"ye bas.');
      });
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-tn]');
        const s = e.target.closest('[data-tn-sil]');
        if (s) {
          await K.cloud.add('tanismasil', { ref: s.dataset.tnSil });
          rows = rows.filter((r) => r.id !== s.dataset.tnSil);
          return ciz();
        }
        if (!b) return;
        if (b.dataset.tn === 'oynat') oynat();
        if (b.dataset.tn === 'ekle') {
          const metin = K.$('#tnMetin', root).value.trim();
          if (!metin) return K.fx.toast('O saatte ne olduğunu yaz.');
          const r = await K.cloud.add('tanismaan', { saat: K.$('#tnSaat', root).value || '22:00', metin, kim: K.$('#tnKim', root).value, foto: foto || '' });
          foto = null;
          r && rows.push(r);
          ciz();
        }
      });
    },
    async enter() {
      const [a, s] = await Promise.all([K.cloud.list('tanismaan', 120), K.cloud.list('tanismasil', 120)]);
      const sil = new Set(s.map((r) => r.data.ref));
      rows = a.filter((r) => !sil.has(r.id));
      ciz();
    },
  });
  K.specialHooks = (K.specialHooks || []).concat(() => (T.todayKey() === ACILIS ? [{ key: 'tanisma', icon: 'stars2', title: '🌙 Bir yıl önce bu gece tanıştık', text: 'Tanıştığımız Gece kapısı bugün açıldı. O geceyi saat saat yeniden yaşa.', room: 'tanisma', cta: 'Kapıyı aç', big: true }] : []));
})();
