# Güvenlik ve KVKK

## Gizli bilgiler

- API anahtarları, feed adresleri ve SMTP parolası **yalnızca ortam değişkenlerinde** tutulur.
  - Kaynak koduna, veritabanına ve günlüklere yazılmaz.
  - `.env` dosyası `.gitignore` içindedir.
- Veri kaynağı yapılandırması (veritabanındaki JSON), anahtarın kendisini değil **değişken adını**
  saklar. Okuma `secretFromEnvSafe` üzerinden yapılır ve yalnızca izin verilen ön eklerdeki
  değişkenler okunabilir: `AMAZON_`, `TRENDYOL_`, `HEPSIBURADA_`, `FEED_`, `TRAVELPAYOUTS_`,
  `DUFFEL_`, `PARTNER_`. Böylece panelden `DATABASE_URL` gibi bir değişken okutulamaz.
- Yönetim paneli değişkenlerin yalnızca adını ve tanımlı olup olmadığını gösterir.
- Adaptör hata mesajları tam adresi değil yalnızca **alan adını** içerir. Böylece sorgu
  dizesindeki anahtarlar (ör. feed adresindeki erişim belirteci) panelde görünen hata
  kayıtlarına ve günlüklere düşmez. Travelpayouts ve Duffel anahtarları başlıkta gönderilir.

## Kimlik doğrulama ve oturum

- Parolalar **scrypt** ile özetlenir (Node yerleşik, rastgele tuzlu, `N=2^15`, 64 bayt). Asgari parola: 10 karakter,
  harf ve rakam.
- Oturum belirteci 32 bayt rastgele değerdir; veritabanında yalnızca **SHA-256 özeti** saklanır.
- Çerez `fr_session` özellikleri:
  - `HttpOnly`, `SameSite=Lax`;
  - üretimde `Secure`;
  - 30 gün, kullanımla uzayan süre.
- Giriş hatalarında kullanıcının var olup olmadığı sızdırılmaz: aynı mesaj ve kullanıcı yoksa da
  sabit maliyetli doğrulama yapılır.
- Parola sıfırlama belirteçleri tek kullanımlık ve süreli; yalnızca özetleri saklanır.
- **İstek sınırları** (bellek içi; çok örnekli kurulumda Redis'e taşınmalı):
  - giriş 10 / 15 dk;
  - kayıt, parola sıfırlama, arama önerisi ve uçuş araması için ayrı sınırlar;
  - tıklama kaydı için bot filtresi.
- Yönetim paneli:
  - her sayfa ve **her sunucu eylemi** rolü ayrıca doğrular;
  - yetkisiz kullanıcıya 404 döner;
  - tüm değişiklikler denetim kaydına yazılır.

## Web güvenliği

- **İçerik Güvenlik Politikası:**
  - `default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`,
    `connect-src 'self'`;
  - görseller yalnızca `https:`;
  - harici betik ve font yok (fontlar yerel olarak barındırılır).
  - `script-src` içinde `'unsafe-inline'` bulunur: tema betiği ve Next.js satır içi verisi bunu
    gerektirir. Bir sonraki adım nonce tabanlı CSP'ye geçmektir.
- **Diğer başlıklar:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera, mikrofon, konum
  kapalı), üretimde HSTS.
- **Formlar** Next.js sunucu eylemleriyle gönderilir. Next.js sunucu eylemlerinde Origin/Host
  karşılaştırmasıyla CSRF koruması uygular.
- Tüm girdiler **zod** ile doğrulanır. Veritabanı erişimi Prisma veya parametreli `Prisma.sql`
  ile yapılır; ham dize birleştirme yoktur.
- **Markdown** (editoryal içerik) kendi güvenli işleyicimizle HTML'e çevrilir:
  - ham HTML kaçırılır;
  - bağlantılarda yalnızca site içi yol (`/…`) ve `https://` kabul edilir.
- **Dış bağlantılar** `/git/<teklif>` üzerinden yönlendirilir:
  - yalnızca `http(s)` hedeflere izin verilir;
  - test kaynağındaki teklifler gerçek mağazaya yönlendirilmez;
  - yanıt `noindex` ve `Referrer-Policy` ile gönderilir.
