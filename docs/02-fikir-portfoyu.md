# 02 · Fikir Portföyü: Tekir Studios’un ilk 12 ürünü

Mobil pazarda tek bir hit’e bel bağlamak yerine **portföy stratejisi** öneriyorum: hızlı prototiple, ucuz test et, tutmayanı erken bırak, tutanı büyüt. Aşağıdaki fikirleri üç kritere göre puanladım: **gelir potansiyeli**, **üretim kolaylığı** ve **organik büyüme** (TikTok/viral). Her biri 1 ile 5 arası.

> Gelir rakamları **tahmindir, garanti değildir**. Sonucu en çok belirleyen şeyler oyuncunun kalma oranı (retention), reklam yerleşimi ve pazarlama bütçesidir.

## Özet tablo

| # | Ürün | Etiket | Tür | Para kazanma | Gelir | Kolaylık | Viral | Süre* |
|---|---|---|---|---|---|---|---|---|
| 1 | **Lokum Blast** ✅ | Games | Blok bulmaca + çarşı metası | Reklam + IAP + VIP | ★★★★★ | ✅ hazır | ★★★★ | **bitti** |
| 2 | **Lokma: AI Kalori** | Labs | Fotoğraftan kalori sayacı | Abonelik | ★★★★★ | ★★★ | ★★★★★ | 5–6 hf |
| 3 | **Orbita: Planet Merge** | Games | Dairesel yerçekimli birleştirme | Reklam + IAP | ★★★★ | ★★★★ | ★★★★★ | 3–4 hf |
| 4 | **Telve: AI Kahve Falı** | Labs | Eğlence / fal | Abonelik + kredi | ★★★★ | ★★★★ | ★★★★ | 3–4 hf |
| 5 | **Simit Tycoon** | Games | Idle tycoon | Ödüllü reklam + IAP | ★★★★ | ★★★ | ★★★ | 5–6 hf |
| 6 | **Kelime Çarşısı** | Games | Kaydırmalı kelime oyunu | Reklam + IAP | ★★★★ | ★★★ | ★★★ | 4–5 hf |
| 7 | **Pati Kafe** | Games | Merge-2 + dekorasyon | IAP ağırlıklı | ★★★★★ | ★★ | ★★★★ | 3–4 ay |
| 8 | **Nefes** | Labs | Sigara/vape bırakma koçu | Abonelik | ★★★★ | ★★★★ | ★★★★ | 3–4 hf |
| 9 | **Masal AI** | Labs | Kişiye özel uyku masalı | Abonelik | ★★★★ | ★★★ | ★★★ | 4–6 hf |
| 10 | **Düğüm** | Games | İp çözme bulmacası | Reklam + IAP | ★★★ | ★★★★ | ★★★★ | 3 hf |
| 11 | **Tavla & Okey Kulübü** | Games | Çok oyunculu masa oyunları | IAP (çip) + reklam | ★★★★★ | ★ | ★★★ | 4–6 ay |
| 12 | **Lale: Odak Bahçesi** | Labs | Odaklanma zamanlayıcısı | Tek seferlik + abonelik | ★★★ | ★★★★★ | ★★★ | 2–3 hf |

\*Tek geliştirici + Claude ile tahmini süre.

---

## 1. Lokum Blast: Block Puzzle ✅ *(bu repoda, yayına hazır)*

