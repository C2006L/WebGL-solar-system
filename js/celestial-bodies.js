// ============================================================
// celestial-bodies.js — v22：火星/土星卫星 + 修复行星材质
// ============================================================

import * as THREE from "three";
import { BODIES } from "./constants.js";
import {
  createSunMaps,
  createEarthMaps,
  createEarthCloudMap,
  createMoonMaps,
  createMarsMaps,
  createVenusMaps,
  createMercuryMaps,
  createJupiterMaps,
  createSaturnMaps,
  createUranusMaps,
  createNeptuneMaps,
  createIoMaps,
  createEuropaMaps,
  createGanymedeMaps,
  createCallistoMaps,
  createPhobosMaps,
  createDeimosMaps,
  createMimasMaps,
  createEnceladusMaps,
  createTethysMaps,
  createDioneMaps,
  createRheaMaps,
  createTitanMaps,
} from "./textures.js";
import {
  createEarthAtmosphere,
  createVenusAtmosphere,
  createJupiterAtmosphere,
  createSaturnAtmosphere,
  createUranusAtmosphere,
  createNeptuneAtmosphere,
  createTitanAtmosphere,
} from "./atmosphere.js";

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function sunCorona(cfg, radiusMult, colorHex, power, alpha) {
  const geo = new THREE.SphereGeometry(cfg.size * radiusMult, 64, 64);
  const n = Math.max(1, Math.round(power));
  let powExpr = "f";
  for (let i = 1; i < n; i++) powExpr += "*f";
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(colorHex) } },
    vertexShader: `varying vec3 vN; varying vec3 vP; void main() { vec4 wp = modelMatrix*vec4(position,1.0); vP=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:
      `varying vec3 vN; varying vec3 vP; uniform vec3 uColor; void main() { vec3 V=normalize(cameraPosition-vP); float f=1.0-abs(dot(V,normalize(vN))); float ff=` +
      powExpr +
      `; gl_FragColor=vec4(uColor,ff*` +
      alpha +
      `); }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function createSun() {
  const cfg = BODIES.sun;
  const maps = createSunMaps();
  const geo = new THREE.SphereGeometry(cfg.size, 192, 96);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: maps.map,
      emissiveMap: maps.map,
      emissive: new THREE.Color(1.0, 0.7, 0.1),
      emissiveIntensity: 2.0,
      roughness: 1.0,
      metalness: 0.0,
    }),
  );
  mesh.name = cfg.name;
  const innerGlow = sunCorona(cfg, 1.08, "#ff8800", 5.0, 0.45);
  const outerGlow = sunCorona(cfg, 1.18, "#ffcc44", 6.8, 0.25);
  return { mesh, innerGlow, outerGlow };
}

// ============================================================
// 科学级行星环系统（基于 NASA / 旅行者2号 / 卡西尼号数据）
// ============================================================
// 关键改进：
//   1. alphaTest 替代 transparent → 消除 RingGeometry 侧面厚度感
//   2. 1D 径向纹理（height=1）像素级精确绘制环结构
//   3. 土星环：D/C/B/A/F 环 + 卡西尼缝隙 + 恩克缝隙
//   4. 天王星环：13 条不等宽（ε 环最宽最亮）
//   5. 木星环：极暗弥散红褐色尘埃
// ============================================================

function putRadialPixel(imgData, px, r, g, b, a) {
  const i = px * 4;
  imgData.data[i] = r;
  imgData.data[i + 1] = g;
  imgData.data[i + 2] = b;
  imgData.data[i + 3] = a;
}

