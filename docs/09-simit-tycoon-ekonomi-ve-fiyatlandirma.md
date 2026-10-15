# 09 · Simit Tycoon: Ekonomi, Fiyatlandırma ve Reklam Stratejisi

Bu belge Simit Tycoon’daki **bütün para birimlerini**, **satın alınabilir öğeleri**, **Türkiye’ye özel TL fiyatlarını** ve reklam yerleşimini anlatıyor. Kodda tek yerde tanımlı: `games/simit-tycoon/src/meta/catalog.ts` (ürünler ve altın mağazası) ve `src/core/economy.ts` (oyun içi denge).

---

## 1. Para birimleri

| Birim | Nasıl kazanılır | Nereye harcanır | Satın alınabilir mi? |
|---|---|---|---|
| 🪙 **Nakit** (semt parası) | Tezgâhlar, martı, zaman atlama, çevrimdışı kazanç | Tezgâh seviyesi, kedi müdür, tarif | Dolaylı (zaman atlama, kalıcı çarpan) |
| 🟡 **Altın** (premium) | Günlük ödül, görevler, başarımlar, altın martı, ödüllü reklam, IAP | Zaman atlama, büyük kasa | ✅ |
| 🌷 **Lale** (prestij) | Semt taşırken, toplam kazanca göre | Kalıcı +%2 gelir (her biri) | ❌ Sadece oynayarak |
| 🏅 **Semt rozeti** | Her tamamlanan semt | Kalıcı ×2 gelir | ❌ Sadece oynayarak |

> Lale ve rozetin satılmaması bilinçli. İlerlemenin omurgası **emekle** kazanılıyor. Para, sadece **zaman ve konfor** satın alıyor. Idle türünde uzun vadeli tutundurmanın sırrı bu.

## 2. Altın dengesi

Ödeme yapmayan, günde 4–8 kez uğrayan bir oyuncu ilk hafta günde **~150–220**, sonra **~120** altın kazanır. Bu, günde 3–4 tane 1 saatlik zaman atlama demek. Oyuncu “bir atlama daha olsa hedefe yetişirim…” hissini yaşar. IAP ve reklam motivasyonu bu boşluktan doğar.

| Kaynak | Miktar | Günlük tahmin |
|---|---|---|
| 7 günlük giriş takvimi | 10 / 15 / 2 sa ×2 / 25 / 1 sa kazanç / 35 / 75 + 4 sa kazanç | ~23 altın + hızlandırma ve kazanç |
| Günlük görevler (3) + sandık | 10–15 her biri + 25 (+1 sa kazanç) | ~60 |
| Başarımlar | Tezgâh seviyeleri, şenlik, semt, kazanç, kedi, martı, vapur, dokunma | İlk hafta 40–100, sonra 5–20 |
| Altın martı | %12 ihtimalle 5 altın | ~10 |
| Bedava altın (ödüllü reklam) | 10 × günde 3 | 30 |
| Kedi Kulübü | Her gün 30 | 30 (üyelere) |

| Harcama | Fiyat |
|---|---|
| 1 saatlik zaman atlama | 30 altın |
| 4 saatlik zaman atlama | 100 altın (%17 indirimli) |
| 24 saatlik zaman atlama | 500 altın (%31 indirimli) |
| Büyük kasa: 6 / 8 / 12 / 24 saat | 60 / 150 / 350 / 800 altın (toplam 1.360) |

Zaman atlama, **o anki boşta kazancın** (kedili tezgâhlar, kalıcı çarpanlar dahil) X saatini anında verir. Kedi müdür yoksa satılmaz (“Önce bir kedi müdür işe al”). Böylece oyuncu altını boşa harcamaz.

## 3. Uygulama içi ürünler (IAP): Türkiye’ye özel fiyatlarla

Fiyat yöntemi Lokum Blast ile aynı (ayrıntı ve kaynaklar: `docs/04-ekonomi-ve-fiyatlandirma.md` §3): otomatik kur çevrimi Türkiye’de yerel alım gücüne göre yaklaşık **2 kat pahalı** kalıyor. Bu yüzden TL fiyatlar elle, otomatik çevrimin **%45–50**’si civarında ve psikolojik eşiklerde (₺24,99 / ₺49,99 / ₺99,99 …) belirlendi. Varsayım: Ekim 2026 için 1 USD ≈ 46 TL. Yayından önce App Store Connect’teki güncel fiyat noktalarını kontrol et.

