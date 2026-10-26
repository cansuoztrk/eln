/**
 * Design consistency rules. A rule inspects the whole configuration and,
 * when it fires, explains the problem and offers concrete alternatives
 * (patches) the user can apply with one click.
 */
import type { DesignConfig, DesignPatch } from './design';
import { MATERIAL_BY_ID } from './materials';

export type RuleSeverity = 'conflict' | 'engineering' | 'info';

export interface RuleFinding {
  id: string;
  severity: RuleSeverity;
  title: string;
  detail: string;
  suggestions: { label: string; patch: DesignPatch }[];
}

type Rule = (d: DesignConfig) => RuleFinding | null;

const rules: Rule[] = [
  (d) =>
    d.language === 'minimal' && (d.screens.layout === 'media-facade' || d.screens.layout === 'extended' || d.roof.ring > 0.7)
      ? {
          id: 'minimal-vs-intense',
          severity: 'conflict',
          title: 'Sade mimari dil ile yoğun ışık/ekran birbirini zayıflatıyor',
          detail:
            'Pure Architecture dili geometri ve malzemeyi öne çıkarır. Medya cephesi, genişletilmiş ekranlar veya çok yoğun ışık halkası bu okumayı bastırır.',
          suggestions: [
            { label: 'Ekranları 360° banda indir', patch: { screens: { layout: 'ribbon' } } },
            { label: 'Halka yoğunluğunu %35 yap', patch: { roof: { ring: 0.35 } } },
            { label: 'Görsel dili “Fütürist” yap', patch: { language: 'futurist', dna: 'custom' } },
          ],
        }
      : null,
  (d) =>
    d.facade.lighting === 'media' && d.materials.facade === 'glass'
      ? {
          id: 'media-on-glass',
          severity: 'conflict',
          title: 'Cam cephe üzerinde medya cephesi',
          detail:
            'Medya cephesi görüntüsü yansıtıcı cam yüzeyde dağılır; ayrıca şeffaf LED ağı gibi ek bir katman gerektirir. Konsept olarak düzenli panel yüzeyi daha tutarlıdır.',
          suggestions: [
            { label: 'Cepheyi kompozit yap', patch: { materials: { facade: 'composite' } } },
            { label: 'Cephe ışığını “dinamik” yap', patch: { facade: { lighting: 'dynamic' } } },
          ],
        }
      : null,
  (d) =>
    d.roof.form === 'extended-canopy'
      ? {
          id: 'canopy-engineering',
          severity: 'engineering',
          title: 'Genişletilmiş kanopi ayrı bir mühendislik senaryosudur',
          detail:
            'Mevcut çatı taşıyıcı sistemine ek yük, rüzgâr ve kar etkileri, drenaj ve yangın senaryoları doğrulanmadan bu form uygulanabilir kabul edilemez. Model yalnızca görsel bir hipotez gösterir.',
          suggestions: [
            { label: 'Halo kenar eklentisine dön', patch: { roof: { form: 'halo' } } },
            { label: 'Mevcut formu koru', patch: { roof: { form: 'current' } } },
          ],
        }
      : null,
  (d) =>
    d.green.solar === 'extended' && d.roof.form === 'extended-canopy' && d.materials.roof === 'translucent'
      ? {
          id: 'solar-translucent',
          severity: 'conflict',
          title: 'Yarı saydam kanopi ile genişletilmiş GES yerleşimi çakışıyor',
          detail:
            'Paneller kanopinin ışık geçirgenliğini azaltır; iki hedef aynı yüzeyde birlikte en iyi sonucu vermez. Panelleri dış banda sınırlamak veya çatı yüzeyini kompozit yapmak daha tutarlıdır.',
          suggestions: [
            { label: 'Çatı yüzeyini kompozit yap', patch: { materials: { roof: 'composite' } } },
            { label: 'GES’i mevcut referansa indir', patch: { green: { solar: 'existing' } } },
          ],
        }
      : null,
  (d) =>
    !MATERIAL_BY_ID[d.materials.roof].targets.includes('roof')
      ? {
          id: 'roof-material',
          severity: 'conflict',
          title: `${MATERIAL_BY_ID[d.materials.roof].name} çatı için önerilen bir seçenek değil`,
          detail: 'Bu yüzey çatıda ağır bir görüntü ve yanıltıcı bir yapısal izlenim oluşturur.',
          suggestions: [
            { label: 'Yarı saydam yüzey', patch: { materials: { roof: 'translucent' } } },
            { label: 'Kompozit', patch: { materials: { roof: 'composite' } } },
          ],
        }
      : null,
  (d) =>
    (d.plaza.character === 'park' || d.plaza.character === 'garden') && !d.green.landscape
      ? {
          id: 'park-needs-landscape',
          severity: 'conflict',
          title: 'Park/bahçe meydan karakteri peyzaj sistemi olmadan uygulanamıyor',
          detail: 'Seçilen meydan karakteri ağaç, gölgelik ve yeşil yüzeyler gerektirir; peyzaj sistemi kapalı.',
          suggestions: [
            { label: 'Peyzajı aç', patch: { green: { landscape: true } } },
            { label: 'Kentsel meydana dön', patch: { plaza: { character: 'urban' } } },
          ],
        }
      : null,
  (d) =>
    d.plaza.character === 'event' && d.plaza.social === 'current'
      ? {
          id: 'event-needs-space',
          severity: 'conflict',
          title: 'Etkinlik meydanı mevcut ölçekte sıkışıyor',
          detail: 'Sahne ve toplanma alanları için sosyal alan ölçeğinin genişletilmesi gerekir.',
          suggestions: [
            { label: 'Sosyal alanı genişlet', patch: { plaza: { social: 'expanded' } } },
            { label: 'Kentsel meydan', patch: { plaza: { character: 'urban' } } },
          ],
        }
      : null,
  (d) =>
    d.roof.light === 'none' && d.roof.ring > 0.05
      ? {
          id: 'ring-without-light',
          severity: 'info',
          title: 'Işık halkası yoğunluğu etkisiz',
          detail: 'Çatı aydınlatması kapalı olduğu için halka yoğunluğu görünümü değiştirmez.',
          suggestions: [{ label: 'Halo ışık halkasını aç', patch: { roof: { light: 'halo-ring' } } }],
        }
      : null,
  (d) =>
    d.facade.lighting === 'media' && d.screens.layout !== 'media-facade'
      ? {
          id: 'media-lighting-without-layout',
          severity: 'info',
          title: 'Medya cephesi aydınlatması ekran düzeniyle eşleşmiyor',
          detail: 'Cephe medya modunda ama ekran düzeni medya cephesi içermiyor; cephe yalnızca renk akışı gösterir.',
          suggestions: [{ label: 'Ekran düzenini “Medya cephesi” yap', patch: { screens: { layout: 'media-facade' } } }],
        }
      : null,
  (d) =>
    d.green.solar === 'extended'
      ? {
          id: 'solar-extended',
          severity: 'engineering',
          title: 'GES genişletmesi teknik inceleme gerektirir',
          detail:
            'Stadyum çatısında halihazırda bir GES bulunuyor. Ek paneller için çatı taşıma kapasitesi, bağlantı ve şebeke koşulları ayrıca değerlendirilmelidir. Modeldeki yerleşim temsilidir.',
          suggestions: [],
        }
      : null,
];

export function evaluateRules(d: DesignConfig): RuleFinding[] {
  return rules.map((r) => r(d)).filter((x): x is RuleFinding => x !== null);
}
