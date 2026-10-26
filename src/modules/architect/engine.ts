/**
 * AI Architect — rule-based demo interpreter (default engine).
 *
 * It recognises a fixed set of intents in Turkish or English text, maps
 * them to supported design parameters, and explains what changed, what is
 * unknown and which technical constraints apply. It is NOT a language model
 * and never claims to be one; unsupported requests get an honest answer.
 */
import { applyPatch, diffDesigns, type DesignConfig, type DesignPatch, type DnaId, type MaterialId, type ShowPresetId } from '@/core/model/design';
import { DNA_BY_ID } from '@/core/model/dna';
import { SHOW_BY_ID } from '@/core/model/lightshow';
import { MATERIAL_BY_ID } from '@/core/model/materials';
import { evaluateRules } from '@/core/model/rules';
import { PHASES } from '@/core/model/phases';
import type { LayerId } from '@/core/layers';
import type { AtmosphereId, SectionMode } from '@/core/store/viewStore';
import type { CameraPose } from '@/world/worldApi';

export interface ViewAction {
  section?: SectionMode;
  exploded?: boolean;
  layers?: Partial<Record<LayerId, boolean>>;
  atmosphere?: AtmosphereId;
  highlight?: LayerId[];
  camera?: CameraPose;
  undo?: boolean;
}

export interface ArchitectResponse {
  engine: 'rules' | 'remote';
  understood: string[];
  patch: DesignPatch | null;
  dna?: DnaId;
  view: ViewAction;
  explanation: string[];
  unknowns: string[];
  constraints: string[];
  analysis?: string[];
  outOfScope?: string[];
  help?: boolean;
}

export interface ArchitectContext {
  design: DesignConfig;
  locks: string[];
  previous: DesignConfig | null;
  archive: { name: string; config: DesignConfig }[];
}

