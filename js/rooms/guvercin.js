/* Oda: Güvercin Postası — gerçek güvercin hızıyla (İstanbul–Bakü ≈ 22 saat) uçan mektuplar.
   Güvercin haritada Karadeniz kıyısı ve Kafkaslar üzerinden ilerler; alıcı mektubu ancak güvercin varınca okuyabilir.
   Bulut varsa iki yönlü; yoksa onun mektupları bildirim servisinin gecikmeli gönderimiyle tam varış saatinde sana düşer. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  // İstanbul'dan Bakü'ye güzergâh [ad, enlem, boylam]
  const ROUTE = [
    ['İstanbul', 41.01, 28.98], ['İzmit', 40.77, 29.92], ['Bolu', 40.73, 31.61], ['Kastamonu', 41.38, 33.78], ['Samsun', 41.29, 36.33], ['Ordu', 40.98, 37.88],
    ['Trabzon', 41.0, 39.72], ['Rize', 41.02, 40.52], ['Batum', 41.64, 41.64], ['Kutaisi', 42.27, 42.7], ['Tiflis', 41.72, 44.79], ['Gence', 40.68, 46.36],
    ['Mingəçevir', 40.76, 47.06], ['Şamaxı', 40.63, 48.64], ['Bakü', 40.41, 49.87],
  ];
  const BOX = { lon0: 27.6, lon1: 51, lat0: 39.2, lat1: 43.6, w: 360, h: 170 };
  const xy = (lat, lon) => [((lon - BOX.lon0) / (BOX.lon1 - BOX.lon0)) * BOX.w, ((BOX.lat1 - lat) / (BOX.lat1 - BOX.lat0)) * BOX.h];
  const PTS = ROUTE.map(([, la, lo]) => xy(la, lo));
  const SEG = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
  const LEN = SEG.reduce((a, b) => a + b, 0);
  const HOURS = 22;

  let root, cloudRows = [], tick = null;
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);

  // Uçuş: {id, from, text, sent, arrive}
  function flights() {
    const local = K.store.get('pigeons', []);
    const fromCloud = cloudRows.map((r) => ({ id: r.id, from: r.who, text: r.data.text, sent: r.data.sent, arrive: r.data.arrive, cloud: true }));
    return fromCloud.concat(local).sort((a, b) => b.sent - a.sent);
  }
  // Güvercinin konumu: 0–1 arası ilerleme → harita noktası ve yer adı
  function where(f) {
    const prog = K.clamp((Date.now() - f.sent) / (f.arrive - f.sent), 0, 1);
    const fwd = f.from === 'me'; // İstanbul → Bakü
    let d = (fwd ? prog : 1 - prog) * LEN;
    let i = 0;
    while (i < SEG.length - 1 && d > SEG[i]) d -= SEG[i++];
    const t = SEG[i] ? d / SEG[i] : 0;
    const p = [PTS[i][0] + (PTS[i + 1][0] - PTS[i][0]) * t, PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * t];
    const near = t < 0.5 ? ROUTE[i][0] : ROUTE[i + 1][0];
    const ahead = fwd ? ROUTE[i + 1][0] : ROUTE[i][0];
    const place = prog >= 1 ? `${fwd ? 'Bakü' : 'İstanbul'}'da, pencerede` : prog < 0.02 ? 'havalandı' : (fwd ? t < 0.5 : t > 0.5) ? `${near} üzerinde` : `${K.ek(ahead, 'e')} yaklaşıyor`;
    return { prog, p, place, fwd };
  }
  const left = (f) => {
    const s = T.split(f.arrive - Date.now());
    return s.d * 24 + s.h > 0 ? `${s.d * 24 + s.h} saat ${s.m} dakika` : `${s.m} dakika`;
  };

  /* ---------- Harita ---------- */
  function map(list) {
    const sea = (pts) => pts.map(([lo, la], i) => `${i ? 'L' : 'M'}${xy(la, lo).map((v) => v.toFixed(1)).join(' ')}`).join(' ') + ' Z';
    const black = sea([[27.6, 43.6], [27.6, 41.4], [28.2, 41.3], [29.2, 41.2], [31.5, 41.3], [33.3, 42.0], [35.2, 42.05], [36.4, 41.4], [38.2, 41.05], [39.7, 41.02], [41.5, 41.5], [41.6, 42.6], [40.0, 43.2], [39.5, 43.6]]);
    const caspian = sea([[47.4, 43.6], [47.6, 42.9], [48.5, 41.9], [49.3, 41.05], [49.8, 40.6], [50.4, 40.4], [49.95, 40.1], [49.45, 39.5], [49.0, 39.2], [51, 39.2], [51, 43.6]]);
    const peaks = Array.from({ length: 10 }, (_, i) => {
      const [x, y] = xy(42.95 - (i % 2) * 0.25, 40.6 + i * 0.75);
      return `<path d="M${(x - 9).toFixed(1)} ${(y + 8).toFixed(1)} L${x.toFixed(1)} ${(y - 6).toFixed(1)} L${(x + 9).toFixed(1)} ${(y + 8).toFixed(1)} Z" fill="#E7D7F7" stroke="#8F73E6" stroke-width="1.2"/><path d="M${(x - 3).toFixed(1)} ${(y - 1).toFixed(1)} L${x.toFixed(1)} ${(y - 6).toFixed(1)} L${(x + 3).toFixed(1)} ${(y - 1).toFixed(1)}" fill="#fff"/>`;
    }).join('');
    const path = PTS.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const flying = list.filter((f) => Date.now() < f.arrive).slice(0, 6);
    return `<svg class="gv-map" viewBox="0 0 ${BOX.w} ${BOX.h}" role="img" aria-label="İstanbul ile Bakü arası güvercin haritası">
      <rect width="${BOX.w}" height="${BOX.h}" rx="16" fill="#FFF3E6"/>
      <path d="${black}" fill="#BFE6FF"/><path d="${caspian}" fill="#BFE6FF"/>
      <text x="${xy(42.6, 34)[0]}" y="${xy(42.6, 34)[1]}" class="gv-sea">Karadeniz</text><text x="${xy(42.2, 50.2)[0]}" y="${xy(42.2, 50.2)[1]}" class="gv-sea" text-anchor="middle">Hazar</text>
      ${peaks}
      <path d="${path}" fill="none" stroke="#FF8FB8" stroke-width="2.4" stroke-dasharray="2 6" stroke-linecap="round"/>
      ${ROUTE.map(([n], i) => (i === 0 || i === ROUTE.length - 1 || [4, 6, 10].includes(i) ? `<g transform="translate(${PTS[i][0].toFixed(1)} ${PTS[i][1].toFixed(1)})"><circle r="${i === 0 || i === ROUTE.length - 1 ? 5 : 3}" fill="${i === 0 ? '#4FA3E3' : i === ROUTE.length - 1 ? '#E3174D' : '#B58BA1'}" stroke="#fff" stroke-width="1.6"/><text y="${i % 2 ? 14 : -8}" text-anchor="middle" class="gv-city">${K.esc(n)}</text></g>` : '')).join('')}
      ${flying.map((f) => {
        const w = where(f);
        return `<g class="gv-bird ${f.from}" transform="translate(${w.p[0].toFixed(1)} ${w.p[1].toFixed(1)})"><circle r="15" fill="#fff" opacity=".7"/><g class="gv-flap"><g transform="scale(${w.fwd ? 1 : -1} 1) translate(-12 -13) scale(.38)">${A.icon('pigeon').replace(/<\/?svg[^>]*>/g, '')}</g></g></g>`;
      }).join('')}
    </svg>`;
  }

  /* ---------- Liste ---------- */
  function render() {
    if (!root) return;
    const list = flights();
    K.$('#gvMap', root).innerHTML = map(list);
    const me = mine();
    K.$('#gvList', root).innerHTML = list.length
      ? list
          .map((f) => {
            const w = where(f);
            const out = f.from === me;
            const landed = w.prog >= 1;
            const who = out ? 'Senin güvercinin' : `${nameOf(f.from)}'un güvercini`;
            return `<li class="gv-it ${out ? 'out' : 'in'} ${landed ? 'landed' : 'flying'}">
              <div class="gv-ic">${A.icon('pigeon')}</div>
              <div><p class="card-eyebrow">${K.esc(who)} · ${T.fmt(new Date(f.sent))}</p>
              ${landed ? (out ? `<p>Vardı. ${K.esc(T.fmtShort(new Date(f.arrive)))} ${K.pad(T.baku(new Date(f.arrive)).h)}:${K.pad(T.baku(new Date(f.arrive)).mi)}'de pencereye kondu.</p><p class="hand gv-txt">${K.esc(f.text)}</p>` : `<p class="hand gv-txt">${K.esc(f.text)}</p>`)
                : `<p><b>${K.esc(w.place)}</b> · varışa ${left(f)}</p><div class="gv-bar"><i style="width:${(w.prog * 100).toFixed(1)}%"></i></div>${out ? `<p class="hand gv-txt">${K.esc(f.text)}</p>` : '<p class="muted small">Mektup güvercinin ayağında, mühürlü. Varınca okuyabileceksin.</p>'}`}
              </div></li>`;
          })
          .join('')
      : `<p class="muted">Henüz hiç güvercin uçmadı. İlkini sen gönder.</p>`;
  }

  async function send(text) {
    const sent = Date.now();
    const arrive = sent + (HOURS + (Math.random() * 2 - 1)) * 3600e3;
    let ok = false;
    if (K.cloud && K.cloud.enabled) ok = Boolean(await K.cloud.add('pigeon', { text, sent, arrive }));
    if (!ok) {
      const local = K.store.get('pigeons', []);
      local.unshift({ id: 'p' + sent, from: mine(), text, sent, arrive });
      K.store.set('pigeons', local.slice(0, 60));
    }
    // Kale sahibinin telefonuna tam varış saatinde düşsün
    if (!K.isOwner()) K.notify(`Güvercin geldi · ${C.herName}`, text.slice(0, 900), ['dove'], { delay: `${Math.round((arrive - sent) / 60000)}m` });
    K.stickers.award('guvercin');
    K.audio.sfx.whoosh();
    K.fx.toast(`Güvercin havalandı. Yaklaşık ${HOURS} saat sonra ${K.isOwner() ? C.herCity : C.myCity}'da olacak.`, { icon: A.icon('pigeon'), duration: 5000 });
    render();
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    cloudRows = await K.cloud.list('pigeon');
    K.cloud.on('pigeon', (r) => {
      if (!cloudRows.some((x) => x.id === r.id)) cloudRows.push(r);
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} bir güvercin gönderdi.</b> Şu an havada; yaklaşık ${HOURS} saat sonra penceren de olacak.`, { icon: A.icon('pigeon'), duration: 6000 });
      if (K.activeRoom === 'guvercin') render();
    });
    K.cloud.on('deleted', ({ id }) => (cloudRows = cloudRows.filter((r) => r.id !== id)));
  });
  // Ana salona dönüldüğünde: yolda olan ve yeni varan güvercinler
  K.on('built', () => {
    const me = mine();
    const seen = K.store.get('pigeonSeen', []);
    setTimeout(() => {
      const landed = flights().filter((f) => f.from !== me && Date.now() >= f.arrive && !seen.includes(f.id));
      if (landed.length) {
        K.store.set('pigeonSeen', seen.concat(landed.map((f) => f.id)).slice(-200));
        K.fx.toast(`<b>Penceren de bir güvercin var!</b> ${K.esc(nameOf(landed[0].from))}'un mektubu vardı.`, { icon: A.icon('pigeon'), duration: 7000 });
      }
    }, 5000);
  });

  K.room({
    id: 'guvercin',
    wing: 'zaman',
    title: 'Güvercin Postası',
    sub: '22 saatte varan mektuplar',
    icon: 'pigeon',
    color: '#E6F2FF',
    hidden: () => !D.guvercin || (K.isOwner() && !(K.cloud && K.cloud.enabled)),
    badge: () => {
      const me = mine();
      const n = flights().filter((f) => f.from !== me && Date.now() < f.arrive).length;
      return n ? `${n} güvercin yolda` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras((D.guvercin && D.guvercin.intro) || [])}</div>
        <div class="gv-map-wrap" id="gvMap"></div>
        <form class="card gv-form" id="gvForm" autocomplete="off">
          <p class="card-eyebrow">${K.esc(K.otherName())}'a bir güvercin</p>
          <textarea class="textarea hand-area" id="gvText" name="gvText" maxlength="900" placeholder="Acele etmeyen bir mektup..."></textarea>
          <button class="btn red" type="submit">${A.icon('pigeon')} Güvercini uçur</button>
        </form>
        <ul class="gv-list" id="gvList"></ul>`;
      K.$('#gvForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const t = K.$('#gvText', el).value.trim();
        if (!t) return K.$('#gvText', el).focus();
        K.$('#gvText', el).value = '';
        send(t);
      });
    },
    enter() {
      render();
      clearInterval(tick);
      tick = setInterval(render, 30e3);
      const me = mine();
      K.store.set('pigeonSeen', Array.from(new Set(K.store.get('pigeonSeen', []).concat(flights().filter((f) => f.from !== me && Date.now() >= f.arrive).map((f) => f.id)))).slice(-200));
    },
    leave() {
      clearInterval(tick);
    },
  });
})();
