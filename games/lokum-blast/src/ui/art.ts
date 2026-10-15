/**
 * Hand-authored SVG art: icons, the Tekir mascot and the logo.
 * All vector, so it is razor sharp on every screen and costs a few KB.
 */
let gid = 0;
const uid = (p: string) => `${p}${++gid}`;

export function coinIcon(size = 24): string {
  const g = uid('cg');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".55" stop-color="#ffc531"/><stop offset="1" stop-color="#e08a00"/></linearGradient></defs><circle cx="12" cy="12" r="10.5" fill="#b86b00"/><circle cx="12" cy="11.2" r="10" fill="url(#${g})"/><circle cx="12" cy="11.2" r="7" fill="none" stroke="#c87800" stroke-width="1.4" opacity=".7"/><path d="M12 6.6l1.4 2.9 3.2.4-2.3 2.2.6 3.2-2.9-1.6-2.9 1.6.6-3.2-2.3-2.2 3.2-.4z" fill="#fff6c7" stroke="#d98a00" stroke-width=".6"/></svg>`;
}

export function heartIcon(size = 24): string {
  const g = uid('hg');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fa8"/><stop offset="1" stop-color="#e0213f"/></linearGradient></defs><path d="M12 21.3s-8.6-5.3-9.9-10.6C1.2 6.9 3.6 3.6 7 3.6c2.1 0 3.6 1.1 5 3 1.4-1.9 2.9-3 5-3 3.4 0 5.8 3.3 4.9 7.1-1.3 5.3-9.9 10.6-9.9 10.6z" fill="url(#${g})" stroke="#9b0d26" stroke-width="1"/><ellipse cx="7.6" cy="8" rx="2.2" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-30 7.6 8)"/></svg>`;
}

export function starIcon(size = 24, filled = true): string {
  const g = uid('sg');
  const fill = filled ? `url(#${g})` : '#3a2d6b';
  const stroke = filled ? '#c56a00' : '#2a2050';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#ffab00"/></linearGradient></defs><path d="M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L1.9 9.2l7-1z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>${filled ? '<ellipse cx="9" cy="8.5" rx="2" ry="1" fill="#fff" opacity=".6" transform="rotate(-25 9 8.5)"/>' : ''}</svg>`;
}

