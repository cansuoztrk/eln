# Fiyatiz'i yayına alma rehberi (adım adım)

Bu rehber teknik bilgisi olmayan biri için yazıldı. Adımları **sırayla** izleyin. Her adımda ne
yapacağınız, nereye tıklayacağınız ve sonunda neyi görmeniz gerektiği yazıyor.

Son kontrol: 24 Ekim 2026. Sitelerin menü adları zamanla değişebilir; ekranda birebir aynı yazıyı
görmezseniz en yakın seçeneği arayın.

> **Kısaca durum:** Yazılım hazır. Yapmanız gerekenler hesap açmak, ödeme yapmak, birkaç ayar
> değeri yazmak ve resmî işleri halletmek. Kod tarafında bir şey yazmanız gerekmiyor.

---

## Yol haritası

| Aşama | Ne yapılır | Süre (tahmini) | Para gerekir mi? |
|---|---|---|---|
| 1. Marka ve alan adı | Marka araştırması, alan adı satın alma | 1–3 gün | Evet (alan adı, isterseniz marka başvurusu) |
| 2. Resmî hazırlık | Muhasebeci ve hukukçu görüşmesi | 1–2 hafta (paralel yürür) | Evet (danışmanlık) |
| 3. Siteyi internete koymak | Veritabanı (Neon) + barındırma (Vercel) | 1–2 saat | Evet (Vercel Pro $20/ay) |
| 4. Gerçek veri | Uçuş verisi, ilk mağaza feed'i, Amazon başvurusu | Günler – aylar | Uçuş verisi ücretsiz |
| 5. E-posta | Alarm e-postaları için gönderim servisi | 1–2 saat (+ onay bekleme) | Çok az |
| 6. Yasal metinler | KVKK ve diğer sayfaların doldurulması | Hukukçuya bağlı | Danışmanlık |
| 7. Yayın kontrolü | Son kontroller, Google'a bildirme | 1 saat | Hayır |

Aşama 2 ile 3 aynı anda yürüyebilir. Site, yasal metinler tamamlanmadan da internette olabilir
ama **duyurmadan önce** 6. aşamayı bitirin.

---

## Aşama 1 — Marka ve alan adı

### 1.1 Önce bilmeniz gereken: fiyatiz.com dolu

24 Ekim 2026'da yaptığım kontrol:

| Alan adı | Durum |
|---|---|
| **fiyatiz.com** | **Başkası tarafından alınmış.** 15 Aralık 2025'te Atak Domain üzerinden kaydedilmiş, bitiş tarihi 15 Aralık 2026. Şu an yanıt veren bir site yok. |
| fiyatiz.net, fiyatiz.app, fiyatiz.co, fiyatiz.io | Kayıtlı görünmüyor (satın alana kadar garanti değil) |
| fiyatiz.com.tr | Bu ortamdan sorgulanamadı. Siz kontrol edin (aşağıda nasıl yapılacağı var). |

Bu ne anlama geliyor?

- `.com` adresini kullanamazsınız. Sahibiyle anlaşırsanız satın alabilirsiniz, ama fiyatı sahibine
  bağlıdır.
- **Daha önemlisi:** Aynı adı birisi 10 ay önce almış. Bu kişi aynı markayla bir iş kurmayı
  planlıyor olabilir. Bu yüzden **1.2'deki marka araştırmasını atlamayın**. Araştırmada "Fiyatiz"
  adına yapılmış bir marka başvurusu çıkarsa, para harcamadan önce başka bir ad seçmek en
  ucuzudur.
- Türkiye odaklı bir site için **fiyatiz.com.tr** iyi bir ana adres olur.

### 1.2 Marka araştırması (TÜRKPATENT)

