// ============================================================
// celestial-bodies.js — v10：真实地球贴图 + 云层 + 修复轨道
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
} from "./textures.js";
import { createEarthAtmosphere } from "./atmosphere.js";

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function sunCorona(cfg, radiusMult, colorHex, power, alpha) {
  const geo = new THREE.SphereGeometry(cfg.size * radiusMult, 64, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(colorHex) } },
    vertexShader: `varying vec3 vN; varying vec3 vP; void main() { vec4 wp = modelMatrix*vec4(position,1.0); vP=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:
      `varying vec3 vN; varying vec3 vP; uniform vec3 uColor; void main() { vec3 V=normalize(cameraPosition-vP); float f=1.0-abs(dot(V,normalize(vN))); gl_FragColor=vec4(uColor,pow(f,` +
      power +
      `)*` +
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
  const geo = new THREE.SphereGeometry(cfg.size, 128, 128);
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

function createJupiterRing(planetSize) {
  const geo = new THREE.RingGeometry(planetSize * 1.28, planetSize * 1.55, 128);
  geo.rotateX(-Math.PI / 2);
  const rc = document.createElement("canvas");
  rc.width = 512;
  rc.height = 24;
  const rctx = rc.getContext("2d");
  const g = rctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, "rgba(180,160,140,0.05)");
  g.addColorStop(0.2, "rgba(190,170,145,0.22)");
  g.addColorStop(0.4, "rgba(200,180,155,0.28)");
  g.addColorStop(0.6, "rgba(190,170,145,0.15)");
  g.addColorStop(1, "rgba(140,120,100,0.02)");
  rctx.fillStyle = g;
  rctx.fillRect(0, 0, 512, 24);
  const tex = new THREE.Texture(rc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0.01,
      transparent: true,
      opacity: 0.55,
      depthWrite: true,
    }),
  );
  ring.renderOrder = 1;
  ring.name = "Jupiter_Ring";
  return ring;
}

function createSaturnRing(planetSize) {
  const geo = new THREE.RingGeometry(planetSize * 1.3, planetSize * 2.2, 192);
  geo.rotateX(-Math.PI / 2);
  const rc = document.createElement("canvas");
  rc.width = 1024;
  rc.height = 64;
  const rctx = rc.getContext("2d");
  const rg = rctx.createLinearGradient(0, 0, 1024, 0);
  rg.addColorStop(0, "rgba(160,145,120,0.15)");
  rg.addColorStop(0.06, "rgba(190,170,140,0.5)");
  rg.addColorStop(0.12, "rgba(160,145,120,0.2)");
  rg.addColorStop(0.18, "rgba(240,220,180,0.75)");
  rg.addColorStop(0.28, "rgba(255,240,200,0.95)");
  rg.addColorStop(0.38, "rgba(240,220,180,0.88)");
  rg.addColorStop(0.44, "rgba(220,200,160,0.7)");
  rg.addColorStop(0.48, "rgba(60,50,35,0.3)");
  rg.addColorStop(0.52, "rgba(50,40,30,0.25)");
  rg.addColorStop(0.56, "rgba(80,65,45,0.35)");
  rg.addColorStop(0.62, "rgba(230,210,175,0.75)");
  rg.addColorStop(0.72, "rgba(220,200,165,0.7)");
  rg.addColorStop(0.82, "rgba(200,180,145,0.55)");
  rg.addColorStop(0.9, "rgba(170,150,120,0.3)");
  rg.addColorStop(1, "rgba(120,100,80,0.08)");
  rctx.fillStyle = rg;
  rctx.fillRect(0, 0, 1024, 64);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1024;
    rctx.fillStyle =
      Math.random() > 0.5
        ? `rgba(255,240,210,${0.03 + Math.random() * 0.08})`
        : `rgba(150,120,90,${0.03 + Math.random() * 0.08})`;
    rctx.fillRect(x, 0, 2 + Math.random() * 3, 64);
  }
  const tex = new THREE.Texture(rc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      side: THREE.DoubleSide,
      roughness: 0.38,
      metalness: 0.06,
      transparent: true,
      opacity: 0.9,
      depthWrite: true,
    }),
  );
  ring.renderOrder = 1;
  ring.castShadow = true;
  ring.receiveShadow = true;
  ring.name = "Saturn_Ring";
  return ring;
}

function createUranusRing(planetSize) {
  const geo = new THREE.RingGeometry(planetSize * 1.3, planetSize * 1.45, 64);
  geo.rotateX(-Math.PI / 2);
  const rc = document.createElement("canvas");
  rc.width = 256;
  rc.height = 16;
  const rctx = rc.getContext("2d");
  const g = rctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(160,200,220,0.2)");
  g.addColorStop(0.3, "rgba(180,210,230,0.5)");
  g.addColorStop(0.5, "rgba(200,220,235,0.6)");
  g.addColorStop(0.7, "rgba(170,200,220,0.4)");
  g.addColorStop(1, "rgba(140,180,200,0.1)");
  rctx.fillStyle = g;
  rctx.fillRect(0, 0, 256, 16);
  const tex = new THREE.Texture(rc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: tex,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.02,
      transparent: true,
      opacity: 0.7,
      depthWrite: true,
    }),
  );
  ring.name = "Uranus_Ring";
  return ring;
}

function createPlanet(bodyKey, mapsFn, materialOpts = {}, bumpScaleVal = 0.02) {
  const cfg = BODIES[bodyKey];
  const maps = mapsFn(2048);
  const geo = new THREE.SphereGeometry(cfg.size, 128, 128);

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

  if (cfg.emissiveHex) {
    matArgs.emissive = new THREE.Color(cfg.emissiveHex);
    matArgs.emissiveIntensity = cfg.emissiveIntensity;
  }

  const mat = new THREE.MeshStandardMaterial(matArgs);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = cfg.name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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
    bumpMap: maps.bumpMap,
    bumpScale: 0.03,
    roughness: 0.88,
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
    roughness: 0.72,
    metalness: 0.01,
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
    { roughness: 0.55, metalness: 0.02 },
    0.035,
  );
  scene.add(mercury.inclinationGroup);
  refs.mercuryOrbitGroup = mercury.orbitGroup;
  refs.mercury = mercury.mesh;
  refs.mercuryOrbitRadius = BODIES.mercury.orbitRadius;

  const venus = createPlanet(
    "venus",
    createVenusMaps,
    { roughness: 0.38, metalness: 0.0 },
    0.015,
  );
  scene.add(venus.inclinationGroup);
  refs.venusOrbitGroup = venus.orbitGroup;
  refs.venus = venus.mesh;
  refs.venusOrbitRadius = BODIES.venus.orbitRadius;

  const earth = createPlanet(
    "earth",
    createEarthMaps,
    { roughness: 0.7, metalness: 0.0 },
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
    { roughness: 0.55, metalness: 0.01 },
    0.03,
  );
  scene.add(mars.inclinationGroup);
  refs.marsOrbitGroup = mars.orbitGroup;
  refs.mars = mars.mesh;
  refs.marsOrbitRadius = BODIES.mars.orbitRadius;

  const jupiter = createPlanet(
    "jupiter",
    createJupiterMaps,
    { roughness: 0.28, metalness: 0.0 },
    0.022,
  );
  scene.add(jupiter.inclinationGroup);
  refs.jupiterOrbitGroup = jupiter.orbitGroup;
  refs.jupiterGroup = jupiter.bodyGroup;
  refs.jupiter = jupiter.mesh;
  refs.jupiterOrbitRadius = BODIES.jupiter.orbitRadius;
  refs.jupiterRing = jupiter.extras.ring;

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
    { roughness: 0.3, metalness: 0.0 },
    0.018,
  );
  scene.add(saturn.inclinationGroup);
  refs.saturnOrbitGroup = saturn.orbitGroup;
  refs.saturn = saturn.mesh;
  refs.saturnOrbitRadius = BODIES.saturn.orbitRadius;
  refs.saturnRing = saturn.extras.ring;

  const uranus = createPlanet(
    "uranus",
    createUranusMaps,
    { roughness: 0.36, metalness: 0.0 },
    0.015,
  );
  scene.add(uranus.inclinationGroup);
  refs.uranusOrbitGroup = uranus.orbitGroup;
  refs.uranus = uranus.mesh;
  refs.uranusOrbitRadius = BODIES.uranus.orbitRadius;
  refs.uranusRing = uranus.extras.ring;

  const neptune = createPlanet(
    "neptune",
    createNeptuneMaps,
    { roughness: 0.32, metalness: 0.0 },
    0.018,
  );
  scene.add(neptune.inclinationGroup);
  refs.neptuneOrbitGroup = neptune.orbitGroup;
  refs.neptune = neptune.mesh;
  refs.neptuneOrbitRadius = BODIES.neptune.orbitRadius;

  return refs;
}
