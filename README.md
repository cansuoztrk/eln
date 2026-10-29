# ASLAN 2035 OMEGA

**The Ultimate Interactive Stadium Civilization** — RAMS Park'ın geleceğini yeniden düşünen sinematik dijital dünya, mimari simülasyon ve taraftar deneyimi platformu.

> **Bir Efsaneyi İzleme. Geleceğini Tasarla.** — *Don't Just Witness a Legend. Design Its Future.*

> ⚠️ **Bağımsız konsept çalışması.** Bu proje Galatasaray SK, RAMS veya ilgili kurumlarla bağlantılı ya da onaylı değildir; resmî bir dönüşüm projesi değildir. Uygulamada doğrulanmış bilgiler, önerilen tasarımlar ve simülasyonlar her yerde ayrı etiketlerle gösterilir.

---

## İçindekiler

1. [Ne yapar?](#ne-yapar)
2. [Doğruluk ve etiket sistemi](#doğruluk-ve-etiket-sistemi)
3. [Kurulum ve geliştirme](#kurulum-ve-geliştirme)
4. [Dağıtım](#dağıtım)
5. [İsteğe bağlı AI Architect sunucusu](#isteğe-bağlı-ai-architect-sunucusu)
6. [Mimari](#mimari)
7. [Performans ve erişilebilirlik](#performans-ve-erişilebilirlik)
8. [Testler ve test durumu](#testler-ve-test-durumu)
9. [Bilinen sınırlar ve sonraki adımlar](#bilinen-sınırlar-ve-sonraki-adımlar)
10. [Kaynaklar](#kaynaklar)
11. [Aşama 1 — Temel ürün: durum raporu](#aşama-1--temel-ürün-durum-raporu)
12. [Aşama 2 — Mimari tasarım motoru: durum raporu](#aşama-2--mimari-tasarım-motoru-durum-raporu)
13. [Son test sonuçları](#son-test-sonuçları)

---

## Ne yapar?

Stadyum tek bir bina olarak değil, birbirine bağlı alanlardan oluşan bir **dijital ekosistem** olarak ele alınır. Bütün modüller **tek bir prosedürel 3D modeli** (master digital twin) ve **tek bir tasarım veri modelini** (`DesignConfig`) paylaşır; bir modülde yapılan seçim diğer tüm modüllere ve 3D dünyaya yansır.

| Sistem | Modül | Öne çıkanlar |
|---|---|---|
| **Omega Experience** | Ana sayfa | İlk ziyarette atlanabilir sinematik açılış: 7,5 sn kamera uçuşu, sinema bantları ve uçuşla eşzamanlı başlık sekansı, ışığın kademeli belirmesi; ardından fare parallax'ı ve 5 çalışan CTA |
| **Stadium World** | Walkable Stadium | Explorer (sınırlı orbit) ve Walkthrough (10 gezinti noktası, güvenli yürüme yarıçapı, kararma geçişleri, klavye); gece / alacakaranlık / gündüz arasında yaklaşık 1,5 sn'lik yumuşak geçiş |
| | Master Digital Twin | 15 bağımsız katman, Exploded Architecture (katman odaklama + geri dönüş), analitik **kavramsal kesit**, Object Inspector; klavyeyle kullanılabilen **bölge ve bileşen gezgini** (kase, bina kabuğu, çevre — 15 katman + 23 parça), fare üzerinde durunca bileşen adı |
| | Stadium City | Şematik master plan; alana tıklayınca kamera geçişi ve açıklama, kapalı alanları tasarıma ekleme |
| **Design Engine** | Stadium DNA Engine | 5 DNA (Classic Evolution, Red & Gold Icon, Pure Architecture, Future Arena, Green Stadium), birleştirilebilir parametreler, **kilitler**, değişiklik onayı, **çakışma kuralları** ve tek tıkla alternatifler |
| | Material Lab | 8 konsept malzeme × 4 bileşen; malzeme kartları; A/B canlı önizleme ve yan yana görsel |
| | Light Show Composer | 6 özgün gösteri, renk/yoğunluk/hız/kapsam/LED/profil, başlangıç-bitiş sahneleri, sıralanabilir zaman çizelgesi; **≤1,2 Hz fotosensitivite sınırı** |
| | AI Architect | Doğal dil → desteklenen parametreler; açıklama, bilinmeyenler, kısıtlar, geri alma. Varsayılan **kural tabanlı demo**; isteğe bağlı sunucu tarafı AI |
| | Time Machine | Kullanıcının tasarımından türetilen 5 aşama; fayda, bağımlılık, karmaşıklık, risk, geçiş şartları |
| | What-If Engine | 6 hazır soru, 2–3 senaryo, aynı modelden yan yana görseller, parametre farkları, “neyi göstermez” notları |
| **Stadium Intelligence** | Stadium OS | 7 modül; seçilen modülün katmanları 3D'de vurgulanır; tüm veriler “Simülasyon” etiketli |
| | Crowd Flow Simulator | Şematik ağda ajan tabanlı akış, kapı kuyrukları, 3 güzergâh stratejisi, ısı haritası, 3D projeksiyon |
| | Green Stadium Engine | Mevcut çatı GES'i (doğrulanmış) + 6 çevresel sistem; birimsiz örnek endeksle senaryo karşılaştırma |
| | Scenario Economy | A/B/C senaryoları; **para değeri üretilmez** |
| | Project Roadmap | 7 aşama, “gerektirir / faydalanır” bağımlılık diyagramı |
| **Fan Universe** | Matchday & Atmosphere | 6 atmosfer; ışık, doluluk, koreografi ve **tarayıcıda sentezlenen özgün ses** (başlangıçta kapalı) |
| | Seat Experience 360 | 48 blokluk konsept plan, iki koltuk, kamera geçişi, yaklaşık uzaklık/açı/C-değeri, yan yana görüş |
| | Fan Journey Builder | 6 persona, düzenlenebilir plan, 3D tur, Markdown dışa aktarma |
| **Studio** | Design Archive | Adlandırılmış kayıtlar, sürümler, karşılaştırma, oturum geçmişi, JSON içe/dışa aktarma |
| | Concept Gallery | Sabit bakış noktalarından konsept görseller ve lightbox |
| | Share & Export | Paylaşılabilir bağlantı, JSON, Markdown özet, 1920×1080 PNG |
| | Presentation Mode | 10 slaytlık tam ekran sunum; kontrollü kamera, belirsizlik notları |
| | Project Report | Yazdırılabilir rapor (PDF), 6 3D görsel, HTML indirme |

## Doğruluk ve etiket sistemi

| Etiket | Anlamı |
|---|---|
| `DOĞRULANMIŞ` | Kaynağı belirtilmiş mevcut durum bilgisi (Kaynaklar & Varsayımlar modülü) |
| `KONSEPT` | Önerilen tasarım; mevcut durumu göstermez |
| `SİMÜLASYON` | Örnek veri; gerçek ölçüm değildir |
| `MÜHENDİSLİK DEĞERLENDİRMESİ GEREKİR` | Yapısal/teknik doğrulama gerektiren öneri |
| `DEMO` | Sınırlı demo işlevi (ör. kural tabanlı AI Architect) |

İlkeler: maliyet tahmini yapılmaz; malzemeler için yangın/taşıyıcılık/enerji değeri verilmez; kalabalık simülasyonu tahliye hesabı değildir; iç mekânlar ve çevre yerleşimi şematiktir; sesler özgün sentezdir; LED içerikleri özgün metinlerdir (sponsor/yayın içeriği yoktur); kulüp logosu kullanılmaz.

## Kurulum ve geliştirme

Gereksinimler: Node.js ≥ 20 (22 ile test edildi), npm.

```bash
npm install          # bağımlılıklar
npm run dev          # http://localhost:5173 geliştirme sunucusu
npm run typecheck    # TypeScript kontrolü
npm test             # birim testleri (Vitest)
npm run build        # tip kontrolü + üretim derlemesi → dist/
npm run preview      # derlenmiş sürümü yerelde sun
npm run test:e2e     # uçtan uca testler (önce `npm run build`)
```

Uçtan uca testler Playwright kullanır. Tarayıcı yüklü değilse bir kez `npx playwright install chromium` çalıştırın.

## Dağıtım

Uygulama tamamen **statik** bir SPA'dır (`base: './'`, hash tabanlı yönlendirme). `dist/` klasörü herhangi bir statik barındırmaya olduğu gibi yüklenebilir:

- **GitHub Pages / Netlify / Vercel / S3 + CloudFront / Nginx**: `npm run build` → `dist/` klasörünü yayınlayın. Alt yol (ör. `/aslan2035/`) altında da çalışır; ek yönlendirme kuralı gerekmez.
- Sunucu tarafı veri toplanmaz; kayıtlar yalnızca kullanıcının tarayıcısında (localStorage) tutulur.
- WebGL olmayan cihazlarda uygulama otomatik olarak **2D plan görünümüne** geçer.

Örnek Nginx yapılandırması:

```nginx
location /aslan2035/ {
  alias /var/www/aslan2035/dist/;
  add_header X-Content-Type-Options nosniff;
}
```

## İsteğe bağlı AI Architect sunucusu

Varsayılan AI Architect tarayıcıda çalışan, **açıkça etiketlenmiş kural tabanlı bir yorumlayıcıdır**; gerçek bir dil modeli değildir. Gerçek bir model kullanmak isterseniz `server/` klasöründeki küçük proxy'yi çalıştırın. **API anahtarı yalnızca sunucuda bulunur, tarayıcıya hiç gönderilmez.**

```bash
cd server
npm install
cp .env.example .env          # ANTHROPIC_API_KEY'i yalnızca sunucudaki .env dosyasına yazın
npm start                     # http://localhost:8787/api/architect
```

Ardından uygulamayı uç noktayla derleyin:

```bash
VITE_ARCHITECT_ENDPOINT=/api/architect npm run build   # veya npm run dev (Vite /api'yi 8787'ye yönlendirir)
```

Üretimde `/api/architect` yolunu ters proxy ile bu sunucuya yönlendirin. Proxy:
- Resmî Anthropic TypeScript SDK'sını kullanır (`claude-opus-5-5`, yapılandırılmış JSON çıktısı, `effort: low`, sunucu tarafı reddetme yedeği `fallbacks: "default"`).
- Yanıtı yalnızca desteklenen parametre anahtarlarıyla sınırlayan bir JSON şeması uygular (`server/schema.mjs`, birim testleriyle tasarım modeliyle senkron tutulur).
- Gövde boyutunu sınırlar (24 KB), IP başına hız sınırı uygular (`RATE_LIMIT_PER_MIN`, varsayılan 12), yalnızca `POST /api/architect` kabul eder, CORS'u yalnızca `ALLOWED_ORIGIN` ayarlıysa açar.
- Model reddini (`stop_reason: "refusal"`) ve SDK hata türlerini ayrı ayrı ele alır.

Tarayıcı, sunucudan dönen her değeri yeniden doğrular (`sanitizeDesign`), kilitli seçimleri korur ve geçersiz önerileri kullanıcıya listeler.

| Ortam değişkeni | Açıklama |
|---|---|
| `ANTHROPIC_API_KEY` | Sunucu tarafı API anahtarı (veya `ant auth login` profili) |
| `PORT` | Varsayılan `8787` |
| `ALLOWED_ORIGIN` | Farklı origin'den çağrılacaksa izin verilen origin |
| `RATE_LIMIT_PER_MIN` | IP başına dakikalık istek sınırı |
| `VITE_ARCHITECT_ENDPOINT` | (derleme zamanı) uygulamanın çağıracağı uç nokta |

## Mimari

**Teknolojiler:** Vite 8, React 19, TypeScript 7, Three.js 0.186, React Three Fiber 9, Drei 10, postprocessing (bloom + ACES), Zustand 5, Tailwind CSS 4, Lucide ikonları, kendi barındırılan Inter / Space Grotesk fontları. Next.js yerine Vite seçildi: uygulama sunucu render gerektirmeyen, istemci ağırlıklı bir 3D deneyim; statik çıktı her yerde barındırılabilir ve isteğe bağlı AI sunucusu ayrı tutulur.

```
src/
  core/                 Core Shell: veri modeli, durum, yönlendirme
    model/              DesignConfig, doğrulama/serileştirme, DNA, malzemeler,
                        ışık gösterileri, çakışma kuralları, Time Machine aşamaları, etiketler
    store/              designStore (geri al/yinele, kilitler, otomatik kayıt),
                        viewStore (kamera, katmanlar, önizleme…), archiveStore
    sim/crowd.ts        Kalabalık akışı simülasyonu (UI'dan bağımsız)
    district.ts         Şematik çevre master planı
  world/                Stadium World + Camera System
    stadium/            Prosedürel geometri (geometry.ts) ve 15 katman bileşeni
    camera/             CameraRig (Explorer/Walkthrough/Seat, intro, klavye, yakalama), POI'ler,
                        tasarım araçlarının ortak adlandırılmış görünümleri (views.ts)
    LightingDirector    Gösteri/atmosfer/mimari ışık önceliklendirmesi
    Renderer            Bloom kompozitörü + istenen çözünürlükte görsel yakalama
    shaderFixes.ts      three.js kabartma (bump) hesabına NaN koruması
    worldApi.ts         Modüllerin 3D dünyayı yönettiği emir köprüsü
  modules/              Her işlev grubu ayrı ve tembel yüklenen modül
  shell/                Üst bar, gezinme, hero, paneller, 2D plan
  ui/                   Erişilebilir UI bileşenleri, grafikler, ikon kaydı
  content/              Doğrulanmış bilgiler, kaynaklar, Object Inspector içerikleri
server/                 İsteğe bağlı AI Architect proxy'si
tests/unit, tests/e2e   Vitest birim testleri, Playwright uçtan uca testleri
```

Temel kararlar:
- **Tek koordinat sistemi:** Kase, iç yuvarlatılmış dikdörtgen + kesit profili (d, y) ile tanımlanır: `P(s, d) = iç(s) + d · normal(s)`. Tribünler, çatı, cephe, kesit kapakları, koltuk konumları ve kalabalık ağı aynı parametrizasyonu kullanır.
- **Etkin tasarım:** 3D dünya `preview ?? design` gösterir. Time Machine, What-If, Material Lab A/B, Scenario Economy ve sunum, kullanıcının tasarımını bozmadan geçici önizleme kullanır.
- **Dış veri doğrulama:** Paylaşım bağlantıları, içe aktarılan JSON, localStorage ve uzak AI yanıtları `sanitizeDesign` ile şema/enum/aralık kontrolünden geçer.
- **Kare başı durum React dışında:** Animasyon `runtime` nesnesinde tutulur; ışık gösterisi tek bir paylaşılan shader uniform setiyle bütün ışık şeritlerini sürer. Çatı ışığı ve cephe ışığı ayrı yoğunluk kanallarındadır; bir ışık gösterisi çalışırken ikisi birlikte yönetilir.
- **Parametre = görünür etki:** Her tasarım parametresi modelde ölçülebilir bir değişiklik yapmalıdır. Bu, her değeri aynı kamera açısından işleyip piksel farkını ölçen bir denetimle kontrol edilir (bkz. Aşama 2).
- **Görsel yakalama:** Yakalama sırasında ışıklar ve gökyüzü geçiş beklemeden yerine oturur. Bir görsel için ayrı bir gün saati (`env`) seçilebilir; görünüm sonra kendi hâline anında döner.

## Performans ve erişilebilirlik

- Modüller ve 3D dünya tembel yüklenir; ilk ekran 3D yüklenmeden görünür.
- Cihaz sınıfına göre otomatik kalite (düşük/orta/yüksek): DPR, bloom, şehir/ağaç sayısı, örnekleme; `PerformanceMonitor` ile çalışma zamanında otomatik düşürme. Ayarlardan elle seçilebilir.
- Instancing (cephe kanatları, kirişler, projektörler, kalabalık), tek tuval tabanlı LED dokusu, CanvasTexture koltuk boyama (yalnızca değiştiğinde veya ≤8 fps animasyonda).
- 3D dünyayı tamamen örten katmanlar (mobil modül menüsü, paylaşılan tasarım iletişim kutusu) açıkken sahne yeni kare çizmez, son kareyi gösterir; görsel dışa aktarımlar yine çalışır.
- Cam paneller orta/yüksek kalitede arka planı bulanıklaştırır; bulanıklık canlı 3D tuvali her karede yeniden süzdüğü için düşük kalitede (telefonlar, zayıf GPU) ve "saydamlığı azalt" tercihinde kapalıdır.
- Fare etiketi, imleç 180 ms hareketsiz kaldığında tek bir ışın atar; hareket, sürükleme ve dokunmatik sırasında ışın atılmaz (stadyum geometrisine her harekette ışın atmak milisaniyeler sürer).
- 3D görüntünün merkezi arayüzün bıraktığı boş alana kaydırılır (`setViewOffset`); dışa aktarılan görseller tam kadrajdır.
- WebGL bağlamı kaybı yakalanır; WebGL yoksa 2D plan.
- **Azaltılmış hareket:** işletim sistemi ayarı + uygulama içi anahtar; anlık kamera geçişleri, sabit ışık, otomatik dönüş/konfeti kapalı. Medya cephesi içeriği, dinamik cephe dalgası, seçim vurgusu, erişilebilir rota ve sulama nabızları durur.
- Klavye: atla bağlantısı, odak halkaları, 3D görünümde ok tuşları/W-A-S-D/R/N/P/+/−, sunumda ←/→/Esc, lightbox'ta ←/→/Esc.
- Ekran okuyucu: ARIA etiketleri, `aria-live` duyuruları (tasarım değişiklikleri, gösteri adımları), grafikler için tablo görünümü, renk tek başına bilgi taşımaz.
- Kompakt düzen (telefon ve dikey tablet, 1024 px altı): alt sayfa paneli (küçült/genişlet), tam ekran modül menüsü, 3D görünüm panelin üstünde yeniden boyutlanır, kamera düğmeleri tek satır simge. Düzen CSS kırılma noktasıyla aynı medya sorgusunu izler; cihaz döndürülünce güncellenir.
- Bölgeler fareye ek olarak klavyeyle de seçilebilir (Master Digital Twin → bölge ve bileşen gezgini).
- Grafik paleti koyu yüzeye karşı renk körlüğü ve kontrast denetiminden geçirildi.

## Testler ve test durumu

| Komut | Kapsam |
|---|---|
| `npm test` | 48 birim testi: doğrulama ve paylaşım kodlaması, kilitler ve yamalar, çakışma kuralları, Time Machine aşamaları, fotosensitivite sınırı, AI Architect yorumlayıcısı (brief'teki 7 örnek dahil), sunucu şeması ↔ veri modeli uyumu, kalabalık simülasyonu, geometri, koltuk ölçüleri, bölge gezgini listesi ↔ 3D sahnedeki seçilebilir parçalar uyumu, görsel dile göre kanat düzeni, DNA açıklamalarının her değeri kapsaması ve var olan görünümlere bağlanması, What-If sorularının gün saati, yer şeritlerinin yukarı bakması, kabartma hesabının NaN koruması |
| `npm run test:e2e` | Gerçek arayüzde Playwright testleri: 5 CTA, 10 gezinti noktası, klavye ve yürüme sınırı, katmanlar/patlatma/odak/kesit, Inspector, DNA + onay + kilit + çakışma önerisi, geri al/yinele, Material Lab A/B görseli, ışık gösterisi oynatma, Time Machine, What-If görselleri, atmosfer ve ses, koltuk karşılaştırması, kalabalık simülasyonu, Stadium OS, Green Engine, Stadium City, Economy, Roadmap, Fan Journey indirme, AI Architect + geri alma, arşiv (kaydet/sürüm/aç/karşılaştır/sil), paylaşım bağlantısı gidiş-dönüş, bozuk bağlantı hatası, JSON/MD/PNG indirme, galeri lightbox, sunum, rapor görselleri + HTML, 2D görünüm, azaltılmış hareket, ayarlar panelinin Escape ile kapanıp odağı geri vermesi, gece→gündüz geçişinin ara ışık seviyelerinden geçmesi, bölge gezgini (seçim, kamera odağı, Inspector), fare etiketi ve imleç, ilk ziyaret açılışı (başlık sekansı, gizli üst çubuk, odaktaki atla düğmesi), WebGL'siz cihaz (2D plan, plan üzerinde seçim, açıklamalı devre dışı özellikler), mobil menü ve alt sayfa, DNA açıklamaları + önizleme + uygulama/geri alma + "modelde göster" (gece ve kamera konumu), Material Lab'de modelden örnek görseller, What-If ışık sorularında gün saati ve tek görsellik gece yakalamasının görünümü değiştirmemesi, 2D planda görsel dile göre kanat sayısı |
| `npm run audit:params` | Parametre etki denetimi: her tasarım parametresinin her değerini aynı açıdan işler ve değişen piksel oranını ölçer; etkisiz ve zayıf değerlerin A/B görsellerini `tests/audit/output/` altına kaydeder (çalışan bir önizleme sunucusu gerekir, `AUDIT_URL`, `AUDIT_ONLY`). |

E2E ortam değişkenleri: `E2E_URL` (çalışan bir sunucuyu test eder), `E2E_ONLY` (yalnızca adı bu düzenli ifadeyle eşleşen testler), `E2E_TIMEOUT_SCALE` (varsayılan 3; başsız Chromium WebGL'i CPU'da (SwiftShader) çizdiği ve bir kare saniyeler sürebildiği için tüm zaman aşımlarını çarpar).

Son çalıştırma sonuçları için bkz. [Test sonuçları](#son-test-sonuçları).

### Test edilmemiş veya sınırlı test edilmiş özellikler

- **Uzak AI motoru, gerçek API'ye karşı test edilmedi** (bu ortamda kimlik bilgisi yok). Proxy'nin girdi doğrulaması, hata yolları ve kimlik bilgisi eksikliği yanıtı yerelde denendi.
- **Ses çıktısı dinlenerek doğrulanmadı.** Web Audio motorunun başlatılması, mod geçişleri ve tetikleyiciler başsız Chromium'da hatasız çalıştı.
- **Gerçek GPU ve gerçek mobil cihaz performansı ölçülmedi.** Tüm görsel testler yazılım tabanlı WebGL (SwiftShader) ile, mobil test 390×844 dokunmatik emülasyonla yapıldı.
- **Gerçek ekran okuyucu (NVDA/VoiceOver) ile test yapılmadı**; ARIA yapısı ve klavye akışı otomatik testlerle kısmen doğrulandı.
- **Yazdırma/PDF çıktısı** (`window.print`) ve **tam ekran API'si** otomatik testte tetiklenmedi; yazdırma stilleri ve rapor içeriği tarayıcıda görsel olarak incelendi.
- **Safari ve Firefox** test edilmedi (yalnızca Chromium).
- Panoya kopyalama düğmeleri tarayıcı izinlerine bağlıdır; başarısız olursa kullanıcıya bildirim gösterilir.

## Bilinen sınırlar ve sonraki adımlar

- Model prosedüreldir ve yaklaşık oranlara dayanır; gerçek rölöve/BIM verisiyle değiştirilebilecek şekilde katmanlara ayrılmıştır.
- Arayüz Türkçedir; modül adları brief'teki İngilizce adlarla korunmuştur. İçerikler `src/content` ve `src/core/model` altında toplandığı için çeviri eklenebilir.
- Gerçek zamanlı çok kullanıcılı düzenleme yoktur (sunucu ve senkronizasyon altyapısı gerektirir); paylaşım bağlantı/dosya ile yapılır.
- Stadium OS gerçek veri kaynağına bağlı değildir; bağlanırsa “Simülasyon” etiketleri veri kaynağına göre güncellenmelidir.
- Kalabalık simülasyonu şematiktir; gerçek kapı, geometri ve sayım verisiyle bile güvenlik kararları için yetkin uzman değerlendirmesi gerekir.

## Kaynaklar

- [Rams Park — Wikipedia](https://en.wikipedia.org/wiki/Rams_Park) (Ekim 2026 erişimi): ad, konum, açılış, kapasite geçmişi, saha, mimar, localar, ulaşım.
- [Enerjisa basın bülteni](https://www.enerjisa.com.tr/en/about-enerjisa/media-centre/press-releases/a-new-guinness-world-records-title-by-enerjisa-and-galatasaray): çatı GES'i (4,2 MW, 10.000+ panel).
- [StadiumDB](https://stadiumdb.com/news/2022/04/turkey_galatasaray_stadium_gets_guinness_listed): çatı GES'i (4,3 MW, ~10.500 panel).

Kaynaklar arasındaki farklar (kapasite yılları, GES gücü, alan değerleri) uygulamada açıkça gösterilir.

## Aşama 1 — Temel ürün: durum raporu

Bu aşamada yeni modül eklenmedi. Var olan temel katman, "önce kaliteli ve gerçekten çalışan temel" ilkesine göre baştan sona incelendi: tasarım sistemi, navigasyon, sinematik açılış, 3D stadyum, kamera, gece-gündüz, seçilebilir bölgeler, 2D alternatif ve masaüstü/mobil düzen. Eksikler giderildi ve her adım tarayıcıda doğrulandı. Çalışan kod incelenmeden silinmedi; her değişiklik ayrı commit'te gerekçesiyle kayıtlı.

### Gerçekten uygulananlar

| Madde | Durum |
|---|---|
| 1. Dosya, teknoloji ve bağımlılık incelemesi | `npm ls` temiz; `npm audit` uygulamada ve sunucuda 0 açık; derleme uyarısız. Tek konsol uyarısı, en güncel R3F sürümünün (9.8.2) kendi içinde kullandığı `THREE.Clock`. Kod yaklaşık 14 bin satır ve katmanlı: veri modeli ve depolar (`core`), 3D dünya (`world`), kabuk (`shell`), arayüz bileşenleri (`ui`), modüller. |
| 2. Mimari ve geliştirme sırası | Tek `DesignConfig` veri modeli ve tek 3D dünya; modüller bunların üzerine kurulu. Sıra: temel (bu aşama) → modüllerin aynı ölçütlerle tek tek derinleştirilmesi. |
| 3. Tasarım sistemi ve navigasyon | Düzen kırılma noktası birleştirildi: 1024 px altında (telefon ve dikey tablet) alt panel ve modül menüsü, üstünde yan panel ve ray. JavaScript aynı medya sorgusunu izler, cihaz döndürülünce güncellenir. 3D görüntünün merkezi arayüzün bıraktığı boş alana kaydırılır. Cam panellerde bulanıklık, CSS küçültücüsünün `backdrop-filter`'ı silmesi yüzünden hiç çalışmıyordu; düzeltildi. Gezinti noktaları kart yığını yerine rota listesi. Model doğruluğu uyarısı tek bir panel dipnotuna toplandı. Ayarlar paneli Escape ve dış tıklamayla kapanır, odak geri döner. |
| 4. Sinematik açılış | 7,5 sn kamera uçuşu üzerinde sinema bantları ve üç aşamalı başlık sekansı (konum, başlık, slogan). Sekans uçuşun ilk karesiyle başlar; 3D dünya yavaş yüklense de senkron kalır. Sekans boyunca üst çubuk gizli, "Açılışı atla" odakta. Başlık boyutu ekran yüksekliğine de bağlı. Ana görünüm ekranın en-boy oranına göre çerçevelenir. |
| 5. Gerçek 3D geometriyle stadyum | Prosedürel geometri: 15 bağımsız katman, 23 seçilebilir parça. Yayımlanmış oranlara dayanır, **ölçülü bir rölöve değildir**; bu, her modül panelinin dipnotunda ve ana sayfada yazılıdır. |
| 6. Kamera, gece-gündüz, seçilebilir bölgeler | Explorer/Walkthrough kamera ve klavye kontrolleri. Gece, alacakaranlık ve gündüz arasında yaklaşık 1,5 sn'lik yumuşak geçiş (gökyüzü, sis, ışıklar, şehir, su, yıldızlar); azaltılmış harekette ve görsel yakalamada anlık. Klavyeyle kullanılabilen bölge ve bileşen gezgini: seçim, modelde vurgu, kamera odağı, Object Inspector. Fare durunca altındaki parçanın adı gösterilir; bu, hareket başına değil durunca tek bir ışınla yapılır. |
| 7. 3D yüklenemeyen cihazlar | WebGL yoksa uygulama 2D planla açılır. Plan öğeleri tıklanınca Inspector açılır, seçim çerçevelenir. 3D gerektiren yedi özellik nedenini söyler: "3D görünüme geç" sunar ya da cihazda WebGL olmadığını belirtir. |
| 8. Masaüstü ve mobil ekranlar | Sekiz ekran boyutunda görsel kontrol: 1440×900, 1280×720, 1024×768, 768×1024, 820×1180, 390×844, 360×740, 844×390. Bulunup düzeltilenler: dikey tablette yan panel ile mobil tuvalin çakışması, telefonda logonun düğmelerin altında kalması, iki satıra taşan kamera düğmeleri, yatay telefonda başlığın ekran dışına itilmesi. |
| 9. Çalıştırma, hata giderme, test | Ayrıntılar aşağıda. |

### Henüz yapılmayanlar ve bilinen sınırlar

- 3D model ölçülü değildir; gerçek rölöve veya BIM verisi yoktur. İç mekânlar konsept seviyesindedir.
- Gerçek GPU'lu bilgisayarlarda ve gerçek telefonlarda performans ölçülmedi; bütün testler yazılım tabanlı WebGL ile yapıldı.
- Ekran okuyucuyla (NVDA, VoiceOver) gerçek kullanıcı testi yapılmadı. Safari ve Firefox denenmedi.
- Fare etiketi yalnızca fareyle çalışır; dokunmatikte bölgeler bölge gezgininden seçilir.
- Yatay telefonda 3D alanı küçük kalır, çünkü alt panel ekranın yarısını kaplar.
- Sonraki aşamalar: mimari tasarım motoru, ışık laboratuvarı, maç günü simülatörü, akıllı stadyum sistemleri ve diğer modüller bu temel üzerinde, aynı ölçütlerle tek tek derinleştirilecek. Yapılacaklar: buton denetimi, ekran boyutu kontrolü, dürüst etiketler ve e2e kapsamı.

## Aşama 2 — Mimari tasarım motoru: durum raporu

Bu aşamada DNA Engine, Material Lab ve What-If aynı temel üzerinde derinleştirildi. İşe, tasarım parametrelerinin modelde gerçekten ne değiştirdiğini ölçen otomatik bir denetimle başlandı. Denetim, her parametrenin her değerini aynı kamera açısından ve aynı ışıkta işler, görüntüleri piksel piksel karşılaştırır. Değişen piksel oranı %0,2'nin altındaysa seçim "etkisiz", %1'in altındaysa "zayıf" sayılır. İlk tur, 30 parametredeki 63 karşılaştırmanın 24'ünde (17 parametre) etkisiz veya zayıf sonuç buldu. Bunların bir kısmı gerçek hataydı.

### Denetimin bulduğu sorunlar ve çözümleri

| Bulgu | Neden | Çözüm |
|---|---|---|
| "Görsel dil" modelde hiçbir şeyi değiştirmiyordu (%0). | Parametreyi hiçbir 3D veya 2D bileşen okumuyordu. | Görsel dil artık cephe kanatlarının ritmini, derinliğini, açısını ve yüksekliğini belirliyor. 2D plan aynı veriden aynı kanatları çiziyor. |
| Çatı ışığı stilleri neredeyse ayırt edilemiyordu (%0,1–0,5). | Işık yalnızca 1,4 m'lik çatı kenarındaydı; uzaktan bir piksellik çizgi. | Halo, segmentli ve tam taç stilleri, çatının iç kenarındaki basma halkasına da ışık bandı ekliyor. Tam taç dış kenarı da yakıyor. "İnce kenar ışığı" bilerek ince bırakıldı. |
| "Işık halkası yoğunluğu" ve "çatı ışığı: kapalı" cephe ışığını da kısıyordu. | Bütün ışık bantları tek bir yoğunluk değerini paylaşıyordu. | Cephe ışığının kendi seviyesi var. Bir ışık gösterisi çalışırken bütün bina yine birlikte yönetiliyor. |
| Gece görünümünde çatının üstünde büyük beyaz bir parlama vardı. | Saha ışıklarını temsil eden ışık çatının yaklaşık 30 m üstündeydi. | Işık, projektörlerin bulunduğu çatı seviyesinin altına indirildi. Stadyum içinin aydınlığı korunurken parlama kalktı. Işık rengi "verimli aydınlatma" seçimini izliyor. |
| Erişilebilir güzergâhlar, ulaşım yolları, yeşil ulaşım bağlantısı ve yağmur suyu hendekleri 3D'de hiç görünmüyordu. | Bu yer şeritlerinin üçgenleri aşağı bakıyordu; yukarıdan bakınca çizilmiyorlardı. Yalnızca 2D planda görünüyorlardı. | Üçgen yönü düzeltildi; yönü denetleyen bir birim testi eklendi. |
| Bazı kamera açılarında görüntü tamamen siyaha dönüyordu. | three.js'in kabartma hesabı, ekranda neredeyse görünmeyen ince üçgenlerde geçersiz (NaN) değer üretiyordu. Işık parlaması (bloom) efekti bu tek pikseli bütün kareye yayıyordu. Yalnız görsel yakalamayı değil, ekrandaki görüntüyü de etkileyebiliyordu. | O piksellerde yüzey normali olduğu gibi kullanılıyor (`world/shaderFixes.ts`). Birim testi eklendi. |
| Görsel yakalamalar ışığın geçişin ortasındaki hâlini kaydedebiliyordu. | Işık rengi ve yoğunluğu yumuşak geçişle değişiyordu. | Yakalama sırasında ışıklar ve gökyüzü anında yerine oturuyor; yakalamadan sonra görünüm de anında kendi hâline dönüyor. |
| "Ne olur?" maç gecesi karşılaştırması gündüz ışığında çekilebiliyordu. | Yakalama o anki gün saatini kullanıyordu. | Yakalamaya gün saati seçeneği eklendi. Gece sorusu gece, çatı sorusu alacakaranlıkta çekiliyor. |
| "Dinamik renk geçişi" tek karede sabit ışıktan ayırt edilemiyordu. | Yalnız parlaklık değişiyordu. | Cephe boyunca ana ve ikincil renk arasında yavaş akan bir dalga. |
| Saha bakımı halkaları, atık istasyonları ve taraftar meydanı neredeyse görünmüyordu. | Çok soluk malzeme (%12–18 opaklık), 1 m'lik kutular, birkaç ince totem. | Sulama halkaları belirginleşti; atık istasyonlarına gölgelik ve zemin eklendi; taraftar meydanının sınırı 2D plandaki gibi işaretlendi. |
| Medya cephesi, seçim vurgusu, erişilebilir rotalar ve sulama halkaları azaltılmış harekette de hareket ediyordu. | Hareket ayarı bu dört yerde denetlenmiyordu. | Azaltılmış harekette dördü de duruyor. |

### DNA Engine

- Her seçimin altında, seçilen değerin modelde neyi değiştirdiğini anlatan bir satır var. Satır ekran okuyucuya da seçimle birlikte okunuyor. Açıklamalar modelin gerçekten çizdiğini tarif ediyor; örneğin park karakterinin yalnızca peyzaj açıkken ağaç eklediğini söylüyor.
- **Modelde göster:** Kamera, seçimin göründüğü yere gider. Işık seçimlerinde görünüm gündüzse geceye geçer ve bunu bildirir. 2D görünümde bu düğme gösterilmez; plan bütün seçimleri zaten aynı anda gösterir.
- **DNA önizleme:** Bir DNA uygulanmadan modelde görülebilir. Üst banttan uygulanır ya da tasarıma dönülür. Kilitli seçimler önizlemede de korunur; modülden çıkınca önizleme kapanır.
- Aktif DNA'nın önerdiğinden farklı seçimler "özel" etiketiyle işaretlenir.

### Material Lab

- **Modelden örnekle:** Her malzeme seçeneği, ilgili parçanın üzerinde ve aynı yakın açıdan modelin kendisinden işlenir. Tasarımın geri kalanı veya gün saati değişince örnekler geçersiz sayılır ve yeniden üretilmeleri gerekir.
- Örnek oluşturulmadan önce gösterilen renk kutuları da malzemenin desenini (fırçalanmış, panel, frit, benek, doku), metal parlaklığını ve yarı saydamlığını yansıtıyor.

### What-If

- Işığa bağlı sorular kendi ışığında çekiliyor: maç gecesi gece, çatı alacakaranlıkta. Görünüm gündüzse soru seçildiğinde bildirimle geçiliyor. Karşılaştırmanın altında görsellerin hangi ışıkta alındığı yazıyor.
- Senaryo kartlarındaki "Çakışma" ve "Mühendislik" rozetlerinin yanında sorunun kısa açıklaması var.

### Denetim: önce ve sonra

Değerler değişen piksel oranıdır (480×300 görsel). İkinci turda bazı parametreler, ilgili aracın kamerayı götürdüğü daha yakın açılardan ölçüldü: ekranlar ve koltuklar stadyum içinden, meydan ve sosyal alan yakın meydan görünümünden, çevre ve yeşil sistemler kendi modüllerinin açılarından. Bu satırlardaki artışın bir kısmı açıdan gelir. Ekran düzenindeki artışın tamamı açıdan gelir; ekran kodu bu aşamada değişmedi.

| Parametre | İlk tur | Son tur |
|---|---|---|
| Görsel dil (4 alternatif) | %0,00 | %4,1–9,0 |
| Çatı ışığı: halo / segmentli / tam taç | %0,19–0,49 | %2,1–5,9 |
| Çatı ışığı: ince kenar (bilerek ince) | %0,12 | %0,21 |
| Işık halkası yoğunluğu (%55 → %95) | %0,08 | %1,14 |
| Cephe ışığı: sabit → dinamik | %0,30 | %7,7 |
| Ekran düzeni: bant → genişletilmiş | %0,20 | %1,2 |
| Ekran düzeni: bant → standart (yalnız 1,1 m'lik LED bandı kalkar) | %0,27 | %0,9 |
| Meydan karakteri (park / etkinlik / bahçe) | %0,3–2,9 | %2,2–11,9 |
| Taraftar meydanı | %0,06 | %1,2 |
| Yağmur suyu yönetimi | %0,05 | %3,7 |
| Verimli aydınlatma | %0,21 | %26 |
| Saha bakımı | %0,22 | %12,6 |
| Atık azaltma | %0,03 | %1,1 |
| Yeşil ulaşım bağlantısı | %0,00 | %0,8 |
| Erişilebilir rotalar (kuşbakışı) | %0,00 | %0,4 |
| Buluşma noktaları | %0,05 | %0,3 |
| Erişilebilir hizmet noktaları (kuşbakışı) | %0,00 | %0,01 |

Malzemeler, koreografi, gece atmosferi ve çatı formu ilk turda da belirgindi (%1,5–54).

### Henüz yapılmayanlar ve bilinen sınırlar

- Denetim piksel farkına dayanır. Görünürlük kamera açısına, ekran boyutuna ve ışığa bağlıdır; düşük oran her zaman hata demek değildir.
- **Küçük işaretler:** Buluşma noktaları (%0,3) ve erişilebilir hizmet noktaları kuşbakışında birkaç piksel kalır. Yakın açılarda ve 2D planda okunur. Hizmet noktaları, Stadium OS'tan açıldığında kamera erişim katmanını çerçeveler.
- **Kanat dilleri** mimari ifade için bir konsept aracıdır. Rüzgâr, gün ışığı, güneş kontrolü veya maliyet hesabı yapılmaz.
- **Çatı ışık bandı** basma halkasının üzerine varsayımsal olarak yerleştirildi; gerçek bir aydınlatma tasarımı değildir.
- **Stadyum içi ışığı** gölgesiz tek bir ışıktır. Duvarların arkasına da geçer; gece cephe kanatlarında küçük parlama noktaları görülebilir.
- **Malzeme örnekleri** fiziksel ölçüm değildir; aynı prosedürel konsept malzemenin modeldeki görüntüsüdür.
- **Sonraki aşamalar:** ışık laboratuvarı (Light Show Composer), maç günü simülatörü ve akıllı stadyum sistemleri, aynı denetim ve test yaklaşımıyla.

## Son test sonuçları

### Aşama 2

29 Ekim 2026, uygulama kodu `606f1ed` commit'i:

| Kontrol | Sonuç |
|---|---|
| `npm run build` (tsc + Vite) | Hatasız, uyarısız |
| `npm test` | **48/48** birim testi geçti (11'i yeni) |
| `npm run test:e2e` | **39/39** uçtan uca test geçti (4'ü yeni; testlerin toplam süresi yaklaşık 16 dakika); sayfa hatası 0, filtrelenen sürücü veya kütüphane konsol hatası 0 |
| `npm run audit:params` (30 parametre, 63 karşılaştırma) | İlk tur 24 etkisiz veya zayıf sonuç; son tur **6 zayıf sonuç**, hepsi küçük veya bilerek ince öğeler: ince kenar ışığı (%0,2), bant → standart ekran (%0,9), buluşma noktaları (%0,3), yeşil ulaşım bağlantısı (%0,8), kuşbakışında erişilebilir rotalar (%0,4) ve hizmet noktaları (%0,01). Ayrıntılar Aşama 2 raporunda. |
| Görsel kontrol | DNA paneli 1440×900 ve 390×844'te (açıklamalar, "özel" etiketi, önizleme bandı, "Modelde göster"), beş görsel dilin cephesi, beş çatı ışığı stili gece, dinamik ve sabit cephe ışığı, stadyum içinin gece aydınlığı (değişiklik öncesi ve sonrası aynı açılardan), Material Lab yakın plan açıları, ekran ve meydan görünümleri, kuşbakışında rotalar ve hendekler. |

### Aşama 1

29 Ekim 2026, uygulama kodu `7b9b87f` commit'i:

| Kontrol | Sonuç |
|---|---|
| `npm run build` (tsc + Vite) | Hatasız, uyarısız |
| `npm test` | **37/37** birim testi geçti |
| `npm run test:e2e` | **35/35** uçtan uca test geçti (yaklaşık 26 dakika); sayfa hatası 0, filtrelenen sürücü veya kütüphane konsol hatası 0 |
| Buton denetimi (her görünür düğmeye tıklayıp durum, tasarım, kamera, panel içeriği, indirme, iletişim kutusu veya bildirim değişikliği arar) | İlk tam tur 336 düğme, son derlemeyle hedefli tur 160 düğme; **etkisiz düğme yok**. Beş tıklama, önceki tıklamanın başlattığı görsel yakalama sürerken ekranı bilinçli olarak örten "görsel oluşturuluyor" katmanına takıldı. Bu makinede bir yakalama 20 sn'yi aşıyor. |
| Aşama 1 doğrulama betiği (açılış senkronu, gece-gündüz ara değerleri, bölge gezgini, fare etiketi, ayarlar paneli, cam bulanıklığı, WebGL'siz cihaz, sekiz ekran boyutu) | Tüm kontroller geçti. Gece→gündüz ölçümü: gökyüzü ışığı 0,42'den 1,4'e kademeli ilerliyor (0,51 → 0,82 → 0,95 → 1,05 → 1,13 …). |

Ortam: başsız Chromium (Playwright 1.63.0), yazılım tabanlı WebGL (SwiftShader), 4 çekirdekli bulut konteyneri, düşük kalite ayarı. Bu ortamda kare hızı saniyede 1'in altına inebildiği için testler sabit süre yerine durum değişikliğini bekler ve `E2E_TIMEOUT_SCALE` ile zaman aşımları uzatılır. Her test `E2E_ONLY` ile tek başına da çalışır.

Kapsam dışında kalanlar için bkz. [Test edilmemiş veya sınırlı test edilmiş özellikler](#test-edilmemiş-veya-sınırlı-test-edilmiş-özellikler).
