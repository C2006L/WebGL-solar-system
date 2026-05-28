// ============================================================
// asteroid-belt.js — 小行星带（v4：AdditiveBlending + 加宽范围）
// ============================================================

import * as THREE from "three";
import { SCENE } from "./constants.js";

export function createAsteroidBelt(count = SCENE.ASTEROID_COUNT) {
  const group = new THREE.Group();
  group.name = "AsteroidBelt";

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const minR = SCENE.ASTEROID_MIN_R;
  const maxR = SCENE.ASTEROID_MAX_R;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minR + Math.random() * (maxR - minR);
    const y = (Math.random() - 0.5) * 1.2;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const brightness = 0.55 + Math.random() * 0.45;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness * 0.85;
    colors[i * 3 + 2] = brightness * 0.72;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 32;
  spriteCanvas.height = 32;
  const sctx = spriteCanvas.getContext("2d");
  const sg = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  sg.addColorStop(0, "rgba(255,255,255,1)");
  sg.addColorStop(0.15, "rgba(255,245,225,0.85)");
  sg.addColorStop(0.4, "rgba(220,190,150,0.35)");
  sg.addColorStop(0.7, "rgba(150,120,80,0.08)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 32, 32);
  const spriteTex = new THREE.Texture(spriteCanvas);
  spriteTex.needsUpdate = true;

  const mat = new THREE.PointsMaterial({
    size: 0.16,
    map: spriteTex,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  return group;
}
