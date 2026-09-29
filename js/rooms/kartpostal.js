/* Oda: Kartpostal — her gün iki şehirden birer kartpostal. Ön yüz fotoğraf, arka yüz birkaç cümle, pul ve o günün damgası.
   Günün sorusu gibi bir ilham cümlesi var. Kural: onun bugünkü kartı, sen kendi kartını gönderene kadar zarfta kalır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], more = false;
  const PAGE = 120;
  const KP = () => D.kartpostal || { intro: [], prompts: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const dayOf = (r) => T.key(T.baku(new Date(r.at)));
  const prompt = (key) => {
    const p = KP().prompts;
    return p.length ? p[T.dayNumber(T.at(key || T.todayKey())) % p.length] : '';
  };

  function stamp(w) {
    // Pul: İstanbul için Kız Kulesi, Bakü için Qız Qalası
    const art = w === 'me' ? A.kizKulesi() : A.qizQalasi();
    return `<span class="kp-stamp ${w}"><span class="kp-stamp-in">${art}</span><small>${w === 'me' ? 'Türkiye' : 'Azərbaycan'}</small></span>`;
  }
  function postmark(r) {
    const p = T.baku(new Date(r.at));
    const local = r.who === 'me' ? T.ist(new Date(r.at)) : p;
    return `<svg class="kp-mark" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" stroke-width="2"/>
      <path id="kpArc${r.id}" d="M18 60 A42 42 0 0 1 102 60" fill="none"/><text font-size="11" font-weight="700" fill="currentColor" letter-spacing="2"><textPath href="#kpArc${r.id}" startOffset="50%" text-anchor="middle">${K.esc(cityOf(r.who).toLocaleUpperCase('tr'))}</textPath></text>
      <text x="60" y="58" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${K.pad(p.d)}.${K.pad(p.mo)}.${String(p.y).slice(2)}</text>
      <text x="60" y="76" text-anchor="middle" font-size="12" fill="currentColor">${K.pad(local.h)}:${K.pad(local.mi)}</text>
    </svg>`;
  }
  function card(r, sealed) {
    if (sealed)
      return `<article class="kp-card kp-sealed ${r.who}"><div class="kp-env">${A.icon('letter')}<p><b>${K.esc(nameOf(r.who))}'un bugünkü kartı geldi.</b></p><p class="small">Zarf, sen kendi kartını gönderince açılacak.</p></div></article>`;
    return `<article class="kp-card ${r.who}" tabindex="0" aria-label="${K.esc(cityOf(r.who))}'dan kartpostal">
      <div class="kp-inner">
        <figure class="kp-front"><img src="${r.data.img || r.data.thumb}" data-full="${K.esc(r.data.full || '')}" alt="${K.esc(r.data.text || '')}"><figcaption>${K.esc(cityOf(r.who))}'dan sevgiler</figcaption></figure>
        <div class="kp-back">
          <div class="kp-msg"><p class="kp-prompt">${K.esc(r.data.prompt || '')}</p><p class="hand">${K.esc(r.data.text || '')}</p><p class="kp-from">— ${K.esc(nameOf(r.who))}</p></div>
          <div class="kp-side">${stamp(r.who)}${postmark(r)}<p class="kp-to">${K.esc(nameOf(r.who === 'me' ? 'her' : 'me'))}<br>${K.esc(cityOf(r.who === 'me' ? 'her' : 'me'))}</p></div>
        </div>
      </div>
    </article>`;
  }

  function render() {
    if (!root) return;
    const today = T.todayKey();
    const sentToday = rows.some((r) => r.who === mine() && dayOf(r) === today);
    K.$('#kpPrompt', root).textContent = prompt(today);
    K.$('#kpForm', root).hidden = sentToday;
    K.$('#kpSent', root).hidden = !sentToday;
    // Günlere göre: her gün iki kart yan yana (Bakü solda, İstanbul sağda)
    const days = Array.from(new Set(rows.map(dayOf))).sort().reverse();
    K.$('#kpWall', root).innerHTML = days.length
      ? days
          .map((d) => {
            const her = rows.filter((r) => r.who === 'her' && dayOf(r) === d).pop();
            const me = rows.filter((r) => r.who === 'me' && dayOf(r) === d).pop();
            const hide = (r) => r && r.who !== mine() && d === today && !sentToday;
            const slot = (r, w) => (r ? card(r, hide(r)) : `<div class="kp-empty ${w}">${d === today ? `${K.esc(nameOf(w))}'un kartı henüz yolda` : 'Bu gün kart yok'}</div>`);
            return `<section class="kp-day"><p class="kp-date">${T.fmt(d, true)}${d === today ? ' · bugün' : ''}<span>${K.esc(prompt(d))}</span></p><div class="kp-pair">${slot(her, 'her')}${slot(me, 'me')}</div></section>`;
          })
          .join('')
      : `<p class="muted">Henüz kartpostal yok. İlkini sen gönder.</p>`;
    const both = days.filter((d) => rows.some((r) => r.who === 'her' && dayOf(r) === d) && rows.some((r) => r.who === 'me' && dayOf(r) === d)).length;
    K.$('#kpCount', root).textContent = `${K.num(rows.length)} kartpostal · ${K.num(both)} gün ikimiz de gönderdik`;
    K.$('#kpMore', root).hidden = !more;
  }

  function resize(file, max = 1100, q = 0.8) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('postcard', PAGE);
    more = rows.length >= PAGE;
    K.cloud.on('postcard', (r) => {
      if (!rows.some((x) => x.id === r.id)) rows.push(r);
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))}'dan kartpostal!</b> ${K.esc(cityOf(r.who))}'dan bir kart geldi.`, { icon: A.icon('letter') });
      if (K.activeRoom === 'kartpostal') render();
    });
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'kartpostal') render();
    });
  });

  K.room({
    id: 'kartpostal',
    wing: 'kalp',
    title: 'Kartpostal',
    sub: () => `${C.herCity}'den ve ${C.myCity}'dan, her gün bir kart`,
    icon: 'frame',
    color: '#FFE9D6',
    hidden: () => !D.kartpostal || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const today = T.todayKey();
      const other = rows.some((r) => r.who !== mine() && dayOf(r) === today);
      const minee = rows.some((r) => r.who === mine() && dayOf(r) === today);
      return other && !minee ? 'Bir zarf seni bekliyor' : !minee ? 'Bugünün kartı' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(KP().intro)}</div>
        <section class="card kp-new">
          <p class="card-eyebrow">Bugünün ilhamı</p>
          <p class="kp-today" id="kpPrompt"></p>
          <form class="kp-form" id="kpForm" autocomplete="off">
            <label class="kp-pick" for="kpFile"><span id="kpPrev">${A.ui('image')}<b>Fotoğraf seç</b></span></label>
            <input type="file" id="kpFile" accept="image/*" hidden>
            <textarea class="textarea hand-area" id="kpText" name="kpText" maxlength="220" rows="3" placeholder="Arkasına birkaç cümle..."></textarea>
            <button class="btn red" type="submit">${A.icon('letter')} Kartı postala</button>
          </form>
          <p class="kp-sent" id="kpSent" hidden>${A.ui('check')} Bugünün kartını gönderdin. Yarın yeni bir ilham gelecek.</p>
        </section>
        <p class="muted small" id="kpCount"></p>
        <div class="kp-wall" id="kpWall"></div>
        <div class="actions"><button type="button" class="btn soft small" id="kpMore" hidden>Daha eski kartlar</button></div>`;
      let img = null;
      K.$('#kpFile', el).addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const full = await resize(f);
        const thumb = full && (await resize(f, 420, 0.72));
        img = full && thumb ? { full, thumb } : null;
        if (img) K.$('#kpPrev', el).innerHTML = `<img src="${thumb}" alt="">`;
      });
      K.$('#kpForm', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!img) return K.fx.toast('Önce bir fotoğraf seç.');
        const text = K.$('#kpText', el).value.trim();
        // Büyük fotoğraf ayrı kayıtta; kart kaydında sadece küçük önizleme (duvar hızlı açılsın)
        const big = await K.cloud.add('pcimg', { img: img.full });
        const r = big && (await K.cloud.add('postcard', { thumb: img.thumb, full: big.id, text, prompt: prompt() }));
        if (!r) return K.fx.toast('Kart gönderilemedi. İnterneti kontrol et.');
        img = null;
        K.$('#kpText', el).value = '';
        K.$('#kpPrev', el).innerHTML = `${A.ui('image')}<b>Fotoğraf seç</b>`;
        K.audio.sfx.paper();
        K.stickers.award('kartpostal');
        if (!K.isOwner()) K.notify(`${C.herName}'dan kartpostal`, `${C.herCity}'den bugünün kartı geldi: "${prompt()}"`, ['postbox']);
        render();
      });
      el.addEventListener('click', async (e) => {
        if (e.target.closest('#kpMore')) {
          const older = await K.cloud.list('postcard', PAGE, { before: rows.length ? rows[0].at : Date.now() });
          more = older.length >= PAGE;
          rows = older.filter((r) => !rows.some((x) => x.id === r.id)).concat(rows);
          return render();
        }
        const c = e.target.closest('.kp-card:not(.kp-sealed)');
        if (c) {
          c.classList.toggle('flip');
          // İlk dokunuşta büyük fotoğrafı getir
          const im = K.$('.kp-front img', c);
          if (im && im.dataset.full) {
            const id = im.dataset.full;
            im.dataset.full = '';
            const big = await K.cloud.get(id);
            if (big && big.data && big.data.img) im.src = big.data.img;
          }
        }
      });
      el.addEventListener('keydown', (e) => {
        const c = e.target.closest && e.target.closest('.kp-card:not(.kp-sealed)');
        if (c && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          c.classList.toggle('flip');
        }
      });
    },
    enter() {
      render();
    },
  });
})();
