/**
 * İkon seti — özgün, 24×24 ızgarada 1,7 px çizgi kalınlığı, yuvarlak uçlar.
 * Arayüz ve kategori ikonları aynı geometrik dili paylaşır (yumuşak dikdörtgenler, tek vurgu noktası).
 */
import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  // ── arayüz
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  heart: <path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.5c0 5.1-7 9.4-7 9.4Z" />,
  heartFill: <path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.5c0 5.1-7 9.4-7 9.4Z" fill="currentColor" />,
  bell: (
    <>
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5l1.5-1.5Z" />
      <path d="M10 20.5h4" />
    </>
  ),
  bellPlus: (
    <>
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 8.2-4.8" />
      <path d="M17.5 12.5v4l1.5 1.5H5l1.5-1.5" />
      <path d="M10 20.5h4M18 3.5v5M15.5 6h5" />
    </>
  ),
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  arrowDown: <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />,
  arrowUp: <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />,
  external: (
    <>
      <path d="M13.5 5H19v5.5M19 5l-8 8" />
      <path d="M17 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3" />
    </>
  ),
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />,
  monitorTheme: (
    <>
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1.3-3.3 3.9-5 7-5s5.7 1.7 7 5" />
    </>
  ),
  plane: <path d="M10.5 13.5 4 11.2l1.4-1.4 7 .4 3.8-3.8a1.9 1.9 0 0 1 2.7 2.7l-3.8 3.8.4 7-1.4 1.4-2.3-6.5-2.9 2.9.3 2.1-1.2 1.2-1.3-3.3-3.3-1.3 1.2-1.2 2.1.3 2.9-2.9Z" />,
  tag: (
    <>
      <path d="M4 12.6V5a1 1 0 0 1 1-1h7.6L20 11.4a1.4 1.4 0 0 1 0 2L13.4 20a1.4 1.4 0 0 1-2 0L4 12.6Z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </>
  ),
  store: (
    <>
      <path d="M4.5 9.5 6 5h12l1.5 4.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0Z" />
      <path d="M5.5 11.5V19h13v-7.5M10 19v-4h4v4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19.5h16" />
      <path d="M5 15l4-4.5 3.5 3L19 6.5" />
      <circle cx="19" cy="6.5" r="1.2" fill="currentColor" />
    </>
  ),
  trendDown: (
    <>
      <path d="M4 7l5.5 5.5 3.5-3.5L20 16" />
      <path d="M20 11v5h-5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5 20.5 19h-17L12 4.5Z" />
      <path d="M12 10v4M12 16.5v.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8v.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.3-3 7.5-7 9-4-1.5-7-4.7-7-9V6l7-2.5Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  home: (
    <>
      <path d="M4.5 10.5 12 4.5l7.5 6V19a.5.5 0 0 1-.5.5h-4.5v-5h-5v5H5a.5.5 0 0 1-.5-.5v-8.5Z" />
    </>
  ),
  grid: (
    <>
      <rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
      <rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
      <rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
      <rect x="13.5" y="13.5" width="6" height="6" rx="1.5" />
    </>
  ),
  compare: (
    <>
      <path d="M7 4.5v15M17 4.5v15" />
      <path d="M4 9h6M14 15h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  swap: <path d="M7 7.5h12l-3-3M17 16.5H5l3 3" />,
  bag: (
    <>
      <path d="M6 8h12l-1 11.5H7L6 8Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  spark: <path d="M12 3.5 13.8 10 20.5 12 13.8 14 12 20.5 10.2 14 3.5 12 10.2 10 12 3.5Z" />,
  logout: (
    <>
      <path d="M14 5H6.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H14" />
      <path d="M10.5 12H20M16.5 8.5 20 12l-3.5 3.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  luggage: (
    <>
      <rect x="6.5" y="7" width="11" height="12.5" rx="2" />
      <path d="M9.5 7V4.5h5V7M9.5 11v5M14.5 11v5M8.5 19.5V21M15.5 19.5V21" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12 17.6 6.4" />
      <circle cx="15.5" cy="14.5" r="1.3" fill="currentColor" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
      <path d="M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  trash: (
    <>
      <path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7" />
    </>
  ),
  edit: (
    <>
      <path d="M5 19l1-4.5L15.5 5a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L9.5 18 5 19Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M19 12a7 7 0 1 1-2-4.9" />
      <path d="M19 4.5V8h-3.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
    </>
  ),
  // ── kategoriler
  chip: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="2" />
      <path d="M6 10.5h.5M9 10.5h.5M12 10.5h.5M15 10.5h.5M18 10.5h.5M7.5 14h9" />
    </>
  ),
  mouse: (
    <>
      <rect x="7" y="3.5" width="10" height="17" rx="5" />
      <path d="M12 3.5v5.5M7 9h10" />
    </>
  ),
  headset: (
    <>
      <path d="M5 15v-3a7 7 0 0 1 14 0v3" />
      <rect x="4" y="13.5" width="3.5" height="6" rx="1.5" />
      <rect x="16.5" y="13.5" width="3.5" height="6" rx="1.5" />
      <path d="M18.5 19.5c0 1-1.5 1.5-4 1.5" />
    </>
  ),
  pad: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="3" />
      <path d="M15.5 9.5a2 2 0 0 1 2 2v1" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M12 16.5v3.5M8 20h8" />
    </>
  ),
  gpu: (
    <>
      <rect x="3" y="7" width="16" height="9.5" rx="1.5" />
      <circle cx="9" cy="11.75" r="2.5" />
      <circle cx="15" cy="11.75" r="2" />
      <path d="M21 9v5M5 16.5V19h6" />
    </>
  ),
  cpu: (
    <>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" />
      <path d="M9 9h6v6H9z" />
      <path d="M9 3v2.5M15 3v2.5M9 18.5V21M15 18.5V21M3 9h2.5M3 15h2.5M18.5 9H21M18.5 15H21" />
    </>
  ),
  board: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <rect x="7" y="7" width="5" height="5" rx="0.8" />
      <path d="M15 7h2.5M15 10h2.5M7 15.5h10.5M7 18h6" />
    </>
  ),
  memory: (
    <>
      <path d="M3 8h18v7H3z" />
      <path d="M6 15v2.5M9.5 15v2.5M13 15v2.5M16.5 15v2.5M6.5 10.5h3v2h-3zM11 10.5h3v2h-3zM15.5 10.5h3v2h-3z" />
    </>
  ),
  tower: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="1.5" />
      <circle cx="12" cy="13" r="2.5" />
      <path d="M9.5 6.5h5" />
    </>
  ),
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1.5" />
      <path d="M3 18.5h18l-1.5-3.5h-15L3 18.5Z" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  watch: (
    <>
      <rect x="6.5" y="7" width="11" height="10" rx="3" />
      <path d="M9 7l.7-3.5h4.6L15 7M9 17l.7 3.5h4.6L15 17M12 10v2.5l1.5 1" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" />
    </>
  ),
  camera: (
    <>
      <circle cx="12" cy="10" r="6" />
      <circle cx="12" cy="10" r="2.2" />
      <path d="M8.5 18.5h7l-1.5-3h-4l-1.5 3Z" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7.5 8h9a4.5 4.5 0 0 1 4.3 5.7l-.9 3.3a2 2 0 0 1-3.5.8L14.5 15.5h-5L7.6 17.8a2 2 0 0 1-3.5-.8l-.9-3.3A4.5 4.5 0 0 1 7.5 8Z" />
      <path d="M8 10.5v3M6.5 12h3M15.5 11.5h.5M17 13h.5" />
    </>
  ),
  speaker: (
    <>
      <rect x="6.5" y="3" width="11" height="18" rx="2" />
      <circle cx="12" cy="14.5" r="3" />
      <path d="M12 7.5v.5" />
    </>
  ),
  appliance: (
    <>
      <path d="M8 4h8l1 16H7L8 4Z" />
      <path d="M8.5 8.5h7M12 12v4" />
    </>
  ),
  fridge: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M6 10h12M9 6v2M9 12.5v3" />
    </>
  ),
  kitchen: (
    <>
      <path d="M4 11h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" />
      <path d="M20 12h1.5M2.5 12H4M9 8c0-1 1-1.5 1-2.5M13 8c0-1 1-1.5 1-2.5" />
    </>
  ),
  decor: (
    <>
      <path d="M9 4h6c0 3-1 4-1 6s3 3.5 3 6.5a4 4 0 0 1-4 3.5h-2a4 4 0 0 1-4-3.5C7 13.5 10 12 10 10S9 7 9 4Z" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M3 11.5a1.5 1.5 0 0 1 3 0V14h12v-2.5a1.5 1.5 0 0 1 3 0V18H3v-6.5ZM5 18v2M19 18v2" />
    </>
  ),
  spray: (
    <>
      <path d="M8 9h6v11.5H8z" />
      <path d="M9.5 9V6h3v3M12.5 6.5H17M18.5 4.5v.5M18.5 8v.5M20.5 6.5h.5" />
    </>
  ),
  lamp: (
    <>
      <path d="M8 3.5h8l2.5 7h-13L8 3.5Z" />
      <path d="M12 10.5v8M8 20.5h8" />
    </>
  ),
  shirt: <path d="M8.5 4 4 7l2 4 2-1v10.5h8V10l2 1 2-4-4.5-3a3.5 3.5 0 0 1-7 0Z" />,
  shoe: (
    <>
      <path d="M3 17.5V9.5l4 1 3-4 3.5 4.5c2 2.5 4.5 2.5 6 3.5a2 2 0 0 1 1 1.7v1.3H3Z" />
      <path d="M3 17.5h18M10 10.5l1.5 1.5M8.5 12.5l1.5 1.5" />
    </>
  ),
  glasses: (
    <>
      <circle cx="7" cy="14" r="3.5" />
      <circle cx="17" cy="14" r="3.5" />
      <path d="M10.5 14c1-1 2-1 3 0M3.5 13 5 7.5h2M20.5 13 19 7.5h-2" />
    </>
  ),
  care: (
    <>
      <rect x="8.5" y="8" width="7" height="12.5" rx="2" />
      <path d="M10 8V5h4v3M14 5h3" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5v-14Z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3M9 8h5" />
    </>
  ),
  puzzle: (
    <>
      <path d="M5 8h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V19H12.5a2 2 0 1 0-4 0H5v-3.5a2 2 0 1 0 0-4V8Z" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M8 12h8" />
      <rect x="4.5" y="8" width="3.5" height="8" rx="1" />
      <rect x="16" y="8" width="3.5" height="8" rx="1" />
      <path d="M2.5 10.5v3M21.5 10.5v3" />
    </>
  ),
  car: (
    <>
      <path d="M4 15.5v-3l2-4.5h12l2 4.5v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M4 12.5h16M6.5 16.5v2M17.5 16.5v2" />
      <circle cx="7.5" cy="14" r=".6" fill="currentColor" />
      <circle cx="16.5" cy="14" r=".6" fill="currentColor" />
    </>
  ),
  printer: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7.5" rx="1.5" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  toy: (
    <>
      <circle cx="12" cy="12.5" r="5.5" />
      <circle cx="7" cy="6.5" r="2.5" />
      <circle cx="17" cy="6.5" r="2.5" />
      <path d="M10 12h.5M13.5 12h.5M10.5 15c1 .7 2 .7 3 0" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function Icon({ name, className, title, ...rest }: { name: string; title?: string } & SVGProps<SVGSVGElement>) {
  const glyph = P[name] ?? P.spark;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-5"}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
