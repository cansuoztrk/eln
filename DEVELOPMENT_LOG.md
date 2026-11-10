# DEVELOPMENT_LOG — Geliştirme günlüğü

Yapılan ve yapılamayan işlerin dürüst kaydı. En yeni tur en üstte. Kararların gerekçesi
`CLAUDE.md` → *Karar günlüğü*'nde, sıradaki işler `docs/ROADMAP.md`'de durur.

---

## 2026-11-10 — Kalite denetimi, eksiklerin tamamlanması ve metinler

**Kapsam.** "Ultimate Quality Assurance & Evolution" isteği: var olan tasarım ve çalışan
özellikler korunarak proje baştan sona denetlendi. Tek ajanla, sırayla çalışıldı. Amaç yeni
özellik saymak değil, olanı sağlamlaştırmaktı. Tur içinde Arda iki şey daha iletti: Eln'in 5
gerçek fotoğrafı ile şarkının resmî bağlantıları, ve "bütün cümleleri ve paragrafları duygusal
bir dille sen yaz" isteği.

**Yöntem.** Kod, migration'lar ve dokümanlar okundu; yerel Supabase üzerinde gerçek yükleme
hattından geçirilen 5 gerçek fotoğrafla her oda Eln'in gözünden (390 px telefon) ve masaüstünde
(1440 px) ekran görüntüsüyle tek tek incelendi; ana akışlar (hediye, mektup açma, fotoğraf
büyütme, yıldız seçme, menü) tarayıcıda yürütüldü.

### Bulgular ve durumları

#### CRITICAL

| # | Bulgu | Durum |
| --- | --- | --- |
| C1 | **Gerçek fotoğraflar yüklenemiyordu.** Telefonların `.PNG` adıyla kaydettiği JPEG'ler (5 fotoğraftan 2'si) "tür uyuşmuyor" diye reddediliyordu. | ✅ Düzeltildi. Dosyanın türüne artık içeriği (ilk baytlar) karar veriyor; kayıt gerçek türle güncelleniyor. 5 fotoğrafın 5'i yüklendi, her biri 3 varyant üretti. |

#### HIGH

| # | Bulgu | Durum |
| --- | --- | --- |
| H1 | **Geri yükleme albümlü veride kırılırdı** (albüm ↔ kapak fotoğrafı döngüsel bağı). | ✅ Albümler önce kapaksız yazılıp kapaklar sonra bağlanıyor. |
| H2 | **Bir üye, başkasının dosyasını kendi fotoğrafına bağlayabilirdi** (uygulama üzerinden ulaşılamıyordu ama veritabanı buna güvenmemeli). | ✅ Yeni migration: dosya yalnızca yükleyenin; bağ sonradan değiştirilemez; kayıt yolu kendi klasörünün dışını gösteremez. 2 yeni RLS testi. |
| H3 | **Mektuplarda mühür zarfın ortasında durmuyordu** (genişliği belirsiz bir kaba göre konumlanıyordu). | ✅ Mühür zarfın kendisine göre boyutlanıyor. |
| H4 | **Anı Evreni telefonda ekranın ortasında ince bir şerit kalıyordu.** | ✅ Dik ekranda galaksi dik duruyor ve ekranı dolduruyor; sürükleme yönleri buna göre; seçilen yıldız kartın altında kalmıyor; etiketler üst üste binmiyor; ilk açılışta yavaşça yaklaşıyor. |
| H5 | **Günlük, Eln'i büyük bir yazma formuyla karşılıyordu**; kayıtlar bir buçuk ekran aşağıdaydı ve sayfa bir şey ister gibi duruyordu. | ✅ Sayfa kayıtlarla açılıyor; form tek bir sakin düğmenin arkasında. |
| H6 | **Boş odaları gizlerken Eln'in kendi ekleme yolları da kayboluyordu** (denetim sırasında fark edildi). | ✅ Ses odası artık hiç gizlenmiyor; "Sen de ekleyebilirsin" bağlantıları Hesabım'da kalıcı. |

#### MEDIUM

