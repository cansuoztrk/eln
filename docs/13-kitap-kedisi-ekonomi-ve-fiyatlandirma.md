# 13 · Kitap Kedisi: Ekonomi, Fiyatlandırma ve Reklam Stratejisi

Bu belge Kitap Kedisi’ndeki para birimini, satın alınabilir öğeleri, **Türkiye’ye özel TL fiyatlarını** ve reklam yerleşimini anlatıyor. Kodda tek yerde tanımlı: `games/bookcat/src/meta/catalog.ts` (ürünler), `src/meta/economy.ts` (oyun içi fiyatlar), `src/meta/daily.ts` (giriş, görev, Günün Rafı) ve `src/config.ts` (reklam sıklığı).

> **İlke:** Rakiplerin en çok eleştirilen yanı “+10 hamle 1.500 altın, bir galibiyet 50 altın”. Bizde bölümler her zaman çözülebilir, ek hamle ucuz ve reklam oyunu bölmüyor. Para, **zaman ve konfor** satın alıyor, kazanmayı değil.

---

## 1. Para birimi ve takviyeler

| Öğe | Nasıl kazanılır | Nereye harcanır |
|---|---|---|
| 🪙 **Altın** | Galibiyet, Günün Rafı, görevler, sandık, giriş hediyesi, semt ödülü, ödüllü video, IAP | Takviyeler, +10 hamle |
| 💡 **İpucu** | Başlangıçta 3, giriş hediyesi, sandık, paketler | Bir sonraki en iyi hamleyi gösterir |
| 🐾 **Pati** | Başlangıçta 2, giriş hediyesi, sandık, paketler | Açık bir rafın kitabını nereden olursa olsun getirir |
| 📚 **Nadir kitap** | Her semt (10 bölüm) bitince | Koleksiyon (satılmaz) |
| ⭐ **Yıldız** | Bölüm performansı | Gösteriş ve istatistik (satılmaz) |

## 2. Altın dengesi

| Kaynak | Miktar |
|---|---|
| Galibiyet | 20 + kalan hamlenin yarısı (en fazla +30) · Zorlu +15 · Zor bölüm +40 · Tekrar oynanan bölüm ¼ |
| Günün Rafı | 100 + seri bonusu (gün başına +10, en fazla +50) |
| Günlük görevler (3) | Görev başına 40–140 |
| Görev sandığı | 150 + 1 ipucu + 1 pati |
| 7 günlük giriş hediyesi | 40 / 60 / 80+💡 / 100 / 120+🐾 / 150+💡 / 300+💡💡🐾 |
| Semt bitirme | 150 + nadir kitap |
| Bedava altın (ödüllü video) | 60 × günde 5 |

| Harcama | Fiyat |
|---|---|
| +10 hamle (aynı bölümde 1. / 2. / 3. kez) | 200 / 350 / 500 altın |
| İpucu | 100 altın |
| Pati | 180 altın |

**Ödeme yapmayan, günde ~8 bölüm oynayan bir oyuncu** galibiyetlerden ~300, Günün Rafı’ndan ~120, görev ve sandıktan ~350, giriş hediyesinden ortalama ~120 ve semt ödülünden ~120 altın kazanır. Toplam **~1.000 altın/gün** eder (videolarla +300). İlk 50 bölüm cömert, kayıp nadir. 100. bölümden sonra bütçe sıkılaştıkça günde 3–5 kez “az kaldı” anı yaşanır ve bunlar ~800–1.500 altın ister. Oyuncu çoğu gün kendi altınıyla çıkar, bazı günler kısa kalır. Ödüllü video ve IAP motivasyonu bu boşluktan doğar, ama oyuncu kendini **hiçbir zaman sıkışmış** hissetmez: bölümü tekrar oynamak her zaman bedava ve bölüm her zaman çözülebilir.

## 3. Uygulama içi ürünler (IAP): Türkiye’ye özel fiyatlarla

Mağazaların otomatik kur dönüşümü Türkiye’de alım gücünün ~2 katına denk geliyor. Bu yüzden TL fiyatları **elle**, dönüştürülmüş değerin ~%45–50’si civarında psikolojik eşiklere konuyor (Lokum Blast ve Simit Tycoon ile aynı yöntem, bkz. `docs/04`, `docs/09`).

| Ürün kimliği | İçerik | ABD | 🇹🇷 Türkiye | Rozet |
|---|---|---|---|---|
| `coins_600` | 600 altın | $0.99 | **₺24,99** | |
| `coins_1500` | 1.500 altın (+%25) | $1.99 | **₺49,99** | |
| `coins_4000` | 4.000 altın (+%33) | $4.99 | **₺119,99** | |
| `coins_9000` | 9.000 altın (+%50) | $9.99 | **₺229,99** | Popüler |
| `coins_20000` | 20.000 altın (+%67) | $19.99 | **₺449,99** | |
| `coins_55000` | 55.000 altın (+%83) | $49.99 | **₺999,99** | En avantajlı |
| `starter_pack` | 1.500 altın + 5 💡 + 3 🐾 (tek sefer, 72 saat) | $1.99 | **₺49,99** | Bir kez |
| `bundle_kurt` | Kitap Kurdu: 5.000 altın + 10 💡 + 6 🐾 | $6.99 | **₺159,99** | |
| `bundle_sahaf` | Sahaf: 20.000 altın + 30 💡 + 20 🐾 | $24.99 | **₺549,99** | En avantajlı |
| `no_ads` | Reklamsız Okuma: ara reklamlar kalkar + 1.000 altın (kalıcı) | $4.99 | **₺99,99** | |

