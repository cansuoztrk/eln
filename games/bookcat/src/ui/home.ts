import { currentLang, num, t } from '../i18n';
import { chapterInfo, CHAPTERS } from '../meta/chapters';
import { dailyDone, dailyStreak, questsAttention } from '../meta/daily';
import { store } from '../meta/state';
import { coinIcon, ICONS, tekirSVG } from './art';
import { h } from './dom';

export interface HomeCallbacks {
  play(): void;
  daily(): void;
  collection(): void;
  quests(): void;
  shop(): void;
  settings(): void;
}

/** Shopfront of Tekir's bookshop: awning, window shelves of book spines, Tekir at the door. */
function shopfrontSVG(sign: string): string {
  const spines = ['#8a2f2a', '#2f6150', '#2b4a7a', '#b0801f', '#62407a', '#2a7176', '#a8582e', '#e7bd5b'];
  const shelf = (y: number, seed: number) => {
    let x = 34;
    let out = '';
    let k = seed;
    while (x < 196) {
      const w = 7 + (k % 4) * 2;
      const hgt = 26 + ((k * 7) % 9);
      const c = spines[k % spines.length];
      const lean = k % 9 === 0 ? ` transform="rotate(8 ${x + w / 2} ${y})"` : '';
      out += `<rect x="${x}" y="${y - hgt}" width="${w}" height="${hgt}" rx="1.5" fill="${c}"${lean}/><rect x="${x + 1.5}" y="${y - hgt + 5}" width="${w - 3}" height="2" fill="#e7bd5b" opacity=".6"/>`;
      x += w + 1.5;
      k = (k * 13 + 5) % 97;
    }
    return out + `<rect x="30" y="${y}" width="170" height="5" fill="#6b4528"/>`;
  };
  const awning = Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 27} 52h27v18q-13.5 10-27 0z" fill="${i % 2 ? '#fff1dc' : '#8a2f2a'}"/>`).join('');
  return `<svg class="shopfront" viewBox="0 0 260 230" aria-hidden="true">
<rect x="6" y="40" width="248" height="190" rx="6" fill="#4a2f19"/>
<rect x="14" y="20" width="232" height="34" rx="6" fill="#2b1a0d"/>
<text x="130" y="44" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="19" fill="#e7bd5b" letter-spacing="1.5" textLength="${Math.min(220, sign.length * 12)}" lengthAdjust="spacingAndGlyphs">${sign}</text>
${awning}
<rect x="24" y="78" width="182" height="140" rx="4" fill="#1f130c"/>
<rect x="28" y="82" width="174" height="132" rx="3" fill="#2b1a0d"/>
${shelf(124, 3)}${shelf(166, 11)}${shelf(208, 29)}
<rect x="24" y="78" width="182" height="140" rx="4" fill="none" stroke="#8a5a33" stroke-width="5"/>
<path d="M30 86l40 0-30 40z" fill="#ffffff10"/>
<rect x="210" y="96" width="38" height="122" rx="4" fill="#6b4528" stroke="#8a5a33" stroke-width="3"/>
<circle cx="240" cy="160" r="3" fill="#e7bd5b"/>
<rect x="215" y="102" width="28" height="40" rx="3" fill="#ffd98a" opacity=".55"/>
<ellipse cx="130" cy="226" rx="120" ry="6" fill="#0006"/>
</svg>`;
}

export class HomeScreen {
  readonly el: HTMLElement;
  private unsub: () => void;

  constructor(private cb: HomeCallbacks) {
    this.el = h('section', { class: 'screen home' });
    this.render();
    this.unsub = store.subscribe(() => this.render());
  }

  destroy(): void {
    this.unsub();
  }

  private render(): void {
    const d = store.data;
    const level = d.level;
    const info = chapterInfo(level);
    const streak = dailyStreak();
    const attn = questsAttention();
    const resume = d.runs.journey?.key === `L${level}`;
    const progress = h('div', { class: 'chapter-bar' }, h('i', { style: `width:${(info.done / info.total) * 100}%` }));
    this.el.replaceChildren(
      h(
        'header',
        { class: 'home-top' },
        h('button', { class: 'pill coins', 'aria-label': t('home.shop'), onclick: () => this.cb.shop(), html: `${coinIcon(26)}<b>${num(d.coins)}</b><span class="plus">+</span>` }),
        streak > 0 ? h('div', { class: 'pill streak', html: `${ICONS.flame}<b>${streak}</b>` }) : h('span', { class: 'spacer' }),
        h('button', { class: 'icon-btn', 'aria-label': t('home.settings'), html: ICONS.settings, onclick: () => this.cb.settings() }),
      ),
      h(
        'div',
        { class: 'brand' },
        h('h1', {}, t('app.name')),
        h('p', {}, t('app.sub')),
      ),
      h('div', { class: 'storefront' }, h('div', { html: shopfrontSVG(`SAHAF · ${t('app.name').toLocaleUpperCase(currentLang())}`) }), h('div', { class: 'home-cat', html: tekirSVG(116, 'idle') })),
      h(
        'div',
        { class: 'play-card' },
        h('button', { class: 'btn btn-green btn-play', onclick: () => this.cb.play(), html: `${ICONS.play}<span>${resume ? t('home.resume', { n: level }) : t('home.level', { n: level })}</span>` }),
        h('div', { class: 'chapter-line' }, h('span', {}, t('home.chapter', { name: info.chapter.name, done: info.done, total: info.total })), progress),
      ),
      h(
        'nav',
        { class: 'home-grid' },
        this.tile(ICONS.calendar, t('home.daily'), dailyDone() ? t('home.dailyDone') : '', () => this.cb.daily(), !dailyDone()),
        this.tile(ICONS.books, t('home.collection'), `${d.books.filter((i) => i < CHAPTERS.length).length}/${CHAPTERS.length}`, () => this.cb.collection(), false),
        this.tile(ICONS.trophy, t('home.quests'), '', () => this.cb.quests(), attn > 0, attn),
        this.tile(ICONS.shop, t('home.shop'), '', () => this.cb.shop(), false),
      ),
      h('footer', { class: 'home-foot' }, 'Tekir Studios'),
    );
  }

  private tile(icon: string, label: string, sub: string, onclick: () => void, attention: boolean, badge = 0): HTMLElement {
    return h(
      'button',
      { class: `tile ${attention ? 'attn' : ''}`, onclick },
      h('span', { class: 'tile-ico', html: icon }),
      h('b', {}, label),
      sub ? h('small', {}, sub) : null,
      badge > 0 ? h('span', { class: 'badge' }, String(badge)) : attention ? h('span', { class: 'dot' }) : null,
    );
  }
}
