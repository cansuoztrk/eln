# 02 · Fikir Portföyü: Tekir Studios’un ilk 13 ürünü

Mobil pazarda tek bir hit’e bel bağlamak yerine **portföy stratejisi** öneriyorum: hızlı prototiple, ucuz test et, tutmayanı erken bırak, tutanı büyüt. Aşağıdaki fikirleri üç kritere göre puanladım: **gelir potansiyeli**, **üretim kolaylığı** ve **organik büyüme** (TikTok/viral). Her biri 1 ile 5 arası.

> Gelir rakamları **tahmindir, garanti değildir**. Sonucu en çok belirleyen şeyler oyuncunun kalma oranı (retention), reklam yerleşimi ve pazarlama bütçesidir.

## Özet tablo

| # | Ürün | Etiket | Tür | Para kazanma | Gelir | Kolaylık | Viral | Süre* |
|---|---|---|---|---|---|---|---|---|
| 1 | **Lokum Blast** ✅ | Games | Blok bulmaca + çarşı metası | Reklam + IAP + VIP | ★★★★★ | ✅ hazır | ★★★★ | **bitti** |
| 2 | **Lokma: AI Kalori** *(ertelendi)* | Labs | Fotoğraftan kalori sayacı | Abonelik | ★★★★★ | ★★★ | ★★★★★ | 5–6 hf |
| 3 | **Orbita: Planet Merge** *(ertelendi)* | Games | Dairesel yerçekimli birleştirme | Reklam + IAP | ★★★★ | ★★★★ | ★★★★★ | 3–4 hf |
| 4 | **Telve: AI Kahve Falı** *(veto)* | Labs | Eğlence / fal | Abonelik + kredi | ★★★★ | ★★★★ | ★★★★ | 3–4 hf |
| 5 | **Simit Tycoon** ✅ *(2. ürün)* | Games | Idle tycoon | Ödüllü reklam + IAP | ★★★★ | ★★★ | ★★★ | 5–6 hf |
| 6 | **Kelime Çarşısı** | Games | Kaydırmalı kelime oyunu | Reklam + IAP | ★★★★ | ★★★ | ★★★ | 4–5 hf |
| 13 | **Kitap Kedisi** ✅ *(3. ürün)* | Games | Kelime çağrışımlı solitaire | Reklam + IAP | ★★★★★ | ✅ hazır | ★★★★ | **bitti** |
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

## 3. Orbita: Planet Merge *(ertelendi: bkz. Simit Tycoon)*

> **Ekim 2026 notu:** Pazar araştırması, dairesel yerçekimli gezegen birleştirme oyunlarının mağazalarda zaten bulunduğunu ve büyük bir çıkış yapamadığını gösterdi (Godspear’ın *Planet Merge – Space Puzzle* oyunu ve *Sputnika*). Bu yüzden 2. ürün olarak Simit Tycoon öne alındı. Orbita, farklılaştıracak bir kanca (ör. çok oyunculu düello) bulunursa yeniden değerlendirilecek.

- **Kanca:** “Suika (karpuz) oyunu” uzayda ve **dairesel yerçekimiyle** oynanıyor. Gezegenleri merkezdeki yıldıza doğru fırlatıyorsun, aynılar birleşip büyüyor, dış halkayı geçen kaybediyor. Fırlatma noktası çemberin etrafında döner.
- **Neden:** Birleştirme (merge) videoları TikTok’ta doğal olarak viral oluyor ve dairesel mekanik yeni. Sadece daire fiziği gerektirdiği için motoru küçük.
- **Para:** Devam etme (revive) ve ödüllü reklam, gezegen ve galaksi skinleri, reklamsız paket.

## 4. Telve: AI Kahve Falı *(veto edildi)*

> **Ekim 2026 notu:** Yapılmayacak. Apple App Review 4.3(b) fal uygulamalarını doymuş kategori sayıyor, Türkiye’de falcılık 677 sayılı Kanun kapsamında yasak ve 2025’teki Faladdin/Binnaz soruşturması bu riski somutlaştırdı. Ayrıntı: `docs/11` §3.

- **Kanca:** Fincanın fotoğrafını çekiyorsun, Tekir “falcı kedi” olarak telvedeki şekilleri yorumluyor. Aşk, kariyer ve kısmet kartları; günlük burç ve fal bildirimleri.
- **Para:** Abonelik veya tekil fal kredisi. Türkiye, Orta Doğu ve Balkanlar’da kanıtlanmış bir kategori.
- **Not:** Uygulamada “eğlence amaçlıdır” uyarısı zorunlu. Apple bu tür içeriği eğlence kategorisinde kabul ediyor.

## 5. Simit Tycoon: Idle Cat Café ✅ *(2. ürün, bu repoda, yayına hazır)*

