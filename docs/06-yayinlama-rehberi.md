# 06 · Yayınlama Rehberi: Lokum Blast’ı App Store ve Google Play’e çıkarmak

Bu rehber sıfırdan yayına kadar her adımı sırasıyla anlatıyor. Kod tarafı hazır. Senin yapacağın işler **hesap açmak, kimlikleri yapıştırmak ve derlemek**.

## 0. Gerekenler

| Gereken | Not |
|---|---|
| **Mac + Xcode 26** (veya güncel sürüm) | iOS derlemesi yalnızca macOS’ta yapılır. Mac yoksa bulut Mac (MacinCloud vb.) ya da Codemagic/Bitrise gibi CI servisleri kullanılabilir. |
| **Android Studio** | Windows, Mac veya Linux’ta çalışır |
| **Node.js 22+** | `node -v` ile kontrol et |
| **Apple Developer Program** | Yıllık **99 $**. Şirket hesabı için **D-U-N-S numarası** gerekir (ücretsiz, 1–2 hafta sürer). |
| **Google Play Console** | Tek seferlik **25 $**. Yeni kişisel hesaplarda yayından önce **12 test kullanıcısıyla 14 günlük kapalı test** zorunlu. Kurumsal hesapta bu şart yok. |
| **AdMob** hesabı | admob.google.com, ücretsiz |
| **RevenueCat** hesabı | app.revenuecat.com. Belli bir aylık gelir eşiğine kadar ücretsiz (güncel fiyatı sitede kontrol et). |

## 1. Projeyi çalıştır

```bash
cd games/lokum-blast
npm install
npm run dev          # tarayıcıda http://localhost:5173 (reklam ve satın almalar demo modunda)
npm test             # birim testleri
npm run build        # üretim derlemesi (dist/)
```

## 2. Kimlik ve kimlikleri yerleştir

### 2.1 AdMob
1. AdMob’da **iki uygulama** oluştur: “Lokum Blast (iOS)” ve “Lokum Blast (Android)”.
2. Her biri için iki reklam birimi aç: **Ödüllü** (Rewarded) ve **Geçiş** (Interstitial).
3. Kimlikleri şu dosyalara yapıştır:
   - `src/config.ts` → `admob.ios.*`, `admob.android.*`, yayın için `admob.testing: false`
   - `ios/App/App/Info.plist` → `GADApplicationIdentifier` (iOS **App ID**, `~` içeren)
   - `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`
4. AdMob → *Gizlilik ve mesajlaşma*: **GDPR onay mesajı** ve **IDFA açıklama mesajı** oluştur. Oyundaki UMP akışı bunları otomatik gösterir.
5. Sitende `app-ads.txt` yayınla (`https://tekirstudios.com/app-ads.txt`). AdMob dosya içeriğini veriyor. Bu dosya olmadan reklam doluluğu düşer.
6. **Mediation (önerilir):** AdMob → Mediation’a AppLovin, Unity Ads, Meta ve Mintegral ağlarını ekle. Bunun için Capacitor tarafında ek adaptör paketleri kurmak gerekir. Her ağın dokümanını izle.

> ⚠️ Test ederken **asla kendi reklamlarına tıklama**. Kod varsayılan olarak Google’ın resmi test kimliklerini kullanıyor.

### 2.2 Uygulama içi ürünler: App Store Connect
1. **Uygulamalar → +** ile uygulamayı oluştur. Bundle ID: `com.tekirstudios.lokumblast`, SKU: `lokumblast-ios`.
2. **Uygulama İçi Satın Alımlar** bölümüne `docs/04-ekonomi-ve-fiyatlandirma.md` tablosundaki ürünleri **aynı ID’lerle** ekle:
   - Tüketilir: `coins_600`, `coins_1500`, `coins_4500`, `coins_10000`, `coins_22000`, `coins_60000`, `starter_pack`, `bundle_usta`, `bundle_sultan`, `pass_premium` (oyun, sezon başına bir kez satın alınmasına izin veriyor)
   - Tüketilmez: `no_ads`, `theme_saray`
3. **Abonelikler:** Bir abonelik grubu oluştur (“Tekir Kulübü”), içine `vip_monthly` (1 ay) ve `vip_yearly` (1 yıl) ekle. Aylık için **tanıtım teklifi** tanımla: “Ödedikçe öde”, 1 ay, ₺49,99.
4. **Fiyatlandırma:**
   - Her üründe *Fiyat Planı → Taban ülke: ABD* seç ve tablodaki USD fiyatını gir.
   - *Fiyatları ülkeye göre düzenle → Türkiye* bölümünden tablodaki **TL fiyatına en yakın fiyat noktasını** elle seç. Böylece otomatik kur güncellemesinden etkilenmez.
   - Brezilya, Hindistan ve Endonezya için de aynısını yap (oranlar §3’te).
5. Her ürüne Türkçe ve İngilizce ad ve açıklama gir, inceleme için bir ekran görüntüsü yükle (mağaza ekranının görüntüsü yeterli).

### 2.3 Uygulama içi ürünler: Google Play Console
1. Uygulamayı oluştur. Paket adı: `com.tekirstudios.lokumblast`.
2. **Para kazanma → Ürünler → Uygulama içi ürünler:** aynı ID’leri ekle.
3. **Abonelikler:** `vip_monthly` ve `vip_yearly`. Her birine bir *temel plan* ekle, aylık plana tanıtım teklifi tanımla.
4. **Fiyat:** Varsayılan fiyatı USD olarak gir. “Fiyatları ülkeye göre ayarla → Türkiye” bölümünden TL fiyatını elle yaz (Google, fiyat noktasıyla sınırlamaz).

