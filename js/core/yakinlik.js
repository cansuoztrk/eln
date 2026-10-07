/* Kale 3.0 — Yakınlık: uzaktan dokunmanın küçük biçimleri ve kalenin fark ettikleri (Plan V).
   • Saçını Okşa (kalp menüsü): ekranı yavaşça okşarsın; o kaledeyse aynı hızda bir ışık dalgası onun ekranından geçer.
   • Alnından Öp (kalp menüsü): onun ana salonundaki Kitty'nin alnına gün boyu küçük bir dudak izi düşer.
   • Battaniye: onun şehrinde hava 10°'nin altına düşünce kale haber verir; örttüğün battaniye sabaha kadar onun
     kalesini örgü desenli, sıcak renklere boyar. Kalp menüsünden de örtülebilir.
   • Uzun Sessizlik: iki gündür kimse kaleye bir şey bırakmadıysa Kitty ikinize aynı soruyu sorar; cevaplar ikiniz de
     yazınca açılır.
   • Yıl Dönümü Motoru: her 21'inde ve yıl dönümlerinde ana salonda "geçmişten bir an": bir kare, bir cümle, bir ses.
   • Özlem Barometresi: "Özledim"ler barometreyi doldurur; altı saat içinde ikinizden de üçer özlem gelince ikinize
     "şimdi arama zamanı" bildirimi.
   • Aynı Şarkı Saati: her akşam İstanbul 22:00 / Bakü 23:00'te Şarkı Defteri'nden bir şarkı; ikiniz de dinlerseniz
     o güne bir nota iliştirilir.
   Kayıtlar: oksama {sec} · alinopucuk {} · battaniye {until} · sessizcevap {day, q, text} · sarkisaati {day, song} */
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
  const on = () => K.cloud && K.cloud.enabled;
  const today = () => T.todayKey();
  const store = { alin: [], battaniye: [], sessiz: [], saat: [], ozlem: [] };
  const push = (k, r) => r && !store[k].some((x) => x.id === r.id) && (store[k].push(r), true);

  /* ---------- Saçını Okşa ---------- */
  function oksa() {
    if (!on()) return K.fx.toast('Bunun için ortak kalenin buluta bağlı olması gerekiyor.');
    const ov = K.el(`<div class="yk-oksa" role="dialog" aria-label="Saçını okşa"><p class="yk-ipucu">💆 Parmağını yavaşça gezdir. ${K.cloud.otherHere() ? `${K.esc(nameOf(other()))} şu an kalede, hisseder.` : 'Kaleye girince hisseder.'}</p>
      <svg class="yk-sac" viewBox="0 0 360 360" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<path d="M${-20 + i * 26} -10 C ${30 + i * 22} 120, ${-40 + i * 26} 220, ${20 + i * 24} 380" fill="none" stroke="url(#ykg)" stroke-width="${6 + (i % 3) * 3}" stroke-linecap="round" opacity="${0.5 + (i % 4) * 0.12}"/>`).join('')}<defs><linearGradient id="ykg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3428"/><stop offset="1" stop-color="#2d1913"/></linearGradient></defs></svg>
      <div class="yk-iz"></div><div class="row center yk-alt"><button type="button" class="btn ghost small" data-yk-x>Vazgeç</button><button type="button" class="btn red small" data-yk-bitti disabled>Bitti 💗</button></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    let t0 = 0, dist = 0, last = null, lastSend = 0;
    const iz = K.$('.yk-iz', ov);
    const close = () => (ov.classList.remove('in'), setTimeout(() => ov.remove(), 300));
    const mark = (x, y) => {
      const d = K.el(`<i style="left:${x}px;top:${y}px"></i>`);
      iz.appendChild(d);
      setTimeout(() => d.remove(), 1200);
    };
    ov.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      last = [e.clientX, e.clientY];
      t0 = t0 || Date.now();
    });
    ov.addEventListener('pointermove', (e) => {
      if (!last) return;
      dist += Math.hypot(e.clientX - last[0], e.clientY - last[1]);
      last = [e.clientX, e.clientY];
      mark(e.clientX, e.clientY);
      if (Date.now() - lastSend > 120) {
        lastSend = Date.now();
        K.cloud.send('oksa', { x: +(e.clientX / innerWidth).toFixed(3), y: +(e.clientY / innerHeight).toFixed(3) });
      }
      if (dist > 300) K.$('[data-yk-bitti]', ov).disabled = false;
    });
    const up = () => (last = null);
    ov.addEventListener('pointerup', up);
    ov.addEventListener('pointercancel', up);
    ov.addEventListener('click', async (e) => {
      if (e.target.closest('[data-yk-x]')) return close();
      if (e.target.closest('[data-yk-bitti]')) {
        const sec = Math.max(1, Math.round((Date.now() - t0) / 1000));
        close();
        await K.cloud.add('oksama', { sec });
        K.stickers.award('oksa');
        K.fx.toast(`💆 ${sec} saniye saçını okşadın.`, { duration: 2400 });
        K.ping(`💆 ${K.meName()} saçını okşadı`, `${sec} saniye boyunca, yavaşça.`, ['massage'], { click: K.roomUrl('') });
      }
    });
  }
  function oksaGeldi(m) {
    if (m.who === mine()) return;
    let wave = K.$('.yk-dalga');
    if (!wave) {
      wave = K.el('<div class="yk-dalga" aria-hidden="true"></div>');
      document.body.appendChild(wave);
      K.fx.toast(`💆 <b>${K.esc(nameOf(m.who))}</b> şu an saçını okşuyor.`, { duration: 3200 });
    }
    clearTimeout(wave._t);
    const d = K.el(`<i style="left:${m.x * 100}%;top:${m.y * 100}%"></i>`);
    wave.appendChild(d);
    setTimeout(() => d.remove(), 1400);
    wave._t = setTimeout(() => wave.remove(), 2000);
  }

  /* ---------- Alnından Öp ---------- */
  const alinBugun = () => store.alin.find((r) => r.who === other() && T.key(T.baku(new Date(r.at))) === today());
  function paintAlin() {
    document.body.classList.toggle('alin-opucuk', Boolean(alinBugun()));
    const k = K.$('#heroKitty');
    if (!k) return;
    let m = K.$('.yk-alin', k);
    if (alinBugun() && !m) k.appendChild(K.el(`<span class="yk-alin" aria-label="${K.esc(nameOf(other()))} alnından öptü"><svg viewBox="0 0 40 24" aria-hidden="true"><path d="M2 12 C8 2 16 4 20 9 C24 4 32 2 38 12 C30 22 10 22 2 12 Z" fill="#E5174F" opacity=".85"/><path d="M4 12 C14 14 26 14 36 12" stroke="#a80f37" stroke-width="1.6" fill="none"/></svg></span>`));
    if (!alinBugun() && m) m.remove();
  }
  async function alin(btn) {
    if (!on()) return K.fx.toast('Bunun için ortak kalenin buluta bağlı olması gerekiyor.');
    const r = await K.cloud.add('alinopucuk', {});
    r && push('alin', r);
    K.cloud.send('kalp', { k: 'alin' });
    K.stickers.award('alin');
    K.fx.toast(`😚 Alnından öptün. Kitty'nin alnında bütün gün bir iz kalacak.`, { duration: 2800 });
    K.ping(`😚 ${K.meName()} alnından öptü`, 'Kalenin Kitty\'sinin alnında bütün gün bir iz var.', ['kissing_face'], { click: K.roomUrl('') });
  }

  /* ---------- Battaniye ---------- */
  const cityKey = (w) => (w === 'me' ? 'ist' : 'baku');
  const battaniyeBende = () => store.battaniye.filter((r) => r.who === other() && r.data.until > Date.now()).sort((a, b) => b.at - a.at)[0];
  function paintBattaniye() {
    document.body.classList.toggle('battaniye', Boolean(battaniyeBende()));
  }
  async function battaniye() {
    if (!on()) return K.fx.toast('Bunun için ortak kalenin buluta bağlı olması gerekiyor.');
    // Onun şehrinde ertesi sabah 09:00'a kadar
    const tz = other() === 'her' ? C.tzBaku : C.tzIstanbul;
    const p = T.parts(tz);
    const until = Date.UTC(p.y, p.mo - 1, p.d + (p.h >= 9 ? 1 : 0), 9 - tz, 0);
    const r = await K.cloud.add('battaniye', { until });
    r && push('battaniye', r);
    K.stickers.award('battaniye');
    K.fx.toast(`🧣 Battaniyeyi örttün. Sabaha kadar onun kalesi sıcacık.`, { duration: 2800 });
    K.ping(`🧣 ${K.meName()} üstüne bir battaniye örttü`, 'Hava soğuk; kalen sabaha kadar sıcacık.', ['scarf'], { click: K.roomUrl('') });
  }
  const soguk = () => {
    const w = K.gercekhava && K.gercekhava.now();
    const x = w && w[cityKey(other())];
    return x && typeof x.temp === 'number' && x.temp < 10 ? x.temp : null;
  };

  /* ---------- Uzun Sessizlik ---------- */
  const SORULAR = () =>
    (D.yakinlik && D.yakinlik.sessiz) || [
      'Şu an ne yapıyor olsaydık keşke?',
      'Bu iki günde aklından geçen ama yazmadığın bir şey?',
      'En son ne zaman beni düşünüp gülümsedin?',
      'Şu an yanında olsam ilk ne yapardın?',
      'Bu hafta sana iyi gelen bir şey?',
      'Bana söylemeyi unuttuğun küçük bir haber?',
    ];
  let sonHareket = Date.now();
  const sessizGun = () => store.sessiz.slice().sort((a, b) => b.at - a.at)[0];
  function acikSoru() {
    const s = sessizGun();
    if (!s || Date.now() - s.at > 5 * 864e5) return null;
    const both = ['me', 'her'].every((w) => store.sessiz.some((r) => r.data.day === s.data.day && r.who === w));
    return { day: s.data.day, q: s.data.q, mine: store.sessiz.find((r) => r.data.day === s.data.day && r.who === mine()), both };
  }
  function sessizSheet(q, day) {
    const a = acikSoru();
    const answers = store.sessiz.filter((r) => r.data.day === day);
    const m = K.ui.modal({
      label: 'Kitty soruyor',
      cls: 'yk-sessiz',
      html: `<div class="yk-kitty">${A.kitty({ eyes: 'happy' })}</div><p class="card-eyebrow">İki gündür sessizdi kale</p><h3>${K.esc(q)}</h3>
        ${a && a.both ? answers.map((r) => `<blockquote class="yk-cevap ${r.who}"><p>${K.esc(r.data.text)}</p><cite>${K.esc(nameOf(r.who))}</cite></blockquote>`).join('') : a && a.mine ? `<p class="muted">Cevabın mühürlü. ${K.esc(nameOf(other()))} da yazınca ikisi birlikte açılacak.</p>` : `<textarea class="textarea" id="ykSes" maxlength="400" placeholder="Cevabın..."></textarea><div class="row"><button type="button" class="btn red" data-yk-cevap>Mühürle ve gönder</button></div><p class="muted small">Cevaplar ikiniz de yazınca aynı anda açılır.</p>`}`,
    });
    m.body.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-yk-cevap]')) return;
      const text = K.$('#ykSes', m.body).value.trim();
      if (!text) return;
      const r = await K.cloud.add('sessizcevap', { day, q, text });
      r && push('sessiz', r);
      m.close();
      K.stickers.award('sessiz');
      K.ping(`💭 ${K.meName()} Kitty'nin sorusunu cevapladı`, 'Senin cevabın gelince ikisi birlikte açılacak.', ['thought_balloon'], { click: K.roomUrl('') });
    });
  }

  /* ---------- Yıl Dönümü Motoru ---------- */
  function ozelGun() {
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    if (C.togetherDate && md === C.togetherDate.slice(5) && p.y > +C.togetherDate.slice(0, 4)) return 'Sevgili olduğumuz gün';
    if (C.metDate && md === C.metDate.slice(5) && p.y > +C.metDate.slice(0, 4)) return 'Tanıştığımız gün';
    if (K.ilkbakis && K.ilkbakis.gun && K.ilkbakis.gun() === md) return 'İlk Bakış Günü';
    if (p.d === 21) return `${T.monthsTogether ? T.monthsTogether() + '. ayımız' : 'Bizim günümüz'}`;
    return null;
  }
  async function gecmisten() {
    if (!K.arsiv || !K.belgesel) return;
    const [ph, nt, vs] = await Promise.all([K.arsiv.photos(), K.arsiv.notes(), K.arsiv.voices()]);
    const h = K.hash(today());
    const sc = [{ t: 'baslik', eyebrow: 'Geçmişten bir an', title: ozelGun() || 'Bizim günümüz', sub: 'Kale bugün için arşivden üç şey seçti.' }];
    const eski = (arr) => arr.filter((x) => Date.now() - x.at > 7 * 864e5);
    const p = eski(ph), n = eski(nt).filter((x) => x.text.length > 8), v = eski(vs);
    if (p.length) {
      const x = p[h % p.length];
      sc.push({ t: 'foto', src: x.thumb, full: x.full, caption: x.text || x.label, sub: `${T.fmt(x.day)} · ${nameOf(x.who)}` });
    }
    if (n.length) {
      const x = n[(h >> 3) % n.length];
      sc.push({ t: 'yazi', text: x.text, by: `${x.label} · ${nameOf(x.who)} · ${T.fmt(x.day)}` });
    }
    if (v.length) {
      const x = v[(h >> 5) % v.length];
      sc.push({ t: 'ses', audio: x.audio, by: `${nameOf(x.who)} · ${T.fmt(T.key(T.baku(new Date(x.at))))}`, text: 'Telesekreterden' });
    }
    sc.push({ t: 'kapanis', text: 'Her gün birbirimize küçük bir şey bırakıyoruz.', sub: 'Kale hepsini saklıyor.' });
    K.store.set('gecmistenGordu', today());
    K.belgesel.play(sc, { mood: 'nostalji', label: 'Geçmişten bir an' });
    K.stickers.award('gecmisten');
  }

  /* ---------- Özlem Barometresi ---------- */
  const ozlemSay = (w) => store.ozlem.filter((r) => r.who === w && Date.now() - r.at < 6 * 36e5).length;
  const barometre = () => Math.min(1, Math.min(ozlemSay('me'), ozlemSay('her')) / 3);
  function ozlemGeldi(r) {
    if (!push('ozlem', r)) return;
    const k = 'ozlemDolu' + today();
    if (barometre() >= 1 && !K.store.get(k) && r.who === mine()) {
      K.store.set(k, 1);
      K.stickers.award('barometre');
      K.fx.confetti({ count: 80, shapes: ['heart'] });
      K.fx.toast('🥺 <b>Özlem barometresi doldu.</b> İkiniz de birbirinizi çok özlediniz: şimdi arama zamanı.', { duration: 6000 });
      K.ping('📞 Özlem barometresi doldu', 'İkiniz de birbirinizi çok özlediniz. Şimdi arama zamanı.', ['telephone_receiver'], { click: K.roomUrl('') });
    }
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }

  /* ---------- Aynı Şarkı Saati ---------- */
  const saatSarki = () => {
    const list = K.sarkidefteri ? K.sarkidefteri.songs() : [];
    return list.length ? list[K.hash('saat' + today()) % list.length] : null;
  };
  // İstanbul 22:00 (Bakü 23:00) — bugünün anı
  const saatAni = () => {
    const p = T.ist();
    return Date.UTC(p.y, p.mo - 1, p.d, 22 - C.tzIstanbul, 0);
  };
  function saatPlanla() {
    if (!on() || K.store.get('saatPlan') === today() || !(C.ntfyTopic || C.ntfyTopicHer)) return;
    const at = saatAni();
    const later = K.later(at);
    if (!later) return;
    K.store.set('saatPlan', today());
    const s = saatSarki();
    K.ntfyTo(mine(), '🎵 Şarkı saati', s ? `${s.data.artist} · ${s.data.title}. ${nameOf(other())} da şimdi dinliyor olabilir.` : 'Kaleye gel, aynı şarkıyı dinleyelim.', ['notes'], Object.assign({ click: K.roomUrl('') }, later));
  }
  function saatAcik() {
    const d = Date.now() - saatAni();
    return d >= 0 && d < 45 * 60e3;
  }
  function saatDinle() {
    const s = saatSarki();
    if (!s) return K.fx.toast('Şarkı Defteri\'nde çalınabilen şarkı yok.');
    const m = K.ui.modal({ label: 'Şarkı saati', cls: 'yk-saat', html: `<p class="card-eyebrow">Şarkı saati · İstanbul 22:00 · Bakü 23:00</p><h3>${K.esc(s.data.artist)} · ${K.esc(s.data.title)}</h3><div class="yk-tv" id="ykTv"></div><p class="muted small">${K.esc(nameOf(other()))} da bu akşam aynı şarkıyı dinleyebilir.</p>`, onClose: () => pk && pk.stop() });
    K.audio.music.on && K.audio.music.stop(false);
    const pk = K.pikap.mount(K.$('#ykTv', m.body), s.song, {});
    if (on() && !store.saat.some((r) => r.who === mine() && r.data.day === today())) K.cloud.add('sarkisaati', { day: today(), song: s.id }).then((r) => r && push('saat', r));
    K.stickers.award('sarkisaati');
  }

  /* ---------- Ana salon kartları ---------- */
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const out = [];
    if (!on()) return out;
    const temp = soguk();
    if (temp != null && !store.battaniye.some((r) => r.who === mine() && r.data.until > Date.now()))
      out.push({ key: 'battaniye', icon: 'snow', title: `🧣 ${other() === 'her' ? C.herCity : C.myCity} bugün soğuk (${temp}°)`, text: `${nameOf(other())} üşüyor olabilir. Ona kaleden bir battaniye ört; sabaha kadar kalesi sıcacık olsun.`, run: battaniye, cta: 'Battaniye ört' });
    const bt = battaniyeBende();
    if (bt) out.push({ key: 'battaniyeBende', icon: 'hugs', title: `🧣 ${nameOf(bt.who)} üstüne battaniye örttü`, text: 'Kale sabaha kadar sıcacık.', run: () => K.fx.rain({ count: 20, shapes: ['heart'] }), cta: '💗', mini: true });
    const a = acikSoru();
    if (a && (!a.mine || a.both) && K.store.get('sessizGordu') !== a.day + (a.both ? 'b' : ''))
      out.push({ key: 'sessiz', icon: 'question', title: a.both ? '💭 İki cevap da geldi' : '💭 Kitty ikinize aynı şeyi soruyor', text: a.q, run: () => (K.store.set('sessizGordu', a.day + (a.both ? 'b' : '')), sessizSheet(a.q, a.day)), cta: a.both ? 'Cevapları aç' : 'Cevapla' });
    if (ozelGun() && K.store.get('gecmistenGordu') !== today() && K.arsiv)
      out.push({ key: 'gecmisten', icon: 'film', title: `✨ ${ozelGun()}: geçmişten bir an`, text: 'Kale arşivden bir kare, bir cümle ve bir ses seçti.', run: gecmisten, cta: 'Aç' });
    const b = barometre();
    if (b > 0 && b < 1) out.push({ key: 'barometre', icon: 'heart', title: `🥺 Özlem barometresi %${Math.round(b * 100)}`, text: `Son altı saatte sen ${ozlemSay(mine())}, ${nameOf(other())} ${ozlemSay(other())} kez özledi. İkinizden de üçer özlem gelince bildirim gider.`, run: () => K.kalp && K.kalp.openMenu(), cta: 'Özledim', mini: true });
    if (saatAcik() && saatSarki()) {
      const both = ['me', 'her'].every((w) => store.saat.some((r) => r.who === w && r.data.day === today()));
      out.push({ key: 'sarkisaati', icon: 'music', title: both ? '🎵 Bu akşam aynı şarkıyı dinlediniz' : '🎵 Şarkı saati', text: `${saatSarki().data.artist} · ${saatSarki().data.title}`, run: saatDinle, cta: 'Dinle' });
    }
    return out;
  });

  /* ---------- Kalp menüsü ---------- */
  K.kalpEk = (K.kalpEk || []).concat([
    { id: 'oksa', emo: '💆', label: 'Saçını okşa', ok: on, run: oksa },
    { id: 'alin', emo: '😚', label: 'Alnından öp', ok: on, run: alin },
    { id: 'battaniye', emo: '🧣', label: 'Battaniye ört', ok: on, run: battaniye },
  ]);

  K.on('cloud', async (ok) => {
    if (!ok) return;
    const since = Date.now() - 6 * 864e5;
    const rows = await K.cloud.many(['alinopucuk', 'battaniye', 'sessizcevap', 'sarkisaati', 'ozlem'], { since, limit: 800 });
    rows.forEach((r) => push({ alinopucuk: 'alin', battaniye: 'battaniye', sessizcevap: 'sessiz', sarkisaati: 'saat', ozlem: 'ozlem' }[r.kind], r));
    K.cloud.on('alinopucuk', (r) => push('alin', r) && paintAlin());
    K.cloud.on('battaniye', (r) => {
      if (!push('battaniye', r)) return;
      paintBattaniye();
      if (r.who === other()) K.fx.toast(`🧣 <b>${K.esc(nameOf(r.who))}</b> üstüne bir battaniye örttü.`, { duration: 4000 });
    });
    K.cloud.on('sessizcevap', (r) => push('sessiz', r) && K.renderSpecials && !K.activeRoom && K.renderSpecials());
    K.cloud.on('sarkisaati', (r) => push('saat', r));
    K.cloud.on('ozlem', ozlemGeldi);
    K.cloud.onLive('oksa', oksaGeldi);
    K.cloud.onLive('kalp', (m) => {
      if (m.k !== 'alin' || m.who === mine()) return;
      const ov = K.el('<div class="yk-alin-ov" aria-hidden="true">😚</div>');
      document.body.appendChild(ov);
      setTimeout(() => ov.remove(), 2400);
      K.fx.toast(`😚 <b>${K.esc(nameOf(m.who))}</b> alnından öptü.`, { duration: 3600 });
    });
    paintAlin();
    paintBattaniye();
    // Uzun sessizlik: son iki günde iki taraftan da kayıt yoksa (ve bugün sorulmadıysa) soru aç
    const recent = await K.cloud.many(['kucak', 'selam', 'kalpk', 'dusun', 'ozlem', 'tsmesaj', 'kare', 'postcard', 'minnet', 'hikaye', 'mektup'], { since: Date.now() - 2 * 864e5, limit: 20 });
    if (!recent.length && !acikSoru()) {
      const q = SORULAR()[K.hash(today()) % SORULAR().length];
      store.sessiz.push({ id: 'yerel-' + today(), who: 'kitty', at: Date.now(), data: { day: today(), q } });
    }
    saatPlanla();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.on('built', () => {
    paintAlin();
    paintBattaniye();
  });
  K.yakinlik = { oksa, alin, battaniye, barometre, gecmisten, ozelGun, saatSarki, sessizSheet, store };
})();
