# 08 · Simit Tycoon: Idle Cat Café — Oyun Tasarım Belgesi (GDD)

| | |
|---|---|
| **Tür** | Idle / tycoon (boşta kazanç + yönetim) |
| **Platform** | iOS + Android (Capacitor), web demosu |
| **Oturum** | Günde 4–10 kez, 3–10 dakika (idle türünün doğal ritmi) |
| **Hedef kitle** | 18–45 yaş, gündelik oyuncu, kedi ve yemek temalı oyun sevenler. Türkiye + global (6 dil) |
| **Kanca** | Karaköy iskelesinde tek bir simit arabasıyla başla; sevimli kedi müdürlerle Karaköy’den Adalar’a İstanbul’un sokak lezzeti imparatorluğunu kur. |
| **Para modeli** | Ödüllü reklam (geçiş ve banner yok) + IAP (altın, kalıcı çarpan, reklamsız ödül, Kedi Kulübü aboneliği) |
| **Kod** | `games/simit-tycoon/` |

---

## 1. Neden bu oyun? (Orbita’dan Simit Tycoon’a geçiş)

Portföyde 2. ürün olarak **Orbita: Planet Merge** planlanmıştı. Pazar araştırması planı değiştirdi:

- **Orbita’nın fikri artık yeni değil.** Dairesel yerçekimli “gezegen birleştirme” oyunları mağazalarda zaten var ve zayıf kalmış: Godspear’ın *Planet Merge – Space Puzzle* ve *Sputnika* aynı mekaniği kullanıyor ama büyük bir çıkış yapamadı. Ayrıca birleştirme türü fizik hissine çok bağlı, farklılaşmak zor.
- **Kedi temalı idle yemek oyunları kanıtlanmış bir pazar.** *Cat Snack Bar* 20 milyonun üzerinde indirme ve 4 milyon $’ın üzerinde IAP geliri yaptı. *Eatventure* yaklaşık 40 milyon indirmeye ulaştı. Idle türü, ödüllü reklamdan en çok gelir elde eden türlerden biri (oyuncu 2× gelir, çevrimdışı kazanç ve hızlandırma için gönüllü reklam izliyor).
- **İstanbul temalı bir idle yok.** Simit, çay, balık ekmek, Maraş dondurması, martılar, vapur… Türkiye’de nostalji ve yerellik duygusu, globalde ise “egzotik ve sevimli” bir tema. Tekir Studios’un markası (fesli kedi Tekir) ile birebir uyumlu.
- **Lokum Blast’ın altyapısı aynen kullanılabildi:** reklam, satın alma, bildirim, kayıt, ses motoru, 6 dil ve mağaza görsel betikleri.

Kaynaklar son bölümde.

---

## 2. Çekirdek döngü

| Ölçek | Oyuncu ne yapıyor? | Ne hissediyor? |
|---|---|---|
| **Saniyeler** | Tezgâha dokun → para akar → seviye al | Dokunsal tatmin, “tık-tık-ka-çing” |
| **Dakikalar** | Yeni tezgâh aç, kedi müdür işe al, tarif al, kilometre taşına ulaş, martı yakala, vapuru karşıla | Sürekli küçük kazanımlar, hız artıyor |
| **Saatler** | Uygulamadan çık, kediler çalışsın; dönünce “Sen yokken X kazandın!” → topla (×2 reklamla) | Geri dönme sebebi, kasa dolu |
| **Günler** | Semt hedefine ulaş → yeni semte taşın (lale + rozet) → İstanbul turunu tamamla | Büyük ilerleme anları, yeni manzara, yeni tezgâh |

---

## 3. Sistemler

### 3.1 Tezgâhlar (10 adet)

Her tezgâh için: maliyet `c × g^seviye`, gelir `r × seviye`, döngü süresi `t`. Formüller ve bütün sabitler: `src/core/economy.ts`.

