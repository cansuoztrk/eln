# 16 · Lale: Ürün Tasarımı, Ekonomi ve Fiyatlandırma

*Tekir Labs’in ilk uygulaması. Karar ve pazar araştırması: `docs/15`. Mağaza metinleri: `docs/17`. Kod: `apps/lale`.*

> **Tek cümle:** Odaklandıkça İstanbul laleleri açan bir pomodoro bahçesi, Türk sınav sistemini gerçekten bilen bir net takipçisi ve sunucusuz bir sınıf sıralaması. Reklamsız, hesapsız ve verisi cihazda kalan bir uygulama.

---

## 1. Kimin için, hangi iş?

| Kişi | Yapmak istediği iş | Lale’nin cevabı |
|---|---|---|
| **YKS adayı (17–19)** | “Bugün yeterince çalıştım mı? Netlerim artıyor mu?” | Günlük odak hedefi, seri, ders bazında isabet, deneme net grafiği |
| **LGS öğrencisi (13–14)** | Telefonu bırakıp çalışmak, ama oyun gibi | Sıkı mod (çıkarsan lale solar), lale koleksiyonu, Tekir |
| **KPSS / ALES / DGS / YDS adayı** | Sınava kaç gün kaldığını görmek, ritmi korumak | Ana ekran geri sayım widget’ı, hatırlatıcılar, profiller |
| **Veli / koç** | Çocuğun ne kadar çalıştığını görmek, desteklemek | CSV rapor (Bahçıvan), Sezon Kartı (tek seferlik, yenilenmez), Aile Paylaşımı |
| **Sınıf / arkadaş grubu** | Birbirini motive etmek | Haftalık çalışma kodu ile hesapsız sıralama |

**Rakiplerden farkımız:**
- Forest ve benzerleri Türk sınavlarını bilmez.
- Yerli sayaç uygulamaları reklam dolu, eski görünümlü ve sınav tarihleri bayat.
- Lale ikisini birleştirir. Üstüne bu üç taahhüdü verir: **reklam yok**, **hesap yok**, **arkadaş özelliği her zaman ücretsiz**.

---

## 2. Çekirdek döngü

```
  Ders seç + süre ayarla ──► Odak seansı (lale büyür)
          ▲                         │
          │                         ▼
  Hedef / seri / sıralama ◄── Lale açar → bahçeye dikilir
          ▲                         │
          │                         ▼
  Soru & deneme ekle  ◄────── İstatistik: dakika, isabet, net
```

1. **Odak:** Üç mod var: pomodoro (25/5/15, 4 seansta bir uzun mola), zamanlayıcı (5–120 dk) ve kronometre (en fazla 4 saat).
   - Kadranı çevirdikçe ortadaki lale önizlemesi değişir.
   - Hangi nadirlikte lale açacağı yazılır: *“50 dakikada nadir bir lale açar”*.
2. **Seans:** Tam ekran bir görünüm. İlerleme halkası, filizden çiçeğe büyüyen lale, motivasyon ipuçları ve ortam sesleri bu ekrandadır.
   - **Sıkı mod:** Uygulamadan 10 saniyeden uzun çıkılırsa lale solar.
   - Çıkıştan hemen sonra *“Lalen solmak üzere!”* bildirimi gelir.
3. **Kutlama:** Yeni çeşit rozeti, nadirlik etiketi ve “X bahçesine dikildi” mesajı gösterilir.
   - Kazanımlar burada çıkar: günlük hedef tamamlandı, lale soğanı kazanıldı, yeni bahçe açıldı.
   - Pomodoro’da sonraki adım “5 dk mola ver” düğmesidir.
4. **Takip:** Soru girişinde ders seçilir, doğru/yanlış/boş girilir ve **net anında hesaplanır**.
   - YKS/KPSS/ALES/DGS/MSÜ’de 4 yanlış 1 doğruyu götürür, LGS’de 3 yanlış 1 doğruyu götürür, YDS’de ceza yoktur.
   - Denemeler TYT, AYT (alana göre) veya branş bazında girilir. Kitapçık soru sayısını aşan giriş engellenir.
5. **İstatistik:** Bu hafta, 30 gün ve tüm zamanlar için:
   - odak süresi grafiği (hedef çizgisiyle);
   - 16 haftalık çalışma takvimi (ısı haritası);
   - ders dağılımı ve en verimli 2 saatlik dilim;
   - deneme net eğrisi;
   - ders bazında isabet ve CSV rapor.
6. **Bahçe:** İstanbul semtleri ve 32 lale çeşidinden oluşan bir koleksiyon albümü.
7. **Arkadaşlar:** Haftalık çalışma kodu ve sınıf sıralaması.