| Ürün ID | Ad (TR) | İçerik | Tür | **USD (baz)** | Otomatik TL (≈) | **🇹🇷 Önerilen TL** |
|---|---|---|---|---|---|---|
| `gold_80` | Bir Avuç Altın | 80 altın | Tüketilir | **$0.99** | ~₺45 | **₺24,99** |
| `gold_500` | Altın Kesesi | 500 altın (+%25) | Tüketilir | **$4.99** | ~₺230 | **₺119,99** |
| `gold_1100` | Altın Sandığı ⭐ *Popüler* | 1.100 altın (+%35) | Tüketilir | **$9.99** | ~₺460 | **₺229,99** |
| `gold_2400` | Bakır Kazan | 2.400 altın (+%50) | Tüketilir | **$19.99** | ~₺920 | **₺449,99** |
| `gold_6500` | Saray Hazinesi 🏆 *En avantajlı* | 6.500 altın (+%60) | Tüketilir | **$49.99** | ~₺2.300 | **₺999,99** |
| `gold_14000` | Sultanın Hazinesi | 14.000 altın (+%75) | Tüketilir | **$99.99** | ~₺4.600 | **₺1.999,99** |
| `starter_pack` | Başlangıç Paketi *(tek sefer, 72 saat)* | 300 altın + 24 sa ×2 gelir + 2 sa kazanç | Tüketilir (tek sefer) | **$1.99** | ~₺90 | **₺49,99** |
| `mult_x2` | Sonsuza Dek Gelir ×2 | Kalıcı ×2 (her şeyle katlanır) | Tüketilmez | **$4.99** | ~₺230 | **₺99,99** |
| `mult_x3` | Sonsuza Dek Gelir ×3 | Kalıcı ×3 (×2 ile birlikte ×6) | Tüketilmez | **$9.99** | ~₺460 | **₺199,99** |
| `no_ads` | Reklamsız Ödüller | Bütün video ödülleri reklamsız ve anında + 100 altın | Tüketilmez | **$6.99** | ~₺320 | **₺149,99** |
| `club_monthly` | Kedi Kulübü (Aylık) | Bkz. §4 | Otomatik yenilenen abonelik | **$5.99/ay** | ~₺275 | **₺99,99/ay** |
| `club_yearly` | Kedi Kulübü (Yıllık) | Bkz. §4 (%44 tasarruf) | Otomatik yenilenen abonelik | **$39.99/yıl** | ~₺1.840 | **₺699,99/yıl** |

**Değer merdiveni:** 0,99 $ = 80 altın taban kur. Dolar başına altın paket büyüdükçe artıyor: 81 → 100 → 110 → 120 → 130 → 140. Oyuncu büyük paketin “mantıklı” olduğunu görüyor.

**Neden “Reklamsız Ödüller”?** Simit Tycoon’da zorunlu reklam yok, bu yüzden klasik “reklamları kaldır” ürünü anlamsız olurdu. Bunun yerine idle oyunlarında en çok satan ürünlerden birini satıyoruz: **reklam izlemeden** ×2 hızlandırma, ×2 çevrimdışı kazanç ve bedava altın. Çok reklam izleyen bağlı oyuncu için doğal bir yükseltme.

**Neden Başlangıç Paketi bu kadar cömert?** İlk ödeme en zoru. Paket, oyunu sevdiğini kanıtlamış oyuncuya (ilk semt taşınmasından sonra veya 30 dakika oynadıktan sonra) 72 saatliğine açılıyor. 300 altın tek başına ~₺90 değerinde. Üstüne 24 saat ×2 (≈12 reklam) ve 2 saatlik kazanç var.

**RevenueCat kurulumu:** `no_ads` yetkisi ← no_ads, club_monthly, club_yearly. `club` yetkisi ← club_monthly, club_yearly. `mult_x2` ve `mult_x3` tüketilmez ürünler (satın alma geçmişinden geri yüklenir).

Diğer gelişmekte olan pazarlar için oranlar Lokum Blast belgesindeki tabloyla aynı (Brezilya/Meksika %60–70, Endonezya/Filipinler/Vietnam %45–55, Hindistan/Mısır %35–45).

## 4. Kedi Kulübü (abonelik)

