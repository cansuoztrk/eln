/* Oda: Sevgi Dilimiz — on beş kısa soruluk bir test: iki cümleden hangisi seni daha mutlu eder? Beş dil: güzel sözler,
   birlikte zaman, küçük hediyeler, yardım ve emek, dokunuş (uzaktayken: sarılma bildirimi, ses, öpücük). İkinizin
   sonucu yan yana çıkar. Bundan sonra Bugün Senin İçin'in önerileri haftanın yarısında onun diline göre seçilir.
   Kayıtlar: sevgidili {puan: {soz, zaman, hediye, yardim, dokunus}, top} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const DIL = {
    soz: ['💬', 'Güzel sözler', 'Seni ne kadar sevdiğini duymak, yazılı görmek.'],
    zaman: ['⏳', 'Birlikte zaman', 'Bölünmemiş dikkat: aynı filmi izlemek, saatlerce konuşmak.'],
    hediye: ['🎁', 'Küçük hediyeler', 'Seni düşündüğünü gösteren küçük şeyler.'],
    yardim: ['🛠️', 'Yardım ve emek', 'Yükünü hafifleten, senin için uğraşılan şeyler.'],
    dokunus: ['🤗', 'Dokunuş', 'Sarılmak, el ele tutmak; uzaktayken sarılma bildirimi, ses, öpücük.'],
  };
  const Q = [
    [['soz', 'Bana "seninle gurur duyuyorum" demesi'], ['dokunus', 'Uzun, sıkı bir sarılma']],
    [['zaman', 'Bütün akşam sadece ikimizin konuşması'], ['hediye', 'Bana sürpriz küçük bir paket']],
    [['yardim', 'Zor bir günümde benim yerime bir işi halletmesi'], ['soz', 'Gün ortasında "seni düşünüyorum" mesajı']],
    [['dokunus', 'Uyumadan önce sesli bir iyi geceler'], ['zaman', 'Birlikte aynı filmi izlemek']],
    [['hediye', 'Bir yerde beni hatırlayıp aldığı bir şey'], ['yardim', 'Sınavım için bana not hazırlaması']],
    [['soz', 'Neden beni sevdiğini anlattığı uzun bir mektup'], ['zaman', 'Telefonu bırakıp sadece beni dinlemesi']],
    [['dokunus', 'Ekrana dokunup gönderdiği bir öpücük'], ['hediye', 'Kapıma gelen bir çiçek']],
    [['yardim', 'Bir planı benim için baştan sona ayarlaması'], ['dokunus', 'Kavuşunca bırakmadığı elim']],
    [['zaman', 'Birlikte yemek yaptığımız bir görüntülü akşam'], ['soz', 'Başkalarına benden güzel söz etmesi']],
    [['hediye', 'Bana yazılmış bir şarkı ya da çalma listesi'], ['zaman', 'Bir hafta sonunu tamamen bana ayırması']],
    [['soz', '"İyi ki varsın" demesi'], ['yardim', 'Ben yorgunken sorumluluğumu üstlenmesi']],
    [['dokunus', 'Yanındayken başımı omzuna koymak'], ['soz', 'Beni övdüğü bir sesli mesaj']],
    [['yardim', 'Bozuk bir şeyimi tamir etmesi'], ['zaman', 'Birlikte yürüyüşe çıkmak']],
    [['hediye', 'Doğum günümde düşünülmüş bir hediye'], ['dokunus', 'Sabah ilk iş bir sarılma']],
    [['zaman', 'Kendi işini bırakıp yanımda kalması'], ['yardim', 'Benim için bir şeyi araştırıp çözmesi']],
  ];
  // Bugün Senin İçin'e eklenen, dile göre iyilikler
  const IYI = {
    soz: ['Ona neden onunla gurur duyduğunu üç cümleyle yaz.', 'Bugün ona hiç söylemediğin bir iltifat et.', 'Ona "iyi ki varsın" diye başlayan kısa bir sesli mesaj bırak.', 'Onun bir huyunu ne kadar sevdiğini anlat.'],
    zaman: ['Bu akşam yarım saatini telefonsuz sadece ona ayır.', 'Birlikte bir bölüm dizi ya da kısa bir film izleyin.', 'Ona bugün en çok neyi merak ettiğini sor ve sadece dinle.', 'Görüntülü aramada birlikte bir şey yapın: çay demleyin, yemek yiyin.'],
    hediye: ['Ona bugün küçük bir dijital hediye hazırla: bir şarkı, bir çizim, bir kartpostal.', 'Kalede ona bir mühürlü mektup bırak.', 'Onun sevdiği bir şeyi görünce fotoğrafını çekip gönder: "seni hatırlattı".', 'Kumbaraya bugün onun adına bir şey at.'],
    yardim: ['Bugün onun yapması gereken küçük bir işi senin üstlenebileceğini sor.', 'Onun için bir şeyi araştır: bir tarif, bir yer, bir çözüm.', 'Yorgunsa bugün planları sen yap.', 'Sınavı ya da işi için bir hatırlatma ayarla.'],
    dokunus: ['Uyumadan önce ona bir sarılma gönder.', 'Bugün ekrana dokunup bir öpücük yolla.', 'Kalbinin sesini ona gönder (Kalp Atışım).', 'Siri ya da NFC ile ona bir sarılma gönder.'],
  };
  let rows = [], loaded = false, root = null, step = -1, puan = null;
  const of = (w) => rows.filter((r) => r.who === w).pop() || null;
  function extra() {
    return Object.keys(IYI).flatMap((k) => IYI[k].map((t) => ({ t, lang: k })));
  }
  const topOf = (w) => (of(w) ? of(w).data.top : '');
  function bars(r) {
    const tot = Object.values(r.data.puan).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(DIL).map((k) => `<div class="sd-bar ${k === r.data.top ? 'top' : ''}"><span>${DIL[k][0]} ${K.esc(DIL[k][1])}</span><i style="--p:${((r.data.puan[k] || 0) / tot) * 100}%"></i><b>${r.data.puan[k] || 0}</b></div>`).join('');
  }
  function render() {
    if (!root || K.activeRoom !== 'sevgidili') return;
    const box = K.$('#sdBody', root);
    if (step >= 0 && step < Q.length) {
      const [a, b] = Q[step];
      box.innerHTML = `<p class="card-eyebrow">${step + 1}/${Q.length}</p><h3>Hangisi seni daha mutlu eder?</h3><div class="sd-secim"><button type="button" class="sd-ops" data-sd="${a[0]}">${K.esc(a[1])}</button><span>ya da</span><button type="button" class="sd-ops" data-sd="${b[0]}">${K.esc(b[1])}</button></div><div class="sd-ilerleme"><i style="--p:${(step / Q.length) * 100}%"></i></div>`;
      return;
    }
    const me = of(mine()), ot = of(other());
    box.innerHTML = `${me ? `<div class="sd-sonuc"><p class="card-eyebrow">Senin sevgi dilin</p><h3>${DIL[me.data.top][0]} ${K.esc(DIL[me.data.top][1])}</h3><p class="muted">${K.esc(DIL[me.data.top][2])}</p>${bars(me)}</div>` : `<p>On beş kısa soru, iki dakika. İki cümleden hangisi seni daha mutlu eder?</p>`}
      ${ot ? `<div class="sd-sonuc onun"><p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'in'))} sevgi dili</p><h3>${DIL[ot.data.top][0]} ${K.esc(DIL[ot.data.top][1])}</h3>${me ? bars(ot) : '<p class="muted">Sen de bitirince ayrıntılar açılır.</p>'}</div>` : `<p class="muted">${K.esc(nameOf(other()))} henüz testi çözmedi.</p>`}
      <div class="row"><button type="button" class="btn ${me ? 'soft' : 'red'}" data-sd-basla>${me ? 'Yeniden çöz' : 'Teste başla'}</button></div>
      ${ot ? `<p class="sd-not">💡 Bundan sonra Bugün Senin İçin'deki önerilerin yarısı ${K.esc(K.ek(nameOf(other()), 'in'))} diline göre seçilecek.</p>` : ''}`;
  }
  async function answer(k) {
    puan[k] = (puan[k] || 0) + 1;
    step++;
    K.audio.sfx.tap();
    if (step < Q.length) return render();
    const top = Object.keys(puan).sort((a, b) => puan[b] - puan[a])[0];
    const r = await K.cloud.add('sevgidili', { puan, top });
    if (r) rows.push(r);
    step = -1;
    K.fx.confetti({ count: 70 });
    K.stickers.award('sevgidili');
    K.ping(`💬 ${K.meName()} sevgi dilini buldu`, `${DIL[top][1]}. Seninki de çıksın mı?`, ['love_letter'], { click: K.roomUrl('sevgidili') });
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('sevgidili', 50);
    loaded = true;
    K.cloud.on('sevgidili', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'sevgidili',
    wing: 'kalp',
    title: 'Sevgi Dilimiz',
    sub: 'Söz, zaman, hediye, yardım, dokunuş',
    icon: 'heart',
    color: '#FFE3EE',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !of(mine()) ? '?' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Herkes sevgiyi biraz farklı bir dilde duyar. Kimi güzel bir sözde, kimi birlikte geçen bir akşamda, kimi bir sarılmada. Hangisi bizim dilimiz?</p></div><section class="card sd-kart" id="sdBody"></section>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-sd-basla]')) {
          step = 0;
          puan = {};
          return render();
        }
        const b = e.target.closest('[data-sd]');
        b && answer(b.dataset.sd);
      });
    },
    enter() {
      render();
    },
  });
  K.sevgidili = { extra, topOf, DIL };
})();
