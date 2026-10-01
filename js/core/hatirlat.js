/* Kale 2.0 — Kale Hatırlatıcı: ay dönümü (her ayın 21'i), birlikte geçen her yüzüncü gün, doğum günleri (bir gün önceden
   öbürüne de hatırlatma), sevgili olduğumuz gün ve tanıştığımız gün yaklaşınca iki telefona kendiliğinden bir not düşer.
   ntfy ileri tarihli gönderimi en fazla üç gün önceden kurabildiği için kim kaleye girerse önümüzdeki üç günü kurar;
   aynı not ikinci kez kurulmaz. Kayıt: planli {key} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const H = () => D.hatirlat || {};
  const tzOf = (w) => (w === 'her' ? C.tzBaku : C.tzIstanbul);
  const atIn = (w, y, mo, d, h, mi = 0) => Date.UTC(y, mo - 1, d, h, mi) - tzOf(w) * 36e5;
  let rows = [], busy = false;

  function fill(s, v) {
    return String(s || '')
      .replace(/\{n\}/g, v.n != null ? v.n : '')
      .replace(/\{me\}/g, C.myPet)
      .replace(/\{her\}/g, C.herPet)
      .replace(/\{name\}/g, v.name || '');
  }
  // Önümüzdeki üç günün olayları: [{key, to, at, tpl, v}]
  function upcoming() {
    const out = [];
    if (!C.togetherDate) return out;
    const [ty, tm, td] = C.togetherDate.split('-').map(Number);
    const startDay = T.dayNumber(T.at(C.togetherDate));
    for (let o = 0; o <= 3; o++) {
      const p = T.baku(new Date(Date.now() + o * 864e5));
      const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
      const dayNo = Math.floor(Date.UTC(p.y, p.mo - 1, p.d) / 864e5) - startDay;
      // Ay dönümü
      const months = (p.y - ty) * 12 + (p.mo - tm);
      if (p.d === td && months > 0 && months % 12) {
        out.push({ key: `ay-${months}`, to: 'her', at: atIn('her', p.y, p.mo, p.d, 9), tpl: H().ayHer, v: { n: months } });
        out.push({ key: `ay-${months}`, to: 'me', at: atIn('me', p.y, p.mo, p.d, 10), tpl: H().ayMe, v: { n: months } });
      }
      // Yıldönümü (sevgili olduğumuz gün)
      if (md === C.togetherDate.slice(5) && p.y > ty) {
        ['her', 'me'].forEach((w) => out.push({ key: `yil-${p.y}`, to: w, at: atIn(w, p.y, p.mo, p.d, 9), tpl: H().yildonumu, v: { n: p.y - ty } }));
      }
      // Her yüzüncü gün
      if (dayNo > 0 && dayNo % 100 === 0) {
        out.push({ key: `gun-${dayNo}`, to: 'her', at: atIn('her', p.y, p.mo, p.d, 9, 30), tpl: H().gunHer, v: { n: dayNo } });
        out.push({ key: `gun-${dayNo}`, to: 'me', at: atIn('me', p.y, p.mo, p.d, 10, 30), tpl: H().gunMe, v: { n: dayNo } });
      }
      // Tanışma yıldönümü
      if (C.metDate && md === C.metDate.slice(5) && p.y > +C.metDate.slice(0, 4)) {
        ['her', 'me'].forEach((w) => out.push({ key: `tanis-${p.y}`, to: w, at: atIn(w, p.y, p.mo, p.d, 9), tpl: H().tanisma, v: { n: p.y - +C.metDate.slice(0, 4) } }));
      }
      // Doğum günleri: sahibine gece yarısı, öbürüne bir gün önce akşam
      [['her', C.herBirthday, H().dogumHer, C.herPet], ['me', C.myBirthday, H().dogumMe, C.myPet]].forEach(([w, bd, tpl, nm]) => {
        if (!bd) return;
        if (md === bd) out.push({ key: `dg-${w}-${p.y}`, to: w, at: atIn(w, p.y, p.mo, p.d, 0, 5), tpl, v: {} });
        const nx = T.baku(new Date(Date.now() + (o + 1) * 864e5));
        if (`${K.pad(nx.mo)}-${K.pad(nx.d)}` === bd) {
          const ow = w === 'her' ? 'me' : 'her';
          out.push({ key: `dgo-${w}-${nx.y}`, to: ow, at: atIn(ow, p.y, p.mo, p.d, 20), tpl: H().dogumOnce, v: { name: K.ek(nm, 'in') } });
        }
      });
    }
    return out;
  }
  async function plan() {
    if (busy || !K.cloud || !K.cloud.enabled || K.previewDate || !C.ntfyTopicHer || !D.hatirlat) return;
    busy = true;
    try {
      rows = await K.cloud.list('planli', 300);
      const have = new Set(rows.map((r) => r.data.key));
      for (const e of upcoming()) {
        const k = `${e.key}-${e.to}`;
        const lt = K.later(e.at);
        if (have.has(k) || !lt || !e.tpl) continue;
        have.add(k);
        const r = await K.cloud.add('planli', { key: k });
        if (!r) continue;
        await K.ntfyTo(e.to, fill(e.tpl[0], e.v), fill(e.tpl[1], e.v), ['sparkling_heart'], Object.assign({ click: K.roomUrl('') }, lt));
      }
    } catch (err) {}
    busy = false;
  }
  K.on('cloud', (ok) => ok && setTimeout(plan, 6000));
  setInterval(plan, 6 * 36e5);
  K.hatirlat = { upcoming, plan };
})();
