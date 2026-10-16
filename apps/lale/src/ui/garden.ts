import { DISTRICTS, districtUnlocked, hash, RARITY_ORDER, VARIETIES, VARIETY_BY_ID, type District, type Rarity, type Variety } from '../core/garden';
import { currentLang, dateFmt, num, t, tp, type Key } from '../i18n';
import { focusHours } from '../meta/actions';
import { isPremium, store } from '../meta/state';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { ICONS, mix, tekirSVG, tulipSVG } from './art';
import { h } from './dom';
import { modal, toast } from './modal';

const MIN_FOR: Record<Rarity, number> = { common: 10, uncommon: 25, rare: 50, epic: 90 };
const W = 360;
const H = 250;

/** Planting slots: six rows, smaller at the back, drawn back to front. */
const SLOTS: { x: number; y: number; s: number; row: number }[] = (() => {
  const out: { x: number; y: number; s: number; row: number }[] = [];
  for (let row = 0; row < 6; row++) {
    const s = 19 + row * 5;
    const y = 150 + row * 17;
    const n = Math.floor((W - 24) / (s * 0.92));
    const step = (W - 24) / n;
    for (let i = 0; i < n; i++) out.push({ x: 12 + step * (i + 0.5) + (row % 2 ? step * 0.25 : -step * 0.15), y, s, row });
  }
  return out;
})();

/** Order in which slots fill, so a young garden is spread out instead of one full row. */
const FILL_ORDER = SLOTS.map((_, i) => i).sort((a, b) => hash(`slot${a}`) - hash(`slot${b}`));

