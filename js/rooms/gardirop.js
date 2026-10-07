/* Oda: Kitty'nin Gardırobu — mevsim, bayram ve özel gün kıyafetleri. Elnoş (ya da Ardoş) seçer; Kitty kalenin her yerinde
   o kıyafetle dolaşır: ana salonda, üst çubukta, rehberde, odalarda. Yeni kıyafetler pul gibi kazanılır (pul sayısı), bazıları
   yalnız mevsiminde açılır. Fiyonk rengi de değişir. Seçim iki tarafta ortaktır.
   Kayıtlar: kittygiysi {bas, goz, boyun, fiyonk} (son kayıt geçerli) · K.giysi: secili(), svg(o), renk(o), uygula() */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;
  const INK = '#4A2138';

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cicek = (x, y, c) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="7" ry="11" transform="rotate(${a}) translate(0 -9)" fill="${c}" stroke="${INK}" stroke-width="2.5"/>`).join('')}<circle r="5.5" fill="#FFE27A" stroke="${INK}" stroke-width="2.5"/></g>`;
  const yildiz = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z" fill="${c}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  const kalp = (x, y, s, c, st = 3) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="${c}" stroke="${INK}" stroke-width="${st}"/>`;
  // [kimlik, ad, kilit (pul sayısı ya da 'ay:12'), svg]
  const PARCA = {
    bas: [
      ['', 'Yok', 0, ''],
      ['bere', 'Fransız beresi', 0, `<g transform="translate(78 40) rotate(-16)"><ellipse rx="60" ry="21" fill="#CDBBFF" stroke="${INK}" stroke-width="6"/><path d="M-44 4 Q0 18 44 4" fill="none" stroke="${INK}" stroke-width="3" opacity=".3"/><path d="M0 -21 v-13" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g>`],
      ['yildiz', 'Yıldız tokalar', 5, `${yildiz(52, 54, 1.3, '#FFE27A')}${yildiz(76, 30, 1, '#FFB3CC')}`],
      ['cicek', 'Çiçek tacı', 10, `<path d="M36 70 Q120 6 204 70" fill="none" stroke="#3FA37A" stroke-width="5"/>${[[40, 64, '#FFB3CC'], [68, 42, '#FFE27A'], [100, 30, '#CDBBFF'], [140, 30, '#FFB3CC'], [172, 42, '#9FD8FF'], [200, 64, '#FFE27A']].map(([x, y, c]) => cicek(x, y, c)).join('')}`],
      ['orgu', 'Ponponlu örgü bere', 15, `<g><path d="M30 70 Q40 2 120 -4 Q200 2 210 70 Q120 52 30 70 Z" fill="#FFB3CC" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M60 50 L66 14 M90 40 L92 2 M120 38 L120 -2 M150 40 L148 2 M180 50 L174 14" stroke="${INK}" stroke-width="3" opacity=".25"/><path d="M28 70 Q120 48 212 70 L214 88 Q120 66 26 88 Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><circle cx="120" cy="-12" r="17" fill="#fff" stroke="${INK}" stroke-width="6"/></g>`],
      ['kulaklik', 'Kulaklık', 20, `<g><path d="M22 112 Q20 -16 120 -16 Q220 -16 218 112" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M22 112 Q20 -16 120 -16 Q220 -16 218 112" fill="none" stroke="#FFB3CC" stroke-width="5" stroke-linecap="round"/><rect x="0" y="92" width="34" height="50" rx="14" fill="#FFB3CC" stroke="${INK}" stroke-width="6"/><rect x="206" y="92" width="34" height="50" rx="14" fill="#FFB3CC" stroke="${INK}" stroke-width="6"/></g>`],
      ['kep', 'Mezuniyet kepi', 25, `<g transform="translate(96 26) rotate(-10)"><path d="M-62 0 L0 -26 L62 0 L0 26 Z" fill="#3A2A33" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M-34 12 V30 Q0 44 34 30 V12" fill="#3A2A33" stroke="${INK}" stroke-width="5"/><path d="M0 0 L52 10 V40" fill="none" stroke="#FFE27A" stroke-width="4"/><circle cx="52" cy="44" r="6" fill="#FFE27A" stroke="${INK}" stroke-width="3"/></g>`],
      ['tac', 'Altın taç', 40, `<g transform="translate(74 30) rotate(-14)"><path d="M-40 16 L-44 -22 L-20 0 L0 -32 L20 0 L44 -22 L40 16 Z" fill="#FFD34E" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><circle cx="0" cy="-32" r="5" fill="#E3174D" stroke="${INK}" stroke-width="3"/><circle cx="-44" cy="-22" r="4" fill="#9FD8FF" stroke="${INK}" stroke-width="3"/><circle cx="44" cy="-22" r="4" fill="#9FD8FF" stroke="${INK}" stroke-width="3"/></g>`],
      ['noel', 'Noel şapkası', 'ay:12', `<g transform="translate(62 46) rotate(-22)"><path d="M-46 14 Q-30 -60 34 -74 Q14 -40 40 14 Z" fill="#E3174D" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><rect x="-54" y="6" width="104" height="22" rx="11" fill="#fff" stroke="${INK}" stroke-width="6"/><circle cx="36" cy="-76" r="13" fill="#fff" stroke="${INK}" stroke-width="6"/></g>`],
    ],
    goz: [
      ['', 'Yok', 0, ''],
      ['gozluk', 'Yuvarlak gözlük', 0, `<g fill="none" stroke="${INK}" stroke-width="5"><circle cx="80" cy="124" r="22"/><circle cx="160" cy="124" r="22"/><path d="M102 122 Q120 114 138 122"/></g>`],
      ['gunes', 'Güneş gözlüğü', 8, `<g><rect x="54" y="108" width="52" height="34" rx="14" fill="#2B2024" stroke="${INK}" stroke-width="5"/><rect x="134" y="108" width="52" height="34" rx="14" fill="#2B2024" stroke="${INK}" stroke-width="5"/><path d="M106 120 Q120 112 134 120" fill="none" stroke="${INK}" stroke-width="5"/></g>`],
      ['kalp', 'Kalp gözlük', 30, `<g>${kalp(80, 128, 3.1, '#FF8FB8', 2)}${kalp(160, 128, 3.1, '#FF8FB8', 2)}<path d="M108 120 Q120 112 132 120" fill="none" stroke="${INK}" stroke-width="5"/></g>`],
    ],
    boyun: [
      ['', 'Yok', 0, ''],
      ['atki', 'Kırmızı atkı', 0, `<g><path d="M34 178 Q120 214 206 178 L210 198 Q120 232 30 198 Z" fill="#E3174D" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M150 204 L160 248 L182 244 L172 200 Z" fill="#E3174D" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/></g>`],
      ['kolye', 'Kalp kolye', 12, `<g><path d="M50 180 Q120 222 190 180" fill="none" stroke="#FFD34E" stroke-width="4"/>${kalp(120, 210, 1.6, '#E3174D')}</g>`],
      ['papyon', 'Papyon', 18, `<g transform="translate(120 206)"><path d="M0 0 L-28 -14 L-28 14 Z" fill="#9FD8FF" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M0 0 L28 -14 L28 14 Z" fill="#9FD8FF" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><circle r="7" fill="#9FD8FF" stroke="${INK}" stroke-width="5"/></g>`],
    ],
    fiyonk: [
      ['', 'Kırmızı', 0, '#E3174D'],
      ['pembe', 'Pembe', 0, '#FF6FA3'],
      ['lila', 'Leylak', 6, '#A98BF0'],
      ['gok', 'Gök', 6, '#5DB4F0'],
      ['tereyag', 'Tereyağı', 10, '#F2C21B'],
      ['nane', 'Nane', 10, '#3FB58A'],
      ['siyah', 'Gece', 35, '#3A2A33'],
    ],
  };
  const GRUP = [['bas', 'Baş'], ['goz', 'Göz'], ['boyun', 'Boyun'], ['fiyonk', 'Fiyonk']];
  let rows = [], root = null, taslak = null, grup = 'bas';
  const pul = () => Object.keys(K.stickers.got()).length;
  function acik(p) {
    const k = p[2];
    if (typeof k === 'string' && k.startsWith('ay:')) return T.baku().mo === +k.slice(3) || pul() >= 50;
    return pul() >= k;
  }
  const kilitYazi = (p) => (typeof p[2] === 'string' ? 'Aralıkta ya da 50 pulla' : `${p[2]} pul`);
  function secili() {
    const r = rows.slice().sort((a, b) => b.at - a.at)[0];
    return (r && r.data) || K.store.get('kittyGiysi', null) || {};
  }
  const bul = (g, id) => PARCA[g].find((p) => p[0] === (id || ''));
  function svg(o) {
    const s = o || secili();
    return ['boyun', 'goz', 'bas'].map((g) => (s[g] && bul(g, s[g]) ? bul(g, s[g])[3] : '')).join('');
  }
  function renk(o) {
    const s = o || secili();
    return s.fiyonk && bul('fiyonk', s.fiyonk) ? bul('fiyonk', s.fiyonk)[3] : null;
  }
  // Ekrandaki bütün Kitty'lere yeni kıyafeti giydir
  function uygula() {
    const ns = 'http://www.w3.org/2000/svg';
    const ic = svg(), fr = renk() || '#E3174D';
    K.$$('svg.kitty').forEach((k) => {
      if (k.closest('.gr-onizle')) return;
      let g = k.querySelector(':scope > .k4-giysi');
      if (!g) {
        g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'k4-giysi');
        k.appendChild(g);
      }
      g.innerHTML = ic;
      const b = k.querySelector('.k-bow > g[fill]');
      b && b.setAttribute('fill', fr);
      if (secili().bas) k.querySelector('.k-crown') && k.querySelector('.k-crown').setAttribute('display', 'none');
    });
    K.emit('giysi');
  }
  function onizle() {
    const box = K.$('#grOnizle', root);
    if (!box) return;
    const o = taslak || secili();
    box.innerHTML = A.kitty({ cls: 'gr-k', bow: renk(o) || '#E3174D', giysi: false, label: 'Kitty' }).replace('</svg>', `<g class="k4-giysi">${svg(o)}</g></svg>`);
  }
  function render() {
    if (!root || K.activeRoom !== 'gardirop') return;
    const o = taslak || secili();
    onizle();
    K.$$('[data-gr-grup]', root).forEach((b) => b.classList.toggle('on', b.dataset.grGrup === grup));
    K.$('#grParcalar', root).innerHTML = PARCA[grup]
      .map((p) => {
        const ac = acik(p), sec = (o[grup] || '') === p[0];
        const gor = grup === 'fiyonk' ? `<svg viewBox="-60 -42 120 84" aria-hidden="true">${A.bowShape(p[3])}</svg>` : p[0] ? `<svg viewBox="-20 -60 280 300" aria-hidden="true">${p[3]}</svg>` : '<span class="gr-yok">—</span>';
        return `<button type="button" class="gr-parca ${sec ? 'on' : ''} ${ac ? '' : 'kilit'}" data-gr-p="${p[0]}" ${ac ? '' : 'aria-disabled="true"'}>${gor}<b>${K.esc(p[1])}</b>${ac ? '' : `<small>🔒 ${K.esc(kilitYazi(p))}</small>`}</button>`;
      })
      .join('');
    const s = secili();
    const kayitli = rows.slice().sort((a, b) => b.at - a.at)[0];
    K.$('#grDurum', root).innerHTML = kayitli ? `Şu anki kıyafeti ${K.esc(nameOf(kayitli.who))} seçti · ${K.esc(K.ago(kayitli.at))}` : 'Kitty henüz kıyafetsiz.';
    K.$('#grKaydet', root).disabled = !taslak || JSON.stringify(taslak) === JSON.stringify(s);
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('kittygiysi', 30);
    K.store.set('kittyGiysi', secili());
    uygula();
    K.cloud.on('kittygiysi', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      K.store.set('kittyGiysi', secili());
      uygula();
      render();
    });
  });
  K.room({
    id: 'gardirop',
    wing: 'hazine',
    title: 'Kitty\'nin Gardırobu',
    sub: 'Kitty her yerde bu kıyafetle',
    icon: 'bow',
    color: '#FFE3EC',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kitty'ye kıyafet seç: kalenin her yerinde onunla dolaşacak. Yeni parçalar pul topladıkça açılıyor.</p></div>
        <section class="card gr-sahne"><div class="gr-onizle" id="grOnizle"></div><p class="muted small center" id="grDurum"></p></section>
        <div class="k3-seg">${GRUP.map(([id, ad]) => `<button type="button" data-gr-grup="${id}">${ad}</button>`).join('')}</div>
        <div class="gr-parcalar" id="grParcalar"></div>
        <div class="row center"><button type="button" class="btn red" id="grKaydet" data-gr-kaydet>👗 Kitty'ye giydir</button><button type="button" class="btn ghost small" data-gr-geri>Geri al</button></div>`;
      el.addEventListener('click', async (e) => {
        const g = e.target.closest('[data-gr-grup]');
        if (g) return (grup = g.dataset.grGrup), render();
        const p = e.target.closest('[data-gr-p]');
        if (p) {
          if (p.getAttribute('aria-disabled') === 'true') return K.fx.toast(`🔒 Bu parça ${kilitYazi(bul(grup, p.dataset.grP))} ile açılıyor.`, { duration: 2200 });
          taslak = Object.assign({}, taslak || secili(), { [grup]: p.dataset.grP });
          K.audio.sfx.pop && K.audio.sfx.pop();
          return render();
        }
        if (e.target.closest('[data-gr-geri]')) return (taslak = null), render();
        if (!e.target.closest('[data-gr-kaydet]') || !taslak) return;
        const veri = { bas: taslak.bas || '', goz: taslak.goz || '', boyun: taslak.boyun || '', fiyonk: taslak.fiyonk || '' };
        const r = K.cloud && K.cloud.enabled ? await K.cloud.add('kittygiysi', veri) : null;
        if (r) rows.some((x) => x.id === r.id) || rows.push(r);
        K.store.set('kittyGiysi', veri);
        taslak = null;
        uygula();
        K.stickers.award('gardirop');
        K.fx.confetti({ count: 50, shapes: ['heart'] });
        const ad = ['bas', 'goz', 'boyun'].map((x) => veri[x] && bul(x, veri[x])[1]).filter(Boolean).join(', ');
        r && K.ping(`👗 ${K.meName()} Kitty'yi giydirdi`, ad || 'Fiyonk rengini değiştirdi.', ['dress'], { click: K.roomUrl('gardirop') });
        render();
      });
    },
    enter() {
      taslak = null;
      render();
    },
  });
  K.giysi = { secili, svg, renk, uygula, PARCA };
})();
