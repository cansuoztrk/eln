# Eln

Yalnızca bir kişi için yazılmış, her gün kendini yenileyen bir sayfa.

Tasarım dili **“Pembe Zambak”**: Bakü saatine göre gündüz pudra pembesi, gece koyu gül rengi, canlı bir ipek arka plan; koddan çizilmiş benekli pembe zambaklar, gül altını ayrıntılar, el yazısıyla yazılan adlar, mum mühürlü kâğıt zarflar.

## Neler var

**Açılış.** Karanlık ipeğin üstünde, saten kurdeleyle bağlanmış, mührünün altına kurutulmuş bir zambak sıkıştırılmış bir zarf duruyor. Eln mühre parmağını basılı tutunca kalp atışını duyar (telefon da atar). Mühür kırılır, zarf açılır, mektupta adı el yazısıyla kendiliğinden yazılır. Sonra mektup yıldız tozuna dönüşür ve gökyüzünde onun adı olur. Köşelerdeki zambaklar o an açar.

**Her gün değişenler** (Bakü tarihine göre):
- günün notu (118 tane), günün sorusu (180 tane; cevap verince benim cevabım da açılır), günün sebebi (100 sebep, her gün bir yenisi açılır), günün şarkısı (30 Türkçe şarkı),
- günün melodisi: sayfada çalan piyano her gün o güne özel yeniden yazılır,
- karşılama cümlesi, gündüz/gece teması, ayın gerçek evresi, Bakü ve İstanbul’un o anki saati ve havası.

**Özel günler** kendiliğinden gelir: her ay bizim günümüz, doğum günleri, tanışma ve yıl dönümü, 14 Şubat, yılbaşı, Novruz. Gün içinde bizim saatimizde küçük bir an olur.

**Bölümler:** Bugün · Hikâyemiz (ilk bildirimden bugüne) · Mesafe (basılı tutunca 1.758 km sıfırlanır) · Mektuplar (özlediğinde, üzgün olduğunda, uyuyamadığında… ve tarihi gelince açılanlar; biri sadece gece yarısından sonra, biri sadece Bakü’de yağmur yağarken açılır) · Sen de bana yaz (mühürleyip gönderir) · Sebepler · Şarkılarımız · Cevap defteri · Bir gün (zambak biçiminde bir takımyıldızı, 2036’dan bir mektup, bir sonraki yıl dönümünde açılan zaman kapsülü) · Son söz (imza el yazısıyla çizilir).

**Küçük ayrıntılar:** sayfa aşağı indikçe alttaki şeritte İstanbul–Bakü mesafesi kapanır ve sonunda 0 olur; arada bir kayan yıldız geçer, dokununca dilek tutulur; gece lambası mum ve ninniyle uyutur; sekmeden çıkınca başlık “Seni bekliyorum…” olur; monograma uzun basınca küçük bir sır çıkar.

## Gizlilik

Depo herkese açık. Bu yüzden bütün kişisel içerik (yazılar, tarihler, el yazısı adlar, fotoğraflar) `kasa/` içinde **AES-256-GCM ile şifreli** durur. Anahtar depoda yoktur; Eln’e gönderilen bağlantının `#k=…` kısmındadır. O kısım hiçbir sunucuya gitmez, tarayıcıda kalır ve bir kez açılınca hatırlanır.

- `ozel/` → şifrelenmemiş kaynak ve anahtar. **`.gitignore` içinde, asla git’e girmez.**
- `kasa/` → şifreli çıktı. Site bunu okur.
- `tools/muhur.mjs` → şifreleme aracı (Node 18+).

Bağlantıyı kaybetmeyin: anahtar olmadan içerik açılmaz.

## İçeriği değiştirmek

`ozel/` klasörü bu bilgisayarda yoksa önce kasadan geri açılır:

```bash
KASA_ANAHTAR="<bağlantıdaki k= değeri>" node tools/muhur.mjs ac
# ozel/icerik.json oluşur; düzenleyip ozel/icerik.mjs olarak (export default {...}) kaydet
```

Sonra:

```bash
node tools/muhur.mjs muhurle   # ozel/ → kasa/
```

Fotoğraf eklemek için `ozel/foto/<ad>.jpg` koy, `icerik.mjs` içindeki `fotolar` listesine `{ id: '<ad>', not: 'altyazı' }` ekle, mühürle. Fotoğraf varsa “Yüzün” bölümü ve açılıştaki belli belirsiz portre kendiliğinden görünür.

El yazısı adlar `tools/el-yazisi.mjs` ile Great Vibes yazı tipinden üretilir (açıklaması dosyanın başında).

## Yayınlamak

Statik bir sitedir; derleme gerekmez. GitHub Pages’te: **Settings → Pages → Deploy from a branch**, bu dalı (ya da birleştirildiği `main`’i) ve `/ (root)` klasörünü seç. Cloudflare Pages ya da Netlify’da da kök klasörü yayınlamak yeterli.

Eln’e gönderilecek bağlantı: `https://<site adresi>/#k=<anahtar>`

## Denemek için

Yerelde: `npx http-server -p 8123 .` sonra `http://127.0.0.1:8123/#k=<anahtar>`

- `?gun=2027-01-01` başka bir günü gösterir (`?gun=2027-01-01T20:00` saatle birlikte)
- `?tema=acik` / `?tema=koyu` temayı zorlar
- `?yagmur` Bakü’de yağmur yağıyormuş gibi yapar

Yazı tipleri (Cormorant Garamond, Manrope, Great Vibes) SIL Open Font License ile `assets/yazi/` içinde.
