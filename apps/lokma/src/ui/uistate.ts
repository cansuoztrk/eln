import { dayKey } from '../core/diary';

/** Ephemeral UI state (not persisted): which diary day is being viewed. */
type Listener = () => void;

class UiState {
  private _day = dayKey();
  private listeners = new Set<Listener>();

  get day(): string {
    return this._day;
  }

  set day(v: string) {
    if (v === this._day) return;
    this._day = v;
    for (const fn of [...this.listeners]) fn();
  }

  get isToday(): boolean {
    return this._day === dayKey();
  }

  /** Called when the app resumes: if midnight passed while viewing "today", follow it. */
  rollover(prevToday: string): void {
    if (this._day === prevToday) this.day = dayKey();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const ui = new UiState();
