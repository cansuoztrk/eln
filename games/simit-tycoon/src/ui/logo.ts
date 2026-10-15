/**
 * The Simit Tycoon wordmark: "SİMİT" in baked-dough letters sprinkled with
 * sesame, over a Bosphorus-navy ribbon where the two O's of TYCOON are simit
 * rings. Pure SVG, shared by the game (title, splash) and the store assets.
 */
let lid = 0;

function ring(cx: number, cy: number, r: number, id: string): string {
  const seeds: string[] = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.2;
    const rr = r * (0.72 + (k % 3) * 0.06);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    seeds.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.09).toFixed(1)}" ry="${(r * 0.05).toFixed(1)}" fill="#fff4d6" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="none" stroke="#5a2d0c" stroke-width="${r * 0.72}"/>
<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="none" stroke="url(#${id})" stroke-width="${r * 0.56}"/>
<path d="M${cx - r * 0.55} ${cy - r * 0.42}a${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.7} -${r * 0.28}" fill="none" stroke="#ffe7b8" stroke-width="${r * 0.12}" stroke-linecap="round" opacity=".8"/>
${seeds.join('')}`;
}

export function logoSVG(width = 320): string {
  const n = ++lid;
  const dough = `lgd${n}`;
  const ringG = `lgr${n}`;
  const clip = `lgc${n}`;
  const seeds: string[] = [];
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 46; k++) {
    const x = 26 + rnd() * 268;
    const y = 20 + rnd() * 70;
    seeds.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="1.5" fill="#fff4d6" transform="rotate(${Math.round(rnd() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  }
  return `<svg class="logo" width="${width}" viewBox="0 0 320 170" role="img" aria-label="Simit Tycoon">
<defs>
<linearGradient id="${dough}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a8"/><stop offset=".45" stop-color="#f3ab52"/><stop offset="1" stop-color="#c06a20"/></linearGradient>
<radialGradient id="${ringG}" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#f8c27c"/><stop offset=".6" stop-color="#dc8a3c"/><stop offset="1" stop-color="#a65a1a"/></radialGradient>
<clipPath id="${clip}"><text x="160" y="92" text-anchor="middle" font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" font-size="98" letter-spacing="2">SİMİT</text></clipPath>
</defs>
<g font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" text-anchor="middle">
<text x="160" y="96" font-size="98" letter-spacing="2" fill="#5a2d0c" stroke="#5a2d0c" stroke-width="18" stroke-linejoin="round">SİMİT</text>
<text x="160" y="92" font-size="98" letter-spacing="2" fill="url(#${dough})">SİMİT</text>
</g>
<g clip-path="url(#${clip})">${seeds.join('')}<rect x="0" y="22" width="320" height="16" fill="#fff" opacity=".18"/></g>
<g transform="translate(0 4)">
<path d="M22 118h276l-10 22 10 22H22l10-22z" fill="#a61e2d"/>
<path d="M36 112h248v52H36z" fill="#0f3550" stroke="#5a2d0c" stroke-width="5" stroke-linejoin="round"/>
<path d="M36 116h248" stroke="#fff" stroke-width="2.5" opacity=".25"/>
<g font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" font-size="40" fill="#fff" letter-spacing="1">
<text x="134" y="152" text-anchor="end">TYC</text>
<text x="230" y="152" text-anchor="start">N</text>
</g>
${ring(158, 138, 17, ringG)}${ring(203, 138, 17, ringG)}
</g>
</svg>`;
}
