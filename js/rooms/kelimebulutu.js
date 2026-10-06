/* Oda: Kelime Bulutumuz — bir ayda birbirimize en çok hangi kelimeleri yazdık? Bizim Defter sayfaları, kavanoz
   notları, telsiz mesajları, sözler, iyilik notları, hikâyeler ve hayaller okunur; en sık kırk kelime pembe bir buluta
   dizilir. Kelimenin rengi onu daha çok kimin kullandığını söyler. Mühürlü şeyler (minnet, günaydın notları, kapsüller)
   okunmaz. Yeni kayıt tutmaz. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KB = () => D.kelimebulutu || { intro: [] };
  const KINDS = ['page', 'kalpk', 'live', 'soz', 'iyilik', 'hikaye', 'hayal', 'pin'];
  const FIELDS = ['text', 'note'];
  const STOP = new Set('ve ile ama fakat çünkü gibi için bir bu şu o ben sen biz siz onlar beni seni bizi onu bana sana ona bize size benim senin onun bizim sizin da de ki mi mı mu mü ne çok daha en her hep hiç kadar sonra önce şimdi bugün yarın dün var yok olarak olan oldu olur olsun diye değil evet hayır ya yani artık bile hem ise eğer gibi nasıl neden niye nerede kim kimi şey şeyi şeyler tane bunu şunu şöyle böyle öyle zaten sadece biraz bence sence acaba lütfen tamam okey ok mı mi dedi demek etmek yapmak olmak var mısın misin musun benden senden ondan bizden sizden'.split(' '));
  let root = null, month = null, cache = {};
  const mkey = (d) => `${d.getUTCFullYear()}-${K.pad(d.getUTCMonth() + 1)}`;

  function words(text) {
    return String(text || '')
      .toLocaleLowerCase('tr')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-zçğıöşüəâîû\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP.has(w));
  }
  async function load(m) {
    if (cache[m]) return cache[m];
    const [y, mo] = m.split('-').map(Number);
    const since = Date.UTC(y, mo - 1, 1) - C.tzBaku * 36e5, before = Date.UTC(y, mo, 1) - C.tzBaku * 36e5;
    const rows = await K.cloud.many(KINDS, { since, before, limit: 3000 });
    const cnt = {};
    rows.forEach((r) => {
      FIELDS.forEach((f) => {
        if (typeof r.data[f] !== 'string') return;
        words(r.data[f]).forEach((w) => {
          const c = (cnt[w] = cnt[w] || { n: 0, me: 0, her: 0 });
          c.n++;
          c[r.who === 'me' ? 'me' : 'her']++;
        });
      });
    });
    const top = Object.entries(cnt).sort((a, b) => b[1].n - a[1].n).slice(0, 40);
    return (cache[m] = { rows: rows.length, top });
  }
  async function render() {
    if (!root || K.activeRoom !== 'kelimebulutu') return;
    const m = month || mkey(new Date(T.now().getTime() + C.tzBaku * 36e5));
    const [y, mo] = m.split('-').map(Number);
    const prev = mkey(new Date(Date.UTC(y, mo - 2, 1))), next = mkey(new Date(Date.UTC(y, mo, 1)));
    const nowM = mkey(new Date(T.now().getTime() + C.tzBaku * 36e5));
    K.$('#kbNav', root).innerHTML = `<button type="button" class="icon-btn" data-kb="${prev}" aria-label="Önceki ay">‹</button><b>${K.MONTHS[mo - 1]} ${y}</b><button type="button" class="icon-btn" data-kb="${next}" aria-label="Sonraki ay" ${next > nowM ? 'disabled' : ''}>›</button>`;
    const box = K.$('#kbCloud', root);
    box.innerHTML = '<p class="muted center">Kelimeler toplanıyor...</p>';
    const d = await load(m);
    if ((month || nowM) !== m) return;
    if (!d.top.length) return (box.innerHTML = '<p class="muted center">Bu ay yazılmış bir şey yok. Bizim Defter\'e bir sayfa yazınca bulut başlar.</p>');
    const max = d.top[0][1].n, min = d.top[d.top.length - 1][1].n;
    const r = K.rng(K.hash(m));
    const list = K.shuffle(d.top, r);
    box.innerHTML = `<div class="kb-bulut">${list
      .map(([w, c]) => {
        const t = max === min ? 0.5 : (c.n - min) / (max - min);
        const who = c.her > c.me * 1.3 ? 'her' : c.me > c.her * 1.3 ? 'me' : 'ikimiz';
        return `<span class="kb-w ${who}" style="--s:${(15 + t * 30).toFixed(1)}px;--r:${r() < 0.18 ? (r() < 0.5 ? -8 : 8) : 0}deg" title="${c.n} kez">${K.esc(w)}</span>`;
      })
      .join('')}</div>`;
    const [w0, c0] = d.top[0];
    K.$('#kbOzet', root).innerHTML = `<p class="kb-buyuk">Bu ay en çok <b>“${K.esc(w0)}”</b> dedik <small>(${c0.n} kez)</small></p>
      <p class="kb-leg"><span class="her">● ${K.esc(C.herPet)} daha çok</span><span class="me">● ${K.esc(C.myPet)} daha çok</span><span class="ikimiz">● ikimiz de</span></p>
      <p class="muted small">${d.rows} yazıdan. Mühürlü olanlar (minnet, kapsül, mühürlü günaydınlar) okunmadı.</p>`;
    K.stickers.award('kelimebulutu');
  }

  K.room({
    id: 'kelimebulutu',
    wing: 'kalp',
    title: 'Kelime Bulutumuz',
    sub: 'Bu ay birbirimize en çok ne dedik?',
    icon: 'cloud',
    color: '#FDE6F0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KB().intro || ['Bir ayda birbirimize yazdıklarımızdan en sık kırk kelime. Kelimenin rengi onu daha çok kimin kullandığını gösterir.'])}</div>
        <div class="rp-nav" id="kbNav"></div>
        <section class="card kb-card"><div id="kbCloud"></div></section>
        <section class="card" id="kbOzet"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kb]');
        if (b) (month = b.dataset.kb), render();
      });
    },
    enter() {
      month = null;
      cache = {};
      render();
    },
  });
})();
