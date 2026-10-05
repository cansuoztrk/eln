/* Oda: Telesekreter — ikimizin sesli mesaj kutusu. Kayda bas (en fazla 90 saniye), bir etiket seç (günaydın, özledim,
   sesini duymak istedim...), gönder. Mesajlar silinmez; dinlenmemiş mesaj varsa makinenin ışığı yanıp söner, kaset
   makaraları çalarken döner. Dinleyince gönderene "dinlendi" bilgisi gider.
   Kayıtlar: tsses {b64, mime} · tsmesaj {audio, dur, tag} · tsdinle {ref} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const TS = () => D.telesekreter || { intro: [], tags: [['sadece', '💗', 'Sesli mesaj']], empty: '' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const MAX = 90;

  let rows = [], loaded = false, root = null, rec = null, draft = null, tag = '', player = null, urls = {};
  const msgs = (w) => rows.filter((r) => r.kind === 'tsmesaj' && (!w || r.who === w)).sort((a, b) => b.at - a.at);
  const heard = (id) => rows.some((r) => r.kind === 'tsdinle' && r.data.ref === id);
  const unheard = () => msgs(other()).filter((r) => !heard(r.id));
  const tagOf = (t) => (TS().tags || []).find((x) => x[0] === t) || ['', '📼', 'Sesli mesaj'];
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);

  /* ---------- Makine ---------- */
  function lcd() {
    if (rec) return `● KAYIT ${mmss((Date.now() - rec.start) / 1000)}`;
    if (player) return `▶ ${mmss(player.a.currentTime || 0)} / ${mmss(player.dur || 0)}`;
    if (draft) return `HAZIR ${mmss(draft.dur)}`;
    const n = unheard().length;
    return n ? `${n} YENİ MESAJ` : `${msgs().length} MESAJ`;
  }
  function machine() {
    const n = unheard().length;
    return `<div class="ts-machine ${rec ? 'rec' : ''} ${player ? 'play' : ''}">
      <div class="ts-top"><span class="ts-led ${n ? 'blink' : 'ok'}" aria-hidden="true"></span><span class="ts-brand">KALE · 21</span><span class="ts-lcd" id="tsLcd">${lcd()}</span></div>
      <div class="ts-tape" aria-hidden="true"><i class="ts-reel"><b></b></i><span class="ts-band"></span><i class="ts-reel"><b></b></i></div>
      <div class="ts-keys"><button type="button" class="ts-rec" data-ts="rec" aria-label="${rec ? 'Kaydı bitir' : 'Kaydet'}">${rec ? '■' : '●'}</button>${n ? `<button type="button" class="ts-playnew" data-ts="yeni">▶ Yenileri dinle</button>` : ''}</div>
    </div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'telesekreter') return;
    K.$('#tsMachine', root).innerHTML = machine();
    const dr = K.$('#tsDraft', root);
    dr.hidden = !draft;
    if (draft)
      dr.innerHTML = `<p class="card-eyebrow">Kaydın hazır · ${mmss(draft.dur)}</p><audio controls src="${draft.url}"></audio>
        <div class="ts-tags">${(TS().tags || []).map(([id, e, l]) => `<button type="button" class="chip ${tag === id ? 'on' : ''}" data-ts-tag="${id}">${e} ${K.esc(l)}</button>`).join('')}</div>
        <div class="row"><button type="button" class="btn red" data-ts="send">${A.ui('send')} ${K.esc(K.ek(nameOf(other()), 'e'))} gönder</button><button type="button" class="btn ghost" data-ts="sil">Sil, yeniden kaydet</button></div>`;
    const row = (r, inbox) => {
      const t = tagOf(r.data.tag);
      const isNew = inbox && !heard(r.id);
      const playing = player && player.id === r.id;
      return `<li class="${isNew ? 'new' : ''} ${playing ? 'playing' : ''}"><button type="button" class="ts-play" data-ts-play="${r.id}" aria-label="${playing ? 'Durdur' : 'Dinle'}">${playing ? A.ui('pause') : A.ui('play')}</button>
        <div><b>${t[1]} ${K.esc(t[2])}</b><small>${K.esc(K.ago(r.at))} · ${mmss(r.data.dur || 0)}${inbox ? '' : heard(r.id) ? ' · dinlendi ✓' : ' · henüz dinlemedi'}</small><span class="ts-bar"><i style="width:${playing ? Math.min(100, ((player.a.currentTime || 0) / (player.dur || 1)) * 100) : 0}%"></i></span></div>${isNew ? '<span class="ts-new">yeni</span>' : ''}</li>`;
    };
    const inbox = msgs(other()), sent = msgs(mine());
    K.$('#tsIn', root).innerHTML = `<p class="card-eyebrow">${K.esc(nameOf(other()))} bıraktı</p>${inbox.length ? `<ul class="ts-list">${inbox.map((r) => row(r, true)).join('')}</ul>` : `<p class="muted small">${K.esc(TS().empty || '')}</p>`}`;
    K.$('#tsOut', root).innerHTML = `<p class="card-eyebrow">Senin bıraktıkların</p>${sent.length ? `<ul class="ts-list">${sent.map((r) => row(r, false)).join('')}</ul>` : '<p class="muted small">Henüz göndermedin.</p>'}`;
  }
  let tickT = 0;
  function tick() {
    const l = root && K.$('#tsLcd', root);
    if (l) l.textContent = lcd();
    if (player && root) {
      const bar = K.$(`[data-ts-play="${player.id}"]`, root);
      const i = bar && K.$('.ts-bar i', bar.parentElement);
      if (i) i.style.width = `${Math.min(100, ((player.a.currentTime || 0) / (player.dur || 1)) * 100)}%`;
    }
  }

  /* ---------- Kayıt ---------- */
  async function toggleRec() {
    if (rec) return rec.r.state === 'recording' && rec.r.stop();
    if (player) stop();
    const mime = window.MediaRecorder ? ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((x) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '' : null;
    if (mime === null || !navigator.mediaDevices) return K.fx.toast('Bu cihaz ses kaydını desteklemiyor.');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      return K.fx.toast('Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.');
    }
    const chunks = [];
    const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : { audioBitsPerSecond: 48000 });
    rec = { r, start: Date.now() };
    r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' });
      const dur = Math.max(1, Math.round((Date.now() - rec.start) / 100) / 10);
      rec = null;
      const old = draft && draft.url;
      draft = { blob, dur, url: URL.createObjectURL(blob) };
      if (old) setTimeout(() => URL.revokeObjectURL(old), 1500);
      K.audio.sfx.tap();
      render();
    };
    r.start();
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    render();
    clearInterval(tickT);
    tickT = setInterval(() => {
      tick();
      if (rec && (Date.now() - rec.start) / 1000 >= MAX && rec.r.state === 'recording') rec.r.stop();
      if (!rec && !player) clearInterval(tickT);
    }, 250);
  }
  async function send(btn) {
    if (!draft) return;
    btn.disabled = true;
    btn.classList.add('loading');
    const b64 = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(',')[1] || '');
      fr.onerror = () => res('');
      fr.readAsDataURL(draft.blob);
    });
    const au = b64 && b64.length < 3.2e6 && (await K.cloud.add('tsses', { b64, mime: draft.blob.type || 'audio/webm' }));
    const r = au && (await K.cloud.add('tsmesaj', { audio: au.id, dur: draft.dur, tag: tag || 'sadece' }));
    if (!r) {
      btn.disabled = false;
      btn.classList.remove('loading');
      return K.fx.toast(au ? 'Gönderilemedi. İnterneti kontrol et.' : 'Ses çok uzun ya da gönderilemedi. Daha kısa bir kayıt dene.');
    }
    push(r);
    const t = tagOf(tag || 'sadece');
    const old = draft.url;
    draft = null;
    setTimeout(() => URL.revokeObjectURL(old), 1500);
    tag = '';
    K.audio.sfx.success();
    K.stickers.award('telesekreter');
    K.fx.toast(`📼 <b>Mesajın bırakıldı.</b> ${K.esc(nameOf(other()))} dinleyince burada görürsün.`, { duration: 4000 });
    K.ping(`📼 ${K.meName()} sana sesli mesaj bıraktı`, `${t[1]} ${t[2]} · ${mmss(r.data.dur)}`, ['telephone_receiver'], { click: K.roomUrl('telesekreter') });
    render();
  }

  /* ---------- Dinleme ---------- */
  function stop() {
    if (!player) return;
    try {
      player.a.pause();
    } catch (e) {}
    player = null;
    render();
  }
  async function play(id, then) {
    if (player && player.id === id) return stop();
    if (player) stop();
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    let url = urls[id];
    if (!url) {
      const h = await K.cloud.get(r.data.audio);
      if (!h || !h.data || !h.data.b64) return K.fx.toast('Ses bulunamadı.');
      const bin = atob(h.data.b64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      url = urls[id] = URL.createObjectURL(new Blob([u8], { type: h.data.mime || 'audio/mp4' }));
    }
    const a = new Audio(url);
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    player = { id, a, dur: r.data.dur };
    a.onended = () => {
      player = null;
      render();
      then && then();
    };
    a.play().catch(() => {
      player = null;
      render();
    });
    render();
    clearInterval(tickT);
    tickT = setInterval(() => {
      tick();
      if (!rec && !player) clearInterval(tickT);
    }, 250);
    if (r.who !== mine() && !heard(id)) {
      const d = await K.cloud.add('tsdinle', { ref: id });
      push(d);
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    }
  }
  function playNew() {
    const list = unheard().slice().reverse();
    const next = () => {
      const r = list.shift();
      if (r) play(r.id, next);
    };
    next();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['tsmesaj', 'tsdinle'], { limit: 1000 });
    loaded = true;
    ['tsmesaj', 'tsdinle'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine()) {
          if (k === 'tsmesaj') {
            K.audio.sfx.chime();
            K.fx.toast(`📼 <b>${K.esc(nameOf(r.who))} sana sesli mesaj bıraktı.</b> ${K.esc(tagOf(r.data.tag)[2])} · ${mmss(r.data.dur || 0)} <a href="#telesekreter">Dinle</a>`, { duration: 9000 });
          }
          if (k === 'tsdinle') K.fx.toast(`📼 ${K.esc(nameOf(r.who))} sesli mesajını dinledi.`, { duration: 3500, log: false });
        }
        render();
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const n = unheard();
    return n.length ? [{ icon: 'radio', title: `📼 ${nameOf(other())} sana ${n.length > 1 ? `${n.length} sesli mesaj` : 'sesli bir mesaj'} bıraktı`, text: `${tagOf(n[0].data.tag)[1]} ${tagOf(n[0].data.tag)[2]} · ${mmss(n[0].data.dur || 0)}. Telesekreterin ışığı yanıp sönüyor.`, room: 'telesekreter', cta: 'Dinle' }] : [];
  });

  K.telesekreter = { count: () => msgs().length, unheard: () => (loaded ? unheard().length : 0), list: (w) => msgs(w) };

  K.room({
    id: 'telesekreter',
    wing: 'kalp',
    title: 'Telesekreter',
    sub: 'Sesini duymak istediğinde',
    icon: 'radio',
    color: '#FFE0EA',
    hidden: () => !D.telesekreter || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && unheard().length ? `${unheard().length} yeni` : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(TS().intro || [])}</div>
        <section class="ts-wrap" id="tsMachine"></section>
        <section class="card ts-draft" id="tsDraft" hidden></section>
        <section class="card" id="tsIn"></section>
        <section class="card" id="tsOut"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ts]');
        if (b) {
          const k = b.dataset.ts;
          if (k === 'rec') return toggleRec();
          if (k === 'yeni') return playNew();
          if (k === 'send') return send(b);
          if (k === 'sil') {
            const old = draft && draft.url;
            draft = null;
            render();
            return old && setTimeout(() => URL.revokeObjectURL(old), 1500);
          }
        }
        const t = e.target.closest('[data-ts-tag]');
        if (t) {
          tag = t.dataset.tsTag;
          return K.$$('[data-ts-tag]', el).forEach((x) => x.classList.toggle('on', x === t));
        }
        const p = e.target.closest('[data-ts-play]');
        if (p) play(p.dataset.tsPlay);
      });
    },
    enter() {
      render();
    },
    leave() {
      stop();
      if (rec && rec.r.state === 'recording') rec.r.stop();
    },
  });
})();
