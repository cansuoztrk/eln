# Fiyat mantığı: geçmiş, doğrulanmış indirim, fırsat puanı ve etiketler

Bu belge, sitede gösterilen her fiyat yorumunun nasıl hesaplandığını açıklar. Kod karşılıkları:
`src/server/pricing/stats.ts`, `evaluate.ts`, `coupons.ts`, `config.ts`, `recompute.ts`.

Temel ilke: **Kaynağın "eski fiyat" beyanı, bizim topladığımız fiyat geçmişinin yerine geçmez.**
Sıralama ve "fırsat" kararları yalnızca kendi doğruladığımız gözlemlere dayanır.

## 1. Fiyat kayıtları (PriceSnapshot)

- Tüm tutarlar tamsayı **kuruş** (minor unit) + para birimi olarak saklanır. Kayan nokta kullanılmaz.
- Her kayıt şunları taşır: fiyat, liste fiyatı, kargo, stok durumu, **kontrol zamanı (UTC)**,
  **veri kaynağı** ve (varsa) görev kimliği.
- Yeni kayıt yalnızca fiyat, liste fiyatı, kargo veya stok **değiştiğinde** yazılır; değişmese bile
  en fazla 20 saatte bir "hâlâ geçerli" kaydı (heartbeat) yazılır. Böylece tablo şişmez ama
  "bu fiyat dün de geçerliydi" bilgisi kaybolmaz.
- İki kayıt arasındaki boşluk **36 saati aşarsa** o aralık "bilinmiyor" sayılır; fiyatın o süre
  boyunca aynı kaldığı varsayılmaz.

## 2. Pencere istatistikleri (30 / 90 / 180 gün)

Her pencere için gün kapanış fiyatları (Türkiye saatine göre) üzerinden:
en düşük, en yüksek, medyan ve "bugünden önceki en düşük" hesaplanır.

- **Kapsam:** pencerenin kaç gününde doğrulanmış veri olduğu.
- **Yeterlilik:** kapsam ≥ pencere uzunluğunun **%66'sı** olmalı (30 gün için ≥ 20 gün).
  Yetersiz pencerede istatistik "Yetersiz geçmiş" olarak gösterilir; uydurma değer üretilmez.

## 3. Doğrulanmış indirim

```
doğrulanmış_indirim_% = (referans − güncel_fiyat) / referans × 100
```

Referans sırası:

1. **MEDIAN_30** — son 30 günün (bugün hariç) günlük kapanış fiyatlarının medyanı;
   30 günlük pencere yeterliyse.
2. **PREVIOUS_STABLE** — 30 günlük geçmiş yetersizse, en az **3 gün** geçerli kalmış önceki
   doğrulanmış fiyat. Bu durumda puana katkısı 0,6 katsayıyla sınırlandırılır.

%0,5'in altındaki farklar indirim sayılmaz. Sitede indirim her zaman referansıyla birlikte yazılır
(ör. "30 günlük tipik fiyata göre %12").

## 4. Liste fiyatına göre indirim (ayrı metrik)

```
liste_indirimi_% = (liste_fiyatı − güncel_fiyat) / liste_fiyatı × 100
```

- Sıralamada ve puanda **kullanılmaz**; yalnızca bilgi olarak, "mağazanın beyan ettiği" ifadesiyle
  gösterilir.
- **Şişirilmiş liste fiyatı tespiti:** 90 günlük pencere yeterliyse ve
  `liste_fiyatı > 1,15 × son_90_günün_doğrulanmış_en_yüksek_fiyatı` ise liste fiyatı "tutarsız"
  işaretlenir ve kullanıcıya açıklaması gösterilir. Geçmiş yetersizse "doğrulanamadı" denir.

## 5. Şüpheli fiyat değişimi

Tek kontrolde **%70'ten fazla düşüş** veya **%300'den fazla artış** şüpheli sayılır:
teklif puan almaz, "en iyi teklif" olamaz, alarm tetiklemez ve yönetim panelinde **Teklifler →
Şüpheli** listesine düşer. Aynı fiyat en az 6 saat sonra tekrar doğrulanırsa otomatik işaret
kalkar. Yöneticinin elle koyduğu işaret ise elle kaldırılana kadar kalır.

## 6. Tazelik ve "yeniden doğrulanıyor"

Her veri kaynağının bir **tazelik penceresi** vardır (Amazon için 75 dk; Amazon Creators API
belgelerinde Offers verisinin önbellek süresi 1 saattir).

- Son kontrol denemesi başarısız olduysa (kaynak hata verdi) teklif `REVALIDATING` olur;
- son başarılı kontrol tazelik penceresini aşarsa teklif `STALE` olur;
- her iki durumda fiyat silinmez ama **"Fiyat yeniden doğrulanıyor"** etiketiyle gösterilir;
- fırsat puanı ve diğer etiketler kaldırılır, alarm tetiklemez, en iyi teklif seçiminde yer almaz.

Kaynak hata verdiğinde son başarılı veri korunur; teklifler "satıştan kalktı" yapılmaz. Bir teklif
yalnızca **başarılı ve tam** bir katalog senkronunda listede yoksa `EXPIRED` olur.

## 7. Fırsat puanı (0–100)

