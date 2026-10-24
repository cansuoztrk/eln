# Mimari ve teknik kararlar

## Genel görünüm

```
            ┌───────────────────────── Next.js (App Router) ─────────────────────────┐
Ziyaretçi ─▶│ Sayfalar (RSC) · Sunucu eylemleri · /api/* · /git/* yönlendirme       │
            └──────────────┬──────────────────────────────────────────────┬──────────┘
                           │ okuma/yazma                                  │ /api/cron/tick
                           ▼                                              ▼
                   ┌──────────────┐   görev kuyruğu (IngestionJob)  ┌────────────────┐
                   │  PostgreSQL  │◀───────────────────────────────▶│ Worker süreci   │
                   │ (Prisma 7)   │   zamanlamalar (JobSchedule)    │ planla→al→çalış │
                   └──────────────┘                                 └───────┬────────┘
                                                                            │ adaptörler
                                       Amazon Creators API · ürün feed'leri · Travelpayouts · Duffel
```

- **Web** yalnızca veritabanından okur. Ziyaretçi isteği hiçbir zaman dış API'ye bağımlı değildir.
  Tek istisna, uçuş aramasında 15 dakikalık önbellekte sonuç yoksa yapılan sağlayıcı sorgusudur.
- **Worker**, tarayıcıdan bağımsız çalışır. Zamanı gelen işleri kuyruğa ekler, kuyruktan alır,
  çalıştırır, takılan işleri kurtarır.
- Aynı mantık `/api/cron/tick` üzerinden de çalışabilir (sunucusuz kurulum için).

## Katmanlar

| Klasör | Sorumluluk |
|---|---|
| `src/server/integrations/` | Adaptörler. Her biri `checkConfiguration`, `fetchCatalog` / `refreshOffers` / `search` uygular ve kaynağın verisini ortak `SourceListing` / `FlightOfferInput` biçimine çevirir. Ortak HTTP istemcisi: token kovası hız sınırı, zaman aşımı, yeniden deneme, `Retry-After`, yanıt boyutu sınırı, kullanım sayacı. |
| `src/server/ingestion/` | Listelemeyi ürün/varyant/teklif/fiyat kaydına dönüştürür. Eşleştirme, şüpheli değişim tespiti, değişimde snapshot yazma, katalogdan çıkanları sona erdirme. |
| `src/server/matching/` | GTIN → marka+MPN → ürün ailesi → başlık benzerliği (inceleme adayı). |
| `src/server/pricing/` | Saf fonksiyonlar: pencere istatistikleri, doğrulanmış indirim, etiketler, fırsat puanı, kupon uygulama. Ürün önbellek alanlarını (en iyi teklif, puan, indirim) yeniden hesaplar. |
| `src/server/jobs/` | Kuyruk, planlayıcı, görev kayıt defteri, çalıştırıcı, bakım işleri. |
| `src/server/alerts/`, `notifications/` | Fiyat/uçuş alarmı kararları, bildirim + e-posta outbox. |
| `src/server/catalog/`, `flights/` | Sayfaların okuma sorguları (filtre, arama, facet, ürün detayı, uçuş arama/fırsat bölümleri). |
| `src/server/auth/` | scrypt parola, oturum belirteci, yetki korumaları. |
| `src/app/` | Sayfalar ve sunucu eylemleri. `(site)` genel site, `admin` yönetim paneli. |
| `src/components/` | Arayüz bileşenleri (tasarım sistemi, grafikler, liste, uçuş, yönetim). |

## Veri modeli (özet)

- **Product → ProductVariant → Offer → PriceSnapshot.**
  - Ürün: model düzeyi.
  - Varyant: renk/kapasite gibi farklar; GTIN burada ve tekildir.
  - Teklif: bir mağazadaki satış.
  - Snapshot: zaman damgalı ve kaynaklı fiyat gözlemi.
- **Product önbellek alanları:** en iyi teklif, en iyi toplam, teklif/mağaza sayısı, fırsat puanı,
  doğrulanmış indirim, son 7 gün düşüşü, kupon, stok, son doğrulama. Her fiyat değişiminde
  yeniden hesaplanır; liste sayfaları ağır hesap yapmaz.
- **DataSource:**
  - durum (`CONNECTED`, `AWAITING_CREDENTIALS`, `AWAITING_INTEGRATION`, `TEST_ONLY`, `DEGRADED`,
    `DISABLED`);
  - tazelik penceresi, hız limiti, günlük kota, ardışık hata sayısı.
- **IngestionJob / IngestionLog / ApiUsage:** her çalışmanın durumu, denemeleri, günlükleri ve
  günlük istek/hata/429 sayıları.
- **MatchCandidate:** inceleme kuyruğu.
- **ScoringConfig:** sürümlü ağırlıklar.
- **AdminAuditLog:** tüm yönetici işlemleri.
- **Uçuşlar:** FlightRoute (izlenen rotalar), FlightOffer (sağlayıcı teklifleri, derin bağlantı
  isteğe bağlı), FlightPriceSnapshot (rota/gün bazında en düşük).
- **Kişiselleştirme:**
  - UserFavorite, PriceAlert, FlightAlert, SavedSearch, UserInterest, RecentlyViewed;
  - Notification ve EmailOutbox.

## Görev sistemi

