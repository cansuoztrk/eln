/* Oda: Masalın Devamı — İki Kule Masalı "Devamı var..." diye biter; devamını ikisi sırayla, cümle cümle yazar.
   Kalem sırayla geçer (biri yazınca öbürüne); öbürü birkaç gün yazmazsa kalem geri döner.
   Her altı sayfa bir bölüm olur; bölümün resmi, içinde geçen kelimelere göre masalın sahnelerinden seçilir.
   Kale Kitabı'na da bölüm olarak girer. Bulutla iki yönlü. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [];
  const DV = () => D.devam || { intro: [], chapters: [], wait: 3 };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const PER = 6;
  const MAX = 240;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const pages = () => (DV().first ? [{ id: 'first', who: 'me', at: 0, data: { text: DV().first } }] : []).concat(rows);
  function turn() {
    const ps = pages();
    const last = ps[ps.length - 1];
    if (!last) return { mine: true };
    if (last.who !== mine()) return { mine: true };
    const waited = last.at ? (T.now().getTime() - last.at) / 864e5 : 0;
    const w = DV().wait || 3;
    return waited >= w ? { mine: true, late: true } : { mine: false, left: Math.max(1, Math.ceil(w - waited)) };
  }

  // Bölüm resmi: bölümdeki kelimelere göre masalın sahnelerinden biri
  const KEYS = [
    ['baku', ['bakü', 'bakı', 'hazar', 'qız qala', 'qızqala', 'rüzgâr', 'rüzgar', 'xəzri']],
    ['istanbul', ['istanbul', 'boğaz', 'kız kulesi', 'vapur', 'martı']],
    ['winter', ['kar ', 'kar,', 'kar.', 'kış', 'soğuk', 'atkı', 'buz']],
    ['together', ['sarıl', 'kavuş', 'birlikte', 'el ele', 'öp', 'kucak']],
    ['future', ['uçak', 'havaliman', 'bilet', 'valiz', 'bavul', 'gelecek', 'yolculuk']],
    ['notes', ['not', 'kâğıt', 'kağıt', 'mektup', 'duvar', 'zarf', 'güvercin']],
    ['birthday', ['doğum', 'pasta', 'mum', 'hediye', 'balon']],
    ['azeri', ['azerbaycan', 'sevirəm', 'xeyir', 'gözəl', 'dil ']],
    ['question', ['neden', 'acaba', 'soru', 'merak']],
    ['distance', ['uzak', 'kilometre', 'özle', 'bekle', 'ekran']],
    ['crush', ['kalp', 'aşk', 'sev', 'gülümse', 'yanak']],
  ];
  function sceneFor(text) {
    const t = ' ' + text.toLocaleLowerCase('tr-TR') + ' ';
    let best = 'future', n = 0;
    KEYS.forEach(([s, words]) => {
      const c = words.reduce((a, w) => a + t.split(w).length - 1, 0);
      if (c > n && K.scenes && K.scenes[s]) (best = s), (n = c);
    });
    return best;
  }
  function chapters() {
    const ps = pages();
    const out = [];
    for (let i = 0; i < ps.length; i += PER) {
      const list = ps.slice(i, i + PER);
      const n = out.length;
      out.push({ n, roman: ROMAN[n] || String(n + 1), name: (DV().chapters || [])[n] || '', pages: list, scene: sceneFor(list.map((p) => p.data.text).join(' ')), start: i });
    }
    return out;
  }

  function render() {
    if (!root) return;
    const chs = chapters();
    const all = pages();
    K.$('#dvBook', root).innerHTML = chs
      .map(
        (c) => `<section class="dv-ch">
          <header class="dv-head"><div class="dv-scene" aria-hidden="true"><svg viewBox="0 0 320 200">${K.scenes && K.scenes[c.scene] ? K.scenes[c.scene]() : ''}</svg></div>
            <p class="card-eyebrow">Bölüm ${c.roman}</p>${c.name ? `<h3>${K.esc(c.name)}</h3>` : ''}</header>
          ${c.pages
            .map((p, k) => {
              const last = c.start + k === all.length - 1;
              return `<p class="dv-p ${p.who} ${k === 0 ? 'first' : ''}"><span class="dv-t">${K.esc(K.fill(p.data.text))}</span><small>${K.esc(nameOf(p.who))}${p.at ? ` · ${K.esc(T.fmtShort(new Date(p.at)))}` : ''}${last && p.who === mine() && p.at ? ` <button type="button" class="dv-x" data-del="${p.id}" aria-label="Bu sayfayı geri al">${A.ui('close')}</button>` : ''}</small></p>`;
            })
            .join('')}
        </section>`
      )
      .join('');
    const t = turn();
    const box = K.$('#dvPen', root);
    const left = all.length % PER === 0 ? 'Bir sonraki cümle yeni bir bölüm açacak.' : `Bu bölümün bitmesine ${PER - (all.length % PER)} sayfa var.`;
    if (t.mine) {
      box.innerHTML = `<p class="card-eyebrow">${t.late ? `${K.esc(nameOf(other()))} ${DV().wait || 3} gündür yazmadı; kalem sende` : 'Kalem sende'}</p>
        <textarea class="input dv-in" id="dvText" name="dvText" maxlength="${MAX}" rows="3" placeholder="Masal nereye gitsin? Bir ya da iki cümle..."></textarea>
        <div class="dv-row"><span class="muted small" id="dvCount">0/${MAX}</span><button type="button" class="btn red small" id="dvAdd">${A.icon('pencil')} Masala ekle</button></div>
        <p class="muted small">${left}</p>`;
      const ta = K.$('#dvText', box);
      ta.addEventListener('input', () => (K.$('#dvCount', box).textContent = `${ta.value.length}/${MAX}`));
    } else {
      box.innerHTML = `<div class="dv-wait">${A.icon('pencil')}<p><b>Kalem ${K.esc(K.ek(nameOf(other()), 'de'))}.</b> Onun cümlesini bekliyoruz. ${t.left} gün içinde yazmazsa kalem sana döner.</p></div>`;
    }
    K.$('#dvStat', root).textContent = `${all.length} sayfa · ${chs.length} bölüm · ${K.esc(C.herPet)} ${all.filter((p) => p.who === 'her').length} · ${K.esc(C.myPet)} ${all.filter((p) => p.who === 'me').length}`;
  }

  async function add() {
    const ta = K.$('#dvText', root);
    const text = ta.value.trim().replace(/\s+/g, ' ');
    if (text.length < 3) return ta.focus();
    if (!turn().mine) return render();
    const r = await K.cloud.add('tale', { text });
    if (!r) return K.fx.toast('Eklenemedi. İnterneti kontrol et.');
    K.audio.sfx.chime();
    K.stickers.award('devam');
    const n = pages().length;
    if (n % PER === 1 && n > 1) {
      K.fx.confetti({ count: 90, shapes: ['star', 'heart'] });
      K.fx.toast(`<b>Yeni bölüm açıldı:</b> Bölüm ${ROMAN[Math.floor((n - 1) / PER)] || ''}`, { icon: A.icon('story') });
    }
    if (!K.isOwner()) K.notify(`${C.herName} masala bir cümle ekledi`, text, ['book', 'heart']);
    render();
    const el = K.$$('.dv-p', root).pop();
    el && el.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('tale', 1000);
    K.cloud.on('tale', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} masala yazdı:</b> "${K.esc(r.data.text.length > 70 ? r.data.text.slice(0, 70) + '…' : r.data.text)}" Kalem sende.`, { icon: A.icon('story'), duration: 8000 });
      if (K.activeRoom === 'devam') render();
    });
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'devam') render();
    });
  });
  K.devam = { chapters, enabled: () => Boolean(D.devam && K.cloud && K.cloud.enabled) };

  K.room({
    id: 'devam',
    wing: 'anilar',
    title: 'Masalın Devamı',
    sub: 'İki Kule Masalı\'nı birlikte yazıyoruz',
    icon: 'book',
    color: '#FFE3EE',
    hidden: () => !D.devam || !K.cloud || !K.cloud.enabled,
    badge: () => (turn().mine ? 'Kalem sende' : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(DV().intro)}</div>
        <div class="dv-book" id="dvBook"></div>
        <section class="card dv-pen" id="dvPen"></section>
        <p class="muted small" id="dvStat"></p>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('#dvAdd')) return add();
        const d = e.target.closest('[data-del]');
        if (d) {
          if (d.dataset.armed !== '1') {
            d.dataset.armed = '1';
            d.classList.add('armed');
            return;
          }
          await K.cloud.remove(d.dataset.del);
          render();
        }
      });
    },
    enter() {
      render();
    },
  });
})();
