/* Oda: Bir Gün Bizde — seçilen bir günde (Bakü saatiyle) iki saatte bir iki şehirden birer kare ve isteğe bağlı kısa bir
   ses. Akşam kale bunları yan yana dizip tek bir "Bir Gün" filmi yapar. Gün seçilince o sabah iki telefona da iki
   saatte bir hatırlatma kurulur. Kareler aynı saat dilimine (Bakü 09, 11, … 21) oturur; geç kalan bir sonrakine düşer.
   Kayıtlar: birgunplan {day} · birgunkare {day, dilim, thumb, full, audio} · birgunimg {img} · birgunping {day} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  const DILIM = [9, 11, 13, 15, 17, 19, 21];
  let plan = [], kareler = [], root = null, ses = null;

  const gun = () => {
    const bugun = T.todayKey();
    const g = plan.map((r) => r.data.day).filter((d) => d >= bugun).sort()[0];
    return g || null;
  };
  const bugunMu = () => gun() === T.todayKey();
  const dilimSu = () => {
    const h = T.baku().h;
    return DILIM.filter((d) => d <= h).pop() || null;
  };
  const of = (g, d, w) => kareler.find((r) => r.data.day === g && r.data.dilim === d && r.who === w);
  const istSaat = (d) => d + (C.tzIstanbul - C.tzBaku);

  async function hatirlat() {
    const g = gun();
    if (!g || g !== T.todayKey() || K.store.get('birgunPing') === g) return;
    const l = await K.cloud.list('birgunping', 20);
    if (!l.some((r) => r.data.day === g)) {
      await K.cloud.add('birgunping', { day: g });
      DILIM.forEach((d) => {
        const x = K.later(T.at(g).getTime() + d * 36e5);
        x && ['me', 'her'].forEach((w) => K.ntfyTo(w, `🎞️ Bir Gün Bizde · ${d}:00`, 'Bu saatin karesi: ne görüyorsan onu çek, istersen beş saniyelik bir ses ekle.', ['film_frames'], Object.assign({ click: K.roomUrl('birgun'), priority: 3 }, x)));
      });
    }
    K.store.set('birgunPing', g);
  }
  async function yukle(file) {
    const g = gun(), d = dilimSu();
    if (!bugunMu() || !d || of(g, d, mine())) return;
    const [full, thumb] = await Promise.all([K.medya.image(file, 1280, 0.8), K.medya.image(file, 480, 0.74)]);
    const big = await K.cloud.add('birgunimg', { img: full });
    const r = big && (await K.cloud.add('birgunkare', { day: g, dilim: d, thumb, full: big.id, audio: ses ? ses.audio : '' }));
    ses = null;
    if (!r) return K.fx.toast('Kare gönderilemedi.');
    kareler.push(r);
    K.audio.sfx.success();
    K.stickers.award('birgun');
    ciz();
  }
  function film(g) {
    const sahne = [{ type: 'baslik', eyebrow: 'Bir Gün Bizde', title: T.fmt(g, true), sub: `${C.myCity} ve ${C.herCity}, aynı gün` }];
    const birlestir = (a, b) => new Promise((res) => {
      const c = document.createElement('canvas');
      c.width = 960;
      c.height = 640;
      const x = c.getContext('2d');
      x.fillStyle = '#FFF0F5';
      x.fillRect(0, 0, 960, 640);
      let n = 0;
      const bitir = () => ++n === 2 && res(c.toDataURL('image/jpeg', 0.84));
      [[a, 0], [b, 480]].forEach(([src, ox]) => {
        if (!src) return bitir();
        const im = new Image();
        im.onload = () => {
          const k = Math.max(480 / im.width, 640 / im.height);
          x.drawImage(im, ox + (480 - im.width * k) / 2, (640 - im.height * k) / 2, im.width * k, im.height * k);
          bitir();
        };
        im.onerror = bitir;
        im.src = src;
      });
    });
    return Promise.all(DILIM.map(async (d) => {
      const a = of(g, d, 'me'), b = of(g, d, 'her');
      if (!a && !b) return [];
      const src = await birlestir(a && a.data.thumb, b && b.data.thumb);
      const s = [{ type: 'foto', src, caption: `Bakü ${d}:00 · İstanbul ${istSaat(d)}:00`, sub: `${a ? nameOf('me') : ''}${a && b ? ' ve ' : ''}${b ? nameOf('her') : ''}` }];
      [a, b].filter((r) => r && r.data.audio).forEach((r) => s.push({ type: 'ses', audio: r.data.audio, by: nameOf(r.who), text: `${d}:00, ${cityOf(r.who)}` }));
      return s;
    })).then((l) => {
      l.forEach((s) => sahne.push(...s));
      sahne.push({ type: 'kapanis', text: 'Bir gün, iki şehir.', sub: 'Aynı gün, aynı saatlerde, birbirimizi düşünerek.' });
      K.belgesel.play(sahne, { mood: 'sicak', label: 'Bir Gün Bizde' });
      K.stickers.award('birgunfilm');
    });
  }
  function ciz() {
    if (!root || K.activeRoom !== 'birgun') return;
    const g = gun();
    const d = dilimSu();
    const yarin = T.key(T.baku(new Date(Date.now() + 864e5)));
    const gecmis = [...new Set(kareler.map((r) => r.data.day))].filter((x) => x < T.todayKey()).sort().reverse();
    K.$('#bgIcerik', root).innerHTML = `${!g ? `<section class="card bg-plan"><p class="card-eyebrow">Bir gün seç</p><p>Hangi gün iki şehirden saat saat kare toplayalım? Seçilen gün ikinize de iki saatte bir hatırlatma gelir.</p><div class="hc-alanlar"><input class="input" type="date" id="bgGun" min="${T.todayKey()}" value="${yarin}"><button class="btn" type="button" data-bg="plan">Günü seç</button></div></section>`
      : !bugunMu() ? `<section class="card bg-plan"><p class="card-eyebrow">Planlandı</p><p class="bg-buyuk">${K.esc(T.fmt(g, true))}</p><p class="muted">O gün iki saatte bir ikinize de haber gelecek.</p></section>`
        : `<section class="card bg-bugun"><p class="card-eyebrow">Bugün Bir Gün Bizde 🎞️</p>${d ? (of(g, d, mine()) ? `<p>${d}:00 karesi tamam. Sıradaki: ${DILIM.find((x) => x > d) ? DILIM.find((x) => x > d) + ':00' : 'akşam filmi'}</p>` : `<p>Şimdi <b>Bakü ${d}:00 · İstanbul ${istSaat(d)}:00</b> karesi.</p><div class="cl-dugmeler"><button class="btn ghost small" type="button" data-bg="ses">${ses ? '✓ Ses hazır' : '🎙️ 5 sn ses (isteğe bağlı)'}</button><label class="btn">${A.ui('camera')} Kareyi çek<input type="file" accept="image/*" capture="environment" hidden data-bg-up></label></div>`) : '<p>İlk kare Bakü 09:00\'da.</p>'}</section>`}
      ${g && (bugunMu() || kareler.some((r) => r.data.day === g)) ? `<div class="bg-saatler">${DILIM.map((s) => `<div class="bg-satir ${s === d ? 'su' : ''}"><time>${s}:00</time>${['me', 'her'].map((w) => { const r = of(g, s, w); return r ? `<img src="${r.data.thumb}" alt="">` : '<span></span>'; }).join('')}</div>`).join('')}</div>
        <button class="btn" type="button" data-bg-film="${g}" ${kareler.some((r) => r.data.day === g) ? '' : 'disabled'}>🎞️ Günün filmini oynat</button>` : ''}
      ${gecmis.length ? `<h3 class="an-baslik">Önceki günler</h3><div class="bg-gecmis">${gecmis.map((x) => `<button type="button" class="card" data-bg-film="${x}"><b>${K.esc(T.fmt(x, true))}</b><small>${kareler.filter((r) => r.data.day === x).length} kare · filmi oynat ▶</small></button>`).join('')}</div>` : ''}`;
  }
  K.room({
    id: 'birgun',
    wing: 'anilar',
    title: 'Bir Gün Bizde',
    sub: 'Bir gün, iki saatte bir, iki şehirden',
    icon: 'film',
    color: '#FFEDE2',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir gün seç: o gün iki saatte bir iki şehirden birer kare ve istersen kısa bir ses. Akşam kale hepsini yan yana dizip tek bir "Bir Gün" filmi yapar.</p></div><div id="bgIcerik"></div>`;
      el.addEventListener('change', (e) => {
        const f = e.target.closest('[data-bg-up]');
        f && f.files[0] && yukle(f.files[0]);
      });
      el.addEventListener('click', async (e) => {
        const f = e.target.closest('[data-bg-film]');
        if (f) return film(f.dataset.bgFilm);
        const b = e.target.closest('[data-bg]');
        if (!b) return;
        if (b.dataset.bg === 'plan') {
          const g = K.$('#bgGun', root).value;
          if (!g) return;
          const r = await K.cloud.add('birgunplan', { day: g });
          r && plan.push(r);
          K.ping(`🎞️ ${K.meName()} bir "Bir Gün Bizde" günü seçti`, `${T.fmt(g, true)}: iki saatte bir iki şehirden birer kare.`, ['film_frames'], { click: K.roomUrl('birgun') });
          ciz();
        }
        if (b.dataset.bg === 'ses') {
          const r = await K.medya.kaydet(b, 5);
          if (r) ses = r;
          ciz();
        }
      });
    },
    async enter() {
      [plan, kareler] = await Promise.all([K.cloud.list('birgunplan', 40), K.cloud.list('birgunkare', 400)]);
      ciz();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [plan, kareler] = await Promise.all([K.cloud.list('birgunplan', 40), K.cloud.list('birgunkare', 400)]);
    K.cloud.on('birgunkare', (r) => kareler.some((x) => x.id === r.id) || (kareler.push(r), ciz()));
    K.cloud.on('birgunplan', (r) => plan.some((x) => x.id === r.id) || (plan.push(r), ciz(), K.renderSpecials && K.renderSpecials()));
    setTimeout(hatirlat, 6000);
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!bugunMu()) return [];
    const d = dilimSu();
    const h = T.baku().h;
    if (h >= 21 && kareler.some((r) => r.data.day === gun())) return [{ key: 'birgun', icon: 'film', title: '🎞️ Bir Gün Bizde filmi hazır', text: 'Bugünün kareleri yan yana dizildi.', run: () => film(gun()), cta: 'Oynat' }];
    if (d && !of(gun(), d, mine())) return [{ key: 'birgun', icon: 'film', title: `🎞️ Bakü ${d}:00 karesi`, text: 'Bugün Bir Gün Bizde günü. Bu saatin karesini çek.', room: 'birgun', cta: 'Çek', mini: true }];
    return [];
  });
})();
