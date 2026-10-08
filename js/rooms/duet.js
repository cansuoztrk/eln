/* Oda: İki Sesli Şarkı — aynı şarkıyı ikiniz ayrı ayrı söylersiniz; kale iki kaydı aynı tempoya hizalayıp düet yapar.
   Kayıt sırasında kulaklıktan kılavuz melodi çalar (önce dört tık sayar), böylece iki kayıt aynı tempoda başlar.
   Kale her kaydın melodinin başladığı anı saklar, dinlerken iki kaydın ses zarflarını karşılaştırıp kalan kaymayı
   (±250 ms) bulur; iki sesi sola ve sağa yerleştirip birlikte çalar. Şarkılar anonim, telifsiz halk ezgileri.
   Kayıt: duet {sarki, audio, dur, bas (melodinin kayıttaki başlangıcı, sn)} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const SARKI = [
    ['uskudar', 'Üsküdar\'a Gider İken', 'İstanbul türküsü · 4/4'],
    ['sarigelin', 'Sarı Gelin', 'İki kıyının ortak türküsü · 10/8'],
    ['birthday', 'İyi ki Doğdun', 'Doğum günü için'],
    ['waltz', 'Kale Valsi', 'Kalenin kendi melodisi'],
  ];
  let rows = [], root = null, kayit = null, calan = null;

  const son = (s, w) => rows.filter((r) => r.data.sarki === s && r.who === w).sort((a, b) => b.at - a.at)[0];

  /* ---------- Kayıt ---------- */
  async function kaydet(sarki, btn) {
    if (kayit) return kayit.bitir();
    const ctx = K.audio.ensure() && K.audio.ctx;
    if (!ctx || !window.MediaRecorder) return K.fx.toast('Bu cihaz ses kaydını desteklemiyor.');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true } });
    } catch (e) {
      return K.fx.toast('Mikrofon izni verilmedi.');
    }
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((x) => MediaRecorder.isTypeSupported(x)) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : {});
    const parca = [];
    rec.ondataavailable = (e) => e.data.size && parca.push(e.data);
    let recBas = 0;
    const perf = (t) => {
      const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
      return ts && ts.performanceTime ? ts.performanceTime + (t - ts.contextTime) * 1000 : performance.now() + (t - ctx.currentTime) * 1000;
    };
    await new Promise((res) => {
      rec.onstart = () => ((recBas = performance.now()), res());
      rec.start();
    });
    const spb = 60 / ((K.audio.melodies[sarki] || {}).bpm || 120);
    const tik = Math.max(0.35, spb * 2);
    const t0 = ctx.currentTime + 0.3;
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = i ? 880 : 1320;
      g.gain.setValueAtTime(0.0001, t0 + i * tik);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + i * tik + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * tik + 0.08);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + i * tik);
      o.stop(t0 + i * tik + 0.1);
    }
    const melBas = t0 + 4 * tik;
    let h = null;
    const gecikme = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
    const bas = (perf(melBas + 0.08) - recBas) / 1000 + gecikme;
    const zam = setTimeout(() => (h = K.audio.play(sarki, { vol: 0.9, onEnd: () => kayit && kayit.bitir() })), Math.max(0, (melBas - ctx.currentTime) * 1000));
    const t1 = Date.now();
    const sayac = setInterval(() => (btn.textContent = `⏹ Bitir (${Math.round((Date.now() - t1) / 1000)} sn)`), 300);
    const bitti = new Promise((res) => (rec.onstop = res));
    kayit = {
      bitir() {
        clearTimeout(zam);
        clearInterval(sayac);
        h && h.stop();
        rec.state === 'recording' && rec.stop();
      },
    };
    setTimeout(() => kayit && kayit.bitir(), 150000);
    await bitti;
    kayit = null;
    stream.getTracks().forEach((t) => t.stop());
    btn.textContent = '…';
    const blob = new Blob(parca, { type: rec.mimeType || mime || 'audio/webm' });
    const au = await K.mikrofon.upload(blob);
    if (!au) return K.fx.toast('Kayıt gönderilemedi; biraz daha kısa dene.'), ciz();
    const r = await K.cloud.add('duet', { sarki, audio: au.id, dur: Math.round((Date.now() - t1) / 100) / 10, bas: Math.max(0, Math.round(bas * 1000) / 1000) });
    if (r) {
      rows.push(r);
      K.stickers.award('duet');
      if (son(sarki, other())) K.ping(`🎶 ${K.meName()} düetinize sesini ekledi`, `${SARKI.find((s) => s[0] === sarki)[1]} artık iki sesli.`, ['notes'], { click: K.roomUrl('duet') });
      else K.ping(`🎶 ${K.meName()} bir şarkı söyledi, ikinci ses bekliyor`, 'Sen de söyleyince kale ikisini düet yapacak.', ['notes'], { click: K.roomUrl('duet') });
    }
    ciz();
  }

  /* ---------- Hizalama ve düet ---------- */
  async function coz(ctx, audio) {
    const url = await K.medya.rowUrl(audio, 'b64');
    const buf = await (await fetch(url)).arrayBuffer();
    return new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej));
  }
  function zarf(b, bas) {
    const d = b.getChannelData(0), adim = Math.round(b.sampleRate / 100), ilk = Math.round(bas * b.sampleRate);
    const n = Math.min(2000, Math.floor((d.length - ilk) / adim));
    const z = new Float32Array(Math.max(0, n));
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < adim; j++) s += d[ilk + i * adim + j] ** 2;
      z[i] = Math.sqrt(s / adim);
    }
    const ort = z.reduce((a, v) => a + v, 0) / (z.length || 1);
    return z.map((v) => v - ort);
  }
  function kayma(a, b) {
    let en = 0, eniyi = -Infinity;
    for (let L = -25; L <= 25; L++) {
      let s = 0;
      for (let i = 0; i < a.length; i++) {
        const j = i + L;
        if (j >= 0 && j < b.length) s += a[i] * b[j];
      }
      if (s > eniyi) (eniyi = s), (en = L);
    }
    return en / 100;
  }
  async function dinle(sarki) {
    sus();
    const ctx = K.audio.ensure() && K.audio.ctx;
    const a = son(sarki, 'me'), b = son(sarki, 'her');
    if (!ctx || !a || !b) return;
    K.fx.toast('🎶 İki ses hizalanıyor…', { duration: 1500 });
    const [ba, bb] = await Promise.all([coz(ctx, a.data.audio), coz(ctx, b.data.audio)]);
    const fark = kayma(zarf(ba, a.data.bas || 0), zarf(bb, b.data.bas || 0));
    const t = ctx.currentTime + 0.2;
    const oyna = (buf, bas, pan) => {
      const s = ctx.createBufferSource(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(), g = ctx.createGain();
      s.buffer = buf;
      if (p.pan) p.pan.value = pan;
      g.gain.value = 0.95;
      s.connect(g).connect(p).connect(ctx.destination);
      s.start(t, Math.max(0, bas));
      return s;
    };
    const s1 = oyna(ba, a.data.bas || 0, -0.4), s2 = oyna(bb, (b.data.bas || 0) + fark, 0.4);
    calan = { stop: () => [s1, s2].forEach((s) => { try { s.stop(); } catch (e) {} }) };
    s1.onended = () => (calan = null);
    K.stickers.award('duet2');
    ciz();
  }
  const sus = () => calan && (calan.stop(), (calan = null));
  async function tek(audio) {
    sus();
    K.medya.cal(audio);
  }
  function ciz() {
    if (!root || K.activeRoom !== 'duet') return;
    K.$('#dtListe', root).innerHTML = SARKI.map(([id, ad, alt]) => {
      const a = son(id, mine()), b = son(id, other());
      return `<article class="card dt-sarki ${a && b ? 'tam' : ''}"><div class="dt-bas"><span class="dt-ikon">${A.icon(a && b ? 'duet' : 'music')}</span><div><h3>${K.esc(ad)}</h3><small class="muted">${K.esc(alt)}</small></div></div>
        <div class="dt-sesler"><div class="dt-ses me">${a ? `<button class="chip" type="button" data-dt-tek="${a.data.audio}">▶ Sen</button>` : '<span class="muted small">Sen: henüz yok</span>'}<button class="btn small ${a ? 'ghost' : ''}" type="button" data-dt-kaydet="${id}">🎙️ ${a ? 'Yeniden söyle' : 'Söyle'}</button></div>
        <div class="dt-ses her">${b ? `<button class="chip" type="button" data-dt-tek="${b.data.audio}">▶ ${K.esc(nameOf(other()))}</button>` : `<span class="muted small">${K.esc(nameOf(other()))}: henüz yok</span>`}</div></div>
        ${a && b ? `<button class="btn dt-dinle" type="button" data-dt-dinle="${id}">🎶 Düeti dinle</button>` : `<p class="muted small">${a ? `${K.esc(nameOf(other()))} da söyleyince düet açılır.` : 'Kulaklık tak; dört tıktan sonra kılavuz melodi başlar, sen de onunla söyle.'}</p>`}</article>`;
    }).join('');
  }
  K.room({
    id: 'duet',
    wing: 'oyun',
    title: 'İki Sesli Şarkı',
    sub: 'Ayrı ayrı söyleriz, kale düet yapar',
    icon: 'duet',
    color: '#FFE3EC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Aynı şarkıyı ikiniz ayrı ayrı söylersiniz; kale iki kaydı aynı tempoya hizalayıp düet yapar. Sesin solda, onunki sağda: kulaklıkla dinleyince yan yana söylüyor gibisiniz.</p></div><div class="dt-liste" id="dtListe"></div>`;
      el.addEventListener('click', (e) => {
        const k = e.target.closest('[data-dt-kaydet]');
        if (k) return kaydet(k.dataset.dtKaydet, k);
        const d = e.target.closest('[data-dt-dinle]');
        if (d) return calan ? (sus(), ciz()) : dinle(d.dataset.dtDinle);
        const t = e.target.closest('[data-dt-tek]');
        if (t) tek(t.dataset.dtTek);
      });
    },
    async enter() {
      rows = await K.cloud.list('duet', 200);
      ciz();
    },
    leave() {
      sus();
      kayit && kayit.bitir();
    },
  });
  K.on('cloud', (ok) => ok && K.cloud.on('duet', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), ciz())));
  K.duet = { kayma, zarf };
})();
