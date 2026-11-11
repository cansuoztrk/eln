# KURULUM REHBERİ — Siteyi yayına alma

Bu rehber, siteyi sıfırdan internete çıkarmak için. Sırayla git; her adımın sonunda bir
**Kontrol** satırı var — o tutuyorsa bir sonrakine geç. Toplam süre yaklaşık bir saat.

> **Altın kural:** Bu rehberde geçen anahtarları (özellikle *Secret key*, veritabanı parolası,
> `APP_SECRET`, `SETUP_SECRET`) hiçbir sohbete, mesaja ya da koda yapıştırma. Yalnızca
> Vercel'in "Environment Variables" ekranına ve kendi parola yöneticine yaz.

## Büyük resim

Site iki parçadan oluşur:

| Parça | Ne işe yarar | Nerede durur |
| --- | --- | --- |
| **Veritabanı + dosyalar** | Mektuplar, notlar, fotoğraflar, hesaplar | **Supabase** |
| **Sitenin kendisi** | Sayfaları gösteren uygulama | **Vercel** |

Kod zaten GitHub'da (`cansuoztrk/eln`). Yapacağın şey: Supabase'de boş bir proje açıp içine
tabloları kurmak, sonra Vercel'e "bu kodu şu Supabase ile çalıştır" demek.

### Baştan bil

- **Ücret:** İkisi de ücretsiz planla başlar. Kredi kartı gerekmez.
- **Supabase'in ücretsiz planı, 7 gün hiç kullanılmayan projeyi duraklatır.** Site o zaman açılmaz;
  Supabase panelinden "Restore" ile geri açılır, veri kaybolmaz. İkinizden biri haftada bir kez
  bile girse duraklamaz. Hiç dert etmek istemezsen ücretli plan (yaklaşık 25 $/ay) bunu kaldırır.
- **Ücretsiz planda yaklaşık 1 GB dosya alanı var.** Her fotoğraf, orijinali ve üç küçük kopyasıyla
  saklanır; birkaç yüz fotoğrafa yeter. Güncel sınırlar: supabase.com/pricing.
- **Gereken hesaplar:** GitHub (var), Supabase, Vercel. Bir de bir bilgisayar.

---

## 1. Kodu ana dala al

Kod şu an `claude/pensive-keller-u5hzx2` adlı dalda duruyor. Vercel `main` dalını yayınlar; bu
yüzden önce kodu `main`'e alman gerekiyor.

1. `github.com/cansuoztrk/eln` adresini aç.
2. Üstte **Pull requests** → **New pull request**.
3. **base:** `main` · **compare:** `claude/pensive-keller-u5hzx2` seç.
4. **Create pull request** → açılan sayfada **Merge pull request** → **Confirm merge**.

**Kontrol:** Deponun ana sayfasında `src`, `docs`, `supabase` klasörlerini görüyorsun.

## 2. Supabase projesini aç

1. `supabase.com` → **Start your project** → GitHub hesabınla giriş yap.
2. **New project**:
   - **Name:** `elnare`
   - **Database Password:** "Generate a password"a bas ve parolayı **hemen bir yere kaydet**.
     Birazdan lazım olacak; sonradan görüntülenemez (yalnızca sıfırlanabilir).
   - **Region:** `Central EU (Frankfurt)` — İstanbul ile Bakü'nün ikisine de yakın.
3. **Create new project**. Hazır olması bir-iki dakika sürer.
4. **Project ID**'yi not et: **Project Settings → General** sayfasında yazar (yirmi harflik bir kod).
   Tarayıcı adresindeki `supabase.com/dashboard/project/`'ten sonraki kısım da odur.

**Kontrol:** Elinde iki şey var: veritabanı parolası ve Project ID.

## 3. Tabloları kur

Bu adım bilgisayarında, komut satırında yapılır. Bir kez yapılır.

### 3a. Hazırlık

