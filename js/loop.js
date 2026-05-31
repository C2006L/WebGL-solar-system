// ============================================================
// loop.js — 动画主循环（v3：DRY 天体更新 + 复用 Vector3）
// ============================================================

import * as THREE from "three";
import { BODIES, SIM } from "./constants.js";
import { updateSpeedDisplay, updateFPS, highlightPresetButton } from "./ui.js";
import { updateFocusAnimation } from "./camera.js";

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
  io: { body: "io", orbit: "ioOrbitGroup", type: "both" },
  europa: { body: "europa", orbit: "europaOrbitGroup", type: "both" },
  ganymede: { body: "ganymede", orbit: "ganymedeOrbitGroup", type: "both" },
  callisto: { body: "callisto", orbit: "callistoOrbitGroup", type: "both" },
  phobos: { body: "phobos", orbit: "phobosOrbitGroup", type: "both" },
  deimos: { body: "deimos", orbit: "deimosOrbitGroup", type: "both" },
  mimas: { body: "mimas", orbit: "mimasOrbitGroup", type: "both" },
  enceladus: { body: "enceladus", orbit: "enceladusOrbitGroup", type: "both" },
  tethys: { body: "tethys", orbit: "tethysOrbitGroup", type: "both" },
  dione: { body: "dione", orbit: "dioneOrbitGroup", type: "both" },
  rhea: { body: "rhea", orbit: "rheaOrbitGroup", type: "both" },
  titan: { body: "titan", orbit: "titanOrbitGroup", type: "both" },
};

const PRESET_KEY_MAP = {
  1: "free",
  2: "topDown",
};

export function createAnimationLoop(ctx) {
  const {
    scene,
    camera,
    renderer,
    controls,
    bodyRefs,
    orbitLines,
    asteroidBelt,
    switchToPreset,
    updateNebulaHover,
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
        if (mesh) {
          const rotScale = SIM.ROTATION_SPEED_SCALE;
          mesh.rotation.y += bodyCfg.selfRotationSpeed * rotScale * dt;
        }
      }
    }

    // ---- 小行星带缓慢旋转 ----
    if (asteroidBelt) {
      asteroidBelt.rotation.y += 0.015 * dt;
    }

    // ---- 大气着色器动态更新（所有行星大气） ----
    const atmoList = [
      bodyRefs.earthAtmosphere,
      bodyRefs.venusAtmosphere,
      bodyRefs.jupiterAtmosphere,
      bodyRefs.saturnAtmosphere,
      bodyRefs.uranusAtmosphere,
      bodyRefs.neptuneAtmosphere,
      bodyRefs.titanAtmosphere,
    ];
    _v1.set(0, 0, 0);
    for (const atmo of atmoList) {
      if (atmo) {
        atmo.material.uniforms.uSunDirection.value.copy(_v1);
      }
    }

    // ---- 地球云层缓慢独立旋转 ----
    if (bodyRefs.earthClouds) {
      bodyRefs.earthClouds.rotation.y += 0.0003 * dt;
    }

    updateFocusAnimation(camera, controls, delta);

    if (updateNebulaHover) updateNebulaHover(camera);

    controls.update();
    renderer.render(scene, camera);
  }

  return { start: () => requestAnimationFrame(animate), keys };
}
