/* Oda: Rastgele Aynı An — her gün rastgele bir dakikada ikinize aynı anda haber gelir. İki dakika içinde o anı
   çekersiniz; kareler ancak ikiniz de çekince yan yana açılır. Dakika tarihten türetilir (iki telefonda aynı, sürpriz):
   Bakü saatiyle 11:00–21:30 arası. Günün ilk açılışında iki telefona da zamanlı bildirim kurulur (ntfy).
   Kayıtlar: aynian {day, thumb, full, gec, dk} · aynianimg {img} · aynianplan {day} (bildirim kuruldu işareti) */
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
  const PENCERE = 2 * 6e4, GEC = 30 * 6e4;
  let rows = [], root = null;

  // Günün anı (Bakü saatiyle dakika) ve zaman damgası
  const dakika = (gun) => 660 + (K.hash('aynian:' + gun) % 630);
  const an = (gun) => T.at(gun).getTime() + dakika(gun) * 6e4;
  const hm = (dk) => `${String(Math.floor(dk / 60)).padStart(2, '0')}:${String(dk % 60).padStart(2, '0')}`;
  const istHm = (gun) => hm(dakika(gun) + (C.tzIstanbul - C.tzBaku) * 60);
  const of = (gun, w) => rows.filter((r) => r.data.day === gun && r.who === w).sort((a, b) => a.at - b.at)[0];
  function durum(gun = T.todayKey()) {
    const t = an(gun), n = Date.now();
    if (n < t) return { s: 'once', kalan: t - n };
    if (n < t + PENCERE) return { s: 'simdi', kalan: t + PENCERE - n };
    if (n < t + GEC) return { s: 'gec', kalan: t + GEC - n };
    return { s: 'bitti' };
  }

  async function planla() {
    if (!K.cloud || !K.cloud.enabled) return;
    const gun = T.todayKey();
    if (K.store.get('aynianPlan') === gun) return;
    const t = an(gun);
    if (t - Date.now() < 2 * 6e4) return K.store.set('aynianPlan', gun);
    const plan = await K.cloud.list('aynianplan', 10);
    if (!plan.some((r) => r.data.day === gun)) {
      await K.cloud.add('aynianplan', { day: gun });
      const x = K.later(t);
      if (x) {
        ['me', 'her'].forEach((w) => K.ntfyTo(w, '📸 Şimdi! Aynı an', `${nameOf(w === 'me' ? 'her' : 'me')} de şu an bu bildirimi aldı. İki dakikan var: şu anı çek.`, ['camera_flash'], Object.assign({ click: K.roomUrl('aynian'), priority: 4 }, x)));
      }
    }
    K.store.set('aynianPlan', gun);
  }
  async function yukle(file) {
    const gun = T.todayKey();
    const d = durum(gun);
    if (d.s === 'once' || d.s === 'bitti' || of(gun, mine())) return;
    const btn = K.$('[data-an-up]', root);
    btn && btn.closest('label').classList.add('loading');
    const [full, thumb] = await Promise.all([K.medya.image(file, 1400, 0.82), K.medya.image(file, 520, 0.74)]);
    const big = await K.cloud.add('aynianimg', { img: full });
    const r = big && (await K.cloud.add('aynian', { day: gun, thumb, full: big.id, gec: d.s === 'gec', dk: Math.round((Date.now() - an(gun)) / 1000) }));
    if (!r) return K.fx.toast('Fotoğraf gönderilemedi.'), ciz();
    rows.some((x) => x.id === r.id) || rows.push(r);
    K.audio.sfx.success();
    K.stickers.award('aynian');
    if (of(gun, other())) K.fx.confetti({ count: 80, shapes: ['heart'] }), K.stickers.award('aynian2');
    else K.ping(`📸 ${K.meName()} aynı anı çekti`, 'Seninki gelince iki kare yan yana açılacak.', ['camera_flash'], { click: K.roomUrl('aynian') });
    ciz();
  }
  function kare(r, w, acik) {
    if (!r) return `<figure class="an-kare bos"><span>${K.esc(nameOf(w))}<br><small>henüz çekmedi</small></span><figcaption>${K.esc(cityOf(w))}</figcaption></figure>`;
    return `<figure class="an-kare ${acik ? '' : 'kapali'}" ${acik ? `data-an-ac="${r.data.full}"` : ''}><img src="${r.data.thumb}" alt="${K.esc(nameOf(w))}'ın karesi"><figcaption>${K.esc(cityOf(w))} · ${r.data.gec ? `${Math.round(r.data.dk / 60)} dk sonra` : `${r.data.dk} sn içinde`}</figcaption></figure>`;
  }
  function ciz() {
    if (!root || K.activeRoom !== 'aynian') return;
    const gun = T.todayKey();
    const d = durum(gun);
    const a = of(gun, 'me'), b = of(gun, 'her'), ikisi = a && b;
    const ben = of(gun, mine());
    const ust = {
      once: `<p class="card-eyebrow">Bugünün anı gizli</p><p class="an-buyuk">⏳</p><p>Bugün bir dakika ikinize aynı anda haber gelecek. Ne zaman olduğunu kale bile söylemiyor.</p>`,
      simdi: `<p class="card-eyebrow">ŞİMDİ!</p><p class="an-buyuk tnum" id="anSay"></p><p>${K.esc(nameOf(other()))} de şu an bu ekranda olabilir. Ne görüyorsan onu çek.</p>`,
      gec: `<p class="card-eyebrow">Anı kaçırdın ama geç değil</p><p>Bugünün anı ${hm(dakika(gun))} (Bakü) · ${istHm(gun)} (İstanbul) idi. Yarım saat içinde hâlâ çekebilirsin; karede "geç" yazar.</p>`,
      bitti: `<p class="card-eyebrow">Bugünün anı geçti</p><p>Bugün an ${hm(dakika(gun))}'te (Bakü) geldi. Yarın yeni bir dakika.</p>`,
    }[d.s];
    const yukleBtn = !ben && (d.s === 'simdi' || d.s === 'gec') ? `<label class="btn an-cek">${A.ui('camera')} Şu anı çek<input type="file" accept="image/*" capture="environment" hidden data-an-up></label>` : '';
    const eski = [...new Set(rows.map((r) => r.data.day))].filter((g) => g !== gun).sort().reverse();
    K.$('#anIcerik', root).innerHTML = `<section class="card an-ust ${d.s}">${ust}${yukleBtn}</section>
      ${a || b ? `<div class="an-cift">${kare(of(gun, mine()), mine(), ikisi || false)}${kare(of(gun, other()), other(), ikisi)}</div>${ikisi ? '' : `<p class="muted small center">${ben ? `${K.esc(nameOf(other()))} da çekince iki kare yan yana açılır.` : ''}</p>`}` : ''}
      ${eski.length ? `<h3 class="an-baslik">Önceki anlar</h3><div class="an-arsiv">${eski.map((g) => { const x = of(g, 'me'), y = of(g, 'her'); return `<div class="an-gun"><div class="an-cift kucuk">${kare(x, 'me', x && y)}${kare(y, 'her', x && y)}</div><small>${K.esc(T.fmtShort(g))} · ${hm(dakika(g))}</small></div>`; }).join('')}</div>` : ''}`;
    sayac();
  }
  let tik = null;
  function sayac() {
    const el = K.$('#anSay', root);
    if (!el) return;
    const d = durum();
    el.textContent = d.s === 'simdi' ? `${Math.floor(d.kalan / 6e4)}:${String(Math.floor((d.kalan % 6e4) / 1000)).padStart(2, '0')}` : '';
  }
  K.room({
    id: 'aynian',
    wing: 'kalp',
    title: 'Rastgele Aynı An',
    sub: 'Her gün bir dakika, iki şehirde aynı anda',
    icon: 'cam2',
    color: '#E1F3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Her gün rastgele bir dakikada ikinize aynı anda haber gelir. İki dakika içinde o anı çekersiniz; kareler ancak ikiniz de çekince yan yana açılır. Aynı dakikada iki hayat.</p></div><div id="anIcerik"></div>`;
      el.addEventListener('change', (e) => {
        const f = e.target.closest('[data-an-up]');
        f && f.files[0] && yukle(f.files[0]);
      });
      el.addEventListener('click', async (e) => {
        const k = e.target.closest('[data-an-ac]');
        if (!k) return;
        const url = await K.medya.rowUrl(k.dataset.anAc, 'img');
        url && K.ui.modal({ label: 'Aynı an', cls: 'an-buyut', html: `<img src="${url}" alt="">` });
      });
    },
    async enter() {
      rows = await K.cloud.list('aynian', 400);
      const g = T.todayKey();
      of(g, 'me') && of(g, 'her') && K.store.set('aynianGor-' + g, 1);
      ciz();
      clearInterval(tik);
      tik = setInterval(() => {
        if (K.activeRoom !== 'aynian') return;
        const s = durum().s;
        if (s !== root.dataset.s) (root.dataset.s = s), ciz();
        sayac();
      }, 1000);
    },
    leave() {
      clearInterval(tik);
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('aynian', 400);
    K.cloud.on('aynian', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      ciz();
      K.renderSpecials && K.renderSpecials();
    });
    setTimeout(planla, 5000);
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.cloud || !K.cloud.enabled) return [];
    const gun = T.todayKey();
    const s = durum(gun).s;
    if ((s === 'simdi' || s === 'gec') && !of(gun, mine())) return [{ key: 'aynian', icon: 'cam2', title: s === 'simdi' ? '📸 Şimdi! Aynı an' : '📸 Bugünün anı geçti, hâlâ çekebilirsin', text: `${nameOf(other())} de aynı anda haber aldı. Ne görüyorsan onu çek.`, room: 'aynian', cta: 'Çek', big: s === 'simdi' }];
    if (of(gun, mine()) && of(gun, other()) && !K.store.get('aynianGor-' + gun)) return [{ key: 'aynian2', icon: 'cam2', title: 'İki kare yan yana açıldı', text: 'Bugünün aynı anı: iki şehir, aynı dakika.', room: 'aynian', cta: 'Bak', mini: true }];
    return [];
  });
  setInterval(() => {
    const s = durum().s;
    if (s !== K.store.get('aynianS')) K.store.set('aynianS', s), !K.activeRoom && K.renderSpecials && K.renderSpecials();
  }, 20000);
  K.aynian = { dakika, an, durum };
})();
