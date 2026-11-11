# BACKUP_GUIDE — Yedekleme, geri yükleme, taşıma

Bu sitede yıllarca anı birikecek. Kural basit: **verinin bir kopyası her zaman senin elinde olsun.**
Veritabanı yedeği ile fotoğraf yedeği birbirinden bağımsızdır; biri bozulsa diğeri etkilenmez.

## Neyin yedeği alınır

| Parça | İçerik | Nerede durur |
| --- | --- | --- |
| Veri (JSON) | Her tablonun her satırı, düz JSON. Her yerde okunur, başka bir sisteme taşınabilir. | `<yedek>/data/*.json` |
| Veri (SQL) | `pg_dump` ile tam döküm: şema, politikalar, tetikleyiciler + hesaplar (parola özetleriyle) | `<yedek>/sql/*.sql` |
| Medya | Dokunulmamış orijinaller + sitede gösterilen varyantlar, aynı klasör yapısıyla | `<yedek>/media/…` |
| Dökümler | Satır sayıları, dosya listesi, SHA-256 sağlama toplamları | `manifest.json`, `media-manifest.json` |

## Elle yedek

```bash
npm run backup
```

`.env.local` içindeki `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` kullanılır; çıktı `backups/<zaman>/`
klasörüne yazılır (git'e girmez). Seçenekler:

```bash
node scripts/backup.mjs --db-only
```

```bash
node scripts/backup.mjs --media-only
```

```bash
node scripts/backup.mjs --out /Volumes/Yedek/elnare-2026-11
```

Tam SQL dökümü de istersen (önerilir; parolalar da korunur) veritabanı bağlantı adresini ver
(Supabase → Project Settings → Database → Connection string):

```bash
DATABASE_URL="postgresql://postgres:…@db.xxxx.supabase.co:5432/postgres" npm run backup
```

`pg_dump` sürümü sunucudan eskiyse SQL adımı uyarı verip atlanır; JSON ve medya yedeği yine tamamlanır.
O durumda: `npx supabase db dump --db-url "$DATABASE_URL" -f backups/app.sql`.

Yedeği aldıktan sonra **doğrula**:

```bash
node scripts/verify-backup.mjs backups/<zaman>
```

Bu komut her dosyanın yerinde olduğunu, sağlama toplamlarının tuttuğunu ve veritabanının bildiği her
fotoğrafın orijinaliyle varyantlarının yedekte bulunduğunu kontrol eder.

### Yedeği nerede saklamalı (3-2-1)

Üç kopya, iki farklı ortam, biri başka bir yerde: örneğin bilgisayarın + harici disk + şifreli bir bulut
klasörü. Yedek klasörü kişisel fotoğraflar ve mektuplar içerir — **şifrelemeden** herkese açık bir yere koyma.

## Otomatik yedek

1. **Supabase'in kendi yedeği:** Pro planda günlük otomatik yedek ve (eklentiyle) anlık geri dönüş vardır.
   Ücretsiz planda otomatik yedek **yoktur** — aşağıdaki zamanlanmış yedek o zaman şarttır.
2. **Zamanlanmış kendi yedeğin:** `npm run backup` komutunu haftada bir çalıştır. Kendi bilgisayarında:

   ```bash
   crontab -e
   ```

   ```
   0 4 * * 0  cd /yol/eln && /usr/bin/env node scripts/backup.mjs --out "$HOME/ElnareYedek/$(date +\%F)" >> "$HOME/ElnareYedek/log.txt" 2>&1
   ```

   GitHub Actions ile yapacaksan çıktıyı **özel** ve şifreli bir depolama alanına gönder; yedeği asla
   herkese açık bir depoya ya da artifact'e koyma.
3. Site içinden: `Hesabım → Verimi indir` kendi yazdıklarının JSON kopyasını verir (tam yedek değildir).

## Geri yükleme

Geri yükleme **boş** bir projeye yapılır (migration'lar uygulanmış, `/setup` çalıştırılmamış).

```bash
npx supabase db push
```

Önce prova — hiçbir şey yazmaz, ne olacağını söyler:

```bash
node scripts/restore.mjs backups/<zaman> --dry-run
```

**A) SQL dökümün varsa (parolalar korunur):**

```bash
psql "$DATABASE_URL" -f backups/<zaman>/sql/auth-data.sql
```

```bash
node scripts/restore.mjs backups/<zaman> --yes-overwrite
```

**B) Yalnızca JSON varsa:** hesaplar aynı kimliklerle yeniden oluşturulur ama parolalar taşınamaz.

```bash
RESTORE_OWNER_EMAIL="senin@e-postan" node scripts/restore.mjs backups/<zaman> --yes-overwrite
```

Sonra kendi parolanı Supabase → Authentication → Users → "Send password recovery / Reset password" ile
belirle; Eln için `Studio → Davet`'ten aynı e-postaya yeni bir bağlantı oluştur (hesabı silinmez, yalnızca
yeni parola belirler).

Yalnızca bir yarıyı geri yüklemek için `--db-only` ya da `--media-only` ekle. Geri yüklemeden sonra:
giriş yap, galeriden birkaç fotoğraf aç, bir mektubu oku, `Studio → Çöp kutusu`'na bak.

> Bu akış geliştirme sırasında gerçekten denendi: yerel veritabanı sıfırlandı, JSON + medya yedeğinden
> geri yüklendi, satır ve dosya sayıları birebir tuttu.

## Başka bir sağlayıcıya taşıma

- **Uygulama:** standart Node sunucusu. `npm run build && npm run start` çalışan her yerde yaşar
  (Vercel, Railway, Fly, kendi sunucun). Ortam değişkenlerini taşı (`.env.example`).
- **Supabase'ten Supabase'e:** yeni proje → `supabase db push` → yukarıdaki geri yükleme.
- **Supabase'i kendin barındırmak:** Supabase açık kaynaklıdır; aynı migration'lar ve aynı geri yükleme çalışır.
- **Tamamen başka bir sisteme:** `data/*.json` düz veridir, `media/` düz dosyadır; hiçbir özel biçim yoktur.
  `media_assets.original_path` her fotoğrafın orijinal dosyasını gösterir.

## Yıllık bakım (her yıl bir kez, örneğin 6 Aralık'ta)

- [ ] Tam yedek al (`DATABASE_URL` ile), doğrula, iki ayrı yere kopyala.
- [ ] Bir geri yükleme provası yap (`--dry-run` yeterli; iki yılda bir boş bir projeye gerçekten yükle).
- [ ] `npm outdated` → güvenlik güncellemelerini uygula; `npm run check` ve `npm run test:db` yeşil kalsın.
- [ ] Supabase projesinin duraklatılmadığını kontrol et (ücretsiz planda uzun süre kullanılmayan proje duraklar).
- [ ] Alan adı ve barındırma yenilemelerini kontrol et.
- [ ] `Studio → Çöp kutusu`: gerçekten gitmesini istediklerini kalıcı sil.
- [ ] Depolama kullanımına bak; orijinaller büyüyorsa planı ya da arşiv stratejisini gözden geçir.
- [ ] `APP_SECRET` ve service role anahtarını döndürmeyi düşün (özellikle bir cihaz kaybolduysa).
- [ ] Doğum günleri ve yıldönümleri için o yılın baskılarını hazırla (`Studio → Tarihler`).
