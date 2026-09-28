# Eln'in Krallığı 🎀

**Boğaz'dan Hazar'a bir Hello Kitty masalı.** Prenses Eln için yapılmış, her gün biraz değişen, defalarca girilecek romantik bir site.

İstanbul'un bir **Kız Kulesi**, Bakü'nün bir **Qız Qalası** var; aradaki 1.758 kilometre bu kalede kapanıyor. Siteye Hello Kitty'nin puantiyeli fiyonkuna dokunarak girilir; içeride dört kanatlı, yirmiden fazla odalı pembe bir kale var.

Kurulum, sunucu ya da derleme gerekmez: düz HTML/CSS/JavaScript. Bütün çizimler kodla (SVG) çizildi, müzik ve sesler tarayıcıda üretiliyor.

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

**Oyun Kanadı**: Gartic Odası, Angela'nın Odası, Bakü'ye Uç (mini oyun), Dilek Gökyüzü, Müzik Kutusu.

**Hazine Kanadı**: Boğaz'dan Hazar'a (harita, saatler, hava, sanal sarılma), Öğretmen Eln'in Sınıfı (sözlük, **Azerbaycanca defter** ve "bana kelime öğret", ödev, aşk sınavı), Hayal Listesi, Aşk Kuponları, Özel Günler, Çıkartma Albümü ve **iyi saklanmış gizli bir kulübe**.

### Kendiliğinden değişenler
- İlk girişte bir kez oynayan **açılış filmi** (yıldızlı gece, iki şehir arasında uzayan bir iplik).
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

## Ayarlar (`private/content.mjs` → `config`)

- `firstMeetDate`: İlk buluşma tarihi belli olunca `'YYYY-MM-DD'` yaz ve paketle. İlk Sarılma odasında gerçek geri sayım başlar, iki Kitty yaklaşmaya başlar; o gün ana salonda kutlama çıkar.
- `ntfyTopic`: Bildirim konusu. Telefonuna ücretsiz **ntfy** uygulamasını kurup bu konuya abone olursan Eln "Seni düşünüyorum"a bastığında, sarıldığında, duvara not yapıştırdığında, kelime öğrettiğinde, mektup yazdığında, mührü açtığında anında haber alırsın.
- `song`: Bizim şarkımızın YouTube kimliği ve bağlantıları.
- Kapı cevaplarını ya da mühür şifresini değiştirmek için `private/secrets.json` → `node tools/vault.mjs pack`. (Kapı cevabı değişirse Eln'in bir kez yeni cevabı yazması gerekir.)

### Özel günleri önceden denemek
Adresin sonuna `?tarih=2027-01-01` (ya da `?tarih=2027-01-01T00:30`) ekleyerek siteyi o güne ışınlayabilirsin. Bu modda bildirim gönderilmez. Bu linki Eln'e gönderme.

---

## Yayınlama (GitHub Pages)

1. **Settings → Pages → Build and deployment → Source:** *Deploy from a branch*.
2. Siteyi içeren dalı ve `/ (root)` klasörünü seçip **Save**.
3. Birkaç dakika sonra: **https://cansuoztrk.github.io/eln/**

Şifre çözme `https://` gerektirir; GitHub Pages bunu sağlar. Mikrofon (Angela, mum üfleme) de `https://` ister.

## Teknik notlar
- Bağımlılık yok. Yazı tipleri Google Fonts'tan (Fredoka, Great Vibes, Caveat, Nunito).
- Hava durumu: [Open-Meteo](https://open-meteo.com/) (anahtarsız). Ulaşılamazsa site sessizce idare eder.
- Telefon için tasarlandı; masaüstünde de çalışır. Hareket azaltma tercihine uyar.

Hello Kitty © Sanrio, Talking Angela © Outfit7. Bu site ticari olmayan, kişisel bir hediyedir; karakterler sevgiyle, hayran çizimi olarak yeniden çizildi.
