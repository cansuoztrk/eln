# ELNARE — BEYOND DISTANCE

Arda'nın Eln (Elnare) için hazırladığı, yıllarca yaşayacak özel bir dijital dünya.
Tek kullanımlık bir hediye sitesi değil: davetle girilen, içerikleri Studio'dan yönetilen,
verisi yedeklenebilen gerçek bir web uygulaması.

Bu dosya her oturumda otomatik okunur. Ayrıntılar `docs/` altında; işe başlamadan önce
ilgili dosyayı oku.

| Dosya | Ne zaman okunur |
| --- | --- |
| `docs/ELN_CONTEXT.md` | Metin yazarken, tarih/sayaç kodlarken — **doğrulanmış gerçekler burada** |
| `docs/CREATIVE_DIRECTION.md` | Yeni bir sayfa/sahne tasarlarken |
| `docs/DESIGN_SYSTEM.md` | Bileşen, renk, tipografi, hareket kullanırken |
| `docs/PRODUCT_SPEC.md` | Bir modülün kapsamını anlamak için |
| `docs/ARCHITECTURE.md` | Kod yapısı, veri akışı, auth, medya hattı |
| `docs/DATABASE_SCHEMA.md` | Tablo, RLS, migration eklerken |
| `docs/SECURITY.md` / `docs/PRIVACY.md` | Auth, yükleme, günlük kaydı, izleme ile ilgili her değişiklikte |
| `docs/CONTENT_GUIDE.md` | Arda için içerik/ton rehberi |
| `docs/BACKUP_GUIDE.md` | Yedek, geri yükleme, taşıma, yıllık bakım |
| `docs/ROADMAP.md` | Neyin bittiği, sırada ne olduğu |

## Değişmez kurallar

1. **Uydurma yok.** Bilinmeyen anı, konuşma, his, tarih, istatistik üretme. Doğrulanmış
   gerçekler `docs/ELN_CONTEXT.md` içinde. Orada olmayan her şey Studio'dan girilir.
2. **Eln'in özel mesajı yayımlanmaz.** 7 Kasım mesajı yalnızca duygusal referanstır;
   cümleleri kopyalanmaz, alıntılanmaz.
3. **Baskı mekaniği yok.** Affetmeye, cevap vermeye, geri dönmeye zorlayan hiçbir metin,
   sayaç, bildirim, "okundu" bilgisi, seri (streak) veya suçluluk tasarımı eklenmez.
4. **İzleme yok.** Ziyaret sayısı, okundu bilgisi, konum, IP profili, analitik, otomatik
   bildirim eklenmez. Üçüncü taraf istek (font, analytics, CDN) sayfa yükünde yapılmaz.
5. **Sahte fotoğraf yok.** Stock görsel Eln'in yerine kullanılmaz; yapay zekâ ile birlikte
   fotoğraf üretilmez; yüklenen fotoğraflar değiştirilmez. Tüm fotoğraflar gerçek yüklemedir.
6. **İlk buluşma henüz olmadı.** `first_meeting` tarihi girilene kadar sayaç yok;
   Arda "gerçekleşti" diye işaretleyene kadar olmuş gibi gösterilmez.
7. **Tarihler tek kaynaktan.** Tüm sayfalar tarihleri `relationship_dates` tablosundan
   okur; sayaç/yıldönümü hesabı yalnızca `src/lib/dates` içindeki saf fonksiyonlarla yapılır.
8. **Anahtarlar tarayıcıya gitmez.** Tarayıcı Supabase ile doğrudan konuşmaz; `NEXT_PUBLIC_`
   önekli Supabase değişkeni yoktur. Her şey sunucu bileşeni / server action / route handler.
9. **Taslak kişiseldir.** Bir üyenin taslağı diğerine RLS düzeyinde görünmez (admin dahil).
10. **Müzik otomatik başlamaz.** Şarkı dosyası barındırılmaz; yalnızca resmî bağlantı/embed.

## Teknik özet

- Next.js 16 (App Router, `src/`), React 19, TypeScript strict, Tailwind v4 (CSS-first
  `@theme`), Framer Motion, Radix primitives (shadcn/ui tarzı el yazımı bileşenler).
- **Bu Next.js sürümü eğitim verisindekinden farklı** (bkz. `AGENTS.md`): middleware artık
  `src/proxy.ts`; `cookies()`, `params`, `searchParams` asenkron. Emin olmadığın API için
  `node_modules/next/dist/docs/` oku.
- `cacheComponents` **kapalı** (bilinçli karar): uygulama tamamen oturuma bağlı ve imzalı
  URL'ler süreli; klasik dinamik render daha basit ve öngörülebilir.
