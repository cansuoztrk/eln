import type { District, Goods } from '../meta/bazaar';
import { tekirSVG } from './art';

/**
 * Procedural illustration of a Grand Bazaar stall. Each restoration step
 * (sign, awning, counter, goods, lights) adds visible detail, so spending
 * stars always feels rewarding.
 */
const SHELF_Y = [150, 196];

function goodsSVG(goods: Goods): string {
  const items: string[] = [];
  const along = (y: number, n: number, fn: (x: number, y: number, i: number) => string, x0 = 112, x1 = 248) => {
    for (let i = 0; i < n; i++) items.push(fn(x0 + ((x1 - x0) * (i + 0.5)) / n, y, i));
  };
  const C = ['#ff6fa5', '#8fd14f', '#ffd447', '#ff9b3d', '#3fd6c8', '#ef3e5b', '#a77bff'];
  switch (goods) {
    case 'lokum':
      for (const y of SHELF_Y)
        along(y, 4, (x, yy, i) => `<ellipse cx="${x}" cy="${yy - 2}" rx="15" ry="4" fill="#fff" opacity=".8"/>${[0, 1, 2].map((k) => `<rect x="${x - 12 + k * 8}" y="${yy - 14 - (k === 1 ? 6 : 0)}" width="9" height="9" rx="2.5" fill="${C[(i + k) % 7]}"/><circle cx="${x - 9 + k * 8}" cy="${yy - 11 - (k === 1 ? 6 : 0)}" r="1" fill="#fff"/>`).join('')}`);
      along(214, 3, (x, y, i) => `<rect x="${x - 18}" y="${y - 16}" width="36" height="16" rx="4" fill="#fff4e0" stroke="#d6b88c"/>${[0, 1, 2, 3].map((k) => `<rect x="${x - 15 + k * 8}" y="${y - 13}" width="7" height="7" rx="2" fill="${C[(i * 2 + k) % 7]}"/>`).join('')}`, 90, 270);
      break;
    case 'tea':
      for (const y of SHELF_Y)
        along(y, 6, (x, yy) => `<ellipse cx="${x}" cy="${yy - 1}" rx="9" ry="2.5" fill="#d9d9d9"/><path d="M${x - 5} ${yy - 18}q-2 8 2 10q-3 3 0 6h6q3-3 0-6q4-2 2-10z" fill="#c2410c" stroke="#fff" stroke-width="1.2" opacity=".95"/>`);
      items.push(`<g transform="translate(175 172)"><ellipse cx="0" cy="40" rx="20" ry="5" fill="#9ca3af"/><path d="M-16 40q-2-22 16-24q18 2 16 24z" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/><path d="M-12 16q0-16 12-16q12 0 12 16z" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2"/><path d="M16 26q12-2 14 8" fill="none" stroke="#9ca3af" stroke-width="3"/></g>`);
      break;
    case 'spice':
      for (const y of SHELF_Y)
        along(y, 5, (x, yy, i) => `<path d="M${x - 14} ${yy}h28l-3-6h-22z" fill="#8a5228"/><path d="M${x - 11} ${yy - 6}q11-22 22 0z" fill="${['#dc2626', '#f59e0b', '#facc15', '#92400e', '#65a30d'][i % 5]}"/>`);
      along(214, 4, (x, y, i) => `<ellipse cx="${x}" cy="${y - 2}" rx="20" ry="6" fill="#a8692f"/><path d="M${x - 16} ${y - 4}q16-26 32 0z" fill="${['#ea580c', '#b91c1c', '#ca8a04', '#78350f'][i % 4]}"/>`, 90, 270);
      break;
    case 'carpet':
      [118, 158, 198, 238].forEach((x, i) => {
        const col = ['#9f1239', '#1e3a8a', '#b45309', '#065f46'][i];
        items.push(`<rect x="${x - 16}" y="108" width="32" height="96" rx="2" fill="${col}"/><rect x="${x - 12}" y="112" width="24" height="88" fill="none" stroke="#fde68a" stroke-width="2"/><path d="M${x} 124l10 14-10 14-10-14zM${x} 160l10 14-10 14-10-14z" fill="#fde68a"/><path d="M${x - 16} 204v6M${x - 8} 204v6M${x} 204v6M${x + 8} 204v6M${x + 16} 204v6" stroke="#fde68a" stroke-width="2"/>`);
      });
      along(214, 3, (x, y, i) => `<rect x="${x - 26}" y="${y - 14}" width="52" height="14" rx="7" fill="${['#9f1239', '#1e3a8a', '#b45309'][i]}"/><circle cx="${x + 20}" cy="${y - 7}" r="6" fill="#fde68a"/><circle cx="${x + 20}" cy="${y - 7}" r="3" fill="${['#9f1239', '#1e3a8a', '#b45309'][i]}"/>`, 90, 270);
      break;
    case 'lantern':
      for (const y of SHELF_Y)
        along(y, 5, (x, yy, i) => `<path d="M${x} ${yy - 26}l7 6v10l-7 8-7-8v-10z" fill="${C[i % 7]}" stroke="#7c5a1a" stroke-width="1.5"/><path d="M${x} ${yy - 26}v-4" stroke="#7c5a1a" stroke-width="2"/><rect x="${x - 5}" y="${yy - 2}" width="10" height="2" fill="#7c5a1a"/>`);
      break;
    case 'simit':
      for (const y of SHELF_Y)
        along(y, 5, (x, yy) => `<circle cx="${x}" cy="${yy - 11}" r="11" fill="#b45309"/><circle cx="${x}" cy="${yy - 11}" r="4.5" fill="#3b2a20"/><g fill="#fde68a"><circle cx="${x - 6}" cy="${yy - 16}" r="1"/><circle cx="${x + 5}" cy="${yy - 17}" r="1"/><circle cx="${x + 8}" cy="${yy - 8}" r="1"/><circle cx="${x - 8}" cy="${yy - 6}" r="1"/></g>`);
      items.push(`<rect x="172" y="150" width="4" height="62" fill="#8a5228"/>${[0, 1, 2, 3].map((k) => `<ellipse cx="174" cy="${160 + k * 13}" rx="15" ry="6" fill="none" stroke="#b45309" stroke-width="6"/>`).join('')}`);
      break;
    case 'tile':
      for (const y of SHELF_Y)
        along(y, 4, (x, yy, i) => `<circle cx="${x}" cy="${yy - 17}" r="16" fill="#f8fafc" stroke="#1d4ed8" stroke-width="2.5"/><circle cx="${x}" cy="${yy - 17}" r="9" fill="none" stroke="${i % 2 ? '#0e7490' : '#dc2626'}" stroke-width="2"/>${[0, 1, 2, 3].map((k) => `<ellipse cx="${x + Math.cos((k * Math.PI) / 2) * 5}" cy="${yy - 17 + Math.sin((k * Math.PI) / 2) * 5}" rx="3" ry="1.6" fill="#1d4ed8" transform="rotate(${k * 90} ${x} ${yy - 17})"/>`).join('')}`);
      break;
    case 'gold':
      for (const y of SHELF_Y)
        along(y, 5, (x, yy) => `<rect x="${x - 4}" y="${yy - 26}" width="8" height="26" fill="#3b0d1a"/>${[0, 1, 2].map((k) => `<ellipse cx="${x}" cy="${yy - 22 + k * 7}" rx="9" ry="3" fill="none" stroke="#facc15" stroke-width="2.6"/>`).join('')}`);
      along(214, 5, (x, y) => `<circle cx="${x}" cy="${y - 6}" r="6" fill="#facc15" stroke="#b45309" stroke-width="1.5"/><path d="M${x - 2} ${y - 9}l2 3 2-3" stroke="#b45309" fill="none"/>`, 90, 270);
      break;
    case 'coffee':
      for (const y of SHELF_Y)
        along(y, 5, (x, yy) => `<path d="M${x - 8} ${yy}l2-16h12l2 16z" fill="#c2410c" stroke="#7c2d12" stroke-width="1.5"/><path d="M${x + 8} ${yy - 12}h12" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/><ellipse cx="${x}" cy="${yy - 16}" rx="6" ry="2" fill="#fbbf24"/>`);
      along(214, 4, (x, y) => `<ellipse cx="${x}" cy="${y - 1}" rx="12" ry="3" fill="#f5f5f4" stroke="#a8a29e"/><path d="M${x - 7} ${y - 14}h14l-2 11h-10z" fill="#fafaf9" stroke="#1d4ed8" stroke-width="1.5"/><ellipse cx="${x}" cy="${y - 14}" rx="7" ry="2" fill="#3b2314"/>`, 90, 270);
      break;
    case 'icecream':
      for (const y of SHELF_Y)
        along(y, 5, (x, yy, i) => `<path d="M${x - 6} ${yy - 14}l6 14 6-14z" fill="#d97706"/><circle cx="${x}" cy="${yy - 18}" r="8" fill="${['#fbcfe8', '#fef3c7', '#bbf7d0', '#fecaca', '#ddd6fe'][i % 5]}"/>`);
      along(214, 4, (x, y, i) => `<rect x="${x - 18}" y="${y - 18}" width="36" height="18" rx="3" fill="#e2e8f0" stroke="#94a3b8"/><ellipse cx="${x}" cy="${y - 18}" rx="16" ry="6" fill="${['#fbcfe8', '#fef9c3', '#bbf7d0', '#e9d5ff'][i]}"/>`, 90, 270);
      items.push(`<rect x="250" y="120" width="4" height="96" rx="2" fill="#a16207" transform="rotate(14 252 168)"/>`);
      break;
    case 'fish':
      for (const y of SHELF_Y)
        along(y, 4, (x, yy) => `<ellipse cx="${x}" cy="${yy - 8}" rx="15" ry="7" fill="#94a3b8"/><path d="M${x + 13} ${yy - 8}l9-7v14z" fill="#64748b"/><circle cx="${x - 9}" cy="${yy - 10}" r="1.8" fill="#0f172a"/><path d="M${x - 4} ${yy - 13}q4 5 0 10" stroke="#e2e8f0" fill="none"/>`);
      along(214, 3, (x, y) => `<ellipse cx="${x}" cy="${y - 8}" rx="24" ry="9" fill="#f59e0b"/><path d="M${x - 18} ${y - 10}h36" stroke="#16a34a" stroke-width="3"/><circle cx="${x + 26}" cy="${y - 6}" r="6" fill="#fde047"/>`, 90, 270);
      break;
    case 'palace':
      for (const y of SHELF_Y)
        along(y, 4, (x, yy, i) => `<path d="M${x - 9} ${yy}q-2-14 9-14q11 0 9 14z" fill="#1d4ed8"/><path d="M${x} ${yy - 14}v-10" stroke="#16a34a" stroke-width="2.5"/><path d="M${x - 6} ${yy - 30}q6-6 12 0l-2 8h-8z" fill="${['#dc2626', '#f59e0b', '#ec4899', '#a855f7'][i]}"/>`);
      break;
  }
  return items.join('');
}