```
puan = Σ (ağırlık_i × değer_i) / Σ ağırlık × 100      (değer_i ∈ [0, 1])
```

Varsayılan ağırlıklar (yönetim panelinde **Puanlama** sayfasından sürümlenerek değiştirilebilir):

| Faktör | Ağırlık | Değer nasıl hesaplanır |
|---|---:|---|
| Geçmişe göre avantaj | 30 | doğrulanmış_indirim / 30 (MEDIAN_30); PREVIOUS_STABLE ise × 0,6 |
| Rakiplere göre avantaj | 20 | kargo dâhil en ucuzsa max(0,2; fark% / 15); değilse 0 |
| Doğrulama güvenilirliği | 15 | 0,5 × (30 gün kapsamı) + 0,25 × liste fiyatı tutarlılığı + 0,25 × kargo biliniyor |
| Stok | 8 | stokta 1; az stok 0,8; bilinmiyor 0,4; ön sipariş 0,3 |
| Toplam maliyet | 7 | ücretsiz kargo 1; ücretli 0,6; bilinmiyor 0 |
| Kupon avantajı | 5 | doğrulanmış ve uygulanabilir kupon varsa min(1; tasarruf / fiyat × 10) |
| Veri tazeliği | 10 | 1 − (son başarılı kontrolden beri geçen süre / tazelik penceresi) |
| Kampanya bitişi | 0 | kaynak gerçek bitiş tarihi bildiriyorsa ve ≤ 72 saat kaldıysa 1 − kalan_saat / 72 (varsayılan ağırlık 0) |
| Kullanıcı ilgisi | 5 | ln(1 + 7 günlük tıklama + favori) / ln(1 + 200) |

**Puan verilmeyen durumlar:** teklif devre dışı, kaynakta yok, stokta değil, taze değil veya
şüpheli. Bu durumda puan alanı boş kalır ve nedeni ürün sayfasında yazar.

Ürün sayfasında her faktörün puana katkısı ve açıklaması ("Bu puan nasıl hesaplandı?") gösterilir.

## 8. Etiketler

Etiketler **yalnızca koşulları o anda gerçekten sağlanıyorsa** gösterilir. Teklif taze değilse
veya şüpheliyse "Fiyat yeniden doğrulanıyor" dışındaki hiçbir etiket gösterilmez.

| Etiket | Koşul |
|---|---|
| Yakın zamanda doğrulandı | Son başarılı kontrol tazelik penceresi içinde |
| Fiyat geçmişine göre avantajlı | MEDIAN_30 referanslı doğrulanmış indirim ≥ %8 |
| Mağazalar arasında en uygun | Kargo dâhil toplam, diğer mağazaların en iyi teklifinden düşük/eşit (rakip kargosu bilinmiyorsa alt sınır olarak yalnızca ürün fiyatı) |
| Son 30 günün en düşüğü | 30 gün yeterli ve fiyat ≤ bugünden önceki 30 günlük en düşük ve < 30 günlük en yüksek |
| Kuponla daha uygun | Doğrulanmış, geçerli ve koşulları sağlanan kupon tasarruf sağlıyor |
| Fiyatı yakından takip et | Fiyat 90 günlük en düşüğün en fazla %5 üzerinde |
| Fiyat yeniden doğrulanıyor | Teklif REVALIDATING veya STALE |

## 9. Kuponlar

Kupon yalnızca **doğrulanmış** (kaynaktan gelen veya yönetici tarafından doğrulanan), geçerlilik
tarihleri içinde ve koşulları (asgari sepet, kategori, mağaza, marka) sağlanıyorsa fiyata
uygulanır. Doğrulanmamış kupon gösterilmez; kupon uydurulmaz.

## 10. Alarmlar

- Fiyat alarmı yalnızca **taze, şüpheli olmayan, stokta** tekliflerle tetiklenir.
- Tetiklendikten sonra aynı düşüş için tekrar bildirim gönderilmez: fiyat hedefin **%2 üzerine**
  çıkınca alarm yeniden kurulur; tetiklenmiş alarm, en az 12 saat sonra ve fiyat **%5 daha**
  düşerse bir kez daha bildirir.
- Bildirim kimliği `price-alert:<alarm>:<tetiklenme sayısı>` biçiminde tekildir; aynı olay iki kez
  e-posta üretmez (outbox deseni).

## 11. Ürün eşleştirme

Sıra ve güven puanı:

1. **GTIN/EAN** (sağlama basamağı doğrulanmış) → 0,99, otomatik birleştirme
2. **Marka + MPN** → 0,95 (model numarası ile 0,90)
3. **Marka + ürün ailesi anahtarı** (renk/kapasite/bağlantı türü ayıklanmış başlık) → aynı ürünün
   varyantı, 0,90
4. **Yalnızca başlık benzerliği** → otomatik birleştirilmez; yeni ürün oluşturulur ve **inceleme
   kuyruğuna** aday olarak eklenir
5. Hiçbiri → yeni ürün

Yönetici eşleştirme kuyruğunda adayı onaylar (teklif aday ürüne taşınır) veya reddeder (ayrı
ürün olarak kalır); yanlış eşleşmiş bir teklifi başka bir ürüne/varyanta taşıyabilir. Her karar
denetim kaydına yazılır.