1. [TÜRKPATENT](https://www.turkpatent.gov.tr) sitesine gidin ve marka araştırma bölümünü açın.
   Gerekirse e-Devlet ile giriş yapın.
2. "fiyatiz" yazıp arayın. Benzer yazılışları da deneyin: "fiyat iz", "fiyatız".
3. Şu sınıflara özellikle bakın:
   - **35:** reklamcılık, çevrimiçi karşılaştırma ve ticari hizmetler;
   - **42:** yazılım ve internet platformu;
   - **39:** seyahat düzenleme ve bilgilendirme (uçak bileti bölümü için).
4. **Sonuç temizse:** markanızı başvuruyla güvence altına almanızı öneririm. Başvuru ücretleri
   her yıl değişiyor ve bulduğum kaynaklar birbiriyle çelişiyordu. Güncel tutarları TÜRKPATENT'in
   ücret tarifesinden kontrol edin.
5. **Emin olamazsanız:** bir marka vekiline danışın. Benzerlik değerlendirmesi uzmanlık ister.

### 1.3 Alan adını satın alma

1. Bir alan adı firmasına üye olun. `.com.tr`, BTK'nın yetkili kayıt kuruluşu listesindeki
   firmalardan alınır.
2. Arama kutusuna `fiyatiz.com.tr` yazın:
   - **Boşsa** sepete ekleyin. `.com.tr` 2022'den beri belge istenmeden, "ilk başvuran alır"
     usulüyle veriliyor ([kaynak](https://comlaude.com/removal-of-restrictions-for-com-tr/)).
   - **Doluysa** `fiyatiz.net` veya `fiyatiz.app` gibi bir uzantıya bakın ya da adı yeniden
     düşünün.
3. Satın alırken şu ayarları yapın:
   - **Otomatik yenileme açık.** Alan adının süresinin dolması siteyi kapatır.
   - **Transfer kilidi açık.**
   - Hesabınızda **iki adımlı doğrulama açık.**
4. Şimdilik DNS ayarlarına dokunmayın. 3.6'da Vercel size ne yazacağınızı söyleyecek.

---

## Aşama 2 — Resmî hazırlık

Bunlar hukuki ve mali konular. Kesin cevabı muhasebeciniz ve hukukçunuz verir. Görüşmeye
aşağıdaki soruları götürün.

**Muhasebeciye sorulacaklar:**

- Satış ortaklığı (affiliate) komisyonu ve sponsorlu yerleşim geliri alacağım. Şahıs şirketi mi
  kurmalıyım, başka bir yapı mı?
- Yurt dışı programlardan (Amazon, Travelpayouts) gelen komisyonu nasıl faturalandırırım?
- Gelirleri hangi banka hesabına almalıyım?

**Hukukçuya sorulacaklar:**

- KVKK'ya göre **veri sorumlusu** kim olacak (şirket mi, şahıs mı)? **VERBİS** kaydı gerekiyor
  mu?
- Sunucularım yurt dışında olacak (Vercel ve Neon, Frankfurt). Bu **yurt dışına veri aktarımı**
  sayılır mı? Neler yapmam gerekir?
- Haftalık fırsat bülteni "ticari elektronik ileti" sayılır mı? **İYS** kaydı gerekir mi?
- Hazır taslak metinleri inceler misiniz? (`/kvkk`, `/gizlilik`, `/cerezler`,
  `/kullanim-kosullari`, `/satis-ortakligi`)

---

## Aşama 3 — Siteyi internete koymak

Önerdiğim yol: **Neon** (veritabanı) + **Vercel** (barındırma). İkisi de tamamen tarayıcıdan
yönetilir; terminal veya sunucu bilgisi gerekmez.

> Kendi sunucunuzda veya Türkiye'deki bir barındırmada çalıştırmak isterseniz Docker kurulumu da
> hazır ([DEPLOYMENT.md](DEPLOYMENT.md)). Bu yol için bir geliştiriciden yardım almanız gerekir.

### 3.0 Bir şifre yöneticisi kullanın

Bu süreçte çok sayıda gizli değer üreteceksiniz: veritabanı adresleri, API anahtarları, parolalar.

- Hepsini bir **şifre yöneticisine** kaydedin (ör. Bitwarden, 1Password).
- Bu değerleri **asla** e-postayla, mesajla veya ekran görüntüsüyle paylaşmayın. Bana da
  göndermeyin; hiçbirine ihtiyacım yok.

### 3.1 Kodun yayın dalına alınması

- Kod şu an GitHub'daki `cansuoztrk/eln` deposunda, `claude/stoic-clarke-efudhr` dalında.
- Deponun ana dalı (`main`) neredeyse boş.
- Vercel varsayılan olarak ana daldan yayın yapar.

**Yapılacak:** bu dalı `main`'e birleştirmek. İsterseniz birleştirme isteğini (pull request) ben
açarım; siz GitHub'da "Merge" düğmesine basarsınız.

> **Not:** Bu depoda başka projelere ait dallar da var. `main` başka bir iş için kullanılıyorsa
> Fiyatiz için ayrı bir depo (`fiyatiz`) açmak daha düzenli olur. Bunda da yardımcı olabilirim.

### 3.2 Veritabanı: Neon

1. [neon.com](https://neon.com) → **Sign up** → GitHub hesabınızla giriş yapın.
2. **Create project** → ayarlar:
   - Proje adı: `fiyatiz`.
   - **Region (bölge):** `AWS Europe Central 1 (Frankfurt)`. Vercel'i de Frankfurt'ta
     çalıştıracağız; ikisinin aynı yerde olması siteyi hızlandırır.
   - Postgres sürümü: varsayılan kalabilir (14 veya üstü).
3. Proje açılınca **Connect** düğmesine basın. İki adres kopyalayıp şifre yöneticinize
   kaydedin:
   - **Havuzlu adres:** "Connection pooling" **açıkken** görünen adres; içinde `-pooler` geçer.
     Bu, `DATABASE_URL` olacak.
   - **Doğrudan adres:** "Connection pooling" **kapalıyken** görünen adres. Bu,
     `DIRECT_DATABASE_URL` olacak.
4. **Plan:** ücretsiz planla başlayabilirsiniz (proje başına 100 hesaplama saati ve 1 GB).
   Fiyat geçmişi büyüdükçe ücretli plana geçersiniz; ücretli planda kullandığınız kadar
   ödersiniz ([Neon fiyatları](https://neon.com/pricing)).

### 3.3 İki gizli değer üretin

Şifre yöneticinizin parola üreticisiyle **40 karakterlik**, yalnızca harf ve rakamdan oluşan iki
değer üretin ve kaydedin:

- `ANALYTICS_SALT`: anonim tıklama istatistikleri için.
- `CRON_SECRET`: otomatik görevlerin güvenliği için.

Bir de yönetim paneli parolası belirleyin: `ADMIN_PASSWORD`. En az 10 karakter olmalı, harf ve
rakam içermeli; uzun olması daha iyi.

### 3.4 Barındırma: Vercel

1. [vercel.com](https://vercel.com) → **Sign Up** → GitHub hesabınızla giriş yapın.
2. **Pro plana geçin.** Ücret [$20/ay](https://vercel.com/pricing). Ücretsiz Hobby planı iki
   nedenle uygun değil:
   - ticari kullanıma izin vermiyor;
   - otomatik görevleri yalnızca günde bir kez çalıştırıyor
     ([kaynak](https://vercel.com/docs/cron-jobs/usage-and-pricing)). Fiyatların saatlik
     kontrolü için yetmez.
3. **Add New… → Project** → GitHub deposu listesinden `eln`'i (veya ayrı depo açtıysanız
   `fiyatiz`'i) seçin → **Import**.
4. Framework "Next.js" olarak kendiliğinden gelir. Build ayarlarına dokunmayın; depodaki
   `vercel.json` dosyası gerekenleri kendisi yapar:
   - veritabanı tablolarını kurar;
   - temel verileri yükler;
   - yönetici hesabını açar;
   - otomatik görevleri her 5 dakikada bir çalıştırır.
5. **Environment Variables** bölümüne aşağıdaki değerleri tek tek ekleyin:

| Ad | Değer |
|---|---|
| `DATABASE_URL` | Neon'un **havuzlu** adresi (`-pooler` içeren) |
| `DIRECT_DATABASE_URL` | Neon'un **doğrudan** adresi |
| `DATABASE_POOL_MAX` | `3` |
| `NEXT_PUBLIC_BRAND_NAME` | `Fiyatiz` |
| `NEXT_PUBLIC_SITE_URL` | Şimdilik boş bırakın; 3.6'da alan adınızı yazacaksınız |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Sitede görünecek iletişim adresi (ör. `iletisim@fiyatiz.com.tr`) |
| `ANALYTICS_SALT` | 3.3'te ürettiğiniz ilk değer |
| `CRON_SECRET` | 3.3'te ürettiğiniz ikinci değer |
| `ADMIN_EMAIL` | Yönetim paneline gireceğiniz e-posta |
| `ADMIN_PASSWORD` | 3.3'te belirlediğiniz parola |

6. **Deploy**'a basın. Derleme birkaç dakika sürer.

**Yapmayın:**

- `SHOW_TEST_DATA` değişkenini eklemeyin. Eklemezseniz test verisi gizli kalır.
- "Demo verisi" komutunu üretim veritabanında çalıştırmayın. Örnek ürünler yalnızca geliştirme
  içindir.

### 3.5 İlk kontrol

Vercel size `https://...vercel.app` biçiminde bir adres verir.

1. **Ana sayfayı açın.** "0 güncel teklif" ve "Henüz doğrulanmış güncel teklif yok" gibi boş
   durumlar görmelisiniz. Bu **doğru**: henüz veri kaynağı bağlı değil ve site uydurma fiyat
   göstermez.
2. **Sağlık kontrolü:** adresin sonuna `/api/health` ekleyip açın. `"ok":true` görmelisiniz.
3. **Yönetim paneli:**
   - Adresin sonuna `/admin` ekleyin ve `ADMIN_EMAIL` ile `ADMIN_PASSWORD` bilgileriyle giriş
     yapın.
   - "Kontrol merkezi" açılmalı.
   - Sarı kutudaki **Yapılandırma uyarıları** henüz tamamlamadığınız ayarları (e-posta, site
     adresi) listeler; şimdilik normal.
4. **Güvenlik:** Vercel'de **Settings → Environment Variables** bölümünden `ADMIN_PASSWORD`'ü
   silin. Hesap oluştu; değişkene artık gerek yok. `ADMIN_EMAIL` kalabilir.
5. **Otomatik görevler:** **Settings → Cron Jobs** sayfasında `/api/cron/tick` görünmeli. Yönetim
   panelinde **Görevler ve zamanlama** sayfası birkaç dakika içinde dolmaya başlar. Anahtarı
   olmayan kaynaklar "kimlik bilgisi bekliyor" gerekçesiyle atlanır; bu bir hata değil.

### 3.6 Alan adını bağlama

1. Vercel → projeniz → **Settings → Domains** → `fiyatiz.com.tr` yazıp ekleyin. `www.fiyatiz.com.tr`
   için de aynısını yapın.
2. Vercel size eklemeniz gereken DNS kayıtlarını gösterir (genellikle bir `A` ve bir `CNAME`).
3. Alan adı firmanızın paneline girin → **DNS yönetimi** → Vercel'in gösterdiği kayıtları birebir
   ekleyin.
4. Birkaç dakika ile 48 saat arasında Vercel "Valid Configuration" gösterir. HTTPS sertifikası
   kendiliğinden kurulur.
5. **Environment Variables**'a dönün:
   - `NEXT_PUBLIC_SITE_URL` = `https://fiyatiz.com.tr` yazın;
   - ardından **Deployments → en üstteki → Redeploy** yapın.

   Bu adres site haritası, paylaşım bağlantıları ve e-postalardaki linkler için gereklidir.

---

## Aşama 4 — Gerçek veriyi bağlamak

Bu sırayla ilerleyin: en kolay ve ücretsiz olandan zora doğru.

### 4.1 Uçak bileti verisi: Travelpayouts (ücretsiz, ilk iş bu)

Travelpayouts'un veri API'si için trafik şartı yok; kayıt olup anahtar (token) almak yeterli
([kaynak](https://support.travelpayouts.com/hc/en-us/articles/203956083-Requirements-for-Aviasales-data-API-access)).

1. [travelpayouts.com](https://www.travelpayouts.com) → kayıt olun. Sitenizin adresini
   `https://fiyatiz.com.tr` olarak girin.
2. Programlar arasından **Aviasales**'e katılın. Bu, uçuş bağlantılarından komisyon kazanmanız
   içindir.
3. **Profil → API token** bölümünden anahtarınızı kopyalayın. Ortaklık kimliğinizi (**marker**)
   de not alın.
4. Vercel → **Environment Variables**:
   - `TRAVELPAYOUTS_TOKEN` = token;
   - `TRAVELPAYOUTS_MARKER` = marker.

   Sonra **Redeploy** yapın.
5. Yönetim paneli → **Veri kaynakları → Travelpayouts** → **Bağlantıyı test et** → **Şimdi
   çalıştır**.
6. Birkaç dakika sonra uçak bileti sayfasında İstanbul, Ankara ve İzmir çıkışlı rotalar görünür.

Bilmeniz gerekenler:

- Bu fiyatlar Aviasales kullanıcılarının son 48 saatteki aramalarından gelen **gösterge
  fiyatlardır**. Sitede "satın alma sayfasında değişebilir" notuyla gösterilir.
- İzlenen rotaları **Yönetim → Uçuş rotaları** sayfasından ekleyip çıkarabilirsiniz.

### 4.2 İlk mağaza: ürün feed'i

Ürün fiyatlarının en hızlı yolu, bir mağazanın **resmî ürün listesi dosyasını** (feed) kullanmaktır.
İki yol var:

**A) Satış ortaklığı ağı üzerinden**

- Türkiye'de çalışan satış ortaklığı ağlarına (ör. Admitad) yayıncı olarak üye olun.
- Mağaza programlarına başvurun. Kabul edildiğiniz programın araçlarında **"Product feed" /
  "Ürün feed'i"** bölümü varsa oradaki adresi kopyalayın.
- Hangi mağazanın feed verdiği programdan programa değişir; başvurmadan önce program sayfasına
  bakın.
- Bonus: bu yolla verilen bağlantılar komisyon da kazandırır.

**B) Doğrudan mağazadan**

- Google Alışveriş'te reklam veren mağazaların zaten bir "Google Merchant" ürün feed'i vardır.
- Mağazaya yazıp bu feed'i fiyat karşılaştırması için kullanma izni isteyin. İzni **yazılı**
  alın; e-posta yazışması yeterli olabilir.

Feed adresini aldıktan sonra:

1. Vercel → **Environment Variables** → yeni değişken: adı `FEED_` ile başlamalı (ör.
   `FEED_ORNEKMAGAZA_URL`), değeri feed adresi. **Redeploy** yapın.
   - Feed adresi genellikle gizli bir anahtar içerir; bu yüzden yönetim paneline değil, buraya
     yazılır.
2. Yönetim paneli → **Veri kaynakları → Ürün feed'i ekle**:
   - mağaza adı;
   - değişken adı (`FEED_ORNEKMAGAZA_URL`);
   - biçim: "otomatik";
   - yenileme aralığı.
3. **Bağlantıyı test et** → **Şimdi çalıştır**.
4. **Görevler** sayfasında işin ayrıntısını açın: kaç ürün eklendi, kaçı neden atlandı (fiyatsız,
   ikinci el vb.).
5. **Eşleştirme incelemesi** sayfasındaki adayları onaylayın veya reddedin. Sistem emin olmadığı
   eşleşmeleri asla kendi kendine birleştirmez.

**Sabırlı olun:** "Doğrulanmış indirim" ve "Son 30 günün en düşüğü" gibi etiketler, sistem bir
ürünün fiyatını yeterince uzun süre izledikten sonra görünür (30 günün en az 20 günü). İlk
haftalarda bu etiketlerin az olması normaldir. Siteyi bu yüzden erken açmak avantajlıdır.

### 4.3 Amazon Türkiye

Dürüst durum: Amazon Türkiye ortaklık programının güncel başvuru koşullarını resmî bir kaynaktan
doğrulayamadım. Bir kaynak programın davetle çalıştığını söylüyor
([Geniuslink](https://geniuslink.com/blog/?p=1284), tarihsiz).

Ürün verisi için kullanılan Creators API'ye kayıt için iki koşul var
([Amazon](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api)):

- ortaklık hesabının kabul edilmiş olması;
- hesabın nitelikli satış yönlendirmiş olması.

Yani **Amazon en son bağlanacak kaynaktır.** Adımlar:

1. Site yayında ve içerikli olduktan sonra amazon.com.tr'nin alt kısmındaki ortaklık programı
   bağlantısından başvurun veya Amazon Türkiye'ye yazın.
2. Kabul edilirseniz, nitelikli satış koşulu sağlandıktan sonra Associates Central'dan **Creators
   API**'ye kaydolun.
3. Aldığınız bilgileri Vercel'e girin:
   - `AMAZON_CREATORS_CLIENT_ID`
   - `AMAZON_CREATORS_CLIENT_SECRET`
   - `AMAZON_PARTNER_TAG`

   Sonra **Redeploy** yapın.
4. **Veri kaynakları → Amazon Türkiye** → **Bağlantıyı test et**. İlk gerçek bağlantıda bana haber
   verin: Amazon'un yanıt biçimini birlikte doğrulayalım.

### 4.4 Trendyol ve Hepsiburada

Bu platformların açık API'leri yalnızca kendi satıcıları için. Karşılaştırma sitelerine açık
resmî bir veri yolu bulamadım. Bu yüzden **veri ortaklığı** istemeniz gerekiyor:

- Kurumsal iletişim veya iş geliştirme birimlerine yazın.
- Ayrıca üye olduğunuz satış ortaklığı ağlarında bu mağazaların programı olup olmadığına bakın.

Örnek e-posta:

> Konu: Fiyat karşılaştırma platformu için ürün veri akışı talebi
>
> Merhaba, Fiyatiz (fiyatiz.com.tr) adlı bir fiyat karşılaştırma ve fırsat platformu
> işletiyoruz. Kullanıcılarımızı ürün sayfalarınıza yönlendiriyoruz; fiyatları yalnızca resmî
> kaynaklardan, kontrol zamanıyla birlikte gösteriyoruz. Ürün, fiyat ve stok bilgilerinizi resmî
> bir ürün akışı (XML/CSV) veya satış ortaklığı programı üzerinden kullanabilmek için hangi
> koşullarla iş birliği yapabileceğimizi öğrenmek isteriz. İyi çalışmalar.

Feed alırsanız 4.2'deki adımlarla bağlanır. Değişken adları hazır:
`TRENDYOL_PARTNER_FEED_URL`, `HEPSIBURADA_PARTNER_FEED_URL`.

### 4.5 Canlı uçuş araması: Duffel (isteğe bağlı, sonra)

Travelpayouts gösterge fiyat verir. Duffel ise anlık arama yapar ama ücretlidir:

- [sipariş başına $3 + %1](https://duffel.com/pricing);
- arama/satış oranı 1500:1'i aşarsa arama başına $0,005.

Trafiğiniz oluştuktan sonra değerlendirin.

---

## Aşama 5 — E-posta (fiyat alarmı bildirimleri)

E-posta ayarı yapılmadan da site çalışır; alarmlar site içi bildirim olarak görünür. E-posta
için bir gönderim servisi gerekir. Örnek: [Amazon SES](https://aws.amazon.com/ses/pricing/),
1.000 e-posta için $0,10.

1. Servise kaydolun ve **alan adınızı doğrulayın**. Servis size SPF, DKIM ve DMARC adlı DNS
   kayıtları verir; bunları alan adı firmanızın DNS paneline ekleyin. Bu kayıtlar e-postaların
   spam'e düşmemesi için gereklidir.
2. Amazon SES yeni hesapları kısıtlı modda başlatır. Panelden **üretim erişimi (production
   access)** isteyin.
3. Servisin verdiği **SMTP bilgilerini** Vercel'e girin ve **Redeploy** yapın:

| Ad | Değer |
|---|---|
| `SMTP_HOST` | Servisin SMTP sunucusu |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | SMTP kullanıcı adı |
| `SMTP_PASS` | SMTP parolası |
| `EMAIL_FROM` | `Fiyatiz <bildirim@fiyatiz.com.tr>` |

4. **Deneme:** sitede kendinize "Parolamı unuttum" e-postası gönderin. Gelen kutunuza düşmeli.

---

## Aşama 6 — Yasal metinler

Şu sayfalarda **köşeli parantez içindeki** alanlar doldurulmalı: `/kvkk`, `/gizlilik`,
`/cerezler`, `/kullanim-kosullari`, `/satis-ortakligi`.

Bana şu bilgileri verin, sayfaları ben doldurayım:

- Veri sorumlusunun adı veya unvanı, adresi, iletişim e-postası.
- Şirket kurduysanız MERSİS ve vergi numarası.
- Kullandığınız hizmet sağlayıcılar. Bu rehberi izlediyseniz: Vercel (barındırma), Neon
  (veritabanı), seçtiğiniz e-posta servisi. Hukukçunuzun yurt dışı aktarımla ilgili kararı.
- Hukukçunuzun istediği düzeltmeler.

Sitenin bugünkü teknik davranışı (zorunlu çerez dışında çerez yok, anonim tıklama sayımı, veri
indirme ve hesap silme, saklama süreleri) metinlere doğru şekilde yazıldı. Hukuki uygunluğu
hukukçunuz onaylamalı.

---

## Aşama 7 — Yayın öncesi kontrol listesi

- [ ] Yönetim panelindeki **Yapılandırma uyarıları** kutusu boş.
- [ ] Ana sayfada "Test verisi" rozetli ürün **yok**.
- [ ] Yasal sayfalarda köşeli parantez kalmadı.
- [ ] Kendinize normal bir hesap açtınız ve şunları denediniz: favori → fiyat alarmı →
      **Hesap → Ayarlar → Verilerimi indir** → **Hesabı sil**.
- [ ] `https://fiyatiz.com.tr/robots.txt` ve `https://fiyatiz.com.tr/sitemap.xml` açılıyor.
- [ ] **Google Search Console:** alan adınızı ekleyin, DNS ile doğrulayın, **Sitemaps** bölümüne
      `sitemap.xml` yazıp gönderin.
- [ ] **Kesinti takibi:** ücretsiz planı olan bir izleme servisine
      `https://fiyatiz.com.tr/api/health` adresini ekleyin. Site çökerse e-posta alırsınız.
- [ ] **Yedek:** Neon panelinde yedekleme ve geri yükleme ayarlarına bakın. Fiyat geçmişi
      sitenin en değerli ve yeniden üretilemeyen varlığıdır.

---

## Aşama 8 — Yayından sonra: günlük ve haftalık rutin

Platform kendi kendine çalışır. Sizin işiniz **istisnalara** bakmak.

**Her gün (5 dakika) — Yönetim → Kontrol merkezi:**

- **Başarısız görev var mı?** Ayrıntısına tıklayın:
  - `AUTH` → anahtarın süresi dolmuş veya yanlış;
  - `RATE_LIMITED` → kaynak yavaşlamamızı istiyor; aralığı biraz açın;
  - `FORMAT` → mağaza feed biçimini değiştirmiş.
- **Şüpheli fiyat var mı?** **Teklifler → Şüpheli** listesine bakın. Gerçek bir hata ise teklifi
  devre dışı bırakın.
- **Eşleştirme bekleyen var mı?** Onaylayın veya reddedin.

**Her hafta:**

- **Raporlar** sayfası: veri kalitesi, kaynak tazeliği, kategori trendleri.
- Vercel ve Neon kullanım ve fatura ekranları.

**Her ay:**

- Satış ortaklığı panellerindeki komisyon raporları.
- Alan adı ve plan yenileme tarihleri.

---

## Maliyet özeti

| Kalem | Tutar | Kaynak |
|---|---|---|
| Vercel Pro | $20/ay ($20 kullanım kredisi dâhil) | [vercel.com/pricing](https://vercel.com/pricing) |
| Neon veritabanı | Ücretsiz başlangıç; sonra hesaplama saati başına $0,106 (Launch) ve depolama GB-ay başına $0,35 | [neon.com/pricing](https://neon.com/pricing) |
| E-posta (Amazon SES örneği) | 1.000 e-posta başına $0,10 | [aws.amazon.com/ses/pricing](https://aws.amazon.com/ses/pricing/) |
| Travelpayouts | Ücretsiz | [Travelpayouts](https://support.travelpayouts.com/hc/en-us/articles/203956083-Requirements-for-Aviasales-data-API-access) |
| Duffel (isteğe bağlı) | Sipariş başına $3 + %1; fazla arama başına $0,005 | [duffel.com/pricing](https://duffel.com/pricing) |
| Alan adı | **Doğrulanmadı**; firmaya göre değişir | — |
| Marka başvurusu | **Doğrulanmadı**; kaynaklar çelişiyor, TÜRKPATENT tarifesine bakın | — |
| Muhasebeci ve hukukçu | **Doğrulanmadı** | — |

Başlangıçta asgari aylık sabit gider yaklaşık **$20** (Vercel). Buna alan adı ve danışmanlık
ücretleri eklenir.

---

## Kim ne yapar?

**Yalnızca sizin yapabilecekleriniz:**

- hesap açmak;
- ödeme yapmak;
- sözleşmeleri kabul etmek;
- mağazalar ve programlarla yazışmak;
- muhasebeci ve hukukçuyla görüşmek.

**Benim yapabileceklerim:**

- `main`'e birleştirme isteğini açmak veya Fiyatiz için ayrı bir depo hazırlamak.
- Yasal sayfaları verdiğiniz bilgilerle doldurmak.
- Yeni bir mağaza feed'i sorun çıkarırsa ayrıştırmayı düzeltmek.
- Amazon veya Travelpayouts ilk gerçek bağlantısında yanıtları birlikte doğrulamak.
- Logo, renk ve metin değişiklikleri.
- Türkiye'de bir sunucuya Docker ile kurulum için adım adım destek.