function lanternsSVG(lit: boolean): string {
  const out: string[] = [];
  const cols = ['#ef3e5b', '#3fd6c8', '#ffd447'];
  [96, 180, 264].forEach((x, i) => {
    const glow = lit ? `<circle cx="${x}" cy="134" r="26" fill="${cols[i]}" opacity=".28"/>` : '';
    out.push(`${glow}<path d="M${x} 102v14" stroke="#7c5a1a" stroke-width="2"/><path d="M${x} 116l11 8v14l-11 10-11-10v-14z" fill="${lit ? cols[i] : '#5b4a3a'}" stroke="#7c5a1a" stroke-width="2"/>${lit ? `<path d="M${x} 120l6 5v10l-6 6-6-6v-10z" fill="#fff8d6" opacity=".7"/>` : ''}<path d="M${x - 4} 148h8l-4 6z" fill="#7c5a1a"/>`);
  });
  if (lit) {
    const bulbs = [];
    for (let i = 0; i <= 12; i++) {
      const x = 40 + i * 23.3;
      const y = 40 + Math.sin((i / 12) * Math.PI) * 10;
      bulbs.push(`<circle cx="${x}" cy="${y}" r="3.2" fill="${cols[i % 3]}"/><circle cx="${x}" cy="${y}" r="7" fill="${cols[i % 3]}" opacity=".25"/>`);
    }
    out.unshift(`<path d="M40 40q140 22 280 0" fill="none" stroke="#3b2a20" stroke-width="1.5"/>${bulbs.join('')}`);
  }
  return out.join('');
}

