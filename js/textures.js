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

// ---- 太阳纹理 + 凹凸贴图 ----
export function createSunMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const h = size / 2;

  const base = ctx.createRadialGradient(h, h, 0, h, h, h);
  base.addColorStop(0, "#fffbe0");
  base.addColorStop(0.3, "#ffe580");
  base.addColorStop(0.6, "#ff9900");
  base.addColorStop(0.85, "#e05500");
  base.addColorStop(1, "#993300");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.85, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.5, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 22 + 4;
    if (Math.hypot(x - h, y - h) > h * 0.75) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,210,0.5)");
    g.addColorStop(1, "rgba(255,200,50,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 太阳凹凸贴图：明亮的颗粒感（模拟米粒组织 granulation）
  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);
  const bimg = bctx.getImageData(0, 0, size, size);
  const bd = bimg.data;
  for (let i = 0; i < bd.length; i += 4) {
    const n = (Math.random() - 0.5) * 80;
    bd[i] = bd[i + 1] = bd[i + 2] = clamp(128 + n, 20, 235);
  }
  bctx.putImageData(bimg, 0, 0);
  // 太阳黑子暗区
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    if (Math.hypot(x - h, y - h) > h * 0.65) continue;
    const r = Math.random() * 18 + 4;
    const sg = bctx.createRadialGradient(x, y, 0, x, y, r);
    sg.addColorStop(0, "rgba(30,30,30,0.7)");
    sg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = sg;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  return {
    map: canvasToTexture(c),
    bumpMap: canvasToLinearTexture(bc),
  };
}

// ---- 月球纹理 + 凹凸贴图 ----
export function createMoonMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * size * 0.12 + size * 0.03;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(70,70,70,0.4)");
    g.addColorStop(0.5, "rgba(90,90,90,0.2)");
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

  const bimg = bctx.getImageData(0, 0, size, size);
  const bd = bimg.data;
  for (let i = 0; i < bd.length; i += 4) {
    const n = (Math.random() - 0.5) * 50;
    bd[i] = bd[i + 1] = bd[i + 2] = clamp(128 + n, 60, 200);
  }
  bctx.putImageData(bimg, 0, 0);

  for (let i = 0; i < 350; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 12 + 2;
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

// ---- 火星纹理 + 凹凸贴图 ----
export function createMarsMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createRadialGradient(
    size * 0.4,
    size * 0.4,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.7,
  );
  baseGrad.addColorStop(0, "#d05020");
  baseGrad.addColorStop(0.5, "#c1440e");
  baseGrad.addColorStop(1, "#8a3008");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 25;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.5, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.2, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 40 + 10;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(100,40,10,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const iceN = ctx.createLinearGradient(0, 0, 0, size * 0.08);
  iceN.addColorStop(0, "rgba(230,220,210,0.6)");
  iceN.addColorStop(1, "rgba(230,220,210,0)");
  ctx.fillStyle = iceN;
  ctx.fillRect(0, 0, size, size * 0.08);

  const iceS = ctx.createLinearGradient(0, size, 0, size * 0.92);
  iceS.addColorStop(0, "rgba(230,220,210,0.6)");
  iceS.addColorStop(1, "rgba(230,220,210,0)");
  ctx.fillStyle = iceS;
  ctx.fillRect(0, size * 0.92, size, size * 0.08);

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);

  const bimg = bctx.getImageData(0, 0, size, size);
  const bd = bimg.data;
  for (let i = 0; i < bd.length; i += 4) {
    const n = (Math.random() - 0.5) * 50;
    bd[i] = bd[i + 1] = bd[i + 2] = clamp(128 + n, 60, 200);
  }
  bctx.putImageData(bimg, 0, 0);

  for (let i = 0; i < 300; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 10 + 2;
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

// ---- 水星纹理 + 凹凸贴图 ----
// 策略：灰色岩石表面 + 密集环形山（无大气，与月球类似但更暗）

export function createMercuryMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#a09888";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.85, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.7, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);

  const bimgBase = bctx.getImageData(0, 0, size, size);
  const bbd = bimgBase.data;
  for (let i = 0; i < bbd.length; i += 4) {
    const n = (Math.random() - 0.5) * 45;
    bbd[i] = bbd[i + 1] = bbd[i + 2] = clamp(128 + n, 60, 200);
  }
  bctx.putImageData(bimgBase, 0, 0);

  for (let i = 0; i < 400; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 10 + 2;
    const gray = 140 + Math.random() * 40;

    const og = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.2);
    og.addColorStop(0, `rgba(${gray + 10},${gray + 8},${gray + 6},0)`);
    og.addColorStop(0.7, `rgba(${gray + 40},${gray + 37},${gray + 35},0.65)`);
    og.addColorStop(1, `rgba(${gray + 10},${gray + 8},${gray + 6},0)`);
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    const ig = ctx.createRadialGradient(
      cx - r * 0.15,
      cy - r * 0.15,
      0,
      cx,
      cy,
      r * 0.7,
    );
    ig.addColorStop(0, `rgba(${gray - 35},${gray - 37},${gray - 40},0.8)`);
    ig.addColorStop(1, `rgba(${gray - 10},${gray - 12},${gray - 15},0)`);
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    const cg = bctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r * 1.15);
    cg.addColorStop(0, "rgba(25,25,25,0.6)");
    cg.addColorStop(0.5, "rgba(25,25,25,0.3)");
    cg.addColorStop(0.7, "rgba(235,235,235,0.65)");
    cg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = cg;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  }

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 木星纹理 + 凹凸贴图 ----
// 策略：水平条纹 + 大红斑 + 湍流涡旋

