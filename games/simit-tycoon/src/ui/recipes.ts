import * as E from '../core/economy';
import { bizName, t } from '../i18n';
import { game } from '../meta/game';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { coinIcon, FOOD_TINT, foodSVG } from './art';
import { h } from './dom';
import { money } from './format';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV'];

export function recipeTitle(u: E.Upgrade): { title: string; sub: string } {
  const tier = `${t(`recipe.tier.${u.round % 10}` as never)}${u.round >= 10 ? ` ${ROMAN[Math.floor(u.round / 10) + 1]}` : ''}`;
  if (u.target < 0) return { title: `${t('recipe.all')} ${ROMAN[u.round + 1] ?? u.round + 1}`, sub: t('recipe.effectAll') };
  return { title: tier, sub: t('recipe.effect', { biz: bizName(E.BUSINESSES[u.target].id) }) };
}

const FESTIVAL_ART = `<svg viewBox="0 0 100 100" width="58" height="58" aria-hidden="true"><path d="M50 10l9 22 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2z" fill="#ffd23f" stroke="#e09a00" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="78" r="5" fill="#ff7aa2"/><circle cx="82" cy="80" r="4" fill="#3fc1b0"/><circle cx="84" cy="22" r="3.4" fill="#7b61ff"/><circle cx="16" cy="26" r="3" fill="#e8892e"/></svg>`;

/** Recipes tab: the next dozen cash upgrades, cheapest first. */
export class RecipesView {
  el: HTMLElement;
  private list: HTMLElement;
  private allBtn: HTMLButtonElement;
  private sig = '';
  private rows: Array<{ u: E.Upgrade; btn: HTMLButtonElement }> = [];

  constructor(private onBuy: () => void) {
    this.list = h('div', { class: 'recipe-list' });
    this.allBtn = h(
      'button',
      {
        class: 'btn btn-primary small',
        onclick: () => {
          const n = game.buyAllRecipes();
          if (n > 0) {
            audio.recipe();
            void haptic('success');
            this.onBuy();
            this.render();
          } else audio.error();
        },
      },
      t('btn.buyAll'),
    ) as HTMLButtonElement;
    this.el = h('div', { class: 'tab tab-recipes' }, h('div', { class: 'tab-intro row' }, h('div', {}, h('h2', {}, t('recipes.title')), h('p', {}, t('recipes.desc'))), this.allBtn), this.list);
  }

  render(): void {
    const next = E.nextUpgrades(game.run, 12);
    const sig = `${game.run.upgrades.length}|${next.map((u) => u.id).join(',')}|${game.run.levels.map((l) => (l > 0 ? 1 : 0)).join('')}`;
    if (sig === this.sig) return this.slowUpdate();
    this.sig = sig;
    this.list.innerHTML = '';
    this.rows = [];
    if (!next.length) {
      this.list.append(h('p', { class: 'empty' }, t('recipes.none')));
      return;
    }
    for (const u of next) {
      const { title, sub } = recipeTitle(u);
      const id = u.target >= 0 ? E.BUSINESSES[u.target].id : '';
      const tint = id ? FOOD_TINT[id] : ['#fff3c4', '#ffb703'];
      const available = E.upgradeAvailable(game.run, u);
      const btn = h(
        'button',
        {
          class: 'btn btn-buy small',
          disabled: !available,
          onclick: () => {
            if (game.buyRecipe(u.id)) {
              audio.recipe();
              void haptic('success');
              this.onBuy();
              this.render();
            } else audio.error();
          },
        },
        h('span', { class: 'btn-price', html: `${coinIcon(15)}${money(u.cost)}` }),
      ) as HTMLButtonElement;
      this.rows.push({ u, btn });
      this.list.append(
        h(
          'div',
          { class: `recipe-card ${u.target < 0 ? 'festival' : ''} ${available ? '' : 'locked'}` },
          h('div', { class: 'recipe-icon', style: `--t1:${tint[0]};--t2:${tint[1]}`, html: id ? foodSVG(id, 50) : FESTIVAL_ART }, h('span', { class: 'recipe-x3' }, '×3')),
          h('div', { class: 'recipe-info' }, h('div', { class: 'recipe-name' }, title), h('div', { class: 'recipe-sub' }, available ? sub : t('cats.needStand'))),
          btn,
        ),
      );
    }
    this.slowUpdate();
  }

  slowUpdate(): void {
    let any = false;
    for (const { u, btn } of this.rows) {
      const ok = E.upgradeAvailable(game.run, u) && game.run.cash >= u.cost;
      btn.classList.toggle('ok', ok);
      any ||= ok;
    }
    this.allBtn.disabled = !any;
  }

  static attention(): boolean {
    const r = game.run;
    for (const u of E.nextUpgrades(r, 3)) if (E.upgradeAvailable(r, u) && r.cash >= u.cost) return true;
    return false;
  }
}
