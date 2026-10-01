/* Oda: Günün Karesi — her gün bir konu ("Gökyüzü", "Ayakkabıların", "Penceren"...), iki fotoğraf: biri İstanbul'dan, biri Bakü'den.
   Onunki, sen kendi fotoğrafını koyana kadar bulanık kalır; ikisi de gelince yan yana tek bir kare olur. Zamanla iki şehirden bir albüm.
   Kayıtlar: kare {day, p, thumb, full} + kareimg {img} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KR = () => D.kare || { intro: [], prompts: ['Gökyüzü'] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cityOf = (w) => (w === 'her' ? C.herCity || 'Bakü' : C.myCity || 'İstanbul');

  let root, rows = [], loaded = null;

  const promptOf = (k) => {
    const p = KR().prompts || ['Gökyüzü'];
    const n = T.dayNumber(T.at(k));
    return p[((n % p.length) + p.length) % p.length];
  };
  const of = (k, w) => rows.filter((r) => r.data.day === k && r.who === w).sort((a, b) => a.at - b.at).pop();
  const mineDone = (k) => Boolean(of(k, mine()));
  const days = () => [...new Set(rows.map((r) => r.data.day))].sort().reverse();
  function streak() {
    let n = 0, k = T.todayKey();
    const prev = (x) => {
      const d = new Date(x + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    };
    if (!(of(k, 'me') && of(k, 'her'))) k = prev(k);
    while (of(k, 'me') && of(k, 'her')) {
      n++;
      k = prev(k);
    }
    return n;
  }

  function shrink(file, max, q) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => res(null);
      img.src = URL.createObjectURL(file);
    });
  }
  function half(r, w, k) {
    const me = w === mine();
    if (!r) return `<figure class="kr-half empty ${w}"><div class="kr-ph">${me ? `<label class="btn red small">${A.ui('camera')} Fotoğrafını koy<input type="file" accept="image/*" hidden data-kr-up></label>` : `<span>${K.esc(nameOf(w))} henüz koymadı</span>`}</div><figcaption>${K.esc(cityOf(w))} · ${K.esc(nameOf(w))}</figcaption></figure>`;
    const hidden = !me && !mineDone(k);
    return `<figure class="kr-half ${w} ${hidden ? 'veiled' : ''}"><button type="button" class="kr-img" data-kr-full="${r.id}" ${hidden ? 'disabled' : ''}><img src="${r.data.thumb}" alt="${K.esc(cityOf(w))}"></button>${hidden ? `<span class="kr-veil">Seninki gelince açılır</span>` : ''}<figcaption>${K.esc(cityOf(w))} · ${K.esc(nameOf(w))} <small>${K.esc(K.ago(r.at))}</small></figcaption></figure>`;
  }
  function render() {
    if (!root) return;
    const k = T.todayKey();
    const both = of(k, 'me') && of(k, 'her');
    const s = streak();
    K.$('#krToday', root).innerHTML = `<p class="card-eyebrow">Bugünün konusu · ${K.esc(T.fmt(k))}</p><h2 class="kr-p">${K.esc(promptOf(k))}</h2>
      <div class="kr-pair ${both ? 'both' : ''}">${half(of(k, 'me'), 'me', k)}${half(of(k, 'her'), 'her', k)}</div>
      ${both ? '<p class="kr-done">İki şehir, aynı gün, aynı konu. ♥</p>' : ''}
      <p class="kr-meta">${s ? `🔥 <b>${s}</b> gün üst üste ikiniz de` : 'İkiniz de koyunca seri başlar'} · ${days().length} günlük albüm</p>`;
    const past = days().filter((d) => d !== k);
    K.$('#krAlbum', root).innerHTML = past.length
      ? `<p class="card-eyebrow">Albüm</p><div class="kr-grid">${past
          .map((d) => {
            const a = of(d, 'me'), b = of(d, 'her');
            const cell = (r, w) => (r ? (w === mine() || mineDone(d) ? `<img src="${r.data.thumb}" alt="">` : '<span class="kr-q">?</span>') : '<span class="kr-q">—</span>');
            return `<button type="button" class="kr-cell" data-kr-day="${d}"><span class="kr-two">${cell(a, 'me')}${cell(b, 'her')}</span><b>${K.esc(promptOf(d))}</b><small>${K.esc(T.fmtShort(d))}</small></button>`;
          })
          .join('')}</div>`
      : '';
  }
  async function upload(file) {
    const k = T.todayKey();
    const box = K.$('.kr-half.' + mine(), root);
    if (box) box.classList.add('loading');
    const [full, thumb] = await Promise.all([shrink(file, 1400, 0.82), shrink(file, 520, 0.74)]);
    const big = full && (await K.cloud.add('kareimg', { img: full }));
    const r = big && (await K.cloud.add('kare', { day: k, p: promptOf(k), thumb, full: big.id }));
    if (!r) {
      if (box) box.classList.remove('loading');
      return K.fx.toast('Fotoğraf gönderilemedi. İnternet bağlantını kontrol et.');
    }
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    K.audio.sfx.success();
    K.stickers.award('kare');
    if (of(k, other())) {
      K.fx.confetti({ count: 90, shapes: ['heart'] });
      K.fx.toast(`<b>Kare tamamlandı!</b> ${K.esc(K.ek(nameOf(other()), 'in'))} fotoğrafı açıldı.`, { icon: A.icon('camera') });
    } else K.fx.toast(`<b>Koydun.</b> ${K.esc(nameOf(other()))} koyunca kare tamamlanır.`, { icon: A.icon('camera') });
    if (!K.isOwner()) K.notify(`Günün Karesi: ${C.herName} "${promptOf(k)}" fotoğrafını koydu`, of(k, other()) ? 'Kare tamamlandı!' : 'Seninki bekleniyor.', ['camera']);
    render();
  }
  async function full(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    const h = r.data.full && (await K.cloud.get(r.data.full));
    K.ui.modal({ label: r.data.p, cls: 'kr-view', html: `<img src="${(h && h.data && h.data.img) || r.data.thumb}" alt=""><p class="card-eyebrow">${K.esc(r.data.p)} · ${K.esc(cityOf(r.who))} · ${K.esc(T.fmt(r.data.day))}</p>` });
  }
  function dayView(d) {
    K.ui.modal({
      label: promptOf(d),
      cls: 'kr-dayv',
      html: `<p class="card-eyebrow">${K.esc(T.fmt(d))}</p><h2>${K.esc(promptOf(d))}</h2><div class="kr-pair">${half(of(d, 'me'), 'me', d)}${half(of(d, 'her'), 'her', d)}</div>`,
    }).body.addEventListener('click', (e) => {
      const f = e.target.closest('[data-kr-full]');
      if (f && !f.disabled) full(f.dataset.krFull);
    });
  }

  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (loaded = loaded || (async () => {
      const got = await K.cloud.list('kare', 400);
      got.forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
      if (K.activeRoom === 'kare') render();
    })());
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    const since = T.at(T.todayKey()).getTime() - 864e5;
    const recent = await K.cloud.many(['kare'], { since, limit: 10 });
    recent.forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
    K.cloud.on('kare', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine() && r.data.day === T.todayKey()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} Günün Karesi'ni koydu: ${K.esc(r.data.p)}.</b> ${mineDone(r.data.day) ? '<a href="#kare">Kareye bak</a>' : '<a href="#kare">Seninkini koy</a>'}`, { icon: A.icon('camera'), duration: 8000 });
      if (K.activeRoom === 'kare') render();
      else K.renderSpecials && K.renderSpecials();
    });
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const k = T.todayKey();
    const t = of(k, other());
    if (t && !mineDone(k)) return [{ icon: 'camera', title: `Günün Karesi: ${nameOf(other())} "${promptOf(k)}" fotoğrafını koydu`, text: 'Seninkini koyunca onunki açılır; ikisi yan yana tek kare olur.', room: 'kare', cta: 'Seninkini koy' }];
    return [];
  });
  K.kare = { mineDone, promptOf, doneBy: (w, k = T.todayKey()) => Boolean(of(k, w)) };

  K.room({
    id: 'kare',
    wing: 'anilar',
    title: 'Günün Karesi',
    sub: () => `Bugün: ${promptOf(T.todayKey())}`,
    icon: 'camera',
    color: '#FFE9D6',
    hidden: () => !D.kare || !K.cloud || !K.cloud.enabled,
    badge: () => (mineDone(T.todayKey()) ? '' : 'Bugünkü seni bekliyor'),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KR().intro)}</div><section class="card kr-today" id="krToday"></section><section class="kr-album" id="krAlbum"></section>`;
      el.addEventListener('change', (e) => {
        if (e.target.matches('[data-kr-up]') && e.target.files[0]) upload(e.target.files[0]);
      });
      el.addEventListener('click', (e) => {
        const f = e.target.closest('[data-kr-full]');
        if (f && !f.disabled) return full(f.dataset.krFull);
        const d = e.target.closest('[data-kr-day]');
        if (d) dayView(d.dataset.krDay);
      });
    },
    enter() {
      render();
      loadAll();
    },
  });
})();
