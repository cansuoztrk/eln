/**
 * Hand-authored vector art for Bookcat: UI icons (filled, chunky, readable on
 * wood), coin and star, the bookshop Tekir and the rare-book covers.
 */
let gid = 0;
const uid = (p: string) => `${p}${++gid}`;

const svg = (body: string, vb = '0 0 24 24') => `<svg viewBox="${vb}" width="100%" height="100%" aria-hidden="true">${body}</svg>`;

export function coinIcon(size = 26): string {
  const g = uid('cg');
  return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><defs><radialGradient id="${g}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff2b8"/><stop offset=".55" stop-color="#f0c04f"/><stop offset="1" stop-color="#b17d16"/></radialGradient></defs><circle cx="16" cy="16" r="14" fill="url(#${g})" stroke="#8a5a12" stroke-width="2"/><circle cx="16" cy="16" r="9.5" fill="none" stroke="#a87a24" stroke-width="1.6" opacity=".7"/><path d="M11 10h5v12h-5zM17 10h4l-1 12h-3z" fill="#a8711a" opacity=".85"/></svg>`;
}

export function starIcon(size = 26, on = true): string {
  return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><path d="M16 2.5l4.1 8.6 9.4 1.2-6.9 6.5 1.8 9.3L16 23.5l-8.4 4.6 1.8-9.3-6.9-6.5 9.4-1.2z" fill="${on ? '#f6c945' : '#5a3a22'}" stroke="${on ? '#a8711a' : '#3a2414'}" stroke-width="2" stroke-linejoin="round"/>${on ? '<path d="M11 11l3-1" stroke="#fff6" stroke-width="2" stroke-linecap="round"/>' : ''}</svg>`;
}

