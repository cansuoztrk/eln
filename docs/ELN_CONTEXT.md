# ELN_CONTEXT — Doğrulanmış gerçekler

Bu dosya projenin **tek gerçek kaynağıdır**. Burada yazmayan hiçbir bilgi gerçekmiş gibi
sunulmaz. Yeni bir bilgi ancak Arda söylediğinde buraya eklenir.

## Kişiler

| | Arda | Eln |
| --- | --- | --- |
| Ad | Arda | Elnare — hitap: **Eln** |
| Şehir | İstanbul | Bakü |
| Saat dilimi | `Europe/Istanbul` | `Asia/Baku` |
| Okul | Yıldız Teknik Üniversitesi — Siyaset Bilimi ve Uluslararası İlişkiler | Azerbaycan Diller Okulu — İngilizce öğretmenliği |
| Doğum günü | 7 Kasım (yıl bilinmiyor) | 23 Nisan (yıl bilinmiyor) |
| Rol | Hazırlayan, yönetici (`owner`) | Özel kişi, davetli (`partner`) |

## Tarihler (kesinleşmiş)

| Anahtar | Tarih | Not |
| --- | --- | --- |
| `met` | **6 Aralık 2025** | Tanışma. "Our Beginning" başlangıcı. |
| `together` | **21 Mayıs 2026** | Sevgili oluş. "Our Story"de ilişkinin başlangıcı. |
| `eln_birthday` | 23 Nisan, her yıl | Doğum yılı bilinmiyor → **yaş gösterilmez**. |
| `arda_birthday` | 7 Kasım, her yıl | Doğum yılı bilinmiyor → **yaş gösterilmez**. |
| `first_meeting` | **belli değil** | Henüz yüz yüze buluşulmadı. Tarih girilene kadar **sayaç yok**. |

Türetilen ve kodda hesaplanan (asla elle yazılmayan) değerler:

- Tanışma → sevgili oluş arası: **166 gün** (6 Aralık 2025 → 21 Mayıs 2026).
- Tanışmadan / sevgili oluştan bugüne geçen gün sayısı: çalışma anında hesaplanır.
- Bir sonraki özel gün ve kalan gün: çalışma anında hesaplanır.

## Bilinenler

- Uzak mesafe ilişkisi: Arda İstanbul'da, Eln Bakü'de.
- **Henüz yüz yüze buluşmadılar.** Birlikte çekilmiş fotoğraf yok.
- Fotoğraflar: Arda yalnızca Eln'in gerçek fotoğraflarını yükleyecek.
- Şarkıları: **Onur Can Özcan — "Anılar Şarkısı"** (platformlardaki resmî adı "Anılar").
  Resmî bağlantılar (Arda verdi, 2026-11-10; paylaşım izleme parametreleri çıkarıldı):
  YouTube `https://www.youtube.com/watch?v=bpMRUwYpNkM` · Spotify `https://open.spotify.com/track/4TJCZsX5VjPZwUfho4mknR`.
- Eln Hello Kitty'yi seviyor.
- Zaman zaman kırgınlık/küslük yaşanabiliyor; proje hazırlanırken de biraz kırgınlık var.
  **Sebebi bilinmiyor ve hiçbir metinde tahmin edilmez.**

## Bilinmeyenler — uydurulmaz, Studio'dan girilir

- 6 Aralık 2025 – 21 Mayıs 2026 arasında yaşanan belirli olaylar, konuşmalar, anılar.
- Nasıl/nerede tanıştıkları.
- Doğum yılları.
- İlk buluşmanın tarihi, yeri, planı; herhangi bir seyahat bilgisi.
- Belirli anıların, konuşmaların ve o günlerin ayrıntıları (bunlar yazılan hiçbir metinde yer almaz).
- Ortak hayaller listesi.
- Arda ile Eln'in sesli/görüntülü görüşüp görüşmediği; Eln'in huyları, alışkanlıkları, sevdiği şeyler
  (Hello Kitty dışında). Metinler bunlar hakkında bir şey iddia etmez.

## Metinleri kim yazar

Arda 10 Kasım 2026'da bütün cümlelerin ve paragrafların onun yerine, duygusal bir dille yazılmasını
istedi. Bu metinler `src/content/writing.ts` içindedir ve yukarıdaki "Bilinenler"den başka hiçbir
şeye dayanmaz: Arda'nın kendi hisleri + kesin bilgiler. Olay/anı/konuşma uydurulmaz, Eln'in hisleri
onun adına yazılmaz, sayılar ve tarihler elle değil `FACTS` üzerinden hesaplanır. Mektuplar ve notlar
Studio'ya **taslak** olarak girer; Arda okuyup yayımlamadan Eln görmez. Kurallar birim testiyle korunur
(`tests/unit/content.test.ts` → "the words written for Arda").

## Duygusal referans (yayımlanmaz)

Eln, Arda'nın 7 Kasım doğum gününde uzun bir mesaj yazdı. Bu mesaj **sitede yer almaz,
alıntılanmaz, başka kelimelerle yeniden yazılmaz**. Yalnızca tonun derinliğini anlamak için
Arda'nın özetlediği temalar not edilmiştir:

- Birlikte bir gelecek hayali · hayatında değerli görme · olduğu gibi kabul
- Bir gün yanına gelip sarılma hayali · birlikte anı biriktirme isteği
- Kaybetme korkusu · mutlu etmekten mutluluk duyma · ilişkinin onun için özel oluşu

Bu temalar Eln'e aittir. Arda'nın ağzından "senin şunu hissettiğini biliyorum" gibi
kesin cümlelere dönüştürülmez. Sitedeki ses **yalnızca Arda'nın kendi hisleridir**:
sevgi, özlem, değer verme, minnet, samimi düşünce.

> Not: Arda mesajın ekran görüntüsünden söz etti; görsel bu depoya eklenmedi ve eklenmemeli.

## Dil ve ton

- Doğal, gündelik Türkçe. Kısa ve dürüst cümle, ağdalı paragraftan iyidir.
- Yasaklı kalıplar: "Sensiz yaşayamam", "Beni asla bırakma", "Bana dön",
  "Beni affetmek zorundasın", "Sonsuza kadar benim ol" ve benzeri sahiplenici/baskıcı ifadeler.
- Site bir özür metni değildir; kırgınlığa gönderme yapmaz, karşılık beklemez.
- Eln'e her zaman seçim bırakılır: "istediğin zaman, istediğin kadar".
