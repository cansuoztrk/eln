import * as THREE from 'three';
import { bowlPoint, innerPoint } from './geometry';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Matrix for an element placed at perimeter fraction s, offset d, height y,
 * whose local +z axis points outwards (radially) and +x along the ring.
 * Optional tilt rotates around the tangent (local x) axis.
 */
export function radialMatrix(s: number, d: number, y: number, scale = new THREE.Vector3(1, 1, 1), tilt = 0) {
  const f = innerPoint(s);
  const p = bowlPoint(s, d, y);
  const q = new THREE.Quaternion().setFromAxisAngle(UP, Math.atan2(f.nx, f.nz));
  if (tilt) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt));
  return new THREE.Matrix4().compose(p, q, scale);
}

export function applyInstances(mesh: THREE.InstancedMesh | null, matrices: THREE.Matrix4[]) {
  if (!mesh) return;
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.count = matrices.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.computeBoundingBox();
}
