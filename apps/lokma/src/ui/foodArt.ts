/** Street-food illustrations shared with Simit Tycoon (Tekir Studios house style). */
let gid = 0;
const uid = (p: string) => `${p}${++gid}`;

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

export function foodArt(id: string, size = 64): string {
  return `<svg class="food food-${id}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${FOOD_ART[id]?.() ?? ''}</svg>`;
}

export function hasFoodArt(id: string): boolean {
  return id in FOOD_ART;
}
