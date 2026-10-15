/**
 * Hand-authored vector art: UI icons, the ten street foods, the cat managers
 * and Tekir. All SVG strings — razor sharp on every screen, a few KB each,
 * and reusable by the store-asset scripts.
 */
let gid = 0;
const uid = (p: string) => `${p}${++gid}`;

// ───────────── currency & meta icons ─────────────

/** Cash coin (the run currency). */
export function coinIcon(size = 24): string {
  const g = uid('cn');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#ffc83d"/><stop offset="1" stop-color="#e58e00"/></linearGradient></defs><circle cx="12" cy="12.6" r="10.4" fill="#b8690a"/><circle cx="12" cy="11.4" r="10" fill="url(#${g})"/><circle cx="12" cy="11.4" r="7.2" fill="none" stroke="#d98900" stroke-width="1.3" opacity=".8"/><path d="M8.6 11.4a3.4 3.4 0 116.8 0 3.4 3.4 0 01-6.8 0z" fill="none" stroke="#b86a00" stroke-width="2.2"/><path d="M12 8v6.8" stroke="#b86a00" stroke-width="1.4" opacity=".0"/><ellipse cx="8.4" cy="7.2" rx="2.6" ry="1.2" fill="#fff" opacity=".6" transform="rotate(-30 8.4 7.2)"/></svg>`;
}

/** Gold (premium currency): a stack of Ottoman-style gold coins. */
export function goldIcon(size = 24): string {
  const g = uid('gd');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7c2"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs><ellipse cx="12" cy="18.4" rx="9" ry="3.4" fill="#a86b00"/><ellipse cx="12" cy="17" rx="9" ry="3.4" fill="#f2b705"/><ellipse cx="12" cy="14.6" rx="9" ry="3.4" fill="#a86b00"/><ellipse cx="12" cy="13.2" rx="9" ry="3.4" fill="#f2b705"/><circle cx="12" cy="9" r="7.6" fill="#a86b00"/><circle cx="12" cy="8.2" r="7.4" fill="url(#${g})"/><path d="M13.6 4.8a3.6 3.6 0 100 6.8 4.3 4.3 0 110-6.8z" fill="#c98600"/><path d="M16.6 6.6l.5 1 1.1.2-.8.8.2 1.1-1-.5-1 .5.2-1.1-.8-.8 1.1-.2z" fill="#c98600"/><ellipse cx="8.8" cy="5.4" rx="2" ry="1" fill="#fff" opacity=".7" transform="rotate(-30 8.8 5.4)"/></svg>`;
}

/** Tulip (lale) — the prestige currency, Istanbul's own flower. */
export function tulipIcon(size = 24): string {
  const g = uid('tl');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7aa2"/><stop offset="1" stop-color="#d1144a"/></linearGradient></defs><path d="M12 13v9" stroke="#2f9e44" stroke-width="2" stroke-linecap="round"/><path d="M12 20c-1-3-3.6-4.6-6.4-4.4 1 2.8 3.4 4.4 6.4 4.4zM12 18.6c1-2.6 3.2-4 5.8-3.8-.9 2.5-3 3.8-5.8 3.8z" fill="#40c057"/><path d="M6.2 4.4c1.6 1 2.6 2 3 3.2L12 2.6l2.8 5c.4-1.2 1.4-2.2 3-3.2.6 4.6-.6 9.2-5.8 9.6-5.2-.4-6.4-5-5.8-9.6z" fill="url(#${g})"/><path d="M12 2.6l-1.6 6.8c.4 2 1 3.4 1.6 4.6.6-1.2 1.2-2.6 1.6-4.6z" fill="#ff9fbd" opacity=".75"/></svg>`;
}

