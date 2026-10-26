/**
 * Fan Journey Builder: sample matchday plans per persona, consistent with
 * the current design (zones that do not exist in the design are skipped).
 * All routes are SAMPLE routes; their real-world usability is not verified.
 */
import { MEETING_POINTS, ZONE_BY_ID } from '@/core/district';
import type { DesignConfig } from '@/core/model/design';
import { GATES, PROFILE, bowlPoint } from '@/world/stadium/geometry';
import type { CameraPose } from '@/world/worldApi';

export interface Stop {
  id: string;
  name: string;
  x: number;
  z: number;
  pose?: CameraPose;
  poi?: string;
  available: (d: DesignConfig) => boolean;
  unavailableNote?: string;
}

const gate = (id: string): Stop => {
  const g = GATES.find((x) => x.id === id)!;
  const p = bowlPoint(g.s, PROFILE.facadeD + 10, 0);
  const o = bowlPoint(g.s, PROFILE.facadeD + 60, 0);
  return { id: `gate-${id}`, name: `Kapı ${id}${g.main ? ' (ana giriş)' : ''}`, x: p.x, z: p.z, pose: { pos: [o.x, 26, o.z], target: [p.x, 6, p.z] }, available: () => true };
};
const zone = (id: keyof typeof ZONE_BY_ID, note?: string): Stop => {
  const z = ZONE_BY_ID[id];
  return { id, name: z.name, x: z.x, z: z.z, pose: z.camera, available: (d) => z.enabled(d), unavailableNote: note ?? 'Bu tasarımda bu alan yok' };
};

export const STOPS: Record<string, Stop> = Object.fromEntries(
  [
    zone('transitHub', 'Bu tasarımda ulaşım pavyonu yok; şematik yürüyüş bağlantısı kullanılır'),
    zone('dropoff'),
    zone('parking'),
    zone('fanPlaza'),
    zone('social'),
    zone('museum'),
    zone('eventLawn'),
    zone('greenPark'),
    { id: 'meet-1', name: MEETING_POINTS[0].name, x: MEETING_POINTS[0].x, z: MEETING_POINTS[0].z, pose: { pos: [110, 30, 210], target: [62, 4, 150] }, available: (d: DesignConfig) => d.district.meetingPoints, unavailableNote: 'Buluşma noktaları bu tasarımda kapalı' },
    { id: 'meet-5', name: MEETING_POINTS[4].name, x: MEETING_POINTS[4].x, z: MEETING_POINTS[4].z, pose: { pos: [80, 30, -200], target: [40, 4, -140] }, available: (d: DesignConfig) => d.district.meetingPoints, unavailableNote: 'Buluşma noktaları bu tasarımda kapalı' },
    ...GATES.map((g) => gate(g.id)),
    { id: 'concourse', name: 'İç dolaşım alanı', x: 0, z: 78, poi: 'concourse', available: () => true },
    { id: 'tribune', name: 'Tribün girişi', x: 0, z: 66, poi: 'tribune-entrance', available: () => true },
    { id: 'seat', name: 'Koltuk (örnek)', x: 12, z: 54, poi: 'seat-row', available: () => true },
    { id: 'access-platform', name: 'Erişilebilir tribün platformu', x: 0, z: 66, pose: { pos: [20, 25, 10], target: [0, 14, 68] }, available: (d: DesignConfig) => d.access.routes, unavailableNote: 'Erişilebilir rotalar bu tasarımda kapalı' },
    { id: 'service', name: 'Erişilebilir hizmet noktası', x: 60, z: 130, pose: { pos: [90, 20, 190], target: [40, 2, 120] }, available: (d: DesignConfig) => d.access.servicePoints, unavailableNote: 'Hizmet noktaları bu tasarımda kapalı' },
    { id: 'tunnel', name: 'Oyuncu tüneli (stadyum turu)', x: 0, z: -55, poi: 'player-tunnel', available: () => true },
    { id: 'pitchside', name: 'Saha kenarı (stadyum turu)', x: 14, z: 38, poi: 'pitch-side', available: () => true },
  ].map((s) => [s.id, s as Stop]),
);

export interface PlanItem {
  stop: string;
  time: string;
  note: string;
}

