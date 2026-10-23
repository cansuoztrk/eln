/**
 * TEST VERİSİ — kurgusal ürün kataloğu.
 *
 * Bu katalog yalnızca yerel geliştirme, otomatik testler ve demo amaçlıdır. Markalar, ürünler ve
 * mağazalar KURGUSALDIR; gerçek ürünlere veya mağazalara ait fiyat değildir. Bu kaynaktan gelen
 * her kayıt arayüzde "Test verisi" olarak işaretlenir ve üretim ortamında varsayılan olarak
 * gizlenir (SHOW_TEST_DATA).
 */

export type FixtureStore = { slug: string; name: string; color: string; shipping: "free" | "flat" | "unknown"; flatMinor?: number; freeOverMinor?: number };

export const FIXTURE_STORES: FixtureStore[] = [
  { slug: "test-magaza-atlas", name: "Atlas Test Mağazası", color: "#5b7cfa", shipping: "free" },
  { slug: "test-magaza-pusula", name: "Pusula Test Mağazası", color: "#16a37f", shipping: "flat", flatMinor: 4990, freeOverMinor: 150000 },
  { slug: "test-magaza-kervan", name: "Kervan Test Mağazası", color: "#e0773c", shipping: "unknown" },
];

export type FixtureVariant = { suffix: string; color?: string; connectivity?: "kablosuz" | "kablolu" | "bluetooth"; capacity?: string; priceDelta?: number; gtinSeed?: number };

export type FixtureProduct = {
  key: string;
  brand: string;
  title: string;
  category: string; // platform kategori slug'ı
  basePrice: number; // TL
  stores: string[]; // listelendiği test mağazaları
  variants?: FixtureVariant[];
  specs?: Record<string, string>;
  /** Bu üründe bir mağaza liste fiyatını sürekli şişirir (doğrulama demosu). */
  inflatedList?: boolean;
  /** Bir mağazada GTIN vermeden farklı başlıkla listelenir (eşleştirme incelemesi demosu). */
  altTitleStore?: { store: string; title: string };
};

