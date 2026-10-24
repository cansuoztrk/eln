# Testler

Hiçbir test gerçek bir dış API'ye bağlanmaz. Dış kaynak davranışı fixture dosyaları, sahte HTTP
yanıtları ve yerel bir HTTP sunucusuyla taklit edilir. Test verileri yalnızca test veritabanına
yazılır ve hiçbir yerde canlı veri olarak sunulmaz.

## Komutlar

```bash
npm run test:unit          # saf fonksiyonlar; veritabanı gerekmez
npm run test:integration   # ayrı test veritabanı gerekir (aşağıya bakın)
npm run test:e2e           # tarayıcı testleri; demo verili veritabanı + çalışan uygulama
npm run lint && npm run typecheck
```

### Entegrasyon testleri için veritabanı

`TEST_DATABASE_URL` (varsayılan
`postgresql://firsat:firsat@localhost:5432/firsatradar_test`).

- Adında **`test`** geçmeyen veritabanı güvenlik gereği reddedilir.
- Kurulum her çalıştırmada `public` şemasını siler, göçleri uygular ve temel verileri yükler.
- `psql` komutunun yolda olması gerekir.

```bash
createdb firsatradar_test
npm run test:integration
```

### Uçtan uca testler

```bash
npm run db:seed && npm run db:seed:demo       # geliştirme veritabanına test verisi
npm run test:e2e                              # gerekirse `npm run dev` sunucusunu kendisi başlatır
# Üretim derlemesine karşı:
npm run build && SHOW_TEST_DATA=true npx next start -p 3100 &
E2E_BASE_URL=http://localhost:3100 npm run test:e2e
```

Yönetici testi yalnızca `E2E_ADMIN_EMAIL` ve `E2E_ADMIN_PASSWORD` tanımlıysa çalışır. Değilse
"atlandı" olarak raporlanır. Bu bilgiler dosyaya yazılmaz, komut satırında verilir.

## Kapsam

### Birim testleri (`tests/unit`, 7 dosya, 65 test)

| Dosya | Ne doğrulanıyor |
|---|---|
| `money-text.test.ts` | Türkçe fiyat ayrıştırma ("1.299,90 TL", "1299.90 TRY"), kuruş dönüşümü, biçimlendirme; Türkçe karakter katlama, slug; GTIN sağlama basamağı, MPN normalizasyonu |
| `stats.test.ts` | 30 günlük medyan / en düşük / önceki en düşük, veri boşluklarının kapsam sayılmaması, 36 saatlik boşluğun "bilinmiyor" sayılması, 7 gün önceki fiyat, geçersiz ve gelecekteki gözlemlerin yok sayılması, günlük seri |
| `evaluate.test.ts` | Doğrulanmış indirim (medyan / önceki kararlı), şişirilmiş liste fiyatı, etiket koşulları, puanın taze olmayan / stoksuz / şüpheli teklifte verilmemesi, şüpheli değişim eşikleri |
| `coupons-alerts.test.ts` | Kupon koşulları (doğrulama, geçerlilik, asgari sepet, kategori, tavan; koşullu avantajların fiyattan düşülmemesi), alarm kararları (tetikleme, tekrar bildirmeme, yeniden kurma, ek düşüşte tekrar bildirme) |
| `feed-parser.test.ts` | Google Merchant XML, YML, CSV, JSON ayrıştırma; kargo yoksa "bilinmiyor"; süresi geçmiş indirimli fiyatın uygulanmaması; geçersiz kayıtların gerekçesiyle atlanması (fiyatsız, ikinci el, `javascript:` bağlantı) |
| `matching.test.ts` | Varyant nitelikleri (renk/kapasite/bağlantı), model kodu çıkarımı (ölçü birimleri model kodu değildir), Türkçe varyant sözcükleri, aday güven puanı (farklı dil, model çelişkisi, farklı marka), kategori sınıflandırma sırası |
| `adapters.test.ts` | Amazon (OffersV2 eşleme; teklifsiz ürünün hata olması), Travelpayouts (gösterge fiyat) ve Duffel (vergi dâhil canlı teklif) sahte yanıtlarla; HTTP istemcisi (429'da `Retry-After`, 401'in yeniden denenmemesi, yanıt boyutu sınırı); dış yönlendirme (satış ortaklığı parametresi, `javascript:` reddi); doğal dil araması ayrıştırma |

### Entegrasyon testleri (`tests/integration`, 2 dosya, 19 test — gerçek PostgreSQL)

- **Ingestion uçtan uca:** yerel HTTP sunucusundan sunulan Google Merchant feed'i.
  - Kayıt oluşturma, kategori sınıflandırma, en iyi teklif seçimi.
  - Aynı fiyatta yeni geçmiş kaydı yazılmaması, fiyat değişince yazılması.
  - Tek kontrolde aşırı düşüşün şüpheli işaretlenmesi.
  - Kaynak 500 verdiğinde son verinin korunup teklifin "yeniden doğrulanıyor" olması.
  - Tazelik penceresi aşılınca `STALE` olup puan ve etiketlerin kaldırılması.
  - Biçimi bozuk feed'in teklifleri silmemesi.
  - Tam katalogdan çıkan ürünün `EXPIRED` olması.