export const ICONS = {
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1l-.4-2.7h-4l-.4 2.7a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.7h4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="currentColor"/><path d="M16.5 10.5l5-3v9l-5-3z" fill="currentColor"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  music: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V5.5l11-2v12" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="2.8" fill="currentColor"/><circle cx="17.5" cy="15.5" r="2.8" fill="currentColor"/></svg>`,
  vibrate: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7.5" y="3" width="9" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 8v8M20.5 8v8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 00-6 6v4l-2 3h16l-2-3V9a6 6 0 00-6-6z" fill="currentColor"/><path d="M10 19a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8 3v6c0 5-3.5 8.7-8 10-4.5-1.3-8-5-8-10v-6z" fill="currentColor"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  restore: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4 3v5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l-1.2 13H6.2zM9 7V4h6v3M3 7h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2L4 13.5h6.5L9 22l11-12.5h-6.8z" fill="currentColor"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5.5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.3l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" fill="currentColor"/></svg>`,
};

/** Colourful nav / feature icons (32×32). */
export const BADGE_ICONS = {
  stands: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="15" width="20" height="12" rx="1.6" fill="#f6d7a7"/><path d="M4 8h24l-1.6 7H5.6z" fill="#e8553e"/><path d="M8.5 8l-.8 7M13 8l-.3 7M19 8l.3 7M23.5 8l.8 7" stroke="#fff" stroke-width="2.2"/><path d="M5.6 15a2.1 2.1 0 004.2 0 2.1 2.1 0 004.1 0 2.1 2.1 0 004.2 0 2.1 2.1 0 004.1 0 2.1 2.1 0 004.2 0" fill="#e8553e"/><circle cx="16" cy="21.5" r="3.6" fill="none" stroke="#c87533" stroke-width="2.4"/><circle cx="16" cy="21.5" r="1.2" fill="#f6d7a7"/></svg>`,
  cats: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 9l2.5-5 4.5 4h6l4.5-4L26 9v9a10 10 0 01-20 0z" fill="#9c8f84"/><path d="M8 7.5l1.2-2.4 2.2 2zM24 7.5l-1.2-2.4-2.2 2z" fill="#ffb7c5"/><circle cx="12" cy="15.5" r="2.2" fill="#2b1d14"/><circle cx="20" cy="15.5" r="2.2" fill="#2b1d14"/><circle cx="12.7" cy="14.8" r=".7" fill="#fff"/><circle cx="20.7" cy="14.8" r=".7" fill="#fff"/><path d="M14.6 19h2.8L16 20.4z" fill="#ff8fa3"/><path d="M16 20.4q-1.4 1.6-2.8.6M16 20.4q1.4 1.6 2.8.6" fill="none" stroke="#2b1d14" stroke-width="1.1" stroke-linecap="round"/><path d="M13 10q1 2 0 3.4M16 9.4v3.6M19 10q-1 2 0 3.4" stroke="#5c514a" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>`,
  recipes: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 6.5q5.5-2 11 1 5.5-3 11-1v19q-5.5-2-11 1-5.5-3-11-1z" fill="#fff4dc"/><path d="M16 7.5v19" stroke="#d7a86e" stroke-width="1.6"/><path d="M5 6.5q5.5-2 11 1 5.5-3 11-1" fill="none" stroke="#b5651d" stroke-width="2"/><path d="M8 12h5M8 15.5h5M8 19h4M19 12h5M19 15.5h5" stroke="#c9a173" stroke-width="1.6" stroke-linecap="round"/><circle cx="22" cy="20.5" r="3" fill="#e8553e"/><path d="M22 17.5v-2" stroke="#2f9e44" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  districts: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 26h26v2H3z" fill="#3b97c4"/><path d="M7 26V14h4v12zM21 26V10a2 2 0 014 0v16z" fill="#56708a"/><path d="M9 14l2-5 2 5z" fill="#56708a"/><path d="M11 26V18a5 5 0 0110 0v8z" fill="#7a8fa6"/><path d="M16 9v4" stroke="#7a8fa6" stroke-width="1.6"/><circle cx="16" cy="8.4" r="1" fill="#ffd166"/><path d="M23 6l0-2" stroke="#56708a" stroke-width="1.4"/></svg>`,
  shop: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 11h20l-1.6 15.2A2 2 0 0122.4 28H9.6a2 2 0 01-2-1.8z" fill="#2a9d8f"/><path d="M6 11h20l-.4 4H6.4z" fill="#3fc1b0"/><path d="M11 13V9a5 5 0 0110 0v4" fill="none" stroke="#ffd23f" stroke-width="2.6" stroke-linecap="round"/><circle cx="11" cy="13.5" r="1.6" fill="#ffd23f"/><circle cx="21" cy="13.5" r="1.6" fill="#ffd23f"/><path d="M16 17.6l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#fff"/></svg>`,
  gift: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="13" width="22" height="15" rx="2" fill="#e8553e"/><rect x="3.5" y="9" width="25" height="6" rx="2" fill="#ff7b5c"/><rect x="14" y="9" width="4" height="19" fill="#ffd23f"/><path d="M16 9c-3-6-9-5-8-1.5S16 9 16 9zM16 9c3-6 9-5 8-1.5S16 9 16 9z" fill="#ffd23f" stroke="#c56a00" stroke-width="1"/></svg>`,
  quests: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="5" width="18" height="23" rx="3" fill="#fef3c7"/><rect x="7" y="5" width="18" height="5" rx="2.5" fill="#f59e0b"/><path d="M11 15l2 2 3.5-3.5M11 22l2 2 3.5-3.5" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 16h3M19 23h3" stroke="#a16207" stroke-width="2" stroke-linecap="round"/></svg>`,
  trophy: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 5h12v6a6 6 0 01-12 0z" fill="#ffc531"/><path d="M10 7H5.5a4.5 4.5 0 004.8 5.2M22 7h4.5a4.5 4.5 0 01-4.8 5.2" fill="none" stroke="#e09a00" stroke-width="2"/><path d="M14 17h4v4h-4z" fill="#e09a00"/><rect x="9.5" y="21" width="13" height="3.2" rx="1" fill="#c98600"/><rect x="8" y="24" width="16" height="3" rx="1.2" fill="#8a5a00"/><path d="M16 7.4l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#fff6c7"/></svg>`,
  boost: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#7b61ff"/><circle cx="16" cy="14.5" r="11.5" fill="#9b87ff"/><path d="M17.5 5.5L9.5 17h5.4l-1.4 9.5 9-12.2h-5.6z" fill="#ffd23f" stroke="#e09a00" stroke-width="1"/></svg>`,
  club: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 11l6 5 6-9 6 9 6-5-2.5 14h-19z" fill="#ffc531" stroke="#c56a00" stroke-width="1.4" stroke-linejoin="round"/><rect x="6.5" y="24" width="19" height="3.5" rx="1" fill="#e08a00"/><circle cx="16" cy="18" r="2.2" fill="#e8553e"/><circle cx="10.5" cy="20" r="1.4" fill="#2a9d8f"/><circle cx="21.5" cy="20" r="1.4" fill="#2a9d8f"/></svg>`,
  warp: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12.5" fill="#264653"/><circle cx="16" cy="16" r="10" fill="#e9f5f3"/><path d="M16 9v7.5l5 3" fill="none" stroke="#264653" stroke-width="2.6" stroke-linecap="round"/><path d="M27 7l-2 6-5.5-3.2z" fill="#ffd23f"/><path d="M5 25l2-6 5.5 3.2z" fill="#ffd23f"/></svg>`,
  till: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="14" width="22" height="13" rx="2.5" fill="#b5651d"/><rect x="5" y="14" width="22" height="4" rx="2" fill="#d8873a"/><rect x="9" y="6" width="14" height="8" rx="1.5" fill="#56708a"/><rect x="11" y="8" width="10" height="3.6" rx="1" fill="#a8e6cf"/><circle cx="16" cy="22" r="2.4" fill="#ffd23f"/></svg>`,
  video: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="7" width="26" height="18" rx="5" fill="#e8553e"/><path d="M13 11.5v9l8-4.5z" fill="#fff"/></svg>`,
};

// ───────────── street foods (100×100) ─────────────

