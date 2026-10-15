# 12 · Kitap Kedisi: Kelime Solitaire — Oyun Tasarım Belgesi

*Ekim 2026 · Tekir Games’in üçüncü oyunu · Kod: `games/bookcat/` · Uluslararası ad: **Bookcat: Word Solitaire***

> **Tek cümle:** Klasik solitaire’in dinlendiren kart dizme hissini kelime çağrışımıyla birleştiren, her bölümü çözülebilir olduğu kanıtlanmış, adil reklamlı bir “kelimeleri raflara diz” oyunu. Mekân: Tekir’in İstanbul’daki sahafı.

---

## 1. Neden bu oyun?

Seçim süreci ve Lokma’nın neden ertelendiği `docs/11-lokma-arastirma-raporu.md` belgesinde. Kısa özet:

| Bulgu | Kaynak | Bizim için anlamı |
|---|---|---|
| *Solitaire Associations Journey* (Hitapps) ABD’de haftalık IAP gelirini Ekim 2025’te ~1,2 bin $’dan Kasım sonunda ~572 bin $’a çıkardı, yıl sonunda ABD’de ~4 milyon aktif kullanıcıya ulaştı (yalnızca IAP; reklam geliri hariç). | Sensor Tower 2025 Ç4 | Tür çok yeni ve hızla büyüyor. |
| Aynı oyun 15 Ekim 2026’da Türkiye Kelime ücretsiz listesinde 2. sırada, Türkçe yerelleştirilmiş, ~5,1 bin TR puanı var. TR IAP’leri ₺99,99–₺1.499,99. | App Store TR | Türk oyuncu bu mekaniğe zaten para ödüyor. |
| Kardeş oyun *Word Solitaire: Associations* iOS’ta ~1,8★. Bir numaralı şikâyet **aşırı reklam**. Kitle %65 kadın, 18–34. | FoxData | Adil reklamlı bir rakibe yer var. |
| Türkçe bir aramada Türk yapımı bir sürüm bulunamadı. | Tek arama (çıkarım) | Yerel lezzet + kaliteyle öne çıkma şansı. |
| Türk stüdyoları yurt dışından 2,76 milyar $ kazanıyor; iç pazar 347 milyon $. | Adjust, 29 Eylül 2026 | Oyun baştan 4 dilde (TR/EN/DE/ES) çıkıyor. |

**Rakip yorumlarından çıkan şikâyetler ve bizim cevabımız:**

| Şikâyet | Kitap Kedisi’nde |
|---|---|
| Hamle sayısı çok sıkı, “bölüm imkânsız” hissi | Her bölüm, planlayıcı bot tarafından **çözülerek** üretilir. Hamle bütçesi = en iyi çözüm × pay. Reklamsız, satın almasız kazanılabilir (bkz. §4). |
| +10 hamle 1.500 altın | +10 hamle **200 / 350 / 500** altın (aynı bölümde artan) veya ödüllü video (bölüm başına 3’e kadar). |
| Bölüm ortasında reklam | Ara reklam **yalnızca kazanılan bölümden sonra**, 12. bölümden itibaren, her 3 bölümde bir, en az 150 sn arayla. |
| Can sistemi, bekleme | **Can yok.** Kaybedince hemen tekrar dene. |
| Geri al paralı | **Geri al bedava** (harcanan hamleyi iade etmez, böylece hile olmaz). |

---

## 2. Temel oyun

**Kartlar:** Her bölümde 2–7 kategori var. Her kategorinin bir **raf etiketi** (renkli kategori kartı) ve 3–7 **kelime kartı** (kitap) var.

**Masa:** Üstte raflar (2–4 yuva), ortada sütunlar (3–5), altta deste ve açık kart yığını.

**Kurallar:**
1. Raf etiketini boş bir rafa koy → raf o kategoriye açılır.
2. O kategorinin kelimelerini rafa diz. Raf dolunca kitaplar yerine oturur, raf boşalır.
3. Sütunlarda **aynı kategorideki** kelimeleri üst üste koyabilirsin. Boş sütuna her kart gider.
4. Desteye dokun → yeni kart çek. Deste bitince açık yığın aynı sırayla ters çevrilir (sınırsız).
5. Kapalı kart, üstü açılınca **bedava** döner.
6. **Her çekme, ters çevirme ve taşıma 1 hamle.** Bir grubu tek seferde taşımak hamle kazandırır, stratejinin kalbi bu.
7. Bütün kartlar raflara dizilince bölüm biter.

