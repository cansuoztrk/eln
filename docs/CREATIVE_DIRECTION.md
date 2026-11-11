# CREATIVE_DIRECTION — Yaratıcı yön

## Tek cümle

> İstanbul'dan Bakü'ye, kalbimde sana ait küçük bir evren.

Bir web sitesi değil; içine girilen, sessiz, sıcak, kişiye özel bir **küçük dünya**.

## Üç fikir

1. **Pembe alacakaranlık.** Uzay siyah değil. Bu evrenin gecesi sıcak, gül kurusu bir
   alacakaranlık: koyu taupe–mürdüm zemin, şampanya ve inci rengi yıldızlar. Gündüzü ise
   fildişi kâğıt, pudra ışık. İki şehir, aynı gökyüzü — sitenin iki hali de bu gökyüzünün saatleri.
2. **Kâğıt ve kurdele.** Dijital ama elde tutulur hissi: zarf, mühür, polaroid, kurdele,
   el yazısı kenar notu. Her etkileşim bir şeyi *açmak* gibi hissettirir, tıklamak gibi değil.
3. **Az ve dürüst.** Tek bir doğru cümle, bir paragraf süsten güçlüdür. Tek bir iyi
   zamanlanmış hareket, on efektten güçlüdür. Boşluk bir tasarım öğesidir.

## Ses

Arda konuşur; birinci tekil, sakin, abartısız. Eln'e hitap "Eln".
Arayüz Eln'e hiçbir şey *yaptırmaz*: "istersen", "ne zaman istersen", "keşfet".
Bölüm başlıklarının üstünde küçük İngilizce etiketler durur (OUR STORY, LETTERS…):
Eln'in alanına küçük bir selam, aynı zamanda editoryal bir ritim.

## Görsel kimlik

- **Renk:** pembe duygunun rengi (vurgu, an, dokunuş); nude ve ivory zemini taşır;
  rose gold ve şampanya yalnızca özel parçalarda (mühür, kurdele ucu, yıldız, ince çizgi).
- **Tipografi:** Başlık — Cormorant Garamond (ince, italik anlar). Gövde — DM Sans.
  Mektup ve kenar notu — Caveat (el yazısı). Üç aile, başka font yok.
- **Çizim dili:** tek kalınlıkta ince çizgi + yumuşak dolgu. Fiyonk, kurdele, minik kedi
  kulağı, yıldız, kalp. Hepsi özgün SVG. Lisanslı karakter çizimi yok; "Hello Kitty sevgisi"
  fiyonk + kedi silüeti + pastel sticker estetiğiyle *çağrıştırılır*, kopyalanmaz.
- **Fotoğraf:** her zaman gerçek. Geniş beyaz pay, ince çerçeve, polaroid. Fotoğrafın
  üstüne metin bindirilmez; fotoğraf süs değil, öznedir.

## Hareket

| İlke | Uygulama |
| --- | --- |
| Hareket bir şeyi anlatır | Açılma, ortaya çıkma, bağlanma. Dekoratif döngü yok denecek kadar az. |
| Yavaş ve yumuşak | Giriş 800–1400 ms, `cubic-bezier(.22,1,.36,1)`. Zıplama/yay yalnızca Kitty Corner'da. |
| Tek kahraman | Her ekranda aynı anda yalnızca bir öğe dikkat ister. |
| Dokunuşa cevap | Hover/tap 150–250 ms; mikro ölçek, ışık kayması, kurdele kıpırtısı. |
| Saygı | `prefers-reduced-motion` → yalnızca opaklık geçişi. Mobilde parçacık sayısı düşer, parallax kapanır. |

Hedef 60 FPS: yalnızca `transform` ve `opacity` canlandırılır; canvas parçacıkları
görünür değilken durur; 3D yalnızca `/universe` içinde ve istenince yüklenir.

## İmza anlar

1. **The Gift — ilk karşılaşma.** Altı sahne: sessiz başlangıç → alacakaranlık ve yıldızlar →
   Eln'in fotoğrafı ışıkla belirir → "Bu küçük dünyayı senin için hazırladım." → kurdeleli
   zarf (çöz, aç, oku) → ışık genişler, dünyaya geçilir. Müzik yalnızca istenirse.
2. **Işık ipi.** İstanbul ile Bakü arasında ince, parlayan bir yay. Ana sayfada, Beyond
   Distance'ta ve galakside tekrarlayan motif: mesafe bir boşluk değil, bir bağ.
3. **Zarf.** Her mektup kapağı açılan, kâğıdı yükselen bir zarftır. Kilitli olan mühürlüdür.
4. **Memory Universe.** Her anı bir yıldız; kategoriler takımyıldız; seçilen yıldız açılır.
5. **166 gün.** Tanışma ile sevgili oluş arasındaki dönem, hikâyede bir köprü sahnesi olarak durur.

## Yapılmayacaklar

- Her yere kalp/yıldız yağdırmak, sürekli dönen şeyler, neon pembe, glitter.
- Çocuksu bir site: sevimlilik Kitty Corner'da yoğunlaşır, geri kalan zarif kalır.
- Karanlık desenler: sayaçla suçluluk, "seni bekliyorum" bildirimi, seri kırılması.
- Stock fotoğraf, AI görseli, lisanssız karakter görseli.
