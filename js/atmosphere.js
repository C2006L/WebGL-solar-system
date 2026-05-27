// ============================================================
// atmosphere.js — 地球大气散射着色器
// ============================================================
// Fresnel 效应模拟瑞利散射：
//   边缘（切线方向）→ 蓝白色（穿过大气层厚）
//   中心（法线方向）→ 透明（穿过的光程短）
// ============================================================

import * as THREE from 'three';

/**
 * 创建地球大气光晕
 * @param {number} planetRadius - 地球半径
 * @returns {THREE.Mesh} 包裹在地球外的半透明大气球壳
 */
export function createEarthAtmosphere(planetRadius) {
    const atmosphereRadius = planetRadius * 1.12;
    const geo = new THREE.SphereGeometry(atmosphereRadius, 64, 64);

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uSunDirection: { value: new THREE.Vector3(0, 0, 0) },
            uAtmosphereColor: { value: new THREE.Color('#4488cc') },
            uGlowColor: { value: new THREE.Color('#88bbff') },
        },
        vertexShader: /* glsl */ `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewDirection;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPos.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewDirection = normalize(-mvPosition.xyz);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /* glsl */ `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewDirection;
            uniform vec3 uSunDirection;
            uniform vec3 uAtmosphereColor;
            uniform vec3 uGlowColor;

            void main() {
                vec3 N = normalize(vWorldNormal);
                vec3 V = normalize(cameraPosition - vWorldPosition);
                // Fresnel: 边缘强，中心弱
                float fresnel = 1.0 - abs(dot(V, N));
                fresnel = pow(fresnel, 2.8);

                // 照亮侧（太阳照射面）更亮
                vec3 L = normalize(uSunDirection - vWorldPosition);
                float sunFace = dot(N, L) * 0.4 + 0.6;

                // 混合两种颜色：瑞利散射蓝（边缘） + 淡蓝光晕
                vec3 color = mix(uAtmosphereColor, uGlowColor, fresnel);
                float alpha = fresnel * 0.45 * sunFace;

                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(geo, mat);
    atmosphere.renderOrder = 1;
    atmosphere.name = 'Earth_Atmosphere';
    return atmosphere;
}