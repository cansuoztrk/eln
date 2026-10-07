/* Oda: Rüya Postası — sabah uyanınca gördüğün rüyayı birkaç kelimeyle yazarsın; Kitty ondan küçük, tuhaf bir rüya kartı
   çizer (rüyadaki kelimelerden çizimler, gece renkleri, bir ad: "Ay'a Merdiven Kuran Kedinin Rüyası"). Aynı gece
   ikiniz de birbirinizi gördüyseniz o geceki iki kart altın olur. Kayıtlar: ruya {day, text, sen, his} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const HIS = [['🙂', 'Tatlı'], ['🤪', 'Tuhaf'], ['😱', 'Korkunç'], ['🥹', 'Duygusal'], ['😂', 'Komik'], ['🌀', 'Karmaşık']];
  const PAL = [['#241a4a', '#6c4fc2', '#ffb3cf'], ['#1d2b55', '#3c7bbf', '#ffe38a'], ['#3a1838', '#a8417e', '#ffd6e5'], ['#123a3a', '#2f8f87', '#d8f5e8'], ['#2b1b10', '#a0582a', '#ffd9a8']];
  const SIFAT = ['Uçan', 'Fısıldayan', 'Kaybolan', 'Şarkı Söyleyen', 'Ters Dönen', 'Pembe', 'Gece Yarısı', 'Sonsuz'];
  let rows = [], loaded = false, root = null;
  // Gece: rüya sabahın günü (Bakü takviminde o sabah)
  const today = () => T.key(T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku));
  const of = (day, w) => rows.filter((r) => r.data.day === day && r.who === w).pop() || null;
  const golden = (r) => r.data.sen && rows.some((x) => x.data.day === r.data.day && x.who !== r.who && x.data.sen);
  function title(r) {
    const words = String(r.data.text).split(/\s+/).filter((w) => w.length > 3);
    const rnd = K.rng(K.hash(r.id || r.data.text));
    const noun = (words.length ? K.pick(words, rnd) : 'Bulut').replace(/[.,!?;:]/g, '');
    return `${K.pick(SIFAT, rnd)} ${noun.charAt(0).toLocaleUpperCase('tr')}${noun.slice(1)}`;
  }
  function kart(r) {
    const rnd = K.rng(K.hash(r.id || r.data.text));
    const pal = golden(r) ? ['#3a2a06', '#c9902a', '#ffe38a'] : K.pick(PAL, rnd);
    const words = String(r.data.text).split(/\s+/);
    const draws = [0, 1, 2].map((i) => (K.siramasal && K.siramasal.cizim ? K.siramasal.cizim(words.slice(i * 3).join(' ') || r.data.text, i + K.hash(r.data.text)) : '')).join('');
    const stars = Array.from({ length: 18 }, () => `<i style="left:${Math.round(rnd() * 100)}%;top:${Math.round(rnd() * 100)}%"></i>`).join('');
    return `<article class="ry-kart ${golden(r) ? 'altin' : ''} ${r.who}" style="--a:${pal[0]};--b:${pal[1]};--c:${pal[2]}"><div class="ry-yildiz" aria-hidden="true">${stars}</div><div class="ry-cizim" aria-hidden="true">${draws}</div>
      <p class="ry-ad">${K.esc(title(r))}${golden(r) ? ' · ✨ altın gece' : ''}</p><p class="ry-metin hand">${K.esc(r.data.text)}</p><footer>${K.esc(nameOf(r.who))} · ${K.esc(T.fmtShort(r.data.day))}${r.data.his ? ' · ' + K.esc(r.data.his) : ''}${r.data.sen ? ' · rüyasında sen vardın' : ''}</footer></article>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'ruya') return;
    const d = today(), me = of(d, mine());
    K.$('#ryBugun', root).innerHTML = me
      ? `<p class="card-eyebrow">Bu sabahın rüyası</p>${kart(me)}`
      : `<p class="card-eyebrow">Günaydın. Bu gece ne gördün?</p><textarea class="input" id="ryText" maxlength="400" rows="3" placeholder="Birkaç kelime yeter: bir deniz, bir kedi, uçuyordum..."></textarea>
        <div class="ry-his">${HIS.map(([e, n]) => `<button type="button" class="btn soft small" data-ry-his="${e} ${n}">${e} ${n}</button>`).join('')}</div>
        <label class="ry-sen"><input type="checkbox" id="rySen"> Rüyamda ${K.esc(nameOf(other()))} vardı</label>
        <div class="row"><button type="button" class="btn red" data-ry-gonder>🌙 Rüyamı postala</button></div>`;
    const list = rows.filter((r) => !(r.data.day === d && r.who === mine())).sort((a, b) => b.at - a.at).slice(0, 30);
    K.$('#ryArsiv', root).innerHTML = list.length ? `<p class="card-eyebrow">Rüya defterimiz</p><div class="ry-liste">${list.map(kart).join('')}</div>` : '';
  }
  let his = '';
  async function send(btn) {
    const text = (K.$('#ryText', root).value || '').trim().slice(0, 400);
    if (!text) return K.$('#ryText', root).focus();
    btn.disabled = true;
    const sen = K.$('#rySen', root).checked;
    const r = await K.cloud.add('ruya', { day: today(), text, sen, his });
    if (!r) return (btn.disabled = false), K.fx.toast('Postalanamadı.');
    rows.some((x) => x.id === r.id) || rows.push(r);
    his = '';
    K.audio.sfx.sparkle();
    K.stickers.award('ruya');
    if (golden(r)) {
      K.fx.rain({ count: 40, shapes: ['star'], colors: ['#FFE38A', '#FFD34E', '#FFFFFF'] });
      K.stickers.award('altinruya');
    }
    K.ping(sen ? `🌙 ${K.meName()} bu gece rüyasında seni gördü` : `🌙 ${K.meName()} rüyasını postaladı`, text.slice(0, 100), ['crescent_moon'], { click: K.roomUrl('ruya') });
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('ruya', 1000);
    loaded = true;
    K.cloud.on('ruya', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const h = T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku).h;
    if (h < 6 || h > 12 || of(today(), mine())) return [];
    const ot = of(today(), other());
    return [{ key: 'ruya', icon: 'moon', title: ot && ot.data.sen ? `🌙 ${nameOf(other())} bu gece rüyasında seni gördü` : '🌙 Rüya Postası', text: ot ? 'Onun rüya kartı hazır. Seninki de gelsin.' : 'Bu gece ne gördün? Birkaç kelime yeter; Kitty kartını çizer.', room: 'ruya', cta: 'Yaz' }];
  });
  K.room({
    id: 'ruya',
    wing: 'kalp',
    title: 'Rüya Postası',
    sub: 'Her sabah bir rüya kartı',
    icon: 'moon',
    color: '#ECE6FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Sabah uyanınca rüyanı birkaç kelimeyle yaz; Kitty ondan küçük, tuhaf bir rüya kartı çizer. Aynı gece ikimiz de birbirimizi gördüysek o geceki iki kart altın olur.</p></div>
        <section class="card ry-bugun" id="ryBugun"></section><section id="ryArsiv"></section>`;
      el.addEventListener('click', (e) => {
        const hb = e.target.closest('[data-ry-his]');
        if (hb) {
          his = hb.dataset.ryHis;
          K.$$('[data-ry-his]', el).forEach((b) => b.classList.toggle('red', b === hb));
          return;
        }
        const g = e.target.closest('[data-ry-gonder]');
        g && send(g);
      });
    },
    enter() {
      render();
    },
  });
})();
