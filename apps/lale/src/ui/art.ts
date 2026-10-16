import type { Shape, Variety } from '../core/garden';

/**
 * Hand-authored, procedural vector art: tulips that grow from sprout to
 * bloom, Tekir the gardener, and the UI icon set. Everything is SVG text so
 * it renders crisply on every screen and costs no image downloads.
 */
let gid = 0;
const uid = (p: string) => `${p}${++gid}`;

// ───────────── colour helpers ─────────────

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * t));
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#000000', t);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);

// ───────────── tulip ─────────────

/** One petal standing on (0,0) and pointing up, height h, half-width w. */
function petal(shape: Shape, w: number, h: number, seed = 0): string {
  switch (shape) {
    case 'almond': {
      // Istanbul dagger tulip: long, narrow, needle-pointed.
      return `M0 0 C${-w * 1.1} ${-h * 0.25} ${-w * 0.9} ${-h * 0.75} ${-w * 0.08} ${-h * 1.18} C${w * 0.9} ${-h * 0.75} ${w * 1.1} ${-h * 0.25} 0 0Z`;
    }
    case 'lily': {
      // Pointed petals with tips flaring outward.
      return `M0 0 C${-w * 1.15} ${-h * 0.3} ${-w * 1.1} ${-h * 0.8} ${-w * 0.55} ${-h * 1.02} Q${-w * 0.1} ${-h * 1.12} ${w * 0.25} ${-h * 1.22} C${w * 0.3} ${-h * 0.95} ${w * 1.15} ${-h * 0.75} ${w * 1.05} ${-h * 0.3} Q${w * 0.6} ${-h * 0.05} 0 0Z`;
    }
    case 'fringed': {
      const teeth = 7;
      let top = '';
      for (let i = 0; i <= teeth; i++) {
        const x = -w * 0.85 + (i / teeth) * w * 1.7;
        const y = -h * (i % 2 ? 1.06 : 0.94) - Math.sin((i / teeth) * Math.PI) * h * 0.05;
        top += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return `M0 0 C${-w * 1.1} ${-h * 0.25} ${-w * 1.05} ${-h * 0.7} ${-w * 0.85} ${-h * 0.94}${top} C${w * 1.05} ${-h * 0.7} ${w * 1.1} ${-h * 0.25} 0 0Z`;
    }
    case 'parrot': {
      // Ruffled, wavy edges.
      const pts: string[] = [];
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const y = -h * (0.15 + 0.85 * t);
        const r = w * (0.75 + 0.35 * Math.sin(t * Math.PI)) * (1 + 0.16 * Math.sin(i * 2.7 + seed));
        pts.push(`${(-r).toFixed(1)} ${y.toFixed(1)}`);
      }
      const right: string[] = [];
      for (let i = n; i >= 0; i--) {
        const t = i / n;
        const y = -h * (0.15 + 0.85 * t) - (i === n ? h * 0.12 : 0);
        const r = w * (0.75 + 0.35 * Math.sin(t * Math.PI)) * (1 + 0.16 * Math.sin(i * 3.1 + seed + 1));
        right.push(`${r.toFixed(1)} ${y.toFixed(1)}`);
      }
      return `M0 0 L${pts.join(' L')} Q0 ${-h * 1.2} ${right.join(' L')} Z`;
    }
    case 'peony':
    case 'cup':
    default: {
      // Classic rounded cup petal.
      return `M0 0 C${-w * 1.15} ${-h * 0.28} ${-w * 1.0} ${-h * 0.92} ${-w * 0.22} ${-h * 1.0} Q0 ${-h * 1.07} ${w * 0.22} ${-h * 1.0} C${w * 1.0} ${-h * 0.92} ${w * 1.15} ${-h * 0.28} 0 0Z`;
    }
  }
}

interface PetalDef {
  rot: number;
  dx: number;
  scale: number;
  layer: number;
  shade: number;
}

/** Petal layout per shape: back petals first. */
function layout(shape: Shape): PetalDef[] {
  if (shape === 'peony') {
    return [
      { rot: -38, dx: -6, scale: 0.92, layer: 0, shade: 0.22 },
      { rot: 38, dx: 6, scale: 0.92, layer: 0, shade: 0.22 },
      { rot: -16, dx: -3, scale: 1.0, layer: 1, shade: 0.12 },
      { rot: 16, dx: 3, scale: 1.0, layer: 1, shade: 0.12 },
      { rot: 0, dx: 0, scale: 1.05, layer: 2, shade: 0.05 },
      { rot: -26, dx: -4, scale: 0.78, layer: 3, shade: 0 },
      { rot: 26, dx: 4, scale: 0.78, layer: 3, shade: 0 },
    ];
  }
  if (shape === 'almond' || shape === 'lily') {
    const spread = shape === 'lily' ? 30 : 18;
    return [
      { rot: 0, dx: 0, scale: 1.04, layer: 0, shade: 0.2 },
      { rot: -spread, dx: -3, scale: 0.98, layer: 1, shade: 0.06 },
      { rot: spread, dx: 3, scale: 0.98, layer: 1, shade: 0.06 },
    ];
  }
  return [
    { rot: 0, dx: 0, scale: 1.02, layer: 0, shade: 0.22 },
    { rot: -17, dx: -4, scale: 1.0, layer: 1, shade: 0.05 },
    { rot: 17, dx: 4, scale: 1.0, layer: 1, shade: 0.05 },
  ];
}

