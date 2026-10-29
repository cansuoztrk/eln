/**
 * Named camera views that frame one part of the building. Design tools use
 * them to show where a choice appears on the model (Material Lab targets,
 * the DNA engine's "show in model" buttons, What-If comparisons).
 * Kept free of three.js so UI chunks can import it cheaply.
 */
import type { CameraPose } from '../worldApi';

export type ViewId = 'facade' | 'roof' | 'roofEdge' | 'structure' | 'plinth' | 'stands' | 'plaza' | 'social' | 'aerial';

export const VIEWS: Record<ViewId, CameraPose> = {
  facade: { pos: [120, 30, 210], target: [0, 22, 80] },
  roof: { pos: [170, 140, 200], target: [0, 40, 0] },
  /** across the bowl at the far roof edge: inner ring and outer crown both in view */
  roofEdge: { pos: [60, 78, 190], target: [0, 36, -40] },
  structure: { pos: [150, 120, -180], target: [0, 40, 0] },
  plinth: { pos: [-150, 18, 200], target: [-40, 2, 100] },
  /** inside the bowl towards the east end: end and corner screens, the LED ribbon and the seat pattern */
  stands: { pos: [-60, 40, 30], target: [90, 24, -5] },
  /** the fan plaza in front of gate A */
  plaza: { pos: [70, 60, 290], target: [0, 2, 165] },
  social: { pos: [-250, 60, 200], target: [-165, 2, 105] },
  aerial: { pos: [250, 135, 330], target: [0, 12, 0] },
};
