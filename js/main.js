// ============================================================
// main.js — 入口（v13.2：修复所有模块接口）
// ============================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { initCamera } from "./camera.js";
import { createLighting } from "./lighting.js";
import { createCelestialBodies } from "./celestial-bodies.js";
import { createAllOrbits } from "./orbits.js";
import { createStarfield } from "./starfield.js";
import { createAsteroidBelt } from "./asteroid-belt.js";
import {
  createAnimationLoop,
  applyPreset,
  handleResize,
} from "./loop.js";
import {
  hideLoading,
  createViewPresetButtons,
  toggleHelp,
} from "./ui.js";
import { initInteraction } from "./interaction.js";

try {

// ---- 1. Three.js 核心对象 ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020210);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const camera = initCamera(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

// ---- 2. 灯光 ----
const { ambient, hemiLight, sunLight } = createLighting();
scene.add(ambient);
scene.add(hemiLight);
scene.add(sunLight);

// ---- 3. 星空 ----
scene.add(createStarfield());

// ---- 4. 天体模型 ----
const bodyRefs = createCelestialBodies(scene);

// ---- 5. 小行星带 ----
const asteroidBelt = createAsteroidBelt();
scene.add(asteroidBelt);

// ---- 6. 轨道线 ----
const orbitGroup = createAllOrbits(bodyRefs);
scene.add(orbitGroup);

// ---- 7. UI 按钮 ----
createViewPresetButtons(applyPreset);
toggleHelp();

// ---- 8. 交互 ----
initInteraction(camera, renderer, bodyRefs, controls);

// ---- 9. 启动动画循环 ----
const clock = new THREE.Clock();
const ctx = {
  scene,
  camera,
  renderer,
  controls,
  bodyRefs,
  orbitLines: orbitGroup,
  asteroidBelt,
  clock,
  toggleHelp,
  switchToPreset: applyPreset,
};
const loop = createAnimationLoop(ctx);

window.addEventListener("resize", () => handleResize(camera, renderer));
hideLoading();
loop.start();

console.log('Solar System v13 Ready');
console.log('  ↑/↓: speed | Space: pause | 1-4: camera | R: reset | H: help | O: orbits');

} catch (err) {
  console.error('Solar System init error:', err);
  var el = document.getElementById('loading');
  if (el) el.innerHTML = '<p style="color:#ff4444">Error loading. Press F12 → Console for details.</p>';
}

window.addEventListener('error', function(e) { console.error('Global error:', e.error); });
