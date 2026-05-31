import * as THREE from "three";

function makeNebulaTexture(r, g, b, size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(0.15, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.18)`);
  grad.addColorStop(0.6, `rgba(${r},${g},${b},0.04)`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const NEBULA_DEFS = [
  { pos: [200, 120, -180], scale: 200, r: 100, g: 50, b: 180 },
  { pos: [140, 80, -200], scale: 130, r: 70, g: 40, b: 200 },
  { pos: [-220, -80, 160], scale: 180, r: 200, g: 40, b: 80 },
  { pos: [-180, -100, 140], scale: 120, r: 160, g: 50, b: 100 },
  { pos: [80, -200, -160], scale: 170, r: 40, g: 100, b: 210 },
  { pos: [120, -180, -140], scale: 110, r: 30, g: 130, b: 230 },
  { pos: [-100, 160, -180], scale: 160, r: 180, g: 120, b: 50 },
  { pos: [-60, 180, -150], scale: 100, r: 220, g: 150, b: 70 },
  { pos: [240, 40, 120], scale: 140, r: 100, g: 40, b: 160 },
  { pos: [280, 20, 100], scale: 90, r: 120, g: 50, b: 180 },
  { pos: [-240, 50, -60], scale: 150, r: 50, g: 100, b: 200 },
  { pos: [-200, 60, -80], scale: 100, r: 30, g: 120, b: 220 },
];

export function createNebulaSprites() {
  const group = new THREE.Group();
  group.name = "NebulaSprites";

  for (const def of NEBULA_DEFS) {
    const tex = makeNebulaTexture(def.r, def.g, def.b, 256);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.6,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(...def.pos);
    sprite.scale.set(def.scale, def.scale, 1);
    sprite.renderOrder = -998;
    group.add(sprite);
  }

  return group;
}