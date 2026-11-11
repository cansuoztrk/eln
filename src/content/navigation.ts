/**
 * Every room of the world, in one list. The header, the full-screen menu,
 * the home page map and the mobile bar all read from here, so a room that is
 * not listed is simply not linked from anywhere.
 */

export type NavItem = {
  href: string;
  /** Turkish name — what the person reads. */
  label: string;
  /** English name — the small label above it. */
  eyebrow: string;
  /** One plain line about what is inside. */
  description: string;
  /** Shown in the desktop header and the mobile bar. */
  primary?: boolean;
};

/**
 * Rooms that exist today. A room is listed here only once its page is built,
 * so nothing in the world ever links to a door that does not open.
 */
const BUILT = new Set(["/story", "/gallery", "/letters", "/distance", "/days", "/song", "/reasons", "/universe", "/future", "/journal", "/questions", "/voice", "/capsules", "/corner"]);

const ALL_ROOMS: NavItem[] = [
  {
    href: "/story",
    label: "Hikâyemiz",
    eyebrow: "Our Story",
    description: "Tanıştığımız günden bugüne.",
    primary: true,
  },
  {
    href: "/gallery",
    label: "Galeri",
    eyebrow: "Eln's Gallery",
    description: "Fotoğrafların, yan yana.",
    primary: true,
  },
  {
    href: "/letters",
    label: "Mektuplar",
    eyebrow: "Letters",
    description: "Zarflar ve içlerinde bekleyenler.",
    primary: true,
  },
  {
    href: "/distance",
    label: "Mesafe",
    eyebrow: "Beyond Distance",
    description: "İki şehir, aynı gökyüzü.",
    primary: true,
  },
  {
    href: "/universe",
    label: "Anı Evreni",
    eyebrow: "The Memory Universe",
    description: "Her anı bir yıldız.",
  },
  {
    href: "/days",
    label: "Özel Günler",
    eyebrow: "Special Days",
    description: "Takvimde bize ait günler.",
  },
  {
    href: "/reasons",
    label: "365 Not",
    eyebrow: "365 Reasons",
    description: "Her güne küçük bir not.",
  },
  {
    href: "/song",
    label: "Şarkımız",
    eyebrow: "Our Song",
    description: "Bizi anlatan şarkı.",
  },
  {
    href: "/future",
    label: "Hayaller",
    eyebrow: "Our Future",
    description: "Birlikte yapmak istediklerimiz.",
  },
  {
    href: "/capsules",
    label: "Zaman Kapsülü",
    eyebrow: "Time Capsule",
    description: "Günü gelince açılacaklar.",
  },
  {
    href: "/voice",
    label: "Sesli Anılar",
    eyebrow: "Voice Memories",
    description: "Yazıya sığmayanlar.",
  },
  {
    href: "/journal",
    label: "Günlük",
    eyebrow: "Shared Journal",
    description: "İkimizin defteri.",
  },
  {
    href: "/questions",
    label: "Sorular",
    eyebrow: "Our Questions",
    description: "Birbirimizi biraz daha tanımak için.",
  },
  {
    href: "/corner",
    label: "Minik Dünya",
    eyebrow: "Eln's Little World",
    description: "Fiyonklar, sticker'lar, tatlı şeyler.",
  },
];

export const WORLD_NAV: NavItem[] = ALL_ROOMS.filter((item) => BUILT.has(item.href));

export const PRIMARY_NAV = WORLD_NAV.filter((item) => item.primary);

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
