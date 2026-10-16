# 15 · Tekir Labs’in İlk Uygulaması: Araştırma ve Karar

*Ekim 2026. Üç oyundan sonra (Lokum Blast, Simit Tycoon, Kitap Kedisi) sıra Tekir Labs’te. Lokma ertelendi (`docs/11`), Telve veto edildi. Kalan iki güçlü aday paralel olarak araştırıldı. Kısıtlar: tek geliştirici + Claude, Vite + TypeScript + Capacitor, **sunucusuz** başlangıç, RevenueCat, TR/EN/DE/ES, Türkiye’ye özel TL fiyatı.*

## 1. Karar

| Kriter | **Lale: YKS Sayaç & Ders Takibi** | Nefes: Sigara/Vape Bırakma Koçu |
|---|---|---|
| Kitle (Türkiye) | Her yıl yenilenen: 2026’da **2,43 M YKS**, **1,02 M LGS**, **1,71 M KPSS Lisans** adayı | ~20,6 M günlük tütün kullanıcısı (TÜİK %30,1 × 15+ nüfus, tahmin) |
| Rekabet | Global devler Türkçe sınav yapısını bilmiyor. Türk uygulamaları reklam dolu ve eski görünümlü | 2025’ten beri Türkçe aramada **~196 yeni uygulama**, bunların ~192’sinin 50’den az puanı var |
| Liderlerin zaafı | Forest’ın 2026 yeniden tasarımı: son 100 ABD yorumunun ortalaması **1,95★**. Lilo arkadaş özelliğini paralı yaptı ve tepki aldı | Resmî uygulama (Yeşilay “Bırakabilirsin”) 1,7★, kayıt olunamıyor. Kwit pahalı ve Türkçesi zayıf |
| Ödeme isteği | Düşük ama **veliler öder** (online YKS koçluğu ₺2.500–5.000/ay) | Çok düşük (“o parayla sigara içerim”) |
| Sunucusuz uygunluk | Yüksek. Arkadaşlık **kodla**, hesap yok | Yüksek |
| Politika riski | Reşit olmayan kullanıcı → veri toplama yok, Kids kategorisi yok | Sağlık iddiaları (Apple 1.4.1), Apple 4.3(b) “basit sayaç” doygunluğu |
| İsim | “Lale” tek başına dolu (“Lale — Learn Turkish”). **“Lale: YKS Sayaç & Ders Takip”** olarak ayrışıyor | “Nefes” App Store’da 3 kez alınmış |
| Marka uyumu | İstanbul laleleri + Tekir, portföyle çapraz tanıtım | Tekir’in iyileşen hâli |
| **Sonuç** | ✅ **Seçildi** | ⏸ Beklemede (ileride oyun mekanikli bir sürümle) |

**Neden Lale?** Türkiye’ye özgü, her yıl kendiliğinden yenilenen ve global rakiplerin taklit edemeyeceği bir veri modeli var (TYT/AYT/YDT, LGS, KPSS, ALES, DGS, YDS, MSÜ alanları ve doğru net formülleri). Pazar liderleri şu an kendi kullanıcılarını kızdırıyor. “Sevimli odak oyunu + gerçek net takibi” birleşimini cilalı biçimde yapan kimse yok.

## 2. Bilinen zayıflıklar ve önlemler

| Risk | Önlem |
|---|---|
| Öğrenci kitlesinin gelir potansiyeli düşük (TR fiyatları ABD’nin ~%36’sı) | Sezon kartı (velinin alacağı tek seferlik paket), Aile Paylaşımı, EN/DE/ES mağazaları (Abitur, EBAU gibi sınavlar için genel “Sınav” profili) |
| Sosyal özellik genelde sunucu ister | Sağlama toplamlı **haftalık çalışma kodu** ile hesapsız sınıf sıralaması, her zaman ücretsiz |
| Bayat sınav tarihleri (Türk sayaç uygulamalarında 1 numaralı şikâyet) | 2027 ve 2028 tarihleri uygulamada, “tahmini” etiketli ve kullanıcı tarafından düzenlenebilir. ÖSYM takvimi açıklanınca güncelleme |
| Reşit olmayanlar (LGS 13–14 yaş) | Hesap yok, reklam yok, analitik SDK yok, veri cihazda kalıyor. Kids kategorisi ve “çocuklar için” ifadesi yok |
| Uygulama engelleme Apple Family Controls izni ister | v1’de “Sıkı mod”: uygulamadan çıkınca lale solar. Gerçek engelleme v1.2’de |
| Forest kopyası algısı (Apple 4.1) | İstanbul semt bahçeleri, tarihî lale çeşitlerinden esinlenme, Tekir bahçıvan, sınav takibi. Kendine özgü bir tasarım |

**Başarı ölçütü:** 31 Mart 2027’ye kadar ≥25 bin indirme ve ≥%1 ödeme. Aksi halde bakım moduna alınır, sıradaki Labs adayına geçilir.

## 3. Nefes notları (ileride dönmek için)

- Kazanmak için oyun kalitesinde bir kedi arkadaş ve stüdyonun oyunlarından türetilmiş **“kriz anı mini oyunları”** şart. Basit sayaç olarak yapılmamalı.
- Ad Tekir ile başlamalı (“Tekir’le Bırak”). Sigara, vape, sarma tütün ve nargile birlikte desteklenmeli. Veri toplanmamalı.
- Ölçüt: 90. günde G7 ≥ %20, deneme başlatma ≥ %5, deneme→ödeme ≥ %30, puan ≥ 4,5.

## Kaynaklar (seçme)

- ÖSYM 2026 YKS başvuru: https://www.osym.gov.tr/TR,33951/yksye-2-milyon-425-bin-560-aday-basvurdu-26032026.html
- MEB 2026 LGS raporu: https://www.meb.gov.tr/2026-lgs-kapsaminda-merkezi-sinav-raporu-yayimlandi/haber/41333/tr
- KPSS 2026 başvuru: https://www.milligazete.com.tr/kpssye-kac-kisi-girdi-2026-kac-aday-basvurdu-sinav-kac-bina-ve-salonda-yapildi-kac-gorevli-calisti
- Forest TR/ABD mağaza ve yorumları: https://apps.apple.com/tr/app/forest-focus-for-productivity/id866450515 · https://itunes.apple.com/us/rss/customerreviews/page=1/id=866450515/sortby=mostrecent/json
- RevenueCat State of Subscription Apps 2026 (Eğitim): https://www.revenuecat.com/state-of-subscription-apps-2026-education
- Focus Friend (Appfigures): https://appfigures.com/resources/insights/20250905?f=1
- StatCounter Türkiye mobil OS (Android %74): https://gs.statcounter.com/os-market-share/mobile/turkey
- TÜİK sağlık araştırması 2025 (tütün %30,1): https://www.dunya.com/saglik/turkiyenin-saglik-karnesi-aciklandi-mevcut-tablo-alarm-veriyor-haberi-827065
- Yeşilay “Bırakabilirsin” yorumları: https://itunes.apple.com/tr/rss/customerreviews/id=1549146779/sortby=mostrecent/json
- Kwit TR fiyatları: https://apps.apple.com/tr/app/id525441365
- WHO tütün eğilimleri 2025: https://www.who.int/news/item/06-10-2025-who-tobacco-trends-report-1-in-5-adults-still-addicted-to-tobacco
- Türkiye e-sigara mevzuatı: https://www.tobaccocontrollaws.org/legislation/turkey/e-cigarettes
