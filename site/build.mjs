// Builds the static Tekir Studios website into site/public/.
//   cd site && npm install && npm run build
// Legal pages are generated from games/<game>/legal/*.md so the texts live in one place.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'public');
const SITE = 'https://tekirstudios.com';
const EMAIL_TR = 'destek@tekirstudios.com';
const EMAIL_EN = 'support@tekirstudios.com';
const PRESS = 'basin@tekirstudios.com';

/** Bilingual inline text. */
const t = (tr, en) => `<span lang="tr">${tr}</span><span lang="en">${en}</span>`;

function head({ title, description, path, fixedLang, image = '/assets/img/lokum-blast-feature.jpg' }) {
  const depth = path.split('/').filter(Boolean).length;
  const rel = depth ? '../'.repeat(depth) : './';
  return { rel, html: `<!doctype html>
<html lang="${fixedLang ?? 'tr'}" data-lang="${fixedLang ?? 'tr'}"${fixedLang ? ' data-fixed-lang' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#140d30">
<link rel="icon" type="image/png" href="${rel}assets/img/favicon-64.png">
<link rel="apple-touch-icon" href="${rel}assets/img/lokum-blast-icon-180.png">
<link rel="canonical" href="${SITE}/${path}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${SITE}${image}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${rel}assets/fonts/baloo-2-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${rel}assets/css/site.css">
<script src="${rel}assets/js/site.js" defer></script>
</head>
<body>` };
}

function header(rel, current, fixedLang) {
  const link = (href, label, key) => `<a href="${rel}${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header class="site-header"><div class="wrap">
<a class="brand" href="${rel}"><img src="${rel}assets/img/tekir-avatar.svg" alt="" width="38" height="38">Tekir <b>Studios</b></a>
<button class="menu-btn" data-menu aria-expanded="false" aria-label="Menu">☰</button>
<nav class="nav" aria-label="Main">
${link('#oyunlar', t('Oyunlar', 'Games'), 'games')}
${link('lokum-blast/', 'Lokum Blast', 'lokum')}
${link('simit-tycoon/', 'Simit Tycoon', 'simit')}
${link('kitap-kedisi/', t('Kitap Kedisi', 'Bookcat'), 'kitap')}
${link('lale/', 'Lale', 'lale')}
${link('basin/', t('Basın', 'Press'), 'press')}
${link('destek/', t('Destek', 'Support'), 'support')}
</nav>
${fixedLang ? '' : `<div class="lang-toggle" role="group" aria-label="Language"><button data-set-lang="tr" aria-pressed="true">TR</button><button data-set-lang="en" aria-pressed="false">EN</button></div>`}
</div></header>`;
}

function footer(rel) {
  return `<footer class="site-footer"><div class="wrap">
<div>© 2026 Tekir Studios · İstanbul</div>
<nav aria-label="Footer">
<a href="${rel}yasal/">${t('Gizlilik ve koşullar', 'Privacy & terms')}</a>
<a href="${rel}destek/">${t('Destek', 'Support')}</a>
<a href="${rel}basin/">${t('Basın kiti', 'Press kit')}</a>
</nav>
</div></footer>
</body></html>`;
}

