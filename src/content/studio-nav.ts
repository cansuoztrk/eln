/** The Studio's sections, grouped the way Arda works through them. */

export type StudioNavItem = { href: string; label: string; hint: string };
export type StudioNavGroup = { title: string; items: StudioNavItem[] };

export const STUDIO_NAV: StudioNavGroup[] = [
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
      { href: "/studio/theme", label: "Tema", hint: "Renk ve atmosfer" },
      { href: "/studio/trash", label: "Çöp kutusu", hint: "Silinenleri geri al" },
      { href: "/studio/backup", label: "Yedek", hint: "Dışa aktar ve koru" },
    ],
  },
];
