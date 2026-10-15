import { audio } from '../services/audio';
import { ICONS } from './art';
import { h } from './dom';

/** Stack-based modal system with pop-in animation and Android back support. */
interface Open {
  el: HTMLElement;
  close: () => void;
  dismissable: boolean;
}

const stack: Open[] = [];

function root(): HTMLElement {
  return document.getElementById('modals')!;
}

export interface ModalOptions {
  title?: string;
  className?: string;
  dismissable?: boolean;
  onClose?: () => void;
  /** Hide the close (X) button. */
  noClose?: boolean;
}

export function modal(content: Node, opts: ModalOptions = {}): { el: HTMLElement; close: () => void } {
  const dismissable = opts.dismissable ?? true;
  const card = h('div', { class: `modal-card ${opts.className ?? ''}`, role: 'dialog', 'aria-modal': 'true' });
  if (opts.title) card.append(h('div', { class: 'modal-title' }, opts.title));
  if (!opts.noClose && dismissable) {
    card.append(h('button', { class: 'modal-x', 'aria-label': 'Close', html: ICONS.close, onclick: () => close() }));
  }
  card.append(content);
  const backdrop = h('div', { class: 'modal-backdrop' }, card);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.classList.add('closing');
    const i = stack.findIndex((s) => s.el === backdrop);
    if (i >= 0) stack.splice(i, 1);
    setTimeout(() => backdrop.remove(), 180);
    opts.onClose?.();
  };
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop && dismissable) {
      audio.tap();
      close();
    }
  });
  root().append(backdrop);
  stack.push({ el: backdrop, close, dismissable });
  return { el: card, close };
}

/** Closes the top-most dismissable modal. Returns false if none was open. */
export function closeTop(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  if (top.dismissable) top.close();
  return true;
}

export function closeAll(): void {
  while (stack.length) stack[stack.length - 1].close();
}

export function anyModal(): boolean {
  return stack.length > 0;
}

export function toast(text: string, kind: 'info' | 'good' | 'bad' = 'info'): void {
  const el = h('div', { class: `toast toast-${kind}` }, text);
  document.getElementById('toasts')!.append(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2200);
}

export function confirmDialog(title: string, body: string, ok: string, cancel: string): Promise<boolean> {
  return new Promise((resolve) => {
    let answered = false;
    const m = modal(
      h(
        'div',
        { class: 'modal-body' },
        h('p', { class: 'modal-text' }, body),
        h(
          'div',
          { class: 'modal-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => done(false) }, cancel),
          h('button', { class: 'btn btn-primary', onclick: () => done(true) }, ok),
        ),
      ),
      { title, onClose: () => !answered && resolve(false) },
    );
    function done(v: boolean) {
      answered = true;
      audio.tap();
      m.close();
      resolve(v);
    }
  });
}