function page({ path, title, description, current, body, fixedLang, image }) {
  const h = head({ title, description, path, fixedLang, image });
  const html = h.html + header(h.rel, current, fixedLang) + `<main>${body(h.rel)}</main>` + footer(h.rel);
  const file = join(out, path, path.endsWith('.html') ? '' : 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const phoneIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="1.3" fill="currentColor"/></svg>`;
const playIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5v17a1 1 0 001.5.9l14-8.5a1 1 0 000-1.8l-14-8.5A1 1 0 005 3.5z" fill="currentColor"/></svg>`;
const badges = `<div class="store-badges">
<a class="store-badge" aria-disabled="true">${phoneIcon}<span><small>${t('Çok yakında', 'Coming soon on the')}</small><b>App Store</b></span></a>
<a class="store-badge" aria-disabled="true">${playIcon}<span><small>${t('Çok yakında', 'Coming soon on')}</small><b>Google Play</b></span></a>
</div>`;

// ───────────── home ─────────────
page({
  path: '',
  title: 'Tekir Studios',
  description: 'Tekir Studios — İstanbul’dan dünyaya oyunlar ve uygulamalar. Curious games & apps from the cats of Istanbul.',
  current: 'home',
  body: (rel) => `
<section class="hero">
<div class="lights" aria-hidden="true"></div>
<div class="wrap">
<div>
<p class="eyebrow">${t('İstanbul · Oyunlar & Uygulamalar', 'Istanbul · Games & Apps')}</p>
<h1>Tekir <b>Studios</b></h1>
<p class="lead">${t('Merak et, oyna, keyfine bak. İstanbul’un sokak kedilerinden ilham alan, herkesin telefonunda yer açacağı tatlı oyunlar ve akıllı uygulamalar yapıyoruz.', 'Curious games and clever apps inspired by the street cats of Istanbul — the kind of thing you keep on your home screen.')}</p>
<div class="hero-cta">
<a class="btn" href="#oyunlar">${t('Oyunlarımızı keşfet', 'Discover our games')}</a>
<a class="btn ghost" href="#labs">Tekir Labs</a>
</div>
</div>
<div class="hero-art"><img src="${rel}assets/img/tekir-happy.svg" alt="${'Tekir'}" width="420" height="420"></div>
</div>
</section>

<section class="band" id="oyunlar">
<div class="wrap">
<div class="band-head">
<p class="eyebrow">Tekir Games</p>
<h2>${t('Oyunlarımız', 'Our games')}</h2>
</div>
<div class="feature">
<div class="phones-wrap">
<div class="phones" lang="tr">
<img src="${rel}assets/img/shots/tr/02-journey.jpg" alt="" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/shots/tr/01-combo.jpg" alt="Lokum Blast" width="540" height="1080">
<img src="${rel}assets/img/shots/tr/03-bazaar.jpg" alt="" loading="lazy" width="540" height="1080">
</div>
<div class="phones" lang="en">
<img src="${rel}assets/img/shots/en/02-journey.jpg" alt="" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/shots/en/01-combo.jpg" alt="Lokum Blast" width="540" height="1080">
<img src="${rel}assets/img/shots/en/03-bazaar.jpg" alt="" loading="lazy" width="540" height="1080">
</div>
</div>
<div class="feature-copy">
<img class="icon" src="${rel}assets/img/lokum-blast-icon-512.png" alt="Lokum Blast" width="96" height="96">
<h3>Lokum Blast: ${t('Blok Bulmaca', 'Block Puzzle')}</h3>
<p class="muted">${t('Pudra şekerli lokumları 8×8 tahtaya diz, satırları patlat, kombo üstüne kombo yap. 300+ seviyelik Yolculuk’ta zümrütleri topla, Tekir’le birlikte Kapalıçarşı’nın 12 dükkânını yeniden canlandır.', 'Place sugar-dusted Turkish delight on an 8×8 board, blast rows and chain combos. Collect emeralds across 300+ levels and help Tekir restore 12 shops of the Grand Bazaar.')}</p>
<div class="chips"><span class="chip">${t('Bulmaca', 'Puzzle')}</span><span class="chip">iOS · Android</span><span class="chip">${t('İnternetsiz oynanır', 'Plays offline')}</span><span class="chip">${t('6 dil', '6 languages')}</span></div>
${badges}
<a href="${rel}lokum-blast/">${t('Oyunun sayfası →', 'Game page →')}</a>
</div>
</div>
<div class="feature reverse">
<div class="phones-wrap">
<div class="phones" lang="tr">
<img src="${rel}assets/img/simit/shots/tr/02-cats.jpg" alt="" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/simit/shots/tr/01-stands.jpg" alt="Simit Tycoon" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/simit/shots/tr/04-night.jpg" alt="" loading="lazy" width="540" height="1080">
</div>
<div class="phones" lang="en">
<img src="${rel}assets/img/simit/shots/en/02-cats.jpg" alt="" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/simit/shots/en/01-stands.jpg" alt="Simit Tycoon" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/simit/shots/en/04-night.jpg" alt="" loading="lazy" width="540" height="1080">
</div>
</div>
<div class="feature-copy">
<img class="icon" src="${rel}assets/img/simit-tycoon-icon-512.png" alt="Simit Tycoon" width="96" height="96">
<h3>Simit Tycoon: ${t('Kedi Kafesi', 'Idle Cat Café')}</h3>
<p class="muted">${t('Karaköy iskelesinde tek bir simit arabasıyla başla. Çay ocağından kebap salonuna 10 sokak lezzeti aç, her tezgâhın başına sevimli bir kedi müdür koy ve Karaköy’den Adalar’a İstanbul’un lezzet imparatorluğunu kur. Sen yokken bile kazan.', 'Start with a single simit cart on the Karaköy pier. Open 10 street-food stands from tea house to kebab palace, put an adorable cat manager in charge of each, and build an Istanbul food empire from Karaköy to the Princes’ Islands. Earn even while you’re away.')}</p>
<div class="chips"><span class="chip">Idle Tycoon</span><span class="chip">iOS · Android</span><span class="chip">${t('Sen yokken de kazanır', 'Earns while you’re away')}</span><span class="chip">${t('6 dil', '6 languages')}</span></div>
${badges}
<a href="${rel}simit-tycoon/">${t('Oyunun sayfası →', 'Game page →')}</a>
</div>
</div>
<div class="feature">
<div class="phones-wrap">
<div class="phones" lang="tr">
<img src="${rel}assets/img/kitap/shots/tr/02-stacks.jpg" alt="" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/kitap/shots/tr/01-board.jpg" alt="Kitap Kedisi" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/kitap/shots/tr/04-home.jpg" alt="" loading="lazy" width="540" height="1080">
</div>
<div class="phones" lang="en">
<img src="${rel}assets/img/kitap/shots/en/02-stacks.jpg" alt="" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/kitap/shots/en/01-board.jpg" alt="Bookcat" loading="lazy" width="540" height="1080">
<img src="${rel}assets/img/kitap/shots/en/04-home.jpg" alt="" loading="lazy" width="540" height="1080">
</div>
</div>
<div class="feature-copy">
<img class="icon" src="${rel}assets/img/kitap-kedisi-icon-512.png" alt="Kitap Kedisi" width="96" height="96">
<h3>${t('Kitap Kedisi: Kelime Solitaire', 'Bookcat: Word Solitaire')}</h3>
<p class="muted">${t('Klasik solitaire’in dinlendiren kart dizme keyfi kelime çağrışımıyla buluştu. Raf etiketini rafa koy, o kategoriye ait kelimeleri bul ve diz, Tekir’in sahafını toparla. Her bölüm çözülebilir, bölüm ortasında reklam yok.', 'The relaxing card-sorting joy of solitaire meets word associations. Put a shelf label on a shelf, find the words that belong there and tidy up Tekir’s bookshop. Every level is solvable and there are never ads mid-level.')}</p>
<div class="chips"><span class="chip">${t('Kelime · Kart', 'Word · Card')}</span><span class="chip">iOS · Android</span><span class="chip">${t('129 kategori', '129 categories')}</span><span class="chip">${t('4 dil', '4 languages')}</span></div>
${badges}
<a href="${rel}kitap-kedisi/">${t('Oyunun sayfası →', 'Game page →')}</a>
</div>
</div>
</div>
</section>

<section class="band alt" id="labs">
<div class="wrap">
<div class="band-head">
<p class="eyebrow">Tekir Labs</p>
<h2>${t('Hayatı kolaylaştıran akıllı uygulamalar', 'Smart apps that make life a little easier')}</h2>
<p class="lead">${t('Günlük hayatın küçük işlerini kolaylaştıran, verine saygılı uygulamalar. İlki Lale, ardından atölyedekiler:', 'Privacy-respecting apps for the small jobs of everyday life. Lale comes first, then what’s in the workshop:')}</p>
</div>
<div class="grid">
<a class="card" href="lale/" style="text-decoration:none;color:inherit"><img src="assets/img/lale-icon-180.png" alt="" width="64" height="64" style="width:64px;border-radius:16px"><span class="tag">${t('Yakında', 'Coming soon')}</span><h3>Lale: YKS Sayaç &amp; Ders Takibi</h3><p class="muted">${t('Odaklandıkça İstanbul laleleri açan pomodoro bahçesi; YKS geri sayımı, soru ve deneme neti takibi, sınıfça haftalık sıralama. Reklamsız, hesapsız.', 'A pomodoro garden where Istanbul tulips bloom as you focus, with an exam countdown, score tracking and a weekly class leaderboard. No ads, no account.')}</p></a>
<article class="card"><div class="ico" aria-hidden="true">🥙</div><span class="tag soon">${t('Atölyede', 'In the workshop')}</span><h3>Lokma</h3><p class="muted">${t('Yemeğinin fotoğrafını çek, kalori ve makrolar anında hesaplansın. Türk mutfağını gerçekten tanıyan kalori sayacı.', 'Snap your meal and get calories and macros instantly — a calorie tracker that actually knows Turkish food.')}</p></article>
<article class="card"><div class="ico" aria-hidden="true">🌬️</div><span class="tag soon">${t('Atölyede', 'In the workshop')}</span><h3>Nefes</h3><p class="muted">${t('Sigarayı ya da vape’i bırakmak için kişisel koç: sayaç, sağlık zaman çizelgesi ve kriz anında nefes egzersizleri.', 'A personal coach for quitting smoking or vaping: counters, a health timeline and breathing exercises for cravings.')}</p></article>
</div>
</div>
</section>

<section class="band" id="hakkimizda">
<div class="wrap">
<div class="band-head">
<p class="eyebrow">${t('Hakkımızda', 'About')}</p>
<h2>${t('Kedi kadar meraklı, lokum kadar tatlı', 'As curious as a cat, as sweet as lokum')}</h2>
</div>
<div class="grid">
<article class="card"><h3>${t('Önce eğlence', 'Fun first')}</h3><p class="muted">${t('Oyuncuyu tutan şey karanlık desenler değil, gerçek eğlence ve adil ilerleme. Ödüllü reklamlar her zaman isteğe bağlı.', 'Players stay for real fun and fair progress, not dark patterns. Rewarded ads are always optional.')}</p></article>
<article class="card"><h3>${t('Gizliliğe saygı', 'Privacy by default')}</h3><p class="muted">${t('Hesap açtırmıyoruz, oyun ilerlemesi cihazında kalıyor. KVKK ve GDPR’a uygun çalışıyoruz.', 'No accounts required; your progress stays on your device. We follow KVKK and GDPR.')}</p></article>
<article class="card"><h3>${t('İstanbul’dan dünyaya', 'From Istanbul to the world')}</h3><p class="muted">${t('Çini, çarşı, çay, simit… Kendi kültürümüzü, dünyanın her yerinde sevilecek bir dille anlatıyoruz.', 'Tiles, bazaars, tea, simit — we share our culture in a language the whole world enjoys.')}</p></article>
</div>
</div>
</section>`,
});

// ───────────── Lokum Blast ─────────────
const features = [
  ['💥', t('Dev kombolar', 'Huge combos'), t('Aynı anda birden çok satırı temizle, kombo çarpanıyla puanını katla.', 'Clear several lines at once and multiply your score with combo streaks.')],
  ['🗺️', t('300+ seviye', '300+ levels'), t('Zümrütleri topla, kasaları kır, hedefleri hamleler bitmeden tamamla.', 'Collect emeralds, smash crates and finish the goals before you run out of moves.')],
  ['🏪', t('Kapalıçarşı', 'Grand Bazaar'), t('Yıldızlarınla lokumcu, çay ocağı, baharatçı gibi 12 dükkânı yenile.', 'Spend stars to restore 12 shops: the lokum shop, the tea house, the spice stall and more.')],
  ['📅', t('Her gün yeni', 'Something new every day'), t('Günün Bulmacası, günlük hediye, Çarkıfelek ve görevler.', 'A daily puzzle, daily gifts, a lucky wheel and quests.')],
  ['🎨', t('6 tema', '6 themes'), t('Klasik Lokum, Kedi Patisi, İznik Çinisi, Gece Çarşısı, Mozaik Fener, Altın Saray.', 'Classic Lokum, Cat Paw, İznik Tiles, Night Bazaar, Mosaic Lantern, Golden Palace.')],
  ['✈️', t('İnternetsiz', 'Offline'), t('Metroda, uçakta, her yerde oyna. Hesap gerekmez.', 'Play on the subway, on a plane, anywhere. No account needed.')],
];
page({
  path: 'lokum-blast/',
  title: 'Lokum Blast',
  description: 'Lokum Blast: tatlı İstanbul blok bulmacası. Sweet Istanbul block puzzle by Tekir Studios for iOS and Android.',
  current: 'lokum',
  body: (rel) => `
<section class="hero">
<div class="lights" aria-hidden="true"></div>
<div class="wrap">
<div>
<img src="${rel}assets/img/lokum-blast-icon-512.png" alt="" width="104" height="104" style="width:104px;border-radius:26px;box-shadow:0 12px 30px #0008;margin-bottom:18px">
<h1>Lokum Blast</h1>
<p class="lead">${t('İstanbul’un en tatlı bulmacası. Lokumları diz, satırları patlat, Tekir’le Kapalıçarşı’yı canlandır.', 'The sweetest puzzle in Istanbul. Place lokum blocks, blast lines and restore the Grand Bazaar with Tekir.')}</p>
<div class="hero-cta">${badges}</div>
</div>
<div class="hero-art"><img src="${rel}assets/img/shots/tr/01-combo.jpg" lang="tr" alt="Lokum Blast" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"><img src="${rel}assets/img/shots/en/01-combo.jpg" lang="en" alt="Lokum Blast" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"></div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Ekran görüntüleri', 'Screenshots')}</p><h2>${t('Bir lokum, bir kombo, bir dükkân daha', 'One more lokum, one more combo, one more shop')}</h2></div>
<div class="shots" lang="tr">${['01-combo', '02-journey', '03-bazaar', '04-theme', '05-saray', '06-wheel', '07-home'].map((s) => `<img src="${rel}assets/img/shots/tr/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
<div class="shots" lang="en">${['01-combo', '02-journey', '03-bazaar', '04-theme', '05-saray', '06-wheel', '07-home'].map((s) => `<img src="${rel}assets/img/shots/en/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
</div>
</section>

<section class="band alt">
<div class="wrap">
<div class="grid">${features.map(([ico, h3, p]) => `<article class="card"><div class="ico" aria-hidden="true">${ico}</div><h3>${h3}</h3><p class="muted">${p}</p></article>`).join('')}</div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Sık sorulanlar', 'FAQ')}</p><h2>${t('Merak edilenler', 'Questions')}</h2></div>
<div class="faq">
<details><summary>${t('Oyun ücretsiz mi?', 'Is the game free?')}</summary><div>${t('Evet. Oyun ücretsizdir; isteğe bağlı uygulama içi satın alımlar ve reklamlar içerir. Reklamsız Paket ile zorunlu reklamları kalıcı olarak kaldırabilirsin.', 'Yes. The game is free with optional in-app purchases and ads. The No Ads Pack removes forced ads permanently.')}</div></details>
<details><summary>${t('Satın alımlarımı nasıl geri yüklerim?', 'How do I restore my purchases?')}</summary><div>${t('Oyunda Ayarlar ya da Mağaza ekranındaki “Satın alımları geri yükle” düğmesine dokun. Aynı Apple Kimliği veya Google hesabıyla giriş yapmış olman gerekir.', 'Tap “Restore purchases” in Settings or in the Shop, signed in with the same Apple ID or Google account.')}</div></details>
<details><summary>${t('Tekir Kulübü aboneliğini nasıl iptal ederim?', 'How do I cancel Tekir Club?')}</summary><div>${t('iPhone: Ayarlar › Apple Kimliği › Abonelikler. Android: Google Play › Profil › Ödemeler ve abonelikler. Yenilemeden en az 24 saat önce iptal etmelisin.', 'iPhone: Settings › Apple ID › Subscriptions. Android: Google Play › Profile › Payments & subscriptions. Cancel at least 24 hours before renewal.')}</div></details>
<details><summary>${t('İlerlemem kaybolur mu?', 'Will I lose my progress?')}</summary><div>${t('İlerlemen cihazında saklanır. Uygulamayı silersen ilerleme de silinir; satın alınan tema ve Reklamsız Paket ise geri yüklenebilir.', 'Progress is stored on your device. Deleting the app deletes progress; purchased themes and the No Ads Pack can be restored.')}</div></details>
<details><summary>${t('Verilerimi nasıl sildiririm?', 'How do I delete my data?')}</summary><div>${t('Oyunda Ayarlar › İlerlemeyi sıfırla ile cihazdaki tüm verini silebilirsin. Reklam ortaklarının tuttuğu veriler için <a href="../destek/">Destek</a> sayfasındaki adrese yazabilirsin.', 'Use Settings › Reset progress to delete all on-device data. For data held by ad partners, email us via the <a href="../destek/">Support</a> page.')}</div></details>
</div>
<p style="margin-top:24px" class="muted"><a href="gizlilik/">Gizlilik Politikası</a> · <a href="privacy/">Privacy Policy</a> · <a href="kosullar/">Kullanım Koşulları</a> · <a href="terms/">Terms of Use</a></p>
</div>
</section>`,
});


// ───────────── Simit Tycoon ─────────────
const simitFeatures = [
  ['🥯', t('10 sokak lezzeti', '10 street foods'), t('Simit, çay, poğaça, balık ekmek, döner, kumpir, midye, Maraş dondurması, lokum ve kebap.', 'Simit, Turkish tea, poğaça, fish sandwiches, döner, kumpir, stuffed mussels, Maraş ice cream, Turkish delight and kebab.')],
  ['🐱', t('10 kedi müdür', '10 cat managers'), t('Pamuk, nazar boncuklu Boncuk, fesli Paşa, Van kedisi Sultan… Tezgâhlarını sen yokken bile çalıştırırlar.', 'Pamuk, Boncuk with her evil-eye bead, Paşa in his fez, Sultan the Van cat… They run your stands even while you are away.')],
  ['🌉', t('8 efsane semt', '8 iconic districts'), t('Karaköy’den Adalar’a; her semtin kendi silüeti ve günün kendi saati. Taşın, lale ve semt rozeti kazan.', 'From Karaköy to the Princes’ Islands, each with its own skyline and time of day. Move on to earn tulips and district badges.')],
  ['🕊️', t('Martı ve vapur', 'Seagulls & the ferry'), t('Simit kapan martıyı yakala, vapur yanaşınca izdiham saatinde gelirini üçe katla.', 'Catch the simit-stealing seagull and triple your income at rush hour when the ferry docks.')],
  ['📜', t('Gizli tarifler', 'Secret recipes'), t('Usta tarifinden kozmik tarife 275 tarif ve mahalle şenlikleri.', '275 recipes from the master’s recipe to the cosmic one, plus neighbourhood festivals.')],
  ['🌙', t('Sen yokken de kazan', 'Earn while you’re away'), t('Kedilerin çalışır, döndüğünde kasan dolu. İnternetsiz oynanır, hesap gerekmez.', 'Your cats keep working and your till is full when you return. Plays offline, no account needed.')],
];
page({
  path: 'simit-tycoon/',
  title: 'Simit Tycoon',
  description: 'Simit Tycoon: Idle Cat Café — kedi müdürlerle İstanbul sokak lezzeti imparatorluğu kur. Build an Istanbul street-food empire with cat managers.',
  current: 'simit',
  image: '/assets/img/simit-tycoon-feature.jpg',
  body: (rel) => `
<section class="hero">
<div class="lights" aria-hidden="true"></div>
<div class="wrap">
<div>
<img src="${rel}assets/img/simit-tycoon-icon-512.png" alt="" width="104" height="104" style="width:104px;border-radius:26px;box-shadow:0 12px 30px #0008;margin-bottom:18px">
<h1>Simit Tycoon</h1>
<p class="lead">${t('Tek bir simit arabasından İstanbul’un en lezzetli imparatorluğuna. Kedi müdürlerini işe al, martıları yakala, vapuru karşıla.', 'From one simit cart to Istanbul’s tastiest food empire. Hire cat managers, catch seagulls, meet the ferry.')}</p>
<div class="hero-cta">${badges}</div>
</div>
<div class="hero-art"><img src="${rel}assets/img/simit/shots/tr/01-stands.jpg" lang="tr" alt="Simit Tycoon" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"><img src="${rel}assets/img/simit/shots/en/01-stands.jpg" lang="en" alt="Simit Tycoon" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"></div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Ekran görüntüleri', 'Screenshots')}</p><h2>${t('Bir simit, bir kedi, bir semt daha', 'One more simit, one more cat, one more district')}</h2></div>
<div class="shots" lang="tr">${['01-stands', '02-cats', '03-districts', '04-night', '05-offline', '06-recipes', '07-welcome'].map((s) => `<img src="${rel}assets/img/simit/shots/tr/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
<div class="shots" lang="en">${['01-stands', '02-cats', '03-districts', '04-night', '05-offline', '06-recipes', '07-welcome'].map((s) => `<img src="${rel}assets/img/simit/shots/en/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
</div>
</section>

<section class="band alt">
<div class="wrap">
<div class="grid">${simitFeatures.map(([ico, h3, p]) => `<article class="card"><div class="ico" aria-hidden="true">${ico}</div><h3>${h3}</h3><p class="muted">${p}</p></article>`).join('')}</div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Sık sorulanlar', 'FAQ')}</p><h2>${t('Merak edilenler', 'Questions')}</h2></div>
<div class="faq">
<details><summary>${t('Oyun ücretsiz mi?', 'Is the game free?')}</summary><div>${t('Evet. Oyun ücretsizdir; isteğe bağlı uygulama içi satın alımlar ve ödüllü reklamlar içerir. Oyunu kesen zorunlu reklam yoktur.', 'Yes. The game is free with optional in-app purchases and rewarded ads. There are no forced ads that interrupt you.')}</div></details>
<details><summary>${t('Uygulama kapalıyken de kazanıyor muyum?', 'Do I earn while the app is closed?')}</summary><div>${t('Evet. Kedi müdür işe aldığın tezgâhlar sen yokken de çalışır. Kasan başlangıçta 4 saatlik kazanç tutar; mağazadan 24 saate kadar büyütebilirsin.', 'Yes. Stands with a cat manager keep earning while you are away. Your till holds 4 hours of earnings at first and can be upgraded up to 24 hours in the shop.')}</div></details>
<details><summary>${t('Satın alımlarımı nasıl geri yüklerim?', 'How do I restore my purchases?')}</summary><div>${t('Mağaza sekmesinin altındaki “Satın alımları geri yükle” düğmesine dokun. Aynı Apple Kimliği veya Google hesabıyla giriş yapmış olman gerekir.', 'Tap “Restore purchases” at the bottom of the Shop tab, signed in with the same Apple ID or Google account.')}</div></details>
<details><summary>${t('Kedi Kulübü aboneliğini nasıl iptal ederim?', 'How do I cancel the Cat Club?')}</summary><div>${t('iPhone: Ayarlar › Apple Kimliği › Abonelikler. Android: Google Play › Profil › Ödemeler ve abonelikler. Yenilemeden en az 24 saat önce iptal etmelisin.', 'iPhone: Settings › Apple ID › Subscriptions. Android: Google Play › Profile › Payments & subscriptions. Cancel at least 24 hours before renewal.')}</div></details>
<details><summary>${t('Verilerimi nasıl sildiririm?', 'How do I delete my data?')}</summary><div>${t('Oyunda Ayarlar › İlerlemeyi sıfırla ile cihazdaki tüm verini silebilirsin. Reklam ortaklarının tuttuğu veriler için <a href="../destek/">Destek</a> sayfasındaki adrese yazabilirsin.', 'Use Settings › Reset progress to delete all on-device data. For data held by ad partners, email us via the <a href="../destek/">Support</a> page.')}</div></details>
</div>
<p style="margin-top:24px" class="muted"><a href="gizlilik/">Gizlilik Politikası</a> · <a href="privacy/">Privacy Policy</a> · <a href="kosullar/">Kullanım Koşulları</a> · <a href="terms/">Terms of Use</a></p>
</div>
</section>`,
});

// ───────────── Kitap Kedisi ─────────────
const kitapFeatures = [
  ['📚', t('Kelimeleri raflara diz', 'Shelve the words'), t('Raf etiketini boş rafa koy, o kategorinin kelimelerini bul: Elma, Kiraz, Karpuz → Meyveler!', 'Put a shelf label on an empty shelf and find its words: Apple, Cherry, Watermelon → Fruits!')],
  ['✅', t('Her bölüm çözülebilir', 'Every level is solvable'), t('Bölümler bilgisayar tarafından çözülerek üretilir. Reklam izlemeden, satın almadan kazanılır.', 'Levels are generated by actually solving them, so each one can be won without ads or purchases.')],
  ['🕌', t('İstanbul turu', 'An Istanbul tour'), t('Kadıköy’den Topkapı’ya 30 semt, 300+ bölüm. Her semt Tekir’in antika rafına bir nadir kitap ekler.', '30 districts from Kadıköy to Topkapı and 300+ levels. Every district adds a rare book to Tekir’s antique shelf.')],
  ['📅', t('Günün Rafı', 'Daily Shelf'), t('Herkes için aynı bulmaca. Serini koru, sonucunu arkadaşlarınla paylaş.', 'The same puzzle for everyone. Keep your streak and share your result.')],
  ['🌍', t('129 kategori, 4 dil', '129 categories, 4 languages'), t('Meyvelerden dinozorlara, Türk kahvaltısından klasik romanlara. Türkçe, English, Deutsch, Español.', 'From fruits to dinosaurs, from Turkish breakfast to classic novels. Türkçe, English, Deutsch, Español.')],
  ['🤝', t('Adil oyun', 'Fair play'), t('Can yok, bekleme yok, geri al bedava. İlk 12 bölüm tamamen reklamsız, bölüm ortasında asla reklam yok.', 'No lives, no waiting, free undo. The first 12 levels are ad-free and there are never ads mid-level.')],
];
const KITAP_SHOTS = ['01-board', '02-stacks', '03-win', '04-home', '05-daily', '06-collection'];
page({
  path: 'kitap-kedisi/',
  title: 'Kitap Kedisi · Bookcat',
  description: 'Kitap Kedisi: Kelime Solitaire — kelimeleri kategorilerine göre raflara diz. Bookcat: a cozy word solitaire where every level is solvable.',
  current: 'kitap',
  image: '/assets/img/kitap-kedisi-feature.jpg',
  body: (rel) => `
<section class="hero">
<div class="lights" aria-hidden="true"></div>
<div class="wrap">
<div>
<img src="${rel}assets/img/kitap-kedisi-icon-512.png" alt="" width="104" height="104" style="width:104px;border-radius:26px;box-shadow:0 12px 30px #0008;margin-bottom:18px">
<h1>${t('Kitap Kedisi', 'Bookcat')}</h1>
<p class="lead">${t('Kelimeleri kategorilerine göre raflara diz, Tekir’in sahafını toparla. Her bölüm çözülebilir, her gün yeni bir Günün Rafı.', 'Sort words into their shelves and tidy up Tekir’s bookshop. Every level is solvable, with a new Daily Shelf every day.')}</p>
<div class="hero-cta">${badges}</div>
</div>
<div class="hero-art"><img src="${rel}assets/img/kitap/shots/tr/01-board.jpg" lang="tr" alt="Kitap Kedisi" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"><img src="${rel}assets/img/kitap/shots/en/01-board.jpg" lang="en" alt="Bookcat" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"></div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Ekran görüntüleri', 'Screenshots')}</p><h2>${t('Bir kelime, bir raf, bir semt daha', 'One more word, one more shelf, one more district')}</h2></div>
<div class="shots" lang="tr">${KITAP_SHOTS.map((s) => `<img src="${rel}assets/img/kitap/shots/tr/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
<div class="shots" lang="en">${KITAP_SHOTS.map((s) => `<img src="${rel}assets/img/kitap/shots/en/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
</div>
</section>

<section class="band alt">
<div class="wrap">
<div class="grid">${kitapFeatures.map(([ico, h3, p]) => `<article class="card"><div class="ico" aria-hidden="true">${ico}</div><h3>${h3}</h3><p class="muted">${p}</p></article>`).join('')}</div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Sık sorulanlar', 'FAQ')}</p><h2>${t('Merak edilenler', 'Questions')}</h2></div>
<div class="faq">
<details><summary>${t('Oyun ücretsiz mi?', 'Is the game free?')}</summary><div>${t('Evet. Oyun ücretsizdir; isteğe bağlı uygulama içi satın alımlar ve reklamlar içerir. Ara reklamlar yalnızca kazanılan bölümlerden sonra gelir; “Reklamsız Okuma” ile kalıcı olarak kaldırabilirsin.', 'Yes. The game is free with optional in-app purchases and ads. Interstitials only appear after a won level, and “Ad-free Reading” removes them permanently.')}</div></details>
<details><summary>${t('Bir bölümü geçemiyorum, ne yapmalıyım?', 'I’m stuck on a level. What can I do?')}</summary><div>${t('Her bölümün bir çözümü var. Aynı kategorideki kelimeleri önce bir sütunda topla, sonra tek hamlede rafa taşı. İpucu bir sonraki en iyi hamleyi gösterir; Pati ise açık bir rafın kitabını nerede olursa olsun getirir. Tekrar denemek her zaman bedava.', 'Every level has a solution. Gather words of one category in a column first, then shelve them in a single move. A Hint shows the best next move and the Paw fetches a book for an open shelf wherever it is. Retrying is always free.')}</div></details>
<details><summary>${t('Satın alımlarımı nasıl geri yüklerim?', 'How do I restore my purchases?')}</summary><div>${t('Mağaza ekranının altındaki “Satın alımları geri yükle” düğmesine dokun. Aynı Apple Kimliği veya Google hesabıyla giriş yapmış olman gerekir.', 'Tap “Restore purchases” at the bottom of the Shop, signed in with the same Apple ID or Google account.')}</div></details>
<details><summary>${t('Verilerimi nasıl sildiririm?', 'How do I delete my data?')}</summary><div>${t('Oyunda Ayarlar › İlerlemeyi sıfırla ile cihazdaki tüm verini silebilirsin. Reklam ortaklarının tuttuğu veriler için <a href="../destek/">Destek</a> sayfasındaki adrese yazabilirsin.', 'Use Settings › Reset progress to delete all on-device data. For data held by ad partners, email us via the <a href="../destek/">Support</a> page.')}</div></details>
</div>
<p style="margin-top:24px" class="muted"><a href="gizlilik/">Gizlilik Politikası</a> · <a href="privacy/">Privacy Policy</a> · <a href="kosullar/">Kullanım Koşulları</a> · <a href="terms/">Terms of Use</a></p>
</div>
</section>`,
});

// ───────────── Lale (Tekir Labs) ─────────────
const laleFeatures = [
  ['🌷', t('Odaklan, lalen açsın', 'Focus and a tulip blooms'), t('Pomodoro, zamanlayıcı ya da kronometre. Ne kadar uzun odaklanırsan o kadar nadir lale: 32 çeşit, İstanbul’un 7 lale bahçesi.', 'Pomodoro, timer or stopwatch. The longer you focus, the rarer the tulip: 32 varieties across 7 Istanbul gardens.')],
  ['🎯', t('Netin anında hesaplansın', 'Your score, instantly'), t('Doğru, yanlış, boş gir; YKS, LGS, KPSS, ALES, DGS, YDS ve MSÜ kurallarıyla net hesaplansın. TYT ve AYT deneme grafiği.', 'Enter right, wrong and blank answers and get your score with real exam rules, plus a mock-exam trend chart.')],
  ['⏳', t('Sınava geri sayım', 'Exam countdown'), t('YKS 2027’ye kaç gün kaldı? Ana ekran widget’ı, günlük hedef, çalışma serisi ve kaçırılan günü kurtaran lale soğanı.', 'Days left to your exam on a home-screen widget, with daily goals, a study streak and tulip bulbs that save a missed day.')],
  ['🤝', t('Sınıfça haftalık sıralama', 'A weekly class leaderboard'), t('Haftalık çalışma kodunu paylaş, arkadaşlarınla yarış. Hesap yok, sunucu yok, sohbet yok, her zaman ücretsiz.', 'Share your weekly study code and compete with friends. No accounts, no server, no chat, always free.')],
  ['🔒', t('Verin sende kalır', 'Your data stays with you'), t('Reklam yok, hesap yok, analitik yok. Tüm kayıtların sadece telefonunda; istersen yedeğini al.', 'No ads, no account, no analytics. Everything stays on your phone, and you can back it up any time.')],
  ['👨‍👩‍👧', t('Veliler için', 'For parents'), t('YKS 2027 Sezon Kartı tek seferlik, sınavdan sonra kendiliğinden biter. CSV rapor ve Aile Paylaşımı.', 'The Season Pass is a one-time payment that simply ends after the exam. CSV reports and Family Sharing.')],
];
const LALE_SHOTS = ['01-focus', '02-session', '03-garden', '04-track', '05-stats', '06-friends'];
page({
  path: 'lale/',
  title: 'Lale: YKS Sayaç & Ders Takibi · Tekir Labs',
  description: 'Lale: odaklandıkça İstanbul laleleri açan pomodoro bahçesi; YKS geri sayımı, soru ve deneme neti takibi. Reklamsız, hesapsız. A study timer and focus garden.',
  current: 'lale',
  image: '/assets/img/lale-feature.jpg',
  body: (rel) => `
<section class="hero">
<div class="lights" aria-hidden="true"></div>
<div class="wrap">
<div>
<img src="${rel}assets/img/lale-icon-512.png" alt="" width="104" height="104" style="width:104px;border-radius:26px;box-shadow:0 12px 30px #0008;margin-bottom:18px">
<p class="eyebrow">Tekir Labs · ${t('Yakında', 'Coming soon')}</p>
<h1>Lale</h1>
<p class="lead">${t('YKS sayaç ve ders takibi. Odaklandıkça İstanbul laleleri açar, netlerin büyür. Reklamsız, hesapsız, verin sende.', 'A study timer and focus garden: Istanbul tulips bloom as you focus and your scores grow. No ads, no account, your data stays yours.')}</p>
<div class="hero-cta">${badges}</div>
</div>
<div class="hero-art"><img src="${rel}assets/img/lale/shots/tr/01-focus.jpg" lang="tr" alt="Lale" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"><img src="${rel}assets/img/lale/shots/en/01-focus.jpg" lang="en" alt="Lale" style="border-radius:28px;max-width:300px;margin:auto" width="540" height="1080"></div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Ekran görüntüleri', 'Screenshots')}</p><h2>${t('Bir seans, bir lale, bir net daha', 'One more session, one more tulip, one more point')}</h2></div>
<div class="shots" lang="tr">${LALE_SHOTS.map((s) => `<img src="${rel}assets/img/lale/shots/tr/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
<div class="shots" lang="en">${LALE_SHOTS.map((s) => `<img src="${rel}assets/img/lale/shots/en/${s}.jpg" alt="" loading="lazy" width="540" height="1080">`).join('')}</div>
</div>
</section>

<section class="band alt">
<div class="wrap">
<div class="grid">${laleFeatures.map(([ico, h3, p]) => `<article class="card"><div class="ico" aria-hidden="true">${ico}</div><h3>${h3}</h3><p class="muted">${p}</p></article>`).join('')}</div>
</div>
</section>

<section class="band">
<div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Sık sorulanlar', 'FAQ')}</p><h2>${t('Merak edilenler', 'Questions')}</h2></div>
<div class="faq">
<details><summary>${t('Lale ücretsiz mi?', 'Is Lale free?')}</summary><div>${t('Evet. Zamanlayıcı, bahçe, sayaç, soru ve deneme takibi, seri ve arkadaşlar her zaman ücretsiz ve reklamsız. İsteğe bağlı Lale Bahçıvan; nadir laleler, özel bahçeler, tüm ortam sesleri ve derin istatistikler ekler.', 'Yes. The timer, garden, countdown, score tracking, streak and friends are always free and ad-free. Optional Lale Gardener adds rare tulips, special gardens, every ambient sound and deeper stats.')}</div></details>
<details><summary>${t('Sınav tarihleri doğru mu?', 'Are the exam dates right?')}</summary><div>${t('2027 ve 2028 tarihleri tahminidir ve uygulamada “tahmini” olarak işaretlenir. ÖSYM/MEB takvimi açıklanınca güncelleriz; tarihi Ayarlar’dan kendin de değiştirebilirsin.', 'Built-in 2027 and 2028 dates are estimates and marked as such. We update them when the official calendar is published, and you can set your own date in Settings.')}</div></details>
<details><summary>${t('Arkadaş sıralaması nasıl çalışıyor?', 'How does the friends leaderboard work?')}</summary><div>${t('Her hafta Lale sana bir çalışma kodu verir. Kodu WhatsApp’tan paylaşırsın, arkadaşların yapıştırır, sıralamada yan yana görünürsünüz. Kod yalnızca takma adını ve haftalık toplamlarını içerir; hiçbir sunucuya gönderilmez.', 'Each week Lale gives you a study code. Share it by message, your friends paste it, and you appear side by side. The code only holds your nickname and weekly totals, and it is never sent to a server.')}</div></details>
<details><summary>${t('Lale ÖSYM ile bağlantılı mı?', 'Is Lale affiliated with ÖSYM?')}</summary><div>${t('Hayır. Lale; ÖSYM, MEB veya YÖK ile bağlantılı değildir.', 'No. Lale is not affiliated with ÖSYM, MEB, YÖK or any exam authority.')}</div></details>
</div>
<p style="margin-top:24px" class="muted"><a href="gizlilik/">Gizlilik Politikası</a> · <a href="privacy/">Privacy Policy</a> · <a href="kosullar/">Kullanım Koşulları</a> · <a href="terms/">Terms of Use</a></p>
</div>
</section>`,
});

// ───────────── support ─────────────
page({
  path: 'destek/',
  title: 'Destek · Tekir Studios',
  description: 'Tekir Studios oyun ve uygulamaları için destek. Support for Tekir Studios games and apps.',
  current: 'support',
  body: () => `
<section class="band"><div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Destek', 'Support')}</p><h1>${t('Sana nasıl yardım edebiliriz?', 'How can we help?')}</h1>
<p class="lead">${t('Bir sorun mu yaşadın, öneri mi var? Bize yaz, genellikle 2 iş günü içinde dönüyoruz. Lütfen oyunun adını, cihaz modelini ve oyundaki Ayarlar ekranının altında yazan sürüm numarasını ekle.', 'Found a bug or have an idea? Write to us — we usually reply within 2 business days. Please include the game name, your device model and the version shown at the bottom of the in-game Settings screen.')}</p></div>
<div class="contact-box">
<span class="muted">${t('E-posta', 'Email')}</span>
<div class="copy-row" lang="tr"><code>${EMAIL_TR}</code><button class="copy-btn" data-copy="${EMAIL_TR}" data-done="Kopyalandı">Kopyala</button></div>
<div class="copy-row" lang="en"><code>${EMAIL_EN}</code><button class="copy-btn" data-copy="${EMAIL_EN}" data-done="Copied">Copy</button></div>
</div>
<div class="band-head" style="margin-top:56px"><h2>${t('Veri silme talebi', 'Data deletion request')}</h2></div>
<p class="lead">${t('Oyunlarımız hesap gerektirmez; verilerin cihazında tutulur ve uygulama içindeki “İlerlemeyi sıfırla” ile silinir. Reklam kimliğine bağlı verilerin silinmesini istiyorsan yukarıdaki adrese “Veri silme” konulu bir e-posta gönder; 30 gün içinde sonuçlandırırız.', 'Our games do not require accounts; data lives on your device and is deleted with “Reset progress” in the app. To request deletion of data linked to your advertising ID, email the address above with the subject “Data deletion” — we complete requests within 30 days.')}</p>
</div></section>`,
});

// ───────────── press kit ─────────────
page({
  path: 'basin/',
  title: 'Basın Kiti · Tekir Studios',
  description: 'Tekir Studios, Lokum Blast, Simit Tycoon ve Kitap Kedisi basın kiti: bilgiler, logolar, ekran görüntüleri. Press kit with facts, logos and screenshots.',
  current: 'press',
  body: (rel) => `
<section class="band"><div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Basın kiti', 'Press kit')}</p><h1>Tekir Studios</h1>
<p class="lead">${t('Tekir Studios, İstanbul merkezli bağımsız bir mobil oyun ve uygulama stüdyosu. İlk oyunu Lokum Blast, dünyanın en sevilen bulmaca türünü İstanbul’un renkleriyle buluşturuyor. İkinci oyunu Simit Tycoon, kedi müdürlerle İstanbul’un sokak lezzetlerinden bir imparatorluk kurduğun bir idle tycoon. Üçüncü oyunu Kitap Kedisi ise kelime çağrışımını solitaire ile buluşturan, her bölümü çözülebilir bir kelime oyunu.', 'Tekir Studios is an independent mobile games and apps studio based in Istanbul. Its first game, Lokum Blast, brings the world’s favourite puzzle genre to life with the colours of Istanbul. Its second, Simit Tycoon, is an idle tycoon where cat managers help you build an empire of Istanbul street food. Its third, Bookcat, blends word associations with solitaire in a word game where every level is solvable.')}</p></div>
<div class="table-scroll"><table class="facts">
<tr><th>${t('Stüdyo', 'Studio')}</th><td>Tekir Studios (Tekir Games · Tekir Labs)</td></tr>
<tr><th>${t('Merkez', 'Based in')}</th><td>İstanbul, ${t('Türkiye', 'Türkiye')}</td></tr>
<tr><th>${t('Kuruluş', 'Founded')}</th><td>2026</td></tr>
<tr><th>${t('Oyunlar', 'Games')}</th><td>Lokum Blast: Block Puzzle · Simit Tycoon: Idle Cat Café · Kitap Kedisi (Bookcat): Word Solitaire</td></tr>
<tr><th>${t('Platformlar', 'Platforms')}</th><td>iOS, iPadOS, Android</td></tr>
<tr><th>${t('İş modeli', 'Business model')}</th><td>${t('Ücretsiz; uygulama içi satın alma, isteğe bağlı reklam, abonelik (Tekir Kulübü, Kedi Kulübü)', 'Free to play; in-app purchases, optional ads, subscriptions (Tekir Club, Cat Club)')}</td></tr>
<tr><th>${t('Diller', 'Languages')}</th><td>Türkçe, English, Deutsch, Español, Français, Português</td></tr>
<tr><th>${t('Basın iletişim', 'Press contact')}</th><td><code>${PRESS}</code></td></tr>
</table></div>
<div class="band-head" style="margin-top:56px"><h2>${t('Logolar ve görseller', 'Logos and images')}</h2><p class="muted">${t('Görseller, Tekir Studios ve oyunları hakkında haber ve inceleme amacıyla serbestçe kullanılabilir.', 'Images may be used freely for news and reviews about Tekir Studios and its games.')}</p></div>
<div class="grid">
<a class="card" href="${rel}assets/img/tekir-studios-dark.svg"><img src="${rel}assets/img/tekir-studios-dark.svg" alt="Tekir Studios logo" loading="lazy"><span>${t('Stüdyo logosu (SVG)', 'Studio logo (SVG)')}</span></a>
<a class="card" href="${rel}assets/img/lokum-blast-icon-512.png"><img src="${rel}assets/img/lokum-blast-icon-512.png" alt="Lokum Blast icon" loading="lazy" style="width:120px;border-radius:28px"><span>${t('Lokum Blast ikonu (PNG)', 'Lokum Blast icon (PNG)')}</span></a>
<a class="card" href="${rel}assets/img/lokum-blast-feature.jpg"><img src="${rel}assets/img/lokum-blast-feature.jpg" alt="Lokum Blast key art" loading="lazy" style="border-radius:14px"><span>${t('Ana görsel (1024×500)', 'Key art (1024×500)')}</span></a>
<a class="card" href="${rel}assets/img/simit-tycoon-icon-512.png"><img src="${rel}assets/img/simit-tycoon-icon-512.png" alt="Simit Tycoon icon" loading="lazy" style="width:120px;border-radius:28px"><span>${t('Simit Tycoon ikonu (PNG)', 'Simit Tycoon icon (PNG)')}</span></a>
<a class="card" href="${rel}assets/img/simit-tycoon-feature.jpg"><img src="${rel}assets/img/simit-tycoon-feature.jpg" alt="Simit Tycoon key art" loading="lazy" style="border-radius:14px"><span>${t('Simit Tycoon ana görseli (1024×500)', 'Simit Tycoon key art (1024×500)')}</span></a>
<a class="card" href="${rel}assets/img/simit-tycoon-logo.svg"><img src="${rel}assets/img/simit-tycoon-logo.svg" alt="Simit Tycoon logo" loading="lazy" style="width:200px"><span>${t('Simit Tycoon logosu (SVG)', 'Simit Tycoon logo (SVG)')}</span></a>
<a class="card" href="${rel}assets/img/kitap-kedisi-icon-512.png"><img src="${rel}assets/img/kitap-kedisi-icon-512.png" alt="Kitap Kedisi icon" loading="lazy" style="width:120px;border-radius:28px"><span>${t('Kitap Kedisi ikonu (PNG)', 'Bookcat icon (PNG)')}</span></a>
<a class="card" href="${rel}assets/img/kitap-kedisi-feature.jpg"><img src="${rel}assets/img/kitap-kedisi-feature.jpg" alt="Kitap Kedisi key art" loading="lazy" style="border-radius:14px"><span>${t('Kitap Kedisi ana görseli (1024×500)', 'Bookcat key art (1024×500)')}</span></a>
<a class="card" href="${rel}assets/img/tekir-happy.svg"><img src="${rel}assets/img/tekir-happy.svg" alt="Tekir mascot" loading="lazy" style="width:140px"><span>${t('Maskot: Tekir (SVG)', 'Mascot: Tekir (SVG)')}</span></a>
</div>
</div></section>`,
});

// ───────────── legal (from markdown) ─────────────
function legal(game, path, file, lang, title, section) {
  let md = readFileSync(join(here, '..', game.includes('/') ? game : join('games', game), 'legal', file), 'utf8');
  if (section) {
    const parts = md.split(/^## /m);
    const intro = parts[0];
    const chosen = parts.find((p) => p.startsWith(section)) ?? '';
    md = intro + chosen.replace(/^[^\n]*\n/, '');
  }
  const html = marked.parse(md).replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>');
  page({
    path,
    title,
    description: title,
    fixedLang: lang,
    body: () => `<article class="wrap"><div class="prose">${html}</div></article>`,
  });
}
// [web slug, games/<folder> (or a repo path such as apps/lale), display name]
const GAMES = [
  ['lokum-blast', 'lokum-blast', 'Lokum Blast'],
  ['simit-tycoon', 'simit-tycoon', 'Simit Tycoon'],
  ['kitap-kedisi', 'bookcat', 'Kitap Kedisi'],
  ['lale', 'apps/lale', 'Lale'],
];
for (const [slug, dir, name] of GAMES) {
  legal(dir, `${slug}/gizlilik/`, 'gizlilik-politikasi.md', 'tr', `Gizlilik Politikası · ${name}`);
  legal(dir, `${slug}/privacy/`, 'privacy-policy.md', 'en', `Privacy Policy · ${name}`);
  legal(dir, `${slug}/kosullar/`, 'terms.md', 'tr', `Kullanım Koşulları · ${name}`, 'Türkçe');
  legal(dir, `${slug}/terms/`, 'terms.md', 'en', `Terms of Use · ${name}`, 'English');
}
page({
  path: 'yasal/',
  title: 'Gizlilik ve Koşullar · Tekir Studios',
  description: 'Tekir Studios oyunlarının gizlilik politikaları ve kullanım koşulları. Privacy policies and terms of use.',
  body: (rel) => `<section class="band"><div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Yasal', 'Legal')}</p><h1>${t('Gizlilik ve koşullar', 'Privacy & terms')}</h1></div>
<div class="grid">${GAMES.map(([slug, , name]) => `<article class="card"><img src="${rel}assets/img/${slug}-icon-180.png" alt="" width="72" height="72" style="width:72px;border-radius:18px"><h3>${name}</h3><p><a href="${rel}${slug}/gizlilik/">Gizlilik Politikası</a><br><a href="${rel}${slug}/privacy/">Privacy Policy</a><br><a href="${rel}${slug}/kosullar/">Kullanım Koşulları</a><br><a href="${rel}${slug}/terms/">Terms of Use</a></p></article>`).join('')}</div>
</div></section>`,
});

// ───────────── 404 + static files ─────────────
page({
  path: '404.html',
  title: 'Sayfa bulunamadı · Tekir Studios',
  description: 'Sayfa bulunamadı',
  body: () => `<section class="band"><div class="wrap" style="text-align:center;display:grid;gap:16px;justify-items:center">
<img src="/assets/img/tekir-idle.svg" alt="" width="200" height="200" style="width:200px">
<h1>404</h1><p class="lead">${t('Tekir bu sayfayı bulamadı. Belki bir lokumun peşinden gitmiştir.', 'Tekir could not find this page. Maybe it wandered off after a lokum.')}</p>
<a class="btn" href="/">${t('Ana sayfaya dön', 'Back to home')}</a></div></section>`,
});

cpSync(join(here, 'assets'), join(out, 'assets'), { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const urls = ['', 'lokum-blast/', 'simit-tycoon/', 'kitap-kedisi/', 'lale/', 'destek/', 'basin/', 'yasal/', ...GAMES.flatMap(([slug]) => ['gizlilik/', 'privacy/', 'kosullar/', 'terms/'].map((p) => `${slug}/${p}`))];
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
// AdMob requires app-ads.txt at the root of the developer website. Replace the publisher id.
writeFileSync(join(out, 'app-ads.txt'), `# Replace pub-0000000000000000 with your AdMob publisher ID (AdMob › Apps › app-ads.txt).\ngoogle.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n`);
console.log('site built →', out);