export function createJupiterMaps(size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, "#e8c890");
  baseGrad.addColorStop(0.25, "#d4a060");
  baseGrad.addColorStop(0.5, "#e0c080");
  baseGrad.addColorStop(0.75, "#c89050");
  baseGrad.addColorStop(1, "#e8c890");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 水平条纹
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * size;
    const h = size / 40 + Math.random() * 8;
    const colors = [
      "#d4a060",
      "#e0c080",
      "#c89050",
      "#e8c890",
      "#b07840",
      "#f0d0a0",
    ];
    const stripeAlpha = 0.12 + Math.random() * 0.3;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.globalAlpha = stripeAlpha;
    ctx.fillRect(0, y, size, h);
  }
  ctx.globalAlpha = 1.0;

  // 湍流涡旋
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 40 + 8;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = Math.random() > 0.5;
    g.addColorStop(0, warm ? "rgba(220,150,80,0.3)" : "rgba(200,160,120,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 大红斑（位置固定）
  const spotX = size * 0.62,
    spotY = size * 0.45,
    spotR = size * 0.1;
  const spotGrad = ctx.createRadialGradient(
    spotX,
    spotY,
    0,
    spotX,
    spotY,
    spotR,
  );
  spotGrad.addColorStop(0, "rgba(220,100,60,0.75)");
  spotGrad.addColorStop(0.4, "rgba(240,140,80,0.6)");
  spotGrad.addColorStop(0.7, "rgba(240,160,100,0.3)");
  spotGrad.addColorStop(1, "rgba(200,140,80,0)");
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, spotR, spotR * 0.55, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * size;
    const h = size / 40;
    const alpha = 0.05 + Math.random() * 0.12;
    bctx.fillStyle = `rgba(${180 + Math.random() * 75},${180 + Math.random() * 75},${180 + Math.random() * 75},${alpha})`;
    bctx.fillRect(0, y, size, h);
  }

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 土星纹理 + 凹凸贴图 ----
// 策略：淡金黄条带 + 微妙环带阴影

export function createSaturnMaps(size = 2048) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, "#f0e0c0");
  baseGrad.addColorStop(0.3, "#e8d4a8");
  baseGrad.addColorStop(0.5, "#f0e0c0");
  baseGrad.addColorStop(0.7, "#e0c890");
  baseGrad.addColorStop(1, "#eedcc0");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 30; i++) {
    const y = (i / 30) * size;
    const h = size / 30 + Math.random() * 4;
    ctx.fillStyle = `rgba(${220 + Math.random() * 35},${190 + Math.random() * 40},${130 + Math.random() * 40},${0.05 + Math.random() * 0.12})`;
    ctx.fillRect(0, y, size, h);
  }

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.8, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.5, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#888888";
  bctx.fillRect(0, 0, size, size);

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 天王星纹理 + 凹凸贴图 ----
// 策略：青蓝色均匀表面（甲烷大气）+ 微弱条带

