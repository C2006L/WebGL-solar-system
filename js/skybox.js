import * as THREE from "three";

function drawStarfieldCanvas(width = 4096, height = 2048) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const nebulae = [
    { x: 0.25, y: 0.35, rx: 0.18, ry: 0.14, r: 100, g: 50,  b: 180, alpha: 0.45 },
    { x: 0.28, y: 0.33, rx: 0.10, ry: 0.08, r: 140, g: 70,  b: 220, alpha: 0.32 },
    { x: 0.75, y: 0.55, rx: 0.20, ry: 0.16, r: 200, g: 40,  b: 80,  alpha: 0.40 },
    { x: 0.72, y: 0.58, rx: 0.11, ry: 0.09, r: 230, g: 60,  b: 100, alpha: 0.28 },
    { x: 0.78, y: 0.52, rx: 0.08, ry: 0.07, r: 250, g: 80,  b: 120, alpha: 0.22 },
    { x: 0.15, y: 0.72, rx: 0.16, ry: 0.12, r: 40,  g: 100, b: 200, alpha: 0.42 },
    { x: 0.12, y: 0.70, rx: 0.09, ry: 0.07, r: 60,  g: 140, b: 230, alpha: 0.30 },
    { x: 0.62, y: 0.22, rx: 0.14, ry: 0.13, r: 30,  g: 120, b: 180, alpha: 0.38 },
    { x: 0.60, y: 0.20, rx: 0.08, ry: 0.06, r: 50,  g: 160, b: 210, alpha: 0.26 },
    { x: 0.42, y: 0.68, rx: 0.17, ry: 0.15, r: 180, g: 130, b: 60,  alpha: 0.36 },
    { x: 0.44, y: 0.66, rx: 0.10, ry: 0.08, r: 210, g: 150, b: 80,  alpha: 0.24 },
    { x: 0.88, y: 0.30, rx: 0.12, ry: 0.11, r: 100, g: 40,  b: 160, alpha: 0.36 },
    { x: 0.90, y: 0.28, rx: 0.07, ry: 0.05, r: 140, g: 60,  b: 190, alpha: 0.24 },
    { x: 0.33, y: 0.18, rx: 0.11, ry: 0.10, r: 220, g: 70,  b: 60,  alpha: 0.32 },
    { x: 0.08, y: 0.45, rx: 0.15, ry: 0.13, r: 40,  g: 30,  b: 80,  alpha: 0.30 },
    { x: 0.55, y: 0.85, rx: 0.13, ry: 0.11, r: 25,  g: 20,  b: 60,  alpha: 0.30 },
    { x: 0.95, y: 0.75, rx: 0.14, ry: 0.12, r: 160, g: 110, b: 50,  alpha: 0.32 },
    { x: 0.50, y: 0.42, rx: 0.22, ry: 0.18, r: 30,  g: 25,  b: 60,  alpha: 0.40 },
  ];

  for (const nb of nebulae) {
    const cx = nb.x * width;
    const cy = nb.y * height;
    const rx = nb.rx * width;
    const ry = nb.ry * height;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    grad.addColorStop(0, `rgba(${nb.r},${nb.g},${nb.b},${nb.alpha})`);
    grad.addColorStop(0.35, `rgba(${nb.r},${nb.g},${nb.b},${nb.alpha * 0.7})`);
    grad.addColorStop(0.7, `rgba(${nb.r},${nb.g},${nb.b},${nb.alpha * 0.25})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  }

  const starCount = 18000;
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    const rnd = Math.random();
    const size = rnd < 0.01 ? 2.5 : rnd < 0.05 ? 1.8 : rnd < 0.2 ? 1.2 : 0.7;
    const brightness = 0.22 + Math.random() * 0.44;

    let r = 255, g = 255, b = 255;
    const ct = Math.random();
    if (ct < 0.06) { r = 200; g = 210; b = 255; }
    else if (ct < 0.12) { r = 255; g = 240; b = 200; }

    ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const nebulaClusters = [
    { cx: 0.25, cy: 0.35, rx: 0.18, cr: 200, cg: 170, cb: 255 },
    { cx: 0.75, cy: 0.55, rx: 0.20, cr: 255, cg: 180, cb: 200 },
    { cx: 0.15, cy: 0.72, rx: 0.16, cr: 180, cg: 200, cb: 255 },
    { cx: 0.62, cy: 0.22, rx: 0.14, cr: 170, cg: 210, cb: 255 },
    { cx: 0.42, cy: 0.68, rx: 0.17, cr: 255, cg: 220, cb: 170 },
    { cx: 0.88, cy: 0.30, rx: 0.12, cr: 200, cg: 170, cb: 255 },
  ];

  for (const nc of nebulaClusters) {
    const cx = nc.cx * width;
    const cy = nc.cy * height;
    const radius = nc.rx * width;
    const count = 400;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * radius * 0.9;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;

      const b = 0.3 + Math.random() * 0.4;
      const rnd = Math.random();
      const dotSize = rnd < 0.02 ? 1.6 : rnd < 0.1 ? 1.0 : 0.5;

      ctx.fillStyle = `rgba(${nc.cr},${nc.cg},${nc.cb},${b})`;
      ctx.beginPath();
      ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return c;
}

export function createSkybox() {
  const canvas = drawStarfieldCanvas(4096, 2048);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const geo = new THREE.SphereGeometry(3000, 32, 16);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "Skybox";
  mesh.renderOrder = -999;
  return mesh;
}