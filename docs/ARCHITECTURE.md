# ARCHITECTURE — Mimari

## Genel resim

```
Tarayıcı ──(HTML, server action, form)──▶ Next.js sunucusu ──▶ Supabase
   │                                         │                   ├─ Postgres (RLS)
   │  yalnızca: tek kullanımlık imzalı       │ kullanıcı istemcisi├─ Auth
   └──── yükleme URL'sine PUT ──────────────▶│ (RLS'e tabi)       └─ Storage (özel kova)
        imzalı URL'den <img>/<audio> GET     │ admin istemcisi (yalnızca belirli işler)
```

Tarayıcı Supabase'in API'siyle **hiç konuşmaz** ve hiçbir anahtar görmez. İki istisna
anahtarsızdır: dosya yüklerken sunucunun verdiği tek kullanımlık imzalı URL'ye `PUT`, ve
sunucunun ürettiği süreli imzalı URL'lerden görsel/ses indirme.

## Katmanlar

| Katman | Yer | Kural |
| --- | --- | --- |
| Sayfa | `src/app/**/page.tsx` | Sunucu bileşeni. `requireMember()` / `requireOwner()` ile başlar, `queries` çağırır. |
| Okuma | `src/features/<x>/queries.ts` | `import "server-only"`. `session.supabase` (RLS'li) ile okur, görünüm modeli döndürür. Admin istemcisi **kullanmaz**. |
| Yazma | `src/features/<x>/actions.ts` | `"use server"`. Oturum → Zod → (rate limit) → RLS'li yazma → `revalidatePath` → `ActionResult`. |
| Doğrulama | `src/features/<x>/schema.ts` | Zod şemaları + seçenek listeleri. İstemci ve sunucu ortak kullanır. |
| Arayüz | `src/features/<x>/components`, `src/components` | Varsayılan sunucu bileşeni; etkileşim gereken yerde `"use client"`. |
| Saf mantık | `src/lib/dates`, `src/lib/media/rules.ts` | I/O yok, test edilebilir. |

Referans modül: **`src/features/letters`**. Yeni modül yazarken onun düzenini kopyala.

## Kimlik ve yetki — üç kat

1. **`src/proxy.ts`** (Next 16'da middleware'in adı): oturumu tazeler, üye olmayanı `/login`'e
   yollar, isteğe özel nonce'lu CSP ekler. Dış kapıdır; tek başına güvenilmez.
2. **Sayfa / action**: her biri `getSession()` ile oturumu ve rolü yeniden doğrular.
3. **Veritabanı (RLS)**: asıl yetki katmanı. Arayüzdeki bir hata bile taslağı ya da kilitli
   içeriği sızdıramaz, çünkü satır sorgudan hiç dönmez.

Oturum çerezleri `HttpOnly`, `SameSite=Lax`, üretimde `Secure`. Kayıt (sign-up) kapalıdır;
hesaplar yalnızca `/setup` (bir kez) ve davet kabulüyle sunucuda oluşturulur.

### Akışlar

- **Kurulum:** `/setup` → `SETUP_SECRET` (sabit zamanlı karşılaştırma) → admin API ile kullanıcı →
  `bootstrap_space` RPC (tek transaction: alan, profil, üyelik, tarihler, özel günler, iki anı).
  Alan varsa hem sayfa hem action hem SQL fonksiyonu reddeder (`private_spaces` üzerinde tekil indeks).
- **Davet:** 32 baytlık rastgele token; veritabanında yalnızca SHA-256 özeti. Tek kullanımlık, süreli.
  Kabulde kullanıcı oluşturulur, `accept_invite` RPC üyeliği ekler. Aynı e-posta zaten partner ise
  bağlantı yalnızca parolayı yeniler (unutulan parola için SMTP gerekmez). Owner'ı asla ele geçiremez.
- **İlk açılış:** davet kabulü → `/gift`. "Hediye izlendi" bilgisi yalnızca `localStorage`'da.

## Medya hattı (`src/lib/media`)

1. `beginUploadAction` — tür/boyut kontrolü, `media_assets` satırı (`pending`, `private`), imzalı yükleme URL'si.
2. Tarayıcı dosyayı doğrudan özel kovaya `PUT` eder (ilerleme çubuğu; Vercel'in gövde sınırına takılmaz).
3. `finalizeUploadAction` — dosyayı geri okur, **sihirli baytları** doğrular, SHA-256 hesaplar; fotoğrafsa
   `sharp` ile döndürür ve `thumb / medium / large` WebP varyantlarını üretir (EXIF/GPS yok) + bulanık önizleme.
   Geçersizse dosya ve satır silinir.
4. Görüntüleme — sorgu RLS ile görünür satırları getirir; `signImages()` hepsini tek çağrıda imzalar (6 saat).

Orijinal dosya `<<space>>/originals/<<asset>>/original.<<ext>>` yolunda **aynen** durur; yalnızca yedek
ve dışa aktarımda kullanılır. Kovada üyeler için hiçbir politika yoktur.

Görünürlük tetikleyicilerle yönetilir: bir dosya ancak yayımlanmış bir fotoğraf/ses kaydı ya da
yayımlanmış bir kapsülün parçasıysa `visibility = 'space'` olur; kapsüldeyse `sealed_until` dolana kadar gizlidir.

## Tarihler

`relationship_dates` tek kaynak. `src/features/dates/queries.ts` okur, `src/lib/dates` hesaplar
(`describeDate`: tarih yoksa `unknown`, yıl yoksa süre/yaş yok). "Bugün" cihazın değil, bakan kişinin
profilindeki saat diliminin günüdür. Saatler `Intl` ile saat diliminden hesaplanır; konum kullanılmaz.

## Düzenlenebilir metinler

`src/content/sections.ts` şema + varsayılan; `content_sections` yayımlanmış, `content_section_drafts`
(yalnızca owner) taslak. Yayımlamak taslağı yayımlanmış satıra kopyalar. Boş alan = hiçbir şey görünmez.

## Render ve performans

- `cacheComponents` kapalı; her sayfa oturuma bağlı dinamik render. Sayfa içi tekrar eden okumalar `React.cache`.
- İstemci JS yalnızca etkileşimli adalarda. Hareket yalnızca `transform`/`opacity`.
- `StarField` görünmezken ve sekme gizliyken durur; telefonlarda yoğunluk yarıya iner; parallax yalnızca
  ≥768px + fare. `prefers-reduced-motion` her yardımcıda dikkate alınır.
- Görseller önceden boyutlandırılmış varyantlarla `srcset`; Next optimizer özel medyayı proxy'lemez.
- 3D yalnızca `/universe` içinde ve dinamik import ile yüklenecek (bkz. ROADMAP).

## Taşınabilirlik

Uygulama standart bir Node sunucusudur (`next build && next start`); Vercel'e özgü API kullanılmaz.
Veri katmanı Supabase'e bağlıdır ama Supabase açık kaynaklıdır ve kendi sunucunda çalıştırılabilir;
veritabanı düz Postgres dökümüyle, medya düz dosya ağacıyla yedeklenir (bkz. `BACKUP_GUIDE.md`).
