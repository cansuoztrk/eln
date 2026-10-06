/* Kale 2.0 — Her 21'inde Bir Sahne: her ayın 21'inde (Bakü takvimi) ana salonda "Bugün N. ayımız" kartı; dokununca
   kısa, çizimli bir kutlama sahnesi açılır: gece gökyüzü, iki kule arasında ışıktan bir köprü kurulur, ayın sayısı
   belirir, ardından geçen ayın sayıları (kaleye uğranan gün, kalpler, notlar, sesler) ve o aya özel bir cümle. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const YB = () => D.yirmibir || { lines: [] };
  const KINDS = ['selam', 'kucak', 'dusun', 'ozlem', 'kalpk', 'tsmesaj', 'kare', 'hikaye', 'iyilik', 'opucuk', 'nabiz', 'soztut', 'page'];
  const isDay = () => T.baku().d === Number((C.togetherDate || '-21').slice(-2));

  async function stats() {
    const p = T.baku();
    const end = T.at(T.todayKey()).getTime();
    const start = T.at(`${p.mo === 1 ? p.y - 1 : p.y}-${K.pad(p.mo === 1 ? 12 : p.mo - 1)}-${K.pad(p.d)}`).getTime();
    if (!K.cloud || !K.cloud.enabled) return null;
    const rows = await K.cloud.many(KINDS, { since: start, before: end, limit: 4000 });
    const days = new Set(rows.map((r) => T.key(T.baku(new Date(r.at)))));
    const n = (ks) => rows.filter((r) => ks.includes(r.kind)).length;
    return [
      ['🏰', days.size, 'gün kalede'],
      ['💗', n(['selam', 'kucak', 'dusun', 'ozlem', 'opucuk', 'nabiz']), 'kalp ve dokunuş'],
      ['🫙', n(['kalpk', 'page']), 'not ve sayfa'],
      ['📼', n(['tsmesaj']) + n(['kare', 'hikaye']), 'ses ve kare'],
    ];
  }
  async function scene() {
    const months = T.monthsTogether();
    const line = K.fill((YB().lines || [''])[months % Math.max(1, (YB().lines || []).length)] || '');
    const ov = K.el(`<div class="yb-sahne" role="dialog" aria-modal="true" aria-label="${months}. ayımız">
      <div class="yb-gok" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 60}%;--d:${(i % 9) * 0.3}s"></i>`).join('')}</div>
      <div class="yb-kuleler" aria-hidden="true"><span class="yb-k sol">${A.kizKulesi()}</span><span class="yb-kopru"></span><span class="yb-k sag">${A.qizQalasi()}</span></div>
      <div class="yb-yazi"><p class="yb-ust">${K.esc(T.fmt(T.todayKey()))}</p><p class="yb-sayi"><b>${months}</b><small>. ayımız</small></p><p class="yb-cumle hand">${K.esc(line)}</p><div class="yb-stat" id="ybStat"></div>
      <div class="row center"><button type="button" class="btn soft" data-yb-ozet>📖 Bu ayın özetini izle</button><button type="button" class="btn red" data-yb-x>Kaleye dön</button></div></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    K.store.set('ybSeen', T.todayKey());
    K.audio.sfx.chime();
    setTimeout(() => K.fx.fireworks && K.fx.fireworks(3200), 1800);
    K.stickers.award('yirmibirsahne');
    ov.addEventListener('click', (e) => {
      const oz = e.target.closest('[data-yb-ozet]');
      if (!e.target.closest('[data-yb-x]') && !oz) return;
      if (oz) setTimeout(() => K.go('ozet'), 300);
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 400);
      K.renderSpecials && K.renderSpecials();
    });
    const st = await stats();
    const box = K.$('#ybStat', ov);
    if (st && box) box.innerHTML = `<p class="card-eyebrow">Geçen ay</p><div>${st.map(([e, n, l]) => `<span><i>${e}</i><b class="tnum">${K.num(n)}</b><small>${K.esc(l)}</small></span>`).join('')}</div>`;
  }
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!isDay() || K.store.get('ybSeen') === T.todayKey()) return [];
    const m = T.monthsTogether();
    if (m < 1) return [];
    return [{ key: 'yirmibir', big: true, icon: 'heart', title: `💗 Bugün ${m}. ayımız`, text: 'İki kule arasında bu gece ışıktan bir köprü kuruluyor. Geçen ayın sayıları da hazır.', run: scene, cta: 'Sahneyi aç' }];
  });
  K.yirmibir = { scene, stats };
})();
