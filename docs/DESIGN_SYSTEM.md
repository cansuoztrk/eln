# DESIGN_SYSTEM — Tasarım sistemi

Kaynak: `src/app/globals.css` (`@theme`). Tailwind v4, CSS-first. Burada olmayan renk/font kullanılmaz.

## Renk

| Token | Hex | Kullanım |
| --- | --- | --- |
| `ivory` | `#fbf7f2` | Sayfa zemini |
| `pearl` | `#fffdfa` | Kâğıt, kart |
| `beige` | `#f3eae0` | İkincil zemin, alan dolgusu |
| `nude` | `#e8d5c7` | Sıcak yüzey |
| `blush` | `#f9e3e6` | Yumuşak pembe yıkama |
| `powder` | `#f3c9d1` | Pembe vurgu, fiyonk |
| `rose` | `#c98b96` | Dekor, ikon |
| `rose-deep` | `#9c5565` | Vurgulu metin/düğme (ivory üstünde 5:1) |
| `champagne` | `#ead9bb` | Özel detay |
| `gold` | `#b8996a` | Yıldız, ince çizgi |
| `rosegold` | `#b98a78` | Özel detay |
| `taupe` | `#8a7468` | Etiket, sessiz metin (yalnızca büyük/ikincil) |
| `muted` | `#75635b` | İkincil gövde metni (AA) |
| `ink-soft` | `#4a3b37` | Gövde metni |
| `ink` | `#2e2422` | Başlık |
| `night` `dusk` `plum` | `#241a1e` `#3a2930` `#5b3a47` | Pembe alacakaranlık |

Anlamsal: `accent`, `accent-soft`, `accent-wash`, `line`, `line-strong` — temalar (`data-theme`: `rose`,
`champagne`, `pearl`; kişi başına, Minik Dünya'dan seçilir) yalnızca bunları değiştirir. Pembe duygu, nude/ivory yüzey, rose gold/şampanya yalnızca özel parçalar.

## Tipografi

| Rol | Aile | Sınıf |
| --- | --- | --- |
| Başlık, mektup gövdesi | Cormorant Garamond Variable | `font-display` |
| Arayüz, gövde | DM Sans Variable | `font-sans` |
| El yazısı (mektup, kenar notu, imza) | Caveat Variable | `font-hand` |

Ölçek: `text-display-sm` · `text-display` · `text-display-lg` (akışkan `clamp`). Küçük İngilizce etiket:
`eyebrow` (11px, 0.32em aralık, büyük harf). Fontlar `@fontsource-variable/*` ile kendi sunucumuzdan.

## Yüzey ve düzen yardımcıları

`shell` (76rem, akışkan kenar boşluğu) · `shell-narrow` (44rem) · `paper` (inci zemin + ince çizgi + gölge) ·
`paper-grain` (mektup dokusu) · `dusk` (alacakaranlık bloğu; içindeki başlık/etiket renkleri otomatik) ·
`hairline` · `prose-letter` (satır sonlarını koruyan metin) · `safe-bottom` · `no-scrollbar`.
Gölgeler: `shadow-paper`, `shadow-lift`, `shadow-glow`. Köşe: kâğıt 6px, kart 1.25–2rem, düğme tam yuvarlak.

## Bileşenler (`src/components/ui`)

`Button` (primary, accent, soft, outline, ghost, link, danger, light, ghost-light · sm/md/lg/icon) ·
`Field` + `Input` / `Textarea` / `Select` + `describedBy()` · `Dialog` · `Confirm` · `Switch` · `Badge`
(neutral, blush, gold, draft, live, sealed) · `Spinner` · `EmptyState` · `toast()` / `Toaster`.

Medya: `SmartImage` (bulanık önizleme → keskin varyant), `PhotoUploader`, `PhotoPicker`.
Zaman: `LiveClock`, `Countdown` (hydration-güvenli). Düzen: `PageHeader`, `OwnerHint`, `StudioPage`, `StudioCard`.

## Dekor (`src/components/decor`) — hepsi özgün SVG

`Bow` · `Sparkle` · `Heart` · `Kitten` (bu dünyanın kendi kedisi) · `WaxSeal` (heart/bow/star/cat/moon) ·
`Moon` (gerçek evre) · `IstanbulSkyline` · `BakuSkyline` · `Flourish`. Tek çizgi kalınlığı, yumuşak dolgu.
Lisanslı karakter çizimi yoktur ve taklit edilmez.

## Hareket (`src/components/motion`)

| Yardımcı | Ne için |
| --- | --- |
| `Reveal`, `Stagger`/`StaggerItem` | Görünüme girerken bir kez belirme |
| `WordReveal` | Kelime kelime açılan birkaç özel cümle |
| `Parallax` | Fotoğrafta küçük derinlik (yalnızca ≥768px + fare) |
| `StarField` | Sessiz yıldız alanı (`dusk` / `day`) |
| `LightThread` | İki şehir arasındaki ışık ipi |

Eğriler: `ease-soft` `(.22,1,.36,1)`, `ease-silk` `(.65,0,.35,1)`. Giriş 0.8–1.4 sn, dokunuş 0.15–0.3 sn.
Kurallar: yalnızca `transform`/`opacity`; ekranda aynı anda tek kahraman; `prefers-reduced-motion` → yalnızca opaklık.

## Erişilebilirlik

Odak halkası her yerde görünür (`:focus-visible`, accent). Metin kontrastı en az AA. Tıklanabilir alan ≥ 40px.
Her form alanı etiketli; hata `role="alert"` + `aria-describedby`. Dekor `aria-hidden`. "İçeriğe geç" bağlantısı var.
