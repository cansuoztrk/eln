# 07 · Büyüme, Pazarlama ve LiveOps Planı

## 1. İlk 1.000 oyuncu (bütçesiz)

1. **TikTok / Reels / Shorts:** Günde 1–2 kısa video. İşe yarayan formatlar:
   - *“Bu hamleyi bulabilir misin?”*: neredeyse dolu tahta, izleyici çözümü yorumlara yazar.
   - *ASMR kombo*: Hicaz makamlı patlama sesleri ve pudra şekeri efekti, ekran kaydıyla.
   - *Tekir karakteri*: fesli kedi animasyonları ve gerçek tekir kedi videolarıyla birleştirilmiş içerik.
   - *“Kapalıçarşı’yı canlandırdım”*: önce ve sonra restorasyon karşılaştırması.
2. **Ekran kaydı otomasyonu:** `e2e/play.mjs` ve `store/capture.mjs` betikleri oyunun istenen anlarını otomatik yakalıyor. Bunları kısa video kurgusu için ham malzeme olarak kullan.
3. **Topluluk:** Reddit (r/puzzlevideogames, r/Turkey), Ekşi Sözlük başlığı, Discord sunucusu, Product Hunt lansmanı.
4. **Basın:** Türk oyun medyası (Mobidictum, Webrazzi, ShiftDelete) ile “İstanbul temalı yerli bulmaca” hikâyesi.

## 2. Ücretli kullanıcı kazanımı (soft launch sonrası)

- **Kural:** Bir oyuncunun getirdiği gelir (LTV), onu kazanmanın maliyetinden (CPI) büyük olmadan büyük bütçe harcama.
- Kanallar: **TikTok Ads**, **Google App Campaigns**, **Meta**, **AppLovin**, **Unity**.
- **Yaratıcı test:** Haftada 5–10 yeni reklam videosu dene, kazanan 1–2 tanesini ölçekle. Bulmaca türünde “fail” videoları (yanlış hamle yapan oyuncu) en düşük CPI’ı getiriyor.
- **Hedef:** D7 ROAS ≥ %25–30 ise ölçekle.

## 3. ASO (mağaza optimizasyonu)

- Başlıkta **“Block Puzzle / Blok Bulmaca”**, alt başlıkta “Brain / Zekâ” anahtar kelimeleri var.
- İkon ve ilk 3 ekran görüntüsünde aylık A/B testi yap (App Store “Ürün Sayfası Optimizasyonu”, Google Play “Mağaza Girişi Denemeleri”).
- Yerelleştirilmiş mağaza sayfaları (DE, ES, FR, PT) dönüşümü belirgin şekilde artırır. Oyun içi çeviriler hazır.
- Puan isteme: 3. seviye kazanılınca ve rekor kırılınca `SKStoreReviewController` / Play In-App Review ile iste. *(Sonraki sürümde eklenecek, bkz. §5.)*

## 4. LiveOps takvimi (ilk 6 ay)

| Zaman | Etkinlik | İçerik |
|---|---|---|
| Her hafta | **Haftalık Turnuva** | Klasik modda haftalık sıralama, ilk %10’a altın ödülü |
| Her ay | **Çarşı Pass** | 28 günlük sezon: ücretsiz ve premium (₺99,99) ödül yolu |
| Ekim | Cadılar Bayramı | Bal kabağı lokum teması, turuncu-mor tahta |
| Kasım | **Kahve Festivali** | Kahvehane bölgesi erken açılış, telve teması |
| Aralık–Ocak | Kış ve Yılbaşı | Kar tanesi lokumlar, kış çarşısı, hediye kutusu etkinliği |
| Şubat | Sevgililer Günü | Kalp desenli seviyeler, gül lokumu çift puan |
| Mart–Nisan | **Ramazan Gecesi** | Fener ve hilal teması, iftar saatine özel günlük bulmaca (saygılı ve kapsayıcı dille) |
| Nisan | **Lale Festivali** | İstanbul lale teması, lale desenli seviyeler |
| Her güncelleme | Yeni çarşı bölgesi | +5 dükkân, +50 seviye |

## 5. Sonraki sürüm (v1.1–1.3) yol haritası

- [ ] **Puan isteme** (in-app review) doğru anda
- [ ] **Game Center / Google Play Games**: sıralama tabloları ve başarımlar
- [ ] **Bulut kayıt**: RevenueCat kullanıcı kimliği ile Firebase/Supabase senkronizasyonu (cihaz değişince ilerleme kaybolmaz)
- [ ] **Analitik**: Firebase Analytics veya GameAnalytics. `track()` çağrıları kodda hazır, sadece bağlanacak.
- [ ] **Remote Config**: reklam sıklığı, fiyat ve zorluk ayarlarını mağaza güncellemesi olmadan değiştirme
- [ ] **Çarşı Pass** (sezon kartı) ve **haftalık turnuva**
- [ ] **Albüm**: Tekir’in İstanbul kartpostal koleksiyonu (koleksiyon metası)
- [ ] Arapça (RTL) ve Japonca dil desteği

## 6. Ölçüm panosu (her gün bakılacak)

| Metrik | Kırmızı alarm | Ne yapılır |
|---|---|---|
| D1 < %35 | Öğretici veya ilk seviyeler | İlk 10 seviyeyi kolaylaştır, ipucunu uzat |
| D7 < %12 | Meta zayıf | Çarşı ödüllerini artır, günlük görevleri kolaylaştır |
| Seviye X’te ani kayıp | Zorluk sıçraması | `scripts/calibrate.test.ts`’de o seviyenin hedefini yükselt |
| Geçiş reklamı sonrası çıkış artışı | Reklam baskısı | `config.ts → ads.minIntervalSec` değerini artır |
| Ödüllü video / DAU < 1,5 | Teklif değeri düşük | Ödül miktarlarını artır, yeni yerleşim ekle |
