/* Oda: Kale Telsizi — O telefonundan yazar, mesaj kalede anında belirir (ntfy üzerinden canlı kanal).
   Eln de buradan kalp, sarılma, öpücük, yazılı ya da sesli mesaj gönderir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, es = null, pop = null, popT = null;
  const inbox = () => K.store.get('liveInbox', []);
  const unread = () => inbox().filter((m) => m.dir === 'in' && !m.seen).length;
  const liveUrl = () => `https://ntfy.sh/${encodeURIComponent(C.liveTopic)}`;
  const QUICK = [
    ['heart', 'Kalp gönder', '♥ ♥ ♥', ['heart']],
    ['hug', 'Sarıl', 'Sana sımsıkı sarıldım. Bırakmıyorum.', ['hugging_face']],
    ['kiss', 'Öp', 'Bir öpücük yolladım. Yanağına kondu mu?', ['kiss']],
    ['think', 'Seni düşünüyorum', 'Şu an seni düşünüyorum.', ['thought_balloon']],
    ['call', 'Beni ara', 'Müsaitsen beni arar mısın? Sesini duymak istiyorum.', ['telephone_receiver']],
    ['sun', 'Günaydın', 'Günaydın sevgilim!', ['sunny']],
    ['moon', 'İyi geceler', 'İyi geceler. Rüyanda görüşürüz.', ['crescent_moon']],
  ];

  function effectOf(text) {
    const n = K.norm(text);
    if (/♥|❤|💗|💕/.test(text) || n.includes('kalp')) return 'heart';
    if (n.includes('saril')) return 'hug';
    if (/\bop\b|opucuk|opuyorum/.test(n)) return 'kiss';
    if (n.includes('gunaydin') || n.includes('sabahin')) return 'sun';
    if (n.includes('iyi gece') || n.includes('gecen xeyre')) return 'moon';
    if (n.includes('seviyorum') || n.includes('sevirem') || n.includes('love')) return 'love';
    return 'msg';
  }
  function play(effect) {
    K.audio.sfx.chime();
    if (effect === 'heart' || effect === 'love') K.fx.rain({ count: effect === 'love' ? 80 : 50 });
    else if (effect === 'hug') {
      K.vibrate([220, 120, 220, 120, 700]);
      K.fx.confetti({ count: 60, shapes: ['heart'], colors: ['#FF6FA3', '#E3174D', '#FFB3CE'] });
    } else if (effect === 'kiss') K.fx.burst(window.innerWidth / 2, window.innerHeight / 2, { count: 26, power: 8, shapes: ['heart'] });
    else if (effect === 'sun') K.fx.confetti({ count: 50, shapes: ['star', 'spark'], colors: ['#FFD34E', '#FFB547', '#FFFFFF'] });
    else if (effect === 'moon') K.fx.rain({ count: 40, shapes: ['star'], colors: ['#FFF4C7', '#C9B6FF', '#FFFFFF'] });
  }

  function showPop(m) {
    if (!pop) {
      pop = K.el(`<div class="tz-pop" role="status" aria-live="polite"><span class="tz-pop-kit">${A.kitty({ bow: '#4FA3E3', eyes: 'happy' })}</span><div class="tz-pop-tx"><p class="tz-pop-from"></p><p class="tz-pop-msg"></p></div><button class="tz-pop-x" aria-label="Kapat">${A.ui('close')}</button></div>`);
      document.body.appendChild(pop);
      K.$('.tz-pop-x', pop).addEventListener('click', () => pop.classList.remove('in'));
      pop.addEventListener('click', (e) => {
        if (e.target.closest('.tz-pop-x')) return;
        pop.classList.remove('in');
        K.go('telsiz');
      });
    }
    K.$('.tz-pop-from', pop).textContent = `${K.otherName()} · telsiz · ${T.hm(C.tzBaku)}`;
    K.$('.tz-pop-msg', pop).textContent = m.title ? `${m.title}: ${m.text}` : m.text;
    pop.classList.remove('in');
    void pop.offsetWidth;
    pop.classList.add('in');
    clearTimeout(popT);
    popT = setTimeout(() => pop && pop.classList.remove('in'), 9000);
  }

  function receive(m, live) {
    const list = inbox();
    if (list.some((x) => x.id === m.id)) return false;
    const item = { id: m.id, t: (m.time || Date.now() / 1000) * 1000, dir: 'in', text: String(m.message || '').slice(0, 600), title: m.title || '', seen: K.activeRoom === 'telsiz' };
    list.unshift(item);
    K.store.set('liveInbox', list.slice(0, 80));
    K.store.set('liveLast', m.id);
    if (live) {
      showPop(item);
      play(effectOf(item.title + ' ' + item.text));
    }
    if (K.activeRoom === 'telsiz') renderChat();
    K.emit('live', item);
    return true;
  }

  async function poll() {
    try {
      const since = K.store.get('liveLast') || '12h';
      const res = await fetch(`${liveUrl()}/json?poll=1&since=${encodeURIComponent(since)}`);
      if (!res.ok) return;
      const lines = (await res.text()).split('\n').filter(Boolean);
      let n = 0, last = null;
      for (const l of lines) {
        const m = JSON.parse(l);
        if (m.event === 'message' && receive(m, false)) {
          n++;
          last = m;
        }
      }
      if (n) {
        showPop({ text: n > 1 ? `Sen yokken ${n} telsiz mesajı geldi. En sonuncusu: "${last.message}"` : last.message, title: '' });
        play(effectOf(last.message || ''));
      }
    } catch (e) {}
  }
  function listen() {
    if (es || !window.EventSource) return;
    try {
      es = new EventSource(`${liveUrl()}/sse`);
      es.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.event === 'message') receive(m, true);
        } catch (err) {}
      };
      es.onopen = () => status(true);
      es.onerror = () => status(false);
    } catch (e) {}
  }
  function stop() {
    if (es) es.close();
    es = null;
    status(false);
  }
  function status(on) {
    const s = root && K.$('#tzStatus', root);
    if (!s) return;
    on = on || Boolean(K.cloud && K.cloud.enabled);
    s.classList.toggle('on', on);
    s.textContent = on ? 'Kanal açık' : 'Kanal bekleniyor';
  }
  function presence() {
    if (!K.store.get('presence', true)) return;
    if (!K.store.get('presenceInfo')) {
      K.store.set('presenceInfo', true);
      setTimeout(() => K.fx.toast(`<b>Telsiz açık:</b> Kaleye geldiğinde ${K.esc(C.myPet)}'a haber gider. Kapatmak için Telsiz odası.`, { icon: A.icon('radio'), duration: 6000, log: false }), 7000);
    }
    const last = K.store.get('presenceAt', 0);
    if (Date.now() - last < 3 * 3600e3) return;
    K.store.set('presenceAt', Date.now());
    K.notify(`${C.herName} şu an kalede`, 'Telsizden bir mesaj gönder; ekranında anında belirir. (Bu bildirime dokun.)', ['castle'], { click: liveUrl(), priority: 3 });
  }

  // Bulut varsa telsiz iki yönlü ve kalıcı: kayıtlar ikisinde de görünür
  K.on('cloud', async (on) => {
    if (!on) return;
    const mineW = K.isOwner() ? 'me' : 'her';
    const rows = await K.cloud.list('live', 80);
    const list = inbox();
    rows.forEach((r) => {
      const id = 'c' + r.id;
      if (!list.some((x) => x.id === id)) list.push({ id, t: r.at, dir: r.who === mineW ? 'out' : 'in', text: r.data.text, seen: true });
    });
    list.sort((a, b) => b.t - a.t);
    K.store.set('liveInbox', list.slice(0, 80));
    K.cloud.on('live', (r) => {
      if (r.who === mineW) return;
      receive({ id: 'c' + r.id, time: r.at / 1000, message: r.data.text }, true);
    });
  });

  K.on('built', () => {
    if (!C.liveTopic || K.previewDate || K.isOwner()) return;
    poll();
    listen();
    presence();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else {
        poll();
        listen();
      }
    });
  });

  /* ---------------- Oda ---------------- */
  async function send(text, tags, effect) {
    let ok = false;
    let id = 'o' + Date.now();
    if (K.cloud.enabled) {
      const r = await K.cloud.add('live', { text });
      if (r) {
        ok = true;
        id = 'c' + r.id;
      }
    }
    const pushed = await K.ping(`Telsiz · ${K.meName()}`, text, tags, { click: K.isOwner() ? K.roomUrl('telsiz') : liveUrl() });
    ok = ok || pushed;
    const list = inbox();
    list.unshift({ id, t: Date.now(), dir: 'out', text, ok });
    K.store.set('liveInbox', list.slice(0, 80));
    K.stickers.award('telsiz');
    play(effect || effectOf(text));
    renderChat();
    if (!ok) K.fx.toast('Mesaj şu an gönderilemedi (internet?). Kalede kaydedildi.', { icon: A.icon('radio') });
  }
  function renderChat() {
    if (!root) return;
    const list = inbox();
    K.$('#tzChat', root).innerHTML = list.length
      ? list
          .slice(0, 40)
          .map((m) => {
            const p = T.baku(new Date(m.t));
            return `<li class="tz-m ${m.dir}"><p>${K.esc(m.title ? m.title + ': ' : '')}${K.esc(m.text)}</p><span>${m.dir === 'in' ? K.esc(K.otherName()) : 'Sen'} · ${p.d} ${K.MONTHS[p.mo - 1].slice(0, 3)} ${K.pad(p.h)}:${K.pad(p.mi)}${m.dir === 'out' && m.ok === false ? ' · gönderilemedi' : ''}</span></li>`;
          })
          .join('')
      : `<li class="tz-empty">Henüz telsiz sessiz. ${K.esc(K.otherName())} bir mesaj yolladığında burada, ekranının köşesinde anında belirecek.</li>`;
    const changed = list.some((m) => m.dir === 'in' && !m.seen);
    if (changed && K.activeRoom === 'telsiz') {
      list.forEach((m) => (m.seen = true));
      K.store.set('liveInbox', list);
    }
  }

  /* Sesli not: kaydet, dinle, paylaş */
  function recorder() {
    const box = K.$('#tzRec', root);
    let rec = null, chunks = [], stream = null, timer = null, started = 0, blob = null;
    const btn = K.$('#tzRecBtn', box);
    const out = K.$('#tzRecOut', box);
    const tm = K.$('#tzRecTime', box);
    const stopRec = () => {
      if (rec && rec.state !== 'inactive') rec.stop();
      clearInterval(timer);
    };
    btn.addEventListener('click', async () => {
      if (rec && rec.state === 'recording') return stopRec();
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        out.innerHTML = '<p class="muted small">Bu cihaz ses kaydını desteklemiyor. Telefonunun kendi sesli mesajını kullanabilirsin.</p>';
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        out.innerHTML = '<p class="muted small">Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.</p>';
        return;
      }
      chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        box.classList.remove('rec');
        btn.innerHTML = `${A.ui('mic')} Yeniden kaydet`;
        out.innerHTML = `<audio controls src="${url}"></audio><div class="actions"><button class="btn small" id="tzRecSend">${A.ui('send')} ${K.esc(K.otherName())}'a gönder</button></div>`;
        K.$('#tzRecSend', out).addEventListener('click', async () => {
          const ext = (blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm');
          const file = new File([blob], `${K.norm(C.herPet).replace(/ /g, '')}-sesli-not.${ext}`, { type: blob.type });
          const r = await K.share({ title: `${C.herName}'den sesli not`, text: 'Sana sesli bir not bıraktım ♥', file });
          if (r === 'shared') {
            K.notify(`${C.herName} sana sesli not gönderdi`, 'Mesajlarına bak ♥', ['microphone']);
            K.fx.toast('Sesli notun yola çıktı.', { icon: A.icon('mic') });
          } else if (r !== 'cancelled') {
            K.download(url, file.name);
            K.fx.toast('Bu cihaz doğrudan paylaşamadı; ses dosyası indirildi. Mesaj olarak gönderebilirsin.', { icon: A.icon('mic'), duration: 6000 });
          }
        });
      };
      rec.start();
      started = Date.now();
      box.classList.add('rec');
      btn.innerHTML = `${A.ui('pause')} Kaydı bitir`;
      out.innerHTML = '';
      timer = setInterval(() => {
        const s = Math.floor((Date.now() - started) / 1000);
        tm.textContent = `0:${K.pad(s)}`;
        if (s >= 60) stopRec();
      }, 250);
    });
  }

  K.room({
    id: 'telsiz',
    wing: 'kalp',
    title: 'Kale Telsizi',
    sub: () => (C.liveTopic || (K.cloud && K.cloud.enabled) ? `${K.otherName()} ile canlı kanal` : 'Canlı kanal'),
    icon: 'radio',
    color: '#FFD6E5',
    badge: () => (unread() ? `${unread()} yeni` : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="tz">
          <div class="tz-radio">
            <div class="tz-device">
              <span class="tz-ant"><i></i></span>
              <div class="tz-screen"><span class="tz-status" id="tzStatus">Kanal bekleniyor</span><b>${K.esc(C.herPet)} ↔ ${K.esc(C.myPet)}</b></div>
              <div class="tz-grill" aria-hidden="true">${'<i></i>'.repeat(12)}</div>
            </div>
            <p class="room-intro">Bu telsiz iki telefonu birbirine bağlıyor. ${K.esc(K.otherName())} bir şey yazdığında ekranında anında belirir; "kalp", "sarıl", "öp", "günaydın" gibi kelimeler kalenin havasını da değiştirir. Sen de aşağıdan ona dokunuşlar yolla.</p>
          </div>
          <div class="tz-quick">${QUICK.map(([id, label]) => `<button class="tz-q" data-q="${id}">${label}</button>`).join('')}</div>
          <form class="row tz-form" id="tzForm" autocomplete="off"><input class="input" id="tzText" name="tzText" maxlength="300" placeholder="Telsizden bir şey yaz..."><button class="btn" type="submit">${A.ui('send')} Gönder</button></form>
          <ol class="tz-chat" id="tzChat"></ol>
          <section class="card tz-rec" id="tzRec">
            <p class="card-eyebrow">${K.esc(K.otherName())}'a sesli not</p>
            <div class="row"><button class="btn red" id="tzRecBtn" type="button">${A.ui('mic')} Kaydet</button><span class="tz-rec-dot"></span><span class="tnum" id="tzRecTime">0:00</span></div>
            <div id="tzRecOut"></div>
          </section>
          ${K.isOwner() ? '' : `<label class="tz-presence"><input type="checkbox" id="tzPresence" ${K.store.get('presence', true) ? 'checked' : ''}> Kaleye geldiğimde ${K.esc(C.myPet)}'a haber ver</label>`}
        </div>`;
      K.$('.tz-quick', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-q]');
        if (!b) return;
        const q = QUICK.find((x) => x[0] === b.dataset.q);
        send(q[2], q[3], q[0] === 'think' || q[0] === 'call' ? 'msg' : q[0]);
      });
      K.$('#tzForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const t = K.$('#tzText', el).value.trim();
        if (!t) return;
        K.$('#tzText', el).value = '';
        send(t, ['speech_balloon']);
      });
      const pr = K.$('#tzPresence', el);
      pr && pr.addEventListener('change', (e) => K.store.set('presence', e.target.checked));
      recorder();
      status(Boolean((es && es.readyState === 1) || (K.cloud && K.cloud.enabled)));
    },
    enter() {
      renderChat();
    },
  });
})();
