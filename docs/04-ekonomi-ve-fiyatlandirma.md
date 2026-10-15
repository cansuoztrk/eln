# 04 · Ekonomi, Fiyatlandırma ve Reklam Stratejisi (Lokum Blast)

Bu belge oyundaki **bütün satın alınabilir öğeleri**, **Türkiye’ye özel TL fiyatlarını**, oyun içi para dengesini ve reklam yerleşimini anlatıyor. Kodda tek bir yerde tanımlı: `games/lokum-blast/src/meta/catalog.ts` ve `src/meta/economy.ts`.

---

## 1. Para birimleri

| Birim | Nasıl kazanılır | Nereye harcanır | Satın alınabilir mi? |
|---|---|---|---|
| 🪙 **Altın** (yumuşak para) | Oyun, günlük hediye, çark, görevler, altın lokum, ödüllü reklam | Güçlendirici, devam etme, +5 hamle, can doldurma, tema | ✅ |
| ⭐ **Yıldız** (ilerleme) | Yolculuk seviyeleri (1–3 yıldız) | Kapalıçarşı restorasyonu | ❌ (sadece oynayarak kazanılır, adil ilerleme) |
| ❤️ **Can** (enerji) | 25 dakikada 1 yenilenir, en fazla 5 | Yolculuk seviyesi kaybedilince 1 can gider | Dolaylı: altın, VIP veya paketlerdeki sınırsız can |

> Yıldızın satılmaması bilinçli bir tasarım kararı. Çarşı ilerlemesi “emek” hissini korur ve paralı oyuncu sadece **zaman ve konfor** satın alır. Bu, uzun vadede tutundurmayı korur.

## 2. Altın dengesi: kaynaklar ve harcamalar

Ödeme yapmayan aktif bir oyuncu günde **400–600 altın** kazanır. Bu, günde 2–3 güçlendirici demek. Oyuncu “bir tane daha olsa…” hissini yaşar ve satın alma ya da reklam izleme motivasyonu bu boşluktan doğar.

| Kaynak | Miktar | Günlük tahmin |
|---|---|---|
| Klasik oyun bitişi | puan ÷ 250 (ör. 10.000 puan → 40) | 60–120 |
| Altın lokum | 5 altın / adet | 20–60 |
| Seviye kazanma | 30–60 (Usta seviyesi 120) + kalan hamle × 2 | 100–250 |
| Günün Bulmacası | 150 | 150 |
| Günlük hediye (7 gün döngü) | 50 → 500 | ortalama ~190 |
| Çark (1 bedava + 2 reklamla) | 25–250 veya güçlendirici | ~50–150 |
| Görevler + sandık | 50–150 × 3 + 200 | 300–550 (tamamlarsa) |
| Ücretsiz hediye (reklam) | 60 × 5/gün | 0–300 |
| Ödül ekranında 2 kat altın (reklam) | kazancın tamamı kadar | +%100 |

| Harcama | Fiyat |
|---|---|
| Geri Al / Çekiç / Yenile / Nar Bombası | 120 / 180 / 220 / 300 (3’lüde %10 indirim) |
| Devam et (klasik veya yer kalmadı) | 200 → 400 → 800 (aynı oyunda artarak) |
| +5 hamle | 250 → 500 → 900 |
| Canları doldur | 350 |
| Kedi Patisi teması | 2.500 |
| Gece Çarşısı teması | 6.000 |

## 3. Uygulama içi ürünler (IAP): Türkiye’ye özel fiyatlarla

### Neden Türkiye’ye ayrı fiyat?

