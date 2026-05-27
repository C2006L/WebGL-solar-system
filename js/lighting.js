// ============================================================
// lighting.js — 增强光照系统
// ============================================================
// 设计思路：
//   - 点光源绑定在太阳位置，产生物理正确的辐射状光照
//   - 高分辨率阴影贴图 (4096) + 更精确的 bias
//   - 极低环境光：太空中基本无散射，行星暗面接近漆黑
//   - 附加半球光：微弱的天空/地面色差，模拟深空微光
// ============================================================

import * as THREE from 'three';

export function createLighting() {
    // 极低环境光 —— 模拟深空微弱的星光散射
    const ambient = new THREE.AmbientLight('#0a0a18', 0.18);

    // 太阳点光源 —— 物理正确的平方反比衰减
    const sunLight = new THREE.PointLight('#fffef5', 220, 0, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.15;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.02;

    return { ambient, sunLight };
}