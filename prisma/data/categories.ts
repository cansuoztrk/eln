/**
 * Başlangıç kategori ağacı. Yönetim panelinden genişletilebilir.
 * keywords: otomatik sınıflandırma için (normalize edilmiş, Türkçe karakterler katlanmış).
 * filters: kategoriye özel filtreler. source=variant → varyant niteliği, source=spec → ürün özelliği.
 */

export type FilterDef = { key: string; label: string; source: "variant" | "spec"; options?: { value: string; label: string }[] };
export type CategorySeed = { slug: string; name: string; icon: string; keywords?: string[]; filters?: FilterDef[]; description?: string; children?: CategorySeed[] };

const connectivity: FilterDef = {
  key: "connectivity",
  label: "Bağlantı",
  source: "variant",
  options: [
    { value: "kablosuz", label: "Kablosuz" },
    { value: "kablolu", label: "Kablolu" },
    { value: "bluetooth", label: "Bluetooth" },
  ],
};
const color: FilterDef = { key: "color", label: "Renk", source: "variant" };
const capacity: FilterDef = { key: "capacity", label: "Kapasite", source: "variant" };

export const CATEGORY_TREE: CategorySeed[] = [
  {
    slug: "teknoloji",
    name: "Teknoloji ve bilgisayar",
    icon: "chip",
    description: "Oyuncu ekipmanları, bilgisayar bileşenleri, telefonlar ve ses sistemleri.",
    children: [
      { slug: "oyuncu-klavyeleri", name: "Oyuncu klavyeleri", icon: "keyboard", keywords: ["klavye", "keyboard", "mekanik klavye", "keycap"], filters: [connectivity, { key: "Switch", label: "Switch", source: "spec" }, { key: "Düzen", label: "Düzen", source: "spec" }] },
      { slug: "oyuncu-fareleri", name: "Oyuncu fareleri", icon: "mouse", keywords: ["mouse", "fare", "gaming mouse", "oyuncu faresi"], filters: [connectivity, color, { key: "DPI", label: "DPI", source: "spec" }] },
      { slug: "oyuncu-kulakliklari", name: "Oyuncu kulaklıkları", icon: "headset", keywords: ["oyuncu kulakligi", "gaming headset", "headset", "7.1"], filters: [connectivity] },
      { slug: "mousepad-ekipman", name: "Mousepad ve ekipmanlar", icon: "pad", keywords: ["mousepad", "mouse pad", "bilek destegi", "kablo tutucu"] },
      { slug: "monitorler", name: "Monitörler", icon: "monitor", keywords: ["monitor", "ekran 27", "oyuncu monitoru"], filters: [{ key: "Panel", label: "Panel", source: "spec" }, { key: "Yenileme", label: "Yenileme hızı", source: "spec" }, { key: "Çözünürlük", label: "Çözünürlük", source: "spec" }] },
      { slug: "ekran-kartlari", name: "Ekran kartları", icon: "gpu", keywords: ["ekran karti", "rtx", "radeon", "geforce", "graphics card"], filters: [{ key: "Bellek", label: "Bellek", source: "spec" }] },
      { slug: "islemciler", name: "İşlemciler", icon: "cpu", keywords: ["islemci", "cpu", "ryzen", "core i5", "core i7", "core ultra"], filters: [{ key: "Çekirdek", label: "Çekirdek", source: "spec" }] },
      { slug: "anakartlar", name: "Anakartlar", icon: "board", keywords: ["anakart", "motherboard"], filters: [{ key: "Soket", label: "Soket", source: "spec" }, { key: "Form", label: "Form faktörü", source: "spec" }] },
      { slug: "ram-ssd", name: "RAM ve SSD", icon: "memory", keywords: ["ram", "ddr4", "ddr5", "ssd", "nvme", "m.2"], filters: [capacity] },
      { slug: "hazir-oyun-bilgisayarlari", name: "Hazır oyun bilgisayarları", icon: "tower", keywords: ["oyun bilgisayari", "gaming pc", "masaustu oyun bilgisayari"] },
      { slug: "dizustu-bilgisayarlar", name: "Dizüstü bilgisayarlar", icon: "laptop", keywords: ["laptop", "dizustu", "notebook", "ultrabook", "macbook"], filters: [{ key: "RAM", label: "RAM", source: "spec" }, { key: "Depolama", label: "Depolama", source: "spec" }] },
      { slug: "telefon-tablet", name: "Telefonlar ve tabletler", icon: "phone", keywords: ["telefon", "akilli telefon", "smartphone", "tablet", "ipad", "iphone"], filters: [capacity, color] },
      { slug: "akilli-saatler", name: "Akıllı saatler", icon: "watch", keywords: ["akilli saat", "smartwatch", "akilli bileklik"] },
      { slug: "mikrofon-yayin", name: "Mikrofonlar ve yayın", icon: "mic", keywords: ["mikrofon", "microphone", "yayin", "capture card", "stream deck"] },
      { slug: "web-kameralari", name: "Web kameraları", icon: "camera", keywords: ["web kamerasi", "webcam"] },
      { slug: "konsol-aksesuar", name: "Oyun konsolları ve aksesuarları", icon: "gamepad", keywords: ["playstation", "ps5", "xbox", "nintendo", "konsol", "gamepad", "oyun kumandasi"] },
      { slug: "kulakliklar-ses", name: "Kulaklıklar ve ses sistemleri", icon: "speaker", keywords: ["kulaklik", "kulak ici", "anc", "bluetooth hoparlor", "soundbar", "hoparlor"], filters: [connectivity, color] },
    ],
  },
  {
    slug: "ev-yasam",
    name: "Ev ve yaşam",
    icon: "home",
    description: "Küçük ev aletleri, beyaz eşya, mutfak, mobilya ve aydınlatma.",
    children: [
      { slug: "kucuk-ev-aletleri", name: "Küçük ev aletleri", icon: "appliance", keywords: ["supurge", "robot supurge", "airfryer", "fritoz", "blender", "utu", "kettle", "tost makinesi"] },
      { slug: "beyaz-esya", name: "Beyaz eşyalar", icon: "fridge", keywords: ["buzdolabi", "camasir makinesi", "bulasik makinesi", "ankastre", "kurutma makinesi"] },
      { slug: "mutfak", name: "Mutfak ürünleri", icon: "kitchen", keywords: ["tencere", "tava", "espresso", "kahve makinesi", "bicak seti", "saklama kabi"] },
      { slug: "ev-dekorasyonu", name: "Ev dekorasyonu", icon: "decor", keywords: ["hali", "perde", "dekor", "vazo", "tablo", "yastik kilifi"] },
      { slug: "mobilya", name: "Mobilya", icon: "sofa", keywords: ["koltuk", "calisma masasi", "sandalye", "dolap", "yatak", "oyuncu koltugu", "kitaplik"] },
      { slug: "temizlik", name: "Temizlik ürünleri", icon: "spray", keywords: ["deterjan", "temizlik", "camasir suyu", "yumusatici"] },
      { slug: "aydinlatma", name: "Aydınlatma", icon: "lamp", keywords: ["lamba", "aydinlatma", "led serit", "ampul", "abajur", "avize"] },
    ],
  },
  {
    slug: "moda",
    name: "Moda ve kişisel ürünler",
    icon: "shirt",
    description: "Ayakkabı, giyim, çanta, aksesuar ve kişisel bakım.",
    children: [
      { slug: "ayakkabilar", name: "Ayakkabılar", icon: "shoe", keywords: ["ayakkabi", "sneaker", "bot", "terlik", "kosu ayakkabisi"], filters: [color] },
      { slug: "giyim", name: "Giyim", icon: "shirt", keywords: ["tisort", "mont", "kazak", "pantolon", "elbise", "gomlek", "sweatshirt"], filters: [color] },
      { slug: "cantalar", name: "Çantalar", icon: "bag", keywords: ["canta", "sirt cantasi", "valiz", "laptop cantasi"] },
      { slug: "aksesuarlar", name: "Aksesuarlar", icon: "glasses", keywords: ["cuzdan", "kemer", "gunes gozlugu", "kol saati"] },
      { slug: "kisisel-bakim", name: "Kişisel bakım", icon: "care", keywords: ["tras makinesi", "sac kurutma", "parfum", "epilasyon", "dis fircasi", "sac duzlestirici"] },
    ],
  },
  {
    slug: "diger",
    name: "Diğer fırsatlar",
    icon: "spark",
    description: "Kitap, hobi, spor, otomobil, ofis ve oyuncak.",
    children: [
      { slug: "kitaplar", name: "Kitaplar", icon: "book", keywords: ["kitap", "roman", "ciltsiz", "ciltli"] },
      { slug: "hobi-koleksiyon", name: "Hobi ve koleksiyon", icon: "puzzle", keywords: ["lego", "figur", "puzzle", "koleksiyon", "maket"] },
      { slug: "spor", name: "Spor ürünleri", icon: "dumbbell", keywords: ["dambil", "kosu bandi", "yoga mati", "bisiklet", "spor", "fitness"] },
      { slug: "oto-aksesuar", name: "Otomobil aksesuarları", icon: "car", keywords: ["oto", "arac ici", "arac kamerasi", "lastik", "oto aksesuar"] },
      { slug: "ofis", name: "Ofis ürünleri", icon: "printer", keywords: ["yazici", "toner", "kalem", "ofis", "fotokopi kagidi"] },
      { slug: "oyuncaklar", name: "Oyuncaklar", icon: "toy", keywords: ["oyuncak", "bebek", "rc araba", "egitici oyuncak"] },
      { slug: "diger-firsatlar", name: "Sınıflandırılmamış", icon: "spark", description: "Otomatik sınıflandırılamayan ürünler (yönetici incelemesi bekler)." },
    ],
  },
];
