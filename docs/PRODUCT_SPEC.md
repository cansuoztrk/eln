# PRODUCT_SPEC — Ürün tanımı

## Kimler kullanır

| Rol | Kim | Ne yapar |
| --- | --- | --- |
| `owner` | Arda | Her şeyi Studio'dan yönetir, içerik ekler, Eln'i davet eder, yedek alır. |
| `partner` | Eln | Davetle girer. Önce yalnızca hediyeyi yaşar. **İsterse** katkıda bulunur. |

Başka ziyaretçi yoktur. Oturum açmamış biri yalnızca giriş ekranını görür.

## Akışlar

1. **Kurulum (bir kez):** Arda `/setup` → kurulum anahtarı + e-posta + parola → alan (space),
   doğrulanmış tarihler ve dört özel gün oluşturulur. Sonra `/setup` kalıcı olarak kapanır.
2. **Hazırlık:** Arda Studio'da açılış metnini, hediye fotoğrafını, mektupları, anıları hazırlar.
   Her şey taslak olarak durabilir. Studio ana ekranındaki "Davet öncesi" listesi eksikleri gösterir.
3. **Davet:** Studio → Davet → Eln'in e-postası → tek kullanımlık bağlantı (varsayılan 14 gün).
   Bağlantı yalnızca bir kez gösterilir; Arda istediği kanaldan kendisi iletir. Site e-posta/bildirim göndermez.
4. **İlk açılış:** Eln bağlantıyı açar → kendine bir parola belirler → **The Gift** başlar → dünyaya geçer.
5. **Sonraki ziyaretler:** `/login` → ana sayfa. Hediye istenirse yeniden izlenebilir.
6. **Katılım (opsiyonel):** Eln fotoğraf, anı, günlük, mektup, cevap, hayal ekleyebilir. Hiçbiri istenmez.

## Modüller

Durum: aşağıdaki modüllerin tümü yazıldı ve çalışıyor (ayrıntı ve sıradakiler: `ROADMAP.md`).

### İlk kilometre taşı
| Modül | Rota | Özet |
| --- | --- | --- |
| The Gift | `/gift` | Altı sahnelik ilk karşılaşma. Metin ve fotoğraf Studio'dan. Müzik otomatik başlamaz. |
| Ana sayfa | `/` | Hero, iki şehir saati, gün sayaçları (gerçek tarihlerden), sıradaki özel gün, bölüm haritası. |
| Our Story | `/story`, `/story/[id]` | Bölümlü editoryal zaman çizelgesi; "166 gün" köprüsü; anı detayı ayrı deneyim. |
| Eln's Gallery | `/gallery` | Editoryal masonry + polaroid görünümü, albüm/etiket/favori filtreleri, lightbox, swipe. |
| Letters | `/letters`, `/letters/[id]` | Zarf açılışı, okuma modu, el yazısı seçeneği, kilitli (gelecekte açılan) mektuplar. |
| Beyond Distance | `/distance` | İki şehir kartı, canlı yerel saat, aynı gökyüzü, ışık ipi, notlar, özlem günlüğü, buluşma alanı. |
| Special Days | `/days`, `/days/[slug]` | Dört özel gün, geri sayım, yıllık "baskı"lar (her yıl yeni sürpriz). |
| Admin Studio | `/studio/*` | Tüm içeriklerin yönetimi, taslak/yayın, canlı önizleme, çöp kutusu, yedek. |

### İmza özellikler
| Modül | Rota | Özet |
| --- | --- | --- |
| Memory Universe | `/universe` | Anılar, mektuplar ve özel günler yıldız olarak; çevrilir, yakınlaşılır, yıldıza dokunulur. Telefonda da aynı. |
| 365 Reasons | `/reasons` | Arda'nın yazdığı notlar; günde bir not; arşiv. Otomatik üretim yok. |
| Our Song | `/song` | Onur Can Özcan — Anılar Şarkısı. Resmî embed veya bağlantı kartı. |
| Eln's Little World | `/corner` | Fiyonk koleksiyonu, sticker panosu, tema seçenekleri, tatlı günlük mesajlar. |

### Uzun vadeli
| Modül | Rota | Özet |
| --- | --- | --- |
| Shared Journal | `/journal` | İki kişilik günlük; taslak ve "yalnızca ben" kayıtları kişisel. |
| Time Capsule | `/capsules` | Belirli tarihte açılan kapsüller (mektup, fotoğraf, ses, video bağlantısı). |
| Voice Memories | `/voice` | Ses kaydı, dalga formu, oynatma. Mikrofon izni yalnızca "Kaydet"e basınca. |
| Our Questions | `/questions` | Soru kartları, serbest cevap, isteğe bağlı "birlikte" modu, skor yok. |
| Our Future | `/future` | Hayal → Planlandı → Gerçekleşti. Gerçekleşti işareti yalnızca açık onayla; istenirse anıya dönüşür. |
| Hesap | `/account` | Profil, tercih, verimi indir, hesabımı sil. |

## Davranış kuralları (her modül için)

- **Boş durum:** İçerik yoksa Eln'e boş bir vitrin gösterilmez — bölüm sade bir cümleyle durur
  ya da hiç görünmez. Arda'ya aynı yerde "Studio'dan ekle" kısayolu çıkar.
- **Taslak / yayın:** Her içerik taslak başlar. Yayımlanmadan diğer üye göremez.
- **Silme:** Önce çöp kutusu (geri alınabilir), sonra kalıcı silme (onaylı).
- **Sürüm:** Metin içeren içeriklerin önceki halleri saklanır.
- **Hata:** Her form alan bazında anlaşılır Türkçe hata gösterir; ağ hatasında içerik kaybolmaz.
- **Tarih yoksa hesap yok:** Yılı girilmemiş tarihten süre, yaş, yıldönümü sayısı üretilmez.
- **Kimse zorlanmaz:** Cevap, tepki, onay, "gördüm" isteyen hiçbir arayüz yoktur.

## Bilinçli olarak olmayanlar

Analitik · okundu bilgisi · çevrimiçi durumu · konum · push/e-posta bildirimi · yorum/beğeni sayaçları ·
herkese açık paylaşım bağlantısı · arama motoru indeksi · yapay zekâ ile metin/görsel üretimi.
