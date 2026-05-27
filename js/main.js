// ============================================================
// main.js — 入口（v16：精简按钮 + 开灯功能）
// ============================================================

import * as THREE from "three";
import { initCamera, switchToPreset, handleResize, focusOnBody, clearFocus } from "./camera.js";
import { createLighting, toggleFillLight } from "./lighting.js";
import { createCelestialBodies } from "./celestial-bodies.js";
import { createAllOrbits } from "./orbits.js";
import { createStarField } from "./starfield.js";
import { createAsteroidBelt } from "./asteroid-belt.js";
import {
  createAnimationLoop,
} from "./loop.js";
import {
  hideLoading,
  createViewPresetButtons,
  createLightToggleButton,
  toggleHelp,
  createLabelNavigation,
  highlightLabel,
  clearLabelHighlight,
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

const { camera, controls } = initCamera(renderer.domElement);

// ---- 2. 灯光 ----
const { ambient, hemiLight, sunLight, fillLight, boostAmbient } = createLighting();
scene.add(ambient);
scene.add(hemiLight);
scene.add(sunLight);
scene.add(fillLight);
scene.add(boostAmbient);

// ---- 3. 星空 ----
scene.add(createStarField());

// ---- 4. 天体模型 ----
const bodyRefs = createCelestialBodies(scene);

// ---- 5. 小行星带 ----
const asteroidBelt = createAsteroidBelt();
scene.add(asteroidBelt);

// ---- 6. 轨道线 ----
const orbitGroup = createAllOrbits(bodyRefs);
scene.add(orbitGroup);

// ---- 7. 聚焦回调（双击 & 标签共用） ----
function onFocusBody(bodyKey) {
  if (bodyKey === null) {
    clearFocus();
    clearLabelHighlight();
    return;
  }
  const mesh = bodyRefs[bodyKey];
  if (!mesh) return;
  focusOnBody(camera, controls, mesh, bodyKey);
  highlightLabel(bodyKey);
}

// ---- 8. 视角预设包装 ----
function applyPreset(presetKey) {
  switchToPreset(camera, controls, presetKey, null);
  clearFocus();
  clearLabelHighlight();
}

// ---- 9. 开灯回调 ----
function onLightToggle(isOn) {
  toggleFillLight(fillLight, boostAmbient, isOn);
}

// ---- 10. UI ----
createViewPresetButtons(applyPreset);
createLightToggleButton(onLightToggle);
toggleHelp();
createLabelNavigation(bodyRefs, onFocusBody);

// ---- 11. 交互 ----
initInteraction(camera, renderer, bodyRefs, controls, onFocusBody);

// ---- 12. 用户手动操控时取消聚焦 ----
controls.addEventListener('start', () => {
  clearFocus();
  clearLabelHighlight();
});

// ---- 13. 启动动画循环 ----
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

console.log('Solar System v16 Ready');

} catch (err) {
  console.error('Solar System init error:', err);
  var el = document.getElementById('loading');
  if (el) el.innerHTML = '<p style="color:#ff4444">Error loading. Press F12 for details.</p>';
}