export function createUranusMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, "#8ec8e0");
  baseGrad.addColorStop(0.5, "#7ec0d8");
  baseGrad.addColorStop(1, "#8ec8e0");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * size;
    const h = size / 10;
    ctx.fillStyle = `rgba(${140 + Math.random() * 20},${200 + Math.random() * 30},${225 + Math.random() * 30},${0.03 + Math.random() * 0.06})`;
    ctx.fillRect(0, y, size, h);
  }

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    d[i] = clamp(d[i] + n * 0.4, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.7, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#888888";
  bctx.fillRect(0, 0, size, size);

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 海王星纹理 + 凹凸贴图 ----
// 策略：深蓝色（甲烷吸收红光更强烈）

export function createNeptuneMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, "#3355cc");
  baseGrad.addColorStop(0.5, "#2244aa");
  baseGrad.addColorStop(1, "#3355cc");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 14; i++) {
    const y = (i / 14) * size;
    const h = size / 14;
    ctx.fillStyle = `rgba(${30 + Math.random() * 30},${50 + Math.random() * 40},${180 + Math.random() * 75},${0.04 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, size, h);
  }

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i] = clamp(d[i] + n * 0.3, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.5, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#888888";
  bctx.fillRect(0, 0, size, size);

  return { map: canvasToTexture(c), bumpMap: canvasToLinearTexture(bc) };
}

// ---- 地球纹理（v6：NASA蓝色弹珠真实贴图 + 法线贴图 + 云层） ----
// 使用 Three.js 官方提供的 NASA 行星贴图
// earth_atmos_2048.jpg — 蓝色弹珠地球表面 (equirectangular)
// earth_normal_2048.jpg — 地形法线贴图 (用于 bumpMap)
// earth_specular_2048.jpg — 高光贴图 (海洋反光)
// earth_clouds_1024.png — 云层透明贴图

const EARTH_TEX_BASE = "https://threejs.org/examples/textures/planets/";

export function createEarthMaps() {
  const loader = new THREE.TextureLoader();

  const map = loader.load(EARTH_TEX_BASE + "earth_atmos_2048.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = loader.load(EARTH_TEX_BASE + "earth_normal_2048.jpg");
  bumpMap.colorSpace = THREE.LinearSRGBColorSpace;

  const specularMap = loader.load(EARTH_TEX_BASE + "earth_specular_2048.jpg");
  specularMap.colorSpace = THREE.LinearSRGBColorSpace;

  return { map, bumpMap, specularMap };
}

export function createEarthCloudMap() {
  const loader = new THREE.TextureLoader();
  const map = loader.load(EARTH_TEX_BASE + "earth_clouds_1024.png");
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

// ---- 金星纹理 + 凹凸贴图 ----
export function createVenusMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, "#e8d8b8");
  baseGrad.addColorStop(0.3, "#ddd0b0");
  baseGrad.addColorStop(0.5, "#e5d5b5");
  baseGrad.addColorStop(0.7, "#d8c8a5");
  baseGrad.addColorStop(1, "#e0d0b0");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.85, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.5, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  // 凹凸贴图：硫酸云起伏
  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#888888";
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 18; i++) {
    const y = (i / 18) * size;
    const bandHeight = size / 18;
    const alpha = 0.08 + Math.random() * 0.12;
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright
      ? `rgba(255,245,225,${alpha})`
      : `rgba(200,180,140,${alpha})`;
    ctx.fillRect(0, y, size, bandHeight);

    // 云带凹凸
    const bAlpha = bright ? 0.12 : 0.06;
    bctx.fillStyle = bright
      ? `rgba(200,200,200,${bAlpha})`
      : `rgba(80,80,80,${bAlpha})`;
    bctx.fillRect(0, y, size, bandHeight);
  }

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 50 + 10;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(245,235,210,0.25)");
    g.addColorStop(0.6, "rgba(235,225,200,0.1)");
    g.addColorStop(1, "rgba(230,220,195,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const bg = bctx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, "rgba(240,240,240,0.18)");
    bg.addColorStop(1, "rgba(136,136,136,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  return {
    map: canvasToTexture(c),
    bumpMap: canvasToLinearTexture(bc),
  };
}