| # | Tezgâh | Başlangıç fiyatı | Büyüme | Döngü geliri | Döngü | Kedi müdür |
|---|---|---|---|---|---|---|
| 1 | Simit Arabası | 4 | 1,07 | 1 | 1 sn | **Pamuk** (1.000) |
| 2 | Çay Ocağı | 60 | 1,15 | 60 | 3 sn | **Boncuk** (15.000) |
| 3 | Poğaçacı | 720 | 1,14 | 540 | 6 sn | **Duman** (100.000) |
| 4 | Balık Ekmek Teknesi | 8.640 | 1,13 | 4.320 | 12 sn | **Karamel** (500.000) |
| 5 | Dönerci | 103.680 | 1,12 | 51.840 | 24 sn | **Fıstık** (1,2 M) |
| 6 | Kumpir Tezgâhı | 1,24 M | 1,11 | 388.800 | 60 sn | **Zeytin** (10 M) |
| 7 | Midyeci *(Kadıköy’de açılır)* | 14,9 M | 1,10 | 3,5 M | 3 dk | **Paşa** (111 M) |
| 8 | Maraş Dondurmacısı *(Balat)* | 179 M | 1,09 | 35 M | 10 dk | **Minnoş** (555 M) |
| 9 | Lokumcu *(Sultanahmet)* | 2,15 B | 1,08 | 315 M | 30 dk | **Tarçın** (10 B) |
| 10 | Kebap Salonu *(Beşiktaş)* | 25,8 B | 1,07 | 5,8 B | 2 sa | **Sultan** (100 B) |

- **Satın alma modları:** ×1, ×10, ×100, **Sonraki** (bir sonraki kilometre taşına kadar) ve **Maks**. Butona basılı tutunca art arda alır.
- **Dokunma:** Müdürü olmayan tezgâh, her dokunuşta bir döngü çalıştırır. İlk dakikaların dokunsal oyunu budur.

### 3.2 Kilometre taşları ve mahalle şenlikleri

- **Hız ×2:** 25, 50, 100, 200, 300 ve 400. seviyelerde tezgâhın döngüsü yarıya iner (toplam ×64).
- **Kâr ×2:** 500. seviyeden sonra her 100 seviyede.
- **Mahalle Şenliği:** O semtte açık **bütün** tezgâhlar 25, 50, 100, 200 … 1.000. seviyeye ulaşınca **bütün kârlar ×2**. Oyuncuyu sadece en kârlı tezgâha yüklenmek yerine dengeli büyümeye teşvik eder.

### 3.3 Tarifler (nakit yükseltmeleri)

Her “tur” tarifte her tezgâh için bir **×3** ve herkes için bir **Lezzet Festivali ×3** var. 25 tur, toplam 275 tarif. Fiyatlar her turda 100.000 kat artar. İsimler: Usta Tarifi, Gizli Baharat, Odun Ateşi, Taze Malzeme, Mahalle Meşhuru, Gurme Dokunuş, Saray Usulü, Altın Tepsi, Efsane Lezzet, Kozmik Tarif. “Hepsini al” butonu var.

### 3.4 Kedi müdürler

Kedi işe alınan tezgâh **sonsuza kadar kendi kendine çalışır** ve uygulama kapalıyken de kazanır (çevrimdışı kazanç). Her kedinin bir kişiliği var: bembeyaz **Pamuk** (kırmızı fular), nazar boncuklu **Boncuk**, aşçı şapkalı **Duman**, balıkçı kasketli **Karamel**, döner ustası **Fıstık**, bandanalı kara kedi **Zeytin**, fesli beyefendi **Paşa**, kurdeleli Siyam **Minnoş**, yuvarlak gözlüklü **Tarçın** ve bir gözü mavi bir gözü kehribar taçlı Van kedisi **Sultan**. İlk kedi işe alınınca kutlama ekranı çıkar ve bildirim izni bu mutlu anda istenir.

### 3.5 Semtler, lale ve semt rozeti (prestij)

