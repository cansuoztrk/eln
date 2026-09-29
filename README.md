# Eln'in Krallığı 🎀

**Boğaz'dan Hazar'a bir Hello Kitty masalı.** Prenses Eln için yapılmış, her gün biraz değişen, defalarca girilecek romantik bir site.

İstanbul'un bir **Kız Kulesi**, Bakü'nün bir **Qız Qalası** var; aradaki 1.758 kilometre bu kalede kapanıyor. Siteye Hello Kitty'nin puantiyeli fiyonkuna dokunarak girilir; içeride dört kanatlı, yirmiden fazla odalı pembe bir kale var.

Telefona uygulama gibi kurulabilir (ana ekranda Kitty simgesi, çevrimdışı açılış). Kurulum, sunucu ya da derleme gerekmez: düz HTML/CSS/JavaScript. Bütün çizimler kodla (SVG) çizildi, müzik ve sesler tarayıcıda üretiliyor.

---

## 🔒 Gizlilik: bu depo herkese açık, içerik şifreli

Depo herkese açık olduğu için sitenin **bütün kişisel içeriği** (fotoğraflar, mektuplar, mesaj alıntıları, isimler, tarihler, bildirim adresi) `assets/vault/` içinde **AES-256-GCM ile şifreli** duruyor. Anahtar, kapıdaki sorunun cevabından türetiliyor (PBKDF2-SHA256, 250.000 tur). Doğru cevap yazılmadan ne fotoğraflar ne de yazılar okunabilir; depoya bakan biri sadece boş bir iskelet görür.

- `js/data.js` → herkese açık, kişisel hiçbir şey içermeyen ayarlar (şehirler, kapıdaki soru ve ipuçları).
- `private/` → şifrelenmemiş kaynak. **`.gitignore` içinde, asla git'e girmez.**
- `assets/vault/` → şifreli çıktı. Site bunu okur.
- `tools/vault.mjs` → paketleme/açma aracı (Node 18+).

Eln bir kez doğru cevabı yazınca tarayıcısı anahtarı hatırlar; bir daha sorulmaz.

### İçeriği düzenlemek

1. `private/content.mjs` dosyasını düzenle (bütün yazılar orada, açıklamalı).
2. Fotoğraf eklemek için `private/photos/` içine `ad.jpg` ve küçük hâlini `ad.thumb.jpg` olarak koy.
3. Paketle:
   ```bash
   node tools/vault.mjs pack
   ```
4. `assets/vault/` değişikliklerini commit'le ve gönder.

Anahtar değişmediği için Eln'in tarayıcısı yeni içeriği otomatik açar.

### `private/` klasörü kaybolursa

Şifreli kasadan geri çıkarılabilir:

```bash
VAULT_PASS='kapıdaki cevap' VAULT_SEALED_ILK_SARILMA='mühür şifresi' node tools/vault.mjs unpack
```

