import { applyPatch, type DesignConfig } from '@/core/model/design';
import { derivePhaseConfig } from '@/core/model/phases';
import { SHOW_BY_ID } from '@/core/model/lightshow';
import type { SectionMode } from '@/core/store/viewStore';
import type { CameraPose } from '@/world/worldApi';
import type { BadgeKind } from '@/ui/primitives';

export interface Slide {
  id: string;
  kicker: string;
  title: string;
  text: string;
  points?: string[];
  badges: BadgeKind[];
  uncertainty?: string;
  pose: CameraPose;
  config?: (d: DesignConfig) => DesignConfig | null;
  section?: SectionMode;
  env?: 'night' | 'dusk' | 'day';
}

export const SLIDES: Slide[] = [
  {
    id: 'title',
    kicker: 'ASLAN 2035 OMEGA',
    title: 'Bir Efsaneyi İzleme. Geleceğini Tasarla.',
    text: 'RAMS Park’ın geleceğini keşfedilebilir bir dijital dünya, mimari tasarım laboratuvarı ve taraftar deneyimi platformu olarak ele alan bağımsız bir konsept çalışması.',
    badges: ['concept'],
    pose: { pos: [330, 150, 360], target: [0, 18, 0] },
  },
  {
    id: 'today',
    kicker: '01 — Mevcut durum',
    title: 'RAMS Park bugün',
    text: '2011’de açılan stadyum, Seyrantepe’de yaklaşık 53 bin kapasiteli; çatısında 10.000’i aşkın panelden oluşan bir güneş enerjisi santrali bulunuyor.',
    points: ['Açılış: 15 Ocak 2011', 'Kapasite: 53.387 (2026)', 'Çatı GES: ≈4,2–4,3 MW', 'Mimar: asp Architekten'],
    badges: ['verified'],
    uncertainty: 'Model mevcut yapının yaklaşık bir temsilidir; ölçülmüş rölöve değildir. Kaynaklar: Wikipedia, Enerjisa, StadiumDB.',
    pose: { pos: [250, 110, 300], target: [0, 15, 0] },
    config: (d) => derivePhaseConfig(d, 0),
    env: 'dusk',
  },
  {
    id: 'dna',
    kicker: '02 — Stadium DNA',
    title: 'Tutarlı bir mimari karakter',
    text: 'Işık, malzeme, ekran düzeni, meydan peyzajı ve tribün koreografisi tek bir tasarım sisteminde birleşir; çakışan tercihler raporlanır.',
    badges: ['concept'],
    pose: { pos: [200, 70, 250], target: [0, 22, 30] },
  },
  {
    id: 'bowl',
    kicker: '03 — Kase ve koltuk deneyimi',
    title: 'Koltuktan sahaya',
    text: 'Seat Experience 360, konsept profil üzerinden görüş açısı, uzaklık ve yaklaşık C-değerini karşılaştırır.',
    badges: ['concept'],
    uncertainty: 'Oturma planı ve ölçüler konsept modelden üretilmiştir; gerçek bilet kategorileri veya görüş kalitesi hakkında bilgi değildir.',
    pose: { pos: [30, 14, 52], target: [0, 1, 0] },
  },
  {
    id: 'light',
    kicker: '04 — Çatı ve ışık',
    title: 'Gecenin taç ışığı',
    text: 'Çatı ışık halkası, cephe ve tribün ışıkları tek bir gösteri sistemiyle yönetilir; animasyonlar fotosensitiviteye karşı sınırlandırılmıştır.',
    badges: ['concept', 'sim'],
    uncertainty: 'Web tabanlı görsel simülasyondur; gerçek aydınlatma altyapısına bağlı değildir.',
    pose: { pos: [170, 80, 230], target: [0, 25, 0] },
    config: (d) => applyPatch(d, { show: { ...SHOW_BY_ID['golden-halo'].look, active: true, preset: 'golden-halo' } }),
  },
  {
    id: 'city',
    kicker: '05 — Stadium City',
    title: 'Stadyumdan bir yaşam alanına',
    text: 'Taraftar meydanı, müze, sosyal alanlar, etkinlik çimi ve erişilebilir rotalar stadyumu maç olmayan günlerde de yaşayan bir ekosisteme dönüştürür.',
    badges: ['concept'],
    uncertainty: 'Yerleşim şematiktir; gerçek parsel, imar ve yol ağı araştırılmalıdır.',
    pose: { pos: [-60, 300, 420], target: [0, 0, 90] },
    config: (d) => applyPatch(d, { district: { fanZone: true, museum: true, meetingPoints: true }, access: { routes: true } }),
  },
  {
    id: 'green',
    kicker: '06 — Green Stadium',
    title: 'Mevcut GES’ten bütünleşik çevresel sisteme',
    text: 'Yağmur suyu, verimli aydınlatma, peyzaj, atık azaltma ve toplu taşıma bağlantısı kavramsal olarak birleşir.',
    badges: ['verified', 'concept', 'eng'],
    uncertainty: 'GES genişletmesi ve kanopiler teknik inceleme gerektirir; sayısal kazanım verilmez.',
    pose: { pos: [120, 220, -330], target: [0, 10, -110] },
    config: (d) => applyPatch(d, { green: { solar: 'extended', rainwater: true, landscape: true, waste: true, transitLink: true, efficientLighting: true } }),
    env: 'day',
  },
  {
    id: 'section',
    kicker: '07 — Kavramsal kesit',
    title: 'Tribünler, dolaşım ve çatı ilişkisi',
    text: 'Analitik profilden üretilen kesit, alt ve üst tribün, orta kuşak ve çatının birbiriyle ilişkisini anlatır.',
    badges: ['concept'],
    uncertainty: 'Mühendislik çizimi veya doğrulanmış yapı kesiti değildir.',
    pose: { pos: [20, 60, -300], target: [0, 20, 0] },
    section: 'long',
    env: 'day',
  },
  {
    id: 'roadmap',
    kicker: '08 — Aşamalı dönüşüm',
    title: 'Bugünden 2035 vizyonuna',
    text: 'Aydınlatma ve dijital deneyimle başlayıp çevre alanları ve daha büyük mimari araştırmalarla ilerleyen etaplı bir strateji.',
    points: ['Aşama 1: ışık ve ekranlar', 'Aşama 2: dijital ve operasyonel', 'Aşama 3: çevre ve deneyim alanları', '2035: çatı ve cephe senaryoları (mühendislik değerlendirmesi)'],
    badges: ['concept', 'eng'],
    pose: { pos: [330, 170, 330], target: [0, 20, 20] },
  },
  {
    id: 'next',
    kicker: '09 — Sonraki adımlar',
    title: 'Belirsizlikler ve araştırılması gerekenler',
    text: 'Bu çalışma bir fizibilite raporunun yerini almaz. Gerçek uygulama sırası teknik raporlar, bütçe, işletme gereksinimleri ve resmî onaylarla belirlenir.',
    points: ['Mevcut durum rölövesi ve elektrik yük verisi', 'Statik, rüzgâr ve yangın/tahliye analizleri', 'İmar, parsel ve kurum onayları', 'Varsayımları açık bir maliyet modeli'],
    badges: ['eng'],
    pose: { pos: [-260, 120, 300], target: [0, 15, 0] },
  },
];
