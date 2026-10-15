# 03 · Lokum Blast: Oyun Tasarım Belgesi (GDD)

**Mağaza adı:** Lokum Blast: Block Puzzle · **Tür:** Bulmaca / blok bulmaca (hybrid-casual) · **Platform:** iOS, Android (ve PWA) · **Diller:** TR, EN, DE, ES, FR, PT-BR · **Yaş:** 4+ / PEGI 3

## 1. Tek cümlede

> Lokum kareleri 8×8 tahtaya yerleştir, satır ve sütunları patlat, kombolar zincirle. Kazandığın yıldızlarla Tekir’in Kapalıçarşı’daki dükkânlarını yeniden canlandır.

## 2. Oyuncuyu tutan döngüler

```
 ┌──────── ANLIK DÖNGÜ (5–10 sn) ────────┐
 │ parça sürükle → gölge önizleme → bırak │
 │ → patlama + ses + titreşim + puan      │
 └───────────────┬───────────────────────┘
                 ▼
 ┌──────── OYUN DÖNGÜSÜ (2–4 dk) ────────┐
 │ Klasik: rekor kovala                   │
 │ Yolculuk: hedefleri hamle bitmeden yap │
 │ → yıldız + altın + görev ilerlemesi    │
 └───────────────┬───────────────────────┘
                 ▼
 ┌──────── META DÖNGÜ (günler/haftalar) ──┐
 │ yıldız → Kapalıçarşı restorasyonu      │
 │ altın → güçlendirici / tema            │
 │ günlük hediye, çark, görevler, seri    │
 └────────────────────────────────────────┘
```

### “Bir el daha” hissini yaratan mekanizmalar

| Mekanizma | Nerede | Psikolojik etki |
|---|---|---|
| **Gölge önizleme + satır renklenmesi** | `game/scene.ts` | Patlamadan önce ödülü göstererek beklenti oluşturur |
| **Kombo zinciri** (x1.5 … x5) | `core/scoring.ts` | Ustalık hissi verir ve risk almayı ödüllendirir |
| **Rekor kovalama** (“Rekora 230 puan kaldı!”) | Klasik HUD | Hedef gradyanı etkisi: hedefe yaklaştıkça motivasyon artar |
| **Az kaldı** ekranı (“Çok az kaldı!”) | Seviye kaybı | Kayıptan kaçınma: “+5 hamle” teklifinin en güçlü anı |
| **Yardımsever dağıtıcı** | `core/dealer.ts` | Erken oyunda patlatma fırsatları sık gelir, sonra zorlaşır |
| **Altın lokum** | Klasik ve Yolculuk | Değişken ödül: ne zaman çıkacağı belli olmayan bonus |
| **Çarşı restorasyonu** | `meta/bazaar.ts` | Kalıcı ilerleme ve “az kaldı” hissi (4/5 tamamlandı) |
| **Günlük seri + 7. gün büyük hediye** | `meta/daily.ts` | Alışkanlık oluşturur, seriyi bozmak istemezsin |
| **Klasik oyun otomatik kayıt** | `core/session.ts` | Uygulamayı kapatsan da kaldığın yerden devam |

> **Sağlıklı bağlılık ilkesi:** Oyunu bırakılamaz yapan şey **eğlence, ilerleme ve günlük ritüel** olmalı, karanlık desenler değil. Apple ve Google, yanıltıcı zamanlayıcıları, gizli olasılıklı ganimet kutularını ve çocuklara yönelik agresif satışı reddediyor. Bu yüzden çarktaki olasılıklar oyun içinde açıkça gösteriliyor ve ödüllü reklamlar her zaman isteğe bağlı.

## 3. Çekirdek oynanış

- **Tahta:** 8×8. **Tepsi:** her seferinde 3 parça. 3’ü de yerleşince yeni 3 parça gelir.
- **38 parça şekli:** tekli, 2–5’li çubuklar, 2×2 ve 3×3 kareler, 2×3 dikdörtgenler, küçük ve büyük köşeler, L, J, T, S, Z ve çaprazlar (`core/pieces.ts`).
- **Temizleme:** Dolan her satır ve sütun patlar. Satır ve sütun aynı anda patlayabilir.
- **Kaybetme:** Tepside kalan hiçbir parça tahtaya sığmıyorsa oyun biter. Önce **devam etme** teklifi gelir (reklam veya altın).

### Puanlama (`core/scoring.ts`)

| Olay | Puan |
|---|---|
| Yerleştirilen her kare | +1 |
| 1 / 2 / 3 / 4 / 5 sıra aynı anda | 80 / 240 / 480 / 800 / 1200 |
| “Saf Lezzet”: tek renkten oluşan sıra | sıra puanı ×2 |
| Kombo çarpanı | x1 → x1.5 → x2 … en fazla x5 (temizlemesiz 2 hamleye kadar zincir korunur) |
| Tahtayı tamamen temizlemek (“Pırıl Pırıl!”) | +800 |