- **Dış HTTP istekleri** (adaptörler) zaman aşımı, yanıt boyutu sınırı ve yeniden deneme
  sınırıyla yapılır. Feed adresleri yalnızca yönetici tarafından ve ortam değişkeni üzerinden
  tanımlanabilir. Kullanıcı girdisiyle sunucudan dış istek yapılmaz (SSRF yüzeyi yok).
- **`/api/cron/tick`** `CRON_SECRET` ile, sabit zamanlı karşılaştırmayla korunur. Gizli değer
  tanımlı değilse veya 16 karakterden kısaysa tüm istekler reddedilir.
- **`/api/health`** hata ayrıntısını dışarı vermez; ayrıntı yalnızca sunucu günlüğüne yazılır.

## Veri doğruluğu güvenceleri

- Test verisi her kayıtta `isTestData` bayrağı taşır:
  - arayüzde "Test verisi" rozetiyle gösterilir;
  - sitemap'e girmez;
  - üretimde varsayılan olarak gizlidir.
- Fiyat, stok, kupon ve satın alma bağlantısı **üretilmez**; yalnızca kaynaktan alınır. Kaynak
  bağlantısı olmayan teklifte "satın al" düğmesi gösterilmez.
- Şüpheli fiyat değişimleri otomatik olarak fırsat listelerinden çıkarılır.

## KVKK

Uygulanan teknik önlemler:

| Konu | Uygulama |
|---|---|
| Veri minimizasyonu | Hesap için yalnızca e-posta ve parola zorunlu; ad isteğe bağlı. Hesapsız kullanımda favoriler yalnızca tarayıcıda (localStorage) tutulur. |
| Açık rıza / aydınlatma | Kayıtta KVKK aydınlatma metni onayı zorunlu ve zamanı kaydedilir. Haftalık e-posta özeti ayrı ve isteğe bağlı onaydır. |
| Çerezler | Yalnızca zorunlu oturum çerezi; reklam/izleme çerezi ve üçüncü taraf analitik yok. |
| Anonim analitik | Tıklamalarda IP veya tarayıcı bilgisi saklanmaz. Yalnızca `SHA-256(günlük tuz + gün + IP + tarayıcı)` özetinin ilk 16 karakteri tutulur; özet ertesi gün değişir. |
| Erişim hakkı | `Hesap → Ayarlar → Verilerimi indir`: tüm kişisel veriler JSON olarak (parola özeti hariç). |
| Silme hakkı | `Hesap → Ayarlar → Hesabı sil` (parola + "SİL" onayı). Oturum, favori, alarm, bildirim, kayıtlı arama, ilgi alanları cascade ile silinir; e-posta kuyruğundaki kayıtlar da silinir. |
| İtiraz / abonelikten çıkma | Her bülten e-postasında tek tıkla abonelikten çıkma bağlantısı; bildirim tercihleri hesap ayarlarında. |
| Saklama süreleri (otomatik temizlik) | Oturum: süresi dolunca. Kullanılmış/süresi dolmuş belirteçler: 7 gün. E-posta kuyruğu: 60 gün. Anonim tıklama kayıtları: 13 ay. Görev günlükleri: 90 gün. |

**Yayına almadan önce hukuki olarak tamamlanması gerekenler:**

- `/kvkk`, `/gizlilik`, `/cerezler`, `/kullanim-kosullari` sayfalarındaki **köşeli parantezli
  alanlar**: veri sorumlusunun unvanı, adresi, iletişim bilgileri.
- Barındırma ve e-posta sağlayıcılarının listesi ve **yurt dışı aktarım** durumu. KVKK m.9
  kapsamında değerlendirilmelidir.
- Gerekiyorsa VERBİS kaydı.
- Metinler bir hukukçu tarafından gözden geçirilmelidir. Buradaki metinler teknik uygulamayı
  doğru anlatacak biçimde yazıldı ancak hukuki görüş değildir.

## Güvenlik açığı bildirimi

Yayın öncesinde bir iletişim adresi belirleyip `/.well-known/security.txt` eklenmesi önerilir.
