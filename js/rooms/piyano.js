/* Oda: İkili Piyano — iki kişilik küçük bir piyano. Bastığın nota onun ekranında da (kendi renginle) çalar; ikiniz aynı
   anda çalabilirsiniz. Kendi melodini kaydet ("Bizim şarkının ilk notaları"), kaydedilen melodi kalede durur: öbürü
   dinler ya da "Öğret" modunda sıradaki tuş parlayarak çalmayı öğrenir. Kayıtlar: melodi {name, notes: [[midi, ms]]} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const HAZIR = [
    ['Mutlu yıllar', [[60, 0], [60, 360], [62, 480], [60, 600], [65, 600], [64, 600], [60, 1200], [60, 360], [62, 480], [60, 600], [67, 600], [65, 600]]],
    ['Küçük ninni', [[64, 0], [67, 500], [64, 500], [64, 1000], [67, 500], [64, 500], [65, 1000], [64, 500], [62, 500], [60, 500], [62, 500]]],
    ['Kalp atışı', [[60, 0], [64, 220], [60, 700], [64, 220], [60, 700], [64, 220]]],
  ];
  let rows = [], loaded = false, root = null, oct = 4, rec = null, learn = null, ctxNodes = 0;
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function sound(m, other) {
    if (K.atolye && K.atolye.get().ses === false) return;
    K.audio.ensure && K.audio.ensure();
    const c = K.audio.ctx;
    if (!c || ctxNodes > 24) return;
    ctxNodes++;
    const t = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(other ? 0.13 : 0.16, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2600;
    [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.12]].forEach(([type, mul, amp]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type;
      o.frequency.value = freq(m) * mul;
      o.detune.value = other ? 4 : -3;
      og.gain.value = amp;
      o.connect(og).connect(f);
      o.start(t);
      o.stop(t + 1.7);
      o.onended = () => (ctxNodes = Math.max(0, ctxNodes - 0.34));
    });
    f.connect(g).connect(c.destination);
  }
  const keyEl = (m) => K.$(`[data-pk="${m}"]`, root);
  function flash(m, who) {
    const k = keyEl(m);
    if (!k) return;
    k.classList.add(who === 'x' ? 'basili-x' : who === mine() ? 'basili-ben' : 'basili-o');
    setTimeout(() => k.classList.remove('basili-ben', 'basili-o', 'basili-x'), 260);
  }
  function keys() {
    const base = oct * 12 + 12;
    const whites = [], blacks = [];
    let wi = 0;
    for (let m = base; m < base + 17; m++) {
      const n = m % 12;
      if ([1, 3, 6, 8, 10].includes(n)) blacks.push(`<button type="button" class="pyk siyah" data-pk="${m}" style="--x:${wi}" aria-label="${NAMES[n]}"></button>`);
      else {
        whites.push(`<button type="button" class="pyk beyaz" data-pk="${m}" aria-label="${NAMES[n]}"><small>${NAMES[n]}</small></button>`);
        wi++;
      }
    }
    return `<div class="py-klavye" style="--n:${wi}">${whites.join('')}${blacks.join('')}</div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'piyano') return;
    K.$('#pkKlavye', root).innerHTML = keys();
    K.$('#pkOkt', root).textContent = `${oct}. oktav`;
    const list = rows.slice().sort((a, b) => b.at - a.at);
    K.$('#pkMelodiler', root).innerHTML = `<p class="card-eyebrow">Melodiler</p>${HAZIR.map(([n], i) => `<div class="py-mel"><b>${K.esc(n)}</b><small>Kitty'den</small><button type="button" class="btn soft small" data-pk-dinle="h${i}">▶</button><button type="button" class="btn soft small" data-pk-ogren="h${i}">Öğret</button></div>`).join('')}
      ${list.map((r) => `<div class="py-mel"><b>${K.esc(r.data.name)}</b><small>${K.esc(nameOf(r.who))} · ${r.data.notes.length} nota</small><button type="button" class="btn soft small" data-pk-dinle="${r.id}">▶</button><button type="button" class="btn soft small" data-pk-ogren="${r.id}">Öğret</button></div>`).join('')}`;
    const together = K.cloud && K.cloud.otherHere && K.cloud.otherHere();
    K.$('#pkDurum', root).textContent = learn ? `Öğreniyorsun: ${learn.name} · ${learn.i}/${learn.notes.length}` : rec ? `● Kaydediliyor: ${rec.notes.length} nota` : together ? `🎹 ${nameOf(mine() === 'me' ? 'her' : 'me')} kalede; çaldığın her nota onda da çalıyor.` : 'Çaldığın notalar o kaledeyken onun ekranında da çalar.';
    if (learn) {
      const k = keyEl(learn.notes[learn.i] && learn.notes[learn.i][0]);
      k && k.classList.add('sira');
      if (!k && learn.notes[learn.i]) {
        oct = Math.floor(learn.notes[learn.i][0] / 12) - 1;
        render();
      }
    }
  }
  function press(m) {
    sound(m, false);
    flash(m, mine());
    K.cloud && K.cloud.send && K.cloud.send('nota', { m });
    if (rec) {
      const now = performance.now();
      rec.notes.push([m, rec.notes.length ? Math.round(now - rec.last) : 0]);
      rec.last = now;
      K.$('#pkDurum', root).textContent = `● Kaydediliyor: ${rec.notes.length} nota`;
    }
    if (learn) {
      if (learn.notes[learn.i] && learn.notes[learn.i][0] === m) {
        learn.i++;
        if (learn.i >= learn.notes.length) {
          K.fx.confetti({ count: 70 });
          K.audio.sfx.success();
          K.stickers.award('piyano');
          K.fx.toast(`🎹 <b>${K.esc(learn.name)}</b> tamam!`, { duration: 2600 });
          learn = null;
        }
      } else K.vibrate(30);
      render();
    }
  }
  function playMel(notes) {
    let t = 0;
    notes.forEach(([m, d]) => {
      t += d;
      setTimeout(() => {
        sound(m, true);
        flash(m, 'x');
      }, t);
    });
  }
  const melOf = (id) => (id[0] === 'h' && HAZIR[+id.slice(1)] ? { name: HAZIR[+id.slice(1)][0], notes: HAZIR[+id.slice(1)][1] } : (rows.find((r) => r.id === id) || {}).data);
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('melodi', 200);
    loaded = true;
    K.cloud.on('melodi', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.onLive('nota', (m) => {
      if (m.who === mine() || K.activeRoom !== 'piyano') return;
      sound(m.m, true);
      flash(m.m, m.who);
    });
  });
  K.room({
    id: 'piyano',
    wing: 'oyun',
    title: 'İkili Piyano',
    sub: 'İki şehir, bir klavye',
    icon: 'music',
    color: '#EEE8FF',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İki kişilik küçük bir piyano. Bastığın nota, o kaledeyken onun ekranında da çalar; ikimiz aynı anda çalabiliriz. Bizim şarkının ilk notalarını kaydet, o da "Öğret" ile parlayan tuşları takip ederek çalmayı öğrensin.</p></div>
        <section class="card py-kart"><div class="py-ust"><button type="button" class="icon-btn" data-pk-o="-1" aria-label="Alçak">‹</button><b id="pkOkt"></b><button type="button" class="icon-btn" data-pk-o="1" aria-label="Tiz">›</button></div>
          <div id="pkKlavye"></div><p class="muted small center" id="pkDurum"></p>
          <div class="row center"><button type="button" class="btn soft small" data-pk-kayit>⏺ Melodi kaydet</button></div></section>
        <section class="card" id="pkMelodiler"></section>`;
      el.addEventListener('pointerdown', (e) => {
        const k = e.target.closest('[data-pk]');
        if (!k) return;
        e.preventDefault();
        press(+k.dataset.pk);
      });
      el.addEventListener('click', async (e) => {
        const o = e.target.closest('[data-pk-o]');
        if (o) return (oct = K.clamp(oct + +o.dataset.pkO, 2, 6)), render();
        const kb = e.target.closest('[data-pk-kayit]');
        if (kb) {
          if (!rec) {
            rec = { notes: [], last: 0 };
            kb.textContent = '⏹ Kaydı bitir';
            return render();
          }
          const notes = rec.notes;
          rec = null;
          kb.textContent = '⏺ Melodi kaydet';
          if (notes.length < 3) return K.fx.toast('En az üç nota çal.', { duration: 1800 });
          const name = `Melodi ${rows.filter((r) => r.who === mine()).length + 1}`;
          if (K.cloud && K.cloud.enabled) {
            const r = await K.cloud.add('melodi', { name, notes: notes.slice(0, 120) });
            r && !rows.some((x) => x.id === r.id) && rows.push(r);
            K.ping(`🎹 ${K.meName()} sana bir melodi çaldı`, `"${name}" · ${notes.length} nota. Kalede "Öğret" ile sen de çal.`, ['musical_keyboard'], { click: K.roomUrl('piyano') });
          }
          return render();
        }
        const dn = e.target.closest('[data-pk-dinle]');
        if (dn) return melOf(dn.dataset.pkDinle) && playMel(melOf(dn.dataset.pkDinle).notes);
        const og = e.target.closest('[data-pk-ogren]');
        if (og) {
          const m = melOf(og.dataset.pkOgren);
          if (!m) return;
          learn = { name: m.name, notes: m.notes, i: 0 };
          oct = Math.floor(m.notes[0][0] / 12) - 1;
          return render();
        }
      });
    },
    enter() {
      render();
    },
    leave() {
      learn = null;
      rec = null;
    },
  });
})();
