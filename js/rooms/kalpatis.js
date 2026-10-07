/* Oda: Kalp Atışım — telefonu göğsüne bastırıp on saniye kalp atışını kaydedersin (sessiz bir oda, kulaklık mikrofonu
   daha iyi duyar). Kale kayıttaki vuruşları sayar (vuruş/dakika); öbürünün ekranında aynı hızda atan bir kalp ve
   döngüde çalan ses. Uyuyamadığı gecelerde 10/20/30 dakikalık zamanlayıcıyla yastığın altına konacak bir ses.
   Kayıtlar: kalpatis {audio, bpm, dur} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], root = null, playing = null, stopT = 0;
  const son = (w) => rows.filter((r) => r.who === w).sort((a, b) => b.at - a.at)[0];
  // Kayıttan vuruş/dakika: zarfın tepeleri arası ortanca süre
  async function bpmOf(url) {
    try {
      const buf = await (await fetch(url)).arrayBuffer();
      const c = K.audio.ensure();
      const au = await c.decodeAudioData(buf);
      const d = au.getChannelData(0), sr = au.sampleRate;
      const step = Math.floor(sr / 100);
      const env = [];
      for (let i = 0; i < d.length; i += step) {
        let s = 0;
        for (let j = i; j < Math.min(d.length, i + step); j++) s += Math.abs(d[j]);
        env.push(s / step);
      }
      const sm = env.map((_, i) => env.slice(Math.max(0, i - 3), i + 4).reduce((a, b) => a + b, 0) / 7);
      const mean = sm.reduce((a, b) => a + b, 0) / sm.length;
      const peaks = [];
      for (let i = 1; i < sm.length - 1; i++) if (sm[i] > mean * 1.25 && sm[i] >= sm[i - 1] && sm[i] >= sm[i + 1] && (!peaks.length || i - peaks[peaks.length - 1] > 33)) peaks.push(i);
      const gaps = peaks.slice(1).map((p, i) => p - peaks[i]).sort((a, b) => a - b);
      const g = gaps[Math.floor(gaps.length / 2)];
      const bpm = g ? Math.round(6000 / g) : 0;
      return bpm >= 45 && bpm <= 130 ? bpm : 0;
    } catch (e) {
      return 0;
    }
  }
  async function dinle(r, dk) {
    durdur();
    const a = await K.medya.cal(r.data.audio, { loop: true, volume: 0.9 });
    if (!a) return;
    playing = r;
    if (dk) stopT = setTimeout(durdur, dk * 60e3);
    render();
    K.stickers.award('kalpatisdinle');
  }
  function durdur() {
    clearTimeout(stopT);
    stopT = 0;
    K.medya.sus();
    playing = null;
    render();
  }
  function kalp(r, big) {
    const bpm = (r && r.data.bpm) || 72;
    return `<div class="ka-kalp ${playing && r && playing.id === r.id ? 'atiyor' : ''} ${big ? 'buyuk' : ''}" style="--atis:${(60 / bpm).toFixed(3)}s" aria-hidden="true"><svg viewBox="-12 -13 24 21"><path d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="#E5174F"/><path d="M-6 -8 C-8 -6 -8 -3 -6 -1" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"/></svg></div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'kalpatis') return;
    const o = son(other()), m = son(mine());
    K.$('#kaOnun', root).innerHTML = o
      ? `${kalp(o, true)}<p class="center"><b>${K.esc(K.ek(nameOf(other()), 'in'))} kalbi</b><br><small class="muted">${o.data.bpm ? `${o.data.bpm} vuruş/dakika` : 'Kayıt'} · ${K.esc(K.ago(o.at))}</small></p>
        <div class="row center">${playing && playing.id === o.id ? '<button type="button" class="btn soft" data-ka-dur>⏸ Durdur</button>' : `<button type="button" class="btn red" data-ka-dinle="${o.id}">▶ Dinle</button>`}</div>
        <div class="row center ka-zaman"><small class="muted">Uyurken:</small>${[10, 20, 30].map((d) => `<button type="button" class="chip" data-ka-dinle="${o.id}" data-dk="${d}">${d} dk</button>`).join('')}</div>`
      : `${kalp(null, true)}<p class="center muted">${K.esc(nameOf(other()))} henüz kalp atışını kaydetmedi.</p>`;
    K.$('#kaBenim', root).innerHTML = `<p class="card-eyebrow">Senin kalbin</p><p class="muted small">Sessiz bir odada telefonu (ya da kulaklığın mikrofonunu) göğsünün sol tarafına bastır, nefesini tut ve on saniye bekle.</p>
      ${m ? `<p>Son kayıt: <b>${m.data.bpm ? `${m.data.bpm} vuruş/dakika` : 'sayılamadı'}</b> · ${K.esc(K.ago(m.at))}</p>` : ''}
      <div class="row center"><button type="button" class="btn red" data-ka-kaydet>🎙 10 saniye kaydet</button></div>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('kalpatis', 40);
    K.cloud.on('kalpatis', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'kalpatis',
    wing: 'kalp',
    title: 'Kalp Atışım',
    sub: 'Yastığın altına bir kalp',
    icon: 'heart',
    color: '#FFE0E6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>On saniyelik bir kalp atışı. Kale vuruşları sayar; onun ekranında aynı hızda atan bir kalp ve döngüde çalan ses olur. Uyuyamadığın gecelerde telefonu yastığın altına koy.</p></div>
        <section class="card ka-kart" id="kaOnun"></section><section class="card" id="kaBenim"></section>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-ka-dur]')) return durdur();
        const d = e.target.closest('[data-ka-dinle]');
        if (d) return dinle(rows.find((r) => r.id === d.dataset.kaDinle), +d.dataset.dk || 0);
        const b = e.target.closest('[data-ka-kaydet]');
        if (!b) return;
        const res = await K.medya.kaydet(b, 10);
        if (!res) return;
        const bpm = await bpmOf(res.url);
        const r = await K.cloud.add('kalpatis', { audio: res.audio, bpm, dur: res.dur });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        K.stickers.award('kalpatis');
        K.fx.toast(bpm ? `💓 Kalbin dakikada <b>${bpm}</b> kez atıyor.` : '💓 Kaydedildi. Vuruşları sayamadım ama sesi duyulacak.', { duration: 3000 });
        K.ping(`💓 ${K.meName()} sana kalp atışını gönderdi`, bpm ? `Dakikada ${bpm} vuruş. Yastığının altına koy.` : 'Yastığının altına koy.', ['heartbeat'], { click: K.roomUrl('kalpatis') });
        render();
      });
    },
    enter() {
      render();
    },
    leave() {
      if (!stopT) durdur();
    },
  });
  K.kalpatis = { bpmOf };
})();