export const FIXTURE_PRODUCTS: FixtureProduct[] = [
  // Oyuncu fareleri
  { key: "vektra-v8", brand: "Vektra", title: "Vektra V8 Oyuncu Faresi 26000 DPI", category: "oyuncu-fareleri", basePrice: 1899, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], variants: [{ suffix: "Kablosuz Siyah", connectivity: "kablosuz", color: "siyah", priceDelta: 400 }, { suffix: "Kablolu Siyah", connectivity: "kablolu", color: "siyah" }, { suffix: "Kablosuz Beyaz", connectivity: "kablosuz", color: "beyaz", priceDelta: 450 }], specs: { DPI: "26000", Ağırlık: "63 g", Sensör: "Optik" }, altTitleStore: { store: "test-magaza-kervan", title: "VEKTRA V-8 Gaming Mouse Wireless Black" } },
  { key: "nordik-glide", brand: "Nordik", title: "Nordik Glide Ultra Hafif Oyuncu Faresi", category: "oyuncu-fareleri", basePrice: 1249, stores: ["test-magaza-atlas", "test-magaza-pusula"], variants: [{ suffix: "Kablosuz", connectivity: "kablosuz", priceDelta: 300 }, { suffix: "Kablolu", connectivity: "kablolu" }], specs: { DPI: "19000", Ağırlık: "54 g" } },
  { key: "kuzgun-k3", brand: "Kuzgun", title: "Kuzgun K3 Ergonomik Oyuncu Faresi", category: "oyuncu-fareleri", basePrice: 749, stores: ["test-magaza-pusula", "test-magaza-kervan"], specs: { DPI: "12400", Bağlantı: "Kablolu" } },
  // Klavyeler
  { key: "vektra-tkl", brand: "Vektra", title: "Vektra TKL Pro Mekanik Oyuncu Klavyesi Kırmızı Switch", category: "oyuncu-klavyeleri", basePrice: 2899, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Switch: "Kırmızı (lineer)", Düzen: "TKL Türkçe Q", Aydınlatma: "RGB" }, inflatedList: true },
  { key: "nordik-75", brand: "Nordik", title: "Nordik 75 Kablosuz Mekanik Klavye", category: "oyuncu-klavyeleri", basePrice: 3499, stores: ["test-magaza-atlas", "test-magaza-kervan"], specs: { Switch: "Kahverengi", Düzen: "%75", Pil: "4000 mAh" } },
  { key: "lumo-k60", brand: "Lumo", title: "Lumo K60 Kompakt RGB Klavye", category: "oyuncu-klavyeleri", basePrice: 1199, stores: ["test-magaza-pusula"], specs: { Switch: "Mavi", Düzen: "%60" } },
  // Kulaklıklar
  { key: "sonora-h7", brand: "Sonora", title: "Sonora H7 Oyuncu Kulaklığı 7.1 Surround", category: "oyuncu-kulakliklari", basePrice: 2199, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], variants: [{ suffix: "Kablosuz", connectivity: "kablosuz", priceDelta: 900 }, { suffix: "Kablolu", connectivity: "kablolu" }], specs: { Sürücü: "50 mm", Mikrofon: "Çıkarılabilir" } },
  { key: "sonora-buds", brand: "Sonora", title: "Sonora Buds ANC Kablosuz Kulak İçi Kulaklık", category: "kulakliklar-ses", basePrice: 1799, stores: ["test-magaza-atlas", "test-magaza-kervan"], variants: [{ suffix: "Siyah", color: "siyah" }, { suffix: "Beyaz", color: "beyaz" }], specs: { ANC: "Var", Pil: "30 saat" } },
  // Monitörler
  { key: "ekran-27q", brand: "Panora", title: "Panora 27Q 27 inç 165 Hz QHD IPS Oyuncu Monitörü", category: "monitorler", basePrice: 8999, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Panel: "IPS", Çözünürlük: "2560×1440", Yenileme: "165 Hz", "Tepki süresi": "1 ms" } },
  { key: "ekran-24f", brand: "Panora", title: "Panora 24F 24 inç 180 Hz FHD Monitör", category: "monitorler", basePrice: 4899, stores: ["test-magaza-pusula", "test-magaza-kervan"], specs: { Panel: "Fast IPS", Çözünürlük: "1920×1080", Yenileme: "180 Hz" } },
  { key: "ekran-34uw", brand: "Panora", title: "Panora 34UW 34 inç Kavisli Ultra Geniş Monitör", category: "monitorler", basePrice: 15999, stores: ["test-magaza-atlas"], specs: { Panel: "VA", Çözünürlük: "3440×1440", Yenileme: "144 Hz" } },
  // Ekran kartları / bileşenler
  { key: "gpu-x70", brand: "Kalyon", title: "Kalyon X70 12GB GDDR7 Ekran Kartı", category: "ekran-kartlari", basePrice: 32999, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Bellek: "12 GB GDDR7", "Bellek yolu": "192 bit", Güç: "250 W" } },
  { key: "gpu-x60", brand: "Kalyon", title: "Kalyon X60 8GB GDDR7 Ekran Kartı", category: "ekran-kartlari", basePrice: 18999, stores: ["test-magaza-atlas", "test-magaza-kervan"], specs: { Bellek: "8 GB GDDR7", Güç: "170 W" } },
  { key: "cpu-r7", brand: "Silika", title: "Silika R7 8 Çekirdek İşlemci", category: "islemciler", basePrice: 12499, stores: ["test-magaza-atlas", "test-magaza-pusula"], specs: { Çekirdek: "8", İzlek: "16", "Maks. frekans": "5,4 GHz" } },
  { key: "ssd-nv4", brand: "Depo", title: "Depo NV4 NVMe PCIe 4.0 SSD", category: "ram-ssd", basePrice: 2199, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], variants: [{ suffix: "1TB", capacity: "1TB" }, { suffix: "2TB", capacity: "2TB", priceDelta: 1600 }], specs: { Arayüz: "PCIe 4.0 x4", Okuma: "7000 MB/s" } },
  { key: "ram-32", brand: "Depo", title: "Depo Fury 32GB (2x16) DDR5 6000 MHz RAM", category: "ram-ssd", basePrice: 3799, stores: ["test-magaza-pusula", "test-magaza-kervan"], specs: { Kapasite: "32 GB", Hız: "6000 MHz", Gecikme: "CL30" } },
  { key: "mb-b7", brand: "Silika", title: "Silika B7 ATX Anakart", category: "anakartlar", basePrice: 6499, stores: ["test-magaza-atlas"], specs: { Soket: "AM5", Form: "ATX", "Wi-Fi": "Wi-Fi 7" } },
  // Bilgisayar / telefon
  { key: "laptop-a15", brand: "Kalyon", title: "Kalyon A15 Oyun Dizüstü Bilgisayarı 15.6 inç", category: "dizustu-bilgisayarlar", basePrice: 42999, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { İşlemci: "8 çekirdek", RAM: "16 GB", Depolama: "1 TB SSD", Ekran: "15,6\" 165 Hz" } },
  { key: "laptop-ince", brand: "Lumo", title: "Lumo İnce 14 Ultrabook", category: "dizustu-bilgisayarlar", basePrice: 28999, stores: ["test-magaza-atlas", "test-magaza-kervan"], specs: { RAM: "16 GB", Depolama: "512 GB SSD", Ağırlık: "1,2 kg" } },
  { key: "tel-n9", brand: "Lumo", title: "Lumo N9 Akıllı Telefon", category: "telefon-tablet", basePrice: 24999, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], variants: [{ suffix: "256GB Siyah", capacity: "256GB", color: "siyah" }, { suffix: "512GB Siyah", capacity: "512GB", color: "siyah", priceDelta: 4000 }, { suffix: "256GB Mavi", capacity: "256GB", color: "mavi" }], specs: { Ekran: "6,7\" OLED", Kamera: "50 MP" } },
  { key: "tablet-t11", brand: "Lumo", title: "Lumo T11 Tablet 11 inç", category: "telefon-tablet", basePrice: 11999, stores: ["test-magaza-pusula", "test-magaza-kervan"], specs: { Ekran: "11\" 120 Hz", Depolama: "128 GB" } },
  { key: "saat-s3", brand: "Nordik", title: "Nordik S3 Akıllı Saat GPS", category: "akilli-saatler", basePrice: 5499, stores: ["test-magaza-atlas", "test-magaza-kervan"], specs: { GPS: "Var", Pil: "10 gün" } },
  // Yayın ekipmanı
  { key: "mik-pod", brand: "Sonora", title: "Sonora Pod USB Yayın Mikrofonu", category: "mikrofon-yayin", basePrice: 2499, stores: ["test-magaza-atlas", "test-magaza-pusula"], specs: { Tip: "Kondansatör", Bağlantı: "USB-C" } },
  { key: "kam-4k", brand: "Panora", title: "Panora 4K Web Kamerası", category: "web-kameralari", basePrice: 3299, stores: ["test-magaza-pusula", "test-magaza-kervan"], specs: { Çözünürlük: "4K 30 fps", Odak: "Otomatik" } },
  { key: "konsol-gamepad", brand: "Kuzgun", title: "Kuzgun Kablosuz Oyun Kumandası", category: "konsol-aksesuar", basePrice: 1499, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Bağlantı: "Bluetooth / 2,4 GHz", Pil: "20 saat" } },
  { key: "mousepad-xl", brand: "Kuzgun", title: "Kuzgun XL Kumaş Mousepad 900x400", category: "mousepad-ekipman", basePrice: 449, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Boyut: "900×400 mm", Kalınlık: "4 mm" } },
  // Ev & yaşam
  { key: "supurge-r5", brand: "Evora", title: "Evora R5 Robot Süpürge", category: "kucuk-ev-aletleri", basePrice: 9999, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Emiş: "6000 Pa", Haritalama: "Lidar" } },
  { key: "airfryer-6l", brand: "Evora", title: "Evora 6 L Airfryer Sıcak Hava Fritözü", category: "kucuk-ev-aletleri", basePrice: 3499, stores: ["test-magaza-atlas", "test-magaza-kervan"], specs: { Hacim: "6 L", Güç: "1700 W" } },
  { key: "kahve-m2", brand: "Evora", title: "Evora M2 Espresso Makinesi", category: "mutfak", basePrice: 6999, stores: ["test-magaza-pusula"], specs: { Basınç: "15 bar" } },
  { key: "lamba-led", brand: "Lumo", title: "Lumo Akıllı LED Masa Lambası", category: "aydinlatma", basePrice: 899, stores: ["test-magaza-atlas", "test-magaza-pusula"], specs: { Renk: "Ayarlanabilir", Kontrol: "Uygulama" } },
  // Moda & spor & kitap
  { key: "ayakkabi-kosu", brand: "Rota", title: "Rota Hafif Koşu Ayakkabısı", category: "ayakkabilar", basePrice: 2799, stores: ["test-magaza-atlas", "test-magaza-kervan"], specs: { Taban: "EVA köpük" } },
  { key: "canta-sirt", brand: "Rota", title: "Rota 25 L Laptop Sırt Çantası", category: "cantalar", basePrice: 1299, stores: ["test-magaza-pusula", "test-magaza-kervan"], specs: { Hacim: "25 L", "Laptop gözü": "16\"" } },
  { key: "kitap-veri", brand: "Yazı Evi", title: "Veriyle Düşünmek (Ciltsiz)", category: "kitaplar", basePrice: 249, stores: ["test-magaza-atlas", "test-magaza-pusula", "test-magaza-kervan"], specs: { Sayfa: "320" } },
  { key: "dambil-set", brand: "Rota", title: "Rota Ayarlanabilir Dambıl Seti 20 kg", category: "spor", basePrice: 2999, stores: ["test-magaza-atlas"], specs: { Ağırlık: "2×10 kg" } },
];

