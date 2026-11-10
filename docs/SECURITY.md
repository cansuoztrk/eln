# SECURITY — Güvenlik

Tehdit modeli: iki kişilik özel bir site. Korunacak şey kişisel fotoğraflar, mektuplar ve
"henüz gösterilmemesi gerekenler" (taslaklar, kilitli içerik). Olası saldırgan: bağlantıyı
tahmin eden/ele geçiren biri, otomatik tarayıcılar, parola deneyen botlar.

## Katmanlar

| Konu | Uygulama | Nerede |
| --- | --- | --- |
| Davetle giriş | Kayıt kapalı; hesap yalnızca `/setup` (bir kez) ve tek kullanımlık davetle oluşur | `supabase/config.toml` (`enable_signup=false`), `features/auth/actions.ts` |
| Kurulum kilidi | `SETUP_SECRET` (sabit zamanlı karşılaştırma) + tekil alan indeksi + RPC kontrolü | `setupAction`, `bootstrap_space`, `private_spaces_singleton` |
| Davet | 256 bit token; yalnızca SHA-256 özeti saklanır; süreli, tek kullanımlık, iptal edilebilir; owner hesabını ele geçiremez | `space_invites`, `acceptInviteAction` |
| Oturum | Supabase Auth; çerezler `HttpOnly`, `SameSite=Lax`, üretimde `Secure`; dönen yenileme token'ı | `lib/supabase/server.ts`, `proxy.ts` |
| Anahtarlar | Hiçbir Supabase anahtarı tarayıcıya gitmez; `NEXT_PUBLIC_` değişkeni yok; service role yalnızca `lib/supabase/admin.ts` | `lib/env.ts` |
| Yetki | RLS her tabloda; taslak ve kilitli içerik sorgudan dönmez | `…000300_policies.sql` |
| Depolama | Tek özel kova, üye politikası yok; erişim yalnızca sunucunun ürettiği süreli imzalı URL ile | `…000500_storage.sql`, `lib/media/server.ts` |
| Yükleme | MIME beyaz listesi, boyut sınırı, **sihirli bayt** doğrulaması, `sharp` piksel sınırı (80 MP), yeniden kodlama | `lib/media/rules.ts`, `server.ts` |
| Girdi | Her action Zod ile doğrular; metinler düz metin olarak render edilir (HTML/Markdown yok → XSS yüzeyi yok) | `features/*/schema.ts` |
| Hız sınırı | Giriş, kurulum, davet, yazma, yükleme; anahtar = HMAC(APP_SECRET, eylem+kimlik); ≤ 1 saat tutulur | `lib/security/rate-limit.ts`, `check_rate_limit` |
| CSRF | Server action'lar Origin doğrular; çerezler `SameSite=Lax`; formlar `method="post"` (JS yüklenmese bile alanlar URL'ye düşmez) | Next.js + formlar |
| Başlıklar | İstek başına nonce'lu CSP (`script-src 'nonce-…' 'strict-dynamic'`), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, HSTS (üretim) | `proxy.ts`, `next.config.ts` |
| İndeks | `X-Robots-Tag: noindex…`, `robots.txt: Disallow: /`, meta robots | `next.config.ts`, `app/robots.ts`, `app/layout.tsx` |
| Hata mesajları | Girişte tek mesaj ("E-posta ya da parola hatalı"); geçersiz/süresi dolmuş davet tek mesaj | `loginAction`, `acceptInviteAction` |
| Bütünlük | `space_id` / `created_by` / `uploaded_by` değiştirilemez | `app.protect_identity` |
| Kurtarma | Çöp kutusu, sürüm geçmişi, değişiklik kaydı, yedekler | `features/trash`, `content_versions`, `BACKUP_GUIDE.md` |

## Bilinen ödünler

- **`style-src 'unsafe-inline'`**: Framer Motion satır içi stil yazar. Betikler nonce ile kilitli olduğundan
  risk düşük; kullanıcı girdisi hiçbir yerde HTML/CSS olarak basılmaz.
- **İmzalı URL'ler 6 saat geçerlidir.** URL'yi bilen o süre içinde dosyayı açabilir. URL'ler yalnızca
  oturum açmış üyeye gönderilir ve `Referrer-Policy: no-referrer` ile dışarı sızmaz.
- **Hız sınırı hata verirse açık kalır** (iki kişi kendi sitelerinden kilitlenmesin diye). Supabase Auth'un
  kendi IP sınırı ayrıca devrededir.
- **Proje sahibi veritabanı paneline erişebilir.** Uygulama Eln'in taslaklarını Arda'ya göstermez; ancak
  Supabase panosu teknik olarak her şeyi gösterir. Bu `PRIVACY.md`'de açıkça yazılıdır.

## Yayına alırken

1. `APP_SECRET` ve `SETUP_SECRET` için yeni, uzun rastgele değerler üret (`openssl rand -base64 48`).
2. Supabase → Authentication → Sign In / Providers: **e-posta ile kayıt kapalı** ("Allow new users to sign up" kapalı).
3. Supabase → Auth → parola en az 10 karakter; sızdırılmış parola koruması açık.
4. `supabase db push` ile migration'ları uygula; `media` kovasının **private** olduğunu doğrula.
5. `SITE_URL`'yi gerçek adrese ayarla; site yalnızca HTTPS üzerinden yayınlansın.
6. `/setup`'ı tamamladıktan sonra `SETUP_SECRET`'i değiştir ya da kaldırma — sayfa zaten kalıcı olarak kapanır.
7. Service role anahtarını yalnızca sunucu ortam değişkeni olarak tut; asla depoya, istemciye, loglara yazma.
8. İlk yedeği al ve geri yüklemeyi bir kez prova et (`BACKUP_GUIDE.md`).

## Değişiklik yaparken kontrol listesi

- [ ] Yeni tablo → RLS açık mı, politika + `tests/db` testi var mı?
- [ ] Yeni action → oturum, Zod, (gerekirse) rate limit, RLS'li istemci?
- [ ] `createAdminClient` yalnızca izinli yerlerde mi (kurulum, davet, depolama, dışa aktarım, hesap silme)?
- [ ] Kullanıcı metni `dangerouslySetInnerHTML` ile basılıyor mu? (Basılmamalı.)
- [ ] Yeni dış kaynak → CSP'ye eklendi mi, gerçekten gerekli mi, sayfa yükünde mi çağrılıyor? (Çağrılmamalı.)
- [ ] Loglara kişisel içerik ya da token yazılıyor mu? (Yazılmamalı.)
