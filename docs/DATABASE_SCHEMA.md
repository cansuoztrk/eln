# DATABASE_SCHEMA — Veritabanı

Kaynak: `supabase/migrations/*.sql`. Bu dosya özet; kesin tanım SQL'dir. Migration'lar
**düzenlenmez**, yenisi eklenir. TypeScript tipleri `npm run db:types` ile üretilir.

## Migration'lar

| Dosya | İçerik |
| --- | --- |
| `…000100_foundation.sql` | `app` şeması, roller, `private_spaces`, `profiles`, `space_members`, `space_invites`, hız sınırı, üyelik yardımcıları |
| `…000200_content.sql` | Tüm içerik tabloları |
| `…000300_policies.sql` | RLS politikaları (iki üretici fonksiyonla tek biçim) |
| `…000400_behaviour.sql` | Medya görünürlüğü, sürüm geçmişi, değişiklik kaydı, mühürlü görünümler, günün notu, kurulum, davet kabulü |
| `…000500_storage.sql` | Özel `media` kovası (üye politikası yok) |
| `20261110000200_room_presence.sql` | `room_presence(space, day)`: hangi okuma odasında bir şey olduğunu tek çağrıda söyler (çağıranın yetkisiyle, RLS altında) |
| `20261110000100_hardening.sql` | Denetim sıkılaştırması: depolama yolu biçim denetimi, "dosya yalnızca yükleyenin" kuralı, `asset_id` değişmezliği, ek bağlantılarını yerinde güncelleme |

## Tablolar

**Kişiler ve alan** — `private_spaces` (tekil; adlar, şehirler, saat dilimleri, 365 ayarı) ·
`profiles` · `space_members` (alan başına bir `owner`, bir `partner`) · `space_invites` (yalnızca token özeti).

**Tarihler** — `relationship_dates` (`key`, gün/ay, yıl *boş olabilir*, `happened`) ·
`special_days` (bir tarihin kutlama sayfası) · `special_day_editions` (yıl başına bir baskı, `reveal_at`).

**Medya** — `media_assets` (orijinal yol, varyantlar, sağlama toplamı, `visibility`, `sealed_until`) ·
`photos` (asset'in yayımlanabilir sarmalayıcısı: açıklama, tarih, etiket, favori, albüm) · `albums` ·
`voice_memories`.

**Yazılar** — `memories` + `memory_photos` · `letters` (`unlock_at` ile mühürlenir) ·
`time_capsules` + `time_capsule_items` · `journal_entries` (+ `journal_entry_photos`, `visibility`) ·
`distance_notes` (`note` / `longing`) · `daily_notes` + `daily_note_schedule` · `future_plans` ·
`questions` + `answers`.

**Site** — `content_sections` (yayımlanmış metin) · `content_section_drafts` (owner taslağı) ·
`theme_settings` · `user_preferences` (kişiye özel).

**Geçmiş** — `content_versions` (satırın önceki halleri, satır başına son 50) · `audit_logs`
(kim neyi *değiştirdi*; görüntüleme kaydı değildir) · `app.rate_limits`.

Ortak sütunlar: `id uuid`, `space_id`, `created_by` (varsayılan `auth.uid()`), `status`
(`draft|published`), `created_at`, `updated_at`, `deleted_at` (çöp kutusu).

## RLS — düz yazıyla

| Kural | Nerede |
| --- | --- |
| Üye olmayan hiçbir şey göremez; `anon` rolünün hiçbir yetkisi yok | tüm tablolar |
| Taslak yalnızca yazarına görünür — owner dahil kimse göremez | `apply_member_content_policies` |
| Yayımlanmış içerik iki üyeye görünür | aynı |
| Yalnızca yazar kendi yazısını değiştirir/siler | aynı |
| Owner, **yayımlanmış** fotoğraf ve anıyı düzenleyebilir/çöpe atabilir (küratörlük) | `photos`, `memories` (`p_moderated`) |
| Kilitli mektup/kapsül/baskı, tarihi gelmeden diğer üyeye dönmez | `p_extra_visible` |
| "Yalnızca ben" günlük kaydı diğerine dönmez | `journal_entries` |
| "Birlikte" soruda diğerinin cevabı, sen cevaplayana dek dönmez | `answers` |
| 365 notu, günü gelmeden partner'a dönmez | `daily_notes` + `app.note_is_revealed` |
| Site ayarı tablolarını yalnızca owner yazar | `apply_owner_managed_policies` |
| `space_id`, `created_by`, `uploaded_by` değiştirilemez | `app.protect_identity` tetikleyicisi |
| Medya satırını üyeler yalnızca ekleyebilir (pending/private); güncelleme/silme yok | `media_assets` |
| Medya satırının yolu yalnızca kendi kimliğine ait klasörü gösterebilir | `media_assets_path_shape` |
| Fotoğraf/ses kaydı yalnızca **yazarın kendi yüklediği** dosyayı sarabilir; sonradan başka dosyaya çevrilemez | `app.owns_asset`, `protect_asset_link` |
| Sürüm geçmişini yalnızca yazarı okur | `content_versions` |

Yardımcılar `app` şemasındadır (`is_member`, `is_owner`, …), `security definer` + boş `search_path`,
API'ye açık değildir.

## API'ye açık fonksiyonlar

| Fonksiyon | Kim | Ne yapar |
| --- | --- | --- |
| `sealed_letters(space)`, `sealed_capsules(space)`, `sealed_editions(space)` | üyeler | Mühürlü içeriğin yalnızca başlık + açılma tarihini döndürür |
| `ensure_daily_notes(space, day)` | üyeler | Başlangıçtan `day`'e kadar her güne not atar (ziyaretten bağımsız) |
| `room_presence(space, day)` | üyeler | Galeri / mektuplar / 365 not / kapsül odalarında, **soranın görebildiği** bir şey var mı (`security invoker`; hiçbir şey kaydetmez) |
| `bootstrap_space(owner, config)` | yalnızca service role | Tek seferlik kurulum |
| `accept_invite(token_hash, user, profile)` | yalnızca service role | Davet kabulü |
| `check_rate_limit(key, max, window)` | yalnızca service role | Deneme sayacı |

## Değişiklik yaparken

1. `supabase/migrations/<zaman>_<ad>.sql` ekle (eskisini düzenleme).
2. Yeni tabloya RLS: mümkünse `select app.apply_member_content_policies('public.x')` ya da owner sürümü.
3. `npm run db:reset && npm run db:types`.
4. `tests/db` altına "kim görür / kim göremez" testi.
5. Bu dosyayı güncelle.
