/**
 * Schematic masterplan of the concept district around the stadium.
 * Positions are concept placements in the model's coordinate system
 * (metres, stadium centre at origin, main entrance towards +z). They are
 * NOT the real parcel, road network or transit alignment.
 */
import type { DesignConfig } from './model/design';

export type ZoneId =
  | 'fanPlaza'
  | 'entryPlaza'
  | 'social'
  | 'museum'
  | 'eventLawn'
  | 'greenPark'
  | 'transitHub'
  | 'dropoff'
  | 'parking'
  | 'meeting';

export interface Zone {
  id: ZoneId;
  name: string;
  /** short map label */
  short: string;
  /** centre x,z */
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  description: string;
  details: string[];
  /** whether the zone exists for a given design */
  enabled: (d: DesignConfig) => boolean;
  camera: { pos: [number, number, number]; target: [number, number, number] };
}

export const ZONES: Zone[] = [
  {
    id: 'fanPlaza',
    short: 'Meydan',
    name: 'Taraftar meydanı',
    x: 0,
    z: 168,
    w: 130,
    d: 60,
    color: '#d4213d',
    description: 'Ana giriş önünde maç öncesi buluşma, dev ekran ve taraftar etkinlikleri için konsept meydan.',
    details: ['Maç öncesi toplanma alanı', 'Geçici sahne ve dev ekran konsepti', 'Yön bulma totemleri'],
    enabled: (d) => d.district.fanZone,
    camera: { pos: [70, 38, 268], target: [0, 4, 168] },
  },
  {
    id: 'entryPlaza',
    short: 'Giriş',
    name: 'Dış giriş meydanı',
    x: 0,
    z: 118,
    w: 150,
    d: 22,
    color: '#f2b631',
    description: 'Cephe önündeki kaide ve giriş kapıları arasında dağılım alanı.',
    details: ['Kapı A (ana giriş) ve kapı B/H’ye bağlantı', 'Kontrol noktaları için konsept yer'],
    enabled: () => true,
    camera: { pos: [-60, 14, 170], target: [0, 8, 100] },
  },
  {
    id: 'social',
    short: 'Sosyal',
    name: 'Sosyal yaşam alanı',
    x: -165,
    z: 105,
    w: 80,
    d: 70,
    color: '#ff8a3d',
    description: 'Yeme-içme pavyonları, gölgeli oturma ve maç olmayan günlerde de kullanılabilen sosyal alan.',
    details: ['Pavyonlar ve kanopiler', 'Esnek kullanım alanı', 'Gece aydınlatması'],
    enabled: (d) => d.plaza.social === 'expanded',
    camera: { pos: [-250, 40, 190], target: [-165, 2, 105] },
  },
  {
    id: 'museum',
    short: 'Müze',
    name: 'Kulüp müzesi ve deneyim alanı',
    x: 158,
    z: 118,
    w: 70,
    d: 50,
    color: '#c9a04a',
    description: 'Kulüp tarihini ve stadyum turunu buluşturan deneyim binası konsepti.',
    details: ['Sergi ve deneyim galerisi', 'Stadyum turu başlangıç noktası', 'Mağaza/kafe bağlantısı'],
    enabled: (d) => d.district.museum,
    camera: { pos: [235, 36, 205], target: [158, 8, 118] },
  },
  {
    id: 'eventLawn',
    short: 'Etkinlik',
    name: 'Etkinlik çimi',
    x: -178,
    z: -60,
    w: 70,
    d: 90,
    color: '#7ad06b',
    description: 'Konser yayınları, taraftar festivalleri ve aile etkinlikleri için çim alan ve sahne.',
    details: ['Sahne konsepti', 'Açık hava toplanma', 'Etkinlik dışı günlerde park'],
    enabled: (d) => d.district.eventLawn,
    camera: { pos: [-280, 44, -20], target: [-178, 2, -60] },
  },
  {
    id: 'greenPark',
    short: 'Yeşil alan',
    name: 'Dinlenme ve yeşil alan',
    x: 175,
    z: -40,
    w: 60,
    d: 110,
    color: '#3fbf8a',
    description: 'Gölgeli dinlenme, yürüyüş ve peyzaj alanı; yağmur suyu biyo-hendekleriyle ilişkili.',
    details: ['Gölge ağaçları', 'Oturma alanları', 'Yağmur suyu yönetimi konsepti'],
    enabled: (d) => d.green.landscape,
    camera: { pos: [265, 40, 20], target: [175, 2, -40] },
  },
  {
    id: 'transitHub',
    short: 'Ulaşım',
    name: 'Toplu taşıma bağlantısı (şematik)',
    x: 128,
    z: -170,
    w: 50,
    d: 30,
    color: '#5b9bd5',
    description:
      'Gerçek konumda stadyum, M2 hattına bağlı Seyrantepe metro istasyonuyla hizmet alır (kaynak: Wikipedia). Buradaki istasyon pavyonu ve yürüyüş yolu yalnızca şematik bir konsepttir.',
    details: ['Kapalı yürüyüş bağlantısı konsepti', 'Bisiklet parkı', 'Yön bulma'],
    enabled: (d) => d.district.transitHub,
    camera: { pos: [200, 34, -250], target: [128, 4, -170] },
  },
  {
    id: 'dropoff',
    short: 'Servis',
    name: 'Servis ve indirme-bindirme',
    x: -100,
    z: -168,
    w: 60,
    d: 26,
    color: '#8fa3bf',
    description: 'Otobüs, servis ve erişilebilir indirme-bindirme için şematik alan.',
    details: ['Erişilebilir indirme noktası', 'Servis cebi'],
    enabled: () => true,
    camera: { pos: [-170, 30, -240], target: [-100, 2, -168] },
  },
  {
    id: 'parking',
    short: 'Otopark',
    name: 'Otopark (şematik)',
    x: 0,
    z: -200,
    w: 120,
    d: 50,
    color: '#59616d',
    description: 'Şematik otopark alanı. Genişletilmiş GES senaryosunda üzerinde güneş kanopileri gösterilir.',
    details: ['GES kanopisi konsepti (senaryo)', 'Elektrikli araç şarj konsepti'],
    enabled: () => true,
    camera: { pos: [60, 50, -290], target: [0, 2, -200] },
  },
];

export const MEETING_POINTS: { id: string; x: number; z: number; name: string }[] = [
  { id: 'M1', x: 62, z: 150, name: 'Buluşma noktası 1 — Meydan doğu' },
  { id: 'M2', x: -62, z: 150, name: 'Buluşma noktası 2 — Meydan batı' },
  { id: 'M3', x: 150, z: 40, name: 'Buluşma noktası 3 — Doğu kaide' },
  { id: 'M4', x: -150, z: 40, name: 'Buluşma noktası 4 — Batı kaide' },
  { id: 'M5', x: 40, z: -140, name: 'Buluşma noktası 5 — Kuzey bağlantı' },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, Zone>;
