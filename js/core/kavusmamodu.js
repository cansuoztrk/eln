/* Kavuşma Modu — biniş kartı (Biniş Kartı odasındaki 'flight' kaydı) girildiği anda bütün kale değişir: ana salonun
   başında saniye saniye geri sayım şeridi, uçuş günü uçağın canlı konumu ("Şu an Gürcistan'ın üstünde"), iniş anında
   havai fişek. Havaalanında iki düğme: Havaalanı Tabelası (telefon tam ekran parlak bir karşılama tabelasına döner)
   ve İlk Bakış ("Gördüm": o saniye iki şehrin saatiyle kaydedilir; o gün her yıl İlk Bakış Günü olur).
   İndikten dönüşe kadar Aynı Şehir teması: iki kule yan yana, mesafe 0 km, günün ortak albümüne kısayol.
   Kayıtlar: ilkbakis {at} (kişi başına ilk kayıt geçerli) */
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
  let bakis = [], tick = null, sonEvre = '', tabelaEl = null, wake = null;
  const ph = () => (K.bilet && K.bilet.phase && K.bilet.phase()) || null;
  const aktif = (p = ph()) => Boolean(p && p.k !== 'after');
  const ayniSehir = (p = ph()) => Boolean(p && (p.k === 'landed' || p.k === 'together'));
  const havaalani = (p = ph()) => Boolean(p && (p.k === 'board' || p.k === 'air' || p.k === 'landed' || (p.k === 'before' && p.left < 864e5)));
  const ilkOf = (w) => bakis.filter((r) => r.who === w).sort((a, b) => a.at - b.at)[0];
  const sure = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sn = s % 60;
    return `${d ? `<b>${d}</b>g ` : ''}<b>${K.pad(h)}</b>:<b>${K.pad(m)}</b>:<b>${K.pad(sn)}</b>`;
  };
  const hm = (ms, tz) => {
    const p = T.parts(tz, new Date(ms));
    return `${K.pad(p.h)}:${K.pad(p.mi)}:${K.pad(p.s || 0)}`;
  };

  /* ---------- Ana salon şeridi ---------- */
  function serit() {
    const box = K.$('#kmSerit');
    if (!box) return;
    const p = ph();
    document.body.classList.toggle('kavusma-modu', aktif(p));
    document.body.classList.toggle('ayni-sehir', ayniSehir(p));
    if (!aktif(p)) return (box.hidden = true);
    box.hidden = false;
    const f = K.bilet.get();
    let ust = '', ana = '', alt = '';
    if (p.k === 'before' || p.k === 'board') {
      ust = p.k === 'board' ? `${K.esc(C.myPet)} havalimanında · kalkış ${K.esc(f.dep)}` : `Kavuşmaya · ${K.esc(T.fmt(f.date, true))}`;
      ana = `<span class="km-sayac">${sure(p.left)}</span>`;
      alt = `${K.esc(f.from || 'IST')} → GYD${f.no ? ` · ${K.esc(f.no)}` : ''}`;
    } else if (p.k === 'air') {
      ust = `${K.esc(C.myPet)} uçakta`;
      ana = `<span class="km-yer">✈️ Şu an ${K.esc(K.bilet.over(p.q))}</span><span class="km-yol"><i style="--q:${p.q.toFixed(3)}"></i></span>`;
      alt = `inişe ${sure(p.left)}`;
    } else if (p.k === 'landed') {
      ust = 'İndi';
      ana = `<span class="km-yer">${K.esc(C.myPet)} Bakü'de. Kapıya bak.</span>`;
      alt = '1.758 km bitti';
    } else {
      ust = 'Aynı şehirdeyiz';
      ana = '<span class="km-yer">0 km</span>';
      alt = 'İki kule yan yana';
    }
    const ben = ilkOf(mine());
    box.innerHTML = `<div class="km-kart ${p.k}"><div class="km-kuleler" aria-hidden="true">${kule('ist')}${kule('baku')}</div><div class="km-ic"><p class="km-ust">${ust}</p>${ana}<p class="km-alt">${alt}</p>
      <div class="km-btn">${havaalani(p) ? `<button type="button" class="btn small" data-km-tabela>🪧 Tabela</button><button type="button" class="btn small ${ben ? 'soft' : 'red'}" data-km-gordum ${ben ? 'disabled' : ''}>${ben ? `👀 ${K.esc(hm(ben.data.at, C.tzBaku))}` : '👀 Gördüm'}</button>` : ''}
      ${ayniSehir(p) ? `<a class="btn small soft" href="#${D.gunluk ? 'gunluk' : 'kare'}">📸 Bugünün albümü</a>` : `<a class="btn small soft" href="#bilet">✈️ Uçuş</a>`}</div></div></div>`;
  }
  const kule = (k) =>
    k === 'ist'
      ? '<svg viewBox="0 0 40 80" class="km-kule ist"><path d="M14 80V40h12v40z" fill="#fff" stroke="currentColor" stroke-width="2.5"/><path d="M11 40h18l-3-8H14z" fill="#E3174D" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 32V18" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="15" r="3" fill="#E3174D"/><rect x="17" y="48" width="6" height="8" rx="3" fill="currentColor" opacity=".35"/></svg>'
      : '<svg viewBox="0 0 40 80" class="km-kule baku"><path d="M8 80V30q12-10 24 0v50z" fill="#fff" stroke="currentColor" stroke-width="2.5"/><path d="M8 30q12-10 24 0" fill="none" stroke="#E3174D" stroke-width="4"/><path d="M8 44h24M8 58h24" stroke="currentColor" stroke-width="1.6" opacity=".4"/><rect x="17" y="64" width="6" height="16" rx="3" fill="currentColor" opacity=".35"/></svg>';

  /* ---------- Havaalanı Tabelası ---------- */
  async function tabela() {
    if (tabelaEl) return;
    const ad = (K.isOwner() ? C.herPet : C.myPet || '').toLocaleUpperCase('tr');
    tabelaEl = K.el(`<div class="tabela" role="dialog" aria-label="Havaalanı tabelası"><div class="tb-kalpler" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--x:${(i * 6.3) % 100}%;--d:${(i * 0.37) % 3}s;--s:${0.6 + ((i * 7) % 5) / 6}">♥</i>`).join('')}</div>
      <div class="tb-ic"><div class="tb-kuleler">${kule('ist')}<span class="tb-kalp">♥</span>${kule('baku')}</div><p class="tb-hos">Hoş geldin</p><h1>${K.esc(ad)}</h1><p class="tb-km">${K.num(C.distanceKm || 1758)} km bitti</p></div><p class="tb-not">Kapatmak için dokun</p></div>`);
    document.body.appendChild(tabelaEl);
    document.body.classList.add('tabela-acik');
    try {
      wake = navigator.wakeLock && (await navigator.wakeLock.request('screen'));
    } catch (e) {}
    try {
      tabelaEl.requestFullscreen && (await tabelaEl.requestFullscreen());
    } catch (e) {}
    tabelaEl.addEventListener('click', kapat);
    K.stickers.award('tabela');
  }
  function kapat() {
    if (!tabelaEl) return;
    try {
      document.fullscreenElement && document.exitFullscreen();
    } catch (e) {}
    wake && wake.release && wake.release().catch(() => {});
    wake = null;
    tabelaEl.remove();
    tabelaEl = null;
    document.body.classList.remove('tabela-acik');
  }

  /* ---------- İlk Bakış ---------- */
  async function gordum() {
    if (ilkOf(mine())) return;
    const r = await K.cloud.add('ilkbakis', { at: Date.now() });
    if (!r) return;
    bakis.some((x) => x.id === r.id) || bakis.push(r);
    K.vibrate && K.vibrate([30, 60, 30]);
    const iki = ilkOf(other());
    if (iki) K.fx.fireworks && K.fx.fireworks(5000), K.stickers.award('ilkbakis2');
    else K.fx.confetti({ count: 160, shapes: ['heart'] });
    K.stickers.award('ilkbakis');
    K.ping(`👀 ${K.meName()} seni gördü`, `${hm(r.data.at, C.tzIstanbul)} İstanbul · ${hm(r.data.at, C.tzBaku)} Bakü`, ['eyes'], { click: K.roomUrl('ilkbakis') });
    serit();
  }
  // İlk Bakış Günü: ikimizin ilk "Gördüm"ünün günü (Bakü), 'AA-GG' biçiminde
  function gun() {
    const r = bakis.slice().sort((a, b) => a.at - b.at)[0];
    if (!r) return null;
    const p = T.baku(new Date(r.data.at));
    return `${K.pad(p.mo)}-${K.pad(p.d)}`;
  }

  /* ---------- Döngü ---------- */
  // Her saniye yalnız sayaçlar güncellenir; evre değişince şerit baştan çizilir (düğmeler dokunuş sırasında yenilenmesin)
  function dongu() {
    const p = ph();
    const k = p ? p.k : '';
    if (k !== sonEvre) {
      if (sonEvre === 'air' && k === 'landed' && !K.isOwner()) K.fx.fireworks && K.fx.fireworks(6000);
      sonEvre = k;
      return serit();
    }
    if (K.activeRoom || !p) return;
    const sy = K.$('#kmSerit .km-sayac');
    if (sy && p.left != null) sy.innerHTML = sure(p.left);
    if (p.k === 'air') {
      const yer = K.$('#kmSerit .km-yer'), yol = K.$('#kmSerit .km-yol i'), alt = K.$('#kmSerit .km-alt');
      yer && (yer.textContent = `✈️ Şu an ${K.bilet.over(p.q)}`);
      yol && yol.style.setProperty('--q', p.q.toFixed(3));
      alt && (alt.innerHTML = `inişe ${sure(p.left)}`);
    }
  }
  K.on('built', () => {
    const sp = K.$('#special');
    if (sp && !K.$('#kmSerit')) sp.insertAdjacentHTML('beforebegin', '<section class="wrap km-serit" id="kmSerit" hidden></section>');
    serit();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-km-tabela]')) return tabela();
    if (e.target.closest('[data-km-gordum]')) return gordum();
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && kapat());
  K.on('cloud', async (ok) => {
    if (!ok) return;
    bakis = await K.cloud.list('ilkbakis', 20);
    K.cloud.on('ilkbakis', (r) => {
      if (bakis.some((x) => x.id === r.id)) return;
      bakis.push(r);
      if (r.who === other()) K.fx.toast(`👀 <b>${K.esc(nameOf(other()))} seni gördü.</b> ${hm(r.data.at, C.tzBaku)}`, { duration: 8000 });
      serit();
      K.activeRoom === 'ilkbakis' && oda();
    });
    clearInterval(tick);
    tick = setInterval(dongu, 1000);
    setTimeout(serit, 1500);
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const g = gun(), p = T.baku();
    if (!g || g !== `${K.pad(p.mo)}-${K.pad(p.d)}`) return [];
    const ilk = bakis.slice().sort((a, b) => a.at - b.at)[0];
    if (T.baku(new Date(ilk.data.at)).y === p.y) return [];
    return [{ key: 'ilkbakisgunu', icon: 'heart', title: '👀 Bugün İlk Bakış Günü', text: `${p.y - T.baku(new Date(ilk.data.at)).y} yıl önce bugün havaalanında birbirimizi ilk kez gördük.`, room: 'ilkbakis', big: true }];
  });

  /* ---------- Oda: İlk Bakış ---------- */
  let root = null;
  function oda() {
    if (!root) return;
    const a = ilkOf('me'), b = ilkOf('her');
    const satir = (r, w) => (r ? `<div class="ib-satir"><b>${K.esc(nameOf(w))}</b><span>${hm(r.data.at, C.tzIstanbul)} <small>İstanbul</small></span><span>${hm(r.data.at, C.tzBaku)} <small>Bakü</small></span></div>` : `<div class="ib-satir bos"><b>${K.esc(nameOf(w))}</b><span>henüz basmadı</span></div>`);
    const ilk = a && b ? (a.data.at < b.data.at ? a : b) : null;
    K.$('#ibAna', root).innerHTML = `${a || b ? `<p class="card-eyebrow">${K.esc(T.fmt(new Date((a || b).data.at), true))}</p>` : ''}${satir(a, 'me')}${satir(b, 'her')}
      ${ilk ? `<p class="ib-fark">${K.esc(nameOf(ilk.who))} ${Math.abs(a.data.at - b.data.at) < 1000 ? 'ile aynı saniyede' : `${Math.round(Math.abs(a.data.at - b.data.at) / 1000)} saniye önce`} gördü.</p><p class="muted small center">Bu gün her yıl İlk Bakış Günü.</p>` : `<p class="muted small center">Havaalanında birbirinizi gördüğünüz an ikiniz de "Gördüm"e basın.</p>`}
      ${ilkOf(mine()) ? '' : '<div class="row center"><button type="button" class="btn red" data-km-gordum>👀 Gördüm</button></div>'}`;
  }
  K.room({
    id: 'ilkbakis',
    wing: 'kalp',
    title: 'İlk Bakış',
    sub: 'O saniye, iki şehrin saatiyle',
    icon: 'heart',
    color: '#FFE3EC',
    hidden: () => !K.cloud || !K.cloud.enabled || (!bakis.length && !havaalani()),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Havaalanında birbirimizi gördüğümüz an ikimiz de "Gördüm"e basıyoruz. Kale o saniyeyi iki şehrin saatiyle saklıyor.</p></div><section class="card ib-kart" id="ibAna"></section>
        <div class="row center"><button type="button" class="btn soft" data-km-tabela>🪧 Havaalanı tabelasını aç</button></div>`;
    },
    enter() {
      oda();
    },
  });
  // Kavuşma günü: biniş kartındaki uçuş günü, yoksa paneldeki ilk buluşma tarihi (geçmişteyse yok)
  function hedefGun() {
    const f = K.bilet && K.bilet.get && K.bilet.get();
    if (f && f.date >= T.todayKey()) return f.date;
    if (C.firstMeetDate && C.firstMeetDate >= T.todayKey()) return C.firstMeetDate;
    return null;
  }
  // Ayrılık günü: biniş kartındaki dönüş günü
  const donusGun = () => {
    const f = K.bilet && K.bilet.get && K.bilet.get();
    return (f && f.back) || null;
  };
  K.ilkbakis = { gun, gordum };
  K.kavusmaModu = { serit, tabela, kapat, aktif, ayniSehir, hedefGun, donusGun };
})();
