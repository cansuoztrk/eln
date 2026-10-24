# Yönetim paneli rehberi

Adres: `/admin`.

- Giriş yapmamış kullanıcı giriş sayfasına yönlendirilir.
- Yetkisi olmayan kullanıcı **404** görür; panelin varlığı açık edilmez.
- Panel sayfaları arama motorlarına kapalıdır (`X-Robots-Tag: noindex`).

Platform kendi kendine çalışacak biçimde tasarlandı. Panel, günlük operasyondan çok **istisnaları**
yönetmek içindir:

- başarısız görevler;
- şüpheli fiyatlar;
- belirsiz eşleşmeler;
- bekleyen entegrasyonlar.

## Roller

| Rol | Erişim |
|---|---|
| `EDITOR` | Kontrol merkezi, ürünler, teklifler, eşleştirme, kuponlar, editoryal içerik, raporlar |
| `ADMIN` | Editör yetkilerine ek olarak: veri kaynakları, görevler/zamanlama, puanlama, kategoriler, uçuş rotaları, sponsorlu yerleşimler, mağazalar/satış ortaklığı, kullanıcılar, denetim kaydı |

İlk yönetici komut satırından oluşturulur:

```bash
npm run admin:create -- siz@ornek.com "GüçlüBirParola123"
```

Sonraki rol değişiklikleri **Kullanıcılar** sayfasından yapılır.

**Her değişiklik denetim kaydına yazılır.** Kayıt şunları içerir: kim, ne zaman, hangi kayıt,
önce/sonra değerleri ve varsa gerekçe. Her sunucu eylemi yetkiyi ayrıca kontrol eder; yalnızca
sayfa düzenine güvenilmez.

## Sayfalar

### Kontrol merkezi (`/admin`)

- **Göstergeler:** toplam ürün, aktif teklif, güncel fırsat (puan ≥ 55), son 24 saatte yeni
  teklif, güncellenemeyen teklif, şüpheli fiyat, eşleştirme bekleyen, alarm bildirimleri.
- **Yapılandırma uyarıları:** eksik `ANALYTICS_SALT`, SMTP, üretim adresi vb. Değerler gösterilmez,
  yalnızca değişken adları.
- **Son 7 günün fiyat hareketleri:** günlük düşüş/artış gözlem sayısı.
- **Görevler:** son 24 saatin durum dağılımı ve son başarısız görevler.
- **Entegrasyonlar tablosu:** durum, son başarılı çalışma, son hata, ardışık hata, 7 günlük
  istek / hata / 429 sayıları ve kota.
- **Tıklama özetleri:** en çok tıklanan ürünler, kategoriler, mağazalar.

### Veri kaynakları (`/admin/kaynaklar`)

- Her kaynak için:
  - durum;
  - gereken ortam değişkenlerinin adları ve tanımlı olup olmadıkları;
  - son çalışma ve son hata;
  - 14 günlük API kullanımı;
  - uyarı/hata günlükleri.
- **Bağlantıyı test et:** adaptörün yapılandırma kontrolünü çalıştırır, veri yazmaz.
- **Şimdi çalıştır:** fiyat yenileme veya tam senkron görevini kuyruğa ekler.
- **Ayarlar:** etkin/pasif, yenileme ve tam senkron aralığı, tazelik penceresi, dakika başı istek
  limiti, günlük kota, ardışık hata sınırı ve kaynağa özel yapılandırma (JSON; ör. Amazon arama
  sorguları).
- **Ürün feed'i ekle:** mağazanın veya satış ortaklığı ağının verdiği feed'i bağlar. Feed adresi
  panelde değil, `FEED_` ile başlayan bir ortam değişkeninde tutulur; panele yalnızca değişkenin
  adı yazılır.

Durumlar:

| Durum | Anlamı |
|---|---|
| Bağlı | Son çalışma başarılı |
| Kimlik bilgisi bekliyor | Adaptör hazır; API anahtarı veya onay yok ya da reddedildi |
| Entegrasyon bekliyor | Resmî erişim yolu yok veya sözleşme gerekli; sahte veri üretilmez |
| Sorunlu | Ardışık hata sınırı aşıldı; son başarılı veri korunuyor |
| Yalnızca test | Fixture verisi üretir; canlı veri değildir |

### Görevler ve zamanlama (`/admin/gorevler`)

- **Görev listesi:** duruma göre filtrelenir. Ayrıntı sayfasında denemeler, süre,
  istatistikler (alınan, oluşturulan, fiyatı değişen, şüpheli, sona eren…), hata ve satır satır
  günlük bulunur.
- Başarısız görevi **yeniden dene**, kuyruktaki görevi **iptal et**.
- **Zamanlamalar:** aralığı değiştir, etkinleştir/durdur, **şimdi çalıştır**.

### Ürünler (`/admin/urunler`)

- Arama ve filtre.
- Ürün düzenleme: başlık, marka, model kodu, kategori, görsel, etiketler, etkin/pasif. Değişikliğe
  gerekçe yazılabilir.
- Ürünün teklifleri ve ürün–satıcı ilişkileri.

### Teklifler (`/admin/teklifler`)

- Sekmeler: **şüpheli**, **güncellenemeyen** (yeniden doğrulanıyor / eski), **devre dışı**,
  **sponsorlu**.
- Bir teklifi şüpheli işaretle veya işareti kaldır.
- Teklifi devre dışı bırak (ör. yanlış fiyatlı kaynak kaydı).
- Yanlış eşleşen teklifi başka ürüne veya varyanta taşı.
- Otomatik şüpheli işareti, aynı fiyat 6 saat sonra tekrar doğrulanırsa kendiliğinden kalkar.

