/**
 * Owns the render loop: optional bloom/tone-mapping composer and
 * WYSIWYG image capture at an arbitrary resolution (used by exports,
 * comparisons, the archive thumbnails and the report).
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { useView } from '@/core/store/viewStore';

interface CaptureRequest {
  width: number;
  height: number;
  mime: string;
  quality: number;
  resolve: (url: string | null) => void;
}

let pending: CaptureRequest | null = null;

export function requestFrameCapture(width: number, height: number, mime = 'image/jpeg', quality = 0.9): Promise<string | null> {
  return new Promise((resolve) => {
    if (pending) pending.resolve(null);
    pending = { width, height, mime, quality, resolve };
    // safety timeout (e.g. render loop paused)
    setTimeout(() => {
      if (pending && pending.resolve === resolve) {
        pending = null;
        resolve(null);
      }
    }, 4000);
  });
}

export function Renderer({ bloom }: { bloom: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const composer = useMemo(() => {
    if (!bloom) return null;
    const c = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    c.addPass(new RenderPass(scene, camera));
    const bloomFx = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, intensity: 1.05, radius: 0.72 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    c.addPass(new EffectPass(camera, bloomFx, tone));
    return c;
  }, [bloom, gl, scene, camera]);

  useEffect(() => {
    gl.toneMapping = bloom ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.localClippingEnabled = true;
  }, [gl, bloom]);

  useEffect(() => {
    composer?.setSize(size.width, size.height);
    return () => composer?.dispose();
  }, [composer, size.width, size.height]);

  const drawn = useRef(0);
  useFrame((_, dt) => {
    // hidden behind a full-screen overlay: keep the last frame (captures still render)
    if (!pending && drawn.current > 2 && useView.getState().worldCovered > 0) return;
    drawn.current++;
    const render = () => {
      if (composer) composer.render(dt);
      else gl.render(scene, camera);
    };
    render();
    if (pending) {
      const req = pending;
      pending = null;
      try {
        const prev = gl.getSize(new THREE.Vector2());
        const prevDpr = gl.getPixelRatio();
        const prevAspect = camera.aspect;
        gl.setPixelRatio(1);
        gl.setSize(req.width, req.height, false);
        camera.aspect = req.width / req.height;
        camera.updateProjectionMatrix();
        composer?.setSize(req.width, req.height);
        render();
        const url = gl.domElement.toDataURL(req.mime, req.quality);
        gl.setPixelRatio(prevDpr);
        gl.setSize(prev.x, prev.y, false);
        camera.aspect = prevAspect;
        camera.updateProjectionMatrix();
        composer?.setSize(prev.x, prev.y);
        render();
        req.resolve(url);
      } catch {
        req.resolve(null);
      }
    }
  }, 1);

  return null;
}
