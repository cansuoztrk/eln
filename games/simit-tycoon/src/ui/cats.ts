import * as E from '../core/economy';
import { bizName, t } from '../i18n';
import { game } from '../meta/game';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { catSVG, CATS, coinIcon, ICONS } from './art';
import { h } from './dom';
import { money } from './format';

/** Cat managers tab: hire a cat and its stand runs forever, also offline. */
export class CatsView {
  el: HTMLElement;
  private list: HTMLElement;
  private sig = '';
  private buttons: Array<{ i: number; btn: HTMLButtonElement }> = [];

  constructor(private onHire: (i: number) => void) {
    this.list = h('div', { class: 'cat-list' });
    this.el = h('div', { class: 'tab tab-cats' }, h('div', { class: 'tab-intro' }, h('h2', {}, t('cats.title')), h('p', {}, t('cats.desc'))), this.list);
  }

  render(): void {
    const r = game.run;
    const sig = `${r.stands}|${r.managers.map(Number).join('')}|${r.levels.map((l) => (l > 0 ? 1 : 0)).join('')}`;
    if (sig === this.sig) return this.slowUpdate();
    this.sig = sig;
    this.list.innerHTML = '';
    this.buttons = [];
    for (let i = 0; i < E.N; i++) {
      const b = E.BUSINESSES[i];
      const available = i < r.stands;
      const hired = r.managers[i];
      let action: HTMLElement;
      if (hired) action = h('span', { class: 'tag tag-ok', html: `${ICONS.check}<span>${t('cats.working')}</span>` });
      else if (!available) action = h('span', { class: 'tag tag-lock', html: ICONS.lock });
      else if (r.levels[i] === 0) action = h('span', { class: 'tag tag-muted' }, t('cats.needStand'));
      else {
        const btn = h(
          'button',
          {
            class: 'btn btn-buy small',
            onclick: () => {
              if (game.hire(i)) {
                audio.hire();
                void haptic('success');
                this.onHire(i);
                this.render();
              } else audio.error();
            },
          },
          h('span', {}, t('btn.hire')),
          h('span', { class: 'btn-price', html: `${coinIcon(15)}${money(b.managerCost)}` }),
        ) as HTMLButtonElement;
        this.buttons.push({ i, btn });
        action = btn;
      }
      this.list.append(
        h(
          'div',
          { class: `cat-card ${hired ? 'hired' : ''} ${available ? '' : 'locked'}` },
          h('div', { class: 'cat-portrait', html: catSVG(i, 72, hired ? 'happy' : available ? 'idle' : 'sleep') }),
          h('div', { class: 'cat-info' }, h('div', { class: 'cat-name' }, CATS[i].name, h('span', { class: 'cat-stand' }, bizName(b.id))), h('p', { class: 'cat-line' }, available ? t(`cat.${i}` as never) : '…')),
          action,
        ),
      );
    }
    this.slowUpdate();
  }

  slowUpdate(): void {
    for (const { i, btn } of this.buttons) btn.classList.toggle('ok', game.run.cash >= E.BUSINESSES[i].managerCost);
  }

  /** Any cat hireable right now (for the nav badge). */
  static attention(): boolean {
    const r = game.run;
    for (let i = 0; i < r.stands; i++) if (E.canHire(r, i)) return true;
    return false;
  }
}
