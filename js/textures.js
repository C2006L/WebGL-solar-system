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

// ---- 地球纹理（v4：蓝色海洋主导 ~71% + 精简大陆 + 2K分辨率） ----
export function createEarthMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const h = size / 2;

  // 深海渐变基底 — 中心深海军蓝，边缘过渡到亮蓝
  const oceanGrad = ctx.createRadialGradient(h * 0.4, h * 0.4, 0, h, h, h * 1.05);
  oceanGrad.addColorStop(0, "#0a2a55");
  oceanGrad.addColorStop(0.25, "#0d3d72");
  oceanGrad.addColorStop(0.5, "#1550a0");
  oceanGrad.addColorStop(0.75, "#1a60b8");
  oceanGrad.addColorStop(1, "#1860b0");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, size, size);

  // 海洋噪点
  const oceanImg = ctx.getImageData(0, 0, size, size);
  const od = oceanImg.data;
  for (let i = 0; i < od.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    od[i] = clamp(od[i] + n * 0.2, 0, 255);
    od[i + 1] = clamp(od[i + 1] + n * 0.5, 0, 255);
    od[i + 2] = clamp(od[i + 2] + n * 0.9, 0, 255);
  }
  ctx.putImageData(oceanImg, 0, 0);

  // 大陆 — 大幅缩小面积，约占球面 15-20%
  const continents = [
    // 北美洲（大幅缩小）
    { cx: 0.17, cy: 0.24, rx: 0.055, ry: 0.09, color: "#8a9960", mt: "plains" },
    { cx: 0.13, cy: 0.20, rx: 0.035, ry: 0.06, color: "#7a9048", mt: "forest" },
    // 南美洲
    { cx: 0.26, cy: 0.60, rx: 0.035, ry: 0.08, color: "#5a8830", mt: "forest" },
    // 欧洲
    { cx: 0.44, cy: 0.22, rx: 0.05, ry: 0.06, color: "#9a9e60", mt: "plains" },
    // 非洲（沙漠色为主）
    { cx: 0.46, cy: 0.50, rx: 0.05, ry: 0.10, color: "#aa9650", mt: "desert" },
    { cx: 0.44, cy: 0.58, rx: 0.03, ry: 0.04, color: "#5a8828", mt: "forest" },
    // 亚洲（减小核心大陆块）
    { cx: 0.58, cy: 0.24, rx: 0.10, ry: 0.08, color: "#8a9450", mt: "plains" },
    { cx: 0.66, cy: 0.28, rx: 0.05, ry: 0.04, color: "#b0a860", mt: "desert" },
    { cx: 0.55, cy: 0.32, rx: 0.04, ry: 0.04, color: "#9a9e50", mt: "plains" },
    // 东南亚岛屿链（更小的碎片）
    { cx: 0.72, cy: 0.42, rx: 0.025, ry: 0.035, color: "#488828", mt: "forest" },
    { cx: 0.76, cy: 0.45, rx: 0.02, ry: 0.025, color: "#408020", mt: "forest" },
    // 大洋洲
    { cx: 0.80, cy: 0.58, rx: 0.035, ry: 0.04, color: "#b8a060", mt: "desert" },
    // 日本
    { cx: 0.77, cy: 0.27, rx: 0.014, ry: 0.028, color: "#689038", mt: "forest" },
    // 中美洲
    { cx: 0.21, cy: 0.44, rx: 0.012, ry: 0.02, color: "#508828", mt: "forest" },
    // 格陵兰（冰雪色）
    { cx: 0.32, cy: 0.09, rx: 0.03, ry: 0.03, color: "#d8e8e8", mt: "ice" },
    // 马达加斯加
    { cx: 0.51, cy: 0.66, rx: 0.012, ry: 0.025, color: "#4a8828", mt: "forest" },
    // 新西兰
    { cx: 0.86, cy: 0.64, rx: 0.01, ry: 0.018, color: "#689040", mt: "forest" },
  ];

  // 凹凸贴图 Canvas
  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#505050";
  bctx.fillRect(0, 0, size, size);

  continents.forEach((area) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(area.cx * size, area.cy * size, area.rx * size, area.ry * size, 0, 0, Math.PI * 2);
    ctx.fillStyle = area.color;
    ctx.fill();

    const tCanvas = document.createElement("canvas");
    tCanvas.width = tCanvas.height = size;
    const tCtx = tCanvas.getContext("2d");
    tCtx.fillStyle = area.color;
    tCtx.fillRect(0, 0, size, size);
    const tImg = tCtx.getImageData(0, 0, size, size);
    const td = tImg.data;
    for (let j = 0; j < td.length; j += 4) {
      const n = (Math.random() - 0.5) * 28;
      td[j] = clamp(td[j] + n, 0, 255);
      td[j + 1] = clamp(td[j + 1] + n, 0, 255);
      td[j + 2] = clamp(td[j + 2] + n * 0.25, 0, 255);
    }
    tCtx.putImageData(tImg, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.drawImage(tCanvas, 0, 0);
    ctx.restore();

    bctx.save();
    bctx.beginPath();
    bctx.ellipse(area.cx * size, area.cy * size, area.rx * size, area.ry * size, 0, 0, Math.PI * 2);
    const bumpBase = area.mt === "desert" ? "#d0c0a0" : area.mt === "forest" ? "#c0c0c0" : area.mt === "ice" ? "#e0e0e0" : "#b8b8b8";
    bctx.fillStyle = bumpBase;
    bctx.fill();
    const btImg = bctx.getImageData(0, 0, size, size);
    const btd = btImg.data;
    for (let j = 0; j < btd.length; j += 4) {
      if (btd[j] > 100) {
        const n = (Math.random() - 0.5) * 50;
        btd[j] = btd[j + 1] = btd[j + 2] = clamp(190 + n, 100, 245);
      }
    }
    bctx.putImageData(btImg, 0, 0);
    bctx.restore();
  });

  // 海洋微小凹凸噪点
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 20 + 3;
    const bg = bctx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, "rgba(75,75,75,0.08)");
    bg.addColorStop(1, "rgba(80,80,80,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  // 极稀疏云层（非常淡）
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 14 + 1;
    ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.10})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 北极冰盖
  const iceN = ctx.createLinearGradient(0, 0, 0, size * 0.10);
  iceN.addColorStop(0, "rgba(235,245,255,0.85)");
  iceN.addColorStop(1, "rgba(235,245,255,0)");
  ctx.fillStyle = iceN;
  ctx.fillRect(0, 0, size, size * 0.10);

  // 南极冰盖
  const iceS = ctx.createLinearGradient(0, size, 0, size * 0.90);
  iceS.addColorStop(0, "rgba(235,245,255,0.85)");
  iceS.addColorStop(1, "rgba(235,245,255,0)");
  ctx.fillStyle = iceS;
  ctx.fillRect(0, size * 0.90, size, size * 0.10);

  // 冰盖凹凸（轻微凸起）
  const ibN = bctx.createLinearGradient(0, 0, 0, size * 0.10);
  ibN.addColorStop(0, "rgba(190,190,190,0.25)");
  ibN.addColorStop(1, "rgba(80,80,80,0)");
  bctx.fillStyle = ibN;
  bctx.fillRect(0, 0, size, size * 0.10);

  const ibS = bctx.createLinearGradient(0, size, 0, size * 0.90);
  ibS.addColorStop(0, "rgba(190,190,190,0.25)");
  ibS.addColorStop(1, "rgba(80,80,80,0)");
  bctx.fillStyle = ibS;
  bctx.fillRect(0, size * 0.90, size, size * 0.10);

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

  ctx.fillStyle = "hsl(38, 4%, 70%)";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  // 月海
  const maria = [
    { x: 0.3, y: 0.35, r: 0.22 },
    { x: 0.5, y: 0.45, r: 0.18 },
    { x: 0.25, y: 0.55, r: 0.15 },
    { x: 0.6, y: 0.3, r: 0.16 },
    { x: 0.4, y: 0.6, r: 0.14 },
    { x: 0.7, y: 0.5, r: 0.12 },
    { x: 0.35, y: 0.25, r: 0.1 },
  ];
  maria.forEach((m) => {
    const g = ctx.createRadialGradient(
      m.x * size,
      m.y * size,
      0,
      m.x * size,
      m.y * size,
      m.r * size,
    );
    g.addColorStop(0, "rgba(82,80,76,0.55)");
    g.addColorStop(0.5, "rgba(105,103,98,0.3)");
    g.addColorStop(1, "rgba(160,158,155,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m.x * size, m.y * size, m.r * size, 0, Math.PI * 2);
    ctx.fill();
  });

  // 凹凸贴图
  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);

  // 地表颗粒噪声
  const bimgBase = bctx.getImageData(0, 0, size, size);
  const bbd = bimgBase.data;
  for (let i = 0; i < bbd.length; i += 4) {
    const n = (Math.random() - 0.5) * 50;
    bbd[i] = bbd[i + 1] = bbd[i + 2] = clamp(128 + n, 60, 200);
  }
  bctx.putImageData(bimgBase, 0, 0);

  // 月海凹陷
  maria.forEach((m) => {
    const g = bctx.createRadialGradient(
      m.x * size,
      m.y * size,
      0,
      m.x * size,
      m.y * size,
      m.r * size,
    );
    g.addColorStop(0, "rgba(30,30,30,0.45)");
    g.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = g;
    bctx.beginPath();
    bctx.arc(m.x * size, m.y * size, m.r * size, 0, Math.PI * 2);
    bctx.fill();
  });

  // 环形山凹凸：边缘隆起(亮) + 内部凹陷(暗)
  const craters = [];
  for (let i = 0; i < 560; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 8 + 1.5;
    const gray = 145 + Math.random() * 45;
    craters.push({ cx, cy, r, gray });

    // 颜色纹理：环形山视觉效果
    const og = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.2);
    og.addColorStop(0, `rgba(${gray + 12},${gray + 9},${gray + 7},0)`);
    og.addColorStop(0.7, `rgba(${gray + 45},${gray + 42},${gray + 40},0.7)`);
    og.addColorStop(1, `rgba(${gray + 12},${gray + 9},${gray + 7},0)`);
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
    ig.addColorStop(0, `rgba(${gray - 38},${gray - 40},${gray - 42},0.85)`);
    ig.addColorStop(1, `rgba(${gray - 12},${gray - 14},${gray - 16},0)`);
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 凹凸贴图的环形山：外环亮+内环暗 → 3D凹凸感
  craters.forEach(({ cx, cy, r }) => {
    const rimGrad = bctx.createRadialGradient(
      cx,
      cy,
      r * 0.55,
      cx,
      cy,
      r * 1.15,
    );
    rimGrad.addColorStop(0, "rgba(25,25,25,0.65)");
    rimGrad.addColorStop(0.5, "rgba(25,25,25,0.35)");
    rimGrad.addColorStop(0.7, "rgba(235,235,235,0.7)");
    rimGrad.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = rimGrad;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  });

  return {
    map: canvasToTexture(c),
    bumpMap: canvasToLinearTexture(bc),
  };
}