1. **Node.js kur:** `nodejs.org` → **LTS** sürümünü indir, kur (hep "Next").
2. **Kodu indir:** GitHub'daki depo sayfasında yeşil **Code** düğmesi → **Download ZIP**.
   ZIP'i aç; `eln-main` adlı bir klasör çıkar. Kolay bulacağın bir yere koy (örneğin Masaüstü).
3. **O klasörde komut satırını aç:**
   - **Windows:** klasörün içinde boş bir yere sağ tıkla → **Terminalde aç**.
   - **Mac:** **Terminal** uygulamasını aç, `cd ` yaz (sonunda boşluk olsun), klasörü pencereye
     sürükle, Enter'a bas.

**Kontrol:** Aşağıdaki komut bir sürüm numarası yazıyor (20 ya da üstü).

```bash
node -v
```

### 3b. Dört komut

Sırayla çalıştır; biri bitmeden diğerine geçme.

Gerekli araçları indirir (birkaç dakika sürer, sarı uyarılar normaldir):

```bash
npm install
```

Supabase hesabına bağlanır (tarayıcı açılır, onayla):

```bash
npx supabase login
```

Bu klasörü projenle eşler. `PROJECT_ID` yerine 2. adımda not ettiğin kodu yaz. Veritabanı
parolasını sorar; yapıştır ve Enter'a bas (yazarken ekranda görünmez, bu normal):

```bash
npx supabase link --project-ref PROJECT_ID
```

Tabloları kurar. Yedi dosyayı listeler ve onay ister; `Y` yazıp Enter'a bas:

```bash
npx supabase db push
```

**Kontrol:** Supabase panelinde **Table Editor**'ı aç: `letters`, `photos`, `memories` gibi
yaklaşık otuz tablo görünüyor. **Storage**'da `media` adında, yanında "Private" yazan bir kova var.

<details>
<summary>Komut satırı çalışmazsa: yedek yol (kurulum gerektirmez)</summary>

Supabase panelinde **SQL Editor**'ı aç. GitHub'da `supabase/migrations` klasöründeki dosyaları
**tam bu sırayla**, her birinin bütün içeriğini kopyalayıp yapıştırarak **Run** ile çalıştır.
Her birinde "Success" görmeden sonrakine geçme.

1. `20261109000100_foundation.sql`
2. `20261109000200_content.sql`
3. `20261109000300_policies.sql`
4. `20261109000400_behaviour.sql`
5. `20261109000500_storage.sql`
6. `20261110000100_hardening.sql`
7. `20261110000200_room_presence.sql`

</details>

## 4. Supabase'de iki ayar

### 4a. Dışarıdan kaydı kapat

Siteye yalnızca davetle girilir. **Authentication → Sign In / Providers** sayfasında
**"Allow new users to sign up"** anahtarını **kapat** ve kaydet.

