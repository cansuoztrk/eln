/* Oda: Biniş Kartı — kumbara dolup bilet alındığında kale sahibi uçuşu panelden girer ('flight' kaydı).
   Onun kalesine bir biniş kartı düşer: ilk açılışta zarftan çıkar, sonra geri sayım.
   Uçuş günü uçak haritada gerçek saate göre ilerler ("Ardoş şu an Gürcistan üstünde"), inince kutlama.
   O da "Kapıda bekliyorum" der ('flightack'). Uçuş sürerken ana salondaki çip de uçağı gösterir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], acks = [], tick = null;
  const BK = () => D.bilet || {};
  const cur = () => {
    const r = rows.filter((x) => x.who === 'me').pop();
    return r && r.data && r.data.date ? Object.assign({ id: r.id }, r.data) : null;
  };
  const SAMPLE = { id: 'ornek', date: '2027-01-20', dep: '09:40', arr: '13:25', from: 'IST', no: 'TK 332', seat: '7A', back: '2027-01-27', sample: true };

  /* ---------- Zaman ---------- */
  const at = (date, hm, tz) => {
    const [y, m, d] = date.split('-').map(Number);
    const [h, mi] = (hm || '12:00').split(':').map(Number);
    return Date.UTC(y, m - 1, d, h, mi) - tz * 3600e3;
  };
  function times(f) {
    const dep = at(f.date, f.dep, C.tzIstanbul);
    let arr = at(f.date, f.arr || f.dep, C.tzBaku);
    if (arr <= dep) arr += 864e5;
    return { dep, arr };
  }
  // before → board (kalkıştan 3 saat önce) → air → landed (12 saat) → together (dönüşe kadar) → after
  function phase(f) {
    const { dep, arr } = times(f);
    const now = T.now().getTime();
    const back = f.back ? at(f.back, '23:59', C.tzBaku) : arr + 3 * 864e5;
    if (now < dep - 3 * 3600e3) return { k: 'before', dep, arr, left: dep - now };
    if (now < dep) return { k: 'board', dep, arr, left: dep - now };
    if (now < arr) return { k: 'air', dep, arr, q: (now - dep) / (arr - dep), left: arr - now };
    if (now < arr + 12 * 3600e3) return { k: 'landed', dep, arr };
    if (now < back) return { k: 'together', dep, arr };
    return { k: 'after', dep, arr };
  }
  const OVER = [
    [0.08, 'İstanbul\'dan yükseliyor'],
    [0.5, 'Anadolu\'nun üstünde'],
    [0.68, 'Gürcistan\'ın üstünde'],
    [0.9, 'Azerbaycan semalarında'],
    [1.01, 'Bakü\'ye alçalıyor'],
  ];
  const over = (q) => OVER.find(([t]) => q < t)[1];
  const hm = (ms, tz) => {
    const p = T.parts(tz, new Date(ms));
    return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`;
  };
  const span = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  };
  const fromName = (f) => (f.from === 'SAW' ? 'Sabiha Gökçen' : 'İstanbul Havalimanı');

  /* ---------- Biniş kartı ---------- */
  function barcode(seed) {
    const rnd = K.rng(seed);
    let x = 0, out = '';
    while (x < 150) {
      const w = 1 + Math.floor(rnd() * 3.2);
      if (rnd() > 0.35) out += `<rect x="${x}" y="0" width="${w}" height="34"/>`;
      x += w + 1;
    }
    return `<svg class="bk-bar" viewBox="0 0 150 34" aria-hidden="true" preserveAspectRatio="none">${out}</svg>`;
  }
  function pass(f) {
    const seed = Array.from(String(f.no || f.date)).reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 99991;
    const days = f.back ? T.dayNumber(T.at(f.back)) - T.dayNumber(T.at(f.date)) : 0;
    return `<article class="bk-pass ${f.sample ? 'sample' : ''}" aria-label="Biniş kartı">
      <header><span class="bk-air">${A.icon('bow')}<b>Kale Havayolları</b></span><span class="bk-bp">BİNİŞ KARTI · BOARDING PASS</span></header>
      <div class="bk-main">
        <div class="bk-route">
          <div><small>${K.esc(fromName(f))}</small><b>${K.esc(f.from || 'IST')}</b><span>İstanbul</span></div>
          <span class="bk-planeic" aria-hidden="true">${A.icon('plane')}</span>
          <div class="r"><small>Heydər Əliyev</small><b>GYD</b><span>Bakı</span></div>
        </div>
        <dl class="bk-grid">
          <div><dt>Yolcu</dt><dd>${K.esc((C.myPet || C.myName).toLocaleUpperCase('tr-TR'))}</dd></div>
          <div><dt>Tarih</dt><dd>${K.esc(T.fmt(f.date))}</dd></div>
          <div><dt>Kalkış</dt><dd class="tnum">${K.esc(f.dep || '—')} <small>İST</small></dd></div>
          <div><dt>Varış</dt><dd class="tnum">${K.esc(f.arr || '—')} <small>BAKÜ</small></dd></div>
          <div><dt>Uçuş</dt><dd>${K.esc(f.no || '—')}</dd></div>
          <div><dt>Koltuk</dt><dd>${K.esc(f.seat || 'Cam kenarı')}</dd></div>
          <div class="wide"><dt>Seyahat sebebi</dt><dd class="hand">${K.esc(C.herPet || C.herName)}</dd></div>
          <div class="wide"><dt>Kapı</dt><dd>${K.esc(K.fill(BK().gate || 'Onun kollarının arası'))}</dd></div>
        </dl>
      </div>
      <footer class="bk-stub">${barcode(seed)}<span>${days > 0 ? `${days} gün birlikte` : 'Tek yön: kalbine'}${f.back ? ` · dönüş ${K.esc(T.fmt(f.back))}` : ''}</span></footer>
      ${f.sample ? '<span class="bk-sample">ÖRNEK</span>' : ''}
    </article>`;
  }

  /* ---------- Canlı harita ---------- */
  function map(q, k) {
    const a = [26, 74], b = [298, 60], ctl = [150, 0];
    const pt = (t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ctl[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ctl[1] + t * t * b[1]];
    const qq = K.clamp(q, 0, 1);
    const [x, y] = pt(qq);
    const [x2, y2] = pt(Math.min(1, qq + 0.01));
    const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    const done = Array.from({ length: 41 }, (_, i) => pt((i / 40) * qq)).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    return `<svg class="bk-map" viewBox="0 0 320 110" role="img" aria-label="İstanbul'dan Bakü'ye uçuş, yolun yüzde ${Math.round(qq * 100)}'ü">
      <path d="M0 18 C40 10 80 22 118 14 C150 8 170 18 196 12 L196 0 L0 0 Z" fill="#BFE6FF" opacity=".7"/>
      <text x="92" y="11" class="bk-geo sea">Karadeniz</text>
      <path d="M296 20 C302 50 300 80 306 110 L320 110 L320 0 L300 0 Z" fill="#BFE6FF" opacity=".7"/>
      <text x="314" y="56" class="bk-geo sea" transform="rotate(90 314 56)">Hazar</text>
      <text x="110" y="96" class="bk-geo">Anadolu</text><text x="214" y="30" class="bk-geo">Gürcistan</text><text x="244" y="92" class="bk-geo">Azerbaycan</text>
      <path d="M${a[0]} ${a[1]} Q${ctl[0]} ${ctl[1]} ${b[0]} ${b[1]}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="3 6" opacity=".35"/>
      <path d="${done}" fill="none" stroke="#E3174D" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${a[0]}" cy="${a[1]}" r="6" fill="#4FA3E3" stroke="#fff" stroke-width="2"/><text x="${a[0]}" y="${a[1] + 20}" text-anchor="middle" class="bk-city">İstanbul</text>
      <circle cx="${b[0]}" cy="${b[1]}" r="${k === 'landed' || k === 'together' ? 9 : 6}" fill="#E3174D" stroke="#fff" stroke-width="2" class="${k === 'landed' ? 'bk-pulse' : ''}"/><text x="${b[0] - 4}" y="${b[1] + 22}" text-anchor="middle" class="bk-city">Bakü</text>
      ${k === 'landed' || k === 'together' || k === 'after' ? '' : `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})" class="${k === 'air' ? 'bk-flying' : ''}"><path d="M-12 0 L10 0 M-2 0 L-8 -9 M-2 0 L-8 9 M-12 0 L-15 -4 M-12 0 L-15 4" stroke="#4A2138" stroke-width="3.5" stroke-linecap="round"/><path d="M10 0 L14 0" stroke="#E3174D" stroke-width="4" stroke-linecap="round"/></g>`}
    </svg>`;
  }

  /* ---------- Durum ---------- */
  function status(f, ph) {
    const me = K.isOwner();
    const nm = me ? 'Sen' : C.myPet;
    const c = span(ph.left || 0);
    const cells = (s) => `<div class="bk-count tnum">${s.d ? `<span><b>${s.d}</b>gün</span>` : ''}<span><b>${String(s.h).padStart(2, '0')}</b>saat</span><span><b>${String(s.m).padStart(2, '0')}</b>dk</span><span><b>${String(s.s).padStart(2, '0')}</b>sn</span></div>`;
    switch (ph.k) {
      case 'before':
        return `<p class="card-eyebrow">Kalkışa</p>${cells(c)}<p class="muted small">Kalkış İstanbul saatiyle ${K.esc(f.dep)} · Bakü'ye varış ${K.esc(hm(ph.arr, C.tzBaku))}</p>`;
      case 'board':
        return `<p class="card-eyebrow">${me ? 'Havalimanı vakti' : `${K.esc(C.myPet)} havalimanında`}</p>${cells(c)}<p class="hand">${K.esc(K.fill(BK().board || 'Valiz hazır, kalp hazır. Kapı açılmak üzere.'))}</p>`;
      case 'air':
        return `<p class="card-eyebrow">${me ? 'Uçuştasın' : `${K.esc(C.myPet)} şu an havada`}</p>
          <p class="bk-over"><b>${K.esc(over(ph.q))}</b> · %${Math.round(ph.q * 100)}</p>${cells(c)}<p class="muted small">Tahmini iniş Bakü saatiyle ${K.esc(hm(ph.arr, C.tzBaku))}. ${f.no ? `<a href="https://www.flightradar24.com/data/flights/${encodeURIComponent(String(f.no).replace(/\s+/g, '').toLowerCase())}" target="_blank" rel="noopener">Gerçek uçağı izle</a>` : ''}</p>`;
      case 'landed':
        return `<p class="card-eyebrow">İndi</p><p class="bk-big">${K.esc(nm)} Bakü'de.</p><p class="hand">${K.esc(K.fill(BK().landed || 'Ekranlar bitti. Kapıya bak.'))}</p>`;
      case 'together':
        return `<p class="card-eyebrow">Aynı şehirde</p><p class="bk-big">${K.esc(K.fill(BK().together || 'Şu an aynı gökyüzünün altındayız. Telefonu bırak.'))}</p>`;
      default:
        return `<p class="card-eyebrow">Bir sonraki bilete kadar</p><p class="hand">${K.esc(K.fill(BK().after || 'Bu kart artık bir hatıra. Kumbarayı yeniden doldurmaya başlıyoruz.'))}</p>`;
    }
  }

  function render() {
    if (!root) return;
    const f = cur() || (K.isOwner() ? SAMPLE : null);
    if (!f) return;
    const ph = phase(f);
    K.$('#bkPass', root).innerHTML = pass(f);
    K.$('#bkMap', root).innerHTML = map(ph.k === 'air' ? ph.q : ph.k === 'before' || ph.k === 'board' ? 0 : 1, ph.k);
    K.$('#bkStatus', root).innerHTML = status(f, ph);
    K.$('#bkNote', root).innerHTML = f.sample
      ? `<p class="muted small">Bu bir örnek. Bileti alınca <a href="#panel">Kale Paneli → Biniş Kartı</a>'ndan uçuşu gir; onun kalesinde gerçek kart zarfıyla açılır.</p>`
      : f.note
      ? `<p class="hand">"${K.esc(f.note)}" <small>— ${K.esc(C.myPet)}</small></p>`
      : '';
    const mine = acks.filter((r) => r.data.flight === f.id);
    K.$('#bkAck', root).innerHTML = K.isOwner()
      ? mine.length
        ? `<ul class="bk-acks">${mine.map((r) => `<li>${A.icon('heart')}<span><b>${K.esc(C.herPet)}:</b> ${K.esc(r.data.text || 'Kapıda bekliyorum.')}</span></li>`).join('')}</ul>`
        : f.sample
        ? ''
        : `<p class="muted small">${K.esc(C.herPet)} kartı ${K.store.get('bkSeenBy') ? 'gördü' : 'henüz cevaplamadı'}.</p>`
      : mine.length
      ? `<p class="bk-acked">${A.icon('heart')} "${K.esc(mine[mine.length - 1].data.text || 'Kapıda bekliyorum.')}" dedin. Kapıda olacaksın.</p>`
      : `<form class="bk-ackf" id="bkAckForm" autocomplete="off"><p class="card-eyebrow">Ona bir cevap</p><input class="input" id="bkAckText" name="bkAckText" maxlength="120" placeholder="Kapıda bekliyorum. Elimde..."><button class="btn red small" type="submit">${A.ui('heart')} Kapıda bekleyeceğim</button></form>`;
  }

  /* ---------- İlk görüş: zarftan çıkan kart ---------- */
  function reveal(f, preview) {
    if (K.$('.bk-rev')) return;
    const el = K.el(`<div class="bk-rev" role="dialog" aria-modal="true" aria-label="Biniş kartı">
      <p class="bk-rev-top">${K.esc(K.fill(BK().revealTop || 'Kale Havayolları\'ndan bir zarf'))}</p>
      <button class="bk-env no-burst" type="button" aria-label="Zarfı aç"><span class="bk-flap"></span><span class="bk-seal">${A.icon('heart')}</span><span class="bk-card">${pass(f)}</span></button>
      <p class="bk-rev-hint">Zarfa dokun</p>
      <div class="bk-rev-text" hidden><p>${K.esc(K.fill(BK().revealLine || 'Kumbara doldu. Bilet alındı. {myPet} geliyor.'))}</p><p class="hand">${K.esc(T.fmt(f.date, true))}</p><button class="btn red big">Kartı gör</button></div>
    </div>`);
    document.body.appendChild(el);
    document.body.classList.add('has-modal');
    K.$('.bk-env', el).addEventListener('click', () => {
      if (el.classList.contains('open')) return;
      el.classList.add('open');
      K.audio.sfx.chime();
      K.vibrate([30, 50, 30, 50, 120]);
      setTimeout(() => {
        K.fx.confetti({ count: 200, shapes: ['heart', 'star', 'bow'], colors: ['#E3174D', '#FF8FB8', '#8FD3FF', '#FFD34E'] });
        K.$('.bk-rev-text', el).hidden = false;
      }, 900);
      if (!preview) {
        K.store.set('bkSeen', f.id);
        K.stickers.award('bilet');
        K.notify(`${C.herName} biniş kartını açtı`, `${T.fmt(f.date)} uçuşunun kartını gördü.`, ['airplane', 'heart']);
      }
    });
    K.$('.bk-rev-text .btn', el).addEventListener('click', () => {
      el.classList.add('out');
      setTimeout(() => {
        el.remove();
        document.body.classList.remove('has-modal');
        if (!preview && K.activeRoom !== 'bilet') location.hash = 'bilet';
      }, 500);
    });
  }
  function maybeReveal() {
    const f = cur();
    if (!f || K.isOwner() || K.store.get('bkSeen') === f.id) return;
    if (document.body.classList.contains('has-modal')) return setTimeout(maybeReveal, 4000);
    const ph = phase(f);
    if (ph.k === 'after') return;
    reveal(f);
  }

  K.bilet = {
    get: cur,
    reveal: (f, preview) => reveal(f || cur() || SAMPLE, preview),
    // Ona göre ana salondaki çip: uçuş günü uçağı gösterir
    where() {
      const f = cur();
      if (!f) return null;
      const ph = phase(f);
      if (ph.k === 'board') return { state: 'soon', room: 'bilet', chipIcon: 'plane', text: `${C.myPet} havalimanında`, chipSub: `kalkış ${f.dep}` };
      if (ph.k === 'air') return { state: 'class', room: 'bilet', chipIcon: 'plane', text: `${C.myPet} uçakta`, chipSub: over(ph.q) };
      if (ph.k === 'landed') return { state: 'after', room: 'bilet', chipIcon: 'heart', text: `${C.myPet} Bakü'de`, chipSub: 'kapıya bak' };
      return null;
    },
  };

  K.on('cloud', async (on) => {
    if (!on) return;
    [rows, acks] = await Promise.all([K.cloud.list('flight'), K.cloud.list('flightack')]);
    K.cloud.on('flight', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (K.activeRoom === 'bilet') render();
      setTimeout(maybeReveal, 800);
      K.homeChip && K.homeChip();
    });
    K.cloud.on('flightack', (r) => {
      if (acks.some((x) => x.id === r.id)) return;
      acks.push(r);
      if (K.isOwner() && r.who === 'her') K.fx.toast(`<b>${K.esc(C.herPet)} biniş kartına cevap verdi:</b> ${K.esc(r.data.text || 'Kapıda bekliyorum.')}`, { icon: A.icon('plane'), duration: 9000 });
      if (K.activeRoom === 'bilet') render();
    });
    setTimeout(maybeReveal, 2500);
    clearInterval(tick);
    let lastK = '';
    tick = setInterval(() => {
      const f = cur();
      if (!f) return;
      if (K.activeRoom === 'bilet') render();
      const k = phase(f).k;
      if (k !== lastK) {
        if (lastK && k === 'landed' && !K.isOwner()) {
          K.fx.toast(`<b>${K.esc(C.myPet)} indi!</b> Bakü'de.`, { icon: A.icon('heart'), duration: 12000 });
          K.fx.confetti({ count: 240, shapes: ['heart', 'star'] });
        }
        lastK = k;
        K.homeChip && K.homeChip();
      }
    }, 1000);
  });

  K.room({
    id: 'bilet',
    wing: 'kalp',
    title: 'Biniş Kartı',
    sub: 'İstanbul → Bakü: bilet alındı',
    icon: 'plane',
    color: '#DDF1FF',
    hidden: () => !K.cloud || !K.cloud.enabled || (!cur() && !K.isOwner()),
    badge: () => {
      const f = cur();
      if (!f) return '';
      const ph = phase(f);
      if (ph.k === 'air') return 'Havada!';
      if (ph.k === 'landed' || ph.k === 'together') return 'Bakü\'de';
      if (ph.k === 'after') return '';
      const d = T.daysUntil(f.date);
      return d > 0 ? `${d} gün` : 'Bugün';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(BK().intro || [])}</div>
        <div id="bkPass"></div>
        <section class="card bk-live"><div id="bkStatus"></div><div id="bkMap"></div></section>
        <div id="bkNote"></div>
        <div id="bkAck"></div>`;
      el.addEventListener('submit', async (e) => {
        if (e.target.id !== 'bkAckForm') return;
        e.preventDefault();
        const f = cur();
        if (!f) return;
        const text = K.$('#bkAckText', el).value.trim();
        const r = await K.cloud.add('flightack', { flight: f.id, text });
        if (!r) return K.fx.toast('Gönderilemedi. İnterneti kontrol et.');
        K.audio.sfx.chime();
        K.fx.confetti({ count: 90, shapes: ['heart'] });
        K.notify(`${C.herName} biniş kartına cevap verdi`, text || 'Kapıda bekliyorum.', ['airplane', 'heart'], { priority: 5 });
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
