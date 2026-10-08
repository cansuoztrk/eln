/* Oda: Neredeyiz? — biriniz bir fotoğraf koyar ve haritada nerede çekildiğini işaretler; öbürü fotoğrafa bakıp haritada
   tahmin eder. Yakınlığa göre puan (aynı mahalle 5000, aynı şehir ~4000, 500 km ötesi birkaç yüz). Tahminden sonra iki
   iğne ve aradaki çizgi görünür. Haritayı parmakla kaydır, iki parmakla yakınlaştır, bölge düğmeleriyle atla.
   Kayıtlar: nerede {thumb, full, lat, lng, ipucu, yer} · neredeimg {img} · neredetahmin {ref, lat, lng, km, puan} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let sorular = [], tahminler = [], root = null, harita = null, secim = null, mod = null, yeni = null;

  const puan = (km) => Math.max(0, Math.round(5000 * Math.exp(-km / 350)));
  const tahminOf = (ref) => tahminler.find((t) => t.data.ref === ref);
  const bekleyen = () => sorular.filter((s) => s.who === other() && !tahminOf(s.id)).sort((a, b) => a.at - b.at)[0];
  const toplam = (w) => tahminler.filter((t) => t.who === w).reduce((s, t) => s + t.data.puan, 0);

  function haritaKur(opt) {
    const el = K.$('#nrHarita', root);
    harita = K.dunya.harita(el, Object.assign({ oran: 1.1, onTap: (la, ln) => ((secim = [la, ln]), isaretle()) }, opt));
  }
  function isaretle() {
    if (!harita) return;
    harita.guncelle(secim ? [{ lat: secim[0], lng: secim[1], renk: mine() === 'me' ? '#5AA9E6' : '#FF6FA3', etiket: 'Senin işaretin' }] : [], []);
    const b = K.$('[data-nr="onay"]', root);
    b && (b.disabled = !secim);
  }
  async function tahminEt() {
    const s = mod;
    if (!s || !secim) return;
    const km = K.dunya.km([s.data.lat, s.data.lng], secim);
    const p = puan(km);
    const r = await K.cloud.add('neredetahmin', { ref: s.id, lat: secim[0], lng: secim[1], km, puan: p });
    r && tahminler.push(r);
    K.stickers.award('neredeyiz');
    p >= 4500 && K.stickers.award('neredeyiz5000');
    K.ping(`📍 ${K.meName()} fotoğrafını ${km} km farkla buldu`, `${p} puan. Sıra sende: bir fotoğraf koy.`, ['round_pushpin'], { click: K.roomUrl('neredeyiz') });
    sonuc(s, r);
  }
  function sonuc(s, t) {
    secim = null;
    mod = null;
    K.$('#nrIcerik', root).innerHTML = `<section class="card nr-sonuc"><p class="card-eyebrow">Sonuç</p><p class="nr-puan"><b class="tnum">${t.data.puan}</b> puan</p><p>${t.data.km < 1 ? 'Tam yerinde!' : `${K.num(t.data.km)} km uzaktaydın.`}${s.data.yer ? ` Burası: <b>${K.esc(s.data.yer)}</b>.` : ''}</p><button class="btn" type="button" data-nr="ana">Tamam</button></section><div id="nrHarita"></div>`;
    haritaKur({ ilk: [[s.data.lat, s.data.lng], [t.data.lat, t.data.lng]] });
    harita.odakla([[s.data.lat, s.data.lng], [t.data.lat, t.data.lng]], 0.6);
    harita.guncelle([{ lat: s.data.lat, lng: s.data.lng, renk: '#E3174D', etiket: 'Fotoğraf burada' }, { lat: t.data.lat, lng: t.data.lng, renk: t.who === 'me' ? '#5AA9E6' : '#FF6FA3', etiket: 'Tahmin' }], [[[s.data.lat, s.data.lng], [t.data.lat, t.data.lng], '#3A1F2D']]);
  }
  async function oyna(s) {
    mod = s;
    secim = null;
    const src = s.data.full ? (await K.medya.rowUrl(s.data.full, 'img')) || s.data.thumb : s.data.thumb;
    K.$('#nrIcerik', root).innerHTML = `<section class="card nr-soru"><img class="nr-foto" src="${src}" alt="Nerede çekildi?">${s.data.ipucu ? `<p class="muted small">İpucu: ${K.esc(s.data.ipucu)}</p>` : ''}<p class="card-eyebrow">Haritada nerede çekildiğini işaretle</p></section>
      <div id="nrHarita"></div><div class="cl-dugmeler"><button class="btn ghost small" type="button" data-nr="ana">Vazgeç</button><button class="btn" type="button" data-nr="onay" disabled>Tahminim bu</button></div>`;
    haritaKur({});
    isaretle();
  }
  function koy() {
    yeni = { file: null };
    secim = null;
    K.$('#nrIcerik', root).innerHTML = `<section class="card nr-koy"><p class="card-eyebrow">1 · Fotoğraf</p><label class="btn soft">${A.ui('camera')} Fotoğraf seç<input type="file" accept="image/*" hidden data-nr-foto></label><img class="nr-foto" id="nrOnizle" hidden alt="">
      <p class="card-eyebrow">2 · Haritada yerini işaretle</p><div id="nrHarita"></div>
      <input class="input" id="nrYer" maxlength="60" placeholder="Yerin adı (tahminden sonra görünür)"><input class="input" id="nrIpucu" maxlength="80" placeholder="İpucu (isteğe bağlı)">
      <div class="cl-dugmeler"><button class="btn ghost small" type="button" data-nr="ana">Vazgeç</button><button class="btn" type="button" data-nr="gonder">Gönder</button></div></section>`;
    haritaKur({});
  }
  async function gonder() {
    if (!yeni || !yeni.file) return K.fx.toast('Önce bir fotoğraf seç.');
    if (!secim) return K.fx.toast('Haritada fotoğrafın çekildiği yere dokun.');
    const [full, thumb] = await Promise.all([K.medya.image(yeni.file, 1280, 0.8), K.medya.image(yeni.file, 480, 0.74)]);
    const big = await K.cloud.add('neredeimg', { img: full });
    const r = big && (await K.cloud.add('nerede', { thumb, full: big.id, lat: secim[0], lng: secim[1], yer: K.$('#nrYer', root).value.trim(), ipucu: K.$('#nrIpucu', root).value.trim() }));
    if (!r) return K.fx.toast('Gönderilemedi.');
    sorular.push(r);
    K.ping(`📍 Neredeyim? ${K.meName()} bir fotoğraf gönderdi`, 'Haritada nerede çekildiğini tahmin et.', ['round_pushpin'], { click: K.roomUrl('neredeyiz') });
    K.fx.toast('📍 Gönderildi. Tahmin edince puanını göreceksin.');
    yeni = null;
    ciz();
  }
  function ciz() {
    if (!root || K.activeRoom !== 'neredeyiz') return;
    harita = null;
    const b = bekleyen();
    const benimBekleyen = sorular.filter((s) => s.who === mine() && !tahminOf(s.id)).length;
    const gecmis = tahminler.slice().sort((a, c) => c.at - a.at).slice(0, 12);
    K.$('#nrIcerik', root).innerHTML = `<div class="nr-skor"><div><b class="tnum">${K.num(toplam('me'))}</b><small>${K.esc(nameOf('me'))}</small></div><div><b class="tnum">${K.num(toplam('her'))}</b><small>${K.esc(nameOf('her'))}</small></div></div>
      ${b ? `<button type="button" class="card nr-bekleyen" data-nr="oyna"><img src="${b.data.thumb}" alt=""><div><p class="card-eyebrow">${K.esc(nameOf(other()))} soruyor</p><b>Bu fotoğraf nerede çekildi?</b><small>Tahmin et ›</small></div></button>` : `<p class="muted center">${K.esc(nameOf(other()))}'dan bekleyen fotoğraf yok.</p>`}
      <button class="btn" type="button" data-nr="koy">📍 Ben bir fotoğraf sorayım</button>${benimBekleyen ? `<p class="muted small center">${benimBekleyen} fotoğrafın tahmin bekliyor.</p>` : ''}
      ${gecmis.length ? `<h3 class="an-baslik">Son tahminler</h3><ul class="nr-gecmis">${gecmis.map((t) => { const s = sorular.find((x) => x.id === t.data.ref); return `<li>${s ? `<img src="${s.data.thumb}" alt="">` : ''}<div><b>${K.esc(nameOf(t.who))}: ${t.data.puan} puan</b><small>${K.num(t.data.km)} km${s && s.data.yer ? ' · ' + K.esc(s.data.yer) : ''}</small></div></li>`; }).join('')}</ul>` : ''}`;
  }
  K.room({
    id: 'neredeyiz',
    wing: 'oyun',
    title: 'Neredeyiz?',
    sub: 'Bir fotoğraf, bir harita, ne kadar yakınsın?',
    icon: 'pin',
    color: '#E1F3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (bekleyen() ? '1' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Biriniz bir fotoğraf koyar ve nerede çekildiğini işaretler; öbürü haritada tahmin eder. Ne kadar yakınsa o kadar puan.</p></div><div id="nrIcerik"></div>`;
      el.addEventListener('change', (e) => {
        const f = e.target.closest('[data-nr-foto]');
        if (!f || !f.files[0] || !yeni) return;
        yeni.file = f.files[0];
        const im = K.$('#nrOnizle', root);
        im.src = URL.createObjectURL(f.files[0]);
        im.hidden = false;
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-nr]');
        if (!b) return;
        const k = b.dataset.nr;
        if (k === 'oyna') oyna(bekleyen());
        if (k === 'koy') koy();
        if (k === 'ana') (mod = null), (yeni = null), ciz();
        if (k === 'onay') tahminEt();
        if (k === 'gonder') gonder();
      });
    },
    async enter() {
      await K.dunya.load().catch(() => {});
      [sorular, tahminler] = await Promise.all([K.cloud.list('nerede', 300), K.cloud.list('neredetahmin', 300)]);
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [sorular, tahminler] = await Promise.all([K.cloud.list('nerede', 300), K.cloud.list('neredetahmin', 300)]);
    K.cloud.on('nerede', (r) => sorular.some((x) => x.id === r.id) || (sorular.push(r), !mod && !yeni && ciz()));
    K.cloud.on('neredetahmin', (r) => tahminler.some((x) => x.id === r.id) || (tahminler.push(r), !mod && !yeni && ciz()));
  });
  K.neredeyiz = { puan };
})();
