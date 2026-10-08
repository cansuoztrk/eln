/* Oda: Mum Mühür Atölyesi — ikimiz de kendi mum mührümüzü tasarlarız: mumun rengi, ortadaki amblem (baş harf, fiyonk,
   kalp, taç, pati, yıldız, zambak) ve kenar. Mühür kaledeki mektuplarımızın üstünde durur: Ardoş'un mektuplarında
   onun mührü, Güneş Postası'nda ve tebrik kartlarında gönderenin mührü. Mektup açılırken mühür ortadan çatlayıp kırılır.
   Kayıtlar: muhur {renk, amblem, harf, kenar} (kişi başına son kayıt geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const RENK = [['kirmizi', 'Kırmızı', '#b3123b'], ['bordo', 'Bordo', '#7a1430'], ['pembe', 'Pembe', '#e0558c'], ['mor', 'Mor', '#6b3fa0'], ['altin', 'Altın', '#c28e1c'], ['lacivert', 'Lacivert', '#24356e'], ['yesil', 'Zümrüt', '#1f6e55'], ['siyah', 'Gece', '#2b2024']];
  const AMBLEM = [['harf', 'Baş harf'], ['kalp', 'Kalp'], ['fiyonk', 'Fiyonk'], ['tac', 'Taç'], ['pati', 'Pati'], ['yildiz', 'Yıldız'], ['zambak', 'Zambak']];
  const KENAR = [['duz', 'Düz'], ['inci', 'İnci'], ['yaprak', 'Yaprak']];
  const SHAPE = {
    kalp: '<path d="M50 66 C30 54 30 38 41 36 C46 35 50 39 50 43 C50 39 54 35 59 36 C70 38 70 54 50 66 Z"/>',
    fiyonk: '<path d="M50 50 C40 38 28 40 30 50 C28 60 40 62 50 50 Z M50 50 C60 38 72 40 70 50 C72 60 60 62 50 50 Z"/><circle cx="50" cy="50" r="5"/>',
    tac: '<path d="M32 62 L34 40 L42 50 L50 36 L58 50 L66 40 L68 62 Z"/>',
    pati: '<ellipse cx="50" cy="58" rx="10" ry="8"/><circle cx="38" cy="45" r="4.5"/><circle cx="46" cy="39" r="4.5"/><circle cx="54" cy="39" r="4.5"/><circle cx="62" cy="45" r="4.5"/>',
    yildiz: '<path d="M50 32 l5 12 h13 l-10 8 4 13 -12 -8 -12 8 4 -13 -10 -8 h13 z"/>',
    zambak: '<path d="M50 64 V50"/><path d="M50 50 C44 40 44 34 50 30 C56 34 56 40 50 50 Z M50 50 C40 48 34 44 34 38 C42 38 48 42 50 50 Z M50 50 C60 48 66 44 66 38 C58 38 52 42 50 50 Z"/>',
  };
  let rows = [], loaded = false, root = null, draft = null, uid = 0;
  const DEF = (w) => ({ renk: w === 'me' ? 'lacivert' : 'kirmizi', amblem: 'harf', harf: (w === 'me' ? C.myPet || 'A' : C.herPet || 'E').charAt(0), kenar: 'inci' });
  const of = (w) => (rows.filter((r) => r.who === w).sort((a, b) => a.at - b.at).pop() || {}).data || null;
  const design = (w) => Object.assign(DEF(w), of(w) || {});
  // Mühür: düzensiz mum kenarı, kabarık iç halka, ortada amblem; ortadan çatlak (iki yarım)
  function svg(w, cls = '', d0) {
    const d = d0 || design(w);
    const col = (RENK.find((x) => x[0] === d.renk) || RENK[0])[2];
    const r = K.rng(K.hash(w + d.renk + d.amblem));
    const n = 16;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2, rr = 43 + (r() * 6 - 2);
      return [50 + Math.cos(a) * rr, 50 + Math.sin(a) * rr];
    });
    const blob = pts.map((p, i) => {
      const q = pts[(i + 1) % n];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      return `${i ? '' : `M${mx.toFixed(1)} ${my.toFixed(1)} `}Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${(((q[0] + pts[(i + 2) % n][0]) / 2)).toFixed(1)} ${(((q[1] + pts[(i + 2) % n][1]) / 2)).toFixed(1)}`;
    }).join(' ') + ' Z';
    const id = 'mh' + ++uid;
    const crack = 'M50 4 L46 22 L54 34 L45 50 L55 64 L47 80 L52 96';
    const ring = d.kenar === 'inci' ? Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2; return `<circle cx="${(50 + Math.cos(a) * 33).toFixed(1)}" cy="${(50 + Math.sin(a) * 33).toFixed(1)}" r="1.8"/>`; }).join('') : d.kenar === 'yaprak' ? Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="17.5" rx="2.6" ry="5" transform="rotate(${i * 30} 50 50)"/>`).join('') : '<circle cx="50" cy="50" r="33" fill="none" stroke-width="2"/>';
    const emb = d.amblem === 'harf' ? `<text x="50" y="62" text-anchor="middle" class="mh-harf">${K.esc(String(d.harf || '?').charAt(0).toLocaleUpperCase('tr'))}</text>` : SHAPE[d.amblem] || SHAPE.kalp;
    const body = `<path d="${blob}" fill="${col}"/><path d="${blob}" fill="url(#${id}g)"/><circle cx="50" cy="50" r="29" fill="${col}" stroke="rgba(0,0,0,.28)" stroke-width="2"/><g class="mh-kenar" fill="rgba(255,255,255,.28)" stroke="rgba(0,0,0,.18)">${ring}</g><g class="mh-amb" fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.35)" stroke-width="1.2">${emb}</g>`;
    return `<svg class="mh-svg ${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${id}g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>
      <clipPath id="${id}l"><path d="M0 0 H50 ${crack.replace(/^M50 4/, 'L50 4')} L52 100 H0 Z"/></clipPath><clipPath id="${id}r"><path d="M100 0 H50 ${crack.replace(/^M50 4/, 'L50 4')} L52 100 H100 Z"/></clipPath></defs>
      <g class="mh-sol" clip-path="url(#${id}l)">${body}</g><g class="mh-sag" clip-path="url(#${id}r)">${body}</g><path class="mh-catlak" d="${crack}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.2"/></svg>`;
  }
  const mini = (w) => `<span class="mh-mini">${svg(w)}</span>`;
  // Kırılarak açılan mühür: el içine konur, dokununca (ya da kendiliğinden) çatlar
  function breakOpen(el, w, cb) {
    const s = K.el(`<button type="button" class="mh-kir" aria-label="Mührü kır">${svg(w)}<small>Mührü kırmak için dokun</small></button>`);
    el.appendChild(s);
    const go = () => {
      s.classList.add('kirildi');
      K.audio.sfx.pop();
      K.vibrate([20, 30, 40]);
      setTimeout(() => (s.remove(), cb && cb()), 900);
    };
    s.addEventListener('click', go, { once: true });
    return go;
  }
  function render() {
    if (!root || K.activeRoom !== 'muhur') return;
    const d = draft || design(mine());
    K.$('#mhOnizle', root).innerHTML = `${svg(mine(), 'buyuk', d)}<p class="muted small">${of(mine()) ? 'Mektuplarının üstündeki mühür bu.' : 'Henüz kaydetmedin; şu an varsayılan mühür kullanılıyor.'}</p>`;
    K.$('#mhSec', root).innerHTML = `<p class="card-eyebrow">Mum</p><div class="mh-row">${RENK.map(([id, n, c]) => `<button type="button" class="mh-renk ${d.renk === id ? 'on' : ''}" data-mh="renk:${id}" style="--c:${c}" aria-label="${n}"></button>`).join('')}</div>
      <p class="card-eyebrow">Amblem</p><div class="mh-row">${AMBLEM.map(([id, n]) => `<button type="button" class="btn ${d.amblem === id ? 'red' : 'soft'} small" data-mh="amblem:${id}">${n}</button>`).join('')}</div>
      ${d.amblem === 'harf' ? `<input class="input mh-harf-in" id="mhHarf" maxlength="1" value="${K.esc(d.harf)}" aria-label="Harf">` : ''}
      <p class="card-eyebrow">Kenar</p><div class="mh-row">${KENAR.map(([id, n]) => `<button type="button" class="btn ${d.kenar === id ? 'red' : 'soft'} small" data-mh="kenar:${id}">${n}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn red" data-mh-kaydet>Mührümü kaydet</button><button type="button" class="btn ghost small" data-mh-dene>Kırmayı dene</button><button type="button" class="btn ghost small" data-mh-kalip>🔨 Gerçek mühür kalıbı</button></div>`;
    K.$('#mhIkimiz', root).innerHTML = ['her', 'me'].map((w) => `<figure>${svg(w)}<figcaption>${K.esc(K.ek(nameOf(w), 'in'))} mührü</figcaption></figure>`).join('');
  }
  /* ---------- Gerçek mühür kalıbı: pirinç mühür yapan bir atölyeye gönderilecek tek renk vektör ---------- */
  function kalipSvg(d, ayna) {
    const emb = d.amblem === 'harf' ? `<text x="50" y="64" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700">${K.esc(String(d.harf || '?').charAt(0).toLocaleUpperCase('tr'))}</text>` : (SHAPE[d.amblem] || SHAPE.kalp);
    const ring = d.kenar === 'inci' ? Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2; return `<circle cx="${(50 + Math.cos(a) * 40).toFixed(2)}" cy="${(50 + Math.sin(a) * 40).toFixed(2)}" r="2.2"/>`; }).join('') : d.kenar === 'yaprak' ? Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="10.5" rx="2.6" ry="5.2" transform="rotate(${i * 30} 50 50)"/>`).join('') : '<circle cx="50" cy="50" r="40" fill="none" stroke="#000" stroke-width="2.4"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1000" height="1000"><rect width="100" height="100" fill="#fff"/><g ${ayna ? 'transform="translate(100 0) scale(-1 1)"' : ''}><circle cx="50" cy="50" r="47" fill="none" stroke="#000" stroke-width="2.6"/><g fill="#000" stroke="#000" stroke-width=".4">${ring}</g><g fill="#000" stroke="none" transform="translate(50 50) scale(1.25) translate(-50 -50)">${emb}</g></g></svg>`;
  }
  function kalip() {
    const d = Object.assign({}, draft || design(mine()));
    const m = K.ui.modal({
      label: 'Gerçek mühür kalıbı',
      cls: 'mh-kalip',
      html: `<p class="card-eyebrow">Kavuşma kutusuna gerçek bir mühür</p><h2>Pirinç mühür kalıbı</h2>
        <div class="mh-kalip-iki"><figure>${kalipSvg(d, false)}<figcaption>Mühürde görünecek hâli</figcaption></figure><figure>${kalipSvg(d, true)}<figcaption>Kalıba kazınacak (aynalı)</figcaption></figure></div>
        <div class="cl-dugmeler"><button class="btn small" type="button" data-mk="svg">SVG indir (atölye için)</button><button class="btn ghost small" type="button" data-mk="png">PNG indir</button></div>
        <ol class="muted small"><li>"Özel tasarım mum mühür" ya da "custom wax seal stamp" yapan bir atölyeye SVG dosyasını gönder (çoğu 25 mm ya da 30 mm çap yapar).</li><li>Atölye genelde aynalamayı kendisi yapar: düz hâlini gönder, "aynalı mı istiyorsunuz?" diye sorarlarsa aynalı dosyayı ver.</li><li>Mumun rengi: ${K.esc((RENK.find((x) => x[0] === d.renk) || RENK[0])[1])}. Mum çubuğunu da aynı renkte sipariş edebilirsin.</li></ol>`,
    });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mk]');
      if (!b) return;
      const svgStr = kalipSvg(d, false);
      if (b.dataset.mk === 'svg') return K.download('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr), 'muhur-kalibi.svg'), K.stickers.award('muhurkalip');
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 2000;
        c.getContext('2d').drawImage(img, 0, 0, 2000, 2000);
        K.download(c.toDataURL('image/png'), 'muhur-kalibi.png');
        K.stickers.award('muhurkalip');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('muhur', 100);
    loaded = true;
    K.cloud.on('muhur', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'muhur',
    wing: 'hazine',
    title: 'Mum Mühür Atölyesi',
    sub: 'Mektuplarımızın mührü',
    icon: 'letter',
    color: '#FBE3E3',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Her mektubun bir mührü olsun. Mumun rengini, ortadaki amblemi ve kenarı seç; mühür mektuplarının üstünde durur ve mektup açılırken ortadan çatlayıp kırılır.</p></div>
        <section class="card mh-kart"><div class="mh-onizle" id="mhOnizle"></div><div id="mhSec"></div></section>
        <section class="card"><p class="card-eyebrow">İkimizin mührü</p><div class="mh-ikimiz" id="mhIkimiz"></div></section>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-mh]');
        if (b) {
          const [k, v] = b.dataset.mh.split(':');
          draft = Object.assign({}, draft || design(mine()), { [k]: v });
          K.audio.sfx.tap();
          return render();
        }
        if (e.target.closest('[data-mh-kalip]')) return kalip();
        if (e.target.closest('[data-mh-dene]')) {
          const box = K.$('#mhOnizle', el);
          return breakOpen(box, mine(), () => render())();
        }
        if (e.target.closest('[data-mh-kaydet]')) {
          const d = Object.assign({}, draft || design(mine()));
          const h = K.$('#mhHarf', el);
          if (h) d.harf = (h.value || d.harf).charAt(0);
          if (!K.cloud || !K.cloud.enabled) return K.fx.toast('Mührü kaydetmek için ortak kale gerekiyor.');
          const r = await K.cloud.add('muhur', d);
          if (r) rows.push(r);
          draft = null;
          K.audio.sfx.success();
          K.stickers.award('muhuratolye');
          render();
        }
      });
      el.addEventListener('input', (e) => {
        if (e.target.id !== 'mhHarf') return;
        draft = Object.assign({}, draft || design(mine()), { harf: e.target.value.charAt(0) || '?' });
        K.$('#mhOnizle .mh-svg', el).outerHTML = svg(mine(), 'buyuk', draft);
      });
    },
    enter() {
      render();
    },
  });
  K.muhur = { svg, mini, breakOpen, design };
})();