(Bu, senin ve Eln'in hesabını engellemez; o hesapları site kendi içinden açar.)

### 4b. Üç değeri kopyala

Bunları bir not dosyasına geçici olarak yaz; 6. adımda Vercel'e gireceksin.

| Ne | Nerede | Neye benzer |
| --- | --- | --- |
| **Project URL** | En kolayı kendin yazmak: `https://` + **Project ID** + `.supabase.co`. (Panelde de **Project Settings → Data API** sayfasında yazar.) | `https://abcdefghijklmnopqrst.supabase.co` |
| **Publishable key** | **Project Settings → API Keys** | `sb_publishable_…` |
| **Secret key** | Aynı sayfa (yoksa **Create new secret key**) | `sb_secret_…` |

Sayfada "anon" ve "service_role" adlı eski anahtarlar görünüyorsa onları kullanma; yukarıdaki
ikisini kullan. **Secret key her şeye erişebilir** — yalnızca Vercel'e yazılacak.

> **Project URL'de en sık yapılan üç hata** (site bunları yakalar ve söyler):
> - `https://` olmadan yazmak (`abcd….supabase.co`)
> - Tarayıcının adres çubuğundaki panel adresini kopyalamak (`https://supabase.com/dashboard/…`)
> - "Connect" penceresindeki veritabanı bağlantı satırını kopyalamak (`postgresql://…`)

**Kontrol:** Üç değer de elinde.

## 5. İki gizli anahtar üret

Sitenin kendi iki anahtarı var. Aynı komut satırında bu komutu **iki kez** çalıştır; her
seferinde farklı, uzun bir metin yazar:

```bash
node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"
```

- Birincisi **`APP_SECRET`** olacak.
- İkincisi **`SETUP_SECRET`** olacak. Bunu ayrıca kaydet: 7. adımda siteye **bir kez** yazacaksın.

## 6. Vercel'de yayınla

1. `vercel.com` → **Sign Up** → **Continue with GitHub**. Plan sorarsa **Hobby** (ücretsiz).
2. **Add New… → Project** → listeden **eln** deposunun yanındaki **Import**.
   (Depo görünmüyorsa "Adjust GitHub App Permissions"a basıp `eln` deposuna izin ver.)
3. Açılan ekranda başka hiçbir şeye dokunma; yalnızca **Environment Variables** bölümünü aç ve
   şu beş satırı ekle (sol kutuya adı, sağ kutuya değeri):

   | Ad (aynen böyle yaz) | Değer |
   | --- | --- |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_ANON_KEY` | Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key |
   | `APP_SECRET` | 5. adımdaki birinci metin |
   | `SETUP_SECRET` | 5. adımdaki ikinci metin |

   Değerlerin başında ya da sonunda boşluk kalmasın. Her satırda **Production** ve **Preview**
   kutuları işaretli olsun (varsayılan böyledir).
4. **Deploy**. İki-üç dakika sürer; bitince konfeti çıkar ve sitenin adresi görünür
   (`eln-….vercel.app` gibi).

**Kontrol:** Adresi açınca "Kurulum" ekranı geliyor. Bunun yerine **"Sunucu henüz bağlanmadı"**
sayfası gelirse, o sayfa hangi değişkenin neden hatalı olduğunu yazar: Vercel'de onu düzelt,
sonra **Deployments → en üstteki yayın → ⋯ → Redeploy**.

## 7. İlk hesabı oluştur

1. `https://ADRESİN/setup` sayfasını aç.
2. **Kurulum anahtarı:** `SETUP_SECRET` · **E-postan** · **Parola** (en az 10 karakter, iki kez).
3. Gönder. **Studio** açılır: artık sitenin sahibisin.

Bu ekran yalnızca bir kez çalışır; hesap oluşunca kalıcı olarak kapanır.

**Kontrol:** Sol üstte "Studio" yazıyor ve "Davet öncesi" listesini görüyorsun.

## 8. İçini doldur

Eln'i davet etmeden önce, Studio'da şu sırayla:

1. **Fotoğraflar** — beş fotoğrafı yükle, seç, **Yayımla**. İstersen albüm aç, favori işaretle.
2. **Açılış** — hediye fotoğrafını seç. **Tam ekran önizleme** ile hediyeyi baştan sona izle.
3. **Hazır metinler** — üç düğmeye bas: mektupları taslak olarak ekle, 365 notu yayında ekle,
   boş sayfaları doldur.
4. **365 Not** — takvimin **ilk gününü** seç. Bunu yapmadan hiçbir not görünmez.
5. **Mektuplar** — taslakları tek tek oku, sana benzemeyen cümleyi değiştir, beğendiğini yayımla.
   "Doğum günün için" mektubunda açılma tarihini 23 Nisan'a ayarla.
6. **Hikâye** — iki gün arasındaki 166 güne ait, yalnızca senin bildiğin anıları ekle.
7. Sağ üstten **Dünyayı gör** ile siteyi Eln'in göreceği gibi gez. **Bunu telefonundan da yap.**

Ayrıntılar: [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md).

## 9. Eln'i davet et

1. **Studio → Davet** → Eln'in e-postasını yaz → **Davet bağlantısı oluştur**.
2. Bağlantıyı kopyala ve **kendin**, istediğin an, istediğin yoldan ilet. Site kimseye e-posta
   ya da bildirim göndermez.
3. Bağlantı tek kullanımlıktır ve süresi vardır. Eln açınca yalnızca bir parola belirler;
   ardından hediye başlar.

Bağlantı kaybolursa ya da süresi dolarsa aynı sayfadan yenisini oluşturursun.

## 10. Yayından sonra

- **İlk yedeği al.** Bilgisayarındaki klasöre, `.env.example` dosyasını `.env.local` adıyla
  kopyala, içini Vercel'e yazdığın değerlerle doldur, sonra [`BACKUP_GUIDE.md`](BACKUP_GUIDE.md)'yi izle.
  `.env.local` dosyasını kimseyle paylaşma.
- **Kendi alan adın** (isteğe bağlı): Vercel'de **Settings → Domains**. Davet bağlantıları hangi
  adresten girdiysen onunla üretilir; ayrıca bir ayar gerekmez.
- **Siteyi güncellemek:** `main` dalına giren her değişikliği Vercel kendiliğinden yayınlar.
  Yeni bir veritabanı dosyası (`supabase/migrations`) eklendiyse 3b'deki son komutu yeniden çalıştır.
- **Haftada bir kez bile olsa girin** (ücretsiz plandaysan), yoksa Supabase projeyi duraklatır.
- **Bir anahtar sızdıysa:** Supabase'de **API Keys** sayfasından o anahtarı sil, yenisini oluştur,
  Vercel'deki değeri değiştir, **Deployments → ⋯ → Redeploy**.

Yayın öncesi güvenlik listesi: [`SECURITY.md`](SECURITY.md) → *Yayına alırken*.

---

## Sorun giderme

| Ne görüyorsun | Neden | Ne yapmalı |
| --- | --- | --- |
| Vercel'de "Build Failed", günlükte `Backend is not configured. Missing or invalid: …` | 11 Kasım 2026'dan önceki sürümde, ayarlar hatalıyken derleme sırasında veritabanına bağlanılmaya çalışılıyordu | Kodun güncel hâlini `main`'e al (1. adımdaki gibi). Artık derleme her durumda geçer; hatalı ayar varsa site açılınca "Sunucu henüz bağlanmadı" sayfasında nedeniyle birlikte yazar. |
| "Sunucu henüz bağlanmadı" sayfası | Sayfada adı geçen ayar eksik ya da hatalı; altında nedeni yazar | Vercel'de **Settings → Environment Variables**'ta düzelt, sonra **Redeploy**. |
| `/setup` "anahtar hatalı" diyor | `SETUP_SECRET` farklı ya da başında/sonunda boşluk var | Vercel'deki değeri kopyalayıp yeniden dene; gerekirse değeri değiştirip yeniden yayınla. |
| `/setup` giriş sayfasına atıyor | Kurulum zaten yapılmış | Normal. `/login`'den e-posta ve parolanla gir. |
| Giriş yapılamıyor, her seferinde hata | Publishable key ya da Project URL başka bir projeye ait | 4b'deki değerleri aynı projeden yeniden kopyala, Vercel'de güncelle, yeniden yayınla. |
| Fotoğraf "yüklenemedi" diyor | Secret key yanlış ya da `media` kovası yok | Secret key'i kontrol et; Supabase **Storage**'da `media` kovası yoksa 3. adım tamamlanmamış demektir. |
| Site birden açılmaz oldu | Supabase projesi duraklatılmış | Supabase paneline gir → proje → **Restore project**. Birkaç dakika sürer. |
| `npx supabase db push` parola hatası veriyor | Veritabanı parolası yanlış | **Project Settings → Database → Reset database password**, yeni parolayla `link` komutunu yeniden çalıştır. |
| Vercel'de "Build Failed" | Çoğunlukla Node sürümü | **Settings → Build and Deployment → Node.js Version**: 22.x seç, yeniden yayınla. |

Takıldığın yerde ekranda yazan hata metnini (anahtar içermediğinden emin olarak) ilet; neresi olduğunu
ona göre söyleyebilirim.
