import * as THREE from "three";
import { SCENE } from "./constants.js";

function createSpriteTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.12, "rgba(255,255,255,0.85)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.Texture(c);
  tex.needsUpdate = true;
  return tex;
}

export function createStarField(
  count = SCENE.STAR_COUNT,
  radius = SCENE.STAR_RADIUS,
) {
  const nebulaParticleCount = 4000;
  const totalCount = count + nebulaParticleCount;
  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  const sizes = new Float32Array(totalCount);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * Math.PI * 2;
    const r = radius * (0.85 + Math.random() * 0.15);
    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.cos(theta);
    positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);

    const ct = Math.random();
    if (ct < 0.08) {
      colors[i * 3] = 0.6;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 1.0;
    } else if (ct < 0.16) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.55;
    } else if (ct < 0.22) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 0.4;
    } else {
      const b = 0.65 + Math.random() * 0.35;
      colors[i * 3] = b;
      colors[i * 3 + 1] = b;
      colors[i * 3 + 2] = b;
    }
    sizes[i] = 0.04 + Math.random() * 0.14;
  }

  const nebulaClusters = [
    { cx: radius * 0.5, cy: radius * 0.3, cz: -radius * 0.6, cr: 0.25, r: 0.50, g: 0.40, b: 0.95, count: 700 },
    { cx: -radius * 0.65, cy: -radius * 0.4, cz: radius * 0.3, cr: 0.22, r: 0.90, g: 0.25, b: 0.40, count: 650 },
    { cx: radius * 0.2, cy: -radius * 0.6, cz: -radius * 0.4, cr: 0.26, r: 0.35, g: 0.65, b: 0.95, count: 700 },
    { cx: -radius * 0.3, cy: radius * 0.5, cz: -radius * 0.5, cr: 0.20, r: 0.80, g: 0.55, b: 0.30, count: 600 },
    { cx: radius * 0.7, cy: radius * 0.15, cz: radius * 0.2, cr: 0.18, r: 0.55, g: 0.20, b: 0.70, count: 650 },
    { cx: -radius * 0.55, cy: -radius * 0.1, cz: -radius * 0.7, cr: 0.19, r: 0.25, g: 0.55, b: 0.80, count: 700 },
  ];

  let idx = count;
  for (const nc of nebulaClusters) {
    for (let i = 0; i < nc.count; i++) {
      const localR = nc.cr * radius * (0.03 + Math.random() * 0.97);
      const localTheta = Math.random() * Math.PI;
      const localPhi = Math.random() * Math.PI * 2;
      positions[idx * 3] =
        nc.cx + localR * Math.sin(localTheta) * Math.cos(localPhi);
      positions[idx * 3 + 1] = nc.cy + localR * Math.cos(localTheta);
      positions[idx * 3 + 2] =
        nc.cz + localR * Math.sin(localTheta) * Math.sin(localPhi);

      const jitter = 0.75 + Math.random() * 0.25;
      colors[idx * 3] = nc.r * jitter;
      colors[idx * 3 + 1] = nc.g * jitter;
      colors[idx * 3 + 2] = nc.b * jitter;
      sizes[idx] = 0.05 + Math.random() * 0.18;
      idx++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const spriteTex = createSpriteTexture();
  const mat = new THREE.PointsMaterial({
    size: 0.22,
    map: spriteTex,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}