export const ICONS = {
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1l-.4-2.7h-4l-.4 2.7a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.7h4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 001.5.9l10-6.5a1 1 0 000-1.7l-10-6.5A1 1 0 008 5.5z" fill="currentColor"/></svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="currentColor"/><path d="M16.5 10.5l5-3v9l-5-3z" fill="currentColor"/></svg>`,
  shop: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 11h20l-1.6 15.2A2 2 0 0122.4 28H9.6a2 2 0 01-2-1.8z" fill="#ff6fa5"/><path d="M6 11h20l-.4 4H6.4z" fill="#ff8fbb"/><path d="M11 13V9a5 5 0 0110 0v4" fill="none" stroke="#ffd447" stroke-width="2.6" stroke-linecap="round"/><circle cx="11" cy="13.5" r="1.6" fill="#ffd447"/><circle cx="21" cy="13.5" r="1.6" fill="#ffd447"/></svg>`,
  bazaar: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="14" width="20" height="13" rx="1.5" fill="#f3d9b1"/><path d="M4 9h24l-1.5 6H5.5z" fill="#ef3e5b"/><path d="M8 9l-1 6M12 9v6M16 9v6M20 9v6M24 9l1 6" stroke="#fff" stroke-width="2"/><path d="M5.5 15a2.1 2.1 0 004.2 0 2.1 2.1 0 004.2 0 2.1 2.1 0 004.2 0 2.1 2.1 0 004.2 0 2.1 2.1 0 004.2 0" fill="#ef3e5b"/><rect x="13" y="19" width="6" height="8" rx="1" fill="#a8692f"/><path d="M16 3l2 4h-4z" fill="#ffd447"/></svg>`,
  quests: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="5" width="18" height="23" rx="3" fill="#fef3c7"/><rect x="7" y="5" width="18" height="5" rx="2.5" fill="#f59e0b"/><path d="M11 15l2 2 3.5-3.5M11 22l2 2 3.5-3.5" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 16h3M19 23h3" stroke="#a16207" stroke-width="2" stroke-linecap="round"/></svg>`,
  home: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="22" height="22" rx="6" fill="#8fd14f"/><rect x="5" y="5" width="22" height="11" rx="6" fill="#b4e47c"/><path d="M13 10.5v11a1 1 0 001.5.8l8.5-5.5a1 1 0 000-1.6L14.5 9.7a1 1 0 00-1.5.8z" fill="#fff"/></svg>`,
  wheel: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#ffd447"/><path d="M16 16L16 3a13 13 0 019.2 3.8z" fill="#ff6fa5"/><path d="M16 16l13 0a13 13 0 01-3.8 9.2z" fill="#3fd6c8"/><path d="M16 16v13a13 13 0 01-9.2-3.8z" fill="#a77bff"/><path d="M16 16H3a13 13 0 013.8-9.2z" fill="#8fd14f"/><circle cx="16" cy="16" r="13" fill="none" stroke="#c56a00" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="#fff" stroke="#c56a00" stroke-width="1.5"/></svg>`,
  gift: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="13" width="22" height="15" rx="2" fill="#ef3e5b"/><rect x="3.5" y="9" width="25" height="6" rx="2" fill="#ff6fa5"/><rect x="14" y="9" width="4" height="19" fill="#ffd447"/><path d="M16 9c-3-6-9-5-8-1.5S16 9 16 9zM16 9c3-6 9-5 8-1.5S16 9 16 9z" fill="#ffd447" stroke="#c56a00" stroke-width="1"/></svg>`,
  crown: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 11l6 5 6-9 6 9 6-5-2.5 14h-19z" fill="#ffc531" stroke="#c56a00" stroke-width="1.4" stroke-linejoin="round"/><rect x="6.5" y="24" width="19" height="3.5" rx="1" fill="#e08a00"/><circle cx="16" cy="18" r="2" fill="#ef3e5b"/><circle cx="10.5" cy="20" r="1.4" fill="#3fd6c8"/><circle cx="21.5" cy="20" r="1.4" fill="#3fd6c8"/></svg>`,
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
  eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>`,
  ticket: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 9a2 2 0 012-2h20a2 2 0 012 2v3a3 3 0 000 6v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a3 3 0 000-6z" fill="#ffc531" stroke="#c56a00" stroke-width="1.5"/><path d="M20 8v16" stroke="#c56a00" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M11.5 11.5l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#fff6c7"/></svg>`,
  infinity: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8a4 4 0 100 8c3 0 7-8 10-8a4 4 0 110 8c-3 0-7-8-10-8z" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>`,
};

export const BOOSTER_ART: Record<string, string> = {
  undo: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#7c5cff"/><circle cx="24" cy="21" r="18" fill="#9b82ff"/><path d="M16 22a10 10 0 1110 10" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M9.5 21.5l6.5-7 6 7.5z" fill="#fff"/></svg>`,
  hammer: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#ff8a3d"/><circle cx="24" cy="21" r="18" fill="#ffa766"/><rect x="21.5" y="18" width="5" height="22" rx="2.2" fill="#8a5228" transform="rotate(35 24 29)"/><rect x="11" y="9" width="22" height="11" rx="3" fill="#cfd8e3" transform="rotate(35 22 14.5)"/><rect x="11" y="9" width="22" height="4" rx="2" fill="#f3f6fa" transform="rotate(35 22 14.5)"/></svg>`,
  refresh: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#16b39c"/><circle cx="24" cy="21" r="18" fill="#3fd6c8"/><path d="M14 22a10 10 0 0117-7M34 22a10 10 0 01-17 7" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M32 8l-.5 8.5-8-1.5zM16 36l.5-8.5 8 1.5z" fill="#fff"/></svg>`,
  bomb: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#b3123b"/><circle cx="24" cy="21" r="18" fill="#e23a5c"/><circle cx="24" cy="27" r="11" fill="#c8102e"/><circle cx="24" cy="27" r="11" fill="none" stroke="#7a0a1d" stroke-width="1.5"/><path d="M19 16l2-4 3 3 3-3 2 4z" fill="#7a0a1d"/><circle cx="20" cy="23.5" r="2.6" fill="#fff" opacity=".45"/><circle cx="22" cy="29" r="1.5" fill="#ff8fa8"/><circle cx="26.5" cy="31" r="1.5" fill="#ff8fa8"/><circle cx="27" cy="26" r="1.5" fill="#ff8fa8"/><path d="M29 12q3-3 5 0" fill="none" stroke="#ffd447" stroke-width="2"/><circle cx="35" cy="11" r="2.4" fill="#ffd447"/></svg>`,
};

