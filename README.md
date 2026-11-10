# ELNARE — Beyond Distance

> İstanbul'dan Bakü'ye, kalbimde sana ait küçük bir evren.

Arda'nın Eln için hazırladığı özel, davetle girilen, yıllarca yaşayacak dijital dünya.
Next.js 16 · React 19 · TypeScript · Tailwind v4 · Framer Motion · Supabase (Postgres + Auth + Storage, RLS).

Ne olduğu ve neden böyle yapıldığı: [`CLAUDE.md`](CLAUDE.md) ve [`docs/`](docs).

## Kurulum (yerel)

Gerekenler: Node 22+, Docker (yerel Supabase için).

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run db:start
```

`db:start` yerel Supabase'i açar, migration'ları uygular ve anahtarları yazdırır. `.env.local` içine
`API_URL` → `SUPABASE_URL`, `ANON_KEY` → `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`
değerlerini koy; `APP_SECRET` ve `SETUP_SECRET` için rastgele değerler üret.

```bash
npm run dev
```

`http://localhost:3000` → otomatik olarak `/setup`'a gider. Kurulum anahtarı (`SETUP_SECRET`), e-postan ve
parolanla ilk hesabı oluştur. Bu ekran bir kez çalışır ve kalıcı olarak kapanır.

## Yayına alma

1. [supabase.com](https://supabase.com)'da proje aç. **Authentication → Sign In / Providers**: yeni kullanıcı kaydını kapat.
2. Şemayı gönder:

   ```bash
   npx supabase link --project-ref <ref>
   ```

   ```bash
   npx supabase db push
   ```

3. Barındırma sağlayıcında (Vercel vb.) `.env.example`'daki değişkenleri tanımla. Hiçbiri `NEXT_PUBLIC_` değildir.
4. Yayınla, `https://<alan-adın>/setup`'ı aç, hesabını oluştur.
5. `Studio`'da içeriği hazırla → `Studio → Davet` ile Eln'in bağlantısını oluştur ve kendin ilet.
6. İlk yedeği al: [`docs/BACKUP_GUIDE.md`](docs/BACKUP_GUIDE.md).

Yayın öncesi güvenlik listesi: [`docs/SECURITY.md`](docs/SECURITY.md).

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run check` | Typecheck + lint + birim testleri |
| `npm run test:db` | RLS / güvenlik testleri (yerel Supabase açıkken) |
| `npm run db:start` · `db:stop` · `db:reset` | Yerel Supabase |
| `npm run db:types` | Veritabanından TypeScript tiplerini üret |
| `npm run backup` | Veri (JSON) + medya yedeği |
| `node scripts/verify-backup.mjs <klasör>` | Yedeği doğrula |
| `node scripts/restore.mjs <klasör> --dry-run` | Geri yükleme provası |

## İçerik

Site boş ama hazır gelir: iki tarih, dört özel gün ve senin yazdığın açılış notu. Gerisi — fotoğraflar,
mektuplar, anılar — yalnızca senin ekleyeceklerindir. Rehber: [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md).

## Gizlilik

Ziyaret, okundu bilgisi, konum, analitik yoktur; arama motorlarına kapalıdır; anahtarlar tarayıcıya gitmez.
Ayrıntı: [`docs/PRIVACY.md`](docs/PRIVACY.md).
