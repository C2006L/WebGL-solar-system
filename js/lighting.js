// ============================================================
// lighting.js — 增强光照系统（v5：平滑明暗过渡 + 物理散射模拟）
// ============================================================
// 设计思路：
//   - 默认：太阳点光源 + 低环境光 → 行星暗面很暗
//   - "开灯"：多方向弱补光 + 半球光增强 + 环境光提升
//     → 模拟大气散射/多次弹射光 → 暗面可见但暗于正面
//     → 明暗过渡区柔和自然，无生硬切割线
//   - 三盏弱补光从不同方位照射，消除单一方向光的硬阴影
//   - 半球光增强提供天-地渐变，模拟真实大气散射
// ============================================================

import * as THREE from "three";

export function createLighting() {
  const ambient = new THREE.AmbientLight("#1a1a2a", 0.3);

  const hemiLight = new THREE.HemisphereLight("#445577", "#2a2015", 0.15);
  hemiLight.name = "HemisphereLight";

  const sunLight = new THREE.PointLight("#fffef5", 280, 0, 1);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.near = 0.15;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.02;
  sunLight.shadow.radius = 6;
  sunLight.name = "SunLight";

  const fillA = new THREE.DirectionalLight("#7788bb", 0.18);
  fillA.position.set(20, 25, 15);
  fillA.visible = false;
  fillA.name = "FillA";

  const fillB = new THREE.DirectionalLight("#8899aa", 0.12);
  fillB.position.set(-18, 10, -12);
  fillB.visible = false;
  fillB.name = "FillB";

  const fillC = new THREE.DirectionalLight("#6677aa", 0.1);
  fillC.position.set(5, -15, 20);
  fillC.visible = false;
  fillC.name = "FillC";

  const boostHemi = new THREE.HemisphereLight("#557799", "#443322", 0.12);
  boostHemi.visible = false;
  boostHemi.name = "BoostHemi";

  const boostAmbient = new THREE.AmbientLight("#1a1a2a", 0.08);
  boostAmbient.visible = false;
  boostAmbient.name = "BoostAmbient";

  return {
    ambient,
    hemiLight,
    sunLight,
    fillA,
    fillB,
    fillC,
    boostHemi,
    boostAmbient,
  };
}

export function toggleFillLight(lights, isOn) {
  lights.fillA.visible = isOn;
  lights.fillB.visible = isOn;
  lights.fillC.visible = isOn;
  lights.boostHemi.visible = isOn;
  lights.boostAmbient.visible = isOn;
  if (isOn) {
    lights.fillA.intensity = 0.48;
    lights.fillB.intensity = 0.34;
    lights.fillC.intensity = 0.26;
    lights.boostHemi.intensity = 0.32;
    lights.boostAmbient.intensity = 0.22;
  } else {
    lights.fillA.intensity = 0.18;
    lights.fillB.intensity = 0.12;
    lights.fillC.intensity = 0.1;
    lights.boostHemi.intensity = 0.12;
    lights.boostAmbient.intensity = 0.08;
  }
}