**Yıldızlar:** Bölüm bütçesinin ≥%25’i kalırsa ★★★, ≥%10’u kalırsa ★★, aksi halde ★. Ek hamle **kullanılan** (videoyla veya altınla) bölüm ★ ile biter; böylece yıldızlar ustalığı ölçer, bölüm ise yine de geçilir.

**Kontroller:** Sürükle-bırak veya **dokun-oynat** (kart en mantıklı hedefe uçar). Raf etiketi dokununca boş rafa, kelime kendi rafına veya uygun sütuna gider.

**Takviyeler:**

| Takviye | Ne yapar | Başlangıç | Fiyat |
|---|---|---|---|
| ↩️ Geri al | Son hamleyi geri alır (hamle iade etmez) | Sınırsız | Bedava |
| 💡 İpucu | Çözücünün önerdiği en iyi hamleyi parlatır | 3 | 100 altın |
| 🐾 Pati | Tekir, açık bir rafa ait bir kitabı nerede olursa olsun getirir | 2 | 180 altın |
| ➕ Hamle | +10 hamle | — | 200 / 350 / 500 altın veya video |

---

## 3. Meta ve tutundurma

| Sistem | Ayrıntı |
|---|---|
| **İstanbul turu** | 30 semt (Kadıköy → Topkapı) × 10 bölüm. Her semt bitince bir **nadir kitap** koleksiyona girer + 150 altın. |
| **Günün Rafı** | Herkes için aynı bulmaca (tarih tohumlu), 5 kategori. Ödül 100 altın + seri bonusu (en fazla +50). **Seri**, en iyi seri, paylaşılabilir sonuç metni (📚 ⭐⭐⭐ 34 hamlede · 🔥 6 gün). |
| **Günlük görevler** | 3 görev (bölüm bitir, kelime diz, raf tamamla, 3 yıldız, Günün Rafı, ipucu kullan). Hepsi bitince sandık: 150 altın + ipucu + pati. |
| **7 günlük giriş hediyesi** | 40 → 300 altın, 7. gün hediye kutusu. |
| **Başlangıç paketi** | 8. bölümden sonra 72 saat, tek seferlik. |
| **Bildirimler** | Günün Rafı hazır, seri tehlikede, “Tekir seni özledi” (izinle, sessiz saatlere dikkat). |
| **Değerlendirme isteği** | 8+ galibiyetten sonra, 3 yıldızlı bir galibiyet veya semt bitişinde (OS sınırına uyarak). |

**Zorluk eğrisi (testere dişi):** Her 5. bölüm “Zorlu” (pay −0,07), her 10. bölüm “Zor bölüm” (pay −0,12, +1 kategori, +40 altın ödül). Pay 1,65’ten 150. bölümde 1,28’e iner.

| Bölüm | Kart | Kategori | Sütun / raf | Örnek bütçe |
|---|---|---|---|---|
| 1 | 8 | 2 | 3 / 2 | 18 hamle (en iyi çözüm 11) |
| 10 (zor) | 20 | 4 | 4 / 3 | 50 (33) |
| 45 (zorlu) | 31 | 5 | 5 / 4 | 75 (51) |
| 300 | 49 | 6 | 5 / 4 | 100 (86) |

İlk 3 bölüm “açılış dağıtımı” kullanır: ilk sütunda bir raf etiketi açık gelir ve ikinci sütundaki kelimeyle eşleşir, böylece öğreticinin istediği ilk hamle her zaman yapılabilir. 1. bölümde 4 adımlı, Tekir’in anlattığı, ilgili hamleyi parlatan bir öğretici var.

---

## 4. Seviye üretimi ve “her bölüm çözülebilir” garantisi

`src/core/`:

