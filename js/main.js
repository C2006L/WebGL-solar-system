// ============================================================
// main.js — 入口（v17：平滑明暗过渡优化）
// ============================================================

import * as THREE from "three";
import {
  initCamera,
  switchToPreset,
  handleResize,
  focusOnBody,
  clearFocus,
} from "./camera.js";
import { createLighting, toggleFillLight } from "./lighting.js";
import { createCelestialBodies } from "./celestial-bodies.js";
import { createAllOrbits } from "./orbits.js";
import { createStarField } from "./starfield.js";
import { createAsteroidBelt } from "./asteroid-belt.js";
import { createAnimationLoop } from "./loop.js";
import {
  hideLoading,
  createViewPresetButtons,
  createLightToggleButton,
  createLangToggleButton,
  toggleHelp,
  createLabelNavigation,
  highlightLabel,
  clearLabelHighlight,
  updateInfoPanel,
  updateLoadingText,
} from "./ui.js";
import { initInteraction } from "./interaction.js";
import { t } from "./i18n.js";

try {
  // ---- 1. Three.js 核心对象 ----
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000005);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  if (renderer.capabilities.getMaxAnisotropy) {
    renderer.capabilities.getMaxAnisotropy();
  }
  document.body.appendChild(renderer.domElement);

  // 设置加载提示语言
  updateLoadingText();

  const { camera, controls } = initCamera(renderer.domElement);

  // ---- 2. 灯光 ----
  const lights = createLighting();
  scene.add(lights.ambient);
  scene.add(lights.hemiLight);
  scene.add(lights.sunLight);
  scene.add(lights.fillA);
  scene.add(lights.fillB);
  scene.add(lights.fillC);
  scene.add(lights.boostHemi);
  scene.add(lights.boostAmbient);

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
  window._onFocusBody = onFocusBody;

  // ---- 8. 视角预设包装 ----
  function applyPreset(presetKey) {
    switchToPreset(camera, controls, presetKey, null);
    clearFocus();
    clearLabelHighlight();
  }

  // ---- 9. 开灯回调 ----
  function onLightToggle(isOn) {
    toggleFillLight(lights, isOn);
  }

  // ---- 10. UI ----
  createViewPresetButtons(applyPreset);
  createLangToggleButton();
  createLightToggleButton(onLightToggle);
  updateInfoPanel();
  toggleHelp();
  createLabelNavigation(bodyRefs, onFocusBody);

  // ---- 11. 交互 ----
  initInteraction(camera, renderer, bodyRefs, controls, onFocusBody);

  // ---- 12. 用户手动操控时取消聚焦 ----
  controls.addEventListener("start", () => {
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

  console.log("Solar System v17 Ready");
} catch (err) {
  console.error("Solar System init error:", err);
  var el = document.getElementById("loading");
  if (el)
    el.innerHTML = '<p style="color:#ff4444">' + t("loadingError") + "</p>";
}
