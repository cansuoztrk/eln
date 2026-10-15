# 11 · Lokma: AI Kalori — Araştırma Raporu ve Erteleme Kararı

*Ekim 2026. Lokma, Tekir Labs’in ilk uygulaması olarak planlanmıştı. Kodlamaya başlamadan önce 7 paralel araştırma ve bir “karşı görüş” analizi yapıldı. Sonuç: **ertelendi**, önce kelime çağrışım solitaire oyunu yapılacak.*

---

## 1. Karar

| Seçenek | Gelir | Alışkanlık | Tek kişilik ekip için yapılabilirlik | Mağaza riski | **Ağırlıklı puan** |
|---|---|---|---|---|---|
| **Kelime çağrışım solitaire** (ads + IAP, sunucusuz) | 6,5 | 7 | 9 | 8 | **7,5** |
| Kelime Çarşısı (Türkçe kelime bağlama) | 2 | 7 | 8 | 9 | 5,9 |
| Nefes (sigara bırakma koçu) | 4 | 5 | 8 | 7 | 5,8 |
| **Lokma** (AI kalori, abonelik) | 5 | 6 | 4 | 5 | **5,0** |
| Telve (AI kahve falı) | — | — | — | — | **2 (veto)** |

Ağırlıklar: gelir %35, alışkanlık %20, yapılabilirlik %25, mağaza riski %20.

## 2. Lokma’ya karşı en güçlü argümanlar

1. **Pazar dolu ve dağıtıma bağlı.** Türkiye App Store Sağlık & Fitness ilk 20’sinde (15 Ekim 2026) altı kalori/yemek tarayıcı uygulama var (EatBetter, FatSecret, Yazio AI, Foodvisor, NextBite, FoodPilot). Türk mutfağına özel kopyalar da çıktı (Kalorita ₺150/ay, NeYedim). MyFitnessPal (280 milyon üye) Cal AI’ı satın aldı. Cal AI’ın büyümesi ~250 influencer ve ayda altı haneli pazarlama bütçesiyle geldi.
2. **Türkiye az ödüyor.** Türkiye’nin en çok kazanan sağlık uygulaması haftada ~9–14 bin $ (2025 Ç4). ₺899,99’luk yıllık plan; KDV %20, dijital hizmet vergisi %5 ve mağaza payı %15 sonrası yılda ~12,3 $ bırakıyor. Almanya’da yıllık fiyatlar Türkiye’nin 4,4 katı.
3. **Doğruluk–maliyet tuzağı.** GPT-4o ve Claude 3.5 Sonnet fotoğraftan enerji tahmininde ~%36 ortalama hata (2025). Cal AI dahil dört uygulama öğünleri 250–345 kcal eksik saydı (2026, ön sonuç). Modeller yemeği tanımada iyi, **gramajda** kötü. Ucuz model (Haiku 5.5, tarama başına ~0,0007 $) doğrulukta geride. Daha iyi model (Sonnet 5.5) yoğun kullanıcıda yıllık planın aylık net gelirini aşabiliyor.
4. **Tek kişi için hukuk ve işletme yükü.** Sağlık verisi KVKK’da özel nitelikli veri. ABD’ye sürekli aktarım standart sözleşme ve 5 iş günü içinde Kurum’a bildirim gerektiriyor (idari para cezası ₺90 bin–1,8 milyon; veri güvenliği ihlallerinde ₺17 milyona kadar). Apple 5.1.2(i) üçüncü taraf yapay zekâya veri aktarımı için açık onay istiyor. Apple, Nisan 2026’da Cal AI’ı satış ekranı uygulamaları yüzünden kısa süreliğine kaldırdı. Claude modelleri ~12–16 ayda bir emekliye ayrılıyor; her geçişte yeniden test gerekiyor.

**Karşı argümanlar:** Sağlık & Fitness’ın kullanıcı başı geliri en yüksek kategorilerden. Çıkarım maliyeti neredeyse sıfıra indi. Cal AI’ın Türkçe arayüzü yok. **Lokma ölmedi, ertelendi.**

## 3. Telve neden veto edildi?

