/* Oda: Aynı Sofra — görüntülü aramada birlikte yemek. Her yemeğin iki hâli var: İstanbul'da Türk usulü,
   Bakü'de Azerbaycan usulü (menemen / pomidor-yumurta, mercimek / mərci, gözleme / qutab...).
   Biri sofrayı kurar; ikiniz de kendi tarifinizi yaparsınız. Malzeme, adım ve zamanlayıcılar karşı tarafa canlı görünür.
   Sonunda iki tabağın fotoğrafı tek bir sofra kartında birleşir; birbirinizin tabağına kalp verirsiniz.
   Kayıtlar: sofra {sid, dish} · sfplate {sid, thumb, full} + sfimg {img} · sfrate {sid, stars}. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const SF = () => D.sofra || { intro: [], dishes: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const dishOf = (id) => SF().dishes.find((d) => d.id === id);
  const LIVE_H = 20;

  let root, rows = [], prog = {}, theirs = null, timerT = null, lock = null, pick = null;

  const sessions = () => rows.filter((r) => r.kind === 'sofra').sort((a, b) => b.at - a.at);
  const active = () => {
    const s = sessions()[0];
    return s && Date.now() - s.at < LIVE_H * 36e5 && !rows.some((r) => r.kind === 'sfend' && r.data.sid === s.data.sid) ? s : null;
  };
  const plates = (sid) => rows.filter((r) => r.kind === 'sfplate' && r.data.sid === sid);
  const plateOf = (sid, w) => plates(sid).filter((r) => r.who === w).pop();
  const rateOf = (sid, from) => rows.filter((r) => r.kind === 'sfrate' && r.data.sid === sid && r.who === from).pop();

  /* ---------- İlerleme (kendi cihazında saklanır, karşıya canlı gider) ---------- */
  function myProg(sid) {
    if (prog.sid !== sid) {
      const saved = K.store.get('sofraProg', null);
      prog = saved && saved.sid === sid ? saved : { sid, ing: [], steps: [], timer: null };
    }
    return prog;
  }
  const saveProg = () => K.store.set('sofraProg', prog);
  function broadcast() {
    const s = active();
    if (!s) return;
    const p = myProg(s.data.sid);
    K.cloud.send('sf', { t: 'prog', sid: s.data.sid, ing: p.ing, steps: p.steps, timer: p.timer ? { left: p.timer.end - Date.now(), label: p.timer.label } : null });
  }
  function onLive(m) {
    if (!m || m.who === mine()) return;
    const s = active();
    if (!s || m.sid !== s.data.sid) return;
    if (m.t === 'hello') return broadcast();
    if (m.t === 'prog') {
      theirs = { ing: m.ing || [], steps: m.steps || [], timer: m.timer && m.timer.left > 0 ? { end: Date.now() + m.timer.left, label: m.timer.label } : null, at: Date.now() };
      if (K.activeRoom === 'sofra') status();
    }
  }

  /* ---------- Zamanlayıcı ---------- */
  const mmss = (ms) => {
    const t = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(t / 60)}:${K.pad(t % 60)}`;
  };
  function tick() {
    const s = active();
    if (!s || !root) return;
    const p = myProg(s.data.sid);
    if (p.timer) {
      const left = p.timer.end - Date.now();
      const el = K.$('#sfTimer', root);
      if (el) el.innerHTML = left > 0 ? `<b>${mmss(left)}</b> ${K.esc(p.timer.label)}` : `<b>Süre doldu!</b> ${K.esc(p.timer.label)} <small>(kapatmak için dokun)</small>`;
      if (left <= 0 && !p.timer.rang) {
        p.timer.rang = true;
        saveProg();
        K.audio.sfx.chime();
        setTimeout(() => K.audio.sfx.chime(), 700);
        setTimeout(() => K.audio.sfx.chime(), 1400);
        K.vibrate([200, 100, 200, 100, 400]);
        K.fx.toast(`<b>Süre doldu:</b> ${K.esc(p.timer.label)}`, { icon: A.icon('pot'), duration: 8000 });
      }
    }
    status();
  }
  async function wake(on) {
    try {
      if (on && !lock && navigator.wakeLock) lock = await navigator.wakeLock.request('screen');
      if (!on && lock) {
        await lock.release();
        lock = null;
      }
    } catch (e) {
      lock = null;
    }
  }

  /* ---------- Çizim ---------- */
  function status() {
    const el = root && K.$('#sfThem', root);
    const s = active();
    if (!el || !s) return;
    const d = dishOf(s.data.dish);
    const o = other();
    const rec = d && d[o];
    const here = K.cloud.otherHere();
    if (!theirs || !rec) {
      el.innerHTML = `<span class="dot ${here ? 'on' : ''}"></span>${here ? `${K.esc(nameOf(o))} kalede; sofraya girince ilerlemesi burada görünür.` : `${K.esc(nameOf(o))} şu an kalede değil. Sen başla, o gelince katılır.`}`;
      return;
    }
    const ing = theirs.ing.filter(Boolean).length, st = theirs.steps.filter(Boolean).length;
    const next = rec.steps.findIndex((x, i) => !theirs.steps[i]);
    const tl = theirs.timer && theirs.timer.end - Date.now();
    el.innerHTML = `<span class="dot on"></span><b>${K.esc(nameOf(o))}</b> · malzeme ${ing}/${rec.ing.length} · adım ${st}/${rec.steps.length}${next >= 0 ? ` · şu an: <em>${K.esc(rec.steps[next][0].split(/[.;:]/)[0])}</em>` : ' · tabağı hazır!'}${tl > 0 ? ` · <span class="sf-their-t">${mmss(tl)} ${K.esc(theirs.timer.label)}</span>` : ''}`;
  }
  function recipeHTML(rec, p, own) {
    return `<div class="sf-ing"><h4>Malzemeler <small>${K.esc(rec.serves || '')}</small></h4><ul>${rec.ing
      .map((x, i) => `<li><label class="${p && p.ing[i] ? 'done' : ''}">${own ? `<input type="checkbox" data-ing="${i}" ${p.ing[i] ? 'checked' : ''}>` : '<span class="sf-b"></span>'}<span>${K.esc(x)}</span></label></li>`)
      .join('')}</ul></div>
      <ol class="sf-steps">${rec.steps
        .map(([tx, min], i) => {
          const done = own && p.steps[i];
          const cur = own && !done && rec.steps.findIndex((_, j) => !p.steps[j]) === i;
          return `<li class="${done ? 'done' : ''} ${cur ? 'cur' : ''}"><p>${K.esc(tx)}</p>${own ? `<div class="sf-sa"><button type="button" class="chip ${done ? 'on' : ''}" data-step="${i}">${done ? A.ui('check') + ' Bitti' : 'Bitti'}</button>${min ? `<button type="button" class="chip" data-timer="${i}">${A.ui('play')} ${min} dk</button>` : ''}</div>` : min ? `<small class="muted">${min} dk</small>` : ''}</li>`;
        })
        .join('')}</ol>`;
  }
  function plateHTML(s) {
    const sid = s.data.sid;
    const col = (w) => {
      const p = plateOf(sid, w);
      const r = rateOf(sid, w === mine() ? other() : mine());
      const canRate = p && w !== mine() && !rateOf(sid, mine());
      return `<figure class="sf-plate ${w}">${p ? `<button type="button" class="sf-pimg" data-sf-img="${p.id}"><img src="${p.data.thumb}" alt="${K.esc(K.ek(nameOf(w), 'in'))} tabağı"></button>` : `<div class="sf-pimg empty">${A.icon('pot')}</div>`}
        <figcaption><b>${K.esc(K.ek(nameOf(w), 'in'))} tabağı</b>${r ? `<span class="sf-hearts" aria-label="${r.data.stars} kalp">${'♥'.repeat(r.data.stars)}<i>${'♥'.repeat(5 - r.data.stars)}</i></span>${r.data.note ? `<em class="hand">"${K.esc(r.data.note)}"</em>` : ''}` : ''}</figcaption>
        ${w === mine() && !p ? `<label class="btn red small">${A.ui('camera')} Tabağımı göster<input type="file" accept="image/*" capture="environment" hidden data-sf-plate></label>` : ''}
        ${canRate ? `<div class="sf-rate"><p class="small">Kaç kalp?</p><div class="sf-stars">${[5, 4, 3, 2, 1].map((n) => `<button type="button" data-rate="${n}" aria-label="${n} kalp">♥</button>`).join('')}</div><input class="input" name="sfNote" maxlength="60" placeholder="Tek cümle yorum (isteğe bağlı)"></div>` : ''}
      </figure>`;
    };
    const both = plateOf(sid, 'me') && plateOf(sid, 'her');
    return `<div class="sf-plates">${col(mine())}${col(other())}</div>${both ? `<button type="button" class="btn red" data-sf-card="${sid}">${A.ui('download')} Sofra kartını kaydet</button>` : ''}`;
  }
  function render() {
    if (!root) return;
    const box = K.$('#sfMain', root);
    const s = active();
    if (!s) {
      wake(false);
      const d = pick && dishOf(pick);
      box.innerHTML = `<h3 class="sf-h">Bu akşam ne pişiriyoruz?</h3><div class="sf-dishes">${SF()
        .dishes.slice()
        .sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0))
        .map((x) => `<button type="button" class="sf-dish ${pick === x.id ? 'on' : ''} ${x.fav ? 'fav' : ''}" data-dish="${x.id}" style="--c:${x.color || '#FFE7F0'}">${x.fav ? `<span class="sf-fav">${K.esc(K.ek(C.herPet, 'in'))} favorisi</span>` : ''}<span class="sf-when">${K.esc(x.title)}</span><b>${K.esc(x.me.name)}</b><span class="sf-amp">&amp;</span><b>${K.esc(x.her.name)}</b><small>${K.esc(x.time || '')} · ${K.esc(x.level || '')}</small></button>`)
        .join('')}</div>
        ${d ? `<div class="sf-pick"><p>${K.esc(d.note || '')}</p><p class="small muted">${K.esc(C.myCity)}: ${K.esc(d.me.name)} · ${K.esc(C.herCity)}: ${K.esc(d.her.name)}</p><button type="button" class="btn red" data-sf-start="${d.id}">${A.icon('pot')} Sofrayı kur</button></div>` : '<p class="muted small">Bir yemek seç; ikiniz de kendi şehrinizin tarifini yapacaksınız.</p>'}`;
      gallery();
      return;
    }
    const d = dishOf(s.data.dish);
    if (!d) return;
    const p = myProg(s.data.sid);
    const mineRec = d[mine()], theirRec = d[other()];
    box.innerHTML = `<div class="sf-head" style="--c:${d.color || '#FFE7F0'}"><p class="card-eyebrow">${K.esc(d.title)} · ${K.esc(K.ek(nameOf(s.who), 'in'))} sofrası</p><h3>${K.esc(d.me.name)} <span>&amp;</span> ${K.esc(d.her.name)}</h3><p class="sf-them" id="sfThem"></p></div>
      <div class="sf-timer" id="sfTimer" ${p.timer ? '' : 'hidden'}></div>
      <section class="sf-rec own"><h3>Senin tarifin: ${K.esc(mineRec.name)}</h3>${mineRec.tip ? `<p class="sf-tip">${K.esc(mineRec.tip)}</p>` : ''}${recipeHTML(mineRec, p, true)}</section>
      <details class="sf-rec other"><summary>${K.esc(K.ek(nameOf(other()), 'in'))} tarifi: ${K.esc(theirRec.name)}</summary>${theirRec.tip ? `<p class="sf-tip">${K.esc(theirRec.tip)}</p>` : ''}${recipeHTML(theirRec, null, false)}</details>
      <h3 class="sf-h">Sofra</h3>${plateHTML(s)}
      <button type="button" class="btn ghost small sf-close" data-sf-end>Sofrayı kaldır</button>`;
    if (p.timer) K.$('#sfTimer', root).hidden = false;
    status();
    tick();
    wake(true);
    gallery();
  }
  function gallery() {
    const el = root && K.$('#sfGal', root);
    if (!el) return;
    const act = active();
    const past = sessions().filter((s) => (!act || s.id !== act.id) && plates(s.data.sid).length);
    el.innerHTML = past.length
      ? `<h3 class="sf-h">Sofralarımız</h3><div class="sf-past">${past
          .map((s) => {
            const d = dishOf(s.data.dish);
            const pm = plateOf(s.data.sid, 'me'), ph = plateOf(s.data.sid, 'her');
            return `<button type="button" class="sf-old" data-sf-old="${s.data.sid}"><span class="sf-two">${[pm, ph].map((x) => (x ? `<img src="${x.data.thumb}" alt="">` : `<i>${A.icon('pot')}</i>`)).join('')}</span><b>${K.esc(d ? `${d.me.name} & ${d.her.name}` : 'Sofra')}</b><small>${K.esc(T.fmtShort(s.data.day || new Date(s.at)))}</small></button>`;
          })
          .join('')}</div>`
      : '';
  }

  /* ---------- Sofra kartı ---------- */
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
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }
  const loadImg = (src) =>
    new Promise((res) => {
      if (!src) return res(null);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  async function fullOf(p) {
    if (!p) return null;
    const h = p.data.full && (await K.cloud.get(p.data.full));
    return (h && h.data && h.data.img) || p.data.thumb;
  }
  async function card(sid) {
    const s = sessions().find((x) => x.data.sid === sid);
    const d = s && dishOf(s.data.dish);
    if (!d) return null;
    await Promise.all(['700 40px Fredoka', '400 80px "Great Vibes"', '700 34px Caveat'].map((f) => (document.fonts ? document.fonts.load(f).catch(() => {}) : null)));
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    // Pembe kareli masa örtüsü
    x.fillStyle = '#FFF4F8';
    x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,111,163,0.28)';
    for (let i = 0; i < W; i += 60) x.fillRect(i, 0, 30, H);
    for (let j = 0; j < H; j += 60) x.fillRect(0, j, W, 30);
    x.textAlign = 'center';
    x.fillStyle = '#E3174D';
    x.font = '400 84px "Great Vibes", cursive';
    x.fillText('Aynı Sofra', W / 2, 140);
    x.fillStyle = '#4A2138';
    x.font = '700 44px Fredoka, sans-serif';
    x.fillText(`${d.me.name}  &  ${d.her.name}`, W / 2, 214);
    const [a, b] = await Promise.all([fullOf(plateOf(sid, 'me')), fullOf(plateOf(sid, 'her'))].map((pr) => pr.then(loadImg)));
    const R = 230;
    [[a, 'me', W / 2 - 250], [b, 'her', W / 2 + 250]].forEach(([im, w, cx]) => {
      const cy = 620;
      x.save();
      x.shadowColor = 'rgba(74,33,56,0.25)';
      x.shadowBlur = 30;
      x.shadowOffsetY = 12;
      x.fillStyle = '#fff';
      x.beginPath();
      x.arc(cx, cy, R + 34, 0, Math.PI * 2);
      x.fill();
      x.restore();
      x.strokeStyle = '#F6C9DA';
      x.lineWidth = 6;
      x.beginPath();
      x.arc(cx, cy, R + 16, 0, Math.PI * 2);
      x.stroke();
      if (im) {
        x.save();
        x.beginPath();
        x.arc(cx, cy, R, 0, Math.PI * 2);
        x.clip();
        const k = Math.max((2 * R) / im.width, (2 * R) / im.height);
        x.drawImage(im, cx - (im.width * k) / 2, cy - (im.height * k) / 2, im.width * k, im.height * k);
        x.restore();
      }
      x.fillStyle = '#4A2138';
      x.font = '700 38px Fredoka, sans-serif';
      x.fillText((w === 'me' ? C.myCity : C.herCity).toLocaleUpperCase('tr-TR'), cx, cy + R + 100);
      const r = rateOf(sid, w === 'me' ? 'her' : 'me');
      x.font = '700 40px Fredoka, sans-serif';
      if (r) {
        x.fillStyle = '#E3174D';
        x.fillText('♥'.repeat(r.data.stars) + '♡'.repeat(5 - r.data.stars), cx, cy + R + 150);
        if (r.data.note) {
          x.fillStyle = '#86566F';
          x.font = '700 34px Caveat, cursive';
          x.fillText(`"${r.data.note}"`, cx, cy + R + 196, 460);
        }
      }
    });
    x.fillStyle = '#4A2138';
    x.font = '700 46px Fredoka, sans-serif';
    x.fillText(`${C.myPet}  ♡  ${C.herPet}`, W / 2, H - 120);
    x.fillStyle = '#C7386F';
    x.font = '700 36px Caveat, cursive';
    x.fillText(`${T.fmt(s.data.day || new Date(s.at))} · ${K.num(C.distanceKm)} km uzunluğunda bir masa`, W / 2, H - 70);
    return c;
  }
  async function saveCard(sid) {
    const cv = await card(sid);
    if (!cv) return;
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
    if (!blob) return K.fx.toast('Görsel hazırlanamadı.');
    const name = `ayni-sofra-${T.todayKey()}.jpg`;
    const file = new File([blob], name, { type: 'image/jpeg' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Aynı Sofra' });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = K.el(`<a href="${url}" download="${name}"></a>`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    K.fx.toast('Sofra kartı indirildi.', { icon: A.icon('pot') });
  }
  async function viewOld(sid) {
    const md = K.ui.modal({ label: 'Sofra', cls: 'pb-modal', html: '<div class="pb-view"><p class="muted small">Sofra kuruluyor...</p></div>' });
    const cv = await card(sid);
    if (!cv) return md.close();
    K.$('.pb-view', md.body).innerHTML = `<img src="${cv.toDataURL('image/jpeg', 0.88)}" alt="Sofra kartı"><button type="button" class="btn red" data-sf-card="${sid}">${A.ui('download')} Kaydet ya da paylaş</button>`;
    md.body.addEventListener('click', (e) => e.target.closest('[data-sf-card]') && saveCard(sid));
  }

  /* ---------- Eylemler ---------- */
  async function start(dish) {
    const sid = 'f' + Date.now().toString(36);
    const r = await K.cloud.add('sofra', { sid, dish, day: T.todayKey() });
    if (!r) return K.fx.toast('Sofra kurulamadı. İnterneti kontrol et.');
    pick = null;
    prog = { sid, ing: [], steps: [], timer: null };
    saveProg();
    K.audio.sfx.chime();
    const d = dishOf(dish);
    K.ping(`${K.meName()} sofrayı kurdu: ${d.me.name} & ${d.her.name}`, 'Aynı Sofra\'ya gel; malzemelerini topla.', ['stew']);
    render();
  }
  async function addPlate(file) {
    const s = active();
    if (!s || !file) return;
    const full = await shrink(file, 1400, 0.82);
    const thumb = full && (await shrink(file, 420, 0.72));
    if (!full) return K.fx.toast('Fotoğraf okunamadı.');
    const big = await K.cloud.add('sfimg', { img: full });
    const r = big && (await K.cloud.add('sfplate', { sid: s.data.sid, thumb, full: big.id }));
    if (!r) return K.fx.toast('Fotoğraf gönderilemedi.');
    K.stickers.award('sofra');
    K.fx.confetti({ count: 70, shapes: ['heart'] });
    K.ping(`${K.meName()} tabağını gösterdi`, 'Aynı Sofra\'da kalp ver.', ['stew']);
    render();
  }
  async function rate(n) {
    const s = active() || null;
    const sid = s && s.data.sid;
    if (!sid) return;
    const inp = K.$('[name="sfNote"]', root);
    const note = inp ? inp.value.trim() : '';
    const r = await K.cloud.add('sfrate', { sid, stars: n, note });
    if (!r) return;
    K.audio.sfx.success();
    K.ping(`${K.meName()} senin tabağına ${n} kalp verdi`, note || 'Aynı Sofra', ['heart']);
    render();
  }

  K.specialHooks = (K.specialHooks || []).concat(() => {
    const s = active();
    if (!s || s.who === mine() || plateOf(s.data.sid, mine())) return [];
    const d = dishOf(s.data.dish);
    return d ? [{ icon: 'pot', title: `${nameOf(s.who)} sofrayı kurdu`, text: `${d.me.name} & ${d.her.name}. Senin tarifin: ${d[mine()].name}. Malzemeleri topla, aramayı aç.`, room: 'sofra' }] : [];
  });

  const KINDS = ['sofra', 'sfplate', 'sfrate', 'sfend'];
  // Açılışta son sofralar (ana salon kartı için); eskiler odaya girilince
  let loading = null;
  function loadAll() {
    if (!K.cloud.enabled) return Promise.resolve();
    return (loading = loading || (async () => {
      const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 300)));
      const ids = new Set(rows.map((r) => r.id));
      got.flat().forEach((r) => ids.has(r.id) || rows.push(r));
      if (K.activeRoom === 'sofra') gallery();
    })());
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 12)));
    rows = got.flat();
    K.cloud.onLive('sf', onLive);
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine()) {
          const d = k === 'sofra' && dishOf(r.data.dish);
          if (d) K.fx.toast(`<b>${K.esc(nameOf(r.who))} sofrayı kurdu:</b> ${K.esc(d.me.name)} &amp; ${K.esc(d.her.name)}. <a href="#sofra">Katıl</a>`, { icon: A.icon('pot'), duration: 9000 });
          if (k === 'sfplate') K.fx.toast(`<b>${K.esc(nameOf(r.who))} tabağını gösterdi.</b> <a href="#sofra">Kalp ver</a>`, { icon: A.icon('pot'), duration: 7000 });
          if (k === 'sfrate') K.fx.toast(`<b>${K.esc(nameOf(r.who))} senin tabağına ${r.data.stars} kalp verdi.</b>`, { icon: A.icon('heart'), duration: 7000 });
        }
        if (k === 'sofra') theirs = null;
        if (K.activeRoom === 'sofra') render();
        else if (K.renderSpecials) K.renderSpecials();
      })
    );
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.on('presence', () => K.activeRoom === 'sofra' && status());
  K.sofra = { count: () => sessions().filter((s) => plateOf(s.data.sid, 'me') && plateOf(s.data.sid, 'her')).length, load: loadAll };

  K.room({
    id: 'sofra',
    wing: 'kalp',
    title: 'Aynı Sofra',
    sub: 'Görüntülü aramada birlikte yemek',
    icon: 'pot',
    color: '#FFEBD9',
    hidden: () => !D.sofra || !K.cloud || !K.cloud.enabled,
    badge: () => (active() ? 'Sofra kurulu' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(SF().intro)}</div><div id="sfMain"></div><div id="sfGal"></div>`;
      el.addEventListener('change', (e) => {
        const s = active();
        if (e.target.matches('[data-sf-plate]')) return addPlate(e.target.files[0]);
        if (!s) return;
        const p = myProg(s.data.sid);
        if (e.target.matches('[data-ing]')) {
          p.ing[Number(e.target.dataset.ing)] = e.target.checked;
          e.target.closest('label').classList.toggle('done', e.target.checked);
          saveProg();
          broadcast();
        }
      });
      el.addEventListener('click', (e) => {
        const dsh = e.target.closest('[data-dish]');
        if (dsh) {
          pick = dsh.dataset.dish;
          return render();
        }
        const st = e.target.closest('[data-sf-start]');
        if (st) return start(st.dataset.sfStart);
        const s = active();
        const stp = e.target.closest('[data-step]');
        if (stp && s) {
          const p = myProg(s.data.sid);
          const i = Number(stp.dataset.step);
          p.steps[i] = !p.steps[i];
          saveProg();
          broadcast();
          K.audio.sfx.tap();
          const d = dishOf(s.data.dish);
          if (p.steps.filter(Boolean).length === d[mine()].steps.length) K.fx.toast('Tarif bitti! Şimdi tabağını göster.', { icon: A.icon('pot') });
          return render();
        }
        const tm = e.target.closest('[data-timer]');
        if (tm && s) {
          const d = dishOf(s.data.dish);
          const i = Number(tm.dataset.timer);
          const [tx, min] = d[mine()].steps[i];
          const p = myProg(s.data.sid);
          p.timer = { end: Date.now() + min * 60000, label: tx.split(/[.;:,]/)[0].slice(0, 40) };
          saveProg();
          broadcast();
          K.$('#sfTimer', root).hidden = false;
          tick();
          return;
        }
        if (e.target.closest('#sfTimer') && s) {
          const p = myProg(s.data.sid);
          if (p.timer && p.timer.end <= Date.now()) {
            p.timer = null;
            saveProg();
            broadcast();
            K.$('#sfTimer', root).hidden = true;
          }
          return;
        }
        const rt = e.target.closest('[data-rate]');
        if (rt) return rate(Number(rt.dataset.rate));
        const cd = e.target.closest('[data-sf-card]');
        if (cd) return saveCard(cd.dataset.sfCard);
        const im = e.target.closest('[data-sf-img]');
        if (im) {
          const p = rows.find((r) => r.id === im.dataset.sfImg);
          const md = K.ui.modal({ label: 'Tabak', cls: 'gl-modal', html: `<figure class="gl-big"><img src="${p.data.thumb}" alt=""></figure>` });
          fullOf(p).then((src) => {
            const i = K.$('img', md.body);
            if (i && src) i.src = src;
          });
          return;
        }
        const old = e.target.closest('[data-sf-old]');
        if (old) return viewOld(old.dataset.sfOld);
        const end = e.target.closest('[data-sf-end]');
        if (end && s) {
          if (end.dataset.armed !== '1') {
            end.dataset.armed = '1';
            end.textContent = 'Emin misin? Bir daha dokun';
            return;
          }
          K.cloud.add('sfend', { sid: s.data.sid }).then(() => {
            prog = {};
            K.store.set('sofraProg', null);
            render();
          });
        }
      });
    },
    enter() {
      render();
      loadAll();
      const s = active();
      if (s) K.cloud.send('sf', { t: 'hello', sid: s.data.sid });
      broadcast();
      clearInterval(timerT);
      timerT = setInterval(tick, 1000);
    },
    leave() {
      clearInterval(timerT);
      wake(false);
    },
  });
})();
