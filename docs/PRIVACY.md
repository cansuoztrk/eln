# PRIVACY — Gizlilik

Bu site iki kişi içindir. Gizlilik burada bir uyumluluk maddesi değil, hediyenin parçasıdır:
Eln bu dünyada izlenmediğini bilmelidir.

## Söz verilenler

| Konu | Durum |
| --- | --- |
| Ziyaret sayısı, son görülme, çevrimiçi durumu | **Tutulmaz.** |
| Okundu bilgisi (mektup, not, kapsül) | **Tutulmaz.** Hiçbir tabloda `opened_at`/`read_at` yoktur. |
| "Hediyeyi izledi mi" | Yalnızca Eln'in kendi cihazında (`localStorage`). Sunucuya gitmez. |
| Konum | **İstenmez, tutulmaz.** Şehirler sabit metindir; saatler saat diliminden hesaplanır. |
| IP adresi | **Saklanmaz.** Yalnızca giriş/davet denemelerini sınırlamak için tuzlanmış, geri çevrilemez bir özeti en fazla 1 saat tutulur; profil çıkarılmaz. |
| Analitik, reklam, izleme pikseli | **Yok.** |
| Üçüncü taraf istekler | Sayfa yükünde **yok**. Fontlar kendi sunucumuzdan. YouTube/Spotify yalnızca Eln "oynat"a basarsa yüklenir. |
| Otomatik e-posta / bildirim | **Yok.** Davet bağlantısını Arda kendi eliyle iletir. |
| Arama motorları | `noindex, nofollow, noarchive` + `robots.txt: Disallow: /`. |
| Yapay zekâ | İçerikler hiçbir modele gönderilmez; sitede üretken yapay zekâ çalışmaz. |

## Kim neyi görür

| İçerik | Yazan | Diğer üye | Admin (Arda) |
| --- | --- | --- | --- |
| Yayımlanmış içerik | ✅ | ✅ | ✅ |
| Taslak | ✅ | ❌ | ❌ (kendi taslağı değilse) |
| Günlükte "yalnızca ben" kaydı | ✅ | ❌ | ❌ |
| Kilitli mektup / kapsül (tarihi gelmemiş) | ✅ | yalnızca başlık + tarih | — |
| Kullanıcı tercihleri (tema, sticker panosu) | ✅ | ❌ | ❌ |
| Değişiklik kaydı (audit) | kendi işlemleri | ❌ | yalnızca yayımlanmış içerik ve yönetim işlemleri |

Bu kurallar arayüzde değil **veritabanında (RLS)** uygulanır; `tests/db` altında sınanır.
Admin olmak, Eln'in taslaklarını veya kişisel kayıtlarını okuma yetkisi vermez.

> Dürüst not: Supabase projesinin sahibi (Arda) teknik olarak veritabanı paneline erişebilir.
> Uygulama bunu kullanmaz ve kolaylaştırmaz; ama Eln'e "taslakların teknik olarak da
> erişilemez" denmemelidir. Hesap sayfasındaki gizlilik metni bunu açıkça söyler.

## Fotoğraf ve ses

- Dosyalar herkese kapalı bir depolama kovasındadır; yalnızca süreli imzalı bağlantıyla açılır.
- Gösterilen kopyalar yeniden kodlanır: EXIF, GPS, cihaz bilgisi **silinir**.
- Orijinal dosya arşiv için aynen saklanır ve yalnızca yedek/dışa aktarımda kullanılır.
- Fotoğraflar değiştirilmez, yüz tanıma/etiketleme yapılmaz.
- Mikrofon izni yalnızca kayıt başlatıldığında istenir; kayıt bitince akış kapatılır.

## Eln'in hakları (hesap sayfasında, kimseye sormadan)

- **Verimi indir:** kendi yazdığı her şey JSON + yüklediği dosyalar ZIP.
- **Hesabımı sil:** hesabı ve *kendi eklediği* tüm içerik kalıcı olarak silinir.
  Arda'nın onun için yazdıkları Arda'ya aittir ve kalır; ama Eln artık erişemez.
- **Katılmama:** hiçbir şey eklemeden yalnızca okuyabilir. Site bunu sormaz, hatırlatmaz.

## Saklanan veriler

| Veri | Neden | Süre |
| --- | --- | --- |
| E-posta + parola özeti (Supabase Auth) | Giriş | Hesap silinene kadar |
| Profil: görünen ad, şehir, saat dilimi, doğum günü (gün/ay) | Arayüz | Hesap silinene kadar |
| İçerik (anı, mektup, fotoğraf, ses, günlük…) | Sitenin kendisi | Silinene kadar; çöp kutusunda geri alınabilir |
| İçerik sürümleri | Yanlışlıkla silme/değiştirmeye karşı kurtarma | İçerikle birlikte |
| Değişiklik kaydı | Kim neyi değiştirdi (kurtarma için) — **görüntüleme kaydı değildir** | Arda temizleyebilir |
| Hız sınırı sayaçları | Parola deneme saldırısına karşı | ≤ 1 saat |

## Geliştirici için kontrol listesi

Yeni bir özellik eklerken şunlardan biri "evet" ise **ekleme**, önce Arda'ya sor:

- [ ] Eln'in ne zaman/kaç kez baktığını kaydediyor mu?
- [ ] Eln'e bir şey yaptırmak için hatırlatma/baskı içeriyor mu?
- [ ] Sayfa yükünde üçüncü tarafa istek atıyor mu?
- [ ] Bir üyenin taslağını/kişisel kaydını diğerine sızdırabilir mi?
- [ ] Günlüklere (log) kişisel içerik yazıyor mu?
