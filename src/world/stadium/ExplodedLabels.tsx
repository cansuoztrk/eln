import { Html } from '@react-three/drei';
import { EXPLODE_OFFSET, LAYER_LABEL, type LayerId } from '@/core/layers';
import { useView } from '@/core/store/viewStore';
import { worldApi } from '../worldApi';
import { PROFILE, bowlPoint } from './geometry';

const ANCHORS: { id: LayerId; d: number; y: number }[] = [
  { id: 'pitch', d: -20, y: 0 },
  { id: 'lowerTier', d: 12, y: 8 },
  { id: 'concourse', d: 36, y: 13 },
  { id: 'upperTier', d: 38, y: 27 },
  { id: 'screens', d: 26, y: 18 },
  { id: 'lighting', d: 8, y: 40 },
  { id: 'structure', d: 30, y: 49 },
  { id: 'roof', d: 40, y: 46 },
  { id: 'solar', d: 34, y: 47 },
  { id: 'facade', d: PROFILE.facadeD + 6, y: 30 },
];

export function ExplodedLabels() {
  const exploded = useView((s) => s.exploded);
  const layers = useView((s) => s.layers);
  const focus = useView((s) => s.focusLayer);
  const set = useView((s) => s.set);
  if (!exploded) return null;
  return (
    <group>
      {ANCHORS.filter((a) => layers[a.id]).map((a, i) => {
        const p = bowlPoint(0.08 + i * 0.012, a.d, a.y + EXPLODE_OFFSET[a.id]);
        return (
          <Html key={a.id} position={[p.x, p.y, p.z]} center zIndexRange={[30, 0]}>
            <button
              type="button"
              className={`explode-label ${focus === a.id ? 'is-active' : ''}`}
              onClick={() => {
                if (focus === a.id) {
                  set({ focusLayer: null });
                  worldApi.restoreView();
                } else {
                  if (!focus) worldApi.saveView();
                  set({ focusLayer: a.id });
                  worldApi.fitLayer(a.id);
                }
              }}
            >
              {LAYER_LABEL[a.id]}
            </button>
          </Html>
        );
      })}
    </group>
  );
}