Apple App Review Guideline 4.3(b) “fal” uygulamalarını yeni başvuru kabul edilmeyen doymuş kategoriler arasında sayıyor. Türkiye’de 677 sayılı Kanun falcılığı yasaklıyor. Faladdin ve Binnaz (25 milyon+ indirme) hakkında 2025’te soruşturma açıldı, kurucusu tutuklandı ve ~₺107,5 milyon varlığa el konuldu. Kurucu Aralık 2025’te ev hapsiyle tahliye edildi.

## 4. Lokma’ya dönmek için gerekenler

| Koşul | Eşik |
|---|---|
| Doğruluk | 100+ tartılmış Türk yemeği fotoğrafında enerji MedAPE ≤ %25, Yazio/Foodvisor/Cal AI’dan iyi |
| Birim ekonomi | Yapay zekâ maliyeti ödeyen kullanıcının net gelirinin ≤ %10’u (taramaların ≥ %90’ı Haiku sınıfında) |
| Dönüşüm | Türkiye yumuşak lansmanında 35. gün indirme→ödeme ≥ %2,9; deneme→ödeme ≥ %35 (RevenueCat Sağlık & Fitness medyanı) |
| Dağıtım | Bütçesiz, tekrarlanabilir bir kanal: Türk yemeği kısa videoları, diyetisyen ortaklıkları, Ramazan |
| Hukuk | KVKK aktarım yolu için avukat görüşü + Apple 5.1.2(i) onay ekranı + Google Play sağlık beyanı |
| Kapasite | Lokum Blast ve Simit Tycoon yayında ve stabil |

## 5. Risk azaltma planı (geri dönüldüğünde)

- **Önce talep testi:** 2 haftalık “sahte kapı” testi. Türkçe açılış sayfası, 5–10 Reels/TikTok (“Bu iskender kaç kalori?”) ve bekleme listesi. Bırakma eşiği testten önce belirlenir.
- **Model yönlendirme:** Varsayılan ucuz model; düşük güvende veya kullanıcı itirazında daha güçlü modele çıkış; günlük kişi başı sınır; cihazda küçültme; önbelleğe alınmış sistem istemi; yapılandırılmış JSON.
- **Doğruluk deneyimi:** Tekir tek bir takip sorusu sorar (“Yağ mı tereyağı mı? Kaç kepçe?”). Bir 2026 çalışmasında öğün detayı eklemek enerji tahmininin uyumunu (R²) 0,59’dan 0,94’e çıkardı. Kalori aralık olarak gösterilir. Yapay zekâ yalnız yemeği ve porsiyonu bulur, kaloriyi doğrulanmış bir besin tablosundan alır.
- **Ücretsiz katman:** Sınırsız elle ve metinle kayıt (yapay zekâ maliyeti yok) + günde 2–3 fotoğraf. Pro: sınırsız fotoğraf, hassas mod, haftalık karne detayları, Ramazan planlayıcı.
- **Satış ekranı hijyeni:** Faturalanan tutar en belirgin yerde; deneme anahtarının arkasında saklı yenileme koşulu yok; ikinci “indirim” akışı yok; yalnız Apple/Google ödeme.
- **Pazarlar:** Türkiye ve Almanya birlikte (Türkçe arayüz, EUR fiyat). Türkiye’de ~₺149/ay, ₺899–1.499/yıl.
- **Gizlilik tasarımı:** Hesap yok (anonim RevenueCat kimliği), kilo ve hedefler cihazda, fotoğrafın EXIF verisi silinir, modele yalnız görüntü gider, fotoğraf sunucuda saklanmaz.
- **v1 kapsamı:** Fotoğraf ve metinle kayıt, günlük toplamlar, haftalık özet. Diyabet veya karbonhidrat sayımı iddiası yok. Bir Türk tip 1 diyabet çalışmasında yapay zekâ ile diyetisyen uyumu yalnız ICC 0,31–0,42 çıktı. “Tıbbi tavsiye değildir” metni ve yeme bozukluğuna duyarlı ayarlar.

## 6. Hazır kod

`apps/lokma/` içinde test edilmiş temel var: beslenme hesapları ve güvenlik sınırları, 81 il için çevrimdışı imsak/iftar vakitleri (Diyanet ile ±1 dk, güvenli yönde), Haftalık Karne, Türkçe yemek arama, kayıt sistemi, Tekir koç görselleri. Ayrıntı: [`../apps/lokma/README.md`](../apps/lokma/README.md).

