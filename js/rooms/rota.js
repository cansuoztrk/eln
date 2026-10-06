/* Oda: Şehrimi Gezdiriyorum — kendi şehrinde bir rota hazırlarsın: her durakta bir fotoğraf, on saniyelik bir ses ve bir
   not. Rota bitince öbürüne gider; o, rotayı adım adım gezer gibi açar ve her durak pasaportuna bir damga basar.
   Bir gün gerçekten birlikte yürüyeceğiniz yolun provası. Kayıtlar: rota {rid, title}, rotadurak {rid, i, name, note,
   foto, thumb, ses, dur}, rotafoto {img}, rotabitti {rid}, rotagez {rid} (gezen bitirince) */
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
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  let routes = [], stops = [], done = [], gez = [], loaded = false, root = null, draft = null;
  const stopsOf = (rid) => stops.filter((s) => s.data.rid === rid).sort((a, b) => a.data.i - b.data.i || a.at - b.at);
  const isDone = (rid) => done.some((d) => d.data.rid === rid);
  const seenStops = () => K.store.get('rotaGez', {});

  function card(r) {
    const ss = stopsOf(r.data.rid);
    const seen = seenStops()[r.data.rid] || 0;
    const mineR = r.who === mine();
    return `<button type="button" class="rt-kart ${mineR ? 'benim' : ''}" data-rt-ac="${r.data.rid}"><span class="rt-kapak">${ss[0] && ss[0].data.thumb ? `<img src="${ss[0].data.thumb}" alt="">` : '🗺️'}</span><span><b>${K.esc(r.data.title)}</b><small>${K.esc(cityOf(r.who))} · ${ss.length} durak${mineR ? (isDone(r.data.rid) ? ' · gönderildi' : ' · taslak') : seen >= ss.length && ss.length ? ' · gezildi ✓' : seen ? ` · ${seen}/${ss.length}` : ' · yeni'}</small></span></button>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'rota') return;
    const theirs = routes.filter((r) => r.who === other() && isDone(r.data.rid));
    const my = routes.filter((r) => r.who === mine());
    K.$('#rtOnun', root).innerHTML = theirs.length ? theirs.map(card).join('') : `<p class="muted">${K.esc(nameOf(other()))} henüz bir rota göndermedi. ${K.esc(cityOf(other()))} seni bekliyor.</p>`;
    K.$('#rtBenim', root).innerHTML = (my.length ? my.map(card).join('') : '') + `<button type="button" class="rt-yeni" data-rt-yeni>＋ Yeni rota</button>`;
    const stamps = theirs.flatMap((r) => stopsOf(r.data.rid).slice(0, seenStops()[r.data.rid] || 0).map((s) => ({ r, s })));
    K.$('#rtPasaport', root).innerHTML = `<p class="card-eyebrow">Pasaportum · ${stamps.length} damga</p>${stamps.length ? `<div class="rt-damgalar">${stamps.map(({ r, s }, i) => `<span class="rt-damga" style="--r:${(i * 37) % 24 - 12}deg"><b>${K.esc(s.data.name || 'Durak')}</b><small>${K.esc(cityOf(r.who))}</small></span>`).join('')}</div>` : '<p class="muted small">Onun rotalarını gezdikçe her durak buraya bir damga basar.</p>'}`;
  }
  /* ---------- Rota hazırlama ---------- */
  async function compose(rid) {
    let r = rid ? routes.find((x) => x.data.rid === rid) : null;
    if (!r) {
      const title = await ask('Rotanın adı', 'Örneğin: Kadıköy\'de bir akşam');
      if (!title) return;
      r = await K.cloud.add('rota', { rid: 'r' + Date.now().toString(36), title: title.slice(0, 60) });
      if (!r) return K.fx.toast('Kaydedilemedi.');
      routes.push(r);
    }
    draft = { r, rec: null, ses: null, img: null };
    const m = K.ui.modal({ label: 'Rota', cls: 'rt-sheet', html: '<div data-rt-body></div>', onClose: () => ((draft = null), render()) });
    const body = K.$('[data-rt-body]', m.body);
    const draw = () => {
      const ss = stopsOf(r.data.rid);
      body.innerHTML = `<p class="card-eyebrow">${K.esc(cityOf(mine()))} · ${ss.length} durak</p><h2>${K.esc(r.data.title)}</h2>
        <ol class="rt-duraklar">${ss.map((s) => `<li>${s.data.thumb ? `<img src="${s.data.thumb}" alt="">` : '<span>📍</span>'}<b>${K.esc(s.data.name || 'Durak')}</b>${s.data.ses ? '<i>🎙️</i>' : ''}</li>`).join('')}</ol>
        <div class="rt-ekle"><p class="card-eyebrow">${ss.length + 1}. durak</p>
          <input class="input" id="rtAd" maxlength="50" placeholder="Durağın adı (Moda sahili...)">
          <label class="btn soft small rt-foto">📷 Fotoğraf<input type="file" accept="image/*" id="rtFoto" hidden></label><span class="rt-onizle" id="rtOn"></span>
          <textarea class="input" id="rtNot" maxlength="200" rows="2" placeholder="Burada ne var, neden sevdin?"></textarea>
          <div class="row"><button type="button" class="btn soft small" data-rt-ses>🎙️ 10 saniye ses</button><span class="muted small" id="rtSesSt"></span></div>
          <div class="row"><button type="button" class="btn red" data-rt-durak>Durağı ekle</button></div></div>
        ${ss.length ? `<div class="row center"><button type="button" class="btn ${isDone(r.data.rid) ? 'ghost' : 'red'}" data-rt-gonder ${isDone(r.data.rid) ? 'disabled' : ''}>${isDone(r.data.rid) ? '✓ Gönderildi' : `💌 Rotayı ${K.esc(K.ek(nameOf(other()), 'e'))} gönder`}</button></div>` : ''}`;
    };
    draw();
    body.addEventListener('change', async (e) => {
      if (e.target.id !== 'rtFoto' || !e.target.files[0]) return;
      const f = e.target.files[0];
      K.$('#rtOn', body).textContent = 'Hazırlanıyor...';
      try {
        draft.img = await K.medya.image(f, 1280, 0.76);
        draft.thumb = await K.medya.thumb(f, 180);
        K.$('#rtOn', body).innerHTML = `<img src="${draft.thumb}" alt="">`;
      } catch (err) {
        K.$('#rtOn', body).textContent = 'Fotoğraf okunamadı.';
      }
    });
    body.addEventListener('click', async (e) => {
      if (e.target.closest('[data-rt-ses]')) {
        const st = K.$('#rtSesSt', body);
        if (draft.rec) return draft.rec.stop();
        draft.rec = await K.mikrofon.start(10, (s) => (st.textContent = `● ${Math.ceil(10 - s)} sn · durdurmak için dokun`));
        if (!draft.rec) return;
        const out = await draft.rec.done;
        draft.rec = null;
        draft.ses = out;
        st.innerHTML = `✓ ${out.dur} sn <audio src="${out.url}" controls preload="none"></audio>`;
        return;
      }
      if (e.target.closest('[data-rt-durak]')) {
        const b = e.target.closest('[data-rt-durak]');
        const name = (K.$('#rtAd', body).value || '').trim().slice(0, 50);
        const note = (K.$('#rtNot', body).value || '').trim().slice(0, 200);
        if (!name && !draft.img) return K.$('#rtAd', body).focus();
        b.disabled = true;
        b.textContent = 'Yükleniyor...';
        let foto = '', ses = '';
        if (draft.img) {
          const fr = await K.cloud.add('rotafoto', { img: draft.img });
          foto = fr ? fr.id : '';
        }
        if (draft.ses) {
          const sr = await K.mikrofon.upload(draft.ses.blob);
          ses = sr ? sr.id : '';
        }
        const s = await K.cloud.add('rotadurak', { rid: r.data.rid, i: stopsOf(r.data.rid).length, name, note, foto, thumb: draft.thumb || '', ses, dur: draft.ses ? draft.ses.dur : 0 });
        if (s) stops.push(s);
        draft.img = draft.thumb = draft.ses = null;
        K.audio.sfx.pop();
        draw();
        return;
      }
      if (e.target.closest('[data-rt-gonder]')) {
        const d = await K.cloud.add('rotabitti', { rid: r.data.rid });
        if (d) done.push(d);
        K.audio.sfx.whoosh();
        K.stickers.award('rota');
        K.ping(`🗺️ ${K.meName()} sana şehrini gezdiriyor`, `"${r.data.title}" · ${stopsOf(r.data.rid).length} durak. Pasaportunu hazırla.`, ['world_map'], { click: K.roomUrl('rota') });
        draw();
      }
    });
  }
  function ask(title, ph) {
    return new Promise((res) => {
      const m = K.ui.modal({ label: title, cls: 'rt-ask', html: `<h2>${K.esc(title)}</h2><input class="input" id="rtAsk" maxlength="60" placeholder="${K.esc(ph)}"><div class="row"><button type="button" class="btn red" data-ok>Başla</button></div>`, onClose: () => res(null) });
      const go = () => {
        const v = (K.$('#rtAsk', m.body).value || '').trim();
        if (!v) return;
        res(v);
        m.close();
      };
      K.$('[data-ok]', m.body).addEventListener('click', go);
      K.$('#rtAsk', m.body).addEventListener('keydown', (e) => e.key === 'Enter' && go());
      setTimeout(() => K.$('#rtAsk', m.body).focus(), 80);
    });
  }
  /* ---------- Rotayı gezme ---------- */
  function tour(rid) {
    const r = routes.find((x) => x.data.rid === rid);
    if (!r) return;
    if (r.who === mine()) return compose(rid);
    const ss = stopsOf(rid);
    if (!ss.length) return;
    let i = Math.min(seenStops()[rid] || 0, ss.length - 1);
    const ov = K.el(`<div class="rt-tur" role="dialog" aria-modal="true" aria-label="${K.esc(r.data.title)}"><div class="rt-tur-ust"><b>${K.esc(r.data.title)}</b><span id="rtSay"></span><button type="button" class="icon-btn" data-rt-x aria-label="Kapat">${A.ui('close')}</button></div><div class="rt-sahne" id="rtSahne"></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    let audio = null;
    const show = async () => {
      const s = ss[i];
      audio && audio.pause();
      K.$('#rtSay', ov).textContent = `${i + 1}/${ss.length}`;
      const sc = K.$('#rtSahne', ov);
      sc.innerHTML = `<figure class="rt-foto-b">${s.data.thumb ? `<img src="${s.data.thumb}" alt="" class="rt-bulanik">` : ''}</figure>
        <div class="rt-alt"><p class="card-eyebrow">${i + 1}. durak</p><h2>${K.esc(s.data.name || 'Bir durak')}</h2>${s.data.note ? `<p class="hand">${K.esc(s.data.note)}</p>` : ''}
        <div class="row">${s.data.ses ? `<button type="button" class="btn soft small" data-rt-dinle>🎙️ Sesini dinle · ${s.data.dur || 10} sn</button>` : ''}${i < ss.length - 1 ? `<button type="button" class="btn red" data-rt-ileri>Sonraki durak →</button>` : `<button type="button" class="btn red" data-rt-bitir>🏁 Rotayı bitir</button>`}</div></div>
        <span class="rt-damga-anim" aria-hidden="true"><b>${K.esc(s.data.name || 'Durak')}</b><small>${K.esc(T.fmtShort(new Date()))}</small></span>`;
      if (s.data.foto) K.medya.rowUrl(s.data.foto).then((u) => u && sc.isConnected && (K.$('.rt-foto-b', sc).innerHTML = `<img src="${u}" alt="${K.esc(s.data.name || '')}">`));
      const seen = seenStops();
      if ((seen[rid] || 0) < i + 1) {
        seen[rid] = i + 1;
        K.store.set('rotaGez', seen);
        K.audio.sfx.pop();
        K.vibrate(20);
      }
    };
    show();
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-rt-x]')) {
        audio && audio.pause();
        ov.classList.remove('in');
        setTimeout(() => ov.remove(), 400);
        return render();
      }
      if (e.target.closest('[data-rt-ileri]')) {
        i++;
        return show();
      }
      if (e.target.closest('[data-rt-dinle]')) {
        const u = await K.mikrofon.url(ss[i].data.ses);
        if (u) {
          audio && audio.pause();
          audio = new Audio(u);
          audio.play().catch(() => {});
        }
        return;
      }
      if (e.target.closest('[data-rt-bitir]')) {
        K.fx.confetti({ count: 90 });
        K.audio.sfx.success();
        K.stickers.award('pasaport');
        if (!gez.some((g) => g.data.rid === rid && g.who === mine())) {
          const g = await K.cloud.add('rotagez', { rid });
          g && gez.push(g);
          K.ping(`🛂 ${K.meName()} rotanı sonuna kadar gezdi`, `"${r.data.title}": pasaportuna ${ss.length} damga bastı.`, ['passport_control'], { click: K.roomUrl('rota') });
        }
        ov.classList.remove('in');
        setTimeout(() => ov.remove(), 400);
        render();
      }
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [routes, stops, done, gez] = await Promise.all(['rota', 'rotadurak', 'rotabitti', 'rotagez'].map((k) => K.cloud.list(k, 1500)));
    loaded = true;
    ['rota', 'rotadurak', 'rotabitti', 'rotagez'].forEach((k, n) => K.cloud.on(k, (r) => {
      const arr = [routes, stops, done, gez][n];
      if (arr.some((x) => x.id === r.id)) return;
      arr.push(r);
      render();
    }));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const fresh = routes.filter((r) => r.who === other() && isDone(r.data.rid) && !(seenStops()[r.data.rid] > 0));
    return fresh.length ? [{ key: 'rota', icon: 'map', title: `🗺️ ${nameOf(other())} sana ${K.ek(cityOf(other()), 'i')} gezdiriyor`, text: `"${fresh[0].data.title}" · ${stopsOf(fresh[0].data.rid).length} durak.`, run: () => (K.go('rota'), setTimeout(() => tour(fresh[0].data.rid), 500)), cta: 'Gezmeye başla' }] : [];
  });
  K.room({
    id: 'rota',
    wing: 'kalp',
    title: 'Şehrimi Gezdiriyorum',
    sub: 'Fotoğraflı, sesli rotalar ve pasaport',
    icon: 'map',
    color: '#FFF0DD',
    hidden: () => !K.cloud || !K.cloud.enabled || !K.mikrofon,
    badge: () => (loaded ? String(routes.filter((r) => r.who === other() && isDone(r.data.rid) && !(seenStops()[r.data.rid] > 0)).length || '') : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kendi şehrinde bir rota hazırla: her durakta bir fotoğraf, on saniyelik bir ses ve bir not. Rota ona gidince adım adım gezer; her durak pasaportuna bir damga basar. Bir gün gerçekten birlikte yürüyeceğimiz yol.</p></div>
        <section class="card"><p class="card-eyebrow">${K.esc(nameOf(other()))} gezdiriyor</p><div class="rt-liste" id="rtOnun"></div></section>
        <section class="card"><p class="card-eyebrow">Senin rotaların</p><div class="rt-liste" id="rtBenim"></div></section>
        <section class="card rt-pasaport" id="rtPasaport"></section>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-rt-yeni]')) return compose();
        const a = e.target.closest('[data-rt-ac]');
        a && tour(a.dataset.rtAc);
      });
    },
    enter() {
      render();
    },
  });
})();
