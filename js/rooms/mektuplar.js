/* Oda: Açılınca Oku — zarflar; bazıları sadece belli günlerde, gece ya da yağmurda açılıyor */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  let rainNow = null; // null: bilinmiyor, true/false
  let wx = null; // Bakü'nün anlık havası
  const LV = { sinav: 'sinav', dogumgunu: 'dogum-gunu', yildonumu: 'yildonumu', tanisma: 'tanisma', ozledim: 'ozledim', uzgun: 'uzgun', uykusuz: 'uykusuz' };

  const read = () => K.store.get('lettersRead', {});

  function lockState(l) {
    if (!l.lock) return null;
    if (l.lock.date) {
      const d = T.daysUntil(l.lock.date);
      if (d <= 0) return null;
      return { text: `${T.fmtShort(l.lock.date)}'da açılır`, sub: d === 1 ? 'Yarın!' : `${K.num(d)} gün kaldı` };
    }
    if (l.lock.night) {
      const h = T.baku().h;
      if (h < 5) return null;
      return { text: 'Sadece gece açılır', sub: `00:00–05:00 arası (${C.herCity} saati)` };
    }
    if (l.lock.wind) {
      if (wx && wx.wind >= l.lock.wind) return null;
      return { text: `${C.herCity}'de Xəzri esince açılır`, sub: wx ? `Şu an rüzgâr ${wx.wind} km/sa; ${l.lock.wind} km/sa ve üstü lazım` : 'Hava durumuna bakılıyor' };
    }
    if (l.lock.snow) {
      const snowing = wx && ((wx.code >= 71 && wx.code <= 77) || wx.code === 85 || wx.code === 86);
      if (snowing) return null;
      return { text: `${C.herCity}'ye kar yağınca açılır`, sub: wx ? 'Şu an kar yağmıyor' : 'Hava durumuna bakılıyor' };
    }
    if (l.lock.fullmoon) {
      const m = A.moonPhase(T.now());
      if (m.illum > 0.97) return null;
      const syn = 29.530588853;
      const days = Math.round(((0.5 - m.p + 1) % 1) * syn);
      return { text: 'Dolunay gecesi açılır', sub: days <= 1 ? 'Yarın dolunay!' : `Dolunaya yaklaşık ${days} gün` };
    }
    if (l.lock.rain) {
      if (rainNow === true || K.store.get('rainPromise') === T.todayKey()) return null;
      return { text: `${C.herCity}'de yağmur yağınca açılır`, sub: rainNow === false ? 'Şu an yağmıyor' : 'Hava durumuna bakılıyor', rain: true };
    }
    return null;
  }

  function render() {
    const r = read();
    // Buluttan gelen canlı mektuplar en önde, en yenisi ilk
    const list = D.letters.filter((l) => l.live).reverse().concat(D.letters.filter((l) => !l.live));
    K.$('#envGrid', root).innerHTML = list
      .map((l) => {
        const lk = lockState(l);
        const fresh = (K.newLetters || []).includes(l.id);
        return `<button class="env ${lk ? 'locked' : ''} ${r[l.id] ? 'is-read' : ''} ${fresh ? 'is-fresh' : ''}" data-id="${l.id}" style="--env:${l.color}">
          ${fresh ? '<span class="env-fresh">Yeni geldi</span>' : ''}
          <span class="env-body"></span><span class="env-flap"></span>
          <span class="env-seal">${A.bow(lk ? '#B58BA1' : '#E3174D')}</span>
          <span class="env-title">${K.esc(l.title)}</span>
          ${lk ? `<span class="env-lock">${A.ui('lock')}<span><b>${K.esc(lk.text)}</b>${K.esc(lk.sub)}</span></span>` : ''}
          ${r[l.id] ? `<span class="env-read">Okundu</span>` : ''}
        </button>`;
      })
      .join('');
    const n = Object.keys(r).length;
    K.$('#envCount', root).textContent = `${n} / ${D.letters.length} mektup okundu`;
  }

  function open(id) {
    const l = D.letters.find((x) => x.id === id);
    if (!l) return;
    const lk = lockState(l);
    if (lk) {
      const b = K.$(`.env[data-id="${id}"]`, root);
      if (b) {
        b.classList.remove('nope');
        void b.offsetWidth;
        b.classList.add('nope');
      }
      K.audio.sfx.fail();
      if (lk.rain && rainNow !== true) return rainAsk(l);
      K.fx.toast(`<b>Bu mektup kilitli.</b> ${K.esc(lk.text)} · ${K.esc(lk.sub)}`, { icon: A.icon('letter') });
      return;
    }
    const r = read();
    const first = !r[id];
    if (first) {
      r[id] = T.todayKey();
      K.store.set('lettersRead', r);
      if (Object.keys(r).length >= 5) K.stickers.award('mektup');
      K.notify(`${C.herName} mektubunu okudu`, `"${l.title}" zarfı açıldı.`, ['envelope_with_arrow']);
    }
    K.audio.sfx.paper();
    const m = K.ui.modal({
      cls: 'letter-modal',
      label: l.title,
      html: `<div class="la">
        <div class="la-env" style="--env:${l.color}"><span class="la-flap"></span><span class="la-seal">${A.bow()}</span></div>
        <article class="la-paper">
          <p class="la-kicker">${K.esc(l.title)}</p>
          <div class="la-text">${K.paras(l.body)}</div>
          <p class="la-sign">— ${K.esc(l.sign || C.myName)}</p>
          ${LV[l.id] && K.voice ? `<div class="la-voice">${K.voice.btn(LV[l.id], 'Bu mektubun bir de sesli hâli var')}</div>` : ''}
          <p class="la-date">${first ? 'İlk kez açıldı: bugün' : 'İlk açılış: ' + T.fmt(r[id])}</p>
        </article>
      </div>`,
      onClose: render,
    });
    setTimeout(() => m.el.classList.add('opened'), 60);
    if (first) setTimeout(() => K.fx.rain({ count: 24, duration: 1400 }), 700);
  }

  function rainAsk(l) {
    const m = K.ui.modal({
      label: l.title,
      html: `<h3>${K.esc(l.title)}</h3>
        <p style="margin-top:10px">Bu mektup ${C.herCity}'de yağmur yağarken açılıyor. ${rainNow === false ? 'Hava durumuna göre şu an yağmıyor.' : 'Hava durumuna şu an ulaşılamadı.'}</p>
        <p style="margin-top:8px">Pencereden bak: Gerçekten yağmur yağıyorsa Kitty sana güvenir.</p>
        <div class="actions"><button class="btn" data-yes>${A.ui('check')} Söz, şu an yağıyor</button><button class="btn ghost" data-close>Yağmuru bekleyeceğim</button></div>`,
    });
    m.el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-yes]')) return;
      K.store.set('rainPromise', T.todayKey());
      m.close();
      render();
      setTimeout(() => open(l.id), 350);
    });
  }

  function reply() {
    const ta = K.$('#replyText', root);
    ta.value = K.store.get('replyDraft', '');
    ta.addEventListener('input', () => K.store.set('replyDraft', ta.value));
    K.$('#replySend', root).addEventListener('click', async () => {
      const text = ta.value.trim();
      if (!text) {
        K.fx.toast('Önce birkaç satır yaz.');
        return ta.focus();
      }
      const full = `${K.ek(C.myName, 'e')}, ${C.herName}'den bir mektup:\n\n${text}`;
      let sentNtfy = false;
      if (K.canNotify()) sentNtfy = await K.notify(`${C.herName}'den mektup var`, text.slice(0, 3000), ['love_letter']);
      const r = sentNtfy ? 'ntfy' : await K.share({ title: 'Sana bir mektup', text: full });
      const msg = {
        ntfy: `Mektubun ${K.ek(C.myName, 'in')} telefonuna ulaştı.`,
        shared: 'Mektubun gönderilmeye hazır.',
        copied: `Mektubun panoya kopyalandı. Şimdi ${K.ek(C.myName, 'e')} mesaj olarak yapıştır.`,
        cancelled: 'Gönderme iptal edildi. Taslağın duruyor.',
        failed: 'Bu cihaz paylaşamıyor. Metni seçip kopyalayarak gönderebilirsin.',
      }[r];
      K.fx.toast(msg, { icon: A.icon('letter') });
      if (r === 'ntfy' || r === 'shared') {
        const sent = K.store.get('repliesSent', []);
        sent.unshift({ date: T.todayKey(), text });
        K.store.set('repliesSent', sent.slice(0, 20));
      }
    });
  }

  // Oda açıkken canlı mektup gelirse hemen zarflara eklensin
  K.on('cloud', (on) => on && K.cloud.on('letter', () => setTimeout(() => K.activeRoom === 'mektuplar' && render(), 0)));

  K.room({
    id: 'mektuplar',
    wing: 'kalp',
    title: 'Açılınca Oku',
    sub: 'Sana yazdığım mektuplar',
    icon: 'letter',
    color: '#FFD6E5',
    badge: () => `${Object.keys(read()).length}/${D.letters.length}`,
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Her zarfın üstünde ne zaman açılacağı yazıyor. İstediğin zaman açabileceklerin var; bazıları ise sadece özel bir günde, gece yarısından sonra ya da ${C.herCity}'de yağmur yağarken açılıyor.</p>
        <p class="env-count" id="envCount"></p>
        <div class="env-grid" id="envGrid"></div>
        <div class="card reply">
          <p class="card-eyebrow">Sen de bana yaz</p>
          <h3 class="sub-h" style="margin:0 0 8px">${K.esc(K.ek(C.myName, 'e'))} mektup</h3>
          <textarea class="textarea hand-area" id="replyText" name="replyText" placeholder="Sevgili ${K.esc(C.myName)}..."></textarea>
          <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
            <button class="btn" id="replySend">${A.ui('send')} Gönder</button>
            <p class="muted small" style="align-self:center">Taslağın otomatik kaydedilir.</p>
          </div>
        </div>`;
      K.$('#envGrid', el).addEventListener('click', (e) => {
        const b = e.target.closest('.env');
        if (b) open(b.dataset.id);
      });
      reply();
      render();
      K.weather &&
        K.weather().then((w) => {
          if (!w) return;
          const code = w.baku.code;
          rainNow = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
          wx = w.baku;
          render();
        });
    },
    enter() {
      render();
      if ((K.newLetters || []).length) setTimeout(() => K.markLettersKnown && K.markLettersKnown(), 4000);
      if (K.pendingLetter) {
        const id = K.pendingLetter;
        K.pendingLetter = null;
        setTimeout(() => open(id), 450);
      }
    },
  });
})();
