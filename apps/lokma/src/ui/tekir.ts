/**
 * Tekir, Lokma's coach: the Tekir Studios tabby in a kitchen apron. Moods are
 * always kind (never disappointed or shaming); outfits unlock with streaks.
 */
export type Mood = 'idle' | 'happy' | 'proud' | 'wink' | 'sleepy' | 'think';
export type Outfit = 'chef' | 'fez' | 'headband' | 'graduate' | 'crown' | 'flowers' | 'crescent' | 'none';
export type Holding = 'fork' | 'simit' | 'water' | 'tea' | 'none';

export interface TekirOptions {
  size?: number;
  mood?: Mood;
  outfit?: Outfit;
  holding?: Holding;
  className?: string;
}

let seq = 0;
const uid = (p: string) => `${p}${++seq}`;

const INK = '#2b1d14';

function eyes(mood: Mood): string {
  const open = (cx: number) =>
    `<ellipse cx="${cx}" cy="98" rx="11" ry="12.5" fill="#c6f05a"/><ellipse cx="${cx}" cy="99" rx="4.6" ry="10" fill="#1f1610"/><circle cx="${cx + 3.5}" cy="93" r="3.4" fill="#fff"/>`;
  const closed = (cx: number) => `<path d="M${cx - 9} 98q9-10 18 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  switch (mood) {
    case 'happy':
      return closed(78) + closed(122);
    case 'wink':
      return open(78) + closed(122);
    case 'sleepy':
      return `<path d="M68 99q10 6 20 0M112 99q10 6 20 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case 'proud':
      return [78, 122]
        .map((cx) => `<path d="M${cx} 86l3.4 7.4 8 .9-6 5.4 1.7 7.9-7.1-4-7.1 4 1.7-7.9-6-5.4 8-.9z" fill="#ffc531" stroke="#c88a00" stroke-width="1.6" stroke-linejoin="round"/>`)
        .join('');
    case 'think':
      return `<ellipse cx="78" cy="96" rx="10" ry="11" fill="#c6f05a"/><ellipse cx="81" cy="93" rx="4.2" ry="8.5" fill="#1f1610"/><ellipse cx="122" cy="96" rx="10" ry="11" fill="#c6f05a"/><ellipse cx="125" cy="93" rx="4.2" ry="8.5" fill="#1f1610"/><circle cx="84" cy="90" r="2.8" fill="#fff"/><circle cx="128" cy="90" r="2.8" fill="#fff"/>`;
    default:
      return open(78) + open(122);
  }
}

