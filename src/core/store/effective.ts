import { useDesign } from './designStore';
import { useView } from './viewStore';
import type { DesignConfig } from '../model/design';

/** The configuration currently rendered: a temporary preview, or the user's design. */
export function useEffectiveDesign(): DesignConfig {
  const design = useDesign((s) => s.design);
  const preview = useView((s) => s.preview);
  return preview ?? design;
}

export function getEffectiveDesign(): DesignConfig {
  return useView.getState().preview ?? useDesign.getState().design;
}