- **İstanbul turu:** Karaköy (sabah) → Kadıköy (öğle) → Balat (ikindi) → Sultanahmet (altın saat) → Beşiktaş (gün batımı) → Galata (alacakaranlık) → Ortaköy (gece, ışıklı köprü) → Adalar (şafak). Adalar’dan sonra tur ★2 ile yeniden başlar.
- **Semt hedefi:** Her semtte bir kazanç hedefi var (ör. Karaköy 1,9 B). Hedefe ulaşınca “Taşın” açılır.
- **Taşınınca:** Nakit, tezgâhlar, kediler ve tarifler sıfırlanır. **Kalanlar:** lale, altın, rozetler, satın alımlar.
  - **Lale 🌷:** Toplam kazanca göre `150 × (ömür boyu kazanç / 10^10)^0,4`. Her lale gelire **+%2**.
  - **Semt rozeti:** Tamamlanan her semt **kalıcı ×2**. Böylece her taşınma (geç oyunda bile) en az ×2 hissettirir.
- **İlk 5 semt yeni tezgâh açar** (Karaköy’de 6 tezgâh, Kadıköy’de Midyeci …). Her taşınma yeni içerik getirir.
- Taşınma ekranı, taşındıktan sonraki gelir çarpanını açıkça gösterir (ör. “Taşındıktan sonra gelir: ×9,5”).

### 3.6 Canlı olaylar: martı ve vapur

- **Martı:** İlk kedi işe alındıktan sonra her 70–140 saniyede bir, simit kapmış bir martı gökyüzünden geçer. Dokunursan **60 saniyelik potansiyel gelir** düşürür. %12 ihtimalle **altın martı** gelir ve 5 altın verir.
- **Vapur:** İki kedi müdürden sonra her 5–8 dakikada bir vapur yanaşır. Dokunursan **izdiham saati** başlar: 30 saniye boyunca gelir ×3 (korna sesi, ekranda altın parıltı).
- İkisi de “uygulamayı açık tutma” sebebi ve ilk görüldüklerinde Tekir kısa bir ipucu verir.

### 3.7 ×2 Çifte Kazanç

Ödüllü reklam başına **2 saat ×2 gelir**, en fazla 8 saate kadar birikir. Hızlandırma süresi uygulama kapalıyken de geçer ve çevrimdışı kazancı da ikiye katlar. Reklamsız Ödüller ve Kedi Kulübü sahipleri reklamsız alır.

### 3.8 Çevrimdışı kazanç ve kasa

- Uygulamaya dönünce “Tekrar hoş geldin! Sen yokken kedilerin X kazandı” ekranı çıkar: **Topla** veya **×2 Topla** (ödüllü reklam).
- **Kasa kapasitesi:** 4 saat → 6 → 8 → 12 → 24 saat (altınla yükseltilir; Kedi Kulübü’nde 24 saat). Kasa dolunca “Kasan doldu!” bildirimi gelir. Idle türünün en güçlü geri getirme kancası budur.
- Saat geri alınırsa kazanç verilmez. İleri alınırsa kazanç kasa kapasitesiyle sınırlıdır.

### 3.9 Altın 🪙 (premium para) ve zaman atlama

Altınla: **zaman atlama** (1 sa = 30, 4 sa = 100, 24 sa = 500 altın; o kadar saatlik boşta kazancı anında verir) ve **büyük kasa**. Altın; günlük ödül, görevler, başarımlar, altın martı, ödüllü reklam (günde 3 × 10) ve IAP ile gelir. Ayrıntı: `docs/09`.

### 3.10 Günlük sistemler

- **7 günlük giriş takvimi:** 10, 15 altın → 2 sa ×2 → 25 altın → 1 sa kazanç → 35 altın → **75 altın + 4 sa kazanç**. Gün kaçırılırsa seri sıfırlanır.
- **Günlük görevler (3 + sandık):** dokunma, seviye alma, kedi işe alma, tarif, martı, vapur, hızlandırma, kilometre taşı. Her gün tarih tohumuyla aynı görevler gelir ve imkânsız görev (ör. bütün kediler zaten işe alınmışken “2 kedi al”) verilmez. Sandık: 25 altın + 1 sa kazanç.
- **Başarımlar:** tezgâh seviyeleri, şenlikler, semtler, toplam kazanç, kedi, martı, vapur ve dokunma sayıları. Hepsi altın verir.

