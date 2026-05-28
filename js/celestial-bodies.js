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

/** 木星环：极暗弥散红褐色尘埃（岩石颗粒，非水冰） */
function createJupiterRing(planetSize) {
  const innerR = planetSize * 1.72;
  const outerR = planetSize * 1.82;
  const geo = new THREE.RingGeometry(innerR, outerR, 128);
  geo.rotateX(-Math.PI / 2);

  const tex = makeRingTexture(512, (imgData, w) => {
    for (let px = 0; px < w; px++) {
      const t = px / (w - 1);
      const r_Rs = 1.72 + t * (1.82 - 1.72);
      let a = 0;

      // 光环 Halo（弥散球形）
      if (r_Rs < 1.74) {
        a = 0.02 + Math.random() * 0.03;
      }
      // 主环
      else if (r_Rs < 1.8) {
        a = 0.04 + Math.random() * 0.04;
      }
      // 薄纱环 Gossamer
      else {
        a = 0.02 + Math.random() * 0.03;
      }

      // 红褐色（尘埃）
      const rr = 155 + Math.floor(Math.random() * 20);
      const gg = 125 + Math.floor(Math.random() * 15);
      const bb = 95 + Math.floor(Math.random() * 15);
      putRadialPixel(imgData, px, rr, gg, bb, Math.floor(a * 255));
    }
  });

  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      alphaMap: tex,
      alphaTest: 0.015,
      side: THREE.DoubleSide,
      roughness: 0.95,
      metalness: 0.0,
      transparent: false,
      depthWrite: true,
    }),
  );
  ring.renderOrder = 1;
  ring.name = "Jupiter_Ring";
  return ring;
}

/** 土星环：NASA 卡西尼号真实结构 */
function createSaturnRing(planetSize) {
  // 扩展范围：D 环 (1.11 Rs) → F 环 (~2.32 Rs)
  const innerR = planetSize * 1.11;
  const outerR = planetSize * 2.34;
  const geo = new THREE.RingGeometry(innerR, outerR, 512);
  geo.rotateX(-Math.PI / 2);

  const tex = makeRingTexture(2048, (imgData, w) => {
    for (let px = 0; px < w; px++) {
      const t = px / (w - 1);
      const r_Rs = 1.11 + t * (2.34 - 1.11);
      let a = 0;
      let R = 210,
        G = 200,
        B = 185;

      if (r_Rs >= 1.11 && r_Rs < 1.24) {
        // D 环：极暗，几乎不可见
        a = 0.06 + Math.random() * 0.05;
        R = 155;
        G = 150;
        B = 142;
      } else if (r_Rs >= 1.24 && r_Rs < 1.53) {
        // C 环：半透明灰
        a = 0.3 + Math.random() * 0.12;
        R = 190;
        G = 183;
        B = 173;
      } else if (r_Rs >= 1.53 && r_Rs < 1.95) {
        // B 环：最亮最密，奶油白色
        a = 0.9 + Math.random() * 0.1;
        R = 242;
        G = 235;
        B = 222;
      } else if (r_Rs >= 1.95 && r_Rs < 2.03) {
        // 卡西尼缝隙：宽阔黑暗空隙
        a = 0.01;
        R = 60;
        G = 55;
        B = 48;
      } else if (r_Rs >= 2.03 && r_Rs < 2.27) {
        // A 环：明亮但较 B 环透明
        a = 0.68 + Math.random() * 0.14;
        R = 232;
        G = 225;
        B = 210;
        // 恩克缝隙 (~2.21 Rs)
        if (r_Rs > 2.205 && r_Rs < 2.218) {
          a = 0.03;
        }
      } else if (r_Rs >= 2.27 && r_Rs < 2.3) {
        // A 环外侧 → F 环之间：极暗空隙
        a = 0.015;
      } else if (r_Rs >= 2.3 && r_Rs < 2.34) {
        // F 环：极细窄，有轻微扭结感
        const center = 2.32;
        const dist = Math.abs(r_Rs - center);
        if (dist < 0.012) {
          a = 0.45 * (1 - dist / 0.012) + Math.random() * 0.12;
          R = 225;
          G = 218;
          B = 202;
        }
      }

      putRadialPixel(imgData, px, R, G, B, Math.floor(a * 255));
    }
  });

  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      alphaMap: tex,
      alphaTest: 0.008,
      side: THREE.DoubleSide,
      roughness: 0.25,
      metalness: 0.02,
      transparent: false,
      depthWrite: true,
    }),
  );
  ring.renderOrder = 1;
  ring.name = "Saturn_Ring";
  return ring;
}

/** 天王星环：旅行者2号数据，13 条不等宽 */
function createUranusRing(planetSize) {
  const innerR = planetSize * 1.58;
  const outerR = planetSize * 2.05;
  const geo = new THREE.RingGeometry(innerR, outerR, 256);
  geo.rotateX(-Math.PI / 2);

  // 13 条环：中心位置(Rs)、半宽(Rs)、峰值透明度
  // ε 环最宽最亮，其余窄而暗
  const rings = [
    { c: 1.602, w: 0.004, a: 0.1 }, // 6
    { c: 1.618, w: 0.004, a: 0.08 }, // 5
    { c: 1.638, w: 0.005, a: 0.12 }, // 4
    { c: 1.658, w: 0.004, a: 0.09 }, // α
    { c: 1.678, w: 0.005, a: 0.11 }, // β
    { c: 1.698, w: 0.004, a: 0.08 }, // η
    { c: 1.718, w: 0.003, a: 0.07 }, // γ
    { c: 1.738, w: 0.004, a: 0.09 }, // δ
    { c: 1.758, w: 0.003, a: 0.06 }, // λ
    { c: 1.788, w: 0.004, a: 0.08 }, // ε-inner
    { c: 1.818, w: 0.005, a: 0.1 }, // ε-center
    { c: 1.848, w: 0.004, a: 0.07 }, // ε-outer
    { c: 1.962, w: 0.028, a: 0.6 }, // ε 环主体：最宽最亮
  ];

  const tex = makeRingTexture(1024, (imgData, w) => {
    for (let px = 0; px < w; px++) {
      const t = px / (w - 1);
      const r_Rs = 1.58 + t * (2.05 - 1.58);
      let a = 0;

      for (const ring of rings) {
        const dist = Math.abs(r_Rs - ring.c);
        if (dist < ring.w) {
          const falloff = 1 - dist / ring.w;
          a = Math.max(a, ring.a * falloff * falloff);
        }
      }

      // 蓝灰色水冰颗粒
      const rr = 155 + Math.floor(Math.random() * 35);
      const gg = 180 + Math.floor(Math.random() * 35);
      const bb = 205 + Math.floor(Math.random() * 30);
      putRadialPixel(imgData, px, rr, gg, bb, Math.floor(a * 255));
    }
  });

  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      alphaMap: tex,
      alphaTest: 0.015,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.04,
      transparent: false,
      depthWrite: true,
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
