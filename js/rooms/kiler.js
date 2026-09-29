/* Oda: Kilerdeki Kapı — sevdiği bir hikâyeye selam. Kilerin arkasındaki basamaktan inen, ilişkimizin istediği gününe gider:
   o günün olayı, o gecenin gökyüzü, ayı, sorusu, notu ve o gün kalede ne yaptığı. Geleceğe kapı açılmaz; kilometre taşları mühürlüdür. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, month = null, day = null;
  const KI = () => D.kiler || { intro: [], future: [], timeline: [], milestones: [] };
  const today = () => T.todayKey();
  const ym = (key) => key.slice(0, 7);
  const addMonth = (m, n) => {
    const [y, mo] = m.split('-').map(Number);
    const d = new Date(Date.UTC(y, mo - 1 + n, 1));
    return `${d.getUTCFullYear()}-${K.pad(d.getUTCMonth() + 1)}`;
  };
  const lastMonth = () => ym(C.firstAnniversary || today());

  /* ---------- Yolculuk efekti ---------- */
  function warp(label, done) {
    const el = K.el(`<div class="kl-warp" aria-hidden="true"><div class="kl-clock"><i class="h"></i><i class="m"></i></div><p>${K.esc(label)}</p></div>`);
    document.body.appendChild(el);
    K.audio.sfx.whoosh();
    K.vibrate([20, 40, 20]);
    setTimeout(() => {
      done && done();
      el.classList.add('out');
      setTimeout(() => el.remove(), 600);
    }, K.reduced ? 300 : 1500);
  }

  /* ---------- Takvim ---------- */
  function renderCal() {
    const [y, mo] = month.split('-').map(Number);
    const first = new Date(Date.UTC(y, mo - 1, 1));
    const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    const ev = new Set(KI().timeline.map((t) => t.date));
    const ms = new Set(KI().milestones.map((t) => t.date));
    const visits = new Set(K.store.get('visits', []));
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<span></span>');
    for (let d = 1; d <= days; d++) {
      const key = `${month}-${K.pad(d)}`;
      const before = key < C.metDate, future = key > today();
      const cls = [before ? 'off' : '', future ? 'future' : '', ev.has(key) ? 'ev' : '', ms.has(key) ? 'ms' : '', visits.has(key) ? 'vis' : '', key === today() ? 'now' : '', key === day ? 'sel' : ''].join(' ');
      cells.push(`<button class="kl-d ${cls}" data-day="${key}" ${before ? 'disabled' : ''} aria-label="${T.fmt(key)}">${d}</button>`);
    }
    K.$('#klCal', root).innerHTML = `
      <div class="kl-cal-head"><button class="icon-btn" data-mo="-1" ${month <= ym(C.metDate) ? 'disabled' : ''} aria-label="Önceki ay">${A.ui('back')}</button>
        <b>${K.MONTHS[mo - 1]} ${y}</b>
        <button class="icon-btn flip" data-mo="1" ${month >= lastMonth() ? 'disabled' : ''} aria-label="Sonraki ay">${A.ui('back')}</button></div>
      <div class="kl-wd">${['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="kl-days">${cells.join('')}</div>
      <p class="kl-legend"><span class="ev">Olay</span><span class="vis">Kaleye gelmişsin</span><span class="ms">Mühürlü gün</span></p>`;
  }

  /* ---------- O gün ---------- */
  function dayView(key) {
    const K5 = KI();
    const date = T.at(key);
    const dn = T.dayNumber(date);
    if (key > today()) {
      const m = K5.milestones.find((x) => x.date === key);
      const left = T.daysUntil(key);
      return `<article class="kl-page future">
        <p class="kl-date">${T.fmt(key, true)}</p>
        ${K.paras(K5.future)}
        ${m ? `<div class="kl-seal">${A.icon('lock')}<b>${K.esc(m.title)}</b><p>Bu günün notu mühürlü. ${K.num(left)} gün sonra, o sabah açılacak.</p></div>` : `<p class="muted">${K.num(left)} gün sonra. Henüz yazılmadı; birlikte yazacağız.</p>`}
      </article>`;
    }
    const met = dn - T.dayNumber(T.at(C.metDate));
    const tog = dn - T.dayNumber(T.at(C.togetherDate));
    const ev = K5.timeline.find((x) => x.date === key);
    const ms = K5.milestones.find((x) => x.date === key);
    const moon = A.moonPhase(new Date(date.getTime() + 22 * 3600e3));
    const q = D.questions && D.questions.length ? K.fill(D.questions[(dn + 11) % D.questions.length]) : '';
    const ans = Object.values(K.store.get('answers', {})).find((a) => a.date === key);
    const note = (K.noteOverride || {})[key] || (D.notes && D.notes.length ? D.notes[dn % D.notes.length] : '');
    const visited = K.store.get('visits', []).includes(key);
    const sky = K.skyPoster ? K.skyPoster({ id: 'kl', date: key, time: '22:00', place: 'baku', title: 'O gecenin gökyüzü', text: ev ? ev.title : ms ? ms.title : '' }) : '';
    return `<article class="kl-page">
      <p class="kl-date">${T.fmt(key, true)}</p>
      <p class="kl-count">${tog >= 0 ? `Sevgili olmamızın <b>${K.num(tog)}.</b> günü` : `Tanışmamızın <b>${K.num(met + 1)}.</b> günü`}${tog < 0 ? ` · sevgili olmamıza ${K.num(-tog)} gün var` : ''}</p>
      ${ev ? `<div class="kl-ev"><p class="card-eyebrow">O gün</p><h3>${K.esc(ev.title)}</h3><p>${K.esc(K.fill(ev.text))}</p></div>` : ''}
      ${ms ? `<div class="kl-ev ms"><p class="card-eyebrow">Mühürlü not açıldı</p><h3>${K.esc(ms.title)}</h3><p>${K.esc(K.fill(ms.text))}</p></div>` : ''}
      <div class="kl-bits">
        <div class="kl-bit"><p class="card-eyebrow">O gecenin ayı</p><div class="kl-moon">${A.moonSvg(moon.p, 40, 'skymoon')}</div><b>${K.esc(moon.name)}</b><small>%${Math.round(moon.illum * 100)} aydınlık</small></div>
        <div class="kl-bit"><p class="card-eyebrow">Kalede o gün</p><b>${visited ? 'Buradaydın' : key < (K.store.get('visits', [])[0] || today()) ? 'Kale henüz yoktu' : 'Uğramamışsın'}</b><small>${visited ? 'O gün de kalenin kapısını açmışsın.' : 'O gün kapıya kimse dokunmamış.'}</small></div>
      </div>
      ${note ? `<div class="kl-note"><p class="card-eyebrow">O günün notu</p><p class="hand">${K.esc(K.fill(note))}</p></div>` : ''}
      ${q ? `<div class="kl-q"><p class="card-eyebrow">O günün sorusu</p><p><b>${K.esc(q)}</b></p>${ans ? `<p class="hand">Senin cevabın: "${K.esc(ans.a)}"</p>` : ''}</div>` : ''}
      ${sky ? `<figure class="kl-sky">${sky}</figure>` : ''}
    </article>`;
  }
  function open(key) {
    day = key;
    month = ym(key);
    renderCal();
    K.$('#klDay', root).innerHTML = dayView(key);
    K.$('#klNav', root).hidden = false;
    K.$('#klPrev', root).disabled = key <= C.metDate;
    K.$('#klDay', root).scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
    const seen = K.store.get('klSeen', []);
    if (!seen.includes(key)) K.store.set('klSeen', seen.concat(key).slice(-400));
    if (seen.length + 1 >= 7) K.stickers.award('kiler');
  }
  const shift = (key, n) => T.key(T.baku(new Date(T.at(key).getTime() + n * 864e5 + 12 * 3600e3)));

  // Kasadaki gizli kod klavyede yazılınca kilere düşülür
  let buf = '';
  document.addEventListener('keydown', (e) => {
    if (!D.kiler || /input|textarea/i.test((e.target && e.target.tagName) || '')) return;
    const code = String(KI().code || '');
    buf = (buf + e.key).replace(/[^0-9]/g, '').slice(-Math.max(1, code.length));
    if (code && buf === code) {
      buf = '';
      warp('Geçmiş direnir...', () => (location.hash = 'kiler'));
    }
  });

  K.room({
    id: 'kiler',
    wing: 'zaman',
    title: 'Kilerdeki Kapı',
    sub: 'Basamaktan in, istediğin güne git',
    icon: 'door',
    color: '#F3E3CF',
    hidden: () => !D.kiler,
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="kl-pantry">
          <svg viewBox="0 0 360 220" aria-hidden="true">
            <rect width="360" height="220" rx="18" fill="#6E4A34"/>
            <rect x="12" y="12" width="336" height="196" rx="12" fill="#8A5E42"/>
            ${[60, 120, 180].map((y) => `<rect x="18" y="${y}" width="120" height="8" rx="3" fill="#5A3A28"/><rect x="222" y="${y}" width="120" height="8" rx="3" fill="#5A3A28"/>`).join('')}
            ${[[28, 30, '#FF8FB8'], [58, 34, '#FFD34E'], [92, 28, '#E3174D'], [232, 30, '#8FD3FF'], [266, 26, '#7ED6A5'], [300, 32, '#FF8FB8'], [30, 92, '#C9B6FF'], [70, 90, '#FFB3CE'], [240, 94, '#FFD34E'], [290, 88, '#FF8FB8'], [36, 150, '#7ED6A5'], [96, 152, '#FFD0E1'], [250, 150, '#E3174D'], [306, 154, '#8FD3FF']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><rect width="26" height="28" rx="5" fill="${c}" stroke="#3E271B" stroke-width="2.5"/><rect x="-2" y="-5" width="30" height="7" rx="2" fill="#F3E3CF" stroke="#3E271B" stroke-width="2.5"/></g>`).join('')}
            <g class="kl-door"><path d="M150 208 V78 A30 30 0 0 1 210 78 V208 Z" fill="#1C1330"/><path d="M160 208 L168 188 H192 L200 208 Z" fill="#2E2150"/><path d="M166 188 L172 172 H188 L194 188" fill="#3A2C66"/><circle class="kl-glow" cx="180" cy="120" r="28" fill="#FFF4C7" opacity=".16"/><text x="180" y="126" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="#FFF4C7" opacity=".8">${K.esc(KI().door || '')}</text></g>
          </svg>
        </div>
        <div class="kl-intro">${K.paras(KI().intro)}</div>
        <div class="actions" style="justify-content:center"><button class="btn red big" id="klGo">${A.icon('door')} Basamaktan in</button></div>
        <div class="kl-travel" id="klTravel" hidden>
          <div class="kl-jumps">
            <button class="chip" data-jump="${K.esc(C.metDate)}">Tanıştığımız gün</button>
            <button class="chip" data-jump="${K.esc(C.notesDate || C.metDate)}">A+E</button>
            <button class="chip" data-jump="${K.esc(C.togetherDate)}">Olalım</button>
            <button class="chip" data-jump="rand">Rastgele bir gün</button>
            <button class="chip" data-jump="year">Bir yıl önce bugün</button>
          </div>
          <div class="card kl-cal" id="klCal"></div>
          <div id="klDay"></div>
          <div class="actions kl-nav" id="klNav" hidden>
            <button class="btn soft small" id="klPrev">${A.ui('back')} Bir gün geri</button>
            <button class="btn soft small" id="klNext">Bir gün ileri</button>
            <button class="btn small" id="klBack">${A.icon('hourglass')} Şimdiki zamana dön</button>
          </div>
        </div>`;
      K.$('#klGo', el).addEventListener('click', () =>
        warp('Basamaktan iniliyor...', () => {
          K.$('#klTravel', el).hidden = false;
          K.$('#klGo', el).parentElement.hidden = true;
          open(C.metDate);
        })
      );
      el.addEventListener('click', (e) => {
        const d = e.target.closest('[data-day]');
        if (d) open(d.dataset.day);
        const mo = e.target.closest('[data-mo]');
        if (mo) {
          month = addMonth(month, +mo.dataset.mo);
          renderCal();
        }
        const j = e.target.closest('[data-jump]');
        if (j) {
          let key = j.dataset.jump;
          if (key === 'rand') {
            const span = T.daysSince(C.metDate);
            key = shift(C.metDate, Math.floor(Math.random() * (span + 1)));
          }
          if (key === 'year') {
            const p = T.baku();
            key = `${p.y - 1}-${K.pad(p.mo)}-${K.pad(p.d)}`;
            if (key < C.metDate) return K.fx.toast(`Bir yıl önce bugün henüz tanışmamıştık. Kilerin kapısı en fazla ${T.fmt(C.metDate)}'e iniyor.`, { icon: A.icon('door') });
          }
          warp(`${T.fmt(key)}...`, () => open(key));
        }
      });
      K.$('#klPrev', el).addEventListener('click', () => day > C.metDate && open(shift(day, -1)));
      K.$('#klNext', el).addEventListener('click', () => open(shift(day, 1)));
      K.$('#klBack', el).addEventListener('click', () =>
        warp('Şimdiki zamana dönülüyor...', () => {
          K.fx.toast('Hoş geldin. Burada sadece iki dakika geçti.', { icon: A.icon('hourglass') });
          location.hash = '';
        })
      );
    },
    enter() {
      month = month || ym(C.metDate);
    },
  });
})();
