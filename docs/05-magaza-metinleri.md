# 05 · Mağaza Metinleri ve Görseller (App Store + Google Play)

Bütün karakter limitleri kontrol edildi. Görseller `games/lokum-blast/store/output/` klasöründe.

## Görsel envanteri

| Dosya | Boyut | Nerede kullanılır |
|---|---|---|
| `icon/app-icon-1024.png` | 1024×1024 | App Store ikonu (Xcode’a `@capacitor/assets` ile otomatik) |
| `icon/icon-foreground.png` + `icon-background.png` | 1024×1024 | Android adaptive icon katmanları |
| `icon/splash-2732.png` | 2732×2732 | Açılış ekranı |
| `play/play-icon-512.png` | 512×512 | Google Play “Uygulama simgesi” |
| `play/feature-graphic-1024x500.png` | 1024×500 | Google Play “Öne çıkan grafik” |
| `appstore-iphone-6.9/{tr,en}/01…07.jpg` | 1290×2796 | App Store iPhone 6.9″ (zorunlu boyut, küçük iPhone’lara otomatik ölçeklenir) |
| `appstore-ipad-13/{tr,en}/01…07.jpg` | 2064×2752 | App Store iPad 13″ |
| `googleplay-phone/{tr,en}/01…07.jpg` | 1080×2160 | Google Play telefon ekran görüntüleri |

**Sıralama mantığı:** İlk üç görsel (kombo patlaması, seviye hedefleri, çarşı) mağazada aramada görünenler. Bu yüzden en güçlü üç kanca öne konuldu.

Yeniden üretmek için:

```bash
cd games/lokum-blast
npm run build && npx vite preview --port 4173 &
node store/capture.mjs                              # ham oyun ekranları
node --experimental-strip-types store/frames.mjs    # pazarlama çerçeveleri
node --experimental-strip-types store/icons.mjs     # ikon, splash, feature graphic
```

---

## 🇹🇷 Türkçe: App Store

**Ad (30):** `Lokum Blast: Blok Bulmaca`
**Alt başlık (30):** `Tatlı İstanbul Zekâ Oyunu`
**Anahtar kelimeler (100):**
```
blok,bulmaca,puzzle,zeka,küp,lokum,sudoku,kombo,çarşı,kedi,istanbul,beyin,klasik,internetsiz,taş
```
**Tanıtım metni (170):**
> Yeni: Kapalıçarşı’nın 12 dükkânını canlandır! Günlük hediyeler, Çarkıfelek ve 300+ seviye seni bekliyor. Fesli Tekir’le tatlı bir mola ver 🍬

**Açıklama:**

> İstanbul’un en tatlı bulmacasına hoş geldin! 🍬
>
> Pudra şekerli lokumları 8×8 tahtaya yerleştir, satırları ve sütunları doldur, patlat! Kombo üstüne kombo yap, rekorunu kır. Fesli tekir kedimiz Tekir’le birlikte Kapalıçarşı’yı yeniden canlandır.
>
> **NEDEN LOKUM BLAST?**
> 🧩 **Öğrenmesi 5 saniye, ustalaşması bir ömür.** Sürükle, bırak, patlat. Basit ama derin bir zekâ oyunu.
> 💥 **Dev kombolar:** Aynı anda birden fazla sırayı temizle, “Tatlı!”, “Şahane!”, “Maşallah!” diye coştur.
> 🗺️ **300+ seviyelik Yolculuk:** Zümrütleri topla, kasaları kır, hedefleri hamleler bitmeden tamamla.
> 🏪 **Kapalıçarşı’yı canlandır:** Yıldızlarınla lokumcu, çay ocağı, baharatçı, halıcı gibi 12 dükkânı yenile.
> ♾️ **Klasik mod:** Süre yok, baskı yok. Rahatla ve rekorunu kovala.
> 📅 **Her gün yeni:** Günün Bulmacası, günlük hediyeler, Çarkıfelek ve görevler.
> 🎨 **Göz alıcı temalar:** Klasik Lokum, Kedi Patisi, İznik Çinisi, Gece Çarşısı, Mozaik Fener, Altın Saray.
> 🎵 **Hicaz makamında sesler:** Her kombo İstanbul’un ritmiyle çalar.
> ✈️ **İnternetsiz oyna:** Metroda, uçakta, her yerde.
> 🐾 **Güçlendiriciler:** Geri Al, Çekiç, Yenile ve Nar Bombası ile zor anları atlat.
>
> Ücretsiz oynanır. İsteğe bağlı uygulama içi satın alımlar ve reklamlar içerir. **Tekir Kulübü** üyeliği otomatik yenilenir; yenilemeden en az 24 saat önce Ayarlar > Apple Kimliği > Abonelikler’den iptal edebilirsin.
>
> Gizlilik Politikası: https://tekirstudios.com/lokum-blast/gizlilik
> Kullanım Koşulları: https://tekirstudios.com/lokum-blast/kosullar

**Bu sürümdeki yenilikler:**
> Lokum Blast yayında! 🎉 Tatlı bloklar, dev kombolar ve Tekir’in Kapalıçarşı macerası seni bekliyor.

## 🇹🇷 Türkçe: Google Play

**Başlık (30):** `Lokum Blast: Blok Bulmaca`
**Kısa açıklama (80):** `Lokumları diz, satırları patlat! Tatlı İstanbul blok bulmacası, 300+ seviye.`
**Tam açıklama:** App Store açıklamasının aynısı. Son paragraftaki abonelik iptal yolunu “Google Play Store > Profil > Ödemeler ve abonelikler” olarak değiştir.

---

## 🇬🇧 English: App Store

