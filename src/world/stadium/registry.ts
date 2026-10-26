import type * as THREE from 'three';
import type { LayerId } from '@/core/layers';

/** Live references to each layer's root group (used for focus / fit). */
export const layerRegistry = new Map<LayerId, THREE.Object3D | null>();