### Seans kuralları (kod: `core/timer.ts`, `meta/actions.ts`)
- **Zaman damgası tabanlı.** Uygulama kapansa da süre doğru hesaplanır. Arka planda biten seans, açılışta tamamlanır.
- **Planlanan süreden fazlası sayılmaz.** 25 dakikalık bir seanstan 3 saat sonra dönülürse 25 dakika kaydedilir. Kronometre 4 saatte kendiliğinden durur.
- **1 dakikadan kısa** seans kaydedilmez. **10 dakikadan kısa** seans lale açmaz, ama süresi sayılır.
- **Vazgeç:**
  - Sıkı modda lale solar ve süre sayılmaz. Bu, bilinçli bir taahhüt mekaniği.
  - Normal modda süre kaydedilir, ama lale açmaz. Böylece emek silinmez.
- **Pomodoro döngüsü:** Mola bittikten sonra 30 dakika içinde başlayan seans döngüye devam eder.

---

## 3. Bahçe ekonomisi

### Nadirlik (seans uzunluğuna göre)

| Nadirlik | Süre | Ücretsiz çeşit | Bahçıvan çeşidi | Örnekler |
|---|---|---|---|---|
| Yaygın | 10–24 dk | 6 | 1 | Kırmızı, Sarı, Pembe · *Şeftali* |
| Güzel | 25–49 dk | 6 | 3 | Gülhane Pembesi, Emirgan Alı, Boğaz Mavisi · *Kehribar, Lavanta* |
| Nadir | 50–89 dk | 6 | 3 | İstanbul Lalesi, Gece Yarısı, Alev, Papağan · *Çini Mavisi, Altın Varak* |
| Efsane | 90+ dk | 4 | 3 | Lale Devri, Sultan, Zümrüt, Tekir Lalesi · *Saray Laciverti, Gökkuşağı, Mehtap* |

- **Toplam 32 çeşit (22 ücretsiz + 10 Bahçıvan).** İsimler İstanbul’un lale mirasından (Lale Devri, Emirgan festivali) esinlenir. Gerçek tarihî kültivar olduğu iddia edilmez.
- **Koleksiyonu tamamlama:** Seçimde henüz bulunmamış çeşitlere %60 öncelik verilir (`pickVariety`). Seed seans kimliğinden gelir, sonuç deterministiktir.
- **Uzun seansı ödüllendirir, ama zorlamaz.** Pomodoro (25 dk) her zaman “güzel” lale verir. Efsane için 90 dakika gerekir.

### Bahçeler (semtler)

| Bahçe | Açılış | Sahne |
|---|---|---|
| Gülhane Parkı | Başlangıç | Kubbe ve minareler |
| Emirgan Korusu | 5 saat odak | Boğaz, köşk, yuvarlak ağaçlar |
| Yıldız Parkı | 15 saat | Köşk ve ağaçlar |
| Fethi Paşa Korusu | 30 saat | Köprü ve tepeler |
| Topkapı Lale Bahçesi | Bahçıvan | Adalet Kulesi ve surlar |
| Boğaz Gecesi | Bahçıvan | Yıldızlar, ay, ışıklı köprü |
| Lale Devri Köşkü | Bahçıvan | Saçaklı köşk ve çeşme |

- Ücretsiz bahçeler **emekle** açılır: 5, 15 ve 30 saat. Bu ilk 2–3 haftanın hedef merdivenidir.
- Her bahçe kendi lalelerini tutar. Kullanıcı “Lalelerimi buraya dik” ile aktif bahçeyi seçer.

### Seri ve lale soğanı (`core/streak.ts`)
- **Aktif gün:** ≥20 dk odak **veya** ≥20 soru. Hafif tutuldu, çünkü deneme günü de sayılmalı.
- **Lale soğanı:** Her 7 günlük seride bir tane kazanılır, en fazla 2 birikir. Kaçırılan bir günü otomatik korur. Duolingo’nun seri dondurucusunun bedava ve emekle kazanılan hâlidir. **Satılmaz.**
- **Seri tehlike bildirimi** 21:30’da gelir. Sadece o gün henüz aktif olunmadıysa ve seri o gece kırılacaksa gönderilir.

---

## 4. Sosyal: Haftalık çalışma kodu (`core/friends.ts`)

- **Hesap yok, sunucu yok, sohbet yok.** Kod; ad, sınav, ISO hafta, dakika, soru, seri ve lale sayısını içerir (`LALE-XXXX-…`).
  - Kod Crockford base32 ile kodlanır.
  - Sağlama toplamı uygulama tuzuyla (FNV) hesaplanır, bu yüzden elle oynanan kod reddedilir. Kriptografik değildir, amaç sıradan hileyi durdurmaktır.