function skyline(d: District): string {
  const c = d.night ? '#0f1830' : mix(d.sky[0], '#355070', 0.45);
  const c2 = d.night ? '#16223f' : mix(d.sky[0], '#355070', 0.3);
  const water = d.night ? '#22345e' : mix(d.sky[0], '#4f8fc0', 0.55);
  switch (d.id) {
    case 'gulhane': // domes and minarets across the Golden Horn
      return `<g fill="${c}" opacity=".75"><path d="M110 150v-22a40 40 0 0 1 80 0v22z"/><path d="M92 150v-12a22 22 0 0 1 44 0v12zM164 150v-12a22 22 0 0 1 44 0v12z"/><path d="M146 92a4 4 0 0 1 8 0v8h-8z"/><rect x="80" y="86" width="5" height="64"/><path d="M78 88l4.5-16 4.5 16z"/><rect x="215" y="86" width="5" height="64"/><path d="M213 88l4.5-16 4.5 16z"/><rect x="66" y="104" width="4" height="46"/><path d="M64.5 106l3.5-12 3.5 12z"/><rect x="230" y="104" width="4" height="46"/><path d="M228.5 106l3.5-12 3.5 12z"/></g><g fill="${c2}" opacity=".5"><path d="M250 150v-14a18 18 0 0 1 36 0v14zM292 150v-30h6v30z"/><path d="M291 122l4-12 4 12z"/><path d="M20 150v-10a14 14 0 0 1 28 0v10z"/></g>`;
    case 'emirgan': // the Bosphorus, a pavilion and round trees
      return `<rect x="0" y="128" width="${W}" height="24" fill="${water}" opacity=".55"/><g fill="${c2}" opacity=".55"><path d="M0 128q40-18 90-6t110 0 160-4v10H0z"/></g><g fill="${c}" opacity=".7"><path d="M140 150v-26h56v26z"/><path d="M134 126l34-18 34 18z"/><rect x="150" y="132" width="8" height="10" fill="${d.sky[1]}" opacity=".7"/><rect x="178" y="132" width="8" height="10" fill="${d.sky[1]}" opacity=".7"/><circle cx="60" cy="128" r="20"/><circle cx="84" cy="134" r="16"/><circle cx="270" cy="126" r="22"/><circle cx="300" cy="134" r="17"/><circle cx="326" cy="130" r="15"/></g>`;
    case 'yildiz': // a chalet among old trees
      return `<g fill="${c}" opacity=".68"><circle cx="40" cy="122" r="26"/><circle cx="76" cy="130" r="20"/><circle cx="292" cy="118" r="28"/><circle cx="330" cy="128" r="22"/><path d="M150 150v-30h70v30z"/><path d="M142 122l43-28 43 28z"/><path d="M178 99v-14h7v18z"/></g><g fill="${d.sky[1]}" opacity=".6"><rect x="160" y="128" width="9" height="12"/><rect x="180" y="128" width="9" height="12"/><rect x="200" y="128" width="9" height="12"/></g>`;
    case 'fethipasa': // green hills and the bridge over the Bosphorus
      return `<rect x="0" y="132" width="${W}" height="20" fill="${water}" opacity=".5"/><g fill="none" stroke="${c}" stroke-width="2.4" opacity=".75"><path d="M0 120 L360 120"/><path d="M90 84 Q180 132 270 84"/><path d="M0 104 Q45 118 90 84M270 84 Q315 118 360 104"/></g><g fill="${c}" opacity=".75"><rect x="86" y="80" width="8" height="52"/><rect x="266" y="80" width="8" height="52"/></g><g fill="${c2}" opacity=".5"><path d="M0 138q60-30 120-8t110-4 130 6v20H0z"/></g>`;
    case 'topkapi': // the Tower of Justice and palace walls
      return `<g fill="${c}" opacity=".72"><rect x="166" y="70" width="16" height="80"/><path d="M162 72l12-30 12 30z"/><rect x="171" y="80" width="6" height="10" fill="${d.sky[1]}" opacity=".7"/><path d="M110 150v-16a20 20 0 0 1 40 0v16zM196 150v-14a18 18 0 0 1 36 0v14z"/><path d="M0 150v-16h${W}v16z"/></g><g fill="${c2}" opacity=".7">${Array.from({ length: 30 }, (_, i) => `<rect x="${i * 12 + 2}" y="128" width="7" height="7"/>`).join('')}</g>`;
    case 'bogaz': { // night: stars, moon and the lit bridge
      let stars = '';
      for (let i = 0; i < 34; i++) {
        const hh = hash(`star${i}`);
        stars += `<circle cx="${hh % W}" cy="${(hh >>> 9) % 95 + 6}" r="${((hh >>> 4) % 3) * 0.4 + 0.6}" fill="#fff" opacity="${0.35 + ((hh >>> 12) % 6) / 10}"/>`;
      }
      let lights = '';
      for (let i = 0; i <= 18; i++) {
        const x = 90 + i * 10;
        const y = 84 + 48 * (1 - Math.pow((x - 180) / 90, 2)) - 0;
        lights += `<circle cx="${x}" cy="${(y).toFixed(1)}" r="1.6" fill="#ffd166"/>`;
      }
      return `${stars}<circle cx="300" cy="40" r="16" fill="#fdf6e3"/><circle cx="294" cy="35" r="16" fill="${d.sky[0]}"/><rect x="0" y="126" width="${W}" height="26" fill="#1c2c52"/><g fill="none" stroke="#2c3e6e" stroke-width="2.4"><path d="M0 118 L360 118"/><path d="M90 84 Q180 132 270 84"/></g><g fill="#2c3e6e"><rect x="86" y="80" width="8" height="46"/><rect x="266" y="80" width="8" height="46"/></g>${lights}<g stroke="#ffd166" stroke-width="1.4" opacity=".35">${Array.from({ length: 12 }, (_, i) => `<path d="M${96 + i * 15} ${130 + (i % 3) * 5}h${6 + (i % 4) * 2}"/>`).join('')}</g>`;
    }
    case 'laledevri': // a pavilion with wide eaves and a fountain
      return `<g fill="${c}" opacity=".7"><path d="M120 150v-34h120v34z"/><path d="M104 118 Q180 84 256 118z"/><path d="M176 92a4 4 0 0 1 8 0v4h-8z"/><rect x="130" y="124" width="12" height="18" rx="6" fill="${d.sky[1]}" opacity=".55"/><rect x="152" y="124" width="12" height="18" rx="6" fill="${d.sky[1]}" opacity=".55"/><rect x="196" y="124" width="12" height="18" rx="6" fill="${d.sky[1]}" opacity=".55"/><rect x="218" y="124" width="12" height="18" rx="6" fill="${d.sky[1]}" opacity=".55"/><path d="M40 150v-10h44v10z"/><path d="M48 140v-8h28v8z"/><path d="M58 132v-10h8v10z"/><path d="M290 150v-46h6v46z"/><path d="M286 106q7-20 14 0z"/></g>`;
    default:
      return '';
  }
}

