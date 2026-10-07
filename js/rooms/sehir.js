/* Oda: Bizim Şehir — Karadeniz ile Hazar arasında hayali bir şehir. İkimiz de bina ekleriz ve her birine bir anının
   adını veririz: "İlk Kartpostal Kahvesi", "21 Köprüsü", "Pamuk Sokağı". Şehir yıllar içinde büyür; Bakü'de akşam
   olunca pencereler yanar, gökyüzünde yıldızlar çıkar.
   Kayıtlar: bina {tip, ad, renk} (sıra eklenme zamanına göre) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const TIP = [
    ['ev', 'Ev'], ['kule', 'Kule'], ['kafe', 'Kafe'], ['kutuphane', 'Kütüphane'], ['sinema', 'Sinema'], ['cicekci', 'Çiçekçi'],
    ['kopru', 'Köprü'], ['park', 'Park'], ['fener', 'Deniz feneri'], ['firin', 'Fırın'], ['saat', 'Saat kulesi'], ['okul', 'Okul'],
  ];
  const RENK = ['#FFB3C7', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF', '#F4A261', '#E9EDF2'];
  const SLOT = 96, ZEMIN = 230, DENIZ = 120;
  let rows = [], root = null, tip = 'ev', renk = RENK[0], sec = null;
  const gece = () => {
    const h = T.baku().h;
    return h >= 19 || h < 6;
  };
  const sirali = () => rows.slice().sort((a, b) => a.at - b.at);
  // Pencere ızgarası
  function pencere(x, y, w, h, kol, sat, isik, r) {
    let s = '';
    const pw = (w - (kol + 1) * 6) / kol, ph = Math.min(14, (h - (sat + 1) * 7) / sat);
    for (let i = 0; i < kol; i++)
      for (let j = 0; j < sat; j++) {
        const on = isik && r() > 0.25;
        s += `<rect x="${(x + 6 + i * (pw + 6)).toFixed(1)}" y="${(y + 7 + j * (ph + 7)).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="2" fill="${on ? '#FFD86B' : isik ? '#3a3350' : '#cfe8ff'}" ${on ? 'class="sh-isik"' : ''}/>`;
      }
    return s;
  }
  function bina(b, i, isik) {
    const r = K.rng(K.hash(b.id));
    const x0 = DENIZ + i * SLOT + 8, w = SLOT - 16;
    const c = b.data.renk || RENK[0], ink = '#4A2138';
    const st = `stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"`;
    let h = 90, svg = '';
    const t = b.data.tip;
    if (t === 'kule' || t === 'saat' || t === 'fener') {
      h = t === 'kule' ? 150 + r() * 30 : 140;
      const bw = t === 'fener' ? 34 : 44, bx = x0 + (w - bw) / 2;
      svg += `<rect x="${bx}" y="${ZEMIN - h}" width="${bw}" height="${h}" fill="${t === 'fener' ? '#fff' : c}" ${st}/>`;
      if (t === 'fener') svg += [0, 1, 2].map((k) => `<rect x="${bx}" y="${ZEMIN - h + 26 + k * 36}" width="${bw}" height="14" fill="${c}"/>`).join('') + `<rect x="${bx - 4}" y="${ZEMIN - h - 18}" width="${bw + 8}" height="18" fill="${isik ? '#FFD86B' : '#cfe8ff'}" ${st}/><path d="M${bx - 6} ${ZEMIN - h - 18} L${bx + bw / 2} ${ZEMIN - h - 38} L${bx + bw + 6} ${ZEMIN - h - 18} Z" fill="#E04F7A" ${st}/>${isik ? `<path d="M${bx + bw / 2} ${ZEMIN - h - 9} L${bx - 60} ${ZEMIN - h - 30} L${bx - 60} ${ZEMIN - h + 10} Z" fill="#FFE9A8" opacity=".35" class="sh-isik"/>` : ''}`;
      else if (t === 'saat') svg += `<circle cx="${bx + bw / 2}" cy="${ZEMIN - h + 26}" r="15" fill="#fff" ${st}/><path d="M${bx + bw / 2} ${ZEMIN - h + 26} v-9 M${bx + bw / 2} ${ZEMIN - h + 26} h7" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M${bx - 4} ${ZEMIN - h} L${bx + bw / 2} ${ZEMIN - h - 30} L${bx + bw + 4} ${ZEMIN - h} Z" fill="#E04F7A" ${st}/>` + pencere(bx, ZEMIN - h + 48, bw, h - 52, 2, 4, isik, r);
      else svg += `<path d="M${bx - 4} ${ZEMIN - h} L${bx + bw / 2} ${ZEMIN - h - 34} L${bx + bw + 4} ${ZEMIN - h} Z" fill="#E04F7A" ${st}/>` + pencere(bx, ZEMIN - h, bw, h, 2, 7, isik, r);
    } else if (t === 'kopru') {
      h = 70;
      svg += `<path d="M${x0 - 8} ${ZEMIN - 40} Q${x0 + w / 2} ${ZEMIN - 110} ${x0 + w + 8} ${ZEMIN - 40}" fill="none" stroke="${c}" stroke-width="7"/><path d="M${x0 - 8} ${ZEMIN - 40} Q${x0 + w / 2} ${ZEMIN - 110} ${x0 + w + 8} ${ZEMIN - 40}" fill="none" stroke="${ink}" stroke-width="2"/>`;
      svg += `<rect x="${x0 - 8}" y="${ZEMIN - 44}" width="${w + 16}" height="10" fill="${c}" ${st}/>` + [0.2, 0.4, 0.6, 0.8].map((k) => `<path d="M${x0 + w * k} ${ZEMIN - 34} V${ZEMIN}" ${st}/>`).join('');
      if (isik) svg += [0.15, 0.5, 0.85].map((k) => `<circle cx="${x0 + w * k}" cy="${ZEMIN - 50}" r="3" fill="#FFD86B" class="sh-isik"/>`).join('');
    } else if (t === 'park') {
      h = 70;
      svg += `<rect x="${x0}" y="${ZEMIN - 8}" width="${w}" height="8" fill="#8FD694" ${st}/>` + [0.25, 0.7].map((k, j) => `<path d="M${x0 + w * k} ${ZEMIN - 8} v-22" ${st}/><circle cx="${x0 + w * k}" cy="${ZEMIN - 44 - j * 8}" r="${18 + j * 4}" fill="${j ? '#7CC57F' : c}" ${st}/>`).join('') + `<path d="M${x0 + w * 0.42} ${ZEMIN - 14} h18" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    } else {
      h = { ev: 80, kafe: 74, kutuphane: 104, sinema: 96, cicekci: 70, firin: 72, okul: 110 }[t] || 90;
      h += Math.round(r() * 18);
      svg += `<rect x="${x0}" y="${ZEMIN - h}" width="${w}" height="${h}" fill="${c}" ${st}/>`;
      if (t === 'ev') svg += `<path d="M${x0 - 6} ${ZEMIN - h} L${x0 + w / 2} ${ZEMIN - h - 34} L${x0 + w + 6} ${ZEMIN - h} Z" fill="#E04F7A" ${st}/><rect x="${x0 + w / 2 - 9}" y="${ZEMIN - 26}" width="18" height="26" rx="2" fill="#B07A55" ${st}/>` + pencere(x0, ZEMIN - h, w, h - 30, 2, 2, isik, r);
      else if (t === 'kafe' || t === 'cicekci' || t === 'firin') {
        const awn = t === 'kafe' ? '#E04F7A' : t === 'cicekci' ? '#8FD694' : '#F4A261';
        svg += `<path d="M${x0 - 4} ${ZEMIN - h + 18} h${w + 8} l-6 16 h-${w - 4} z" fill="${awn}" ${st}/>` + [0, 1, 2, 3].map((k) => `<path d="M${x0 + (w / 4) * k + w / 8} ${ZEMIN - h + 18} v16" stroke="#fff" stroke-width="5" opacity=".55"/>`).join('') + `<rect x="${x0 + 8}" y="${ZEMIN - 34}" width="${w - 16}" height="26" rx="3" fill="${isik ? '#FFD86B' : '#cfe8ff'}" ${st} ${isik ? 'class="sh-isik"' : ''}/>`;
        if (t === 'cicekci') svg += [0.2, 0.4, 0.6, 0.8].map((k, j) => `<circle cx="${x0 + w * k}" cy="${ZEMIN - 4}" r="4" fill="${['#FF8FB8', '#FFD34E', '#C9B6FF', '#FF6B6B'][j]}"/>`).join('');
        if (t === 'firin') svg += `<rect x="${x0 + w - 18}" y="${ZEMIN - h - 18}" width="10" height="20" fill="#B07A55" ${st}/>`;
      } else if (t === 'sinema') svg += `<rect x="${x0 + 6}" y="${ZEMIN - h + 8}" width="${w - 12}" height="20" rx="3" fill="#fff" ${st}/><text x="${x0 + w / 2}" y="${ZEMIN - h + 23}" font-size="12" font-weight="800" text-anchor="middle" fill="${ink}">SİNEMA</text>` + Array.from({ length: 7 }, (_, k) => `<circle cx="${x0 + 10 + k * ((w - 20) / 6)}" cy="${ZEMIN - h + 4}" r="2.6" fill="${isik ? '#FFD86B' : '#fff'}"/>`).join('') + pencere(x0, ZEMIN - h + 32, w, h - 62, 3, 1, isik, r) + `<rect x="${x0 + w / 2 - 14}" y="${ZEMIN - 26}" width="28" height="26" fill="#4A2138"/>`;
      else if (t === 'kutuphane' || t === 'okul') svg += `<path d="M${x0 - 6} ${ZEMIN - h} L${x0 + w / 2} ${ZEMIN - h - 22} L${x0 + w + 6} ${ZEMIN - h} Z" fill="#fff" ${st}/>` + [0.2, 0.4, 0.6, 0.8].map((k) => `<rect x="${x0 + w * k - 3}" y="${ZEMIN - h + 6}" width="6" height="${h - 32}" fill="#fff" stroke="${ink}" stroke-width="1.5"/>`).join('') + `<rect x="${x0 + w / 2 - 10}" y="${ZEMIN - 24}" width="20" height="24" fill="#4A2138"/>` + (t === 'okul' ? `<path d="M${x0 + w / 2} ${ZEMIN - h - 22} v-18" ${st}/><path d="M${x0 + w / 2} ${ZEMIN - h - 40} h14 v8 h-14" fill="#E04F7A" ${st}/>` : '');
    }
    return `<g class="sh-bina ${sec === b.id ? 'sec' : ''}" data-sh="${b.id}">${svg}<rect x="${x0 - 6}" y="${ZEMIN - h - 44}" width="${w + 12}" height="${h + 44}" fill="transparent"/></g>`;
  }
  function sahne() {
    const l = sirali(), isik = gece();
    const W = DENIZ * 2 + Math.max(4, l.length + 1) * SLOT, H = 300;
    const yildiz = isik ? Array.from({ length: Math.round(W / 22) }, (_, i) => { const r = K.rng(i + 9); return `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 120).toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`; }).join('') : '';
    const dalga = (x, w) => Array.from({ length: Math.ceil(w / 24) }, (_, k) => `<path d="M${x + k * 24} ${ZEMIN + 22} q6 -5 12 0 t12 0" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`).join('');
    return `<svg class="sh-svg ${isik ? 'gece' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Bizim Şehir">
      <defs><linearGradient id="shGok" x1="0" y1="0" x2="0" y2="1">${isik ? '<stop offset="0" stop-color="#1b1640"/><stop offset="1" stop-color="#4b3a78"/>' : '<stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#ffe3ee"/>'}</linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#shGok)"/>${yildiz}${isik ? `<circle cx="${W - 70}" cy="50" r="18" fill="#FFF3C4"/>` : `<circle cx="${W - 80}" cy="54" r="22" fill="#FFD86B"/>`}
      <rect x="0" y="${ZEMIN}" width="${W}" height="${H - ZEMIN}" fill="${isik ? '#3a2f55' : '#F3D9E3'}"/>
      <rect x="0" y="${ZEMIN - 6}" width="${DENIZ}" height="${H - ZEMIN + 6}" fill="#3E7CB1"/>${dalga(0, DENIZ)}<text x="${DENIZ / 2}" y="${H - 20}" text-anchor="middle" class="sh-deniz">Karadeniz</text>
      <rect x="${W - DENIZ}" y="${ZEMIN - 6}" width="${DENIZ}" height="${H - ZEMIN + 6}" fill="#2F9C95"/>${dalga(W - DENIZ, DENIZ)}<text x="${W - DENIZ / 2}" y="${H - 20}" text-anchor="middle" class="sh-deniz">Hazar</text>
      ${l.map((b, i) => bina(b, i, isik)).join('')}
      ${l.length ? '' : `<text x="${W / 2}" y="${ZEMIN - 60}" text-anchor="middle" class="sh-bos">Şehrin ilk binasını sen kur</text>`}</svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'sehir') return;
    const l = sirali();
    K.$('#shUst', root).innerHTML = l.length ? `<b>${l.length}</b> bina · kuruluş ${K.esc(T.fmt(new Date(l[0].at)))}` : 'Henüz boş bir kıyı';
    K.$('#shSahne', root).innerHTML = sahne();
    const b = sec && rows.find((r) => r.id === sec);
    K.$('#shBilgi', root).innerHTML = b ? `<p class="card-eyebrow">${K.esc((TIP.find((t) => t[0] === b.data.tip) || [])[1] || '')}</p><h3>${K.esc(b.data.ad)}</h3><p class="muted small">${K.esc(nameOf(b.who))} kurdu · ${K.esc(T.fmt(new Date(b.at)))}</p>` : '<p class="muted small center">Bir binaya dokun: adını ve kimin kurduğunu gör.</p>';
    K.$('#shTip', root).innerHTML = TIP.map(([id, n]) => `<button type="button" class="chip ${id === tip ? 'on' : ''}" data-sh-tip="${id}">${K.esc(n)}</button>`).join('');
    K.$('#shRenk', root).innerHTML = RENK.map((c) => `<button type="button" class="${c === renk ? 'on' : ''}" style="--c:${c}" data-sh-renk="${c}" aria-label="Renk"></button>`).join('');
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('bina', 500);
    K.cloud.on('bina', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'sehir',
    wing: 'hazine',
    title: 'Bizim Şehir',
    sub: 'Karadeniz ile Hazar arasında',
    icon: 'bridge',
    color: '#E6F0FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (rows.length ? String(rows.length) : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Karadeniz ile Hazar arasında hayali bir şehir. İkimiz de bina ekliyoruz; her binanın adı bir anı. Bakü'de akşam olunca pencereler yanar.</p></div>
        <p class="sh-ust center" id="shUst"></p><div class="sh-sahne" id="shSahne"></div><section class="card" id="shBilgi"></section>
        <section class="card"><p class="card-eyebrow">Yeni bina</p><div class="sh-tip" id="shTip"></div><div class="sh-renk" id="shRenk"></div>
        <div class="row"><input class="input" id="shAd" maxlength="40" placeholder="Bir anının adı: İlk Kartpostal Kahvesi"><button type="button" class="btn red small" data-sh-kur>Kur</button></div></section>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-sh]');
        if (b) return (sec = sec === b.dataset.sh ? null : b.dataset.sh), render();
        const t = e.target.closest('[data-sh-tip]');
        if (t) return (tip = t.dataset.shTip), render();
        const c = e.target.closest('[data-sh-renk]');
        if (c) return (renk = c.dataset.shRenk), render();
        if (!e.target.closest('[data-sh-kur]')) return;
        const inp = K.$('#shAd', root), ad = inp.value.trim();
        if (!ad) return inp.focus();
        const r = await K.cloud.add('bina', { tip, ad, renk });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        inp.value = '';
        sec = r.id;
        K.stickers.award('sehir');
        if (rows.length >= 21) K.stickers.award('sehir21');
        K.ping(`🏙 ${K.meName()} şehrimize yeni bir bina kurdu`, ad, ['cityscape'], { click: K.roomUrl('sehir') });
        render();
        const sc = K.$('#shSahne', root);
        sc.scrollTo({ left: sc.scrollWidth, behavior: K.reduced ? 'auto' : 'smooth' });
      });
    },
    enter() {
      render();
      const sc = K.$('#shSahne', root);
      requestAnimationFrame(() => (sc.scrollLeft = sc.scrollWidth));
    },
  });
})();