- **Akış:**
  1. Kullanıcı “Kodumu paylaş” ile kodu WhatsApp’a gönderir.
  2. Arkadaşı mesajı yapıştırır (kod metnin içinden bulunur).
  3. Bu haftanın sıralamasına eklenir.
  - Eski haftanın kodu “eski kod” bölümünde durur.
  - Aynı kişinin (ad + sınav) daha yeni kodu eskisinin yerini alır.
- **Neden ücretsiz:** Lilo’nun arkadaş özelliğini paralı yapıp tepki aldığını gördük (`docs/15`). Sosyal döngü büyümenin motorudur. Her paylaşım, mağaza sayfasına giden organik bir davettir.

---

## 5. Gelir modeli: “Lale Bahçıvan”

**İlke:** Çalışmanın kendisi asla paralı değildir. Zamanlayıcı, bahçe, sayaç, soru ve deneme takibi, seri ve arkadaşlar her zaman ücretsizdir. Bahçıvan **daha güzel** ve **daha derin** olanı satar.

| Bahçıvan’da açılan | Neden değerli |
|---|---|
| 10 nadir ve mevsimlik lale çeşidi | Koleksiyon tutkusu |
| 3 özel bahçe (Topkapı, Boğaz Gecesi, Lale Devri) | Görsel ödül, paylaşılabilir ekran |
| Tüm ortam sesleri (dalga, şömine, rüzgâr, çay ocağı) | Uzun seans konforu. Yağmur ve derin gürültü ücretsizdir |
| 30 gün ve tüm zamanlar istatistikleri, ders bazında isabet | Ciddi aday ve koç için derinlik |
| Birden fazla sınav profili | KPSS + ALES gibi çift sınavlılar, kardeşler |
| CSV rapor | Veli ve koç |

### Fiyatlar (`meta/catalog.ts`)

| Ürün | Tür | 🇹🇷 Türkiye | Temel (USD) | Not |
|---|---|---|---|---|
| `lale_season_yks27` | Yenilenmeyen (sezon) | **₺249,99** | $14,99 | 31 Temmuz 2027’ye kadar, sadece YKS profilinde gösterilir |
| `lale_season_lgs27` | Yenilenmeyen (sezon) | **₺249,99** | $14,99 | Sadece LGS profilinde |
| `lale_yearly` | Otomatik yenilenen | **₺349,99/yıl** | $19,99 | **7 gün ücretsiz deneme**, “En avantajlı” |
| `lale_monthly` | Otomatik yenilenen | **₺59,99/ay** | $2,99 | |
| `lale_lifetime` | Tüketilmeyen | **₺699,99** | $39,99 | Aile Paylaşımı açık |

**Fiyat çapaları (Ekim 2026):**
- Spotify Öğrenci ₺60/ay.
- Forest ₺105 (tek seferlik iOS) / ₺579.
- YPT ₺99,99/ay, ₺599,99/yıl.
- Online YKS koçluğu ₺2.500–5.000/ay.
Lale bilerek **öğrenci bütçesinin altında**, ama **velinin “evet” diyeceği** bir yerde duruyor.

**Sezon Kartı neden var?**
- Velinin en sevdiği kalıp budur: tek seferlik ödenir, sınavdan sonra kendiliğinden biter, unutulan abonelik olmaz.
- Paywall’da sadece ilgili sınav profiline ve sınavdan önce gösterilir. YKS profilinde YKS kartı görünür, KPSS profilinde hiç görünmez.

**Apple/Google TRY notları:**
- Otomatik yenilenen aboneliklerin TRY fiyatı Apple’ın kur güncellemelerinde yeniden kademelenmez.
- Yılda bir (Ağustos, YKS sonrası) fiyatlar elle gözden geçirilir. Mevcut aboneler için “fiyat koruma” seçilir.

### Paywall kuralları (etik ve politika)
- **Asla ilk açılışta gösterilmez.** Sadece kilitli bir öğeye dokunulunca açılır (istatistik aralığı, ortam sesi, bahçe, albüm, profil) ya da üst çubuktaki taç ile.
- **Sahte sayaç yok**, “son şans” yok, karanlık desen yok.
- Yıllık planın aylık karşılığı ve gerçek tasarruf yüzdesi (%51) **mağaza fiyatlarından hesaplanır**.
- Demo modunda satın alma her zaman onay ister ve “ücret alınmaz” der.
  - Yer tutucu RevenueCat anahtarıyla derlenmiş **native sürümde mağaza “kullanılamıyor” olur, bedava premium verilmez.** Bu ders Kitap Kedisi kod incelemesinden geldi.
