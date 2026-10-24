# Durum raporu: gerçek veri, test verisi, eksikler ve sonraki adımlar

Tarih: 24.10.2026

## Kısa özet

**Yazılım tamam ve çalışıyor; gerçek fiyat verisi henüz yok.**

- Kod; ingestion hattı, fiyat mantığı, görevler, arayüz, hesaplar ve yönetim paneli dâhil olmak
  üzere uçtan uca çalışıyor ve testleri geçiyor.
- **Şu anda hiçbir kaynaktan gerçek fiyat verisi akmıyor.** Bunun nedeni, gerekli hesapların ve API
  anahtarlarının bu ortamda bulunmaması; kod tarafında eksik yok.
- Demo ortamında görünen tüm ürün, fiyat, kupon ve uçuşlar **"Test verisi"** etiketli kurgusal
  kayıtlardır. Markalar ve mağazalar uydurmadır ve gerçek bir ürünü temsil etmez.

## Kaynak bazında

| Kaynak | Kod | Gerçek veriyle çalıştı mı? | Gerçek veri için yapılacak |
|---|---|---|---|
| Amazon Türkiye (Creators API) | Hazır | **Hayır**: anahtar yok; sahte yanıtlarla test edildi | Associates hesabı → nitelikli satış → Creators API kaydı → 3 ortam değişkeni |
| Trendyol | Feed ile çalışmaya hazır | **Hayır**: resmî erişim yolu doğrulanamadı | Veri ortaklığı veya yetkili ağdan feed → `TRENDYOL_PARTNER_FEED_URL` |
| Hepsiburada | Feed ile çalışmaya hazır | **Hayır**: resmî erişim yolu doğrulanamadı | Aynı şekilde → `HEPSIBURADA_PARTNER_FEED_URL` |
| Diğer mağazalar (ürün feed'i) | Hazır | **Hayır**: feed adresi yok; yerel test sunucusuyla uçtan uca test edildi | Mağaza/ağdan feed izni → panelden ekle |
| Travelpayouts | Hazır | **Hayır**: token yok; sahte yanıtlarla test edildi | Ücretsiz kayıt → `TRAVELPAYOUTS_TOKEN` |
| Duffel | Hazır | **Hayır**: anahtar yok; sahte yanıtlarla test edildi | Hesap → `DUFFEL_ACCESS_TOKEN` (ücretli kullanım) |
| Test (fixture) kaynakları | Hazır | Yalnızca test | — |

Anahtar tanımlandığı anda kaynak otomatik olarak devreye girer:

- worker bir sonraki planlı çalışmada veriyi çeker;
- yönetim panelinde durum "Bağlı" olur;
- test verisi üretimde zaten gizlidir.

## Özellik bazında

| Özellik | Durum | Not |
|---|---|---|
| Ürün fırsatları, kategori, arama (yazım hatası toleranslı, doğal dil: "1500 TL altı kablosuz mouse") | Çalışıyor | Test verisiyle doğrulandı |
| Filtreler (fiyat, doğrulanmış indirim, fırsat türü, marka, mağaza, stok, kupon, tazelik) ve sıralamalar; URL'de saklanır | Çalışıyor | e2e testli |
| Ürün detayı: fiyat geçmişi grafiği (30/90/180 gün + tablo), istatistikler, mağaza karşılaştırması (kargo dâhil), kupon, puan dökümü, alarm, benzer ürünler, veri kaynağı | Çalışıyor | |
| Ürün karşılaştırma (4 ürüne kadar), kuponlar, popüler, mağaza sayfaları | Çalışıyor | |
| Doğrulanmış indirim, şişirilmiş liste fiyatı tespiti, fırsat puanı, etiketler | Çalışıyor | Birim + entegrasyon testli |
| Ürün eşleştirme (GTIN/MPN/aile/başlık) ve inceleme kuyruğu | Çalışıyor | |
| Görev sistemi (planlayıcı, kuyruk, yeniden deneme, kurtarma, tekilleştirme, kota/hız sınırı, günlükler) | Çalışıyor | Docker'da worker ile doğrulandı |
| Uçuş arama: tek yön/gidiş-dönüş, yolcu, kabin, aktarmasız, ±1-3 gün esnek tarih, fiyat takvimi | Çalışıyor | Yalnızca test sağlayıcısıyla |
| Uçuş keşif bölümleri (şehir çıkışlı, yurt dışı, hafta sonu, direkt, yakın tarih, fiyatı düşen rotalar), rota sayfaları | Çalışıyor | "Fiyatı düşen rotalar" 7 günlük gerçek kayıt birikmeden boş kalır (uydurulmaz) |
| Hesaplar: kayıt, giriş, parola sıfırlama, favoriler, fiyat ve uçuş alarmları, kayıtlı aramalar, ilgi alanları, bildirimler, haftalık özet, veri indirme, hesap silme | Çalışıyor | e2e testli |
| E-posta | Kod hazır | SMTP tanımlanmadan gönderilmez; site içi bildirim çalışır |
| Yönetim paneli (15 bölüm) | Çalışıyor | |
| SEO: meta, canonical, sitemap, robots, OG görseli, yapılandırılmış veri | Çalışıyor | Sitemap yalnızca gerçek veri içerir |
| Açık/koyu tema, mobil öncelikli tasarım | Çalışıyor | Mobil e2e testli |

## Uygulanmayanlar ve bilinen sınırlar

- **Rezervasyon/satın alma akışı yok.** Kullanıcı mağazaya veya uçuş sağlayıcısına yönlendirilir.
  Duffel üzerinden rezervasyon ayrı bir ödeme ve sorumluluk projesidir.
- **Bildirim kanalları:** web push, SMS ve mobil uygulama bildirimi yok; yalnızca site içi ve
  e-posta.
- **Fiyat tahmini** ("bekle / şimdi al" tahmini) yok. Bilinçli olarak yalnızca geçmiş veriye dayalı,
  açıklanabilir sinyaller gösteriliyor.
- **Benzer ürünler** kural tabanlıdır: aynı kategoride fırsat puanı en yüksek ürünler ve ayrıca
  %15–65 daha uygun alternatifler gösterilir. Öneri modeli yok.
- **İstek sınırlayıcı bellek içi:** çok örnekli dağıtımda Redis gerekir.
- **CSP `unsafe-inline` içeriyor:** nonce'lu CSP'ye geçilebilir.
- **Ürün görselleri** mağaza CDN'lerinden doğrudan yüklenir; görsel vekil/optimizasyon yok.
- **Yasal metinler** taslaktır: köşeli parantezli alanlar doldurulmalı ve hukukçu incelemesi
  gerekir.
- **Ekran okuyucuyla manuel erişilebilirlik denetimi** yapılmadı.

## Gerekli hesaplar ve ücretli hizmetler

Bunlar sizin açmanız veya onaylamanız gereken şeylerdir. Ben hiçbir hesap açmadım ve hiçbir
ödeme yapmadım.

| Ne | Zorunlu mu? | Ücret |
|---|---|---|
| Alan adı | Yayın için evet | Doğrulanmadı |
| Barındırma: VPS/konteyner **veya** Vercel Pro + yönetilen PostgreSQL | Evet | Vercel Pro $20/ay; Neon kullanıma göre (bkz. [DATA-SOURCES.md](DATA-SOURCES.md)); VPS fiyatı doğrulanmadı |
| SMTP sağlayıcısı (ör. Amazon SES) | E-posta bildirimleri için | SES: $0,10 / 1.000 e-posta |
| Amazon Ortaklık + Creators API | Amazon verisi için | API ücreti belirtilmemiş; nitelikli satış koşulu var |
| Travelpayouts hesabı | Uçuş gösterge fiyatları için | Ücretsiz |
| Duffel hesabı | Canlı uçuş araması için (isteğe bağlı) | Sipariş başına $3 + %1; 1500:1 üstü arama başına $0,005 |
| Trendyol / Hepsiburada / diğer mağazalar için veri ortaklığı veya satış ortaklığı ağı | Bu mağazaların verisi için | Doğrulanmadı |

## Önerilen sonraki adımlar (öncelik sırasıyla)

1. **Marka ve alan adı kararı:** [BRAND.md](BRAND.md). Ardından `NEXT_PUBLIC_BRAND_NAME` ve
   `NEXT_PUBLIC_SITE_URL`.
2. **Travelpayouts hesabı aç** (ücretsiz). Uçuş modülü ilk gerçek veriyle çalışan bölüm olur.
3. **Bir mağazadan resmî ürün feed'i al:** doğrudan mağazadan veya bir satış ortaklığı ağından.
   Panelden ekle ve gerçek fiyat geçmişi birikmeye başlasın. Doğrulanmış indirim için 30 günlük
   kapsam gerekir; erken başlamak önemlidir.
4. **Amazon Associates başvurusu yap.** Nitelikli satış koşulu sağlanınca Creators API'ye geç.
   İlk canlı çalıştırmada SearchItems yolunu ve TPS'yi doğrula.
5. **Trendyol ve Hepsiburada ile veri ortaklığı görüşmesi yap.**
6. **Yasal metinleri tamamla** (veri sorumlusu bilgileri, sağlayıcı listesi, yurt dışı aktarım),
   hukukçuya incelet. `security.txt` ekle.
7. **Docker Compose ile tek sunucuda yayına al,** TLS ters vekil ve günlük yedekleme kur.
8. **Trafik artınca:** Redis tabanlı istek sınırlayıcı, nonce'lu CSP, `PriceSnapshot` bölümleme,
   görsel vekili.
