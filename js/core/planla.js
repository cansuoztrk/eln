/* Kale 2.0 — İleri tarihli bildirim kurucu (Sesimle Uyan, Söz Defteri...). ntfy en fazla ~3 gün önceden kurabildiği için
   kim kaleye girerse önümüzdeki günlerin bildirimlerini kurar; aynı anahtar ikinci kez kurulmaz (planli {key}).
   K.planla([{key, to: 'me'|'her', at, title, msg, tags, click, priority}]) */
(function () {
  'use strict';
  const K = window.K;
  const C = window.ELN.config;

  let have = null, busy = Promise.resolve();
  async function load() {
    if (have) return have;
    const rows = await K.cloud.list('planli', 600);
    have = new Set(rows.map((r) => r.data.key));
    K.cloud.on('planli', (r) => have.add(r.data.key));
    return have;
  }
  function planla(items) {
    if (!K.cloud || !K.cloud.enabled || K.previewDate || !C.ntfyTopicHer) return Promise.resolve(0);
    busy = busy.then(async () => {
      let n = 0;
      try {
        const set = await load();
        for (const e of items) {
          const k = `${e.key}-${e.to}`;
          const lt = K.later(e.at);
          if (set.has(k) || !lt) continue;
          set.add(k);
          const r = await K.cloud.add('planli', { key: k });
          if (!r) continue;
          // İki cihaz aynı anda kurmaya kalkarsa: anahtarı ilk yazan gönderir
          const same = (await K.cloud.many(['planli'], { since: Date.now() - 5 * 6e4, limit: 300 })).filter((x) => x.data.key === k).sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
          if (same.length && same[0].id !== r.id) continue;
          await K.ntfyTo(e.to, e.title, e.msg || '', e.tags || ['sparkling_heart'], Object.assign({ click: e.click || K.roomUrl('') }, e.priority ? { priority: e.priority } : {}, lt));
          n++;
        }
      } catch (err) {}
      return n;
    });
    return busy;
  }
  K.planla = planla;
})();