const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', İ: 'i' };
export function normalize(text: string) {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîûİ]/g, (c) => TR_MAP[c] ?? c)
    .replace(/[^a-z0-9&%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Word-start match: "cati" matches "catiyi", "isik" matches "isiklarini" (Turkish suffixes). */
const has = (t: string, ...words: string[]) => words.some((w) => new RegExp(`(^|\\s)${esc(w)}`).test(t));

const COLORS: [string[], string][] = [
  [['kirmizi', 'red', 'kizil'], '#d4213d'],
  [['sari', 'altin', 'gold', 'yellow'], '#f2b631'],
  [['beyaz', 'white'], '#f3f1ea'],
  [['lacivert', 'mavi', 'blue', 'navy'], '#2b5fd9'],
  [['yesil', 'green'], '#2fa36b'],
  [['mor', 'purple', 'violet'], '#7a4bd6'],
  [['turuncu', 'orange'], '#ff7a1a'],
];

const MATERIAL_WORDS: [string[], MaterialId][] = [
  [['koyu metal', 'dark metal', 'siyah metal', 'grafit'], 'dark-metal'],
  [['altin metal', 'altin tonlu', 'gold metal', 'altin renkli metal'], 'gold-metal'],
  [['fircalanmis', 'brushed', 'paslanmaz', 'gumus'], 'brushed-metal'],
  [['yari saydam', 'translucent', 'membran'], 'translucent'],
  [['geri donus', 'recycled', 'geri donusturulmus'], 'recycled'],
  [['kompozit', 'composite'], 'composite'],
  [['beton', 'concrete'], 'concrete'],
  [['cam', 'glass'], 'glass'],
];

const SHOW_WORDS: [string[], ShowPresetId][] = [
  [['arrival', 'aslanlarin gelisi', 'sahaya cikis'], 'arrival'],
  [['red wave', 'kirmizi dalga'], 'red-wave'],
  [['golden halo', 'altin hale', 'altin halka'], 'golden-halo'],
  [['european night', 'avrupa gecesi'], 'european-night'],
  [['the roar', 'roar', 'kukreme'], 'roar'],
  [['championship', 'sampiyonluk kutlama'], 'championship'],
];

const DNA_WORDS: [string[], DnaId][] = [
  [['classic evolution', 'klasik evrim'], 'classic'],
  [['red & gold', 'red and gold', 'red gold', 'kirmizi altin ikon', 'kirmizi ve altin ikon'], 'redgold'],
  [['pure architecture', 'saf mimari', 'sade mimari'], 'pure'],
  [['future arena', 'gelecek arenasi'], 'future'],
  [['green stadium', 'yesil stadyum'], 'green'],
];

function merge(a: DesignPatch, b: DesignPatch): DesignPatch {
  const out = structuredClone(a) as Record<string, unknown>;
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    out[k] = cur && typeof cur === 'object' && v && typeof v === 'object' && !Array.isArray(v) ? { ...(cur as object), ...(v as object) } : v;
  }
  return out as DesignPatch;
}

export function interpret(input: string, ctx: ArchitectContext): ArchitectResponse {
  const t = normalize(input);
  const d = ctx.design;
  const res: ArchitectResponse = { engine: 'rules', understood: [], patch: null, view: {}, explanation: [], unknowns: [], constraints: [] };
  let patch: DesignPatch = {};
  const add = (p: DesignPatch) => (patch = merge(patch, p));

  if (!t) return { ...res, help: true };

  // ---- undo ----
  if (has(t, 'geri al', 'undo', 'eski haline', 'vazgec')) {
    res.understood.push('Son değişikliği geri alma isteği');
    res.view.undo = true;
    res.explanation.push('Tasarım geçmişindeki son adım geri alınır. Sürüm geçmişi Design Archive modülünde de görülebilir.');
    return res;
  }

  // ---- out-of-scope / physically unsupported ----
  const out: string[] = [];
  if (has(t, 'kapasite', 'capacity', 'koltuk sayisi', 'seat count', 'kisilik')) {
    out.push('Kapasite değişikliği bu konsept modelin parametreleri arasında değildir. Tribün geometrisi, tahliye, mevzuat ve yapısal analiz gerektirir; doğal dil isteğiyle uygulanabilir bir tasarıma dönüştürülemez.');
  }
  if (has(t, 'acilir cati', 'kapanir cati', 'retractable', 'kapali cati', 'cati kapansin', 'tamamen kapat')) {
    out.push('Açılır/kapanır çatı bu modelde yer almaz. Mevcut taşıyıcı sisteme büyük ek yük getirir ve bağımsız mühendislik analizi gerektirir. En yakın konsept seçenek “Genişletilmiş kanopi” senaryosudur (mühendislik değerlendirmesi gerekir).');
  }
  if (has(t, 'yik', 'yeni stadyum', 'yeniden insa', 'demolish', 'kat ekle', 'tribun ekle', 'ucuncu tribun')) {
    out.push('Yıkım, yeni kat veya tribün eklemek gibi büyük yapısal müdahaleler bu platformda simüle edilmez; ayrı fizibilite ve mühendislik çalışmaları gerektirir.');
  }
  if (has(t, 'maliyet', 'fiyat', 'butce', 'cost', 'kac para', 'ne kadar tutar')) {
    out.push('Doğrulanmış teklif veya dayanak olmadan maliyet tahmini üretilmez. Scenario Economy modülü hangi verilerin gerekli olduğunu listeler.');
  }
  if (out.length) res.outOfScope = out;

  // ---- DNA by name ----
  for (const [words, id] of DNA_WORDS) {
    if (has(t, ...words)) {
      res.dna = id;
      res.understood.push(`“${DNA_BY_ID[id].name}” DNA’sının uygulanması`);
      res.explanation.push(`${DNA_BY_ID[id].name}: ${DNA_BY_ID[id].tagline}. Kilitli seçimleriniz korunur.`);
      break;
    }
  }

  // ---- modern but traditional ----
  if (has(t, 'modern', 'cagdas', 'yenilik') && has(t, 'geleneksel', 'klasik', 'karakter', 'kimlig', 'ruh', 'koru', 'traditional', 'heritage')) {
    res.understood.push('Modern ama geleneksel karakteri koruyan bir dönüşüm');
    add({ language: 'heritage', roof: { form: 'current', light: 'halo-ring', ring: 0.6 }, facade: { lighting: 'dynamic' }, materials: { facade: 'brushed-metal', structure: 'dark-metal' }, screens: { layout: 'ribbon' } });
    res.explanation.push('Mevcut çatı formu korunur; modernlik ışık halkası, dinamik cephe aydınlatması ve 360° LED bantla sağlanır. Fırçalanmış metal cephe bugünkü malzeme diline yakın kalır.');
    res.constraints.push('“Geleneksel karakter” özneldir; bu yorum mevcut kütle ve renk kimliğini korumak olarak ele alındı.');
  }

  // ---- roof light: minimal / stronger ----
  const roofTalk = has(t, 'cati', 'roof', 'halka', 'ring');
  const lightTalk = has(t, 'isik', 'aydinlat', 'light', 'halka', 'ring');
  if (roofTalk && lightTalk && has(t, 'minimal', 'sade', 'azalt', 'daha az', 'ince', 'hafif', 'subtle', 'less')) {
    res.understood.push('Çatı ışıklarının daha minimal olması');
    add({ roof: { light: 'subtle-rim', ring: 0.3 }, show: { active: false } });
    res.explanation.push('Çatı ışığı ince kenar ışığına indirildi, halka yoğunluğu %30 yapıldı ve aktif gösteri kapatıldı.');
  } else if (roofTalk && lightTalk && has(t, 'parlak', 'guclu', 'yogun', 'artir', 'daha fazla', 'brighter', 'stronger', 'tac', 'crown')) {
    res.understood.push('Çatı ışığının güçlendirilmesi');
    add({ roof: { light: has(t, 'tac', 'crown', 'dis halka') ? 'full-crown' : d.roof.light === 'none' || d.roof.light === 'subtle-rim' ? 'halo-ring' : d.roof.light, ring: Math.min(1, d.roof.ring + 0.25) } });
    res.explanation.push('Işık halkası yoğunluğu artırıldı; gerekirse halka stili yükseltildi.');
    res.constraints.push('Daha güçlü ışık, komşu yerleşime ışık kirliliği ve enerji tüketimi açısından değerlendirilmelidir.');
  }

  // ---- greener plaza ----
  if (has(t, 'meydan', 'cevre', 'plaza', 'dis alan') && has(t, 'yesil', 'peyzaj', 'agac', 'green', 'park', 'bahce', 'golge')) {
    res.understood.push('Çevre meydanının daha yeşil bir tasarımla düzenlenmesi');
    add({ plaza: { character: has(t, 'park') ? 'park' : 'garden', social: 'expanded' }, green: { landscape: true, rainwater: true }, district: { eventLawn: true } });
    res.view.camera = { pos: [70, 60, 290], target: [0, 2, 165] };
    res.explanation.push('Meydan bahçe/park karakterine geçirildi; peyzaj, gölgelikler, yağmur suyu biyo-hendekleri ve etkinlik çimi etkinleştirildi.');
    res.unknowns.push('Gerçek parsel sınırları, zemin koşulları ve sulama ihtiyacı bilinmiyor.');
  }

  // ---- clearer entrances ----
  if (has(t, 'giris', 'kapi', 'entrance', 'gate') && has(t, 'anlasilir', 'net', 'belirgin', 'goster', 'clear', 'yon', 'kolay')) {
    res.understood.push('Taraftar girişlerinin daha anlaşılır gösterilmesi');
    add({ district: { meetingPoints: true, transitHub: true }, green: { transitLink: true }, access: { routes: true } });
    res.view.layers = { transit: true, access: true };
    res.view.highlight = ['transit'];
    res.view.camera = { pos: [0, 480, 140], target: [0, 0, 10] };
    res.explanation.push('A–H kapıları vurgulandı; ulaşım bağlantısı, örnek yaya rotaları, erişilebilir güzergâhlar ve buluşma noktaları açıldı. Kuşbakışı görünüme geçildi.');
    res.unknowns.push('Kapı harfleri ve konumları konsept modele aittir; gerçek kapı düzenini göstermez.');
  }

  // ---- accessibility ----
  if (has(t, 'erisilebil', 'engelli', 'tekerlekli', 'accessib', 'wheelchair')) {
    res.understood.push('Erişilebilirlik özelliklerinin gösterilmesi');
    add({ access: { routes: true, servicePoints: true } });
    res.view.layers = { ...(res.view.layers ?? {}), access: true };
    res.explanation.push('Erişilebilir örnek rotalar, tribün platformları ve hizmet noktaları açıldı.');
    res.unknowns.push('Eğim, mesafe ve mevcut koşullarda kullanılabilirlik doğrulanmamıştır.');
  }

  // ---- sustainability ----
  if (has(t, 'surdurulebil', 'cevreci', 'sustainab', 'karbon', 'gunes enerj', 'ges', 'solar', 'yesil stad')) {
    res.understood.push('Sürdürülebilirlik özelliklerinin ön plana çıkarılması');
    add({ green: { solar: 'extended', rainwater: true, efficientLighting: true, pitchCare: true, landscape: true, waste: true, transitLink: true } });
    res.view.camera = { pos: [240, 210, 260], target: [0, 10, 20] };
    res.explanation.push('Tüm çevresel sistemler etkinleştirildi ve GES genişletme konsepti açıldı. Çatıdaki mevcut GES gerçek bir uygulamadır (≈4,2–4,3 MW).');
    res.constraints.push('GES genişletmesi taşıma kapasitesi, şebeke bağlantısı ve imar açısından teknik inceleme gerektirir.');
    res.unknowns.push('Gerçek tüketim, üretim ve su verisi kullanılmadığı için sayısal kazanım verilmez.');
  }

  // ---- materials ----
  for (const [words, id] of MATERIAL_WORDS) {
    if (!has(t, ...words)) continue;
    const target = has(t, 'cati', 'roof') ? 'roof' : has(t, 'tasiyici', 'kolon', 'kiris', 'structure') ? 'structure' : has(t, 'kaide', 'zemin', 'plinth') ? 'plinth' : 'facade';
    if (MATERIAL_BY_ID[id].targets.includes(target)) {
      res.understood.push(`${target === 'facade' ? 'Cephe' : target === 'roof' ? 'Çatı' : target === 'structure' ? 'Taşıyıcı' : 'Kaide'} malzemesi: ${MATERIAL_BY_ID[id].name}`);
      add({ materials: { [target]: id } });
      res.explanation.push(`${MATERIAL_BY_ID[id].name}: ${MATERIAL_BY_ID[id].character}`);
      res.constraints.push(`İncelenmesi gerekenler: ${MATERIAL_BY_ID[id].review.join(', ')}.`);
    } else {
      res.understood.push(`${MATERIAL_BY_ID[id].name} malzemesi isteği`);
      res.constraints.push(`${MATERIAL_BY_ID[id].name} bu bileşen için konsept seçenekleri arasında değil; değişiklik yapılmadı.`);
    }
    break;
  }

  // ---- screens ----
  if (has(t, 'ekran', 'led', 'screen', 'medya cephe', 'media facade')) {
    if (has(t, 'medya cephe', 'media facade')) {
      res.understood.push('Medya cephesi');
      add({ screens: { layout: 'media-facade' }, facade: { lighting: 'media' } });
      res.constraints.push('Medya cephesi ışık kirliliği, izin süreçleri ve bakım erişimi açısından değerlendirilmelidir.');
    } else if (has(t, 'buyut', 'genislet', 'daha fazla', 'daha buyuk', 'bigger', 'extend', 'artir')) {
      res.understood.push('Dijital ekran sisteminin genişletilmesi');
      add({ screens: { layout: 'extended' } });
    } else if (has(t, 'azalt', 'kucult', 'sade', 'minimal', 'kaldir', 'less')) {
      res.understood.push('Daha sade bir ekran düzeni');
      add({ screens: { layout: 'standard' } });
    } else if (has(t, '360', 'bant', 'ribbon', 'serit')) {
      res.understood.push('360° LED bant');
      add({ screens: { layout: 'ribbon' } });
    }
  }

  // ---- choreography ----
  if (has(t, 'koreografi', 'tribun', 'tifo', 'koltuk renk')) {
    const map: [string[], DesignConfig['seats']['choreography']][] = [
      [['dalga', 'wave'], 'wave'],
      [['serit', 'stripe', 'cizgi'], 'stripes'],
      [['yildiz', 'star'], 'stars'],
      [['2035', 'mozaik', 'yazi'], 'mosaic-2035'],
      [['iki yarim', 'yarim', 'ikiye', 'halves'], 'halves'],
      [['yok', 'kaldir', 'notr', 'sade'], 'none'],
    ];
    for (const [w, c] of map)
      if (has(t, ...w)) {
        res.understood.push('Tribün koreografisi');
        add({ seats: { choreography: c } });
        break;
      }
  }

  // ---- colours ----
  // colours only with an explicit colour context ("renk", "palet"), so "daha yeşil meydan" is not read as a colour
  const found = COLORS.filter(([w]) => has(t, ...w)).map(([, hex]) => hex);
  if (found.length && has(t, 'renk', 'color', 'colour', 'palet')) {
    const uniq = [...new Set(found)];
    res.understood.push('Mimari renk paletinin değiştirilmesi');
    add({ palette: { primary: uniq[0], ...(uniq[1] ? { secondary: uniq[1] } : {}) } });
    res.explanation.push(`Ana renk ${uniq[0]}${uniq[1] ? `, ikincil renk ${uniq[1]}` : ''} olarak ayarlandı.`);
  }

  // ---- night tint ----
  const tints: [string[], DesignConfig['palette']['night']][] = [
    [['istanbul mavisi', 'gece mavisi', 'mavi gece'], 'istanbul-blue'],
    [['kizil gece', 'kirmizi gece'], 'crimson'],
    [['kehribar', 'amber'], 'amber'],
    [['zumrut', 'emerald'], 'emerald'],
    [['notr gece', 'neutral'], 'neutral'],
  ];
  for (const [w, n] of tints)
    if (has(t, ...w)) {
      res.understood.push('Gece atmosferi rengi');
      add({ palette: { night: n } });
      break;
    }

  // ---- light shows & atmosphere ----
  for (const [w, id] of SHOW_WORDS)
    if (has(t, ...w)) {
      res.understood.push(`Işık gösterisi: ${SHOW_BY_ID[id].name}`);
      add({ show: { ...SHOW_BY_ID[id].look, preset: id, active: true } });
      break;
    }
  const atmos: [string[], AtmosphereId][] = [
    [['gol ani', 'gol atmosfer', 'goal'], 'goal'],
    [['sampiyonluk gecesi', 'sampiyonluk'], 'championship'],
    [['mac oncesi', 'pre match', 'prematch'], 'prematch'],
    [['baslama ani', 'kickoff', 'baslangic duduk'], 'kickoff'],
    [['sessiz', 'mimari kesif', 'silent'], 'silent'],
  ];
  for (const [w, a] of atmos)
    if (has(t, ...w)) {
      res.understood.push('Maç günü atmosferi');
      res.view.atmosphere = a;
      break;
    }

  // ---- view commands ----
  if (has(t, 'kesit', 'section')) {
    res.understood.push('Kavramsal kesit görünümü');
    res.view.section = has(t, 'kisa') ? 'short' : 'long';
    res.view.camera = res.view.section === 'short' ? { pos: [-300, 60, 20], target: [0, 20, 0] } : { pos: [20, 60, -300], target: [0, 20, 0] };
  }
  if (has(t, 'patlat', 'katmanlari ayir', 'exploded', 'ayristir')) {
    res.understood.push('Patlatılmış mimari görünüm');
    res.view.exploded = true;
    res.view.camera = { pos: [330, 190, 360], target: [0, 45, 0] };
  }
  if (has(t, 'catiyi gizle', 'cati gizle', 'catiyi kaldir', 'hide roof')) {
    res.understood.push('Çatı katmanını gizleme');
    res.view.layers = { ...(res.view.layers ?? {}), roof: false, solar: false, structure: false };
  }
  if (has(t, 'catiyi goster', 'show roof')) {
    res.understood.push('Çatı katmanını gösterme');
    res.view.layers = { ...(res.view.layers ?? {}), roof: true, solar: true, structure: true };
  }

  // ---- risks / analysis ----
  if (has(t, 'risk', 'kisit', 'uygulanabilir', 'feasib', 'tehlike', 'sorun') || (has(t, 'teknik', 'muhendis') && has(t, 'acikla', 'neler', 'nedir', 'explain', 'anlat'))) {
    res.understood.push('Bu tasarımın teknik risklerinin açıklanması');
    const findings = evaluateRules(d);
    const a: string[] = findings.map((f) => `${f.severity === 'engineering' ? 'Mühendislik' : f.severity === 'conflict' ? 'Çakışma' : 'Bilgi'}: ${f.title}`);
    const vision = PHASES[4];
    a.push(...vision.risks.map((r) => `Uzun vade: ${r}`));
    if (d.facade.lighting !== 'static' || d.roof.ring > 0.6) a.push('Işık: yoğun aydınlatma ve medya içerikleri için ışık kirliliği ve izin süreçleri.');
    if (d.screens.layout !== 'standard') a.push(`Ekranlar: ${d.screens.layout} düzeni için elektrik yükü, bakım erişimi ve parlama etkisi.`);
    a.push(`Malzemeler: ${(['facade', 'roof'] as const).map((k) => `${MATERIAL_BY_ID[d.materials[k]].name} (${MATERIAL_BY_ID[d.materials[k]].review[0]})`).join('; ')}.`);
    res.analysis = a;
    res.constraints.push('Bu liste kural tabanlı bir özet olup mühendislik değerlendirmesinin yerine geçmez.');
  }

  // ---- compare ----
  if (has(t, 'karsilastir', 'fark', 'compare', 'kiyasla')) {
    res.understood.push('İki alternatifin farklarının karşılaştırılması');
    let a: DesignConfig | null = null;
    let b: DesignConfig | null = d;
    let label = '';
    if (ctx.archive.length >= 2) {
      a = ctx.archive[1].config;
      b = ctx.archive[0].config;
      label = `Arşivdeki son iki kayıt: “${ctx.archive[1].name}” → “${ctx.archive[0].name}”`;
    } else if (ctx.previous) {
      a = ctx.previous;
      label = 'Önceki sürüm → mevcut tasarım';
    } else if (d.dna !== 'custom') {
      a = applyPatch(d, DNA_BY_ID[d.dna].patch);
      label = `${DNA_BY_ID[d.dna].name} ön ayarı → mevcut tasarım`;
    }
    if (a && b) {
      const diffs = diffDesigns(a, b).filter((x) => !x.key.startsWith('show.sequence'));
      res.analysis = [label, ...(diffs.length ? diffs.slice(0, 12).map((x) => `${x.key}: ${String(x.from)} → ${String(x.to)}`) : ['Fark bulunmadı.'])];
    } else res.analysis = ['Karşılaştırılacak ikinci bir alternatif yok. Design Archive’a iki tasarım kaydedin veya bir değişiklik yapın.'];
  }

  if (Object.keys(patch).length) res.patch = patch;
  if (!res.understood.length && !res.outOfScope?.length) res.help = true;
  if (res.patch) {
    res.constraints.push('AI Architect teknik mühendislik onayı yerine geçmez; değişiklikler görsel konsept düzeyindedir.');
    const after = applyPatch(d, res.patch, new Set(ctx.locks));
    const blocked = diffDesigns(d, applyPatch(d, res.patch)).filter((x) => ctx.locks.includes(x.key) && !diffDesigns(d, after).some((y) => y.key === x.key));
    if (blocked.length) res.constraints.push(`Kilitli olduğu için değiştirilmeyen seçimler: ${blocked.map((b) => b.key).join(', ')}.`);
  }
  return res;
}

export const EXAMPLES = [
  'Stadyumu daha modern ama geleneksel karakterini koruyan bir tasarıma dönüştür.',
  'Çatı ışıklarını daha minimal yap.',
  'Çevre meydanını daha yeşil bir tasarımla yeniden düzenle.',
  'Taraftar girişlerini daha anlaşılır bir şekilde göster.',
  'Sürdürülebilirlik özelliklerini ön plana çıkar.',
  'Bu tasarımın teknik risklerini açıkla.',
  'İki alternatifin farklarını karşılaştır.',
];

export const SUPPORTED = [
  'DNA adları (Classic Evolution, Red & Gold Icon, Pure Architecture, Future Arena, Green Stadium)',
  'Çatı ışığı: “daha minimal”, “daha parlak”, “taç ışığı”',
  'Malzeme: “cephe koyu metal olsun”, “çatı kompozit”',
  'Ekranlar: “ekranları büyüt”, “medya cephesi”, “360 bant”',
  'Renk: “ana renk kırmızı, ikinci renk altın”; gece tonu: “zümrüt gece”',
  'Koreografi: “tribünde dalga / yıldız / 2035 mozaiği”',
  'Gösteri ve atmosfer: “Golden Halo”, “gol anı”, “şampiyonluk gecesi”',
  'Görünüm: “kesit göster”, “katmanları ayır”, “çatıyı gizle”',
  'Analiz: “riskleri açıkla”, “karşılaştır”, “geri al”',
];
