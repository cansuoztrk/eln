/**
 * Camera system: Explorer (orbit with bounds), Walkthrough / Seat
 * (first-person look-around with a clamped walk radius), safe fade
 * transitions, cinematic intro, keyboard control and capture poses.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import { useView, type CameraMode } from '@/core/store/viewStore';
import { HOME_POSE, INTRO_START, POIS, POI_BY_ID, type PoiZone } from './pois';
import { fadeOverlay, flushPendingCamera, worldApi, type CameraPose, type Vec3 } from '../worldApi';
import { runtime } from '../runtime';
import { requestFrameCapture } from '../Renderer';
import { layerRegistry } from '../stadium/registry';

const ACTION = CameraControlsImpl.ACTION;
const BOUNDS = new THREE.Box3(new THREE.Vector3(-900, 0, -900), new THREE.Vector3(900, 160, 900));
const FPS_DIST = 0.6;

function configure(c: CameraControlsImpl, mode: CameraMode) {
  if (mode === 'explorer') {
    c.minDistance = 8;
    c.maxDistance = 1900;
    c.minPolarAngle = 0.04;
    c.maxPolarAngle = Math.PI * 0.47;
    c.azimuthRotateSpeed = 1;
    c.polarRotateSpeed = 1;
    c.dollySpeed = 1;
    c.truckSpeed = 1.6;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.right = ACTION.TRUCK;
    c.mouseButtons.middle = ACTION.DOLLY;
    c.mouseButtons.wheel = ACTION.DOLLY;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
    c.touches.three = ACTION.TOUCH_TRUCK;
    c.dollyToCursor = true;
    c.setBoundary(BOUNDS);
    c.minZoom = c.maxZoom = 1;
    c.zoomTo(1, false);
  } else {
    c.minDistance = c.maxDistance = FPS_DIST;
    c.minPolarAngle = Math.PI * 0.22;
    c.maxPolarAngle = Math.PI * 0.8;
    c.azimuthRotateSpeed = -0.32;
    c.polarRotateSpeed = -0.32;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.middle = ACTION.NONE;
    c.mouseButtons.wheel = ACTION.ZOOM;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_ZOOM;
    c.touches.three = ACTION.NONE;
    c.dollyToCursor = false;
    c.minZoom = 0.8;
    c.maxZoom = 2.4;
    c.setBoundary(undefined);
  }
}

let rigOwner: object | null = null;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const set = useView((s) => s.set);
  const mode = useView((s) => s.cameraMode);
  const introPlaying = useView((s) => s.introPlaying);
  const reduced = useView((s) => s.reducedMotion);

  const state = useRef({
    zone: 'aerial' as PoiZone,
    anchor: new THREE.Vector3(),
    radius: 0,
    eyeY: 1.7,
    keys: new Set<string>(),
    saved: null as string | null,
    introStart: 0,
    lastInteraction: 0,
  });

  // apply mode configuration
  useEffect(() => {
    const c = ref.current;
    if (c) configure(c, mode);
  }, [mode]);

  // public API
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    configure(c, useView.getState().cameraMode);
    const st = state.current;

    const apply = (pose: CameraPose, newMode: CameraMode, smooth: boolean) => {
      configure(c, newMode);
      if (newMode === 'explorer') {
        c.setLookAt(...pose.pos, ...pose.target, smooth);
      } else {
        const p = new THREE.Vector3(...pose.pos);
        const dir = new THREE.Vector3(...pose.target).sub(p).normalize();
        const t = p.clone().addScaledVector(dir, FPS_DIST);
        c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, smooth);
        c.zoomTo(1, smooth);
      }
      if (pose.fov) {
        camera.fov = pose.fov;
        camera.updateProjectionMatrix();
      }
    };

    worldApi.flyTo = (pose, opts = {}) => {
      const current = useView.getState().cameraMode;
      const newMode = opts.mode ?? current;
      const reducedMotion = useView.getState().reducedMotion;
      const needFade = opts.fade ?? (newMode !== current || reducedMotion);
      if (newMode !== current) set({ cameraMode: newMode });
      if (newMode === 'explorer') st.zone = 'aerial';
      if (opts.instant) {
        apply(pose, newMode, false);
        return;
      }
      if (needFade) {
        void fadeOverlay(true).then(() => {
          apply(pose, newMode, false);
          void fadeOverlay(false);
        });
      } else apply(pose, newMode, true);
    };

    worldApi.flyToPoi = (id, opts = {}) => {
      const poi = POI_BY_ID[id];
      if (!poi) return;
      const current = useView.getState().cameraMode;
      const openAir = (z: PoiZone) => z === 'outside' || z === 'aerial';
      const smooth =
        !useView.getState().reducedMotion &&
        current === 'walkthrough' &&
        ((openAir(st.zone) && openAir(poi.zone)) || (st.zone === 'bowl' && poi.zone === 'bowl'));
      st.zone = poi.zone;
      st.anchor.set(...poi.pos);
      st.radius = poi.walkRadius;
      st.eyeY = poi.pos[1];
      set({ poi: id, cameraMode: 'walkthrough' });
      if (opts.instant) apply(poi, 'walkthrough', false);
      else if (smooth) apply(poi, 'walkthrough', true);
      else
        void fadeOverlay(true).then(() => {
          apply(poi, 'walkthrough', false);
          void fadeOverlay(false);
        });
    };

    worldApi.resetView = () => {
      st.zone = 'aerial';
      const fade = useView.getState().cameraMode !== 'explorer' || useView.getState().reducedMotion;
      set({ cameraMode: 'explorer', poi: null });
      if (fade)
        void fadeOverlay(true).then(() => {
          apply(HOME_POSE, 'explorer', false);
          void fadeOverlay(false);
        });
      else apply(HOME_POSE, 'explorer', !useView.getState().reducedMotion);
    };

    worldApi.saveView = () => {
      st.saved = JSON.stringify({ controls: c.toJSON(), mode: useView.getState().cameraMode, poi: useView.getState().poi });
    };
    worldApi.restoreView = () => {
      if (!st.saved) return;
      const saved = JSON.parse(st.saved) as { controls: string; mode: CameraMode; poi: string | null };
      configure(c, saved.mode);
      set({ cameraMode: saved.mode, poi: saved.poi });
      c.fromJSON(saved.controls, !useView.getState().reducedMotion);
    };

    worldApi.getPose = () => {
      const p = c.getPosition(new THREE.Vector3());
      const t = c.getTarget(new THREE.Vector3());
      return { pos: p.toArray() as Vec3, target: t.toArray() as Vec3, fov: camera.fov };
    };

    worldApi.fitLayer = (id) => {
      const obj = layerRegistry.get(id);
      if (!obj) return;
      configure(c, 'explorer');
      set({ cameraMode: 'explorer' });
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return;
      void c.fitToBox(box, !useView.getState().reducedMotion, { paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 8 });
    };

    worldApi.layerObject = (id) => layerRegistry.get(id) ?? null;

    worldApi.capture = async (opts = {}) => {
      const view = useView.getState();
      const prevPreview = view.preview;
      const prevLabel = view.previewLabel;
      const prevControls = c.toJSON();
      const prevMode = view.cameraMode;
      const prevFov = camera.fov;
      set({ capturing: true });
      try {
        if (opts.preview !== undefined) view.setPreview(opts.preview, prevLabel || 'capture');
        if (opts.pose) {
          const fps = opts.pose.target && new THREE.Vector3(...opts.pose.pos).distanceTo(new THREE.Vector3(...opts.pose.target)) < 5;
          configure(c, fps ? 'walkthrough' : 'explorer');
          c.setBoundary(undefined);
          c.minDistance = 0.01;
          c.maxDistance = 5000;
          c.setLookAt(...opts.pose.pos, ...opts.pose.target, false);
          c.zoomTo(1, false);
          if (opts.pose.fov) {
            camera.fov = opts.pose.fov;
            camera.updateProjectionMatrix();
          }
          c.update(0);
        }
        await waitFrames(6);
        return await requestFrameCapture(opts.width ?? 1280, opts.height ?? 720, opts.mime ?? 'image/jpeg', opts.quality ?? 0.88);
      } finally {
        if (opts.preview !== undefined) useView.getState().setPreview(prevPreview, prevLabel);
        if (opts.pose) {
          configure(c, prevMode);
          c.fromJSON(prevControls, false);
          camera.fov = prevFov;
          camera.updateProjectionMatrix();
        }
        set({ capturing: false });
      }
    };

    worldApi.ready = true;
    const owner = {};
    rigOwner = owner;
    // a module opened by deep link may have asked for a view before the world existed
    if (!useView.getState().introPlaying) setTimeout(flushPendingCamera, 0);
    return () => {
      // a previous 3D view may unmount after a new one mounted (2D ↔ 3D switch)
      if (rigOwner === owner) worldApi.ready = false;
    };
  }, [camera, set]);

  // start pose + intro
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const v = useView.getState();
    if (v.introPlaying && !v.reducedMotion) {
      c.setLookAt(...INTRO_START.pos, ...INTRO_START.target, false);
      state.current.introStart = performance.now();
      runtime.reveal = 0;
    } else {
      c.setLookAt(...HOME_POSE.pos, ...HOME_POSE.target, false);
      runtime.reveal = 1;
      if (v.introPlaying) set({ introPlaying: false, introSeen: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // skipping the intro jumps to the final pose
  useEffect(() => {
    const c = ref.current;
    if (!c || introPlaying) return;
    if (runtime.reveal < 1) {
      runtime.reveal = 1;
      c.setLookAt(...HOME_POSE.pos, ...HOME_POSE.target, false);
    }
  }, [introPlaying]);

  // keyboard (only when the 3D view has focus)
  useEffect(() => {
    // the focusable wrapper (#world-canvas) owns keyboard input for the 3D view
    const el = document.getElementById('world-canvas') ?? gl.domElement;
    const st = state.current;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', '+', '-', '='].includes(k)) {
        e.preventDefault();
        st.keys.add(k);
      }
      if (k === 'r') worldApi.resetView();
      if (k === 'n' || k === 'p') {
        const idx = POIS.findIndex((p) => p.id === useView.getState().poi);
        const next = POIS[(idx + (k === 'n' ? 1 : POIS.length - 1) + (idx < 0 && k === 'p' ? 1 : 0)) % POIS.length];
        worldApi.flyToPoi(next.id);
      }
      if (k === 'escape' && useView.getState().cameraMode !== 'explorer') worldApi.resetView();
    };
    const up = (e: KeyboardEvent) => st.keys.delete(e.key.toLowerCase());
    const blur = () => st.keys.clear();
    el.addEventListener('keydown', down);
    el.addEventListener('keyup', up);
    el.addEventListener('blur', blur);
    return () => {
      el.removeEventListener('keydown', down);
      el.removeEventListener('keyup', up);
      el.removeEventListener('blur', blur);
    };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const c = ref.current;
    if (!c) return;
    // clamp large frame gaps, but keep walking speed usable on low-fps devices
    const dt = Math.min(0.1, dtRaw);
    const st = state.current;
    const v = useView.getState();

    // cinematic intro
    if (v.introPlaying) {
      const t = Math.min(1, (performance.now() - st.introStart) / 7500);
      const e = easeInOut(t);
      const from = new THREE.Vector3(...INTRO_START.pos);
      const to = new THREE.Vector3(...HOME_POSE.pos);
      const p = from.lerp(to, e);
      p.x += Math.sin(Math.PI * e) * -260;
      const target = new THREE.Vector3(...INTRO_START.target).lerp(new THREE.Vector3(...HOME_POSE.target), e);
      c.setLookAt(p.x, p.y, p.z, target.x, target.y, target.z, false);
      runtime.reveal = Math.min(1, Math.max(0, (t - 0.25) / 0.6));
      if (t >= 1) {
        runtime.reveal = 1;
        set({ introPlaying: false, introSeen: true });
      }
      return;
    }

    // keyboard motion
    const keys = st.keys;
    if (keys.size) {
      if (v.cameraMode === 'explorer') {
        const rot = 1.2 * dt;
        if (keys.has('arrowleft')) c.rotate(rot, 0, true);
        if (keys.has('arrowright')) c.rotate(-rot, 0, true);
        if (keys.has('arrowup')) c.rotate(0, rot * 0.6, true);
        if (keys.has('arrowdown')) c.rotate(0, -rot * 0.6, true);
        const sp = Math.max(20, c.distance * 0.9) * dt;
        if (keys.has('w')) c.forward(sp, true);
        if (keys.has('s')) c.forward(-sp, true);
        if (keys.has('a')) c.truck(-sp, 0, true);
        if (keys.has('d')) c.truck(sp, 0, true);
        if (keys.has('+') || keys.has('=')) c.dolly(sp, true);
        if (keys.has('-')) c.dolly(-sp, true);
      } else {
        const turn = 1.4 * dt;
        if (keys.has('arrowleft')) c.rotate(turn, 0, true);
        if (keys.has('arrowright')) c.rotate(-turn, 0, true);
        if (v.cameraMode === 'walkthrough') {
          const pos = c.getPosition(new THREE.Vector3());
          const tgt = c.getTarget(new THREE.Vector3());
          const fwd = tgt.clone().sub(pos).setY(0).normalize();
          const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
          const step = 3.2 * dt;
          const move = new THREE.Vector3();
          if (keys.has('w') || keys.has('arrowup')) move.addScaledVector(fwd, step);
          if (keys.has('s') || keys.has('arrowdown')) move.addScaledVector(fwd, -step);
          if (keys.has('a')) move.addScaledVector(right, -step);
          if (keys.has('d')) move.addScaledVector(right, step);
          if (move.lengthSq() > 0) {
            const next = pos.clone().add(move);
            const off = next.clone().sub(st.anchor).setY(0);
            if (off.length() > st.radius) off.setLength(st.radius);
            next.set(st.anchor.x + off.x, st.eyeY, st.anchor.z + off.z);
            const delta = next.clone().sub(pos);
            c.setLookAt(next.x, next.y, next.z, tgt.x + delta.x, tgt.y + delta.y, tgt.z + delta.z, false);
          }
        }
        if (keys.has('+') || keys.has('=')) c.zoom(dt, true);
        if (keys.has('-')) c.zoom(-dt, true);
      }
      st.lastInteraction = performance.now();
    }

    // slow orbit on the home screen
    if (v.module === 'home' && v.cameraMode === 'explorer' && !v.reducedMotion && performance.now() - st.lastInteraction > 4000 && !v.capturing) {
      c.rotate(dt * 0.025, 0, false);
    }
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      smoothTime={reduced ? 0.05 : 0.4}
      draggingSmoothTime={0.08}
      onStart={() => {
        state.current.lastInteraction = performance.now();
      }}
    />
  );
}

function waitFrames(n: number) {
  return new Promise<void>((resolve) => {
    let i = 0;
    const step = () => (++i >= n ? resolve() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
}
