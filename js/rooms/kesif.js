/* Oda: Şehir Keşif Kartları — aynı şehirdeyken her hafta bir keşif görevi: yeni bir kafe, bir müze, hiç girmediğiniz bir
   sokak. Haftanın kartı tarihten gelir (ikinizde aynı); "yaptık" deyip bir fotoğraf koyunca İlk Buluşma Pasaportu'na
   damga basılır. Ayrı şehirlerdeyken kartlar "kavuşunca" diye birikir; ikiniz ayrı ayrı kendi şehrinizde de yapabilirsiniz.
   Kayıtlar: kesif {kart, hafta, sehir, not, thumb} · (yazar) damga {name, place, day, note} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const KART = [
    ['☕', 'Hiç girmediğiniz bir kafe', 'Menüden ikinizin de bilmediği bir şey söyleyin.'],
    ['🏛️', 'Bir müze', 'En sevdiğiniz tek bir eseri seçin; neden onu seçtiğinizi birbirinize anlatın.'],
    ['🚶', 'Hiç girmediğiniz bir sokak', 'Haritaya bakmadan sağa-sola dönerek kaybolun.'],
    ['🌅', 'Gün batımı noktası', 'Şehrin en güzel gün batımını izleyebileceğiniz yeri bulun.'],
    ['📚', 'Bir sahaf ya da kitapçı', 'Birbirinize bir kitap seçin; ilk sayfasına bir not yazın.'],
    ['🥐', 'Bir fırının ilk ekmeği', 'Sabah erken kalkın, ilk çıkan ekmeği paylaşın.'],
    ['🎨', 'Bir sergi ya da galeri', 'İkinizin de hiç bilmediği bir sanatçı.'],
    ['🌳', 'Bir park ve bir bank', 'Bir saat telefonsuz oturun; geçenleri izleyin.'],
    ['🍲', 'Yerel bir lokanta', 'Sahibine "en sevdiğiniz yemek hangisi?" diye sorun ve onu yiyin.'],
    ['⛴️', 'Bir vapur ya da tekne', 'Martılara simit atmadan önce bir dilek tutun.'],
    ['🎶', 'Canlı müzik', 'Bir sokak müzisyeni ya da küçük bir konser.'],
    ['🕌', 'Tarihi bir yapı', 'Bir yüzyıl önce burada kimlerin buluştuğunu hayal edin.'],
    ['🛍️', 'Bir pazar', 'Birbirinize beş liradan / beş manattan ucuz bir hediye bulun.'],
    ['📸', 'Fotoğraf yürüyüşü', 'Bir saat boyunca yalnızca kırmızı şeylerin fotoğrafını çekin.'],
    ['🍦', 'Bir dondurmacı', 'Birbirinizin yerine tat seçin.'],
    ['🧭', 'Rastgele otobüs', 'Gelen ilk otobüse binip beş durak sonra inin.'],
    ['🌙', 'Gece yürüyüşü', 'Şehrin gece hâli: ışıklar, sesler, kokular.'],
    ['🎡', 'Bir yükseklik', 'Şehre yukarıdan bakabileceğiniz bir yer.'],
    ['🍵', 'Çay bahçesi', 'İki çay, bir tavla ya da bir sohbet.'],
    ['💌', 'Postane', 'Birbirinize kartpostal yazıp postalayın; eve gelince açın.'],
  ];
  let rows = [], root = null;

  const hafta = (t = Date.now()) => Math.floor((t + 3 * 864e5) / (7 * 864e5));
  const haftaninKarti = (h = hafta()) => K.hash('kesif:' + h) % KART.length;
  const yapildi = (k) => rows.filter((r) => r.data.kart === k);
  const ayni = () => K.kavusmaModu && K.kavusmaModu.ayniSehir && K.kavusmaModu.ayniSehir();

  async function tamamla(k, file) {
    const not = (K.$('#ksNot', root) && K.$('#ksNot', root).value.trim()) || '';
    const thumb = file ? await K.medya.image(file, 520, 0.76) : '';
    const sehir = ayni() ? 'birlikte' : K.isOwner() ? C.myCity : C.herCity;
    const r = await K.cloud.add('kesif', { kart: k, hafta: hafta(), sehir, not, thumb });
    if (!r) return;
    rows.push(r);
    if (ayni()) await K.cloud.add('damga', { name: KART[k][1], place: '', note: not || KART[k][2], day: T.todayKey() });
    K.stickers.award('kesif');
    K.fx.confetti({ count: 60, shapes: ['star'] });
    K.fx.toast(ayni() ? '🛂 Pasaporta damga basıldı!' : '🧭 Keşif tamam. Kavuşunca birlikte de yapın, pasaporta damga basılsın.');
    ciz();
  }
  function ciz() {
    if (!root || K.activeRoom !== 'kesif') return;
    const k = haftaninKarti();
    const [ik, ad, alt] = KART[k];
    const bu = rows.filter((r) => r.data.hafta === hafta());
    K.$('#ksIcerik', root).innerHTML = `<article class="ks-kart"><p class="card-eyebrow">Bu haftanın keşfi ${ayni() ? '· aynı şehirdesiniz!' : '· kavuşunca ya da kendi şehrinde'}</p><span class="ks-ikon">${ik}</span><h3>${K.esc(ad)}</h3><p>${K.esc(alt)}</p>
        ${bu.length ? `<p class="kk-tadildi">✓ ${bu.map((r) => K.esc(nameOf(r.who)) + (r.data.sehir === 'birlikte' ? ' (birlikte)' : ' · ' + K.esc(r.data.sehir))).join(', ')}</p>` : ''}
        <input class="input" id="ksNot" maxlength="120" placeholder="Nereye gittiniz? Kısa bir not"><div class="cl-dugmeler"><label class="btn">${A.ui('camera')} Yaptık! Fotoğraf koy<input type="file" accept="image/*" hidden data-ks-up="${k}"></label><button class="btn ghost small" type="button" data-ks-yap="${k}">Fotoğrafsız tamamla</button></div></article>
      <h3 class="an-baslik">Bütün keşifler <small class="muted">${new Set(rows.map((r) => r.data.kart)).size}/${KART.length}</small></h3>
      <div class="ks-izgara">${KART.map(([i, a], n) => { const y = yapildi(n); return `<div class="ks-mini ${y.length ? 'tamam' : ''} ${n === k ? 'su' : ''}">${y[0] && y[0].data.thumb ? `<img src="${y[0].data.thumb}" alt="">` : `<span>${i}</span>`}<small>${K.esc(a)}</small></div>`; }).join('')}</div>`;
  }
  K.room({
    id: 'kesif',
    wing: 'oyun',
    title: 'Şehir Keşif Kartları',
    sub: 'Her hafta bir keşif, her biri pasaporta damga',
    icon: 'compass',
    color: '#E0F8EC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Aynı şehirdeyken her hafta bir keşif: yeni bir kafe, bir müze, hiç girmediğiniz bir sokak. Birlikte yapılan her keşif pasaporta damga basar.</p></div><div id="ksIcerik"></div>`;
      el.addEventListener('change', (e) => {
        const f = e.target.closest('[data-ks-up]');
        f && f.files[0] && tamamla(+f.dataset.ksUp, f.files[0]);
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ks-yap]');
        b && tamamla(+b.dataset.ksYap, null);
      });
    },
    async enter() {
      rows = await K.cloud.list('kesif', 300);
      ciz();
    },
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!ayni() || rows.some((r) => r.data.hafta === hafta())) return [];
    const [ik, ad] = KART[haftaninKarti()];
    return [{ key: 'kesif', icon: 'compass', title: `${ik} Bu haftanın keşfi: ${ad}`, text: 'Aynı şehirdesiniz! Yapınca pasaporta damga basılır.', room: 'kesif', cta: 'Kartı aç', mini: true }];
  });
  K.on('cloud', async (ok) => ok && (rows = await K.cloud.list('kesif', 300)));
  K.kesif = { hafta, haftaninKarti, KART };
})();
