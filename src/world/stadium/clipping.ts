import * as THREE from 'three';
import { useView } from '@/core/store/viewStore';

/** Section planes: long = cut along z=0 (keeps +z half), short = cut along x=0 (keeps +x half). */
export const SECTION_PLANES = {
  long: [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)],
  short: [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)],
  off: [] as THREE.Plane[],
};

export function useClipping(): THREE.Plane[] {
  const section = useView((s) => s.section);
  return SECTION_PLANES[section];
}
