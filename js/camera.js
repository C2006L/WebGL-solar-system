// ============================================================
// camera.js — 相机系统（v4：平滑聚焦动画 + 标签导航支持）
// ============================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA_PRESETS, BODIES } from "./constants.js";

export function initCamera(domElement) {
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
  );
  const preset = CAMERA_PRESETS.free;
  camera.position.set(...preset.position);
  camera.lookAt(...preset.target);

  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.5;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.target.set(...preset.target);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;
  controls.update();

  return { camera, controls };
}

export function switchToPreset(camera, controls, presetKey, earthPos) {
  const preset = CAMERA_PRESETS[presetKey];
  if (!preset) return;
  controls.autoRotate = presetKey === "free";
  if (preset.isDynamic && earthPos) {
    controls.target.copy(earthPos);
    camera.position.copy(earthPos).add(new THREE.Vector3(...preset.position));
  } else {
    controls.target.set(...preset.target);
    camera.position.set(...preset.position);
  }
  controls.update();
}

export function handleResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---- 平滑聚焦动画系统 ----

let focusState = null;

const _focusV1 = new THREE.Vector3();
const _focusV2 = new THREE.Vector3();

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function focusOnBody(camera, controls, bodyRef, bodyKey) {
  if (!bodyRef || !BODIES[bodyKey]) return;

  focusState = {
    bodyRef,
    bodyKey,
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    progress: 0,
    duration: 1.5,
    transitioning: true,
  };

  controls.autoRotate = false;
}

export function updateFocusAnimation(camera, controls, delta) {
  if (!focusState) return;

  focusState.bodyRef.getWorldPosition(_focusV1);

  const cfg = BODIES[focusState.bodyKey];
  const viewDist = Math.max(cfg.size * 5, 2.5);
  _focusV2
    .copy(_focusV1)
    .add(new THREE.Vector3(viewDist * 0.6, viewDist * 0.45, viewDist * 0.8));

  if (focusState.transitioning) {
    focusState.progress += delta / focusState.duration;
    if (focusState.progress >= 1) {
      focusState.progress = 1;
      focusState.transitioning = false;
    }

    const t = easeOutCubic(focusState.progress);
    camera.position.lerpVectors(focusState.startPos, _focusV2, t);
    controls.target.lerpVectors(focusState.startTarget, _focusV1, t);
  } else {
    camera.position.lerp(_focusV2, 0.03);
    controls.target.lerp(_focusV1, 0.05);
  }
}

export function clearFocus() {
  focusState = null;
}

export function getFocusKey() {
  return focusState ? focusState.bodyKey : null;
}
