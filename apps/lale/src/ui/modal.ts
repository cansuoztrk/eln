import { audio } from '../services/audio';
import { ICONS } from './art';
import { h } from './dom';

/** Bottom sheets and centred dialogs with an Android-back aware stack. */
interface Open {
  el: HTMLElement;
  close: () => void;
  dismissable: boolean;
}

const stack: Open[] = [];

export interface ModalOptions {
  title?: string;
  className?: string;
  dismissable?: boolean;
  /** Centred dialog instead of a bottom sheet. */
  center?: boolean;
  noClose?: boolean;
  onClose?: () => void;
}

export function modal(content: Node, opts: ModalOptions = {}): { el: HTMLElement; close: () => void } {
  const dismissable = opts.dismissable ?? true;
  const card = h('div', { class: `modal-card ${opts.className ?? ''}`, role: 'dialog', 'aria-modal': 'true' });
  if (opts.title) card.append(h('div', { class: 'modal-title' }, opts.title));
  if (!opts.noClose && dismissable) card.append(h('button', { class: 'modal-x', 'aria-label': 'Close', html: ICONS.close, onclick: () => close() }));
  card.append(content);
  const backdrop = h('div', { class: `modal-backdrop ${opts.center ? 'center' : ''}` }, card);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.classList.add('closing');
    const i = stack.findIndex((s) => s.el === backdrop);
    if (i >= 0) stack.splice(i, 1);
    setTimeout(() => backdrop.remove(), 190);
    opts.onClose?.();
  };
  // Dismiss only on a full press that starts and ends on the backdrop, and not
  // within the first moments: the second tap of a double-tap must not close
  // the sheet the first tap just opened.
  const openedAt = performance.now();
  let downOnBackdrop = false;
  backdrop.addEventListener('pointerdown', (e) => {
    downOnBackdrop = e.target === backdrop && performance.now() - openedAt > 350;
  });
  backdrop.addEventListener('click', (e) => {
    if (downOnBackdrop && e.target === backdrop && dismissable) close();
    downOnBackdrop = false;
  });
  document.getElementById('modals')!.append(backdrop);
  stack.push({ el: backdrop, close, dismissable });
  return { el: card, close };
}

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

export function toast(text: string, kind: 'info' | 'good' = 'info'): void {
  const el = h('div', { class: `toast ${kind}` }, text);
  document.getElementById('toasts')!.append(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2600);
}

export function confirmDialog(title: string, body: string, ok: string, cancel: string, danger = false): Promise<boolean> {
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
          h('button', { class: `btn ${danger ? 'btn-primary' : 'btn-teal'}`, onclick: () => done(true) }, ok),
        ),
      ),
      { title, center: true, onClose: () => !answered && resolve(false) },
    );
    function done(v: boolean) {
      answered = true;
      audio.tap();
      m.close();
      resolve(v);
    }
  });
}