| # | Bulgu | Durum |
| --- | --- | --- |
| M1 | Mektuplar sayfası Eln'e önce *açamayacağı* mühürlü zarfı gösteriyordu. | ✅ Okunabilenler önce, "Günü gelince" sonra. |
| M2 | Hikâyede bölüm başlığı ile altındaki anı kartı aynı tarihi ve başlığı iki kez söylüyordu. | ✅ Bölümün kendi anısı tarihi/başlığı yinelemiyor; fotoğrafsız karttaki tarih ortalandı. |
| M3 | Ana sayfada üç fotoğraf telefonda üç ekran tutuyordu; oda listesi 16 uzun satırdı. | ✅ Bir büyük + iki küçük fotoğraf; iki sütunlu kısa oda dizini. Sayfa ~%25 kısaldı. |
| M4 | Galeri telefonda tek tip, uzun bir akıştı. | ✅ Ritim: tam genişlik → sağdan içeri → soldan içeri; albüm şeridi küçüldü, ilk fotoğraf ilk ekranda görünüyor. |
| M5 | Fotoğraf büyütücü telefona 2400 px dosya indiriyordu; aşağı kaydırarak kapanmıyordu; arkadaki sayfa hafifçe görünüyordu. | ✅ Telefona 1280 px kopya; aşağı kaydırınca kapanıyor; arka plan tam kapalı. |
| M6 | Açılan zarfın kapağı mektubun *önünde* kalıyordu. | ✅ Kapak dönüşün yarısında mektubun arkasına geçiyor. |
| M7 | Bağlantı takımları (anı/günlük/kapsül fotoğrafları) yeniden yazılırken kısa bir an boş kalıyordu. | ✅ Önce yeni takım yazılıyor, sonra fazlası siliniyor. |
| M8 | Saat dilimi iki ayrı yerden okunuyordu (profil ve alan ayarı). | ✅ Tek kaynak: alan ayarı, role göre. |
| M9 | `taupe` rengi açık zeminde AA kontrastının altındaydı. | ✅ `#806a5f`. |
| M10 | Eln'in menüsü her sayfada oda doluluğu için 8 ayrı istek atıyordu. | ✅ Tek çağrı (`room_presence`). |
| M11 | Yeni ay boş bir daire gibi görünüyordu; ortak gökyüzündeki iki şehir etiketi telefonda birbirine giriyordu. | ✅ Aya ince bir kenar; etiketler iki satır. |

#### LOW

| # | Bulgu | Durum |
| --- | --- | --- |
| L1 | Fiyonk koleksiyonu telefonda dört ekran satırı tutuyordu. | ✅ Dört sütun, iki satır. |
| L2 | Eln kendi doğum gününde "Her birthday" etiketini görüyordu. | ✅ Bakana göre "Your birthday". |
| L3 | 365 Not sayfası arşiv yokken "geçmiş günler aşağıda" diyordu. | ✅ Metin duruma göre. |
| L4 | Next.js'in yumuşak kaydırma uyarısı. | ✅ `data-scroll-behavior`. |
| L5 | Hediyedeki "iki şehir" sahnesi telefonda yalnızca ince bir yaydı. | ✅ Altına "İstanbul'dan Bakü'ye" satırı. |

### "Eksik kalan her şey" — tamamlananlar

- Şarkının resmî YouTube ve Spotify bağlantıları (paylaşım izleme parametreleri çıkarılarak).
- Sürüm geçmişi arayüzü: mektup, anı ve günlükte önceki sürümleri gör, birine geri dön.
- Eln kendi zaman kapsülünü hazırlayabiliyor; kendi çöp kutusu var.
- Anılara albüm ve ses kaydı bağlanabiliyor; hayaller Anı Evreni'nde yıldız.
- Studio: Ayarlar (adlar, şehirler, saat dilimleri) ve Yedek sayfaları; ses kaydı başlığı düzenlenebiliyor.
- Ana sayfada "bugün" şeridi: günün notu ve o gecenin gerçek ayı.
- Çevrimdışı kabuk: bağlantı yokken sakin bir sayfa; özel hiçbir içerik önbelleğe alınmıyor.
- Yedek betiğinin her tabloyu kapsadığını doğrulayan birim testi.

### Metinler (Arda'nın isteği)

Arda bütün cümlelerin ve paragrafların onun yerine, duygusal bir dille yazılmasını istedi.

