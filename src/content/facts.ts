/**
 * Verified reference information about the existing stadium, with sources.
 * Retrieved October 2026. Where sources disagree, the disagreement is shown.
 */
export interface Source {
  id: string;
  title: string;
  url: string;
  publisher: string;
}

export const SOURCES: Source[] = [
  { id: 'wiki', title: 'Rams Park', url: 'https://en.wikipedia.org/wiki/Rams_Park', publisher: 'Wikipedia (İngilizce), Ekim 2026 erişimi' },
  {
    id: 'enerjisa',
    title: 'A new Guinness World Records title by Enerjisa and Galatasaray',
    url: 'https://www.enerjisa.com.tr/en/about-enerjisa/media-centre/press-releases/a-new-guinness-world-records-title-by-enerjisa-and-galatasaray',
    publisher: 'Enerjisa basın bülteni (2022)',
  },
  {
    id: 'stadiumdb',
    title: 'Turkey: Galatasaray stadium gets Guinness listed',
    url: 'https://stadiumdb.com/news/2022/04/turkey_galatasaray_stadium_gets_guinness_listed',
    publisher: 'StadiumDB (2022)',
  },
];

export interface Fact {
  label: string;
  value: string;
  sources: string[];
  note?: string;
}

export const FACTS: Fact[] = [
  { label: 'Resmî ad', value: 'Ali Sami Yen Spor Kompleksi — sponsorluk adıyla RAMS Park', sources: ['wiki'] },
  { label: 'Konum', value: 'Seyrantepe, Sarıyer — İstanbul (Avrupa yakası)', sources: ['wiki'] },
  { label: 'Açılış', value: '15 Ocak 2011', sources: ['wiki'] },
  {
    label: 'Kapasite',
    value: '53.387 (2026 itibarıyla)',
    sources: ['wiki'],
    note: 'Kapasite yıllar içinde değişmiştir (52.695 → 52.280 → 53.978 → 53.387). Bazı rehberler hâlâ eski değerleri listeler.',
  },
  { label: 'Saha', value: '105 × 68 m, hibrit çim (2018’den itibaren)', sources: ['wiki'] },
  { label: 'Mimar', value: 'asp Architekten (Stuttgart)', sources: ['wiki'], note: 'Mühendislik: İz Mühendislik, Yüksel Proje, Schlaich Bergermann & Partner; tesisat: Obermeyer.' },
  { label: 'Localar', value: '221', sources: ['wiki'] },
  { label: 'Yaklaşık dış ölçü', value: '≈228 × 190 m', sources: ['wiki'], note: 'Kaynak içinde alan değerleri birbiriyle çelişiyor (190.000 / 195.000 m²). Model yalnızca oranlar için kullanır.' },
  {
    label: 'Çatı güneş enerjisi santrali',
    value: '10.000+ panel, ≈4,2–4,3 MW kurulu güç; 2022’de faaliyete geçti',
    sources: ['enerjisa', 'stadiumdb', 'wiki'],
    note: 'Enerjisa 4,2 MW ve 10.000+ panel; StadiumDB 4,3 MW ve ~10.500 panel; Wikipedia 10.404 panel ve 4,3 MW belirtiyor. Bir spor stadyumunda en yüksek güneş enerjisi kurulu gücü dalında Guinness Dünya Rekoru.',
  },
  { label: 'Raylı sistem erişimi', value: 'Seyrantepe metro istasyonu (M2 hattı)', sources: ['wiki'] },
];

export const ASSUMPTIONS: string[] = [
  'Bu çalışma bağımsız bir konsept platformudur; Galatasaray SK, RAMS veya ilgili kurumlarla bağlantılı ya da onaylı değildir.',
  '3D model prosedürel olarak üretilmiştir. Yayımlanmış saha ve dış ölçü oranlarını izler ancak ölçülmüş bir rölöve değildir.',
  'İç mekânlar (dolaşım, tünel, localar) konsept seviyesindedir; gerçek planları temsil etmez.',
  'Çevre yerleşimi (meydan, müze, ulaşım pavyonu, yollar) şematiktir; gerçek parsel ve yol ağını göstermez.',
  'Simülasyon etiketli tüm sayısal değerler örnektir ve gerçek ölçüm değildir.',
  'Kalabalık akışı simülasyonu bir tahliye veya güvenlik hesabı değildir; bu kararlar yetkin uzmanlarca verilmelidir.',
  'Maliyet tahmini yapılmamıştır; doğrulanmış teklif veya dayanak olmadan para değeri üretilmez.',
  'AI Architect varsayılan olarak kural tabanlı bir demo yorumlayıcıdır; mühendislik onayı yerine geçmez.',
  'Sesler tarayıcıda gerçek zamanlı sentezlenen özgün seslerdir; kulüp tezahüratı veya yayın kaydı kullanılmaz.',
];