- Rakibin Türkiye’deki IAP aralığı ₺99,99–₺1.499,99. Bizim giriş fiyatımız **₺24,99**, “ilk satın alma” eşiğini düşürüyor.
- Almanya/İspanya: mağaza otomatik € fiyatlarını kullanır (₺ dışındaki bütün ülkeler USD tabanından).
- `no_ads` **ödüllü videoları kaldırmaz**, çünkü onlar oyuncunun isteğiyle izleniyor (ek hamle, bedava altın, altını 2 katına çıkarma).
- Satın alma ve geri yükleme RevenueCat üzerinden yapılıyor. Kalıcı ürün yalnızca `no_ads`, diğerleri tüketilebilir.

## 4. Reklam stratejisi

| Yerleşim | Kural | Neden |
|---|---|---|
| 🎬 **Ödüllü: +10 hamle** | Kaybedince, bölüm başına en fazla 3 kez | Kaybetme anı en yüksek izleme isteği. Kayıp → tekrar deneme döngüsünü yumuşatır. |
| 🎬 **Ödüllü: altını 2 katına çıkar** | Kazanınca | Pozitif anda, isteğe bağlı |
| 🎬 **Ödüllü: bedava altın** | Mağazada, günde 5 × 60 | Ödeme yapmayanları ekonomiye bağlar |
| 📺 **Ara reklam** | Yalnızca **kazanılan** bölümden sonra, 12. bölümden itibaren, her 3 bölümde bir, en az 150 sn arayla. Kayıptan sonra ve bölüm ortasında **asla** gösterilmez. `no_ads` sahiplerine hiç gösterilmez. | Rakibin 1,8★ puanının sebebi aşırı reklam. Biz ilk 12 bölümü tamamen reklamsız yaşatıp alışkanlık kuruyoruz. |
| 🚫 Banner | Yok | Kart masasını küçültür, değeri düşük |

Onay: AB/EEA/UK ve Türkiye’de Google UMP formu, iOS’ta ATT. Ayarlarda “Reklam gizlilik tercihleri” düğmesi var. Kodda test kimlikleri var, yayından önce `src/config.ts` içinde gerçek AdMob kimlikleriyle değiştirilmeli.

## 5. Hedef metrikler (KPI)

| Metrik | Hedef | Kaldıraç |
|---|---|---|
| G1 / G7 / G30 tutundurma | %40 / %18 / %8 | Öğretici, ilk 12 bölüm reklamsız, Günün Rafı serisi |
| Oturum / gün | 3+ | Günün Rafı, görev sandığı, bildirimler |
| Ödüllü video / DAU | 2,5+ | Kayıpta +10 hamle, 2 kat altın |
| Ara reklam / DAU | 2–3 | Sıklık sınırı (yukarıda) |
| Ödeme dönüşümü | %1,5–2,5 | ₺24,99 giriş, başlangıç paketi, Reklamsız Okuma |

### Örnek gelir senaryosu *(tahmin, garanti değildir)*

Varsayımlar: 10.000 DAU, karışık TR + AB/ABD trafiği. Ödüllü eCPM ~$8, ara reklam eCPM ~$4 (karışık; TR eCPM bunun epey altında), DAU başına 2,5 ödüllü + 2 ara reklam, ödeme dönüşümü %2, ödeyen başına günlük ortalama $0,35.

- Reklam: 10.000 × (2,5 × $0,008 + 2 × $0,004) ≈ **$280/gün**
- IAP: 10.000 × %2 × $0,35 ≈ **$70/gün** (mağaza payı öncesi)
- Toplam ≈ **$350/gün ≈ $10.500/ay**. Türkiye ağırlıklı bir kitlede reklam geliri belirgin şekilde düşük olur. Bu yüzden ilk günden 4 dilde (DE/ES yüksek eCPM) çıkıyoruz.

## 6. Adil para kazanma ilkeleri

1. **Her bölüm, reklamsız ve satın almasız çözülebilir** (bot kanıtı, test ve kalibrasyon raporu: `games/bookcat/scripts/calibration.txt`).
2. Can sistemi ve bekleme süresi yok.
3. Geri al bedava. Kaybedince tekrar oynamak bedava.
4. Ek hamle (video veya altınla) kullanılan bölüm ★ ile biter. Yıldızlar ustalığı ölçer, para ile alınmaz.
5. Ara reklam asla bölüm ortasında veya kayıptan sonra çıkmaz.
6. Fiyatlar her zaman mağazanın yerel fiyatıyla gösterilir. Sahte “indirim” sayacı yok, başlangıç paketi gerçekten tek seferlik.
7. Çocuklara yönelik değil (genel kitle). Rastgele ödül kutusu (loot box) yok.
