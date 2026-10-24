# Kurulum ve dağıtım

## Gereksinimler

- Node.js **22.12+** (geliştirmede 22.22 kullanıldı)
- PostgreSQL **14+** ve `pg_trgm` + `unaccent` eklentileri. İkisi de PostgreSQL'in standart contrib
  paketindedir ve "trusted" eklentilerdir; veritabanı sahibi oluşturabilir. İlk göç bunları
  `CREATE EXTENSION IF NOT EXISTS` ile kurar. Yönetilen bir veritabanı kullanıyorsanız bu iki
  eklentinin desteklendiğini doğrulayın.
- E-posta için bir SMTP hesabı (isteğe bağlı; yoksa yalnızca site içi bildirim çalışır).

## Yerel geliştirme

```bash
cp .env.example .env            # DATABASE_URL'yi düzenleyin
npm ci                          # postinstall: prisma generate (src/generated/prisma)
npm run db:migrate              # şema + eklentiler
npm run db:seed                 # kategoriler, mağazalar, veri kaynakları, havalimanları, rotalar, zamanlamalar
npm run db:seed:demo            # (isteğe bağlı) "Test verisi" etiketli örnek katalog ve uçuşlar
npm run admin:create -- siz@ornek.com "GüçlüBirParola123"
npm run dev                     # http://localhost:3000
npm run worker                  # ayrı terminalde: zamanlayıcı + görev kuyruğu
```

Tek seferlik görev çalıştırmak için (worker olmadan):

```bash
npm run jobs:run                          # zamanı gelenleri planla ve çalıştır
npm run jobs:run -- retail.refresh amazon-tr
```

**Demo verisi hakkında:** `db:seed:demo` kurgusal markalar ve mağazalarla, gerçek ingestion hattı
üzerinden 180 günlük **test** fiyat geçmişi üretir. Bu kayıtların hepsi `isTestData=true`
taşır ve arayüzde "Test verisi" rozetiyle görünür. Test teklifleri gerçek mağazaya yönlendirmez;
"test bağlantısı" açıklama sayfasına gider. Üretimde `SHOW_TEST_DATA` varsayılan olarak `false`'tur
ve test verisi ziyaretçilere gösterilmez.

## Ortam değişkenleri

Tam liste ve açıklamalar: [`.env.example`](../.env.example).

- **Gizli değerler yalnızca ortam değişkenlerinde tutulur.** Veritabanına veya kaynak koduna
  yazılmaz.
- Yönetim paneli değişkenlerin yalnızca **adlarını** ve tanımlı olup olmadıklarını gösterir.
- Veri kaynağı ayarları yalnızca izin verilen ön eklerdeki değişkenlere başvurabilir: `AMAZON_`,
  `TRENDYOL_`, `HEPSIBURADA_`, `FEED_`, `TRAVELPAYOUTS_`, `DUFFEL_`, `PARTNER_`.

Üretim için asgari değerler:

| Değişken | Not |
|---|---|
| `DATABASE_URL` | Üretim veritabanı |
| `NEXT_PUBLIC_SITE_URL` | Canonical, sitemap ve e-posta bağlantıları için gerçek alan adı |
| `ANALYTICS_SALT` | ≥ 16 karakter rastgele; anonim tıklama özetleri için |
| `CRON_SECRET` | ≥ 16 karakter; yalnızca HTTP cron kullanılıyorsa |
| `SMTP_*`, `EMAIL_FROM` | E-posta bildirimleri için |
| Entegrasyon anahtarları | Bkz. [DATA-SOURCES.md](DATA-SOURCES.md) |

Eksik veya zayıf yapılandırmalar yönetim panelinin kontrol merkezinde "Yapılandırma uyarıları"
olarak listelenir.

## Seçenek A — Docker Compose (tek sunucu, önerilen)

PostgreSQL, şema göçü, web ve worker tek komutla çalışır.

```bash
cp .env.example .env            # POSTGRES_PASSWORD, NEXT_PUBLIC_SITE_URL, ANALYTICS_SALT, SMTP_*, anahtarlar
docker compose up -d --build
docker compose exec web npx tsx scripts/create-admin.ts siz@ornek.com "GüçlüBirParola123"
```

- `migrate` servisi her açılışta `prisma migrate deploy` ve temel tohumlamayı çalıştırır
  (idempotent). Ardından `web` ve `worker` başlar.
- Worker `SIGTERM` alınca yeni görev almayı bırakır ve çalışan görevlerin bitmesini bekler
  (`stop_grace_period: 60s`).
- Web konteynerinin sağlık kontrolü `/api/health` uç noktasını kullanır.
- Önüne TLS sonlandıran bir ters vekil (Caddy, Nginx, Traefik) koyun. Üretimde HSTS başlığı
  gönderilir.

Docker Hub hız sınırına takılırsanız:

```bash
docker build --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22.22-bookworm-slim -t fiyatiz:local .
```

