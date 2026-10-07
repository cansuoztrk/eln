/* Oda: Kalenin Melodisi — kalede çalan arka plan müziği artık seçilebilir ve ikimizin ortak seçimi.
   Hazır olanlar: Eln'in Valsi (bu kale için yazılmış özgün vals), Sarı Gelin (Erzurum'dan Bakü'ye uzanan anonim aşk
   türküsü) ve Üsküdar'a Gider İken (İstanbul'un anonim aşk şarkısı). İkili Piyano'da çaldığın melodiler de listede.
   "Mırıldan": istediğin şarkıyı telefona mırıldanırsın, kale sesinin perdesini dinleyip notalara çevirir; o melodi
   kalenin melodisi olabilir. Seçim buluta yazılır, iki telefonda da aynı şarkı çalar.
   Kayıtlar: kalemelodi {id} (son seçim geçerli) · mirildan {name, notes: [[midi, ms]]} (İkili Piyano ile aynı biçim) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const HAZIR = [
    ['waltz', "Eln'in Valsi", 'Bu kale için yazılmış özgün bir vals, 3/4.'],
    ['sarigelin', 'Sarı Gelin', "Erzurum'dan Bakü'ye uzanan anonim aşk türküsü. Türk ve Azerbaycan halk geleneğinin ortak şarkısı."],
    ['uskudar', "Üsküdar'a Gider İken", "İstanbul'un anonim aşk şarkısı (Kâtibim)."],
  ];
  let root = null, secim = [], piyano = [], miril = [], preview = null, rec = null;
  const current = () => {
    const last = secim.slice().sort((a, b) => a.at - b.at).pop();
    return (last && last.data.id) || K.store.get('kaleMelodi', 'waltz');
  };
  // Kullanıcı melodisi → müzik kutusu olayları (saniye = vuruş, 60 bpm). Bir oktav içinde bell'e uygun yükseklik.
  function fromNotes(notes) {
    let t = 0;
    const ev = [];
    const ms = notes.map((n) => n[0]);
    const med = ms.slice().sort((a, b) => a - b)[Math.floor(ms.length / 2)] || 72;
    const shift = Math.round((76 - med) / 12) * 12;
    notes.forEach(([m, d], i) => {
      t += i ? d / 1000 : 0;
      const next = notes[i + 1] ? notes[i + 1][1] / 1000 : 0.8;
      ev.push({ beat: t, m: m + shift, len: Math.max(0.25, Math.min(2, next)), vol: 0.22 });
    });
    return { events: ev, beats: t + 1.6, bpm: 60 };
  }
  function userRows() {
    return [...piyano.map((r) => ['p:' + r.id, r.data.name, `${nameOf(r.who)} piyanoda çaldı · ${r.data.notes.length} nota`, r]), ...miril.map((r) => ['m:' + r.id, r.data.name, `${nameOf(r.who)} mırıldandı · ${r.data.notes.length} nota`, r])];
  }
  // Seçilen kullanıcı melodisini müzik motoruna kaydet
  function register(id) {
    if (!id || (!id.startsWith('p:') && !id.startsWith('m:'))) return id;
    const row = [...piyano, ...miril].find((r) => r.id === id.slice(2));
    if (!row || !row.data.notes || row.data.notes.length < 3) return 'waltz';
    K.audio.melodies['u_' + row.id] = fromNotes(row.data.notes);
    return 'u_' + row.id;
  }
  K.audio.music.pick = () => register(current());
  function stopPreview() {
    preview && preview.stop();
    preview = null;
    root && K.$$('[data-km-dinle]', root).forEach((b) => (b.textContent = '▶ Dinle'));
  }
  function listen(id, btn) {
    const was = preview && btn.dataset.kmDinle === btn.dataset.kmPlaying;
    stopPreview();
    if (was) return;
    K.audio.music.on && K.audio.music.stop(false);
    const name = register(id);
    preview = K.audio.play(name, { onEnd: stopPreview });
    btn.textContent = '■ Durdur';
    btn.dataset.kmPlaying = btn.dataset.kmDinle;
  }
  async function choose(id) {
    K.store.set('kaleMelodi', id);
    if (K.cloud && K.cloud.enabled) {
      const r = await K.cloud.add('kalemelodi', { id });
      r && !secim.some((x) => x.id === r.id) && secim.push(r);
    }
    K.stickers.award('kalemelodi');
    K.audio.music.restart();
    const n = [...HAZIR, ...userRows()].find((x) => x[0] === id);
    K.fx.toast(`🎵 Kalenin melodisi artık <b>${K.esc(n ? n[1] : 'yeni melodi')}</b>`, { duration: 2600 });
    render();
  }

  /* ---------- Mırıldan: perde tanıma ---------- */
  function pitch(buf, sr) {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    if (rms < 0.015) return 0;
    const minLag = Math.floor(sr / 900), maxLag = Math.min(buf.length >> 1, Math.floor(sr / 80));
    let best = 0, e0 = 0;
    const R = new Float32Array(maxLag + 2);
    for (let i = 0; i < buf.length - maxLag; i++) e0 += buf[i] * buf[i];
    for (let lag = minLag; lag <= maxLag + 1; lag++) {
      let c = 0, e1 = 0;
      for (let i = 0; i < buf.length - maxLag; i++) {
        c += buf[i] * buf[i + lag];
        e1 += buf[i + lag] * buf[i + lag];
      }
      R[lag] = c / Math.sqrt(e0 * e1 + 1e-9);
      if (R[lag] > best) best = R[lag];
    }
    if (best < 0.86) return 0;
    // Periyodun katları da yüksek çıkar: en yükseğe yakın ilk tepeyi seç (oktav hatası olmasın)
    for (let lag = minLag + 1; lag <= maxLag; lag++) {
      if (R[lag] >= best * 0.92 && R[lag] >= R[lag - 1] && R[lag] >= R[lag + 1]) {
        const a = R[lag - 1], b = R[lag], c = R[lag + 1];
        const den = a - 2 * b + c;
        const shift = den ? (0.5 * (a - c)) / den : 0;
        return sr / (lag + shift);
      }
    }
    return 0;
  }
  const toMidi = (f) => Math.round(69 + 12 * Math.log2(f / 440));
  // Kare kare perdeler (50 ms) → notalar [[midi, öncekinden ms]]
  function segment(frames) {
    const sm = frames.map((m, i) => {
      const w = frames.slice(Math.max(0, i - 1), i + 2).filter(Boolean).sort((a, b) => a - b);
      return w.length >= 2 ? w[Math.floor(w.length / 2)] : 0;
    });
    const notes = [];
    let cur = 0, start = 0, len = 0;
    const push = () => {
      if (cur && len >= 2) notes.push([cur, start * 50, len * 50]);
    };
    sm.forEach((m, i) => {
      if (m === cur) return len++;
      push();
      (cur = m), (start = i), (len = 1);
    });
    push();
    return notes.map(([m, at], i) => [m, i ? at - notes[i - 1][1] : 0]);
  }
  async function startRec(btn) {
    if (!navigator.mediaDevices) return K.fx.toast('Bu telefon mikrofona izin vermiyor.');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
    } catch (e) {
      return K.fx.toast('Mikrofon izni verilmedi.');
    }
    stopPreview();
    K.audio.music.on && K.audio.music.stop(false);
    const c = K.audio.ensure();
    const src = c.createMediaStreamSource(stream);
    const an = c.createAnalyser();
    an.fftSize = 2048;
    src.connect(an);
    const buf = new Float32Array(an.fftSize);
    const frames = [];
    const t0 = Date.now();
    const out = K.$('#kmCanli', root);
    rec = {
      stop() {
        clearInterval(rec.tm);
        stream.getTracks().forEach((t) => t.stop());
        src.disconnect();
      },
    };
    btn.textContent = '⏹ Bitir';
    rec.tm = setInterval(() => {
      an.getFloatTimeDomainData(buf);
      const f = pitch(buf, c.sampleRate);
      const m = f ? toMidi(f) : 0;
      frames.push(m);
      const s = (Date.now() - t0) / 1000;
      out.innerHTML = `<b>${m ? ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'][m % 12] : '·'}</b><span>${s.toFixed(1)} sn · mırıldan, ben dinliyorum</span><i style="--p:${Math.min(1, s / 20)}"></i>`;
      if (s >= 20) finish(btn, frames);
    }, 50);
    rec.frames = frames;
  }
  function finish(btn, frames) {
    if (!rec) return;
    rec.stop();
    rec = null;
    btn.textContent = '🎙 Mırıldan';
    const notes = segment(frames);
    const box = K.$('#kmSonuc', root);
    if (notes.length < 4) {
      K.$('#kmCanli', root).innerHTML = '';
      return (box.innerHTML = '<p class="muted">Yeterince nota duyamadım. Biraz daha yüksek sesle, "na na na" diye ve sessiz bir yerde dener misin?</p>');
    }
    box.innerHTML = `<p><b>${notes.length} nota</b> yakaladım.</p><div class="row"><button type="button" class="btn soft small" data-km-taslak>▶ Dinle</button><input class="input" id="kmAd" maxlength="40" placeholder="Bu şarkının adı"><button type="button" class="btn red small" data-km-kaydet>Kaydet</button></div>`;
    box._notes = notes;
    K.$('#kmCanli', root).innerHTML = '';
  }

  function render() {
    if (!root || K.activeRoom !== 'kalemelodi') return;
    const cur = current();
    const last = secim.slice().sort((a, b) => a.at - b.at).pop();
    const row = (id, name, sub) => `<div class="km-satir ${cur === id ? 'secili' : ''}"><span class="km-plak" aria-hidden="true">${cur === id ? '♫' : '♪'}</span><div><b>${K.esc(name)}</b><small>${K.esc(sub)}</small></div><button type="button" class="btn soft small" data-km-dinle="${id}">▶ Dinle</button>${cur === id ? '<span class="km-calan">Kalede çalıyor</span>' : `<button type="button" class="btn red small" data-km-sec="${id}">Seç</button>`}</div>`;
    K.$('#kmHazir', root).innerHTML = `<p class="card-eyebrow">Hazır melodiler</p>${HAZIR.map(([id, n, s]) => row(id, n, s)).join('')}${last ? `<p class="muted small">Son seçimi ${K.esc(nameOf(last.who))} yaptı.</p>` : ''}`;
    const u = userRows();
    K.$('#kmBizim', root).innerHTML = `<p class="card-eyebrow">Bizim melodilerimiz</p>${u.length ? u.map(([id, n, s]) => row(id, n, s)).join('') : '<p class="muted">İkili Piyano\'da kaydettiğin ya da burada mırıldandığın melodiler burada çıkar.</p>'}`;
  }
  async function load() {
    if (!K.cloud || !K.cloud.enabled) return render();
    [secim, piyano, miril] = await Promise.all([K.cloud.list('kalemelodi', 50), K.cloud.list('melodi', 100), K.cloud.list('mirildan', 100)]);
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [secim, piyano, miril] = await Promise.all([K.cloud.list('kalemelodi', 50), K.cloud.list('melodi', 100), K.cloud.list('mirildan', 100)]);
    const c = current();
    if (c !== K.store.get('kaleMelodi', 'waltz')) {
      K.store.set('kaleMelodi', c);
      K.audio.music.restart();
    }
    K.cloud.on('kalemelodi', (r) => {
      if (secim.some((x) => x.id === r.id)) return;
      secim.push(r);
      K.store.set('kaleMelodi', r.data.id);
      K.audio.music.restart();
      if (r.who !== (K.isOwner() ? 'me' : 'her')) K.fx.toast(`🎵 ${K.esc(nameOf(r.who))} kalenin melodisini değiştirdi.`, { duration: 3000 });
      render();
    });
    K.cloud.on('mirildan', (r) => miril.some((x) => x.id === r.id) || (miril.push(r), render()));
    K.cloud.on('melodi', (r) => piyano.some((x) => x.id === r.id) || (piyano.push(r), render()));
  });
  K.room({
    id: 'kalemelodi',
    wing: 'kalp',
    title: 'Kalenin Melodisi',
    sub: 'Kalede hangi şarkı çalsın?',
    icon: 'music',
    color: '#FFE4EE',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kalede çalan müziği birlikte seçiyoruz. İstediğin bir aşk şarkısı varsa telefona mırıldan; kale sesinin perdesini dinleyip notalara çevirir ve o melodi kalenin melodisi olur.</p></div>
        <section class="card" id="kmHazir"></section>
        <section class="card km-mirildan"><p class="card-eyebrow">Mırıldan</p><p>Sessiz bir yerde, "na na na" diye ya da ıslıkla, en fazla 20 saniye. Ne kadar net olursa notalar o kadar doğru çıkar.</p>
          <div class="km-canli" id="kmCanli"></div><div class="row center"><button type="button" class="btn red" data-km-kayit>🎙 Mırıldan</button></div><div id="kmSonuc"></div></section>
        <section class="card" id="kmBizim"></section>`;
      el.addEventListener('click', async (e) => {
        const d = e.target.closest('[data-km-dinle]');
        if (d) return listen(d.dataset.kmDinle, d);
        const s = e.target.closest('[data-km-sec]');
        if (s) return choose(s.dataset.kmSec);
        const kb = e.target.closest('[data-km-kayit]');
        if (kb) return rec ? finish(kb, rec.frames) : startRec(kb);
        const box = K.$('#kmSonuc', root);
        if (e.target.closest('[data-km-taslak]') && box._notes) {
          stopPreview();
          K.audio.melodies.u_taslak = fromNotes(box._notes);
          preview = K.audio.play('u_taslak', { onEnd: stopPreview });
          return;
        }
        if (e.target.closest('[data-km-kaydet]') && box._notes) {
          const name = (K.$('#kmAd', root).value || '').trim().slice(0, 40) || `Mırıldanış ${miril.length + 1}`;
          const r = K.cloud && K.cloud.enabled ? await K.cloud.add('mirildan', { name, notes: box._notes.slice(0, 160) }) : null;
          if (!r) return K.fx.toast('Kaydetmek için ortak kalenin buluta bağlı olması gerekiyor.');
          miril.some((x) => x.id === r.id) || miril.push(r);
          box.innerHTML = '';
          K.stickers.award('mirildan');
          K.ping(`🎵 ${K.meName()} sana bir şarkı mırıldandı`, `"${name}". Kalenin Melodisi'nde dinle.`, ['notes'], { click: K.roomUrl('kalemelodi') });
          render();
        }
      });
    },
    enter() {
      render();
      load();
    },
    leave() {
      stopPreview();
      if (rec) rec.stop(), (rec = null);
    },
  });
  K.kalemelodi = { current, fromNotes, segment, pitch, HAZIR };
})();