/**
 * Tekir — an Istanbul tabby in a little red fez. The studio mascot.
 * `mood`: idle (blinks), happy (closed smiling eyes), sad.
 */
export function tekirSVG(size = 160, mood: 'idle' | 'happy' | 'sad' = 'idle', withLokum = true): string {
  const fur = uid('fur');
  const fez = uid('fez');
  const lk = uid('lk');
  const eyes =
    mood === 'happy'
      ? `<path d="M70 98q8-9 16 0M114 98q8-9 16 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>`
      : `<g class="tekir-eyes"><ellipse cx="78" cy="98" rx="11" ry="12.5" fill="#c6f05a"/><ellipse cx="122" cy="98" rx="11" ry="12.5" fill="#c6f05a"/><ellipse cx="78" cy="99" rx="4.5" ry="10" fill="#1f1610"/><ellipse cx="122" cy="99" rx="4.5" ry="10" fill="#1f1610"/><circle cx="81.5" cy="93" r="3.4" fill="#fff"/><circle cx="125.5" cy="93" r="3.4" fill="#fff"/>${mood === 'sad' ? '<path d="M62 90l26-9M138 90l-26-9" stroke="#2b1d14" stroke-width="4" stroke-linecap="round"/>' : ''}</g>`;
  const mouth = mood === 'sad' ? `<path d="M90 126q10-8 20 0" fill="none" stroke="#2b1d14" stroke-width="3.5" stroke-linecap="round"/>` : `<path d="M100 116v5M100 121q-6 7-12 2M100 121q6 7 12 2" fill="none" stroke="#2b1d14" stroke-width="3.5" stroke-linecap="round"/>`;
  const lokum = withLokum
    ? `<g transform="translate(70 142)"><rect x="0" y="6" width="60" height="44" rx="12" fill="#c43c72"/><rect x="0" y="0" width="60" height="44" rx="12" fill="url(#${lk})"/><path d="M8 8h44" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55"/><g fill="#fff" opacity=".85"><circle cx="12" cy="18" r="2"/><circle cx="24" cy="12" r="1.6"/><circle cx="38" cy="16" r="2.2"/><circle cx="50" cy="22" r="1.8"/><circle cx="18" cy="30" r="1.4"/><circle cx="44" cy="32" r="1.6"/><circle cx="30" cy="24" r="1.3"/></g></g><ellipse cx="66" cy="160" rx="13" ry="10" fill="#b9aca1"/><ellipse cx="134" cy="160" rx="13" ry="10" fill="#b9aca1"/><path d="M60 158h4M68 158h4M128 158h4M136 158h4" stroke="#6d6058" stroke-width="2" stroke-linecap="round"/>`
    : '';
  return `<svg class="tekir tekir-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Tekir">
<defs>
<radialGradient id="${fur}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#c9bcb1"/><stop offset=".65" stop-color="#9c8f84"/><stop offset="1" stop-color="#7d7067"/></radialGradient>
<linearGradient id="${fez}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset="1" stop-color="#b3122a"/></linearGradient>
<linearGradient id="${lk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3d1"/><stop offset="1" stop-color="#ff5e9c"/></linearGradient>
</defs>
<g class="tekir-tail"><path d="M150 160q40-10 30-50q-5-18 8-22" fill="none" stroke="#8a7d73" stroke-width="15" stroke-linecap="round"/><path d="M178 104q-3-10 9-15" fill="none" stroke="#5c514a" stroke-width="15" stroke-linecap="round"/></g>
<ellipse cx="100" cy="168" rx="52" ry="28" fill="#8f8278"/>
<path d="M44 70L52 22l36 30zM156 70l-8-48-36 30z" fill="#8f8278" stroke="#6b5f57" stroke-width="2"/>
<path d="M54 60l4-28 20 18zM146 60l-4-28-20 18z" fill="#ffb7c5"/>
<ellipse cx="100" cy="98" rx="62" ry="54" fill="url(#${fur})"/>
<path d="M86 52q4 14 0 26M100 48v30M114 52q-4 14 0 26" stroke="#5c514a" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M40 92q12 2 18 8M40 108q12-2 18-4M160 92q-12 2-18 8M160 108q-12-2-18-4" stroke="#5c514a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<ellipse cx="100" cy="122" rx="30" ry="20" fill="#e9e1d8"/>
${eyes}
<path d="M93 110h14l-7 7z" fill="#ff8fa3"/>
${mouth}
<g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M70 118l-26-4M70 124l-25 4M130 118l26-4M130 124l25 4"/></g>
<ellipse cx="66" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".55"/><ellipse cx="134" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".55"/>
<g transform="rotate(-12 100 40)"><path d="M78 52l6-30h32l6 30z" fill="url(#${fez})"/><ellipse cx="100" cy="52" rx="22" ry="5" fill="#8f0f22"/><ellipse cx="100" cy="22" rx="16" ry="3.5" fill="#d61f38"/><path d="M100 22q15 1 17 19" fill="none" stroke="#1f1610" stroke-width="2.4" stroke-linecap="round"/><path d="M117 40q-5 8-3 16q4 2 7 0q2-8-4-16z" fill="#2b1d14"/><circle cx="117" cy="40" r="2.2" fill="#2b1d14"/></g>
${lokum}
</svg>`;
}