### Eşleştirme incelemesi (`/admin/eslestirme`)

- Yalnızca başlık benzerliğine dayanan adaylar burada bekler. Ekranda gelen teklifin başlığı,
  fiyatı ve varyantı ile aday ürünün başlığı, markası, güncel teklifleri ve güven puanı birlikte
  gösterilir.
- **Onayla:** teklif aday ürüne taşınır.
- **Reddet:** kayıt ayrı ürün olarak kalır.

### Puanlama (`/admin/puanlama`)

- Ağırlıklar ve eşikler. Ayrıntılar: [PRICING.md](PRICING.md).
- Kaydetmek **yeni sürüm** oluşturur, etkinleştirir ve tüm puanları arka planda yeniden
  hesaplar. Eski sürüme tek tıkla dönülebilir.
- Sponsorluk puana hiçbir zaman girmez.

### Kategoriler (`/admin/kategoriler`)

- Kategori ağacı: ad, üst kategori, simge, anahtar kelimeler (otomatik sınıflandırma), filtre
  şeması.
- **Eşlemeler:** kaynakların kategori yollarını platform kategorilerine bağlar.

### Kuponlar (`/admin/kuponlar`)

- Kupon kodu, mağaza/kategori/marka koşulları, asgari sepet, geçerlilik tarihleri ve doğrulama
  durumu.
- Yalnızca doğrulanmış ve geçerli kuponlar fiyata uygulanır.
- Koşullu indirimler (üyelik, ödeme yöntemi, cashback) fiyattan düşülmez; ayrı gösterilir.

### Editoryal içerik (`/admin/icerik`)

- Günün/haftanın seçimleri, rehberler ve karşılaştırmalar (Markdown).
- Editörün seçtiği ürünler "Editörün seçimi" etiketiyle, otomatik fırsatlardan ayrı gösterilir.

### Uçuş rotaları (`/admin/rotalar`)

- İzlenen rotaları ekle, durdur ve etiketle.
- Etiketler uçuş sayfasındaki keşif bölümlerini belirler: `istanbul-cikisli`, `ankara-cikisli`,
  `izmir-cikisli`, `yurt-disi`, `hafta-sonu`, `direkt`.

### Sponsorlu yerleşimler (`/admin/sponsorlu`)

- Yerleşim, ürün, başlangıç/bitiş.
- Sponsorlu ürünler her yerde **"Sponsorlu"** olarak işaretlenir ve doğal sıralamadan ayrı tutulur.
- Sponsorlu tıklamalar popülerlik hesabına katılmaz.

### Mağazalar ve satış ortaklığı (`/admin/magazalar`)

- Satış ortaklığı yalnızca resmî programdan onay alındıktan sonra etkinleştirilmelidir.
- Komisyon parametresi yalnızca bağlantıda başka bir ortaklık parametresi yoksa eklenir.
- Kaynağın kendi ortaklık bağlantısı (ör. Amazon) değiştirilmez.
- 30 günlük tıklamalar ortaklıklı ve ortaklıksız olarak ayrı gösterilir.

### Kullanıcılar (`/admin/kullanicilar`)

- Kullanıcı listesi.
- Rol atama (kullanıcı / editör / yönetici).
- Parola özetleri hiçbir yerde gösterilmez.

### Denetim kaydı (`/admin/denetim`)

Tüm yönetici işlemleri; işlem türüne göre filtrelenebilir.

### Raporlar (`/admin/raporlar`)

Haftalık görevle üretilir:

- veri kalitesi;
- kaynak bazında tazelik;
- kategori trendleri.

Veri olmayan dönemler için rapor üretilmez.

## Sık yapılan işler

**Yeni bir mağazanın feed'ini bağlamak**

1. Mağaza veya satış ortaklığı ağından feed adresini ve kullanım iznini alın.
2. Sunucuda `FEED_MAGAZAADI_URL="https://..."` ortam değişkenini tanımlayın ve uygulamayı yeniden
   başlatın.
3. **Veri kaynakları → Ürün feed'i ekle**: mağaza, değişken adı, biçim (otomatik algılama
   önerilir) ve yenileme aralığı.
4. **Bağlantıyı test et**, ardından **Şimdi çalıştır**. Görev ayrıntısında atlanan kayıtları ve
   nedenlerini kontrol edin.
5. **Eşleştirme incelemesi** kuyruğundaki adayları gözden geçirin.

**Amazon'u bağlamak**

1. Creators API onayından sonra `AMAZON_CREATORS_CLIENT_ID`, `AMAZON_CREATORS_CLIENT_SECRET` ve
   `AMAZON_PARTNER_TAG` değişkenlerini tanımlayın.
2. **Veri kaynakları → Amazon Türkiye**: arama sorgularını (anahtar kelime + arama dizini)
   düzenleyin.
3. **Bağlantıyı test et** → **Şimdi çalıştır**.

**Bir kaynak sürekli hata veriyorsa**

- **Görevler** sayfasında hatanın türüne bakın:
  - `AUTH` → anahtar/izin sorunu;
  - `RATE_LIMITED` / `QUOTA_EXCEEDED` → aralığı veya dakika limitini düşürün;
  - `FORMAT` → kaynak biçimi değişti.
- Son başarılı veri korunur ve kullanıcıya "Fiyat yeniden doğrulanıyor" gösterilir; acil işlem
  gerekmez.
