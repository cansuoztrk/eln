# Veri kaynakları, entegrasyon gereksinimleri ve maliyetler

Son kontrol: **24 Ekim 2026**. Fiyatlar ve koşullar sağlayıcılar tarafından değiştirilebilir;
canlıya almadan önce bağlantılardan tekrar doğrulayın.

Bu projede **hiçbir kaynak scraping, CAPTCHA aşma, oturum taklidi veya kullanım şartlarını ihlal
eden yöntemle beslenmez.** Resmî erişimi olmayan kaynaklar arayüzde ve yönetim panelinde
"Entegrasyon bekliyor" olarak görünür ve sahte veriyle doldurulmaz.

## 1. Özet tablo

| Kaynak | Adaptör | Kod durumu | Gerçek veri için gereken | Maliyet (doğrulanmış) |
|---|---|---|---|---|
| Amazon Türkiye | `amazon-creators` | Hazır (OAuth 2.0, GetItems/SearchItems, Offers V2) | Onaylı Amazon Ortaklık hesabı + Creators API kaydı + kimlik bilgileri | API için ücret belirtilmemiş; erişim koşulu: nitelikli satış yönlendirmiş olmak |
| Trendyol | `trendyol` | Bekliyor; yetkili feed URL'si verilirse feed ayrıştırıcıyla çalışır | Trendyol ile resmî veri ortaklığı veya yetkili bir satış ortaklığı ağından ürün feed'i | Doğrulanamadı |
| Hepsiburada | `hepsiburada` | Bekliyor; yetkili feed URL'si verilirse feed ayrıştırıcıyla çalışır | Resmî veri ortaklığı veya yetkili ağdan feed | Doğrulanamadı |
| Diğer mağazalar | `product-feed` | Hazır (Google Merchant XML/RSS, YML, CSV, JSON) | Mağazanın veya satış ortaklığı ağının verdiği feed adresi | Mağazaya/ağa bağlı |
| Travelpayouts (Aviasales Data API) | `travelpayouts` | Hazır (gösterge fiyat, önbellek) | Ücretsiz Travelpayouts hesabı + API token | Ücretsiz erişim (token gerekli) |
| Duffel | `duffel` | Hazır (canlı arama) | Duffel hesabı + erişim anahtarı | Sipariş başına $3 + %1 vb. (aşağıda) |
| Test (fixture) | `fixture-retail`, `fixture-flights` | Yalnızca geliştirme/test | — | — |

## 2. Amazon Türkiye — Creators API

- PA-API 5.0 kullanımdan kaldırıldı ve yerini **Creators API** aldı; PA-API 5 çağrıları
  `403 AccessDeniedException` döner.
  [Deprecation notice](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation)
- **Türkiye** (`https://www.amazon.com.tr`) yerel ayar listesinde yer alıyor.
  [Locale reference](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/locale-reference)
- **Erişim koşulları** (Amazon kayıt sayfasından):
  - "final acceptance" almış bir Amazon Ortaklık (Associates) hesabı;
  - yalnızca **nitelikli satış yönlendirmiş** ortaklar kaydolabilir;
  - yalnızca hesabın **birincil sahibi** kaydolabilir.

  Kaynak: [Register for Creators API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api)
- **Kimlik bilgileri tüm pazar yerlerinde geçerlidir**; pazar yeri istek başına `x-marketplace`
  ile seçilir ve o bölge için Creators API onayı gerekir.
  [FAQ](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/frequently-asked-questions)
- **Önbellek:** Offers verisinin TTL'i **1 saat**. Bu nedenle Amazon kaynağının tazelik penceresi
  75 dakikadır ve saatlik yenileme planlanır.
  [Best programming practices](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices)
- **İstek limiti:** TPS (saniye başına işlem) bazında tahsis edilir; sayılar hesabınıza göre
  değişir. Adaptör, kaynak ayarındaki dakika limitine göre token kovası uygular ve 429/503'te
  `Retry-After` başlığına uyar.
- **Satış ortaklığı bağlantısı:** API'nin döndürdüğü `DetailPageURL` (partner tag içerir) olduğu
  gibi kullanılır; sistem bu bağlantıyı değiştirmez.
- **Gerekli ortam değişkenleri:** `AMAZON_CREATORS_CLIENT_ID`, `AMAZON_CREATORS_CLIENT_SECRET`,
  `AMAZON_PARTNER_TAG`.
