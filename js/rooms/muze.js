/* Oda: Kale Müzesi — kalede biriken her şeyin sergilendiği küçük bir müze. Girişte numaralı bir bilet; sonra yürünerek
   (yana kaydırarak) gezilen fotoğraf duvarı: her kare altın, ahşap ya da pembe bir çerçevede, altında müze etiketi
   (eser no, tür, tarih, şehir, kimden). Dokununca eser büyür; "Sesli rehber" etiketi Türkçe okur. Söz Salonu'nda barış
   sözleri ve minnetler mermer levhalarda; Kavanoz Vitrini'nde kalp kavanozu ve sergilenen notlar; Ses Odası'nda
   telesekreterden sesler. Çıkışta ziyaretçi defteri ve hediyelik eşya dükkânı (bir eserden kartpostal indir).
   İkimiz de bir eseri "Kalıcı koleksiyon"a alabiliriz; onlar kurdeleyle en başta durur.
   Kayıtlar: muzesec {ref} · muzedefter {text} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  const FRAMES = ['altin', 'ahsap', 'pembe', 'gumus', 'oval'];
  let root = null, photos = [], notes = [], voices = [], sec = [], defter = [], loaded = false, jar = 0, filter = 'hepsi';
  const fmtDay = (d) => (d && /^\d{4}-\d\d-\d\d$/.test(d) ? T.fmt(d) : '');
  const frameOf = (p) => FRAMES[K.hash(p.id) % FRAMES.length];
  const tilt = (p) => ((K.hash(p.id + 't') % 5) - 2) * 0.6;
  const no = (p) => photos.indexOf(p) + 1;
  const pinned = (id) => sec.some((r) => r.data.ref === id);
  function ordered() {
    const list = photos.filter((p) => filter === 'hepsi' || (filter === 'sec' ? pinned(p.id) : p.who === filter));
    return list.slice().sort((a, b) => (pinned(b.id) ? 1 : 0) - (pinned(a.id) ? 1 : 0) || b.at - a.at);
  }
  function plaque(p) {
    return `<span class="mz-etiket"><b>No. ${no(p)}</b> · ${K.esc(p.label)}<br><small>${K.esc(fmtDay(p.day))} · ${K.esc(cityOf(p.who))} · ${K.esc(nameOf(p.who))}</small></span>`;
  }
  function wall() {
    const list = ordered();
    if (!list.length) return `<div class="mz-bos">${A.kitty({ eyes: 'happy', cls: 'mz-bekci' })}<p>Duvarlar henüz boş. Günün Karesi, kartpostal ya da hikâye paylaştıkça eserler buraya asılır.</p></div>`;
    return `<div class="mz-duvar" id="mzDuvar">${list
      .slice(0, 120)
      .map((p) => `<figure class="mz-eser ${frameOf(p)} ${pinned(p.id) ? 'kalici' : ''}" style="--tilt:${tilt(p)}deg"><span class="mz-isik" aria-hidden="true"></span><button type="button" class="mz-cerceve" data-mz="${p.id}" aria-label="Eser ${no(p)}"><img src="${p.thumb}" alt="" loading="lazy"></button>${pinned(p.id) ? '<span class="mz-kurdele">Kalıcı koleksiyon</span>' : ''}<figcaption>${plaque(p)}</figcaption></figure>`)
      .join('')}</div><div class="mz-zemin" aria-hidden="true"></div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'muze') return;
    const ticket = K.store.get('muzeBilet', 0);
    K.$('#mzBilet', root).innerHTML = `<div class="mz-bilet"><div><small>KALE MÜZESİ · GİRİŞ BİLETİ</small><b>Ziyaretçi No. ${String(ticket).padStart(4, '0')}</b><span>${K.esc(T.fmt(T.todayKey()))} · ${K.num(photos.length)} eser · ${K.num(notes.length)} yazı · ${K.num(voices.length)} ses</span></div><div class="mz-delik" aria-hidden="true">${A.bow('#E3174D', 'mz-fiyonk')}</div></div>`;
    K.$('#mzFiltre', root).innerHTML = [['hepsi', 'Bütün eserler'], ['her', `${C.herPet} koleksiyonu`], ['me', `${C.myPet} koleksiyonu`], ['sec', 'Kalıcı koleksiyon']].map(([k, n]) => `<button type="button" class="chip ${filter === k ? 'on' : ''}" data-mz-f="${k}">${K.esc(n)}</button>`).join('');
    K.$('#mzGaleri', root).innerHTML = loaded ? wall() : '<p class="muted center">Eserler asılıyor...</p>';
    const soz = notes.filter((n) => n.kind === 'barissoz' || n.kind === 'minnet' || n.kind === 'soz').slice(-12).reverse();
    K.$('#mzSoz', root).innerHTML = soz.length
      ? soz.map((n) => `<blockquote class="mz-levha ${n.kind}"><p>${K.esc(n.text)}</p><cite>${K.esc(n.label)} · ${K.esc(nameOf(n.who))} · ${K.esc(fmtDay(n.day))}</cite></blockquote>`).join('')
      : '<p class="muted">Barış sözleri, minnetler ve sözler burada mermere kazınacak.</p>';
    const jarNotes = notes.filter((n) => n.kind === 'kalpk');
    const shown = jarNotes.length ? [0, 1, 2].map((i) => jarNotes[(K.hash(T.todayKey() + i) % jarNotes.length)]).filter((x, i, a) => a.indexOf(x) === i) : [];
    K.$('#mzVitrin', root).innerHTML = `<div class="mz-vitrin"><div class="mz-cam">${jarSvg(jar)}</div><div class="mz-vitrin-yazi"><b>${K.num(jar)} kalp</b><small>Kalp Kavanozu · ${K.esc(T.fmt(C.togetherDate || T.todayKey()))}'den beri</small>${shown.map((n) => `<p class="mz-not">"${K.esc(n.text)}" <small>${K.esc(nameOf(n.who))}</small></p>`).join('')}</div></div>`;
    K.$('#mzSes', root).innerHTML = voices.length
      ? voices.slice(-8).reverse().map((v) => `<div class="mz-plak"><span class="mz-gramofon" aria-hidden="true">${A.icon ? A.icon('music') : '🎙'}</span><div><b>${K.esc(nameOf(v.who))} · ${Math.round(v.dur)} sn</b><small>${K.esc(K.ago(v.at))}</small></div><button type="button" class="btn soft small" data-mz-ses="${v.audio}">▶ Dinle</button></div>`).join('')
      : '<p class="muted">Telesekreterde ses biriktikçe burada çalınır.</p>';
    K.$('#mzDefter', root).innerHTML = defter.slice(-8).reverse().map((r) => `<p class="mz-imza"><span>${K.esc(r.data.text)}</span><small>— ${K.esc(nameOf(r.who))}, ${K.esc(K.ago(r.at))}</small></p>`).join('') || '<p class="muted small">Defterin ilk sayfası boş.</p>';
  }
  function jarSvg(n) {
    const hearts = Array.from({ length: Math.min(40, n) }, (_, i) => {
      const r = K.rng(i + 7);
      return A.heartPath((34 + r() * 52).toFixed(1), (150 - (i / 40) * 96 - r() * 10).toFixed(1), 0.9, ['#FF6FA3', '#E3174D', '#FFB3CE', '#C9B6FF'][i % 4]);
    }).join('');
    return `<svg viewBox="0 0 120 170" aria-hidden="true"><rect x="22" y="14" width="76" height="16" rx="5" fill="#E3174D"/><path d="M28 32h64q8 0 8 10v108q0 12-12 12H32q-12 0-12-12V42q0-10 8-10z" fill="rgba(255,255,255,.4)" stroke="#4A2138" stroke-width="3"/><g>${hearts}</g><path d="M30 46v90" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/></svg>`;
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return K.fx.toast('Bu telefonda sesli rehber yok.');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => /^tr/i.test(x.lang));
    v && (u.voice = v);
    speechSynthesis.speak(u);
  }
  function guideText(p) {
    const n = no(p);
    return `Eser numarası ${n}. ${p.label}. ${fmtDay(p.day)}, ${K.ek(cityOf(p.who), 'den')}. ${nameOf(p.who)} paylaştı.${p.text ? ` Üzerinde şöyle yazıyor: ${p.text}` : ''}`;
  }
  async function open(id) {
    const p = photos.find((x) => x.id === id);
    if (!p) return;
    const m = K.ui.modal({
      label: 'Eser',
      cls: 'mz-modal',
      html: `<figure class="mz-buyuk ${frameOf(p)}"><img src="${p.thumb}" alt="" id="mzBig"></figure>${plaque(p)}${p.text ? `<p class="mz-yazi">"${K.esc(p.text)}"</p>` : ''}
        <div class="row center"><button type="button" class="btn soft small" data-mz-rehber>🎧 Sesli rehber</button><button type="button" class="btn soft small" data-mz-pin>${pinned(p.id) ? '✓ Kalıcı koleksiyonda' : '🎀 Kalıcı koleksiyona al'}</button><button type="button" class="btn soft small" data-mz-kart>🛍 Kartpostal yap</button></div>`,
      onClose: () => 'speechSynthesis' in window && speechSynthesis.cancel(),
    });
    if (p.full && K.medya) {
      const url = await K.medya.rowUrl(p.full, 'img');
      const img = K.$('#mzBig', m.el);
      url && img && (img.src = url);
    }
    m.el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-mz-rehber]')) return speak(guideText(p));
      const pin = e.target.closest('[data-mz-pin]');
      if (pin && !pinned(p.id)) {
        pin.disabled = true;
        const r = await K.cloud.add('muzesec', { ref: p.id });
        r && sec.push(r);
        pin.textContent = '✓ Kalıcı koleksiyonda';
        K.audio.sfx.sparkle();
        render();
      }
      if (e.target.closest('[data-mz-kart]')) postcard(p, K.$('#mzBig', m.el).src);
    });
  }
  async function postcard(p, src) {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 1500;
    const g = c.getContext('2d');
    g.fillStyle = '#FFF6EE';
    g.fillRect(0, 0, 1200, 1500);
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
    } catch (e) {
      return K.fx.toast('Fotoğraf açılamadı.');
    }
    const s = Math.min(img.width, img.height);
    g.fillStyle = '#C9A24A';
    g.fillRect(90, 90, 1020, 1020);
    g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 120, 120, 960, 960);
    g.fillStyle = '#4A2138';
    g.textAlign = 'center';
    g.font = '700 52px Fredoka, sans-serif';
    g.fillText(`Kale Müzesi · No. ${no(p)}`, 600, 1210);
    g.font = '400 38px Nunito, sans-serif';
    g.fillText(`${p.label} · ${fmtDay(p.day)} · ${cityOf(p.who)}`, 600, 1275);
    if (p.text) g.fillText(`"${p.text.slice(0, 48)}${p.text.length > 48 ? '…' : ''}"`, 600, 1340);
    g.fillStyle = '#E3174D';
    g.font = '700 34px Fredoka, sans-serif';
    g.fillText(`${C.herPet} & ${C.myPet}`, 600, 1430);
    K.download(c.toDataURL('image/jpeg', 0.9), `kale-muzesi-${no(p)}.jpg`);
    K.stickers.award('muzekart');
  }
  async function load() {
    if (!K.cloud || !K.cloud.enabled || !K.arsiv) return;
    [photos, notes, voices, sec, defter, jar] = await Promise.all([K.arsiv.photos(), K.arsiv.notes(), K.arsiv.voices(), K.cloud.list('muzesec', 300), K.cloud.list('muzedefter', 200), K.cloud.list('kalpk', 5000).then((r) => r.length)]);
    loaded = true;
    render();
  }
  K.on('cloud', (ok) => {
    if (!ok) return;
    K.cloud.on('muzedefter', (r) => defter.some((x) => x.id === r.id) || (defter.push(r), render()));
    K.cloud.on('muzesec', (r) => sec.some((x) => x.id === r.id) || (sec.push(r), render()));
  });
  K.room({
    id: 'muze',
    wing: 'anilar',
    title: 'Kale Müzesi',
    sub: 'Her anı bir eser',
    icon: 'frame',
    color: '#F6EBDD',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kalede biriken her şey burada sergileniyor. Duvar boyunca yürü (yana kaydır), bir esere dokun; sesli rehber anlatsın. Çıkarken ziyaretçi defterine bir satır bırak.</p></div>
        <div id="mzBilet"></div>
        <nav class="mz-harita" aria-label="Müze haritası"><a href="#mzG">🖼 Fotoğraf Salonu</a><a href="#mzS">🏛 Söz Salonu</a><a href="#mzV">🫙 Kavanoz Vitrini</a><a href="#mzO">🎙 Ses Odası</a><a href="#mzD">📖 Ziyaretçi Defteri</a></nav>
        <section class="mz-salon mz-foto" id="mzG"><h3>Fotoğraf Salonu</h3><div class="mz-filtre" id="mzFiltre"></div><div class="mz-koridor" id="mzGaleri"></div><p class="muted small center">← duvar boyunca yürü →</p></section>
        <section class="mz-salon" id="mzS"><h3>Söz Salonu</h3><div class="mz-levhalar" id="mzSoz"></div></section>
        <section class="mz-salon" id="mzV"><h3>Kavanoz Vitrini</h3><div id="mzVitrin"></div></section>
        <section class="mz-salon" id="mzO"><h3>Ses Odası</h3><div id="mzSes"></div></section>
        <section class="mz-salon mz-cikis" id="mzD"><h3>Ziyaretçi Defteri</h3><div class="mz-defter" id="mzDefter"></div><div class="row"><input class="input" id="mzYaz" maxlength="140" placeholder="Bugün müzede en çok hangi eser?"><button type="button" class="btn red small" data-mz-imza>İmzala</button></div></section>`;
      el.addEventListener('click', async (e) => {
        const a = e.target.closest('.mz-harita a');
        if (a) {
          e.preventDefault();
          const t = K.$(a.getAttribute('href'), root);
          t && t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        const f = e.target.closest('[data-mz-f]');
        if (f) return (filter = f.dataset.mzF), render();
        const ex = e.target.closest('[data-mz]');
        if (ex) return open(ex.dataset.mz);
        const s = e.target.closest('[data-mz-ses]');
        if (s) {
          s.disabled = true;
          const url = await K.medya.rowUrl(s.dataset.mzSes, 'b64');
          s.disabled = false;
          if (!url) return K.fx.toast('Ses açılamadı.');
          K.audio.music.on && K.audio.music.stop(false);
          new Audio(url).play().catch(() => {});
          return;
        }
        if (e.target.closest('[data-mz-imza]')) {
          const inp = K.$('#mzYaz', root);
          const text = inp.value.trim();
          if (!text) return inp.focus();
          const r = await K.cloud.add('muzedefter', { text });
          if (!r) return K.fx.toast('Yazılamadı.');
          defter.push(r);
          inp.value = '';
          K.stickers.award('muzedefter');
          K.ping(`🏛 ${K.meName()} müzenin defterine yazdı`, text, ['classical_building'], { click: K.roomUrl('muze') });
          render();
        }
      });
    },
    enter() {
      K.store.set('muzeBilet', K.store.get('muzeBilet', 0) + 1);
      render();
      load();
      K.stickers.award('muze');
    },
    leave() {
      'speechSynthesis' in window && speechSynthesis.cancel();
    },
  });
})();