- **Kanca:** Karaköy iskelesinde tek bir simit arabasıyla başlıyorsun. 10 sokak lezzeti (simit, çay, balık ekmek, döner, kumpir, midye, Maraş dondurması, lokum, kebap…) ve her tezgâhın başında sevimli bir **kedi müdür**. Semtten semte taşınarak (Karaköy → Adalar) İstanbul turunu tamamlıyorsun. Martı yakalama ve vapur izdihamı gibi canlı olaylar var.
- **Para:** Sadece ödüllü reklam (×2 gelir, ×2 çevrimdışı kazanç, bedava altın) + altın, kalıcı ×2/×3 çarpan, Reklamsız Ödüller ve Kedi Kulübü aboneliği.
- **Neden öne alındı:** Orbita için yapılan pazar araştırması aynı mekaniğin zaten var olduğunu gösterdi. Kedi temalı idle yemek oyunları (Cat Snack Bar 20 M+ indirme, Eatventure ~40 M) ise kanıtlanmış bir pazar. Ayrıntı: `docs/08`, `docs/09`, `docs/10`.

## 13. Kitap Kedisi: Kelime Solitaire ✅ *(3. ürün, bu repoda, yayına hazır)*

- **Kanca:** Klasik solitaire’in kart dizme keyfi kelime çağrışımıyla buluşuyor. Raf etiketini rafa koy, o kategorinin kelimelerini bul ve diz. Mekân Tekir’in İstanbul’daki sahafı, ilerleme 30 semtlik bir İstanbul turu ve nadir kitap koleksiyonu.
- **Fark:** Her bölüm bir çözücü botla üretilip kalibre edildi, yani **reklamsız kazanılabilir**. Bölüm ortasında reklam yok, can sistemi yok, geri al bedava, +10 hamle 200 altından başlıyor. Rakibin (Word Solitaire: Associations, iOS ~1,8★) bir numaralı şikâyeti aşırı reklam.
- **Neden:** *Solitaire Associations Journey* ABD’de haftalık IAP gelirini birkaç haftada ~1 bin $’dan ~572 bin $’a çıkardı (Sensor Tower, 2025 Ç4) ve 15 Ekim 2026’da Türkiye Kelime listesinde 2. sırada. Türk yapımı bir rakip bulunamadı.
- **Neden Lokma’nın önüne geçti:** Sunucusuz (API maliyeti yok), sağlık uyumluluğu riski yok, mevcut oyun altyapısını yeniden kullanıyor. Ayrıntı: `docs/11`, `docs/12`, `docs/13`, `docs/14`.

## 6. Kelime Çarşısı

- **Kanca:** Harfleri kaydırıp kelime oluşturuyorsun ve bulmaca İstanbul’un semtlerinde ilerliyor. **Türkçe, İngilizce, Almanca ve İspanyolca** sözlükleri var.
- **Neden:** Türkiye’de kelime oyunları çok güçlü ve yerli kaliteli rakip az. Kelime oyunu oynayan kitle daha yaşlı ve daha çok ödeme yapan bir kitle.
- **Ekim 2026 notu:** Kelime kitlesine ilk olarak Kitap Kedisi ile giriyoruz. 129 kategorilik 4 dilli içerik altyapısı ve günlük bulmaca sistemi Kelime Çarşısı’na taşınabilir.

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
| **Ay 1–3** | **Simit Tycoon** ve **Kitap Kedisi** soft launch ve global yayın (kod, görseller ve metinler hazır) |
| **Ay 3–5** | Üç oyunun ilk büyük güncellemeleri (sezon kartı, etkinlik semtleri, Kitap Kedisi haftalık “Sahaf Pazarı” etkinliği); `docs/11`’deki şartlar sağlanırsa Lokma |
| **Ay 5–8** | Kelime Çarşısı, Nefes, Orbita’nın yeniden değerlendirilmesi |
| **Yıl 2** | Pati Kafe ve Tavla & Okey (ekip büyüdükten sonra) |

### Ortak teknoloji ve verimlilik

- Bütün oyunlar aynı yığını paylaşıyor: **Vite + TypeScript + Capacitor**. Lokum Blast’taki reklam, satın alma, bildirim, kayıt, ses, çoklu dil ve mağaza modülleri yeni ürünlere **kopyala-yapıştır** taşınabilir.
- Uygulamalar (Tekir Labs) için tek bir ortak backend kullanılır (auth + Claude API proxy + kullanım limitleri).
- **Çapraz tanıtım:** Her ürünün ayarlar ekranında ve ödül anlarında “Tekir’in diğer oyunları” bölümü olur. İkinci ürünün ilk kullanıcıları bedavaya gelir.
