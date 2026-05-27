// ============================================================
// celestial-bodies.js — 天体模型创建（v3：全 8 行星 + 倾角 + 环）
// ============================================================

import * as THREE from 'three';
import { BODIES } from './constants.js';
import {
    createSunMaps,
    createEarthMaps,
    createMoonMaps,
    createMarsMaps,
    createVenusMaps,
    createMercuryMaps,
    createJupiterMaps,
    createSaturnMaps,
    createUranusMaps,
    createNeptuneMaps,
} from './textures.js';
import { createEarthAtmosphere } from './atmosphere.js';

function degToRad(deg) {
    return deg * Math.PI / 180;
}

// ---- 太阳 ----
function createSun() {
    const cfg = BODIES.sun;
    const maps = createSunMaps(2048);
    const geo = new THREE.SphereGeometry(cfg.size, 128, 128);
    const mat = new THREE.MeshBasicMaterial({ map: maps.map });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = cfg.name;

    const innerGlowGeo = new THREE.SphereGeometry(cfg.size * 1.18, 64, 64);
    const innerGlowMat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color('#ff8800') } },
        vertexShader: /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vPosition = wp.xyz;
                vNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uColor;
            void main() {
                vec3 V = normalize(cameraPosition - vPosition);
                float f = 1.0 - abs(dot(V, normalize(vNormal)));
                float alpha = pow(f, 4.5) * 0.35;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);

    const outerGlowGeo = new THREE.SphereGeometry(cfg.size * 1.35, 48, 48);
    const outerGlowMat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color('#ffcc44') } },
        vertexShader: /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vPosition = wp.xyz;
                vNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uColor;
            void main() {
                vec3 V = normalize(cameraPosition - vPosition);
                float f = 1.0 - abs(dot(V, normalize(vNormal)));
                float alpha = pow(f, 6.0) * 0.18;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);

    return { mesh, innerGlow, outerGlow };
}

// ---- 土星环 ----
function createSaturnRing(planetSize) {
    const innerR = planetSize * 1.4;
    const outerR = planetSize * 2.35;
    const geo = new THREE.RingGeometry(innerR, outerR, 128);
    geo.rotateX(-Math.PI / 2);

    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 64;
    const rctx = ringCanvas.getContext('2d');
    const ringGrad = rctx.createLinearGradient(0, 0, 512, 0);
    ringGrad.addColorStop(0, 'rgba(210, 190, 150, 0.3)');
    ringGrad.addColorStop(0.15, 'rgba(240, 220, 180, 0.85)');
    ringGrad.addColorStop(0.3, 'rgba(200, 180, 140, 0.7)');
    ringGrad.addColorStop(0.45, 'rgba(255, 235, 200, 0.9)');
    ringGrad.addColorStop(0.55, 'rgba(220, 200, 160, 0.6)');
    ringGrad.addColorStop(0.7, 'rgba(240, 220, 180, 0.75)');
    ringGrad.addColorStop(0.85, 'rgba(180, 160, 120, 0.4)');
    ringGrad.addColorStop(1, 'rgba(150, 130, 100, 0.1)');
    rctx.fillStyle = ringGrad;
    rctx.fillRect(0, 0, 512, 64);

    const ringTex = new THREE.Texture(ringCanvas);
    ringTex.colorSpace = THREE.SRGBColorSpace;
    ringTex.wrapS = THREE.RepeatWrapping;
    ringTex.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        roughness: 0.75,
        metalness: 0.05,
        transparent: true,
        opacity: 0.85,
        depthWrite: true,
    });

    const ring = new THREE.Mesh(geo, mat);
    ring.castShadow = true;
    ring.receiveShadow = true;
    ring.name = 'Saturn_Ring';
    return ring;
}

