import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA_PRESETS, BODIES } from "./constants.js";

export function initCamera(domElement) {
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    5000,
  );
  const preset = CAMERA_PRESETS.free;
  camera.position.set(...preset.position);
  camera.lookAt(...preset.target);

  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.5;
  controls.maxDistance = 800;
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

let focusState = null;
let forceFollow = false;

const _focusV1 = new THREE.Vector3();
const _focusV2 = new THREE.Vector3();
const _smoothVelPos = new THREE.Vector3();
const _smoothVelTarget = new THREE.Vector3();
const _prevTarget = new THREE.Vector3();

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function smoothDamp(
  current,
  target,
  velocity,
  smoothTime,
  deltaTime,
  maxSpeed,
) {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const changeX = target.x - current.x;
  const changeY = target.y - current.y;
  const changeZ = target.z - current.z;
  const maxChange = maxSpeed * smoothTime;
  const sqrLen = changeX * changeX + changeY * changeY + changeZ * changeZ;
  if (sqrLen > maxChange * maxChange) {
    const mag = Math.sqrt(sqrLen);
    changeX = (changeX / mag) * maxChange;
    changeY = (changeY / mag) * maxChange;
    changeZ = (changeZ / mag) * maxChange;
  }
  const tempX = (velocity.x + omega * changeX) * deltaTime;
  const tempY = (velocity.y + omega * changeY) * deltaTime;
  const tempZ = (velocity.z + omega * changeZ) * deltaTime;
  velocity.x = (velocity.x - omega * tempX) * exp;
  velocity.y = (velocity.y - omega * tempY) * exp;
  velocity.z = (velocity.z - omega * tempZ) * exp;
  current.x += changeX * exp + tempX * (1 - exp);
  current.y += changeY * exp + tempY * (1 - exp);
  current.z += changeZ * exp + tempZ * (1 - exp);
}

export function focusOnBody(camera, controls, bodyRef, bodyKey, isForce = false) {
  if (!bodyRef || !BODIES[bodyKey]) return;

  bodyRef.getWorldPosition(_focusV1);
  const cfg = BODIES[bodyKey];
  const viewDist = Math.max(cfg.size * 5, 2.5);

  focusState = {
    bodyRef,
    bodyKey,
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    progress: 0,
    duration: 1.5,
    transitioning: true,
    smoothTime: cfg.type === "moon" ? 0.35 : 0.25,
    maxSpeed: cfg.type === "moon" ? 8 : 12,
    orbitSpeed: cfg.orbitSpeed || 0,
    viewDist,
  };

  _smoothVelPos.set(0, 0, 0);
  _smoothVelTarget.set(0, 0, 0);
  _prevTarget.copy(_focusV1);

  controls.autoRotate = false;
  forceFollow = isForce;
}

export function setForceFollow(value) {
  forceFollow = value;
}

export function isForceFollow() {
  return forceFollow;
}

export function updateFocusAnimation(camera, controls, delta) {
  if (!focusState) return;

  const clampedDelta = Math.min(delta, 0.05);
  focusState.bodyRef.getWorldPosition(_focusV1);

  const cfg = BODIES[focusState.bodyKey];
  const viewDist = focusState.viewDist || Math.max(cfg.size * 5, 2.5);
  const orbitSpeed = Math.abs(focusState.orbitSpeed);

  const speedFactor = Math.max(1, orbitSpeed / 5);
  const dynamicSmoothTime = focusState.smoothTime * speedFactor;
  const dynamicMaxSpeed = focusState.maxSpeed * (1 + speedFactor * 0.3);

  if (focusState.transitioning) {
    focusState.progress += clampedDelta / focusState.duration;
    if (focusState.progress >= 1) {
      focusState.progress = 1;
      focusState.transitioning = false;
    }

    const t = easeOutCubic(focusState.progress);
    _focusV2.copy(_focusV1).add(
      new THREE.Vector3(viewDist * 0.6, viewDist * 0.45, viewDist * 0.8)
    );
    camera.position.lerpVectors(focusState.startPos, _focusV2, t);
    controls.target.lerpVectors(focusState.startTarget, _focusV1, t);
  } else {
    if (forceFollow) {
      controls.target.copy(_focusV1);
    } else {
      smoothDamp(
        controls.target,
        _focusV1,
        _smoothVelTarget,
        dynamicSmoothTime,
        clampedDelta,
        dynamicMaxSpeed,
      );

      _focusV2.copy(_focusV1).add(
        new THREE.Vector3(viewDist * 0.6, viewDist * 0.45, viewDist * 0.8)
      );
      smoothDamp(
        camera.position,
        _focusV2,
        _smoothVelPos,
        dynamicSmoothTime * 1.2,
        clampedDelta,
        dynamicMaxSpeed * 0.8,
      );

      const distToTarget = camera.position.distanceTo(controls.target);
      if (distToTarget > viewDist * 3) {
        camera.position.lerp(_focusV2, 0.08);
      }
    }
  }
}

export function clearFocus() {
  focusState = null;
  forceFollow = false;
  _smoothVelPos.set(0, 0, 0);
  _smoothVelTarget.set(0, 0, 0);
}

export function getFocusKey() {
  return focusState ? focusState.bodyKey : null;
}