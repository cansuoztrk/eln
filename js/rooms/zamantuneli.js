/* Oda: Zaman Tüneli Belgeseli — her ay kendiliğinden kurulan bir belgesel bölümü. Kaledeki o ayın kayıtlarından:
   açılış jeneriği, ayın sayıları (kalpler, sarılmalar, sesler, kareler), fotoğraflar (Ken Burns), kavanozdan ve
   minnetlerden cümleler (harf harf), telesekreterden bir ses, On Saniyelik Anlar'dan klipler ve kapanış.
   Ay bitince bölüm "yayında" olur; içinde bulunduğumuz ay "çekimler sürüyor" diye önizlenir. İzleyen işaretlenir,
   öbürü kimin izlediğini görür. Kayıtlar: belgeselizle {ym} */
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
  const MOODS = ['sicak', 'nostalji', 'gece', 'sicak', 'kutlama', 'nostalji'];
  const SUBS = ['İki şehir, bir hikâye', 'Uzaklığın içinden', 'Her gün biraz daha', 'Saat farkının ötesinde', 'Bir ay daha birbirimize', 'Kalenin günlüğünden'];
  let root = null, months = [], seen = [], loaded = false, posters = {};
  const nowYm = () => T.todayKey().slice(0, 7);
  const epNo = (ym) => months.indexOf(ym) + 1;
  const watched = (ym, w) => seen.some((r) => r.data.ym === ym && r.who === w);
  async function scenes(ym) {
    const m = await K.arsiv.month(ym);
    const anlar = K.cloud ? (await K.cloud.list('anlar', 400)).filter((r) => (r.data.day || '').slice(0, 7) === ym).sort((a, b) => a.data.day.localeCompare(b.data.day)) : [];
    const c = m.counts;
    const n = epNo(ym) || months.length + 1;
    const out = [{ t: 'baslik', eyebrow: `Zaman Tüneli · Bölüm ${n}`, title: K.arsiv.monthName(ym), sub: SUBS[n % SUBS.length] }];
    const items = [
      [c.kalpk || 0, 'kalp kavanoza düştü'],
      [(c.kucak || 0) + (c.selam || 0), 'uzaktan sarılma ve selam'],
      [c.tsmesaj || 0, 'sesli mesaj'],
      [(c.kare || 0) + (c.postcard || 0), 'kare ve kartpostal'],
    ];
    const nz = items.filter((x) => x[0]);
    if (nz.length) out.push({ t: 'sayi', title: 'Bu ayın sayıları', items: nz });
    const ph = m.photos;
    const pick = ph.length <= 10 ? ph : Array.from({ length: 10 }, (_, i) => ph[Math.floor((i * ph.length) / 10)]);
    const notes = m.notes.filter((x) => x.text.length > 6 && x.text.length < 180);
    const nPick = notes.length <= 4 ? notes : [0, 1, 2, 3].map((i) => notes[Math.floor((i * notes.length) / 4)]);
    const vids = anlar.slice(0, 6);
    // Fotoğraf, yazı ve klipleri harmanla
    let pi = 0, ni = 0, vi = 0;
    while (pi < pick.length || ni < nPick.length || vi < vids.length) {
      for (let k = 0; k < 3 && pi < pick.length; k++, pi++) {
        const p = pick[pi];
        out.push({ t: 'foto', src: p.thumb, full: p.full, caption: p.text ? p.text.slice(0, 90) : p.label, sub: `${T.fmt(p.day)} · ${cityOf(p.who)} · ${nameOf(p.who)}` });
      }
      if (ni < nPick.length) {
        const x = nPick[ni++];
        out.push({ t: 'yazi', text: x.text, by: `${x.label} · ${nameOf(x.who)}` });
      }
      if (vi < vids.length) {
        const v = vids[vi++];
        out.push({ t: 'video', vid: v.data.vid, caption: v.data.text || '', by: `${T.fmt(v.data.day)} · ${cityOf(v.who)}` });
      }
    }
    if (m.voices.length) {
      const v = m.voices[K.hash(ym) % m.voices.length];
      out.push({ t: 'ses', audio: v.audio, by: `${nameOf(v.who)} telesekreterde`, text: T.fmt(T.key(T.baku(new Date(v.at)))) });
    }
    const [y, mo] = ym.split('-').map(Number);
    const next = `${mo === 12 ? y + 1 : y}-${String((mo % 12) + 1).padStart(2, '0')}`;
    out.push({ t: 'kapanis', text: out.length > 2 ? 'Bu ay da birbirimizi seçtik.' : 'Bu ayın sahneleri henüz çekiliyor.', sub: `Gelecek bölüm: ${K.arsiv.monthName(next)}` });
    return out;
  }
  async function watch(ym, btn) {
    btn && (btn.disabled = true);
    const sc = await scenes(ym);
    btn && (btn.disabled = false);
    const n = epNo(ym);
    K.belgesel.play(sc, {
      mood: MOODS[n % MOODS.length],
      label: `Belgesel · ${K.arsiv.monthName(ym)}`,
      onEnd: async (done) => {
        if (!done || ym === nowYm()) return;
        K.store.set('belgeselGordu', [...new Set([...K.store.get('belgeselGordu', []), ym])].slice(-24));
        if (watched(ym, mine())) return;
        const r = await K.cloud.add('belgeselizle', { ym });
        r && !seen.some((x) => x.id === r.id) && seen.push(r);
        K.stickers.award('belgesel');
        render();
      },
    });
  }
  async function poster(ym) {
    if (posters[ym]) return posters[ym];
    const m = await K.arsiv.month(ym);
    posters[ym] = m.photos.slice(-4).map((p) => p.thumb);
    return posters[ym];
  }
  async function render() {
    if (!root || K.activeRoom !== 'belgesel') return;
    if (!loaded) return (K.$('#bgBolumler', root).innerHTML = '<p class="muted center">Arşiv taranıyor...</p>');
    const list = months.slice().reverse();
    K.$('#bgBolumler', root).innerHTML = list
      .map((ym) => {
        const live = ym === nowYm();
        const me = watched(ym, mine()), o = watched(ym, mine() === 'me' ? 'her' : 'me');
        return `<article class="bgr-bolum ${live ? 'canli' : ''} ${!live && !me ? 'yeni' : ''}"><div class="bgr-afis" data-bgr-afis="${ym}"></div><div class="bgr-bilgi"><small>Bölüm ${epNo(ym)}${live ? ' · çekimler sürüyor' : !me ? ' · yeni' : ''}</small><b>${K.esc(K.arsiv.monthName(ym))}</b><span>${me ? '✓ İzledin' : ''}${o ? ` ${me ? '·' : ''} ${K.esc(nameOf(mine() === 'me' ? 'her' : 'me'))} izledi` : ''}</span></div><button type="button" class="btn ${live ? 'soft' : 'red'} small" data-bgr="${ym}">▶ ${live ? 'Önizle' : 'İzle'}</button></article>`;
      })
      .join('');
    for (const ym of list.slice(0, 12)) {
      const th = await poster(ym);
      const el = K.$(`[data-bgr-afis="${ym}"]`, root);
      if (el) el.innerHTML = th.length ? th.map((t) => `<img src="${t}" alt="">`).join('') : `<span>${A.icon('film')}</span>`;
    }
  }
  async function load() {
    if (!K.arsiv) return;
    [months, seen] = await Promise.all([K.arsiv.months(), K.cloud.list('belgeselizle', 300)]);
    loaded = true;
    render();
  }
  // Ay bitince yeni bölüm haberi (ayın ilk beş günü, izlenene kadar)
  const prevYm = () => {
    const p = T.baku();
    return p.mo === 1 ? `${p.y - 1}-12` : `${p.y}-${String(p.mo - 1).padStart(2, '0')}`;
  };
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.cloud || !K.cloud.enabled || !K.arsiv || T.baku().d > 5 || K.store.get('belgeselGordu', []).includes(prevYm())) return [];
    return [{ key: 'belgesel', icon: 'film', title: `🎬 Zaman Tüneli: ${K.arsiv.monthName(prevYm())} bölümü yayında`, text: 'Geçen ayın kareleri, sesleri ve cümleleri tek bir müzikli belgeselde.', room: 'belgesel', cta: 'İzle' }];
  });
  K.on('cloud', (ok) => ok && K.cloud.on('belgeselizle', (r) => seen.some((x) => x.id === r.id) || (seen.push(r), render())));
  K.room({
    id: 'belgesel',
    wing: 'anilar',
    title: 'Zaman Tüneli Belgeseli',
    sub: 'Her ay yeni bir bölüm',
    icon: 'film',
    color: '#E6DDF5',
    hidden: () => !K.cloud || !K.cloud.enabled || !K.belgesel,
    badge: () => (T.baku().d <= 10 && !K.store.get('belgeselGordu', []).includes(prevYm()) ? 'Yeni bölüm' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kalenin kendi belgeseli. Her ayın kareleri, kavanoz notları, sesleri ve On Saniyelik Anlar'ı müzikli bir bölüme dönüşür. Ay bitince bölüm yayına girer; içinde bulunduğumuz ayı önizleyebilirsin.</p></div><div class="bgr-liste" id="bgBolumler"></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-bgr]');
        b && watch(b.dataset.bgr, b);
      });
    },
    enter() {
      render();
      load();
    },
  });
  K.zamantuneli = { scenes, watch };
})();
