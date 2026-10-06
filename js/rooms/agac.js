/* Oda: Anı Ağacı — kalenin bahçesinde ikinizle birlikte büyüyen bir ağaç. Sevgili olduğunuz günden beri her ay
   gövdeden yeni bir dal çıkar; o ay kavanoza notla atılan her kalp o dalda bir yaprak olur (onunki pembe, seninki
   lila); her ayın 21'i dolunca dalın ucunda bir çiçek açar. Bir yaprağa dokununca o not okunur. Ağaç kendiliğinden
   büyür; yazmak için kavanoza not atmak yeter. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], loaded = false, root = null, leaves = [];
  const MON = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  // Sevgili olduğumuz günden itibaren ay dilimleri: i. ay [başlangıç, bitiş)
  function months() {
    const [y0, m0, d0] = C.togetherDate.split('-').map(Number);
    const n = T.monthsTogether() + 1;
    return Array.from({ length: n }, (_, i) => {
      const a = T.at(`${y0 + Math.floor((m0 - 1 + i) / 12)}-${K.pad(((m0 - 1 + i) % 12) + 1)}-${K.pad(d0)}`).getTime();
      const b = T.at(`${y0 + Math.floor((m0 + i) / 12)}-${K.pad(((m0 + i) % 12) + 1)}-${K.pad(d0)}`).getTime();
      return { i, a, b, label: MON[(m0 - 1 + i) % 12], done: i < n - 1 };
    });
  }
  function draw() {
    if (!root) return;
    const ms = months();
    const r = K.rng(21);
    const M = ms.length;
    const W = 420, H = Math.max(420, 200 + M * 34), base = H - 30, top = 70;
    const trunkTop = base - Math.min(H - 110, 90 + M * 30);
    let svg = `<svg class="ag-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Anı Ağacı: ${M} dal, ${rows.length} yaprak">
      <ellipse cx="${W / 2}" cy="${base + 8}" rx="170" ry="16" fill="#d8f5e8"/>
      <path d="M${W / 2 - 16} ${base} C${W / 2 - 10} ${(base + trunkTop) / 2} ${W / 2 - 8} ${trunkTop + 30} ${W / 2 - 3} ${trunkTop} L${W / 2 + 3} ${trunkTop} C${W / 2 + 8} ${trunkTop + 30} ${W / 2 + 10} ${(base + trunkTop) / 2} ${W / 2 + 16} ${base} Z" fill="#a9714f"/>`;
    leaves = [];
    let leafSvg = '', flowers = '', labels = '';
    ms.forEach((m) => {
      const f = (m.i + 1) / (M + 0.6);
      const sy = base - f * (base - trunkTop);
      const side = m.i % 2 ? 1 : -1;
      const len = (M === 1 ? 110 : 150 - f * 70) * (0.85 + r() * 0.3);
      const ang = (-0.35 - r() * 0.45) * Math.PI;
      const ex = W / 2 + side * Math.abs(Math.cos(ang)) * len, ey = Math.max(top, sy + Math.sin(ang) * len * 0.75);
      const cx = W / 2 + side * len * 0.35, cy = sy - 10;
      svg += `<path d="M${W / 2} ${sy} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="#a9714f" stroke-width="${(7 - f * 4).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
      const mine = rows.filter((x) => x.at >= m.a && x.at < m.b);
      mine.forEach((x, k) => {
        const t = 0.32 + (0.68 * (k + 1)) / (mine.length + 1);
        const px = (1 - t) * (1 - t) * (W / 2) + 2 * (1 - t) * t * cx + t * t * ex;
        const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
        const off = (k % 2 ? 1 : -1) * (8 + r() * 6);
        const rot = Math.round((side > 0 ? -30 : 210) + (k % 2 ? 50 : -50) + r() * 30);
        leaves.push(x);
        leafSvg += `<g class="ag-yaprak ${x.who}" data-ag="${leaves.length - 1}" tabindex="0" role="button" aria-label="${K.esc(nameOf(x.who))}: yaprak" transform="translate(${px.toFixed(1)} ${(py + off).toFixed(1)}) rotate(${rot})"><path d="M0 0 C6 -7 16 -7 22 0 C16 7 6 7 0 0 Z"/><path d="M2 0 H18" class="ag-damar"/></g>`;
      });
      if (m.done) flowers += `<g class="ag-cicek" transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="5" ry="9" transform="rotate(${a}) translate(0 -8)"/>`).join('')}<circle r="4.5" class="ag-gobek"/></g>`;
      else flowers += `<circle class="ag-tomurcuk" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="5"/>`;
      labels += `<text class="ag-ay" x="${(ex + side * 14).toFixed(1)}" y="${(ey + 4).toFixed(1)}" text-anchor="${side > 0 ? 'start' : 'end'}">${m.label}</text>`;
    });
    svg += leafSvg + flowers + labels + '</svg>';
    const done = ms.filter((m) => m.done).length;
    K.$('#agStage', root).innerHTML = svg;
    K.$('#agSay', root).innerHTML = `<span><b>${M}</b> dal</span><span><b>${rows.length}</b> yaprak</span><span><b>${done}</b> çiçek</span>`;
    K.$('#agNot', root).innerHTML = rows.length ? '<p class="muted">Bir yaprağa dokun.</p>' : `<p class="muted">Ağaç henüz yapraksız. Kavanoza notlu bir kalp attığında ilk yaprak bu ayın dalında çıkacak.</p><a class="btn soft small" href="#kavanoz">Kavanoza git</a>`;
  }
  function showLeaf(i) {
    const x = leaves[i];
    if (!x) return;
    K.audio.sfx.paper ? K.audio.sfx.paper() : K.audio.sfx.tap();
    K.$$('.ag-yaprak.on', root).forEach((g) => g.classList.remove('on'));
    const g = K.$(`[data-ag="${i}"]`, root);
    g && g.classList.add('on');
    K.$('#agNot', root).innerHTML = `<figure class="ag-kart ${x.who}"><blockquote class="hand">${K.esc(x.data.note)}</blockquote><figcaption>${K.esc(nameOf(x.who))} · ${K.esc(T.fmt(new Date(x.at)))}</figcaption></figure>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = (await K.cloud.list('kalpk', 4000)).filter((x) => x.data && x.data.note);
    loaded = true;
    K.cloud.on('kalpk', (x) => {
      if (!x.data || !x.data.note || rows.some((y) => y.id === x.id)) return;
      rows.push(x);
      K.activeRoom === 'agac' && draw();
    });
    K.activeRoom === 'agac' && draw();
  });

  K.room({
    id: 'agac',
    wing: 'anilar',
    title: 'Anı Ağacı',
    sub: 'Her ay bir dal, her not bir yaprak',
    icon: 'lily',
    color: '#E3F6EC',
    hidden: () => !C.togetherDate,
    badge: () => (loaded ? String(rows.length) : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kalenin bahçesinde ikimizle birlikte büyüyen bir ağaç. Her ay gövdeden yeni bir dal çıkıyor; kavanoza notla attığımız her kalp o ayın dalında bir yaprak oluyor. Her 21'i dolunca dalın ucunda bir çiçek açıyor.</p></div>
        <div class="ag-say" id="agSay"></div>
        <div class="card ag-bahce" id="agStage"></div>
        <div class="ag-not" id="agNot" aria-live="polite"></div>`;
      el.addEventListener('click', (e) => {
        const g = e.target.closest('[data-ag]');
        g && showLeaf(+g.dataset.ag);
      });
      el.addEventListener('keydown', (e) => {
        const g = e.target.closest && e.target.closest('[data-ag]');
        if (g && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          showLeaf(+g.dataset.ag);
        }
      });
    },
    enter() {
      draw();
      K.stickers.award('agac');
    },
  });
  K.agac = { leaves: () => rows.length };
})();
