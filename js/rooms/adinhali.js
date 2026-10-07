/* Oda: Adının Yüz Hâli — birbirimizin adını yüz farklı hâlde söylediğimiz bir kaset rafı: uykulu, şarkıyla,
   fısıltıyla, kızmış gibi yaparak, Azerbaycanca... Her kayıt rafta küçük bir kaset. İkimizin kayıtları birlikte yüze
   ulaşınca kale hepsini arka arkaya tek bir parça olarak çalar (yüzü beklemeden de dinlenebilir).
   Kayıtlar: adhal {mood, audio, dur} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const HAL = [
    'uykulu', 'sabah ilk iş', 'fısıltıyla', 'şarkıyla', 'kızmış gibi yaparak', 'Azerbaycanca', 'çok özlemiş', 'gülerek', 'telaşla', 'heceleyerek',
    'radyo spikeri gibi', 'opera sanatçısı gibi', 'bir robot gibi', 'çok uzaktan seslenir gibi', 'kulağına', 'masal anlatır gibi', 'şaşırmış', 'gururla', 'bir çocuk gibi', 'yorgun',
    'yağmurda', 'sınavdan yeni çıkmış', 'çayını içerken', 'esneyerek', 'aşkla', 'bir sır verir gibi', 'tren anonsu gibi', 'Kitty gibi', 'Pamuk gibi miyavlayarak', 'en sevdiğin şarkının ezgisiyle',
    'tersten', 'bir şiir okur gibi', 'kapıdan seslenir gibi', 'telefonda ilk kez arar gibi', 'mutfaktan', 'özür diler gibi', 'barıştıktan sonra', 'teşekkür eder gibi', 'havaalanında görmüş gibi', 'yeni uyanmış',
    'dans ederken', 'kahkaha atarak', 'utanarak', 'çok resmi', 'bir maç spikeri gibi', 'eski bir film yıldızı gibi', 'ninni gibi', 'rüyada', 'bir dilek tutar gibi', 'en güzel hâliyle',
  ];
  const HEDEF = 100;
  let rows = [], root = null, mood = '', calan = false;
  const icin = () => rows.filter((r) => r.who === other());
  function render() {
    if (!root || K.activeRoom !== 'adinhali') return;
    const n = rows.length;
    const kullanilan = new Set(rows.filter((r) => r.who === mine()).map((r) => r.data.mood));
    const sec = HAL.filter((h) => !kullanilan.has(h)).slice(0, 12);
    mood = mood && !kullanilan.has(mood) ? mood : sec[0] || '';
    K.$('#ahRaf', root).innerHTML = `<div class="ah-sayac"><b>${n}</b><span>/ ${HEDEF} hâl</span><i style="--p:${Math.min(1, n / HEDEF)}"></i></div>
      <div class="ah-raf">${rows.slice().sort((a, b) => a.at - b.at).map((r) => `<button type="button" class="ah-kaset ${r.who}" data-ah="${r.id}" title="${K.esc(r.data.mood)}"><span>${K.esc(r.data.mood)}</span><small>${K.esc(nameOf(r.who))}</small></button>`).join('') || '<p class="muted">Raf henüz boş.</p>'}</div>
      <div class="row center"><button type="button" class="btn soft" data-ah-parca ${n >= 3 ? '' : 'disabled'}>${calan ? '⏹ Durdur' : n >= HEDEF ? '▶ Yüz hâlin hepsi' : `▶ Hepsini arka arkaya (${n})`}</button></div>`;
    K.$('#ahKaydet', root).innerHTML = `<p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'in'))} adını söyle</p>
      <div class="ah-haller">${sec.map((h) => `<button type="button" class="chip ${h === mood ? 'on' : ''}" data-ah-hal="${K.esc(h)}">${K.esc(h)}</button>`).join('')}</div>
      <input class="input" id="ahKendi" maxlength="40" placeholder="ya da kendi hâlini yaz">
      <div class="row center"><button type="button" class="btn red" data-ah-kaydet>🎙 "${K.esc(nameOf(other()))}" de · <span id="ahHal">${K.esc(mood)}</span></button></div>`;
  }
  async function parca() {
    if (calan) return (calan = false), K.medya.sus(), render();
    calan = true;
    render();
    const list = rows.slice().sort((a, b) => a.at - b.at);
    for (const r of list) {
      if (!calan) break;
      await new Promise((res) => K.medya.cal(r.data.audio, { onEnd: () => setTimeout(res, 350) }).then((a) => !a && res()));
    }
    calan = false;
    render();
    K.stickers.award('adinhaliparca');
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('adhal', 300);
    K.cloud.on('adhal', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'adinhali',
    wing: 'kalp',
    title: 'Adının Yüz Hâli',
    sub: 'Bir isim, yüz ses',
    icon: 'mic',
    color: '#FDE6F0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (rows.length ? `${rows.length}/${HEDEF}` : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Birbirimizin adını yüz farklı hâlde söylüyoruz: uykulu, şarkıyla, fısıltıyla, kızmış gibi yaparak... Her kayıt rafta bir kaset. Yüze ulaşınca kale hepsini tek bir parça olarak çalar.</p></div>
        <section class="card" id="ahRaf"></section><section class="card" id="ahKaydet"></section>`;
      el.addEventListener('click', async (e) => {
        const k = e.target.closest('[data-ah]');
        if (k) return K.medya.cal(rows.find((r) => r.id === k.dataset.ah).data.audio);
        if (e.target.closest('[data-ah-parca]')) return parca();
        const h = e.target.closest('[data-ah-hal]');
        if (h) {
          mood = h.dataset.ahHal;
          K.$$('[data-ah-hal]', root).forEach((b) => b.classList.toggle('on', b === h));
          K.$('#ahHal', root).textContent = mood;
          return;
        }
        const b = e.target.closest('[data-ah-kaydet]');
        if (!b) return;
        const kendi = K.$('#ahKendi', root).value.trim();
        const m = kendi || mood;
        if (!m) return;
        const res = await K.medya.kaydet(b, 12);
        if (!res) return;
        const r = await K.cloud.add('adhal', { mood: m, audio: res.audio, dur: res.dur });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        mood = '';
        K.stickers.award('adinhali');
        if (rows.length === HEDEF) K.stickers.award('adinhaliyuz');
        K.ping(`🎙 ${K.meName()} adını ${m} söyledi`, `Raf: ${rows.length}/${HEDEF}. Adının Yüz Hâli'nde dinle.`, ['microphone'], { click: K.roomUrl('adinhali') });
        render();
      });
    },
    enter() {
      render();
    },
    leave() {
      calan = false;
    },
  });
})();
