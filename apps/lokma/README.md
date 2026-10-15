# Lokma: AI Kalori Sayacı *(Tekir Labs, ertelendi)*

Yemeğin fotoğrafını çekince kaloriyi ve makroları tahmin eden, Türk mutfağını tanıyan abonelikli uygulama fikri. **Durum: ertelendi.** Pazar araştırması ve karşı görüş analizi, şu an tek kişilik bir stüdyo için daha az riskli bir ürünün (kelime çağrışım solitaire oyunu) önce yapılması gerektiğini gösterdi. Gerekçeler ve araştırma raporu: [`../../docs/11-lokma-arastirma-raporu.md`](../../docs/11-lokma-arastirma-raporu.md).

Yeniden başlarken sıfırdan değil, aşağıdaki hazır ve test edilmiş temelden devam edilecek.

## Hazır olanlar

| Dosya | İçerik | Test |
|---|---|---|
| `src/core/nutrition.ts` | Mifflin–St Jeor bazal metabolizma, günlük enerji, kilo verme/alma planı. Güvenlik sınırları: günlük açık en fazla 1000 kcal ve ihtiyacın %30’u, kadın 1200 / erkek 1500 kcal tabanı, BMI 18,5 altı hedef yok, 18 yaş altına kilo verme hedefi yok. Makro dağılımı, su hedefi, VKİ | 12 |
| `src/core/ramadan.ts` | 81 il + 15 diaspora şehri için çevrimdışı imsak, güneş ve iftar vakitleri. Diyanet’in 2026 İstanbul imsakiyesiyle en fazla ±1 dakika fark, hep güvenli yönde (imsak erken, iftar geç). Diyanet 2026–2027 Ramazan tarihleri, sonrası için Ümmülkura takvimi | 6 |
| `src/core/diary.ts` | Günlük kayıt, öğün toplamları, çaydaki şeker küpü kalorisi, seri hesabı, “Anne Porsiyonu” ölçeği | 5 |
| `src/core/karne.ts` | **Haftalık Karne:** Türk okul karnesi tarzında haftalık not (Pekiyi…Gelişmeli), Takdir/Teşekkür belgesi. Az yemek asla ödüllendirilmez | 4 |
| `src/core/search.ts` | Türkçe karakterlere duyarsız, yazım hatası toleranslı çevrimdışı yemek arama | 5 |
| `src/meta/state.ts`, `src/meta/actions.ts` | Cihazda kayıt (hesapsız), bozuk kayıt onarımı, günlük, kilo, oruç, Pro ve yapay zekâ kotası | — |
| `src/i18n/tr.ts`, `en.ts` | ~600 anahtarlık arayüz metinleri (Almanca çeviri bekliyor) | — |
| `src/ui/tekir.ts` | Koç Tekir: 6 ruh hâli, 7 kıyafet (seriyle açılır) | — |
| `src/styles/*.css` | Açık/koyu tasarım sistemi (nar, zeytin, safran) | — |
| `tests/foods.test.ts` | Besin veritabanı kalite kapısı (Atwater tutarlılığı, porsiyonlar, 3 dil, 150 temel yemek). Veritabanı yazılınca devreye girer | bekliyor |

```bash
npm install
npm test          # 32 test
npm run typecheck
```

## Devam ederken yapılacaklar

1. **Talep testi:** Türkçe açılış sayfası, Türk yemekleriyle 5–10 kısa video (“Bu iskender kaç kalori?”), bekleme listesi; başlamadan önce eşik belirle.
2. **Doğruluk testi:** 100+ tartılmış Türk yemeği fotoğrafında enerji hatası (MedAPE) hedefi ≤ %25.
3. **Hukuk:** KVKK yurt dışı aktarım (standart sözleşme + 5 iş günü bildirim) için avukat görüşü; Apple 5.1.2(i) açık onay ekranı.
4. **Kalan iş:** ~300 yiyeceklik veritabanı, ekranlar, `services/lokma-api` (Cloudflare Worker + Claude), satış ekranı, mağaza görselleri.