**Name (30):** `Lokum Blast: Block Puzzle`
**Subtitle (30):** `Sweet Istanbul Brain Game`
**Keywords (100):**
```
block,puzzle,brain,cube,sudoku,blast,classic,offline,logic,combo,bazaar,cat,relaxing,jewel,wood
```
**Promotional text (170):**
> New: restore 12 shops of the Grand Bazaar! Daily gifts, a lucky wheel and 300+ levels are waiting. Take a sweet break with Tekir, the fez-wearing cat 🍬

**Description:**

> Welcome to the sweetest puzzle in Istanbul! 🍬
>
> Place sugar-dusted Turkish delight blocks on the 8×8 board, fill rows and columns and watch them pop! Chain combo after combo, beat your best score, and help Tekir — our fez-wearing tabby cat — bring the Grand Bazaar back to life.
>
> **WHY YOU’LL LOVE LOKUM BLAST**
> 🧩 **Learn in 5 seconds, master for a lifetime.** Drag, drop, blast — a simple yet deep brain game.
> 💥 **Huge combos:** clear several lines at once for “Sweet!”, “Delicious!” and “Sugar Rush!” moments.
> 🗺️ **300+ level Journey:** collect emeralds, smash crates and finish your goals before you run out of moves.
> 🏪 **Restore the Grand Bazaar:** spend stars to rebuild 12 shops — the lokum shop, tea house, spice stall, carpet shop and more.
> ♾️ **Classic mode:** no timers, no pressure. Relax and chase your high score.
> 📅 **Something new every day:** Daily Puzzle, daily gifts, a lucky wheel and quests.
> 🎨 **Stunning themes:** Classic Lokum, Cat Paw, İznik Tiles, Night Bazaar, Mosaic Lantern, Golden Palace.
> 🎵 **Music of the bazaar:** every combo rings out in the Hicaz scale.
> ✈️ **Play offline:** on the subway, on a plane, anywhere.
> 🐾 **Boosters:** Undo, Hammer, Refresh and the Pomegranate Bomb for tricky moments.
>
> Free to play. Contains optional in-app purchases and ads. **Tekir Club** membership renews automatically; cancel any time in Settings > Apple ID > Subscriptions at least 24 hours before renewal.
>
> Privacy Policy: https://tekirstudios.com/lokum-blast/privacy
> Terms of Use: https://tekirstudios.com/lokum-blast/terms

**What’s New:**
> Lokum Blast is here! 🎉 Sweet blocks, huge combos and Tekir’s Grand Bazaar adventure await.

## 🇬🇧 English: Google Play

**Title (30):** `Lokum Blast: Block Puzzle`
**Short description (80):** `Place sweet lokum blocks, blast lines, restore the Grand Bazaar. 300+ levels!`
**Full description:** Same as the App Store text, with the cancellation path changed to “Google Play Store > Profile > Payments & subscriptions”.

> DE / ES / FR / PT: oyun içi metinler zaten 6 dilde hazır. Mağaza metinleri için İngilizce metni temel al. Gerekirse bana söyle, bu dillerde de yazayım.

---

## Mağaza formları: önerilen cevaplar

### Kategori ve yaş
- **App Store:** Birincil kategori *Games › Puzzle*, ikincil *Games › Casual*. Yaş derecelendirmesi anketinde şiddet, kumar ve korku için **“Yok”** işaretle. Sonuç **4+** olur. “Reklam içerir” ve “Uygulama içi satın alma” işaretlenmeli.
- **Google Play:** Kategori *Oyun › Bulmaca*. IARC anketi sonucu “Herkes / PEGI 3” olur. **Hedef kitle: 13+** öner. Çocuklar (13 yaş altı) hedef kitleye eklenirse Google’ın *Families* politikası devreye girer (sadece sertifikalı reklam ağları, ek kısıtlar).
- **Simüle kumar yok:** Çarkıfelek ücretsizdir, gerçek parayla çevrilmez. Ödülleri nakde dönüşmez ve olasılıklar oyun içinde yayınlanır.

### Apple “App Privacy” (gizlilik etiketleri)
| Veri | Toplanıyor mu? | Kullanıcıya bağlı mı? | Takip için mi? | Amaç |
|---|---|---|---|---|
| Cihaz kimliği (IDFA) | Evet (ATT izni verilirse) | Hayır | **Evet** | Üçüncü taraf reklam |
| Kaba konum (IP’den) | Evet (AdMob) | Hayır | Evet | Reklam |
| Ürün etkileşimi | Evet (analitik eklenirse) | Hayır | Hayır | Analitik, uygulama işlevselliği |
| Satın alma geçmişi | Evet (RevenueCat) | Anonim kullanıcı kimliğine bağlı | Hayır | Uygulama işlevselliği |
| Çökme verileri | Evet (eklenirse) | Hayır | Hayır | Uygulama işlevselliği |

### Google “Veri güvenliği” formu
- **Toplanan veriler:** Cihaz veya diğer kimlikler (reklam), uygulama etkileşimleri (analitik), çökme günlükleri, satın alma geçmişi.
- **Paylaşım:** Reklam kimliği Google AdMob ve mediation ağlarıyla reklam amacıyla paylaşılır.
- **Aktarım sırasında şifreleme:** Evet. **Silme talebi:** Evet (destek e-postası ve oyun içi “İlerlemeyi sıfırla”).
- Uygulama hesap oluşturmayı gerektirmez. Oyun ilerlemesi cihazda saklanır.

### İnceleme notu (App Review Notes)
> Lokum Blast is a single-player block puzzle. No login is required. Ads are shown via Google AdMob after the ATT prompt; rewarded videos are optional. In-app purchases are handled by StoreKit via RevenueCat. To test the Tekir Club subscription, use the sandbox account provided. The daily wheel is free (one free spin per day, optional extra spins via rewarded video); it cannot be purchased with real money and its odds are displayed in-app.
