/**
 * Object Inspector content for every selectable component of the twin.
 */
import type { ModuleId } from '@/core/modules';
import type { BadgeKind } from '@/ui/primitives';

export interface ComponentInfo {
  name: string;
  purpose: string;
  status: BadgeKind[];
  options: { label: string; module: ModuleId }[];
  notes: string[];
}

export const COMPONENTS: Record<string, ComponentInfo> = {
  pitch: {
    name: 'Saha',
    purpose: '105 × 68 m oyun alanı ve çevresindeki güvenlik bandı. Ölçüler kaynaklarla uyumludur; çim ve işaretler temsilidir.',
    status: ['verified', 'concept'],
    options: [
      { label: 'Saha bakımı optimizasyonu', module: 'green' },
      { label: 'Saha kenarı kamerası', module: 'explore' },
    ],
    notes: ['Mevcut zemin hibrit çimdir (kaynak: Wikipedia).', 'Sulama bölgeleri yalnızca kavramsal olarak gösterilir.'],
  },
  lowerTier: {
    name: 'Alt tribün',
    purpose: 'Sahaya en yakın oturma kademesi; tribün koreografisi ve koltuk deneyimi bu yüzey üzerinde gösterilir.',
    status: ['concept'],
    options: [
      { label: 'Tribün koreografisi', module: 'design' },
      { label: 'Koltuktan görüş', module: 'seats' },
    ],
    notes: ['Sıra derinliği ve yükseklikleri kavramsal profilden üretilmiştir.', 'Görüş çizgisi değerleri yaklaşıktır.'],
  },
  upperTier: {
    name: 'Üst tribün',
    purpose: 'Orta kuşak üzerindeki dik oturma kademesi; çatıyla birlikte kasenin akustik ve görsel çerçevesini oluşturur.',
    status: ['concept'],
    options: [
      { label: 'Koltuktan görüş', module: 'seats' },
      { label: 'Işık gösterisi', module: 'lightshow' },
    ],
    notes: ['Tribün eğimi ve ön cephe bandı temsilidir.'],
  },
  concourse: {
    name: 'İç dolaşım bölgeleri',
    purpose: 'Zemin ve orta kat dolaşım halkaları, kiosklar ve tribün girişleri. Konsept seviyesinde iç mekân.',
    status: ['concept'],
    options: [
      { label: 'Taraftar akışı', module: 'crowd' },
      { label: 'Dolaşım alanına git', module: 'explore' },
    ],
    notes: ['Gerçek iç mekân planı kullanılmamıştır.', 'Kat yükseklikleri ve kolon ritmi örnektir.'],
  },
  skyboxes: {
    name: 'Localar ve orta kuşak',
    purpose: 'Alt ve üst tribün arasındaki cam bant; localar ve vomitoryum açıklıkları.',
    status: ['concept'],
    options: [{ label: 'Tribün girişine git', module: 'explore' }],
    notes: ['Mevcut yapıda 221 loca bulunduğu belirtilmektedir (kaynak: Wikipedia). Modeldeki yerleşim temsilidir.'],
  },
  kiosks: {
    name: 'Kiosklar ve yön bulma',
    purpose: 'Dolaşım halkası boyunca hizmet noktaları ve aydınlatılmış yönlendirme.',
    status: ['concept'],
    options: [{ label: 'Fan Journey Builder', module: 'journey' }],
    notes: ['Kiosk sayısı ve yerleri örnektir.'],
  },
  tunnel: {
    name: 'Oyuncu tüneli',
    purpose: 'Kuzey tribün altında sahaya çıkış koridoru konsepti.',
    status: ['concept'],
    options: [{ label: 'Tünel kamerası', module: 'explore' }],
    notes: ['Tünelin gerçek konumu ve ölçüleri doğrulanmamıştır.'],
  },
  massing: {
    name: 'Ana stadyum kütlesi',
    purpose: 'Kaide, düşey çekirdekler ve iç kabuk duvarları: binanın sade kütlesel okuması.',
    status: ['concept'],
    options: [{ label: 'Kaide malzemesi', module: 'materials' }],
    notes: ['Yaklaşık dış ölçüler (≈228 × 190 m) yayımlanmış referanslardan alınmıştır; kaynaklar arasında farklılık vardır.'],
  },
  roof: {
    name: 'Çatı',
    purpose: 'Tribünleri örten halka çatı. Form seçenekleri ve yüzey malzemesi tasarım motorundan değişir.',
    status: ['concept'],
    options: [
      { label: 'Çatı formu ve ışığı', module: 'design' },
      { label: 'Çatı malzemesi', module: 'materials' },
      { label: 'What-If: çatı vs. ışık', module: 'whatif' },
    ],
    notes: ['Çatı formuna yapılacak eklentiler ayrı mühendislik senaryolarıdır.', 'Çatıdaki GES gerçek bir uygulamadır; modeldeki yerleşim temsilidir.'],
  },
  halo: {
    name: 'Halo çatı kenarı eklentisi',
    purpose: 'İç çatı kenarının üzerinde ışık taşıyan ince bir halka konsepti.',
    status: ['concept', 'eng'],
    options: [{ label: 'Çatı formu', module: 'design' }],
    notes: ['Ek yük, rüzgâr ve bakım erişimi değerlendirilmelidir.'],
  },
  structure: {
    name: 'Kavramsal taşıyıcı sistem',
    purpose: 'Radyal çatı kirişleri, basınç halkası ve çevre kolonları. Taşıyıcı mantığı anlatmak için şematiktir.',
    status: ['concept'],
    options: [{ label: 'Taşıyıcı görünümü malzemesi', module: 'materials' }],
    notes: ['Gerçek taşıyıcı sistemi temsil etmez; statik hesap içermez.'],
  },
  compressionRing: {
    name: 'İç basınç halkası (şematik)',
    purpose: 'Çatı kirişlerinin iç kenarda birleştiği halka elemanının kavramsal gösterimi.',
    status: ['concept'],
    options: [],
    notes: ['Mühendislik çizimi değildir.'],
  },
  facade: {
    name: 'Dış cephe',
    purpose: 'Düşey kanatlar ve arkalarındaki aydınlatılabilir cephe yüzeyi; gece kimliğinin ana taşıyıcısı.',
    status: ['concept'],
    options: [
      { label: 'Cephe malzemesi', module: 'materials' },
      { label: 'Cephe aydınlatması', module: 'design' },
    ],
    notes: ['Kanat sayısı ve eğimi temsilidir.', 'Medya cephesi için ek elektrik ve bakım altyapısı gerekir.'],
  },
  lighting: {
    name: 'Aydınlatma bileşenleri',
    purpose: 'Çatı ışık halkası, taç ışığı, projektörler ve cephe ışık bandı.',
    status: ['concept'],
    options: [
      { label: 'Light Show Composer', module: 'lightshow' },
      { label: 'Atmosfer', module: 'matchday' },
    ],
    notes: ['Web tabanlı görsel simülasyondur; gerçek aydınlatma altyapısına bağlı değildir.'],
  },
  lightRing: {
    name: 'Çatı ışık halkası',
    purpose: 'İç çatı kenarı boyunca uzanan ve gösterilerle senkronize olan ışık bandı.',
    status: ['concept'],
    options: [
      { label: 'Halka yoğunluğu', module: 'design' },
      { label: 'Işık gösterisi', module: 'lightshow' },
    ],
    notes: ['Animasyon hızı fotosensitiviteye karşı sınırlandırılmıştır.'],
  },
  floodlights: {
    name: 'Projektörler',
    purpose: 'Çatı iç kenarının altındaki saha aydınlatması (temsili).',
    status: ['concept'],
    options: [{ label: 'Verimli aydınlatma', module: 'green' }],
    notes: ['Aydınlatma seviyeleri ölçülmüş değildir.'],
  },
  screens: {
    name: 'LED ekranlar',
    purpose: 'Ana ekranlar, 360° tribün bandı, saha kenarı panoları ve medya cephesi.',
    status: ['concept'],
    options: [{ label: 'Ekran düzeni', module: 'design' }],
    notes: ['İçerikler özgün örnek metinlerdir; sponsor veya yayın içeriği kullanılmaz.'],
  },
  ledRibbon: { name: '360° LED bandı', purpose: 'Üst tribün ön yüzündeki kesintisiz ekran bandı.', status: ['concept'], options: [{ label: 'Ekran düzeni', module: 'design' }], notes: ['Görüş açısı ve parlaklık etkisi incelenmelidir.'] },
  endScreens: { name: 'Ana ekranlar', purpose: 'Kale arkalarındaki büyük ekranlar.', status: ['concept'], options: [{ label: 'Ekran düzeni', module: 'design' }], notes: ['Mevcut ekranların ölçü ve konumu doğrulanmamıştır.'] },
  perimeterBoards: { name: 'Saha kenarı panoları', purpose: 'Saha çevresindeki LED panolar.', status: ['concept'], options: [], notes: ['Örnek içerik gösterilir.'] },
  mediaFacade: { name: 'Medya cephesi', purpose: 'Cephe dışında içerik gösterebilen eğrisel LED yüzey konsepti.', status: ['concept', 'eng'], options: [{ label: 'Ekran düzeni', module: 'design' }], notes: ['Işık kirliliği, izin süreçleri ve bakım erişimi değerlendirilmelidir.'] },
  solar: {
    name: 'Güneş enerjisi',
    purpose: 'Çatıdaki mevcut GES’in temsili yerleşimi ve genişletme senaryoları.',
    status: ['verified', 'concept'],
    options: [{ label: 'Green Stadium Engine', module: 'green' }],
    notes: ['Mevcut kurulum: 10.000+ panel, yaklaşık 4,2–4,3 MW kurulu güç (kaynaklar arasında küçük farklar vardır).', 'Paneller modelde temsili olarak yerleştirilmiştir.'],
  },
  solarRoof: {
    name: 'Çatı GES’i (mevcut, temsili yerleşim)',
    purpose: 'Doğrulanmış bir uygulamanın modeldeki temsili.',
    status: ['verified'],
    options: [{ label: 'Kaynaklar', module: 'about' }],
    notes: ['Enerjisa basın bülteni: 4,2 MW, 10.000+ panel. StadiumDB: 4,3 MW, ~10.500 panel.'],
  },
  solarCanopies: { name: 'GES kanopileri (senaryo)', purpose: 'Otopark ve meydan üzerinde güneş kanopileri.', status: ['concept', 'eng'], options: [{ label: 'Green Stadium Engine', module: 'green' }], notes: ['Kanopi taşıyıcıları ve imar uygunluğu ayrıca incelenmelidir.'] },
  surroundings: { name: 'Çevre yapıları', purpose: 'Meydan, pavyonlar, müze ve etkinlik alanları.', status: ['concept'], options: [{ label: 'Stadium City', module: 'city' }], notes: ['Yerleşim şematiktir; gerçek parsel sınırlarını göstermez.'] },
  fanPlaza: { name: 'Taraftar meydanı', purpose: 'Maç öncesi buluşma ve etkinlik alanı.', status: ['concept'], options: [{ label: 'Stadium City', module: 'city' }, { label: 'Meydan karakteri', module: 'design' }], notes: ['Kapasite ve güvenlik planlaması yapılmamıştır.'] },
  social: { name: 'Sosyal yaşam alanı', purpose: 'Pavyonlar ve gölgeli oturma.', status: ['concept'], options: [{ label: 'What-If: sosyal alan', module: 'whatif' }], notes: ['Ticari model ve işletme ayrıca araştırılmalıdır.'] },
  museum: { name: 'Müze ve deneyim alanı', purpose: 'Kulüp tarihi ve stadyum turu başlangıcı.', status: ['concept'], options: [{ label: 'Stadium City', module: 'city' }], notes: ['Program ve büyüklük örnektir.'] },
  eventLawn: { name: 'Etkinlik çimi', purpose: 'Açık hava etkinlikleri için çim alan ve sahne.', status: ['concept'], options: [{ label: 'Stadium City', module: 'city' }], notes: ['Gürültü ve komşu etkileri değerlendirilmelidir.'] },
  landscape: { name: 'Peyzaj alanları', purpose: 'Ağaçlar, çim alanlar ve gölgelik elemanları.', status: ['concept'], options: [{ label: 'Green Stadium Engine', module: 'green' }], notes: ['Tür seçimi ve sulama ihtiyacı belirtilmemiştir.'] },
  greenPark: { name: 'Dinlenme ve yeşil alan', purpose: 'Gölgeli dinlenme ve yürüyüş alanı.', status: ['concept'], options: [{ label: 'Stadium City', module: 'city' }], notes: [] },
  rainwater: { name: 'Yağmur suyu yönetimi', purpose: 'Biyo-hendekler ve depolama tankları (kavramsal).', status: ['concept'], options: [{ label: 'Green Stadium Engine', module: 'green' }], notes: ['Hacim ve verim hesabı yapılmamıştır.'] },
  waste: { name: 'Atık ayrıştırma noktaları', purpose: 'Meydan ve dolaşım bağlantılarında ayrıştırma istasyonları.', status: ['concept'], options: [{ label: 'Green Stadium Engine', module: 'green' }], notes: [] },
  access: { name: 'Erişilebilirlik güzergâhları', purpose: 'Erişilebilir indirme noktalarından kapılara ve tribün platformlarına uzanan örnek rotalar.', status: ['concept'], options: [{ label: 'Fan Journey Builder', module: 'journey' }, { label: 'Stadium OS: Access & Inclusion', module: 'os' }], notes: ['Rotalar örnektir; mevcut koşullarda kullanılabilirliği doğrulanmamıştır.'] },
  accessRoutes: { name: 'Erişilebilir rotalar', purpose: 'Mavi ile işaretli örnek güzergâhlar ve tribün platformları.', status: ['concept'], options: [{ label: 'Fan Journey Builder', module: 'journey' }], notes: ['Eğim ve mesafe değerleri ölçülmemiştir.'] },
  transit: { name: 'Ulaşım ve giriş bölgeleri', purpose: 'Kapılar, yaya bağlantıları, indirme alanı ve şematik ulaşım bağlantısı.', status: ['concept'], options: [{ label: 'Crowd Flow Simulator', module: 'crowd' }, { label: 'Stadium City', module: 'city' }], notes: ['Stadyuma en yakın raylı sistem bağlantısı Seyrantepe (M2) istasyonudur (kaynak: Wikipedia). Modeldeki yol ve konumlar şematiktir.'] },
  gates: { name: 'Giriş kapıları (A–H)', purpose: 'Örnek kapı düzeni; harfler konsept modele aittir.', status: ['concept'], options: [{ label: 'Crowd Flow Simulator', module: 'crowd' }], notes: ['Gerçek kapı numaralandırması ve konumları kullanılmamıştır.'] },
  transitHub: { name: 'Toplu taşıma bağlantı noktası (şematik)', purpose: 'Kapalı yürüyüş bağlantısı ve yön bulma için konsept pavyon.', status: ['concept'], options: [{ label: 'Stadium City', module: 'city' }], notes: ['Gerçek istasyon konumunu göstermez.'] },
};

export function componentInfo(id: string): ComponentInfo {
  return COMPONENTS[id] ?? { name: id, purpose: 'Konsept bileşen.', status: ['concept'], options: [], notes: [] };
}
