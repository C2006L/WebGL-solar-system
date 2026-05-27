// ============================================================
// orbits.js — 轨道可视化（v3：全 8 行星 + 轨道倾角）
// ============================================================

import * as THREE from "three";
import { SCENE, BODIES } from "./constants.js";

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function createOrbitRing(radius, color = "#334466", inclination = 0) {
  const segments = SCENE.ORBIT_SEGMENTS;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
    );
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);

  if (inclination !== 0) {
    line.rotation.x = degToRad(inclination);
  }

  return line;
}

export function createAllOrbits(bodyRefs) {
  const group = new THREE.Group();

  const orbitDefs = [
    { key: "mercury", color: "#999999" },
    { key: "venus", color: "#ccaa66" },
    { key: "earth", color: "#3355aa" },
    { key: "mars", color: "#aa4433" },
    { key: "jupiter", color: "#d4a574" },
    { key: "saturn", color: "#e8d5a0" },
    { key: "uranus", color: "#7ec8e3" },
    { key: "neptune", color: "#3355cc" },
  ];

  for (const def of orbitDefs) {
    const cfg = BODIES[def.key];
    if (!cfg) continue;
    const ring = createOrbitRing(cfg.orbitRadius, def.color, cfg.orbitalIncl);
    ring.name = cfg.name + "_OrbitLine";
    group.add(ring);
  }

  return group;
}
