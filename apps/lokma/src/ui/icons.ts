/**
 * Line icon set (24×24, 2px round strokes, currentColor). Hand-drawn paths so
 * the app ships no icon font and every glyph matches.
 */
const P: Record<string, string> = {
  today: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  progress: '<path d="M4 19h16"/><path d="M6 15l4-5 3.5 3L19 6"/><circle cx="19" cy="6" r="1.2" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.6-2.2h5.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 4.5-4.5 3.5 3.5 2.5-2.5L20 17"/>',
  pencil: '<path d="M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19z"/><path d="M13.5 7.3l3.2 3.2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  barcode: '<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
  pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2.5 10h19M9 6.5c0-1 .8-1.8 1.8-1.8h2.4c1 0 1.8.8 1.8 1.8V8H9z"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
  tea: '<path d="M8 4h8l-1.2 13.2A2 2 0 0 1 12.8 19h-1.6a2 2 0 0 1-2-1.8z"/><path d="M8.6 9h6.8M6 21h12"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.7-5.5 3.9-8.8.6 1.8 1.7 2.9 2.6 3.4.3-2.6 1.6-5 3.4-6.4-.2 3.4 3.1 5.7 3.1 10 0 4.6-2.8 8-6.5 8z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 16 19l1-12"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.4 7.4 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 2.6-1.5l2.4 1 2-3.4z"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5z"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-.9.7-1.6 1.7-1.6h2a4 4 0 0 0 4-4C20.5 6.6 16.7 3.5 12 3.5z"/><circle cx="7.8" cy="11" r="1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1" fill="currentColor"/><circle cx="15" cy="7.8" r="1" fill="currentColor"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.4"/>',
  crown: '<path d="M4 8l4 4 4-6.5 4 6.5 4-4-1.6 10H5.6z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  share: '<path d="M12 15V4M8 7.5 12 3.5l4 4"/><path d="M6 11v7.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V11"/>',
  sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L13 12.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  sunrise: '<path d="M4 18h16M7 14.5a5 5 0 0 1 10 0M12 4v4M9.5 6.5 12 4l2.5 2.5M4.8 11l1.3.8M19.2 11l-1.3.8"/>',
  sunset: '<path d="M4 18h16M7 14.5a5 5 0 0 1 10 0M12 4v4M9.5 5.5 12 8l2.5-2.5M4.8 11l1.3.8M19.2 11l-1.3.8"/>',
  heart: '<path d="M12 19.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 6.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v3.5M8.5 20h7M10 16.5h4l.5 3.5h-5z"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.6"/><path d="M3 9h18M12 9v11M12 9S10.8 4.5 8.5 4.5a2 2 0 0 0 0 4.5M12 9s1.2-4.5 3.5-4.5a2 2 0 0 1 0 4.5"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  refresh: '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4.5V8h-3.5"/>',
  warn: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  fork: '<path d="M7 3.5v6a2 2 0 0 0 4 0v-6M9 3.5v17M16 20.5v-17c-2 1.5-3 4-3 7 0 1.6.9 2.5 3 2.5"/>',
  leaf: '<path d="M5 19c0-8 5-13.5 14-14 .5 9-5 14.5-12.5 14.5"/><path d="M5 19l7-7"/>',
  apple: '<path d="M12 7.5c-1.4-1.2-5.5-1.8-6.6 2.4-1 3.6 1.4 9.6 4.3 9.6 1 0 1.4-.6 2.3-.6s1.3.6 2.3.6c2.9 0 5.3-6 4.3-9.6-1.1-4.2-5.2-3.6-6.6-2.4z"/><path d="M12 7.5c0-2 1-3.5 3-4"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5M18.5 6l1.5-1.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  dots: '<circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor"/>',
  cert: '<rect x="3.5" y="5" width="17" height="12" rx="2"/><path d="M7 9h10M7 12.5h6"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M15.5 19.8 15 22l1.5-.8 1.5.8-.5-2.2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  doc: '<path d="M6.5 3.5h7L18 8v12.5H6.5z"/><path d="M13.5 3.5V8H18M9 12.5h6M9 16h6"/>',
};

export type IconName = keyof typeof P;

export function icon(name: string, size = 24): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? ''}</svg>`;
}

export function hasIcon(name: string): boolean {
  return name in P;
}
