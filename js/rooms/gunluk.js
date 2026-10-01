/* Oda: Bakü Günlüğü — buluşma günlerinin ortak defteri.
   Önce: ikisi de "kavuşunca aç" mektubu yazar; mektuplar uçak Bakü'ye indiği anda (biniş kartı yoksa hedefin ilk günü) açılır.
   O günlerde ve sonra: her gün bir sayfa; ikisi de fotoğraf (şifreli, küçük önizleme + istenince büyüğü) ve günün cümlesini ekler.
   Fotoğraflar bir yere iğnelenebilir: Bakü'de İlk Gün haritasında o yer "gittik" olur. Kale Kitabı'na bölüm olarak girer. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], day = null, busy = false;
  const GL = () => D.gunluk || { intro: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const addDays = (k, n) => T.key(T.baku(new Date(T.at(k).getTime() + n * 864e5 + 3600e3)));

  /* ---------- Buluşma penceresi ---------- */
  function win() {
    const f = K.bilet && K.bilet.get();
    if (f) return { from: f.date, to: f.back || addDays(f.date, 3), open: (K.bilet.arrival && K.bilet.arrival()) || T.at(f.date).getTime(), src: 'flight' };
    const t = K.nezaman && K.nezaman.target();
    if (t) return { from: t.from, to: t.to, open: T.at(t.from).getTime(), src: 'target' };
    return null;
  }
  const phase = (w) => (!w ? 'none' : T.now().getTime() < w.open ? 'pre' : T.todayKey() <= w.to ? 'during' : 'after');
  const days = (w) => {
    const out = [];
    for (let k = w.from; k <= w.to && out.length < 30; k = addDays(k, 1)) out.push(k);
    return out;
  };
  const of = (kind) => rows.filter((r) => r.kind === kind);
  const letter = (who) => of('kletter').filter((r) => r.who === who && r.data.text).pop();
  const photos = (d) => of('kphoto').filter((r) => !d || r.data.day === d);
  const note = (d, who) => of('knote').filter((r) => r.data.day === d && r.who === who).pop();
  const places = () => (D.ilkgun ? D.ilkgun.places : []);

  /* ---------- Fotoğraf küçültme ---------- */
  function shrink(file, max, q) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res({ data: c.toDataURL('image/jpeg', q), w: c.width, h: c.height });
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }

  /* ---------- Çizim ---------- */
  function lettersHtml(ph, w) {
    const my = letter(mine()), ot = letter(other());
    if (ph === 'pre' || ph === 'none') {
      const when = w ? (w.src === 'flight' ? 'uçak Bakü\'ye indiği an' : `${T.fmt(w.from)} sabahı`) : 'buluşma günü belli olunca';
      return `<section class="card gl-letters"><p class="card-eyebrow">Kavuşunca aç</p>
        <p class="muted small">İkimiz de birer mektup yazıyoruz; ${K.esc(when)} ikisi birden açılacak. O zamana kadar ikimiz de okuyamayız, ben bile.</p>
        <div class="gl-seals"><span class="${my ? 'on' : ''}">${A.icon('letter')}<small>${K.esc(nameOf(mine()))}: ${my ? 'mühürlendi' : 'henüz yok'}</small></span><span class="${ot ? 'on' : ''}">${A.icon('letter')}<small>${K.esc(nameOf(other()))}: ${ot ? 'mühürlendi' : 'henüz yok'}</small></span></div>
        <textarea class="input gl-ta" id="glLetter" name="glLetter" maxlength="1500" rows="5" placeholder="${my ? 'Yeniden yazarsan eskisinin yerini alır.' : 'Kavuştuğumuz gün okuyacağın mektup...'}"></textarea>
        <button type="button" class="btn red small" data-gl="letter">${A.icon('letter')} Mühürle</button></section>`;
    }
    return `<section class="card gl-letters open"><p class="card-eyebrow">Kavuşunca açılan mektuplar</p>
      ${[my, ot].filter(Boolean).map((r) => `<article class="gl-letter ${r.who}"><b>${K.esc(nameOf(r.who))}</b><div class="hand">${K.paras(String(r.data.text).split(/\n+/))}</div></article>`).join('') || '<p class="muted small">Mektup yazılmamış.</p>'}</section>`;
  }
  function dayHtml(d, i, ph) {
    const p = T.baku(T.at(d));
    const ps = photos(d);
    const canAdd = ph === 'during' || ph === 'after' || K.isOwner();
    const n1 = note(d, 'her'), n2 = note(d, 'me');
    return `<section class="card gl-day"><p class="card-eyebrow">${i + 1}. gün · ${p.d} ${K.MONTHS[p.mo - 1]}, ${T.dayName(p)}</p>
      <div class="gl-notes">${[['her', n1], ['me', n2]].map(([w, n]) => `<p class="gl-note ${w}">${n ? `<span class="hand">"${K.esc(n.data.text)}"</span>` : `<span class="muted small">${K.esc(nameOf(w))} henüz günün cümlesini yazmadı.</span>`}<small>${K.esc(nameOf(w))}</small></p>`).join('')}</div>
      ${canAdd ? `<div class="gl-row"><input class="input" id="glNote" name="glNote" maxlength="140" placeholder="Günün cümlesi (${note(d, mine()) ? 'yenisi eskisinin yerini alır' : 'bir satır'})"><button type="button" class="btn soft small" data-gl="note">Yaz</button></div>` : ''}
      <div class="gl-grid">${ps.map((r) => `<button type="button" class="gl-ph ${r.who}" data-ph="${r.id}" aria-label="${K.esc(r.data.cap || 'Fotoğraf')}"><img src="${r.data.thumb}" alt="">${r.data.place ? `<span class="gl-pin">${A.icon('map')}</span>` : ''}</button>`).join('')}
        ${canAdd ? `<label class="gl-add">${A.ui('plus')}<span>Fotoğraf</span><input type="file" accept="image/*" multiple data-up hidden></label>` : ''}</div>
      ${canAdd ? `<div class="gl-row gl-meta"><input class="input" id="glCap" name="glCap" maxlength="120" placeholder="Fotoğrafa bir not (isteğe bağlı)"><select class="input" id="glPlace" name="glPlace" aria-label="Nerede?"><option value="">Nerede? (isteğe bağlı)</option>${places().map((pl) => `<option value="${K.esc(pl.id)}">${K.esc(pl.name)}</option>`).join('')}</select></div><p class="muted small" id="glUp"></p>` : ''}
    </section>`;
  }
  function render() {
    if (!root) return;
    const w = win();
    const ph = phase(w);
    const top = K.$('#glTop', root);
    if (ph === 'none') top.innerHTML = `<p class="muted">Buluşma tarihi belli olunca (Ne Zaman? takviminde hedef ya da biniş kartı) bu defter o günlere göre açılır.</p>`;
    else if (ph === 'pre') {
      const ms = w.open - T.now().getTime();
      const dd = Math.floor(ms / 864e5), hh = Math.floor((ms % 864e5) / 3600e3);
      top.innerHTML = `<div class="gl-count"><b>${dd > 0 ? K.num(dd) : hh}</b><span>${dd > 0 ? 'gün' : 'saat'} sonra açılıyor</span></div><p class="muted small">${K.esc(T.fmtShort(w.from))} – ${K.esc(T.fmt(w.to))} · ${w.src === 'flight' ? 'biniş kartına göre' : 'ortak hedefe göre'}</p>`;
    } else top.innerHTML = `<div class="gl-count ${ph}"><b>${ph === 'during' ? 'Birlikteyiz' : 'Bakü Günlüğü'}</b><span>${K.esc(T.fmtShort(w.from))} – ${K.esc(T.fmt(w.to))} · ${photos().length} fotoğraf</span></div>`;
    K.$('#glLetters', root).innerHTML = lettersHtml(ph, w);
    const ds = w ? days(w) : [];
    if (!ds.length || (ph === 'pre' && !K.isOwner())) {
      K.$('#glDays', root).innerHTML = '';
      return;
    }
    if (!day || !ds.includes(day)) day = ds.includes(T.todayKey()) ? T.todayKey() : ph === 'after' ? ds[0] : ds[0];
    K.$('#glDays', root).innerHTML = `<div class="gl-tabs">${ds.map((d, i) => `<button type="button" class="chip" data-day="${d}" aria-pressed="${d === day}">${i + 1}. gün${photos(d).length ? ` · ${photos(d).length}` : ''}</button>`).join('')}</div>${dayHtml(day, ds.indexOf(day), ph)}`;
  }

  /* ---------- Eylemler ---------- */
  async function upload(files) {
    if (busy) return;
    busy = true;
    const msg = (t) => {
      const m = K.$('#glUp', root);
      if (m) m.textContent = t;
    };
    const cap = (K.$('#glCap', root) || {}).value || '';
    const place = (K.$('#glPlace', root) || {}).value || '';
    let n = 0;
    for (const f of Array.from(files).slice(0, 10)) {
      msg(`Hazırlanıyor ${n + 1}/${Math.min(10, files.length)}...`);
      const full = await shrink(f, 1600, 0.84);
      const thumb = await shrink(f, 380, 0.72);
      if (!full || !thumb) continue;
      if (full.data.length > 3500000) continue;
      const big = await K.cloud.add('kfull', { img: full.data });
      if (!big) break;
      await K.cloud.add('kphoto', { day, thumb: thumb.data, full: big.id, w: full.w, h: full.h, cap: cap.trim(), place });
      n++;
    }
    busy = false;
    msg(n ? `${n} fotoğraf eklendi.` : 'Fotoğraf eklenemedi.');
    if (n) {
      K.audio.sfx.chime();
      K.stickers.award('gunluk');
      K.ping(`${K.meName()} Bakü Günlüğü'ne ${n} fotoğraf ekledi`, cap || '', ['camera']);
    }
    render();
  }
  async function view(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    const pl = places().find((p) => p.id === r.data.place);
    const md = K.ui.modal({
      label: 'Fotoğraf',
      cls: 'gl-modal',
      html: `<figure class="gl-big"><img src="${r.data.thumb}" alt=""><figcaption>${r.data.cap ? `<span class="hand">${K.esc(r.data.cap)}</span>` : ''}<small>${K.esc(nameOf(r.who))}${pl ? ` · ${K.esc(pl.name)}` : ''} · ${K.esc(T.fmtShort(r.data.day))}</small></figcaption></figure>
        ${r.who === mine() ? `<button type="button" class="btn ghost small" data-gl-del="${r.id}">${A.ui('close')} Bu fotoğrafı sil</button>` : ''}`,
    });
    const big = r.data.full && (await K.cloud.get(r.data.full));
    if (big && big.data && big.data.img) {
      const im = K.$('.gl-big img', md.body);
      if (im) im.src = big.data.img;
    }
    md.body.addEventListener('click', async (e) => {
      const d = e.target.closest('[data-gl-del]');
      if (!d) return;
      if (d.dataset.armed !== '1') {
        d.dataset.armed = '1';
        d.textContent = 'Emin misin? Bir daha dokun';
        return;
      }
      if (r.data.full) await K.cloud.remove(r.data.full);
      await K.cloud.remove(r.id);
      md.close();
      render();
    });
  }

  const KINDS = ['kletter', 'kphoto', 'knote'];
  K.on('cloud', async (on) => {
    if (!on || !D.gunluk) return;
    const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 1000)));
    rows = got.flat().sort((a, b) => a.at - b.at);
    // Hedef ve biniş kartı da yüklenmiş olsun diye biraz sonra ana salon çipini tazele
    setTimeout(() => K.homeChip && !K.activeRoom && K.homeChip(), 1500);
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine()) {
          if (k === 'kletter') K.fx.toast(`<b>${K.esc(nameOf(r.who))} kavuşunca açılacak mektubunu mühürledi.</b>`, { icon: A.icon('letter') });
          if (k === 'kphoto') K.fx.toast(`<b>${K.esc(nameOf(r.who))} Bakü Günlüğü'ne fotoğraf ekledi.</b>`, { icon: A.icon('camera') });
        }
        if (K.activeRoom === 'gunluk') render();
        if (k === 'kphoto') K.emit('gunluk');
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'gunluk') render();
      K.emit('gunluk');
    });
  });
  K.gunluk = {
    // Buluşma günlerinde ana salon çipi (biniş kartı yoksa da)
    where() {
      const w = win();
      return w && phase(w) === 'during' ? { state: 'after', room: 'gunluk', chipIcon: 'heart', text: 'Aynı şehirdeyiz', chipSub: '0 km' } : null;
    },
    // İlk Gün haritası için: yer → o yerde çekilen fotoğrafların küçükleri
    visited() {
      const m = {};
      photos().forEach((r) => r.data.place && (m[r.data.place] = m[r.data.place] || []).push(r.data.thumb));
      return m;
    },
    // Kale Kitabı için
    book() {
      const w = win();
      if (!w || phase(w) === 'pre' || phase(w) === 'none') return null;
      return { w, days: days(w).map((d) => ({ d, photos: photos(d), notes: [note(d, 'her'), note(d, 'me')].filter(Boolean) })), letters: [letter('her'), letter('me')].filter(Boolean) };
    },
  };

  K.room({
    id: 'gunluk',
    wing: 'kalp',
    title: 'Bakü Günlüğü',
    sub: () => (phase(win()) === 'pre' ? 'Kavuşunca açılacak defter' : 'Birlikte geçen günlerin defteri'),
    icon: 'camera',
    color: '#FFE9D6',
    hidden: () => !D.gunluk || !K.cloud || !K.cloud.enabled || (!win() && !K.isOwner()),
    badge: () => {
      const w = win();
      const ph = phase(w);
      if (ph === 'during') return 'Birlikteyiz';
      if (ph === 'pre' && !letter(mine())) return 'Mektubunu yaz';
      return '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(GL().intro)}</div>
        <div class="gl-top" id="glTop"></div>
        <div id="glLetters"></div>
        <div id="glDays"></div>`;
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-gl]');
        if (b && b.dataset.gl === 'letter') {
          const text = K.$('#glLetter', el).value.trim();
          if (text.length < 5) return K.$('#glLetter', el).focus();
          const r = await K.cloud.add('kletter', { text });
          if (!r) return K.fx.toast('Gönderilemedi.');
          K.fx.toast('Mektubun mühürlendi. Kavuşunca açılacak.', { icon: A.icon('letter') });
          K.ping(`${K.meName()} kavuşunca açılacak mektubunu yazdı`, 'Mühürlü; sen de kavuşunca okuyacaksın.', ['love_letter']);
          return render();
        }
        if (b && b.dataset.gl === 'note') {
          const text = K.$('#glNote', el).value.trim();
          if (!text) return K.$('#glNote', el).focus();
          const r = await K.cloud.add('knote', { day, text });
          if (r) K.audio.sfx.pop();
          return render();
        }
        const t = e.target.closest('[data-day]');
        if (t) {
          day = t.dataset.day;
          return render();
        }
        const p = e.target.closest('[data-ph]');
        if (p) return view(p.dataset.ph);
      });
      el.addEventListener('change', (e) => {
        if (e.target.matches('[data-up]') && e.target.files.length) upload(e.target.files);
      });
    },
    enter() {
      render();
    },
  });
})();
