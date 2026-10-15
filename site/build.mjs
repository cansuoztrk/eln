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
${link('#labs', 'Tekir Labs', 'labs')}
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
<a href="${rel}lokum-blast/gizlilik/">Gizlilik</a>
<a href="${rel}lokum-blast/privacy/">Privacy</a>
<a href="${rel}lokum-blast/kosullar/">Koşullar</a>
<a href="${rel}lokum-blast/terms/">Terms</a>
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
<a class="btn" href="${rel}lokum-blast/">${t('Lokum Blast’ı keşfet', 'Discover Lokum Blast')}</a>
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
<h2>${t('İlk oyunumuz: Lokum Blast', 'Our first game: Lokum Blast')}</h2>
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
</div>
</section>

<section class="band alt" id="labs">
<div class="wrap">
<div class="band-head">
<p class="eyebrow">Tekir Labs</p>
<h2>${t('Hayatı kolaylaştıran akıllı uygulamalar', 'Smart apps that make life a little easier')}</h2>
<p class="lead">${t('Yapay zekâyı günlük hayatın küçük işlerine taşıyoruz. Şu an atölyede olanlar:', 'We bring AI to the small jobs of everyday life. Currently in the workshop:')}</p>
</div>
<div class="grid">
<article class="card"><div class="ico" aria-hidden="true">🥙</div><span class="tag soon">${t('Yakında', 'Soon')}</span><h3>Lokma</h3><p class="muted">${t('Yemeğinin fotoğrafını çek, kalori ve makrolar anında hesaplansın. Türk mutfağını gerçekten tanıyan kalori sayacı.', 'Snap your meal and get calories and macros instantly — a calorie tracker that actually knows Turkish food.')}</p></article>
<article class="card"><div class="ico" aria-hidden="true">☕</div><span class="tag soon">${t('Yakında', 'Soon')}</span><h3>Telve</h3><p class="muted">${t('Fincanının fotoğrafını çek, falcı kedimiz telvedeki şekilleri yorumlasın. Eğlence amaçlı.', 'Photograph your coffee cup and our fortune-teller cat reads the shapes in the grounds. For fun.')}</p></article>
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
  description: 'Tekir Studios ve Lokum Blast basın kiti: bilgiler, logolar, ekran görüntüleri. Press kit with facts, logos and screenshots.',
  current: 'press',
  body: (rel) => `
<section class="band"><div class="wrap">
<div class="band-head"><p class="eyebrow">${t('Basın kiti', 'Press kit')}</p><h1>Tekir Studios</h1>
<p class="lead">${t('Tekir Studios, İstanbul merkezli bağımsız bir mobil oyun ve uygulama stüdyosu. İlk oyunu Lokum Blast, dünyanın en sevilen bulmaca türünü İstanbul’un renkleriyle buluşturuyor.', 'Tekir Studios is an independent mobile games and apps studio based in Istanbul. Its first game, Lokum Blast, brings the world’s favourite puzzle genre to life with the colours of Istanbul.')}</p></div>
<div class="table-scroll"><table class="facts">
<tr><th>${t('Stüdyo', 'Studio')}</th><td>Tekir Studios (Tekir Games · Tekir Labs)</td></tr>
<tr><th>${t('Merkez', 'Based in')}</th><td>İstanbul, ${t('Türkiye', 'Türkiye')}</td></tr>
<tr><th>${t('Kuruluş', 'Founded')}</th><td>2026</td></tr>
<tr><th>${t('İlk oyun', 'First game')}</th><td>Lokum Blast: Block Puzzle</td></tr>
<tr><th>${t('Platformlar', 'Platforms')}</th><td>iOS, iPadOS, Android</td></tr>
<tr><th>${t('İş modeli', 'Business model')}</th><td>${t('Ücretsiz; uygulama içi satın alma, isteğe bağlı reklam, Tekir Kulübü aboneliği', 'Free to play; in-app purchases, optional ads, Tekir Club subscription')}</td></tr>
<tr><th>${t('Diller', 'Languages')}</th><td>Türkçe, English, Deutsch, Español, Français, Português</td></tr>
<tr><th>${t('Basın iletişim', 'Press contact')}</th><td><code>${PRESS}</code></td></tr>
</table></div>
<div class="band-head" style="margin-top:56px"><h2>${t('Logolar ve görseller', 'Logos and images')}</h2><p class="muted">${t('Görseller, Tekir Studios ve oyunları hakkında haber ve inceleme amacıyla serbestçe kullanılabilir.', 'Images may be used freely for news and reviews about Tekir Studios and its games.')}</p></div>
<div class="grid">
<a class="card" href="${rel}assets/img/tekir-studios-dark.svg"><img src="${rel}assets/img/tekir-studios-dark.svg" alt="Tekir Studios logo" loading="lazy"><span>${t('Stüdyo logosu (SVG)', 'Studio logo (SVG)')}</span></a>
<a class="card" href="${rel}assets/img/lokum-blast-icon-512.png"><img src="${rel}assets/img/lokum-blast-icon-512.png" alt="Lokum Blast icon" loading="lazy" style="width:120px;border-radius:28px"><span>${t('Lokum Blast ikonu (PNG)', 'Lokum Blast icon (PNG)')}</span></a>
<a class="card" href="${rel}assets/img/lokum-blast-feature.jpg"><img src="${rel}assets/img/lokum-blast-feature.jpg" alt="Lokum Blast key art" loading="lazy" style="border-radius:14px"><span>${t('Ana görsel (1024×500)', 'Key art (1024×500)')}</span></a>
<a class="card" href="${rel}assets/img/tekir-happy.svg"><img src="${rel}assets/img/tekir-happy.svg" alt="Tekir mascot" loading="lazy" style="width:140px"><span>${t('Maskot: Tekir (SVG)', 'Mascot: Tekir (SVG)')}</span></a>
</div>
</div></section>`,
});

// ───────────── legal (from markdown) ─────────────
const legalDir = join(here, '..', 'games', 'lokum-blast', 'legal');
function legal(path, file, lang, title, section) {
  let md = readFileSync(join(legalDir, file), 'utf8');
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
legal('lokum-blast/gizlilik/', 'gizlilik-politikasi.md', 'tr', 'Gizlilik Politikası · Lokum Blast');
legal('lokum-blast/privacy/', 'privacy-policy.md', 'en', 'Privacy Policy · Lokum Blast');
legal('lokum-blast/kosullar/', 'terms.md', 'tr', 'Kullanım Koşulları · Lokum Blast', 'Türkçe');
legal('lokum-blast/terms/', 'terms.md', 'en', 'Terms of Use · Lokum Blast', 'English');

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
const urls = ['', 'lokum-blast/', 'destek/', 'basin/', 'lokum-blast/gizlilik/', 'lokum-blast/privacy/', 'lokum-blast/kosullar/', 'lokum-blast/terms/'];
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
// AdMob requires app-ads.txt at the root of the developer website. Replace the publisher id.
writeFileSync(join(out, 'app-ads.txt'), `# Replace pub-0000000000000000 with your AdMob publisher ID (AdMob › Apps › app-ads.txt).\ngoogle.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n`);
console.log('site built →', out);
