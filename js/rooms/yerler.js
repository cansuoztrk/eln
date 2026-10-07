/* Oda: Seni Düşündüğüm Yerler — bir yerde onu düşündüğünde tek dokunuşla oraya bir kalp bırakırsın (telefonun konumu,
   istersen yerin adı ve bir cümle). Onun haritası zamanla şehrinin içinden geçen küçük kalplerle dolar: "Burada,
   Kadıköy iskelesinde seni düşündüm." Harita dış bir servis kullanmaz: kalpler şehrin simge yapısına (Kız Kulesi,
   Qız Qalası) göre yerleştirilir. Konum yalnız şifreli kayıtta durur. Kayıtlar: yer {lat, lng, place, note} */
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
  const REF = { me: [41.0211, 29.0041, 'Kız Kulesi'], her: [40.3664, 49.8372, 'Qız Qalası'] };
  let rows = [], loaded = false, root = null, tab = 'onun';

  function plot(list, w) {
    const ref = REF[w];
    const pts = list.map((r) => ({ r, lat: r.data.lat, lng: r.data.lng })).filter((p) => isFinite(p.lat) && isFinite(p.lng) && Math.abs(p.lat - ref[0]) < 3 && Math.abs(p.lng - ref[1]) < 3);
    const all = pts.concat([{ lat: ref[0], lng: ref[1], ref: true }]);
    const k = Math.cos((ref[0] * Math.PI) / 180);
    const xs = all.map((p) => p.lng * k), ys = all.map((p) => -p.lat);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY, 0.02);
    const sc = 280 / span;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const P = (p) => [160 + (p.lng * k - cx) * sc, 160 + (-p.lat - cy) * sc];
    const km = (span * 111).toFixed(span * 111 < 10 ? 1 : 0);
    const r0 = P({ lat: ref[0], lng: ref[1] });
    return `<svg class="yr-svg" viewBox="0 0 320 320" role="img" aria-label="${pts.length} kalp">
      <defs><radialGradient id="yrG"><stop offset="0" stop-color="#ffe1ec"/><stop offset="1" stop-color="#fff7fb"/></radialGradient></defs>
      <circle cx="160" cy="160" r="156" fill="url(#yrG)" stroke="#ffd0e1" stroke-width="2"/>
      ${[50, 100, 150].map((r) => `<circle cx="160" cy="160" r="${r}" fill="none" stroke="#ffd0e1" stroke-dasharray="2 5"/>`).join('')}
      <text x="160" y="22" text-anchor="middle" class="yr-yon">K</text>
      <g transform="translate(${r0[0].toFixed(1)} ${r0[1].toFixed(1)})" class="yr-ref"><path d="M-6 8 L-4 -6 L0 -12 L4 -6 L6 8 Z"/><text y="22" text-anchor="middle">${K.esc(ref[2])}</text></g>
      ${pts.map((p, i) => {
        const [x, y] = P(p);
        return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="yr-kalp" data-yr="${p.r.id}" tabindex="0" role="button" style="--d:${i * 60}ms"><path d="M0 6 C-10 -2 -9 -11 -3.5 -11 C-1.3 -11 0 -9 0 -7.5 C0 -9 1.3 -11 3.5 -11 C9 -11 10 -2 0 6 Z"/></g></g>`;
      }).join('')}
      <text x="300" y="306" text-anchor="end" class="yr-olcek">≈ ${km} km</text>
    </svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'yerler') return;
    const w = tab === 'onun' ? other() : mine();
    const list = rows.filter((r) => r.who === w).sort((a, b) => b.at - a.at);
    K.$$('[data-yr-tab]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.yrTab === tab)));
    K.$('#yrHarita', root).innerHTML = list.length ? plot(list, w) : `<p class="muted center yr-bos">${tab === 'onun' ? `${K.esc(nameOf(other()))} henüz bir kalp bırakmadı. Seni düşündüğü ilk yer burada belirecek.` : 'Onu düşündüğün bir yerde aşağıdaki düğmeye bas; ilk kalp burada belirecek.'}</p>`;
    K.$('#yrListe', root).innerHTML = list.map((r) => `<li data-yr="${r.id}"><span>📍</span><div><b>${K.esc(r.data.place || 'Bir yerde')}</b>${r.data.note ? `<p class="hand">${K.esc(r.data.note)}</p>` : ''}<small>${K.esc(T.fmt(new Date(r.at)))} · ${K.esc(K.ago(r.at))}</small></div></li>`).join('');
    K.$('#yrSay', root).textContent = `${rows.filter((r) => r.who === other()).length} kalp onun, ${rows.filter((r) => r.who === mine()).length} kalp senin`;
  }
  function focusRow(id) {
    K.$$('.yr-on', root).forEach((x) => x.classList.remove('yr-on'));
    K.$$(`[data-yr="${id}"]`, root).forEach((x) => x.classList.add('yr-on'));
    const li = K.$(`#yrListe [data-yr="${id}"]`, root);
    li && li.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'nearest' });
  }
  function drop() {
    if (!navigator.geolocation) return K.fx.toast('Bu telefonda konum alınamıyor.');
    const st = K.$('#yrSt', root);
    st.textContent = 'Konumun alınıyor...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        st.textContent = '';
        const lat = +pos.coords.latitude.toFixed(4), lng = +pos.coords.longitude.toFixed(4);
        const m = K.ui.modal({
          label: 'Burada seni düşündüm',
          cls: 'yr-sheet',
          html: `<p class="card-eyebrow">📍 Burada seni düşündüm</p><h2>Bu yerin bir adı var mı?</h2>
            <input class="input" id="yrYer" maxlength="60" placeholder="Örneğin: Kadıköy iskelesi">
            <textarea class="input" id="yrNot" maxlength="140" rows="2" placeholder="Bir cümle (istersen)"></textarea>
            <div class="row"><button type="button" class="btn red" data-yr-kaydet>💗 Kalbi bırak</button></div>`,
        });
        m.body.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-yr-kaydet]');
          if (!b) return;
          b.disabled = true;
          const place = (K.$('#yrYer', m.body).value || '').trim().slice(0, 60), note = (K.$('#yrNot', m.body).value || '').trim().slice(0, 140);
          const r = await K.cloud.add('yer', { lat, lng, place, note });
          if (!r) return (b.disabled = false), K.fx.toast('Kaydedilemedi.');
          rows.some((x) => x.id === r.id) || rows.push(r);
          m.close();
          tab = 'benim';
          render();
          K.audio.sfx.sparkle();
          K.fx.burst(window.innerWidth / 2, window.innerHeight / 2, { count: 18 });
          K.stickers.award('yerler');
          K.ping(place ? `📍 ${K.meName()} seni düşündü: ${place}` : `📍 ${K.meName()} seni bir yerde düşündü`, note || 'Haritana küçük bir kalp düştü.', ['round_pushpin'], { click: K.roomUrl('yerler') });
        });
      },
      (err) => {
        st.textContent = err && err.code === 1 ? 'Konum izni verilmedi. iPhone: Ayarlar → Gizlilik → Konum Servisleri → Safari Web Siteleri → "Uygulama Kullanılırken".' : 'Konum alınamadı; biraz sonra yeniden dene.';
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('yer', 1500);
    loaded = true;
    K.cloud.on('yer', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'yerler',
    wing: 'kalp',
    title: 'Seni Düşündüğüm Yerler',
    sub: 'Şehrin içinden geçen kalpler',
    icon: 'map',
    color: '#FFE6EF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded ? String(rows.filter((r) => r.who === other()).length || '') : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir yerde onu düşündüğünde aşağıdaki düğmeye bas; oraya küçük bir kalp düşer. Onun haritası zamanla senin şehrinin içinden geçen kalplerle dolar, seninki de onunkiyle.</p></div>
        <div class="yr-tabs" role="tablist"><button type="button" data-yr-tab="onun">Beni düşündüğü yerler</button><button type="button" data-yr-tab="benim">Onu düşündüğüm yerler</button></div>
        <section class="card yr-kart"><div id="yrHarita"></div><p class="muted small center" id="yrSay"></p></section>
        <div class="row center"><button type="button" class="btn red" data-yr-birak>📍 Burada seni düşündüm</button></div><p class="muted small center" id="yrSt" aria-live="polite"></p>
        <ul class="yr-liste" id="yrListe"></ul>`;
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-yr-tab]');
        if (t) return (tab = t.dataset.yrTab), render();
        if (e.target.closest('[data-yr-birak]')) return drop();
        const k = e.target.closest('[data-yr]');
        k && focusRow(k.dataset.yr);
      });
    },
    enter() {
      render();
    },
  });
})();