/** Game logo: chunky lokum-letters wordmark. */
export function logoSVG(width = 300): string {
  const g1 = uid('lg');
  const g2 = uid('lg');
  return `<svg class="logo" width="${width}" viewBox="0 0 300 130" role="img" aria-label="Lokum Blast">
<defs>
<linearGradient id="${g1}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3f0"/><stop offset=".5" stop-color="#ff7fb2"/><stop offset="1" stop-color="#e2306f"/></linearGradient>
<linearGradient id="${g2}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8c7"/><stop offset=".55" stop-color="#ffc531"/><stop offset="1" stop-color="#ff8a00"/></linearGradient>
</defs>
<g font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" text-anchor="middle">
<text x="150" y="62" font-size="64" fill="#2b0d3d" stroke="#2b0d3d" stroke-width="14" stroke-linejoin="round">LOKUM</text>
<text x="150" y="62" font-size="64" fill="url(#${g1})">LOKUM</text>
<text x="150" y="118" font-size="56" fill="#2b0d3d" stroke="#2b0d3d" stroke-width="14" stroke-linejoin="round">BLAST</text>
<text x="150" y="118" font-size="56" fill="url(#${g2})">BLAST</text>
</g>
<g fill="#fff" opacity=".9"><circle cx="70" cy="22" r="2.4"/><circle cx="118" cy="18" r="1.8"/><circle cx="182" cy="20" r="2.2"/><circle cx="228" cy="24" r="1.6"/></g>
</svg>`;
}

/** Studio logo for splash / credits. */
export function studioLogoSVG(width = 180): string {
  return `<svg width="${width}" viewBox="0 0 360 80" role="img" aria-label="Tekir Studios"><g transform="translate(4 4) scale(.36)">${tekirSVG(200, 'happy', false).replace(/<\/?svg[^>]*>/g, '')}</g><text x="88" y="52" font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" font-size="40" fill="#fff">Tekir <tspan fill="#ffc531">Studios</tspan></text></svg>`;
}
