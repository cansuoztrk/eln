import { h } from './dom';

/**
 * Tiny navigation model: four tab roots that stay alive (keeping their scroll
 * position) plus a stack of pushed screens on top. Screens are plain objects
 * with an element and optional refresh/destroy hooks.
 */
export type Tab = 'today' | 'progress' | 'fasting' | 'profile';

export interface View {
  el: HTMLElement;
  /** Re-render from the store (called on every store change while visible). */
  refresh?(): void;
  destroy?(): void;
  /** Show the tab bar (default true for tab roots, false for pushed screens). */
  tabs?: boolean;
  /** Called after the view becomes visible. */
  shown?(): void;
}

export class Router {
  tab: Tab = 'today';
  private roots: Partial<Record<Tab, View>> = {};
  private stack: View[] = [];
  private listeners = new Set<() => void>();

  constructor(
    private host: HTMLElement,
    private factories: Record<Tab, () => View>,
  ) {}

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  get top(): View {
    return this.stack[this.stack.length - 1] ?? this.root(this.tab);
  }

  get depth(): number {
    return this.stack.length;
  }

  private root(tab: Tab): View {
    let v = this.roots[tab];
    if (!v) {
      v = this.factories[tab]();
      v.el.classList.add('view');
      v.el.hidden = true;
      this.host.prepend(v.el);
      this.roots[tab] = v;
    }
    return v;
  }

  go(tab: Tab): void {
    while (this.stack.length) this.popSilently();
    const prev = this.roots[this.tab];
    if (prev && tab !== this.tab) prev.el.hidden = true;
    this.tab = tab;
    const v = this.root(tab);
    v.el.hidden = false;
    v.refresh?.();
    v.shown?.();
    this.emit();
  }

  push(view: View): void {
    view.el.classList.add('view', 'enter');
    if (view.tabs === false || view.tabs === undefined) view.el.classList.add('no-tabs');
    this.host.append(view.el);
    this.stack.push(view);
    view.shown?.();
    this.emit();
  }

  pop(): boolean {
    if (!this.stack.length) return false;
    this.popSilently();
    const v = this.top;
    v.el.classList.remove('enter');
    v.el.classList.add('enter-back');
    setTimeout(() => v.el.classList.remove('enter-back'), 260);
    v.refresh?.();
    this.emit();
    return true;
  }

  private popSilently(): void {
    const v = this.stack.pop();
    if (!v) return;
    v.destroy?.();
    v.el.remove();
  }

  /** Refreshes the visible view only (cheap: other tabs refresh when shown). */
  refresh(): void {
    this.top.refresh?.();
  }

  showsTabs(): boolean {
    const top = this.stack[this.stack.length - 1];
    return !top || top.tabs === true;
  }
}

/** Standard screen header with optional back button and trailing actions. */
export function topbar(title: string, opts: { back?: () => void; sub?: string; actions?: Node[] } = {}): HTMLElement {
  return h(
    'header',
    { class: 'topbar' },
    opts.back ? h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: opts.back, html: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>' }) : null,
    h('div', { style: 'flex:1;min-width:0' }, h('h1', {}, title), opts.sub ? h('div', { class: 'sub' }, opts.sub) : null),
    ...(opts.actions ?? []),
  );
}
