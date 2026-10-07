/* Kale 2.0 — İki Kez Yeni Yıl: 31 Aralık gecesi Bakü yeni yıla İstanbul'dan bir saat önce girer.
   Akşam ana salonda büyük bir kart ve iki geri sayımlı bir sahne: önce Bakü'nün gece yarısı (Eln'in gökyüzünde havai
   fişekler), Eln yeni yılı bir notla Ardoş'a "gönderir": Ardoş'un ekranına gelecekten (yeni yıldan) bir paket düşer.
   Bir saat sonra İstanbul'un gece yarısı; ikisi de "gece yarısı öpücüğü"ne basınca kalpler yağar. Her gece yarısında
   telefonlara bildirim (31 Aralık'ta kale açılınca kendiliğinden kurulur). Kayıtlar: yeniyil {y, t: 'paket'|'opucuk', msg} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], ov = null, tick = 0;
  // Gelecek yılın iki gece yarısı (ms)
  function mids() {
    const p = T.baku();
    const y = p.mo === 1 && p.d === 1 ? p.y : p.y + 1;
    return { y, baku: Date.UTC(y, 0, 1) - C.tzBaku * 36e5, ist: Date.UTC(y, 0, 1) - C.tzIstanbul * 36e5 };
  }
  const now = () => T.now().getTime();
  // Gece: 31 Aralık 18:00 (Bakü) – 1 Ocak 03:00 (Bakü)
  const active = () => {
    const m = mids(), t = now();
    return t > m.baku - 6 * 36e5 && t < m.baku + 3 * 36e5;
  };
  const of = (y, t, w) => rows.find((r) => r.data.y === y && r.data.t === t && (!w || r.who === w));
  const cd = (ms) => {
    if (ms <= 0) return '00:00:00';
    const s = T.split(ms);
    return `${K.pad(s.h + s.d * 24)}:${K.pad(s.m)}:${K.pad(s.s)}`;
  };
  function scene() {
    if (ov) return;
    const m = mids();
    ov = K.el(`<div class="yy-sahne" role="dialog" aria-modal="true" aria-label="İki Kez Yeni Yıl">
      <div class="yy-gok" aria-hidden="true">${Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 41) % 100}%;top:${(i * 29) % 70}%;--d:${(i % 7) * 0.4}s"></i>`).join('')}</div>
      <button type="button" class="yy-x icon-btn" aria-label="Kapat">${A.ui('close')}</button>
      <div class="yy-ic"><p class="yy-ust">İki Kez Yeni Yıl · ${m.y}</p>
        <div class="yy-saatler"><div class="yy-saat baku"><small>${K.esc(C.herCity)}</small><b id="yyB">--:--:--</b><i>${K.esc(C.herPet)}</i></div><div class="yy-saat ist"><small>${K.esc(C.myCity)}</small><b id="yyI">--:--:--</b><i>${K.esc(C.myPet)}</i></div></div>
        <p class="yy-cumle hand" id="yyCumle"></p>
        <div class="yy-eylem" id="yyEylem"></div>
      </div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    K.$('.yy-x', ov).addEventListener('click', close);
    ov.addEventListener('click', onClick);
    paint(true);
    clearInterval(tick);
    tick = setInterval(paint, 1000);
  }
  function close() {
    if (!ov) return;
    clearInterval(tick);
    const o = ov;
    ov = null;
    o.classList.remove('in');
    setTimeout(() => o.remove(), 400);
    K.renderSpecials && K.renderSpecials();
  }
  let lastPhase = '';
  function paint(first) {
    if (!ov) return;
    const m = mids(), t = now();
    K.$('#yyB', ov).textContent = t >= m.baku ? `${m.y} ✨` : cd(m.baku - t);
    K.$('#yyI', ov).textContent = t >= m.ist ? `${m.y} ✨` : cd(m.ist - t);
    K.$('.yy-saat.baku', ov).classList.toggle('girdi', t >= m.baku);
    K.$('.yy-saat.ist', ov).classList.toggle('girdi', t >= m.ist);
    const phase = t < m.baku ? 'once' : t < m.ist ? 'arada' : 'sonra';
    if (phase !== lastPhase || first) {
      if (!first && phase !== 'once') {
        K.fx.fireworks && K.fx.fireworks(6000);
        K.audio.sfx.success();
      }
      lastPhase = phase;
    }
    const paket = of(m.y, 'paket'), kissMe = of(m.y, 'opucuk', mine()), kissOther = of(m.y, 'opucuk', mine() === 'me' ? 'her' : 'me');
    let cumle = '', eylem = '';
    if (phase === 'once') {
      cumle = `Önce ${C.herCity} girecek yeni yıla. ${K.ek(C.herPet, 'in')} gökyüzü bir saat önce patlayacak.`;
    } else if (phase === 'arada') {
      cumle = `${C.herCity} ${m.y}'de! ${C.myCity} hâlâ eski yılda; bir saatliğine iki ayrı yıldasınız.`;
      if (mine() === 'her') eylem = paket ? `<p class="yy-ok">🎁 Yeni yılı ${K.esc(K.ek(C.myPet, 'e'))} gönderdin. Gece yarısında birlikte olacaksınız.</p>` : `<textarea class="input" id="yyMsg" maxlength="160" rows="2" placeholder="Yeni yıldan ona bir not..."></textarea><button type="button" class="btn red" data-yy="paket">🎁 Yeni yılı ${K.esc(K.ek(C.myPet, 'e'))} gönder</button>`;
      else eylem = paket ? `<button type="button" class="btn red yy-paket" data-yy="ac">🎁 ${m.y}'den bir paket geldi</button>` : `<p class="yy-bekle">${K.esc(C.herPet)} ${m.y}'de. Sana yeni yıldan bir paket gönderebilir...</p>`;
    } else {
      cumle = `İkiniz de ${m.y}'desiniz. Mutlu yıllar, ${C.herPet} ve ${C.myPet}.`;
      eylem = kissMe ? `<p class="yy-ok">💋 Gece yarısı öpücüğün gitti${kissOther ? '; onunki de geldi 💞' : '. Onunki bekleniyor...'}</p>` : `<button type="button" class="btn red" data-yy="opucuk">💋 Gece yarısı öpücüğü</button>`;
      if (mine() === 'me' && paket && !K.store.get('yyAcildi-' + m.y)) eylem = `<button type="button" class="btn soft yy-paket" data-yy="ac">🎁 ${m.y}'den gelen paketi aç</button>` + eylem;
    }
    K.$('#yyCumle', ov).textContent = cumle;
    const box = K.$('#yyEylem', ov);
    if (box.dataset.k !== eylem && !(document.activeElement && document.activeElement.id === 'yyMsg')) {
      box.innerHTML = eylem;
      box.dataset.k = eylem;
    }
  }
  async function onClick(e) {
    const b = e.target.closest('[data-yy]');
    if (!b) return;
    const m = mids();
    if (b.dataset.yy === 'paket') {
      const msg = ((K.$('#yyMsg', ov) || {}).value || '').trim().slice(0, 160);
      b.disabled = true;
      const r = await K.cloud.add('yeniyil', { y: m.y, t: 'paket', msg });
      if (!r) return (b.disabled = false), K.fx.toast('Gönderilemedi.');
      rows.some((x) => x.id === r.id) || rows.push(r);
      K.audio.sfx.whoosh();
      K.ping(`🎁 ${m.y}'den sana bir paket var`, `${K.meName()} yeni yıla senden bir saat önce girdi ve sana yeni yılı gönderdi.`, ['gift'], { click: K.roomUrl(''), priority: 5 });
      paint();
    } else if (b.dataset.yy === 'ac') {
      const p = of(m.y, 'paket');
      K.store.set('yyAcildi-' + m.y, 1);
      K.audio.sfx.chime();
      K.fx.confetti({ count: 160 });
      K.ui.modal({ label: 'Yeni yıldan paket', cls: 'yy-paket-modal', html: `<div class="yy-kutu" aria-hidden="true">🎁</div><p class="card-eyebrow">${m.y}'den, ${K.esc(K.ek(C.herPet, 'den'))}</p><h2>Yeni yıl burada çok güzel. Gel.</h2>${p && p.data.msg ? `<p class="hand yy-not">${K.esc(p.data.msg)}</p>` : ''}<p class="muted small">Bir saat sonra sen de burada olacaksın.</p>` });
      K.stickers.award('yeniyil');
      paint();
    } else if (b.dataset.yy === 'opucuk') {
      b.disabled = true;
      const r = await K.cloud.add('yeniyil', { y: m.y, t: 'opucuk' });
      if (r) rows.push(r);
      K.fx.rain({ count: 40, shapes: ['heart'], colors: ['#FF8FB8', '#E3174D', '#FFD6E5'] });
      K.audio.sfx.giggle ? K.audio.sfx.giggle() : K.audio.sfx.pop();
      K.ping(`💋 ${K.meName()}: gece yarısı öpücüğü`, `Mutlu yıllar. İkimiz de ${m.y}'deyiz.`, ['kiss'], { click: K.roomUrl('') });
      if (of(m.y, 'opucuk', mine() === 'me' ? 'her' : 'me')) K.stickers.award('yeniyil');
      paint();
    }
  }
  // Bildirimler: 31 Aralık'ta kale açılınca, kendi telefonuna iki gece yarısı
  function schedule() {
    const m = mids();
    if (!active() || K.store.get('yyPlan') === m.y) return;
    K.store.set('yyPlan', m.y);
    const w = mine();
    const a = K.later(m.baku), b = K.later(m.ist);
    a && K.ntfyTo(w, w === 'her' ? `🎆 ${m.y}! Bakü yeni yılda` : `🎆 Bakü ${m.y}'e girdi`, w === 'her' ? `Kaleye gir ve yeni yılı ${K.ek(C.myPet, 'e')} gönder; onun için bir saat daha var.` : `${C.herPet} şu an ${m.y}'de. Sen bir saat sonra.`, ['fireworks'], Object.assign({ click: K.roomUrl(''), priority: 4 }, a));
    b && K.ntfyTo(w, `🎆 ${m.y}! İkiniz de yeni yıldasınız`, 'Gece yarısı öpücüğü kalede seni bekliyor.', ['sparkler'], Object.assign({ click: K.roomUrl(''), priority: 4 }, b));
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('yeniyil', 200);
    K.cloud.on('yeniyil', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      ov && paint();
      if (r.who !== mine() && r.data.t === 'paket' && !ov && active()) K.fx.toast(`🎁 ${K.esc(nameOf(r.who))} sana ${r.data.y}'den bir paket gönderdi. <a href="#" onclick="K.yeniyil.scene();return false">Aç</a>`, { duration: 9000 });
    });
    schedule();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!active()) return [];
    const m = mids(), t = now();
    const txt = t < m.baku ? `${K.ek(C.herCity, 'in')} gece yarısına ${cd(m.baku - t).slice(0, 5)} kaldı; İstanbul bir saat sonra.` : t < m.ist ? `${C.herCity} ${m.y}'de! İstanbul'un gece yarısına ${cd(m.ist - t).slice(3, 8)} kaldı.` : `İkiniz de ${m.y}'desiniz. Gece yarısı öpücüğü bekliyor.`;
    return [{ key: 'yeniyil', big: true, icon: 'star', title: `🎆 İki Kez Yeni Yıl · ${m.y}`, text: txt, run: scene, cta: 'Sahneyi aç' }];
  });
  K.yeniyil = { scene, active, mids };
})();