### Parça dağıtıcı (`core/dealer.ts`)

- Zorluk 0–1 aralığında. Klasik modda puan arttıkça zorluk 12.000 puana kadar yükselir.
- **Çözülebilirlik garantisi:** Belli bir olasılıkla (erken oyunda %97) gelen 3 parçanın hepsinin bir sırayla tahtaya sığabileceği kontrol edilir.
- **Yardım:** Erken oyunda %55 olasılıkla tepside en az bir “satır tamamlayan” parça bulunur.
- **Kalabalık tahta:** Tahta doldukça küçük parçaların gelme olasılığı artar. Bu, haksız yere kaybetme hissini azaltır.

## 4. Modlar

### Klasik (sonsuz)
Rekor kovalama modu ve reklam gelirinin ana motoru. Oyun otomatik kaydedilir, uygulama kapansa bile kaldığın yerden devam edilir.

### Yolculuk (seviyeler)
- **Sonsuz seviye:** Seviyeler, seviye numarasından deterministik olarak üretiliyor (`core/levels.ts`). İlk **300 seviye**, botla simüle edilerek kalibre edildi.
- **Hedef türleri:** puan, belirli bir lezzetten N lokum, **zümrüt** toplama, **kasa** kırma (bazı kasalar 2 vuruşta kırılır). Tahtalar 12 desenle hazır doluyor: kalp, lale, elmas, çerçeve, haç, merdiven…
- **Testere dişi zorluk:** Her 10’luk blokta zorluk yükseliyor. 7. ve 8. seviyeler gergin, 10. seviye **Usta Seviyesi** (daha büyük ödül), 11 ve 12 nefes aldıran kolay seviyeler.
- **Yıldız:** Kalan hamle oranı %30 ve üzeri ise 3 yıldız, %12 ve üzeri ise 2, altı 1 yıldız. Kalan her hamle +50 puan ve +2 altın verir.
- **Canlar:** 5 can, 25 dakikada bir yenilenir. Can sadece **kaybedince** gider (Royal Match modeli).

#### Otomatik denge (profesyonel stüdyo yöntemi)
`npm run calibrate` komutu her seviyeyi açgözlü bir bot ile 16 farklı tohumla oynatıyor:
1. En az takılan tahta varyantını seçiyor (6 aday arasından),
2. Hamle bütçesini, o seviye için hedeflenen kazanma oranına göre ayarlıyor:

| Seviye | Hedef bot kazanma oranı |
|---|---|
| 1–5 | %100 (+%25 ek tolerans) |
| 6–20 | %90 |
| 21–50 | %80 |
| 51–100 | %72 |
| 100+ | %66 |
| Usta seviyeleri | −%12 |
| Ustadan sonraki 2 seviye | +%6 |

Sonuç `core/level-tuning.json` dosyasına yazılıyor. 300. seviyeden sonrası formülle üretiliyor. Gerçek oyuncu verisi gelince hedef oranlar güncellenip tek komutla yeniden kalibre ediliyor.

### Günün Bulmacası
Tarihe göre üretilen, herkes için aynı olan bir seviye. Kazanınca 150 altın, ayrıca bir günlük seri tutuluyor. Can harcamaz.

## 5. Güçlendiriciler (booster)

| Güçlendirici | Etki | Altın fiyatı (1 / 3’lü) |
|---|---|---|
| ↩️ **Geri Al** | Son hamleyi geri alır (5 adıma kadar) | 120 / 320 |
| 🔨 **Çekiç** | Tek bir kareyi kırar (kasaya 1 vuruş) | 180 / 490 |
| 🔄 **Yenile** | Tepsiye 3 yeni parça getirir (çözülebilir garantili) | 220 / 590 |
| 💣 **Nar Bombası** | 3×3 alanı patlatır | 300 / 810 |

Güçlendirici bitince “+” işareti çıkar. Bu, altınla satın almaya ya da ödüllü reklamla 1 adet almaya götüren bir kısayoldur.

## 6. Meta: Kapalıçarşı

12 bölge × 5 adım (tabela, tente, tezgâh, ürünler, fenerler). Her adım çizimi **gözle görülür** şekilde değiştirir. Bölge tamamlanınca Tekir dükkâna oturur ve ödül gelir (altın, güçlendirici, tema, sınırsız can).

