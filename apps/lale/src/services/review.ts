import { store } from '../meta/state';
import { isNative, track } from './platform';

/**
 * Store review prompt at a genuinely happy moment: a reached daily goal or
 * an epic tulip, only for students with 10+ completed sessions over 3+ days,
 * at most every 30 days and 4 times in total. No pre-prompt (store rules).
 */
const GAP = 30 * 86_400_000;

export async function maybeAskReview(trigger: 'goal' | 'epic'): Promise<void> {
  const d = store.data;
  const days = new Set(d.sessions.map((s) => new Date(s.at).toDateString())).size;
  if (!isNative || d.sessions.length < 10 || days < 3 || d.review.asks >= 4 || Date.now() - d.review.lastAsk < GAP) return;
  store.update((x) => {
    x.review.asks++;
    x.review.lastAsk = Date.now();
  });
  track('review_prompt', { trigger });
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    /* unavailable */
  }
}