// ---- 火星纹理 + 凹凸贴图 ----
export function createMarsMaps(size = 1024) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#c1440e";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 35;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n * 0.4, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n * 0.15, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  // 凹凸贴图
  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, size, size);

  // 暗色高原区域（颜色 + 凹凸）
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 120 + 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(120,50,20,0.4)");
    g.addColorStop(1, "rgba(180,70,30,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // 高原突起（白色）
    const bg = bctx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, "rgba(200,200,200,0.35)");
    bg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  // 陨石坑凹凸（火星上也有很多）
  for (let i = 0; i < 180; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 14 + 3;
    const cg = bctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.15);
    cg.addColorStop(0, "rgba(20,20,20,0.55)");
    cg.addColorStop(0.6, "rgba(20,20,20,0.25)");
    cg.addColorStop(0.7, "rgba(230,230,230,0.5)");
    cg.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = cg;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    bctx.fill();
  }

  // 陨石坑颜色
  for (let i = 0; i < 80; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = Math.random() * 14 + 3;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    cg.addColorStop(0, "rgba(80,30,10,0.45)");
    cg.addColorStop(1, "rgba(180,70,30,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 极地冰盖（颜色 + 凹凸平滑）
  const gradN = ctx.createLinearGradient(0, 0, 0, size * 0.12);
  gradN.addColorStop(0, "rgba(255,240,230,0.8)");
  gradN.addColorStop(1, "rgba(255,240,230,0)");
  ctx.fillStyle = gradN;
  ctx.fillRect(0, 0, size, size * 0.12);

  const gradS = ctx.createLinearGradient(0, size, 0, size * 0.88);
  gradS.addColorStop(0, "rgba(255,240,230,0.8)");
  gradS.addColorStop(1, "rgba(255,240,230,0)");
  ctx.fillStyle = gradS;
  ctx.fillRect(0, size * 0.88, size, size * 0.12);

  // 冰盖凹凸：轻微凸起
  const ibN = bctx.createLinearGradient(0, 0, 0, size * 0.12);
  ibN.addColorStop(0, "rgba(220,220,220,0.3)");
  ibN.addColorStop(1, "rgba(128,128,128,0)");
  bctx.fillStyle = ibN;
  bctx.fillRect(0, 0, size, size * 0.12);
  const ibS = bctx.createLinearGradient(0, size, 0, size * 0.88);
  ibS.addColorStop(0, "rgba(220,220,220,0.3)");
  ibS.addColorStop(1, "rgba(128,128,128,0)");
  bctx.fillStyle = ibS;
  bctx.fillRect(0, size * 0.88, size, size * 0.12);

  return {
    map: canvasToTexture(c),
    bumpMap: canvasToLinearTexture(bc),
  };
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
