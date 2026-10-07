/* Oda: Kâğıt Halka Zinciri — kavuşmaya kalan her gün için kâğıttan bir halka. Her sabah biriniz bugünün halkasını
   koparır; içinden öbürünün önceden yazdığı bir cümle çıkar (havuzda cümle yoksa kalenin kendi cümlelerinden biri).
   Zincir kısaldıkça ana salondaki küçük kartta da kısalır. Kavuşma günü: biniş kartındaki uçuş ya da ilk buluşma tarihi.
   Kayıtlar: halkanot {text} (öbürü için havuz) · halka {day, ref?, text} (o günün koparılan halkası) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const YEDEK = ['Bir halka daha eksildi; ben bir adım daha yaklaştım.', 'Bugün de seni düşündüm, yarın da düşüneceğim.', 'Kâğıt kısalıyor, sabır uzamıyor.', 'Her halka bir gün; her gün sana doğru.', 'Zincir bitince ellerimiz birleşecek.'];
  const RENK = ['#FF8FB8', '#FFD34E', '#8FD3FF', '#C9B6FF', '#8FD694', '#FFB86B'];
  let notlar = [], halkalar = [], root = null;
  const hedef = () => K.kavusmaModu && K.kavusmaModu.hedefGun();
  const kalan = () => (hedef() ? Math.max(0, T.daysUntil(hedef())) : 0);
  const bugun = () => halkalar.find((r) => r.data.day === T.todayKey());
  const kullanilan = () => new Set(halkalar.map((r) => r.data.ref).filter(Boolean));
  const havuz = (w) => notlar.filter((r) => r.who === w && !kullanilan().has(r.id)).sort((a, b) => a.at - b.at);
  function zincirSVG(n) {
    const g = Math.min(n, 60);
    const ring = (i) => {
      const y = 18 + i * 26, c = RENK[i % RENK.length], dik = i % 2;
      return dik ? `<rect x="34" y="${y - 6}" width="12" height="38" rx="6" fill="none" stroke="${c}" stroke-width="7"/>` : `<ellipse cx="40" cy="${y + 13}" rx="22" ry="12" fill="none" stroke="${c}" stroke-width="7"/>`;
    };
    return `<svg class="zc-svg" viewBox="0 0 80 ${30 + g * 26}" aria-label="${n} halka">${Array.from({ length: g }, (_, i) => ring(i)).join('')}</svg>${n > 60 ? `<p class="muted small center">+${n - 60} halka daha</p>` : ''}`;
  }
  function render() {
    if (!root || K.activeRoom !== 'zincir') return;
    const h = hedef(), n = kalan(), b = bugun();
    K.$('#zcUst', root).innerHTML = h ? `<b>${n}</b><span>halka kaldı · ${K.esc(T.fmt(h, true))}</span>` : '<span>Kavuşma günü belli olunca zincir burada uzayacak.</span>';
    K.$('#zcZincir', root).innerHTML = h ? zincirSVG(n) : '';
    K.$('#zcBugun', root).innerHTML = !h
      ? ''
      : b
        ? `<p class="card-eyebrow">Bugünün halkası · ${K.esc(nameOf(b.who))} kopardı</p><p class="zc-not">"${K.esc(b.data.text)}"</p>`
        : n > 0
          ? `<p class="card-eyebrow">Bugünün halkası</p><button type="button" class="btn red" data-zc-kopar>✂️ Bugünün halkasını kopar</button><p class="muted small">İçinden ${K.esc(K.ek(nameOf(other()), 'in'))} senin için yazdığı bir cümle çıkar.</p>`
          : '<p class="zc-not">Zincir bitti. Bugün kavuşma günü.</p>';
    const benim = notlar.filter((r) => r.who === mine());
    K.$('#zcHavuz', root).innerHTML = `<p class="card-eyebrow">${K.esc(nameOf(other()))} için halkalara cümle koy</p><p class="muted small">Havuzunda ${havuz(mine()).length} cümle bekliyor${benim.length ? ` · ${benim.length - havuz(mine()).length} tanesi çıktı` : ''}.</p>
      <div class="row"><input class="input" id="zcMetin" maxlength="140" placeholder="Bir halkanın içine..."><button type="button" class="btn soft small" data-zc-koy>Koy</button></div>`;
  }
  async function kopar() {
    if (bugun()) return;
    const n = havuz(other())[0];
    const text = n ? n.data.text : YEDEK[K.hash(T.todayKey()) % YEDEK.length];
    const r = await K.cloud.add('halka', Object.assign({ day: T.todayKey(), text }, n ? { ref: n.id } : {}));
    if (!r) return;
    halkalar.some((x) => x.id === r.id) || halkalar.push(r);
    K.fx.burst && K.fx.burst(innerWidth / 2, innerHeight / 3, { count: 26, power: 6 });
    K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
    K.stickers.award('zincir');
    K.ping(`✂️ ${K.meName()} bugünün halkasını kopardı`, `${kalan()} halka kaldı.`, ['link'], { click: K.roomUrl('zincir') });
    render();
    K.renderSpecials && K.renderSpecials();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [notlar, halkalar] = await Promise.all([K.cloud.list('halkanot', 400), K.cloud.list('halka', 400)]);
    K.cloud.on('halkanot', (r) => notlar.some((x) => x.id === r.id) || (notlar.push(r), render()));
    K.cloud.on('halka', (r) => halkalar.some((x) => x.id === r.id) || (halkalar.push(r), render(), K.renderSpecials && K.renderSpecials()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!hedef() || bugun() || kalan() <= 0) return [];
    return [{ key: 'zincir', icon: 'gift', title: `✂️ ${kalan()} halka kaldı`, text: 'Bugünün halkası koparılmadı. İçinden bir cümle çıkacak.', run: kopar, cta: 'Kopar', mini: true }];
  });
  K.room({
    id: 'zincir',
    wing: 'kalp',
    title: 'Kâğıt Halka Zinciri',
    sub: () => (hedef() ? `${kalan()} halka kaldı` : 'Kavuşmaya kalan günler'),
    icon: 'gift',
    color: '#FFF6D6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kavuşmaya kalan her gün için kâğıttan bir halka. Her sabah birimiz bugünün halkasını koparır; içinden öbürünün önceden yazdığı bir cümle çıkar.</p></div>
        <p class="zc-ust center" id="zcUst"></p><section class="card zc-bugun" id="zcBugun"></section><div class="zc-zincir" id="zcZincir"></div><section class="card" id="zcHavuz"></section>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-zc-kopar]')) return kopar();
        if (!e.target.closest('[data-zc-koy]')) return;
        const inp = K.$('#zcMetin', root), text = inp.value.trim();
        if (!text) return inp.focus();
        const r = await K.cloud.add('halkanot', { text });
        if (!r) return;
        notlar.some((x) => x.id === r.id) || notlar.push(r);
        inp.value = '';
        K.stickers.award('halkanot');
        render();
      });
    },
    enter() {
      render();
    },
  });
  K.zincir = { kalan, kopar };
})();