### 2.4 RevenueCat
1. Projeyi oluştur ve iOS uygulamasını (App Store Connect **In-App Purchase Key** ile) ve Android uygulamasını (Google Play **servis hesabı JSON** ile) bağla.
2. **Ürünler:** Mağazadaki tüm ID’leri içe aktar.
3. **Entitlements (yetkiler):**
   - `no_ads` ← `no_ads`, `vip_monthly`, `vip_yearly`
   - `vip` ← `vip_monthly`, `vip_yearly`
4. Public SDK anahtarlarını `src/config.ts → revenuecat.ios / android` alanlarına yapıştır. Anahtarlar yerleşince oyun **demo modundan gerçek satın almaya** otomatik geçer.

## 3. Derle ve cihazda dene

```bash
npm run build && npx cap sync
npx cap open ios        # Xcode açılır
npx cap open android    # Android Studio açılır
```

**Xcode’da:**
1. *Signing & Capabilities* → takımını seç. **In-App Purchase** ve **Push Notifications** yeteneklerini ekle (yerel bildirim için push şart değil, ama ileride gerekebilir).
2. *General* → Version `1.0.0`, Build `1`. iPhone ve iPad dikey ekran ayarı hazır.
3. Gerçek bir cihazda çalıştır, ardından **Product → Archive → Distribute → App Store Connect** ile yükle.

**Android Studio’da:**
1. *Build → Generate Signed App Bundle* → yeni bir **upload key** oluştur ve **güvenli bir yere yedekle** (kaybedilirse güncelleme yapılamaz).
2. Oluşan `.aab` dosyasını Play Console’a yükle. Play App Signing’i etkinleştir.

### İkon ve splash’i yeniden üretmek
```bash
node --experimental-strip-types store/icons.mjs     # kaynak görseller
cp store/output/icon/app-icon-1024.png assets/icon-only.png   # (diğerleri assets/ içinde)
npx @capacitor/assets generate --iconBackgroundColor '#1a1238' --splashBackgroundColor '#1a1238'
```

`npx cap add ios` ile iOS projesi yeniden oluşturulursa şunu çalıştır: `node scripts/ios-localize.cjs` (izin metninin 6 dilini Xcode’a kaydeder). Info.plist ve AndroidManifest ayarlarını da bu rehberdeki gibi tekrar yap.

## 4. Test aşamaları

| Aşama | Platform | Süre | Amaç |
|---|---|---|---|
| **TestFlight internal** | iOS | 1 gün | Ekip içi duman testi, sandbox satın alma |
| **Play internal testing** | Android | 1 gün | Aynı |
| **Kapalı test (12+ kişi, 14 gün)** | Android (kişisel hesapta zorunlu) | 2 hafta | Google şartı ve gerçek geri bildirim |
| **Soft launch** | TR + 2–3 ülke (ör. Filipinler, Kanada, Polonya) | 2–4 hafta | D1/D7, ARPDAU ölçümü, ekonomi ayarı |
| **Global lansman** | Tümü | — | Pazarlama başlar |

### Sandbox kontrol listesi
- [ ] Her ürün satın alınabiliyor, altın ve güçlendiriciler doğru geliyor
- [ ] `no_ads` alındıktan sonra geçiş reklamı çıkmıyor, ödüllü reklam hâlâ çalışıyor
- [ ] Abonelik başlıyor, VIP rozeti ve günlük hediye çalışıyor. Sandbox’ta yenileme birkaç dakikada bir olur.
- [ ] **Satın alımları geri yükle** yeniden kurulumdan sonra `no_ads` ve `theme_saray`’ı geri getiriyor
- [ ] ATT izni ve (VPN ile AB’den) GDPR formu görünüyor
- [ ] Bildirim izni ilk seviye kazanılınca isteniyor, bildirimler doğru saatte geliyor
- [ ] Uygulama arka plana alınıp geri gelince müzik ve oyun düzgün devam ediyor

## 5. Mağaza sayfası

Bütün metinler, anahtar kelimeler, gizlilik etiketleri ve inceleme notları: **[05-magaza-metinleri.md](05-magaza-metinleri.md)**.
Gizlilik politikası ve koşullar: `games/lokum-blast/legal/`. Bunları sitende yayınla ve URL’leri `src/config.ts` dosyasına yaz.

## 6. Sık karşılaşılan red sebepleri ve önlemleri

| Sebep | Bu projede durum |
|---|---|
| 4.2 “Minimum işlevsellik / web sarmalayıcı” | Native haptik, bildirim, IAP, çevrimdışı oyun ve 300+ seviye var. Risk düşük. |
| 3.1.1 Rastgele ödül şeffaflığı | Çark olasılıkları oyunda gösteriliyor ✅ |
| 3.1.2 Abonelik bilgileri eksik | Fiyat, dönem ve iptal metni VIP kartında var ✅ |
| 5.1.1 Gizlilik politikası URL’si çalışmıyor | Yayından önce siteye koy ⚠️ |
| 5.1.2 ATT’den önce izleme | AdMob, ATT ve onay formundan **sonra** başlatılıyor ✅ |
| Geri yükleme butonu yok | Mağaza ve Ayarlar’da var ✅ |
