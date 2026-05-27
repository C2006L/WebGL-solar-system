// ============================================================
// loop.js — 动画主循环（v3：DRY 天体更新 + 复用 Vector3）
// ============================================================

import * as THREE from "three";
import { BODIES, SIM } from "./constants.js";
import { updateSpeedDisplay, updateFPS, highlightPresetButton } from "./ui.js";

/**
 * 天体更新映射：bodyRefs key → BODIES key
 * 加新天体只需在此 map 中添加一行
 */
const BODY_UPDATE_MAP = {
  sun: { body: "sun", orbit: null, type: "self" },
  venus: { body: "venus", orbit: "venusOrbitGroup", type: "both" },
  earth: { body: "earth", orbit: "earthOrbitGroup", type: "both" },
  moon: { body: "moon", orbit: "moonOrbitGroup", type: "both" },
  mars: { body: "mars", orbit: "marsOrbitGroup", type: "both" },
  mercury: { body: "mercury", orbit: "mercuryOrbitGroup", type: "both" },
  jupiter: { body: "jupiter", orbit: "jupiterOrbitGroup", type: "both" },
  saturn: { body: "saturn", orbit: "saturnOrbitGroup", type: "both" },
  uranus: { body: "uranus", orbit: "uranusOrbitGroup", type: "both" },
  neptune: { body: "neptune", orbit: "neptuneOrbitGroup", type: "both" },
};

const PRESET_KEY_MAP = {
  1: "free",
  2: "topDown",
  3: "followEarth",
  4: "sunView",
};

export function createAnimationLoop(ctx) {
  const {
    scene,
    camera,
    renderer,
    controls,
    bodyRefs,
    orbitLines,
    switchToPreset,
  } = ctx;

  let speedMultiplier = SIM.BASE_SPEED;
  const keys = new Set();
  let paused = false;
  let currentPreset = "free";

  let frameCount = 0;
  let lastFpsTime = performance.now();
  let currentFPS = 0;

  // 复用 Vector3，避免每帧 GC alloc
  const _v1 = new THREE.Vector3();
  const _v2 = new THREE.Vector3();

  window.addEventListener("keydown", (e) => {
    keys.add(e.key);

    switch (e.key) {
      case " ":
        e.preventDefault();
        paused = !paused;
        updateSpeedDisplay(paused ? 0 : speedMultiplier);
        break;
      case "r":
      case "R":
        speedMultiplier = SIM.BASE_SPEED;
        paused = false;
        updateSpeedDisplay(speedMultiplier);
        switchToPreset("free");
        currentPreset = "free";
        highlightPresetButton("free");
        break;
      case "o":
      case "O":
        if (orbitLines) orbitLines.visible = !orbitLines.visible;
        break;
      case "h":
      case "H":
        if (ctx.toggleHelp) ctx.toggleHelp();
        break;
      case "1":
      case "2":
      case "3":
      case "4": {
        const pk = PRESET_KEY_MAP[e.key];
        switchToPreset(pk);
        currentPreset = pk;
        highlightPresetButton(pk);
        break;
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
  });

  function animate(timestamp) {
    requestAnimationFrame(animate);

    frameCount++;
    if (timestamp - lastFpsTime >= 1000) {
      currentFPS = Math.round(frameCount / ((timestamp - lastFpsTime) / 1000));
      frameCount = 0;
      lastFpsTime = timestamp;
      updateFPS(currentFPS);
    }

    const rawDelta = ctx.clock ? ctx.clock.getDelta() : 0.016;
    const delta = Math.min(rawDelta, SIM.MAX_DELTA);

    if (!paused) {
      if (keys.has("ArrowUp")) {
        speedMultiplier = Math.min(
          speedMultiplier + SIM.SPEED_STEP * delta,
          SIM.MAX_SPEED,
        );
        updateSpeedDisplay(speedMultiplier);
      }
      if (keys.has("ArrowDown")) {
        speedMultiplier = Math.max(
          speedMultiplier - SIM.SPEED_STEP * delta,
          SIM.MIN_SPEED,
        );
        updateSpeedDisplay(speedMultiplier);
      }
    }

    const activeSpeed = paused ? 0 : speedMultiplier;
    const dt = delta * activeSpeed;

    // ---- DRY 天体运动更新 ----
    for (const [refKey, cfg] of Object.entries(BODY_UPDATE_MAP)) {
      const bodyCfg = BODIES[cfg.body];
      if (!bodyCfg) continue;

      if (cfg.type === "both" || cfg.type === "orbit") {
        const orbitGrp = bodyRefs[cfg.orbit];
        if (orbitGrp) orbitGrp.rotation.y += bodyCfg.orbitSpeed * dt;
      }
      if (cfg.type === "both" || cfg.type === "self") {
        const mesh = bodyRefs[refKey];
        if (mesh) mesh.rotation.y += bodyCfg.selfRotationSpeed * dt;
      }
    }

    // ---- Follow Earth ----
    if (currentPreset === "followEarth" && bodyRefs.earthGroup) {
      bodyRefs.earthGroup.getWorldPosition(_v1);
      controls.target.lerp(_v1, 0.08);
    }

    // ---- 大气着色器动态更新 ----
    if (bodyRefs.earthAtmosphere && bodyRefs.earthGroup) {
      bodyRefs.earthGroup.getWorldPosition(_v2);
      _v1.set(0, 0, 0).sub(_v2);
      bodyRefs.earthAtmosphere.material.uniforms.uSunDirection.value.copy(_v1);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  return { start: () => requestAnimationFrame(animate), keys };
}