- **Gerçek anahtarla henüz denenmedi.** Adaptör belgelere göre yazıldı ve sahte yanıtlarla test
  edildi. İlk canlı çalıştırmada şunları doğrulayın:
  - SearchItems uç nokta yolu (`/catalog/v1/searchItems` varsayıldı; kaynak ayarından
    değiştirilebilir);
  - hesabınıza tanımlı TPS;
  - Türkiye için token bölgesi.
- OffersV2 kargo bedeli döndürmediği için Amazon tekliflerinde kargo **"bilinmiyor"** gösterilir.
  - Toplam maliyet bilinmediğinden bu teklifler "Mağazalar arasında en uygun" etiketini alamaz.
  - Diğer tekliflere rakip olarak bakılırken yalnızca ürün fiyatı alt sınır kabul edilir.
- **Uyum notu:** Fiyatın gösterim kuralları (zaman damgası, önbellek süresi vb.) için Türkiye
  Associates Operating Agreement metnini canlıya almadan önce okuyun; bu belge kapsamında bu metin
  doğrulanmadı.

## 3. Trendyol ve Hepsiburada

- [developers.trendyol.com](https://developers.trendyol.com/) API'si **pazaryeri satıcılarının**
  kendi mağazalarını yönetmesi içindir (ürün aktarma, stok/fiyat güncelleme, sipariş). Bir
  karşılaştırma sitesinin tüm katalog fiyatlarını çekmesi için değildir.
- [developers.hepsiburada.com](https://developers.hepsiburada.com/) da satıcı entegrasyonuna
  yöneliktir; erişim satıcı panelinden alınan servis anahtarı ve Merchant ID ile verilir.
- Araştırmada iki platform için de karşılaştırma sitelerine açık, resmî bir ürün/fiyat API'si veya
  feed'i **doğrulanamadı**. Bu nedenle iki kaynak "Entegrasyon bekliyor" durumundadır.
- **Gerçek veriye geçiş yolu:**
  1. Platformla veri ortaklığı görüşmesi yapın veya platformun yer aldığı yetkili bir satış
     ortaklığı ağından ürün feed'i erişimi alın.
  2. Aldığınız feed adresini `TRENDYOL_PARTNER_FEED_URL` / `HEPSIBURADA_PARTNER_FEED_URL`
     değişkenine yazın.
  3. Adaptör, feed'i genel ayrıştırıcıyla işler ve kaynak durumu otomatik olarak "Bağlı" olur.
- **Doğrulanmamış bilgiler:** Trendyol'un influencer/satış ortaklığı programları hakkında üçüncü
  taraf yazılar var. Bunların ürün feed'i sağlayıp sağlamadığı **doğrulanmadı**.

## 4. Genel ürün feed'i (`product-feed`)

Desteklenen biçimler:

- Google Merchant Center XML/RSS ([ürün veri spesifikasyonu](https://support.google.com/merchants/answer/7052112))
- Yandex YML
- CSV (başlık satırlı)
- JSON dizisi

Okunan alanlar:

- kimlik, başlık, fiyat, indirimli fiyat, para birimi;
- stok, kargo, GTIN, MPN, marka, görsel, bağlantı, kategori.

Geçersiz kayıtlar (fiyatsız, geçersiz bağlantı, ikinci el vb.) atlanır ve görev günlüğüne yazılır.
Yönetim panelinde **Veri kaynakları → Ürün feed'i ekle** ile tanımlanır. Feed adresi panelde
değil, `FEED_` ile başlayan bir ortam değişkeninde tutulur (adreste erişim anahtarı olabilir).

## 5. Uçuşlar

### Travelpayouts — Aviasales Data API (gösterge fiyat)

- Veriler Aviasales kullanıcılarının aramalarından oluşan **önbellektir**. `prices_for_dates`
  yöntemi son **48 saatte** bulunan en ucuz biletleri döndürür ve veriler **7 gün** saklanır.
  Belge, bu verinin statik sayfalar üretmek için kullanılmasını önerir.
  [Aviasales Data API](https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API)
- Erişim için Travelpayouts kaydı ve profildeki API token gerekir (`X-Access-Token` başlığı).
  Bazı yöntemlerin istek limitleri vardır; örneğin fiyat takvimi yöntemi saniyede 10 istekle
  sınırlıdır.
- Sitede bu fiyatlar **"gösterge fiyat — satın alma sayfasında değişebilir"** notuyla ve kontrol
  zamanıyla gösterilir. Kesin fiyat gibi sunulmaz.
- Gerekli: `TRAVELPAYOUTS_TOKEN`. İsteğe bağlı: `TRAVELPAYOUTS_MARKER` (satış ortaklığı).

### Duffel (canlı arama)

- Canlı uçuş araması ve rezervasyon API'si. [API docs](https://duffel.com/docs/api/overview/welcome)
- Sitede yalnızca arama/teklif gösterimi yapılır; rezervasyon akışı uygulanmadı. Satın alma
  bağlantısı olmayan teklifte buton gösterilmez.
- Gerekli: `DUFFEL_ACCESS_TOKEN`. Önce test anahtarıyla deneyin.

### Amadeus

Amadeus for Developers **Self-Service** portalı 17 Temmuz 2026'da kapatıldı; yalnızca Enterprise
API'ler devam ediyor. Bu nedenle adaptör yazılmadı.
[PhocusWire](https://www.phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers)

## 6. Doğrulanmış maliyetler

| Hizmet | Fiyat | Kaynak |
|---|---|---|
| Duffel — sipariş | $3,00 / onaylanmış sipariş | [duffel.com/pricing](https://duffel.com/pricing) |
| Duffel — Managed Content | Sipariş tutarının %1'i | aynı |
| Duffel — ek hizmet (ancillary) | $2,00 / ücretli ek hizmet | aynı |
| Duffel — fazla arama | 1500:1 arama/satış oranının üstündeki her arama için $0,005 (ör. 10 siparişte 15.000 arama ücretsiz) | aynı |
| Duffel — kur dönüşümü | %2 | aynı |
| Duffel — aylık sabit ücret | Belirtilmemiş ("No upfront fees") | aynı |
| Vercel Hobby | $0; **yalnızca kişisel, ticari olmayan kullanım**; cron en sık **günde bir kez** (±59 dk) | [vercel.com/pricing](https://vercel.com/pricing), [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) |
| Vercel Pro | $20/ay ($20 kullanım kredisi dâhil); cron dakikada bir | aynı |
| Neon Postgres | Free $0 (proje başına 100 CU-saat, 1 GB); Launch $0,106/CU-saat; Scale $0,222/CU-saat; depolama $0,35/GB-ay | [neon.com/pricing](https://neon.com/pricing) |
| Amazon SES (e-posta) | $0,10 / 1.000 e-posta (+ ek dosya için $0,12/GB) | [aws.amazon.com/ses/pricing](https://aws.amazon.com/ses/pricing/) |
| Amazon Creators API | Kayıt sayfasında ücret belirtilmemiş | [kayıt sayfası](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api) |

**Önemli:** Vercel Hobby ticari kullanıma izin vermez ve saatlik cron'u desteklemez. Bu platform
saatlik fiyat kontrolü yaptığı için Vercel'de en az **Pro** gerekir ya da sürekli çalışan worker
ile bir sunucu/konteyner kurulumu tercih edilmelidir (bkz. [DEPLOYMENT.md](DEPLOYMENT.md)).

## 7. Doğrulanmamış veya tahmini kalemler

Aşağıdakiler bu çalışmada **doğrulanmadı**; satın almadan önce kontrol edin:

- Trendyol / Hepsiburada için resmî veri ortaklığı veya feed erişiminin varlığı, koşulları ve ücreti.
- Türk mağazalarının (Teknosa, MediaMarkt, Vatan vb.) satış ortaklığı ağlarında ürün feed'i sunup
  sunmadığı ve komisyon oranları.
- Travelpayouts komisyon oranları ve Türkiye pazarında (`market=tr`) önbellek kapsamı.
- Amazon Türkiye için Creators API istek kotası (TPS) ve Türkiye Associates sözleşmesindeki fiyat
  gösterim kuralları.
- Alan adı (domain) fiyatı ve uygunluğu. Hiçbir alan adının boşta olduğu varsayılmadı
  (bkz. [BRAND.md](BRAND.md)).
- VPS/konteyner barındırma ücretleri (sağlayıcıya göre değişir; bu belgede fiyat verilmedi).
