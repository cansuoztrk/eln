/**
 * What each architectural parameter changes in the concept model, in plain
 * words, and where on the model to look. The texts describe what the model
 * actually renders for each value; they are not engineering statements.
 */
import type { ViewId } from '@/world/camera/views';

export interface ParamGuide {
  /** the camera view that frames the change */
  view: ViewId;
  /** lighting choices only read in the dark */
  night?: boolean;
  /** one line per value */
  values?: Record<string, string>;
  /** shown when there is no per-value line */
  note?: string;
}

export const PARAM_GUIDE: Record<string, ParamGuide> = {
  language: {
    view: 'facade',
    values: {
      heritage: 'Cephe kanatları bugünkü gibi sık ve düzenli bir dikey ritimde.',
      iconic: 'Daha derin kanatlar aynı açıyla döner; cephe yönlü, güçlü bir desen kazanır.',
      minimal: 'Kanat sayısı yarıya iner, kanatlar incelir; cephe sakinleşir.',
      futurist: 'Kanat açıları cephe boyunca dalgalanır; yer yer açılan, yer yer kapanan bir yüzey oluşur.',
      organic: 'Kanat derinliği ve yüksekliği dalgalanır; cephenin üst çizgisi yumuşak bir dalga çizer.',
    },
  },
  'roof.form': {
    view: 'roof',
    values: {
      current: 'Mevcut çatıya yakın referans geometri (ölçüsel olarak birebir değildir).',
      halo: 'Çatı iç kenarının üstüne dikmelerle taşınan ince bir halo halka eklenir.',
      'extended-canopy': 'Çatı içe ve dışa doğru uzar; taşıyıcı sistem için mühendislik değerlendirmesi gerekir.',
    },
  },
  'roof.light': {
    view: 'roofEdge',
    night: true,
    values: {
      none: 'Çatıda mimari ışık yok. Cephe ışığı bu seçimden etkilenmez.',
      'subtle-rim': 'Çatının iç kenarında ince, sürekli bir ışık çizgisi.',
      'halo-ring': 'İç kenarda kalın ve kesintisiz bir ışık halkası; halo çatı formunda halo halka da yanar.',
      segmented: 'İç kenar halkası 16 parçalı bir ritimle bölünür.',
      'full-crown': 'İç kenar halkasına ek olarak çatının dış kenarı da yanar.',
    },
  },
  'roof.ring': {
    view: 'roofEdge',
    night: true,
    note: 'Yalnızca çatı ışığının parlaklığı. Cephe ışığı bundan bağımsızdır; çatı ışığı kapalıyken etkisi yoktur.',
  },
  'facade.lighting': {
    view: 'facade',
    night: true,
    values: {
      static: 'Cephe yüzeyinde sabit, düşük yoğunluklu renk ışığı.',
      dynamic: 'Cephe boyunca ana ve ikincil renk arasında yavaşça akan bir renk geçişi; cephenin üst kenarına ışık bandı eklenir. Hareket azaltıldığında desen durur.',
      media: 'Cephe yüzeyinde yavaş akan örnek içerik ve üst kenar ışık bandı. Hareket azaltıldığında içerik durur.',
    },
  },
  'screens.layout': {
    view: 'stands',
    values: {
      standard: 'İki ana ekran ve saha kenarı LED panoları.',
      ribbon: 'Üst tribünün önüne 360° kesintisiz LED bandı eklenir.',
      extended: '360° bant, daha büyük ana ekranlar ve dört köşe ekranı (düşük kalitede köşe ekranları gizlenir).',
      'media-facade': 'Genişletilmiş düzene ek olarak dış cephede üç medya yüzeyi.',
    },
  },
  'seats.choreography': {
    view: 'stands',
    note: 'Koltuk renklerinin deseni; maç atmosferi ve ışık gösterileri bunun üzerine yazılabilir.',
  },
  'palette.night': {
    view: 'aerial',
    night: true,
    note: 'Gece görünümünde gökyüzü, ufuk ve sis tonu.',
  },
  'plaza.character': {
    view: 'plaza',
    values: {
      urban: 'Sert zeminli kentsel meydan (referans).',
      park: 'Peyzaj açıkken taraftar meydanına ağaçlar ve çim alanlar eklenir.',
      event: 'Taraftar meydanı açıkken meydana sahne ve büyük ekran duvarı eklenir.',
      garden: 'Peyzaj açıkken ağaç ve çimlere ek olarak gölgelik pavyonları eklenir.',
    },
  },
  'plaza.social': {
    view: 'social',
    values: {
      current: 'Ek sosyal alan yok.',
      expanded: 'Meydanın yanına pavyonlu bir sosyal alan eklenir.',
    },
  },
  palette: {
    view: 'aerial',
    note: 'Işık bantlarında, ekranlarda, meydan totemlerinde ve koltuk desenlerinde kullanılır.',
  },
};

export function paramHint(key: string, value: unknown): string | undefined {
  const g = PARAM_GUIDE[key];
  if (!g) return undefined;
  return (typeof value === 'string' && g.values?.[value]) || g.note;
}
