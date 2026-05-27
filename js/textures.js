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

// ---- 地球纹理（v5：科学精确 — 71%海洋 + 七大洲四大洋 + 地形高度bump map） ----
// 等距矩形投影(equirectangular)，2048×1024，x=经度(-180°→+180°)，y=纬度(+90°→-90°)

function _drawContour(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function _drawTerrain(ctx, cx, cy, rx, ry, inner, outer, alpha) {
  const g = ctx.createRadialGradient(cx, cy, rx * 0.2, cx, cy, ry * 0.8);
  g.addColorStop(0, inner.replace("1)", alpha + ")"));
  g.addColorStop(1, outer.replace("1)", "0)"));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function createEarthMaps(size = 2048) {
  const H = size / 2;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = H;
  const ctx = c.getContext("2d");
  const S = (v) => v * size;
  const SY = (v) => v * H;

  // ── 1. 四大洋深海基底 ──
  const og = ctx.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, "#051e3e");
  og.addColorStop(0.08, "#0a3060");
  og.addColorStop(0.25, "#0d4080");
  og.addColorStop(0.5, "#1555a8");
  og.addColorStop(0.75, "#1a65c0");
  og.addColorStop(0.92, "#1860b5");
  og.addColorStop(1, "#0a3060");
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, size, H);

  const oi = ctx.getImageData(0, 0, size, H);
  const od = oi.data;
  for (let i = 0; i < od.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    od[i] = clamp(od[i] + n * 0.15, 0, 255);
    od[i + 1] = clamp(od[i + 1] + n * 0.4, 0, 255);
    od[i + 2] = clamp(od[i + 2] + n * 0.85, 0, 255);
  }
  ctx.putImageData(oi, 0, 0);

  // ── 2. 凹凸贴图 ──
  const bc = document.createElement("canvas");
  bc.width = size;
  bc.height = H;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#505050";
  bctx.fillRect(0, 0, size, H);

  // ── 3. 大陆绘制函数 ──
  function land(points, baseColor, bumpColor, terrains) {
    const scaled = points.map(([x, y]) => [S(x), SY(y)]);

    ctx.save();
    _drawContour(ctx, scaled);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    _drawContour(ctx, scaled);
    ctx.clip();
    if (terrains)
      terrains.forEach((t) =>
        _drawTerrain(
          ctx,
          S(t.cx),
          SY(t.cy),
          S(t.rx),
          SY(t.ry),
          t.inner,
          t.outer,
          t.alpha,
        ),
      );
    const nc = document.createElement("canvas");
    nc.width = size;
    nc.height = H;
    const nctx = nc.getContext("2d");
    nctx.fillStyle = baseColor;
    nctx.fillRect(0, 0, size, H);
    const nd = nctx.getImageData(0, 0, size, H);
    const nda = nd.data;
    for (let i = 0; i < nda.length; i += 4) {
      const n = (Math.random() - 0.5) * 24;
      nda[i] = clamp(nda[i] + n, 0, 255);
      nda[i + 1] = clamp(nda[i + 1] + n * 0.7, 0, 255);
      nda[i + 2] = clamp(nda[i + 2] + n * 0.3, 0, 255);
    }
    nctx.putImageData(nd, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.drawImage(nc, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    bctx.save();
    _drawContour(bctx, scaled);
    bctx.fillStyle = bumpColor;
    bctx.fill();
    const bd = bctx.getImageData(0, 0, size, H);
    const bda = bd.data;
    for (let i = 0; i < bda.length; i += 4) {
      if (bda[i] < 90 || bda[i + 3] === 0) continue;
      const n = (Math.random() - 0.5) * 55;
      bda[i] = bda[i + 1] = bda[i + 2] = clamp(195 + n, 120, 245);
    }
    bctx.putImageData(bd, 0, 0);
    bctx.restore();
  }

  // ── 4. 七大洲 + 主要岛屿 ──

  // 北美洲 (~170°W~55°W, 15°N~85°N)
  land(
    [
      [0.028, 0.04],
      [0.04, 0.02],
      [0.058, 0.015],
      [0.08, 0.018],
      [0.095, 0.025],
      [0.105, 0.02],
      [0.13, 0.03],
      [0.155, 0.022],
      [0.18, 0.028],
      [0.2, 0.04],
      [0.215, 0.055],
      [0.225, 0.08],
      [0.21, 0.11],
      [0.195, 0.135],
      [0.185, 0.155],
      [0.18, 0.175],
      [0.178, 0.2],
      [0.19, 0.23],
      [0.21, 0.26],
      [0.23, 0.285],
      [0.255, 0.305],
      [0.27, 0.325],
      [0.29, 0.34],
      [0.31, 0.35],
      [0.33, 0.37],
      [0.345, 0.39],
      [0.34, 0.41],
      [0.31, 0.42],
      [0.28, 0.415],
      [0.25, 0.4],
      [0.22, 0.38],
      [0.19, 0.355],
      [0.165, 0.37],
      [0.15, 0.39],
      [0.13, 0.405],
      [0.11, 0.41],
      [0.09, 0.395],
      [0.075, 0.37],
      [0.065, 0.34],
      [0.055, 0.3],
      [0.045, 0.25],
      [0.035, 0.19],
      [0.025, 0.13],
      [0.022, 0.08],
    ],
    "#7a9860",
    "#c0c0b0",
    [
      {
        cx: 0.22,
        cy: 0.28,
        rx: 0.045,
        ry: 0.055,
        inner: "rgba(180,160,110,1)",
        outer: "rgba(180,160,110,1)",
        alpha: "0.45",
      },
      {
        cx: 0.13,
        cy: 0.1,
        rx: 0.035,
        ry: 0.03,
        inner: "rgba(90,130,50,1)",
        outer: "rgba(90,130,50,1)",
        alpha: "0.5",
      },
      {
        cx: 0.26,
        cy: 0.35,
        rx: 0.03,
        ry: 0.025,
        inner: "rgba(120,95,40,1)",
        outer: "rgba(120,95,40,1)",
        alpha: "0.35",
      },
      {
        cx: 0.08,
        cy: 0.33,
        rx: 0.025,
        ry: 0.03,
        inner: "rgba(200,200,190,1)",
        outer: "rgba(200,200,190,1)",
        alpha: "0.3",
      },
    ],
  );

  // 格陵兰
  land(
    [
      [0.34, 0.04],
      [0.37, 0.038],
      [0.39, 0.055],
      [0.395, 0.08],
      [0.385, 0.105],
      [0.365, 0.12],
      [0.34, 0.125],
      [0.315, 0.118],
      [0.3, 0.1],
      [0.295, 0.075],
      [0.31, 0.05],
    ],
    "#dce8e8",
    "#e8e8e0",
    [
      {
        cx: 0.35,
        cy: 0.075,
        rx: 0.04,
        ry: 0.04,
        inner: "rgba(230,240,245,1)",
        outer: "rgba(230,240,245,1)",
        alpha: "0.8",
      },
    ],
  );

  // 南美洲 (~82°W~35°W, 55°S~12°N)
  land(
    [
      [0.19, 0.39],
      [0.21, 0.395],
      [0.235, 0.405],
      [0.252, 0.42],
      [0.258, 0.445],
      [0.252, 0.475],
      [0.248, 0.51],
      [0.242, 0.545],
      [0.235, 0.575],
      [0.228, 0.605],
      [0.225, 0.635],
      [0.222, 0.665],
      [0.215, 0.69],
      [0.205, 0.71],
      [0.19, 0.72],
      [0.175, 0.715],
      [0.165, 0.695],
      [0.17, 0.67],
      [0.172, 0.64],
      [0.175, 0.605],
      [0.18, 0.575],
      [0.185, 0.545],
      [0.188, 0.51],
      [0.185, 0.48],
      [0.178, 0.45],
      [0.172, 0.425],
      [0.178, 0.405],
    ],
    "#4a8828",
    "#a8b898",
    [
      {
        cx: 0.22,
        cy: 0.55,
        rx: 0.03,
        ry: 0.06,
        inner: "rgba(50,140,25,1)",
        outer: "rgba(50,140,25,1)",
        alpha: "0.55",
      },
      {
        cx: 0.195,
        cy: 0.65,
        rx: 0.015,
        ry: 0.035,
        inner: "rgba(70,120,40,1)",
        outer: "rgba(70,120,40,1)",
        alpha: "0.4",
      },
      {
        cx: 0.2,
        cy: 0.45,
        rx: 0.018,
        ry: 0.025,
        inner: "rgba(160,140,70,1)",
        outer: "rgba(160,140,70,1)",
        alpha: "0.35",
      },
    ],
  );

  // 欧洲 (~10°W~40°E, 35°N~71°N)
  land(
    [
      [0.42, 0.17],
      [0.438, 0.155],
      [0.455, 0.142],
      [0.475, 0.138],
      [0.495, 0.145],
      [0.515, 0.155],
      [0.53, 0.168],
      [0.54, 0.185],
      [0.538, 0.205],
      [0.528, 0.225],
      [0.52, 0.248],
      [0.51, 0.265],
      [0.495, 0.28],
      [0.485, 0.295],
      [0.475, 0.31],
      [0.465, 0.325],
      [0.452, 0.335],
      [0.438, 0.33],
      [0.425, 0.315],
      [0.415, 0.295],
      [0.408, 0.27],
      [0.405, 0.245],
      [0.408, 0.22],
      [0.412, 0.195],
    ],
    "#90a060",
    "#c8c8b8",
    [
      {
        cx: 0.475,
        cy: 0.2,
        rx: 0.03,
        ry: 0.03,
        inner: "rgba(130,160,70,1)",
        outer: "rgba(130,160,70,1)",
        alpha: "0.4",
      },
      {
        cx: 0.5,
        cy: 0.24,
        rx: 0.02,
        ry: 0.025,
        inner: "rgba(160,150,110,1)",
        outer: "rgba(160,150,110,1)",
        alpha: "0.35",
      },
    ],
  );

  // 非洲 (~18°W~51°E, 35°S~37°N)
  land(
    [
      [0.43, 0.31],
      [0.445, 0.305],
      [0.462, 0.315],
      [0.48, 0.32],
      [0.495, 0.33],
      [0.505, 0.348],
      [0.512, 0.368],
      [0.515, 0.39],
      [0.51, 0.415],
      [0.505, 0.44],
      [0.498, 0.465],
      [0.492, 0.49],
      [0.488, 0.515],
      [0.485, 0.54],
      [0.48, 0.565],
      [0.475, 0.59],
      [0.468, 0.615],
      [0.458, 0.638],
      [0.448, 0.655],
      [0.438, 0.665],
      [0.428, 0.66],
      [0.42, 0.64],
      [0.415, 0.615],
      [0.412, 0.59],
      [0.415, 0.565],
      [0.418, 0.54],
      [0.42, 0.51],
      [0.42, 0.485],
      [0.418, 0.455],
      [0.415, 0.43],
      [0.415, 0.405],
      [0.418, 0.38],
      [0.42, 0.355],
      [0.422, 0.335],
    ],
    "#a89840",
    "#c0b880",
    [
      {
        cx: 0.45,
        cy: 0.36,
        rx: 0.04,
        ry: 0.05,
        inner: "rgba(210,180,80,1)",
        outer: "rgba(210,180,80,1)",
        alpha: "0.5",
      },
      {
        cx: 0.46,
        cy: 0.48,
        rx: 0.03,
        ry: 0.06,
        inner: "rgba(80,140,35,1)",
        outer: "rgba(80,140,35,1)",
        alpha: "0.45",
      },
      {
        cx: 0.435,
        cy: 0.63,
        rx: 0.02,
        ry: 0.03,
        inner: "rgba(160,150,70,1)",
        outer: "rgba(160,150,70,1)",
        alpha: "0.35",
      },
    ],
  );

  // 亚洲 (~26°E~170°W, 10°S~77°N)
  land(
    [
      [0.53, 0.145],
      [0.55, 0.135],
      [0.575, 0.13],
      [0.6, 0.125],
      [0.625, 0.118],
      [0.65, 0.11],
      [0.675, 0.108],
      [0.7, 0.112],
      [0.725, 0.12],
      [0.75, 0.132],
      [0.77, 0.148],
      [0.785, 0.165],
      [0.795, 0.185],
      [0.8, 0.205],
      [0.79, 0.225],
      [0.775, 0.245],
      [0.755, 0.26],
      [0.735, 0.278],
      [0.715, 0.295],
      [0.695, 0.315],
      [0.68, 0.335],
      [0.665, 0.35],
      [0.652, 0.365],
      [0.64, 0.385],
      [0.632, 0.405],
      [0.625, 0.425],
      [0.618, 0.445],
      [0.61, 0.465],
      [0.6, 0.48],
      [0.585, 0.485],
      [0.57, 0.478],
      [0.555, 0.465],
      [0.542, 0.445],
      [0.532, 0.425],
      [0.525, 0.4],
      [0.522, 0.375],
      [0.525, 0.35],
      [0.525, 0.325],
      [0.522, 0.3],
      [0.518, 0.275],
      [0.515, 0.25],
      [0.518, 0.225],
      [0.522, 0.2],
      [0.525, 0.175],
    ],
    "#8a9458",
    "#c0c0a8",
    [
      {
        cx: 0.68,
        cy: 0.25,
        rx: 0.035,
        ry: 0.03,
        inner: "rgba(190,170,80,1)",
        outer: "rgba(190,170,80,1)",
        alpha: "0.45",
      },
      {
        cx: 0.72,
        cy: 0.18,
        rx: 0.025,
        ry: 0.02,
        inner: "rgba(120,150,70,1)",
        outer: "rgba(120,150,70,1)",
        alpha: "0.4",
      },
      {
        cx: 0.6,
        cy: 0.2,
        rx: 0.03,
        ry: 0.025,
        inner: "rgba(170,160,120,1)",
        outer: "rgba(170,160,120,1)",
        alpha: "0.35",
      },
      {
        cx: 0.55,
        cy: 0.42,
        rx: 0.025,
        ry: 0.02,
        inner: "rgba(70,120,30,1)",
        outer: "rgba(70,120,30,1)",
        alpha: "0.4",
      },
      {
        cx: 0.65,
        cy: 0.38,
        rx: 0.02,
        ry: 0.018,
        inner: "rgba(200,190,140,1)",
        outer: "rgba(200,190,140,1)",
        alpha: "0.3",
      },
    ],
  );

  // 东南亚群岛 (~95°E~130°E, 10°S~10°N)
  land(
    [
      [0.758, 0.385],
      [0.775, 0.382],
      [0.79, 0.388],
      [0.805, 0.395],
      [0.81, 0.405],
      [0.805, 0.418],
      [0.795, 0.428],
      [0.78, 0.432],
      [0.765, 0.428],
      [0.755, 0.418],
      [0.75, 0.405],
      [0.752, 0.395],
    ],
    "#3a8020",
    "#a0b890",
    [],
  );
  land(
    [
      [0.77, 0.445],
      [0.785, 0.448],
      [0.798, 0.452],
      [0.805, 0.462],
      [0.8, 0.472],
      [0.79, 0.478],
      [0.778, 0.475],
      [0.768, 0.465],
      [0.765, 0.455],
    ],
    "#3a8020",
    "#a0b890",
    [],
  );

  // 大洋洲 (~113°E~155°E, 39°S~10°S)
  land(
    [
      [0.745, 0.535],
      [0.765, 0.528],
      [0.788, 0.522],
      [0.808, 0.525],
      [0.825, 0.535],
      [0.838, 0.55],
      [0.842, 0.57],
      [0.838, 0.59],
      [0.825, 0.608],
      [0.808, 0.622],
      [0.79, 0.63],
      [0.77, 0.628],
      [0.752, 0.618],
      [0.74, 0.602],
      [0.732, 0.582],
      [0.73, 0.562],
      [0.735, 0.548],
    ],
    "#b89850",
    "#c8b888",
    [
      {
        cx: 0.78,
        cy: 0.565,
        rx: 0.04,
        ry: 0.035,
        inner: "rgba(200,160,70,1)",
        outer: "rgba(200,160,70,1)",
        alpha: "0.5",
      },
      {
        cx: 0.808,
        cy: 0.59,
        rx: 0.02,
        ry: 0.018,
        inner: "rgba(120,100,50,1)",
        outer: "rgba(120,100,50,1)",
        alpha: "0.35",
      },
    ],
  );

  // 新西兰
  land(
    [
      [0.855, 0.62],
      [0.864, 0.618],
      [0.87, 0.628],
      [0.868, 0.64],
      [0.86, 0.648],
      [0.852, 0.645],
      [0.848, 0.635],
      [0.85, 0.625],
    ],
    "#588a35",
    "#b0c0a0",
    [],
  );

  // 日本
  land(
    [
      [0.765, 0.235],
      [0.775, 0.23],
      [0.778, 0.242],
      [0.778, 0.258],
      [0.772, 0.272],
      [0.765, 0.282],
      [0.76, 0.278],
      [0.755, 0.265],
      [0.755, 0.248],
      [0.76, 0.238],
    ],
    "#5a9035",
    "#b8c0a8",
    [],
  );

  // 马达加斯加
  land(
    [
      [0.505, 0.625],
      [0.512, 0.62],
      [0.518, 0.63],
      [0.518, 0.648],
      [0.512, 0.66],
      [0.505, 0.665],
      [0.498, 0.658],
      [0.495, 0.642],
      [0.498, 0.63],
    ],
    "#428828",
    "#a8b898",
    [],
  );

  // 中美洲
  land(
    [
      [0.195, 0.38],
      [0.205, 0.385],
      [0.212, 0.395],
      [0.215, 0.41],
      [0.21, 0.425],
      [0.2, 0.435],
      [0.192, 0.43],
      [0.188, 0.415],
      [0.19, 0.4],
    ],
    "#509028",
    "#b0c0a0",
    [],
  );

  // 南极洲
  land(
    [
      [0.0, 0.835],
      [0.1, 0.84],
      [0.2, 0.838],
      [0.3, 0.845],
      [0.4, 0.835],
      [0.5, 0.84],
      [0.6, 0.838],
      [0.7, 0.845],
      [0.8, 0.835],
      [0.9, 0.842],
      [1.0, 0.835],
      [1.0, 1.0],
      [0.0, 1.0],
    ],
    "#e0e8f0",
    "#e8e8e0",
    [
      {
        cx: 0.5,
        cy: 0.92,
        rx: 0.4,
        ry: 0.06,
        inner: "rgba(235,242,250,1)",
        outer: "rgba(235,242,250,1)",
        alpha: "0.7",
      },
    ],
  );

  // 冰岛
  land(
    [
      [0.385, 0.135],
      [0.398, 0.132],
      [0.408, 0.14],
      [0.405, 0.152],
      [0.395, 0.158],
      [0.385, 0.155],
      [0.38, 0.145],
    ],
    "#c8d8d8",
    "#d8d8d0",
    [],
  );

  // ── 5. 海洋凹凸噪点 ──
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size,
      y = Math.random() * H,
      r = Math.random() * 15 + 2;
    const bg = bctx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, "rgba(68,68,68,0.12)");
    bg.addColorStop(1, "rgba(80,80,80,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  // ── 6. 海洋深度带 ──
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size,
      y = Math.random() * H,
      r = Math.random() * 180 + 60;
    const dg = ctx.createRadialGradient(x, y, 0, x, y, r);
    dg.addColorStop(0, "rgba(5,20,60,0.25)");
    dg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 7. 稀疏云层 ──
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size,
      y = Math.random() * H,
      r = Math.random() * 22 + 2;
    ctx.fillStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 8. 极地冰盖凹凸 ──
  const ng = bctx.createLinearGradient(0, 0, 0, H * 0.08);
  ng.addColorStop(0, "rgba(190,190,190,0.3)");
  ng.addColorStop(1, "rgba(80,80,80,0)");
  bctx.fillStyle = ng;
  bctx.fillRect(0, 0, size, H * 0.08);

  const sg = bctx.createLinearGradient(0, H, 0, H * 0.88);
  sg.addColorStop(0, "rgba(190,190,190,0.3)");
  sg.addColorStop(1, "rgba(80,80,80,0)");
  bctx.fillStyle = sg;
  bctx.fillRect(0, H * 0.88, size, H * 0.12);

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

// ---- 木卫一 纹理 + 凹凸贴图 ----
// 太阳系最活跃的火山体，硫磺地表，黄/橙/红色为主
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
// 冰壳表面，白色/浅米色基底 + 暗色线性裂缝(lineae)
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

  // 暗色裂缝线条
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

  // 混沌地形浅色斑块
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 40 + 8;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(245,240,230,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#888888";
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 120; i++) {
    bctx.save();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    bctx.translate(sx, sy);
    bctx.rotate(Math.random() * Math.PI * 2);
    const len = Math.random() * size * 0.4 + size * 0.1;
    const w = Math.random() * 4 + 1.5;
    bctx.strokeStyle = `rgba(40,40,40,${0.3 + Math.random() * 0.4})`;
    bctx.lineWidth = w;
    bctx.beginPath();
    bctx.moveTo(-len * 0.3, 0);
    bctx.quadraticCurveTo(
      len * 0.2,
      (Math.random() - 0.5) * len * 0.3,
      len * 0.7,
      (Math.random() - 0.5) * len * 0.3,
    );
    bctx.stroke();
    bctx.restore();
  }

  // 环形山
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
// 太阳系最大卫星，混合地形：暗色古老陨击区 + 亮色沟槽地形
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

  // 暗色古老区域
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

  // 亮色沟槽地形条带
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

  // 亮色沟槽在凹凸图中为凸起
  for (let i = 0; i < 60; i++) {
    bctx.save();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    bctx.translate(sx, sy);
    bctx.rotate(Math.random() * Math.PI * 2);
    const len = Math.random() * size * 0.5 + size * 0.15;
    const w = Math.random() * 15 + 5;
    bctx.strokeStyle = `rgba(220,220,215,${0.25 + Math.random() * 0.35})`;
    bctx.lineWidth = w;
    bctx.lineCap = "round";
    bctx.beginPath();
    bctx.moveTo(-len * 0.4, 0);
    bctx.quadraticCurveTo(
      0,
      (Math.random() - 0.5) * len * 0.3,
      len * 0.6,
      (Math.random() - 0.5) * len * 0.2,
    );
    bctx.stroke();
    bctx.restore();
  }

  // 密集环形山
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
// 太阳系陨击最多的天体，均匀暗灰色 + 无数陨石坑
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

  // Valhalla 多环盆地（巨大撞击特征）
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
  const vg = ctx.createRadialGradient(vx, vy, 0, vx, vy, size * 0.08);
  vg.addColorStop(0, "rgba(200,195,188,0.35)");
  vg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.arc(vx, vy, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  const bc = document.createElement("canvas");
  bc.width = bc.height = size;
  const bctx = bc.getContext("2d");
  bctx.fillStyle = "#787878";
  bctx.fillRect(0, 0, size, size);

  const bimg = bctx.getImageData(0, 0, size, size);
  const bd = bimg.data;
  for (let i = 0; i < bd.length; i += 4) {
    const n = (Math.random() - 0.5) * 35;
    bd[i] = bd[i + 1] = bd[i + 2] = clamp(120 + n, 60, 190);
  }
  bctx.putImageData(bimg, 0, 0);

  // Valhalla 凹凸
  for (let ring = 0; ring < 4; ring++) {
    const rr = size * (0.12 + ring * 0.06);
    bctx.strokeStyle = `rgba(200,200,200,${0.3 - ring * 0.06})`;
    bctx.lineWidth = 3 + ring * 0.5;
    bctx.beginPath();
    bctx.arc(vx, vy, rr, 0, Math.PI * 2);
    bctx.stroke();
  }

  // 极密集环形山 — 木卫四特征
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