- **Yazılanlar** (`src/content/writing.ts`): açılış mektubu (Arda'nın dört cümlesi korunarak),
  ana sayfa notu, hikâye girişi, aradaki günlerin notu, mesafe girişi, buluşma notu, şarkı notu,
  20 minik mesaj; **8 mektup**; **365 not** (7 raf); iki dönüm noktası anısı; dört özel gün girişi.
  Oda girişleri ve boş durum metinleri `src/content/copy.ts`'te toplanıp ısıtıldı.
- **Sınırlar korundu.** Yalnızca Arda'nın hisleri ve kesin bilgiler. Hiçbir olay, konuşma ya da anı
  uydurulmadı; Eln'in ne hissettiği yazılmadı; 7 Kasım mesajına dokunulmadı; cevap/söz/af isteyen
  ya da kırgınlığa değinen tek cümle yok; sesli/görüntülü görüşme gibi bilinmeyen şeyler iddia
  edilmedi; "bugün şunu gördüm" gibi güne iliştirilmiş küçük olaylar bile yazılmadı; sayı ve tarihler elle
  yazılmadı, `FACTS`'ten hesaplanıyor. Bunların hepsi birim testiyle denetleniyor.
- **Arda'nın elinde.** Mektuplar ve notlar `Studio → Hazır metinler`'den **taslak** olarak eklenir;
  o okuyup yayımlamadan Eln görmez. Dönüm noktaları yalnızca boş sayfayı doldurur.

### Test sonuçları

| Kontrol | Sonuç |
| --- | --- |
| `tsc --noEmit`, `eslint .` | temiz |
| `next build` | temiz |
| Birim testleri | 56 / 56 (içerik kuralları + yazılan metinlerin kuralları dahil) |
| RLS / güvenlik testleri | 27 / 27 (dosya sahipliği ve oda doluluğu testleri dahil) |
| Uçtan uca (üretim derlemesi) | 12 / 12 — kurulum → içerik → davet → hediye → erişim sınırları → iki rol için bütün odalar |
| Gerçek fotoğraflarla yükleme | 5 / 5 yüklendi, her biri 3 EXIF'siz WebP varyantı |

### Yapılamayanlar ve açık kalanlar

- **Fotoğraflar depoya eklenmedi — bilerek.** Özel fotoğraflar git geçmişine girmemeli. Arda, siteyi
  yayına aldıktan sonra beşini `Studio → Fotoğraflar`'dan yükler (yükleme hattı bu dosyalarla denendi).
- **Geri yükleme provası albümlü veriyle yeniden koşulmadı.** Düzeltme yapıldı ve gözden geçirildi; ilk
  gerçek yedekten sonra bir kez prova edilmeli (`docs/BACKUP_GUIDE.md`).
- **Ses kaydı gerçek telefonda denenmedi.** Başsız tarayıcıda mikrofon yok.
- **Şarkı oynatıcısı gerçek ağda denenmedi.** Bağlantılar doğrulandı; gömülü oynatıcı yalnızca "oynat"a
  basınca yüklenir ve bu ortamdan YouTube'a çıkış yok.
- **Gerçek iPhone'da bakılmadı.** Telefon görünümü 390 px Chromium ile incelendi; Safari'nin alt çubuğu,
  çentik boşlukları ve kaydırma davranışı gerçek cihazda bir kez görülmeli.
- **Animasyon kitaplığı küçültülmedi** (LazyMotion'a geçiş ~15–20 KB kazandırır ama bütün hareketli
  bileşenlere dokunur). Risk/kazanç dengesi nedeniyle ertelendi.
- **Yayın ortamı kurulmadı.** Supabase bulut projesi ve barındırma Arda'nın hesaplarıyla yapılacak (`README.md`).
- **Metinler Arda'yı tanımadan yazıldı.** Nasıl tanıştıkları, Eln'e nasıl seslendiği, sesli görüşüp
  görüşmedikleri bilinmiyor; bu yüzden metinler bilerek genel kaldı. Kişisel ayrıntıyı yalnızca Arda ekleyebilir.

### Sıradaki öneriler

1. Yayına al, `/setup`'ı çalıştır, beş fotoğrafı yükle, hediye fotoğrafını seç.
2. `Studio → Hazır metinler`: mektupları ve notları ekle, oku, sana benzemeyeni değiştir, yayımla.
3. Aradaki 166 güne ait en az birkaç gerçek anı yaz — sitenin en eksik ve en değerli yeri orası.
4. Gerçek telefonda bir kez baştan sona gez (hediye dahil), sonra daveti gönder.
5. İlk yedeği al ve geri yüklemeyi bir kez prova et.
