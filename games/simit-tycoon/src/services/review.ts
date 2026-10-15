import { store } from '../meta/state';
import { isNative, track } from './platform';

/**
 * Store review prompt (SKStoreReviewController / Play In-App Review).
 *
 * Rules (store guidelines + what converts):
 *  - only at happy moments: moving to a new district, a neighbourhood festival
 *  - only for engaged players (2+ districts completed or 1 h played, 2+ sessions)
 *  - at most once every 30 days and 4 times in total
 *  - never preceded by a "do you like the game?" question: Apple disallows
 *    custom review prompts and Google forbids gating the rating card
 * The OS may still decide not to show the dialog; that is expected.
 */
const MIN_GAP_MS = 30 * 86_400_000;
const MAX_ASKS = 4;

export function reviewEligible(now = Date.now()): boolean {
  const d = store.data;
  const engaged = d.district >= 2 || d.stats.playSeconds >= 3600;
  return isNative && engaged && d.stats.sessions >= 2 && d.review.asks < MAX_ASKS && now - d.review.lastAsk > MIN_GAP_MS;
}

export async function maybeAskReview(trigger: 'move' | 'festival'): Promise<void> {
  if (!reviewEligible()) return;
  store.update((d) => {
    d.review.lastAsk = Date.now();
    d.review.asks++;
  });
  track('review_prompt', { trigger });
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    /* not available on this device */
  }
}
