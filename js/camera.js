// ============================================================
// camera.js — 相机系统（v3：精简 + 统一 switchToPreset）
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA_PRESETS } from './constants.js';

export function initCamera(domElement) {
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
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
    controls.autoRotate = presetKey === 'free';
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