- `deal.ts`: Bölüm düzeni (kategori boyutları, sütun derinlikleri, tohum) → başlangıç durumu. Düzen dilden bağımsızdır; aynı bölüm 4 dilde aynı oynanır, yalnızca kelimeler değişir.
- `solver.ts`: Ağırlıklı A* (küçük bölümlerde kesin en iyi çözüm) + planlayıcı bot (`bestPlayout`, 16–24 farklı denemenin en iyisi).
- `levels.ts`: `calibrate(n)` bölüm başına 16’ya kadar düzen dener. Kabul şartları: bot kazanmalı; normal bölümlerde “gündelik oyuncu” botu 8 denemenin en az 3’ünü kazanmalı. Bütçe = `max(par + 3, en iyi çözüm × pay)`.
- 300 bölüm önceden hesaplanır (`level-tuning.json`, ~51 sn). Sonrası aynı kurallarla anında üretilir.

İçerik (`src/content/`): **129 kategori**, 4 dilde, kademeli (1: gündelik → 5: uzman). Kurallar testlerle zorlanır:
- Her kategoride her dilde ≥8 kelime, kart boyutunda (≤26 karakter), kategori adıyla aynı kelime yok.
- **Eş anlamlı/eş sesli tuzak yok:** Aynı bölümde çıkabilecek iki kategoride aynı kelime (normalize edilmiş, aksansız) olamaz. Gerçekten yakın temalar (ör. Kuşlar–Çiftlik, Meyveler–Egzotik meyveler, Burçlar–Temizlik’teki “Kova”) **dışlama etiketiyle** aynı bölüme düşmez. Test bu sayede “Rock (etek, DE)–Rock (müzik)”, “vela (mum)–vela (yelken)”, “Mısır (ülke)–mısır (tahıl)” gibi 15 tuzağı yakaladı.
- Seviye kademesi: ≤12. bölüm yalnızca kademe 1, ≤35 → 2, ≤80 → 3, ≤160 → 4, sonrası 5. Son 6 bölümde kullanılan kategoriler tekrar edilmez. İstanbul paketi 20. bölümden sonra açılır.
- İlk 30 bölümde her kategorinin en bilinen 8 kelimesi kullanılır.

---

## 5. Görsel ve ses

- **Palet:** Ceviz ahşap (#3a2414), sahaf yeşili (#2f6150), varak altın (#e7bd5b), kâğıt (#fff6e6), mürekkep (#3b2a1f).
- **Kartlar:** Kelimeler çizgili kâğıt; raf etiketleri cilt rengi + altın çerçeve; kart arkası lacivert bez cilt üstünde varak pati.
- **Okunabilirlik:** Yazı boyutu en uzun kelimeye göre hesaplanır (kelime ortasından bölme yok), Almanca birleşik kelimeler okunur bir alt sınırdan sonra hecelenir. Sütunda kapanan kartın kaydırma miktarı etiketinin yüksekliğine göre ayarlanır, iki satırlı kelimeler de tam görünür. “Büyük yazı” ayarı var.
- **Tekir:** Gözlüklü, yeşil atkılı, elinde kırmızı kitap; idle / mutlu / okuyor halleri.
- **Ses:** Web Audio ile üretilen kart sesleri (çevirme, yerleştirme, raf dolma arpeji), caz döngüsü, miyav.

---

## 6. Teknik

| Konu | Seçim |
|---|---|
| Yığın | Vite 8 + TypeScript 5.9, framework yok, Capacitor 8 (iOS + Android) |
| Kayıt | `@capacitor/preferences` (`bookcat.save.v1`), yarım kalan bölüm kaydedilir |
| Reklam | AdMob (`@capacitor-community/admob`), UMP onay formu, ATT |
| IAP | RevenueCat (`no_ads` yetkisi), web’de demo modu |
| Diğer | Haptics, Local Notifications, Share, In-App Review, Splash, Status Bar |
| Testler | vitest: motor (7) + içerik kalitesi (4) |
| Paket kimliği | `com.tekirstudios.bookcat` |

---

## 7. Yol haritası

| Sürüm | İçerik |
|---|---|
| 1.0 | 300 ayarlı bölüm (sonsuz üretim), 129 kategori × 4 dil, Günün Rafı, görevler, koleksiyon, mağaza |
| 1.1 | Haftalık etkinlik (“Sahaf Pazarı”: tema paketi + liderlik tablosu), 200+ kategori, Fransızca/Portekizce |
| 1.2 | Tema kartları (kart arkası, masa), Tekir kostümleri (yalnızca kozmetik), sezon kartı denemesi |
| 1.3 | Arkadaşla Günün Rafı düellosu (paylaşım bağlantısı), Kitap Kulübü aboneliği testi |
