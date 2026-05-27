// ============================================================
// textures.js — 程序化纹理 + 凹凸贴图生成
// ============================================================
// 每个天体返回 { map: colorTexture, bumpMap: heightTexture }
// bumpMap: 灰度图，白=凸起，黑=凹陷，用于 THREE.MeshStandardMaterial
// ============================================================

import * as THREE from "three";

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function canvasToTexture(canvas) {
  const tex = new THREE.Texture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function canvasToLinearTexture(canvas) {
  const tex = new THREE.Texture(canvas);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// ---- 太阳纹理（v7：真实太阳表面贴图） ----
const TEX = "./textures/";

export function createSunMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_sun.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

// ---- 月球纹理（v7：真实月球贴图） ----
export function createMoonMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_moon.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

export function createMarsMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_mars.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

// ---- 木卫一 纹理 + 凹凸贴图 ----
export function createIoMaps(size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createRadialGradient(0, 0, 0, size, size, size * 1.2);
  baseGrad.addColorStop(0, "#e8d050");
  baseGrad.addColorStop(0.35, "#e0c840");
  baseGrad.addColorStop(0.65, "#c89830");
  baseGrad.addColorStop(1, "#a87820");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.7, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.3, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 5;
    const colors = [
      "rgba(255,180,20,0.35)",
      "rgba(200,80,10,0.4)",
      "rgba(255,220,60,0.3)",
      "rgba(180,140,30,0.35)",
      "rgba(100,30,5,0.5)",
      "rgba(255,140,30,0.3)",
    ];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colors[Math.floor(Math.random() * colors.length)]);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 12 + 3;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,60,10,0.55)");
    g.addColorStop(0.4, "rgba(255,100,20,0.3)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 500; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 16 + 2;
    const bg = bctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.15);
    bg.addColorStop(0, "rgba(25,25,25,0.55)");
    bg.addColorStop(0.55, "rgba(25,25,25,0.25)");
    bg.addColorStop(0.6, "rgba(235,235,235,0.55)");
    bg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  }

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 木卫二 纹理 + 凹凸贴图 ----
export function createEuropaMaps(size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createRadialGradient(
    size * 0.3,
    size * 0.3,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.7,
  );
  baseGrad.addColorStop(0, "#f0ece0");
  baseGrad.addColorStop(0.5, "#e8e0d4");
  baseGrad.addColorStop(1, "#d8d0c4");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.85, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.7, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0; i < 120; i++) {
    ctx.save();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.translate(sx, sy);
    ctx.rotate(Math.random() * Math.PI * 2);
    const len = Math.random() * size * 0.4 + size * 0.1;
    const w = Math.random() * 3.5 + 1;
    ctx.strokeStyle = `rgba(80,55,35,${0.15 + Math.random() * 0.35})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(-len * 0.3, 0);
    ctx.quadraticCurveTo(
      0,
      (Math.random() - 0.5) * len * 0.4,
      len * 0.5,
      (Math.random() - 0.5) * len * 0.2,
    );
    ctx.quadraticCurveTo(
      len * 0.7,
      (Math.random() - 0.5) * len * 0.5,
      len,
      (Math.random() - 0.5) * len * 0.1,
    );
    ctx.stroke();
    ctx.restore();
  }

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#888888";
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 200; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 10 + 1.5;
    const bg = bctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.15);
    bg.addColorStop(0, "rgba(30,30,30,0.4)");
    bg.addColorStop(0.6, "rgba(30,30,30,0.15)");
    bg.addColorStop(0.7, "rgba(220,220,220,0.5)");
    bg.addColorStop(1, "rgba(136,136,136,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  }

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 木卫三 纹理 + 凹凸贴图 ----
export function createGanymedeMaps(size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#b0a898";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 25;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.9, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.75, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0; i < 25; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 180 + 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(90,80,70,0.35)");
    g.addColorStop(0.5, "rgba(100,90,80,0.2)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 60; i++) {
    ctx.save();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.translate(sx, sy);
    ctx.rotate(Math.random() * Math.PI * 2);
    const len = Math.random() * size * 0.5 + size * 0.15;
    const w = Math.random() * 15 + 5;
    ctx.strokeStyle = `rgba(200,190,175,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-len * 0.4, 0);
    ctx.quadraticCurveTo(
      0,
      (Math.random() - 0.5) * len * 0.3,
      len * 0.6,
      (Math.random() - 0.5) * len * 0.2,
    );
    ctx.stroke();
    ctx.restore();
  }

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 450; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 14 + 2;
    const bg = bctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.15);
    bg.addColorStop(0, "rgba(25,25,25,0.55)");
    bg.addColorStop(0.55, "rgba(25,25,25,0.25)");
    bg.addColorStop(0.6, "rgba(230,230,230,0.6)");
    bg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  }

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 木卫四 纹理 + 凹凸贴图 ----
export function createCallistoMaps(size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createRadialGradient(
    size * 0.4,
    size * 0.4,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.65,
  );
  baseGrad.addColorStop(0, "#8a8078");
  baseGrad.addColorStop(0.5, "#706860");
  baseGrad.addColorStop(1, "#585048");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.85, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.7, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  const vx = size * 0.55,
    vy = size * 0.45;
  for (let ring = 0; ring < 4; ring++) {
    const rr = size * (0.12 + ring * 0.06);
    ctx.strokeStyle = `rgba(180,175,168,${0.25 - ring * 0.05})`;
    ctx.lineWidth = 2.5 + ring * 0.5;
    ctx.beginPath();
    ctx.arc(vx, vy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#787878";
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 700; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 14 + 2;
    const bg = bctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.15);
    bg.addColorStop(0, "rgba(20,20,20,0.6)");
    bg.addColorStop(0.5, "rgba(20,20,20,0.3)");
    bg.addColorStop(0.55, "rgba(225,225,225,0.65)");
    bg.addColorStop(1, "rgba(120,120,120,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  }

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

export function createMercuryMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_mercury.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

export function createJupiterMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_jupiter.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

export function createSaturnMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_saturn.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

export function createUranusMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_uranus.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

export function createNeptuneMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_neptune.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}

export function createEarthMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_earth_daymap.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const bumpMap = loader.load(TEX + "earth_normal_2048.jpg");
  bumpMap.colorSpace = THREE.LinearSRGBColorSpace;
  return { map, bumpMap };
}

export function createEarthCloudMap() {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_earth_clouds.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export function createVenusMaps(_size) {
  const loader = new THREE.TextureLoader();
  const map = loader.load(TEX + "2k_venus_surface.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, bumpMap: null };
}