function makeRingTexture(width, fillFn) {
  const rc = document.createElement("canvas");
  rc.width = width;
  rc.height = 1;
  const rctx = rc.getContext("2d");
  const imgData = rctx.createImageData(width, 1);
  fillFn(imgData, width);
  rctx.putImageData(imgData, 0, 0);
  const tex = new THREE.Texture(rc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

/** 木星环：极暗弥散尘埃 */
function createJupiterRing(planetSize) {
  const innerR = planetSize * 1.72;
  const outerR = planetSize * 1.82;
  const geo = new THREE.RingGeometry(innerR, outerR, 128, 64);
  geo.rotateX(-Math.PI / 2);

  const tex = makeRingTexture(512, (imgData, w) => {
    for (let px = 0; px < w; px++) {
      const t = px / (w - 1);
      const r_Rs = 1.72 + t * (1.82 - 1.72);
      let a = 0;

      if (r_Rs < 1.74) {
        a = 0.04 + Math.random() * 0.03;
      } else if (r_Rs < 1.8) {
        a = 0.07 + Math.random() * 0.04;
      } else {
        a = 0.04 + Math.random() * 0.03;
      }

      const base = 170 + Math.floor(Math.random() * 25);
      putRadialPixel(
        imgData,
        px,
        base,
        base - 10,
        base - 20,
        Math.floor(a * 255),
      );
    }
  });

  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      color: new THREE.Color(0xc8b8a8),
      map: tex,
      alphaMap: tex,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.renderOrder = 1;
  ring.name = "Jupiter_Ring";
  return ring;
}

/** 土星环：真实 NASA 纹理 + Lambert 光照（暗面可见） */
function createSaturnRing(planetSize) {
  const innerR = planetSize * 1.11;
  const outerR = planetSize * 2.34;
  const geo = new THREE.RingGeometry(innerR, outerR, 384, 192);
  geo.rotateX(-Math.PI / 2);

  const loader = new THREE.TextureLoader();
  const alphaMap = loader.load("./textures/2k_saturn_ring_alpha.png");
  alphaMap.colorSpace = THREE.SRGBColorSpace;
  alphaMap.anisotropy = 16;

  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      color: new THREE.Color(0xf0e4d0),
      alphaMap: alphaMap,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.renderOrder = 1;
  ring.name = "Saturn_Ring";
  return ring;
}

/** 天王星环：旅行者2号数据，13 条不等宽 */
function createUranusRing(planetSize) {
  const innerR = planetSize * 1.55;
  const outerR = planetSize * 2.15;
  // 增加 radialSegments=96 消除条纹
  const geo = new THREE.RingGeometry(innerR, outerR, 192, 96);
  geo.rotateX(-Math.PI / 2);

  const rings = [
    { c: 1.57, w: 0.006, a: 0.25 },
    { c: 1.595, w: 0.006, a: 0.22 },
    { c: 1.62, w: 0.008, a: 0.3 },
    { c: 1.645, w: 0.006, a: 0.26 },
    { c: 1.67, w: 0.008, a: 0.28 },
    { c: 1.695, w: 0.006, a: 0.22 },
    { c: 1.72, w: 0.005, a: 0.18 },
    { c: 1.745, w: 0.006, a: 0.24 },
    { c: 1.77, w: 0.005, a: 0.16 },
    { c: 1.805, w: 0.006, a: 0.22 },
    { c: 1.84, w: 0.008, a: 0.28 },
    { c: 1.875, w: 0.006, a: 0.18 },
    { c: 1.98, w: 0.05, a: 0.85 },
  ];

  const tex = makeRingTexture(1024, (imgData, w) => {
    for (let px = 0; px < w; px++) {
      const t = px / (w - 1);
      const r_Rs = 1.55 + t * (2.15 - 1.55);
      let a = 0;

      for (const ring of rings) {
        const dist = Math.abs(r_Rs - ring.c);
        if (dist < ring.w) {
          const falloff = 1 - dist / ring.w;
          a = Math.max(a, ring.a * falloff * falloff);
        }
      }

      const base = 210 + Math.floor(Math.random() * 25);
      putRadialPixel(
        imgData,
        px,
        base,
        base - 3,
        base - 8,
        Math.floor(a * 255),
      );
    }
  });

  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      color: new THREE.Color(0xece8e2),
      map: tex,
      alphaMap: tex,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.name = "Uranus_Ring";
  return ring;
}

function createGenericMoon(bodyKey, mapsFn, parentBodyGroup) {
  const cfg = BODIES[bodyKey];
  const maps = mapsFn(512);
  const geo = new THREE.SphereGeometry(cfg.size, 48, 24);

  const matArgs = {
    map: maps.map,
    roughness: 0.55,
    metalness: 0.03,
  };
  if (cfg.emissiveHex) {
    matArgs.emissive = new THREE.Color(cfg.emissiveHex);
    matArgs.emissiveIntensity = cfg.emissiveIntensity;
  }
  if (maps.bumpMap) {
    matArgs.bumpMap = maps.bumpMap;
    matArgs.bumpScale = 0.03;
  }
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(matArgs));
  mesh.position.set(cfg.orbitRadius, 0, 0);
  mesh.rotation.x = degToRad(cfg.axialTilt);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = cfg.name;

  const bodyGroup = new THREE.Group();
  bodyGroup.add(mesh);
  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.x = degToRad(cfg.orbitalIncl);
  orbitGroup.add(bodyGroup);
  parentBodyGroup.add(orbitGroup);

  return { orbitGroup, bodyGroup, mesh };
}

function createPlanet(bodyKey, mapsFn, materialOpts = {}, bumpScaleVal = 0.02) {
  const cfg = BODIES[bodyKey];
  const maps = mapsFn(2048);

  const GAS_GIANTS = ["jupiter", "saturn", "uranus", "neptune"];
  const isGasGiant = GAS_GIANTS.includes(bodyKey);
  const segW = isGasGiant ? 256 : 192;
  const segH = isGasGiant ? 128 : 96;
  const geo = new THREE.SphereGeometry(cfg.size, segW, segH);

  const matArgs = {
    map: maps.map,
    bumpScale: bumpScaleVal,
    roughness: 0.45,
    metalness: 0.01,
    ...materialOpts,
  };

  if (maps.bumpMap) {
    matArgs.bumpMap = maps.bumpMap;
  }

  if (maps.roughnessMap) {
    matArgs.roughnessMap = maps.roughnessMap;
  }

  if (maps.emissiveMap) {
    matArgs.emissiveMap = maps.emissiveMap;
    matArgs.emissive = new THREE.Color(1.0, 0.9, 0.7);
    matArgs.emissiveIntensity = 1.2;
  } else if (cfg.emissiveHex) {
    matArgs.emissive = new THREE.Color(cfg.emissiveHex);
    matArgs.emissiveIntensity = cfg.emissiveIntensity;
  }

  const mat = new THREE.MeshStandardMaterial(matArgs);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = cfg.name;
  mesh.castShadow = true;
  mesh.receiveShadow = !isGasGiant;
  mesh.rotation.order = "YXZ";
  mesh.rotation.x = degToRad(cfg.axialTilt);

  const bodyGroup = new THREE.Object3D();
  bodyGroup.position.x = cfg.orbitRadius;
  bodyGroup.add(mesh);
  bodyGroup.name = cfg.name + "_Group";

  const orbitGroup = new THREE.Object3D();
  orbitGroup.add(bodyGroup);
  orbitGroup.name = cfg.name + "_Orbit";

  const inclinationGroup = new THREE.Object3D();
  inclinationGroup.rotation.x = degToRad(cfg.orbitalIncl);
  inclinationGroup.add(orbitGroup);
  inclinationGroup.name = cfg.name + "_Incl";

  const extras = {};

  if (bodyKey === "jupiter") {
    const ring = createJupiterRing(cfg.size);
    mesh.add(ring);
    extras.ring = ring;
  }
  if (bodyKey === "saturn") {
    const ring = createSaturnRing(cfg.size);
    mesh.add(ring);
    extras.ring = ring;
  }
  if (bodyKey === "uranus") {
    const ring = createUranusRing(cfg.size);
    mesh.add(ring);
    extras.ring = ring;
  }

  return { inclinationGroup, orbitGroup, bodyGroup, mesh, extras };
}

function createEarthMoon(earthGroup) {
  const cfg = BODIES.moon;
  const maps = createMoonMaps(2048);
  const geo = new THREE.SphereGeometry(cfg.size, 96, 96);
  const mat = new THREE.MeshStandardMaterial({
    map: maps.map,
    roughness: 0.9,
    metalness: 0.0,
    emissive: new THREE.Color(cfg.emissiveHex),
    emissiveIntensity: cfg.emissiveIntensity,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = cfg.name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.x = cfg.orbitRadius;
  mesh.rotation.order = "YXZ";
  mesh.rotation.x = degToRad(cfg.axialTilt);
  const orbitGroup = new THREE.Object3D();
  orbitGroup.add(mesh);
  orbitGroup.name = cfg.name + "_Orbit";
  earthGroup.add(orbitGroup);
  return { orbitGroup, mesh };
}

function createJupiterMoon(bodyKey, mapsFn, jupiterGroup) {
  const cfg = BODIES[bodyKey];
  const maps = mapsFn(2048);
  const geo = new THREE.SphereGeometry(cfg.size, 64, 64);
  const mat = new THREE.MeshStandardMaterial({
    map: maps.map,
    bumpMap: maps.bumpMap,
    bumpScale: 0.04,
    roughness: 0.85,
    metalness: 0.0,
    emissive: new THREE.Color(cfg.emissiveHex),
    emissiveIntensity: cfg.emissiveIntensity,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = cfg.name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.x = cfg.orbitRadius;
  const orbitGroup = new THREE.Object3D();
  orbitGroup.add(mesh);
  orbitGroup.name = cfg.name + "_Orbit";
  jupiterGroup.add(orbitGroup);
  return { orbitGroup, mesh };
}

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

  const mercury = createPlanet(
    "mercury",
    createMercuryMaps,
    { roughness: 0.65, metalness: 0.02 },
    0.035,
  );
  scene.add(mercury.inclinationGroup);
  refs.mercuryOrbitGroup = mercury.orbitGroup;
  refs.mercury = mercury.mesh;
  refs.mercuryOrbitRadius = BODIES.mercury.orbitRadius;

  const venus = createPlanet(
    "venus",
    createVenusMaps,
    { roughness: 0.7, metalness: 0.0 },
    0.015,
  );
  scene.add(venus.inclinationGroup);
  refs.venusOrbitGroup = venus.orbitGroup;
  refs.venus = venus.mesh;
  refs.venusOrbitRadius = BODIES.venus.orbitRadius;

  const venusAtmo = createVenusAtmosphere(BODIES.venus.size);
  venus.bodyGroup.add(venusAtmo);
  refs.venusAtmosphere = venusAtmo;

  const earth = createPlanet(
    "earth",
    createEarthMaps,
    { roughness: 0.55, metalness: 0.0 },
    0.06,
  );
  scene.add(earth.inclinationGroup);
  refs.earthOrbitGroup = earth.orbitGroup;
  refs.earthGroup = earth.bodyGroup;
  refs.earth = earth.mesh;
  refs.earthOrbitRadius = BODIES.earth.orbitRadius;

  const atmosphere = createEarthAtmosphere(BODIES.earth.size);
  earth.bodyGroup.add(atmosphere);
  refs.earthAtmosphere = atmosphere;

  const cloudGeo = new THREE.SphereGeometry(
    BODIES.earth.size * 1.008,
    128,
    128,
  );
  const cloudMat = new THREE.MeshStandardMaterial({
    map: createEarthCloudMap(),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    roughness: 1.0,
    metalness: 0.0,
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  cloudMesh.name = "Earth_Clouds";
  earth.mesh.add(cloudMesh);
  refs.earthClouds = cloudMesh;

  const earthMoon = createEarthMoon(earth.bodyGroup);
  refs.moonOrbitGroup = earthMoon.orbitGroup;
  refs.moon = earthMoon.mesh;

  const mars = createPlanet(
    "mars",
    createMarsMaps,
    { roughness: 0.6, metalness: 0.02 },
    0.03,
  );
  scene.add(mars.inclinationGroup);
  refs.marsOrbitGroup = mars.orbitGroup;
  refs.mars = mars.mesh;
  refs.marsOrbitRadius = BODIES.mars.orbitRadius;

  const jupiter = createPlanet(
    "jupiter",
    createJupiterMaps,
    { roughness: 0.55, metalness: 0.02 },
    0.022,
  );
  scene.add(jupiter.inclinationGroup);
  refs.jupiterOrbitGroup = jupiter.orbitGroup;
  refs.jupiterGroup = jupiter.bodyGroup;
  refs.jupiter = jupiter.mesh;
  refs.jupiterOrbitRadius = BODIES.jupiter.orbitRadius;
  refs.jupiterRing = jupiter.extras.ring;

  const jupiterAtmo = createJupiterAtmosphere(BODIES.jupiter.size);
  jupiter.bodyGroup.add(jupiterAtmo);
  refs.jupiterAtmosphere = jupiterAtmo;

  const jMoons = {
    io: createJupiterMoon("io", createIoMaps, jupiter.bodyGroup),
    europa: createJupiterMoon("europa", createEuropaMaps, jupiter.bodyGroup),
    ganymede: createJupiterMoon(
      "ganymede",
      createGanymedeMaps,
      jupiter.bodyGroup,
    ),
    callisto: createJupiterMoon(
      "callisto",
      createCallistoMaps,
      jupiter.bodyGroup,
    ),
  };
  refs.ioOrbitGroup = jMoons.io.orbitGroup;
  refs.io = jMoons.io.mesh;
  refs.europaOrbitGroup = jMoons.europa.orbitGroup;
  refs.europa = jMoons.europa.mesh;
  refs.ganymedeOrbitGroup = jMoons.ganymede.orbitGroup;
  refs.ganymede = jMoons.ganymede.mesh;
  refs.callistoOrbitGroup = jMoons.callisto.orbitGroup;
  refs.callisto = jMoons.callisto.mesh;

  const saturn = createPlanet(
    "saturn",
    createSaturnMaps,
    { roughness: 0.5, metalness: 0.05 },
    0.008,
  );
  scene.add(saturn.inclinationGroup);
  refs.saturnOrbitGroup = saturn.orbitGroup;
  refs.saturn = saturn.mesh;
  refs.saturnOrbitRadius = BODIES.saturn.orbitRadius;
  refs.saturnRing = saturn.extras.ring;

  const saturnAtmo = createSaturnAtmosphere(BODIES.saturn.size);
  saturn.bodyGroup.add(saturnAtmo);
  refs.saturnAtmosphere = saturnAtmo;

  const uranus = createPlanet(
    "uranus",
    createUranusMaps,
    { roughness: 0.6, metalness: 0.02 },
    0.015,
  );
  scene.add(uranus.inclinationGroup);
  refs.uranusOrbitGroup = uranus.orbitGroup;
  refs.uranus = uranus.mesh;
  refs.uranusOrbitRadius = BODIES.uranus.orbitRadius;
  refs.uranusRing = uranus.extras.ring;

  const uranusAtmo = createUranusAtmosphere(BODIES.uranus.size);
  uranus.bodyGroup.add(uranusAtmo);
  refs.uranusAtmosphere = uranusAtmo;

  const neptune = createPlanet(
    "neptune",
    createNeptuneMaps,
    { roughness: 0.6, metalness: 0.02 },
    0.018,
  );
  scene.add(neptune.inclinationGroup);
  refs.neptuneOrbitGroup = neptune.orbitGroup;
  refs.neptune = neptune.mesh;
  refs.neptuneOrbitRadius = BODIES.neptune.orbitRadius;

  const neptuneAtmo = createNeptuneAtmosphere(BODIES.neptune.size);
  neptune.bodyGroup.add(neptuneAtmo);
  refs.neptuneAtmosphere = neptuneAtmo;

  const marsMoons = [
    createGenericMoon("phobos", createPhobosMaps, mars.bodyGroup),
    createGenericMoon("deimos", createDeimosMaps, mars.bodyGroup),
  ];
  refs.phobosOrbitGroup = marsMoons[0].orbitGroup;
  refs.phobos = marsMoons[0].mesh;
  refs.deimosOrbitGroup = marsMoons[1].orbitGroup;
  refs.deimos = marsMoons[1].mesh;

  const satMoons = [
    { key: "mimas", fn: createMimasMaps },
    { key: "enceladus", fn: createEnceladusMaps },
    { key: "tethys", fn: createTethysMaps },
    { key: "dione", fn: createDioneMaps },
    { key: "rhea", fn: createRheaMaps },
  ];
  for (const { key, fn } of satMoons) {
    const moon = createGenericMoon(key, fn, saturn.bodyGroup);
    refs[key + "OrbitGroup"] = moon.orbitGroup;
    refs[key] = moon.mesh;
  }

  const titanMoon = createGenericMoon(
    "titan",
    createTitanMaps,
    saturn.bodyGroup,
  );
  refs.titanOrbitGroup = titanMoon.orbitGroup;
  refs.titan = titanMoon.mesh;

  const titanAtmo = createTitanAtmosphere(BODIES.titan.size);
  titanMoon.bodyGroup.add(titanAtmo);
  refs.titanAtmosphere = titanAtmo;

  return refs;
}
