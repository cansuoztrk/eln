/* Oda: Altın Fiyonk Avı — kalenin on iki odasına on iki altın fiyonk saklandı; her biri odanın bir köşesinde, oda
   açıldıktan biraz sonra hafifçe parlar. Bilmeceler hangi odaya bakacağını söyler. Hepsini bulan Kitty'nin altın
   tacını kazanır: ana salondaki Kitty'nin fiyonku altın olur ve öbürüne haber gider. Herkes kendi fiyonklarını toplar
   (bu cihazda); bulunanlar buluta da yazılır ki öbürü kaç tane bulduğunu görsün. Kayıtlar: fiyonk {i} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // [oda, bilmece]
  const HUNT = [
    ['mektuplar', 'Bazı zarflar yağmur bekler; ben ise zarfların arasında.'],
    ['kavanoz', 'Her "seni seviyorum" bir kalp olur; kalplerin durduğu camın yanındayım.'],
    ['kedi', 'Hamsi de sever, kütüm de; onun mama kabının yakınında.'],
    ['zambak', 'Her yedi sulamada bir çiçek açar; toprağın kenarındayım.'],
    ['gece', 'Lamba kısılınca görünürüm.'],
    ['radyo', 'İki şehirde aynı saniye çalar.'],
    ['harita', 'Kuzey ışıklarına iğne takılan yer.'],
    ['uyku', 'On iki masalın rafı.'],
    ['yildizlar', 'Tanıştığımız gecenin gökyüzü.'],
    ['gungun', 'Tanıştığımız günden bugüne her gün bir sayfa.'],
    ['ilk-sarilma', 'Borç her gün büyüyor; ödenecek ilk sarılma.'],
    ['gunesposta', 'Güneşe iliştirilen notların odası.'],
  ];
  const got = () => K.store.get('fiyonkAv', {});
  let rows = [], root = null;
  const count = (w) => (w === mine() ? Object.keys(got()).length : new Set(rows.filter((r) => r.who === w).map((r) => r.data.i)).size);
  const spot = (i) => {
    const r = K.rng(K.hash('fiyonk' + i));
    return { x: 0.08 + r() * 0.8, y: 120 + Math.round(r() * 420) };
  };
  function hide(id, el) {
    const i = HUNT.findIndex((h) => h[0] === id);
    if (i < 0 || got()[i] || !el || K.$('.fa-fiyonk', el)) return;
    const s = spot(i);
    setTimeout(() => {
      if (K.activeRoom !== id || K.$('.fa-fiyonk', el)) return;
      const b = K.el(`<button type="button" class="fa-fiyonk" style="left:${(s.x * 100).toFixed(1)}%;top:${s.y}px" aria-label="Altın fiyonk">${A.bow ? A.bow('#E6B422') : '🎀'}</button>`);
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(b);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        collect(i, b);
      });
    }, 1500);
  }
  async function collect(i, b) {
    const g = got();
    if (g[i]) return;
    g[i] = Date.now();
    K.store.set('fiyonkAv', g);
    const r = b.getBoundingClientRect();
    K.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 22, power: 7 });
    K.audio.sfx.sparkle();
    b.classList.add('alindi');
    setTimeout(() => b.remove(), 700);
    const n = Object.keys(g).length;
    K.fx.toast(`🎀 <b>Altın fiyonk ${n}/12</b> · ${n < 12 ? 'Bilmeceler Altın Fiyonk Avı odasında.' : 'Hepsini buldun!'}`, { duration: 3600 });
    if (K.cloud && K.cloud.enabled) {
      const row = await K.cloud.add('fiyonk', { i });
      row && rows.push(row);
    }
    if (n === 1) K.stickers.award('fiyonk1');
    if (n >= 12) win();
  }
  function win() {
    K.stickers.award('altinfiyonk');
    K.fx.fireworks && K.fx.fireworks(4000);
    document.body.classList.add('altin-tac');
    K.ui.modal({ label: 'Altın taç', cls: 'fa-odul', html: `<div class="fa-tac" aria-hidden="true">👑</div><p class="card-eyebrow">On iki altın fiyonk</p><h2>Kitty'nin altın tacı senin</h2><p>Ana salondaki Kitty artık altın fiyonkla dolaşıyor. Her köşeye baktın, hiçbir ipucunu kaçırmadın. Ve bir kapı açıldı: Oyun kanadında artık bir <b>Altın Oda</b> var.</p><div class="row center"><a class="btn red" href="#altinoda">Altın Oda'ya gir</a></div>` });
    K.ping(`👑 ${K.meName()} on iki altın fiyonku buldu`, 'Kalenin bütün köşeleri tek tek arandı. Kitty\'nin tacı artık onda.', ['crown'], { click: K.roomUrl('fiyonkavi') });
  }
  function render() {
    if (!root || K.activeRoom !== 'fiyonkavi') return;
    const g = got();
    const visible = (id) => K.rooms.some((r) => r.id === id && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden));
    K.$('#faSay', root).innerHTML = `<div class="fa-sayac">${HUNT.map((_, i) => `<span class="${g[i] ? 'on' : ''}">${A.bow ? A.bow(g[i] ? '#E6B422' : '#E6DCEB') : '🎀'}</span>`).join('')}</div><p class="center"><b>${Object.keys(g).length}/12</b> fiyonk · ${K.esc(nameOf(other()))}: ${count(other())}/12</p>`;
    K.$('#faBilmece', root).innerHTML = HUNT.map(([id, q], i) => `<li class="${g[i] ? 'bulundu' : ''} ${visible(id) ? '' : 'kapali'}"><span>${i + 1}</span><p>${K.esc(q)}</p>${g[i] ? `<small>✓ ${K.esc(K.val((K.rooms.find((r) => r.id === id) || {}).title || id))}</small>` : visible(id) ? '' : '<small>Bu oda henüz kapalı</small>'}</li>`).join('');
  }
  K.on('room', ({ id, el }) => hide(id, el));
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('fiyonk', 100);
    K.cloud.on('fiyonk', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.on('built', () => Object.keys(got()).length >= 12 && !K.store.get('altinTacKapali') && document.body.classList.add('altin-tac'));
  K.room({
    id: 'fiyonkavi',
    wing: 'oyun',
    title: 'Altın Fiyonk Avı',
    sub: 'On iki oda, on iki fiyonk',
    icon: 'bow',
    color: '#FFF4D2',
    badge: () => `${Object.keys(got()).length}/12`,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kalenin on iki odasına on iki altın fiyonk saklandı. Bilmeceyi çöz, odaya gir ve köşelere bak: fiyonk oda açıldıktan biraz sonra hafifçe parlar. Hepsini bulan Kitty'nin altın tacını kazanır.</p></div>
        <section class="card fa-kart" id="faSay"></section><ol class="fa-bilmeceler" id="faBilmece"></ol>`;
    },
    enter() {
      render();
    },
  });
  // On iki fiyonk bulununca açılan gizli oda
  K.room({
    id: 'altinoda',
    wing: 'oyun',
    secret: true,
    title: 'Altın Oda',
    sub: 'On iki fiyonkun açtığı kapı',
    icon: 'crown',
    color: '#FFF0B8',
    hidden: () => Object.keys(got()).length < 12,
    init(el) {
      const L = D.altinoda || {};
      const text = L.text || `Kalenin bütün köşelerine baktın. Bir bilmeceyi bile yarım bırakmadın. Ben de bu kaleyi kurarken her odaya senin bir gün oraya bakacağını düşünerek bir şey sakladım. Asıl hazine fiyonklar değildi: her odayı açan, her köşeye bakan sendin.`;
      el.innerHTML = `<div class="ao"><div class="ao-isik" aria-hidden="true"></div>${A.kitty({ crown: true, eyes: 'heart', cls: 'ao-kitty' })}<p class="card-eyebrow">Gizli oda · on iki fiyonk</p><h2>${K.esc(L.title || 'Altın Oda')}</h2>
        <div class="ao-mektup">${K.paras ? K.paras(String(text).split(/\n+/)) : `<p>${K.esc(text)}</p>`}<p class="ao-imza hand">— ${K.esc(C.myPet)}</p></div>
        <div class="ao-fiyonklar">${HUNT.map(() => (A.bow ? A.bow('#E6B422') : '🎀')).join('')}</div>
        <div class="row center"><button type="button" class="btn soft small" data-ao-tac>${document.body.classList.contains('altin-tac') ? '👑 Altın taç takılı' : '👑 Altın tacı tak'}</button></div></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ao-tac]');
        if (!b) return;
        const on = !document.body.classList.contains('altin-tac');
        document.body.classList.toggle('altin-tac', on);
        K.store.set('altinTacKapali', !on);
        b.textContent = on ? '👑 Altın taç takılı' : '👑 Altın tacı tak';
      });
    },
    enter() {
      K.stickers.award('altinoda');
      K.fx.confetti({ count: 80, shapes: ['star', 'bow'] });
    },
  });
  K.fiyonkavi = { count };
})();