- **Kanca:** Dünyanın en çok indirilen oyun türü olan blok bulmacaya **İstanbul ruhu** katıldı: lokum kareler, Hicaz makamında sesler, Tekir’in lokumcusu. Üstüne Royal Match tarzı bir **“Kapalıçarşı’yı canlandır”** meta katmanı eklendi.
- **Neden kazandırır:** Block Blast! 2026’da her iki mağazada da indirme listesinin 1. sırasında. Android reklam geliri tahminen **günde ~584 bin $** ([FoxData, Ağustos 2026](https://foxdata.com/en/blogs/global-mobile-game-rankings-august-2026-top-15-downloads-revenue/), [Udonis](https://www.blog.udonis.co/statistics/block-blast)). Biz bu kanıtlanmış çekirdeğe ek olarak IAP, VIP ve meta ilerleme koyduk. Böylece reklama ek ikinci bir gelir motoru oluşuyor.
- Ayrıntılar: [03-lokum-blast-oyun-tasarimi.md](03-lokum-blast-oyun-tasarimi.md), [04-ekonomi-ve-fiyatlandirma.md](04-ekonomi-ve-fiyatlandirma.md).

## 2. Lokma: AI Kalori *(Tekir Labs’in amiral gemisi)*

- **Kanca:** Yemeğin fotoğrafını çekiyorsun, yapay zekâ (Claude vision) kaloriyi ve makroları anında çıkarıyor. Türk mutfağını gerçekten tanıyor (mercimek çorbası, lahmacun, mantı, baklava). Tekir porsiyon tahmini yapıyor, haftalık rapor veriyor.
- **Para:** Haftalık ve yıllık abonelik, 3 günlük deneme. Satış ekranı onboarding’in sonunda (hedef, kilo, aktivite soruları → kişisel plan → satış ekranı).
- **Neden:** Fotoğraflı kalori uygulamaları son iki yılda abonelik gelirinde en hızlı büyüyen kategorilerden biri. Türkçe ve yerel mutfak boşluğu ise hâlâ açık.
- **Teknik:** Capacitor kamera, küçük bir backend (Supabase/Firebase + Claude API), RevenueCat. Görüntü başına API maliyeti abonelik fiyatının çok altında.

## 3. Orbita: Planet Merge

- **Kanca:** “Suika (karpuz) oyunu” uzayda ve **dairesel yerçekimiyle** oynanıyor. Gezegenleri merkezdeki yıldıza doğru fırlatıyorsun, aynılar birleşip büyüyor, dış halkayı geçen kaybediyor. Fırlatma noktası çemberin etrafında döner.
- **Neden:** Birleştirme (merge) videoları TikTok’ta doğal olarak viral oluyor ve dairesel mekanik yeni. Sadece daire fiziği gerektirdiği için motoru küçük.
- **Para:** Devam etme (revive) ve ödüllü reklam, gezegen ve galaksi skinleri, reklamsız paket.

## 4. Telve: AI Kahve Falı

- **Kanca:** Fincanın fotoğrafını çekiyorsun, Tekir “falcı kedi” olarak telvedeki şekilleri yorumluyor. Aşk, kariyer ve kısmet kartları; günlük burç ve fal bildirimleri.
- **Para:** Abonelik veya tekil fal kredisi. Türkiye, Orta Doğu ve Balkanlar’da kanıtlanmış bir kategori.
- **Not:** Uygulamada “eğlence amaçlıdır” uyarısı zorunlu. Apple bu tür içeriği eğlence kategorisinde kabul ediyor.

## 5. Simit Tycoon

- **Kanca:** Tek bir simit tezgâhıyla başlıyorsun. Çay ocağı, vapur büfesi, Galata kulesi kafesi açarak bir İstanbul imparatorluğu kuruyorsun. Idle (otomatik gelir) ve yönetici sistemi var.
- **Para:** Idle türü ödüllü reklamın şampiyonudur (2 kat gelir, hızlandırma, çevrimdışı kazanç). Üstüne yönetici ve süs IAP’leri.

## 6. Kelime Çarşısı

- **Kanca:** Harfleri kaydırıp kelime oluşturuyorsun ve bulmaca İstanbul’un semtlerinde ilerliyor. **Türkçe, İngilizce, Almanca ve İspanyolca** sözlükleri var.
- **Neden:** Türkiye’de kelime oyunları çok güçlü ve yerli kaliteli rakip az. Kelime oyunu oynayan kitle daha yaşlı ve daha çok ödeme yapan bir kitle.

## 7. Pati Kafe

- **Kanca:** Kedi kafesi teması üzerine kurulu bir merge-2 oyunu: eşyaları birleştirip kafeyi dekore ediyorsun ve sahipsiz kedileri sahiplendiriyorsun. Gerçek bir hayvan barınağına bağış kampanyasıyla güçlü bir PR hikâyesi çıkar.
- **Neden:** Merge ve dekorasyon türleri en yüksek IAP gelirine sahip türler arasında. Üretimi ise ağır, çünkü çok sanat ve içerik gerekiyor. Bu yüzden 2. yıl projesi.

## 8. Nefes: Bırakma Koçu

- **Kanca:** Sigara ya da vape bırakma sayacı tutuyor: kazanılan para, sağlık zaman çizelgesi, kriz anı için nefes egzersizleri ve yapay zekâ koçu Tekir. Rozetler ve seri sistemi var.
- **Para:** Yıllık abonelik. Bu kategoride “bırakma” uygulamaları yüksek ödeme isteği taşıyor.

## 9. Masal AI

- **Kanca:** Ebeveyn çocuğun adını, sevdiği hayvanı ve günün dersini seçiyor. Kişiye özel, resimli ve seslendirilmiş bir uyku masalı üretiliyor.
- **Not:** Uygulama ebeveyne yönelik tasarlanmalı. Çocuk kategorisi kuralları (Apple Kids, COPPA) gereği çocuk ekranında reklam ve izleme olmamalı.

## 10. Düğüm

- **Kanca:** Renkli ipleri çözme ve iplik sıralama bulmacası. 2025–26’nın yükselen hybrid-casual trendi. Kısa seviyeler ve tatmin edici “çözülme” animasyonları var.

## 11. Tavla & Okey Kulübü

- **Kanca:** Arkadaşlarınla ya da dünyayla tavla, okey, 101 ve batak. Kahvehane estetiği var, Tekir krupiye.
- **Neden:** Türkiye’nin en çok gelir getiren yerli oyun türlerinden biri. Ancak gerçek zamanlı sunucu, hile önleme ve moderasyon gerektiriyor. Bu yüzden en son, stüdyo büyüyünce yapılacak.

## 12. Lale: Odak Bahçesi

- **Kanca:** Odaklandıkça lale bahçen büyüyor, telefonu açarsan lale soluyor. Arkadaşlarla ortak bahçe kurulabiliyor.
- **Para:** Tek seferlik satın alma veya premium abonelik. En hızlı üretilecek ürün. İyi bir “ikinci ürün” denemesi olur.

---

## Önerilen yol haritası

| Dönem | İş |
|---|---|
| **Ay 0–1** | Lokum Blast: hesaplar, AdMob/RevenueCat bağlantısı, TestFlight, soft launch (TR + 2–3 test ülkesi) |
| **Ay 1–2** | Lokum Blast: metrikleri ölç (D1/D7, ARPDAU), seviye ve ekonomi ince ayarı, global lansman |
| **Ay 2–3** | **Lokma: AI Kalori** (ilk abonelik geliri) + **Orbita** prototipi |
| **Ay 3–5** | Orbita yayını, Telve, Lokum Blast’ın ilk büyük güncellemesi (yeni çarşı bölgeleri, etkinlikler) |
| **Ay 5–8** | Simit Tycoon, Kelime Çarşısı, Nefes |
| **Yıl 2** | Pati Kafe ve Tavla & Okey (ekip büyüdükten sonra) |

### Ortak teknoloji ve verimlilik

- Bütün oyunlar aynı yığını paylaşıyor: **Vite + TypeScript + Capacitor**. Lokum Blast’taki reklam, satın alma, bildirim, kayıt, ses, çoklu dil ve mağaza modülleri yeni ürünlere **kopyala-yapıştır** taşınabilir.
- Uygulamalar (Tekir Labs) için tek bir ortak backend kullanılır (auth + Claude API proxy + kullanım limitleri).
- **Çapraz tanıtım:** Her ürünün ayarlar ekranında ve ödül anlarında “Tekir’in diğer oyunları” bölümü olur. İkinci ürünün ilk kullanıcıları bedavaya gelir.