| # | Bölge | Ödül |
|---|---|---|
| 1 | Tekir’in Lokumcusu | 300 altın + 2 Çekiç |
| 2 | Çay Ocağı | 400 altın + **İznik Çinisi teması** |
| 3 | Baharatçı | 500 altın + 2 Bomba |
| 4 | Halıcı | 600 altın + **Mozaik Fener teması** |
| 5 | Fenerci | 700 altın + 3 Yenile |
| 6 | Simitçi | 800 altın + 6 saat sınırsız can |
| 7 | Çini Atölyesi | 900 altın + 2 Bomba + 2 Çekiç |
| 8 | Kuyumcu | 1.000 altın + 3 Geri Al + 2 Yenile |
| 9 | Kahvehane | 1.100 altın + 12 saat sınırsız can |
| 10 | Maraş Dondurmacısı | 1.200 altın + 3 Bomba |
| 11 | Balık Ekmek Teknesi | 1.400 altın + 3 Çekiç + 3 Yenile |
| 12 | Saray Kapısı | 3.000 altın + her güçlendiriciden 5 |

12 bölgenin toplam maliyeti **245 yıldız**, yani yaklaşık 110–120 seviye. Yeni bölgeler güncellemelerle eklenecek (LiveOps).

## 7. Günlük sistemler

- **Günlük Hediye (7 gün):** 50 → 80 → 100 + Geri Al → 150 → 200 + Çekiç → 250 + Yenile → **7. gün: 500 + 2 Bomba + Çekiç**. Bir gün kaçırılırsa seri sıfırlanır.
- **Çarkıfelek:** Her gün 1 bedava çevirme, reklam izleyerek 2 ek çevirme. Olasılıklar oyun içinde gösteriliyor (25 altın %24, 50 altın %20, 100 altın %13, 250 altın %6, güçlendiriciler).
- **Günlük Görevler:** 9 şablondan her gün 3 görev seçiliyor (sıra temizle, kombo yap, seviye geç, altın lokum topla, güçlendirici kullan…). 3 görev bitince **sandık**: 200 altın + Çekiç + Bomba.
- **Bildirimler (yerel, sunucu gerekmez):** canlar doldu, günlük hediye/seri hatırlatma (ertesi gün 19:00), 3 ve 7 gün sonra geri kazanım. İzin, **ilk seviye kazanıldıktan sonra** isteniyor, açılışta değil. Bu, izin verme oranını belirgin şekilde artırır.

## 8. Temalar

| Tema | Stil | Nasıl açılır |
|---|---|---|
| Klasik Lokum | Pudra şekerli lokum | Varsayılan |
| Kedi Patisi | Pati kabartmalı lokum | 2.500 altın |
| İznik Çinisi | Osmanlı sekiz köşeli yıldız motifi | Çarşı 2. bölge |
| Gece Çarşısı | Neon | 6.000 altın |
| Mozaik Fener | Vitray / mozaik cam | Çarşı 4. bölge |
| Altın Saray | Kesme mücevher | IAP (₺69,99) veya Tekir Kulübü |

## 9. His ve “juice” detayları

- Sürüklenen parça parmağın **üstünde** taşınır, parmak parçayı kapatmaz. Fareyle oynanırken bu kaldırma azaltılır.
- **Affedici yerleştirme:** Parça tam hizada değilse en yakın geçerli konuma yapışır.
- Patlama dalgası bırakılan noktadan yayılır. Kareler büyüyüp döner ve kaybolur, ardından şeker tozu ve renk parçacıkları saçılır.
- Hedef toplanan öğeler (zümrüt, kasa, lezzet) eğri bir yörüngeyle **HUD’daki hedef ikonuna uçar**. Altın lokumlar da altın sayacına uçar.
- **Sesler:** Tamamen sentezle üretiliyor (lisans riski yok, uygulama boyutu küçük). Kombolar **Hicaz makamında** yükselen çan sesleri çalıyor. Arka plan müziği prosedürel darbuka ve ud loop’u.
- **Titreşim:** Hafif (yerleştirme), orta (2 sıra), güçlü (3 ve üzeri sıra, bomba).

## 10. Teknik mimari

```
games/lokum-blast/
├── src/core/      Saf oyun mantığı (tahta, parçalar, dağıtıcı, skor, seviyeler, bot), test edilebilir
├── src/game/      Canvas render: sahne, sprite önbelleği, efektler, temalar
├── src/meta/      Kalıcı profil, ekonomi, katalog, günlük sistemler, çarşı
├── src/services/  Ses, reklam (AdMob), satın alma (RevenueCat), bildirim, platform
├── src/ui/        DOM ekranları: ana sayfa, oyun, mağaza, çarşı, görevler, diyaloglar
├── src/i18n/      6 dil
├── tests/         Birim testleri (vitest)
├── scripts/       Seviye kalibrasyonu ve denge raporu
├── e2e/           Uçtan uca oynanış testi (Playwright)
└── store/         İkon, splash ve mağaza ekran görüntüsü üreticileri
```

- Ana paket **~57 KB gzip**. Açılış anlık ve düşük donanımlı Android’lerde 60 fps hedefleniyor (sprite’lar bir kez çizilip önbelleğe alınıyor).
- Framework kullanılmadı, saf TypeScript. Capacitor 8 ile iOS ve Android’e paketleniyor.
