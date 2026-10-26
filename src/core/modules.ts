/** Module registry: navigation groups follow the four core systems. */
export const MODULE_IDS = [
  'home',
  'explore',
  'architecture',
  'city',
  'design',
  'materials',
  'lightshow',
  'architect',
  'time',
  'whatif',
  'os',
  'crowd',
  'green',
  'economy',
  'roadmap',
  'matchday',
  'seats',
  'journey',
  'archive',
  'share',
  'present',
  'report',
  'about',
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export type GroupId = 'world' | 'design' | 'intel' | 'fan' | 'studio';

export interface ModuleMeta {
  id: ModuleId;
  group: GroupId;
  title: string;
  subtitle: string;
  icon: string;
}

export const GROUPS: { id: GroupId; title: string; short: string; subtitle: string }[] = [
  { id: 'world', short: 'World', title: 'Stadium World', subtitle: 'Keşfedilebilir dijital stadyum' },
  { id: 'design', short: 'Design', title: 'Design Engine', subtitle: 'Mimari tasarım motoru' },
  { id: 'intel', short: 'Intel', title: 'Stadium Intelligence', subtitle: 'Simülasyon ve senaryolar' },
  { id: 'fan', short: 'Fan', title: 'Fan Universe', subtitle: 'Maç günü ve taraftar deneyimi' },
  { id: 'studio', short: 'Studio', title: 'Studio', subtitle: 'Arşiv, paylaşım ve sunum' },
];

export const MODULES: ModuleMeta[] = [
  { id: 'explore', group: 'world', title: 'Walkable Stadium', subtitle: 'Explorer & Walkthrough', icon: 'Footprints' },
  { id: 'architecture', group: 'world', title: 'Master Digital Twin', subtitle: 'Katmanlar, patlatılmış görünüm, kesit', icon: 'Layers' },
  { id: 'city', group: 'world', title: 'Stadium City', subtitle: 'Çevre master planı', icon: 'Map' },
  { id: 'design', group: 'design', title: 'Stadium DNA Engine', subtitle: 'Tasarımın karakteri', icon: 'Dna' },
  { id: 'materials', group: 'design', title: 'Material Lab', subtitle: 'Malzeme deneyimi', icon: 'Palette' },
  { id: 'lightshow', group: 'design', title: 'Light Show Composer', subtitle: 'Kendi ışık gösterin', icon: 'Sparkles' },
  { id: 'architect', group: 'design', title: 'AI Architect', subtitle: 'Doğal dil tasarım danışmanı', icon: 'MessageSquareText' },
  { id: 'time', group: 'design', title: 'Time Machine', subtitle: 'Dönüşüm aşamaları', icon: 'History' },
  { id: 'whatif', group: 'design', title: 'What-If Engine', subtitle: 'Senaryo karşılaştırma', icon: 'GitCompare' },
  { id: 'os', group: 'intel', title: 'Stadium OS', subtitle: 'Operasyon ve zekâ paneli', icon: 'LayoutDashboard' },
  { id: 'crowd', group: 'intel', title: 'Crowd Flow Simulator', subtitle: 'Taraftar akışı laboratuvarı', icon: 'Users' },
  { id: 'green', group: 'intel', title: 'Green Stadium Engine', subtitle: 'Çevresel tasarım', icon: 'Leaf' },
  { id: 'economy', group: 'intel', title: 'Scenario Economy', subtitle: 'Uygulanabilirlik', icon: 'Scale' },
  { id: 'roadmap', group: 'intel', title: 'Project Roadmap', subtitle: 'Aşamalı dönüşüm', icon: 'Route' },
  { id: 'matchday', group: 'fan', title: 'Matchday & Atmosphere', subtitle: 'Ses ve atmosfer stüdyosu', icon: 'Flame' },
  { id: 'seats', group: 'fan', title: 'Seat Experience 360', subtitle: 'Koltuktan sahaya', icon: 'Armchair' },
  { id: 'journey', group: 'fan', title: 'Fan Journey Builder', subtitle: 'Maç günü planı', icon: 'Navigation' },
  { id: 'archive', group: 'studio', title: 'Design Archive', subtitle: 'Kayıtlar ve sürüm geçmişi', icon: 'Archive' },
  { id: 'share', group: 'studio', title: 'Share & Export', subtitle: 'Bağlantı, JSON, görsel', icon: 'Share2' },
  { id: 'present', group: 'studio', title: 'Presentation Mode', subtitle: 'Profesyonel sunum', icon: 'Presentation' },
  { id: 'report', group: 'studio', title: 'Project Report', subtitle: 'Yazdırılabilir rapor', icon: 'FileText' },
  { id: 'about', group: 'studio', title: 'Kaynaklar & Varsayımlar', subtitle: 'Doğrulanmış bilgi ve sınırlar', icon: 'Info' },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<ModuleId, ModuleMeta>;
