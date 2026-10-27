import { useEffect } from 'react';
import { useView } from '@/core/store/viewStore';

/** While `active`, a full-screen overlay hides the 3D world, so the world keeps its last frame instead of drawing new ones. */
export function useCoverWorld(active: boolean) {
  useEffect(() => {
    if (!active) return;
    useView.setState((s) => ({ worldCovered: s.worldCovered + 1 }));
    return () => useView.setState((s) => ({ worldCovered: Math.max(0, s.worldCovered - 1) }));
  }, [active]);
}
