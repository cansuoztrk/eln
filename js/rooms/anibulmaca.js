/* Oda: Anı Bulmacası — bu ay birbirimize yazdığımız kelimelerden (kavanoz kalpleri, minnetler, güneş postası, rüyalar,
   pazar soruları...) kendiliğinden kurulan bir çengel bulmaca. İpuçları anılarımız: "Kavanoz, 3 Ekim (Elnoş): 'Bugün
   ___ çok güzeldi'". Bu ay yeterince yazı yoksa en son dolu ay kullanılır. Bulmacayı canlı, birlikte çözeriz: bir
   kareye yazılan harf iki ekranda da görünür (son yazan kazanır). Hepsi doğru olunca bulmaca çözülür.
   Kayıtlar: abharf {ay, k: 'satır-sütun', ch} · abcoz {ay} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const DUR = new Set('ama bile bir biraz birlikte bize bizi bizim bunu bunu bugün böyle çok daha diye gibi hem hep için ile kadar ki mi mu mü mı nasıl neden niye olan olarak onu onun öyle sana sen seni senin sonra şey şimdi şu tüm var ve veya ya yani yine yok zaman ben beni benim kendi aynı artık değil gece sabah bütün şöyle'.split(' '));
  const N = 15;
  let harfler = [], cozumler = [], root = null, bulmaca = null, secK = null, yon = 'y';
  const tr = (s) => s.toLocaleUpperCase('tr');
  function kelimeler(notes) {
    const seen = new Set(), out = [];
    notes.forEach((n) => {
      (n.text.match(/[A-Za-zÇĞİÖŞÜÂÎÛçğıöşüâîû]+/g) || []).forEach((w0) => {
        const w = w0.replace(/[âÂ]/g, (c) => (c === 'â' ? 'a' : 'A')).replace(/[îÎ]/g, (c) => (c === 'î' ? 'i' : 'İ')).replace(/[ûÛ]/g, (c) => (c === 'û' ? 'u' : 'U'));
        if (w.length < 4 || w.length > 9) return;
        const low = w.toLocaleLowerCase('tr');
        if (DUR.has(low) || seen.has(low)) return;
        seen.add(low);
        const cumle = n.text.replace(/\s+/g, ' ');
        const i = Math.max(0, cumle.indexOf(w0));
        const kes = cumle.slice(Math.max(0, i - 40), i) + '___' + cumle.slice(i + w0.length, i + w0.length + 40);
        out.push({ w: tr(w), ipucu: `${n.label}, ${T.fmtShort(n.day)} (${nameOf(n.who)}): "${kes.trim()}"`, sk: K.hash(n.id + low) });
      });
    });
    return out.sort((a, b) => a.sk - b.sk);
  }
  // Basit çengel yerleşimi: ilk kelime ortada yatay, sonrakiler var olan bir harften kesişerek
  function kur(list) {
    const g = Array.from({ length: N }, () => Array(N).fill(''));
    const yer = [];
    const uygun = (w, r, c, d) => {
      const dr = d === 'd' ? 1 : 0, dc = d === 'y' ? 1 : 0;
      if (r - dr < -1 || c - dc < -1) return false;
      const er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1);
      if (r < 0 || c < 0 || er >= N || ec >= N) return false;
      const bR = r - dr, bC = c - dc, sR = er + dr, sC = ec + dc;
      if (bR >= 0 && bC >= 0 && g[bR][bC]) return false;
      if (sR < N && sC < N && g[sR] && g[sR][sC]) return false;
      let kes = 0;
      for (let i = 0; i < w.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, h = g[rr][cc];
        if (h && h !== w[i]) return false;
        if (h) kes++;
        else {
          const y1 = d === 'y' ? [rr - 1, cc] : [rr, cc - 1], y2 = d === 'y' ? [rr + 1, cc] : [rr, cc + 1];
          if ((y1[0] >= 0 && y1[1] >= 0 && g[y1[0]][y1[1]]) || (y2[0] < N && y2[1] < N && g[y2[0]][y2[1]])) return false;
        }
      }
      return yer.length ? kes > 0 : true;
    };
    const koy = (x, r, c, d) => {
      for (let i = 0; i < x.w.length; i++) g[r + (d === 'd' ? i : 0)][c + (d === 'y' ? i : 0)] = x.w[i];
      yer.push(Object.assign({ r, c, d }, x));
    };
    for (const x of list) {
      if (yer.length >= 10) break;
      if (yer.some((y) => y.w.startsWith(x.w) || x.w.startsWith(y.w))) continue;
      if (!yer.length) {
        koy(x, 7, Math.floor((N - x.w.length) / 2), 'y');
        continue;
      }
      let ok = false;
      for (let r = 0; r < N && !ok; r++)
        for (let c = 0; c < N && !ok; c++)
          for (const d of ['d', 'y'])
            if (!ok && uygun(x.w, r, c, d)) {
              koy(x, r, c, d);
              ok = true;
            }
    }
    // Numaralar (soldan sağa, yukarıdan aşağı)
    const no = {};
    let n = 0;
    yer.slice().sort((a, b) => a.r - b.r || a.c - b.c).forEach((x) => (no[`${x.r}-${x.c}`] = no[`${x.r}-${x.c}`] || ++n));
    yer.forEach((x) => (x.no = no[`${x.r}-${x.c}`]));
    return { g, yer, no };
  }
  async function hazirla() {
    if (!K.arsiv) return null;
    const notes = await K.arsiv.notes();
    const ayOf = (x) => x.day.slice(0, 7);
    const aylar = [...new Set(notes.map(ayOf))].sort().reverse();
    const bu = T.todayKey().slice(0, 7);
    for (const ay of [bu, ...aylar.filter((a) => a !== bu)]) {
      const l = kelimeler(notes.filter((x) => ayOf(x) === ay));
      if (l.length >= 4) {
        const b = kur(l);
        if (b.yer.length >= 4) return Object.assign(b, { ay });
      }
    }
    return null;
  }
  const harfOf = (k) => harfler.filter((r) => r.data.ay === bulmaca.ay && r.data.k === k).sort((a, b) => b.at - a.at)[0];
  const cozuldu = () => bulmaca && bulmaca.yer.every((x) => [...x.w].every((ch, i) => { const h = harfOf(`${x.r + (x.d === 'd' ? i : 0)}-${x.c + (x.d === 'y' ? i : 0)}`); return h && h.data.ch === ch; }));
  function render() {
    if (!root || K.activeRoom !== 'anibulmaca') return;
    if (!bulmaca) {
      K.$('#abAna', root).innerHTML = '<p class="muted center">Bulmaca için kalede biraz daha yazı birikmeli (kavanoz, minnet, güneş postası...).</p>';
      return;
    }
    const { g, yer } = bulmaca;
    let minR = N, maxR = 0, minC = N, maxC = 0;
    g.forEach((row, r) => row.forEach((h, c) => h && ((minR = Math.min(minR, r)), (maxR = Math.max(maxR, r)), (minC = Math.min(minC, c)), (maxC = Math.max(maxC, c)))));
    const W = maxC - minC + 1;
    let cells = '';
    for (let r = minR; r <= maxR; r++)
      for (let c = minC; c <= maxC; c++) {
        const k = `${r}-${c}`;
        if (!g[r][c]) {
          cells += '<span class="ab-bos"></span>';
          continue;
        }
        const h = harfOf(k);
        cells += `<button type="button" class="ab-k ${secK === k ? 'on' : ''} ${h ? h.who : ''}" data-ab-k="${k}">${bulmaca.no[k] ? `<sup>${bulmaca.no[k]}</sup>` : ''}<span>${h ? K.esc(h.data.ch) : ''}</span></button>`;
      }
    const coz = cozuldu();
    const ip = (d) => yer.filter((x) => x.d === d).sort((a, b) => a.no - b.no).map((x) => `<li><b>${x.no}.</b> ${K.esc(x.ipucu)} <small>(${x.w.length})</small></li>`).join('');
    K.$('#abAna', root).innerHTML = `<p class="ab-ust center">${K.esc(K.arsiv.monthName(bulmaca.ay))} bulmacası${coz ? ' · <b>çözüldü ✨</b>' : ''}</p>
      <div class="ab-izgara ${coz ? 'coz' : ''}" style="--w:${W}">${cells}</div>
      <input class="ab-gizli" id="abGiris" maxlength="1" autocomplete="off" autocapitalize="characters" aria-label="Harf">
      <div class="ab-ipuclari"><section><h4>Soldan sağa</h4><ol>${ip('y')}</ol></section><section><h4>Yukarıdan aşağı</h4><ol>${ip('d')}</ol></section></div>`;
  }
  async function yaz(ch) {
    if (!secK || !bulmaca) return;
    // İmleç hemen bir sonraki kareye geçer; hızlı yazınca harfler aynı kareye düşmesin
    const k = secK;
    const [rr, cc] = k.split('-').map(Number);
    const nk = yon === 'y' ? `${rr}-${cc + 1}` : `${rr + 1}-${cc}`;
    const [nr, nc] = nk.split('-').map(Number);
    if (bulmaca.g[nr] && bulmaca.g[nr][nc]) secK = nk;
    const r = await K.cloud.add('abharf', { ay: bulmaca.ay, k, ch });
    r && !harfler.some((x) => x.id === r.id) && harfler.push(r);
    if (cozuldu() && !cozumler.some((x) => x.data.ay === bulmaca.ay)) {
      const c = await K.cloud.add('abcoz', { ay: bulmaca.ay });
      c && cozumler.push(c);
      K.fx.confetti({ count: 150, shapes: ['star', 'heart'] });
      K.stickers.award('anibulmaca');
      K.ping('🧩 Anı Bulmacası çözüldü', K.arsiv.monthName(bulmaca.ay), ['tada'], { click: K.roomUrl('anibulmaca') });
    }
    render();
    K.$('#abGiris', root) && K.$('#abGiris', root).focus({ preventScroll: true });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [harfler, cozumler] = await Promise.all([K.cloud.list('abharf', 2000), K.cloud.list('abcoz', 60)]);
    K.cloud.on('abharf', (r) => harfler.some((x) => x.id === r.id) || (harfler.push(r), render()));
    K.cloud.on('abcoz', (r) => cozumler.some((x) => x.id === r.id) || cozumler.push(r));
  });
  K.room({
    id: 'anibulmaca',
    wing: 'oyun',
    title: 'Anı Bulmacası',
    sub: 'Bu ayın kelimelerinden',
    icon: 'question',
    color: '#FFF3E0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bu ay birbirimize yazdığımız kelimelerden kendiliğinden kurulan bir çengel bulmaca. İpuçları anılarımız. Birlikte, canlı çözüyoruz.</p></div><div id="abAna"></div>`;
      el.addEventListener('click', (e) => {
        const k = e.target.closest('[data-ab-k]');
        if (!k) return;
        if (secK === k.dataset.abK) yon = yon === 'y' ? 'd' : 'y';
        else {
          // Yeni karede yön: yalnız yatay bir kelimedeyse soldan sağa, yalnız dikeydeyse yukarıdan aşağı
          const [r, c] = k.dataset.abK.split('-').map(Number), g = bulmaca.g;
          const yat = Boolean(g[r][c + 1] || g[r][c - 1]), dik = Boolean((g[r + 1] && g[r + 1][c]) || (g[r - 1] && g[r - 1][c]));
          if (yat !== dik) yon = yat ? 'y' : 'd';
        }
        secK = k.dataset.abK;
        render();
        K.$('#abGiris', root).focus({ preventScroll: true });
      });
      el.addEventListener('input', (e) => {
        if (e.target.id !== 'abGiris') return;
        const ch = tr(e.target.value.slice(-1));
        e.target.value = '';
        if (/[A-ZÇĞİÖŞÜ]/.test(ch)) yaz(ch);
      });
    },
    async enter() {
      bulmaca = bulmaca || (await hazirla());
      render();
    },
  });
  K.anibulmaca = { kelimeler, kur, hazirla };
})();
