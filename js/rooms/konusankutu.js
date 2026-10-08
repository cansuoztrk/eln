/* Oda: Konuşan Kutu — kavuşma kutusundaki her nesneye bir NFC etiketi ya da küçük bir QR: telefonu dokundurunca o nesnenin
   hikâyesi ve sesi açılır. Kale sahibi her nesne için bir hikâye yazar, ses kaydeder; her nesnenin kendi adresi olur
   (…/#esya-KİMLİK). Etiket sayfası tek PNG olarak iner (QR + nesnenin adı); NFC için adres "NFC Tools" gibi bir
   uygulamayla etikete yazılır. Elnoş odayı kutu verildikten sonra görür; etiketi okuttuğunda ise her zaman açılır.
   Kayıtlar: kutuesya {ad, hikaye, audio, emoji} · kutuesyasil {ref} · (okunur) kutu {given} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], verildi = false, root = null;
  const adres = (id) => `${location.origin}${location.pathname}#esya-${id}`;

  async function yukle() {
    const [a, s, k] = await Promise.all([K.cloud.list('kutuesya', 100), K.cloud.list('kutuesyasil', 100), K.cloud.list('kutu', 20)]);
    const sil = new Set(s.map((r) => r.data.ref));
    rows = a.filter((r) => !sil.has(r.id));
    const son = k.sort((x, y) => y.at - x.at)[0];
    verildi = Boolean(son && son.data.given);
  }
  async function ac(id) {
    if (!rows.length && K.cloud && K.cloud.enabled) await yukle();
    const r = rows.find((x) => x.id === id);
    if (!r) return K.fx.toast('Bu nesnenin hikâyesi bulunamadı.');
    const m = K.ui.modal({
      label: r.data.ad,
      cls: 'kk-esya',
      html: `<p class="kk-esya-emoji">${K.esc(r.data.emoji || '🎁')}</p><p class="card-eyebrow">Kutudan bir nesne</p><h2>${K.esc(r.data.ad)}</h2>
        <p class="hand kk-esya-hikaye">${K.yazitipi ? K.yazitipi.html(r.data.hikaye, r.who) : K.esc(r.data.hikaye)}</p>${r.data.audio ? '<button class="btn soft" type="button" data-ke-cal>🔊 Tekrar dinle</button>' : ''}<p class="muted small">— ${K.esc(nameOf(r.who))}</p>`,
    });
    if (r.data.audio) setTimeout(() => K.medya.cal(r.data.audio), 500);
    m.el.addEventListener('click', (e) => e.target.closest('[data-ke-cal]') && K.medya.cal(r.data.audio));
    K.stickers.award('konusankutu');
  }
  function hashBak() {
    const m = location.hash.match(/^#esya-([\w-]+)$/);
    if (!m) return;
    const id = m[1];
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => ac(id), 600);
  }
  async function etiketler() {
    const l = rows;
    if (!l.length) return;
    const hucre = 600, sut = 3, sat = Math.ceil(l.length / sut);
    const c = document.createElement('canvas');
    c.width = sut * hucre;
    c.height = sat * (hucre + 90);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < l.length; i++) {
      const r = l[i], x = (i % sut) * hucre, y = Math.floor(i / sut) * (hucre + 90);
      const svg = K.qr.svg(adres(r.id), { px: 8, fg: '#3A1F2D', bg: '#fff' });
      await new Promise((res) => {
        const im = new Image();
        im.onload = () => (g.drawImage(im, x + 60, y + 40, hucre - 120, hucre - 120), res());
        im.onerror = res;
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
      g.fillStyle = '#3A1F2D';
      g.font = '600 40px Fredoka, Nunito, sans-serif';
      g.textAlign = 'center';
      g.fillText(`${r.data.emoji || '🎁'} ${r.data.ad}`, x + hucre / 2, y + hucre + 30, hucre - 40);
      g.strokeStyle = '#E8D5DE';
      g.setLineDash([12, 10]);
      g.strokeRect(x + 10, y + 10, hucre - 20, hucre + 60);
      g.setLineDash([]);
    }
    K.download(c.toDataURL('image/png'), 'konusan-kutu-etiketleri.png');
  }
  function ciz() {
    if (!root || K.activeRoom !== 'konusankutu') return;
    const sahip = K.isOwner();
    K.$('#keIcerik', root).innerHTML = `<div class="ke-liste">${rows.map((r) => `<article class="card ke-esya"><span class="kk-emoji">${K.esc(r.data.emoji || '🎁')}</span><div><h3>${K.esc(r.data.ad)}</h3><p class="muted small">${K.esc(r.data.hikaye).slice(0, 90)}${r.data.hikaye.length > 90 ? '…' : ''}${r.data.audio ? ' · 🔊 sesli' : ''}</p>
        <div class="cl-dugmeler"><button class="btn soft small" type="button" data-ke-ac="${r.id}">Aç</button>${sahip ? `<button class="btn ghost small" type="button" data-ke-kopya="${r.id}">NFC adresini kopyala</button><button class="linkish" type="button" data-ke-sil="${r.id}">sil</button>` : ''}</div></div></article>`).join('') || '<p class="muted center">Kutuda henüz konuşan bir nesne yok.</p>'}</div>
      ${sahip ? `<section class="card ke-yeni"><p class="card-eyebrow">Kutuya bir nesne ekle</p><div class="hc-alanlar"><input class="input" id="keEmoji" maxlength="4" value="🎁" aria-label="Simge"><input class="input" id="keAd" maxlength="40" placeholder="Nesne: ör. Kız Kulesi magneti"></div>
          <textarea class="textarea" id="keHikaye" rows="3" maxlength="600" placeholder="Bu nesnenin hikâyesi: nereden aldın, neden bu?"></textarea>
          <div class="cl-dugmeler"><button class="btn ghost small" type="button" data-ke="ses">🎙️ Ses ekle (30 sn)</button><button class="btn" type="button" data-ke="ekle">Kutuya koy</button></div></section>
        ${rows.length ? '<button class="btn soft" type="button" data-ke="etiket">🏷️ Etiket sayfasını indir (QR)</button><p class="muted small">NFC etiketi kullanacaksan: "NFC Tools" uygulamasında "Yaz → URL" seç, nesnenin adresini yapıştır ve etiketi telefonun arkasına dokundur.</p>' : ''}` : ''}`;
  }
  let ses = null;
  K.room({
    id: 'konusankutu',
    wing: 'kalp',
    title: 'Konuşan Kutu',
    sub: 'Kutudaki her nesnenin kendi sesi',
    icon: 'nfc',
    color: '#FFD0E1',
    hidden: () => !K.cloud || !K.cloud.enabled || (!K.isOwner() && !verildi),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kavuşma kutusundaki her nesnenin üstünde küçük bir etiket var. Telefonu dokundurunca o nesnenin hikâyesi açılır ve ${K.esc(nameOf('me'))}'ın sesi anlatır.</p></div><div id="keIcerik"></div>`;
      el.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-ke-ac]');
        if (a) return ac(a.dataset.keAc);
        const k = e.target.closest('[data-ke-kopya]');
        if (k) return navigator.clipboard && navigator.clipboard.writeText(adres(k.dataset.keKopya)).then(() => K.fx.toast('Adres kopyalandı; NFC etiketine yaz.'), () => K.fx.toast(adres(k.dataset.keKopya)));
        const s = e.target.closest('[data-ke-sil]');
        if (s) {
          await K.cloud.add('kutuesyasil', { ref: s.dataset.keSil });
          rows = rows.filter((r) => r.id !== s.dataset.keSil);
          return ciz();
        }
        const b = e.target.closest('[data-ke]');
        if (!b) return;
        if (b.dataset.ke === 'ses') {
          const r = await K.medya.kaydet(b, 30);
          r && ((ses = r), (b.textContent = '✓ Ses hazır'));
        }
        if (b.dataset.ke === 'etiket') etiketler();
        if (b.dataset.ke === 'ekle') {
          const ad = K.$('#keAd', root).value.trim(), hikaye = K.$('#keHikaye', root).value.trim();
          if (!ad || !hikaye) return K.fx.toast('Nesnenin adını ve hikâyesini yaz.');
          const r = await K.cloud.add('kutuesya', { ad, hikaye, audio: ses ? ses.audio : '', emoji: K.$('#keEmoji', root).value.trim() || '🎁' });
          ses = null;
          r && rows.push(r);
          K.stickers.award('konusankutuhazir');
          ciz();
        }
      });
    },
    async enter() {
      await yukle();
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    await yukle();
    hashBak();
  });
  window.addEventListener('hashchange', hashBak);
  K.konusankutu = { ac, adres };
})();
