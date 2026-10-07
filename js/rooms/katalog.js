/* Oda: Tasarım Kataloğu (yalnızca kale sahibi) — Kale 4.0 "Pastel Pop"un bütün parçaları tek sayfada, canlı:
   renk belirteçleri, yazı ölçeği, düğmeler, cipler, bölümlü seçiciler, kartlar, oda kartı, rozetler, bildirim ve pencere,
   ikon ailesi (dokununca kendi hareketini yapar) ve yeni oda iskeleti. Yeni bir oda eklerken kale hep aynı dilde konuşsun diye. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;

  const RENK = [
    ['--k4-bg', 'Zemin'], ['--k4-card', 'Kart'], ['--k4-ink', 'Mürekkep · çizgi'], ['--k4-ink-2', 'İkincil yazı'],
    ['--k4-red', 'Fiyonk kırmızısı'], ['--k4-pink', 'Pembe'], ['--k4-pink-2', 'Açık pembe'], ['--k4-butter', 'Tereyağı'],
    ['--k4-sky', 'Gök'], ['--k4-mint', 'Nane'], ['--k4-lilac', 'Leylak'], ['--k4-peach', 'Şeftali'], ['--k4-gun', 'Günün rengi'], ['--k4-gun-2', 'Günün rengi (açık)'],
  ];
  const ISKELET = `(function () {
  'use strict';
  const K = window.K;
  K.room({
    id: 'yenioda',
    wing: 'kalp',            // sahip · mevsim · zaman · anilar · kalp · oyun · hazine
    title: 'Yeni Oda',
    sub: 'Tek satırlık alt başlık',
    icon: 'heart',           // K.art.ICONS içinden
    color: '#FFE3EC',
    init(el) {
      el.innerHTML = '<div class="room-intro"><p>Odanın ne işe yaradığı, iki cümle.</p></div>';
    },
    enter() {},
  });
})();
// Sonra: kale4.js NIYET listesinde doğru rafa ekle, dev.html'e script satırı, stickers.js'e pul.`;

  function ciz(el) {
    const cs = getComputedStyle(document.body);
    const ikonlar = Object.keys(A.ICONS);
    el.innerHTML = `<div class="room-intro"><p>Kale 4.0'ın bütün parçaları burada canlı duruyor. Yeni bir oda yaparken buradan seç; kale hep aynı dilde konuşsun.</p></div>
      <section class="kt-bolum"><h3>Renkler</h3><div class="kt-renkler">${RENK.map(([v, ad]) => `<div class="kt-renk"><i style="background:var(${v})"></i><b>${K.esc(ad)}</b><code>${v}</code><small>${K.esc(cs.getPropertyValue(v).trim() || '—')}</small></div>`).join('')}</div></section>
      <section class="kt-bolum"><h3>Yazı</h3>
        <p class="kt-yazi kt-y1">Eln'in Krallığı</p><p class="kt-yazi kt-y2">Bölüm başlığı · Fredoka 700</p><p class="kt-yazi kt-y3">Kart başlığı · Fredoka 600</p>
        <p class="card-eyebrow">ÜST ETİKET · FREDOKA 600 · ARALIKLI</p><p>Gövde yazısı Nunito: okunaklı, yuvarlak, sıcak. Uzun mektuplar bile yormaz.</p><p class="muted small">İkincil yazı · küçük</p><p class="hand">El yazısı · Caveat</p></section>
      <section class="kt-bolum"><h3>Düğmeler</h3><div class="kt-sira"><button class="btn" type="button">Asıl düğme</button><button class="btn soft" type="button">Yumuşak</button><button class="btn ghost" type="button">Hayalet</button><button class="btn small" type="button">Küçük</button><button class="btn" type="button" disabled>Kapalı</button></div></section>
      <section class="kt-bolum"><h3>Cipler ve seçiciler</h3><div class="kt-sira"><span class="chip">Cip</span><span class="chip on">Seçili cip</span></div>
        <div class="k3-seg kt-ornek" role="group"><button type="button" class="on">Bir</button><button type="button">İki</button><button type="button">Üç</button></div>
        <div class="k4-seg kt-ornek" role="group"><button type="button" aria-pressed="true">Hepsi</button><button type="button" aria-pressed="false">Fotoğraflar</button><button type="button" aria-pressed="false">Sesler</button></div>
        <label class="kt-ornek"><span class="muted small">Alan</span><input class="input" placeholder="Bir şey yaz..."></label></section>
      <section class="kt-bolum"><h3>Kartlar</h3><div class="kt-sira kt-kartlar">
        <article class="card kt-kart"><p class="card-eyebrow">KART</p><h3>Başlık</h3><p class="muted small">Kalın çizgi, sert gölge, 22px köşe.</p></article>
        <a class="k4-oda" href="#katalog" style="--c:#FFE3EC"><span class="k4-oda-ik">${A.icon('jar')}</span><b>Oda kartı</b><small>Raflarda böyle durur</small><em class="k4-rozet">3</em></a>
        <a class="k4-oda kucuk" href="#katalog" style="--c:#E1F3FF"><span class="k4-oda-ik">${A.icon('moon')}</span><b>Küçük kart</b><small></small><em class="k4-rozet yeni">Yeni</em></a></div></section>
      <section class="kt-bolum"><h3>Geri bildirim</h3><div class="kt-sira"><button class="btn soft small" type="button" data-kt="toast">Bildirim göster</button><button class="btn soft small" type="button" data-kt="modal">Pencere aç</button><button class="btn soft small" type="button" data-kt="kutla">Kutlama</button></div></section>
      <section class="kt-bolum"><h3>İkon ailesi <small>${ikonlar.length} ikon · dokun, oynasın</small></h3><div class="kt-ikonlar">${ikonlar.map((n) => `<button type="button" class="kt-ikon" title="${n}">${A.icon(n)}<small>${n}</small></button>`).join('')}</div></section>
      <section class="kt-bolum"><h3>Kitty</h3><div class="kt-sira kt-kittyler">${['', 'is-happy', 'is-sleep', 'is-wink'].map((c) => `<div>${A.kitty({ cls: c })}<small>${c || 'normal'}</small></div>`).join('')}</div></section>
      <section class="kt-bolum"><h3>Açılış süresi</h3>${(() => {
        const l = K.kale4 && K.kale4.acilis ? K.kale4.acilis() : [];
        if (!l.length) return '<p class="muted small">Henüz ölçülmedi.</p>';
        const ort = Math.round(l.reduce((a, x) => a + x.boya, 0) / l.length);
        return `<p><b>${(ort / 1000).toFixed(2)} sn</b> <span class="muted small">· son ${l.length} açılışın ortalaması (sayfa yüklenmesinden ana salonun çizilmesine)</span></p><div class="kt-sure">${l.map((x) => `<i style="height:${Math.min(100, x.boya / 40)}%" title="${x.boya} ms"></i>`).join('')}</div>`;
      })()}</section>
      <section class="kt-bolum"><h3>Yeni oda iskeleti</h3><pre class="kt-kod">${K.esc(ISKELET)}</pre><button class="btn ghost small" type="button" data-kt="kopya">Kopyala</button></section>`;
  }
  K.room({
    id: 'katalog',
    wing: 'sahip',
    title: 'Tasarım Kataloğu',
    sub: 'Kale 4.0\'ın bütün parçaları',
    icon: 'swatch',
    color: '#FFF3C4',
    hidden: () => !K.isOwner(),
    init(el) {
      ciz(el);
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kt]');
        if (!b) return;
        const k = b.dataset.kt;
        if (k === 'toast') K.fx.toast('<b>Bildirim</b> · üstten kayar, kendiliğinden gider.', { icon: A.icon('heart') });
        if (k === 'modal') K.ui.modal({ label: 'Örnek', html: '<h2>Pencere</h2><p>Telefonda alttan açılır, masaüstünde ortada durur.</p>' });
        if (k === 'kutla') {
          const r = b.getBoundingClientRect();
          K.fx.burst(r.left + r.width / 2, r.top, { count: 18 });
        }
        if (k === 'kopya') navigator.clipboard && navigator.clipboard.writeText(ISKELET).then(() => K.fx.toast('İskelet kopyalandı.'), () => {});
      });
    },
    enter() {
      K.stickers.award('katalog');
    },
  });
})();