TLS denetimli kurumsal proxy arkasında derliyorsanız CA paketini secret olarak verin:
`docker build --secret id=ca,src=/yol/ca.crt .`

> Bu kurulum 24.10.2026'da bu depoda derlenip çalıştırıldı. `migrate` başarıyla tamamlandı,
> `web` sağlıklıydı ve `worker` görevleri işledi. Anahtarı olmayan kaynaklar gerekçesiyle
> atlandı.

## Seçenek B — Sunucu üzerinde süreç yöneticisiyle

```bash
npm ci && npm run build
npm run db:migrate && npm run db:seed
npm start                 # web (PORT ortam değişkeni)
npm run worker            # ayrı süreç (systemd, pm2 vb. ile sürekli çalıştırın)
```

Birden fazla worker güvenle paralel çalışabilir:

- görevler `FOR UPDATE SKIP LOCKED` ile alınır;
- aynı veri kaynağı için aynı anda yalnızca bir görev çalışır;
- zamanlama planlayıcısı iyimser kilit kullanır.

## Seçenek C — Vercel + yönetilen PostgreSQL

Vercel'de sürekli çalışan worker yoktur. Bu kurulumda görevler `/api/cron/tick` uç noktası
üzerinden çalışır.

- **Hobby planı uygun değil:**
  - yalnızca kişisel, ticari olmayan kullanım içindir;
  - cron en sık günde bir kez çalışır.

  Kaynak: [Vercel cron limitleri](https://vercel.com/docs/cron-jobs/usage-and-pricing),
  [Vercel fiyatlandırma](https://vercel.com/pricing).
- Depodaki [`vercel.json`](../vercel.json) hazırdır. Pro plan gerektirir; Hobby'de 5 dakikalık
  cron dağıtımı reddedilir. Dosyanın yaptıkları:
  - **Derleme:** `npm run vercel-build` = göçler + temel veri (idempotent) + `next build`. Terminal
    gerekmez.
  - **Bölge:** fonksiyonlar `fra1` (Frankfurt) bölgesinde çalışır; veritabanını da Frankfurt'ta
    açın.
  - **Cron:** `/api/cron/tick` her 5 dakikada bir çağrılır.
- **İlk yönetici:** `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ortam değişkenlerini tanımlayıp dağıtın.
  Hesap oluştuktan sonra `ADMIN_PASSWORD`'ü silin. Var olan hesaplara dokunulmaz.
- **Neon gibi havuzlu bağlantı veren veritabanlarında:**
  - `DATABASE_URL` = havuzlu adres (`-pooler` içeren);
  - `DIRECT_DATABASE_URL` = doğrudan adres (göçler için);
  - `DATABASE_POOL_MAX=3` (sunucusuz ortamda örnek başına az bağlantı).
- `NEXT_PUBLIC_*` değişkenleri derleme sırasında sayfalara gömülür. Değiştirdiğinizde yeniden
  dağıtın.

  `CRON_SECRET` ortam değişkeni tanımlandığında Vercel isteğe `Authorization: Bearer <CRON_SECRET>`
  ekler; uç nokta bunu sabit zamanlı karşılaştırmayla doğrular.
  ([Securing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs))
- Vercel cron teslimatı "best effort"tur: çağrı kaçabilir veya iki kez gelebilir. Planlayıcı her
  zaman dilimi için tekil `dedupeKey` kullandığından çift çağrı çift görev üretmez; kaçan çağrıda
  zamanı geçmiş görevler bir sonraki tick'te planlanır.
- Uç nokta, verilen süre bütçesi (`?budget=` ms, en fazla 280 sn) içinde kuyruğu işler. Uzun tam
  senkronlar birden fazla tick'e yayılır.
- Alternatif olarak herhangi bir dış zamanlayıcı (GitHub Actions, sistem cron'u) aynı uç noktayı
  çağırabilir:

  ```bash
  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://alanadiniz/api/cron/tick
  ```

## Ölçekleme notları

- **İstek sınırlayıcı bellek içidir** (giriş, kayıt, parola sıfırlama, arama önerisi, uçuş araması,
  tıklama kaydı). Birden fazla web örneği
  çalıştırıyorsanız sınırlar örnek başına uygulanır; ortak bir depo (ör. Redis) ile
  değiştirilmelidir.
- **Arama**, PostgreSQL trigram indeksiyle çalışır (`Product.searchText` üzerinde GIN). On binlerce
  ürüne kadar yeterlidir; çok daha büyük kataloglarda ayrı bir arama motoru düşünülebilir.
- `PriceSnapshot` yalnızca değişimde ve 20 saatte bir yazılır. Yine de büyüdükçe aylık bölümleme
  (partitioning) planlayın.

## Yedekleme

- Veritabanını günlük yedekleyin (`pg_dump` veya sağlayıcının otomatik yedeği).
- Fiyat geçmişi, platformun yeniden üretilemeyen tek varlığıdır.
