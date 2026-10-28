import type * as THREE from 'three';
import type { LayerId } from '@/core/layers';

/** Live references to each layer's root group (used for focus / fit). */
export const layerRegistry = new Map<LayerId, THREE.Object3D | null>();

/** Live references to the selectable parts inside layers (tunnel, gates, museum…). */
export const partRegistry = new Map<string, THREE.Object3D | null>();
