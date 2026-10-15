import { h } from './dom';
import { icon } from './icons';

/**
 * Bottom sheets and centred dialogs with a shared stack, so the Android back
 * button and the backdrop close the top-most one.
 */
interface Open {
  backdrop: HTMLElement;
  close: () => void;
  dismissable: boolean;
}

const stack: Open[] = [];

function host(): HTMLElement {
  return document.getElementById('modals')!;
}

export interface SheetOptions {
  title?: string;
  className?: string;
  dismissable?: boolean;
  onClose?: () => void;
  /** Hide the close button (still dismissable by backdrop unless dismissable=false). */
  noClose?: boolean;
}

export interface Handle {
  el: HTMLElement;
  close: () => void;
}

function open(kind: 'sheet' | 'dialog', content: Node, opts: SheetOptions): Handle {
  const dismissable = opts.dismissable ?? true;
  const card = h('div', { class: `${kind} ${opts.className ?? ''}`, role: 'dialog', 'aria-modal': 'true' });
  if (kind === 'sheet') card.append(h('div', { class: 'grip' }));
  if (opts.title) card.append(h('h2', { class: kind === 'sheet' ? 'sheet-title' : '' }, opts.title));
  if (kind === 'sheet' && !opts.noClose && dismissable) {
    card.append(h('button', { class: 'icon-btn flat close-x', 'aria-label': 'Close', html: icon('close'), onclick: () => close() }));
  }
  card.append(content);
  const backdrop = h('div', { class: `backdrop ${kind === 'dialog' ? 'center' : ''}` }, card);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.classList.add('closing');
    const i = stack.findIndex((s) => s.backdrop === backdrop);
    if (i >= 0) stack.splice(i, 1);
    setTimeout(() => backdrop.remove(), 190);
    opts.onClose?.();
  };
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop && dismissable) close();
  });
  host().append(backdrop);
  stack.push({ backdrop, close, dismissable });
  return { el: card, close };
}

export function sheet(content: Node, opts: SheetOptions = {}): Handle {
  return open('sheet', content, opts);
}

export function dialog(content: Node, opts: SheetOptions = {}): Handle {
  return open('dialog', content, opts);
}

/** Closes the top-most dismissable layer. Returns false if nothing was open. */
export function closeTop(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  if (top.dismissable) top.close();
  return true;
}

export function closeAll(): void {
  while (stack.length) stack[stack.length - 1].close();
}

export function anyOpen(): boolean {
  return stack.length > 0;
}

export function toast(text: string, kind: 'info' | 'good' | 'bad' = 'info', ms = 2200): void {
  const el = h('div', { class: `toast ${kind}`, role: 'status' }, text);
  document.getElementById('toasts')!.append(el);
  setTimeout(() => el.classList.add('out'), ms - 300);
  setTimeout(() => el.remove(), ms);
}

export function confirm(title: string, body: string, ok: string, cancel: string, danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    let answered = false;
    const d = dialog(
      h(
        'div',
        {},
        h('h3', {}, title),
        h('p', {}, body),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn btn-secondary', onclick: () => done(false) }, cancel),
          h('button', { class: `btn ${danger ? 'btn-primary' : 'btn-olive'}`, onclick: () => done(true) }, ok),
        ),
      ),
      { onClose: () => !answered && resolve(false) },
    );
    function done(v: boolean) {
      answered = true;
      d.close();
      resolve(v);
    }
  });
}
