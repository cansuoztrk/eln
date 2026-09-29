/* Oda: Günün Sesi — ikisi de her gün birbirine en fazla 20 saniyelik bir ses bırakır; her günün bir sorusu var.
   Onun bugünkü sesi, sen kendi sesini bırakınca açılır. Son 30 gün bir şerit: gün gün iki ses, seri sayacı.
   Sesler kasa anahtarıyla şifrelenip bulutta durur ('dvoice'). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const MAX_S = 20;
  const MAX_B64 = 600000;
  let root, rows = [], sel = null, rec = null, playing = null, starting = false;
  const GS = () => D.gunses || { intro: [], prompts: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const prompt = (day) => {
    const ps = GS().prompts || [];
    return ps.length ? K.fill(ps[T.dayNumber(T.at(day)) % ps.length]) : '';
  };
  const clip = (day, who) => rows.filter((r) => r.data.day === day && r.who === who).pop();
  const addDays = (k, n) => T.key(T.baku(new Date(T.at(k).getTime() + n * 864e5 + 3600e3)));
  function streak() {
    let n = 0, k = T.todayKey();
    if (!(clip(k, 'her') && clip(k, 'me'))) k = addDays(k, -1);
    while (clip(k, 'her') && clip(k, 'me')) {
      n++;
      k = addDays(k, -1);
    }
    return n;
  }
  // Onun sesi: sen o gün kendi sesini bırakınca ya da gün geçince açılır
  const openFor = (day) => day < T.todayKey() || Boolean(clip(day, mine()));

  /* ---------- Çizim ---------- */
  function strip() {
    const today = T.todayKey();
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const k = addDays(today, -i);
      const p = T.baku(T.at(k));
      const h = clip(k, 'her'), m = clip(k, 'me');
      out.push(`<button type="button" class="gs-d ${k === sel ? 'sel' : ''} ${h && m ? 'both' : ''} ${k === today ? 'today' : ''}" data-day="${k}" aria-label="${p.d} ${K.MONTHS[p.mo - 1]}: ${h ? C.herPet + ' ses bıraktı' : ''} ${m ? C.myPet + ' ses bıraktı' : ''}">
        <small>${p.d}</small><span class="gs-dots"><i class="her ${h ? 'on' : ''}"></i><i class="me ${m ? 'on' : ''}"></i></span></button>`);
    }
    return out.join('');
  }
  function clipCard(day, who) {
    const r = clip(day, who);
    const me = who === mine();
    if (!r) return `<div class="gs-clip ${who} empty"><b>${K.esc(nameOf(who))}</b><p class="muted small">${day === T.todayKey() ? (me ? 'Henüz ses bırakmadın.' : 'Henüz ses bırakmadı.') : 'Bu gün ses yok.'}</p></div>`;
    const locked = !me && !openFor(day);
    const t = T.baku(new Date(r.at));
    return `<div class="gs-clip ${who} ${locked ? 'locked' : ''}"><b>${K.esc(nameOf(who))}</b>
      ${locked ? `<p class="small">${A.ui('lock')} Senin sesin gelince açılır.</p>` : `<button type="button" class="gs-play" data-play="${r.id}" aria-label="${K.esc(nameOf(who))} sesini dinle">${playing && playing.id === r.id ? A.ui('pause') : A.ui('play')}</button><span class="gs-meta">${Math.round(r.data.dur || 0)} sn · ${K.pad(t.h)}:${K.pad(t.mi)}</span>`}
      ${me && day === T.todayKey() ? `<button type="button" class="dv-x" data-del="${r.id}" aria-label="Sil">${A.ui('close')}</button>` : ''}</div>`;
  }
  function render() {
    if (!root) return;
    const today = T.todayKey();
    const day = sel || today;
    K.$('#gsStrip', root).innerHTML = strip();
    const p = T.baku(T.at(day));
    K.$('#gsDay', root).innerHTML = `<p class="card-eyebrow">${day === today ? 'Bugün' : `${p.d} ${K.MONTHS[p.mo - 1]}`}</p><p class="gs-q hand">${K.esc(prompt(day))}</p>
      <div class="gs-pair">${clipCard(day, 'her')}${clipCard(day, 'me')}</div>`;
    const done = Boolean(clip(today, mine()));
    K.$('#gsRec', root).hidden = done || day !== today;
    const s = streak();
    const total = rows.length;
    K.$('#gsStat', root).textContent = `${s ? `${s} günlük ses serisi · ` : ''}${total} ses · ${K.esc(C.herPet)} ${rows.filter((r) => r.who === 'her').length} · ${K.esc(C.myPet)} ${rows.filter((r) => r.who === 'me').length}`;
  }

  /* ---------- Dinleme ---------- */
  function play(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    if (playing) {
      playing.audio.pause();
      const same = playing.id === id;
      playing = null;
      if (same) return render();
    }
    const bin = atob(r.data.b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: r.data.mime || 'audio/webm' }));
    const audio = new Audio(url);
    playing = { id, audio };
    audio.addEventListener('ended', () => {
      playing = null;
      URL.revokeObjectURL(url);
      render();
    });
    audio.play().catch(() => {
      playing = null;
      K.fx.toast('Bu ses bu cihazda çalınamadı.');
      render();
    });
    if (K.audio.music.on) K.audio.music.stop(false);
    render();
  }

  /* ---------- Kayıt ---------- */
  function pickMime() {
    const opts = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return window.MediaRecorder ? opts.find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '' : null;
  }
  const toB64 = (blob) =>
    new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1] || '');
      r.onerror = () => res('');
      r.readAsDataURL(blob);
    });
  async function record() {
    const box = K.$('#gsRec', root);
    const msg = (t) => (K.$('#gsRecMsg', box).innerHTML = t);
    if (rec && rec.r && rec.r.state === 'recording') return rec.r.stop();
    if (starting) return;
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices) return msg('Bu cihaz ses kaydını desteklemiyor.');
    let stream;
    starting = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      return msg('Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.');
    } finally {
      starting = false;
    }
    const chunks = [];
    const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : { audioBitsPerSecond: 48000 });
    rec = { r, start: Date.now() };
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(rec.tick);
      const dur = (Date.now() - rec.start) / 1000;
      box.classList.remove('rec');
      K.$('#gsRecBtn', box).innerHTML = `${A.ui('mic')} Yeniden kaydet`;
      const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' });
      rec = { blob, dur };
      K.$('#gsRecOut', box).innerHTML = `<audio controls src="${URL.createObjectURL(blob)}"></audio><button type="button" class="btn red small" id="gsSend">${A.ui('send')} Bırak</button>`;
    };
    r.start();
    box.classList.add('rec');
    K.$('#gsRecOut', box).innerHTML = '';
    msg('');
    K.$('#gsRecBtn', box).innerHTML = `${A.ui('pause')} Bitir`;
    rec.tick = setInterval(() => {
      const s = (Date.now() - rec.start) / 1000;
      K.$('#gsRing', box).style.setProperty('--p', Math.min(1, s / MAX_S));
      K.$('#gsSec', box).textContent = `${Math.min(MAX_S, Math.floor(s))} / ${MAX_S} sn`;
      if (s >= MAX_S && r.state === 'recording') r.stop();
    }, 100);
  }
  async function send() {
    if (!rec || !rec.blob) return;
    const b64 = await toB64(rec.blob);
    if (!b64 || b64.length > MAX_B64) return K.fx.toast('Kayıt çok büyük; biraz daha kısa dene.');
    const r = await K.cloud.add('dvoice', { day: T.todayKey(), mime: rec.blob.type || 'audio/webm', b64, dur: Math.round(rec.dur * 10) / 10 });
    if (!r) return K.fx.toast('Gönderilemedi. İnterneti kontrol et.');
    rec = null;
    K.$('#gsRecOut', root).innerHTML = '';
    K.audio.sfx.chime();
    K.stickers.award('gunses');
    if (clip(T.todayKey(), other())) K.fx.toast(`<b>${K.esc(K.ek(nameOf(other()), 'in'))} bugünkü sesi açıldı.</b>`, { icon: A.icon('mic') });
    if (!K.isOwner()) K.notify(`${C.herName} günün sesini bıraktı`, prompt(T.todayKey()), ['microphone']);
    sel = null;
    render();
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('dvoice', 400);
    K.cloud.on('dvoice', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} günün sesini bıraktı.</b> ${clip(T.todayKey(), mine()) ? 'Dinleyebilirsin.' : 'Sen de bırakınca açılır.'}`, { icon: A.icon('mic'), duration: 7000 });
      if (K.activeRoom === 'gunses') render();
    });
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'gunses') render();
    });
  });

  K.room({
    id: 'gunses',
    wing: 'kalp',
    title: 'Günün Sesi',
    sub: 'Her gün birbirimize 20 saniye',
    icon: 'mic',
    color: '#FFE0EC',
    hidden: () => !D.gunses || !K.cloud || !K.cloud.enabled,
    badge: () => (clip(T.todayKey(), mine()) ? (streak() > 1 ? `${streak()} gün` : '') : clip(T.todayKey(), other()) ? 'Ses var!' : 'Bugün'),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(GS().intro)}</div>
        <div class="gs-strip" id="gsStrip"></div>
        <section class="card gs-day" id="gsDay"></section>
        <section class="card gs-rec" id="gsRec">
          <div class="gs-ringwrap"><div class="gs-ring" id="gsRing"></div><button type="button" class="gs-mic no-burst" id="gsRecBtn">${A.ui('mic')} Kaydet</button></div>
          <p class="muted small" id="gsSec">En fazla ${MAX_S} saniye</p>
          <div class="gs-out" id="gsRecOut"></div>
          <p class="muted small" id="gsRecMsg"></p>
        </section>
        <p class="muted small" id="gsStat"></p>`;
      el.addEventListener('click', async (e) => {
        const d = e.target.closest('[data-day]');
        if (d) {
          sel = d.dataset.day === T.todayKey() ? null : d.dataset.day;
          return render();
        }
        const pb = e.target.closest('[data-play]');
        if (pb) return play(pb.dataset.play);
        if (e.target.closest('#gsRecBtn')) return record();
        if (e.target.closest('#gsSend')) return send();
        const x = e.target.closest('[data-del]');
        if (x) {
          if (x.dataset.armed !== '1') {
            x.dataset.armed = '1';
            x.classList.add('armed');
            return;
          }
          await K.cloud.remove(x.dataset.del);
          render();
        }
      });
    },
    enter() {
      render();
      const s = K.$('#gsStrip', root);
      s.scrollLeft = s.scrollWidth;
    },
    leave() {
      if (playing) playing.audio.pause();
      playing = null;
      if (rec && rec.r && rec.r.state === 'recording') rec.r.stop();
    },
  });
})();