/** The garden as one SVG: sky, a skyline, the ground and every tulip planted here. */
export function gardenScene(d: District, tulips: { id: string; v: Variety }[], opts: { cat?: boolean } = {}): string {
  const gid = `g${d.id}`;
  const shown = tulips.slice(-SLOTS.length);
  const placed = shown.map((x, i) => ({ ...x, slot: SLOTS[FILL_ORDER[i]] })).sort((a, b) => a.slot.row - b.slot.row || a.slot.x - b.slot.x);
  let flowers = '';
  for (const p of placed) {
    const { x, y, s } = p.slot;
    const jx = ((hash(p.id) % 7) - 3) * 0.8;
    flowers += `<g transform="translate(${(x - s / 2 + jx).toFixed(1)} ${(y - s * 1.55).toFixed(1)})">${tulipSVG(p.v, { size: s, seed: hash(p.id) % 13 })}</g>`;
  }
  const ground = d.ground;
  return `<svg class="garden-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${d.name[currentLang()]}">
<defs><linearGradient id="${gid}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.sky[0]}"/><stop offset="1" stop-color="${d.sky[1]}"/></linearGradient>
<linearGradient id="${gid}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(ground, '#ffffff', 0.12)}"/><stop offset="1" stop-color="${mix(ground, '#000000', 0.22)}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#${gid}s)"/>
${d.night ? '' : `<circle cx="300" cy="44" r="20" fill="#fff6cc" opacity=".8"/><g fill="#fff" opacity=".75"><ellipse cx="70" cy="40" rx="26" ry="9"/><ellipse cx="92" cy="34" rx="18" ry="9"/><ellipse cx="220" cy="62" rx="20" ry="7"/></g>`}
${skyline(d)}
<path d="M0 146 Q90 132 180 140 T360 136 V${H} H0Z" fill="url(#${gid}g)"/>
<path d="M0 ${H - 6} H${W}" stroke="${mix(ground, '#000', 0.3)}" stroke-width="12" opacity=".25"/>
${flowers}
${opts.cat ? `<g transform="translate(${W - 74} ${H - 76})">${tekirSVG(70, tulips.length ? 'happy' : 'idle', 'can')}</g>` : ''}
</svg>`;
}

export class GardenScreen {
  readonly el = h('section', { class: 'screen garden' });
  private view: string;
  private unsub: () => void;

  constructor(private paywall: () => void) {
    this.view = store.data.garden;
    this.unsub = store.subscribe(() => this.render());
    this.render();
  }

  destroy(): void {
    this.unsub();
  }

