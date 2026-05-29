import * as THREE from "three";

function drawStarfieldCanvas(width = 4096, height = 2048) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");

  // 纯黑背景
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // 大量星星：纯白/灰白小点，随机分布，无银河结构
  const starCount = 18000;
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    const rnd = Math.random();
    const size = rnd < 0.01 ? 2.5 : rnd < 0.05 ? 1.8 : rnd < 0.2 ? 1.2 : 0.7;
    const brightness = 0.18 + Math.random() * 0.38;

    let r = 255, g = 255, b = 255;
    const ct = Math.random();
    if (ct < 0.06) { r = 200; g = 210; b = 255; }
    else if (ct < 0.12) { r = 255; g = 240; b = 200; }

    ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
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