export interface Persona {
  id: string;
  name: string;
  icon: string;
  intro: string;
  plan: PlanItem[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'first',
    name: 'İlk kez stadyuma gelen taraftar',
    icon: 'Ticket',
    intro: 'Kolay yön bulma ve ana giriş deneyimi öncelikli.',
    plan: [
      { stop: 'transitHub', time: 'Maçtan 2 saat önce', note: 'Raylı sistemle varış; yön bulma totemlerini takip edin (örnek).' },
      { stop: 'fanPlaza', time: '1 s 45 dk önce', note: 'Meydanda atmosferi keşfedin, buluşma noktasını belirleyin.' },
      { stop: 'meet-1', time: '1 s 30 dk önce', note: 'Arkadaşlarınızla örnek buluşma noktası.' },
      { stop: 'gate-A', time: '1 s önce', note: 'Ana girişten kontrollü giriş (örnek kapı).' },
      { stop: 'concourse', time: '45 dk önce', note: 'Kiosklar ve yönlendirme.' },
      { stop: 'tribune', time: '30 dk önce', note: 'Sahanın ilk göründüğü an.' },
      { stop: 'seat', time: '20 dk önce', note: 'Koltuğunuza yerleşin.' },
    ],
  },
  {
    id: 'family',
    name: 'Çocuklu aile',
    icon: 'Heart',
    intro: 'Sakin bir geliş, gölgeli alanlar ve kısa yürüyüşler.',
    plan: [
      { stop: 'dropoff', time: 'Maçtan 2,5 saat önce', note: 'Servis/indirme alanından erken varış.' },
      { stop: 'greenPark', time: '2 s önce', note: 'Gölgeli dinlenme alanı.' },
      { stop: 'museum', time: '1 s 30 dk önce', note: 'Kısa müze ziyareti.' },
      { stop: 'meet-1', time: '1 s 10 dk önce', note: 'Kaybolma durumunda örnek buluşma noktası.' },
      { stop: 'gate-B', time: '1 s önce', note: 'Daha sakin bir yan kapı (örnek).' },
      { stop: 'seat', time: '30 dk önce', note: 'Erken yerleşme.' },
    ],
  },
  {
    id: 'access',
    name: 'Erişilebilir güzergâha ihtiyaç duyan ziyaretçi',
    icon: 'Accessibility',
    intro: 'Basamaksız örnek rota, hizmet noktaları ve tribün platformu.',
    plan: [
      { stop: 'dropoff', time: 'Maçtan 2 saat önce', note: 'Erişilebilir indirme noktası (örnek).' },
      { stop: 'service', time: '1 s 50 dk önce', note: 'Yardım ve bilgi noktası.' },
      { stop: 'gate-G', time: '1 s 30 dk önce', note: 'Erişilebilir rotaya bağlı örnek kapı.' },
      { stop: 'concourse', time: '1 s önce', note: 'Asansör/rampa kavramı.' },
      { stop: 'access-platform', time: '45 dk önce', note: 'Tribün platformu (konsept).' },
    ],
  },
  {
    id: 'calm',
    name: 'Kalabalıktan uzak rota tercih eden kullanıcı',
    icon: 'Footprints',
    intro: 'Daha az kullanılan kapılar ve zamanlamayla yoğunluktan kaçınma.',
    plan: [
      { stop: 'parking', time: 'Maçtan 2,5 saat önce', note: 'Erken varış.' },
      { stop: 'meet-5', time: '2 s önce', note: 'Kuzey bağlantıda sakin bir buluşma noktası.' },
      { stop: 'gate-F', time: '1 s 45 dk önce', note: 'Simülasyonda daha az yüklenen örnek kapı.' },
      { stop: 'concourse', time: '1 s 30 dk önce', note: 'Yoğunluk başlamadan dolaşım.' },
      { stop: 'seat', time: '1 s önce', note: 'Erken yerleşme.' },
    ],
  },
  {
    id: 'social',
    name: 'Maç öncesi sosyal alanları keşfetmek isteyen taraftar',
    icon: 'Users',
    intro: 'Meydan, pavyonlar ve etkinlik çimi.',
    plan: [
      { stop: 'transitHub', time: 'Maçtan 3 saat önce', note: 'Erken varış.' },
      { stop: 'social', time: '2 s 45 dk önce', note: 'Pavyonlar ve sosyal alan.' },
      { stop: 'eventLawn', time: '2 s önce', note: 'Taraftar festivali (örnek).' },
      { stop: 'fanPlaza', time: '1 s 30 dk önce', note: 'Meydan ekranı ve atmosfer.' },
      { stop: 'gate-H', time: '1 s önce', note: 'Meydana yakın örnek kapı.' },
      { stop: 'seat', time: '20 dk önce', note: 'Koltuğa geçiş.' },
    ],
  },
  {
    id: 'tour',
    name: 'Müze ve stadyum turuna katılan ziyaretçi',
    icon: 'Building2',
    intro: 'Maç olmayan bir günde müze ve tur rotası.',
    plan: [
      { stop: 'museum', time: 'Tur başlangıcı', note: 'Müze ve deneyim alanı.' },
      { stop: 'gate-A', time: '+30 dk', note: 'Tur grubu girişi (örnek).' },
      { stop: 'concourse', time: '+40 dk', note: 'Dolaşım ve localar.' },
      { stop: 'tunnel', time: '+55 dk', note: 'Oyuncu tüneli konsepti.' },
      { stop: 'pitchside', time: '+65 dk', note: 'Saha kenarı.' },
      { stop: 'tribune', time: '+80 dk', note: 'Tribün manzarası.' },
    ],
  },
];

export function resolvePlan(items: PlanItem[], d: DesignConfig) {
  return items.map((it) => {
    const stop = STOPS[it.stop];
    const ok = stop ? stop.available(d) : false;
    return { ...it, stopInfo: stop, available: ok };
  });
}

export function planToMarkdown(title: string, items: ReturnType<typeof resolvePlan>) {
  const lines = [`# ${title}`, '', '_Örnek güzergâh — mevcut koşullarda kullanılabilirliği doğrulanmamıştır. ASLAN 2035 OMEGA konsept platformu._', ''];
  items.forEach((it, i) => {
    lines.push(`${i + 1}. **${it.stopInfo?.name ?? it.stop}** — ${it.time}${it.available ? '' : ' _(bu tasarımda yok)_'}`);
    if (it.note) lines.push(`   ${it.note}`);
  });
  return lines.join('\n');
}