export interface TulipOpts {
  size?: number;
  /** 0 sprout … 1 full bloom. */
  growth?: number;
  wilted?: boolean;
  /** Silhouette for not-yet-found varieties. */
  silhouette?: boolean;
  /** Seed for small natural variations (lean, leaf angle). */
  seed?: number;
  /** Draw only the flower head (collection cards). */
  headOnly?: boolean;
}

/** A tulip as an SVG string (viewBox 0 0 100 160, flower centred at x=50). */
export function tulipSVG(v: Pick<Variety, 'shape' | 'color' | 'accent' | 'flamed'>, opts: TulipOpts = {}): string {
  const size = opts.size ?? 100;
  const g = clamp01(opts.growth ?? 1);
  const seed = opts.seed ?? 0;
  const id = uid('t');
  const sil = opts.silhouette;
  const wilt = !!opts.wilted;
  const lean = ((seed % 7) - 3) * 1.2 + (wilt ? 12 : 0);
  const stemGreen = wilt ? '#8a8d5a' : '#3f8f4a';
  const leafGreen = wilt ? '#9a9a63' : '#4fa35a';
  const base = sil ? '#000000' : wilt ? mix(v.color, '#8b7355', 0.55) : v.color;
  const accent = sil ? '#000000' : wilt ? mix(v.accent, '#8b7355', 0.55) : v.accent;

  // Growth stages: leaves appear first, then the stem rises, the bud colours and opens.
  const leafG = ease(g / 0.3);
  const stemG = ease((g - 0.12) / 0.45);
  const budG = ease((g - 0.35) / 0.4);
  const openG = ease((g - 0.7) / 0.3);
  const stemTop = 150 - (opts.headOnly ? 0 : 78 * stemG);
  const headY = opts.headOnly ? 128 : stemTop;
  const headScale = opts.headOnly ? 1.9 : 0.5 + 0.95 * budG;
  const budColor = mix('#7fb069', base, Math.min(1, budG * 1.2));

  let leaves = '';
  if (!opts.headOnly && leafG > 0) {
    const l = 46 * leafG;
    const tilt = (seed % 5) * 2;
    leaves = `<path d="M50 152 C${38 - tilt} ${150 - l * 0.4} ${28 - tilt} ${150 - l * 0.9} ${30 - tilt * 1.5} ${150 - l * 1.25} C${42} ${150 - l * 0.85} ${48} ${150 - l * 0.4} 50 152Z" fill="${sil ? '#000' : leafGreen}"/>
<path d="M50 152 C${62 + tilt} ${150 - l * 0.35} ${74 + tilt} ${150 - l * 0.7} ${73 + tilt} ${150 - l * 1.05} C${60} ${150 - l * 0.75} ${53} ${150 - l * 0.35} 50 152Z" fill="${sil ? '#000' : darken(leafGreen, 0.12)}"/>`;
  }
  const stem = opts.headOnly || stemG <= 0 ? '' : `<path d="M50 152 Q${50 + lean * 0.2} ${(152 + stemTop) / 2} ${50 + lean * 0.5} ${stemTop + 4}" stroke="${sil ? '#000' : stemGreen}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;

  let head = '';
  if (budG > 0 || opts.headOnly) {
    const defs = layout(v.shape);
    const H = v.shape === 'almond' ? 40 : v.shape === 'peony' ? 30 : 34;
    const W = v.shape === 'almond' ? 9 : v.shape === 'peony' ? 15 : v.shape === 'lily' ? 11 : 14;
    const openK = opts.headOnly ? 1 : openG;
    const fill = (shade: number) => (budG < 1 && !opts.headOnly ? budColor : darken(base, shade));
    const grad = `<linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${darken(base, 0.18)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${lighten(base, 0.18)}"/></linearGradient>`;
    let petals = '';
    defs.forEach((p, i) => {
      const rot = p.rot * (0.25 + 0.75 * openK);
      const d = petal(v.shape, W * p.scale * (0.6 + 0.4 * openK), H * p.scale, seed + i);
      const clip = `${id}c${i}`;
      const flame = v.flamed && !sil
        ? `<clipPath id="${clip}"><path d="${d}"/></clipPath><g clip-path="url(#${clip})" stroke="${accent}" stroke-width="${W * 0.22}" fill="none" stroke-linecap="round" opacity=".9"><path d="M0 -2 Q${-W * 0.5} ${-H * 0.5} ${-W * 0.3} ${-H * 1.1}"/><path d="M0 -4 Q${W * 0.15} ${-H * 0.6} ${W * 0.05} ${-H * 1.15}"/><path d="M0 -2 Q${W * 0.6} ${-H * 0.5} ${W * 0.45} ${-H * 1.05}"/></g>`
        : '';
      const edge = !v.flamed && !sil && v.accent !== v.color ? ` stroke="${accent}" stroke-width="1.6" stroke-linejoin="round"` : '';
      const usesGrad = p.layer > 0 && !(budG < 1 && !opts.headOnly) && !sil;
      petals += `<g transform="translate(${p.dx * openK} 0) rotate(${rot})"><path d="${d}" fill="${usesGrad ? `url(#${id}g)` : fill(p.shade)}"${edge}/>${flame}</g>`;
    });
    const droop = wilt ? 'rotate(40)' : `rotate(${lean * 0.4})`;
    head = `<defs>${grad}</defs><g transform="translate(${50 + (opts.headOnly ? 0 : lean * 0.5)} ${headY + 6}) ${droop} scale(${headScale})">${petals}</g>`;
    if (wilt && !sil) head += `<path d="M64 150 q4 -6 10 -4 q-2 6 -10 4z" fill="${darken(base, 0.1)}" opacity=".85"/><path d="M30 151 q5 -5 10 -2 q-4 5 -10 2z" fill="${darken(base, 0.2)}" opacity=".7"/>`;
  }
  const shadow = opts.headOnly ? '' : `<ellipse cx="50" cy="153" rx="${14 + 8 * leafG}" ry="3.2" fill="#000" opacity="${sil ? 0.06 : 0.12}"/>`;
  return `<svg class="tulip" viewBox="0 0 100 160" width="${size}" height="${(size * 160) / 100}" aria-hidden="true"${sil ? ' opacity=".18"' : ''}>${shadow}${leaves}${stem}${head}</svg>`;
}

// ───────────── Tekir the gardener ─────────────

export function tekirSVG(size = 120, mood: 'idle' | 'happy' | 'sleep' = 'idle', prop: 'tulip' | 'can' | 'none' = 'tulip'): string {
  const fur = uid('tf');
  const eyes =
    mood === 'happy'
      ? '<path d="M68 98q10-10 20 0M112 98q10-10 20 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>'
      : mood === 'sleep'
        ? '<path d="M68 101q10 6 20 0M112 101q10 6 20 0" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/>'
        : '<ellipse cx="78" cy="98" rx="10" ry="11.5" fill="#c6f05a"/><ellipse cx="122" cy="98" rx="10" ry="11.5" fill="#c6f05a"/><ellipse cx="78" cy="99" rx="4.2" ry="9" fill="#1f1610"/><ellipse cx="122" cy="99" rx="4.2" ry="9" fill="#1f1610"/><circle cx="81" cy="93.5" r="3" fill="#fff"/><circle cx="125" cy="93.5" r="3" fill="#fff"/>';
  const props =
    prop === 'tulip'
      ? `<g transform="translate(98 106) rotate(14)"><path d="M0 60 Q-2 30 0 8" stroke="#3f8f4a" stroke-width="4" fill="none"/><path d="M0 40 q-14 -4 -16 -18 q12 4 16 18z" fill="#4fa35a"/><g transform="translate(0 10)"><path d="M0 0 C-14 -4 -13 -20 -4 -24 Q0 -26 4 -24 C13 -20 14 -4 0 0Z" fill="#c1121f"/><path d="M0 0 C-12 -6 -14 -18 -8 -24 Q-4 -26 -2 -20 Z" fill="#e63946"/><path d="M0 0 C12 -6 14 -18 8 -24 Q4 -26 2 -20 Z" fill="#e63946"/></g></g>`
      : prop === 'can'
        ? `<g transform="translate(118 132)"><path d="M0 0h30l-4 26h-22z" fill="#2a9d8f"/><path d="M30 6l18 -12" stroke="#2a9d8f" stroke-width="5" stroke-linecap="round"/><path d="M4 0q11 -16 22 0" fill="none" stroke="#21867a" stroke-width="3"/></g>`
        : '';
  return `<svg class="tekir" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Tekir">
<defs><radialGradient id="${fur}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#cdbfb3"/><stop offset=".65" stop-color="#9f9186"/><stop offset="1" stop-color="#807268"/></radialGradient></defs>
<g class="tekir-tail"><path d="M150 162q42-8 32-50q-5-18 8-22" fill="none" stroke="#8a7d73" stroke-width="15" stroke-linecap="round"/><path d="M178 106q-3-10 9-15" fill="none" stroke="#5c514a" stroke-width="15" stroke-linecap="round"/></g>
<ellipse cx="100" cy="172" rx="54" ry="28" fill="#8f8278"/>
<path d="M58 150q42 22 84 0l4 34H54z" fill="#c1121f"/><path d="M84 154l16 14 16-14" fill="none" stroke="#ffd166" stroke-width="3"/>
<path d="M44 70L52 22l36 30zM156 70l-8-48-36 30z" fill="#8f8278" stroke="#6b5f57" stroke-width="2"/>
<path d="M54 60l4-28 20 18zM146 60l-4-28-20 18z" fill="#ffb7c5"/>
<ellipse cx="100" cy="98" rx="62" ry="54" fill="url(#${fur})"/>
<path d="M86 52q4 14 0 26M100 48v30M114 52q-4 14 0 26" stroke="#5c514a" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M40 92q12 2 18 8M40 108q12-2 18-4M160 92q-12 2-18 8M160 108q-12-2-18-4" stroke="#5c514a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
<ellipse cx="100" cy="122" rx="30" ry="20" fill="#ebe3da"/>
${eyes}
<path d="M93 112h14l-7 7z" fill="#ff8fa3"/>
<path d="M100 118v5M100 123q-6 7-12 2M100 123q6 7 12 2" fill="none" stroke="#2b1d14" stroke-width="3.5" stroke-linecap="round"/>
<g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"><path d="M70 120l-26-4M70 126l-25 4M130 120l26-4M130 126l25 4"/></g>
<path d="M36 64 Q100 18 164 64 Q100 50 36 64Z" fill="#e9c46a" stroke="#c9a227" stroke-width="2"/><path d="M58 56 Q100 26 142 56" fill="#f4d58d"/><path d="M64 58 Q100 46 136 58" stroke="#c1121f" stroke-width="5" fill="none"/>
${props}
<ellipse cx="66" cy="168" rx="13" ry="10" fill="#b9aca1"/><ellipse cx="134" cy="168" rx="13" ry="10" fill="#b9aca1"/>
</svg>`;
}

// ───────────── icons ─────────────

const icon = (body: string) => `<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  focus: icon('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
  track: icon('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
  stats: icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  garden: icon('<path d="M12 21v-8"/><path d="M12 13c-4 0-6-3-6-7 2 0 4 1 6 3 2-2 4-3 6-3 0 4-2 7-6 7z"/><path d="M12 17c-2-2-5-2-7-1M12 18c2-2 5-2 7-1"/>'),
  friends: icon('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 4.9"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  play: icon('<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>'),
  pause: icon('<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>'),
  stop: icon('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  minus: icon('<path d="M5 12h14"/>'),
  close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: icon('<path d="M4 12.5l5 5L20 6.5"/>'),
  share: icon('<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  copy: icon('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'),
  lock: icon('<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  flame: icon('<path d="M12 22c4 0 7-2.8 7-7 0-3.6-2.4-6.1-4-8-.4 2.3-1.6 3.6-3 4 0-3-1-6.2-4-9-.3 4.7-3 6.9-3 13 0 4.2 3 7 7 7z" fill="currentColor" stroke="none"/>'),
  bulb: icon('<path d="M12 3c-1.5 2-4 3.5-4 7a4 4 0 0 0 8 0c0-3.5-2.5-5-4-7z" fill="currentColor" stroke="none"/><path d="M10 17c0 2 1 3 2 4M14 17c0 2-1 3-2 4"/>'),
  crown: icon('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor" stroke="none"/>'),
  sound: icon('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: icon('<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M17 9l5 6M22 9l-5 6"/>'),
  chevron: icon('<path d="M9 5l7 7-7 7"/>'),
  back: icon('<path d="M15 5l-7 7 7 7"/>'),
  calendar: icon('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  edit: icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  trash: icon('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  download: icon('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: icon('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  moon: icon('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  bell: icon('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  globe: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>'),
  vibrate: icon('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 8v8M21 8v8"/>'),
  shield: icon('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  doc: icon('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>'),
  star: icon('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor" stroke="none"/>'),
  target: icon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  eye: icon('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
};

export type IconName = keyof typeof ICONS;
