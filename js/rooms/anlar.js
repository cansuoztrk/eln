/* Oda: On Saniyelik Anlar — her gün ikimizden birer on saniyelik video: biri İstanbul'dan, biri Bakü'den. Onunki,
   sen bugünkü on saniyeni çekene kadar perdeli kalır. Ay takviminde her gün iki küçük kare; "Ayın filmi" o ayın bütün
   anlarını sırayla, müzikle ve tarih/şehir yazılarıyla tek bir montaj olarak oynatır. Ay bitince film hazır haberi gelir.
   Kamera açılmazsa galeriden kısa bir video seçilebilir (büyükse küçültülür).
   Kayıtlar: anlarvid {b64, mime} (ağır) · anlar {day, vid, thumb, dur, text} */
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
  const MAX = 10;
  let rows = [], loaded = false, root = null, cam = null, face = 'user', rec = null, draft = null, ym = '';
  const today = () => T.todayKey();
  const of = (day, w) => rows.find((r) => r.data.day === day && r.who === w);
  const mineDone = (day) => Boolean(of(day, mine()));
  const VMIME = () => (window.MediaRecorder ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'].find((x) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '' : null);

  /* ---------- Kamera ---------- */
  async function openCam() {
    closeCam();
    if (!navigator.mediaDevices || VMIME() === null) return K.fx.toast('Bu telefon video kaydını desteklemiyor; galeriden seçebilirsin.', { duration: 3200 }), false;
    try {
      cam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 640 }, height: { ideal: 640 }, frameRate: { ideal: 24, max: 30 } }, audio: { echoCancellation: true } });
    } catch (e) {
      K.fx.toast('Kamera izni verilmedi. Ayarlardan izin verip tekrar dene ya da galeriden seç.', { duration: 3600 });
      return false;
    }
    const v = K.$('#anCanli', root);
    v.srcObject = cam;
    v.classList.toggle('ayna', face === 'user');
    v.play().catch(() => {});
    K.audio.music.on && K.audio.music.stop(false);
    return true;
  }
  function closeCam() {
    cam && cam.getTracks().forEach((t) => t.stop());
    cam = null;
    const v = root && K.$('#anCanli', root);
    v && (v.srcObject = null);
  }
  function frame(v, mirror) {
    const c = document.createElement('canvas');
    c.width = c.height = 240;
    const w = v.videoWidth, h = v.videoHeight;
    if (!w || !h) return '';
    const s = Math.min(w, h);
    const g = c.getContext('2d');
    if (mirror) {
      g.translate(240, 0);
      g.scale(-1, 1);
    }
    g.drawImage(v, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 240, 240);
    return c.toDataURL('image/jpeg', 0.72);
  }
  function record(btn) {
    if (!cam) return;
    const mime = VMIME();
    const chunks = [];
    const r = new MediaRecorder(cam, Object.assign(mime ? { mimeType: mime } : {}, { videoBitsPerSecond: 600000, audioBitsPerSecond: 48000 }));
    const t0 = Date.now();
    let thumb = '';
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      clearInterval(rec.tm);
      const dur = Math.min(MAX, Math.round((Date.now() - t0) / 100) / 10);
      const blob = new Blob(chunks, { type: r.mimeType || mime || 'video/webm' });
      thumb = thumb || frame(K.$('#anCanli', root), face === 'user');
      rec = null;
      closeCam();
      review({ blob, dur, thumb });
    };
    r.start(500);
    rec = { r, tm: 0 };
    btn.classList.add('kayitta');
    rec.tm = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      K.$('#anHalka', root).style.setProperty('--p', Math.min(1, s / MAX));
      K.$('#anSure', root).textContent = `${Math.max(0, Math.ceil(MAX - s))}`;
      if (!thumb && s > 1) thumb = frame(K.$('#anCanli', root), face === 'user');
      if (s >= MAX && r.state === 'recording') r.stop();
    }, 100);
  }
  function review(d) {
    draft = d;
    draft.url = URL.createObjectURL(d.blob);
    const box = K.$('#anKayit', root);
    box.innerHTML = `<div class="an-onizle"><video src="${draft.url}" playsinline autoplay loop></video></div>
      <input class="input" id="anNot" maxlength="70" placeholder="Bu an ne? (istersen)"><div class="row center"><button type="button" class="btn red" data-an-gonder>💗 Gönder</button><button type="button" class="btn soft" data-an-tekrar>↺ Tekrar çek</button></div><p class="muted small center">${d.dur.toFixed(1)} sn · ${(d.blob.size / 1024 / 1024).toFixed(1)} MB</p>`;
  }
  async function send(btn) {
    if (!draft) return;
    btn.disabled = true;
    btn.textContent = 'Gönderiliyor...';
    const b64 = await K.medya.toB64(draft.blob);
    if (!b64 || b64.length > 3.3e6) {
      btn.disabled = false;
      btn.textContent = '💗 Gönder';
      return K.fx.toast('Video biraz büyük oldu; daha kısa ya da daha sakin bir an dene.', { duration: 3200 });
    }
    const v = await K.cloud.add('anlarvid', { b64, mime: draft.blob.type || 'video/mp4' });
    const text = (K.$('#anNot', root).value || '').trim();
    const r = v && (await K.cloud.add('anlar', { day: today(), vid: v.id, thumb: draft.thumb, dur: draft.dur, text }));
    if (!r) {
      btn.disabled = false;
      btn.textContent = '💗 Gönder';
      return K.fx.toast('Gönderilemedi, tekrar dene.');
    }
    rows.push(r);
    URL.revokeObjectURL(draft.url);
    draft = null;
    K.store.set('anlarAylar', [...new Set([...K.store.get('anlarAylar', []), today().slice(0, 7)])].slice(-24));
    K.fx.confetti({ count: 60, shapes: ['heart', 'star'] });
    K.audio.sfx.success();
    K.stickers.award('anlar');
    if (rows.filter((x) => x.who === mine()).length >= 30) K.stickers.award('anlar30');
    K.ping(`🎥 ${K.meName()} bugünün on saniyesini çekti`, of(today(), other()) ? 'İkinizin de bugünkü anı hazır. Yan yana izleyin.' : 'Seninkini çekince onunkini görürsün.', ['movie_camera'], { click: K.roomUrl('anlar') });
    K.$('#anKayit', root).innerHTML = '';
    K.$('#anKayit', root).hidden = true;
    render();
  }
  // Galeriden: küçükse olduğu gibi, büyükse ilk on saniyesi tuval üzerinden yeniden kaydedilir
  async function fromFile(file) {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    try {
      await new Promise((res, rej) => ((v.onloadeddata = res), (v.onerror = rej), setTimeout(rej, 8000)));
    } catch (e) {
      URL.revokeObjectURL(url);
      return K.fx.toast('Bu video açılamadı.');
    }
    v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    await new Promise((res) => ((v.onseeked = res), setTimeout(res, 1500)));
    const thumb = frame(v, false);
    if (file.size <= 2.3e6 && v.duration <= MAX + 2) {
      URL.revokeObjectURL(url);
      return review({ blob: file, dur: Math.min(MAX, v.duration || MAX), thumb });
    }
    const c = document.createElement('canvas');
    const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * k);
    c.height = Math.round(v.videoHeight * k);
    if (!c.captureStream || VMIME() === null) {
      URL.revokeObjectURL(url);
      return K.fx.toast('Video çok büyük; kameradan on saniye çekmeyi dene.', { duration: 3000 });
    }
    K.fx.toast('Video küçültülüyor...', { duration: 2000 });
    const st = c.captureStream(24);
    const mime = VMIME();
    const r = new MediaRecorder(st, Object.assign(mime ? { mimeType: mime } : {}, { videoBitsPerSecond: 600000 }));
    const chunks = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const g = c.getContext('2d');
    v.currentTime = 0;
    await v.play().catch(() => {});
    r.start(500);
    const t0 = performance.now();
    await new Promise((res) => {
      const draw = () => {
        g.drawImage(v, 0, 0, c.width, c.height);
        if (performance.now() - t0 < MAX * 1000 && !v.ended) requestAnimationFrame(draw);
        else res();
      };
      draw();
    });
    v.pause();
    await new Promise((res) => ((r.onstop = res), r.stop()));
    URL.revokeObjectURL(url);
    review({ blob: new Blob(chunks, { type: r.mimeType || mime }), dur: Math.min(MAX, (performance.now() - t0) / 1000), thumb });
  }

  /* ---------- Görünüm ---------- */
  function half(day, w) {
    const r = of(day, w);
    const hidden = r && w !== mine() && !mineDone(day);
    if (!r) return `<figure class="an-yarim bos ${w}"><div class="an-kutu">${w === mine() ? `<button type="button" class="an-cek" data-an-ac>🎥<span>Bugünün on saniyesi</span></button>` : `<span class="an-bekle">${A.kitty({ eyes: 'sleep', cls: 'an-kitty' })}<small>${K.esc(nameOf(w))} henüz çekmedi</small></span>`}</div><figcaption>${K.esc(cityOf(w))}</figcaption></figure>`;
    return `<figure class="an-yarim ${w} ${hidden ? 'perdeli' : ''}"><button type="button" class="an-kutu" data-an-oynat="${r.id}" ${hidden ? 'disabled' : ''}><img src="${r.data.thumb}" alt=""><span class="an-play">${hidden ? '🔒' : '▶'}</span></button><figcaption>${K.esc(cityOf(w))} · ${K.esc(nameOf(w))}${hidden ? '<small>Seninkini çekince açılır</small>' : r.data.text ? `<small>${K.esc(r.data.text)}</small>` : ''}</figcaption></figure>`;
  }
  function calendar() {
    const [y, m] = ym.split('-').map(Number);
    const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < first; i++) cells.push('<span></span>');
    for (let d = 1; d <= n; d++) {
      const key = `${ym}-${String(d).padStart(2, '0')}`;
      const h = of(key, 'her'), me = of(key, 'me');
      const showH = h && ('her' === mine() || mineDone(key)), showM = me && ('me' === mine() || mineDone(key));
      cells.push(`<button type="button" class="an-gun ${key === today() ? 'bugun' : ''} ${h || me ? 'var' : ''}" data-an-gun="${key}" ${h || me ? '' : 'disabled'}><b>${d}</b><span>${h ? (showH ? `<img src="${h.data.thumb}" alt="">` : '<i>?</i>') : ''}${me ? (showM ? `<img src="${me.data.thumb}" alt="">` : '<i>?</i>') : ''}</span></button>`);
    }
    const cnt = rows.filter((r) => r.data.day.startsWith(ym)).length;
    return `<div class="an-ay-ust"><button type="button" class="icon-btn" data-an-ay="-1" aria-label="Önceki ay">‹</button><b>${K.esc(K.arsiv ? K.arsiv.monthName(ym) : ym)}</b><button type="button" class="icon-btn" data-an-ay="1" aria-label="Sonraki ay" ${ym >= today().slice(0, 7) ? 'disabled' : ''}>›</button></div>
      <div class="an-takvim">${['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((x) => `<small>${x}</small>`).join('')}${cells.join('')}</div>
      <div class="row center"><button type="button" class="btn red" data-an-film ${cnt ? '' : 'disabled'}>🎬 Ayın filmi · ${cnt} an</button></div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'anlar') return;
    const d = today();
    K.$('#anBugun', root).innerHTML = loaded ? `<div class="an-ikili">${half(d, 'her')}${half(d, 'me')}</div>${of(d, 'her') && of(d, 'me') ? '<p class="center an-ikisi">💗 Bugün iki şehirden iki an. Yan yana durdular.</p>' : ''}` : '<p class="muted center">Anlar yükleniyor...</p>';
    K.$('#anAy', root).innerHTML = calendar();
  }
  function film(month) {
    const list = rows.filter((r) => r.data.day.startsWith(month) && (r.who === mine() || mineDone(r.data.day))).sort((a, b) => a.data.day.localeCompare(b.data.day) || (a.who === 'her' ? -1 : 1));
    if (!list.length) return;
    const days = new Set(list.map((r) => r.data.day)).size;
    const sc = [{ t: 'baslik', eyebrow: 'On Saniyelik Anlar', title: K.arsiv ? K.arsiv.monthName(month) : month, sub: `${days} gün · ${list.length} an · iki şehir` }];
    list.forEach((r) => sc.push({ t: 'video', vid: r.data.vid, caption: r.data.text || '', by: `${T.fmt(r.data.day)} · ${cityOf(r.who)} · ${nameOf(r.who)}` }));
    sc.push({ t: 'kapanis', text: 'On saniye on saniye, koca bir ay.', sub: `${C.herPet} & ${C.myPet}` });
    K.belgesel.play(sc, { mood: 'sicak', label: 'Ayın filmi', onEnd: (done) => done && K.stickers.award('anlarfilm') });
  }
  async function playOne(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    K.belgesel.play([{ t: 'video', vid: r.data.vid, caption: r.data.text || '', by: `${T.fmt(r.data.day)} · ${cityOf(r.who)} · ${nameOf(r.who)}` }], { mood: 'gece', label: 'On saniye' });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('anlar', 800);
    loaded = true;
    K.cloud.on('anlar', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      render();
    });
    render();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const p = T.baku();
    const prev = p.mo === 1 ? `${p.y - 1}-12` : `${p.y}-${String(p.mo - 1).padStart(2, '0')}`;
    if (p.d > 3 || !K.store.get('anlarAylar', []).includes(prev) || K.store.get('anlarFilmGordu', '') === prev) return [];
    return [{ key: 'anlarfilm', icon: 'film', title: `🎥 ${K.arsiv ? K.arsiv.monthName(prev) : prev} filmi hazır`, text: 'Geçen ayın bütün on saniyeleri müzikle tek bir filmde.', run: () => (K.store.set('anlarFilmGordu', prev), (location.hash = 'anlar'), setTimeout(() => film(prev), 600)), cta: 'İzle' }];
  });
  K.room({
    id: 'anlar',
    wing: 'anilar',
    title: 'On Saniyelik Anlar',
    sub: 'Her gün on saniye, ayda bir film',
    icon: 'camera',
    color: '#FFE6D6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !mineDone(today()) ? 'Bugünün anı' : ''),
    init(el) {
      root = el;
      ym = today().slice(0, 7);
      el.innerHTML = `<div class="room-intro"><p>Her gün on saniye: bulunduğun yerden küçük bir an. Onunki, sen bugününkini çekene kadar perdeli kalır. Ayın sonunda bütün anlar müzikli tek bir film olur.</p></div>
        <section class="card" id="anBugun"></section>
        <section class="card an-kayit" id="anKayit" hidden></section>
        <section class="card" id="anAy"></section>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-an-ac]')) {
          const box = K.$('#anKayit', root);
          box.hidden = false;
          box.innerHTML = `<div class="an-vizor"><video id="anCanli" playsinline muted autoplay></video><div class="an-halka" id="anHalka"><span id="anSure">${MAX}</span></div></div>
            <div class="row center"><button type="button" class="an-dugme" data-an-kaydet aria-label="Kaydet"></button></div>
            <div class="row center"><button type="button" class="btn soft small" data-an-cevir>🔄 Kamerayı çevir</button><label class="btn soft small">🖼 Galeriden<input type="file" accept="video/*" hidden data-an-dosya></label><button type="button" class="btn soft small" data-an-vazgec>Vazgeç</button></div>`;
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return openCam();
        }
        const kb = e.target.closest('[data-an-kaydet]');
        if (kb) return rec ? rec.r.stop() : record(kb);
        if (e.target.closest('[data-an-cevir]')) {
          if (rec) return;
          face = face === 'user' ? 'environment' : 'user';
          return openCam();
        }
        if (e.target.closest('[data-an-vazgec]')) {
          rec && rec.r.stop();
          closeCam();
          draft = null;
          K.$('#anKayit', root).hidden = true;
          return;
        }
        if (e.target.closest('[data-an-tekrar]')) {
          draft && URL.revokeObjectURL(draft.url);
          draft = null;
          return K.$('[data-an-ac]', root) ? K.$('[data-an-ac]', root).click() : null;
        }
        const g = e.target.closest('[data-an-gonder]');
        if (g) return send(g);
        const o = e.target.closest('[data-an-oynat]');
        if (o) return playOne(o.dataset.anOynat);
        const ay = e.target.closest('[data-an-ay]');
        if (ay) {
          const [y, m] = ym.split('-').map(Number);
          const d = new Date(Date.UTC(y, m - 1 + +ay.dataset.anAy, 1));
          ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
          return render();
        }
        const gun = e.target.closest('[data-an-gun]');
        if (gun) {
          const list = rows.filter((r) => r.data.day === gun.dataset.anGun && (r.who === mine() || mineDone(r.data.day)));
          if (!list.length) return K.fx.toast('O günün anını görmek için o gün seninkini de çekmiş olman gerek.', { duration: 3000 });
          return K.belgesel.play(list.map((r) => ({ t: 'video', vid: r.data.vid, caption: r.data.text || '', by: `${T.fmt(r.data.day)} · ${cityOf(r.who)} · ${nameOf(r.who)}` })), { mood: 'gece', label: 'O günün anları' });
        }
        if (e.target.closest('[data-an-film]')) film(ym);
      });
      el.addEventListener('change', (e) => {
        const f = e.target.closest('[data-an-dosya]');
        if (f && f.files[0]) {
          closeCam();
          fromFile(f.files[0]).finally(() => (f.value = ''));
        }
      });
    },
    enter() {
      render();
    },
    leave() {
      rec && rec.r.stop();
      closeCam();
    },
  });
  K.anlar = { film, of };
})();
