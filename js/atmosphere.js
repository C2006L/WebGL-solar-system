// ============================================================
// atmosphere.js — 行星大气散射着色器（通用）
// ============================================================
// 瑞利散射（Rayleigh）：短波光被大气分子散射（如地球蓝天）
// 米散射（Mie）：气溶胶/水滴散射白光（如金星云雾）
// 晨昏线效果：太阳切向入射，光程极长 → 蓝光散尽剩暖色
// ============================================================

import * as THREE from 'three';

/**
 * 通用行星大气工厂
 *
 * @param {number} planetRadius
 * @param {object} [options]
 * @param {number} [options.thickness=1.04]
 * @param {number[]} [options.rayleigh=[0.16,0.38,0.85]]
 * @param {number[]} [options.mie=[0.78,0.75,0.70]]
 * @param {number[]} [options.termColor=[0.95,0.55,0.20]]
 * @param {number} [options.mieMix=0.55]
 * @param {number} [options.termMix=0.7]
 * @param {number} [options.alpha=0.38]
 * @param {number} [options.alphaTerm=0.12]
 * @param {string} [options.name='Atmosphere']
 * @returns {THREE.Mesh}
 */
export function createPlanetAtmosphere(planetRadius, options = {}) {
  const {
    thickness = 1.04,
    rayleigh = [0.16, 0.38, 0.85],
    mie = [0.78, 0.75, 0.70],
    termColor = [0.95, 0.55, 0.20],
    mieMix = 0.55,
    termMix = 0.7,
    alpha = 0.38,
    alphaTerm = 0.12,
    name = "Atmosphere",
  } = options;

  const geo = new THREE.SphereGeometry(planetRadius * thickness, 64, 64);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: new THREE.Vector3(0, 0, 0) },
      uRayleigh: { value: new THREE.Color(rayleigh[0], rayleigh[1], rayleigh[2]) },
      uMie: { value: new THREE.Color(mie[0], mie[1], mie[2]) },
      uTermColor: { value: new THREE.Color(termColor[0], termColor[1], termColor[2]) },
      uMieMix: { value: mieMix },
      uTermMix: { value: termMix },
      uAlpha: { value: alpha },
      uAlphaTerm: { value: alphaTerm },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      uniform vec3 uSunDirection;
      uniform vec3 uRayleigh;
      uniform vec3 uMie;
      uniform vec3 uTermColor;
      uniform float uMieMix;
      uniform float uTermMix;
      uniform float uAlpha;
      uniform float uAlphaTerm;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPosition);
        vec3 L = normalize(uSunDirection - vWorldPosition);

        float fresnel = 1.0 - abs(dot(V, N));
        fresnel = fresnel * fresnel * fresnel;

        float sunDot = dot(N, L);
        float sunFace = max(sunDot, 0.0);

        float terminator = 1.0 - smoothstep(0.0, 0.18, sunDot + 0.02);

        vec3 baseColor = mix(uRayleigh, uMie, fresnel * uMieMix);
        vec3 color = mix(baseColor, uTermColor, terminator * uTermMix);

        float a = fresnel * uAlpha * sunFace;
        a += terminator * fresnel * uAlphaTerm;

        gl_FragColor = vec4(color, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  mesh.name = name;
  return mesh;
}

// ---- 各行星大气预设 ----

/** 地球：瑞利蓝天 + 米白灰光晕 + 晨昏线橙红 */
export function createEarthAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.04,
    rayleigh: [0.16, 0.38, 0.85],
    mie: [0.78, 0.75, 0.70],
    termColor: [0.95, 0.55, 0.20],
    mieMix: 0.55,
    termMix: 0.7,
    alpha: 0.38,
    alphaTerm: 0.12,
    name: "Earth_Atmosphere",
  });
}

/**
 * 金星：浓厚 CO₂ + 硫酸云 → 无瑞利蓝，纯白黄雾霾
 * 表面从未可见，大气均匀
 */
export function createVenusAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.08,
    rayleigh: [0.88, 0.85, 0.73],
    mie: [0.95, 0.92, 0.82],
    termColor: [0.88, 0.85, 0.73],
    mieMix: 0.65,
    termMix: 0.0,
    alpha: 0.52,
    alphaTerm: 0.0,
    name: "Venus_Atmosphere",
  });
}

/**
 * 木星：气体巨行星 → 极薄氨云边缘雾
 * 可见表面即大气，仅边缘有微量高海拔雾
 */
export function createJupiterAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.018,
    rayleigh: [0.72, 0.58, 0.32],
    mie: [0.85, 0.75, 0.55],
    termColor: [0.82, 0.55, 0.28],
    mieMix: 0.35,
    termMix: 0.2,
    alpha: 0.12,
    alphaTerm: 0.04,
    name: "Jupiter_Atmosphere",
  });
}

/**
 * 土星：气体巨行星 → 极薄氨云边缘雾
 */
export function createSaturnAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.018,
    rayleigh: [0.68, 0.62, 0.44],
    mie: [0.88, 0.82, 0.68],
    termColor: [0.82, 0.55, 0.28],
    mieMix: 0.3,
    termMix: 0.15,
    alpha: 0.1,
    alphaTerm: 0.03,
    name: "Saturn_Atmosphere",
  });
}

/**
 * 天王星：冰巨星 → 极薄甲烷蓝绿边缘雾
 */
export function createUranusAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.022,
    rayleigh: [0.22, 0.52, 0.68],
    mie: [0.62, 0.74, 0.80],
    termColor: [0.32, 0.58, 0.68],
    mieMix: 0.32,
    termMix: 0.15,
    alpha: 0.14,
    alphaTerm: 0.04,
    name: "Uranus_Atmosphere",
  });
}

/**
 * 海王星：冰巨星 → 极薄深蓝甲烷边缘雾
 */
export function createNeptuneAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.022,
    rayleigh: [0.14, 0.24, 0.62],
    mie: [0.42, 0.52, 0.72],
    termColor: [0.22, 0.38, 0.62],
    mieMix: 0.32,
    termMix: 0.18,
    alpha: 0.16,
    alphaTerm: 0.05,
    name: "Neptune_Atmosphere",
  });
}

/**
 * 土卫六泰坦：唯一有浓厚大气的卫星
 * N₂ + CH₄ → 高层蓝紫雾 + 底层橙棕霾
 */
export function createTitanAtmosphere(planetRadius) {
  return createPlanetAtmosphere(planetRadius, {
    thickness: 1.15,
    rayleigh: [0.20, 0.28, 0.58],
    mie: [0.88, 0.58, 0.28],
    termColor: [0.92, 0.42, 0.15],
    mieMix: 0.72,
    termMix: 0.35,
    alpha: 0.48,
    alphaTerm: 0.10,
    name: "Titan_Atmosphere",
  });
}