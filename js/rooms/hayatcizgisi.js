/* Oda: İki Hayat Çizgisi — doğduğunuz yerden bugüne iki çizgi haritada: okullar, şehirler, evler. İkiniz de kendi
   noktalarınızı eklersiniz (şehir listesinden ya da haritaya dokunarak). Çizgilerin buluştuğu yer tanıştığınız gün
   (6 Aralık 2025, iki şehrin arasında bir kalp); oradan ileri tek bir kesikli çizgi: gelecekteki ortak şehir.
   Kayıtlar: hayatnokta {yil, yer, lat, lng, tur, not} · hayatgelecek {yer, lat, lng} (en son geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const TUR = { dogum: ['👶', 'Doğdum'], ev: ['🏠', 'Ev'], okul: ['🎒', 'Okul'], uni: ['🎓', 'Üniversite'], sehir: ['🏙️', 'Taşındım'], ani: ['💫', 'Bir anı'] };
  const RENK = { me: '#5AA9E6', her: '#FF6FA3' };
  const TANISMA = 2025.93;
  let rows = [], gelecek = null, root = null, secim = null;

  const noktalar = (w) => rows.filter((r) => r.who === w).map((r) => Object.assign({ id: r.id }, r.data)).sort((a, b) => a.yil - b.yil);
  function harita() {
    const box = K.$('#hcHarita', root);
    if (!box || !window.HARITA) return;
    const P = K.dunya.proj;
    const a = noktalar('me'), b = noktalar('her');
    const evA = K.dunya.sehirBul(C.myCity) || ['', 41.01, 28.98], evB = K.dunya.sehirBul(C.herCity) || ['', 40.41, 49.87];
    const tum = a.concat(b).map((p) => [p.lat, p.lng]).concat([[evA[1], evA[2]], [evB[1], evB[2]]], gelecek ? [[gelecek.lat, gelecek.lng]] : []);
    const [x, y, w, h] = K.dunya.kutu(tum, 0.22, 1.3);
    const s = w / 400;
    const cizgi = (l, son, wh) => {
      const pts = l.map((p) => P(p.lat, p.lng)).concat([P(son[1], son[2])]);
      return `<path d="M${pts.map((q) => q.map((v) => v.toFixed(2)).join(' ')).join('L')}" fill="none" stroke="${RENK[wh]}" stroke-width="${3.2 * s}" stroke-linecap="round" stroke-linejoin="round"/>` +
        l.map((p) => { const [px, py] = P(p.lat, p.lng); return `<g data-hc-nokta="${p.id}"><circle cx="${px}" cy="${py}" r="${5 * s}" fill="#fff" stroke="${RENK[wh]}" stroke-width="${2.4 * s}"/><text x="${px}" y="${py - 8 * s}" font-size="${9 * s}" text-anchor="middle">${p.yil}</text></g>`; }).join('');
    };
    const [ax, ay] = P(evA[1], evA[2]), [bx, by] = P(evB[1], evB[2]);
    const mx = (ax + bx) / 2, my = (ay + by) / 2 - 18 * s;
    const kalp = `<path transform="translate(${mx} ${my}) scale(${1.1 * s})" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="#E3174D" stroke="#3A1F2D" stroke-width="2"/>`;
    const bag = `<path d="M${ax} ${ay} Q${mx} ${my - 30 * s} ${mx} ${my}" fill="none" stroke="${RENK.me}" stroke-width="${2 * s}" stroke-dasharray="${4 * s} ${4 * s}"/><path d="M${bx} ${by} Q${mx} ${my - 30 * s} ${mx} ${my}" fill="none" stroke="${RENK.her}" stroke-width="${2 * s}" stroke-dasharray="${4 * s} ${4 * s}"/>`;
    const gel = gelecek ? (() => { const [gx, gy] = P(gelecek.lat, gelecek.lng); return `<path d="M${mx} ${my} L${gx} ${gy}" stroke="#9B59D0" stroke-width="${3.4 * s}" stroke-dasharray="${2 * s} ${6 * s}" stroke-linecap="round" fill="none"/><circle cx="${gx}" cy="${gy}" r="${7 * s}" fill="#CDBBFF" stroke="#3A1F2D" stroke-width="${2 * s}"/><text x="${gx}" y="${gy + 18 * s}" font-size="${10 * s}" text-anchor="middle">${K.esc(gelecek.yer)} · birlikte</text>`; })() : '';
    box.innerHTML = `<svg class="hc-svg" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-label="İki hayat çizgisi haritası"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#E1F3FF"/>
      <path d="${window.HARITA.world}" fill="#FFF7EC" stroke="#C9B4A6" stroke-width="${0.7 * s}"/>${window.HARITA.br ? `<path d="${window.HARITA.br}" fill="none" stroke="#E0CFC4" stroke-width="${0.5 * s}"/>` : ''}
      ${bag}${cizgi(a, evA, 'me')}${cizgi(b, evB, 'her')}${gel}${kalp}<text x="${mx}" y="${my - 16 * s}" font-size="${9 * s}" text-anchor="middle" font-weight="700">6 Aralık 2025</text></svg>`;
    box.dataset.vb = [x, y, w, h].join(',');
  }
  function liste() {
    const yillar = [...new Set(rows.map((r) => r.data.yil))].sort((p, q) => p - q);
    const sat = (w, yil) => rows.filter((r) => r.who === w && r.data.yil === yil).map((r) => `<div class="hc-olay"><b>${TUR[r.data.tur] ? TUR[r.data.tur][0] : '📍'} ${K.esc(r.data.yer)}</b>${r.data.not ? `<small>${K.esc(r.data.not)}</small>` : ''}${r.who === mine() ? `<button type="button" class="linkish" data-hc-sil="${r.id}">sil</button>` : ''}</div>`).join('');
    const once = yillar.filter((y) => y < TANISMA), sonra = yillar.filter((y) => y >= TANISMA);
    const satir = (y) => `<div class="hc-satir"><div class="me">${sat('me', y)}</div><time>${y}</time><div class="her">${sat('her', y)}</div></div>`;
    K.$('#hcListe', root).innerHTML = `<div class="hc-ust"><b style="color:${RENK.me}">${K.esc(nameOf('me'))}</b><span></span><b style="color:${RENK.her}">${K.esc(nameOf('her'))}</b></div>
      ${once.map(satir).join('')}<div class="hc-bulusma">💗 6 Aralık 2025 · iki çizgi burada buluştu</div>${sonra.map(satir).join('')}
      ${gelecek ? `<div class="hc-gelecek">✨ Gelecek: <b>${K.esc(gelecek.yer)}</b> · iki çizgi tek çizgi</div>` : ''}`;
  }
  function ciz() {
    if (!root || K.activeRoom !== 'hayatcizgisi') return;
    harita();
    liste();
  }
  async function ekle() {
    const f = (id) => K.$(id, root);
    const yil = +f('#hcYil').value, yer = f('#hcYer').value.trim();
    if (!yil || yil < 1990 || yil > 2100 || !yer) return K.fx.toast('Yıl ve yer yaz.');
    const sb = K.dunya.sehirBul(yer);
    const konum = secim || (sb ? [sb[1], sb[2]] : null);
    if (!konum) return K.fx.toast('Bu şehri tanımadım. Haritada yerine dokun, sonra ekle.');
    const r = await K.cloud.add('hayatnokta', { yil, yer, lat: konum[0], lng: konum[1], tur: f('#hcTur').value, not: f('#hcNot').value.trim().slice(0, 80) });
    if (!r) return;
    rows.push(r);
    secim = null;
    f('#hcYer').value = f('#hcNot').value = '';
    K.stickers.award('hayatcizgisi');
    ciz();
  }
  K.room({
    id: 'hayatcizgisi',
    wing: 'anilar',
    title: 'İki Hayat Çizgisi',
    sub: 'Doğduğumuz yerden bugüne, sonra tek çizgi',
    icon: 'lines',
    color: '#E1F3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Doğduğun yerden bugüne kendi çizgini çiz: okullar, şehirler, evler. İki çizgi 6 Aralık 2025'te buluşuyor; oradan sonrası tek çizgi.</p></div>
        <div class="hc-harita" id="hcHarita"><p class="muted center">Harita yükleniyor...</p></div><p class="muted small center">Listede olmayan bir yer için haritada yerine dokun.</p>
        <section class="card hc-form"><p class="card-eyebrow">Çizgine bir nokta ekle</p>
          <div class="hc-alanlar"><input class="input" id="hcYil" type="number" inputmode="numeric" placeholder="Yıl" min="1990" max="2100"><input class="input" id="hcYer" list="hcSehirler" placeholder="Şehir (ör. Gəncə)"><select class="input" id="hcTur">${Object.entries(TUR).map(([k, v]) => `<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select></div>
          <input class="input" id="hcNot" maxlength="80" placeholder="Kısa not (isteğe bağlı): ör. ilk okulum">
          <datalist id="hcSehirler">${K.dunya.SEHIR.map((s) => `<option value="${K.esc(s[0])}">`).join('')}</datalist>
          <div class="cl-dugmeler"><button class="btn" type="button" data-hc="ekle">Ekle</button><button class="btn ghost small" type="button" data-hc="gelecek">✨ Gelecekteki şehrimiz</button></div><p class="muted small" id="hcSecim"></p></section>
        <section class="hc-liste" id="hcListe"></section>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-hc]');
        if (b && b.dataset.hc === 'ekle') return ekle();
        if (b && b.dataset.hc === 'gelecek') {
          const yer = K.$('#hcYer', root).value.trim();
          const sb = K.dunya.sehirBul(yer);
          const k = secim || (sb ? [sb[1], sb[2]] : null);
          if (!yer || !k) return K.fx.toast('Önce şehrin adını yaz (ya da haritada dokun), sonra bu düğmeye bas.');
          const r = await K.cloud.add('hayatgelecek', { yer, lat: k[0], lng: k[1] });
          r && (gelecek = r.data), (secim = null), ciz();
          return;
        }
        const s = e.target.closest('[data-hc-sil]');
        if (s) {
          rows = rows.filter((r) => r.id !== s.dataset.hcSil);
          K.cloud.add('hayatsil', { ref: s.dataset.hcSil });
          return ciz();
        }
        const svg = e.target.closest('.hc-svg');
        if (svg) {
          const r = svg.getBoundingClientRect(), vb = K.$('#hcHarita', root).dataset.vb.split(',').map(Number);
          const k = Math.max(vb[2] / r.width, vb[3] / r.height);
          const ox = vb[0] + (vb[2] - r.width * k) / 2, oy = vb[1] + (vb[3] - r.height * k) / 2;
          secim = K.dunya.unproj(ox + (e.clientX - r.left) * k, oy + (e.clientY - r.top) * k);
          K.$('#hcSecim', root).textContent = `📍 Haritada seçildi: ${secim[0].toFixed(2)}, ${secim[1].toFixed(2)} · şimdi yer adını yazıp ekle.`;
        }
      });
    },
    async enter() {
      await K.dunya.load().catch(() => {});
      const [n, g, sil] = await Promise.all([K.cloud.list('hayatnokta', 300), K.cloud.list('hayatgelecek', 20), K.cloud.list('hayatsil', 300)]);
      const silinen = new Set(sil.map((r) => r.data.ref));
      rows = n.filter((r) => !silinen.has(r.id));
      const gs = g.sort((a, b) => b.at - a.at)[0];
      gelecek = gs ? gs.data : null;
      ciz();
    },
  });
})();
