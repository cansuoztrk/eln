/* Oda: Boğaz'dan Hazar'a — harita, iki saat, hava durumu, ay, "seni düşünüyorum" ve sarılma */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const C = window.ELN.config;
  const T = K.time;

  let root, raf, plane, path, pathLen;

  const WEATHER = (code) => {
    if (code === 0) return { t: 'Açık', ic: 'sun' };
    if (code <= 2) return { t: 'Parçalı bulutlu', ic: 'cloudsun' };
    if (code === 3) return { t: 'Bulutlu', ic: 'cloud' };
    if (code === 45 || code === 48) return { t: 'Sisli', ic: 'cloud' };
    if (code >= 51 && code <= 57) return { t: 'Çiseliyor', ic: 'rain', rain: true };
    if (code >= 61 && code <= 67) return { t: 'Yağmurlu', ic: 'rain', rain: true };
    if (code >= 71 && code <= 77) return { t: 'Karlı', ic: 'snow' };
    if (code >= 80 && code <= 82) return { t: 'Sağanak', ic: 'rain', rain: true };
    if (code >= 85 && code <= 86) return { t: 'Kar sağanağı', ic: 'snow' };
    if (code >= 95) return { t: 'Fırtınalı', ic: 'storm', rain: true };
    return { t: 'Değişken', ic: 'cloudsun' };
  };
  const WIC = {
    sun: '<circle cx="24" cy="24" r="10" fill="#FFD34E"/><g stroke="#FFB547" stroke-width="3" stroke-linecap="round"><path d="M24 4v5M24 39v5M4 24h5M39 24h5M10 10l3.5 3.5M34.5 34.5L38 38M10 38l3.5-3.5M34.5 13.5L38 10"/></g>',
    cloudsun: '<circle cx="18" cy="18" r="9" fill="#FFD34E"/><path d="M14 38h22a8 8 0 0 0 0-16 11 11 0 0 0-21 3 7 7 0 0 0-1 13z" fill="#fff" stroke="#C9B6FF" stroke-width="2.5"/>',
    cloud: '<path d="M12 36h24a9 9 0 0 0 0-18 12 12 0 0 0-23 4 7 7 0 0 0-1 14z" fill="#fff" stroke="#C9B6FF" stroke-width="2.5"/>',
    rain: '<path d="M12 30h24a9 9 0 0 0 0-18 12 12 0 0 0-23 4 7 7 0 0 0-1 14z" fill="#fff" stroke="#8FD3FF" stroke-width="2.5"/><g stroke="#4FC3D9" stroke-width="3" stroke-linecap="round"><path d="M16 36l-2 6M25 36l-2 6M34 36l-2 6"/></g>',
    snow: '<path d="M12 30h24a9 9 0 0 0 0-18 12 12 0 0 0-23 4 7 7 0 0 0-1 14z" fill="#fff" stroke="#C9B6FF" stroke-width="2.5"/><g fill="#8FD3FF"><circle cx="16" cy="39" r="2.5"/><circle cx="25" cy="42" r="2.5"/><circle cx="34" cy="39" r="2.5"/></g>',
    storm: '<path d="M12 28h24a9 9 0 0 0 0-18 12 12 0 0 0-23 4 7 7 0 0 0-1 14z" fill="#E6DCFF" stroke="#8F73E6" stroke-width="2.5"/><path d="M26 30l-6 9h6l-3 7 9-11h-6l3-5z" fill="#FFD34E"/>',
  };

  // Hava durumu (Open-Meteo, anahtarsız). 20 dk önbellek. Başarısız olursa null.
  async function weather() {
    const cached = K.store.get('weather');
    if (cached && Date.now() - cached.at < 20 * 60e3) return cached.data;
    try {
      const [b, i] = [C.coords.baku, C.coords.istanbul];
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${b[0]},${i[0]}&longitude=${b[1]},${i[1]}&current=temperature_2m,weather_code,wind_speed_10m,is_day&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('hava');
      const j = await res.json();
      const arr = Array.isArray(j) ? j : [j];
      const pick = (o) => ({ temp: Math.round(o.current.temperature_2m), code: o.current.weather_code, wind: Math.round(o.current.wind_speed_10m), sunrise: o.daily.sunrise[0].slice(11, 16), sunset: o.daily.sunset[0].slice(11, 16) });
      const data = { baku: pick(arr[0]), ist: pick(arr[1] || arr[0]) };
      K.store.set('weather', { at: Date.now(), data });
      return data;
    } catch (e) {
      return null;
    }
  }
  K.weather = weather;

  function clockSvg(id) {
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const r = i % 3 === 0 ? 5 : 2.8;
      return `<circle cx="${50 + Math.sin(a) * 38}" cy="${50 - Math.cos(a) * 38}" r="${r}" fill="${i % 3 === 0 ? '#FF6FA3' : '#F6C9DA'}"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 100" class="aclock" id="${id}" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#fff" stroke="#FFB3CE" stroke-width="5"/>${ticks}
      <line class="h" x1="50" y1="50" x2="50" y2="28" stroke="#4A2138" stroke-width="5" stroke-linecap="round"/>
      <line class="m" x1="50" y1="50" x2="50" y2="18" stroke="#4A2138" stroke-width="3.5" stroke-linecap="round"/>
      <line class="s" x1="50" y1="56" x2="50" y2="16" stroke="#E3174D" stroke-width="1.8" stroke-linecap="round"/>
      <g transform="translate(50 50) scale(.16)">${A.bowShape('#E3174D')}</g>
    </svg>`;
  }
  function setClock(id, p) {
    const svg = K.$('#' + id, root);
    if (!svg) return;
    const h = ((p.h % 12) + p.mi / 60) * 30;
    const m = (p.mi + p.s / 60) * 6;
    K.$('.h', svg).setAttribute('transform', `rotate(${h} 50 50)`);
    K.$('.m', svg).setAttribute('transform', `rotate(${m} 50 50)`);
    K.$('.s', svg).setAttribute('transform', `rotate(${p.s * 6} 50 50)`);
  }

  function mapSvg() {
    const mountains = Array.from({ length: 7 }, (_, i) => {
      const x = 246 + i * 11,
        y = 92 + (i % 2) * 6;
      return `<path d="M${x - 9} ${y + 12} L${x} ${y - 6} L${x + 9} ${y + 12} Z" fill="#E7C6D6"/><path d="M${x - 3.5} ${y + 1} L${x} ${y - 6} L${x + 3.5} ${y + 1} Z" fill="#fff"/>`;
    }).join('');
    return `<svg viewBox="0 0 400 240" class="lovemap" role="img" aria-label="İstanbul ile Bakü arasındaki uçuş yolu">
      <rect width="400" height="240" rx="22" fill="#FFF0F5"/>
      <path d="M58 72 C84 40 150 30 206 44 C246 54 266 70 256 94 C246 114 186 104 146 110 C104 116 74 112 64 98 Z" fill="#CFEAFF"/>
      <path d="M52 124 C44 128 48 142 68 140 C84 136 80 122 70 118 Z" fill="#CFEAFF"/>
      <path d="M330 26 C350 16 366 40 360 70 C356 96 372 118 368 150 C364 182 380 206 360 224 C340 234 328 212 334 186 C340 160 324 142 334 124 L344 124 C334 96 316 58 330 26 Z" fill="#CFEAFF"/>
      <text x="130" y="76" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#6A9AC4">Karadeniz</text>
      <text x="366" y="176" font-family="Fredoka, sans-serif" font-size="10" font-weight="600" fill="#6A9AC4" transform="rotate(80 366 176)">Hazar Denizi</text>
      ${mountains}
      <text x="262" y="128" font-family="Fredoka, sans-serif" font-size="9" font-weight="600" fill="#B58BA1">Kafkas Dağları</text>
      <text x="150" y="150" font-family="Fredoka, sans-serif" font-size="10" font-weight="500" fill="#C9A3B6">Türkiye</text>
      <text x="262" y="72" font-family="Fredoka, sans-serif" font-size="9" font-weight="500" fill="#C9A3B6">Gürcistan</text>
      <text x="282" y="196" font-family="Fredoka, sans-serif" font-size="9" font-weight="500" fill="#C9A3B6">Azerbaycan</text>
      <path id="flightPath" d="M66 118 Q200 8 338 126" fill="none" stroke="#FF8FB8" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>
      <g class="map-pin"><circle cx="66" cy="118" r="14" fill="#FF8FB8" opacity=".3" class="ping"/><circle cx="66" cy="118" r="7" fill="#FF6FA3" stroke="#fff" stroke-width="3"/></g>
      <g class="map-pin"><circle cx="338" cy="126" r="14" fill="#8FD3FF" opacity=".35" class="ping"/><circle cx="338" cy="126" r="7" fill="#4FC3D9" stroke="#fff" stroke-width="3"/></g>
      <g transform="translate(26 150)"><rect width="80" height="24" rx="6" fill="#4A2138"/><text x="40" y="16" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#fff">${K.esc(C.myNick)}</text></g>
      <g transform="translate(300 142)"><rect width="56" height="24" rx="6" fill="#E3174D"/><text x="28" y="16" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#fff">${K.esc(C.herNick)}</text></g>
      <g id="mapPlane"><g transform="scale(.55) translate(-32 -32)">${A.ICONS.plane}</g></g>
      <g id="mapHearts"></g>
    </svg>`;
  }

  function flyPlane() {
    if (!path) return;
    const t0 = performance.now();
    const step = (now) => {
      const t = ((now - t0) / 9000) % 1;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const L = e * pathLen;
      const p = path.getPointAtLength(L);
      const q = path.getPointAtLength(Math.min(pathLen, L + 1));
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      plane.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang + 16})`);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  // Bakü'den İstanbul'a uçan kalp
  function sendHeartOnMap() {
    if (!path) return;
    const g = K.$('#mapHearts', root);
    const h = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    h.setAttribute('d', 'M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z');
    h.setAttribute('fill', '#E3174D');
    g.appendChild(h);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 1600);
      const p = path.getPointAtLength((1 - t) * pathLen);
      h.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${0.9 + Math.sin(t * Math.PI) * 0.6})`);
      if (t < 1) requestAnimationFrame(step);
      else h.remove();
    };
    requestAnimationFrame(step);
  }

  function stats() {
    const km = C.distanceKm;
    const rows = [
      ['Kuş uçuşu', `${K.num(km)} km`],
      ['Uçakla', 'yaklaşık 2 sa 40 dk'],
      ['Yürüyerek', `${K.num(Math.round(km / 5 / 24))} gün (hiç durmadan)`],
      ['Adım adım', `~${K.num(Math.round((km * 1000) / 0.75 / 1e5) / 10)} milyon adım`],
      ['Işık hızıyla', `${(km / 299792.458 * 1000).toFixed(1).replace('.', ',')} milisaniye`],
      ['Kalbimle', '0 saniye'],
    ];
    return rows.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
  }

  async function fillWeather() {
    const box = K.$('.weather', root);
    const data = await weather();
    if (!data) {
      box.innerHTML = `<p class="muted">Hava durumu şu an alınamadı. Ama tahminim şu: Bakü'de rüzgâr, İstanbul'da özlem.</p>`;
      return;
    }
    const card = (city, w, isBaku) => {
      const info = WEATHER(w.code);
      let note = '';
      if (isBaku) {
        if (info.rain) note = 'Bakü\'de yağmur var! "Bakü\'de yağmur yağarken aç" mektubu şu an açık.';
        else if (w.wind >= 20) note = 'Rüzgârlar şehri yine iş başında; saçlarına dikkat.';
        else if (w.temp >= 28) note = 'Sıcak! Su içmeyi unutma, prenses.';
        else if (w.temp <= 5) note = 'Soğuk! Sıkı giyin, benim yerime atkın sarılsın.';
        else note = 'Bugün Bakü\'nün havası sana yakışmış.';
      } else {
        note = info.rain ? 'İstanbul\'da yağmur var; ben de şemsiyesiz seni düşünüyorum.' : `İstanbul'da güneş ${w.sunset}'da batıyor, Bakü'den bir saat sonra.`;
      }
      return `<div class="wcard"><svg viewBox="0 0 48 48" class="wic">${WIC[info.ic]}</svg>
        <div><p class="wcity">${city}</p><p class="wtemp">${w.temp}°<span>${info.t}</span></p><p class="wnote">${note}</p></div></div>`;
    };
    box.innerHTML = card(C.herCity, data.baku, true) + card(C.myCity, data.ist, false);
  }

  function moon() {
    const m = A.moonPhase(T.now());
    K.$('.moon-box', root).innerHTML = `${A.moonSvg(m.p, 44, 'big-moon')}
      <div><p class="card-eyebrow">Bu gece gökyüzü</p><h3>${m.name}</h3>
      <p>Ay'ın <b>%${Math.round(m.illum * 100)}</b>'i aydınlık. ${C.myCity}'dan da ${C.herCity}'den de aynı ay görünüyor; sadece sana bir saat önce doğuyor.</p></div>`;
  }

  /* "Seni düşünüyorum" ve sarılma */
  function initLove() {
    const thinkBtn = K.$('#thinkBtn', root);
    const today = T.todayKey();
    const state = () => K.store.get('think', { day: today, n: 0, total: 0 });
    const show = () => {
      const s = state();
      const n = s.day === today ? s.n : 0;
      K.$('#thinkCount', root).textContent = n ? `Bugün beni ${n} kez düşündün. Toplam: ${K.num(s.total)}.` : 'Bugün henüz basmadın.';
    };
    show();
    thinkBtn.addEventListener('click', async () => {
      const s = state();
      if (s.day !== today) {
        s.day = today;
        s.n = 0;
      }
      s.n++;
      s.total++;
      K.store.set('think', s);
      show();
      K.audio.sfx.pop();
      K.vibrate(30);
      thinkBtn.classList.remove('beat');
      requestAnimationFrame(() => thinkBtn.classList.add('beat'));
      const r = thinkBtn.getBoundingClientRect();
      K.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 12, power: 6, shapes: ['heart'] });
      sendHeartOnMap();
      if (K.canNotify()) {
        const ok = await K.notify(`${C.herName} seni düşünüyor`, `Bugün ${s.n}. kez. Kalbi Bakü'den İstanbul'a uçtu.`, ['heart', 'sparkles']);
        K.fx.toast(ok ? `Kalbin ${C.myCity}'a ulaştı, ${C.myName}'in telefonu titredi.` : 'Kalbin yola çıktı ama şu an ulaşamadı. Biraz sonra tekrar dene.', { icon: A.icon('heart') });
      }
    });

    // Basılı tut: 3 saniyelik sarılma
    const hug = K.$('#hugBtn', root);
    const ring = K.$('#hugRing', root);
    const label = K.$('#hugLabel', root);
    let start = 0,
      hr = null,
      done = false;
    const CIRC = 2 * Math.PI * 54;
    ring.style.strokeDasharray = CIRC;
    ring.style.strokeDashoffset = CIRC;
    const loop = (now) => {
      const t = Math.min(1, (now - start) / 3000);
      ring.style.strokeDashoffset = CIRC * (1 - t);
      if (t >= 1 && !done) {
        done = true;
        finishHug();
        return;
      }
      if (Math.floor(t * 10) !== Math.floor(((now - 16 - start) / 3000) * 10)) K.vibrate(15);
      hr = requestAnimationFrame(loop);
    };
    const down = (e) => {
      e.preventDefault();
      done = false;
      start = performance.now();
      hug.classList.add('holding');
      label.textContent = 'Sımsıkı...';
      K.audio.sfx.purr(3);
      hr = requestAnimationFrame(loop);
    };
    const up = () => {
      if (!hug.classList.contains('holding')) return;
      hug.classList.remove('holding');
      cancelAnimationFrame(hr);
      if (!done) {
        label.textContent = 'Daha uzun sarıl, bırakma...';
        ring.style.strokeDashoffset = CIRC;
      }
    };
    hug.addEventListener('pointerdown', down);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => hug.addEventListener(ev, up));
    hug.addEventListener('contextmenu', (e) => e.preventDefault());
    async function finishHug() {
      hug.classList.remove('holding');
      hug.classList.add('hugged');
      label.textContent = 'Sarıldık!';
      K.vibrate([60, 40, 60]);
      K.audio.sfx.chime();
      K.fx.confetti({ count: 70, shapes: ['heart'], colors: ['#FF6FA3', '#E3174D', '#FFB3CE'] });
      K.stickers.award('sarilma');
      K.store.set('hugs', K.store.get('hugs', 0) + 1);
      setTimeout(() => {
        hug.classList.remove('hugged');
        ring.style.strokeDashoffset = CIRC;
        label.textContent = 'Bir daha sarıl';
      }, 2600);
      if (K.canNotify()) {
        const ok = await K.notify(`${C.herName} sana sarıldı`, 'Üç saniye boyunca, sımsıkı. Şimdi sıra sende.', ['hugging_face']);
        if (ok) K.fx.toast(`Sarılman ${C.myCity}'a ulaştı.`, { icon: A.icon('hug') });
      }
    }
  }

  K.room({
    id: 'uzak',
    wing: 'hazine',
    title: 'Boğaz\'dan Hazar\'a',
    sub: `${K.num(C.distanceKm)} km, 1 saat, 1 kalp`,
    icon: 'map',
    color: '#D6F1FF',
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Aramızdaki mesafe haritada uzun görünüyor. Ama bak, küçük Kitty uçağı durmadan gidip geliyor.</p>
        <div class="map-card card">${mapSvg()}</div>
        <div class="clocks">
          <div class="clock-card card">${clockSvg('clkBaku')}<div><p class="card-eyebrow">${C.herCity}</p><p class="dclock tnum" id="dBaku"></p><p class="dsub" id="sBaku"></p></div></div>
          <div class="clock-card card">${clockSvg('clkIst')}<div><p class="card-eyebrow">${C.myCity}</p><p class="dclock tnum" id="dIst"></p><p class="dsub" id="sIst"></p></div></div>
        </div>
        <p class="future-line">Sen benden bir saat ileridesin. <span class="script">Yani sen benim geleceğimsin.</span></p>
        <div class="stats card">${stats()}</div>
        <div class="love-actions">
          <div class="card love-card">
            <p class="card-eyebrow">Seni düşünüyorum butonu</p>
            <button class="think-btn" id="thinkBtn" aria-label="Seni düşünüyorum">${A.ui('heart')}</button>
            <p class="love-note" id="thinkCount"></p>
            <p class="muted small">${K.canNotify() ? `Her bastığında ${C.myName}'in telefonuna bir kalp gider.` : 'Her bastığında haritada Bakü\'den İstanbul\'a bir kalp uçar.'}</p>
          </div>
          <div class="card love-card">
            <p class="card-eyebrow">Sanal sarılma</p>
            <button class="hug-btn no-burst" id="hugBtn" aria-label="Sarılmak için basılı tut">
              <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="#FFE1EC" stroke-width="10"/><circle id="hugRing" cx="60" cy="60" r="54" fill="none" stroke="#E3174D" stroke-width="10" stroke-linecap="round" transform="rotate(-90 60 60)"/></svg>
              <span class="hug-kitties">${A.kitty({ cls: 'is-happy' })}${A.angela({})}</span>
            </button>
            <p class="love-note" id="hugLabel">3 saniye basılı tut</p>
          </div>
        </div>
        <div class="card moon-box"></div>
        <h3 class="sub-h">İki şehrin havası</h3>
        <div class="weather"><p class="muted">Hava durumuna bakılıyor...</p></div>`;
      path = K.$('#flightPath', el);
      plane = K.$('#mapPlane', el);
      pathLen = path.getTotalLength();
      initLove();
      moon();
      fillWeather();
      K.on('tick', () => {
        if (K.activeRoom !== 'uzak') return;
        const b = T.baku(),
          i = T.ist();
        setClock('clkBaku', b);
        setClock('clkIst', i);
        K.$('#dBaku', root).textContent = `${K.pad(b.h)}:${K.pad(b.mi)}:${K.pad(b.s)}`;
        K.$('#dIst', root).textContent = `${K.pad(i.h)}:${K.pad(i.mi)}:${K.pad(i.s)}`;
        K.$('#sBaku', root).textContent = `${T.dayName(b)}, ${b.d} ${K.MONTHS[b.mo - 1]}`;
        K.$('#sIst', root).textContent = `${T.dayName(i)}, ${i.d} ${K.MONTHS[i.mo - 1]}`;
      });
    },
    enter() {
      if (!K.reduced) flyPlane();
    },
    leave() {
      cancelAnimationFrame(raf);
    },
  });
})();
