/**
 * Material Lab catalogue. These are visual concept materials. The texts
 * deliberately avoid fire rating, structural or energy-performance claims;
 * those require verified technical data for a real specification.
 */
import type { MaterialId, MaterialTarget } from './design';

export interface MaterialVisual {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  /** procedural texture pattern used to give the surface character */
  pattern: 'none' | 'brushed' | 'speckle' | 'panel' | 'noise' | 'frit';
  emissiveBoost: number;
}

export interface MaterialInfo {
  id: MaterialId;
  name: string;
  character: string;
  purpose: string;
  advantages: string[];
  review: string[];
  visual: MaterialVisual;
  /** Components where this material is offered as a concept option */
  targets: MaterialTarget[];
}

export const MATERIALS: MaterialInfo[] = [
  {
    id: 'brushed-metal',
    name: 'Fırçalanmış metal',
    character: 'Yumuşak, yönlü yansımalar; gece ışığını dağınık biçimde taşır.',
    purpose: 'Cephe kanatlarında ve taşıyıcı görünümünde mevcut kimliğe yakın, ölçülü bir modernizasyon.',
    advantages: ['Mevcut yapının görsel diliyle uyumlu bir okuma', 'Renkli ışığı abartmadan taşır'],
    review: ['Kaplama türü ve korozyon koruması', 'Temizlik ve bakım periyodu', 'Yansıma/parlama etkisi'],
    visual: { color: '#a7adb6', metalness: 0.85, roughness: 0.38, opacity: 1, pattern: 'brushed', emissiveBoost: 0 },
    targets: ['facade', 'roof', 'structure'],
  },
  {
    id: 'dark-metal',
    name: 'Koyu metal',
    character: 'Mat, grafit tonlu; ışık çizgilerini kontrastla öne çıkarır.',
    purpose: 'Sade mimari dil ve ışık bantlarının belirgin okunması.',
    advantages: ['Işık detaylarının kontrastını artırır', 'Kütleyi gece daha sakin gösterir'],
    review: ['Güneş altında yüzey ısınması', 'Renk kalıcılığı', 'Kaplama tamiri'],
    visual: { color: '#2b2e34', metalness: 0.7, roughness: 0.55, opacity: 1, pattern: 'panel', emissiveBoost: 0 },
    targets: ['facade', 'roof', 'structure', 'plinth'],
  },
  {
    id: 'glass',
    name: 'Cam',
    character: 'Derin, yansıtıcı; iç mekân ışığını dışarıya taşır.',
    purpose: 'Giriş ve sosyal alanlarda şeffaflık; cephede iç hareketin görünmesi.',
    advantages: ['Gece iç aktiviteyi görünür kılar', 'Hafif bir görsel etki'],
    review: ['Güneş kontrolü ve ısı kazancı', 'Kuş çarpması önlemleri', 'Temizlik erişimi', 'Ağırlık ve taşıyıcı etkisi'],
    visual: { color: '#7fa3b8', metalness: 0.2, roughness: 0.06, opacity: 0.45, pattern: 'none', emissiveBoost: 0.1 },
    targets: ['facade', 'plinth'],
  },
  {
    id: 'concrete',
    name: 'Beton',
    character: 'Ağır, mineral; zemin seviyesinde kalıcılık ve sağlamlık hissi.',
    purpose: 'Kaide, merdiven kütleleri ve meydan bağlantıları.',
    advantages: ['Zemin seviyesinde dayanıklı bir görünüm', 'Peyzajla doğal geçiş'],
    review: ['Yüzey işlemi ve leke direnci', 'Karbon ayak izi değerlendirmesi', 'Derz detayları'],
    visual: { color: '#8a8780', metalness: 0, roughness: 0.92, opacity: 1, pattern: 'noise', emissiveBoost: 0 },
    targets: ['plinth', 'structure'],
  },
  {
    id: 'composite',
    name: 'Kompozit cephe',
    character: 'Düzgün paneller, keskin derzler; dijital estetiğe yakın.',
    purpose: 'Medya cephesi ve fütürist kompozisyonlar için düzenli yüzey.',
    advantages: ['Panel ritmiyle LED entegrasyonu için düzenli bir zemin', 'Renk seçeneği esnekliği'],
    review: ['Yangın davranışı sertifikasyonu (zorunlu kontrol)', 'Panel bağlantı detayları', 'UV dayanımı'],
    visual: { color: '#d9d6cf', metalness: 0.15, roughness: 0.45, opacity: 1, pattern: 'panel', emissiveBoost: 0 },
    targets: ['facade', 'roof'],
  },
  {
    id: 'translucent',
    name: 'Yarı saydam mimari yüzey',
    character: 'Işığı süzer, gece içeriden parlar; çatıda hafiflik.',
    purpose: 'Çatı yüzeyinde ve cephede “içten aydınlanan” bir kütle.',
    advantages: ['Gündüz doğal ışık geçişi kavramı', 'Gece içten aydınlanan siluet'],
    review: ['Membran/levha türü ve ömrü', 'Kirlenme ve temizlik', 'Akustik etkiler', 'GES panelleriyle birlikte kullanım'],
    visual: { color: '#efe9dc', metalness: 0, roughness: 0.6, opacity: 0.78, pattern: 'frit', emissiveBoost: 0.25 },
    targets: ['roof', 'facade'],
  },
  {
    id: 'recycled',
    name: 'Geri dönüştürülmüş malzemeden esinlenen yüzey',
    character: 'Benekli, sıcak dokulu; sürdürülebilirlik anlatısını görünür kılar.',
    purpose: 'Green Stadium konseptinde malzeme hikâyesini taşıyan yüzeyler.',
    advantages: ['Sürdürülebilirlik hikâyesini görsel olarak anlatır', 'Doğal dokuyla peyzaja uyum'],
    review: ['Gerçek geri dönüştürülmüş içerik oranı (doğrulama gerekir)', 'Dış ortam dayanımı', 'Tedarik sürekliliği'],
    visual: { color: '#7d7a6c', metalness: 0.1, roughness: 0.8, opacity: 1, pattern: 'speckle', emissiveBoost: 0 },
    targets: ['facade', 'plinth', 'structure'],
  },
  {
    id: 'gold-metal',
    name: 'Işığı yansıtan altın tonlu metal',
    character: 'Sıcak, parlak; kırmızı ışıkla birlikte güçlü bir ikon etkisi.',
    purpose: 'Red & Gold Icon konseptinde cephe kanatları ve vurgu elemanları.',
    advantages: ['Kulüp renkleriyle güçlü bir gece kimliği', 'Işığı yansıtarak hacim etkisi'],
    review: ['Parlama/yansıma etkisinin çevreye etkisi', 'Renk tonunun zamanla değişimi', 'Kaplama maliyeti (ayrıca araştırılmalı)'],
    visual: { color: '#c9a04a', metalness: 0.92, roughness: 0.28, opacity: 1, pattern: 'brushed', emissiveBoost: 0 },
    targets: ['facade', 'structure', 'roof'],
  },
];

export const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((m) => [m.id, m])) as Record<MaterialId, MaterialInfo>;

export function materialsFor(target: MaterialTarget): MaterialInfo[] {
  return MATERIALS.filter((m) => m.targets.includes(target));
}
