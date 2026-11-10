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

Doğrulama: `npm run check` (typecheck + lint + 45 birim testi), `npm run test:db` (23 RLS testi),
tarayıcıda uçtan uca akış (kurulum → içerik → davet → Eln'in gözünden hediye → erişim sınırları),
yedek → sıfırla → geri yükle provası.

## Sırada — veritabanı hazır, arayüz yazılacak

Tabloları, RLS politikaları ve testleri **şimdiden var**; eksik olan sayfalar. Bir oda yazıldığında
`src/content/navigation.ts` içindeki `BUILT` listesine eklenir ve her menüde kendiliğinden görünür.

| Sıra | Modül | Rota | Not |
| --- | --- | --- | --- |
| 1 | Hesabım | `/account` | Profil, "verimi indir" (JSON + ZIP), "hesabımı sil". |
| 2 | Our Song | `/song` | Resmî embed (basınca yüklenir) ya da bağlantı kartı; `song` bölümü Studio'da hazır. |
| 3 | 365 Reasons | `/reasons`, `/studio/reasons` | `ensure_daily_notes` hazır; not ekleme ekranı ve arşiv. Otomatik üretim yok. |
| 4 | The Memory Universe | `/universe` | `listMemories` + `starSize/starTone` hazır. Önce 2D canvas (mobil), sonra R3F (masaüstü, dinamik import). |
| 5 | Our Future | `/future` | Hayal → Planlandı → Gerçekleşti (yalnızca onayla); istenirse anıya dönüşür. |
| 6 | Shared Journal | `/journal` | "Paylaşılan" / "yalnızca ben"; fotoğraf ekleme. |
| 7 | Our Questions | `/questions` | Başlangıç soru paketi tek tıkla eklenebilir; "birlikte" modu RLS'te hazır. |
| 8 | Voice Memories | `/voice` | `MediaRecorder`; izin yalnızca "Kaydet"e basınca; dalga formu kayıt sırasında hesaplanır. |
| 9 | Time Capsule | `/capsules`, `/studio/capsules` | Mühürleme ve dosya gizleme RLS'te hazır; açılış animasyonu. |
| 10 | Eln's Little World | `/corner`, `/studio/theme` | Fiyonk koleksiyonu, sticker panosu (`user_preferences`), tema seçimi (`data-theme`). |

## Sonra

- Playwright E2E paketini depoya taşı (`tests/e2e`; şu an akışlar geliştirme betikleriyle doğrulandı).
- Sürüm geçmişi arayüzü (Studio'da "önceki sürümler" + geri alma) — veriler `content_versions`'ta birikiyor.
- Sürükle-bırak sıralama (şu an yukarı/aşağı düğmeleri).
- Fotoğraf yüklerken EXIF'ten "çekildiği gün" önerisi.
- Çevrimdışı için hafif bir kabuk (özel içerik önbelleğe alınmadan).
- Eln için arayüzü Azerbaycan Türkçesi / İngilizce seçeneği.

## İlk buluşma gerçekleştiğinde

1. `Studio → Tarihler → İlk buluşmamız`: tarihi gir. O andan itibaren Mesafe ve Hikâye sayfaları geri sayar.
2. Buluştuktan sonra aynı yerde **"Buluşma gerçekleşti"**yi onayla. Site ancak o zaman olmuş bir gün olarak gösterir.
3. İlk birlikte fotoğraflarınızı yükle; o günü bir anı olarak yaz; istersen `first-meeting` temalı bir özel gün sayfası aç.