function simit(): string {
  const g = uid('sm');
  return `<defs><radialGradient id="${g}" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#f6c17a"/><stop offset=".6" stop-color="#d9873a"/><stop offset="1" stop-color="#9e5317"/></radialGradient></defs>
<ellipse cx="50" cy="58" rx="40" ry="34" fill="#7a3d0c" opacity=".35"/>
<path fill-rule="evenodd" d="M50 14a38 36 0 110 72 38 36 0 010-72zm0 22a15 13 0 100 26 15 13 0 000-26z" fill="url(#${g})" stroke="#8a4510" stroke-width="2.4"/>
<g fill="none" stroke="#a85a1c" stroke-width="2.2" stroke-linecap="round" opacity=".55"><path d="M22 34q8 6 6 16M36 18q6 8 2 18M64 18q-4 9 2 18M80 36q-9 5-9 15M78 70q-10-3-14 6M50 84q-2-10-10-12M24 68q8-4 14 4"/></g>
<g fill="#fff4d6">${[
    [26, 30], [33, 23], [42, 19], [55, 19], [66, 23], [74, 31], [80, 43], [79, 56], [74, 68], [64, 77], [52, 81], [39, 79], [29, 72], [22, 61], [20, 48], [31, 41], [69, 42], [70, 60], [32, 60], [45, 28], [60, 30], [47, 71], [58, 70],
  ]
    .map(([x, y], k) => `<ellipse cx="${x}" cy="${y}" rx="2.1" ry="1.2" transform="rotate(${(k * 47) % 180} ${x} ${y})"/>`)
    .join('')}</g>
<path d="M30 26q12-10 28-8" fill="none" stroke="#ffe2b0" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
}

function cay(): string {
  const g = uid('cy');
  const gl = uid('cg');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2582a"/><stop offset="1" stop-color="#8f1d0e"/></linearGradient><linearGradient id="${gl}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".3" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient></defs>
<ellipse cx="50" cy="84" rx="38" ry="9" fill="#9b1c2e"/><ellipse cx="50" cy="81" rx="38" ry="9" fill="#e63946"/><ellipse cx="50" cy="80" rx="30" ry="6.5" fill="#fff"/><ellipse cx="50" cy="80" rx="22" ry="4.6" fill="#e63946"/>
<path d="M30 18h40q-2 14-9 24 8 10 6 26-2 10-17 10t-17-10q-2-16 6-26-7-10-9-24z" fill="#fde7d3" opacity=".35" stroke="#c97b63" stroke-width="2"/>
<path d="M33.5 30h33q-2.5 7-7.5 12 7.5 9 5.8 24-1.5 8-14.8 8t-14.8-8q-1.7-15 5.8-24-5-5-7.5-12z" fill="url(#${g})"/>
<path d="M30 18h40q-2 14-9 24 8 10 6 26-2 10-17 10t-17-10q-2-16 6-26-7-10-9-24z" fill="url(#${gl})"/>
<ellipse cx="50" cy="18" rx="20" ry="3.5" fill="none" stroke="#c97b63" stroke-width="2"/>
<path d="M38 34q2 4 5 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
<rect x="72" y="62" width="11" height="11" rx="2" fill="#fff" stroke="#ddd" stroke-width="1"/><path d="M73 64h9" stroke="#eee" stroke-width="1"/>
<path d="M44 10q4-5 0-9M54 11q4-5 0-9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
}

function pogaca(): string {
  const g = uid('pg');
  return `<defs><radialGradient id="${g}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffe0a0"/><stop offset=".55" stop-color="#eab05a"/><stop offset="1" stop-color="#b9732a"/></radialGradient></defs>
<ellipse cx="50" cy="80" rx="38" ry="8" fill="#7a3d0c" opacity=".3"/>
<path d="M12 70q0-36 38-40 38 4 38 40 0 8-38 8t-38-8z" fill="url(#${g})" stroke="#9a5a1c" stroke-width="2.4"/>
<path d="M22 54q14-16 36-14" fill="none" stroke="#fff3cf" stroke-width="5" stroke-linecap="round" opacity=".7"/>
<g fill="#2b1d14">${[
    [38, 44], [46, 41], [54, 40], [62, 43], [42, 50], [50, 47], [58, 48], [66, 51], [34, 52], [46, 55], [55, 54], [62, 58], [70, 57], [40, 60], [50, 61], [30, 59],
  ]
    .map(([x, y], k) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="1" transform="rotate(${(k * 53) % 180} ${x} ${y})"/>`)
    .join('')}</g>
<path d="M16 70q34 8 68 0" fill="none" stroke="#a5652a" stroke-width="2" opacity=".6"/>`;
}

function balik(): string {
  const g = uid('bk');
  const f = uid('fs');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c17a"/><stop offset="1" stop-color="#c47a32"/></linearGradient><linearGradient id="${f}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d7fa3"/><stop offset=".5" stop-color="#9fb8cf"/><stop offset="1" stop-color="#e8eef3"/></linearGradient></defs>
<ellipse cx="50" cy="82" rx="40" ry="7" fill="#7a3d0c" opacity=".3"/>
<path d="M8 66q2-10 42-10t42 10q0 12-42 12T8 66z" fill="url(#${g})" stroke="#9a5a1c" stroke-width="2.2"/>
<path d="M10 58q20-6 40-4 22-2 42 4l-3 6q-18-4-39-3-21-1-37 3z" fill="#7bc043"/><path d="M14 56q4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0" fill="none" stroke="#5a9e2f" stroke-width="2"/>
<path d="M14 50q18-14 50-8 10 2 16-4l4 2-3 7 4 7-5 0q-8-7-18-5-30 6-48 1z" fill="url(#${f})" stroke="#3f5f80" stroke-width="2"/>
<path d="M30 46q8-3 16-2M24 50q6-2 12-1" stroke="#3f5f80" stroke-width="1.6" stroke-linecap="round" opacity=".6"/><circle cx="72" cy="45" r="1.8" fill="#1d2b3a"/>
<path d="M8 46q2-14 42-14t42 14q-4 4-42 4T8 46z" fill="url(#${g})" stroke="#9a5a1c" stroke-width="2.2"/>
<path d="M22 38q12-4 26-4" stroke="#ffe2b0" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<ellipse cx="34" cy="56" rx="7" ry="3" fill="none" stroke="#e9d8f4" stroke-width="2.2"/><ellipse cx="62" cy="57" rx="6" ry="2.6" fill="none" stroke="#e9d8f4" stroke-width="2.2"/>
<path d="M78 20a10 10 0 0114 6l-14 4z" fill="#ffe14d" stroke="#e0b400" stroke-width="1.6"/>`;
}

function doner(): string {
  const g = uid('dn');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a3a12"/><stop offset=".45" stop-color="#c26a2e"/><stop offset=".7" stop-color="#e09455"/><stop offset="1" stop-color="#8a4316"/></linearGradient></defs>
<rect x="47" y="4" width="6" height="88" rx="3" fill="#aeb7c2"/><circle cx="50" cy="6" r="4.5" fill="#c9d1da"/>
<path d="M26 18h48l-8 62H34z" fill="url(#${g})" stroke="#5e2a0c" stroke-width="2.2"/>
<g stroke="#5e2a0c" stroke-width="1.6" opacity=".55" fill="none"><path d="M27.5 28h45M29 38h42M30 48h40M31.5 58h37M33 68h34"/></g>
<g fill="#ffd9a8" opacity=".55"><path d="M36 22h6l-1 54h-4z"/></g>
<rect x="30" y="80" width="40" height="7" rx="2" fill="#6b7280"/><rect x="22" y="88" width="56" height="6" rx="3" fill="#4b5563"/>
<path d="M76 40l16-6-2 8-14 4z" fill="#d1d5db" stroke="#9ca3af" stroke-width="1.4"/><rect x="88" y="30" width="7" height="14" rx="2" fill="#7c4a2a" transform="rotate(-20 91 37)"/>
<path d="M68 44q8 2 10 10" fill="none" stroke="#c26a2e" stroke-width="3" stroke-linecap="round"/>`;
}

function kumpir(): string {
  const g = uid('kp');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f4f6"/><stop offset=".5" stop-color="#b8c0cc"/><stop offset="1" stop-color="#e5e7eb"/></linearGradient></defs>
<ellipse cx="50" cy="84" rx="38" ry="7" fill="#374151" opacity=".25"/>
<path d="M10 52q4 32 40 32t40-32z" fill="url(#${g})" stroke="#8b95a3" stroke-width="2.2"/>
<path d="M16 60l6 4M30 72l4-6M66 70l4 5M80 60l-5 4" stroke="#9aa3af" stroke-width="1.6"/>
<path d="M14 52q2-22 36-24 34 2 36 24-18 8-36 8t-36-8z" fill="#f2d49b" stroke="#c69a4f" stroke-width="2"/>
<path d="M20 50q10-10 30-10 20 0 30 10-14 6-30 6t-30-6z" fill="#fff4d6"/>
<g><circle cx="30" cy="45" r="3" fill="#ffd23f"/><circle cx="36" cy="49" r="3" fill="#ffd23f"/><circle cx="33" cy="41" r="3" fill="#ffd23f"/><circle cx="56" cy="40" r="3.2" fill="#52b788"/><circle cx="62" cy="44" r="3.2" fill="#52b788"/><circle cx="58" cy="48" r="3.2" fill="#52b788"/><rect x="42" y="40" width="9" height="5" rx="2.5" fill="#7c3aed" transform="rotate(-20 46 42)"/><rect x="44" y="47" width="8" height="4.5" rx="2.2" fill="#7c3aed" transform="rotate(15 48 49)"/><circle cx="70" cy="49" r="4" fill="#e8553e"/><circle cx="70" cy="49" r="2" fill="#f4a08f"/><circle cx="25" cy="50" r="3.6" fill="#e8553e"/><circle cx="25" cy="50" r="1.8" fill="#f4a08f"/><rect x="64" y="38" width="10" height="4" rx="2" fill="#4c956c" transform="rotate(30 69 40)"/><path d="M38 36q4-4 8 0" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>
<path d="M22 70q8 8 20 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7" fill="none"/>`;
}

function midye(): string {
  const g = uid('md');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5d78"/><stop offset=".5" stop-color="#1f2937"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
<ellipse cx="48" cy="84" rx="40" ry="7" fill="#0f172a" opacity=".25"/>
<path d="M8 66q14-38 52-40 20 0 28 10Q66 62 8 66z" fill="url(#${g})" stroke="#0b1220" stroke-width="2"/>
<path d="M18 58q16-20 46-24" stroke="#7a8ba6" stroke-width="2" fill="none" opacity=".7"/><path d="M24 62q16-18 44-22" stroke="#7a8ba6" stroke-width="1.6" fill="none" opacity=".5"/>
<path d="M10 66q30 4 60-8 14-6 20-20 4 18-8 32-26 18-72-4z" fill="url(#${g})" stroke="#0b1220" stroke-width="2"/>
<path d="M16 64q26-2 50-10 14-6 20-18 0 10-6 18-12 10-34 14-16 2-30-4z" fill="#e8a35b" stroke="#b56d24" stroke-width="1.6"/>
<g fill="#fff3d6" opacity=".85">${[
    [26, 62], [32, 60], [38, 61], [44, 58], [50, 59], [56, 56], [62, 55], [68, 52], [74, 49], [41, 64], [53, 62], [64, 59],
  ]
    .map(([x, y], k) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1" transform="rotate(${(k * 41) % 180} ${x} ${y})"/>`)
    .join('')}</g>
<g fill="#5b2a0e">${[[30, 63], [47, 61], [60, 57], [70, 53]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g>
<path d="M66 16a14 14 0 0120 12L66 30z" fill="#ffe14d" stroke="#e0b400" stroke-width="1.8"/><path d="M68 18l2 10M74 16l-1 12M80 19l-6 10" stroke="#fff7ad" stroke-width="1.4"/>`;
}

function dondurma(): string {
  const g = uid('dc');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9913f"/><stop offset=".5" stop-color="#f3c27a"/><stop offset="1" stop-color="#c47a32"/></linearGradient></defs>
<path d="M34 50h32L50 94z" fill="url(#${g})" stroke="#9a5a1c" stroke-width="2"/>
<g stroke="#a8652a" stroke-width="1.4" opacity=".7"><path d="M38 56l18 24M44 52l16 20M36 64l12 16M62 56L44 80M56 52L40 72M64 64L52 80"/></g>
<path d="M30 52q-4-14 10-18 2-12 14-10 12-2 14 10 12 6 6 18z" fill="#fffaf3" stroke="#e0d6c8" stroke-width="2"/>
<path d="M36 34q-2-14 12-16 14 0 14 14-6 6-14 4-8 4-12-2z" fill="#ff9ec4" stroke="#e57aa6" stroke-width="2"/>
<path d="M42 24q4-4 10-2" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".8"/>
<path d="M66 44q12 4 18-6" fill="none" stroke="#fffaf3" stroke-width="5" stroke-linecap="round"/><path d="M66 44q12 4 18-6" fill="none" stroke="#e0d6c8" stroke-width="1.4" stroke-linecap="round"/>
<g fill="#7bc043"><circle cx="44" cy="44" r="1.6"/><circle cx="52" cy="46" r="1.6"/><circle cx="58" cy="42" r="1.6"/><circle cx="40" cy="38" r="1.4"/><circle cx="55" cy="30" r="1.4"/><circle cx="47" cy="28" r="1.4"/></g>
<rect x="80" y="16" width="5" height="30" rx="2.5" fill="#a16207" transform="rotate(25 82 31)"/>`;
}

function lokum(): string {
  const cube = (x: number, y: number, top: string, side: string, front: string) =>
    `<g transform="translate(${x} ${y})"><path d="M0 10l12-8h22l-12 8z" fill="${top}"/><path d="M22 10l12-8v20l-12 8z" fill="${side}"/><rect x="0" y="10" width="22" height="20" rx="2" fill="${front}"/><g fill="#fff" opacity=".9"><circle cx="5" cy="15" r="1.2"/><circle cx="12" cy="13" r="1"/><circle cx="17" cy="18" r="1.3"/><circle cx="8" cy="23" r="1"/><circle cx="16" cy="26" r="1.1"/><circle cx="20" cy="6" r="1"/><circle cx="26" cy="5" r="1.2"/><circle cx="14" cy="6" r="1"/></g></g>`;
  return `<ellipse cx="50" cy="84" rx="40" ry="7" fill="#7a1f45" opacity=".2"/>
${cube(10, 46, '#ffe0ee', '#e86aa0', '#ff8fbf')}${cube(54, 48, '#f6fff0', '#8cc63f', '#b5e48c')}${cube(32, 22, '#fff', '#d7d2e6', '#f5f3fa')}
<g fill="#7bc043"><ellipse cx="62" cy="64" rx="2" ry="1.2"/><ellipse cx="68" cy="68" rx="2" ry="1.2"/><ellipse cx="60" cy="72" rx="2" ry="1.2"/></g>
<g fill="#fff" opacity=".85"><circle cx="20" cy="86" r="1.4"/><circle cx="30" cy="88" r="1.1"/><circle cx="72" cy="88" r="1.3"/><circle cx="82" cy="85" r="1"/></g>`;
}

function kebap(): string {
  const g = uid('kb');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5532a"/><stop offset=".5" stop-color="#8f3b17"/><stop offset="1" stop-color="#5e230b"/></linearGradient></defs>
<ellipse cx="50" cy="80" rx="44" ry="12" fill="#f5e6c8" stroke="#d6b98a" stroke-width="2"/>
<path d="M14 76q36 10 72 0" stroke="#e8d3a8" stroke-width="2" fill="none"/>
<rect x="4" y="44" width="92" height="4" rx="2" fill="#aeb7c2" transform="rotate(-8 50 46)"/><path d="M90 36l8-2-2 6z" fill="#ffd23f" transform="rotate(-8 50 46)"/>
<path d="M12 50q2-8 10-9 30-4 56-10 8 0 10 7t-6 10q-26 6-58 10-10 1-12-8z" fill="url(#${g})" stroke="#4a1a07" stroke-width="2" transform="rotate(-2 50 46)"/>
<g stroke="#3d1405" stroke-width="2.4" stroke-linecap="round" opacity=".7"><path d="M26 44l4 12M38 42l4 12M50 40l4 12M62 37l4 12M74 34l4 12"/></g>
<path d="M20 46q20-4 40-8" stroke="#e08a5a" stroke-width="2.2" stroke-linecap="round" opacity=".6" fill="none"/>
<path d="M18 70q10-8 22-4 4 6-4 10-10 2-18-6z" fill="#3fa34d" stroke="#2b7a35" stroke-width="1.6"/>
<circle cx="66" cy="72" r="8" fill="#e63946" stroke="#b5172a" stroke-width="1.6"/><path d="M62 69q4-3 8 0" stroke="#ff8a95" stroke-width="2" fill="none"/>
<g fill="#b5179e" opacity=".8"><ellipse cx="46" cy="72" rx="5" ry="2.4" fill="none" stroke="#b5179e" stroke-width="2"/><ellipse cx="80" cy="70" rx="4" ry="2" fill="none" stroke="#b5179e" stroke-width="2"/></g>
<g fill="#8b1e3f"><circle cx="40" cy="68" r=".9"/><circle cx="52" cy="66" r=".9"/><circle cx="56" cy="74" r=".9"/></g>`;
}

const FOOD_ART: Record<string, () => string> = { simit, cay, pogaca, balik, doner, kumpir, midye, dondurma, lokum, kebap };

/** Background tint for each stand's icon plate. */
export const FOOD_TINT: Record<string, [string, string]> = {
  simit: ['#ffe8c7', '#f3b664'],
  cay: ['#ffe0dc', '#e8553e'],
  pogaca: ['#fff2cf', '#e9b44c'],
  balik: ['#dcf1ff', '#3b97c4'],
  doner: ['#ffe2cc', '#c26a2e'],
  kumpir: ['#eef1f5', '#8b95a3'],
  midye: ['#e3e8f2', '#4b5d78'],
  dondurma: ['#ffe6f1', '#ff8fbf'],
  lokum: ['#f8e6ff', '#c77dff'],
  kebap: ['#ffe1d6', '#b5532a'],
};

export function foodSVG(id: string, size = 64): string {
  return `<svg class="food food-${id}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${FOOD_ART[id]?.() ?? ''}</svg>`;
}

// ───────────── cats ─────────────

type Accessory = 'scarf' | 'bead' | 'chef' | 'cap' | 'paperhat' | 'bandana' | 'fez' | 'bow' | 'glasses' | 'crown';

interface CatLook {
  fur: [string, string, string];
  stripe?: string;
  muzzle: string;
  eyes: [string, string];
  accessory: Accessory;
  patches?: string;
  mask?: string;
  fluffy?: boolean;
  earTip?: string;
}

export interface CatDef {
  name: string;
  look: CatLook;
}

/** The ten cat managers, one per stand (index = stand index). */
export const CATS: readonly CatDef[] = [
  { name: 'Pamuk', look: { fur: ['#ffffff', '#f1eef6', '#d6d0e0'], muzzle: '#ffffff', eyes: ['#6ec1ff', '#6ec1ff'], accessory: 'scarf' } },
  {
    name: 'Boncuk',
    look: {
      fur: ['#fffaf2', '#f6efe4', '#e2d6c4'],
      muzzle: '#ffffff',
      eyes: ['#9ad94f', '#9ad94f'],
      accessory: 'bead',
      patches: `<path d="M38 70q6-30 34-26-8 18-6 34-16 2-28-8z" fill="#f4a259"/><path d="M128 46q24-6 34 20-14 6-30 2z" fill="#2b2d42"/><path d="M150 96q8 12 0 26-10-4-12-16z" fill="#f4a259"/>`,
    },
  },
  { name: 'Duman', look: { fur: ['#c3c8d2', '#959cab', '#6b7280'], stripe: '#5d6573', muzzle: '#d9dde4', eyes: ['#f6c453', '#f6c453'], accessory: 'chef' } },
  { name: 'Karamel', look: { fur: ['#ffd29a', '#f4a259', '#d9822b'], stripe: '#bf6514', muzzle: '#fff1dc', eyes: ['#8bd450', '#8bd450'], accessory: 'cap' } },
  { name: 'Fıstık', look: { fur: ['#fff3dc', '#f0d6a6', '#d6b07a'], stripe: '#c79a5e', muzzle: '#fffaf0', eyes: ['#6cc04a', '#6cc04a'], accessory: 'paperhat' } },
  { name: 'Zeytin', look: { fur: ['#565a75', '#2f3247', '#1c1d2e'], muzzle: '#3a3d55', eyes: ['#ffd23f', '#ffd23f'], accessory: 'bandana' } },
  {
    name: 'Paşa',
    look: {
      fur: ['#4b4f66', '#2b2d42', '#1a1b2e'],
      muzzle: '#ffffff',
      eyes: ['#9be15d', '#9be15d'],
      accessory: 'fez',
      patches: `<path d="M100 74q-16 14-14 30 14-4 14-4t14 4q2-16-14-30z" fill="#ffffff"/>`,
    },
  },
  { name: 'Minnoş', look: { fur: ['#fffaf0', '#f5ead5', '#e3d2b4'], muzzle: '#8a6a55', mask: '#6b4f3f', earTip: '#6b4f3f', eyes: ['#5aa9e6', '#5aa9e6'], accessory: 'bow' } },
  { name: 'Tarçın', look: { fur: ['#e0a96d', '#b8773c', '#8c5a2b'], stripe: '#5e3818', muzzle: '#f6dfc2', eyes: ['#b8e05a', '#b8e05a'], accessory: 'glasses' } },
  {
    name: 'Sultan',
    look: {
      fur: ['#ffffff', '#faf7f2', '#e8e1d6'],
      muzzle: '#ffffff',
      eyes: ['#58a4ff', '#f2b134'],
      accessory: 'crown',
      fluffy: true,
      patches: `<path d="M64 50q14-14 36-12-6 14-20 18z" fill="#d9783f"/><path d="M110 40q22 0 30 14-14 4-26-2z" fill="#d9783f"/>`,
    },
  },
];

function accessorySVG(a: Accessory, ids: { a: string; b: string }): { back: string; front: string; defs: string } {
  switch (a) {
    case 'scarf':
      return { defs: '', back: '', front: `<path d="M52 140q48 22 96 0l4 16q-52 22-104 0z" fill="#e63946"/><path d="M118 150l18 30-14 4-12-28z" fill="#c1121f"/><g fill="#fff" opacity=".8"><circle cx="70" cy="150" r="2.4"/><circle cx="92" cy="154" r="2.4"/><circle cx="114" cy="153" r="2.4"/><circle cx="136" cy="147" r="2.4"/></g>` };
    case 'bead':
      return { defs: '', back: '', front: `<path d="M54 142q46 20 92 0" fill="none" stroke="#8d6e63" stroke-width="5"/><circle cx="100" cy="156" r="13" fill="#1d4ed8"/><circle cx="100" cy="156" r="9" fill="#fff"/><circle cx="100" cy="156" r="6" fill="#38bdf8"/><circle cx="100" cy="156" r="3" fill="#0b1220"/><circle cx="96.5" cy="152.5" r="1.6" fill="#fff"/>` };
    case 'chef':
      return { defs: '', back: '', front: `<g transform="translate(0 -6)"><rect x="66" y="40" width="68" height="20" rx="4" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/><path d="M66 44q-18-6-12-24 8-14 24-8 4-14 22-14t22 14q16-6 24 8 6 18-12 24z" fill="#ffffff" stroke="#dee2e6" stroke-width="2"/><path d="M84 22q2 12 0 20M100 16v26M116 22q-2 12 0 20" stroke="#e9ecef" stroke-width="2" fill="none"/></g>` };
    case 'cap':
      return { defs: '', back: '', front: `<path d="M50 62q4-34 50-34t50 34q-50-10-100 0z" fill="#1d3557"/><path d="M44 62q56-14 112 0-2 6-56 2-54 4-56-2z" fill="#14213d"/><path d="M96 38l4-6 4 6M100 32v12M94 42q6 4 12 0" stroke="#ffd23f" stroke-width="2.2" fill="none" stroke-linecap="round"/>` };
    case 'paperhat':
      return { defs: '', back: '', front: `<path d="M58 58l42-30 42 30z" fill="#ffffff" stroke="#dee2e6" stroke-width="2"/><rect x="56" y="54" width="88" height="10" rx="3" fill="#e63946"/><path d="M70 50l30-20 30 20" fill="none" stroke="#f1f3f5" stroke-width="2"/>` };
    case 'bandana':
      return { defs: '', back: '', front: `<path d="M44 66q8-40 56-40t56 40q-56-16-112 0z" fill="#2a9d8f"/><path d="M150 60l18 8-14 10z" fill="#21867a"/><g fill="#e9f5f3" opacity=".9"><circle cx="76" cy="46" r="3"/><circle cx="100" cy="38" r="3"/><circle cx="124" cy="46" r="3"/><circle cx="88" cy="56" r="2.4"/><circle cx="112" cy="56" r="2.4"/></g>` };
    case 'fez':
      return {
        defs: `<linearGradient id="${ids.a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset="1" stop-color="#b3122a"/></linearGradient>`,
        back: '',
        front: `<g transform="rotate(-10 100 40)"><path d="M78 52l6-30h32l6 30z" fill="url(#${ids.a})"/><ellipse cx="100" cy="52" rx="22" ry="5" fill="#8f0f22"/><ellipse cx="100" cy="22" rx="16" ry="3.5" fill="#d61f38"/><path d="M100 22q15 1 17 19" fill="none" stroke="#1f1610" stroke-width="2.4" stroke-linecap="round"/><path d="M117 40q-5 8-3 16q4 2 7 0q2-8-4-16z" fill="#2b1d14"/></g><path d="M86 128q-8-6-20-2M114 128q8-6 20-2" stroke="#1a1b2e" stroke-width="3.4" stroke-linecap="round" fill="none"/>`,
      };
    case 'bow':
      return { defs: '', back: '', front: `<g transform="translate(132 46) rotate(18)"><path d="M0 0l-22-12v24zM0 0l22-12v24z" fill="#ff7eb6" stroke="#e05a96" stroke-width="2"/><circle r="6" fill="#ff4f9a"/></g>` };
    case 'glasses':
      return { defs: '', back: '', front: `<g fill="none" stroke="#c9a227" stroke-width="3.2"><circle cx="78" cy="98" r="15"/><circle cx="122" cy="98" r="15"/><path d="M93 96q7-4 14 0M63 96l-14-4M137 96l14-4"/></g><g fill="#fff" opacity=".25"><circle cx="78" cy="98" r="14"/><circle cx="122" cy="98" r="14"/></g>` };
    case 'crown':
      return {
        defs: `<linearGradient id="${ids.b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#f2a900"/></linearGradient>`,
        back: '',
        front: `<path d="M66 52l-4-30 18 14 20-22 20 22 18-14-4 30z" fill="url(#${ids.b})" stroke="#c98600" stroke-width="2" stroke-linejoin="round"/><rect x="64" y="48" width="72" height="9" rx="3" fill="#e0a100"/><circle cx="100" cy="36" r="4.4" fill="#e63946"/><circle cx="80" cy="44" r="3" fill="#2a9d8f"/><circle cx="120" cy="44" r="3" fill="#2a9d8f"/><circle cx="62" cy="22" r="3" fill="#fff3a0"/><circle cx="100" cy="14" r="3" fill="#fff3a0"/><circle cx="138" cy="22" r="3" fill="#fff3a0"/>`,
      };
  }
}

/**
 * A cat manager portrait (head + shoulders, 200×200).
 * `mood`: idle (blinking eyes), happy (closed smiling eyes), sleep.
 */
export function catSVG(i: number, size = 64, mood: 'idle' | 'happy' | 'sleep' = 'idle'): string {
  const c = CATS[i].look;
  const fur = uid('cf');
  const acc = accessorySVG(c.accessory, { a: uid('ca'), b: uid('cb') });
  const stripes = c.stripe
    ? `<path d="M86 52q4 14 0 26M100 48v30M114 52q-4 14 0 26" stroke="${c.stripe}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M40 92q12 2 18 8M40 108q12-2 18-4M160 92q-12 2-18 8M160 108q-12-2-18-4" stroke="${c.stripe}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`
    : '';
  const mask = c.mask ? `<ellipse cx="100" cy="112" rx="34" ry="30" fill="${c.mask}" opacity=".85"/>` : '';
  const eye = (cx: number, color: string) =>
    `<ellipse cx="${cx}" cy="98" rx="11" ry="12.5" fill="${color}"/><ellipse cx="${cx}" cy="99" rx="4.5" ry="10" fill="#1f1610"/><circle cx="${cx + 3.5}" cy="93" r="3.4" fill="#fff"/>`;
  const eyes =
    mood === 'happy'
      ? `<path d="M70 98q8-9 16 0M114 98q8-9 16 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>`
      : mood === 'sleep'
        ? `<path d="M70 98q8 7 16 0M114 98q8 7 16 0" fill="none" stroke="#2b1d14" stroke-width="4.5" stroke-linecap="round"/>`
        : `<g class="cat-eyes">${eye(78, c.eyes[0])}${eye(122, c.eyes[1])}</g>`;
  const ear = c.earTip ?? c.fur[2];
  const fluff = c.fluffy ? `<path d="M36 112l-10 6 12 2-8 8 14-2M164 112l10 6-12 2 8 8-14-2" fill="${c.fur[1]}"/>` : '';
  return `<svg class="cat cat-${i}" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${CATS[i].name}">
<defs><radialGradient id="${fur}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${c.fur[0]}"/><stop offset=".65" stop-color="${c.fur[1]}"/><stop offset="1" stop-color="${c.fur[2]}"/></radialGradient>${acc.defs}</defs>
<ellipse cx="100" cy="176" rx="58" ry="30" fill="${c.fur[2]}"/>
<path d="M44 70L52 22l36 30zM156 70l-8-48-36 30z" fill="${ear}" stroke="${c.fur[2]}" stroke-width="2"/>
<path d="M54 60l4-28 20 18zM146 60l-4-28-20 18z" fill="#ffb7c5"/>
${fluff}
<ellipse cx="100" cy="98" rx="62" ry="54" fill="url(#${fur})"/>
${c.patches ?? ''}${mask}${stripes}
<ellipse cx="100" cy="122" rx="30" ry="20" fill="${c.muzzle}"/>
${eyes}
<path d="M93 110h14l-7 7z" fill="#ff8fa3"/>
<path d="M100 116v5M100 121q-6 7-12 2M100 121q6 7 12 2" fill="none" stroke="#2b1d14" stroke-width="3.5" stroke-linecap="round"/>
<g stroke="${c.mask || c.fur[0] === '#565a75' || c.fur[0] === '#4b4f66' ? '#d9d9e3' : '#fff'}" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M70 118l-26-4M70 124l-25 4M130 118l26-4M130 124l25 4"/></g>
<ellipse cx="66" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".5"/><ellipse cx="134" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".5"/>
${acc.front}
</svg>`;
}

/** Tekir — the studio's Istanbul tabby in a red fez, the player's guide. */
export function tekirSVG(size = 120, mood: 'idle' | 'happy' = 'idle'): string {
  const fur = uid('tf');
  const fez = uid('tz');
  const eyes =
    mood === 'happy'
      ? `<path d="M70 98q8-9 16 0M114 98q8-9 16 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>`
      : `<g class="cat-eyes"><ellipse cx="78" cy="98" rx="11" ry="12.5" fill="#c6f05a"/><ellipse cx="122" cy="98" rx="11" ry="12.5" fill="#c6f05a"/><ellipse cx="78" cy="99" rx="4.5" ry="10" fill="#1f1610"/><ellipse cx="122" cy="99" rx="4.5" ry="10" fill="#1f1610"/><circle cx="81.5" cy="93" r="3.4" fill="#fff"/><circle cx="125.5" cy="93" r="3.4" fill="#fff"/></g>`;
  return `<svg class="tekir" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Tekir">
<defs><radialGradient id="${fur}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#c9bcb1"/><stop offset=".65" stop-color="#9c8f84"/><stop offset="1" stop-color="#7d7067"/></radialGradient><linearGradient id="${fez}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset="1" stop-color="#b3122a"/></linearGradient></defs>
<g class="tekir-tail"><path d="M150 160q40-10 30-50q-5-18 8-22" fill="none" stroke="#8a7d73" stroke-width="15" stroke-linecap="round"/><path d="M178 104q-3-10 9-15" fill="none" stroke="#5c514a" stroke-width="15" stroke-linecap="round"/></g>
<ellipse cx="100" cy="170" rx="52" ry="28" fill="#8f8278"/>
<path d="M44 70L52 22l36 30zM156 70l-8-48-36 30z" fill="#8f8278" stroke="#6b5f57" stroke-width="2"/>
<path d="M54 60l4-28 20 18zM146 60l-4-28-20 18z" fill="#ffb7c5"/>
<ellipse cx="100" cy="98" rx="62" ry="54" fill="url(#${fur})"/>
<path d="M86 52q4 14 0 26M100 48v30M114 52q-4 14 0 26" stroke="#5c514a" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M40 92q12 2 18 8M40 108q12-2 18-4M160 92q-12 2-18 8M160 108q-12-2-18-4" stroke="#5c514a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<ellipse cx="100" cy="122" rx="30" ry="20" fill="#e9e1d8"/>
${eyes}
<path d="M93 110h14l-7 7z" fill="#ff8fa3"/>
<path d="M100 116v5M100 121q-6 7-12 2M100 121q6 7 12 2" fill="none" stroke="#2b1d14" stroke-width="3.5" stroke-linecap="round"/>
<g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M70 118l-26-4M70 124l-25 4M130 118l26-4M130 124l25 4"/></g>
<ellipse cx="66" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".55"/><ellipse cx="134" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".55"/>
<g transform="rotate(-12 100 40)"><path d="M78 52l6-30h32l6 30z" fill="url(#${fez})"/><ellipse cx="100" cy="52" rx="22" ry="5" fill="#8f0f22"/><ellipse cx="100" cy="22" rx="16" ry="3.5" fill="#d61f38"/><path d="M100 22q15 1 17 19" fill="none" stroke="#1f1610" stroke-width="2.4" stroke-linecap="round"/><path d="M117 40q-5 8-3 16q4 2 7 0q2-8-4-16z" fill="#2b1d14"/><circle cx="117" cy="40" r="2.2" fill="#2b1d14"/></g>
<g transform="translate(64 138)"><path fill-rule="evenodd" d="M36 2a34 22 0 110 44 34 22 0 010-44zm0 13a12 8 0 100 16 12 8 0 000-16z" fill="#d9873a" stroke="#8a4510" stroke-width="2"/><g fill="#fff4d6"><circle cx="12" cy="16" r="1.4"/><circle cx="22" cy="8" r="1.4"/><circle cx="36" cy="5" r="1.4"/><circle cx="50" cy="8" r="1.4"/><circle cx="60" cy="16" r="1.4"/><circle cx="60" cy="32" r="1.4"/><circle cx="48" cy="40" r="1.4"/><circle cx="24" cy="40" r="1.4"/><circle cx="12" cy="31" r="1.4"/></g></g>
<ellipse cx="66" cy="164" rx="13" ry="10" fill="#b9aca1"/><ellipse cx="134" cy="164" rx="13" ry="10" fill="#b9aca1"/>
</svg>`;
}

// ───────────── seagull & ferry ─────────────

export function seagullSVG(size = 56, golden = false): string {
  const body = golden ? '#ffd23f' : '#ffffff';
  const wing = golden ? '#e0a100' : '#b8c4d0';
  return `<svg class="gull" width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
<g class="gull-wing gull-wing-back"><path d="M48 34Q30 6 4 10q20 6 30 28z" fill="${wing}"/></g>
<path d="M22 40q20-12 46-6 12 3 18 0 6 0 8 4-6 6-16 6-20 10-56-4z" fill="${body}" stroke="#8a97a6" stroke-width="1.6"/>
<path d="M86 38l12 2-10 4z" fill="#ffb703"/><circle cx="84" cy="36" r="1.8" fill="#1d2b3a"/>
<path d="M22 40l-14-6 6 10z" fill="${wing}"/>
<g class="gull-wing gull-wing-front"><path d="M50 36Q62 4 92 2q-20 8-28 34z" fill="${wing}" stroke="#8a97a6" stroke-width="1.2"/><path d="M84 3l8-1-4 5z" fill="#2b2d42"/></g>
<g transform="translate(46 42)"><path fill-rule="evenodd" d="M10 0a10 7 0 110 14 10 7 0 010-14zm0 4a4 3 0 100 6 4 3 0 000-6z" fill="#d9873a" stroke="#8a4510" stroke-width="1.2"/></g>
</svg>`;
}

export function ferrySVG(width = 150): string {
  return `<svg class="ferry" width="${width}" height="${width * 0.5}" viewBox="0 0 160 80" aria-hidden="true">
<path d="M8 50h144l-12 18H22z" fill="#1d3557"/><path d="M8 50h144l-2 4H10z" fill="#e63946"/>
<rect x="24" y="34" width="112" height="16" rx="3" fill="#f8f9fa"/><rect x="40" y="22" width="76" height="13" rx="3" fill="#ffffff"/>
<g fill="#457b9d">${Array.from({ length: 12 }, (_, k) => `<rect x="${28 + k * 9}" y="38" width="5" height="6" rx="1"/>`).join('')}${Array.from({ length: 8 }, (_, k) => `<rect x="${45 + k * 9}" y="25" width="5" height="5" rx="1"/>`).join('')}</g>
<rect x="72" y="6" width="12" height="17" rx="2" fill="#f4d35e"/><rect x="72" y="6" width="12" height="5" fill="#1d1d1d"/>
<path d="M78 4q6-6 14-2" stroke="#d6d6d6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
<path d="M136 34l12-12M136 22h12" stroke="#1d3557" stroke-width="2"/><path d="M148 22l8 4-8 4z" fill="#e63946"/>
</svg>`;
}
