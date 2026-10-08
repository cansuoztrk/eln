/* Oda: Masada Kitty (AR) — Kitty'yi, kalenin minyatür maketini ya da kavuşma günü için havalimanı tabelasını telefonun
   kamerasıyla gerçek masaya koyar. iPhone/iPad: AR Quick Look (<a rel="ar"> + .usdz), Android: Scene Viewer (.glb niyet
   adresi), masaüstü: "iPhone'da çalışır" notu, telefona geçiş QR'ı ve indirme bağlantıları. Modeller assets/ar/ altında
   (tools/ar_model.py üretir). Kayıt yok, canlı olay yok · pullar: arkitty (ilk giriş), arkittymasa (AR'da açmayı denemek) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const DIR = 'assets/ar/';
  const MODELS = [
    { id: 'kitty', eyebrow: 'Minik dost', size: '15 cm', title: 'Kitty', text: () => 'Fiyonklu, pembe elbiseli minik Kitty. Kahvenin yanına, defterinin üstüne, nereye istersen.' },
    { id: 'kale', eyebrow: 'Minyatür maket', size: '25 cm', title: 'Kale maketi', text: () => 'Kalemizin yedi kanadı, yedi pastel kule. Kapının üstündeki kalbi bul, etrafında bir tur at.' },
    {
      id: 'tabela',
      eyebrow: 'Kavuşma günü için',
      size: '40 cm',
      title: 'Havalimanı tabelası',
      text: () => {
        const n = nameOf(other());
        return `Kavuşma günü havalimanında, kalabalığın içinde ${n ? K.esc(K.ek(n, 'i')) : 'onu'} bu tabelayla karşıla. Provası şimdiden masanda.`;
      },
    },
  ];
  let root = null;

  // Hangi yol: 'ios' (AR Quick Look), 'android' (Scene Viewer), 'desk' (destek yok)
  function device() {
    try {
      const a = document.createElement('a');
      if (a.relList && a.relList.supports && a.relList.supports('ar')) return 'ios';
    } catch (e) {
      /* eski tarayıcı */
    }
    return /android/i.test(navigator.userAgent) ? 'android' : 'desk';
  }
  const abs = (p) => new URL(p, location.href).href;
  const quickLook = (m) => `${DIR}${m.id}.usdz#allowsContentScaling=1`;
  function sceneViewer(m) {
    const back = location.href.split('#')[0] + '#arkitty';
    return (
      'intent://arvr.google.com/scene-viewer/1.0?file=' + encodeURIComponent(abs(`${DIR}${m.id}.glb`)) +
      '&mode=ar_preferred&title=' + encodeURIComponent(m.title) +
      '#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=' +
      encodeURIComponent(back) + ';end;'
    );
  }

  function card(m, dev) {
    const img = `<img src="${DIR}${m.id}.png" alt="" width="600" height="600" decoding="async">`;
    const label = `${K.esc(m.title)} · masana koy`;
    // Quick Look: bağlantının ilk çocuğu img olmalı; Safari köşesine kendi AR rozetini koyar
    const stage =
      dev === 'ios'
        ? `<a class="ak-sahne" rel="ar" href="${quickLook(m)}" data-ak-ar="${m.id}" aria-label="${label}">${img}</a>`
        : dev === 'android'
        ? `<a class="ak-sahne" href="${K.esc(sceneViewer(m))}" data-ak-ar="${m.id}" aria-label="${label}">${img}</a>`
        : `<div class="ak-sahne">${img}</div>`;
    const action =
      dev === 'ios'
        ? `<button type="button" class="btn red ak-koy" data-ak-koy="${m.id}">${A.ui('camera')} Masana koy</button>`
        : dev === 'android'
        ? `<a class="btn red ak-koy" href="${K.esc(sceneViewer(m))}" data-ak-ar="${m.id}">${A.ui('camera')} Masana koy</a>`
        : `<a class="btn soft small" href="${DIR}${m.id}.usdz" download>${A.ui('download')} USDZ indir</a><a class="btn ghost small" href="${DIR}${m.id}.glb" download>${A.ui('download')} GLB indir</a>`;
    return `<article class="ak-kart ak-${m.id}" data-ak="${m.id}">
      ${stage}
      <span class="ak-boy" aria-hidden="true">${K.esc(m.size)}</span>
      <p class="card-eyebrow">${K.esc(m.eyebrow)}</p>
      <h3 class="ak-ad">${K.esc(m.title)}</h3>
      <p class="ak-metin">${m.text()}</p>
      <div class="ak-eylem">${action}</div>
    </article>`;
  }

  function steps(dev) {
    const s =
      dev === 'android'
        ? ['"Masana koy"a dokun.', 'Telefonu masanın üstünde yavaşça gezdir; yüzeyi bulunca model yerine oturur.', 'İki parmakla büyüt ya da döndür. Telefonunda "Google Play Hizmetleri (AR)" olmalı.']
        : ['"Masana koy"a dokun.', 'Telefonu masanın üstünde yavaşça gezdir; yüzeyi bulunca model yerine oturur.', 'İki parmakla büyüt, döndür, sonra deklanşörle fotoğrafını çek ve bana gönder.'];
    return `<ol class="ak-adim">${s.map((x) => `<li>${K.esc(x)}</li>`).join('')}</ol>`;
  }

  function render() {
    if (!root || K.activeRoom !== 'arkitty') return;
    const dev = device();
    root.classList.toggle('ak-masaustu', dev === 'desk');
    const standalone = dev === 'ios' && window.navigator.standalone;
    const note =
      dev === 'desk'
        ? `<section class="card ak-not">
            <div class="ak-qr">${K.qr ? K.qr.svg(K.roomUrl('arkitty'), { px: 132, fg: '#3A1F2D', label: 'Bu odayı telefonda aç' }) : ''}</div>
            <div><p class="card-eyebrow">Bu özellik iPhone'da çalışır</p>
            <p>Kitty'yi masana koymak için bu odayı iPhone ya da iPad'de Safari'yle aç (QR'ı okutabilirsin). Android'de de çoğu telefonda çalışır. Bilgisayarda modeli indirip bakabilirsin.</p></div>
          </section>`
        : `<section class="card ak-nasil"><p class="card-eyebrow">Nasıl?</p>${steps(dev)}${standalone ? '<p class="muted small">Ana ekrandaki kalede açılmazsa bu sayfayı Safari\'de aç; Quick Look orada her zaman çalışır.</p>' : ''}</section>`;
    root.innerHTML = `<div class="room-intro"><p>Kitty'yi, kalemizin minyatürünü ya da kavuşma günü tabelasını telefonunun kamerasıyla masana koy. Etrafında dolaş, büyüt, fotoğrafını çek.</p></div>
      <div class="ak-liste">${MODELS.map((m) => card(m, dev)).join('')}</div>
      ${note}`;
  }

  function tried(id) {
    K.stickers.award('arkittymasa');
    K.store.set('arkittySon', id);
  }

  K.room({
    id: 'arkitty',
    wing: 'oyun',
    title: 'Masada Kitty',
    sub: 'Kitty, kale ve tabela masana gelsin',
    icon: 'star',
    color: '#FDE7F0',
    init(el) {
      root = el;
      el.addEventListener('click', (e) => {
        const koy = e.target.closest('[data-ak-koy]');
        if (koy) {
          // iOS: kartın rel="ar" bağlantısına tıklamak Quick Look'u açar (img ilk çocuk olduğu sürece)
          const a = K.$(`a[rel="ar"][data-ak-ar="${koy.dataset.akKoy}"]`, el);
          if (a) a.click();
          return;
        }
        const ar = e.target.closest('[data-ak-ar]');
        if (ar) tried(ar.dataset.akAr);
      });
    },
    enter() {
      render();
      K.stickers.award('arkitty');
    },
  });

  K.arkitty = { device, sceneViewer: (id) => sceneViewer(MODELS.find((m) => m.id === id)), models: () => MODELS.map((m) => m.id) };
})();
