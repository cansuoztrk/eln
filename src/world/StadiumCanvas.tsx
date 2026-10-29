/**
 * The persistent 3D world. Mounted once and shared by every module.
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import './shaderFixes';
import { PerformanceMonitor } from '@react-three/drei';
import { useView } from '@/core/store/viewStore';
import { QUALITY_SETTINGS } from '@/core/quality';
import { Stadium } from './Stadium';
import { Environment, SceneLights } from './environment/Environment';
import { CameraRig } from './camera/CameraRig';
import { LightingDirector } from './LightingDirector';
import { Renderer } from './Renderer';
import { HoverProbe } from './HoverProbe';
import { ViewOffset } from './camera/ViewOffset';
import { HOME_POSE } from './camera/pois';

export default function StadiumCanvas() {
  const quality = useView((s) => s.quality);
  const qualityAuto = useView((s) => s.qualityAuto);
  const set = useView((s) => s.set);
  const toast = useView((s) => s.toast);
  const q = QUALITY_SETTINGS[quality];
  const [dpr, setDpr] = useState(q.dpr[1]);
  const [lost, setLost] = useState(false);
  const down = useRef({ x: 0, y: 0 });

  useEffect(() => setDpr(QUALITY_SETTINGS[quality].dpr[1]), [quality]);

  return (
    <>
      <Canvas
        key={q.antialias ? 'aa' : 'noaa'}
        dpr={dpr}
        gl={{ antialias: q.antialias, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ fov: 48, near: 0.3, far: 9000, position: HOME_POSE.pos }}
        onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
        onPointerMissed={(e) => {
          // a click on empty space (not the end of a drag) clears the Object Inspector
          if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) < 5) set({ selected: null });
        }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setLost(true);
            toast('3D görünüm grafik bağlamını kaybetti. Kalite düşürülerek yeniden deneniyor.', 'warning');
          });
          canvas.addEventListener('webglcontextrestored', () => setLost(false));
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            if (!qualityAuto) return;
            setDpr((d) => Math.max(1, d - 0.25));
            const cur = useView.getState().quality;
            if (cur === 'high') set({ quality: 'medium' });
            else if (cur === 'medium') set({ quality: 'low' });
          }}
          flipflops={3}
        />
        <Suspense fallback={null}>
          <SceneLights />
          <Environment />
          <Stadium />
          <LightingDirector />
          <CameraRig />
          <ViewOffset />
          <HoverProbe />
          <Renderer bloom={q.bloom} />
        </Suspense>
      </Canvas>
      {lost && (
        <div className="world-message" role="alert">
          Grafik bağlamı kayboldu. Sayfayı yenileyebilir veya üst menüden 2D görünüme geçebilirsiniz.
        </div>
      )}
    </>
  );
}