---

## 4. Tempo (botla kalibre edildi)

Ekonomiyi hissiyatla değil **simülasyonla** ayarladık. `scripts/bot.ts`, mantıklı bir insan gibi oynayan bir bot: en kârlı boştaki tezgâha dokunur, geri dönüşü en hızlı olanı satın alır, kedi işe alır ve hedefe ulaşınca taşınır.

1. **Kalibrasyon** (`npm run calibrate`): Gündelik oyuncu profili (günde 15 saat boyunca 2 saatte bir 6 dakika, 4 saatlik kasa, reklam ve satın alma yok) semt semt oynatıldı. Her semt hedefi, bu oyuncunun o semtte **hedef süre** sonunda kazandığı tutar olarak kaydedildi: ilk taşınma 3 saat, sonra 5, 7, 10 … Adalar 28 saat. Sonuç: `src/core/goals.json`.
2. **Doğrulama** (`npm run simulate` → `scripts/pacing-report.txt`): Farklı profiller 30 gün oynatıldı.

**İlk oturum (aktif, reklamsız):**

| Süre | Olay |
|---|---|
| 25 sn | Çay Ocağı açıldı |
| 55 sn | İlk kedi (Pamuk) işe alındı |
| 1 dk 24 sn | Boncuk; 1 dk 31 sn Balık Ekmek |
| 4 dk 30 sn | İlk tarif |
| 14 dk 38 sn | Kumpir Tezgâhı + ilk Mahalle Şenliği |
| ~21 dk | Karaköy hedefi (1,9 B): **ilk taşınma mümkün** |

İlk 10 dakikada dakikada 6–43 satın alma oluyor. Oyuncu hiç boş kalmıyor.

**Semt ilerlemesi (gerçek takvim):**

| Profil | 1. gün | 3. gün | 7. gün | 14. gün | 30. gün |
|---|---|---|---|---|---|
| Hafif (4 saatte bir 5 dk) | 2 semt | 4 | 7 | 10 | 16 |
| Gündelik (2 saatte bir 6 dk) | 3 | 6 | 9 (Tur 2) | 13 | 19 |
| Bağlı (90 dk’da bir 10 dk, reklamlı ×2) | 5 | 10 | 17 | 25 | 45 |
| Ödeyen (bağlı + kalıcı ×12) | daha hızlı, çarpanlar 30 günde ~10^15 kat yüksek | | | | |

- Gündelik oyuncu İstanbul turunu (8 semt) **~5. günde** bitiriyor. Sonra Tur 2 ve Tur 3 başlıyor ve her semt 2–5 gün sürüyor. Bu, “her gün geri gel” ritmi.
- Her taşınma geliri **×5 ile ×140** arasında artırıyor (ilk semtlerde daha büyük). Taşınma hep ödüllendirici hissettiriyor.
- Sayılar 30. günde ~10^66’ya, uzun vadede 10^300’e kadar büyüyebiliyor (biçimlendirme K, M, B, T, Qa … Dc, sonra aa, ab … zz).

---

## 5. İlk kullanım deneyimi (öğretici)

Tekir, her şeyi tam ihtiyaç anında ve tek tek anlatır. Bir pati ilgili butonu gösterir ve oyuncu bir şey yapınca adım biter. Girdi hiç engellenmez.

1. “Merhaba, ben Tekir! … Simit satmak için arabaya dokun!”
2. “Harika! Bir seviye daha al.”
3. “Çaysız simit olur mu? Çay Ocağı’nı aç.”
4. “Pamuk’la tanış! Kedi müdürler sen yokken bile satış yapar.” (Kediler sekmesine yönlendirir)
5. “Tarifler kârını üçe katlar.”
6. “×2’ye dokun, gelirini 2 saat ikiye katla.”
7. “Karaköy hedefi tamam! Kadıköy’e taşın.”

