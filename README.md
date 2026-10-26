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

---

## Ne yapar?

Stadyum tek bir bina olarak değil, birbirine bağlı alanlardan oluşan bir **dijital ekosistem** olarak ele alınır. Bütün modüller **tek bir prosedürel 3D modeli** (master digital twin) ve **tek bir tasarım veri modelini** (`DesignConfig`) paylaşır; bir modülde yapılan seçim diğer tüm modüllere ve 3D dünyaya yansır.

| Sistem | Modül | Öne çıkanlar |
|---|---|---|
| **Omega Experience** | Ana sayfa | Gece İstanbul atmosferinde atlanabilir sinematik açılış, ışığın kademeli belirmesi, fare parallax'ı, 5 çalışan CTA |
| **Stadium World** | Walkable Stadium | Explorer (sınırlı orbit) ve Walkthrough (10 gezinti noktası, güvenli yürüme yarıçapı, kararma geçişleri, klavye) |
| | Master Digital Twin | 15 bağımsız katman, Exploded Architecture (katman odaklama + geri dönüş), analitik **kavramsal kesit**, Object Inspector |
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
ANTHROPIC_API_KEY=sk-ant-... npm start        # http://localhost:8787/api/architect
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
    camera/             CameraRig (Explorer/Walkthrough/Seat, intro, klavye, yakalama), POI'ler
    LightingDirector    Gösteri/atmosfer/mimari ışık önceliklendirmesi
    Renderer            Bloom kompozitörü + istenen çözünürlükte görsel yakalama
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
- **Kare başı durum React dışında:** Animasyon `runtime` nesnesinde tutulur; ışık gösterisi tek bir paylaşılan shader uniform setiyle bütün ışık şeritlerini sürer.

## Performans ve erişilebilirlik

- Modüller ve 3D dünya tembel yüklenir; ilk ekran 3D yüklenmeden görünür.
- Cihaz sınıfına göre otomatik kalite (düşük/orta/yüksek): DPR, bloom, şehir/ağaç sayısı, örnekleme; `PerformanceMonitor` ile çalışma zamanında otomatik düşürme. Ayarlardan elle seçilebilir.
- Instancing (cephe kanatları, kirişler, projektörler, kalabalık), tek tuval tabanlı LED dokusu, CanvasTexture koltuk boyama (yalnızca değiştiğinde veya ≤8 fps animasyonda).
- WebGL bağlamı kaybı yakalanır; WebGL yoksa 2D plan.
- **Azaltılmış hareket:** işletim sistemi ayarı + uygulama içi anahtar; anlık kamera geçişleri, sabit ışık, otomatik dönüş/konfeti kapalı.
- Klavye: atla bağlantısı, odak halkaları, 3D görünümde ok tuşları/W-A-S-D/R/N/P/+/−, sunumda ←/→/Esc, lightbox'ta ←/→/Esc.
- Ekran okuyucu: ARIA etiketleri, `aria-live` duyuruları (tasarım değişiklikleri, gösteri adımları), grafikler için tablo görünümü, renk tek başına bilgi taşımaz.
- Mobil: alt sayfa paneli (küçült/genişlet), tam ekran modül menüsü, 3D görünüm panelin üstünde yeniden boyutlanır.
- Grafik paleti koyu yüzeye karşı renk körlüğü ve kontrast denetiminden geçirildi.

## Testler ve test durumu

| Komut | Kapsam |
|---|---|
| `npm test` | 34 birim testi: doğrulama ve paylaşım kodlaması, kilitler ve yamalar, çakışma kuralları, Time Machine aşamaları, fotosensitivite sınırı, AI Architect yorumlayıcısı (brief'teki 7 örnek dahil), sunucu şeması ↔ veri modeli uyumu, kalabalık simülasyonu, geometri, koltuk ölçüleri |
| `npm run test:e2e` | Gerçek arayüzde Playwright testleri: 5 CTA, 10 gezinti noktası, klavye ve yürüme sınırı, katmanlar/patlatma/odak/kesit, Inspector, DNA + onay + kilit + çakışma önerisi, geri al/yinele, Material Lab A/B görseli, ışık gösterisi oynatma, Time Machine, What-If görselleri, atmosfer ve ses, koltuk karşılaştırması, kalabalık simülasyonu, Stadium OS, Green Engine, Stadium City, Economy, Roadmap, Fan Journey indirme, AI Architect + geri alma, arşiv (kaydet/sürüm/aç/karşılaştır/sil), paylaşım bağlantısı gidiş-dönüş, bozuk bağlantı hatası, JSON/MD/PNG indirme, galeri lightbox, sunum, rapor görselleri + HTML, 2D görünüm, azaltılmış hareket, ilk ziyaret açılışı, mobil menü ve alt sayfa |

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

## Son test sonuçları

_Bu bölüm test çalıştırmasından sonra güncellenir._