function mouth(mood: Mood): string {
  if (mood === 'happy' || mood === 'proud') {
    return `<path d="M100 116v4" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M88 121q12 14 24 0z" fill="#d94a5e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  if (mood === 'sleepy') return `<path d="M100 116v4M94 123q6 3 12 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (mood === 'think') return `<path d="M100 116v5M95 125q7-3 12 1" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  return `<path d="M100 116v5M100 121q-6 7-12 2M100 121q6 7 12 2" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
}

function outfitSVG(outfit: Outfit): string {
  switch (outfit) {
    case 'chef':
      return `<g transform="rotate(-8 100 40)"><path d="M70 54c-14-2-18-20-6-27 3-14 21-17 28-8 6-10 25-8 28 5 14 2 16 22 3 28z" fill="#fff" stroke="#d8cfc6" stroke-width="2.5"/><rect x="72" y="46" width="56" height="14" rx="4" fill="#fff" stroke="#d8cfc6" stroke-width="2.5"/><path d="M84 36v8M100 32v10M116 36v8" stroke="#e8e0d8" stroke-width="2.5" stroke-linecap="round"/></g>`;
    case 'fez':
      return `<g transform="rotate(-12 100 40)"><path d="M78 52l6-30h32l6 30z" fill="#d61f38"/><ellipse cx="100" cy="52" rx="22" ry="5" fill="#8f0f22"/><ellipse cx="100" cy="22" rx="16" ry="3.5" fill="#ff4a5c"/><path d="M100 22q15 1 17 19" fill="none" stroke="#1f1610" stroke-width="2.4" stroke-linecap="round"/><path d="M117 40q-5 8-3 16q4 2 7 0q2-8-4-16z" fill="${INK}"/></g>`;
    case 'headband':
      return `<path d="M42 72q58-26 116 0l-3 12q-55-22-110 0z" fill="#3f8f4a"/><path d="M48 76q52-20 104 0" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/><path d="M152 78l18-4-6 12 10 8-18 0z" fill="#3f8f4a"/>`;
    case 'graduate':
      return `<g transform="rotate(-6 100 40)"><path d="M100 18l52 18-52 18-52-18z" fill="#2b2d42"/><path d="M74 44v14q26 12 52 0V44l-26 10z" fill="#3d405b"/><path d="M146 38v24" stroke="#ffc531" stroke-width="3"/><circle cx="146" cy="64" r="5" fill="#ffc531"/></g>`;
    case 'crown':
      return `<g transform="rotate(-6 100 40)"><path d="M70 56l-6-32 20 16 16-24 16 24 20-16-6 32z" fill="#ffc531" stroke="#c88a00" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="44" r="5" fill="#e2434b"/><circle cx="80" cy="48" r="3.5" fill="#2f9fe0"/><circle cx="120" cy="48" r="3.5" fill="#3f8f4a"/></g>`;
    case 'flowers':
      return [56, 78, 100, 122, 144]
        .map((x, i) => {
          const y = 52 - Math.sin((i / 4) * Math.PI) * 12;
          const c = ['#ff4f8b', '#ffc531', '#e2434b', '#ffc531', '#ff4f8b'][i];
          return `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="5" ry="8" transform="rotate(${a}) translate(0 -7)" fill="${c}"/>`).join('')}<circle r="4" fill="#fff4d6"/></g>`;
        })
        .join('');
    case 'crescent':
      return `<g transform="translate(132 30) rotate(18)"><path d="M14 0a16 16 0 1 0 12 26A13 13 0 1 1 14 0z" fill="#ffc531" stroke="#c88a00" stroke-width="2"/><path d="M30 8l2 4.5 4.8.4-3.7 3 1.2 4.7-4.3-2.6-4.3 2.6 1.2-4.7-3.7-3 4.8-.4z" fill="#ffc531"/></g>`;
    default:
      return '';
  }
}

function holdingSVG(holding: Holding): string {
  switch (holding) {
    case 'fork':
      return `<g transform="translate(150 118) rotate(18)"><rect x="-3" y="0" width="6" height="44" rx="3" fill="#b8c0c8" stroke="#7d8790" stroke-width="1.5"/><path d="M-9-22v16a9 9 0 0 0 18 0v-16M0-22v18M-4.5-22v16M4.5-22v16" fill="none" stroke="#7d8790" stroke-width="3" stroke-linecap="round"/></g><ellipse cx="146" cy="160" rx="14" ry="10" fill="#b9aca1"/>`;
    case 'simit':
      return `<g transform="translate(64 138)"><path fill-rule="evenodd" d="M36 2a34 22 0 110 44 34 22 0 010-44zm0 13a12 8 0 100 16 12 8 0 000-16z" fill="#d9873a" stroke="#8a4510" stroke-width="2"/><g fill="#fff4d6"><circle cx="12" cy="16" r="1.4"/><circle cx="22" cy="8" r="1.4"/><circle cx="36" cy="5" r="1.4"/><circle cx="50" cy="8" r="1.4"/><circle cx="60" cy="16" r="1.4"/><circle cx="60" cy="32" r="1.4"/><circle cx="48" cy="40" r="1.4"/><circle cx="24" cy="40" r="1.4"/></g></g>`;
    case 'water':
      return `<g transform="translate(134 112)"><path d="M0 0h30l-4 52a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#d7efff" stroke="#7bbbe0" stroke-width="2.5"/><path d="M3 20h24l-3 34H6z" fill="#5fb6ee" opacity=".75"/><path d="M8 8v40" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g><ellipse cx="146" cy="164" rx="13" ry="10" fill="#b9aca1"/>`;
    case 'tea':
      return `<g transform="translate(136 116)"><path d="M2 0h24q-2 6-4 12 4 8 2 20-2 14-9 16h-2c-7-2-9-8-10-16-1-12 3-14 3-20-2-6-4-12-4-12z" fill="#fbe2d6" stroke="#c98a6b" stroke-width="2.2"/><path d="M5 18h18q1 10-1 16-2 10-8 11c-6-1-8-6-9-11-1-6 0-10 0-16z" fill="#b4502a"/><ellipse cx="14" cy="50" rx="18" ry="4" fill="#e8c9b8" stroke="#c98a6b" stroke-width="2"/></g><ellipse cx="148" cy="164" rx="13" ry="10" fill="#b9aca1"/>`;
    default:
      return '';
  }
}

export function tekirSVG(opts: TekirOptions = {}): string {
  const { size = 120, mood = 'idle', outfit = 'chef', holding = 'none', className = '' } = opts;
  const fur = uid('tkf');
  const apron = uid('tka');
  return `<svg class="tekir ${className}" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Tekir">
<defs><radialGradient id="${fur}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#cdbfb3"/><stop offset=".65" stop-color="#9f9186"/><stop offset="1" stop-color="#807268"/></radialGradient>
<linearGradient id="${apron}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0636a"/><stop offset="1" stop-color="#c92f38"/></linearGradient></defs>
<g class="tekir-tail"><path d="M148 162q42-8 32-50q-5-18 8-22" fill="none" stroke="#8a7d73" stroke-width="15" stroke-linecap="round"/><path d="M178 106q-3-10 9-15" fill="none" stroke="#5c514a" stroke-width="15" stroke-linecap="round"/></g>
<ellipse cx="100" cy="170" rx="52" ry="28" fill="#8f8278"/>
<path d="M66 150q34 16 68 0l6 40H60z" fill="url(#${apron})"/><path d="M74 158q26 10 52 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 5" opacity=".8"/>
<path d="M44 70L52 22l36 30zM156 70l-8-48-36 30z" fill="#8f8278" stroke="#6b5f57" stroke-width="2"/>
<path d="M54 60l4-28 20 18zM146 60l-4-28-20 18z" fill="#ffb7c5"/>
<ellipse cx="100" cy="98" rx="62" ry="54" fill="url(#${fur})"/>
<path d="M86 52q4 14 0 26M100 48v30M114 52q-4 14 0 26" stroke="#5c514a" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M40 92q12 2 18 8M40 108q12-2 18-4M160 92q-12 2-18 8M160 108q-12-2-18-4" stroke="#5c514a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<ellipse cx="100" cy="122" rx="30" ry="20" fill="#ebe3da"/>
${eyes(mood)}
<path d="M93 110h14l-7 7z" fill="#ff8fa3"/>
${mouth(mood)}
<g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M70 118l-26-4M70 124l-25 4M130 118l26-4M130 124l25 4"/></g>
<ellipse cx="66" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".55"/><ellipse cx="134" cy="118" rx="8" ry="5" fill="#ff9fb3" opacity=".55"/>
${outfitSVG(outfit)}
<ellipse cx="62" cy="164" rx="13" ry="10" fill="#b9aca1"/>${holding === 'none' || holding === 'simit' ? '<ellipse cx="138" cy="164" rx="13" ry="10" fill="#b9aca1"/>' : ''}
${holdingSVG(holding)}
</svg>`;
}

/** Outfits in unlock order with the condition that unlocks each. */
export const OUTFITS: { id: Outfit; unlock: 'start' | `streak:${number}` | 'karne' | 'pro' | 'ramadan' }[] = [
  { id: 'chef', unlock: 'start' },
  { id: 'fez', unlock: 'streak:3' },
  { id: 'headband', unlock: 'streak:7' },
  { id: 'graduate', unlock: 'karne' },
  { id: 'flowers', unlock: 'streak:30' },
  { id: 'crescent', unlock: 'ramadan' },
  { id: 'crown', unlock: 'pro' },
];
