/* Oda: Sıra Çizgi Roman — bir kare o çizer, bir kare sen. On iki karede bir bölüm; bölümler bir çizgi roman kitabı olur.
   Sıra kendiliğinden döner (son kareyi çizmeyen çizer); ilk kareyi çizen bölüme ad koyar. Her karede kalem (altı renk,
   iki kalınlık), silgi ve bir konuşma balonu. Bölüm bitince kitap sayfası gibi 3×4 ızgara olarak okunur.
   Kayıtlar: cizgibolum {no, ad} · cizgikare {bolum, no, thumb, full, balon} · cizgikareimg {img} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const RENK = ['#3A1F2D', '#E3174D', '#FF8FB8', '#5AA9E6', '#F2B100', '#3FB27F'];
  const KARE = 12;
  let bolumler = [], kareler = [], root = null, acik = null;

  const karesi = (b) => kareler.filter((k) => k.data.bolum === b).sort((x, y) => x.data.no - y.data.no);
  const aktif = () => {
    const l = bolumler.slice().sort((a, b) => a.data.no - b.data.no);
    const son = l[l.length - 1];
    return son && karesi(son.data.no).length < KARE ? son : null;
  };
  const siraKimde = (b) => {
    const k = b ? karesi(b.data.no) : [];
    if (!k.length) return b ? b.who : null;
    return k[k.length - 1].who === 'me' ? 'her' : 'me';
  };

  /* ---------- Çizim tuvali ---------- */
  function tuval(onKaydet) {
    let renk = RENK[0], kalin = 4, silgi = false, cizgi = [], aktifCizgi = null;
    const m = K.ui.modal({
      label: 'Kareyi çiz',
      cls: 'cr-ciz',
      html: `<p class="card-eyebrow">Senin karen</p><canvas class="cr-tuval" width="800" height="600"></canvas>
        <div class="cr-araclar">${RENK.map((r, i) => `<button type="button" class="cr-renk ${i ? '' : 'on'}" style="--c:${r}" data-cr-renk="${r}" aria-label="Renk"></button>`).join('')}
          <button type="button" class="chip" data-cr="kalin">✏️ İnce</button><button type="button" class="chip" data-cr="silgi">🧽 Silgi</button><button type="button" class="chip" data-cr="geri">↶</button></div>
        <input class="input" id="crBalon" maxlength="80" placeholder="Konuşma balonu (isteğe bağlı)">
        <button class="btn" type="button" data-cr="kaydet">Kareyi koy</button>`,
    });
    const cv = K.$('.cr-tuval', m.el), g = cv.getContext('2d');
    const ciz = () => {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, 800, 600);
      g.lineCap = g.lineJoin = 'round';
      cizgi.concat(aktifCizgi ? [aktifCizgi] : []).forEach((c) => {
        g.strokeStyle = c.renk;
        g.lineWidth = c.kalin;
        g.beginPath();
        c.p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        if (c.p.length === 1) g.lineTo(c.p[0][0] + 0.1, c.p[0][1]);
        g.stroke();
      });
      const b = K.$('#crBalon', m.el).value.trim();
      if (b) balon(g, b);
    };
    const nokta = (e) => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 800, ((e.clientY - r.top) / r.height) * 600];
    };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      aktifCizgi = { renk: silgi ? '#fff' : renk, kalin: silgi ? 34 : kalin, p: [nokta(e)] };
      ciz();
    });
    cv.addEventListener('pointermove', (e) => aktifCizgi && (aktifCizgi.p.push(nokta(e)), ciz()));
    const bitir = () => aktifCizgi && (cizgi.push(aktifCizgi), (aktifCizgi = null), ciz());
    cv.addEventListener('pointerup', bitir);
    cv.addEventListener('pointercancel', bitir);
    K.$('#crBalon', m.el).addEventListener('input', ciz);
    m.el.addEventListener('click', (e) => {
      const r = e.target.closest('[data-cr-renk]');
      if (r) {
        renk = r.dataset.crRenk;
        silgi = false;
        K.$$('[data-cr-renk]', m.el).forEach((b) => b.classList.toggle('on', b === r));
        return;
      }
      const b = e.target.closest('[data-cr]');
      if (!b) return;
      if (b.dataset.cr === 'kalin') (kalin = kalin === 4 ? 12 : 4), (b.textContent = kalin === 4 ? '✏️ İnce' : '🖍️ Kalın');
      if (b.dataset.cr === 'silgi') (silgi = !silgi), b.classList.toggle('on', silgi);
      if (b.dataset.cr === 'geri') cizgi.pop(), ciz();
      if (b.dataset.cr === 'kaydet') {
        if (!cizgi.length) return K.fx.toast('Önce bir şey çiz.');
        ciz();
        const full = cv.toDataURL('image/jpeg', 0.82);
        const k = document.createElement('canvas');
        k.width = 320;
        k.height = 240;
        k.getContext('2d').drawImage(cv, 0, 0, 320, 240);
        const bl = K.$('#crBalon', m.el).value.trim();
        m.close();
        onKaydet(full, k.toDataURL('image/jpeg', 0.75), bl);
      }
    });
    ciz();
  }
  function balon(g, metin) {
    g.font = '600 30px Fredoka, Nunito, sans-serif';
    const w = Math.min(560, g.measureText(metin).width + 44);
    g.fillStyle = '#fff';
    g.strokeStyle = '#3A1F2D';
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect ? g.roundRect(24, 20, w, 62, 30) : g.rect(24, 20, w, 62);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(70, 80);
    g.lineTo(60, 112);
    g.lineTo(98, 80);
    g.fill();
    g.stroke();
    g.fillStyle = '#3A1F2D';
    g.fillText(metin, 46, 62, w - 44);
  }
  async function kareKoy(b, full, thumb, balonMetin) {
    const big = await K.cloud.add('cizgikareimg', { img: full });
    const no = karesi(b.data.no).length + 1;
    const r = big && (await K.cloud.add('cizgikare', { bolum: b.data.no, no, thumb, full: big.id, balon: balonMetin }));
    if (!r) return K.fx.toast('Kare gönderilemedi.');
    kareler.push(r);
    K.stickers.award('cizgiroman');
    if (no === KARE) {
      K.fx.confetti({ count: 90, shapes: ['star', 'heart'] });
      K.stickers.award('cizgibolum');
      K.ping(`📖 "${b.data.ad}" bölümü bitti!`, `${K.meName()} on ikinci kareyi çizdi. Baştan sona oku.`, ['books'], { click: K.roomUrl('cizgiroman') });
    } else K.ping(`🖍️ Sıra sende: "${b.data.ad}" ${no + 1}. kare`, `${K.meName()} ${no}. kareyi çizdi.`, ['art'], { click: K.roomUrl('cizgiroman') });
    ciz();
  }
  async function yeniBolum() {
    const m = K.ui.modal({ label: 'Yeni bölüm', html: '<h2>Yeni bölüm</h2><p class="muted">İlk kareyi sen çizeceksin. Bölümün adı?</p><input class="input" id="crAd" maxlength="40" placeholder="ör. Kitty Bakü\'de Kayboluyor"><button class="btn" type="button" data-cr-ok>Başla</button>' });
    m.el.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-cr-ok]')) return;
      const ad = K.$('#crAd', m.el).value.trim() || 'Adsız bölüm';
      m.close();
      const r = await K.cloud.add('cizgibolum', { no: bolumler.length + 1, ad });
      if (r) bolumler.push(r), tuval((f, t, bl) => kareKoy(r, f, t, bl));
    });
  }
  async function oku(no) {
    const b = bolumler.find((x) => x.data.no === no);
    const l = karesi(no);
    const m = K.ui.modal({ label: b.data.ad, cls: 'cr-kitap', html: `<p class="card-eyebrow">${no}. bölüm</p><h2>${K.esc(b.data.ad)}</h2><div class="cr-sayfa">${l.map((k) => `<figure class="${k.who}"><img src="${k.data.thumb}" alt="${k.data.no}. kare" data-cr-full="${k.data.full}"><figcaption>${k.data.no} · ${K.esc(nameOf(k.who))}</figcaption></figure>`).join('')}</div>` });
    K.$$('[data-cr-full]', m.el).forEach(async (img) => {
      const u = await K.medya.rowUrl(img.dataset.crFull, 'img');
      u && (img.src = u);
    });
  }
  function ciz() {
    if (!root || K.activeRoom !== 'cizgiroman') return;
    const b = aktif();
    const sira = siraKimde(b);
    const l = b ? karesi(b.data.no) : [];
    K.$('#crIcerik', root).innerHTML = b
      ? `<section class="card cr-aktif"><p class="card-eyebrow">${b.data.no}. bölüm · ${l.length}/${KARE} kare</p><h3>${K.esc(b.data.ad)}</h3>
          <div class="cr-serit">${Array.from({ length: KARE }, (_, i) => (l[i] ? `<img src="${l[i].data.thumb}" alt="" class="${l[i].who}">` : `<span class="${i === l.length ? 'su' : ''}">${i + 1}</span>`)).join('')}</div>
          ${sira === mine() ? `<button class="btn" type="button" data-cr="ciz">🖍️ ${l.length + 1}. kareyi çiz</button><p class="muted small">${l.length ? `Önceki karede ${K.esc(nameOf(other()))} ne çizmiş, bak ve hikâyeyi sürdür.` : ''}</p>` : `<p class="muted">Sıra ${K.esc(nameOf(other()))}'da. Çizince sana haber gelecek.</p>`}</section>`
      : `<section class="card cr-aktif"><p>Yeni bir bölüm başlat: ilk kareyi sen çiz, adını sen koy.</p><button class="btn" type="button" data-cr="yeni">📖 Yeni bölüm</button></section>`;
    const biten = bolumler.filter((x) => karesi(x.data.no).length >= KARE).sort((a, c) => c.data.no - a.data.no);
    K.$('#crKitap', root).innerHTML = biten.length ? `<h3 class="an-baslik">Kitabımız</h3><div class="cr-raf">${biten.map((x) => `<button type="button" class="cr-cilt" data-cr-oku="${x.data.no}"><img src="${karesi(x.data.no)[0].data.thumb}" alt=""><b>${K.esc(x.data.ad)}</b><small>${x.data.no}. bölüm</small></button>`).join('')}</div>` : '';
  }
  K.room({
    id: 'cizgiroman',
    wing: 'oyun',
    title: 'Sıra Çizgi Roman',
    sub: 'Bir kare sen, bir kare o; on iki karede bir bölüm',
    icon: 'comic',
    color: '#FFF3C4',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (aktif() && siraKimde(aktif()) === mine() ? 'Sıra sende' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir kare o çizer, bir kare sen. Önceki kareye bakıp hikâyeyi sürdürürsün; on iki karede bir bölüm biter, bölümler bizim çizgi roman kitabımız olur.</p></div><div id="crIcerik"></div><div id="crKitap"></div>`;
      el.addEventListener('click', (e) => {
        const o = e.target.closest('[data-cr-oku]');
        if (o) return oku(+o.dataset.crOku);
        const b = e.target.closest('[data-cr]');
        if (!b) return;
        if (b.dataset.cr === 'yeni') yeniBolum();
        if (b.dataset.cr === 'ciz') {
          const a = aktif();
          a && tuval((f, t, bl) => kareKoy(a, f, t, bl));
        }
      });
    },
    async enter() {
      [bolumler, kareler] = await Promise.all([K.cloud.list('cizgibolum', 100), K.cloud.list('cizgikare', 1200)]);
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [bolumler, kareler] = await Promise.all([K.cloud.list('cizgibolum', 100), K.cloud.list('cizgikare', 1200)]);
    K.cloud.on('cizgikare', (r) => kareler.some((x) => x.id === r.id) || (kareler.push(r), ciz()));
    K.cloud.on('cizgibolum', (r) => bolumler.some((x) => x.id === r.id) || (bolumler.push(r), ciz()));
  });
})();