/** Deterministik 0..1 sözde rastgele değer (aynı girdi → aynı çıktı). */
export function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Kurgusal ama geçerli kontrol basamaklı EAN-13. GS1 "mağaza içi kullanım" ön eki (200) kullanılır; gerçek ürün kodlarıyla çakışmaz. */
export function fixtureGtin(seed: string): string {
  const base = `200${String(Math.floor(hash01(seed) * 1e9)).padStart(9, "0")}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(base[i]) * (i % 2 === 0 ? 1 : 3);
  return `${base}${(10 - (sum % 10)) % 10}`;
}

/**
 * Test fiyat modeli: taban fiyat × mağaza farkı × hafif dalgalanma × ara sıra kampanya düşüşü.
 * `dayIndex` Unix gün sayısıdır; aynı gün için her zaman aynı fiyat üretilir.
 */
export function fixturePriceMinor(product: FixtureProduct, variant: FixtureVariant | null, store: string, dayIndex: number): number {
  const base = product.basePrice + (variant?.priceDelta ?? 0);
  const storeFactor = 0.96 + hash01(`${product.key}:${store}:factor`) * 0.1;
  const phase = hash01(`${product.key}:${store}:phase`) * 23;
  const wave = 1 + 0.035 * Math.sin((2 * Math.PI * (dayIndex + phase)) / 23);
  const block = Math.floor(dayIndex / 11);
  const saleRoll = hash01(`${product.key}:${store}:sale:${block}`);
  const inSale = saleRoll < 0.28 && dayIndex % 11 < 3 + Math.floor(saleRoll * 10);
  const sale = inSale ? 0.8 + hash01(`${product.key}:${block}:depth`) * 0.1 : 1;
  const tl = base * storeFactor * wave * sale;
  // ",90" ile biten perakende fiyat
  return Math.max(990, Math.round(tl / 10) * 1000 - 10);
}

export function fixtureStock(product: FixtureProduct, store: string, dayIndex: number): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  const r = hash01(`${product.key}:${store}:stock:${Math.floor(dayIndex / 5)}`);
  return r < 0.06 ? "OUT_OF_STOCK" : r < 0.14 ? "LOW_STOCK" : "IN_STOCK";
}
