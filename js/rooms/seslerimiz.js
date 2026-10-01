/* Oda: Seslerimiz — ikimizin bütün sesleri tek arşivde, tarih sırasıyla: telesekreter mesajları, sesli hikâyeler,
   sesli özürler, ikimizin de bıraktığı günlerin "Günün Sesi" ve kasadaki sesli notlar. Süzgeç (tür / kimden),
   "baştan sona çal" ve her sesin altında küçük bir dalga. Ses dosyası yalnızca çalınırken iner. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const KINDS = { tsmesaj: ['📼', 'Telesekreter'], hikaye: ['📸', 'Sesli hikâye'], ozur: ['💐', 'Sesli özür'], dvoice: ['🎙️', 'Günün Sesi'] };
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  let rows = [], loaded = false, root = null, kind = 'all', who = 'all';
  let cur = null, queue = [], resume = false;
  const cache = {};

  // Günün Sesi yalnızca ikimizin de bıraktığı günlerde arşive girer (odadaki kuralla aynı)
  function items() {
    const days = {};
    rows.filter((r) => r.kind === 'dvoice').forEach((r) => ((days[r.data.day] = days[r.data.day] || {})[r.who] = true));
    return rows
      .filter((r) => (r.kind === 'dvoice' ? days[r.data.day].me && days[r.data.day].her : Boolean(r.data.audio || r.data.b64)))
      .sort((a, b) => a.at - b.at);
  }
  const title = (r) =>
    r.kind === 'tsmesaj' ? r.data.tag || 'Sesli mesaj' : r.kind === 'hikaye' ? r.data.text || 'Hikâyeye ses' : r.kind === 'ozur' ? (r.data.text ? `“${String(r.data.text).slice(0, 60)}${String(r.data.text).length > 60 ? '…' : ''}”` : 'Özür') : `${T.fmtShort(r.data.day)} sesi`;
  const sec = (n) => (n ? `${Math.floor(n / 60) ? Math.floor(n / 60) + ' dk ' : ''}${Math.round(n % 60)} sn` : '');
  const vaultList = () => (K.voice && K.voice.any() ? K.voice.list().filter((v) => K.voice.unlocked(v)) : []);

  function render() {
    if (!root || K.activeRoom !== 'seslerimiz') return;
    const all = items();
    const list = all.filter((r) => (kind === 'all' || r.kind === kind) && (who === 'all' || r.who === who));
    const total = all.reduce((s, r) => s + (+r.data.dur || 0), 0);
    const by = (w) => all.filter((r) => r.who === w).length;
    K.$('#ssStats', root).innerHTML = `<div class="ss-stat"><b>${K.num(all.length + vaultList().length)}</b><small>ses</small></div><div class="ss-stat"><b>${K.num(total < 60 ? Math.round(total) : Math.round(total / 60))}</b><small>${total < 60 ? 'saniye' : 'dakika'}</small></div><div class="ss-stat"><b>${by('her')}</b><small>${K.esc(C.herPet)}</small></div><div class="ss-stat"><b>${by('me') + vaultList().length}</b><small>${K.esc(C.myPet)}</small></div>`;
    const chip = (k, v, l) => `<button type="button" class="chip ${(k === 'k' ? kind : who) === v ? 'on' : ''}" data-ss-${k}="${v}">${l}</button>`;
    K.$('#ssFilter', root).innerHTML = `<div class="br-chips">${chip('k', 'all', 'Hepsi')}${Object.entries(KINDS).map(([k, [e, l]]) => chip('k', k, `${e} ${l}`)).join('')}${vaultList().length ? chip('k', 'kasa', '🔐 Kasa') : ''}</div>
      <div class="br-chips">${chip('w', 'all', 'İkimiz')}${chip('w', 'her', K.esc(K.ek(C.herPet, 'den')))}${chip('w', 'me', K.esc(K.ek(C.myPet, 'den')))}</div>`;
    let html = '';
    if (kind === 'kasa' || (kind === 'all' && who !== 'her')) {
      const v = vaultList();
      if (v.length) html += `<h3 class="ss-month">🔐 Kasadaki sesli notlar</h3><ul class="ss-list">${v.map((x) => `<li class="ss-item me"><button type="button" class="ss-play" data-ss-vault="${K.esc(x.id)}" aria-label="Çal">${A.ui('play')}</button><div><b>${K.esc(x.title || 'Sesli not')}</b><small>${K.esc(C.myPet)} · ${K.esc(x.where || '')}${x.sure ? ' · ' + K.esc(x.sure) : ''}</small></div></li>`).join('')}</ul>`;
    }
    if (kind !== 'kasa') {
      let m = '';
      list
        .slice()
        .reverse()
        .forEach((r) => {
          const p = T.baku(new Date(r.at));
          const mk = `${MONTHS[p.mo - 1]} ${p.y}`;
          if (mk !== m) html += `${m ? '</ul>' : ''}<h3 class="ss-month">${K.esc(mk)}</h3><ul class="ss-list">`, (m = mk);
          const [e, l] = KINDS[r.kind];
          const on = cur && cur.id === r.id;
          html += `<li class="ss-item ${r.who === mine() ? 'mine' : ''} ${on ? 'on' : ''}"><button type="button" class="ss-play" data-ss-play="${r.id}" aria-label="${on ? 'Durdur' : 'Çal'}">${A.ui(on ? 'pause' : 'play')}</button>
            <div><b>${K.esc(title(r))}</b><small>${e} ${K.esc(l)} · ${K.esc(nameOf(r.who))} · ${K.esc(T.fmtShort(new Date(r.at)))}${r.data.dur ? ' · ' + sec(+r.data.dur) : ''}</small></div><span class="ss-wave" aria-hidden="true">${'<i></i>'.repeat(9)}</span></li>`;
        });
      if (m) html += '</ul>';
    }
    K.$('#ssList', root).innerHTML = html || `<div class="empty-note"><p>${loaded ? 'Bu süzgeçte henüz ses yok. Telesekretere ilk sesi bırakmak ister misin?' : 'Sesler yükleniyor...'}</p>${loaded ? '<a class="btn soft small" href="#telesekreter">📼 Telesekreter</a>' : ''}</div>`;
    K.$('[data-ss-all]', root).hidden = !list.length || kind === 'kasa';
  }
  async function src(r) {
    if (cache[r.id]) return cache[r.id];
    let b64 = r.data.b64, mime = r.data.mime;
    if (!b64 && r.data.audio) {
      const a = await K.cloud.get(r.data.audio);
      if (!a || !a.data || !a.data.b64) return null;
      b64 = a.data.b64;
      mime = a.data.mime || mime;
    }
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return (cache[r.id] = URL.createObjectURL(new Blob([u8], { type: mime || 'audio/mp4' })));
  }
  function stop(keepQueue) {
    if (cur) {
      cur.audio.pause();
      cur = null;
    }
    if (!keepQueue) queue = [];
    if (resume && !queue.length) {
      resume = false;
      K.audio.music.start();
    }
    render();
  }
  async function play(id) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    if (cur && cur.id === id) return stop();
    if (cur) cur.audio.pause(), (cur = null);
    K.voice && K.voice.stop && K.voice.stop();
    const u = await src(r);
    if (!u) {
      K.fx.toast('Bu ses şu an açılamadı.');
      return queue.length ? next() : null;
    }
    if (K.audio.music.on) {
      K.audio.music.stop(false);
      resume = true;
    }
    const audio = new Audio(u);
    cur = { id, audio };
    audio.addEventListener('ended', () => (queue.length ? next() : stop()));
    audio.play().catch(() => stop());
    render();
  }
  const next = () => play(queue.shift());

  // Arşiv ağır olabilir: yalnızca oda ilk açıldığında yüklenir
  let cloudOk = false, loading = null;
  function load() {
    if (!cloudOk || loading) return loading;
    return (loading = K.cloud.many(Object.keys(KINDS), { limit: 2000 }).then((list) => {
      list.forEach((r) => !rows.some((x) => x.id === r.id) && rows.push(r));
      loaded = true;
      render();
    }));
  }
  K.on('cloud', (ok) => {
    if (!ok) return;
    cloudOk = true;
    Object.keys(KINDS).forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!loaded || rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        render();
      })
    );
    if (K.activeRoom === 'seslerimiz') load();
  });
  K.on('room', () => cur && K.activeRoom !== 'seslerimiz' && stop());

  K.room({
    id: 'seslerimiz',
    wing: 'kalp',
    title: 'Seslerimiz',
    sub: 'İkimizin bütün sesleri tek arşivde',
    icon: 'mic',
    color: '#FFE0EA',
    hidden: () => !(K.cloud && K.cloud.enabled) && !(K.voice && K.voice.any()),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras((D.seslerimiz || {}).intro || [])}</div>
        <section class="card ss-head"><div class="ss-stats" id="ssStats"></div><div id="ssFilter"></div>
          <button type="button" class="btn red small" data-ss-all>${A.ui('play')} Baştan sona çal</button></section>
        <section class="ss-body" id="ssList"></section>`;
      el.addEventListener('click', (e) => {
        const k = e.target.closest('[data-ss-k]');
        if (k) return (kind = k.dataset.ssK), render();
        const w = e.target.closest('[data-ss-w]');
        if (w) return (who = w.dataset.ssW), render();
        const p = e.target.closest('[data-ss-play]');
        if (p) return (queue = []), play(p.dataset.ssPlay);
        const v = e.target.closest('[data-ss-vault]');
        if (v) return stop(), K.voice.play(v.dataset.ssVault);
        if (e.target.closest('[data-ss-all]')) {
          if (cur) return stop();
          queue = items()
            .filter((r) => (kind === 'all' || r.kind === kind) && (who === 'all' || r.who === who))
            .map((r) => r.id);
          next();
        }
      });
    },
    enter() {
      load();
      render();
    },
    leave() {
      stop();
    },
  });
})();