| Ayrıcalık | Değeri |
|---|---|
| Üyeyken gelir ×2 | Kalıcı ×2 ürününün (₺99,99) etkisi, abonelik süresince |
| Tüm ödüller reklamsız | Reklamsız Ödüller’in (₺149,99) içeriği |
| Her gün +30 altın | Ayda 900 altın ≈ ₺229,99’luk paketin %80’i |
| 24 saatlik çevrimdışı kasa | Kasa yükseltmelerinin (1.360 altın) tamamı |

- **Fiyat:** ₺99,99/ay veya **₺699,99/yıl** (ABD’de $5.99 / $39.99).
- **Tanıtım teklifi:** İlk ay **₺49,99** (App Store “Pay as you go”, Play “intro price”).
- Günlük altın uygulamaya girince alınıyor. Abonelik aynı zamanda bir **tutundurma** aracı.
- Satış ekranında otomatik yenileme ve iptal metni, kullanım koşulları ve gizlilik bağlantıları gösteriliyor (Apple 3.1.2 uyumu).

## 5. Reklam stratejisi: sadece ödüllü video

| Yerleşim | Ödül | Sınır |
|---|---|---|
| ×2 Çifte Kazanç | +2 saat ×2 gelir (kapalıyken de geçer) | En fazla 8 saat birikir |
| Çevrimdışı kazanç | ×2 topla | Her dönüşte 1 |
| Bedava altın | +10 altın | Günde 3 |

- **Geçiş (interstitial) ve banner reklamı yok.** Idle oyuncusu oyunu günde defalarca kısa süre açar. Zorunlu reklam bu ritmi bozar ve uygulamayı silme sebebidir. Ödüllü reklam ise oyuncunun **kendi seçtiği** bir takas ve idle türünde izlenme oranı çok yüksek.
- Bağlı oyuncu günde 8–15 ödüllü video izler: 4 hızlandırma (8 saati dolu tutmak için) + 4–8 çevrimdışı ×2 + 3 bedava altın.
- Reklam yüklenemezse oyuncu kaybetmez. “Şu an video yok” uyarısı çıkar.
- **Uyum:** UMP / GDPR / KVKK onay formu ve iOS ATT izni SDK başlamadan önce isteniyor. Ayarlarda “Reklam gizlilik tercihleri” var. Testte Google’ın resmi test reklam ID’leri kullanılıyor (`src/config.ts`).

## 6. Hedef metrikler (KPI)

| Metrik | Hedef | Not |
|---|---|---|
| D1 retention | ≥ %40 | İlk 21 dakikada ilk taşınma: güçlü ilk oturum |
| D7 retention | ≥ %15 | Çevrimdışı kazanç + günlük ödül + İstanbul turu |
| D30 retention | ≥ %7 | Idle türünde uzun kuyruk güçlüdür |
| Günlük oturum | 5+ | “Kasan doldu” bildirimi |
| Ödüllü video / DAU | 4–8 | Gelirin çoğu buradan |
| Ödeme yapan oran | %2–3 | Kalıcı çarpanlar ve başlangıç paketi |
| ARPDAU (global karışım) | 0,06–0,12 $ | Idle türü ortalamasının üst yarısı |

### Örnek gelir senaryosu *(tahmin, garanti değildir)*

| Günlük aktif oyuncu | ARPDAU 0,05 $ (temkinli) | ARPDAU 0,10 $ (iyi) |
|---|---|---|
| 10.000 | ~15.000 $/ay | ~30.000 $/ay |
| 50.000 | ~75.000 $/ay | ~150.000 $/ay |
| 200.000 | ~300.000 $/ay | ~600.000 $/ay |

Brüt rakamlardır. Mağaza komisyonu yıllık 1 milyon $’ın altında %15 (Apple Small Business Program, Google’ın ilk 1 milyon $ dilimi), üstünde %30. Bir yılı dolduran abonelerde %15.

## 7. Adil para kazanma ilkeleri

- **Ganimet kutusu yok.** Hiçbir ücretli ürün rastgele değil. Her satın almada ne alacağın net.
- Altınla alınan her şey (zaman atlama, kasa) oynayarak da kazanılabiliyor.
- Lale ve semt rozetleri satılmıyor. İlerlemenin omurgası oyunda.
- Saat oyunları sınırlı: saat ileri alınırsa kazanç kasa kapasitesiyle sınırlı, geri alınırsa kazanç yok.
- Satış ekranları oyuncuyu asla oyun ortasında kesmiyor. Başlangıç paketi açılış akışında en fazla iki oturumda bir gösteriliyor, gerisi mağaza sekmesinde.
