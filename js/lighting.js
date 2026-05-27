// ============================================================
// lighting.js — 增强光照系统（v4：开灯功能 + 暗面补光）
// ============================================================
// 设计思路：
//   - 默认状态：太阳点光源 + 低环境光 → 行星暗面很暗
//   - "开灯"状态：增加补光方向光 + 提升环境光 → 暗面可见但仍暗于正面
//   - 补光从斜上方照射，模拟散射环境光，不破坏主光源方向感
// ============================================================

import * as THREE from "three";

export function createLighting() {
  const ambient = new THREE.AmbientLight("#2a2a4a", 0.65);

  const hemiLight = new THREE.HemisphereLight("#5588cc", "#443322", 0.38);
  hemiLight.name = "HemisphereLight";

  const sunLight = new THREE.PointLight("#fffef5", 280, 0, 1);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.near = 0.15;
  sunLight.shadow.camera.far = 180;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.02;
  sunLight.name = "SunLight";

  const fillLight = new THREE.DirectionalLight("#8899cc", 0.6);
  fillLight.position.set(15, 20, 10);
  fillLight.visible = false;
  fillLight.name = "FillLight";

  const boostAmbient = new THREE.AmbientLight("#3a3a5a", 0.35);
  boostAmbient.visible = false;
  boostAmbient.name = "BoostAmbient";

  return { ambient, hemiLight, sunLight, fillLight, boostAmbient };
}

export function toggleFillLight(fillLight, boostAmbient, isOn) {
  fillLight.visible = isOn;
  boostAmbient.visible = isOn;
}