Ek ipuçları: ilk martı, ilk vapur.

---

## 6. Sanat ve ses

- **Görsel kimlik:** Sıcak İstanbul kafesi: krem kâğıt, Boğaz laciverti, simit turuncusu, çay kırmızısı, lale pembesi. Font: **Baloo 2** (yuvarlak, samimi, Türkçe karakterli).
- **Her şey vektör (SVG):** 10 yemek ikonu, 10 kedi portresi (aksesuarlı), Tekir, martı, vapur ve 8 semt silüeti (Galata Kulesi, Yeni Cami, Haydarpaşa, Kız Kulesi, Balat evleri ve Fener Rum Lisesi, Ayasofya, Sultanahmet, Dolmabahçe saat kulesi ve sarayı, Boğaz Köprüsü, Ortaköy Camii, Adalar köşkleri ve deniz feneri). Bulutlar, yıldızlar ve su ışıltısı canlandırılmış.
- **Ses tamamen sentezlenmiş (Web Audio):** para şıngırtısı, yazar kasa “ka-çing”, martı çığlığı, vapur düdüğü, sentezlenmiş **miyav**, zurna-davul şenlik fanfarı. Müzik: Nihavend makamında prosedürel bir kafe döngüsü (ud, bas, bendir). Lisans maliyeti sıfır, indirme boyutu çok küçük.

---

## 7. Teknik notlar

| Katman | Dosyalar |
|---|---|
| Ekonomi (saf fonksiyonlar) | `src/core/economy.ts`, `goals.json`, `districts.ts` |
| Oyun kontrolcüsü ve meta | `src/meta/game.ts`, `state.ts`, `daily.ts`, `achievements.ts`, `catalog.ts` |
| Servisler | `src/services/ads.ts` (sadece ödüllü), `iap.ts` (RevenueCat), `notify.ts`, `review.ts`, `audio.ts` |
| Arayüz | `src/ui/` (HUD, sekmeler, diyaloglar, öğretici, efektler), `art.ts`, `skyline.ts`, `logo.ts` |
| Testler | 41 birim testi (`tests/`), 25 kontrollü uçtan uca oynanış (`e2e/play.mjs`), görsel tur (`e2e/tour.mjs`) |
| Denge araçları | `scripts/bot.ts`, `calibrate.test.ts`, `simulate.test.ts`, `alpha.test.ts` |

- Kayıt: Capacitor Preferences (web’de localStorage). Bozuk veya oynanmış kayıt `sanitize()` ile onarılır.
- Hızlı tezgâhlar kare başına analitik olarak hesaplanır (milisaniyelik döngüler bile 60 fps’de akıcı).
- Tablet: arayüz `--z` ölçeğiyle büyür. `prefers-reduced-motion` destekleniyor.

---

## 8. Yol haritası (LiveOps)

| Sürüm | İçerik |
|---|---|
| **1.1** | Sezon kartı (“Boğaz Pass”, Lokum Blast’taki altyapıyla), haftalık etkinlik semti (ör. “Ramazan Sokağı”: iftariye, pide, güllaç tezgâhları ve geçici para birimi) |
| **1.2** | Kedi Albümü: kedi kostümleri (koleksiyon), Kız Kulesi’nde “simit fırını” mini oyunu |
| **1.3** | Haftalık lider tablosu (kazanç hızına göre), arkadaş kodu |
| **2.0** | Yeni şehirler: İzmir (boyoz, kumru), Ankara, Trabzon (hamsi) |

KPI hedefleri ve gelir senaryoları için bkz. `docs/09`.

---

## Kaynaklar

- Planet Merge – Space Puzzle (Godspear) ve Sputnika: App Store / Google Play mağaza sayfaları (benzer dairesel birleştirme oyunları).
- PocketGamer.biz (“Eatventure vs Cat Snack Bar”) ve Global Games Forum: Eatventure ve Cat Snack Bar’ın indirme ve gelir rakamları.