// ---- 通用行星 ----
function createPlanet(bodyKey, mapsFn, materialOpts = {}, bumpScaleVal = 0.02) {
    const cfg = BODIES[bodyKey];
    const maps = mapsFn(2048);
    const geo = new THREE.SphereGeometry(cfg.size, 96, 96);
    const mat = new THREE.MeshStandardMaterial({
        map: maps.map,
        bumpMap: maps.bumpMap,
        bumpScale: bumpScaleVal,
        roughness: 0.7,
        metalness: 0.03,
        ...materialOpts,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = cfg.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.rotation.order = 'YXZ';
    mesh.rotation.x = degToRad(cfg.axialTilt);

    const bodyGroup = new THREE.Object3D();
    bodyGroup.position.x = cfg.orbitRadius;
    bodyGroup.add(mesh);
    bodyGroup.name = cfg.name + '_Group';

    const orbitGroup = new THREE.Object3D();
    orbitGroup.add(bodyGroup);
    orbitGroup.name = cfg.name + '_Orbit';

    const inclinationGroup = new THREE.Object3D();
    inclinationGroup.rotation.x = degToRad(cfg.orbitalIncl);
    inclinationGroup.add(orbitGroup);
    inclinationGroup.name = cfg.name + '_Incl';

    const extras = {};

    if (bodyKey === 'saturn') {
        const ring = createSaturnRing(cfg.size);
        mesh.add(ring);
        extras.ring = ring;
    }

    return { inclinationGroup, orbitGroup, bodyGroup, mesh, extras };
}

// ---- 月球 ----
function createMoon(earthGroup) {
    const cfg = BODIES.moon;
    const maps = createMoonMaps(2048);
    const geo = new THREE.SphereGeometry(cfg.size, 96, 96);
    const mat = new THREE.MeshStandardMaterial({
        map: maps.map,
        bumpMap: maps.bumpMap,
        bumpScale: 0.03,
        roughness: 0.88,
        metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = cfg.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.x = cfg.orbitRadius;

    mesh.rotation.order = 'YXZ';
    mesh.rotation.x = degToRad(cfg.axialTilt);

    const orbitGroup = new THREE.Object3D();
    orbitGroup.add(mesh);
    orbitGroup.name = cfg.name + '_Orbit';
    earthGroup.add(orbitGroup);
    return { orbitGroup, mesh };
}

// ---- 主入口 ----
export function createCelestialBodies(scene) {
    const refs = {};

    const sun = createSun();
    scene.add(sun.mesh);
    scene.add(sun.innerGlow);
    scene.add(sun.outerGlow);
    refs.sun = sun.mesh;
    refs.sunInnerGlow = sun.innerGlow;
    refs.sunOuterGlow = sun.outerGlow;
    refs.sunOrbitRadius = 0;

    // 水星
    const mercury = createPlanet('mercury', createMercuryMaps, { roughness: 0.72 }, 0.022);
    scene.add(mercury.inclinationGroup);
    refs.mercuryOrbitGroup = mercury.orbitGroup;
    refs.mercury = mercury.mesh;
    refs.mercuryOrbitRadius = BODIES.mercury.orbitRadius;

    // 金星
    const venus = createPlanet('venus', createVenusMaps, { roughness: 0.6 }, 0.008);
    scene.add(venus.inclinationGroup);
    refs.venusOrbitGroup = venus.orbitGroup;
    refs.venus = venus.mesh;
    refs.venusOrbitRadius = BODIES.venus.orbitRadius;

    // 地球
    const earth = createPlanet('earth', createEarthMaps, {}, 0.025);
    scene.add(earth.inclinationGroup);
    refs.earthOrbitGroup = earth.orbitGroup;
    refs.earthGroup = earth.bodyGroup;
    refs.earth = earth.mesh;
    refs.earthOrbitRadius = BODIES.earth.orbitRadius;

    const atmosphere = createEarthAtmosphere(BODIES.earth.size);
    earth.bodyGroup.add(atmosphere);
    refs.earthAtmosphere = atmosphere;

    // 月球
    const moon = createMoon(earth.bodyGroup);
    refs.moonOrbitGroup = moon.orbitGroup;
    refs.moon = moon.mesh;
    refs.moonOrbitRadius = BODIES.moon.orbitRadius;

    // 火星
    const mars = createPlanet('mars', createMarsMaps, { roughness: 0.78 }, 0.018);
    scene.add(mars.inclinationGroup);
    refs.marsOrbitGroup = mars.orbitGroup;
    refs.mars = mars.mesh;
    refs.marsOrbitRadius = BODIES.mars.orbitRadius;

    // 木星
    const jupiter = createPlanet('jupiter', createJupiterMaps, { roughness: 0.55 }, 0.012);
    scene.add(jupiter.inclinationGroup);
    refs.jupiterOrbitGroup = jupiter.orbitGroup;
    refs.jupiter = jupiter.mesh;
    refs.jupiterOrbitRadius = BODIES.jupiter.orbitRadius;

    // 土星
    const saturn = createPlanet('saturn', createSaturnMaps, { roughness: 0.65 }, 0.010);
    scene.add(saturn.inclinationGroup);
    refs.saturnOrbitGroup = saturn.orbitGroup;
    refs.saturn = saturn.mesh;
    refs.saturnOrbitRadius = BODIES.saturn.orbitRadius;
    refs.saturnRing = saturn.extras.ring;

    // 天王星
    const uranus = createPlanet('uranus', createUranusMaps, { roughness: 0.6 }, 0.008);
    scene.add(uranus.inclinationGroup);
    refs.uranusOrbitGroup = uranus.orbitGroup;
    refs.uranus = uranus.mesh;
    refs.uranusOrbitRadius = BODIES.uranus.orbitRadius;

    // 海王星
    const neptune = createPlanet('neptune', createNeptuneMaps, { roughness: 0.58 }, 0.010);
    scene.add(neptune.inclinationGroup);
    refs.neptuneOrbitGroup = neptune.orbitGroup;
    refs.neptune = neptune.mesh;
    refs.neptuneOrbitRadius = BODIES.neptune.orbitRadius;

    return refs;
}