## Kaynaklar (seçme)

- MyFitnessPal’ın Cal AI’ı satın alması: [TechCrunch](https://techcrunch.com/?p=3098039), [Pulse 2.0](https://pulse2.com/myfitnesspal-acquires-cal-ai-to-expand-ai-powered-nutrition-tracking-portfolio)
- Cal AI büyüme ve ekip: [Latka](https://getlatka.com/interviews/cal-ai-zach-yadegari-2025)
- Apple’ın Cal AI’ı kaldırması (Nisan 2026): [TechCrunch](https://techcrunch.com/2026/04/21/apples-cal-ai-crackdown-signals-its-still-policing-the-app-store/), [9to5Mac](https://9to5mac.com/2026/04/21/popular-calorie-tracker-briefly-pulled-from-app-store-over-iap-and-billing-violations/)
- Türkiye Sağlık & Fitness listesi: [App Store TR](https://apps.apple.com/tr/charts/iphone/health-fitness-apps/6013); Türkiye gelir sıralaması: [Sensor Tower 2025 Ç4](https://sensortower.com/blog/2025-q4-unified-top-5-health-and-fitness-revenue-tr-600af518241bc16eb8dce802)
- Abonelik benchmark’ları: [RevenueCat State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps), [Adapty](https://adapty.io/blog/markdown/health-fitness-app-subscription-benchmarks.md)
- Fotoğraftan kalori doğruluğu: [PMC 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12513282/), [Newswise 2026](https://www.newswise.com/articles/photo-based-calorie-tracking-apps-may-underestimate-energy-in-meals), [OmniFood-Bench (arXiv)](https://arxiv.org/abs/2607.08423), [Uludağ Ü. — ChatGPT-4o basit/karmaşık öğünler](https://avesis.uludag.edu.tr/yayin/4dd659a6-bb7a-4945-a926-b7f043a9a7fd/image-based-nutritional-assessment-evaluating-the-performance-of-chatgpt-4o-on-simple-and-complex-meals), [Uludağ Ü. — Tip 1 diyabet karbonhidrat sayımı](https://avesis.uludag.edu.tr/yayin/2a343572-4db8-4f41-b613-167094453151/carbohydrate-counting-in-traditional-turkish-fast-foods-for-individuals-with-type-1-diabetes-can-artificial-intelligence-models-replace-dietitians)
- Claude fiyatları ve model emeklilikleri: [Fiyatlar](https://platform.claude.com/docs/en/about-claude/pricing), [Emeklilik takvimi](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- Apple yapay zekâ veri paylaşımı kuralı: [TechCrunch, Kasım 2025](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Google Play sağlık uygulamaları: [Play Console Yardım](https://support.google.com/googleplay/android-developer/answer/16555673)
- KVKK 2026 idari para cezaları: [Cottgroup](https://cottgroup.com/en/legislation/item/administrative-fine-amounts-in-kvkk-for-2026); yurt dışı aktarım: [Bilal Alyar Hukuk](https://bilalalyar.av.tr/kvkk-uluslararasi-veri-aktarimi/)
- Faladdin/Binnaz soruşturması: [DonanımHaber](https://www.donanimhaber.com/faladdin-ve-binnaz-uygulamalarina-sorusturma-baslatildi--193877), [Euronews](https://tr.euronews.com/2025/12/03/faladdin-ve-binnaz-uygulamalarinin-sahibi-sertac-tasdelene-ev-hapsi-tedbiriyle-tahliye)
- Kelime çağrışım solitaire türü: [Sensor Tower 2025 Ç4](https://sensortower.com/blog/2025-q4-ios-top-5-solitaire-games-units-de-600abc3f241bc16eb850508a), [FoxData](https://foxdata.com/en/blogs/when-word-meets-cards-word-solitaire-associations-climbs-to-us-app-store-top-1/), [Admapix](https://www.admapix.com/blog/ad-intelligence/solitaire-associations-journey-ad-strategy-2026)
- Diyanet Ramazan takvimi: [Evrensel (2027)](https://www.evrensel.net/haber/5997565/diyanet-2027-takvimini-duyurdu-ramazan-ne-zaman-basliyor), [NTV imsakiye (2026)](https://www.ntv.com.tr/imsakiye/istanbul)
