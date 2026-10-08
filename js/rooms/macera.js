/* Oda: Kale Macerası — iki kişilik, beş bölümlük canlı bir bulmaca-macera. Biri Kitty'yi (Eln), biri Pamuk'u (kale
   sahibi) oynar; 12×9'luk haritalarda basınç plakaları, kedi kapıları, anahtarlar, kutular ve yalnız birinin gördüğü
   ipuçlarıyla kapılar birlikte açılır. Her bölüm bir anımızın içinden geçer; sonunda bir anı kartı düşer.
   Eşzamanlama: herkes yalnız kendi kedisini yürütür ve yayar; kapılar iki konumun (ve Pamuk'un ittiği kutuların) saf
   fonksiyonudur; ilerleme bayrakları yalnız eklenir (birleşim, çakışma çıkmaz); kale sahibi birkaç saniyede bir tam
   anlık görüntü yollar. Öbürü yoksa "Tek başına dene": iki kediyi sırayla aynı kişi oynar.
   Kayıtlar: macerabolum {bolum, sure, solo, oturum}
   Canlı: macera {tip: nabiz|durum|adim|al|bayrak|bitti|yeniden|cik, ekran, bolum, oturum, solo, kaynak, n, c, b,
   kutular, f, gecen} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);

  /* ================= Karakterler ve sabitler ================= */
  // Kale sahibi Pamuk'u, Eln Kitty'yi oynar
  const KAR = { me: 'pamuk', her: 'kitty' };
  const AD = { kitty: 'Kitty', pamuk: 'Pamuk' };
  const IKI = ['kitty', 'pamuk'];
  const benim = () => KAR[mine()];
  const obur = (c) => (c === 'kitty' ? 'pamuk' : 'kitty');
  const oyuncuAdi = (c) => nameOf(c === 'kitty' ? 'her' : 'me');
  const ROL = {
    kitty: 'Anahtarları ve eşyaları yalnız sen taşırsın; bazı ipuçlarını yalnız sen görürsün.',
    pamuk: 'Kedi kapılarından yalnız sen sığarsın, kutuları yalnız sen itersin.',
  };
  // Bu sayfanın kimliği: sayfa yenilenince karşı tarafın sıra sayacı sıfırdan kabul edilsin
  const KAYNAK = Math.random().toString(36).slice(2, 8);
  const GEN = 12;
  const YUK = 9;
  const ADIM_MS = 150;
  const YON = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  const YON_AD = { u: 'Yukarı', d: 'Aşağı', l: 'Sola', r: 'Sağa' };
  const TUS = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r', W: 'u', S: 'd', A: 'l', D: 'r' };
  const yonOf = (dx, dy) => (dx > 0 ? 'r' : dx < 0 ? 'l' : dy < 0 ? 'u' : 'd');
  const icinde = (x, y) => x >= 0 && y >= 0 && x < GEN && y < YUK;
  const saat = (sn) => `${K.pad(Math.floor(sn / 60))}:${K.pad(sn % 60)}`;
  const yeniOturum = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // Kale 4.0 "Pastel Pop" renkleri (CSS değişkenlerinden okunur, yoksa bunlar)
  const P = { ink: '#3A1F2D', red: '#E3174D', pink: '#FF8FB8', butter: '#FFE27A', sky: '#9FD8FF', mint: '#9FE5C4', lilac: '#CDBBFF', peach: '#FFC6A6', card: '#FFFFFF' };
  function renkleriOku() {
    const st = getComputedStyle(document.documentElement);
    Object.keys(P).forEach((k) => {
      const v = st.getPropertyValue('--k4-' + k).trim();
      if (/^#[0-9a-f]{3,8}$/i.test(v)) P[k] = v;
    });
  }
  // Renkli şalterler ve pullar: renk + şekil (renk körlüğüne karşı her rengin bir simgesi var)
  const RENK_AD = ['pembe', 'sarı', 'mavi', 'yeşil'];
  const RENK_SEMBOL = ['♥', '★', '●', '♣'];
  const renk = (i) => [P.pink, P.butter, P.sky, P.mint][i];
  const renkEtiket = (i) => `<span class="mc-renk" style="--c:${renk(i)}">${RENK_SEMBOL[i]}</span> ${RENK_AD[i]}`;

  /* ================= Haritalar ================= */
  // Harf → hücre. Kapılar: p (plakaya bağlı), bayrak (bölüm kapısı), kod (renkli şalter dizisi)
  const LEJANT = {
    '#': { t: 'duvar' },
    '.': { t: 'zemin' },
    K: { t: 'zemin', bas: 'kitty' },
    P: { t: 'zemin', bas: 'pamuk' },
    E: { t: 'cikis' },
    b: { t: 'zemin', kutu: true },
    c: { t: 'kedi' },
    L: { t: 'kilit' },
    G: { t: 'kapi', bayrak: true },
    v: { t: 'dugme' },
    1: { t: 'plaka', p: 1 },
    2: { t: 'plaka', p: 2 },
    A: { t: 'kapi', p: 1 },
    B: { t: 'kapi', p: 2 },
    k: { t: 'zemin', esya: 'anahtar' },
    q: { t: 'zemin', esya: 'kart' },
    t: { t: 'zemin', esya: 'tahta' },
    M: { t: 'posta', renk: 0 },
    N: { t: 'posta', renk: 1 },
    O: { t: 'posta', renk: 2 },
    '*': { t: 'yildiz' },
    T: { t: 'teleskop' },
    '~': { t: 'su' },
    '=': { t: 'sig' },
    w: { t: 'salter', renk: 0, grup: 'pamuk' },
    x: { t: 'salter', renk: 1, grup: 'pamuk' },
    y: { t: 'salter', renk: 2, grup: 'pamuk' },
    z: { t: 'salter', renk: 3, grup: 'pamuk' },
    W: { t: 'salter', renk: 0, grup: 'kitty' },
    X: { t: 'salter', renk: 1, grup: 'kitty' },
    Y: { t: 'salter', renk: 2, grup: 'kitty' },
    Z: { t: 'salter', renk: 3, grup: 'kitty' },
    S: { t: 'kapi', kod: 'pamuk' },
    U: { t: 'kapi', kod: 'kitty' },
    '>': { t: 'bant', d: [1, 0] },
    '<': { t: 'bant', d: [-1, 0] },
    '^': { t: 'bant', d: [0, -1] },
    H: { t: 'hali' },
  };
  const hucre = (S, x, y) => S.lv.hucre[y][x];
  const uzerinde = (S, c, t) => hucre(S, S.ch[c].x, S.ch[c].y).t === t;
  const ikisiDe = (S, t) => uzerinde(S, 'kitty', t) && uzerinde(S, 'pamuk', t);
  const yakin = (S) => Math.abs(S.ch.kitty.x - S.ch.pamuk.x) + Math.abs(S.ch.kitty.y - S.ch.pamuk.y) <= 1;
  const kartKalan = (S) => S.lv.esyalar.filter((e) => e.tur === 'kart' && !S.f.has('harca:' + e.id)).length;
  const kopruTamam = (S) => S.lv.siglar.every((h) => S.f.has(`kopru:${h.x},${h.y}`));
  const plakada = (S, c) => uzerinde(S, c, 'plaka');

  const BOLUMLER = [
    {
      no: 1,
      ad: 'İlk Merhaba',
      alt: 'Grup sohbetinin baloncukları arasında',
      tema: 'sohbet',
      harita: [
        '############',
        '#K..#.....k#',
        '#...A......#',
        '#1..#####L##',
        '##c##.....##',
        '#...#.v..v.#',
        '#.P.c......#',
        '#...###GG###',
        '#######EE###',
      ],
      kapiKosulu: (S) => S.f.has('cift'),
      kapiNotu: 'Baloncuk, ikiniz mavi tiklere aynı anda basınca açılır.',
      acildiNotu: '✓✓ Görüldü! Merhaba baloncuğu açıldı.',
      bitti: (S) => ikisiDe(S, 'cikis'),
      ani: 'Her şey küçük bir merhabayla başladı. Bazen tek bir baloncuk, koca bir hikâyeyi taşır.',
      ipucu(S, c) {
        const k = S.ch.kitty, p = S.ch.pamuk;
        if (S.f.has('cift')) return 'Baloncuk açıldı! İkiniz de kalpli çıkışa yürüyün.';
        if (c === 'kitty') {
          if (S.f.has('kilit:9,3')) return 'Mavi tiklerden birine bas; Pamuk öbürüne basınca mesaj “görüldü” olur.';
          if (k.tasi) return 'Anahtar sende. Aşağıdaki kırmızı kilitli kapıya yürü.';
          if (k.x >= 5) return 'Sağ köşedeki anahtarı al. Anahtarı yalnız sen taşıyabilirsin.';
          return 'Pembe kapı, odandaki plakaya bağlı. Pamuk kedi kapısından gelip plakaya basınca geç.';
        }
        if (p.x >= 5) return 'Mavi tiklerden birine bas ve Kitty’yi bekle; ikiniz aynı anda basmalısınız.';
        if (plakada(S, 'pamuk')) return 'Böyle kal! Kitty pembe kapıdan geçene kadar plakadan inme.';
        if (k.x >= 5) return 'Kitty geçti. Kedi kapılarından aşağıdaki salona in, mavi tike bas.';
        return 'Kedi kapılarından yalnız sen sığarsın. Yukarı çık, pembe plakaya otur.';
      },
    },
    {
      no: 2,
      ad: 'Kartpostal Postanesi',
      alt: 'Doğru pul, doğru kutu',
      tema: 'posta',
      harita: [
        '############',
        '#K.q#.....P#',
        '#q..#.b.##.#',
        '#..q#...1#.#',
        '##A#######c#',
        '#..........#',
        '#..........#',
        '##M#N#O##GG#',
        '#########EE#',
      ],
      kapiKosulu: (S) => kartKalan(S) === 0,
      kapiNotu: 'Postane kapısı bütün kartlar yola çıkınca açılır.',
      acildiNotu: 'Bütün kartlar yolda! Postane kapısı açıldı.',
      bitti: (S) => ikisiDe(S, 'cikis'),
      ani: 'Aradaki kilometreler, iki şehir arasında yol alan her kartpostalla biraz daha kısaldı.',
      ipucu(S, c) {
        const k = S.ch.kitty;
        const kalan = kartKalan(S);
        const kapiAcikMi = S.lv.kapilar.some((h) => h.p === 1 && kapiAcik(S, h));
        if (!kalan) return 'Bütün kartlar yola çıktı! Postane kapısından çıkışa yürüyün.';
        if (c === 'kitty') {
          if (k.tasi) return 'Kartı doğru renkteki posta kutusuna at: kutuya doğru yürü. Pulun rengini yalnız Pamuk görüyor, ona sor.';
          if (kapiAcikMi || k.y >= 5) return `Masadan bir kartpostal al. ${kalan} kart kaldı.`;
          return 'Kapın, Pamuk’un odasındaki plakaya bağlı. Pamuk koliyi plakaya itebilir.';
        }
        if (k.tasi) return `Kitty’nin elindeki kartın pulu: ${renkEtiket(S.gizem.kart[k.tasi])}. Hangi kutuya gideceğini ona söyle.`;
        if (kapiAcikMi) return `Pulları yalnız sen görüyorsun. Kitty bir kart alınca hangi kutuya gideceğini söyle. ${kalan} kart kaldı.`;
        return 'Koliyi it ve pembe plakaya oturt; Kitty’nin kapısı açık kalsın. Kedi kapısı salona çıkar.';
      },
    },
    {
      no: 3,
      ad: 'Ayın 21’i',
      alt: 'Yıldızları sırayla yak',
      tema: 'gece',
      harita: [
        '#####.*...*.',
        '#...#...*...',
        '#.T.#*.....*',
        '#...A.......',
        '#.K.#1*...*.',
        '#####.......',
        '#.P.c...*...',
        '#...####GG##',
        '########EE##',
      ],
      // Kalp biçimli takımyıldız: uçtan saat yönünde. Her oyunda başlangıcı ve yönü değişir.
      yildizSirasi: [[8, 6], [6, 4], [5, 2], [6, 0], [8, 1], [10, 0], [11, 2], [10, 4]],
      kapiKosulu: (S) => S.f.has('yildiz'),
      kapiNotu: 'Ay kapısı, takımyıldız tamamlanınca açılır.',
      acildiNotu: 'Takımyıldız tamam! Ay kapısı açıldı.',
      bitti: (S) => ikisiDe(S, 'cikis'),
      ani: 'Her ayın 21’inde gökyüzünde aynı yıldız yanıyor; ikimizin yıldızı.',
      ipucu(S, c) {
        const k = S.ch.kitty, p = S.ch.pamuk, n = S.gizem.sira.length;
        if (S.f.has('yildiz')) {
          if (k.x <= 3) return c === 'kitty' ? 'Ay kapısı açıldı! Pamuk bahçedeki plakaya basınca kapından geç, çıkışa yürü.' : 'Bahçedeki pembe plakaya bas; Kitty’nin kapısı açılsın. Sonra çıkışa yürü.';
          return 'Ay kapısından geçip çıkışa yürüyün.';
        }
        if (c === 'kitty') return uzerinde(S, 'kitty', 'teleskop') ? `Teleskopta yıldızların sırası görünüyor; Pamuk’a tek tek söyle. (${p.sira}/${n} yandı)` : 'Teleskoba git: yıldızların sırasını yalnız sen görebilirsin.';
        return p.x >= 5 ? `Kitty’nin söylediği sırayla yıldızlara bas. Yanlış yıldız hepsini söndürür. (${p.sira}/${n})` : 'Kedi kapısından yıldız bahçesine geç.';
      },
    },
    {
      no: 4,
      ad: 'Boğaz’dan Hazar’a',
      alt: 'Köprüyü iki uçtan kur',
      tema: 'kiyi',
      harita: [
        '####~~~~####',
        'wxyz~~~~ZYXW',
        '.P..~~~~.K..',
        '##S#~~~~#U##',
        '....====....',
        '.b..~~~~.t..',
        '..b.~~~~..t.',
        '....~~~~....',
        '####~~~~####',
      ],
      // Tabela kimin ekranında görünür, kimin şifresini gösterir
      tabelalar: [{ x: 11, y: 3, kim: 'kitty', grup: 'pamuk' }, { x: 0, y: 3, kim: 'pamuk', grup: 'kitty' }],
      kapiNotu: 'Bu kapı renkli şalterlerle açılır.',
      bitti: (S) => kopruTamam(S) && ikisiDe(S, 'sig') && yakin(S),
      ani: 'Boğaz’dan Hazar’a ne kadar su olursa olsun, iki uçtan döşenen köprü ortada buluşur.',
      ipucu(S, c) {
        const ch = S.ch[c];
        if (kopruTamam(S)) return 'Köprü tamam! Köprünün ortasında buluşun.';
        const kodum = S.gizem.kod[c];
        if (!S.f.has('kod:' + c)) {
          const ilerleme = `(${ch.sira}/${kodum.length})`;
          return c === 'pamuk' ? `Renkli şalterlere doğru sırayla bas. Sıra, Kitty’nin kıyısındaki tabelada yazıyor; ona sor. ${ilerleme}` : `Renkli şalterlere doğru sırayla bas. Sıra, Pamuk’un kıyısındaki tabelada yazıyor; ona sor. ${ilerleme}`;
        }
        if (c === 'pamuk') return 'Sandıkları köprü hizasına it; suya itilen sandık köprü olur.';
        return ch.tasi ? 'Tahtayı köprünün ucuna döşe: kıyıdan suya doğru yürü.' : 'Kulübeden bir tahta al. Köprüyü kendi kıyından başlat.';
      },
    },
    {
      no: 5,
      ad: 'Kavuşma',
      alt: 'Havalimanında buluşma',
      tema: 'havalimani',
      harita: [
        '############',
        '#P>>>>v#vk.#',
        '######G#A#^#',
        '#..1...#..^#',
        '#......#..K#',
        '##c#####L###',
        '#...HHHH...#',
        '#...HHHH...#',
        '############',
      ],
      kapiKosulu: (S) => S.f.has('cift'),
      kapiNotu: 'Pasaport kontrolü: ikiniz de kabinlere aynı anda basın.',
      acildiNotu: 'Pasaport onaylandı! Geçiş açıldı.',
      bitti: (S) => ikisiDe(S, 'hali') && yakin(S),
      ani: 'Bütün yollar sonunda aynı kapıya çıktı: birbirimizin kollarına.',
      ipucu(S, c) {
        const k = S.ch.kitty, p = S.ch.pamuk;
        if (k.y >= 6 && p.y >= 6) return 'Kalpli halıda birbirinize koşun!';
        if (c === 'kitty') {
          if (k.y >= 6) return 'Kalpli halıda Pamuk’u bekle.';
          if (S.f.has('kilit:8,5')) return 'Kalpli halıya koş!';
          if (k.tasi) return k.y <= 1 ? 'Pamuk plakaya basınca kapı açılır; adadan aşağı in.' : 'Anahtarla aşağıdaki “Gelen yolcu” kapısını aç.';
          if (!S.f.has('cift')) return k.y <= 1 ? 'Pasaport kabinine (✓) bas ve bekle; Pamuk da kendi kabinine basınca geçiş açılır.' : 'Yürüyen banda bin, kayıp eşya adasına çık.';
          return 'Adadaki anahtarı al.';
        }
        if (p.y >= 6) return 'Kalpli halıda Kitty’yi bekle.';
        if (S.f.has('cift')) {
          if (p.y < 3) return 'Pasaport tamam! Geçitten aşağı in.';
          if (plakada(S, 'pamuk')) return k.y <= 1 ? 'Kitty adadan inene kadar plakada kal.' : 'Şimdi evcil hayvan kapısından halıya geç.';
          return 'Plakaya bas, Kitty adadan inebilsin. Sonra evcil hayvan kapısından geç.';
        }
        return p.x < 6 ? 'Yürüyen banda bas; seni kabine götürür.' : 'Kabindesin. Kitty de kendi kabinine basınca geçiş açılır.';
      },
    },
  ];

  // Haritayı okunur bir yapıya çevirir (bir kez)
  function cozumle(def) {
    const lv = Object.assign({}, def, { hucre: [], bas: {}, kutular: [], esyalar: [], plakalar: [], kapilar: [], kilitler: [], dugmeler: [], yildizlar: [], siglar: [], tabelalar: def.tabelalar || [] });
    const sayac = {};
    if (def.harita.length !== YUK) throw new Error(`macera: ${def.no}. bölüm ${YUK} satır olmalı`);
    def.harita.forEach((satir, y) => {
      if (satir.length !== GEN) throw new Error(`macera: ${def.no}. bölüm ${y}. satır ${GEN} harf olmalı`);
      lv.hucre.push(
        [...satir].map((harf, x) => {
          const tn = LEJANT[harf];
          if (!tn) throw new Error(`macera: bilinmeyen harf "${harf}"`);
          const h = Object.assign({ x, y }, tn);
          if (tn.bas) lv.bas[tn.bas] = { x, y };
          if (tn.kutu) lv.kutular.push({ x, y });
          if (tn.esya) {
            const i = (sayac[tn.esya] = (sayac[tn.esya] || 0) + 1) - 1;
            lv.esyalar.push({ id: tn.esya + i, tur: tn.esya, x, y });
          }
          if (h.t === 'plaka') lv.plakalar.push(h);
          if (h.t === 'kapi') lv.kapilar.push(h);
          if (h.t === 'kilit') lv.kilitler.push(h);
          if (h.t === 'dugme') lv.dugmeler.push(h);
          if (h.t === 'yildiz') lv.yildizlar.push(h);
          if (h.t === 'sig') lv.siglar.push(h);
          return h;
        })
      );
    });
    return lv;
  }
  const SEVIYE = BOLUMLER.map(cozumle);

  /* ================= Saf kurallar (ikisinde de aynı sonucu verir) ================= */
  const kutuAt = (S, x, y) => S.kutular.find((k) => !k.yok && k.x === x && k.y === y);
  const kediAt = (S, x, y) => IKI.some((c) => S.ch[c].x === x && S.ch[c].y === y);
  const dolu = (S, x, y) => Boolean(kutuAt(S, x, y)) || kediAt(S, x, y);
  // Bir eşya yerde mi: harcanmadıysa ve şu an Kitty'nin elinde değilse
  const esyaYerde = (S, e) => !S.f.has('harca:' + e.id) && S.ch.kitty.tasi !== e.id;
  const esyaAt = (S, x, y) => S.lv.esyalar.find((e) => e.x === x && e.y === y && esyaYerde(S, e));
  function kapiAcik(S, h) {
    if (h.p) return S.lv.plakalar.some((pl) => pl.p === h.p && dolu(S, pl.x, pl.y));
    if (h.kod) return S.f.has('kod:' + h.kod);
    return Boolean(S.lv.kapiKosulu && S.lv.kapiKosulu(S));
  }
  // Bir kedi bu kareye girebilir mi (yan etkisiz; kutular ayrıca bakılır)
  function gecer(S, c, x, y) {
    if (!icinde(x, y)) return false;
    const h = hucre(S, x, y);
    switch (h.t) {
      case 'duvar':
      case 'posta':
      case 'su':
        return false;
      case 'kedi':
        return c === 'pamuk';
      case 'kapi':
        return kapiAcik(S, h);
      case 'kilit':
        return S.f.has(`kilit:${x},${y}`);
      case 'sig':
        return S.f.has(`kopru:${x},${y}`);
      default:
        return true;
    }
  }
  // Kutu buraya itilebilir mi: 'tasi' (kayar), 'kopru' (sığ suya düşüp köprü olur) ya da false
  function kutuGirer(S, x, y) {
    if (!icinde(x, y) || dolu(S, x, y) || esyaAt(S, x, y)) return false;
    const h = hucre(S, x, y);
    if (h.t === 'sig') return S.f.has(`kopru:${x},${y}`) ? 'tasi' : 'kopru';
    return h.t === 'zemin' || h.t === 'plaka' ? 'tasi' : false;
  }
  function acikKapilar(S) {
    return S.lv.kapilar
      .filter((h) => kapiAcik(S, h))
      .map((h) => `${h.p ? 'plaka' + h.p : h.kod ? 'kod-' + h.kod : 'bolum'}@${h.x},${h.y}`)
      .concat(S.lv.kilitler.filter((h) => S.f.has(`kilit:${h.x},${h.y}`)).map((h) => `kilit@${h.x},${h.y}`));
  }
  // Yıldızların sırası, kartların pulu, şalter şifreleri: oturumdan türetilir, iki tarafta da aynı
  function gizemKur(S) {
    const r = K.rng(K.hash(S.oturum));
    const lv = S.lv;
    S.gizem = {};
    const kartlar = lv.esyalar.filter((e) => e.tur === 'kart');
    if (kartlar.length) {
      const perm = K.shuffle([0, 1, 2], r);
      S.gizem.kart = {};
      kartlar.forEach((e, i) => (S.gizem.kart[e.id] = perm[i % 3]));
    }
    if (lv.yildizSirasi) {
      let s = lv.yildizSirasi.slice();
      const rot = Math.floor(r() * s.length);
      s = s.slice(rot).concat(s.slice(0, rot));
      if (r() < 0.5) s = [s[0]].concat(s.slice(1).reverse());
      S.gizem.sira = s;
    }
    if (lv.tabelalar.length) S.gizem.kod = { pamuk: K.shuffle([0, 1, 2, 3], r).slice(0, 3), kitty: K.shuffle([0, 1, 2, 3], r).slice(0, 3) };
  }
  const yildizNo = (S, x, y) => (S.gizem.sira || []).findIndex(([sx, sy]) => sx === x && sy === y);

  /* ================= Oyun durumu ================= */
  let S = null; // şu anki bölüm (lobi ya da oyun); null = bölüm seçme ekranı
  let rows = [];
  let root = null;
  let basili = null; // basılı tutulan yön (tuş ya da ekran düğmesi)
  let benN = 0;
  const ortak = { ekran: null, bolum: 0, oturum: null, solo: false, at: 0 };
  const ortakTaze = () => Date.now() - ortak.at < 4000;
  const davetVar = () => ortakTaze() && !ortak.solo && ortak.oturum && (ortak.ekran === 'lobi' || ortak.ekran === 'oyun');
  const toastlanan = new Set();

  function karakter(b) {
    return { x: b.x, y: b.y, d: 'd', sira: 0, tasi: null, ax: b.x, ay: b.y, at: 0, bump: null, kuyruk: [], yol: false, sonraki: 0, bant: null, zipla: 0 };
  }
  function yeniOyun(no, oturum, solo) {
    const lv = SEVIYE[no - 1];
    const o = {
      lv,
      oturum,
      solo,
      ekran: 'lobi',
      f: new Set(),
      kutular: lv.kutular.map((k) => ({ x: k.x, y: k.y, yok: false })),
      ch: { kitty: karakter(lv.bas.kitty), pamuk: karakter(lv.bas.pamuk) },
      aktif: benim(),
      t0: 0,
      bitti: false,
      sure: 0,
      yanlis: 0,
      onN: -1,
      onKaynak: null,
      katiliyor: false,
      kopuk: false,
      kapiIzi: null,
      gateAcik: false,
      sarilma: 0,
      hedef: null,
      efekt: [],
    };
    gizemKur(o);
    return o;
  }
  const aktif = () => (S.solo ? S.aktif : benim());
  const sahibi = (c) => S.solo || c === benim();
  // Tek başına oyunda iki kedinin gizli ipuçları da görünür (oynayan tek kişi)
  const gorur = (c) => S.solo || benim() === c;

  /* ================= Hareket ================= */
  const notZamani = {};
  function carp(c, dx, dy, not) {
    const ch = S.ch[c];
    ch.bump = { t: performance.now(), dx, dy };
    ch.sonraki = performance.now() + 140;
    ch.kuyruk = [];
    if (c === aktif()) K.vibrate(12);
    if (not && c === aktif() && Date.now() - (notZamani[not] || 0) > 2600) {
      notZamani[not] = Date.now();
      notGoster(not);
    }
    return false;
  }
  function konum(ch, now) {
    const t = ch.at ? K.clamp((now - ch.at) / ADIM_MS, 0, 1) : 1;
    return { x: ch.ax + (ch.x - ch.ax) * t, y: ch.ay + (ch.y - ch.ay) * t, t };
  }
  function kapiNotu(h) {
    if (h.p) return 'Bu kapı bir plakaya bağlı: biri plakada durmalı.';
    if (h.kod) return 'Bu kapı renkli şalterlerle açılır.';
    return S.lv.kapiNotu;
  }
  // Tek adım: bütün etkileşimler (itme, posta, köprü, kilit) burada. Yalnız kendi kedisi için çalışır.
  function adim(c, dx, dy) {
    if (!S || S.ekran !== 'oyun' || S.bitti || !sahibi(c)) return false;
    const ch = S.ch[c];
    ch.d = yonOf(dx, dy);
    const nx = ch.x + dx, ny = ch.y + dy;
    if (!icinde(nx, ny)) return carp(c, dx, dy);
    const h = hucre(S, nx, ny);
    const kutu = kutuAt(S, nx, ny);
    if (kutu) {
      if (c !== 'pamuk') return carp(c, dx, dy, 'Kutuları tombul Pamuk itebilir.');
      const bx = nx + dx, by = ny + dy;
      const sonuc = kutuGirer(S, bx, by);
      if (!sonuc) return carp(c, dx, dy, icinde(bx, by) && hucre(S, bx, by).t === 'su' ? 'Burası çok derin; sandık batar.' : null);
      if (sonuc === 'kopru') {
        kutu.yok = true;
        bayrakEkle([`kopru:${bx},${by}`]);
      } else {
        kutu.x = bx;
        kutu.y = by;
      }
      return yuru(c, nx, ny);
    }
    switch (h.t) {
      case 'duvar':
        return carp(c, dx, dy);
      case 'su':
        return carp(c, dx, dy, 'Burası çok derin.');
      case 'posta':
        return postaAt(c, h, dx, dy);
      case 'kedi':
        if (c !== 'pamuk') return carp(c, dx, dy, 'Kedi kapısı Kitty’ye dar; yalnız Pamuk sığar.');
        break;
      case 'kapi':
        if (!kapiAcik(S, h)) return carp(c, dx, dy, kapiNotu(h));
        break;
      case 'sig':
        if (!S.f.has(`kopru:${nx},${ny}`)) {
          if (c === 'kitty' && ch.tasi && ch.tasi.startsWith('tahta')) {
            const id = ch.tasi;
            ch.tasi = null;
            bayrakEkle([`kopru:${nx},${ny}`, 'harca:' + id]);
            ch.sonraki = performance.now() + ADIM_MS;
            karakterYay(c, 'adim');
            kontrol();
            return true;
          }
          return carp(c, dx, dy, c === 'kitty' ? 'Sığ su: buraya bir tahta döşenebilir.' : 'Sığ su: buraya bir sandık itilebilir.');
        }
        break;
      case 'kilit':
        if (!S.f.has(`kilit:${nx},${ny}`)) {
          if (c === 'kitty' && ch.tasi && ch.tasi.startsWith('anahtar')) {
            const id = ch.tasi;
            ch.tasi = null;
            bayrakEkle([`kilit:${nx},${ny}`, 'harca:' + id]);
          } else return carp(c, dx, dy, c === 'kitty' ? 'Kilitli. Anahtar lazım.' : 'Kilitli. Anahtarı yalnız Kitty taşıyabilir.');
        }
        break;
      default:
    }
    return yuru(c, nx, ny);
  }
  function yuru(c, nx, ny) {
    const ch = S.ch[c];
    const now = performance.now();
    const g0 = konum(ch, now);
    ch.ax = g0.x;
    ch.ay = g0.y;
    ch.x = nx;
    ch.y = ny;
    ch.at = now;
    ch.sonraki = now + ADIM_MS + 10;
    const olay = hucreyeGir(c);
    karakterYay(c, olay ? 'al' : 'adim', olay);
    kontrol();
    return true;
  }
  // Girilen karenin etkisi (yalnız kedinin sahibi işler; öbür taraf sonucu mesajla görür)
  function hucreyeGir(c) {
    const ch = S.ch[c];
    const h = hucre(S, ch.x, ch.y);
    ch.bant = h.t === 'bant' ? h.d : null;
    if (ch.bant) ch.kuyruk = [];
    if (h.t === 'yildiz' && c === 'pamuk') yildizBas(ch, h);
    if (h.t === 'salter' && h.grup === c) salterBas(c, h);
    const e = esyaAt(S, ch.x, ch.y);
    if (!e || c !== 'kitty') return null;
    if (ch.tasi) {
      if (Date.now() - (notZamani.tasi || 0) > 4000) (notZamani.tasi = Date.now()), notGoster('Kitty aynı anda tek şey taşıyabilir.');
      return null;
    }
    ch.tasi = e.id;
    K.audio.sfx.pop();
    parcacik(ch.x + 0.5, ch.y + 0.3, 6, 'yildiz');
    notGoster(`${esyaAdi(e.id)} Kitty’de!`);
    return { esya: e.id };
  }
  const esyaAdi = (id) => (id.startsWith('anahtar') ? 'Anahtar' : id.startsWith('kart') ? 'Kartpostal' : 'Tahta');
  function postaAt(c, h, dx, dy) {
    const ch = S.ch[c];
    if (c !== 'kitty') return carp(c, dx, dy, 'Kartları yalnız Kitty taşıyabilir.');
    if (!ch.tasi || !ch.tasi.startsWith('kart')) return carp(c, dx, dy, 'Önce masadan bir kartpostal al.');
    const id = ch.tasi;
    ch.tasi = null;
    ch.sonraki = performance.now() + ADIM_MS;
    if (S.gizem.kart[id] === h.renk) {
      bayrakEkle(['harca:' + id]);
      parcacik(h.x + 0.5, h.y + 0.3, 8, 'kalp');
      notGoster('Kart yola çıktı 💌');
      K.audio.sfx.sparkle();
    } else {
      S.yanlis++;
      ch.bump = { t: performance.now(), dx, dy };
      K.audio.sfx.fail();
      notGoster('Pul tutmadı; kart masaya döndü. Pamuk’a sor!');
    }
    karakterYay(c, 'adim');
    kontrol();
    return true;
  }
  function yildizBas(ch, h) {
    if (S.f.has('yildiz')) return;
    const i = yildizNo(S, h.x, h.y);
    if (i < ch.sira) return;
    if (i === ch.sira) {
      ch.sira++;
      parcacik(h.x + 0.5, h.y + 0.5, 7, 'yildiz');
      K.audio.sfx.tap();
      if (ch.sira === S.gizem.sira.length) bayrakEkle(['yildiz']);
      return;
    }
    S.yanlis++;
    K.audio.sfx.fail();
    if (ch.sira) notGoster('Yanlış yıldız: hepsi söndü. Kitty’ye sor!');
    else notGoster('Bu ilk yıldız değil. Kitty teleskoptan baksın.');
    ch.sira = 0;
  }
  function salterBas(c, h) {
    if (S.f.has('kod:' + c)) return;
    const ch = S.ch[c];
    const kod = S.gizem.kod[c];
    if (h.renk === kod[ch.sira]) {
      ch.sira++;
      K.audio.sfx.tap();
      parcacik(h.x + 0.5, h.y + 0.5, 5, 'yildiz');
      if (ch.sira === kod.length) bayrakEkle(['kod:' + c]);
      return;
    }
    S.yanlis++;
    K.audio.sfx.fail();
    ch.sira = h.renk === kod[0] ? 1 : 0;
    notGoster('Yanlış sıra; şalterler sıfırlandı.');
  }
  // Monoton bayraklar: yalnız eklenir, iki tarafın kümesi birleşir
  function bayrakEkle(list, uzaktan) {
    if (!S) return;
    const yeni = list.filter((f) => !S.f.has(f));
    if (!yeni.length) return;
    yeni.forEach((f) => S.f.add(f));
    yeni.forEach(bayrakEtkisi);
    if (!uzaktan && !S.solo) gonder({ tip: 'bayrak', f: yeni });
  }
  function bayrakEtkisi(f) {
    const [tur, yer] = f.split(':');
    const [x, y] = (yer || '').split(',').map(Number);
    if (tur === 'kilit') {
      K.audio.sfx.success();
      parcacik(x + 0.5, y + 0.5, 8, 'yildiz');
      notGoster('Kilit açıldı 🔓');
    } else if (tur === 'kopru') {
      K.audio.sfx.pop();
      parcacik(x + 0.5, y + 0.5, 8, 'damla');
      if (!kopruTamam(S)) notGoster('Köprü uzadı');
    } else if (tur === 'kod') {
      K.audio.sfx.success();
      notGoster(yer === 'kitty' ? 'Kitty’nin kapısı açıldı' : 'Pamuk’un kapısı açıldı');
    }
    if (S && S.lv.siglar.length && kopruTamam(S) && tur === 'kopru') {
      K.audio.sfx.chime();
      notGoster('Köprü tamam! Ortada buluşun 💞');
    }
  }
  // Konumlardan türeyen her şey: çift düğme, kapı sesleri, bölüm kapısı, bitiş
  function kontrol() {
    if (!S || S.ekran !== 'oyun') return;
    const lv = S.lv;
    if (lv.dugmeler.length === 2 && !S.f.has('cift')) {
      const [a, b] = lv.dugmeler;
      const at = (c, h) => S.ch[c].x === h.x && S.ch[c].y === h.y;
      if ((at('kitty', a) && at('pamuk', b)) || (at('kitty', b) && at('pamuk', a))) bayrakEkle(['cift']);
    }
    const iz = acikKapilar(S).join('|');
    if (S.kapiIzi !== null && iz !== S.kapiIzi && !S.bitti) K.audio.sfx.tap();
    S.kapiIzi = iz;
    if (lv.kapiKosulu && !S.gateAcik && lv.kapiKosulu(S)) {
      S.gateAcik = true;
      K.audio.sfx.chime();
      notGoster(lv.acildiNotu);
      lv.kapilar.filter((h) => h.bayrak).forEach((h) => parcacik(h.x + 0.5, h.y + 0.5, 8, 'kalp'));
    }
    hud();
    if (!S.bitti && lv.bitti(S)) bitir();
  }

  /* ---------- Yol bulma (bir kareye dokununca) ---------- */
  // Şalter, bant ve sönük yıldızlar "hassas": hedef değilse üstünden geçilmez
  const hassas = (x, y) => {
    const t = hucre(S, x, y).t;
    return t === 'salter' || t === 'bant' || (t === 'yildiz' && !S.f.has('yildiz'));
  };
  function gecilir(c, x, y, hedef) {
    const anahtarli = c === 'kitty' && S.ch.kitty.tasi && S.ch.kitty.tasi.startsWith('anahtar') && icinde(x, y) && hucre(S, x, y).t === 'kilit';
    if (!gecer(S, c, x, y) && !anahtarli) return false;
    if (kutuAt(S, x, y)) return false;
    return hedef || !hassas(x, y);
  }
  function yolBul(c, tx, ty) {
    const ch = S.ch[c];
    if (!icinde(tx, ty)) return null;
    const anahtar = (x, y) => y * GEN + x;
    const onceki = new Map([[anahtar(ch.x, ch.y), null]]);
    const q = [[ch.x, ch.y]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const d of ['u', 'd', 'l', 'r']) {
        const nx = x + YON[d][0], ny = y + YON[d][1], k = anahtar(nx, ny);
        if (onceki.has(k) || !gecilir(c, nx, ny, nx === tx && ny === ty)) continue;
        onceki.set(k, [x, y, d]);
        q.push([nx, ny]);
      }
    }
    if (!onceki.has(anahtar(tx, ty))) return null;
    const yol = [];
    for (let k = anahtar(tx, ty); onceki.get(k); ) {
      const [px, py, d] = onceki.get(k);
      yol.unshift(d);
      k = anahtar(px, py);
    }
    return yol;
  }
  function dokun(x, y) {
    if (!S || S.ekran !== 'oyun' || S.bitti || !icinde(x, y)) return;
    if (S.solo) {
      const c = IKI.find((k) => k !== S.aktif && S.ch[k].x === x && S.ch[k].y === y);
      if (c) return sec(c);
    }
    const c = aktif();
    const ch = S.ch[c];
    if (ch.bant || (ch.x === x && ch.y === y)) return;
    S.hedef = { x, y, t: performance.now() };
    if (Math.abs(ch.x - x) + Math.abs(ch.y - y) === 1) {
      ch.kuyruk = [yonOf(x - ch.x, y - ch.y)];
      ch.yol = true;
      return;
    }
    const yol = yolBul(c, x, y);
    if (yol) (ch.kuyruk = yol), (ch.yol = true);
    else notGoster('Oraya yol yok.');
  }
  // Elle basılan yön: adım sürerken gelen basışlar kaybolmasın diye kısa bir tampona eklenir (en çok 3);
  // dokunarak başlatılmış bir yürüyüş varsa onun yerini alır
  function yonBas(d) {
    if (!S || S.ekran !== 'oyun' || S.bitti) return;
    const ch = S.ch[aktif()];
    basili = d;
    if (ch.bant) return;
    if (ch.yol) {
      ch.kuyruk = [];
      ch.yol = false;
    }
    if (performance.now() >= ch.sonraki && !ch.kuyruk.length) adim(aktif(), YON[d][0], YON[d][1]);
    else if (ch.kuyruk.length < 3) ch.kuyruk.push(d);
  }
  function sec(c) {
    if (!S || !S.solo || S.aktif === c) return;
    S.aktif = c;
    basili = null;
    S.ch[c].kuyruk = [];
    K.audio.sfx.tap();
    notGoster(`Şimdi ${AD[c]}’${c === 'kitty' ? 'sin' : 'sun'}`);
    hud();
  }
  // Hareket saati: bant, yol kuyruğu ve basılı tutulan yön
  function tik() {
    if (!S || S.ekran !== 'oyun') return;
    saatYaz();
    if (S.bitti) return;
    const now = performance.now();
    for (const c of IKI) {
      if (!sahibi(c)) continue;
      const ch = S.ch[c];
      if (now < ch.sonraki) continue;
      if (ch.bant) {
        if (!adim(c, ch.bant[0], ch.bant[1])) ch.bant = null;
        continue;
      }
      if (ch.kuyruk.length) {
        const d = ch.kuyruk.shift();
        if (!adim(c, YON[d][0], YON[d][1])) ch.kuyruk = [];
        if (!ch.kuyruk.length) ch.yol = false;
        continue;
      }
      if (basili && c === aktif()) adim(c, YON[basili][0], YON[basili][1]);
    }
  }

  /* ================= Canlı eşzamanlama ================= */
  function temel() {
    return { ekran: S ? S.ekran : 'menu', bolum: S ? S.lv.no : 0, oturum: S ? S.oturum : null, solo: Boolean(S && S.solo), kaynak: KAYNAK };
  }
  function gonder(m) {
    if (!K.cloud || !K.cloud.enabled) return;
    K.cloud.send('macera', Object.assign(temel(), m));
  }
  const karDurum = (c) => {
    const ch = S.ch[c];
    return { x: ch.x, y: ch.y, d: ch.d, sira: ch.sira, tasi: ch.tasi };
  };
  const kutuDurum = () => S.kutular.map((k) => [k.x, k.y, k.yok ? 1 : 0]);
  // Kendi kedimin her değişikliği (adım, eşya, şalter) sıra numarasıyla yayılır
  function karakterYay(c, tip, ek) {
    if (!S || S.solo) return;
    benN++;
    gonder(Object.assign({ tip, n: benN, c: karDurum(c), kutular: c === 'pamuk' ? kutuDurum() : undefined }, ek || {}));
  }
  // Kalp atışı (herkes) ve tam anlık görüntü (kale sahibi): ikisi de bütün durumu taşır, geç gelen de yetişir
  function anlikGonder(tip) {
    if (!S || S.solo || S.ekran !== 'oyun') return gonder({ tip });
    gonder({ tip, n: benN, c: karDurum(benim()), b: karDurum(obur(benim())), kutular: kutuDurum(), f: [...S.f], gecen: S.bitti ? S.sure * 1000 : Date.now() - S.t0 });
  }
  function al(m) {
    if (!m || m.who === mine()) return;
    Object.assign(ortak, { ekran: m.ekran, bolum: m.bolum, oturum: m.oturum, solo: Boolean(m.solo), at: Date.now() });
    if (m.tip === 'cik') {
      ortak.ekran = 'menu';
      if (S && !S.solo && S.oturum === m.oturum && S.ekran === 'oyun' && !S.bitti) {
        S.kopuk = true;
        notGoster(`${K.esc(nameOf(m.who))} oyundan çıktı.`);
      }
      return arayuz();
    }
    if (!S || S.solo) return davetIsle(m);
    if (S.oturum !== m.oturum) {
      if (m.solo || !m.oturum || m.ekran === 'menu') return arayuz();
      if (m.bolum !== S.lv.no || S.ekran !== 'lobi') return davetIsle(m);
      // İki lobi aynı anda açıldıysa kale sahibininki geçerli; süren bir oyuna her zaman katılınır
      if (m.ekran === 'oyun' || mine() === 'her') katil(m);
      else return arayuz();
    }
    if (m.tip === 'yeniden') return yenidenBasla(m.yeni, true);
    if (S.ekran === 'lobi') oyunuBaslat();
    if (S.ekran !== 'oyun') return;
    if (S.kopuk) {
      S.kopuk = false;
      hud();
    }
    durumUygula(m);
    if (m.tip === 'al' && m.esya) notGoster(`${esyaAdi(m.esya)} Kitty’de!`);
    if (m.tip === 'bitti') bitir(m.sure);
  }
  function durumUygula(m) {
    const oc = KAR[m.who];
    if (m.kaynak !== S.onKaynak) {
      S.onKaynak = m.kaynak;
      S.onN = -1;
    }
    if (m.c && m.n >= S.onN) {
      S.onN = m.n;
      karUygula(oc, m.c);
      if (oc === 'pamuk' && m.kutular) kutuUygula(m.kutular);
    }
    // Yeniden katılınca (sayfa yenilendi) kendi kedimi ve kutuları öbürünün bildiği yerden sürdür
    if (S.katiliyor && m.b && m.gecen != null) {
      S.katiliyor = false;
      if (m.gecen > 3000) {
        karUygula(benim(), m.b, true);
        if (benim() === 'pamuk' && m.kutular) kutuUygula(m.kutular);
        S.t0 = Date.now() - m.gecen;
      }
    }
    if (m.f) bayrakEkle(m.f, true);
    if (m.tip === 'durum' && mine() === 'her' && m.gecen != null && !S.bitti && Math.abs(Date.now() - S.t0 - m.gecen) > 1500) S.t0 = Date.now() - m.gecen;
    kontrol();
  }
  function karUygula(c, st, aninda) {
    const ch = S.ch[c];
    const now = performance.now();
    if (ch.x !== st.x || ch.y !== st.y) {
      const g0 = konum(ch, now);
      const uzak = Math.abs(st.x - ch.x) + Math.abs(st.y - ch.y) > 1;
      ch.ax = aninda || uzak ? st.x : g0.x;
      ch.ay = aninda || uzak ? st.y : g0.y;
      ch.at = now;
      ch.x = st.x;
      ch.y = st.y;
    }
    if (st.d) ch.d = st.d;
    const sira = st.sira || 0;
    if (sira > ch.sira && S.lv.yildizlar.length && c === 'pamuk' && S.gizem.sira[sira - 1]) {
      const [x, y] = S.gizem.sira[sira - 1];
      parcacik(x + 0.5, y + 0.5, 6, 'yildiz');
    }
    if (sira < ch.sira && sira === 0 && !S.f.has('yildiz') && S.lv.yildizlar.length) notGoster('Yanlış yıldız: hepsi söndü.');
    ch.sira = sira;
    ch.tasi = st.tasi || null;
  }
  function kutuUygula(arr) {
    if (!Array.isArray(arr) || arr.length !== S.kutular.length) return;
    S.kutular = arr.map(([x, y, yok]) => ({ x, y, yok: Boolean(yok) }));
  }
  // Öbürü bir bölümde bekliyorsa davet: odadaysan bant, değilsen bildirim
  function davetIsle(m) {
    if (davetVar() && K.activeRoom !== 'macera' && !toastlanan.has(m.oturum)) {
      toastlanan.add(m.oturum);
      K.fx.toast(`🗺 <b>${K.esc(nameOf(m.who))}</b> seni Kale Macerası’na çağırıyor (${m.bolum}. bölüm). <a href="#macera">Katıl</a>`, { duration: 8000 });
    }
    arayuz();
  }
  function katil(m) {
    S.oturum = m.oturum;
    S.onN = -1;
    S.onKaynak = null;
    S.katiliyor = true;
    gizemKur(S);
  }

  /* ================= Bölüm akışı ================= */
  const enIyiler = () => {
    const out = {};
    rows.forEach((r) => {
      const d = r.data || {};
      const o = out[d.bolum];
      // Birlikte bitirilen süre, tek başına olanın önünde gelir
      if (!o || (o.solo && !d.solo) || (o.solo === Boolean(d.solo) && d.sure < o.sure)) out[d.bolum] = { sure: d.sure, solo: Boolean(d.solo) };
    });
    return out;
  };
  const acikBolum = () => Math.min(BOLUMLER.length, rows.reduce((a, r) => Math.max(a, (r.data && r.data.bolum) || 0), 0) + 1);

  function lobiAc(no) {
    S = yeniOyun(no, yeniOturum(), false);
    if (davetVar() && ortak.bolum === no) {
      katil(ortak);
      oyunuBaslat();
    }
    anlikGonder('nabiz');
    render();
  }
  function davetiKabul() {
    if (!davetVar()) return render();
    S = yeniOyun(ortak.bolum, ortak.oturum, false);
    katil(ortak);
    oyunuBaslat();
    anlikGonder('nabiz');
  }
  function soloBasla(no) {
    S = yeniOyun(no, yeniOturum(), true);
    oyunuBaslat();
    gonder({ tip: 'nabiz' });
  }
  function oyunuBaslat() {
    S.ekran = 'oyun';
    if (!S.t0) S.t0 = Date.now();
    K.audio.sfx.chime();
    render();
    zamanlayicilar();
    // Telefonda harita, yön tuşlarıyla birlikte ekrana sığsın
    const oyunEl = root && K.$('.mc-oyun', root);
    if (oyunEl && K.activeRoom === 'macera') requestAnimationFrame(() => oyunEl.scrollIntoView({ block: 'start', behavior: K.reduced ? 'auto' : 'smooth' }));
    if (S.solo) notGoster(`Tek başına: önce ${AD[S.aktif]}. “Değiştir” ile öbür kediye geç.`);
    else notGoster(`${K.esc(nameOf(other()))} da burada. Başlıyoruz!`);
  }
  function yenidenIste() {
    const b = K.$('[data-mc-bastan]', root);
    if (b && b.dataset.emin !== '1') {
      b.dataset.emin = '1';
      b.textContent = 'Emin misin?';
      setTimeout(() => b.isConnected && ((b.dataset.emin = ''), (b.textContent = '↺ Baştan')), 3000);
      return;
    }
    const yeni = yeniOturum();
    if (!S.solo) gonder({ tip: 'yeniden', yeni });
    yenidenBasla(yeni, false);
  }
  function yenidenBasla(yeni, uzaktan) {
    const eski = S;
    S = yeniOyun(eski.lv.no, yeni, eski.solo);
    S.aktif = eski.aktif;
    S.ekran = 'oyun';
    S.t0 = Date.now();
    basili = null;
    notGoster(uzaktan ? `${K.esc(nameOf(other()))} bölümü baştan başlattı.` : 'Bölüm baştan başladı.');
    render();
    zamanlayicilar();
  }
  function cik() {
    if (S && !S.solo && S.ekran !== 'menu') gonder({ tip: 'cik' });
    S = null;
    basili = null;
    zamanlayicilar();
    render();
    gonder({ tip: 'nabiz' });
  }
  function tekBasinaDevam() {
    if (!S) return;
    S.solo = true;
    S.kopuk = false;
    S.aktif = benim();
    notGoster('Tek başına devam: iki kedi de sende.');
    zamanlayicilar();
    hud();
  }

  function bitir(disSure) {
    if (!S || S.bitti) return;
    S.bitti = true;
    S.sure = disSure != null ? disSure : Math.max(1, Math.round((Date.now() - S.t0) / 1000));
    basili = null;
    IKI.forEach((c) => (S.ch[c].kuyruk = []));
    if (!S.solo) gonder({ tip: 'bitti', sure: S.sure });
    const lv = S.lv;
    const now = performance.now();
    IKI.forEach((c) => {
      S.ch[c].zipla = now;
      parcacik(S.ch[c].x + 0.5, S.ch[c].y + 0.2, 10, 'kalp');
    });
    if (lv.no === 5) S.sarilma = now;
    K.audio.sfx.success();
    setTimeout(() => K.fx.confetti({ count: lv.no === 5 ? 220 : 130, shapes: ['heart', 'star', 'bow'] }), 300);
    hud();
    kaydet(S);
    const o = S;
    setTimeout(() => S === o && aniKarti(o), lv.no === 5 ? 2900 : 1300);
  }
  function kaydet(o) {
    const no = o.lv.no;
    const veri = { bolum: no, sure: o.sure, solo: o.solo, oturum: o.oturum };
    const yaz = () =>
      K.cloud &&
      K.cloud.enabled &&
      K.cloud.add('macerabolum', veri).then((r) => {
        if (r && !rows.some((x) => x.id === r.id)) rows.push(r);
      });
    // Birlikte bitince kaydı kale sahibi yazar; o gitmişse birkaç saniye sonra Eln yazar (kimlikle ayıklanır)
    if (o.solo || mine() === 'me') yaz();
    else setTimeout(() => rows.some((r) => r.data && r.data.oturum === o.oturum) || yaz(), 5000);
    K.stickers.award('macera' + no);
    if (no === BOLUMLER.length) K.stickers.award('macerason');
    const ad = BOLUMLER[no - 1].ad;
    if (o.solo) K.ping(`🗺 ${K.meName()} Kale Macerası’nda ${no}. bölümü bitirdi`, `“${ad}” tek başına, ${saat(o.sure)}. Bir dahaki bölüm birlikte?`, ['world_map'], { click: K.roomUrl('macera') });
    else if (mine() === 'me') K.ping(`🗺 Kale Macerası: ${no}. bölüm bitti`, `“${ad}” birlikte, ${saat(o.sure)}. ${no === BOLUMLER.length ? 'Sonunda bir aradayız! 💞' : 'Sıradaki bölüm açıldı.'}`, [no === BOLUMLER.length ? 'two_hearts' : 'world_map'], { click: K.roomUrl('macera') });
  }

  /* ================= Çizim ================= */
  const g = { cv: null, ctx: null, cs: 28, dpr: 1, lw: 2.5, stat: null, statAnahtar: '', raf: 0 };
  // zemin: gündüz; karanlik: kalenin gece modunda koyu zemin (çıkartmalar pastel kalır)
  const TEMA = {
    sohbet: { zemin: ['#FFFFFF', '#F7F2FF'], karanlik: ['#392D52', '#33284B'], nokta: ['#E4D9FF', '#56487A'], duvar: '#FF8FB8', stil: 'balon', kapi: '#FFFFFF' },
    posta: { zemin: ['#FFF4EA', '#FFEADB'], karanlik: ['#3E2E3B', '#453442'], duvar: '#FFE27A', stil: 'blok', desen: 'raf', kapi: '#E3174D' },
    gece: { zemin: ['#2E2654', '#332A5C'], karanlik: ['#2E2654', '#332A5C'], duvar: '#6B59B5', stil: 'blok', desen: 'bulut', kapi: '#CDBBFF', yildizli: true },
    kiyi: { zemin: ['#FFF6DE', '#FFF1D0'], karanlik: ['#2F3A4A', '#2B3545'], sol: [['#EAFAF1', '#E2F7EC'], ['#2E4844', '#2A423F']], sag: [['#FFF0E4', '#FFE8D8'], ['#4A3838', '#443333']], duvar: '#CDBBFF', stil: 'blok', desen: 'kaya', kapi: '#FFC6A6' },
    havalimani: { zemin: ['#F4F9FD', '#E9F2F9'], karanlik: ['#2C374A', '#283245'], duvar: '#9FE5C4', stil: 'blok', desen: 'cam', kapi: '#FFE27A' },
  };
  const geceMi = () => document.body.classList.contains('night') || document.body.classList.contains('gece-modu');
  const hsh = (x, y) => (x * 73856093) ^ (y * 19349663);

  function rr(ctx, x, y, w, h, r) {
    const m = Math.min(w, h) / 2;
    const [a, b, c, d] = (Array.isArray(r) ? r : [r, r, r, r]).map((v) => Math.max(0, Math.min(v, m)));
    ctx.beginPath();
    ctx.moveTo(x + a, y);
    ctx.lineTo(x + w - b, y);
    if (b) ctx.arcTo(x + w, y, x + w, y + b, b);
    ctx.lineTo(x + w, y + h - c);
    if (c) ctx.arcTo(x + w, y + h, x + w - c, y + h, c);
    ctx.lineTo(x + d, y + h);
    if (d) ctx.arcTo(x, y + h, x, y + h - d, d);
    ctx.lineTo(x, y + a);
    if (a) ctx.arcTo(x, y, x + a, y, a);
    ctx.closePath();
  }
  // Çıkartma: sert ofset gölge + düz pastel dolgu + koyu mürdüm çizgi
  function cikartma(x, y, w, h, r, dolgu, golge) {
    const ctx = g.ctx;
    const sh = golge == null ? g.cs * 0.08 : golge;
    if (sh) {
      rr(ctx, x, y + sh, w, h, r);
      ctx.fillStyle = P.ink;
      ctx.fill();
    }
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = dolgu;
    ctx.fill();
    ctx.lineWidth = g.lw;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
  }
  function kalpYolu(ctx, cx, cy, s) {
    const w = s / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + w * 0.85);
    ctx.bezierCurveTo(cx - w * 1.25, cy + w * 0.05, cx - w * 0.85, cy - w * 1.0, cx, cy - w * 0.38);
    ctx.bezierCurveTo(cx + w * 0.85, cy - w * 1.0, cx + w * 1.25, cy + w * 0.05, cx, cy + w * 0.85);
    ctx.closePath();
  }
  function yildizYolu(ctx, cx, cy, r1, r2) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? r2 : r1, a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }
  function damlaYolu(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.55);
    ctx.bezierCurveTo(cx + s * 0.1, cy - s * 0.3, cx + s * 0.42, cy - s * 0.02, cx + s * 0.42, cy + s * 0.18);
    ctx.arc(cx, cy + s * 0.18, s * 0.42, 0, Math.PI);
    ctx.bezierCurveTo(cx - s * 0.42, cy - s * 0.02, cx - s * 0.1, cy - s * 0.3, cx, cy - s * 0.55);
    ctx.closePath();
  }
  function yaprakYolu(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.45, cy + s * 0.4);
    ctx.quadraticCurveTo(cx - s * 0.45, cy - s * 0.45, cx + s * 0.45, cy - s * 0.45);
    ctx.quadraticCurveTo(cx + s * 0.45, cy + s * 0.4, cx - s * 0.45, cy + s * 0.4);
    ctx.closePath();
  }
  function sembol(i, cx, cy, s, dolgu) {
    const ctx = g.ctx;
    if (i === 0) kalpYolu(ctx, cx, cy, s);
    else if (i === 1) yildizYolu(ctx, cx, cy, s * 0.55, s * 0.24);
    else if (i === 2) damlaYolu(ctx, cx, cy, s * 0.8);
    else yaprakYolu(ctx, cx, cy, s * 0.8);
    ctx.fillStyle = dolgu;
    ctx.fill();
    ctx.lineWidth = g.lw * 0.7;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
  }
  function cizgi(x1, y1, x2, y2, w, renk) {
    const ctx = g.ctx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = w;
    ctx.strokeStyle = renk || P.ink;
    ctx.stroke();
  }

  function boyutla() {
    if (!g.cv) return;
    const kap = g.cv.parentElement;
    const w = Math.min(kap.clientWidth || 340, 600);
    const cs = Math.max(16, Math.floor(w / GEN));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (cs === g.cs && dpr === g.dpr && g.cv.width === Math.round(cs * GEN * dpr)) return;
    g.cs = cs;
    g.dpr = dpr;
    g.lw = Math.max(1.6, cs * 0.085);
    g.cv.width = Math.round(cs * GEN * dpr);
    g.cv.height = Math.round(cs * YUK * dpr);
    g.cv.style.width = cs * GEN + 'px';
    g.cv.style.height = cs * YUK + 'px';
    g.statAnahtar = '';
  }

  /* ---------- Durağan katman: zemin, duvarlar, değişmeyen süsler (bölüm başına bir kez) ---------- */
  function statikCiz() {
    const lv = S.lv;
    const anahtar = [lv.no, g.cs, g.dpr, geceMi()].join(':');
    if (g.statAnahtar === anahtar && g.stat) return;
    g.statAnahtar = anahtar;
    const cv = g.stat || (g.stat = document.createElement('canvas'));
    cv.width = g.cv.width;
    cv.height = g.cv.height;
    const ctx = cv.getContext('2d');
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const ana = g.ctx;
    g.ctx = ctx;
    const tm = TEMA[lv.tema];
    zeminCiz(lv, tm);
    if (tm.stil === 'balon') balonDuvar(lv);
    else blokDuvar(lv, tm);
    statikSusler(lv, tm);
    g.ctx = ana;
  }
  function zeminCiz(lv, tm) {
    const { ctx, cs } = g;
    const k = geceMi() ? 1 : 0;
    const pal = k ? tm.karanlik : tm.zemin;
    for (let y = 0; y < YUK; y++)
      for (let x = 0; x < GEN; x++) {
        const t = lv.hucre[y][x].t;
        const cift = (x + y) % 2;
        // Boğaz'dan Hazar'a: sol kıyı İstanbul (nane), sağ kıyı Bakü (şeftali)
        const kiyi = tm.sol && (x < 4 ? tm.sol : x > 7 ? tm.sag : null);
        ctx.fillStyle = kiyi ? kiyi[k][cift] : pal[cift];
        ctx.fillRect(x * cs, y * cs, cs + 0.6, cs + 0.6);
        if (t === 'su' || t === 'sig') suCiz(lv, x, y, t === 'sig');
        else if (t !== 'duvar' && tm.nokta) {
          ctx.fillStyle = tm.nokta[k];
          ctx.beginPath();
          ctx.arc(x * cs + cs / 2, y * cs + cs / 2, cs * 0.05, 0, Math.PI * 2);
          ctx.fill();
        } else if (t !== 'duvar' && tm.yildizli && hsh(x, y) % 3 === 0) {
          ctx.fillStyle = 'rgba(255,240,200,.55)';
          ctx.beginPath();
          ctx.arc(x * cs + ((hsh(x, y) >>> 3) % 10) * cs * 0.08 + cs * 0.1, y * cs + ((hsh(x, y) >>> 7) % 10) * cs * 0.08 + cs * 0.1, cs * 0.03, 0, Math.PI * 2);
          ctx.fill();
        }
      }
  }
  function suCiz(lv, x, y, sig) {
    const { ctx, cs, lw } = g;
    const X = x * cs, Y = y * cs;
    ctx.fillStyle = geceMi() ? (sig ? '#7FB4DD' : '#4F86B8') : sig ? '#C4E9FF' : '#8FCFF6';
    ctx.fillRect(X, Y, cs + 0.6, cs + 0.6);
    ctx.lineWidth = Math.max(1.2, lw * 0.55);
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    const o = (hsh(x, y) >>> 4) % 3;
    ctx.beginPath();
    ctx.moveTo(X + cs * (0.15 + o * 0.08), Y + cs * 0.38);
    ctx.quadraticCurveTo(X + cs * (0.3 + o * 0.08), Y + cs * 0.26, X + cs * (0.45 + o * 0.08), Y + cs * 0.38);
    ctx.moveTo(X + cs * 0.45, Y + cs * 0.74);
    ctx.quadraticCurveTo(X + cs * 0.6, Y + cs * 0.62, X + cs * 0.75, Y + cs * 0.74);
    ctx.stroke();
    if (sig) {
      ctx.setLineDash([cs * 0.08, cs * 0.08]);
      ctx.strokeStyle = 'rgba(58,31,45,.35)';
      ctx.strokeRect(X + cs * 0.1, Y + cs * 0.1, cs * 0.8, cs * 0.8);
      ctx.setLineDash([]);
    }
    // Kıyı çizgisi
    const kara = (nx, ny) => icinde(nx, ny) && !['su', 'sig'].includes(lv.hucre[ny][nx].t);
    ctx.fillStyle = P.ink;
    if (kara(x - 1, y)) ctx.fillRect(X, Y, lw, cs + 0.6);
    if (kara(x + 1, y)) ctx.fillRect(X + cs - lw, Y, lw, cs + 0.6);
  }
  // Grup sohbeti: duvarlar tek tek mesaj baloncukları
  function balonDuvar(lv) {
    const { ctx, cs, lw } = g;
    const renkler = [P.pink, P.sky, '#FFFFFF', P.lilac, P.sky, P.pink];
    for (let y = 0; y < YUK; y++)
      for (let x = 0; x < GEN; x++) {
        if (lv.hucre[y][x].t !== 'duvar') continue;
        const h = hsh(x, y) >>> 2;
        const i = cs * 0.05, X = x * cs + i, Y = y * cs + i, w = cs - 2 * i;
        cikartma(X, Y, w, w * 0.9, cs * 0.3, renkler[h % renkler.length], cs * 0.07);
        ctx.fillStyle = P.ink;
        if (h % 4 === 1) [0.3, 0.5, 0.7].forEach((k) => (ctx.beginPath(), ctx.arc(X + w * k, Y + w * 0.45, cs * 0.045, 0, Math.PI * 2), ctx.fill()));
        else if (h % 4 === 2) {
          ctx.fillStyle = 'rgba(58,31,45,.35)';
          rr(ctx, X + w * 0.2, Y + w * 0.3, w * 0.55, cs * 0.07, cs * 0.035);
          ctx.fill();
          rr(ctx, X + w * 0.2, Y + w * 0.52, w * 0.35, cs * 0.07, cs * 0.035);
          ctx.fill();
        }
        ctx.lineWidth = lw * 0.5;
      }
  }
  // Birleşik bloklar: dış kenarda kalın çizgi, alt kenarda sert gölge, iç köşeler düzgün
  function blokDuvar(lv, tm) {
    const { ctx, cs, lw } = g;
    const W = (x, y) => !icinde(x, y) || lv.hucre[y][x].t === 'duvar';
    const r = cs * 0.3, sh = cs * 0.1;
    const list = [];
    for (let y = 0; y < YUK; y++) for (let x = 0; x < GEN; x++) if (W(x, y)) list.push([x, y]);
    ctx.fillStyle = P.ink;
    for (const [x, y] of list) {
      const n = W(x, y - 1), s = W(x, y + 1), w = W(x - 1, y), e = W(x + 1, y);
      rr(ctx, x * cs, y * cs, cs, cs + (s ? 0 : sh), [!n && !w ? r : 0, !n && !e ? r : 0, !s && !e ? r : 0, !s && !w ? r : 0]);
      ctx.fill();
    }
    for (const [x, y] of list) {
      const n = W(x, y - 1), s = W(x, y + 1), w = W(x - 1, y), e = W(x + 1, y);
      const l = w ? 0 : lw, t = n ? 0 : lw, rt = e ? 0 : lw, b = s ? 0 : lw;
      const ri = r - lw;
      rr(ctx, x * cs + l, y * cs + t, cs - l - rt, cs - t - b, [!n && !w ? ri : 0, !n && !e ? ri : 0, !s && !e ? ri : 0, !s && !w ? ri : 0]);
      ctx.fillStyle = tm.duvar;
      ctx.fill();
      duvarDeseni(tm, x, y);
    }
    ctx.fillStyle = P.ink;
    for (const [x, y] of list)
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
        if (W(x + dx, y) && W(x, y + dy) && !W(x + dx, y + dy)) ctx.fillRect(dx > 0 ? (x + 1) * cs - lw : x * cs, dy > 0 ? (y + 1) * cs - lw : y * cs, lw, lw);
  }
  function duvarDeseni(tm, x, y) {
    const { ctx, cs } = g;
    const X = x * cs, Y = y * cs, h = hsh(x, y) >>> 3;
    if (tm.desen === 'raf') {
      ctx.fillStyle = '#F4C94A';
      rr(ctx, X + cs * 0.2, Y + cs * 0.24, cs * 0.6, cs * 0.5, cs * 0.08);
      ctx.fill();
      if (h % 3 === 0) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(X + cs * 0.3, Y + cs * 0.38, cs * 0.4, cs * 0.26);
        ctx.lineWidth = Math.max(1, g.lw * 0.45);
        ctx.strokeStyle = P.ink;
        ctx.strokeRect(X + cs * 0.3, Y + cs * 0.38, cs * 0.4, cs * 0.26);
        ctx.beginPath();
        ctx.moveTo(X + cs * 0.3, Y + cs * 0.38);
        ctx.lineTo(X + cs * 0.5, Y + cs * 0.52);
        ctx.lineTo(X + cs * 0.7, Y + cs * 0.38);
        ctx.stroke();
      }
    } else if (tm.desen === 'bulut' && h % 3 === 0) {
      ctx.fillStyle = 'rgba(255,244,199,.8)';
      yildizYolu(ctx, X + cs * (0.3 + (h % 5) * 0.08), Y + cs * (0.35 + (h % 3) * 0.1), cs * 0.09, cs * 0.04);
      ctx.fill();
    } else if (tm.desen === 'kaya' && h % 2 === 0) {
      ctx.fillStyle = 'rgba(58,31,45,.12)';
      ctx.beginPath();
      ctx.ellipse(X + cs * 0.4, Y + cs * 0.55, cs * 0.18, cs * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (tm.desen === 'cam') {
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = Math.max(1.2, cs * 0.06);
      ctx.beginPath();
      ctx.moveTo(X + cs * 0.25, Y + cs * 0.7);
      ctx.lineTo(X + cs * 0.55, Y + cs * 0.3);
      ctx.stroke();
    }
  }
  function statikSusler(lv, tm) {
    const { ctx, cs } = g;
    for (let y = 0; y < YUK; y++)
      for (let x = 0; x < GEN; x++) {
        const h = lv.hucre[y][x];
        const X = x * cs, Y = y * cs;
        if (h.t === 'cikis') {
          cikartma(X + cs * 0.12, Y + cs * 0.1, cs * 0.76, cs * 0.76, cs * 0.22, P.butter, cs * 0.06);
          kalpYolu(ctx, X + cs / 2, Y + cs * 0.5, cs * 0.42);
          ctx.fillStyle = P.pink;
          ctx.fill();
          ctx.lineWidth = g.lw * 0.7;
          ctx.strokeStyle = P.ink;
          ctx.stroke();
        } else if (h.t === 'kedi') {
          rr(ctx, X + cs * 0.16, Y + cs * 0.12, cs * 0.68, cs * 0.8, [cs * 0.34, cs * 0.34, cs * 0.06, cs * 0.06]);
          ctx.fillStyle = P.lilac;
          ctx.fill();
          ctx.lineWidth = g.lw;
          ctx.strokeStyle = P.ink;
          ctx.stroke();
          pati(X + cs / 2, Y + cs * 0.56, cs * 0.34, '#fff');
        } else if (h.t === 'posta') postaKutusu(X, Y, renk(h.renk));
        else if (h.t === 'teleskop') teleskop(X, Y);
        else if (h.t === 'hali') {
          rr(ctx, X + 1, Y + 1, cs - 2, cs - 2, cs * 0.2);
          ctx.fillStyle = '#FFD1E2';
          ctx.fill();
          kalpYolu(ctx, X + cs / 2, Y + cs / 2, cs * 0.34);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }
    if (lv.tema === 'gece') {
      // Ayın 21'i: köşede hilal ve "21"
      const mx = cs * 2.2, my = cs * 0.5, r = cs * 0.36;
      ctx.beginPath();
      ctx.arc(mx, my, r, Math.PI * 0.35, Math.PI * 1.65);
      ctx.arc(mx + r * 0.45, my - r * 0.1, r * 0.82, Math.PI * 1.55, Math.PI * 0.45, true);
      ctx.closePath();
      ctx.fillStyle = P.butter;
      ctx.fill();
      ctx.lineWidth = g.lw * 0.8;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      ctx.font = `700 ${Math.round(cs * 0.48)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFF4C7';
      ctx.fillText('21', cs * 3.25, cs * 0.54);
    }
    if (lv.tema === 'havalimani') ucak(cs * 3.5, cs * 0.5, cs);
  }
  function pati(cx, cy, s, dolgu) {
    const ctx = g.ctx;
    ctx.fillStyle = dolgu;
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.12, s * 0.28, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    [[-0.3, -0.18], [-0.1, -0.36], [0.1, -0.36], [0.3, -0.18]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx * s, cy + dy * s, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function postaKutusu(X, Y, dolgu) {
    const { ctx, cs } = g;
    rr(ctx, X + cs * 0.14, Y + cs * 0.14, cs * 0.72, cs * 0.78, [cs * 0.32, cs * 0.32, cs * 0.08, cs * 0.08]);
    ctx.fillStyle = dolgu;
    ctx.fill();
    ctx.lineWidth = g.lw;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    cizgi(X + cs * 0.32, Y + cs * 0.44, X + cs * 0.68, Y + cs * 0.44, g.lw * 1.2);
    ctx.fillStyle = P.red;
    ctx.fillRect(X + cs * 0.78, Y + cs * 0.22, cs * 0.16, cs * 0.1);
    cizgi(X + cs * 0.78, Y + cs * 0.22, X + cs * 0.78, Y + cs * 0.5, g.lw * 0.6);
  }
  function teleskop(X, Y) {
    const { ctx, cs } = g;
    const w = g.lw * 0.8;
    cizgi(X + cs * 0.5, Y + cs * 0.5, X + cs * 0.25, Y + cs * 0.9, w);
    cizgi(X + cs * 0.5, Y + cs * 0.5, X + cs * 0.75, Y + cs * 0.9, w);
    cizgi(X + cs * 0.5, Y + cs * 0.5, X + cs * 0.5, Y + cs * 0.92, w);
    ctx.save();
    ctx.translate(X + cs * 0.5, Y + cs * 0.42);
    ctx.rotate(-0.55);
    rr(ctx, -cs * 0.34, -cs * 0.11, cs * 0.68, cs * 0.22, cs * 0.08);
    ctx.fillStyle = P.sky;
    ctx.fill();
    ctx.lineWidth = g.lw * 0.8;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    rr(ctx, cs * 0.26, -cs * 0.14, cs * 0.12, cs * 0.28, cs * 0.04);
    ctx.fillStyle = P.butter;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function ucak(cx, cy, cs) {
    const ctx = g.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.moveTo(-cs * 0.42, 0);
    ctx.quadraticCurveTo(-cs * 0.4, -cs * 0.08, -cs * 0.2, -cs * 0.07);
    ctx.lineTo(cs * 0.3, -cs * 0.07);
    ctx.quadraticCurveTo(cs * 0.46, -cs * 0.04, cs * 0.46, 0);
    ctx.quadraticCurveTo(cs * 0.46, cs * 0.06, cs * 0.3, cs * 0.07);
    ctx.lineTo(-cs * 0.3, cs * 0.07);
    ctx.closePath();
    ctx.moveTo(0, -cs * 0.06);
    ctx.lineTo(-cs * 0.14, -cs * 0.3);
    ctx.lineTo(cs * 0.04, -cs * 0.3);
    ctx.lineTo(cs * 0.14, -cs * 0.06);
    ctx.moveTo(0, cs * 0.06);
    ctx.lineTo(-cs * 0.14, cs * 0.3);
    ctx.lineTo(cs * 0.04, cs * 0.3);
    ctx.lineTo(cs * 0.14, cs * 0.06);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = g.lw * 0.6;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- Değişen katman (her kare) ---------- */
  function ciz() {
    g.raf = 0;
    if (!S || S.ekran !== 'oyun' || !g.cv || !g.cv.isConnected || K.activeRoom !== 'macera') return;
    boyutla();
    statikCiz();
    const { ctx, cs } = g;
    const now = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, g.cv.width, g.cv.height);
    ctx.drawImage(g.stat, 0, 0);
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const lv = S.lv;
    const tm = TEMA[lv.tema];
    for (let y = 0; y < YUK; y++)
      for (let x = 0; x < GEN; x++) {
        const h = lv.hucre[y][x];
        const X = x * cs, Y = y * cs;
        switch (h.t) {
          case 'plaka':
            plakaCiz(X, Y, h, dolu(S, x, y));
            break;
          case 'dugme':
            dugmeCiz(X, Y, kediAt(S, x, y), S.f.has('cift'));
            break;
          case 'yildiz':
            yildizCiz(X, Y, h, now);
            break;
          case 'salter':
            salterCiz(X, Y, h);
            break;
          case 'bant':
            bantCiz(X, Y, h, now);
            break;
          case 'sig':
            if (S.f.has(`kopru:${x},${y}`)) kopruCiz(X, Y);
            break;
          case 'kapi':
            kapiCiz(X, Y, h, kapiAcik(S, h), tm, now);
            break;
          case 'kilit':
            kilitCiz(X, Y, S.f.has(`kilit:${x},${y}`));
            break;
          default:
        }
      }
    lv.tabelalar.forEach((t) => tabelaCiz(t));
    if (lv.yildizlar.length) takimyildiz(now);
    lv.esyalar.forEach((e) => esyaYerde(S, e) && esyaCiz(e.tur, e.id, e.x * cs + cs / 2, e.y * cs + cs / 2 + Math.sin(now / 320 + e.x) * cs * 0.04, cs));
    S.kutular.forEach((k) => !k.yok && kutuCiz(k.x * cs, k.y * cs, lv.tema, dolu(S, k.x, k.y) && hucre(S, k.x, k.y).t === 'plaka'));
    if (S.hedef && now - S.hedef.t < 600) {
      const a = 1 - (now - S.hedef.t) / 600;
      ctx.strokeStyle = `rgba(227,23,77,${a.toFixed(2)})`;
      ctx.lineWidth = g.lw;
      ctx.beginPath();
      ctx.arc(S.hedef.x * cs + cs / 2, S.hedef.y * cs + cs / 2, cs * (0.2 + 0.2 * (1 - a)), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (S.sarilma) sarilmaKalp();
    karakterleriCiz(now);
    efektCiz(now);
    if (S.sarilma) sarilmaYazi();
    g.raf = requestAnimationFrame(ciz);
  }
  function cizimBaslat() {
    if (!g.raf) g.raf = requestAnimationFrame(ciz);
  }
  function cizimDurdur() {
    if (g.raf) cancelAnimationFrame(g.raf);
    g.raf = 0;
  }
  function plakaCiz(X, Y, h, bas) {
    const { ctx, cs } = g;
    const i = cs * 0.15, w = cs - 2 * i, dolgu = h.p === 2 ? P.sky : P.pink;
    if (bas) {
      rr(ctx, X + i, Y + i + cs * 0.05, w, w, cs * 0.16);
      ctx.fillStyle = h.p === 2 ? '#6FC2F2' : '#F2679C';
      ctx.fill();
      ctx.lineWidth = g.lw;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
    } else cikartma(X + i, Y + i - cs * 0.03, w, w, cs * 0.16, dolgu, cs * 0.08);
    kalpYolu(ctx, X + cs / 2, Y + cs / 2 + (bas ? cs * 0.05 : -cs * 0.03), cs * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fill();
  }
  function dugmeCiz(X, Y, bas, tamam) {
    const { ctx, cs } = g;
    const cx = X + cs / 2, cy = Y + cs / 2;
    ctx.beginPath();
    ctx.arc(cx, cy + (bas ? cs * 0.03 : 0), cs * 0.33, 0, Math.PI * 2);
    ctx.fillStyle = tamam ? P.sky : bas ? '#BFE5FF' : '#fff';
    ctx.fill();
    ctx.lineWidth = g.lw;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    const tik = (ox) => {
      ctx.beginPath();
      ctx.moveTo(cx - cs * 0.16 + ox, cy);
      ctx.lineTo(cx - cs * 0.05 + ox, cy + cs * 0.11);
      ctx.lineTo(cx + cs * 0.13 + ox, cy - cs * 0.1);
      ctx.lineWidth = g.lw * 0.9;
      ctx.strokeStyle = tamam ? '#fff' : bas ? '#1E7BC0' : '#9C8AA0';
      ctx.stroke();
    };
    if (tamam) tik(-cs * 0.06), tik(cs * 0.06);
    else tik(0);
  }
  function yildizCiz(X, Y, h, now) {
    const { ctx, cs } = g;
    const cx = X + cs / 2, cy = Y + cs / 2;
    const i = yildizNo(S, h.x, h.y);
    const yandi = S.f.has('yildiz') || i < S.ch.pamuk.sira;
    if (yandi) {
      ctx.fillStyle = 'rgba(255,226,122,.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, cs * (0.5 + 0.04 * Math.sin(now / 250 + i)), 0, Math.PI * 2);
      ctx.fill();
    }
    yildizYolu(ctx, cx, cy, cs * 0.38, cs * 0.17);
    ctx.fillStyle = yandi ? P.butter : '#8E80C9';
    ctx.fill();
    ctx.lineWidth = g.lw * 0.9;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    // Sırayı yalnız teleskoptaki Kitty görür
    if (gorur('kitty') && uzerinde(S, 'kitty', 'teleskop') && !S.f.has('yildiz')) {
      const bx = X + cs * 0.82, by = Y + cs * 0.18;
      ctx.beginPath();
      ctx.arc(bx, by, cs * 0.19, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = g.lw * 0.7;
      ctx.stroke();
      ctx.fillStyle = P.ink;
      ctx.font = `700 ${Math.round(cs * 0.27)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), bx, by + cs * 0.01);
    }
  }
  function takimyildiz(now) {
    const { ctx, cs } = g;
    const sira = S.gizem.sira;
    const n = S.f.has('yildiz') ? sira.length : S.ch.pamuk.sira;
    if (n < 2) return;
    const pts = sira.slice(0, n).map(([x, y]) => [x * cs + cs / 2, y * cs + cs / 2]);
    if (S.f.has('yildiz')) pts.push(pts[0]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
    ctx.lineWidth = g.lw * 2.4;
    ctx.strokeStyle = 'rgba(255,226,122,.25)';
    ctx.stroke();
    ctx.lineWidth = g.lw * 0.8;
    ctx.strokeStyle = `rgba(255,236,170,${(0.75 + 0.2 * Math.sin(now / 300)).toFixed(2)})`;
    ctx.stroke();
  }
  function salterCiz(X, Y, h) {
    const { cs } = g;
    const bitti = S.f.has('kod:' + h.grup);
    cikartma(X + cs * 0.13, Y + cs * 0.1, cs * 0.74, cs * 0.74, cs * 0.18, renk(h.renk), kediAt(S, h.x, h.y) ? 0 : cs * 0.07);
    sembol(h.renk, X + cs / 2, Y + cs * 0.47, cs * 0.4, bitti ? '#fff' : 'rgba(255,255,255,.9)');
  }
  function bantCiz(X, Y, h, now) {
    const { ctx, cs } = g;
    const [dx, dy] = h.d;
    ctx.fillStyle = '#B7A7EA';
    ctx.fillRect(X, Y + (dx ? cs * 0.1 : 0), cs + 0.5, dx ? cs * 0.8 : cs + 0.5);
    if (dy) ctx.fillRect(X + cs * 0.1, Y, cs * 0.8, cs + 0.5);
    ctx.fillStyle = P.ink;
    if (dx) {
      ctx.fillRect(X, Y + cs * 0.1, cs + 0.5, g.lw * 0.8);
      ctx.fillRect(X, Y + cs * 0.9 - g.lw * 0.8, cs + 0.5, g.lw * 0.8);
    } else {
      ctx.fillRect(X + cs * 0.1, Y, g.lw * 0.8, cs + 0.5);
      ctx.fillRect(X + cs * 0.9 - g.lw * 0.8, Y, g.lw * 0.8, cs + 0.5);
    }
    const kay = K.reduced ? 0 : ((now / 700) % 1) * cs * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(X, Y, cs, cs);
    ctx.clip();
    ctx.lineWidth = g.lw * 0.9;
    ctx.strokeStyle = P.butter;
    for (let k = -1; k < 3; k++) {
      const o = k * cs * 0.5 + kay;
      const cx = X + cs / 2 + dx * (o - cs * 0.25), cy = Y + cs / 2 + dy * (o - cs * 0.25);
      ctx.beginPath();
      ctx.moveTo(cx - dx * cs * 0.1 - dy * cs * 0.18, cy - dy * cs * 0.1 - dx * cs * 0.18);
      ctx.lineTo(cx + dx * cs * 0.06, cy + dy * cs * 0.06);
      ctx.lineTo(cx - dx * cs * 0.1 + dy * cs * 0.18, cy - dy * cs * 0.1 + dx * cs * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }
  function kopruCiz(X, Y) {
    const { ctx, cs } = g;
    ctx.fillStyle = '#EDB27A';
    ctx.fillRect(X, Y + cs * 0.12, cs + 0.5, cs * 0.76);
    ctx.fillStyle = P.ink;
    ctx.fillRect(X, Y + cs * 0.12, cs + 0.5, g.lw);
    ctx.fillRect(X, Y + cs * 0.88 - g.lw, cs + 0.5, g.lw);
    [0.33, 0.66].forEach((k) => cizgi(X + cs * k, Y + cs * 0.18, X + cs * k, Y + cs * 0.82, g.lw * 0.5, 'rgba(58,31,45,.55)'));
  }
  function kapiCiz(X, Y, h, acik, tm, now) {
    const { ctx, cs } = g;
    const dolgu = h.p ? (h.p === 2 ? P.sky : P.pink) : h.kod ? P.peach : tm.kapi;
    if (acik) {
      ctx.setLineDash([cs * 0.1, cs * 0.08]);
      rr(ctx, X + cs * 0.1, Y + cs * 0.1, cs * 0.8, cs * 0.8, cs * 0.16);
      ctx.lineWidth = g.lw * 0.6;
      ctx.strokeStyle = 'rgba(58,31,45,.35)';
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    cikartma(X + cs * 0.06, Y + cs * 0.04, cs * 0.88, cs * 0.86, cs * 0.16, dolgu, cs * 0.08);
    const cx = X + cs / 2, cy = Y + cs * 0.47;
    if (h.p) {
      [0.32, 0.5, 0.68].forEach((k) => cizgi(X + cs * k, Y + cs * 0.2, X + cs * k, Y + cs * 0.76, g.lw * 0.5, 'rgba(255,255,255,.75)'));
      kalpYolu(ctx, cx, cy, cs * 0.26);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else if (h.kod) {
      [0.3, 0.5, 0.7].forEach((k) => cizgi(X + cs * k, Y + cs * 0.14, X + cs * k, Y + cs * 0.82, g.lw * 0.5, 'rgba(58,31,45,.4)'));
      const ilerleme = S.ch[h.kod].sira;
      [0, 1, 2].forEach((i) => {
        ctx.beginPath();
        ctx.arc(X + cs * (0.3 + i * 0.2), Y + cs * 0.47, cs * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = i < ilerleme ? P.butter : '#fff';
        ctx.fill();
        ctx.lineWidth = g.lw * 0.5;
        ctx.strokeStyle = P.ink;
        ctx.stroke();
      });
    } else if (tm.stil === 'balon') {
      const t = now / 300;
      [-1, 0, 1].forEach((k) => {
        ctx.beginPath();
        ctx.arc(cx + k * cs * 0.18, cy - (K.reduced ? 0 : Math.max(0, Math.sin(t - k)) * cs * 0.06), cs * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = P.ink;
        ctx.fill();
      });
    } else if (S.lv.tema === 'posta') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - cs * 0.22, cy - cs * 0.14, cs * 0.44, cs * 0.3);
      ctx.lineWidth = g.lw * 0.5;
      ctx.strokeStyle = P.ink;
      ctx.strokeRect(cx - cs * 0.22, cy - cs * 0.14, cs * 0.44, cs * 0.3);
      ctx.beginPath();
      ctx.moveTo(cx - cs * 0.22, cy - cs * 0.14);
      ctx.lineTo(cx, cy + cs * 0.04);
      ctx.lineTo(cx + cs * 0.22, cy - cs * 0.14);
      ctx.stroke();
    } else if (S.lv.tema === 'gece') {
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.2, Math.PI * 0.3, Math.PI * 1.7);
      ctx.arc(cx + cs * 0.08, cy - cs * 0.02, cs * 0.16, Math.PI * 1.6, Math.PI * 0.4, true);
      ctx.closePath();
      ctx.fillStyle = P.butter;
      ctx.fill();
      ctx.lineWidth = g.lw * 0.5;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
    } else {
      ctx.save();
      rr(ctx, X + cs * 0.06, Y + cs * 0.04, cs * 0.88, cs * 0.86, cs * 0.16);
      ctx.clip();
      ctx.lineWidth = cs * 0.1;
      ctx.strokeStyle = 'rgba(58,31,45,.75)';
      for (let k = -1; k < 4; k++) cizgi(X + k * cs * 0.32, Y + cs, X + k * cs * 0.32 + cs, Y, cs * 0.1, 'rgba(58,31,45,.7)');
      ctx.restore();
      rr(ctx, X + cs * 0.06, Y + cs * 0.04, cs * 0.88, cs * 0.86, cs * 0.16);
      ctx.lineWidth = g.lw;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
    }
  }
  function kilitCiz(X, Y, acik) {
    const { ctx, cs } = g;
    if (acik) {
      ctx.globalAlpha = 0.3;
      asma(X + cs / 2, Y + cs * 0.52, cs * 0.5, true);
      ctx.globalAlpha = 1;
      return;
    }
    cikartma(X + cs * 0.06, Y + cs * 0.04, cs * 0.88, cs * 0.86, cs * 0.16, P.red, cs * 0.08);
    asma(X + cs / 2, Y + cs * 0.52, cs * 0.5, false);
  }
  function asma(cx, cy, s, acik) {
    const ctx = g.ctx;
    ctx.beginPath();
    ctx.arc(cx + (acik ? s * 0.18 : 0), cy - s * 0.2, s * 0.24, Math.PI, 0);
    ctx.lineWidth = g.lw * 0.9;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    rr(ctx, cx - s * 0.36, cy - s * 0.2, s * 0.72, s * 0.56, s * 0.12);
    ctx.fillStyle = P.butter;
    ctx.fill();
    ctx.lineWidth = g.lw * 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.04, s * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = P.ink;
    ctx.fill();
  }
  function tabelaCiz(t) {
    const { ctx, cs } = g;
    const X = t.x * cs, Y = t.y * cs;
    cizgi(X + cs / 2, Y + cs * 0.55, X + cs / 2, Y + cs * 0.95, g.lw);
    cikartma(X + cs * 0.06, Y + cs * 0.14, cs * 0.88, cs * 0.5, cs * 0.1, '#fff', cs * 0.05);
    const kod = S.gizem.kod[t.grup];
    kod.forEach((ri, i) => {
      const cx = X + cs * (0.24 + i * 0.26), cy = Y + cs * 0.39;
      if (gorur(t.kim)) sembol(ri, cx, cy, cs * 0.22, renk(ri));
      else {
        ctx.fillStyle = '#C9BED0';
        ctx.font = `700 ${Math.round(cs * 0.24)}px Fredoka, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy);
      }
    });
  }
  function esyaCiz(tur, id, cx, cy, s) {
    const ctx = g.ctx;
    if (tur === 'anahtar') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.6);
      ctx.beginPath();
      ctx.arc(-s * 0.18, 0, s * 0.14, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.05, -s * 0.05);
      ctx.lineTo(s * 0.3, -s * 0.05);
      ctx.lineTo(s * 0.3, s * 0.14);
      ctx.lineTo(s * 0.22, s * 0.14);
      ctx.lineTo(s * 0.22, s * 0.05);
      ctx.lineTo(s * 0.14, s * 0.05);
      ctx.lineTo(s * 0.14, s * 0.12);
      ctx.lineTo(s * 0.06, s * 0.12);
      ctx.lineTo(s * 0.06, s * 0.05);
      ctx.lineTo(-s * 0.05, s * 0.05);
      ctx.fillStyle = P.butter;
      ctx.fill();
      ctx.lineWidth = g.lw * 0.8;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.18, 0, s * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = P.ink;
      ctx.fill();
      ctx.restore();
    } else if (tur === 'kart') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.12);
      rr(ctx, -s * 0.3, -s * 0.21, s * 0.6, s * 0.42, s * 0.05);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = g.lw * 0.8;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      cizgi(-s * 0.2, -s * 0.02, s * 0.02, -s * 0.02, g.lw * 0.45, 'rgba(58,31,45,.5)');
      cizgi(-s * 0.2, s * 0.08, s * 0.0, s * 0.08, g.lw * 0.45, 'rgba(58,31,45,.5)');
      // Pul: rengini yalnız Pamuk görür
      const gor = gorur('pamuk');
      rr(ctx, s * 0.08, -s * 0.15, s * 0.16, s * 0.18, s * 0.03);
      ctx.fillStyle = gor ? renk(S.gizem.kart[id]) : '#E9E1EE';
      ctx.fill();
      ctx.lineWidth = g.lw * 0.5;
      ctx.stroke();
      if (gor) {
        ctx.fillStyle = P.ink;
        ctx.font = `700 ${Math.round(s * 0.13)}px Fredoka, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(RENK_SEMBOL[S.gizem.kart[id]], s * 0.16, -s * 0.055);
      } else {
        ctx.fillStyle = '#A897AE';
        ctx.font = `700 ${Math.round(s * 0.14)}px Fredoka, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', s * 0.16, -s * 0.055);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.3);
      rr(ctx, -s * 0.36, -s * 0.1, s * 0.72, s * 0.2, s * 0.05);
      ctx.fillStyle = '#EDB27A';
      ctx.fill();
      ctx.lineWidth = g.lw * 0.8;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      cizgi(-s * 0.22, -s * 0.02, s * 0.1, -s * 0.02, g.lw * 0.4, 'rgba(58,31,45,.5)');
      ctx.restore();
    }
  }
  function kutuCiz(X, Y, tema, plakada) {
    const { ctx, cs } = g;
    const i = cs * 0.1;
    cikartma(X + i, Y + i - cs * 0.04, cs - 2 * i, cs - 2 * i, cs * 0.12, tema === 'posta' ? '#F5C99B' : '#E9B07C', cs * 0.08);
    const x0 = X + i, y0 = Y + i - cs * 0.04, w = cs - 2 * i;
    if (tema === 'posta') {
      ctx.fillStyle = P.butter;
      ctx.fillRect(x0 + w * 0.42, y0 + g.lw * 0.5, w * 0.16, w - g.lw);
      kalpYolu(ctx, x0 + w * 0.25, y0 + w * 0.72, w * 0.22);
      ctx.fillStyle = P.red;
      ctx.fill();
    } else {
      cizgi(x0 + w * 0.18, y0 + w * 0.18, x0 + w * 0.82, y0 + w * 0.82, g.lw * 0.6, 'rgba(58,31,45,.6)');
      cizgi(x0 + w * 0.82, y0 + w * 0.18, x0 + w * 0.18, y0 + w * 0.82, g.lw * 0.6, 'rgba(58,31,45,.6)');
    }
    if (plakada) {
      kalpYolu(ctx, x0 + w * 0.82, y0 + w * 0.1, w * 0.3);
      ctx.fillStyle = P.pink;
      ctx.fill();
      ctx.lineWidth = g.lw * 0.6;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
    }
  }

  /* ---------- Kediler ---------- */
  function karakterleriCiz(now) {
    const { cs } = g;
    const list = IKI.map((c) => {
      const ch = S.ch[c];
      const p = konum(ch, now);
      return { c, ch, x: p.x, y: p.y, t: p.t };
    }).sort((a, b) => a.y - b.y);
    for (const k of list) {
      let ox = 0, oy = 0;
      if (k.ch.bump && now - k.ch.bump.t < 200) {
        const s = Math.sin(((now - k.ch.bump.t) / 200) * Math.PI) * cs * 0.12;
        ox = k.ch.bump.dx * s;
        oy = k.ch.bump.dy * s;
      }
      // Yürürken hafif zıplama, bitişte sevinç sıçraması
      if (!K.reduced && k.t < 1) oy -= Math.sin(k.t * Math.PI) * cs * 0.08;
      if (k.ch.zipla && now - k.ch.zipla < 900) oy -= Math.abs(Math.sin(((now - k.ch.zipla) / 300) * Math.PI)) * cs * 0.25;
      let cx = k.x * cs + cs / 2 + ox, cy = k.y * cs + cs / 2 + oy;
      if (S.sarilma) {
        const sp = sarilmaKonum(k.c, now);
        if (sp) (cx = sp.x), (cy = sp.y);
      }
      const ctx = g.ctx;
      ctx.globalAlpha = !S.solo && S.kopuk && k.c !== benim() ? 0.45 : 1;
      const yon = S.sarilma ? (k.c === 'kitty' ? 'r' : 'l') : k.ch.d;
      if (k.c === 'kitty') kittyCiz(cx, cy, cs, yon);
      else pamukCiz(cx, cy, cs, yon);
      if (k.c === 'kitty' && k.ch.tasi) esyaCiz(k.ch.tasi.replace(/\d+$/, ''), k.ch.tasi, cx + cs * 0.32, cy + cs * 0.14, cs * 0.6);
      ctx.globalAlpha = 1;
      if (k.c === aktif() && !S.bitti) isaret(cx, cy - cs * 0.68 + (K.reduced ? 0 : Math.sin(now / 260) * cs * 0.05), cs);
    }
  }
  function isaret(cx, cy, cs) {
    const ctx = g.ctx;
    ctx.beginPath();
    ctx.moveTo(cx - cs * 0.13, cy - cs * 0.1);
    ctx.lineTo(cx + cs * 0.13, cy - cs * 0.1);
    ctx.lineTo(cx, cy + cs * 0.06);
    ctx.closePath();
    ctx.fillStyle = P.butter;
    ctx.fill();
    ctx.lineWidth = g.lw * 0.7;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
  }
  function golge(cx, cy, rx) {
    const ctx = g.ctx;
    ctx.fillStyle = 'rgba(58,31,45,.2)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, rx * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function oval(cx, cy, rx, ry, dolgu, rot, cizgiK) {
    const ctx = g.ctx;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2);
    ctx.fillStyle = dolgu;
    ctx.fill();
    if (cizgiK !== 0) {
      ctx.lineWidth = g.lw * (cizgiK || 1);
      ctx.strokeStyle = P.ink;
      ctx.stroke();
    }
  }
  function fiyonk(cx, cy, r, dolgu) {
    oval(cx - r * 0.55, cy, r * 0.62, r * 0.46, dolgu, 0.35, 0.8);
    oval(cx + r * 0.55, cy, r * 0.62, r * 0.46, dolgu, -0.35, 0.8);
    oval(cx, cy, r * 0.28, r * 0.26, dolgu, 0, 0.8);
  }
  // Kitty: kocaman beyaz kafa, kırmızı fiyonk, pembe elbise (resmî çizimin kopyası değil, sade bir çıkartma)
  function kittyCiz(cx, cy, s, d) {
    const ctx = g.ctx;
    golge(cx, cy + s * 0.42, s * 0.3);
    const by = cy + s * 0.14;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.16, by - s * 0.08);
    ctx.lineTo(cx + s * 0.16, by - s * 0.08);
    ctx.lineTo(cx + s * 0.25, by + s * 0.22);
    ctx.quadraticCurveTo(cx, by + s * 0.3, cx - s * 0.25, by + s * 0.22);
    ctx.closePath();
    ctx.fillStyle = P.pink;
    ctx.fill();
    ctx.lineWidth = g.lw;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    oval(cx - s * 0.1, by + s * 0.28, s * 0.08, s * 0.05, '#fff', 0, 0.8);
    oval(cx + s * 0.1, by + s * 0.28, s * 0.08, s * 0.05, '#fff', 0, 0.8);
    oval(cx - s * 0.23, by + s * 0.05, s * 0.065, s * 0.08, '#fff', 0.5, 0.8);
    oval(cx + s * 0.23, by + s * 0.05, s * 0.065, s * 0.08, '#fff', -0.5, 0.8);
    const hy = cy - s * 0.17;
    [-1, 1].forEach((k) => {
      ctx.beginPath();
      ctx.moveTo(cx + k * s * 0.37, hy + s * 0.02);
      ctx.quadraticCurveTo(cx + k * s * 0.41, hy - s * 0.3, cx + k * s * 0.25, hy - s * 0.28);
      ctx.lineTo(cx + k * s * 0.07, hy - s * 0.2);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = g.lw;
      ctx.stroke();
    });
    oval(cx, hy, s * 0.41, s * 0.29, '#fff');
    if (d !== 'u') {
      const fx = d === 'l' ? -s * 0.07 : d === 'r' ? s * 0.07 : 0;
      ctx.fillStyle = P.ink;
      [-1, 1].forEach((k) => {
        ctx.beginPath();
        ctx.ellipse(cx + fx + k * s * 0.15, hy + s * 0.02, s * 0.036, s * 0.052, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      oval(cx + fx, hy + s * 0.1, s * 0.046, s * 0.032, P.butter, 0, 0.55);
      ctx.lineWidth = g.lw * 0.5;
      ctx.strokeStyle = P.ink;
      [-1, 1].forEach((k) => {
        if ((d === 'l' && k === 1) || (d === 'r' && k === -1)) return;
        [-1, 0, 1].forEach((i) => {
          ctx.beginPath();
          ctx.moveTo(cx + k * s * 0.31, hy + s * (0.07 + i * 0.05));
          ctx.lineTo(cx + k * s * 0.47, hy + s * (0.06 + i * 0.08));
          ctx.stroke();
        });
      });
    }
    fiyonk(cx + s * 0.25, hy - s * 0.23, s * 0.17, P.red);
  }
  // Pamuk: tombul beyaz kedi, pembe iç kulak, mavi tasma ve sarı çıngırak
  function pamukCiz(cx, cy, s, d) {
    const ctx = g.ctx;
    golge(cx, cy + s * 0.42, s * 0.36);
    const yan = d === 'r' ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + yan * s * 0.26, cy + s * 0.3);
    ctx.quadraticCurveTo(cx + yan * s * 0.52, cy + s * 0.28, cx + yan * s * 0.46, cy + s * 0.0);
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.13 + g.lw * 2;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    ctx.lineWidth = s * 0.13;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    oval(cx, cy + s * 0.16, s * 0.36, s * 0.25, '#fff');
    oval(cx - s * 0.14, cy + s * 0.38, s * 0.085, s * 0.05, '#fff', 0, 0.8);
    oval(cx + s * 0.14, cy + s * 0.38, s * 0.085, s * 0.05, '#fff', 0, 0.8);
    const hy = cy - s * 0.15;
    [-1, 1].forEach((k) => {
      ctx.beginPath();
      ctx.moveTo(cx + k * s * 0.28, hy + s * 0.0);
      ctx.lineTo(cx + k * s * 0.27, hy - s * 0.31);
      ctx.lineTo(cx + k * s * 0.05, hy - s * 0.22);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = g.lw;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + k * s * 0.24, hy - s * 0.06);
      ctx.lineTo(cx + k * s * 0.24, hy - s * 0.23);
      ctx.lineTo(cx + k * s * 0.11, hy - s * 0.17);
      ctx.closePath();
      ctx.fillStyle = P.pink;
      ctx.fill();
    });
    oval(cx, hy, s * 0.31, s * 0.27, '#fff');
    ctx.beginPath();
    ctx.ellipse(cx, hy + s * 0.25, s * 0.19, s * 0.05, 0, 0, Math.PI);
    ctx.lineWidth = s * 0.08;
    ctx.strokeStyle = P.sky;
    ctx.stroke();
    oval(cx, hy + s * 0.32, s * 0.055, s * 0.055, P.butter, 0, 0.6);
    if (d !== 'u') {
      const fx = d === 'l' ? -s * 0.07 : d === 'r' ? s * 0.07 : 0;
      oval(cx + fx - s * 0.17, hy + s * 0.09, s * 0.055, s * 0.032, 'rgba(255,143,184,.7)', 0, 0);
      oval(cx + fx + s * 0.17, hy + s * 0.09, s * 0.055, s * 0.032, 'rgba(255,143,184,.7)', 0, 0);
      [-1, 1].forEach((k) => {
        oval(cx + fx + k * s * 0.11, hy - s * 0.01, s * 0.045, s * 0.05, P.ink, 0, 0);
        oval(cx + fx + k * s * 0.11 - s * 0.015, hy - s * 0.03, s * 0.016, s * 0.016, '#fff', 0, 0);
      });
      ctx.beginPath();
      ctx.moveTo(cx + fx - s * 0.035, hy + s * 0.06);
      ctx.lineTo(cx + fx + s * 0.035, hy + s * 0.06);
      ctx.lineTo(cx + fx, hy + s * 0.1);
      ctx.closePath();
      ctx.fillStyle = P.pink;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + fx - s * 0.035, hy + s * 0.11, s * 0.035, 0.1, Math.PI - 0.1);
      ctx.arc(cx + fx + s * 0.035, hy + s * 0.11, s * 0.035, 0.1, Math.PI - 0.1);
      ctx.lineWidth = g.lw * 0.45;
      ctx.strokeStyle = P.ink;
      ctx.stroke();
    }
  }
  // Son bölümün sonu: iki kedi ortada buluşur, arkalarında kocaman bir kalp
  function sarilmaKonum(c, now) {
    const { cs } = g;
    const k = S.ch.kitty, p = S.ch.pamuk;
    const mx = ((k.x + p.x) / 2) * cs + cs / 2, my = ((k.y + p.y) / 2) * cs + cs / 2;
    const t = K.clamp((now - S.sarilma) / 600, 0, 1);
    const ch = S.ch[c];
    const sx = ch.x * cs + cs / 2, sy = ch.y * cs + cs / 2;
    const hx = mx + (c === 'kitty' ? -1 : 1) * cs * 0.26;
    return { x: sx + (hx - sx) * t, y: sy + (my - sy) * t };
  }
  const sarilmaMerkez = () => {
    const { cs } = g;
    const k = S.ch.kitty, p = S.ch.pamuk;
    return { mx: ((k.x + p.x) / 2) * cs + cs / 2, my: ((k.y + p.y) / 2) * cs + cs / 2, t: (performance.now() - S.sarilma) / 1000 };
  };
  function sarilmaKalp() {
    const { ctx, cs } = g;
    const { mx, my, t } = sarilmaMerkez();
    if (t < 0.5) return;
    const b = Math.min(1, (t - 0.5) / 0.6) * (1 + (K.reduced ? 0 : 0.06 * Math.sin(t * 6)));
    kalpYolu(ctx, mx, my - cs * 0.1, cs * 2.4 * b);
    ctx.fillStyle = 'rgba(255,143,184,.9)';
    ctx.fill();
    ctx.lineWidth = g.lw;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
  }
  function sarilmaYazi() {
    const { ctx, cs } = g;
    const { mx, my, t } = sarilmaMerkez();
    if (t > 1.1) {
      ctx.font = `700 ${Math.round(cs * 0.5)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const yazi = 'Sonunda!';
      const w = ctx.measureText(yazi).width + cs * 0.6;
      const ty = Math.max(cs * 0.5, my - cs * 1.55);
      cikartma(mx - w / 2, ty - cs * 0.36, w, cs * 0.72, cs * 0.36, '#fff', cs * 0.06);
      ctx.fillStyle = P.red;
      ctx.fillText(yazi, mx, ty + cs * 0.02);
    }
    if (!K.reduced && Math.random() < 0.12) parcacik(mx / cs + (Math.random() - 0.5) * 1.6, my / cs - 0.6, 1, 'kalp');
  }
  /* ---------- Parçacıklar ---------- */
  function parcacik(x, y, n, tur) {
    if (!S) return;
    const adet = K.reduced ? Math.min(2, n) : n;
    for (let i = 0; i < adet; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.8 + Math.random() * 1.6;
      S.efekt.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, t0: performance.now(), omur: 700 + Math.random() * 400, tur, r: Math.random() });
    }
    if (S.efekt.length > 160) S.efekt.splice(0, S.efekt.length - 160);
  }
  function efektCiz(now) {
    const { ctx, cs } = g;
    S.efekt = S.efekt.filter((e) => now - e.t0 < e.omur);
    for (const e of S.efekt) {
      const t = (now - e.t0) / 1000;
      const x = (e.x + e.vx * t) * cs, y = (e.y + e.vy * t + 1.4 * t * t) * cs;
      ctx.globalAlpha = 1 - (now - e.t0) / e.omur;
      if (e.tur === 'kalp') {
        kalpYolu(ctx, x, y, cs * (0.18 + e.r * 0.12));
        ctx.fillStyle = e.r < 0.5 ? P.pink : P.red;
        ctx.fill();
      } else if (e.tur === 'damla') {
        ctx.beginPath();
        ctx.arc(x, y, cs * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      } else {
        yildizYolu(ctx, x, y, cs * 0.12, cs * 0.05);
        ctx.fillStyle = P.butter;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ================= Portreler (HTML) ================= */
  function pamukSvg(cls) {
    const ink = '#3A1F2D';
    return `<svg class="mc-pamuk ${cls || ''}" viewBox="0 0 120 120" role="img" aria-label="Pamuk">
      <path d="M86 98 C112 98 114 70 101 62" fill="none" stroke="${ink}" stroke-width="17" stroke-linecap="round"/>
      <path d="M86 98 C112 98 114 70 101 62" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
      <g stroke="${ink}" stroke-width="4.5" stroke-linejoin="round" fill="#fff">
        <ellipse cx="60" cy="88" rx="40" ry="27"/>
        <ellipse cx="44" cy="112" rx="10" ry="6"/><ellipse cx="76" cy="112" rx="10" ry="6"/>
        <path d="M28 46 L27 10 L52 24 Z"/><path d="M92 46 L93 10 L68 24 Z"/>
        <ellipse cx="60" cy="48" rx="36" ry="31"/>
      </g>
      <path d="M32 38 L32 18 L46 26 Z M88 38 L88 18 L74 26 Z" fill="#FF8FB8"/>
      <path d="M38 76 Q60 86 82 76" fill="none" stroke="#9FD8FF" stroke-width="7" stroke-linecap="round"/>
      <circle cx="60" cy="84" r="5.5" fill="#FFE27A" stroke="${ink}" stroke-width="2.5"/>
      <ellipse cx="38" cy="58" rx="7" ry="4" fill="#FF8FB8" opacity=".7"/><ellipse cx="82" cy="58" rx="7" ry="4" fill="#FF8FB8" opacity=".7"/>
      <ellipse cx="47" cy="47" rx="5" ry="6" fill="${ink}"/><ellipse cx="73" cy="47" rx="5" ry="6" fill="${ink}"/>
      <circle cx="45.5" cy="44.5" r="1.8" fill="#fff"/><circle cx="71.5" cy="44.5" r="1.8" fill="#fff"/>
      <path d="M56 55 H64 L60 59 Z" fill="#FF8FB8"/>
      <path d="M55 61 Q57.5 64.5 60 61 Q62.5 64.5 65 61" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }
  const kittySvg = (cls) => A.kitty({ cls: 'mc-kitty ' + (cls || ''), label: 'Kitty' });
  const portreSvg = (c, cls) => (c === 'kitty' ? kittySvg(cls) : pamukSvg(cls));
  const kilitSvg = '<svg class="mc-kilit-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11 V8 A4 4 0 0 1 16 8 V11" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="5" y="11" width="14" height="10" rx="3" fill="currentColor"/></svg>';
  const kalpSvg = '<svg class="mc-kalp" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 C4 14 2 10 4 6.5 C6 3.5 10 4 12 7 C14 4 18 3.5 20 6.5 C22 10 20 14 12 20 Z"/></svg>';
  function portre(c, alt) {
    const ben = c === benim();
    return `<figure class="mc-portre ${ben ? 'ben' : ''}">${portreSvg(c)}<figcaption><b>${AD[c]}</b><small>${alt || (ben ? 'sen' : K.esc(oyuncuAdi(c)))}</small></figcaption></figure>`;
  }

  /* ================= Arayüz ================= */
  let kurulu = ''; // ekranda kurulu olan görünüm
  let notT = 0;
  const ekranEl = () => root && K.$('#mcEkran', root);
  function render() {
    if (!root || K.activeRoom !== 'macera') return;
    const tur = !S ? 'menu' : S.ekran;
    root.classList.toggle('mc-oyunda', tur === 'oyun');
    if (tur === 'oyun') {
      if (kurulu !== 'oyun') oyunKur();
      hud();
      cizimBaslat();
      return;
    }
    cizimDurdur();
    kurulu = tur;
    const el = ekranEl();
    el.innerHTML = el.dataset.iz = tur === 'lobi' ? lobiHtml() : menuHtml();
  }
  // Odadayken öbürünün durumu değişince: menü ve lobi yeniden yazılır, oyunda yalnız üst bilgi
  function arayuz() {
    if (!root || K.activeRoom !== 'macera') return;
    if (S && S.ekran === 'oyun') return hud();
    const html = !S ? menuHtml() : lobiHtml();
    const el = ekranEl();
    if (el && el.dataset.iz !== html) {
      el.innerHTML = html;
      el.dataset.iz = html;
    }
  }
  function ortakSatiri() {
    const o = obur(benim()), ad = K.esc(oyuncuAdi(o));
    if (ortakTaze()) {
      if (ortak.ekran === 'oyun' && ortak.solo) return `<p class="mc-durum on">● ${ad} ${ortak.bolum}. bölümü tek başına oynuyor</p>`;
      if (ortak.ekran === 'lobi' || ortak.ekran === 'oyun') return `<p class="mc-durum on">● ${ad} ${ortak.bolum}. bölümde seni bekliyor</p>`;
      return `<p class="mc-durum on">● ${ad} burada, Kale Macerası’nda</p>`;
    }
    if (K.cloud && K.cloud.otherHere && K.cloud.otherHere()) return `<p class="mc-durum yari">● ${ad} kalede, başka bir odada</p>`;
    return `<p class="mc-durum">○ ${ad} şu an kalede değil</p>`;
  }
  function davetHtml() {
    if (!davetVar()) return '';
    const b = BOLUMLER[ortak.bolum - 1];
    if (!b) return '';
    return `<div class="mc-davet" role="status"><span>${portreSvg(obur(benim()), 'mini')}<b>${K.esc(oyuncuAdi(obur(benim())))}</b> seni <b>${b.no}. bölüme</b> çağırıyor: ${b.ad}</span><button type="button" class="btn red small" data-mc-katil>Katıl</button></div>`;
  }
  function menuHtml() {
    const ben = benim();
    const ac = acikBolum();
    const iyi = enIyiler();
    const biten = Object.keys(iyi).length;
    return `<section class="card mc-kim">
        <div class="mc-ikili">${portre('kitty')}${kalpSvg}${portre('pamuk')}</div>
        <p class="mc-rol">Sen <b>${AD[ben]}</b>’${ben === 'kitty' ? 'sin' : 'sun'}. ${ROL[ben]}</p>
        ${ortakSatiri()}
      </section>
      ${davetHtml()}
      <div class="mc-bolumbas"><p class="card-eyebrow">Bölümler</p><span class="mc-sayac">${biten}/${BOLUMLER.length}</span></div>
      <ol class="mc-bolumler">${BOLUMLER.map((b) => {
        const kilitli = b.no > ac;
        const en = iyi[b.no];
        return `<li><button type="button" class="mc-bolum mc-t-${b.tema} ${kilitli ? 'kilitli' : ''} ${en ? 'bitti' : ''}" data-mc-bolum="${b.no}" ${kilitli ? 'disabled aria-disabled="true"' : ''}>
          <span class="mc-no">${kilitli ? kilitSvg : b.no}</span>
          <span class="mc-bt"><b>${b.ad}</b><small>${kilitli ? 'Önceki bölümü bitirince açılır' : b.alt}</small></span>
          <span class="mc-sure">${en ? `<b class="tnum">${saat(en.sure)}</b><small>${en.solo ? 'tek başına' : 'birlikte'}</small>` : kilitli ? '' : '<em>Oyna</em>'}</span>
        </button></li>`;
      }).join('')}</ol>
      <p class="muted small center mc-not-alt">Ok tuşları, ekrandaki yön tuşları ya da haritada bir kareye dokunmak kediyi yürütür.</p>`;
  }
  function lobiDurum() {
    const ad = K.esc(oyuncuAdi(obur(benim())));
    if (ortakTaze() && ortak.ekran === 'oyun' && ortak.solo) return `${ad} şu an başka bir bölümü tek başına oynuyor. Davetin ekranında görünecek.`;
    if (ortakTaze()) return `${ad} Kale Macerası’nda; davetin ekranına düştü. Katılınca başlıyoruz.`;
    if (K.cloud && K.cloud.otherHere && K.cloud.otherHere()) return `${ad} kalede ama başka bir odada; davetin ona bildirim olarak gitti.`;
    return `${ad} şu an kalede değil. Çağırabilir ya da tek başına deneyebilirsin.`;
  }
  function lobiHtml() {
    const lv = S.lv;
    const o = obur(benim());
    return `<section class="card mc-lobi mc-t-${lv.tema}">
        <p class="card-eyebrow">${lv.no}. bölüm · ${lv.ad}</p>
        <div class="mc-ikili">${portre(benim())}${kalpSvg}<div class="mc-bekle">${portre(o, 'bekleniyor')}</div></div>
        <h3>${K.esc(oyuncuAdi(o))} bekleniyor<span class="mc-nokta" aria-hidden="true"><i></i><i></i><i></i></span></h3>
        <p class="muted">${lobiDurum()}</p>
        ${ortak.bolum !== lv.no ? davetHtml() : ''}
        <div class="row center mc-lobi-tus"><button type="button" class="btn red" data-mc-cagir>Çağır</button><button type="button" class="btn soft" data-mc-solo>Tek başına dene</button></div>
        <button type="button" class="btn ghost small" data-mc-geri>Bölümlere dön</button>
      </section>`;
  }
  function oyunKur() {
    kurulu = 'oyun';
    const el = ekranEl();
    el.dataset.iz = '';
    el.innerHTML = `<div class="mc-oyun">
        <div class="mc-ust"><div class="mc-baslik"><small id="mcNo"></small><b id="mcAd"></b></div><b class="mc-saat tnum" id="mcSaat">00:00</b><button type="button" class="btn ghost small" data-mc-cik>Çık</button></div>
        <div class="mc-kisiler" id="mcKisiler"></div>
        <div class="mc-bant" id="mcBant" hidden></div>
        <div class="mc-sahne" id="mcSahne"><canvas class="mc-tuval" id="mcTuval" role="img" aria-label="Oyun haritası"></canvas><div class="mc-not" id="mcNot" aria-live="polite"></div></div>
        <p class="mc-ipucu" id="mcIpucu" aria-live="polite"></p>
        <div class="mc-kontrol">
          <div class="mc-pad" role="group" aria-label="Yön tuşları">${['u', 'l', 'r', 'd'].map((d) => `<button type="button" class="mc-tus mc-${d}" data-mc-yon="${d}" aria-label="${YON_AD[d]}">${A.ui('back')}</button>`).join('')}</div>
          <div class="mc-yan"><button type="button" class="btn soft small" data-mc-degistir id="mcDegistir" hidden></button><button type="button" class="btn ghost small" data-mc-bastan>↺ Baştan</button></div>
        </div>
      </div>`;
    g.cv = K.$('#mcTuval', el);
    g.ctx = g.cv.getContext('2d');
    g.statAnahtar = '';
    g.cs = 0;
    boyutla();
    g.cv.addEventListener('pointerdown', (e) => {
      const r = g.cv.getBoundingClientRect();
      dokun(Math.floor(((e.clientX - r.left) / r.width) * GEN), Math.floor(((e.clientY - r.top) / r.height) * YUK));
    });
  }
  let hudIz = '';
  function hud() {
    if (!root || !S || S.ekran !== 'oyun' || kurulu !== 'oyun') return;
    const lv = S.lv;
    const ben = benim();
    const c = aktif();
    const $ = (id) => K.$('#' + id, root);
    if (!$('mcNo')) return;
    $('mcNo').textContent = `${lv.no}. bölüm${S.solo ? ' · tek başına' : ''}`;
    $('mcAd').textContent = lv.ad;
    g.cv.setAttribute('aria-label', `${lv.ad} haritası`);
    saatYaz();
    const kisi = (k) => {
      const ch = S.ch[k];
      const durum = S.solo ? (S.aktif === k ? 'oynuyorsun' : 'dokun, geç') : k === ben ? 'sen' : S.kopuk ? 'bağlantı yok' : K.esc(oyuncuAdi(k));
      const tasi = k === 'kitty' && ch.tasi ? ` · ${esyaAdi(ch.tasi).toLocaleLowerCase('tr')}` : '';
      return `<button type="button" class="mc-kisi mc-k-${k} ${c === k ? 'on' : ''} ${!S.solo && k !== ben && S.kopuk ? 'kopuk' : ''}" data-mc-sec="${k}" ${S.solo ? '' : 'tabindex="-1"'} aria-pressed="${c === k}">${portreSvg(k, 'mini')}<span><b>${AD[k]}</b><small>${durum}${tasi}</small></span></button>`;
    };
    const ipucu = S.bitti ? (lv.no === BOLUMLER.length ? 'Kavuştunuz! 💞' : 'Bölüm tamam! 🎉') : lv.ipucu(S, c);
    const tabela = !S.bitti && lv.tabelalar.length && !kopruTamam(S) ? lv.tabelalar.filter((t) => gorur(t.kim) && (S.solo ? t.kim === c : true)).map((t) => `<span class="mc-tabela">${AD[t.kim]}’${t.kim === 'kitty' ? 'nin' : 'un'} tabelası (${AD[t.grup]}’${t.grup === 'kitty' ? 'nin' : 'un'} sırası): ${S.gizem.kod[t.grup].map((i) => `<span class="mc-renk" style="--c:${renk(i)}">${RENK_SEMBOL[i]}</span>`).join(' → ')}</span>`).join('') : '';
    let bant = '';
    if (!S.solo && S.kopuk && !S.bitti) bant = `<span>${K.esc(nameOf(other()))} ile bağlantı koptu; dönmesini bekliyoruz.</span><button type="button" class="btn soft small" data-mc-tekdevam>Tek başına devam et</button>`;
    else if (S.solo && davetVar() && !S.bitti) bant = `<span><b>${K.esc(oyuncuAdi(obur(ben)))}</b> geldi ve ${ortak.bolum}. bölümde seni bekliyor.</span><button type="button" class="btn red small" data-mc-katil>Katıl</button>`;
    const iz = [IKI.map(kisi).join(''), ipucu, tabela, bant, S.solo, c].join('§');
    if (iz === hudIz && $('mcKisiler').innerHTML) return;
    hudIz = iz;
    $('mcKisiler').innerHTML = IKI.map(kisi).join('');
    $('mcIpucu').innerHTML = `${ipucu}${tabela}`;
    const b = $('mcBant');
    b.hidden = !bant;
    b.innerHTML = bant;
    const dg = $('mcDegistir');
    dg.hidden = !S.solo || S.bitti;
    dg.innerHTML = `${portreSvg(obur(c), 'mini')} ${AD[obur(c)]}’${obur(c) === 'kitty' ? 'ye' : 'a'} geç`;
  }
  let sonSaat = '';
  function saatYaz() {
    const el = root && K.$('#mcSaat', root);
    if (!el || !S) return;
    const s = saat(S.bitti ? S.sure : Math.max(0, Math.floor((Date.now() - S.t0) / 1000)));
    if (s !== sonSaat || el.textContent !== s) el.textContent = sonSaat = s;
  }
  function notGoster(html, ms) {
    const el = root && K.$('#mcNot', root);
    if (!el) return;
    el.innerHTML = html;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
    clearTimeout(notT);
    notT = setTimeout(() => el.classList.remove('on'), ms || 2200);
  }
  function aniKarti(o) {
    const lv = o.lv;
    const sonuncu = lv.no === BOLUMLER.length;
    let ileri = false;
    const sahne = sonuncu
      ? `<div class="mc-ani-sahne sarilma">${kittySvg()}${pamukSvg()}${kalpSvg}</div>`
      : `<div class="mc-ani-sahne">${kittySvg()}${kalpSvg}${pamukSvg()}</div>`;
    const m = K.ui.modal({
      label: `${lv.no}. bölüm anı kartı`,
      cls: 'mc-ani-modal',
      html: `<div class="mc-ani mc-t-${lv.tema}">${sahne}
        <p class="card-eyebrow">Anı kartı · ${lv.no}. bölüm</p>
        <h3>${lv.ad}</h3>
        <p class="mc-ani-soz">${lv.ani}</p>
        <p class="mc-ani-sure"><b class="tnum">${saat(o.sure)}</b> · ${o.solo ? 'tek başına' : 'birlikte'}${o.yanlis ? ` · ${o.yanlis} yanlış deneme` : ''}</p>
        ${sonuncu ? `<p class="mc-ani-son">${o.solo ? 'Beş anının hepsinden geçtin. Bir de el ele, birlikte oynayalım mı?' : 'Beş anının hepsinden birlikte geçtiniz. Macera burada bitiyor; hikâye bitmiyor.'}</p>` : ''}
        <div class="row center">${sonuncu ? '' : `<button type="button" class="btn red" data-mc-ileri>${lv.no + 1}. bölüme geç</button>`}<button type="button" class="btn soft" data-close>Bölümler</button></div>
      </div>`,
      onClose() {
        if (S !== o) return;
        const no = lv.no, solo = o.solo;
        S = null;
        zamanlayicilar();
        if (ileri) solo ? soloBasla(no + 1) : lobiAc(no + 1);
        else {
          render();
          gonder({ tip: 'nabiz' });
        }
      },
    });
    m.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-mc-ileri]')) {
        ileri = true;
        m.close();
      }
    });
    if (sonuncu) K.fx.fireworks && K.fx.fireworks(2600);
  }

  /* ================= Zamanlayıcılar ================= */
  const T = { nabiz: 0, durum: 0, tik: 0 };
  function zamanlayicilar() {
    const odada = root && K.activeRoom === 'macera';
    const oyunda = odada && S && S.ekran === 'oyun';
    if (odada && !T.nabiz)
      T.nabiz = setInterval(() => {
        anlikGonder('nabiz');
        if (S && S.ekran === 'oyun' && !S.solo && !S.bitti && !S.kopuk && Date.now() - ortak.at > 7000) {
          S.kopuk = true;
          hud();
        }
        arayuz();
      }, 1200);
    if (!odada) (clearInterval(T.nabiz), (T.nabiz = 0));
    const sahipDurum = oyunda && !S.solo && mine() === 'me';
    if (sahipDurum && !T.durum) T.durum = setInterval(() => S && !S.solo && S.ekran === 'oyun' && anlikGonder('durum'), 3000);
    if (!sahipDurum) (clearInterval(T.durum), (T.durum = 0));
    if (oyunda && !T.tik) T.tik = setInterval(tik, 40);
    if (!oyunda) (clearInterval(T.tik), (T.tik = 0));
  }

  /* ================= Bulut ================= */
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('macerabolum', 300);
    K.cloud.on('macerabolum', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (!S) arayuz();
    });
    K.cloud.onLive('macera', al);
  });
  K.on('presence', () => arayuz());

  /* ================= Klavye ================= */
  document.addEventListener('keydown', (e) => {
    if (K.activeRoom !== 'macera' || !S || S.ekran !== 'oyun' || document.querySelector('.modal')) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const d = TUS[e.key];
    if (d) {
      e.preventDefault();
      if (!e.repeat || basili !== d) yonBas(d);
      return;
    }
    if (S.solo && (e.key === 'Tab' || e.key === ' ')) {
      e.preventDefault();
      sec(obur(S.aktif));
    }
  });
  document.addEventListener('keyup', (e) => {
    if (TUS[e.key] && TUS[e.key] === basili) basili = null;
  });

  K.room({
    id: 'macera',
    wing: 'oyun',
    title: 'Kale Macerası',
    sub: 'İki kedi, beş anı, bir kavuşma',
    icon: 'map',
    color: '#E5F6EE',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (davetVar() ? 'Seni bekliyor' : ''),
    init(el) {
      root = el;
      renkleriOku();
      el.innerHTML = `<div class="room-intro"><p>İki kişilik bir macera: biri Kitty, biri Pamuk. Beş bölümün her biri bir anımızın içinden geçiyor. Kapıları birlikte açarsınız: biri plakada beklerken öbürü geçer, biri ipucunu görür, öbürü uygular. En güzeli telefonda konuşarak oynamak.</p></div><div id="mcEkran" class="mc-ekran"></div>`;
      el.addEventListener('click', (e) => {
        const t = (s) => e.target.closest(s);
        const b = t('[data-mc-bolum]');
        if (b && !b.disabled) return lobiAc(+b.dataset.mcBolum);
        if (t('[data-mc-katil]')) return davetiKabul();
        if (t('[data-mc-solo]') && S) return soloBasla(S.lv.no);
        if (t('[data-mc-geri]')) return cik();
        if (t('[data-mc-cik]')) return cik();
        if (t('[data-mc-bastan]') && S) return yenidenIste();
        if (t('[data-mc-degistir]') && S) return sec(obur(S.aktif));
        if (t('[data-mc-tekdevam]')) return tekBasinaDevam();
        const s = t('[data-mc-sec]');
        if (s && S && S.solo) return sec(s.dataset.mcSec);
        if (t('[data-mc-cagir]') && S) {
          K.ping(`🗺 ${K.meName()} seni Kale Macerası’na çağırıyor`, `${S.lv.no}. bölüm: ${S.lv.ad}. Kaleye gel, birlikte oynayalım.`, ['world_map'], { click: K.roomUrl('macera') });
          K.fx.toast('Çağrıldı. Gelince oyun kendiliğinden başlar.');
        }
      });
      // Yön tuşları: basılı tutunca yürümeye devam eder
      const birak = () => (basili = null);
      el.addEventListener('pointerdown', (e) => {
        const y = e.target.closest('[data-mc-yon]');
        if (!y) return;
        e.preventDefault();
        y.setPointerCapture && y.setPointerCapture(e.pointerId);
        yonBas(y.dataset.mcYon);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, (e) => e.target.closest && e.target.closest('[data-mc-yon]') && birak()));
      el.addEventListener('contextmenu', (e) => e.target.closest('.mc-kontrol, .mc-sahne') && e.preventDefault());
      window.addEventListener('resize', () => S && S.ekran === 'oyun' && boyutla());
    },
    enter() {
      if (S && S.durak) {
        S.t0 += Date.now() - S.durak;
        S.durak = 0;
      }
      kurulu = '';
      render();
      zamanlayicilar();
      anlikGonder('nabiz');
    },
    leave() {
      // Birlikte oynanan bölümden çıkmak oyunu bitirir; tek başına oyun bekler
      if (S && !S.solo) {
        gonder({ tip: 'cik' });
        S = null;
      } else if (S && S.solo && S.ekran === 'oyun' && !S.bitti) S.durak = Date.now();
      else if (S && S.bitti) S = null;
      basili = null;
      cizimDurdur();
      kurulu = '';
      setTimeout(zamanlayicilar, 0);
    },
  });

  /* ================= Deneme için küçük API ================= */
  K.macera = {
    bolum: () => (S ? S.lv.no : null),
    durum: () =>
      S
        ? {
            ekran: S.ekran,
            bolum: S.lv.no,
            oturum: S.oturum,
            solo: S.solo,
            aktif: aktif(),
            bitti: S.bitti,
            sure: S.sure,
            kitty: karDurum('kitty'),
            pamuk: karDurum('pamuk'),
            kutular: kutuDurum(),
            f: [...S.f].sort(),
            kapilar: acikKapilar(S),
            gizem: S.gizem,
            kopuk: S.kopuk,
            gecen: S.t0 ? Date.now() - S.t0 : 0,
          }
        : { ekran: 'menu', acik: acikBolum(), enIyi: enIyiler() },
    acik: acikBolum,
    // Bölümü başlat: { solo: true } ile tek başına, yoksa lobi (öbürü gelince başlar)
    basla: (no, opt) => (opt && opt.solo ? soloBasla(no) : lobiAc(no)),
    katil: davetiKabul,
    // Bir adım: yon 'u' | 'd' | 'l' | 'r'; c verilmezse oynanan kedi
    git: (yon, c) => (S ? adim(c || aktif(), YON[yon][0], YON[yon][1]) : false),
    // Bir kareye yürü (yol bulma); adım sayısını döndürür
    yuru: (x, y, c) => {
      if (!S) return -1;
      const k = c || aktif();
      const yol = yolBul(k, x, y);
      if (!yol) return -1;
      S.ch[k].kuyruk = yol;
      S.ch[k].yol = true;
      return yol.length;
    },
    sec,
    cik,
    yeniden: () => S && yenidenBasla(yeniOturum(), false),
    bolumler: BOLUMLER.map((b) => ({ no: b.no, ad: b.ad, alt: b.alt })),
  };
})();
