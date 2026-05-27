// ============================================================
// lighting.js — 增强光照系统（v3：解决暗面全黑 + 均匀照亮）
// ============================================================
// 设计思路：
//   - 参考 OpenGL 固定管线：GL_LIGHT0点光源 + 全局环境光
//   - HemisphereLight：天空色→地面色，提供行星背光面基础亮度和冷暖对比
//   - 较高环境光确保远处行星暗面依然可见
//   - 点光源线性衰减(decay=1)而非平方衰减，让外行星获得足够光照
//   - 保留高分辨率阴影贴图
// ============================================================

import * as THREE from 'three';

export function createLighting() {
    // ---- 环境光：暗面细节可见 ----
    const ambient = new THREE.AmbientLight('#2a2a4a', 0.65);

    // ---- 半球光：天空冷色 + 地面暖色，模拟散射环境照明 ----
    const hemiLight = new THREE.HemisphereLight('#5588cc', '#443322', 0.38);
    hemiLight.name = 'HemisphereLight';

    // ---- 太阳点光源：线性衰减 + 高强度 ----
    const sunLight = new THREE.PointLight('#fffef5', 280, 0, 1);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.15;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.02;
    sunLight.name = 'SunLight';

    return { ambient, hemiLight, sunLight };
}