  render(): void {
    const d = store.data;
    const lang = currentLang();
    const premium = isPremium();
    const hours = focusHours();
    let district = DISTRICTS.find((x) => x.id === this.view) ?? DISTRICTS[0];
    if (!districtUnlocked(district, hours, premium)) district = DISTRICTS.find((x) => x.id === d.garden && districtUnlocked(x, hours, premium)) ?? DISTRICTS[0];
    this.view = district.id;

    const counts = new Map<string, number>();
    for (const s of d.sessions) if (s.tulip) counts.set(s.garden ?? 'gulhane', (counts.get(s.garden ?? 'gulhane') ?? 0) + 1);
    const here = d.sessions.filter((s) => s.tulip && (s.garden ?? 'gulhane') === district.id).map((s) => ({ id: s.id, v: VARIETY_BY_ID.get(s.tulip!)! })).filter((x) => x.v);
    const total = d.sessions.filter((s) => s.tulip).length;

    const scene = h('div', { class: `garden-scene ${district.night ? 'night' : ''}`, html: gardenScene(district, here, { cat: true }) });
    if (!here.length) scene.append(h('div', { class: 'garden-empty' }, t('garden.empty')));
    else if (here.length > SLOTS.length) scene.append(h('div', { class: 'garden-more' }, t('garden.more', { n: here.length - SLOTS.length })));

    const active = d.garden === district.id;
    const head = h(
      'div',
      { class: 'garden-head' },
      h('div', { class: 'grow' }, h('div', { class: 'title' }, district.name[lang]), h('div', { class: 'muted small' }, tp('garden.total', here.length))),
      active
        ? h('span', { class: 'badge soft', html: `${ICONS.check}<span>${t('garden.active')}</span>` })
        : h(
            'button',
            {
              class: 'btn btn-teal btn-sm',
              onclick: () => {
                haptic('select');
                audio.tap();
                store.update((x) => {
                  x.garden = district.id;
                });
                toast(t('garden.moved', { name: district.name[lang] }), 'good');
              },
            },
            t('garden.plantHere'),
          ),
    );

    const picker = h(
      'div',
      { class: 'district-row', role: 'listbox' },
      ...DISTRICTS.map((x) => {
        const open = districtUnlocked(x, hours, premium);
        const sel = x.id === district.id;
        const status = open
          ? h('small', {}, num(counts.get(x.id) ?? 0), ' ', h('span', { class: 'ico-xs', html: ICONS.garden }))
          : x.premium
            ? h('small', { class: 'gold', html: `${ICONS.crown}<span>${t('common.premium')}</span>` })
            : h('small', {}, t('garden.unlockAt', { n: x.hours }));
        const prog = !open && !x.premium ? h('div', { class: 'bar mini' }, h('i', { style: `width:${Math.min(100, (hours / x.hours) * 100)}%` })) : null;
        return h(
          'button',
          {
            class: `district ${sel ? 'sel' : ''} ${open ? '' : 'locked'}`,
            'aria-selected': String(sel),
            onclick: () => {
              if (!open) {
                if (x.premium) return this.paywall();
                haptic('warning');
                return toast(t('garden.lockedHours', { n: num(Math.max(0.1, x.hours - hours), 1) }));
              }
              audio.tap();
              this.view = x.id;
              this.render();
            },
          },
          h('span', { class: 'district-sky', style: `background:linear-gradient(${x.sky[0]},${x.sky[1]} 70%,${x.ground} 70%)` }, open ? null : h('span', { class: 'lock', html: ICONS.lock })),
          h('b', {}, x.name[lang]),
          status,
          prog,
        );
      }),
    );

    // Collection album, grouped by rarity.
    const found = VARIETIES.filter((v) => (d.collected[v.id] ?? 0) > 0).length;
    const album = h(
      'div',
      { class: 'card' },
      h('div', { class: 'card-title' }, t('garden.collection'), h('span', { class: 'right' }, t('garden.collected', { n: found, t: VARIETIES.length }))),
      h('div', { class: 'bar' }, h('i', { style: `width:${(found / VARIETIES.length) * 100}%;background:linear-gradient(90deg,var(--gold),var(--primary))` })),
      ...RARITY_ORDER.map((r) =>
        h(
          'div',
          { class: 'album-group' },
          h('div', { class: `album-label r-${r}` }, h('span', { class: `rarity r-${r}` }, t(`rarity.${r[0].toUpperCase()}${r.slice(1)}` as Key)), h('span', { class: 'muted small' }, t('garden.minHint', { min: MIN_FOR[r] }))),
          h('div', { class: 'album' }, ...VARIETIES.filter((v) => v.rarity === r).map((v) => this.albumCard(v, premium))),
        ),
      ),
    );

    const stats = h(
      'div',
      { class: 'garden-stats' },
      h('div', {}, h('b', {}, num(total)), h('small', {}, t('stats.tulips'))),
      h('div', {}, h('b', {}, num(hours, hours < 10 ? 1 : 0)), h('small', {}, t('garden.hours'))),
      h('div', {}, h('b', {}, `${found}/${VARIETIES.length}`), h('small', {}, t('garden.collection'))),
    );

    this.el.replaceChildren(h('div', { class: 'stack' }, h('div', { class: 'card garden-card' }, scene, head), picker, stats, album));
  }

  private albumCard(v: Variety, premium: boolean): HTMLElement {
    const lang = currentLang();
    const n = store.data.collected[v.id] ?? 0;
    const lockedPremium = v.premium && !premium && !n;
    return h(
      'button',
      {
        class: `album-card ${n ? 'have' : 'missing'}`,
        onclick: () => {
          audio.tap();
          if (n) return this.detail(v);
          if (lockedPremium) return this.paywall();
          toast(t('garden.findHint', { min: MIN_FOR[v.rarity] }));
        },
      },
      h('span', { class: 'album-art', html: tulipSVG(v, { size: 54, headOnly: true, silhouette: !n }) }),
      h('span', { class: 'album-name' }, n ? v.name[lang] : '?'),
      n > 1 ? h('span', { class: 'album-count' }, `×${n}`) : null,
      v.premium ? h('span', { class: 'album-crown', html: ICONS.crown }) : null,
    );
  }

  private detail(v: Variety): void {
    const lang = currentLang();
    const sessions = store.data.sessions.filter((s) => s.tulip === v.id);
    const first = sessions[0];
    const n = sessions.length;
    modal(
      h(
        'div',
        { class: 'modal-body center variety-detail' },
        h('div', { class: 'rays' }),
        h('div', { class: 'celebrate-tulip', html: tulipSVG(v, { size: 120, seed: 4 }) }),
        h('h2', {}, v.name[lang]),
        h('span', { class: `rarity r-${v.rarity}` }, t(`rarity.${v.rarity[0].toUpperCase()}${v.rarity.slice(1)}` as Key)),
        h('p', { class: 'muted small' }, tp('garden.count', n)),
        first ? h('p', { class: 'muted small' }, t('garden.first', { date: dateFmt(new Date(first.at), { day: 'numeric', month: 'long', year: 'numeric' }) })) : null,
      ),
      { center: true, className: 'celebrate-card' },
    );
  }
}
