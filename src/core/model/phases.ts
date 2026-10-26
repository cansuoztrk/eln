/**
 * Time Machine. Each phase is derived from the user's own design: features
 * appear in the order a phased transformation could plausibly introduce
 * them, starting from an approximate reference of today's stadium.
 */
import { CURRENT_REFERENCE, cloneDesign, type DesignConfig } from './design';

export interface PhaseInfo {
  index: number;
  id: string;
  title: string;
  horizon: string;
  summary: string;
  changes: string[];
  fanBenefit: string[];
  dependencies: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  risks: string[];
  gate: string[];
  engineering: boolean;
}

export const PHASES: PhaseInfo[] = [
  {
    index: 0,
    id: 'reference',
    title: 'Mevcut yapı referansı',
    horizon: 'Bugün',
    summary:
      'Yaklaşık temsil: mevcut çatı formu, çatıdaki GES (doğrulanmış bilgi; yerleşim temsili), standart ekran düzeni ve sınırlı meydan programı.',
    changes: ['Değişiklik yok — karşılaştırma tabanı'],
    fanBenefit: ['Bugünkü deneyimin referansı'],
    dependencies: [],
    complexity: 1,
    risks: ['Model mevcut yapının ölçülmüş bir kopyası değildir'],
    gate: ['Mevcut durum envanteri ve rölöve verisi'],
    engineering: false,
  },
  {
    index: 1,
    id: 'short',
    title: 'Kısa vadeli modernizasyon',
    horizon: 'Aşama 1',
    summary: 'Yalnızca aydınlatma ve dijital ekranlar değişir: çatı ışığı, cephe aydınlatması, LED bantlar ve tribün koreografi kapasitesi.',
    changes: ['Çatı ışık halkası', 'Cephe aydınlatma senaryoları', 'LED bant / ekran düzeni', 'Tribün koreografisi'],
    fanBenefit: ['Maç gecesi atmosferi', 'Daha okunur bilgi ekranları'],
    dependencies: ['Elektrik altyapısı kapasitesi', 'Mevcut çatıya montaj noktaları', 'Işık kirliliği değerlendirmesi'],
    complexity: 2,
    risks: ['Montaj için sezon arası zaman penceresi', 'Komşu yerleşime ışık etkisi'],
    gate: ['Aydınlatma tasarım raporu', 'Elektrik yük analizi', 'Pilot uygulama sonucu'],
    engineering: false,
  },
  {
    index: 2,
    id: 'digital',
    title: 'Dijital ve operasyonel dönüşüm',
    horizon: 'Aşama 2',
    summary: 'Yön bulma, erişilebilir güzergâhlar, buluşma noktaları ve Stadium OS kavramı. Fiziksel değişiklik sınırlı, operasyon odaklı.',
    changes: ['Erişilebilir güzergâh işaretleri', 'Hizmet noktaları', 'Buluşma noktaları', 'Ulaşım bağlantı noktası'],
    fanBenefit: ['Daha kolay giriş ve yön bulma', 'Erişilebilirlik ihtiyacı olan ziyaretçiler için net rotalar'],
    dependencies: ['Kulüp operasyon ekipleriyle süreç tasarımı', 'Veri gizliliği ve güvenlik politikaları', 'Mevcut bilet/giriş sistemleriyle uyum'],
    complexity: 3,
    risks: ['Gerçek zamanlı veri kaynağı olmadan panelin yanıltıcı olması', 'Personel eğitimi'],
    gate: ['Kullanıcı araştırması', 'Pilot maç günü testi', 'KVKK değerlendirmesi'],
    engineering: false,
  },
  {
    index: 3,
    id: 'mid',
    title: 'Orta vadeli mimari gelişim',
    horizon: 'Aşama 3',
    summary: 'Çevre alanları dönüşür: taraftar meydanı, müze ve deneyim alanı, peyzaj, yağmur suyu ve sosyal yaşam bölgeleri.',
    changes: ['Taraftar meydanı', 'Müze ve deneyim alanı', 'Meydan peyzaj karakteri', 'Yeşil sistemler', 'Malzeme yenilemeleri'],
    fanBenefit: ['Maç öncesi ve sonrası yaşam alanı', 'Maç olmayan günlerde ziyaret nedeni'],
    dependencies: ['İmar ve parsel durumu', 'Belediye ve ilgili kurum onayları', 'Bütçe ve finansman modeli'],
    complexity: 4,
    risks: ['Parsel sınırları ve mülkiyet', 'İnşaat süresince maç günü operasyonu'],
    gate: ['Fizibilite raporu', 'Kentsel tasarım onayları', 'Etap planı'],
    engineering: false,
  },
  {
    index: 4,
    id: 'vision',
    title: 'Uzun vadeli ASLAN 2035 vizyonu',
    horizon: '2035 vizyonu',
    summary: 'Tasarımınızın tamamı: çatı formu eklentileri, medya cephesi ve genişletilmiş sistemler. Yapısal öneriler ayrı mühendislik senaryolarıdır.',
    changes: ['Çatı formu eklentisi (seçildiyse)', 'Medya cephesi (seçildiyse)', 'Genişletilmiş GES (seçildiyse)', 'Tam ışık gösterisi kapasitesi'],
    fanBenefit: ['İkonik bir gece kimliği', 'Bütünleşik bir maç günü ekosistemi'],
    dependencies: ['Statik ve rüzgâr analizleri', 'Yangın ve tahliye mühendisliği', 'Uzun vadeli finansman', 'Resmî onaylar'],
    complexity: 5,
    risks: ['Yapısal müdahalelerin uygulanabilirliği bilinmiyor', 'Maliyet belirsizliği', 'Uzun inşaat süresi'],
    gate: ['Bağımsız mühendislik değerlendirmesi', 'Paydaş onayı', 'Detaylı maliyet modeli'],
    engineering: true,
  },
];

/** Build the configuration shown at a given phase from the user's design. */
export function derivePhaseConfig(design: DesignConfig, phase: number): DesignConfig {
  const ref = cloneDesign(CURRENT_REFERENCE);
  if (phase <= 0) return ref;
  const d = cloneDesign(design);
  const out = cloneDesign(ref);
  out.dna = design.dna;
  // Phase 1 — lighting & digital
  out.roof.light = d.roof.light;
  out.roof.ring = d.roof.ring;
  out.facade.lighting = d.facade.lighting === 'media' ? 'dynamic' : d.facade.lighting;
  out.screens.layout = d.screens.layout === 'media-facade' ? 'ribbon' : d.screens.layout;
  out.seats.choreography = d.seats.choreography;
  out.palette = d.palette;
  out.show = d.show;
  out.green.efficientLighting = d.green.efficientLighting;
  if (phase >= 2) {
    out.access = d.access;
    out.district.meetingPoints = d.district.meetingPoints;
    out.district.transitHub = d.district.transitHub;
    out.green.transitLink = d.green.transitLink;
  }
  if (phase >= 3) {
    out.language = d.language;
    out.materials = d.materials;
    out.plaza = d.plaza;
    out.district = d.district;
    out.green = { ...d.green, solar: 'existing' };
  }
  if (phase >= 4) return d;
  return out;
}