1. **Otomatik çevrim çok pahalı kalıyor.** Apple ve Google, USD fiyatı kurla TL’ye çeviriyor. Ancak Türkiye’de alım gücü düşük, bu yüzden otomatik fiyat yerel gözle **2 kat pahalı** algılanıyor ve dönüşüm çöküyor. Bir fiyat yerelleştirme kaynağı, 19,99 $’lık bir ürün için otomatik ₺999,99 yerine **yerel ₺449** öneriyor, yani yaklaşık %55 daha düşük ([PricePush](https://pricepush.app/blog/app-store-pricing-by-country)).
2. **Kur oynaklığı.** Apple, kur değiştiğinde otomatik TL fiyatlarını kendisi günceller ve fiyat bir gecede pahalanabilir. **Elle sabitlenen TL fiyatı** bu sürprizden korur ([AppsOps](https://appsops.store/blog/app-store-pricing-currency-volatile-markets)). 2026’da Türkiye’de dijital hizmet vergisi de değişti ([Mirava](https://www.mirava.io/blog/apple-app-store-price-tiers-how-they-work-2026)).
3. **Psikolojik eşikler.** Türk kullanıcı için ₺25, ₺50 ve **₺100’ün altı** kritik kırılma noktaları. “Reklamsız” ürününü bu yüzden **₺99,99**’a koyduk.
4. **Referans fiyatlar (2026):** Apple Music TR ≈ ₺60/ay, ChatGPT Plus TR ≈ ₺499,99/ay ([kaynak](https://rachelwithai.com/chatgpt-plus-subscription-price-turkey/)). Bir mobil oyun aboneliği bunların arasında, ₺100 civarında olmalı.

**Varsayım:** Ekim 2026 için 1 USD ≈ 46 TL. Yayından önce App Store Connect’teki güncel fiyat noktalarını kontrol et ve en yakın noktayı seç. Yerel fiyat ≈ otomatik çevrimin **%45–50**’si.

### Tam ürün listesi

| Ürün ID | Ad (TR) | İçerik | Tür | **USD (baz)** | Otomatik TL (≈) | **🇹🇷 Önerilen TL** |
|---|---|---|---|---|---|---|
| `coins_600` | Bir Avuç Altın | 600 altın | Tüketilir | **$0.99** | ~₺45 | **₺24,99** |
| `coins_1500` | Altın Kesesi | 1.500 altın (+%25) | Tüketilir | **$1.99** | ~₺90 | **₺49,99** |
| `coins_4500` | Altın Sandığı | 4.500 altın (+%50) | Tüketilir | **$4.99** | ~₺230 | **₺119,99** |
| `coins_10000` | Bakır Kazan ⭐ *En popüler* | 10.000 altın (+%65) | Tüketilir | **$9.99** | ~₺460 | **₺229,99** |
| `coins_22000` | Saray Hazinesi | 22.000 altın (+%80) | Tüketilir | **$19.99** | ~₺920 | **₺449,99** |
| `coins_60000` | Sultanın Hazinesi 🏆 *En iyi değer* | 60.000 altın (+%100) | Tüketilir | **$49.99** | ~₺2.300 | **₺999,99** |
| `starter_pack` | Hoş Geldin Paketi *(tek sefer, 72 saat)* | 2.500 altın + her güçlendiriciden 3 + 24 saat sınırsız can | Tüketilir (tek sefer) | **$1.99** | ~₺90 | **₺49,99** |
| `bundle_usta` | Usta Paketi | 6.000 altın + her güçlendiriciden 5 + 6 saat sınırsız can | Tüketilir | **$6.99** | ~₺320 | **₺159,99** |
| `bundle_sultan` | Sultan Sandığı | 25.000 altın + her güçlendiriciden 15 + 72 saat sınırsız can | Tüketilir | **$24.99** | ~₺1.150 | **₺549,99** |
| `no_ads` | Reklamsız Paket | Zorunlu reklamlar kalıcı olarak kalkar + 1.000 altın | Tüketilmez | **$4.99** | ~₺230 | **₺99,99** |
| `theme_saray` | Altın Saray Teması | Premium mücevher teması | Tüketilmez | **$2.99** | ~₺140 | **₺69,99** |
| `vip_monthly` | Tekir Kulübü (Aylık) | Bkz. §4 | Otomatik yenilenen abonelik | **$5.99/ay** | ~₺275 | **₺99,99/ay** |
| `vip_yearly` | Tekir Kulübü (Yıllık) | Bkz. §4 (%44 tasarruf) | Otomatik yenilenen abonelik | **$39.99/yıl** | ~₺1.840 | **₺699,99/yıl** |

**Değer merdiveni:** 0,99 $ = 600 altın taban kur. Paket büyüdükçe dolar başına altın artar: 606 → 754 → 902 → 1.001 → 1.100 → 1.200. Oyuncu büyük paketin “mantıklı” olduğunu görür ve ortalama sepet büyür.

**Hoş Geldin Paketi neden çok cömert?** Oyuncunun **ilk ödemesi** en zor olanı. İlk ödemeyi yapan kişinin ikinci ödemeyi yapma olasılığı çok daha yüksek. Paket 3. seviye kazanılınca açılıyor (oyunu sevdiğini kanıtlamış oyuncuya) ve 72 saat sürüyor.

### Diğer gelişmekte olan pazarlar için öneri

Türkiye ile aynı mantığı (otomatik çevrimin bir oranı) aşağıdaki pazarlara da uygula. Batı pazarlarında (ABD, AB, Birleşik Krallık, Japonya, Kore, Avustralya) otomatik fiyatlar kalabilir.

| Pazar | Önerilen oran (otomatik fiyata göre) |
|---|---|
| 🇹🇷 Türkiye | %45–50 |
| 🇧🇷 Brezilya, 🇲🇽 Meksika | %60–70 |
| 🇮🇩 Endonezya, 🇵🇭 Filipinler, 🇻🇳 Vietnam | %45–55 |
| 🇮🇳 Hindistan, 🇪🇬 Mısır, 🇵🇰 Pakistan | %35–45 |
| 🇦🇷 Arjantin | %40–50 (kur nedeniyle sık güncelle) |

## 4. Tekir Kulübü (VIP abonelik)

| Ayrıcalık | Değeri |
|---|---|
| Zorunlu reklam yok | Reklamsız paketin (₺99,99) içeriği |
| Her gün 250 altın + her güçlendiriciden 1 | Ayda ~7.500 altın + 120 güçlendirici ≈ 30.000+ altın değerinde |
| Sınırsız can | Yolculuk modunda kesintisiz oyun |
| Altın Saray teması | ₺69,99 değerinde |
| Çarkta 2 kat ödül | — |

- **Fiyat:** ₺99,99/ay veya **₺699,99/yıl** (ABD’de $5.99 / $39.99).
- **Tanıtım teklifi (App Store “Introductory Offer”):** İlk ay **₺49,99**, “ödedikçe öde” tipinde. Abonelik dönüşümünü ciddi artırır.
- **Günlük giriş zorunluluğu:** Hediye her gün **uygulamaya girince** alınıyor. Abonelik böylece aynı zamanda bir **tutundurma** aracı olur.
- Mağaza kuralları gereği satış ekranında yenileme ve iptal metni gösteriliyor (oyunda mevcut).

## 5. Reklam stratejisi (AdMob + mediation)

### Yerleşimler

| Tür | Nerede | Kural | Kimde kapalı |
|---|---|---|---|
| 🎬 **Ödüllü video** | Devam et, +5 hamle, 2 kat altın, +1 can, çark, ücretsiz hediye (günde 5), +1 güçlendirici | **Her zaman isteğe bağlı**, her zaman değerli | Hiç kimsede (VIP de izleyebilir) |
| 📺 **Geçiş reklamı (interstitial)** | Sadece doğal molalarda: oyun sonu ya da seviye sonu, “Ana Sayfa / İleri” basıldıktan sonra | İlk 3 oyunda **yok**, 8. seviyeden önce yok, en az **120 saniye** aralık, klasikte her 2 oyunda bir, yolculukta her 2 seviyede bir | Reklamsız Paket, Tekir Kulübü |
| 🏷️ Banner | **Kullanılmıyor** | Az kazandırır, oyunu ucuz gösterir ve tutundurmayı düşürür | — |

Bütün eşikler tek yerde, `src/config.ts → ads`. A/B testleriyle ayarlanabilir.

### Uyum (zorunlu)

- **ATT (iOS takip izni)** ve **UMP / GDPR / KVKK onay formu** reklam SDK’sı başlamadan önce gösteriliyor (`services/ads.ts`). Ayarlarda “Reklam gizlilik tercihleri” bağlantısı var.
- Test sırasında **Google’ın resmi test reklam ID’leri** kullanılıyor. Kendi ID’lerin ancak yayında devreye girmeli, yoksa AdMob hesabın askıya alınabilir.
- **Mediation:** AdMob + AppLovin MAX / Unity / Meta Audience Network / Mintegral ağları eklenince doluluk ve gelir belirgin şekilde artar.

## 6. Hedef metrikler (KPI)

| Metrik | Hedef | Neden önemli |
|---|---|---|
| D1 retention | ≥ %40 | İlk izlenim ve öğretici kalitesi |
| D7 retention | ≥ %15 | Meta ve günlük sistemlerin gücü |
| D30 retention | ≥ %6 | Uzun vadeli değer |
| Günlük oyun süresi | 15+ dk | Reklam gösterim envanteri |
| Ödüllü video / DAU | 2–4 | En “temiz” reklam geliri |
| Ödeme yapan oran | %1,5–3 | IAP geliri |
| ARPDAU (global karışım) | 0,05–0,10 $ | Toplam gelir/oyuncu/gün |

### Örnek gelir senaryosu *(tahmin, garanti değildir)*

| Günlük aktif oyuncu | ARPDAU 0,04 $ (temkinli) | ARPDAU 0,08 $ (iyi) |
|---|---|---|
| 10.000 | ~12.000 $/ay | ~24.000 $/ay |
| 50.000 | ~60.000 $/ay | ~120.000 $/ay |
| 200.000 | ~240.000 $/ay | ~480.000 $/ay |

Brüt rakamlardır. Apple ve Google, yıllık geliri 1 milyon $’ın altındaki geliştiricilerden **%15** (Apple Small Business Program / Google’ın ilk 1 milyon $ dilimi), üstündeki gelirden %30 komisyon alır. Bir yılı dolduran abonelerde oran yine %15’tir. Reklam gelirinde komisyon yoktur ama reklam ağlarının payı fiyata zaten dahildir.

## 7. Adil ve sürdürülebilir para kazanma ilkeleri

- Çarktaki olasılıklar oyunda yazılı (App Store kural 3.1.1, rastgele ödüllerde şeffaflık).
- Her ödüllü reklamın karşılığı **net ve anında** verilir. Reklam gelmezse oyuncu kaybetmez, bir uyarı görür.
- Hiçbir ilerleme sadece parayla açılmıyor: yıldızlar oynayarak kazanılıyor, temalar ise altın veya çarşı ilerlemesiyle de açılıyor (Altın Saray hariç).
- Satış ekranları oyuncuyu **asla** oyun ortasında kesmiyor. Teklifler ana menüde ve doğal molalarda çıkıyor.
