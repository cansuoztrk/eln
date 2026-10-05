# Kızıl Kapsül

İstasyon patlamadan önce kaçış kapsülüne binecek **3 temiz kişiyi** bulmaya çalıştığınız sosyal çıkarım oyunu. Habbo için tasarlandı; bu depo onu tam bir web oyununa çeviriyor.

Site üç bölümden oluşur:

| Bölüm | Ne işe yarar |
| --- | --- |
| **Ana sayfa** | Hikâye, roller, tur akışı, Kaptan'ın kumarı, final ve yeni mekanikler. Habbo'da oda kurulum rehberi. |
| **Simülasyon** (`#oyna`) | Botlara karşı tek kişilik oyun. Botlar kanıtları tartar, yalan söyler, birbirini suçlar. |
| **Kurucu Paneli** (`#kurucu`) | Oyunu Habbo'da yöneten kişi için: rol dağıtımı, kopyalanabilir fısıltılar, tur tur yardımcı, O₂ hesabı, sayaç, final. |

## Çalıştırma

Derleme adımı yok, bağımlılık yok. `index.html` dosyasını açmak yeterli. Yerel sunucu ile:

```sh
python3 -m http.server 8000
# http://localhost:8000
```

GitHub Pages'te yayınlamak için deponun ayarlarından Pages kaynağını kök dizin olarak seçmek yeterli.

## Oyun kuralları (özet)

**Roller:** Mürettebat, Suikastçı (ana hain, oylama gecelerinde öldürür), Yancı (Suikastçı'yı tanır), Halüsinatif (masum ama algısı bozuk: Kabin ya da Şalter laneti), Gizli Kaptan (oylama kararını verir). İsteğe bağlı **Medik** genişleme rolü.

**Her tur:**
1. **Kabin turu** — 2 kişi gizli bir kelime duyar. Masumlar aynısını, hain aynı kategoriden farklısını, kabin lanetli halüsinatif alakasız bir kelime duyar. 3-2-1 ile aynı anda söylerler.
2. **Şalter odası** — 3 kişi tek tek girer. Şalterler kırmızı başlar; panel sadece kaç tanesinin yeşil olduğunu gösterir.
3. **Telefon** — Halkın seçtiği kişi doğru bir bilgi alır ve duyurur. Hainse çarpıtabilir.
4. **Kaptan'ın kararı** — PAS (kimse elenmez, gece güvenli) ya da OYLAMA (en çok oyu alan atılır, gece Suikastçı öldürebilir, Kaptan yetki kazanır).

**Final:** Kaptan en az bir oylama başlattıysa 1. koltuğu kendisi seçer, kalanları halk seçer. Kapsülde tek hain varsa kapsül patlar.

## Eklenen mekanikler

- **Oksijen saati:** her tur %20, kırmızı kalan her şalter %6 daha. %0 olunca final.
- **10 istasyon olayı:** Sızıntı, Yedek Tüp, Radyo Paraziti, Çift Hat, Güç Dalgalanması, Güvenlik Kamerası, Karantina, Kızıl Alarm, Çift Kabin, Sakin Vardiya.
- **Gizli halüsinatif** (varsayılan): halüsinatif kendini Mürettebat sanar. Rolünü bilseydi şalter lanetini kolayca telafi ederdi; bu yüzden varsayılan böyle. Ayarlardan değiştirilebilir.
- **Sessiz gece kanıtı, kimlik taraması, kendine oy yok, Medik.**
- **Simülasyona özel:** ARIA taktik bilgisayarı, seyir defteri, şüphe panosu, hayalet modu, kara kutu (kim ne zaman yalan söyledi), 13 rozet.

## Botlar nasıl düşünüyor?

`assets/js/inanc.js` her bot için olası bütün rol dağılımlarını ("dünyalar") sayar. Her kabin sonucu, şalter paneli, telefon duyurusu ve gece olayı, her dünyada ne kadar olası olduğuna göre bu dünyaları yeniden ağırlıklandırır. Botun şüphesi bu dağılımdan gelir. Beceri düştükçe bot kanıtı daha az ciddiye alır ve kişisel önyargısı büyür. Zorluk karşı takımın becerisini belirler.

## Dosya yapısı

```
index.html               sayfa iskeleti ve içerik
assets/css/kapsul.css    görsel sistem
assets/js/veri.js        roller, kelime bankası, olaylar, bot replikleri
assets/js/inanc.js       çıkarım motoru
assets/js/motor.js       oyun motoru (DOM'a dokunmaz)
assets/js/oyun-arayuz.js simülasyon arayüzü, kara kutu, rozetler
assets/js/kurucu.js      Kurucu Paneli
assets/js/ses.js         Web Audio ile sentezlenen sesler
assets/js/piksel.js      piksel mürettebat portreleri
assets/js/ana.js         yönlendirme ve kurulum formu
tests/                   motor simülasyonu ve tarayıcı testleri
```

## Testler

```sh
node tests/simulasyon.js 400                     # 400 botlu oyun: hata ve denge istatistikleri
NODE_PATH=$(npm root -g) node tests/arayuz-oyna.js http://localhost:8000/index.html
NODE_PATH=$(npm root -g) node tests/kurucu-akisi.js http://localhost:8000/index.html
```

Tarayıcı testleri Playwright ister. `arayuz-oyna.js` her rolde bir oyunu baştan sona oynar; `kurucu-akisi.js` Kurucu Paneli'nde bir oyunu finale kadar yönetir.

İyi olan kazansın.
