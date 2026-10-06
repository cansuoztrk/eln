/* Oda: Kale Yedeği — kaledeki bütün anılar tek dosyada. Üç seçenek: her şey (fotoğraflar ve seslerle, büyük JSON),
   sadece yazılar (küçük JSON) ve okunur arşiv (tarayıcıda açılan, günlere bölünmüş bir HTML kitapçık). Dosyalar bu
   cihaza iner ve şifresizdir. Her ayın ilk günlerinde ana salonda küçük bir hatırlatma. Yeni kayıt tutmaz. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const YD = () => D.yedek || { intro: [] };
  const MEDIA = ['tsses', 'photo', 'vaudio', 'sfimg', 'sahneimg', 'pcimg', 'ozurses', 'kfull', 'kareimg', 'hkses', 'hkimg', 'dvaudio', 'rotafoto', 'anlarvid'];
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let root = null, busy = false, last = null;

  function save(text, name, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    K.download(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
  const stamp = () => T.todayKey();
  const size = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

  async function fetchAll(media) {
    const st = K.$('#ydSt', root);
    st.textContent = 'Kayıtlar toplanıyor...';
    const rows = await K.cloud.dump(media ? [] : MEDIA, (n) => (st.textContent = `${K.num(n)} kayıt toplandı...`));
    return rows;
  }
  function summary(rows) {
    const by = {};
    rows.forEach((r) => (by[r.kind] = (by[r.kind] || 0) + 1));
    return { n: rows.length, me: rows.filter((r) => r.who === 'me').length, her: rows.filter((r) => r.who === 'her').length, first: rows.length ? rows[0].at : 0, kinds: Object.keys(by).length };
  }
  function archive(rows) {
    const items = rows.map(K.akis.norm).filter(Boolean).sort((a, b) => a.at - b.at);
    const days = {};
    items.forEach((x) => (days[x.day] = days[x.day] || []).push(x));
    const esc = K.esc;
    const hm = (at) => {
      const p = T.baku(new Date(at));
      return `${K.pad(p.h)}:${K.pad(p.mi)}`;
    };
    const body = Object.keys(days)
      .sort()
      .map((d) => `<section><h2>${esc(T.fmt(d, true))}</h2>${days[d].map((x) => `<article class="${x.who}"><small>${esc(nameOf(x.who))} · ${hm(x.at)}</small><h3>${x.emoji ? x.emoji + ' ' : ''}${esc(x.title || '')}</h3>${x.text ? `<p>${esc(x.text)}</p>` : ''}${x.img && /^data:image\//.test(x.img) ? `<img src="${x.img}" alt="">` : ''}</article>`).join('')}</section>`)
      .join('');
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(C.herName)}'in Krallığı · Arşiv ${stamp()}</title>
<style>body{margin:0;padding:24px 16px 60px;background:#FFF5F8;color:#4A2138;font:16px/1.55 Georgia,serif}main{max-width:680px;margin:auto}h1{font-size:30px;text-align:center;color:#E3174D;margin:0 0 4px}.sub{text-align:center;color:#8a5a72;margin:0 0 28px}h2{position:sticky;top:0;background:#FFF5F8;padding:8px 0;margin:28px 0 8px;font-size:18px;border-bottom:2px solid #FFD0E0}article{background:#fff;border-radius:14px;padding:10px 14px;margin:8px 0;box-shadow:0 2px 8px -4px rgba(74,33,56,.25);border-left:4px solid #FF8FB8}article.me{border-left-color:#8FB8FF}article small{color:#8a5a72}article h3{margin:2px 0;font-size:16px}article p{margin:4px 0 0;white-space:pre-wrap}article img{display:block;max-width:100%;border-radius:10px;margin-top:8px}</style></head>
<body><main><h1>${esc(C.herName)}'in Krallığı</h1><p class="sub">${esc(nameOf('her'))} ve ${esc(nameOf('me'))} · ${items.length} an · ${esc(T.fmt(stamp()))} yedeği</p>${body}</main></body></html>`;
  }
  async function run(kind, btn) {
    if (busy) return;
    busy = true;
    K.$$('[data-yd]', root).forEach((b) => (b.disabled = true));
    btn.classList.add('loading');
    const st = K.$('#ydSt', root);
    try {
      const rows = await fetchAll(kind === 'tam');
      const s = summary(rows);
      last = s;
      let text, name, type;
      if (kind === 'arsiv') {
        text = archive(rows);
        name = `kale-arsiv-${stamp()}.html`;
        type = 'text/html';
      } else {
        text = JSON.stringify({ kale: C.herName, at: new Date().toISOString(), media: kind === 'tam', count: rows.length, rows: rows.map((r) => ({ id: r.id, kind: r.kind, who: r.who, at: new Date(r.at).toISOString(), data: r.data })) });
        name = `kale-yedek-${kind === 'tam' ? 'tam' : 'yazilar'}-${stamp()}.json`;
        type = 'application/json';
      }
      save(text, name, type);
      K.store.set('yedekAt', Date.now());
      st.innerHTML = `✅ <b>${K.esc(name)}</b> indirildi · ${size(text.length)} · ${K.num(s.n)} kayıt`;
      K.audio.sfx.success();
      K.stickers.award('yedek');
    } catch (e) {
      st.textContent = 'Yedek alınamadı. İnterneti kontrol edip tekrar dene.';
      K.audio.sfx.fail();
    }
    busy = false;
    btn.classList.remove('loading');
    K.$$('[data-yd]', root).forEach((b) => (b.disabled = false));
    render();
  }
  function render() {
    if (!root || K.activeRoom !== 'yedek') return;
    const at = K.store.get('yedekAt', 0);
    K.$('#ydLast', root).innerHTML = at ? `Son yedek: <b>${K.esc(T.fmt(new Date(at)))}</b> (${K.esc(K.ago(at))})` : 'Bu cihazda hiç yedek alınmadı.';
    K.$('#ydSum', root).innerHTML = last ? `<span><b class="tnum">${K.num(last.n)}</b><small>kayıt</small></span><span><b class="tnum">${K.num(last.her)}</b><small>${K.esc(nameOf('her'))}</small></span><span><b class="tnum">${K.num(last.me)}</b><small>${K.esc(nameOf('me'))}</small></span><span><b class="tnum">${last.kinds}</b><small>tür</small></span>` : '';
  }

  /* ---------- Yedekten geri yükle ---------- */
  async function readBackup(file) {
    const st = K.$('#ydGeri', root);
    let j = null;
    try {
      j = JSON.parse(await file.text());
    } catch (e) {}
    const rows = j && Array.isArray(j.rows) ? j.rows.filter((r) => r && r.id && r.kind && r.data && r.at && (r.who === 'me' || r.who === 'her')) : [];
    if (!rows.length) return (st.innerHTML = '<p class="yd-err">Bu dosya bir Kale Yedeği değil ya da boş. "Sadece yazılar" ya da "Her şey" ile inen .json dosyasını seç.</p>');
    const list = rows.map((r) => ({ id: r.id, kind: r.kind, who: r.who, at: new Date(r.at).getTime(), data: r.data }));
    const first = Math.min(...list.map((r) => r.at)), last = Math.max(...list.map((r) => r.at));
    st.innerHTML = `<p><b>${K.num(list.length)}</b> kayıt · ${K.esc(T.fmt(new Date(first)))} – ${K.esc(T.fmt(new Date(last)))}${j.media ? ' · fotoğraf ve seslerle' : ''}</p>
      <p class="muted small">Yalnız bulutta olmayanlar geri eklenir; var olanlara dokunulmaz. Her kayıt kendi tarihine döner.</p>
      <div class="row center"><button type="button" class="btn red" data-yd-geri>Eksikleri geri yükle</button></div><p class="yd-st" id="ydGeriSt" aria-live="polite"></p>`;
    K.$('[data-yd-geri]', st).addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      const out = K.$('#ydGeriSt', st);
      const res = await K.cloud.restore(list, (n, a) => (out.textContent = `${K.num(n)}/${K.num(list.length)} · ${K.num(a)} geri geldi`));
      out.innerHTML = `✅ <b>${K.num(res.added)}</b> kayıt geri geldi, ${K.num(res.had)} tanesi zaten vardı${res.failed ? `, ${K.num(res.failed)} eklenemedi (internet?)` : ''}.${res.added ? ' Odalar yenilenince görünür.' : ''}`;
      if (res.added) {
        K.audio.sfx.success();
        K.stickers.award('geriyukle');
        setTimeout(() => out.insertAdjacentHTML('beforeend', ' <button type="button" class="btn soft small" onclick="location.reload()">Yenile</button>'), 400);
      }
    });
  }
  /* ---------- Depo: bulut ne kadar dolu, en çok ne yer kaplıyor ---------- */
  const LIMIT = 500 * 1024 * 1024;
  const KIND_NAME = { kareimg: 'Günün Karesi fotoğrafları', hkimg: 'Hikâye fotoğrafları', pcimg: 'Kartpostallar', photo: 'Fotoğraflar', kfull: 'Günlük fotoğrafları', sfimg: 'Sofra fotoğrafları', sahneimg: 'Film sahneleri', tsses: 'Telesekreter sesleri', vaudio: 'Ses kayıtları', ozurses: 'Sesli özürler', hkses: 'Sesli hikâyeler', dvaudio: 'Günün Sesi', anlarvid: 'On saniyelik anlar', rotadurak: 'Rota durakları', page: 'Defter sayfaları', hata: 'Hata kayıtları' };
  async function measure(btn) {
    const box = K.$('#ydDepo', root);
    btn.disabled = true;
    box.innerHTML = '<p class="muted">Ölçülüyor...</p>';
    let rows = [];
    try {
      rows = await K.cloud.dump([], (n) => (box.innerHTML = `<p class="muted">${K.num(n)} kayıt ölçüldü...</p>`));
    } catch (e) {
      btn.disabled = false;
      return (box.innerHTML = '<p class="yd-err">Ölçülemedi. İnternetini kontrol et.</p>');
    }
    const by = {};
    let total = 0;
    rows.forEach((r) => {
      const n = Math.round(JSON.stringify(r.data).length * 1.37) + 200;
      total += n;
      (by[r.kind] = by[r.kind] || { n: 0, b: 0 }).n++;
      by[r.kind].b += n;
    });
    const top = Object.entries(by).sort((a, b) => b[1].b - a[1].b).slice(0, 7);
    const mb = (b) => (b / 1048576).toFixed(b > 10485760 ? 0 : 1);
    const pct = Math.min(100, (total / LIMIT) * 100);
    const hata = rows.filter((r) => r.kind === 'hata' && Date.now() - r.at > 14 * 864e5);
    box.innerHTML = `<div class="yd-bar" style="--p:${pct.toFixed(1)}%"><i></i></div>
      <p class="center"><b>${mb(total)} MB</b> / 500 MB <span class="muted small">(ücretsiz bulutun sınırı · %${pct.toFixed(pct < 10 ? 1 : 0)})</span></p>
      <ul class="yd-top">${top.map(([k, v]) => `<li><span>${K.esc(KIND_NAME[k] || k)}</span><small>${K.num(v.n)} kayıt</small><b>${mb(v.b)} MB</b></li>`).join('')}</ul>
      <p class="muted small">${pct < 60 ? 'Daha çok yer var; yıllarca yeter.' : 'Dolmaya başladı. Eski büyük fotoğrafları "Her şey" yedeğiyle indirip sakla.'} Anılar hiçbir zaman kendiliğinden silinmez.</p>
      ${K.isOwner() && hata.length ? `<div class="row center"><button type="button" class="btn ghost small" data-yd-temiz>🧹 ${K.num(hata.length)} eski hata kaydını temizle</button></div>` : ''}`;
    const t = K.$('[data-yd-temiz]', box);
    t && t.addEventListener('click', async () => {
      t.disabled = true;
      for (const r of hata) await K.cloud.remove(r.id);
      K.cloud.raw && K.cloud.rawPrune('takvimpub', Date.now() - 864e5);
      t.textContent = '✓ Temizlendi';
    });
    btn.disabled = false;
  }

  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.cloud || !K.cloud.enabled || !D.yedek) return [];
    const p = T.baku();
    const at = K.store.get('yedekAt', 0);
    if (p.d > 3 || (at && Date.now() - at < 20 * 864e5) || K.store.get('yedekCard') === `${p.y}-${p.mo}`) return [];
    return [{ icon: 'house', title: '💾 Ayın yedeği', text: 'Kaledeki anıları bu ay da bir dosyaya indir; bir dakika sürer.', run: () => (K.store.set('yedekCard', `${p.y}-${p.mo}`), K.go('yedek')), cta: 'Yedekle' }];
  });

  K.room({
    id: 'yedek',
    wing: 'hazine',
    title: 'Kale Yedeği',
    sub: 'Yedekle, geri yükle, depoya bak',
    icon: 'house',
    color: '#E9F3FF',
    hidden: () => !D.yedek || !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(YD().intro || [])}</div>
        <section class="card yd-card">
          <div class="yd-chest" aria-hidden="true">💾</div>
          <p class="muted small center" id="ydLast"></p>
          <div class="yd-opts">
            <button type="button" class="yd-opt" data-yd="arsiv"><span>📖</span><b>Okunur arşiv</b><small>Tarayıcıda açılan, günlere bölünmüş kitapçık (HTML)</small></button>
            <button type="button" class="yd-opt" data-yd="yazi"><span>📄</span><b>Sadece yazılar</b><small>Küçük dosya; fotoğraf ve sesler hariç (JSON)</small></button>
            <button type="button" class="yd-opt" data-yd="tam"><span>📦</span><b>Her şey</b><small>Fotoğraflar ve seslerle; büyük olabilir (JSON)</small></button>
          </div>
          <p class="yd-st center" id="ydSt" aria-live="polite"></p>
          <div class="yd-sum" id="ydSum"></div>
          <p class="yd-warn">🔓 İnen dosya şifresizdir: içinde bütün yazışmalarımız var. Kimseyle paylaşma, bulut klasörlerine koyarken dikkat et.</p>
        </section>
        <section class="card yd-card">
          <p class="card-eyebrow">Yedekten geri yükle</p>
          <p class="muted small">Bir gün bulutta bir şey kaybolursa: daha önce indirdiğin .json yedeğini seç; eksik kayıtlar kendi tarihleriyle geri gelir.</p>
          <label class="btn soft small yd-file">📂 Yedek dosyasını seç<input type="file" accept=".json,application/json" id="ydFile" hidden></label>
          <div id="ydGeri"></div>
        </section>
        <section class="card yd-card">
          <p class="card-eyebrow">Depo</p>
          <p class="muted small">Bulut ne kadar dolu, en çok ne yer kaplıyor?</p>
          <div class="row center"><button type="button" class="btn soft small" data-yd-olc>📏 Depoyu ölç</button></div>
          <div id="ydDepo"></div>
        </section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-yd]');
        if (b) run(b.dataset.yd, b);
        const o = e.target.closest('[data-yd-olc]');
        if (o) measure(o);
      });
      K.$('#ydFile', el).addEventListener('change', (e) => e.target.files[0] && readBackup(e.target.files[0]));
    },
    enter() {
      render();
    },
  });
})();
