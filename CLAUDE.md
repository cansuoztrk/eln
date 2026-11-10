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

1. **Uydurma yok.** Bilinmeyen anı, olay, konuşma, tarih, istatistik üretme; Eln'in ne
   hissettiğini ya da düşündüğünü onun adına yazma. Doğrulanmış gerçekler `docs/ELN_CONTEXT.md`
   içinde. Arda'nın isteğiyle metinler onun sesinden yazılır (`src/content/writing.ts`), ama
   yalnızca **onun hisleri + kesin bilgiler** ile; mektup ve notlar Studio'ya taslak olarak girer.
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
- Anı Evreni (`/universe`) 3D motoru kullanmaz: düz bir canvas üzerinde kendi küçük izdüşümüyle çizilir.

## Komutlar

```bash
npm run dev            # geliştirme sunucusu
npm run check          # typecheck + lint + birim testleri (commit öncesi zorunlu)
npm run db:start       # yerel Supabase (Docker gerekir)
npm run db:reset       # migration'ları sıfırdan uygula
npm run db:types       # src/lib/supabase/database.types.ts üret
npm run test           # Vitest (birim)
npm run test:db        # Vitest (RLS/entegrasyon — yerel Supabase'e karşı)
npm run test:e2e       # Playwright — önce: npm run db:reset && npm run build (boş veritabanı ister)
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
src/content           facts (kesin bilgiler) · writing (Arda'nın sesinden metinler) · copy (oda girişleri) · navigation
src/components/ui     temel bileşenler      src/components/decor   özgün dekoratif çizimler
src/components/motion hareket yardımcıları   src/lib               env, supabase, auth, dates, media, security
supabase/migrations   SQL migration'ları (asla düzenleme, yenisini ekle)
tests/                unit (saf mantık + kod kuralları) · db (RLS) · e2e (ilk kurulum hikâyesi)
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

- **2026-11-10 — Metinleri Claude yazar, Arda yayımlar.** Arda bütün cümlelerin ve paragrafların onun
  yerine, duygusal bir dille yazılmasını istedi. Hepsi `src/content/writing.ts` içinde: bölüm metinleri
  (varsayılan olarak yayında), 8 mektup ve 365 not (Studio → Hazır metinler'den **taslak** olarak eklenir),
  iki dönüm noktası ve dört özel gün girişi (yalnızca boş sayfayı doldurur). Sınırlar değişmedi: olay/anı
  uydurulmaz, Eln adına his yazılmaz, baskı/özür dili yok, sayılar `FACTS`'ten hesaplanır. Bir birim testi
  bunları denetler. Oda girişleri ve boş durum metinleri `src/content/copy.ts`'te toplandı.
- **2026-11-10 — Boş okuma odaları Eln'in menüsünde görünmez.** Galeri, Mektuplar, 365 Not ve Zaman Kapsülü
  içinde bir şey olana kadar onun menülerinde yer almaz (`room_presence` — tek çağrı, RLS ile; hiçbir şey
  kaydetmez). Kendi ekleyebileceği şeylerin bağlantıları Hesabım sayfasında her zaman durur. Arda hepsini görür.
- **2026-11-10 — Telefonda ayrı kompozisyon.** Anı Evreni dik ekranda galaksiyi dik çevirir; galeri tek sütunda
  ritimle akar (tam, sağdan içeri, soldan içeri); ana sayfa fotoğrafları bir büyük + iki küçük; oda listesi iki sütun;
  günlük, yazma formuyla değil kayıtlarla açılır.
- **2026-11-10 — Dosyanın türüne içeriği karar verir.** Yüklemede uzantı ve tarayıcının bildirdiği tür değil,
  dosyanın ilk baytları esas alınır (telefonların `.PNG` adıyla kaydettiği JPEG'ler bu yüzden reddediliyordu).
- **2026-11-10 — Eln'in fotoğrafları depoya girmez.** Arda'nın ilettiği 5 fotoğraf yalnızca yerel denetimde
  gerçek yükleme hattından geçirildi; git'e eklenmedi. Yayındaki siteye Arda Studio'dan yükler.

- **2026-11-10 — Anı Evreni three.js'siz.** Galaksi, canvas 2D üzerinde kendi perspektif izdüşümüyle
  çiziliyor (dön, eğ, yakınlaş, yıldıza dokun). Telefonda da masaüstünde de aynı kod, ~0 ek paket.
  `three` / R3F / drei bu yüzden bağımlılıklardan çıkarıldı; WebGL sürümü gerekirse ayrı bir karar.
- **2026-11-10 — Navigasyon yalnızca var olanı gösterir.** `src/content/navigation.ts` ve
  `studio-nav.ts` içindeki `BUILT` listeleri; bir birim testi her bağlantının bir sayfası olduğunu doğrular.
- **2026-11-10 — `notFound()` akışlı sayfalarda 200 döner.** `loading.tsx` yüzünden durum kodu 200,
  içerik 404 sayfasıdır. Gizli içerik için durum koduna değil RLS'e güvenilir (taslak/kilitli satır hiç dönmez).
- **2026-11-10 — `/setup` zorunlu dinamik.** Üretim derlemesi sayfayı statik üretiyordu; kurulum durumu
  derleme anına değil o anki veritabanına bakmalı (`dynamic = "force-dynamic"`).
- **2026-11-10 — Yedekte isteğe bağlı adım kalanını durdurmaz.** `pg_dump` sürüm uyuşmazlığında SQL dökümü
  uyarıyla atlanır; JSON + medya yedeği yine tamamlanır.
- **2026-11-10 — Alt ajanlar bu planda kullanılmıyor.** Paralel alt ajan denemesi kullanım limitini
  tüketti ve dosya üretmedi. İş tek oturumda, sırayla yapılır.

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
