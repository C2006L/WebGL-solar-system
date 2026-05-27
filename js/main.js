// ============================================================
// main.js — 程序主入口（v3：精简 + 统一 switchToPreset）
// ============================================================

import * as THREE from 'three';
import { initCamera, handleResize, switchToPreset } from './camera.js';
import { createLighting } from './lighting.js';
import { createStarField } from './starfield.js';
import { createCelestialBodies } from './celestial-bodies.js';
import { createAllOrbits } from './orbits.js';
import { createAsteroidBelt } from './asteroid-belt.js';
import {
    hideLoading, createViewPresetButtons, createOrbitToggleButton,
    toggleHelp, highlightPresetButton,
} from './ui.js';
import { initInteraction } from './interaction.js';
import { createAnimationLoop } from './loop.js';

// ---- 1. Three.js 三大核心 ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020210);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const { camera, controls } = initCamera(renderer.domElement);

// ---- 2. 灯光 ----
const { ambient, hemiLight, sunLight } = createLighting();
scene.add(ambient);
scene.add(hemiLight);
scene.add(sunLight);

// ---- 3. 星空 ----
scene.add(createStarField());

// ---- 4. 天体模型 ----
const bodyRefs = createCelestialBodies(scene);

// ---- 5. 小行星带 ----
const asteroidBelt = createAsteroidBelt();
scene.add(asteroidBelt);

// ---- 6. 轨道线 ----
const orbitLines = createAllOrbits(bodyRefs);
scene.add(orbitLines);

// ---- 7. 统一的 switchToPreset 包装（唯一入口） ----
function applyPreset(presetKey) {
    const earthPos = (presetKey === 'followEarth' && bodyRefs.earthGroup)
        ? bodyRefs.earthGroup.getWorldPosition(new THREE.Vector3())
        : null;
    switchToPreset(camera, controls, presetKey, earthPos);
    highlightPresetButton(presetKey);
}

// ---- 8. UI 按钮 ----
createViewPresetButtons(applyPreset);
createOrbitToggleButton((visible) => { orbitLines.visible = visible; });

// ---- 9. 交互 ----
initInteraction(camera, renderer, bodyRefs, controls);

// ---- 10. 上下文 & 启动 ----
const clock = new THREE.Clock();
const ctx = {
    scene, camera, renderer, controls, bodyRefs, orbitLines, asteroidBelt,
    clock, toggleHelp, switchToPreset: applyPreset,
};
const loop = createAnimationLoop(ctx);

window.addEventListener('resize', () => handleResize(camera, renderer));
hideLoading();
loop.start();

console.log('Solar System v3 Ready — 8 planets + asteroid belt');
console.log('  ↑/↓: speed | Space: pause | 1-4: camera | R: reset | H: help');