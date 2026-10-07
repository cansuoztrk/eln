/* Oda: Kazı Kazan Mektup — mektubun bazı kelimeleri gümüş kaplı; parmakla kazıyınca ortaya çıkar. Yazan, gizlemek
   istediği kelimeleri *yıldız* içine alır; en güzel cümleyi en sona saklar. Bütün gümüşler kazınınca yazana haber gider.
   Kayıtlar: kazikazan {text} · kazikazanac {ref} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], acilan = [], root = null;
  // "Seni *çok* seviyorum" → [{t:'Seni '}, {t:'çok', gizli:true}, {t:' seviyorum'}]
  function parca(text) {
    const out = [];
    String(text || '').split(/(\*[^*\n]{1,80}\*)/).forEach((p) => p && out.push(p.startsWith('*') && p.endsWith('*') && p.length > 2 ? { t: p.slice(1, -1), gizli: true } : { t: p }));
    return out;
  }
  const acikMi = (r) => acilan.some((x) => x.data.ref === r.id);
  function html(text, kazi) {
    return parca(text)
      .map((p, i) => (p.gizli ? `<span class="kk-gizli ${kazi ? '' : 'acik'}" data-kk="${i}"><span>${K.esc(p.t)}</span>${kazi ? '<canvas></canvas>' : ''}</span>` : K.esc(p.t).replace(/\n/g, '<br>')))
      .join('');
  }
  // Her gümüş kelimenin üstüne kazınabilir bir tuval
  function gumus(box, onDone) {
    const spans = K.$$('.kk-gizli', box);
    let kalan = spans.length;
    if (!kalan) return onDone();
    spans.forEach((sp) => {
      const cv = K.$('canvas', sp);
      const w = sp.offsetWidth + 6, h = sp.offsetHeight + 4;
      const dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      const g = cv.getContext('2d');
      g.scale(dpr, dpr);
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, '#cfd3da');
      gr.addColorStop(0.5, '#f4f6f9');
      gr.addColorStop(1, '#b8bec8');
      g.fillStyle = gr;
      g.beginPath();
      g.roundRect ? g.roundRect(0, 0, w, h, 6) : g.rect(0, 0, w, h);
      g.fill();
      g.fillStyle = 'rgba(120,128,140,.35)';
      for (let i = 0; i < w * h * 0.02; i++) g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      g.globalCompositeOperation = 'destination-out';
      let bitti = false, sayac = 0;
      const kazi = (e) => {
        if (bitti) return;
        const b = cv.getBoundingClientRect();
        g.beginPath();
        g.arc(e.clientX - b.left, e.clientY - b.top, Math.max(9, h * 0.45), 0, Math.PI * 2);
        g.fill();
        if (++sayac % 6) return;
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        let bos = 0;
        for (let i = 3; i < d.length; i += 16) d[i] < 40 && bos++;
        if (bos / (d.length / 16) > 0.55) {
          bitti = true;
          sp.classList.add('acik');
          cv.remove();
          K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
          if (--kalan === 0) onDone();
        }
      };
      cv.addEventListener('pointerdown', (e) => (cv.setPointerCapture(e.pointerId), kazi(e)));
      cv.addEventListener('pointermove', (e) => e.buttons && kazi(e));
    });
  }
  function oku(r) {
    const benim = r.who === mine();
    const kazi = !benim && !acikMi(r);
    const m = K.ui.modal({ label: 'Kazı kazan mektup', cls: 'kk-modal', html: `<p class="card-eyebrow">${K.esc(nameOf(r.who))} · ${K.esc(T.fmt(new Date(r.at)))}</p><div class="kk-kagit">${html(r.data.text, kazi)}</div>${kazi ? '<p class="muted small center">Gümüşleri parmağınla kazı.</p>' : ''}<p class="kk-imza">— ${K.esc(nameOf(r.who))}</p>` });
    if (!kazi) return;
    requestAnimationFrame(() =>
      gumus(K.$('.kk-kagit', m.el), async () => {
        K.fx.confetti({ count: 90, shapes: ['heart', 'star'] });
        const o = await K.cloud.add('kazikazanac', { ref: r.id });
        o && !acilan.some((x) => x.id === o.id) && acilan.push(o);
        K.stickers.award('kazikazanac');
        K.ping(`🪙 ${K.meName()} kazı kazan mektubundaki bütün gümüşleri kazıdı`, 'Sakladığın cümle artık onda.', ['coin'], { click: K.roomUrl('kazikazan') });
        render();
      })
    );
  }
  function render() {
    if (!root || K.activeRoom !== 'kazikazan') return;
    const gelen = rows.filter((r) => r.who === other()).sort((a, b) => b.at - a.at);
    const giden = rows.filter((r) => r.who === mine()).sort((a, b) => b.at - a.at);
    K.$('#kkListe', root).innerHTML = `<section class="card"><p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'den'))}</p>${gelen.length ? gelen.map((r) => `<button type="button" class="kk-satir ${acikMi(r) ? '' : 'yeni'}" data-kk-ac="${r.id}"><span>${acikMi(r) ? '✉️' : '🪙'}</span><b>${K.esc(T.fmt(new Date(r.at)))}</b><small>${acikMi(r) ? 'kazındı' : `${parca(r.data.text).filter((p) => p.gizli).length} gümüş`}</small></button>`).join('') : '<p class="muted small">Henüz gelmedi.</p>'}</section>
      ${giden.length ? `<section class="card"><p class="card-eyebrow">Gönderdiklerin</p>${giden.map((r) => `<button type="button" class="kk-satir" data-kk-ac="${r.id}"><span>📨</span><b>${K.esc(T.fmt(new Date(r.at)))}</b><small>${acikMi(r) ? 'kazıdı ✓' : 'henüz kazımadı'}</small></button>`).join('')}</section>` : ''}`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, acilan] = await Promise.all([K.cloud.list('kazikazan', 100), K.cloud.list('kazikazanac', 200)]);
    K.cloud.on('kazikazan', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('kazikazanac', (r) => acilan.some((x) => x.id === r.id) || (acilan.push(r), render()));
  });
  K.room({
    id: 'kazikazan',
    wing: 'anilar',
    title: 'Kazı Kazan Mektup',
    sub: 'Gümüşün altındaki kelimeler',
    icon: 'gift',
    color: '#EEF1F5',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Mektubun bazı kelimeleri gümüşle kaplı; o parmağıyla kazıyınca ortaya çıkar. Gizlemek istediğin kelimeleri *yıldız* içine al. En güzel cümleyi en sona sakla.</p></div>
        <section class="card"><p class="card-eyebrow">Yeni mektup</p><textarea class="textarea" id="kkMetin" maxlength="1500" placeholder="Mesela: Bugün seni düşündüm ve *gülümsedim*. Bir gün *aynı evde* uyanacağız."></textarea>
        <div class="kk-onizle" id="kkOn"></div><div class="row"><button type="button" class="btn red" data-kk-gonder>🪙 Gönder</button></div></section><div id="kkListe"></div>`;
      el.addEventListener('input', (e) => {
        if (e.target.id !== 'kkMetin') return;
        const v = e.target.value;
        K.$('#kkOn', root).innerHTML = v.includes('*') ? html(v, false).replace(/kk-gizli acik/g, 'kk-gizli onizle') : '';
      });
      el.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-kk-ac]');
        if (a) return oku(rows.find((r) => r.id === a.dataset.kkAc));
        if (!e.target.closest('[data-kk-gonder]')) return;
        const ta = K.$('#kkMetin', root), text = ta.value.trim();
        if (!text) return ta.focus();
        if (!parca(text).some((p) => p.gizli)) return K.fx.toast('En az bir kelimeyi *yıldız* içine al.');
        const r = await K.cloud.add('kazikazan', { text });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        ta.value = '';
        K.$('#kkOn', root).innerHTML = '';
        K.stickers.award('kazikazan');
        K.ping(`🪙 ${K.meName()} sana bir kazı kazan mektup yazdı`, 'Gümüşlerin altında bir şeyler saklı.', ['coin'], { click: K.roomUrl('kazikazan') });
        render();
      });
    },
    enter() {
      render();
    },
  });
  K.kazikazan = { parca };
})();