export const ICONS = {
  close: svg('<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'),
  home: svg('<path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>'),
  undo: svg('<path d="M9 5L4 10l5 5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 10H14a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
  hint: svg('<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.4.8 1 .8 1.7V17h6v-1c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 2.5z" fill="#f6d36b" stroke="#8a5a12" stroke-width="1.4"/><rect x="9" y="18" width="6" height="2.4" rx="1" fill="#c9b28a"/><rect x="10" y="20.8" width="4" height="1.8" rx=".9" fill="#a8916b"/><path d="M10 7.5a3 3 0 0 1 2-1.2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none"/>'),
  paw: svg('<g fill="#f2c9a6" stroke="#8a5a33" stroke-width="1.2"><ellipse cx="12" cy="16" rx="5.2" ry="4.4"/><ellipse cx="5.6" cy="10.2" rx="2.3" ry="2.9"/><ellipse cx="9.6" cy="6" rx="2.3" ry="2.9"/><ellipse cx="14.4" cy="6" rx="2.3" ry="2.9"/><ellipse cx="18.4" cy="10.2" rx="2.3" ry="2.9"/></g><g fill="#e98fa0"><ellipse cx="12" cy="16.6" rx="2.6" ry="2"/></g>'),
  moves: svg('<circle cx="12" cy="12" r="9.5" fill="#6cc06c" stroke="#1f4f29" stroke-width="1.6"/><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'),
  settings: svg('<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 5.2-1.7-.2a6.9 6.9 0 0 1-.6 1.5l1 1.4-2 2-1.4-1a6.9 6.9 0 0 1-1.5.6l-.2 1.7h-2.9l-.2-1.7a6.9 6.9 0 0 1-1.5-.6l-1.4 1-2-2 1-1.4a6.9 6.9 0 0 1-.6-1.5l-1.7-.2v-2.9l1.7-.2c.1-.5.3-1 .6-1.5l-1-1.4 2-2 1.4 1c.5-.3 1-.5 1.5-.6l.2-1.7h2.9l.2 1.7c.5.1 1 .3 1.5.6l1.4-1 2 2-1 1.4c.3.5.5 1 .6 1.5l1.7.2z" fill="currentColor"/>'),
  play: svg('<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" fill="currentColor"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="3" fill="#fbf3e1" stroke="#8a5a33" stroke-width="1.6"/><rect x="3" y="5" width="18" height="5" rx="2" fill="#c4483b"/><path d="M8 3v4M16 3v4" stroke="#8a5a33" stroke-width="2" stroke-linecap="round"/><text x="12" y="18.5" font-size="8" font-weight="900" text-anchor="middle" fill="#3a2a1d" font-family="Nunito,sans-serif">31</text>'),
  books: svg('<rect x="3" y="5" width="4" height="15" rx="1" fill="#8a2f2a"/><rect x="7.5" y="3.5" width="4" height="16.5" rx="1" fill="#2f6150"/><rect x="12" y="6" width="3.5" height="14" rx="1" fill="#b0801f"/><rect x="16.2" y="4.5" width="4" height="15.5" rx="1" fill="#2b4a7a" transform="rotate(10 18 12)"/><rect x="2" y="20" width="20" height="2" rx="1" fill="#6b4528"/>'),
  shop: svg('<path d="M4 9h16l-1.2 11a1.5 1.5 0 0 1-1.5 1.3H6.7A1.5 1.5 0 0 1 5.2 20z" fill="#e7bd5b" stroke="#8a5a12" stroke-width="1.4"/><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="#8a5a12" stroke-width="1.8"/>'),
  gift: svg('<rect x="3.5" y="9" width="17" height="12" rx="1.5" fill="#c4483b"/><rect x="2.5" y="7" width="19" height="4" rx="1" fill="#e2645a"/><path d="M12 7v14" stroke="#f6d36b" stroke-width="2.6"/><path d="M12 7c-2-3-5.5-3.5-5.5-1.5S10 7 12 7zm0 0c2-3 5.5-3.5 5.5-1.5S14 7 12 7z" fill="#f6d36b"/>'),
  share: svg('<circle cx="18" cy="5.5" r="2.8" fill="currentColor"/><circle cx="6" cy="12" r="2.8" fill="currentColor"/><circle cx="18" cy="18.5" r="2.8" fill="currentColor"/><path d="M8.5 10.7l7-3.9M8.5 13.3l7 3.9" stroke="currentColor" stroke-width="2"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10.5" rx="2.4" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  video: svg('<rect x="2.5" y="6" width="14" height="12" rx="2.5" fill="currentColor"/><path d="M17 10.5l4.5-2.6v8.2L17 13.5z" fill="currentColor"/>'),
  sound: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  music: svg('<path d="M9 17.5V6l11-2.5v11.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="2.8" fill="currentColor"/><circle cx="17.5" cy="15" r="2.8" fill="currentColor"/>'),
  vibrate: svg('<rect x="7.5" y="3" width="9" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 8v8M20.5 8v8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  bell: svg('<path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10z" fill="currentColor"/><path d="M10 19.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2"/>'),
  globe: svg('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" fill="none" stroke="currentColor" stroke-width="2"/>'),
  text: svg('<path d="M4 18L9 5h1.5l5 13M6 13.5h7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M16 18l2.5-6.5h1L22 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  flame: svg('<path d="M12 21.5c-4 0-6.5-2.6-6.5-6.2 0-3.4 2.7-5.6 3.9-8.8.6 1.8 1.7 2.9 2.6 3.4.3-2.6 1.6-5 3.4-6.4-.2 3.4 3.1 5.7 3.1 10 0 4.6-2.8 8-6.5 8z" fill="#ff8a3d" stroke="#b5491a" stroke-width="1.2"/><path d="M12 20c-1.7 0-2.8-1.2-2.8-2.8 0-1.6 1.3-2.4 1.9-3.9.9 1.4 3.7 2.2 3.7 4.4 0 1.4-1.1 2.3-2.8 2.3z" fill="#ffd45e"/>'),
  trophy: svg('<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="#f6c945" stroke="#a8711a" stroke-width="1.4"/><path d="M7 5H4v1.6A3.4 3.4 0 0 0 7.4 10M17 5h3v1.6A3.4 3.4 0 0 1 16.6 10" fill="none" stroke="#a8711a" stroke-width="1.6"/><path d="M12 13.5v3.5M8.5 21h7l-.7-4h-5.6z" fill="#c9952f" stroke="#a8711a" stroke-width="1.2"/>'),
  restart: svg('<path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M19 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  doc: svg('<path d="M6.5 3h7.5l4.5 4.5V21h-12z" fill="#fbf3e1" stroke="#8a5a33" stroke-width="1.6"/><path d="M14 3v4.5h4.5M9 12h6M9 15.5h6" stroke="#8a5a33" stroke-width="1.6" fill="none"/>'),
  shield: svg('<path d="M12 3l7 2.6v5.6c0 4.4-3 7.9-7 9.3-4-1.4-7-4.9-7-9.3V5.6z" fill="currentColor"/>'),
  noads: svg('<circle cx="12" cy="12" r="9" fill="#fbf3e1" stroke="#c4483b" stroke-width="2.4"/><text x="12" y="15.5" font-size="8.5" font-weight="900" text-anchor="middle" fill="#3a2a1d" font-family="Nunito,sans-serif">AD</text><path d="M5.6 5.6l12.8 12.8" stroke="#c4483b" stroke-width="2.4"/>'),
};

/** Tekir behind the counter of the bookshop: round glasses, a cardigan scarf, a book in paw. */
export function tekirSVG(size = 120, mood: 'idle' | 'happy' | 'read' = 'idle'): string {
  const fur = uid('tf');
  const eyes =
    mood === 'happy'
      ? '<path d="M68 98q10-10 20 0M112 98q10-10 20 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>'
      : mood === 'read'
        ? '<path d="M68 101q10 5 20 0M112 101q10 5 20 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>'
        : '<ellipse cx="78" cy="98" rx="10" ry="11.5" fill="#c6f05a"/><ellipse cx="122" cy="98" rx="10" ry="11.5" fill="#c6f05a"/><ellipse cx="78" cy="99" rx="4.2" ry="9" fill="#1f1610"/><ellipse cx="122" cy="99" rx="4.2" ry="9" fill="#1f1610"/><circle cx="81" cy="93.5" r="3" fill="#fff"/><circle cx="125" cy="93.5" r="3" fill="#fff"/>';
  return `<svg class="tekir" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Tekir">
<defs><radialGradient id="${fur}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#cdbfb3"/><stop offset=".65" stop-color="#9f9186"/><stop offset="1" stop-color="#807268"/></radialGradient></defs>
<g class="tekir-tail"><path d="M150 162q42-8 32-50q-5-18 8-22" fill="none" stroke="#8a7d73" stroke-width="15" stroke-linecap="round"/><path d="M178 106q-3-10 9-15" fill="none" stroke="#5c514a" stroke-width="15" stroke-linecap="round"/></g>
<ellipse cx="100" cy="172" rx="54" ry="28" fill="#8f8278"/>
<path d="M58 150q42 22 84 0l4 34H54z" fill="#2f6150"/><path d="M84 154l16 14 16-14" fill="none" stroke="#e7bd5b" stroke-width="3"/>
<path d="M44 70L52 22l36 30zM156 70l-8-48-36 30z" fill="#8f8278" stroke="#6b5f57" stroke-width="2"/>
<path d="M54 60l4-28 20 18zM146 60l-4-28-20 18z" fill="#ffb7c5"/>
<ellipse cx="100" cy="98" rx="62" ry="54" fill="url(#${fur})"/>
<path d="M86 52q4 14 0 26M100 48v30M114 52q-4 14 0 26" stroke="#5c514a" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M40 92q12 2 18 8M40 108q12-2 18-4M160 92q-12 2-18 8M160 108q-12-2-18-4" stroke="#5c514a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<ellipse cx="100" cy="122" rx="30" ry="20" fill="#ebe3da"/>
${eyes}
<g fill="none" stroke="#a87a24" stroke-width="3.2"><circle cx="78" cy="98" r="15"/><circle cx="122" cy="98" r="15"/><path d="M93 96q7-4 14 0M63 94l-14-6M137 94l14-6"/></g>
<path d="M93 112h14l-7 7z" fill="#ff8fa3"/>
<path d="M100 118v5M100 123q-6 7-12 2M100 123q6 7 12 2" fill="none" stroke="#2b1d14" stroke-width="3.5" stroke-linecap="round"/>
<g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M70 120l-26-4M70 126l-25 4M130 120l26-4M130 126l25 4"/></g>
<g transform="translate(70 140) rotate(-8)"><rect x="0" y="0" width="60" height="40" rx="4" fill="#8a2f2a"/><rect x="28" y="0" width="4" height="40" fill="#5e1f1b"/><path d="M4 6h20M36 6h20" stroke="#e7bd5b" stroke-width="2.4"/><rect x="2" y="2" width="56" height="36" rx="3" fill="none" stroke="#e7bd5b" stroke-width="1.6" opacity=".7"/></g>
<ellipse cx="66" cy="168" rx="13" ry="10" fill="#b9aca1"/><ellipse cx="134" cy="168" rx="13" ry="10" fill="#b9aca1"/>
</svg>`;
}

/** A rare-book cover for the collection shelf. */
export function bookCover(color: string, title: string, size = 80, locked = false): string {
  return `<svg viewBox="0 0 80 110" width="${size}" height="${(size * 110) / 80}" aria-hidden="true">
<rect x="6" y="4" width="70" height="102" rx="5" fill="${locked ? '#4a3220' : color}"/>
<rect x="6" y="4" width="10" height="102" rx="3" fill="#0003"/>
<rect x="12" y="10" width="58" height="90" rx="3" fill="none" stroke="#e7bd5b" stroke-width="1.6" opacity="${locked ? 0.3 : 0.85}"/>
${locked ? '<text x="41" y="62" font-size="26" text-anchor="middle" fill="#e7bd5b66" font-family="Baloo 2,sans-serif" font-weight="800">?</text>' : `<g fill="#e7bd5b"><circle cx="41" cy="40" r="10" opacity=".9"/><ellipse cx="41" cy="44" rx="5" ry="4" fill="${color}"/></g><text x="41" y="74" font-size="8" text-anchor="middle" fill="#f6dc95" font-family="Nunito,sans-serif" font-weight="900">${title.length > 16 ? title.slice(0, 15) + '…' : title}</text>`}
</svg>`;
}
