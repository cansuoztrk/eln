/** The Studio's sections, grouped the way Arda works through them. */

export type StudioNavItem = { href: string; label: string; hint: string };
export type StudioNavGroup = { title: string; items: StudioNavItem[] };

/** Screens that exist today; the menu never offers one that is not built yet. */
const BUILT = new Set([
  "/studio",
  "/studio/opening",
  "/studio/invite",
  "/studio/words",
  "/studio/photos",
  "/studio/story",
  "/studio/letters",
  "/studio/days",
  "/studio/reasons",
  "/studio/capsules",
  "/studio/texts",
  "/studio/trash",
  "/studio/settings",
  "/studio/backup",
]);

const ALL_GROUPS: StudioNavGroup[] = [
  {
    title: "Başlangıç",
    items: [
      { href: "/studio", label: "Genel bakış", hint: "Durum ve sıradaki adımlar" },
      { href: "/studio/opening", label: "Açılış", hint: "Hediye deneyiminin metni ve fotoğrafı" },
      { href: "/studio/invite", label: "Davet", hint: "Eln'in erişimi" },
    ],
  },
  {
    title: "İçerik",
    items: [
      { href: "/studio/words", label: "Hazır metinler", hint: "Senin için yazılan mektuplar ve notlar" },
      { href: "/studio/photos", label: "Fotoğraflar", hint: "Galeri ve albümler" },
      { href: "/studio/story", label: "Hikâye", hint: "Anılar ve zaman çizelgesi" },
      { href: "/studio/letters", label: "Mektuplar", hint: "Zarflar, taslaklar, kilitli mektuplar" },
      { href: "/studio/days", label: "Tarihler", hint: "Özel günler ve yıllık sürprizler" },
      { href: "/studio/reasons", label: "365 Not", hint: "Günün notu koleksiyonu" },
      { href: "/studio/capsules", label: "Kapsüller", hint: "Geleceğe bırakılanlar" },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/studio/texts", label: "Metinler", hint: "Sayfa metinleri ve şarkı" },
      { href: "/studio/settings", label: "Ayarlar", hint: "Adlar, şehirler, saat dilimleri" },
      { href: "/studio/trash", label: "Çöp kutusu", hint: "Silinenleri geri al" },
      { href: "/studio/backup", label: "Yedek", hint: "Kopyasını elinde tut" },
    ],
  },
];

export const STUDIO_NAV: StudioNavGroup[] = ALL_GROUPS.map((group) => ({
  ...group,
  items: group.items.filter((item) => BUILT.has(item.href)),
})).filter((group) => group.items.length > 0);