Kapı cevapları ve mühürlü mektubun şifresi `private/secrets.json` içinde tutulur (o da git'e girmez). Bunları bir yere not et.

---

## Kalenin kanatları

**Anılar Kanadı**
- **İki Kule Masalı**: Hikâyemiz, çizimli ve sayfaları çevrilen bir masal kitabı. Sonunda açılış filmini tekrar izleme düğmesi var.
- **Sohbetimizden**: Gerçek mesajlarımız, bir telefonun içinde bölüm bölüm, "yazıyor..." balonlarıyla yeniden yazılıyor. Mesaja çift dokununca kalp. Her bölümün sonunda el yazısıyla bir not.
- **Bakü'deki İzlerin**: Duvara yazılan notların fotoğrafları, notun yerini gösteren "Burada!" halkası ve **büyüteç**. Altında Eln'in de not yapıştırabildiği dijital bir duvar.
- **Portre Galerisi**: Kadife duvarlı küçük bir müze; altın çerçeveler, spot ışıkları, müze etiketleri.
- **Anı Duvarı**: İpe asılı polaroidler; fotoğraflar, masal kartları ve Eln'in çizimleri.
- **Bizim Şarkımız**: Pembe bir pikap (plak döner, kol iner), şarkının videosu, plak kapağından bir not ve **anı kasetleri** (sonuncusu henüz boş).

**Kalp Kanadı**
- **Açılınca Oku**: 16 mektup. Bazıları sadece gece, yağmurda ya da belli bir günde açılır. Eln de buradan mektup gönderebilir.
- **Seni Sevmemin Sebepleri**: 100 sebeplik kart destesi.
- **İlk Sarılma**: İki Kitty'nin birbirine yaklaştığı sahne, geri sayım (tarih yoksa Eln hayalindeki tarihi seçer), **Sarılma Bankası** (borç her gün artar), o günün programı, bavul listesi ve ilk buluşmada şifresi söylenecek **mühürlü mektup**.
- **Son Sayfa**: Uzun bir mektup ve kaçan "Hayır" düğmesi.

- **O Gecenin Gökyüzü** (Anılar): Özel gecelerin gerçek yıldız haritaları (gerçek yıldız ve ay konumları hesaplanır). Boğa ve Akrep takımyıldızları pembe. Poster olarak kaydedilebilir.
- **Sesim** (Kalp): Sesli notlar. Ses dosyası eklenene kadar görünmez. Sabahları "günaydın", geceleri "iyi geceler" Kitty'nin kulağında belirir; ruh hâli pencerelerinde, mektuplarda, Sarılma Bankası'nda ses düğmeleri çıkar. Çalarken yazı sesle birlikte ilerler.
- **Kale Telsizi** (Kalp): Canlı kanal. Senin telefonundan yazdığın mesaj Eln'in ekranında anında belirir; "kalp", "sarıl", "öp", "günaydın", "iyi geceler" kelimeleri kalenin havasını değiştirir (kalp yağmuru, titreşimli sarılma...). Eln de buradan kalp, sarılma, yazı ve **sesli not** gönderir.
- **Zaman Kapsülü** (Kalp): Geleceğe mektuplar; açılış gününe kadar mühürlü. Senin iki kapsülün de içinde.
- **Hediye Kapısı** (gizli): Sadece `…/#hediye-kutusu` adresiyle (ör. bir hediye kartındaki QR ile) açılır.

- **Bizim Defter** (Kalp, bulut): İkinizin birlikte yazdığı günlük. Onun mürekkebi pembe, seninki mavi; biri yazınca öbürünün ekranına anında düşer. Aynı gün ikiniz de yazınca "Bugün ikiniz de yazdınız" çıkar.
- **Birlikte** (Kalp, bulut): İkiniz aynı anda kaledeyken: iki yıldız birleşir, **iki kişilik sarılma** (kalp sadece ikiniz birlikte basılı tutarken dolar), ekrandan ekrana **dokunuş** ve kalenin her yerinde hissedilen **kalp atışı**.
- **Kale Kitabı** (Anılar): Masal, sohbetler, açılmış mektuplar, sebepler, portreler, notlar, gökyüzü haritaları, soru defteri ve Bizim Defter tek bir A5 kitapta. "Yazdır → PDF olarak kaydet" ile saklanır ya da bastırılır.

**Zaman Kanadı** (sevdiği bir hikâyeye selam)
- **Kilerdeki Kapı**: Kilerin arkasındaki basamaktan ilişkimizin istediği gününe inilir: o günün olayı, o gecenin gökyüzü ve ayı, günün notu ve sorusu, o gün kaleye gelip gelmediği. Geleceğe kapı açılmaz; kilometre taşı günlerinin notları mühürlüdür, günü gelince açılır. Klavyede gizli bir kod yazmak da kilere düşürür (kasada).
- **Zaman Yolcusu**: Yedi bölümlük görev, her gün bir kapı. Her bölümde küçük bir bulmaca (zaman kadranı, karışmış sohbet, yıldız birleştirme, balon melodisi, duvardaki A+E notu, dağılmış harfler, kaydırmalı resim) ve karşılığında o anın İstanbul tarafındaki hâli. Geçmiş arada bir "direnir".
- **İzleme Kulübü**: Sevdiği diziyi bu sefer birlikte izlemek için sekiz bölüm: senin tahminlerin (o sonunu bildiği için okuyup güler), onun mühürlü notları (sen bölümü bitirene kadar kapalı), iki ekranda aynı anda geri sayım, mendil sayacı, bölüm sonu notları, iki tarafın tepkisi ve finalde bir mektupla "ağlama haritası".
- **Güvercin Postası**: Gerçek güvercin hızıyla (≈22 saat) uçan mektuplar; haritada Karadeniz kıyısı ve Kafkaslar üzerinden izlenir. Alıcı mektubu ancak güvercin varınca okur. Bulut yoksa onun mektupları bildirim servisinin gecikmeli gönderimiyle tam varış saatinde sana düşer.

- **Zambak Bahçesi** (Kalp): Onun çiçeği. Her gün sulanan saksı büyür; her yedi sulamada bir zambak açar, her zambağın yaprağında bir not var. Ana salonda "Zambağın" kartı. Kale Paneli'nden (bulut) ona zambak buketi gönderilir; vazoda durur.
- **Kartpostal** (Kalp, bulut): Her gün iki şehirden birer fotoğraflı kartpostal; ön yüz fotoğraf, arka yüz not, pul ve o günün damgası. Günlük bir ilham cümlesi var. Onun bugünkü kartı, sen kendi kartını gönderene kadar zarfta kalır.
- **Bilet Kumbarası** (Kalp, bulut): İlk buluşmanın bileti için ortak birikim; TL ya da AZN atılır, her atışın notu olur, çeyreklerde kutlama. Birikim arttıkça küçük bir uçak İstanbul'dan Bakü'ye doğru ilerler; "bu hızla şu gün dolar" tahmini ve hedef tarihe yetişmek için günlük gereken miktar gösterilir. Hedef ve kur Kale Paneli'nden.
- **Biniş Kartı** (Kalp, bulut): Bilet alınınca panelden uçuş girilir; onun kalesine zarf içinde bir biniş kartı düşer (yolcu, kalkış/varış, koltuk, "seyahat sebebi"). Kalkışa geri sayım; uçuş günü uçak haritada gerçek saate göre ilerler ("Anadolu'nun üstünde", "Gürcistan'ın üstünde"...), ana salondaki çip "Ardoş uçakta" der, inince kutlama. O "Kapıda bekleyeceğim" diye cevap verir. İlk Sarılma geri sayımı da bu tarihe kurulur.
- **Bakü'de İlk Gün** (Kalp): Uçak indiğinde yaşanacak ilk günün ortak planı. Stilize Bakü haritasında yerler; ikiniz de kalp atar, sabah/öğle/akşam/gece dilimlerine koyar, kendi bildiği yerleri ekler. Rehber o.
- **Ne Zaman?** (Kalp, bulut): Bakü tarihi henüz belli değilken ortak takvim. Önümüzdeki dokuz ay için ikiniz de günlere "uygun / belki / olmaz" dersiniz (tek dokunuş ya da "Aralık" ile iki dokunuşta bir aralık). İkinizin de uygun olduğu günler parlar, kale en iyi aralıkları bulur (bilet için en az iki hafta sonrası), kumbaranın dolacağı gün uçakla işaretlenir. Biri aralık önerir, öbürü kabul edince "hedef" olur (kale sahibinin kasadaki önerisi: Novruz, 19–24 Mart 2027); kumbara o güne göre hesap yapar. Günlerin altında iki okulun takvimi ince çizgilerle durur (kesikli sınav, düz tatil; tahmini olanlar öyle yazıyor).
- **Bakü Günlüğü** (Kalp, bulut): Buluşma günlerinin ortak defteri. Önceden ikiniz de "kavuşunca aç" mektubu yazar; mektuplar uçak Bakü'ye indiği an (biniş kartı yoksa hedefin ilk sabahı) ikisi birden açılır. O günlerde her gün bir sayfa: şifreli fotoğraflar (önizleme hızlı, büyüğü dokununca iner), günün cümlesi, fotoğrafın çekildiği yer. İğnelenen yerler Bakü'de İlk Gün haritasında "Gittik ✓" olur; defter Kale Kitabı'na da girer. Buluşma günlerinde ana salon çipi "Aynı şehirdeyiz · 0 km" der.
- **Sınav Kalkanı** (Kalp, bulut): İkiniz de sınav tarihlerinizi girersiniz (onunkiler Aralık'ta açıklanıyor); sınavlar Ne Zaman? takvimine kesikli çizgiyle düşer. Öbürü sınavdan önce şans tılsımı gönderir (nazar boncuğu, dört yapraklı yonca, uğurlu fiyonk...). Önceki akşam "erken uyu", sınav sabahı ana salonda kart ve sesli "başarılar"; sınav saatinden sonra "Nasıl geçti?".
- **Aynı Sofra** (Kalp, bulut): Görüntülü aramada birlikte yemek. Her yemeğin iki hâli var: İstanbul'da Türk usulü, Bakü'de Azerbaycan usulü (menemen / pomidor-yumurta, tavşan kanı / armudu stəkanda çay, mercimek / mərci şorbası, peynirli gözleme / göyərti qutabı, muhallebi / firni, tereyağlı pilav / qazmaqlı plov). Biri sofrayı kurar, ikiniz de kendi tarifinizi yaparsınız; malzeme, adım ve zamanlayıcılar karşı tarafa canlı görünür (ekran kapanmaz). Sonunda iki tabağın fotoğrafı pembe kareli örtülü bir **sofra kartında** birleşir, birbirinizin tabağına kalp verirsiniz; eski sofralar saklanır.
- **Günün Sesi** (Kalp, bulut): Her gün birbirinize en fazla 20 saniyelik ses; her günün küçük bir sorusu var. Onun bugünkü sesi sen kendi sesini bırakınca açılır. Son 30 gün bir şeritte, ikinizin de ses bıraktığı günler seri olur. Sesler şifreli.
- **21:21** (Kalp, bulut): Her akşam Bakü saatiyle 21:21'de (İstanbul 20:21) iki dakikalık pencere. İkiniz de o dakikada kalbe basarsanız gökyüzüne bir yıldız eklenir; her yedi yıldız adı olan bir takımyıldız olur. Pencere açıkken kalenin her yerinde alttan bir kalp çıkar.
- **Gece Lambası** (Kalp): Kısılabilen Kitty lambası, tarayıcıda üretilen uyku sesleri (yağmur, dalga, rüzgâr, ninni), **Sesimle uyu** (uyuyamadığında, masal ve iyi geceler kayıtları arka arkaya, uyku sesinin üstünde), zamanlayıcı ve "uyuyorum" düğmesi (sana haber gider). Ertesi sabah kaleye ilk gelişte uyku raporu ve günaydın notu.
- **Gerçek Zambaklar**: Bahçesinde her 12 zambakta bir sana çiçekçinin bilgileriyle hatırlatma gelir; panelden "teslim edildi" deyince bahçesine altın bir zambak dikilir.
- **Bizim Şarkımız**: Plak çevrilince **B yüzü**: onun şarkısı.
- **Masalın Devamı** (Anılar, bulut): İki Kule Masalı "Devamı var..." diye biter; devamını ikiniz sırayla, bir iki cümleyle yazarsınız (kalem sırayla geçer, biri 3 gün yazmazsa öbürüne döner). Her altı sayfa bir bölüm; bölümün resmi içindeki kelimelere göre masalın sahnelerinden seçilir. Kale Kitabı'na da bölüm olarak girer.
- **Şarkı Defteri** (Anılar, bulut): Birini hatırlatan şarkılar, adı ve "neden"iyle. Ortak çalma listesi; her gün biri "bugünün şarkısı" olur, YouTube ve Spotify aramasıyla açılır.
- **Fotoğraf Kabini** (Anılar, bulut): İki şehirden dört karelik fotoğraf şeridi. İkiniz de kabindeyken birbirinizi küçük bir pencereden görürsünüz; "Birlikte çek" deyince geri sayım ikinizde aynı saniyede başlar, her karenin bir pozu var ve son kare hep **yarım kalp** (İstanbul sol yarısını, Bakü sağ yarısını yapar; şeritte birleşir, ekranda kesikli çizgiyle yol gösterir). Öbürü yoksa **yarım şerit** bırakılır; o kendi yarısını çekene kadar seninki ona gizli kalır. Pembe, 21:21, Zambak ve İki Kule çerçeveleri; doğal, pembe ve siyah beyaz filtre. Şerit Paylaş'la fotoğraflara kaydedilir. Kamera açılmazsa dört fotoğraf seçilebilir.

**Oyun Kanadı**: **Nərd** (klasik tavla, Bakü'de nərd: yazışmalı oynanır; sıra kimdeyse o oynar, hamle buluta gider ve öbürünün ana salonunda "Nərd: sıra sende" kartı çıkar. İkiniz de oradaysanız zarlar ve pullar karşı tarafta canlı kayar. Kurallar kendiliğinden uygulanır (kırma, bar, toplama, büyük zar kuralı), zarların adı söylenir: şeş beş, düşeş, hep yek... Mars iki sayı, skor saklanır; bulut olmadan da **Kitty'ye karşı alıştırma** var), **Kilitli Kule** (bulut, ikiniz aynı anda: iki kişilik kaçış odası; her kilidin ipucu bir tarafta, kilidi öbür tarafta. Azerbaycanca renk adlarıyla fiyonk kilidi, bir saatlik farkla saat kulesi, Bakü haritasındaki işaretlerle şifre, son kapıda ikinizin aynı anda kalbe basması; her oyun yeniden karışır, en iyi süre saklanır), **Kalp Labirenti** (onun şarkısına: her gün yeni, kalp şeklinde ve çıkmaz sokağı olmayan bir labirent; her yol ortaya çıkar), **Dans Pisti** (bu site için yazılmış bir swing parçasıyla ritim oyunu; ikiniz aynı anda pistteyseniz birlikte dans edip uyumunuzu ölçersiniz), Gartic Odası, **Ortak Tahta** (bulut: aynı tahtaya canlı çizim; biri çizer öbürü tahmin eder, skor saklanır), Angela'nın Odası, Bakü'ye Uç (mini oyun), **Film Gecesi** (davet, ortak geri sayım, puan kartı), Dilek Gökyüzü, Müzik Kutusu.

**Hazine Kanadı**: **Kilit Ekranı** (telefon için duvar kâğıdı: Gece, Pembe, 21:21 ve Zambak temaları; Biniş Kartı'na, hedef tarihe ya da yıldönümüne geri sayım ve bir satır yazı; Paylaş'tan fotoğraflara kaydedilir), **Hazine Avı** (odalara saklanmış dokuz altın anahtar, ipuçlarıyla; dokuzu bulununca sandık açılır, içinden üç gerçek sözlük bir **Altın Bilet** çıkar ve sana haber gelir; sözlerin durumunu panelden güncellersin), **İki Takvim** (senin ders programın, onun kendi girdiği dersleri, iki saat diliminde haftalık tablo ve ikinizin de boş olduğu saatler; ana salonda "Ardoş şu an derste / teneffüste / boşta" çipi), **Kitty Gazetesi** (her sabah yeni sayı: manşet, iki şehrin havası, Boğa & Akrep falı, bulmaca), **Soru Kutusu** (her gün bir soru; cevap sana gelir), **Bizim Özetimiz** (Wrapped tarzı hikâye; ikinizin buluttaki izleriyle: Günün Sesi, 21:21 yıldızları, kumbara, masal sayfaları, kartpostallar, Kilitli Kule süresi, fotoğraf şeritleri, Nərd skoru, ortak sofralar, Bakü Günlüğü'nden yılın fotoğrafı. 21 Mayıs 2027'den sonra **Bizim Yılımız** olur ve "Bir yıl" sesiyle biter), Boğaz'dan Hazar'a, Öğretmen Eln'in Sınıfı (sözlük, Azerbaycanca defter, ödev, aşk sınavı), Hayal Listesi, Aşk Kuponları, Özel Günler, Çıkartma Albümü ve **iyi saklanmış gizli bir kulübe** (içindeki dost her gün mamayla büyür: 5 seviye, seri, aksesuarlar).

**Bu Günlere Özel** (sadece o tarihlerde görünür):
- **Ters Kale**: Senin doğum gününden önceki hafta açılır; Eln sana kart tasarlar ve gönderir.
- **Kış Takvimi**: 6–31 Aralık, her gün bir kapı (mektup, soru, kupon, fotoğraf).
- **Doğum Günü Sarayı**: 23 Nisan haftası; o gün 23 hediye kutusu açılır.
- **Novruz Bahçesi** (16–31 Mart; kale sahibi her zaman önizler, önizlemede buluta yazılmaz): Bayramdan önceki dört salı birer kapı. **Su Çərşənbəsi** (dilek kayığı; iki dilek de suya bırakılınca okunur), **Od Çərşənbəsi** (bir derdi ateşe at, kaydedilmez; üç kez ateşin üstünden atla), **Yel Çərşənbəsi** (fırıldağa mikrofonla üfle ya da dokun; rüzgâr bir not getirir), **Torpaq / Axır Çərşənbə** (birbirinizin kapısına papaq atın, gelen papağı şəkərbura, paxlava... ile doldurun; qulaq falı). Her gün uzayan bir səməni; bayram sabahı kırmızı kurdelesi bağlanır. Buluşma hedefi Novruz'a denk gelirse geri sayım da orada.

### Kendiliğinden değişenler
- **Açılış Töreni**: Eln kaleye ilk kez girdiğinde, açılış filminden önce kapıdaki pembe kurdeleyi makasla o keser. Kapılar açılır, kısa bir mektup gelir (açılış gününe özel ayrı metin) ve sana "kurdeleyi kesti" haberi düşer.
- İlk girişte bir kez oynayan **açılış filmi** (yıldızlı gece, iki şehir arasında uzayan bir iplik).
- **Mevsimler**: Kahraman bölümde kışın kar, baharda yaprak, yazın ateş böceği, sonbaharda yaprak, doğum gününde balon.
- **Posta kutusu**: Sonradan eklediğin mektuplar "Posta var!" diye gelir; Eln bir mektubu ilk kez açtığında sana bildirim düşer.
- **Hava ve aya bağlı mektuplar**: Xəzri esince, Bakü'ye kar yağınca, dolunay gecesi açılanlar. Dolunayda ana salonda "Şu an aya bakıyorum" düğmesi çıkar.
- Her gün yeni **günün fotoğrafı**, **günün notu** ve **şans kurabiyesi**.
- Bakü saatiyle 21:00'den sonra **gece modu**: gökyüzü kararır, çiçek adaları parlar.
- Özel günlerde ana salonda kutlama şeridi ve konfeti.

<details>
<summary><b>Gizli sürprizler (spoiler, Eln'e söyleme)</b></summary>

- Ana salonun en altındaki minicik **pati izi** gizli kulübeyi açar (klavyede adını yazmak da açar).
- Klavyede isimler yazılınca kalp yağmuru, gartic mesajı, peri tozu çıkar; **kitty** yazınca Kitty aşağıdan göz kırpar.
- Sol üstteki Kitty logosuna **4 saniye içinde 7 kez** dokununca bir doğum günü sırrı açılır.
- Mühürlü mektup açılınca albüme **bonus** bir çıkartma eklenir.
</details>

---

## Sesli notları eklemek

19 ses kaydedildi ve kasada (ses seviyeleri eşitlendi: gündüz −17, gece −19 LUFS; orijinaller `private/voices-orijinal/`). Metinler `private/phase3.mjs` → `voices` içinde (19 metin; her birinin yeri, tonu ve süresi yazılı; "Kurdele kesilince" açılış töreninde, "Biniş kartı" zarf açılınca çalar). En kolayı: Kale Paneli → **Ses stüdyosu**'ndan telefonla kaydet ya da dosya seç (en fazla ~2 MB). Stüdyo dosyaları için: dosyaları `private/voices/` içine **id ile aynı adla** koy (`gunaydin.m4a`, `iyi-geceler.m4a`, `masal.m4a`...; m4a, mp3, ogg, webm, wav olur) ve `node tools/vault.mjs pack` çalıştır. Sesler de şifrelenir. Dosyası olmayan ses sitede hiç görünmez.

## Kale Telsizi'ni kullanmak

Eln'e canlı mesaj göndermek için tarayıcıda `https://ntfy.sh/<liveTopic>` sayfasını aç (konu adı `private/content.mjs` → `config.liveTopic`) ve mesaj yaz. Eln sitedeyse mesaj anında ekranında belirir; değilse bir sonraki gelişinde (12 saate kadar) görünür. Eln kaleye geldiğinde sana gelen "şu an kalede" bildirimine dokununca da bu sayfa açılır.

## İki kişilik kale (bulut)

Bizim Defter, Birlikte, Ortak Tahta, canlı posta ve iki taraflı Soru Kutusu için ücretsiz bir [Supabase](https://supabase.com) projesi kullanılır. Buluta giden **her kayıt ve her canlı mesaj kasa anahtarıyla şifrelenir**; sunucu sadece anlamsız metin görür. Bulut ayarı yoksa bu odalar hiç görünmez, site eskisi gibi çalışır.

1. supabase.com'da ücretsiz hesap aç → **New project** (bölge: Frankfurt ya da yakın bir yer).
2. Proje açılınca **SQL Editor → New query**: `tools/supabase.sql` dosyasının içeriğini yapıştır → **Run**.
3. **Project Settings → API** sayfasından **Project URL** ve **anon public** anahtarını al.
4. Ya Kale Paneli'ndeki **Ortak kaleyi bağla** bölümüne yapıştır (dener ve bağlar), ya da `private/content.mjs` → `config` içine ekle ve paketle (iki telefon da kendiliğinden bağlanır; en sağlamı bu):
   ```js
   cloud: { url: 'https://xxxx.supabase.co', key: 'anon-anahtar', space: 'kale' },
   ```
   ```bash
   node tools/vault.mjs pack
   ```

Bu ayar da kasanın içinde şifreli durur. (anon anahtarı zaten tarayıcıya açık olmak için yapılmıştır; asıl koruma içeriğin şifreli olması.)

### Kale sahibi modu

Kapıya Eln'in cevabı yerine **sahip şifresini** (`private/secrets.json` → `owner`) yazınca kale seni tanır: başlıkta "Kale sahibi" rozeti çıkar, bildirimler kendine gönderilmez ve **Kale Paneli** açılır. Panelden kod yazmadan:
- **Canlı posta**: Mektup yaz; onun Mektuplar odasına anında düşer ("Posta var!"). Tarih seçersen o güne kadar mühürlü kalır.
- **Günün sorusu**: Sen de cevapla; ikiniz de cevaplayınca yan yana görünür.
- **Günün notu**: Seçtiğin günün ana salondaki notunu yaz.
- **Fotoğraf**: Anı Duvarı'na şifreli fotoğraf as.
- **İlk buluşma tarihi**: Belli olunca yaz; geri sayım ve kutlama kendiliğinden başlar.
- **Zambak gönder**: 1–21 zambaklık buket ve kartı; onun vazosuna düşer.
- **Ders durumun**: devam ediyor / tatildeyim / sınav haftası.
- **Ses stüdyosu**: Sesli notların metni ekranda; okuyarak kaydet ya da bir ses dosyası seç. Şifrelenip onun kalesine düşer.
- **Gerçek zambaklar**: Bahçesindeki zambak sayısı, çiçekçi bilgileri, "sipariş verdim / teslim edildi".
- **Altın Bilet**: Basılı kitap, pembe kutu, iki kulenin bileti: hazırlanıyor / yolda / teslim edildi.
- **Bilet Kumbarası**: Hedef ve AZN kuru.
- **Teslim** (panelin en üstünde): canlı kontroller (bulut uyanık mı, bildirim konusu ve **Dene** düğmesi, kasadaki ses sayısı), ona göndereceğin hazır mesaj (**Mesajı kopyala**), **Töreni önizle**, **Kale turunu önizle** ve teslim listesi. Kurdeleyi kestiğinde burada tarihiyle yazar ve sana bildirim gelir.
- **Biniş Kartı**: Bileti alınca uçuş günü, kalkış (İstanbul) ve varış (Bakü) saati, uçuş no, koltuk, dönüş günü ve karta bir not. **Zarfı önizle** ile onun göreceği anı önceden görürsün; "Kartı geri al" ile kaldırılır.
- **Gerçek zambaklar** bölümünde çiçekçi için hazır Azerbaycanca sipariş mesajı.
- **Bulut bağlantısı**: Supabase adresini ve anahtarını dener, bu telefonda açar ya da onun telefonu için şifreli bir bağlantı linki üretir.
- Onun son hareketleri: cevaplar, defter sayfaları, telsiz mesajları.

Sahip şifresi Eln'le paylaşılmamalı. Dizinin sonunu bilmeyen kale sahibi için **spoiler kalkanı** var: İzleme Kulübü'nde son bölüm birlikte bitene kadar sonu anlatan metinler ondan gizlenir. Bulutu denemek için adresin sonuna `?bulut=deneme` eklersen aynı tarayıcıdaki iki sekme arasında çalışan sahte bir bulut açılır.

## Ayarlar (`private/content.mjs` → `config`)

- `firstMeetDate`: İlk buluşma tarihi belli olunca `'YYYY-MM-DD'` yaz ve paketle. İlk Sarılma odasında gerçek geri sayım başlar, iki Kitty yaklaşmaya başlar; o gün ana salonda kutlama çıkar.
- `ntfyTopic`: Bildirim konusu. Telefonuna ücretsiz **ntfy** uygulamasını kurup bu konuya abone olursan Eln "Seni düşünüyorum"a bastığında, sarıldığında, duvara not yapıştırdığında, kelime öğrettiğinde, mektup yazdığında, mührü açtığında anında haber alırsın.
- `song`: Bizim şarkımızın YouTube kimliği ve bağlantıları. `song2`: plağın B yüzü (onun şarkısı).
- `schedule`: Ders programın (İstanbul saatiyle; `private/phase5.mjs`). Dönem başı/sonu ve resmî tatiller de orada. Tatilde ya da sınav haftasında Kale Paneli'nden "Ders durumun"u değiştirebilirsin.
- Ana salonun en altında **Kalenin rengi**: pudra, şeker, gül kurusu, fuşya, şeftali.
- Kapı cevaplarını ya da mühür şifresini değiştirmek için `private/secrets.json` → `node tools/vault.mjs pack`. (Kapı cevabı değişirse Eln'in bir kez yeni cevabı yazması gerekir.)

### Özel günleri önceden denemek
Adresin sonuna `?tarih=2027-01-01` (ya da `?tarih=2027-01-01T00:30`) ekleyerek siteyi o güne ışınlayabilirsin. Bu modda bildirim gönderilmez. Bu linki Eln'e gönderme.

---

## Kaleyi teslim etmek

1. Panel → **Teslim**: bulut satırı yeşil mi, 19/19 ses kasada mı? ntfy uygulamasında yazan konuya abone ol ve **Dene**'ye bas.
2. Kendi telefonunda bir kez **Töreni önizle** ve **Kale turunu önizle**.
3. **Mesajı kopyala** ve gönder. Kapıda Kitty, Bakü'deki not duvarına ikinizin adını nasıl yazdığını sorar; cevap büyük-küçük harf, boşluk, kalp ya da "ve" ile farklı yazılsa da kabul edilir, iki yanlıştan sonra ipucu gelir.
4. O kurdeleyi kesince bildirim gelir. Tören mektubu teslim gününe göre değil, tanışma yıldönümüne göre seçilir: 6 Aralık'ta girerse yıldönümü mektubu, başka her gün genel mektup. Açılış filminden sonra Kitty ona ana salonu gezdirir (spot ışığıyla dokuz adım; "Sonra" derse turu başlatan bir kart kalır). İlk 45 gün ana salonda her gün **Bugünün keşfi**: henüz girmediği odalardan bir öneri (masal, sebepler, sesin, Günün Sesi, 21:21, Fotoğraf Kabini, Nərd Okulu, çikolata sofrası...).
5. 6 Aralık yine bir sürpriz: buket ve QR'lı kart gizli Hediye Kapısı'nı açar; aynı sabah "Tanışmamızın ilk yılı" sesi ve Kış Takvimi başlar.

Nərd'e ilk girişinde onu **Nərd Okulu** karşılar (tavlayı unuttuğu için): tahtada yedi kısa ders (yön ve zar, çift zar, kapalı hane, kırmak, bardan giriş, toplamak, kazanmak ve mars), her dersin küçük bir görevi var; bitirince diploma çıkartması ve Kitty ile ilk maç. Her oyunda **İpucu** düğmesi en iyi hamleyi gösterir. Aynı Sofra'da **çikolata sofrası** (mozaik pasta & kartoşka, ikisi de fırınsız) "Elnoş'un favorisi" olarak en başta durur.

## Yayınlama (Netlify)

Adres: **https://elnin-kralligi.netlify.app** (hediye kartındaki QR bu adrese gider). Dala her gönderimde Netlify siteyi kendiliğinden günceller.

1. [netlify.com](https://www.netlify.com)'da ücretsiz hesap aç (GitHub ile girmek en kolayı; site adresinde GitHub adın görünmez).
2. **Add new site → Import an existing project → GitHub** → bu depoyu seç.
3. **Branch to deploy:** siteyi içeren dal. **Build command:** boş. **Publish directory:** `.` (`netlify.toml` zaten ayarlıyor) → **Deploy**.
4. **Site configuration → Change site name:** `elnin-kralligi` → adres `https://elnin-kralligi.netlify.app` olur.
5. Bundan sonra dala her gönderimde site kendiliğinden güncellenir.

Başka bir ad seçersen hediye kartındaki QR'ı ve `index.html`'deki `og:image` adresini ona göre değiştir. GitHub Pages da çalışır (Settings → Pages → dal ve `/ (root)`), ama adres `kullanıcıadı.github.io` olur.

Şifre çözme `https://` gerektirir; Netlify bunu sağlar. Mikrofon (Angela, mum üfleme, sesli notlar) de `https://` ister.

## Teknik notlar
- Bulut listeleri her zaman en yeni kayıtları getirir (varsayılan 500). Ağır veriler ayrı kayıtta durur ve sadece gerektiğinde iner: Günün Sesi sesleri (`dvaudio`), panelden yüklenen sesler (`vaudio`), kartpostalların büyük fotoğrafı (`pcimg`), Bakü Günlüğü'nün büyük fotoğrafları (`kfull`). Böylece bir yıl sonra bile kale her açılışta birkaç MB'tan fazlasını indirmez (Supabase ücretsiz planında aylık 5 GB trafik var).
- Derleme yok. Tek dış kütüphane `js/vendor/supabase.js` (supabase-js, MIT), sadece bulut ayarı varsa yüklenir. Yazı tipleri Google Fonts'tan (Fredoka, Great Vibes, Caveat, Nunito).
- Hava durumu: [Open-Meteo](https://open-meteo.com/) (anahtarsız). Ulaşılamazsa site sessizce idare eder.
- Telefon için tasarlandı; masaüstünde de çalışır. Hareket azaltma tercihine uyar.

Hello Kitty © Sanrio, Talking Angela © Outfit7. Bu site ticari olmayan, kişisel bir hediyedir; karakterler sevgiyle, hayran çizimi olarak yeniden çizildi.
