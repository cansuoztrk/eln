# FırsatRadar

Türkiye için otomatik çalışan bir fiyat karşılaştırma, fırsat ve uygun uçak bileti platformu.
"FırsatRadar" geçici çalışma adıdır (bkz. [docs/BRAND.md](docs/BRAND.md)).

Farkı:

- **Doğrulanmış indirim:** mağazanın "eski fiyat" beyanı yerine kendi topladığımız fiyat
  geçmişiyle hesaplanır.
- **Kargo dâhil mağaza karşılaştırması.**
- **Açıklanabilir fırsat puanı:** her faktörün katkısı ürün sayfasında görünür.

Gerçek verisi olmayan hiçbir şey gerçekmiş gibi gösterilmez.

> **Durum:** Yazılım uçtan uca çalışıyor ve testleri geçiyor. Gerçek fiyat verisi için API
> hesapları ve anahtarlar gerekiyor; bu depoda hiçbir kaynak henüz gerçek veriyle
> çalıştırılmadı. Demo verisi "Test verisi" etiketlidir. Ayrıntılar:
> [docs/STATUS.md](docs/STATUS.md).

## Özellikler

- **Ürünler**
  - Fırsat ve kategori listeleri; filtreler ve sıralamalar URL'de saklanır.
  - Yazım hatasına toleranslı ve doğal dille arama ("1500 TL altı kablosuz mouse").
  - Ürün detayı: 30/90/180 gün fiyat geçmişi ve tablo görünümü, mağaza karşılaştırması, kupon,
    puan dökümü, fiyat alarmı, benzer ürünler, veri kaynağı.
  - Karşılaştırma, kuponlar, popüler ürünler.
- **Uçuşlar**
  - Tek yön / gidiş-dönüş, yolcu, kabin, aktarmasız ve ±3 gün esnek tarihli arama.
  - Fiyat takvimi, şehir çıkışlı / yurt dışı / hafta sonu / direkt keşif bölümleri, rota
    sayfaları, uçuş alarmı.
- **Hesap (isteğe bağlı, KVKK uyumlu)**
  - Favoriler, fiyat ve uçuş alarmları, kayıtlı aramalar, ilgi alanları, bildirimler, haftalık
    özet.
  - Veri indirme ve hesap silme.
- **Otomasyon**
  - Sunucu tarafında çalışan worker: saatlik, günlük ve haftalık görevler.
  - Yeniden deneme, tekilleştirme, hız sınırı, kota ve hata günlükleri.
  - Bayat veri "Fiyat yeniden doğrulanıyor" olarak işaretlenir.
- **Yönetim paneli**
  - Kontrol merkezi; ürün, teklif, eşleştirme, veri kaynağı ve görev yönetimi.
  - Puanlama, kategoriler, kuponlar, editoryal içerik, uçuş rotaları, sponsorlu yerleşimler,
    satış ortaklığı.
  - Kullanıcılar, denetim kaydı, raporlar.
- **Diğer**
  - Açık/koyu tema, mobil öncelikli özgün tasarım.
  - SEO (sitemap, yapılandırılmış veri, OG görseli), güvenlik başlıkları.

## Hızlı başlangıç

```bash
cp .env.example .env               # DATABASE_URL (PostgreSQL 14+)
npm ci
npm run db:migrate && npm run db:seed
npm run db:seed:demo               # isteğe bağlı: "Test verisi" etiketli demo katalog
npm run admin:create -- siz@ornek.com "GüçlüBirParola123"
npm run dev                        # http://localhost:3000  (panel: /admin)
npm run worker                     # ayrı terminalde
```

Docker ile (PostgreSQL + göç + web + worker):

```bash
cp .env.example .env               # POSTGRES_PASSWORD ve diğer değerler
docker compose up -d --build
```

## Komutlar

| Komut | |
|---|---|
| `npm run dev` / `build` / `start` | Web uygulaması |
| `npm run worker` | Sürekli çalışan zamanlayıcı ve görev işleyici |
| `npm run jobs:run [-- <tür> <kaynak>]` | Görevleri bir kez çalıştır |
| `npm run db:migrate` / `db:seed` / `db:seed:demo` | Şema, temel veri, demo (test) verisi |
| `npm run admin:create -- <e-posta> <parola>` | Yönetici hesabı |
| `npm run test:unit` / `test:integration` / `test:e2e` | Testler (bkz. [docs/TESTING.md](docs/TESTING.md)) |
| `npm run lint` / `typecheck` | Statik denetim |

## Belgeler

| Belge | İçerik |
|---|---|
| [docs/STATUS.md](docs/STATUS.md) | Gerçek veri ile test verisi ayrımı, eksikler, gerekli hesaplar, sonraki adımlar |
| [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) | Kaynaklar, entegrasyon gereksinimleri, doğrulanmış ve doğrulanmamış maliyetler |
| [docs/PRICING.md](docs/PRICING.md) | Fiyat geçmişi, doğrulanmış indirim formülü, fırsat puanı, etiket koşulları, alarmlar, eşleştirme |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Mimari, veri modeli, görev sistemi, teknik kararlar |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Kurulum, ortam değişkenleri, Docker / sunucu / Vercel dağıtımı |
| [docs/ADMIN.md](docs/ADMIN.md) | Yönetim paneli rehberi |
| [docs/SECURITY.md](docs/SECURITY.md) | Güvenlik önlemleri ve KVKK |
| [docs/TESTING.md](docs/TESTING.md) | Test kapsamı ve son çalıştırma sonuçları |
| [docs/BRAND.md](docs/BRAND.md) | Marka adı önerileri |

## Teknoloji

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- PostgreSQL + Prisma 7 (`pg_trgm`, `unaccent`)
- zod, fast-xml-parser, nodemailer
- Vitest, Playwright

## Veri ilkeleri

- Scraping, CAPTCHA aşma veya yetkisiz oturum kullanılmaz; yalnızca resmî API'ler ve izinli
  feed'ler.
- Fiyat, stok, indirim, kupon veya satın alma bağlantısı üretilmez. Her fiyat kaynağı ve kontrol
  zamanıyla gösterilir.
- Test verisi her yerde etiketlidir, gerçek mağazaya yönlendirmez ve üretimde varsayılan olarak
  gizlidir.
- API anahtarları yalnızca ortam değişkenlerindedir; depoya yazılmaz.
