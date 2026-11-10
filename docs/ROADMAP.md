# ROADMAP — Yol haritası

Durum tarihi: 2026-11-10. Bir madde bittiğinde burada işaretle, karar değiştiyse `CLAUDE.md` karar günlüğüne yaz.

## Biten — ilk çalışan sürüm

| # | Kilometre taşı | Durum |
| --- | --- | --- |
| 1 | Premium açılış — The Gift (6 sahne, Studio'dan metin + fotoğraf, isteğe bağlı şarkı) | ✅ |
| 2 | Responsive ana sayfa (saatler, gün sayaçları, sıradaki özel gün, oda haritası) | ✅ |
| 3 | Navigasyon (masaüstü başlık, tam ekran menü, mobil alt çubuk) | ✅ |
| 4 | Eln's Gallery (editoryal + polaroid, filtreler, albümler, lightbox, yükleme hattı) | ✅ |
| 5 | Our Story (bölümlü zaman çizelgesi, 166 gün sahnesi, anı sayfası, editör) | ✅ |
| 6 | Letters (zarf açılışı, okuma modu, kilitli mektuplar, canlı önizlemeli editör) | ✅ |
| 7 | Beyond Distance (şehir kartları, ortak gökyüzü, notlar, özlem günlüğü, buluşma alanı) | ✅ |
| 8 | Özel tarih sistemi (tek kaynak, yılsız/tarihsiz kurallar, özel günler, yıllık baskılar) | ✅ |
| 9 | Admin Studio (genel bakış, açılış, fotoğraf, hikâye, mektup, tarih, metin, davet, çöp kutusu) | ✅ |
| 10 | Kalıcı veri altyapısı (migration, RLS, sürüm geçmişi, çöp kutusu, yedek/geri yükleme betikleri) | ✅ |

Doğrulama: `npm run check` (typecheck + lint + birim testleri), `npm run test:db` (RLS testleri),
`npm run test:e2e` (üretim derlemesinde uçtan uca: kurulum → içerik → davet → Eln'in gözünden hediye →
erişim sınırları → bütün odalar), yedek → sıfırla → geri yükle provası.

## Biten — imza ve uzun vadeli odalar

| Modül | Rota | Not |
| --- | --- | --- |
| The Memory Universe | `/universe` | Anılar, mektuplar ve özel günler sarmal bir galakside. Canvas + kendi izdüşümü; liste görünümü erişilebilirlik için. |
| 365 Reasons | `/reasons`, `/studio/reasons` | 365 hazır not taslak olarak eklenebilir; her takvim gününe bir not (ziyaretten bağımsız). |
| Hazır metinler | `/studio/words` | Arda'nın sesinden yazılmış mektuplar, notlar, dönüm noktaları; taslak olarak eklenir, hiçbir şeyin üzerine yazmaz. |
| Our Song | `/song` | Özgün plak çizimi; oynat/duraklat ve ses, resmî embed'i sürer. Bağlantı yoksa arama kartı. |
| Eln's Little World | `/corner` | Kedi, fiyonk koleksiyonu, kişisel tema, sticker panosu, Arda'nın yazdığı günün mesajı. |
| Our Future | `/future` | Hayal → Planlandı → Gerçekleşti (yalnızca onayla); istenirse taslak anı açar. |
| Shared Journal | `/journal` | "İkimiz" / "yalnızca ben"; taslaklar kişisel; fotoğraf eklenir. |
| Our Questions | `/questions` | Kendi soruların + isteğe bağlı başlangıç paketi; "birlikte" modu; skor yok. |
| Voice Memories | `/voice` | Kayıt, dalga formu, oynatma; mikrofon izni yalnızca kayda basınca. |
| Time Capsule | `/capsules`, `/studio/capsules` | Mektup, fotoğraf, ses, video bağlantısı; günü gelene dek dosyalarıyla birlikte mühürlü. |
| Hesabım | `/account` | Profil, parola, verimi indir (JSON + ZIP), hesabımı sil. |

Yeni bir oda eklendiğinde `src/content/navigation.ts` içindeki `BUILT` listesine yazılır; her menüde kendiliğinden görünür.

## Doğrulama durumu (2026-11-10)

| Kontrol | Sonuç |
| --- | --- |
| `tsc --noEmit`, `eslint .`, `next build` | temiz |
| Birim testleri (`npm run test`) | 56 / 56 — tarih kuralları, gökyüzü, yükleme kuralları, içerik kuralları, yazılan metinlerin kuralları, kod kuralları |
| RLS / güvenlik testleri (`npm run test:db`) | 27 / 27 — gerçek API üzerinden, owner / partner / yabancı / anonim; dosya sahipliği ve oda doluluğu dahil |
| Uçtan uca (`npm run test:e2e`) | 12 / 12 — üretim derlemesinde ilk kurulum hikâyesi + iki rol için bütün odalar |
| Yedek → sıfırla → geri yükle provası | satır ve dosya sayıları birebir (albüm kapağı düzeltmesinden sonra yeniden koşulmalı) |
| Gerçek fotoğraflarla yükleme | 5 / 5 — biri `.PNG` adlı JPEG olanlar dahil |

Bu turun bütün bulguları ve durumları: [`DEVELOPMENT_LOG.md`](../DEVELOPMENT_LOG.md).

Elle bakılması gerekenler (otomatik test edilemeyenler):

- **Ses kaydı:** başsız tarayıcıda mikrofon yok; kayıt akışı gerçek bir telefonda denenmeli (Safari + Chrome).
- **Şarkı oynatıcısı:** resmî bağlantılar girildi; gömülü oynatıcı gerçek ağda (`/song` ve Gift'teki düğme) bir kez denenmeli.
- **Gerçek iPhone:** telefon görünümü 390 px Chromium ile, Eln'in gerçek fotoğraflarıyla incelendi; Safari'de bir kez baştan sona gezilmeli.
- **Hazır metinler:** yayımlamadan önce Arda tarafından okunmalı (`Studio → Hazır metinler`).
- **Yayın ortamı:** Supabase bulut projesi ve barındırma henüz kurulmadı (`README.md` → Yayına alma).

## Sonra

Bu turda bitenler: Eln'in kapsül hazırlaması · hayallerin Anı Evreni'nde yıldız olması · sürüm geçmişi arayüzü ·
çevrimdışı kabuk · Studio ayarlar ve yedek sayfaları · hazır metinler.

- E2E paketini genişlet: mobil görünüm kontrolleri, galeri lightbox, özel gün baskısı, kapsül açılışı, hazır metinlerin eklenmesi.
- Geri yükleme provasını albümlü veriyle yinele.
- Animasyon kitaplığını küçült (LazyMotion) — ~15–20 KB.
- Anı Evreni için isteğe bağlı WebGL sürümü (yalnızca yıldız sayısı çok artarsa).
- Sürükle-bırak sıralama (şu an yukarı/aşağı düğmeleri).
- Fotoğraf yüklerken EXIF'ten "çekildiği gün" önerisi.
- Eln için arayüzü Azerbaycan Türkçesi / İngilizce seçeneği.

## İlk buluşma gerçekleştiğinde

1. `Studio → Tarihler → İlk buluşmamız`: tarihi gir. O andan itibaren Mesafe ve Hikâye sayfaları geri sayar.
2. Buluştuktan sonra aynı yerde **"Buluşma gerçekleşti"**yi onayla. Site ancak o zaman olmuş bir gün olarak gösterir.
3. İlk birlikte fotoğraflarınızı yükle; o günü bir anı olarak yaz; istersen `first-meeting` temalı bir özel gün sayfası aç.
