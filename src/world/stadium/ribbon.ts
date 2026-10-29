import * as THREE from 'three';

/** Flat ribbon along a polyline (on the ground). */
export function ribbonGeometry(points: THREE.Vector3[], width: number, y = 0.08) {
  const pos: number[] = [];
  const idx: number[] = [];
  const uv: number[] = [];
  let acc = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
    const n = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);
    if (i > 0) acc += p.distanceTo(points[i - 1]);
    pos.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
    uv.push(acc / 10, 0, acc / 10, 1);
    if (i < points.length - 1) {
      const k = i * 2;
      // counter-clockwise seen from above: the ribbon faces up (it used to face down and was culled)
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