export function stallSVG(d: District, done: number[], name: string): string {
  const has = (i: number) => done.includes(i);
  const [aw1, aw2] = d.awning;
  const complete = done.length >= 5;
  const interior = has(4) ? '#7a4a22' : '#2e2119';

  const sign = has(0)
    ? `<path d="M130 8v14M230 8v14" stroke="#5b4a3a" stroke-width="3"/><rect x="100" y="20" width="160" height="40" rx="8" fill="#7c3f12" stroke="#f5c76b" stroke-width="3"/><text x="180" y="47" text-anchor="middle" font-family="'Baloo 2',system-ui,sans-serif" font-weight="800" font-size="${name.length > 16 ? 15 : 18}" fill="#fde68a">${escapeXml(name)}</text>`
    : `<path d="M130 8v10M230 8v6" stroke="#5b4a3a" stroke-width="3" stroke-dasharray="3 3"/><rect x="250" y="226" width="70" height="16" rx="3" fill="#6b4a2f" transform="rotate(-18 285 234)" opacity=".8"/>`;

  let awning: string;
  if (has(1)) {
    const stripes = [];
    for (let i = 0; i < 12; i++) stripes.push(`<rect x="${60 + i * 20}" y="66" width="20" height="30" fill="${i % 2 ? aw2 : aw1}"/>`);
    const scallops = [];
    for (let i = 0; i < 12; i++) scallops.push(`<path d="M${60 + i * 20} 96a10 10 0 0020 0z" fill="${i % 2 ? aw2 : aw1}"/>`);
    awning = `<g filter="url(#sh)">${stripes.join('')}${scallops.join('')}</g><rect x="56" y="62" width="248" height="6" rx="3" fill="#5b3a1e"/>`;
  } else {
    awning = `<rect x="56" y="62" width="248" height="6" rx="3" fill="#4a3a2e"/><path d="M70 68l14 26 10-26zM150 68l8 18 12-18zM240 68l10 30 10-30z" fill="#8b8178" opacity=".85"/>`;
  }

  const counter = has(2)
    ? `<rect x="70" y="214" width="220" height="10" rx="3" fill="#c98b4e"/><rect x="76" y="224" width="208" height="40" fill="#9a5b2a"/><g fill="none" stroke="#f5c76b" stroke-width="2" opacity=".8">${[0, 1, 2, 3].map((k) => `<rect x="${86 + k * 50}" y="230" width="38" height="28" rx="4"/><path d="M${105 + k * 50} 236l8 8-8 8-8-8z"/>`).join('')}</g>`
    : `<g opacity=".9"><rect x="96" y="246" width="70" height="12" rx="2" fill="#6b4a2f" transform="rotate(8 131 252)"/><rect x="170" y="240" width="60" height="22" rx="2" fill="#7a5535"/><path d="M175 240l50 22M225 240l-50 22" stroke="#4a3220" stroke-width="3"/></g>`;

  const goods = has(3) ? goodsSVG(d.goods) : '';
  const cat = complete ? `<g transform="translate(220 150) scale(.42)">${tekirSVG(200, 'happy', false).replace(/<\/?svg[^>]*>/g, '')}</g>` : '';
  const sparkle = complete ? `<g fill="#fff8d6">${[[60, 120], [300, 140], [40, 200], [320, 90]].map(([x, y]) => `<path d="M${x} ${y - 8}l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>`).join('')}</g>` : '';
  const warm = has(4) ? `<rect x="0" y="0" width="360" height="300" fill="url(#warm)"/>` : '';

  return `<svg class="stall" viewBox="0 0 360 300" role="img" aria-label="${escapeXml(name)}">
<defs>
<filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity=".35"/></filter>
<radialGradient id="warm" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffcf6b" stop-opacity=".28"/><stop offset="1" stop-color="#ffcf6b" stop-opacity="0"/></radialGradient>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.wall}"/><stop offset="1" stop-color="#8d6e52"/></linearGradient>
</defs>
<rect x="0" y="0" width="360" height="300" fill="#1c1430"/>
<rect x="20" y="30" width="320" height="236" fill="url(#wall)"/>
<g stroke="#000" stroke-opacity=".08" stroke-width="2">${[60, 100, 140, 180, 220].map((y) => `<path d="M20 ${y}h320"/>`).join('')}</g>
<path d="M90 252V120q0-50 90-62q90 12 90 62v132z" fill="${interior}"/>
<path d="M90 252V120q0-50 90-62q90 12 90 62v132" fill="none" stroke="#5b3a1e" stroke-width="6"/>
${SHELF_Y.map((y) => `<rect x="100" y="${y}" width="160" height="5" rx="2" fill="#5b3a1e"/>`).join('')}
${goods}
<rect x="0" y="262" width="360" height="38" fill="#5c4a3d"/>
<g stroke="#3d3028" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => `<path d="M${k * 45} 262v38"/>`).join('')}<path d="M0 280h360"/></g>
${counter}
${cat}
${awning}
${lanternsSVG(has(4))}
${sign}
${warm}
${sparkle}
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
}
