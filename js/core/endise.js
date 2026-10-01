/* Kale 2.0 — İçim sıkıştı (Endişe Düğmesi): kalp menüsünün en üstünde. Bir kaygı düşünce tek dokunuş: neden (isteğe bağlı),
   gönder. Öbürüne öncelikli bildirim ve ekranında hemen bir kart gider ("şu an güvene ihtiyacı var") ve tek dokunuşla
   cevap verir. Gönderen bu arada nefes alır ve kavanozdaki notlardan, sebeplerden, barış sözlerinden seçilmiş cümlelere
   yaslanır; cevap geldiğinde aynı pencerede belirir. Kayıtlar: endise {why, note} · guven {ref, text} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const EN = () => D.endise || { whys: [], replies: ['Buradayım.'], comfort: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const fillO = (s) => K.fill(String(s || '')).replace(/\{other\}/g, nameOf(other()));
  let rows = [], loaded = false, sheet = null;
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const answers = (id) => rows.filter((r) => r.kind === 'guven' && r.data.ref === id).sort((a, b) => a.at - b.at);
  // Öbüründen gelen, son 6 saatte cevaplanmamış endişe
  const pendingFor = () => rows.filter((r) => r.kind === 'endise' && r.who === other() && Date.now() - r.at < 6 * 36e5 && !answers(r.id).some((a) => a.who === mine())).sort((a, b) => b.at - a.at)[0] || null;

  // Yaslanılacak cümleler: önce öbürünün sözleri (kavanoz notları, barış sözleri), sonra sebepler, sonra genel
  function comforts() {
    const out = [];
    const jar = (K.kavanoz && K.kavanoz.notesOf ? K.kavanoz.notesOf(other()) : []).map((t) => [t, `${nameOf(other())} · kavanozdan`]);
    out.push(...K.shuffle(jar).slice(0, 2));
    if (!K.isOwner() && D.reasons && D.reasons.length) out.push([K.fill(K.pick(D.reasons)), 'Seni sevmemin sebeplerinden']);
    const soz = K.baris && K.baris.promisesOf ? K.baris.promisesOf(other()) : [];
    if (soz.length) out.push([K.pick(soz), `${nameOf(other())} · barış sözü`]);
    out.push([K.pick(EN().comfort || ['Nefes al.']), 'Kitty']);
    return out.slice(0, 4);
  }

  function open() {
    if (!K.cloud || !K.cloud.enabled) return K.fx.toast('Bulut kapalı; bunun için bulut gerekiyor.');
    K.kalp && K.kalp.closeMenu();
    let why = '';
    const m = K.ui.modal({
      label: EN().title || 'İçim sıkıştı',
      cls: 'en-sheet',
      html: `<div class="en-orb" aria-hidden="true"><i></i><i></i><i></i></div><h2>${K.esc(EN().title || 'İçim sıkıştı')}</h2><p class="muted">${K.esc(fillO(EN().intro))}</p>
        <div class="br-chips">${(EN().whys || []).map((x) => `<button type="button" class="chip" data-en-why>${K.esc(x)}</button>`).join('')}</div>
        <input class="input" maxlength="120" placeholder="İstersen bir cümle (isteğe bağlı)">
        <button type="button" class="btn red" data-en-send>🫧 ${K.esc(K.ek(nameOf(other()), 'e'))} haber ver</button>`,
    });
    m.body.addEventListener('click', async (e) => {
      const w = e.target.closest('[data-en-why]');
      if (w) {
        why = w.classList.contains('on') ? '' : w.textContent;
        K.$$('[data-en-why]', m.body).forEach((x) => x.classList.toggle('on', x === w && Boolean(why)));
        return;
      }
      const s = e.target.closest('[data-en-send]');
      if (!s) return;
      s.disabled = true;
      const note = K.$('input', m.body).value.trim();
      const r = await K.cloud.add('endise', { why, note });
      if (!r) {
        s.disabled = false;
        return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
      }
      push(r);
      K.cloud.send('endise', { ref: r.id });
      K.ping(`🫧 ${K.meName()}: içim sıkıştı`, `${why || 'Şu an güvene ihtiyacı var.'}${note ? `\n"${note}"` : ''}\nBir cümle bile yeter.`, ['bubbles'], { priority: 5, click: K.roomUrl('') });
      m.close();
      setTimeout(() => calm(r), 320);
    });
  }
  // Gönderenin ekranı: nefes, yaslanılacak cümleler, gelen cevap
  function calm(r) {
    const list = comforts();
    sheet = K.ui.modal({
      label: 'Nefes al',
      cls: 'en-calm',
      html: `<div class="en-breath" aria-hidden="true"><i></i><b>Nefes al</b></div><p class="en-wait" data-en-wait>${K.esc(fillO(EN().waiting))}</p>
        <div class="en-ans" data-en-ans></div>
        <ul class="en-list">${list.map(([t, from]) => `<li><p class="hand">${K.esc(t)}</p><small>${K.esc(from)}</small></li>`).join('')}</ul>`,
      onClose: () => (sheet = null),
    });
    sheet.ref = r.id;
    drawAns();
    let n = 0;
    const lab = K.$('.en-breath b', sheet.body);
    const tick = setInterval(() => {
      if (!sheet) return clearInterval(tick);
      n = (n + 1) % 3;
      lab.textContent = ['Nefes al', 'Tut', 'Ver'][n];
    }, 4000);
  }
  function drawAns() {
    if (!sheet) return;
    const a = answers(sheet.ref).filter((x) => x.who === other());
    const box = K.$('[data-en-ans]', sheet.body);
    if (!a.length) return;
    K.$('[data-en-wait]', sheet.body).hidden = true;
    box.innerHTML = a.map((x) => `<div class="en-reply"><small>${K.esc(nameOf(x.who))}</small><p class="hand">${K.esc(x.data.text)}</p></div>`).join('');
  }
  // Alanın ekranı: hemen bir kart
  function respond(r) {
    if (!r || K.$('.en-help')) return;
    const m = K.ui.modal({
      label: 'Güvene ihtiyacı var',
      cls: 'en-help',
      html: `<div class="en-orb small" aria-hidden="true"><i></i><i></i><i></i></div><p class="card-eyebrow">${K.esc(K.ago(r.at))}</p><h2>${K.esc(nameOf(r.who))} şu an güvene ihtiyaç duyuyor</h2>
        ${r.data.why ? `<p class="en-why">${K.esc(r.data.why)}</p>` : ''}${r.data.note ? `<p class="hand en-note">"${K.esc(r.data.note)}"</p>` : ''}
        <div class="en-replies">${(EN().replies || []).map((x) => `<button type="button" class="chip" data-en-rep>${K.esc(x)}</button>`).join('')}</div>
        <input class="input" maxlength="160" placeholder="Ya da kendi cümlen...">
        <div class="row"><button type="button" class="btn red" data-en-go>💗 Gönder</button><button type="button" class="btn soft" data-en-hug>🤗 Sarıl</button><a class="btn ghost" href="#telesekreter" data-close>📼 Sesli mesaj</a></div>`,
    });
    const inp = K.$('input', m.body);
    m.body.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-en-rep]');
      if (c) {
        inp.value = c.textContent;
        return;
      }
      if (e.target.closest('[data-en-hug]')) return K.kalp && K.kalp.act('saril', e.target.closest('[data-en-hug]'));
      const g = e.target.closest('[data-en-go]');
      if (!g) return;
      const text = inp.value.trim() || (EN().replies || ['Buradayım.'])[0];
      g.disabled = true;
      const a = await K.cloud.add('guven', { ref: r.id, text });
      if (!a) {
        g.disabled = false;
        return K.fx.toast('Gönderilemedi.');
      }
      push(a);
      K.stickers.award('endise');
      K.cloud.send('endise', { ans: a.id });
      K.ping(`💗 ${K.meName()}: ${text}`, 'İçin rahatlasın.', ['heart'], { priority: 5 });
      m.close();
      K.audio.sfx.chime();
      K.fx.toast('💗 Gönderildi. Ekranında hemen belirdi.', { duration: 3000 });
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['endise', 'guven'], { since: Date.now() - 30 * 864e5, limit: 300 });
    loaded = true;
    ['endise', 'guven'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who === mine()) return;
        if (k === 'endise') {
          K.audio.sfx.chime();
          K.vibrate([80, 60, 80]);
          respond(r);
        } else {
          drawAns();
          if (!sheet || sheet.ref !== r.data.ref) K.fx.toast(`💗 <b>${K.esc(nameOf(r.who))}:</b> ${K.esc(r.data.text)}`, { duration: 9000 });
        }
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const p = pendingFor();
    return p ? [{ icon: 'heart', title: `🫧 ${nameOf(p.who)} şu an güvene ihtiyaç duyuyor`, text: `${p.data.why || 'İçi sıkıştı.'}${p.data.note ? ` "${p.data.note}"` : ''} Bir cümle bile yeter.`, run: () => respond(p), cta: 'Cevap ver' }] : [];
  });
  K.endise = { open };
})();