- **Kuyruk** veritabanındadır (ek altyapı gerektirmez). Görev alma:
  `FOR UPDATE SKIP LOCKED` + kısa süreli advisory lock.
  - Aynı veri kaynağı için aynı anda yalnızca bir görev çalışır.
  - Birden çok worker güvenle çalışır.
- **Tekilleştirme:** her planlanan görev `zamanlama:zaman_dilimi` biçiminde tekil `dedupeKey`
  taşır. Aynı dilim iki kez kuyruğa giremez.
- **Yeniden deneme:** yalnızca geçici hatalarda (ağ, 5xx, 429, zaman aşımı), üstel geri çekilme
  ile. Kimlik/yetki ve biçim hataları yeniden denenmez.
  - Hata mesajı ve ardışık hata sayısı kaynağa yazılır, panelde görünür.
  - Kimlik doğrulama hatasında kaynak `AWAITING_CREDENTIALS` olur.
  - Ardışık hata sayısı sınırı (varsayılan 5) aşılınca kaynak `DEGRADED` olur; son başarılı veri
    korunur ve teklifler "yeniden doğrulanıyor" durumuna düşer.
- **Heartbeat ve kurtarma:** çalışan görev düzenli heartbeat yazar. Heartbeat'i kesilen görev
  kurtarılır ve yeniden kuyruğa alınır ya da başarısız sayılır.
- **Planlar:**

  | Görev | Sıklık |
  |---|---|
  | Kaynak fiyat yenileme | Kaynağa göre (Amazon 60 dk, feed'ler 180 dk, Travelpayouts 360 dk) |
  | Tam senkron | Günlük |
  | Tazelik kontrolü | 15 dk |
  | E-posta gönderimi | 5 dk |
  | Alarm güvenlik ağı | 60 dk |
  | Puanların yeniden hesaplanması ve günlük bakım | Günlük |
  | Rapor ve haftalık özet | Haftalık |

  Aralıklar yönetim panelinden değiştirilebilir.

## Teknik kararlar

| Karar | Gerekçe |
|---|---|
| Next.js 16 App Router, sunucu bileşenleri | SEO dostu sunucu çıktısı, ayrı API katmanı olmadan veri erişimi, sunucu eylemleriyle formlar (JS kapalıyken de çalışır). |
| PostgreSQL + Prisma 7 (driver adapter) | İlişkisel model, pencere fonksiyonları (fiyat geçmişi), `pg_trgm` ile yazım hatasına toleranslı arama, `SKIP LOCKED` ile kuyruk. Tek veritabanı, işletme maliyeti düşük. |
| Kuyruk veritabanında | Redis/ek servis gerektirmeden idempotent, gözlemlenebilir görevler. Ölçek büyürse adaptör/çalıştırıcı arayüzü değişmeden ayrı bir kuyruğa taşınabilir. |
| Para kuruş cinsinden tamsayı | Kayan nokta yuvarlama hatası yok. |
| Snapshot yalnızca değişimde + 20 sa heartbeat | Depolama kontrol altında; "fiyat hâlâ geçerli" bilgisi korunur. 36 saatten uzun boşluklar "bilinmiyor". |
| Doğrulanmış indirim ≠ liste fiyatı indirimi | Şişirilmiş "eski fiyat" uygulamalarına karşı kullanıcıyı korur. Sıralama yalnızca kendi verimize dayanır. |
| Başlık benzerliği otomatik birleştirmez | Yanlış birleştirme (farklı model/varyant) yanlış fiyat karşılaştırmasına yol açar. Güvenli taraf: inceleme kuyruğu. |
| Test verisi aynı tablolarda, bayraklı | Gerçek ingestion hattı test edilirken veri asla gerçekmiş gibi görünmez. Rozet her yerde; test teklifleri gerçek mağazaya yönlendirmez; üretimde varsayılan gizli. |
| Gizli anahtarlar yalnızca ortam değişkeninde, ön ek beyaz listesiyle | Panelden girilen bir değişken adıyla rastgele ortam değişkeninin okunması engellenir; değerler loglanmaz ve gösterilmez. |
| Tasarım: özgün tokenlar, açık/koyu tema, sistem fontu yerine yerel olarak barındırılan değişken fontlar | Harici font isteği yok (gizlilik + CSP), tutarlı tipografi. |
| Grafikler kütüphanesiz SVG | Küçük paket boyutu; tablo görünümü, klavye ve ekran okuyucu erişimi kontrol altında. |

## Performans

- Liste ve arama sayfaları önbellek alanlarından ve indekslerden okur:
  - trigram GIN;
  - kategori/puan/fiyat bileşik indeksleri.
- Ürün görselleri yalnızca `https` kaynağından, tembel yüklemeyle (`loading="lazy"`) ve
  `referrerpolicy="no-referrer"` ile gösterilir. Yüklenemezse kategori çizimine düşer. Görsel
  optimizasyon sunucusu kullanılmaz; mağaza CDN'lerinden doğrudan yüklenir (CSP `img-src https:`).
- Ürün sayfasındaki fiyat geçmişi sunucuda günlük seriye indirgenir; istemciye yalnızca ≤ 180
  nokta gider.
- Sitemap saatlik yeniden üretilir; yalnızca güncel teklifi olan gerçek ürünleri içerir.