- **Bekleyen ödemeler** (Play yavaş kart, Ask to Buy) `addCustomerInfoUpdateListener` ile onaylanınca kendiliğinden açılır.
- Satın alma butonu çift dokunmaya karşı korunur. Modal arka planı ilk 350 ms’de ve kapanırken dokunuşları yok sayar.

### Gelir senaryosu (ilk sezon, Ekim 2026 – Temmuz 2027)

| Varsayım | Muhafazakâr | Hedef |
|---|---|---|
| İndirme (TR %85) | 25.000 | 80.000 |
| Ödeyen oranı | %1,0 | %2,5 |
| Ödeyen kişi | 250 | 2.000 |
| Karışım (sezon / yıllık / aylık / ömür boyu) | 40 / 30 / 20 / 10 | 40 / 30 / 20 / 10 |
| Ödeyen başına net (mağaza %15 sonrası, KDV hariç) | ≈ ₺230 | ≈ ₺230 |
| **Brüt net** | **≈ ₺57.500** | **≈ ₺460.000** |

Başarı ölçütü `docs/15` ile aynı: 31 Mart 2027’ye kadar ≥25 bin indirme ve ≥%1 ödeme. EN/DE/ES mağazaları (Abitur, EBAU, Matura için genel “Başka bir sınav” profili) USD bazlı fiyatla yukarı yönlü opsiyondur.

---

## 6. Gizlilik ve güven (reşit olmayan kullanıcılar)

- **Hesap yok, reklam yok, analitik SDK yok.** `track()` sadece geliştirme konsoluna yazar.
- **Veri cihazda kalır:** Capacitor Preferences’ta tutulur, JSON yedeği kullanıcının elindedir (dışa ve içe aktarma).
- Android manifestinde `AD_ID` izni **kaldırılır**, kesin alarm (`SCHEDULE_EXACT_ALARM`) istenmez.
- Kids kategorisi ve “çocuklar için” ifadesi kullanılmaz. Hedef kitle 13+ öğrenci ve yetişkin adaydır.
- Mağaza beyanları: Apple “Data Not Collected”, Google Data safety “Veri toplanmıyor / paylaşılmıyor”. Satın alma bilgisi mağaza ve RevenueCat tarafındadır.
- Uygulama ÖSYM, MEB veya YÖK ile bağlantılı değildir. Sınav tarihleri “tahmini” etiketlidir ve kullanıcı tarafından düzenlenebilir.

---

## 7. Bildirimler ve widget

| Kimlik | Ne zaman | Koşul |
|---|---|---|
| 10 | Seans bitiş anı | Geri sayım sürerken, duraklatılmamışsa |
| 11 | Uygulamadan çıkıştan 1,5 sn sonra | Sıkı mod açıkken |
| 1 | Seçilen saatte (varsayılan 19:00) | O gün hedef tamamlanmadıysa. Tamamlandıysa ertesi gün |
| 2 | 21:30 | Seri bu gece kırılacaksa |

- İzin onboarding’de kibarca istenir (“Spam yok”). Reddedilirse ayarlardan açılabilir.
- **Android ana ekran widget’ı:** “YKS için kalan · 246 gün”.
  - Gün sayısını kendisi hesaplar. Gün değişiminde (`DATE_CHANGED`) ve 3 saatte bir yenilenir.
  - Uygulama `LaleWidget.update` ile sınavı ve etiketi gönderir.
- iOS WidgetKit v1.1’e planlandı.

---

## 8. Yol haritası

| Sürüm | İçerik |
|---|---|
| **1.0** (Kasım 2026) | Bu doküman |
| 1.1 | iOS widget (WidgetKit) ve Canlı Etkinlik (Dynamic Island) sayaç, yeni bahçe “Kız Kulesi” |
| 1.2 | Gerçek uygulama engelleme (iOS Family Controls, Android kullanım erişimi) |
| 1.3 | Bahar Lale Festivali (Nisan): sınırlı süreli çeşitler, ücretsiz etkinlik |
| 2.0 | İsteğe bağlı iCloud/Google Drive yedeği, öğretmen sınıf kodu |

## 9. Ölçümler (analitik SDK olmadan)
- Mağaza konsolları: indirme, dönüşüm, deneme→ödeme, iptal.
- RevenueCat: MRR, deneme dönüşümü, sezon kartı payı.
- Mağaza yorumları: tema analizi (sınav tarihi, bildirim, fiyat).
- Uygulama içi sayaçlar sadece cihazda tutulur (açılış, değerlendirme isteme kuralı: 10+ seans, 3+ gün, 30 günde bir, en fazla 4 kez).
