import * as THREE from "three";

function drawDeepSpaceCanvas(width = 4096, height = 2048) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");

  // 1. 深空背景（明亮调试用，确认 tone mapping 影响）
  ctx.fillStyle = "#4444aa";
  ctx.fillRect(0, 0, width, height);

  // 2. 银河亮带（高斯叠加，真正可见）
  const galaxyY = height * 0.5;
  const galaxyBands = 32;
  for (let b = 0; b < galaxyBands; b++) {
    const bandCenter = galaxyY + (b - galaxyBands / 2) * (height * 0.009);
    const bandAlpha = 0.02 + Math.exp(-Math.pow((b - galaxyBands / 2) * 0.3, 2)) * 0.12;
    const bandWidth = height * (0.025 + Math.random() * 0.015);

    const grad = ctx.createLinearGradient(0, bandCenter - bandWidth, 0, bandCenter + bandWidth);
    grad.addColorStop(0, `rgba(12, 14, 28, 0)`);
    grad.addColorStop(0.5, `rgba(65, 70, 100, ${bandAlpha})`);
    grad.addColorStop(1, `rgba(12, 14, 28, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, bandCenter - bandWidth, width, bandWidth * 2);
  }

  // 银河核心（明显提亮）
  const coreX = width * 0.7;
  const coreGrad = ctx.createRadialGradient(coreX, galaxyY, 0, coreX, galaxyY, width * 0.25);
  coreGrad.addColorStop(0, "rgba(100, 95, 140, 0.28)");
  coreGrad.addColorStop(0.2, "rgba(75, 70, 115, 0.18)");
  coreGrad.addColorStop(0.5, "rgba(45, 40, 75, 0.08)");
  coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. 弥散星云团（更大更亮）
  const nebulae = [
    { x: width * 0.15, y: height * 0.35, r: width * 0.2, c: "rgba(70, 50, 110, 0.12)" },
    { x: width * 0.52, y: height * 0.6, r: width * 0.16, c: "rgba(50, 75, 95, 0.10)" },
    { x: width * 0.8, y: height * 0.25, r: width * 0.14, c: "rgba(95, 55, 55, 0.09)" },
    { x: width * 0.35, y: height * 0.7, r: width * 0.15, c: "rgba(55, 65, 100, 0.10)" },
    { x: width * 0.62, y: height * 0.42, r: width * 0.11, c: "rgba(75, 60, 90, 0.09)" },
  ];
  for (const nb of nebulae) {
    const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
    g.addColorStop(0, nb.c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(nb.x - nb.r, nb.y - nb.r, nb.r * 2, nb.r * 2);
  }

  // 4. 大量星星（高密度，模拟银河区域）
  const starCount = 25000;
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const distToGalaxy = Math.abs(y - galaxyY) / (height * 0.5);
    const galaxyDensity = 1.0 - distToGalaxy * 0.35;
    if (Math.random() > galaxyDensity) continue;

    const rnd = Math.random();
    const size = rnd < 0.008 ? 3.2 : rnd < 0.04 ? 2.2 : rnd < 0.15 ? 1.5 : 0.9;
    const brightness = 0.55 + Math.random() * 0.45;
    let r = 255, g = 255, b = 255;
    const ct = Math.random();
    if (ct < 0.08) { r = 130; g = 160; b = 255; }
    else if (ct < 0.15) { r = 255; g = 205; b = 150; }
    else if (ct < 0.22) { r = 255; g = 185; b = 130; }

    ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (size >= 2.2 && Math.random() < 0.35) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${brightness * 0.45})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - size * 3.5, y);
      ctx.lineTo(x + size * 3.5, y);
      ctx.moveTo(x, y - size * 3.5);
      ctx.lineTo(x, y + size * 3.5);
      ctx.stroke();
    }
  }

  // 5. 暗噪点（模拟宇宙尘埃散射光）
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.random() < 0.25) {
      const n = (Math.random() - 0.5) * 5;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  return c;
}

export function createSkybox() {
  const canvas = drawDeepSpaceCanvas(4096, 2048);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const geo = new THREE.SphereGeometry(3000, 64, 32);
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
