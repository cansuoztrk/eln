/* Oda: Ortada Buluşalım — ikinizin günlük adımları kilometreye çevrilir. Ardoş İstanbul'dan doğuya, Eln Bakü'den batıya
   yürür; Karadeniz kıyısı, Batum, Tiflis ve Gence üzerinden giden 1.758 km'lik yolda. Toplam 1.758 km olunca yolun
   neresindeyseniz orada buluşursunuz ve büyük bir kutlama açılır. Her geçilen şehir bir kartpostal.
   Adımlar iPhone Sağlık'tan bir Kestirme otomasyonuyla her gece kendiliğinden gelir (ham kayıt 'adimham': {"d","s"}),
   ya da odadan elle girilir (adim {day, steps}). Aynı günün en büyük sayısı geçerlidir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const TOTAL = 1758;
  const STRIDE = { me: 0.76, her: 0.68 }; // metre/adım (ortalama)
  // Yol: İstanbul'dan km (Bakü 1758)
  const STOPS = [
    [0, 'İstanbul', 'Kız Kulesi\'nden yola çıkış.'],
    [270, 'Amasra', 'Karadeniz\'in en güzel küçük limanı.'],
    [470, 'Sinop', 'Türkiye\'nin en kuzey ucu; denizin ortasında bir yarımada.'],
    [600, 'Samsun', 'Yolun üçte biri.'],
    [740, 'Ordu', 'Fındık bahçelerinin arasından.'],
    [900, 'Trabzon', 'Sümela, bulutların içindeki manastır.'],
    [1060, 'Batum', 'Ali ve Nino heykeli: her akşam birbirine doğru yürüyen iki âşık.'],
    [1200, 'Kutaisi', 'Gürcistan\'ın kalbi.'],
    [1330, 'Tiflis', 'Narikala\'nın altında sıcak kükürt hamamları.'],
    [1520, 'Gence', 'Nizami\'nin şehri; Leyla ile Mecnun\'un şairi.'],
    [1650, 'Şamahı', 'Dağların arasından son kıvrım.'],
    [1758, 'Bakü', 'Qız Qalası.'],
  ];
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const mine = () => (K.isOwner() ? 'me' : 'her');
  let man = [], raw = [], loaded = false, root = null;

  // Gün → kişi → adım (aynı günün en büyüğü)
  function days() {
    const m = { me: {}, her: {} };
    const put = (w, d, s) => {
      if (!m[w] || !/^\d{4}-\d{2}-\d{2}$/.test(d) || !(s >= 0) || s > 120000) return;
      m[w][d] = Math.max(m[w][d] || 0, Math.round(s));
    };
    man.forEach((r) => put(r.who, r.data.day, +r.data.steps));
    raw.forEach((r) => {
      try {
        const j = typeof r.raw === 'string' ? JSON.parse(r.raw) : r.raw;
        put(r.who, String(j.d || '').slice(0, 10), parseFloat(String(j.s).replace(',', '.')));
      } catch (e) {}
    });
    return m;
  }
  function progress() {
    if (!loaded) return null;
    const m = days();
    const km = (w) => Object.values(m[w]).reduce((a, s) => a + s, 0) * STRIDE[w] / 1000;
    const me = km('me'), her = km('her');
    if (!me && !her) return null;
    return { me, her, total: TOTAL, met: me + her >= TOTAL, days: m };
  }
  const placeAt = (km) => STOPS.reduce((best, s) => (Math.abs(s[0] - km) < Math.abs(best[0] - km) ? s : best), STOPS[0]);
  function render() {
    if (!root || K.activeRoom !== 'bulusalim') return;
    const p = progress() || { me: 0, her: 0, met: false, days: { me: {}, her: {} } };
    const xm = Math.min(TOTAL, p.me), xh = Math.max(0, TOTAL - p.her);
    const meetKm = p.met ? (p.me / (p.me + p.her)) * TOTAL : 0;
    const D0 = 'M20 70 C120 40 200 96 300 70 S480 40 580 70';
    K.$('#bsYol', root).innerHTML = `<svg class="bs-svg" viewBox="0 0 600 120" role="img" aria-label="${K.esc(nameOf('me'))} ${Math.round(p.me)} km, ${K.esc(nameOf('her'))} ${Math.round(p.her)} km">
      <path d="${D0}" class="bs-yol" id="bsPath"/>
      <path d="${D0}" class="bs-me" pathLength="${TOTAL}" stroke-dasharray="${Math.min(TOTAL, p.me).toFixed(1)} ${TOTAL * 2}"/>
      <path d="${D0}" class="bs-her" pathLength="${TOTAL}" stroke-dasharray="0 ${(TOTAL - Math.min(TOTAL, p.her)).toFixed(1)} ${Math.min(TOTAL, p.her).toFixed(1)} 0"/>
      ${STOPS.map(([km, n], i) => `<g class="bs-dur ${km <= p.me || km >= TOTAL - p.her ? 'gecildi' : ''}" data-km="${km}"><circle r="4"/><text y="${i % 2 ? 26 : -12}" text-anchor="middle">${K.esc(n)}</text></g>`).join('')}
      ${p.met ? `<text class="bs-kalp" data-km="${meetKm.toFixed(1)}" data-dy="-14" text-anchor="middle">💞</text>` : `<g class="bs-yuruyen me" data-km="${xm.toFixed(1)}" data-dy="-14"><circle r="10"/><text y="4" text-anchor="middle">🚶‍♂️</text></g><g class="bs-yuruyen her" data-km="${xh.toFixed(1)}" data-dy="-14"><circle r="10"/><text y="4" text-anchor="middle">🚶‍♀️</text></g>`}
    </svg>`;
    // Durakları ve yürüyüşçüleri yolun gerçek eğrisine yerleştir
    const path = K.$('#bsPath', root);
    const L = path.getTotalLength ? path.getTotalLength() : 0;
    K.$$('[data-km]', root).forEach((g) => {
      if (!L) return;
      const pt = path.getPointAtLength((L * +g.dataset.km) / TOTAL);
      g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${(pt.y + (+g.dataset.dy || 0)).toFixed(1)})`);
    });
    const left = Math.max(0, TOTAL - p.me - p.her);
    K.$('#bsSay', root).innerHTML = p.met
      ? `<p class="bs-bulustuk">💞 ${K.esc(placeAt(meetKm)[1])} civarında buluştunuz!</p>`
      : `<div class="bs-say"><span><b>${K.num(Math.round(p.me))}</b> km<small>${K.esc(nameOf('me'))}</small></span><span class="bs-kalan"><b>${K.num(Math.round(left))}</b> km<small>kaldı</small></span><span><b>${K.num(Math.round(p.her))}</b> km<small>${K.esc(nameOf('her'))}</small></span></div>`;
    // Son 7 gün
    const last = Array.from({ length: 7 }, (_, i) => T.key(T.baku(new Date(T.now().getTime() - (6 - i) * 864e5))));
    const mx = Math.max(1000, ...last.flatMap((d) => [p.days.me[d] || 0, p.days.her[d] || 0]));
    K.$('#bsHafta', root).innerHTML = `<p class="card-eyebrow">Son yedi gün</p><div class="bs-bar">${last.map((d) => `<div><span class="me" style="--h:${(((p.days.me[d] || 0) / mx) * 100).toFixed(0)}%" title="${K.num(p.days.me[d] || 0)}"></span><span class="her" style="--h:${(((p.days.her[d] || 0) / mx) * 100).toFixed(0)}%" title="${K.num(p.days.her[d] || 0)}"></span><small>${+d.slice(8)}</small></div>`).join('')}</div><p class="bs-leg"><i class="me"></i>${K.esc(nameOf('me'))} <i class="her"></i>${K.esc(nameOf('her'))}</p>`;
    const today = p.days[mine()][T.todayKey()] || 0;
    K.$('#bsBugun', root).innerHTML = `<p>Bugün: <b>${K.num(today)}</b> adım${today ? ` (${(today * STRIDE[mine()] / 1000).toFixed(1)} km)` : ''}</p>`;
    // Geçilen şehirler
    const passed = STOPS.filter(([km]) => km > 0 && km < TOTAL && (km <= p.me || km >= TOTAL - p.her));
    K.$('#bsKart', root).innerHTML = passed.length ? `<p class="card-eyebrow">Yoldan kartpostallar</p><div class="bs-kartlar">${passed.map(([km, n, t]) => `<div class="bs-kp ${km <= p.me ? 'me' : 'her'}"><b>${K.esc(n)}</b><p>${K.esc(t)}</p><small>${km <= p.me ? K.esc(nameOf('me')) : K.esc(nameOf('her'))} geçti</small></div>`).join('')}</div>` : '';
  }
  async function addManual(btn) {
    const inp = K.$('#bsAdim', root);
    const n = parseInt(String(inp.value).replace(/\D/g, ''), 10);
    if (!(n > 0 && n < 120000)) return inp.focus();
    btn.disabled = true;
    const r = await K.cloud.add('adim', { day: T.todayKey(), steps: n });
    btn.disabled = false;
    if (!r) return K.fx.toast('Kaydedilemedi.');
    man.push(r);
    inp.value = '';
    changed();
    K.audio.sfx.success();
    K.stickers.award('bulusalim');
  }
  function changed() {
    const p = progress();
    render();
    K.emit('adim', p);
    if (p && p.met && !K.store.get('bsKutlandi')) {
      K.store.set('bsKutlandi', Date.now());
      celebrate(p);
    }
  }
  function celebrate(p) {
    const meet = placeAt((p.me / (p.me + p.her)) * TOTAL);
    K.audio.sfx.chime();
    K.fx.fireworks && K.fx.fireworks(5000);
    K.ui.modal({ label: 'Ortada buluştunuz', cls: 'bs-kutlama', html: `<div class="bs-kut-ic" aria-hidden="true">🚶‍♂️💞🚶‍♀️</div><p class="card-eyebrow">${K.num(TOTAL)} km</p><h2>${K.esc(meet[1])} civarında buluştunuz</h2><p>${K.esc(nameOf('me'))} ${K.num(Math.round(p.me))} km, ${K.esc(nameOf('her'))} ${K.num(Math.round(p.her))} km yürüdü. Bir gün bu yolun gerçeğini birlikte yürüyeceğiz.</p>` });
    K.stickers.award('ortada');
  }
  function guide() {
    const r = K.cloud && K.cloud.raw;
    if (!r) return K.fx.toast('Otomatik adım için ortak kalenin buluta bağlı olması gerekiyor.');
    const fields = [
      ['URL', `${r.url}/rest/v1/kale`],
      ['Başlık: apikey', r.key],
      ['Başlık: Authorization', `Bearer ${r.key}`],
      ['Başlık: Content-Type', 'application/json'],
      ['Gövde (JSON) · space', r.space],
      ['Gövde (JSON) · kind', 'adimham'],
      ['Gövde (JSON) · author', mine()],
    ];
    const m = K.ui.modal({
      label: 'Adımlar kendiliğinden gelsin',
      cls: 'ky-sheet bs-rehber',
      html: `<h2>Adımlar kendiliğinden gelsin</h2><p class="muted">iPhone'daki Kestirmeler uygulaması her gece Sağlık'taki bugünkü adım sayını kaleye yollar. Bir kez kurman yeter.</p>
        <ol class="ky-steps">${[
          'Kestirmeler → alttan Otomasyon → sağ üstte + → Günün Saati → 23:30, Her Gün → "Hemen Çalıştır"ı seç → İleri.',
          'Yeni Boş Kestirme → Eylem ekle → "Sağlık Örneklerini Bul": Tür = Adımlar, Başlangıç Tarihi = Bugün.',
          'Eylem ekle → "İstatistikleri Hesapla" (ya da "Hesapla"): Toplam.',
          'Eylem ekle → "Metin": aşağıdaki kalıbı yaz; tarih için "Geçerli Tarih"i yyyy-MM-dd biçiminde, sayı için önceki adımın sonucunu koy.',
          'Eylem ekle → "URL\'nin İçeriğini Al": aşağıdaki adresi yapıştır. Yöntem: POST. Başlıklar ve İstek Gövdesi (JSON) alanlarını aşağıdan kopyala; "data" alanına Metin\'i koy.',
          'Bitti. İstersen hemen "Çalıştır"a basıp dene; birkaç saniye sonra bu odada bugünkü adımların görünür.',
        ].map((x, i) => `<li><b>${i + 1}</b><p>${K.esc(x)}</p></li>`).join('')}</ol>
        <div class="ky-fields"><div class="ky-field"><small>Metin kalıbı</small><code>{"d":"[Tarih]","s":[Toplam]}</code><button type="button" class="btn ghost small" data-bs-copy="-1">${A.ui('copy')}<span class="sr-only">Kopyala</span></button></div>
        ${fields.map(([l, v], i) => `<div class="ky-field"><small>${K.esc(l)}</small><code>${K.esc(v)}</code><button type="button" class="btn ghost small" data-bs-copy="${i}">${A.ui('copy')}<span class="sr-only">Kopyala</span></button></div>`).join('')}</div>
        <p class="muted small">Bu bilgiler ikinize özel; kestirmeyi kimseyle paylaşma. Adım sayısı bulutta şifresiz durur (yalnız tarih ve sayı).</p>`,
    });
    m.body.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-bs-copy]');
      if (!c) return;
      const i = +c.dataset.bsCopy;
      const ok = await K.copy(i < 0 ? '{"d":"[Tarih]","s":[Toplam]}' : fields[i][1]);
      K.fx.toast(ok ? 'Kopyalandı.' : 'Kopyalanamadı; elle seç.', { duration: 1500, log: false });
    });
  }
  async function load() {
    const [a, b] = await Promise.all([K.cloud.list('adim', 2000), K.cloud.rawList('adimham', 800)]);
    man = a;
    raw = b;
    loaded = true;
    changed();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    await load();
    K.cloud.on('adim', (r) => man.some((x) => x.id === r.id) || (man.push(r), changed()));
    // Kestirme gece yollar: sabah ve kale açıldıkça yenile
    document.addEventListener('visibilitychange', () => !document.hidden && K.cloud.raw && K.cloud.rawList('adimham', 800).then((b) => ((raw = b), changed())));
  });
  K.room({
    id: 'bulusalim',
    wing: 'kalp',
    title: 'Ortada Buluşalım',
    sub: 'Adım adım 1.758 km',
    icon: 'map',
    color: '#E4F4FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => {
      const p = progress();
      return p ? `${K.num(Math.round(Math.max(0, TOTAL - p.me - p.her)))} km` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Adımlarımız kilometreye dönüşüyor. ${K.esc(C.myPet)} İstanbul'dan doğuya, ${K.esc(C.herPet)} Bakü'den batıya yürüyor; Karadeniz kıyısı, Batum, Tiflis ve Gence üzerinden. İkimizin toplamı 1.758 km olunca yolun neresindeysek orada buluşuyoruz.</p></div>
        <section class="card bs-kart"><div id="bsYol"></div><div id="bsSay"></div></section>
        <section class="card bs-ekle"><div id="bsBugun"></div>
          <div class="row"><input class="input" id="bsAdim" inputmode="numeric" placeholder="Bugünkü adım sayın" maxlength="6"><button type="button" class="btn red" data-bs="ekle">Ekle</button></div>
          <button type="button" class="btn soft small" data-bs="rehber">⚙️ iPhone Sağlık'tan kendiliğinden gelsin</button></section>
        <section class="card" id="bsHafta"></section>
        <section id="bsKart"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-bs]');
        if (!b) return;
        if (b.dataset.bs === 'ekle') addManual(b);
        else guide();
      });
    },
    enter() {
      render();
      K.cloud && K.cloud.raw && K.cloud.rawList('adimham', 800).then((b) => ((raw = b), changed()));
    },
  });
  K.bulusalim = { progress, STOPS, TOTAL };
})();