- **Eşleştirme:**
  - farklı kaynaktan aynı GTIN'in aynı ürüne bağlanması;
  - yalnızca başlık benzerliğinin birleştirilmeyip inceleme kuyruğuna düşmesi.
- **Arama:** yazım hatası ("ornekmrka") ve Türkçe karakterden bağımsızlık (trigram).
- **Fiyat alarmları:**
  - hedefte tek bildirim ve tek e-posta;
  - tekrar değerlendirmede çift bildirim olmaması;
  - fiyat yükselince yeniden kurulma;
  - eski fiyatla tetiklenmeme;
  - SMTP yokken e-postanın `SKIPPED` olması.
- **Görev kuyruğu:**
  - `dedupeKey` ile çift görev engeli;
  - aynı kaynak için eşzamanlı tek görev;
  - geçici hatada yeniden planlama ve kalıcı hatada başarısızlık;
  - takılan görevin kurtarılması;
  - planlayıcının aynı dilim için tek görev eklemesi;
  - anahtarı olmayan kaynakların başarısız değil "atlandı" sayılması.
- **Uçuşlar:** test sağlayıcısıyla rota fiyatlarının ve snapshot'ların yazılması, uçuş alarmının
  tetiklenmesi.
- **İlk yönetici:** ortam değişkeninden yalnızca hesap yoksa oluşturulması; var olan hesabın
  parolasının değişmemesi; aynı e-postalı normal hesabın yönetici yapılmaması.
- **Saklama süreleri:** günlük bakımın 13 aydan eski anonim tıklamaları ve 60 günden eski e-posta
  kuyruğu kayıtlarını silmesi.

### Uçtan uca testler (`tests/e2e`, Playwright, Chromium)

| Test | |
|---|---|
| Ana sayfa | Başlık, arama kutusu, "Test verisi" rozeti |
| Arama | URL'ye yansıma, yazım hatası toleransı |
| Kategori | `?sirala=fiyat-artan&stok=1` ile gerçekten artan fiyat sırası; sıralama değişince diğer parametrelerin korunması |
| Ürün detayı | Fiyat geçmişi grafiği ve tablo görünümü, 30 günlük istatistik, test rozeti, alarm için hesap çağrısı |
| Dış bağlantı | Test kaynağındaki teklifin gerçek mağaza yerine `/test-baglanti`'ya yönlenmesi |
| Uçuş arama | Sonuç kartları, test rozeti; geçmiş tarihin reddedilmesi |
| Hesap akışı | Kayıt → favori → fiyat alarmı → hesapta görüntüleme → normal kullanıcıya `/admin` 404 → KVKK veri dışa aktarma (parola özeti içermez) → hatalı/doğru parola ile giriş |
| Yönetim | Anonim kullanıcının girişe yönlenmesi; (isteğe bağlı) yöneticinin kontrol merkezi ve kaynak durumunu görmesi |
| SEO/güvenlik | robots.txt (`/admin` kapalı), sitemap.xml, `/api/health`, CSP ve güvenlik başlıkları |
| Mobil (Pixel 7) | Filtre çekmecesinin açılıp filtrenin URL'ye yazılması; yatay taşma olmaması |

## Son çalıştırma (24.10.2026, bu depoda)

| Paket | Sonuç |
|---|---|
| Birim | 65 / 65 geçti |
| Entegrasyon | 19 / 19 geçti |
| Uçtan uca (üretim derlemesine karşı) | 14 / 14 geçti (yönetici testi dâhil; kimlik bilgileri komut satırında verildi) |
| `tsc --noEmit` | hata yok |
| `eslint .` | hata ve uyarı yok |
| `next build` | başarılı |
| `docker build` + `docker compose up` | başarılı (göç, temel veri, web sağlıklı, worker görev işledi) |

## Test edilmeyenler

- **Gerçek API anahtarlarıyla canlı çağrılar:** Amazon Creators API, Travelpayouts, Duffel. Bu
  ortamda anahtar yoktu. Adaptörler belgelere göre yazıldı ve sahte yanıtlarla test edildi. İlk
  canlı çalıştırmada yanıt alanları doğrulanmalıdır.
- **Gerçek SMTP ile e-posta teslimi:** yalnızca gönderim kuyruğu ve "SKIPPED" yolu test edildi.
- **Yük testi ve çok örnekli dağıtım:** bellek içi istek sınırlayıcı örnek başınadır.
- **Ekran okuyucu ile manuel erişilebilirlik testi:** semantik yapı, odak durumları ve tablo
  görünümleri uygulandı ancak manuel denetim yapılmadı.