- Supabase: Postgres + Auth + Storage, tümü RLS arkasında. Yerel geliştirme için Docker'da
  `npx supabase start`.
- Fontlar `@fontsource-variable/*` ile kendi sunucumuzdan (Google'a istek yok).
- 3D (three / R3F / drei) yalnızca `/universe` rotasında, dinamik import ile.

## Komutlar

```bash
npm run dev            # geliştirme sunucusu
npm run check          # typecheck + lint + birim testleri (commit öncesi zorunlu)
npm run db:start       # yerel Supabase (Docker gerekir)
npm run db:reset       # migration'ları sıfırdan uygula
npm run db:types       # src/lib/supabase/database.types.ts üret
npm run test           # Vitest (birim)
npm run test:db        # Vitest (RLS/entegrasyon — yerel Supabase'e karşı)
npm run test:e2e       # Playwright (yerel Supabase + next start'a karşı)
npm run backup         # veritabanı JSON + medya yedeği (bkz. docs/BACKUP_GUIDE.md)
```

## Kod düzeni

```
src/app/(auth)        giriş, davet, kurulum
src/app/(world)       üyelerin gördüğü dünya (navigasyonlu)
src/app/gift          ilk karşılaşma deneyimi (tam ekran)
src/app/studio        Arda'nın içerik stüdyosu (yalnızca owner)
src/app/api           export, medya uçları
src/features/<modül>  queries.ts (okuma) · actions.ts (yazma) · schema.ts (Zod) · components/
src/components/ui     temel bileşenler      src/components/decor   özgün dekoratif çizimler
src/components/motion hareket yardımcıları   src/lib               env, supabase, auth, dates, media, security
supabase/migrations   SQL migration'ları (asla düzenleme, yenisini ekle)
tests/                unit · db · e2e
```

Kurallar:
- Okuma `queries.ts`, yazma `actions.ts`. Her action: oturum doğrula → Zod ile doğrula →
  (gerekirse) rate limit → RLS'li kullanıcı istemcisiyle yaz → `revalidatePath`.
- Service-role istemcisi (`src/lib/supabase/admin.ts`) yalnızca: kurulum, davet kabulü,
  depolama (yükleme/imzalama), dışa aktarım, hesap silme. Başka yerde kullanma.
- Arayüz dili Türkçe; bölüm adlarında İngilizce "eyebrow" etiketleri bilinçli bir dokunuş
  (Eln İngilizce öğretmenliği okuyor).
- Metin sabitleri bileşenlere gömülmez; düzenlenebilir olanlar `content_sections`'tan,
  arayüz metinleri `src/content/` altından gelir.
- Yeni tablo = migration + RLS politikası + `tests/db` testi + `DATABASE_SCHEMA.md` güncellemesi.

## Karar günlüğü

Önemli kararlar buraya tarihle eklenir (en yeni üstte).

- **2026-11-09 — Davet akışı.** Eln tek kullanımlık, süreli bir bağlantıyla gelir ve yalnızca
  bir parola belirler ("anahtarını sen seç"). Hesap sunucuda service-role ile oluşturulur;
  SMTP gerekmez. Anonim oturum yerine gerçek hesap: cihaz değişse de erişim kaybolmaz.
- **2026-11-09 — "İlk kez açtı" bilgisi sunucuda tutulmaz.** Gift deneyiminin gösterilip
  gösterilmediği yalnızca Eln'in cihazındaki `localStorage` bayrağıdır; okundu bilgisi sayılmasın diye.
- **2026-11-09 — Medya erişimi.** Depolama kovası tamamen kapalı (kullanıcı politikası yok).
  Yetki `media_assets` RLS'inde; sunucu görünür satırlar için toplu imzalı URL üretir.
  Orijinal dosya aynen saklanır, sunulan varyantlar EXIF'siz WebP.
- **2026-11-09 — Kilitli içerik.** Zaman kapsülü/kilitli mektup gövdesi `unlock_at` gelmeden
  RLS'ten geçmez; mühürlü görünüm yalnızca başlık + tarih döndüren `security definer`
  fonksiyonlarla sağlanır.
- **2026-11-09 — 365 not arşivi ziyaretten bağımsız.** Her takvim gününe not ataması,
  kim açarsa açsın geriye dönük doldurulur; böylece arşiv "Eln o gün girdi mi" bilgisini taşımaz.
- **2026-11-09 — `cacheComponents` kapalı**, fontlar self-hosted, Supabase anahtarları yalnızca sunucuda.
- **2026-11-09 — Tarihler kesinleşti.** Tanışma 6 Aralık 2025, sevgili oluş 21 Mayıs 2026.
  Doğum yılları bilinmiyor → yaş hesaplanmaz.
