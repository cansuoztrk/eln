/* Oda: O Gecenin Gökyüzü — özel gecelerimizde Bakü'nün (ve İstanbul'un) gökyüzü, gerçek yıldız konumlarıyla hesaplanmış bir poster */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root, current = null;
  const RAD = Math.PI / 180;
  const PLACES = () => ({
    baku: { name: C.herCity, lat: C.coords.baku[0], lon: C.coords.baku[1], tz: C.tzBaku },
    istanbul: { name: C.myCity, lat: C.coords.istanbul[0], lon: C.coords.istanbul[1], tz: C.tzIstanbul },
  });

  // En parlak yıldızlar: ad, sağ açıklık (saat), dik açıklık (derece), kadir, renk
  const STARS = [
    ['Sirius', 6.752, -16.72, -1.46], ['Canopus', 6.399, -52.7, -0.74], ['Arcturus', 14.261, 19.18, -0.05, '#FFD9A8'], ['Vega', 18.616, 38.78, 0.03, '#DCEBFF'],
    ['Capella', 5.278, 46.0, 0.08, '#FFF1C9'], ['Rigel', 5.242, -8.2, 0.13, '#DCEBFF'], ['Procyon', 7.655, 5.22, 0.34], ['Betelgeuse', 5.919, 7.41, 0.5, '#FFB38A'],
    ['Altair', 19.846, 8.87, 0.76], ['Aldebaran', 4.599, 16.51, 0.86, '#FFB38A'], ['Antares', 16.49, -26.43, 0.96, '#FF8F7A'], ['Spica', 13.42, -11.16, 0.97, '#DCEBFF'],
    ['Pollux', 7.755, 28.03, 1.14, '#FFE2B0'], ['Fomalhaut', 22.961, -29.62, 1.16], ['Deneb', 20.69, 45.28, 1.25], ['Regulus', 10.14, 11.97, 1.35],
    ['Adhara', 6.977, -28.97, 1.5], ['Castor', 7.577, 31.89, 1.58], ['Shaula', 17.56, -37.1, 1.62], ['Bellatrix', 5.419, 6.35, 1.64],
    ['Elnath', 5.438, 28.61, 1.65], ['Alnilam', 5.604, -1.2, 1.69], ['Alnitak', 5.679, -1.94, 1.77], ['Mintaka', 5.533, -0.3, 2.23], ['Saiph', 5.796, -9.67, 2.06], ['Meissa', 5.585, 9.93, 3.39],
    ['Alioth', 12.9, 55.96, 1.76], ['Dubhe', 11.062, 61.75, 1.79], ['Merak', 11.031, 56.38, 2.37], ['Phecda', 11.897, 53.69, 2.44], ['Megrez', 12.257, 57.03, 3.31], ['Mizar', 13.399, 54.93, 2.23], ['Alkaid', 13.792, 49.31, 1.86],
    ['Mirfak', 3.405, 49.86, 1.79], ['Delta Per', 3.715, 47.79, 3.0], ['Algol', 3.136, 40.96, 2.12], ['Wezen', 7.14, -26.39, 1.84], ['Aludra', 7.402, -29.3, 2.45], ['Mirzam', 6.378, -17.96, 1.98],
    ['Kaus Australis', 18.403, -34.38, 1.85], ['Nunki', 18.921, -26.3, 2.05], ['Menkalinan', 5.992, 44.95, 1.9], ['Theta Aur', 5.995, 37.21, 2.6], ['Iota Aur', 4.95, 33.17, 2.69],
    ['Alhena', 6.629, 16.4, 1.92], ['Wasat', 7.335, 21.98, 3.53], ['Mebsuta', 6.732, 25.13, 3.06], ['Tejat', 6.383, 22.51, 2.87],
    ['Polaris', 2.53, 89.26, 1.98], ['Kochab', 14.845, 74.16, 2.08], ['Pherkad', 15.345, 71.83, 3.0], ['Zeta UMi', 15.734, 77.79, 4.3], ['Eps UMi', 16.766, 82.04, 4.2], ['Yildun', 17.537, 86.59, 4.35],
    ['Alphard', 9.46, -8.66, 1.98], ['Hamal', 2.12, 23.46, 2.0], ['Diphda', 0.727, -17.99, 2.04], ['Alpheratz', 0.14, 29.09, 2.06], ['Mirach', 1.162, 35.62, 2.06], ['Almach', 2.065, 42.33, 2.1],
    ['Rasalhague', 17.582, 12.56, 2.07], ['Denebola', 11.818, 14.57, 2.13], ['Zosma', 11.235, 20.52, 2.56], ['Chertan', 11.237, 15.43, 3.3], ['Algieba', 10.333, 19.84, 2.08], ['Adhafera', 10.278, 23.42, 3.4], ['Ras Elased', 9.764, 23.77, 2.98],
    ['Schedar', 0.675, 56.54, 2.24], ['Caph', 0.153, 59.15, 2.28], ['Gamma Cas', 0.945, 60.72, 2.15], ['Ruchbah', 1.43, 60.24, 2.68], ['Segin', 1.907, 63.67, 3.37],
    ['Sadr', 20.37, 40.26, 2.23], ['Gienah', 20.77, 33.97, 2.48], ['Delta Cyg', 19.75, 45.13, 2.87], ['Albireo', 19.512, 27.96, 3.05], ['Sheliak', 18.835, 33.36, 3.52], ['Sulafat', 18.982, 32.69, 3.24],
    ['Tarazed', 19.771, 10.61, 2.72], ['Alshain', 19.922, 6.41, 3.71], ['Eltanin', 17.943, 51.49, 2.24], ['Alphecca', 15.578, 26.71, 2.23], ['Izar', 14.75, 27.07, 2.37], ['Seginus', 14.535, 38.31, 3.0],
    ['Markab', 23.079, 15.21, 2.49], ['Scheat', 23.063, 28.08, 2.42], ['Algenib', 0.221, 15.18, 2.83], ['Menkar', 3.038, 4.09, 2.54], ['Dschubba', 16.006, -22.62, 2.29], ['Eps Sco', 16.836, -34.29, 2.29], ['Unukalhai', 15.738, 6.43, 2.63],
    ['Hyadum', 4.33, 15.63, 3.65], ['Ain', 4.477, 19.18, 3.53], ['Delta Tau', 4.382, 17.54, 3.76], ['Zeta Tau', 5.627, 21.14, 3.0],
    ['Ülker', 3.791, 24.11, 2.87, '#DCEBFF'],
  ];
  const IDX = Object.fromEntries(STARS.map((s, i) => [s[0], i]));
  // Takımyıldızlar: Türkçe adı, çizgileri, özel not
  const CONS = [
    { id: 'ori', name: 'Avcı (Orion)', lines: [['Betelgeuse', 'Meissa'], ['Meissa', 'Bellatrix'], ['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Betelgeuse', 'Alnitak'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Mintaka', 'Rigel'], ['Alnitak', 'Saiph']] },
    { id: 'tau', name: 'Boğa', mine: 'her', lines: [['Aldebaran', 'Hyadum'], ['Hyadum', 'Delta Tau'], ['Delta Tau', 'Ain'], ['Ain', 'Elnath'], ['Aldebaran', 'Zeta Tau']] },
    { id: 'sco', name: 'Akrep', mine: 'me', lines: [['Dschubba', 'Antares'], ['Antares', 'Eps Sco'], ['Eps Sco', 'Shaula']] },
    { id: 'cma', name: 'Büyük Köpek', dog: true, lines: [['Mirzam', 'Sirius'], ['Sirius', 'Adhara'], ['Adhara', 'Wezen'], ['Wezen', 'Aludra'], ['Sirius', 'Wezen']] },
    { id: 'uma', name: 'Büyük Ayı', lines: [['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']] },
    { id: 'umi', name: 'Küçük Ayı', lines: [['Polaris', 'Yildun'], ['Yildun', 'Eps UMi'], ['Eps UMi', 'Zeta UMi'], ['Zeta UMi', 'Kochab'], ['Kochab', 'Pherkad'], ['Pherkad', 'Zeta UMi']] },
    { id: 'cas', name: 'Kraliçe (Kassiopeia)', lines: [['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin']] },
    { id: 'cyg', name: 'Kuğu', lines: [['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Gienah', 'Sadr'], ['Sadr', 'Delta Cyg']] },
    { id: 'lyr', name: 'Çalgı', lines: [['Vega', 'Sheliak'], ['Sheliak', 'Sulafat'], ['Sulafat', 'Vega']] },
    { id: 'aql', name: 'Kartal', lines: [['Tarazed', 'Altair'], ['Altair', 'Alshain']] },
    { id: 'peg', name: 'Kanatlı At', lines: [['Markab', 'Scheat'], ['Scheat', 'Alpheratz'], ['Alpheratz', 'Algenib'], ['Algenib', 'Markab']] },
    { id: 'and', name: 'Andromeda', lines: [['Alpheratz', 'Mirach'], ['Mirach', 'Almach']] },
    { id: 'per', name: 'Perseus', lines: [['Delta Per', 'Mirfak'], ['Mirfak', 'Algol']] },
    { id: 'aur', name: 'Arabacı', lines: [['Capella', 'Menkalinan'], ['Menkalinan', 'Theta Aur'], ['Theta Aur', 'Elnath'], ['Elnath', 'Iota Aur'], ['Iota Aur', 'Capella']] },
    { id: 'gem', name: 'İkizler', lines: [['Castor', 'Mebsuta'], ['Mebsuta', 'Tejat'], ['Pollux', 'Wasat'], ['Wasat', 'Alhena'], ['Castor', 'Pollux']] },
    { id: 'leo', name: 'Aslan', lines: [['Regulus', 'Algieba'], ['Algieba', 'Adhafera'], ['Adhafera', 'Ras Elased'], ['Algieba', 'Zosma'], ['Zosma', 'Denebola'], ['Denebola', 'Chertan'], ['Chertan', 'Regulus']] },
    { id: 'boo', name: 'Çoban', lines: [['Arcturus', 'Izar'], ['Izar', 'Seginus'], ['Seginus', 'Arcturus']] },
    { id: 'plei', name: 'Ülker', lines: [], stars: ['Ülker'] },
  ];

  /* ---------------- Gökyüzü hesabı ---------------- */
  const jd = (ms) => ms / 864e5 + 2440587.5;
  function altAz(raDeg, decDeg, lstDeg, lat) {
    const H = (lstDeg - raDeg) * RAD;
    const d = decDeg * RAD;
    const p = lat * RAD;
    const alt = Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H));
    const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.cos(H) * Math.sin(p));
    return { alt: alt / RAD, az: ((az / RAD) % 360 + 360) % 360 };
  }
  // Ay'ın konumu (düşük hassasiyet, yaklaşık 1°)
  function moonRaDec(J) {
    const d = J - 2451545.0;
    const n = (x) => ((x % 360) + 360) % 360;
    const L = n(218.316 + 13.176396 * d), M = n(134.963 + 13.064993 * d), F = n(93.272 + 13.22935 * d), Dd = n(297.85 + 12.190749 * d), Ms = n(357.529 + 0.98560028 * d);
    const s = (x) => Math.sin(x * RAD);
    const lon = L + 6.289 * s(M) + 1.274 * s(2 * Dd - M) + 0.658 * s(2 * Dd) + 0.214 * s(2 * M) - 0.186 * s(Ms) - 0.114 * s(2 * F);
    const lat = 5.128 * s(F) + 0.281 * s(M + F) + 0.278 * s(M - F) + 0.173 * s(2 * Dd - F);
    const e = 23.4397 * RAD, l = lon * RAD, b = lat * RAD;
    const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)) / RAD;
    const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) / RAD;
    return { ra: n(ra), dec };
  }
  function sky(sk) {
    const pl = PLACES()[sk.place] || PLACES().baku;
    const [y, m, d] = sk.date.split('-').map(Number);
    const [hh, mi] = (sk.time || '21:00').split(':').map(Number);
    const ms = sk.ms || Date.UTC(y, m - 1, d, hh, mi) - pl.tz * 3600e3;
    const J = jd(ms);
    const lst = (280.46061837 + 360.98564736629 * (J - 2451545.0) + pl.lon) % 360;
    const stars = STARS.map((s) => Object.assign({ name: s[0], mag: s[3], color: s[4] }, altAz(s[1] * 15, s[2], lst, pl.lat)));
    const mo = moonRaDec(J);
    const moon = Object.assign({ phase: A.moonPhase(new Date(ms)) }, altAz(mo.ra, mo.dec, lst, pl.lat));
    return { pl, ms, stars, moon };
  }
  const DIRS = ['kuzeyde', 'kuzeydoğuda', 'doğuda', 'güneydoğuda', 'güneyde', 'güneybatıda', 'batıda', 'kuzeybatıda'];

  /* ---------------- Poster ---------------- */
  const W = 600, H = 860, CX = 300, CY = 318, R = 262;
  function proj(o) {
    const r = (R * (90 - o.alt)) / 90;
    return [CX - r * Math.sin(o.az * RAD), CY - r * Math.cos(o.az * RAD)];
  }
  function wrap(text, n) {
    const out = [];
    let line = '';
    for (const w of text.split(' ')) {
      if ((line + ' ' + w).trim().length > n) {
        out.push(line.trim());
        line = w;
      } else line += ' ' + w;
    }
    if (line.trim()) out.push(line.trim());
    return out;
  }
  function poster(sk) {
    const S = sky(sk);
    const p = K.time.baku(new Date(S.ms + (S.pl.tz - C.tzBaku) * 3600e3));
    const vis = (s) => s.alt > -1;
    const lines = [];
    const labels = [];
    const notes = [];
    for (const c of CONS) {
      const pts = [];
      for (const [a, b] of c.lines) {
        const sa = S.stars[IDX[a]], sb = S.stars[IDX[b]];
        if (!vis(sa) || !vis(sb)) continue;
        const [x1, y1] = proj(sa), [x2, y2] = proj(sb);
        lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${c.mine || c.dog ? 'cl-mine' : 'cl'}"/>`);
        pts.push(sa, sb);
      }
      (c.stars || []).forEach((n) => vis(S.stars[IDX[n]]) && pts.push(S.stars[IDX[n]]));
      if (!pts.length) continue;
      const alt = pts.reduce((a, s) => a + s.alt, 0) / pts.length;
      const xy = pts.map(proj);
      const lx = xy.reduce((a, q) => a + q[0], 0) / xy.length, ly = xy.reduce((a, q) => a + q[1], 0) / xy.length;
      const special = c.mine === 'her' ? ' · senin burcun' : c.mine === 'me' ? ' · benim burcum' : c.dog ? ` · ${C.herDog}` : '';
      labels.push(`<text x="${lx.toFixed(1)}" y="${(ly + 18).toFixed(1)}" class="${special ? 'cn-mine' : 'cn'}" text-anchor="middle">${K.esc(c.name + special)}</text>`);
      const az = xy.length ? pts.reduce((a, s) => a + s.az, 0) / pts.length : 0;
      notes.push({ c, alt, where: alt > 70 ? 'tam tepede' : DIRS[Math.round(az / 45) % 8] });
    }
    const starsSvg = S.stars
      .filter((s) => s.alt > 0)
      .map((s) => {
        const [x, y] = proj(s);
        const r = Math.max(0.9, 3.8 - s.mag * 0.85);
        const name = s.mag < 1.3 && s.name !== 'Ülker' ? `<text x="${(x + r + 3).toFixed(1)}" y="${(y + 3).toFixed(1)}" class="sn">${s.name}</text>` : '';
        const cluster = s.name === 'Ülker' ? [[-3, -2], [2, -3], [4, 1], [-1, 3], [1, 0]].map(([dx, dy]) => `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="1.1" fill="#DCEBFF"/>`).join('') : '';
        return `${cluster || `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${s.color || '#FFF7FB'}"${s.mag < 1 ? ' class="glow"' : ''}/>`}${name}`;
      })
      .join('');
    let moonSvg = '';
    if (S.moon.alt > 0) {
      const [mx, my] = proj(S.moon);
      moonSvg = A.moonSvg(S.moon.phase.p, 44).replace('class="moon', 'class="skymoon').replace('<svg ', `<svg x="${(mx - 13).toFixed(1)}" y="${(my - 13).toFixed(1)}" width="26" height="26" `) + `<text x="${(mx + 16).toFixed(1)}" y="${(my + 4).toFixed(1)}" class="sn">Ay</text>`;
    }
    const grid = [30, 60].map((a) => `<circle cx="${CX}" cy="${CY}" r="${((R * (90 - a)) / 90).toFixed(1)}" class="grid"/>`).join('');
    const title = sk.title;
    const when = `${p.d} ${K.MONTHS[p.mo - 1]} ${p.y} · ${K.pad(p.h)}:${K.pad(p.mi)} · ${S.pl.name}`;
    const coord = `${Math.abs(S.pl.lat).toFixed(2)}° K  ${Math.abs(S.pl.lon).toFixed(2)}° D`;
    const txt = wrap(K.fill(sk.text || ''), 60).slice(0, 4);
    const svg = `<svg class="skymap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${K.esc(title)}: yıldız haritası">
      <defs>
        <radialGradient id="skyG" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#2B2366"/><stop offset=".7" stop-color="#1A1440"/><stop offset="1" stop-color="#120E2E"/></radialGradient>
        <clipPath id="skyC"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
      </defs>
      <style>
        .cl{stroke:#9FB4FF;stroke-opacity:.38;stroke-width:1.1}
        .cl-mine{stroke:#FF8FB8;stroke-opacity:.95;stroke-width:1.8}
        .cn{fill:#B9C4FF;fill-opacity:.7;font:600 10.5px Nunito, sans-serif;letter-spacing:.06em}
        .cn-mine{fill:#FFB3CE;font:800 11.5px Nunito, sans-serif;letter-spacing:.04em}
        .sn{fill:#E9ECFF;fill-opacity:.8;font:600 9.5px Nunito, sans-serif}
        .grid{fill:none;stroke:#fff;stroke-opacity:.07;stroke-dasharray:2 5}
        .card{font-family:Nunito, sans-serif}
      </style>
      <rect width="${W}" height="${H}" rx="26" fill="#FFF7FA"/>
      <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="18" fill="none" stroke="#F6C9DA" stroke-width="2"/>
      <circle cx="${CX}" cy="${CY}" r="${R + 10}" fill="#FFD0E1"/>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#skyG)"/>
      <g clip-path="url(#skyC)">${grid}${lines.join('')}${starsSvg}${moonSvg}${labels.join('')}</g>
      <g font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="14" fill="#C7386F" text-anchor="middle">
        <text x="${CX}" y="${CY - R - 16}">K</text><text x="${CX}" y="${CY + R + 28}">G</text>
        <text x="${CX - R - 20}" y="${CY + 5}">D</text><text x="${CX + R + 20}" y="${CY + 5}">B</text>
      </g>
      <text x="${CX}" y="${CY + R + 78}" text-anchor="middle" font-family="'Great Vibes', cursive" font-size="44" fill="#E3174D">${K.esc(title)}</text>
      <text x="${CX}" y="${CY + R + 108}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="600" font-size="16" fill="#4A2138" letter-spacing="1">${K.esc(when)}</text>
      <text x="${CX}" y="${CY + R + 128}" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="11.5" fill="#B58BA1" letter-spacing="3">${coord}</text>
      <g font-family="Nunito, sans-serif" font-size="13.5" fill="#86566F" text-anchor="middle">${txt.map((l, i) => `<text x="${CX}" y="${CY + R + 156 + i * 19}">${K.esc(l)}</text>`).join('')}</g>
    </svg>`;
    notes.sort((a, b) => b.alt - a.alt);
    return { svg, notes, S };
  }

  function caption(res) {
    const top = res.notes.filter((n) => n.alt > 12).slice(0, 4);
    const her = res.notes.find((n) => n.c.mine === 'her' && n.alt > 0);
    const me = res.notes.find((n) => n.c.mine === 'me' && n.alt > 0);
    const parts = top.map((n) => `<b>${K.esc(n.c.name)}</b> ${n.where}`);
    let special = '';
    if (her && me) special = `O gece <b>Boğa</b> (senin burcun) ile <b>Akrep</b> (benim burcum) aynı gökyüzündeydi.`;
    else if (her) special = `Senin burcun <b>Boğa</b> ${her.where} parlıyordu.`;
    else if (me) special = `Benim burcum <b>Akrep</b> ${me.where} duruyordu.`;
    const moon = res.S.moon;
    const mtxt = moon.alt > 0 ? `Ay gökyüzündeydi (${moon.phase.name.toLowerCase()}, %${Math.round(moon.phase.illum * 100)} aydınlık).` : `Ay o saatte ufkun altındaydı (${moon.phase.name.toLowerCase()}).`;
    return `<p>${parts.length ? parts.join(', ') + '.' : ''} ${special}</p><p class="muted small">${mtxt}</p>`;
  }

  function show(i) {
    const list = skies();
    current = K.clamp(i, 0, list.length - 1);
    const sk = list[current];
    const res = poster(sk);
    K.$$('.yz-tab', root).forEach((t, j) => t.setAttribute('aria-selected', j === current ? 'true' : 'false'));
    K.$('#yzPoster', root).innerHTML = res.svg;
    K.$('#yzCap', root).innerHTML = `<h3 class="hand">${K.esc(sk.title)}</h3>${caption(res)}${sk.text ? `<p class="yz-text">${K.esc(K.fill(sk.text))}</p>` : ''}`;
    K.$('#yzPoster', root).dataset.idx = current;
    if (sk.id !== 'simdi') K.stickers.award('yildiz');
  }
  const skies = () => {
    const now = new Date(K.time.now().getTime());
    return D.skies.concat([{ id: 'simdi', ms: now.getTime(), date: '2000-01-01', place: 'baku', title: 'Bu gece', text: 'Şu an başının üstündeki gökyüzü. Pencereden bak; haritadakiyle aynı.' }]);
  };

  async function save() {
    const svg = K.$('#yzPoster svg', root);
    if (!svg) return;
    const img = await A.toImage(svg.outerHTML.replace(' xmlns="http://www.w3.org/2000/svg"', ''), W * 2, H * 2);
    if (!img) return K.fx.toast('Poster şu an kaydedilemedi.');
    const c = document.createElement('canvas');
    c.width = W * 2;
    c.height = H * 2;
    c.getContext('2d').drawImage(img, 0, 0);
    const url = c.toDataURL('image/png');
    const file = await K.dataUrlToFile(url, 'o-gecenin-gokyuzu.png');
    const r = await K.share({ title: 'O gecenin gökyüzü', text: '', file });
    if (r !== 'shared' && r !== 'cancelled') K.download(url, 'o-gecenin-gokyuzu.png');
  }

  // Kale Kitabı da aynı posteri kullanır
  K.skyPoster = (sk) => poster(sk).svg;

  K.room({
    id: 'yildizlar',
    wing: 'anilar',
    title: 'O Gecenin Gökyüzü',
    sub: 'Özel gecelerimizin yıldız haritaları',
    icon: 'sky',
    color: '#E0DBFF',
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Bu haritalar gerçek. Her yıldız, o gece o saatte ${K.esc(C.herCity)}'nin üstünde tam olarak nerede duruyorsa orada. Pembe çizgiler ikimizin: senin burcun Boğa, benim burcum Akrep. Bir de ${K.esc(C.herDog)}'e benzeyen bir takımyıldız var; bul bakalım.</p>
        <div class="tabs yz-tabs" role="tablist">${skies().map((s, i) => `<button class="chip yz-tab" role="tab" data-i="${i}" aria-selected="false">${K.esc(s.title)}</button>`).join('')}</div>
        <div class="yz">
          <figure class="yz-poster" id="yzPoster"></figure>
          <div class="yz-side">
            <div class="yz-cap" id="yzCap"></div>
            <div class="actions"><button class="btn" id="yzSave">${A.ui('download')} Posteri kaydet</button></div>
          </div>
        </div>`;
      K.$('.yz-tabs', el).addEventListener('click', (e) => {
        const b = e.target.closest('.yz-tab');
        if (!b) return;
        K.audio.sfx.sparkle();
        show(+b.dataset.i);
      });
      K.$('#yzSave', el).addEventListener('click', save);
    },
    enter() {
      show(current == null ? 0 : current);
    },
  });
})();
