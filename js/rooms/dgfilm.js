/* Oda: Doğum Günü Filmi — onun doğum gününe kalenin kendi filmi. Bakü saatiyle doğum gününün gece yarısı açılır
   (ondan önce onun tarafında görünmez). Geçen doğum gününden bu yana bir yıl: sayılar, iki şehrin kareleri, kavanoza
   attığım notlar, benim ithaf yazım, ona kaydettiğim doğum günü sesleri; sonunda üflenince sönen mumlu bir pasta
   (mikrofona üfle ya da dokun) ve kimsenin görmeyeceği bir dilek. Ben önceden hazırlarım: ithaf yazısı, sesler, önizleme.
   Kayıtlar: dgnot {year, text} · dgses {year, audio, dur} · dgizle {year} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  let root = null, notes = [], sesler = [], izle = [], voice = null;
  const bd = () => C.herBirthday || '04-23';
  // Filmin yılı: doğum günü bugünse ya da son 60 gün içindeyse o yıl; değilse gelecek doğum günü
  function year() {
    const n = T.nextAnnual(bd());
    if (n.days === 0) return { y: n.year, open: true, days: 0 };
    const last = n.year - 1;
    const since = T.daysSince(`${last}-${bd()}`);
    return since >= 0 && since <= 60 ? { y: last, open: true, days: 0, since } : { y: n.year, open: false, days: n.days };
  }
  const dayKey = (y) => `${y}-${bd()}`;
  const dedication = (y) => notes.filter((r) => r.data.year === y).sort((a, b) => b.at - a.at)[0];
  const voicesOf = (y) => sesler.filter((r) => r.data.year === y).sort((a, b) => a.at - b.at);
  function cake(n = 5) {
    const cs = Array.from({ length: n }, (_, i) => {
      const x = 70 + i * (160 / (n - 1));
      return `<g class="dg-mum" data-i="${i}"><rect x="${x - 4}" y="62" width="8" height="34" rx="3" fill="${['#FF8FB8', '#8FD3FF', '#FFD34E', '#7ED6A5', '#C9B6FF'][i % 5]}" stroke="#4A2138" stroke-width="2"/><path class="dg-alev" d="M${x} 44 q8 10 0 18 q-8 -8 0 -18z" fill="#FFB52E"/><circle class="dg-duman" cx="${x}" cy="40" r="5" fill="#ccc" opacity="0"/></g>`;
    }).join('');
    return `<svg class="dg-pasta" viewBox="0 0 300 230" aria-label="Doğum günü pastası">
      <ellipse cx="150" cy="212" rx="130" ry="12" fill="rgba(0,0,0,.25)"/>
      <rect x="40" y="150" width="220" height="58" rx="14" fill="#FFD6E5" stroke="#4A2138" stroke-width="3"/>
      <rect x="60" y="96" width="180" height="60" rx="12" fill="#fff" stroke="#4A2138" stroke-width="3"/>
      <path d="M60 112 q15 14 30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#FF6FA3" stroke-width="7" stroke-linecap="round"/>
      <path d="M40 166 q18 16 36 0 t36 0 t36 0 t36 0 t36 0 t36 0" fill="none" stroke="#E3174D" stroke-width="7" stroke-linecap="round"/>
      <g transform="translate(150 182) scale(.42)">${A.bowShape('#E3174D')}</g>${cs}</svg>`;
  }
  async function scenes(y, preview) {
    const day = dayKey(y);
    const since = T.at(dayKey(y - 1)).getTime(), until = T.at(day).getTime() + 864e5;
    const inYear = (x) => x.at >= since && x.at < until;
    const [ph, nt, cnt] = K.arsiv ? await Promise.all([K.arsiv.photos(), K.arsiv.notes(), K.arsiv.counts(since, until)]) : [[], [], {}];
    const photos = ph.filter(inYear);
    const pick = photos.length <= 14 ? photos : Array.from({ length: 14 }, (_, i) => photos[Math.floor((i * photos.length) / 14)]);
    const mineNotes = nt.filter((x) => inYear(x) && x.who === 'me' && x.kind === 'kalpk' && x.text.length > 4);
    const notePick = mineNotes.length <= 4 ? mineNotes : [0, 1, 2, 3].map((i) => mineNotes[Math.floor((i * mineNotes.length) / 4)]);
    const ded = dedication(y);
    const together = C.togetherDate ? Math.max(1, Math.min(365, T.dayNumber(T.at(day)) - T.dayNumber(T.at(C.togetherDate)))) : 365;
    const out = [
      { t: 'baslik', eyebrow: `${T.fmt(day)} · ${C.herCity}, 00:00`, title: `İyi ki doğdun, ${C.herPet}`, sub: 'Bu film senin için. Bir yılın içinden, kalenin bütün odalarından.', dur: 5600 },
      { t: 'sayi', title: 'Geçen doğum gününden bu yana', items: [[together, together < 365 ? 'gündür birlikteyiz' : 'gün birbirimizi seçtik'], [cnt.kalpk || 0, 'kalp kavanoza düştü'], [cnt.tsmesaj || 0, 'sesli mesaj'], [(cnt.kare || 0) + (cnt.postcard || 0), 'kare ve kartpostal']].filter((x) => x[0]) },
    ];
    pick.forEach((p, i) => {
      out.push({ t: 'foto', src: p.thumb, full: p.full, caption: p.text ? p.text.slice(0, 90) : p.label, sub: `${T.fmt(p.day)} · ${cityOf(p.who)}` });
      if (i === 4 && notePick[0]) out.push({ t: 'yazi', text: notePick[0].text, by: `Kavanozdan · ${C.myPet}` });
      if (i === 9 && notePick[1]) out.push({ t: 'yazi', text: notePick[1].text, by: `Kavanozdan · ${C.myPet}` });
    });
    notePick.slice(pick.length > 9 ? 2 : pick.length > 4 ? 1 : 0).forEach((n) => out.push({ t: 'yazi', text: n.text, by: `Kavanozdan · ${C.myPet}` }));
    if (ded) out.push({ t: 'yazi', text: ded.data.text, by: `— ${C.myPet}`, dur: Math.max(7000, ded.data.text.length * 70) });
    voicesOf(y).forEach((v) => out.push({ t: 'ses', audio: v.data.audio, by: `${C.myPet} sana söylüyor`, text: 'Doğum günü mesajı' }));
    out.push({
      t: 'ozel',
      html: `<p class="bg-ust">Mumları üfle</p>${cake(5)}<p class="bg-alt" id="dgUfle">Telefona doğru üfle ya da mumlara dokun.</p><div class="dg-seviye"><span id="dgSev"></span></div>`,
      onShow(box, next, mus) {
        let lit = 5, det = null, done = false;
        const blowOne = (i) => {
          const m = K.$(`.dg-mum[data-i="${i}"]`, box);
          if (!m || m.classList.contains('sondu')) return;
          m.classList.add('sondu');
          lit--;
          if (lit <= 0) finish();
        };
        const finish = () => {
          if (done) return;
          done = true;
          det && det.stop();
          K.fx.fireworks && K.fx.fireworks(3500);
          K.fx.confetti({ count: 160, shapes: ['heart', 'star', 'bow'] });
          K.audio.sfx.success();
          K.$('#dgUfle', box).textContent = 'Bütün mumlar söndü. Şimdi bir dilek tut...';
          setTimeout(next, 3400);
        };
        box.addEventListener('click', (e) => {
          const m = e.target.closest('.dg-mum');
          if (m) {
            e.stopPropagation();
            blowOne(+m.dataset.i);
          }
        });
        if (K.audio.blowDetector) {
          K.audio.ensure();
          K.audio
            .blowDetector(
              () => {
                [0, 1, 2, 3, 4].forEach((i) => setTimeout(() => blowOne(i), i * 140));
              },
              (lv) => K.$('#dgSev', box) && (K.$('#dgSev', box).style.width = Math.min(100, lv * 700) + '%')
            )
            .then((d) => (done ? d.stop() : (det = d)))
            .catch(() => {});
        }
        this.onLeave = () => det && det.stop();
      },
    });
    out.push({
      t: 'ozel',
      html: `<p class="bg-ust">Dilek</p><h2>Bir dilek tut</h2><p class="bg-alt">Buraya yazabilirsin; yalnızca bu telefonda kalır, kimse görmez. Ben bile.</p><textarea class="input dg-dilek" maxlength="200" rows="3" placeholder="Dileğim..."></textarea><button type="button" class="btn red dg-tamam">Diledim 💫</button>`,
      onShow(box, next) {
        const ta = K.$('.dg-dilek', box);
        const b = K.$('.dg-tamam', box);
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!preview && ta.value.trim()) K.store.set('dgDilek' + y, ta.value.trim());
          next();
        });
      },
    });
    out.push({ t: 'kapanis', text: 'Bir yaş daha büyüdün; ben seni bir yıl daha çok sevdim.', sub: `İyi ki doğdun. — ${C.myPet}`, dur: 8000 });
    return out;
  }
  async function play(btn, preview) {
    const y = year().y;
    btn && (btn.disabled = true);
    const sc = await scenes(y, preview);
    btn && (btn.disabled = false);
    K.belgesel.play(sc, {
      mood: 'kutlama',
      cls: 'dg-perde',
      label: 'Doğum günü filmi',
      onEnd: async (done) => {
        if (!done || preview || K.isOwner()) return;
        K.stickers.award('dgfilm');
        if (izle.some((r) => r.data.year === y)) return;
        const r = await K.cloud.add('dgizle', { year: y });
        r && !izle.some((x) => x.id === r.id) && izle.push(r);
        K.ping(`🎂 ${K.meName()} doğum günü filmini izledi`, 'Mumları üfledi, dileğini tuttu.', ['birthday'], { click: K.roomUrl('dgfilm') });
      },
    });
  }
  function render() {
    if (!root || K.activeRoom !== 'dgfilm') return;
    const st = year();
    const y = st.y;
    const ded = dedication(y), vs = voicesOf(y);
    const her = !K.isOwner();
    const watched = izle.some((r) => r.data.year === y);
    K.$('#dgAfis', root).innerHTML = `<div class="dg-afis"><div class="dg-isiklar" aria-hidden="true">${'<i></i>'.repeat(14)}</div><small>KALE SİNEMASI · TEK GÖSTERİM</small><h3>İyi ki doğdun, ${K.esc(C.herPet)}</h3><p>${K.esc(T.fmt(dayKey(y)))} · ${K.esc(C.herCity)}, 00:00</p>${A.kitty({ crown: true, eyes: 'happy', cls: 'dg-kitty' })}
      ${st.open ? `<button type="button" class="btn red" data-dg-izle>🎬 ${her && watched ? 'Tekrar izle' : 'Filmi başlat'}</button>` : `<p class="dg-sayac"><b>${K.num(st.days)}</b> gün sonra gece yarısı açılacak</p>`}
      ${!her && watched ? `<p class="dg-izledi">✓ ${K.esc(C.herPet)} filmi izledi</p>` : ''}</div>`;
    const prep = K.$('#dgHazir', root);
    prep.hidden = her;
    if (her) return;
    prep.innerHTML = `<p class="card-eyebrow">Hazırlık · ${y} filmi</p>
      <label class="dg-etiket">İthaf yazın (filmin ortasında harf harf yazılır)</label><textarea class="input" id="dgNot" rows="4" maxlength="600" placeholder="Ona bu yıl için ne söylemek istersin?">${K.esc(ded ? ded.data.text : '')}</textarea>
      <div class="row"><button type="button" class="btn soft small" data-dg-kaydet>💾 Kaydet</button></div>
      <label class="dg-etiket">Doğum günü sesleri (${vs.length})</label>
      ${vs.map((v, i) => `<div class="dg-ses"><span>🎙 ${i + 1}. ses · ${Math.round(v.data.dur || 0)} sn</span><button type="button" class="btn soft small" data-dg-dinle="${v.data.audio}">▶</button></div>`).join('')}
      <div class="row"><button type="button" class="btn soft small" data-dg-kayit>${voice ? '⏹ Bitir' : '⏺ Ses kaydet (en fazla 60 sn)'}</button></div>
      <div class="row"><button type="button" class="btn red small" data-dg-onizle>👀 Önizle</button></div>
      <p class="muted small">${K.esc(C.herPet)} için bu oda doğum gününün gece yarısına kadar görünmez; o gün ana salonda büyük bir kart çıkar.</p>`;
  }
  async function load() {
    if (!K.cloud || !K.cloud.enabled) return;
    [notes, sesler, izle] = await Promise.all([K.cloud.list('dgnot', 50), K.cloud.list('dgses', 50), K.cloud.list('dgizle', 20)]);
    render();
  }
  K.on('cloud', (ok) => {
    if (!ok) return;
    load();
    K.cloud.on('dgizle', (r) => izle.some((x) => x.id === r.id) || (izle.push(r), render()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const st = year();
    if (!st.open || K.isOwner() || (st.since || 0) > 3 || K.store.get('dgFilmGordu') === st.y) return [];
    return [{ key: 'dgfilm', icon: 'cake', title: `🎂 Bugün senin filmin var`, text: 'Kale bütün bir yılı senin için bir filme dönüştürdü. Sesini aç, mumlar seni bekliyor.', run: () => (K.store.set('dgFilmGordu', st.y), (location.hash = 'dgfilm')), cta: 'Filmi aç', big: true }];
  });
  K.room({
    id: 'dgfilm',
    wing: 'zaman',
    title: 'Doğum Günü Filmi',
    sub: 'Bir yıl, tek gösterim',
    icon: 'cake',
    color: '#FFE3EE',
    hidden: () => !K.cloud || !K.cloud.enabled || (!K.isOwner() && !year().open),
    badge: () => (year().open && !K.isOwner() ? 'Bugün' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Doğum gününe kalenin kendi filmi: bir yılın kareleri, sesleri ve cümleleri müzikle. Sonunda mumları üflemen gereken bir pasta var.</p></div>
        <section class="card" id="dgAfis"></section><section class="card dg-hazir" id="dgHazir" hidden></section>`;
      el.addEventListener('click', async (e) => {
        const iz = e.target.closest('[data-dg-izle]');
        if (iz) return play(iz, false);
        const on = e.target.closest('[data-dg-onizle]');
        if (on) return play(on, true);
        const kb = e.target.closest('[data-dg-kaydet]');
        if (kb) {
          const text = K.$('#dgNot', root).value.trim();
          if (!text) return;
          kb.disabled = true;
          const r = await K.cloud.add('dgnot', { year: year().y, text });
          kb.disabled = false;
          if (r) notes.push(r), K.fx.toast('İthaf kaydedildi.');
          return;
        }
        const d = e.target.closest('[data-dg-dinle]');
        if (d) {
          const url = await K.medya.rowUrl(d.dataset.dgDinle, 'b64');
          url && new Audio(url).play().catch(() => {});
          return;
        }
        const rb = e.target.closest('[data-dg-kayit]');
        if (rb) {
          if (voice) return voice.stop();
          voice = await K.mikrofon.start(60, (s) => (rb.textContent = `⏹ Bitir (${Math.round(s)} sn)`));
          if (!voice) return;
          render();
          const res = await voice.done;
          voice = null;
          const au = await K.mikrofon.upload(res.blob);
          const r = au && (await K.cloud.add('dgses', { year: year().y, audio: au.id, dur: res.dur }));
          r ? (sesler.push(r), K.fx.toast('Ses filme eklendi.')) : K.fx.toast('Ses kaydedilemedi.');
          render();
        }
      });
    },
    enter() {
      render();
      load();
    },
  });
  K.dgfilm = { year, scenes };
})();
