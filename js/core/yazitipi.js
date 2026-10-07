/* Bizim Yazı Karakterlerimiz (Kale 4.0) — ikinizin el yazısından iki yazı karakteri.
   Şablon: her harfi bir kez, kılavuz çizgili bir karede parmakla yazarsın; kale çizgileri sadeleştirip saklar.
   Sonra kavanoz notları, minnet cümleleri ve kalenin "el yazısı" yerleri yazanın KENDİ el yazısıyla çizilir
   (her kelime küçük bir SVG; satır kendiliğinden kırılır; eksik harfte Caveat'a düşer).
   Kayıt: yazitipi {g: {harf: "x,y x,y|x,y ..."}, v: 1} (1000 birimlik kare; taban çizgisi 700) — en son kayıt geçerli.
   Büyük harfler küçük harfin %120'si olarak çizilir; Türkçe İ/I doğru eşlenir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const HARFLER = 'abcçdefgğhıijklmnoöprsştuüvyzqwx0123456789.,!?\'-:♡'.split('');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const fontlar = K.store.get('ytFont', {}); // önbellek: {me: {g}, her: {g}}
  const acik = () => !K.atolye || K.atolye.get().elyazim !== false;
  let root = null;

  /* ---------- Okuma ---------- */
  async function yukle() {
    if (!K.cloud || !K.cloud.enabled) return;
    const rows = await K.cloud.list('yazitipi', 20);
    ['me', 'her'].forEach((w) => {
      const r = rows.filter((x) => x.who === w).sort((a, b) => b.at - a.at)[0];
      if (r && r.data && r.data.g) fontlar[w] = { g: r.data.g, at: r.at };
    });
    K.store.set('ytFont', fontlar);
  }
  const var_ = (w) => Boolean(fontlar[w] && Object.keys(fontlar[w].g).length >= 20);

  /* ---------- Çizim ---------- */
  const coz = (str) => str.split('|').map((st) => st.trim().split(' ').map((p) => p.split(',').map(Number)).filter((p) => p.length === 2 && !isNaN(p[0])));
  const cache = {};
  function glif(w, ch) {
    const key = w + ch;
    if (cache[key] !== undefined) return cache[key];
    const g = fontlar[w] && fontlar[w].g[ch];
    if (!g) return (cache[key] = null);
    const st = coz(g);
    let mn = 1000, mx = 0;
    st.forEach((s) => s.forEach(([x]) => ((mn = Math.min(mn, x)), (mx = Math.max(mx, x)))));
    const d = st.map((s) => (s.length === 1 ? `M${s[0][0]} ${s[0][1]}l0.1 0` : 'M' + s.map((p) => p.join(' ')).join('L'))).join('');
    return (cache[key] = { d, mn, w: Math.max(60, mx - mn) });
  }
  function kelime(w, word, renk) {
    let x = 20;
    const parca = [];
    [...word].forEach((c, i) => {
      const kucuk = c.toLocaleLowerCase('tr');
      const buyuk = kucuk !== c;
      const g = glif(w, kucuk);
      const rot = ((K.hash(word + i) % 7) - 3) * 0.7;
      if (g) {
        const k = buyuk ? 1.2 : 1;
        parca.push(`<path d="${g.d}" transform="translate(${x} 700) scale(${k}) rotate(${rot} ${g.w / 2} 0) translate(${-g.mn} -700)" />`);
        x += g.w * k + 70;
      } else {
        parca.push(`<text x="${x}" y="700" font-size="640" font-family="Caveat, cursive" fill="${renk}" stroke="none">${K.esc(c)}</text>`);
        x += 330;
      }
    });
    return `<svg class="yt-kelime" viewBox="0 60 ${x + 20} 1000" style="width:${((x + 40) / 1000) * 1.5}em" aria-hidden="true"><g fill="none" stroke="${renk}" stroke-width="58" stroke-linecap="round" stroke-linejoin="round">${parca.join('')}</g></svg>`;
  }
  // Metni yazanın el yazısıyla döndürür (HTML). Yazı tipi yoksa ya da kapalıysa düz, kaçışlı metin.
  function html(text, w, opt = {}) {
    const t = String(text == null ? '' : text);
    if (!t || !acik() || !var_(w)) return K.esc(t);
    const renk = opt.renk || 'currentColor';
    return `<span class="yt-metin" role="img" aria-label="${K.esc(t)}">${t.split(/(\s+)/).map((p) => (/^\s+$/.test(p) ? (p.includes('\n') ? '<br>' : ' ') : p ? kelime(w, p, renk) : '')).join('')}</span>`;
  }

  /* ---------- Şablon: harf harf yazma ---------- */
  let taslak = K.store.get('ytTaslak', {});
  let sira = 0, cizgiler = [], aktif = null;
  function tuval() {
    const cv = K.$('#ytTuval', root);
    const g = cv.getContext('2d');
    const r = cv.width;
    g.clearRect(0, 0, r, r);
    const y = (v) => (v / 1000) * r;
    g.lineWidth = 2;
    [[150, '#E8D5DE'], [400, '#9FD8FF'], [700, '#FF8FB8'], [880, '#E8D5DE']].forEach(([v, c]) => {
      g.strokeStyle = c;
      g.setLineDash(v === 700 ? [] : [8, 8]);
      g.beginPath();
      g.moveTo(0, y(v));
      g.lineTo(r, y(v));
      g.stroke();
    });
    g.setLineDash([]);
    g.fillStyle = 'rgba(58,31,45,.08)';
    g.font = `${y(640)}px Caveat, cursive`;
    g.textAlign = 'center';
    g.fillText(HARFLER[sira], r / 2, y(700));
    g.strokeStyle = '#3A1F2D';
    g.lineWidth = y(58);
    g.lineCap = g.lineJoin = 'round';
    cizgiler.concat(aktif ? [aktif] : []).forEach((s) => {
      g.beginPath();
      s.forEach(([px, py], i) => (i ? g.lineTo(y(px), y(py)) : g.moveTo(y(px), y(py))));
      if (s.length === 1) g.lineTo(y(s[0][0]) + 0.1, y(s[0][1]));
      g.stroke();
    });
  }
  // Ramer–Douglas–Peucker ile sadeleştirme
  function sade(p, e) {
    if (p.length < 3) return p;
    const [a, b] = [p[0], p[p.length - 1]];
    let mx = 0, ix = 0;
    p.forEach((q, i) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.abs(dy * q[0] - dx * q[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
      if (d > mx) (mx = d), (ix = i);
    });
    return mx > e ? sade(p.slice(0, ix + 1), e).slice(0, -1).concat(sade(p.slice(ix), e)) : [a, b];
  }
  function kaydetHarf() {
    if (!cizgiler.length) return false;
    taslak[HARFLER[sira]] = cizgiler.map((s) => sade(s, 6).map((p) => p.map(Math.round).join(',')).join(' ')).join('|');
    K.store.set('ytTaslak', taslak);
    return true;
  }
  function git(i) {
    sira = (i + HARFLER.length) % HARFLER.length;
    const t = taslak[HARFLER[sira]];
    cizgiler = t ? coz(t) : [];
    ciz();
  }
  function ciz() {
    if (!root) return;
    const n = HARFLER.filter((h) => taslak[h]).length;
    K.$('#ytHarf', root).textContent = HARFLER[sira];
    K.$('#ytSay', root).textContent = `${n} / ${HARFLER.length}`;
    K.$('#ytIlerleme', root).style.width = (n / HARFLER.length) * 100 + '%';
    K.$('#ytIzgara', root).innerHTML = HARFLER.map((h, i) => `<button type="button" class="${taslak[h] ? 'tamam' : ''} ${i === sira ? 'su' : ''}" data-yt-git="${i}">${K.esc(h)}</button>`).join('');
    K.$('#ytKaydet', root).disabled = n < 20;
    tuval();
    onizle();
  }
  function onizle() {
    const box = K.$('#ytOnizle', root);
    if (!box) return;
    const eski = fontlar[mine()];
    fontlar[mine()] = { g: Object.assign({}, eski ? eski.g : {}, taslak) };
    Object.keys(cache).forEach((k) => delete cache[k]);
    const ornek = K.$('#ytOrnek', root).value || 'seni çok seviyorum';
    box.innerHTML = Object.keys(fontlar[mine()].g).length >= 3 ? `<p class="yt-onizleme">${html(ornek, mine(), { renk: '#3A1F2D' })}</p>` : '<p class="muted small">Birkaç harf yazınca önizleme burada belirir.</p>';
    if (eski) fontlar[mine()] = eski;
    else delete fontlar[mine()];
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
  async function bulutaKaydet() {
    const g = Object.assign({}, fontlar[mine()] ? fontlar[mine()].g : {}, taslak);
    await K.cloud.add('yazitipi', { g, v: 1 });
    fontlar[mine()] = { g, at: Date.now() };
    K.store.set('ytFont', fontlar);
    Object.keys(cache).forEach((k) => delete cache[k]);
    K.fx.toast('✍️ <b>Yazı karakterin hazır.</b> Kavanoz notların ve minnet cümlelerin artık senin el yazınla görünecek.', { duration: 5000 });
    K.ping && K.ping(`✍️ ${nameOf(mine())} kendi el yazısından bir yazı karakteri yaptı`, 'Notları artık onun el yazısıyla okuyacaksın.', ['writing_hand'], { click: K.roomUrl('yazitipi') });
    K.stickers.award('yazitipi');
    oda();
  }
  function oda() {
    if (!root) return;
    const o = other();
    K.$('#ytDurum', root).innerHTML = `<div class="yt-durum">${['me', 'her'].map((w) => `<div class="card yt-kisi"><p class="card-eyebrow">${K.esc(nameOf(w))}</p>${var_(w) ? `<p class="yt-onizleme">${html(w === mine() ? 'benim el yazım' : 'seni seviyorum', w)}</p>` : `<p class="muted small">${w === o ? 'Henüz yazmadı.' : 'Aşağıdan harflerini yaz.'}</p>`}</div>`).join('')}</div>`;
  }

  K.room({
    id: 'yazitipi',
    wing: 'kalp',
    title: 'Bizim Yazı Karakterlerimiz',
    sub: 'İkinizin el yazısından iki yazı tipi',
    icon: 'pencil',
    color: '#FFF3C4',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Harfleri bir kez, kendi elinle yaz. Kale onlardan senin yazı karakterini yapar; kavanoz notların ve minnet cümlelerin artık onun ekranında <b>senin el yazınla</b> görünür.</p></div>
        <div id="ytDurum"></div>
        <section class="card yt-sablon">
          <div class="yt-ust"><p class="card-eyebrow">Sıradaki harf</p><b class="yt-harf" id="ytHarf">a</b><span class="muted small" id="ytSay"></span></div>
          <div class="yt-cubuk"><i id="ytIlerleme"></i></div>
          <canvas id="ytTuval" class="yt-tuval" width="600" height="600" aria-label="Harfi buraya parmağınla yaz"></canvas>
          <p class="muted small center">Pembe çizgi taban, mavi kesikli çizgi küçük harflerin boyu. Soluk harf yalnızca yer göstermek için.</p>
          <div class="yt-dugmeler"><button class="btn ghost small" type="button" data-yt="geri">↶ Geri al</button><button class="btn ghost small" type="button" data-yt="sil">Sil</button><button class="btn ghost small" type="button" data-yt="onceki">‹ Önceki</button><button class="btn small" type="button" data-yt="sonraki">Sonraki ›</button></div>
          <div class="yt-izgara" id="ytIzgara"></div>
        </section>
        <section class="card yt-on"><p class="card-eyebrow">Önizleme</p><input class="input" id="ytOrnek" maxlength="60" value="seni çok seviyorum"><div id="ytOnizle"></div>
          <button class="btn" type="button" id="ytKaydet" data-yt="kaydet">Yazı karakterimi kaydet</button><p class="muted small">En az 20 harf yazınca kaydedebilirsin; eksik harfler düz el yazısı yazı tipine düşer. Sonra istediğin harfi yeniden yazıp tekrar kaydedebilirsin.</p></section>`;
      const cv = K.$('#ytTuval', el);
      const nokta = (e) => {
        const r = cv.getBoundingClientRect();
        return [Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)), Math.max(0, Math.min(1000, ((e.clientY - r.top) / r.height) * 1000))];
      };
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        cv.setPointerCapture(e.pointerId);
        aktif = [nokta(e)];
        tuval();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!aktif) return;
        const p = nokta(e), q = aktif[aktif.length - 1];
        if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 4) aktif.push(p);
        tuval();
      });
      const bitir = () => {
        if (!aktif) return;
        cizgiler.push(aktif);
        aktif = null;
        tuval();
      };
      cv.addEventListener('pointerup', bitir);
      cv.addEventListener('pointercancel', bitir);
      K.$('#ytOrnek', el).addEventListener('input', onizle);
      el.addEventListener('click', (e) => {
        const g = e.target.closest('[data-yt-git]');
        if (g) return kaydetHarf(), git(+g.dataset.ytGit);
        const b = e.target.closest('[data-yt]');
        if (!b) return;
        const k = b.dataset.yt;
        if (k === 'geri') cizgiler.pop(), tuval();
        if (k === 'sil') (cizgiler = []), delete taslak[HARFLER[sira]], K.store.set('ytTaslak', taslak), ciz();
        if (k === 'onceki') kaydetHarf(), git(sira - 1);
        if (k === 'sonraki') {
          kaydetHarf();
          const sonraki = HARFLER.findIndex((h, i) => i > sira && !taslak[h]);
          git(sonraki >= 0 ? sonraki : sira + 1);
        }
        if (k === 'kaydet') kaydetHarf(), bulutaKaydet();
      });
    },
    async enter() {
      await yukle();
      const ilk = HARFLER.findIndex((h) => !taslak[h]);
      git(ilk >= 0 ? ilk : 0);
      oda();
    },
  });
  K.on('cloud', (ok) => ok && setTimeout(yukle, 3000));
  K.on('built', () => K.cloud && K.cloud.on && K.cloud.on('yazitipi', () => yukle()));
  K.yazitipi = { html, var: var_, yukle, HARFLER };
})();
