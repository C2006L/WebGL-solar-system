import * as THREE from "three";
import { t, getLang } from "./i18n.js";

const NEBULAE_DATA = [
  {
    file: "M42.jpg",
    key: "m42",
    nameZh: "猎户座大星云",
    nameEn: "Orion Nebula",
    catalog: "M42",
    typeZh: "发射星云",
    typeEn: "Emission Nebula",
    distLy: 1400,
    ra: 83.82,
    dec: -5.39,
    sceneDist: 2400,
    scale: 550,
  },
  {
    file: "M1.jpg",
    key: "m1",
    nameZh: "蟹状星云",
    nameEn: "Crab Nebula",
    catalog: "M1",
    typeZh: "超新星遗迹",
    typeEn: "Supernova Remnant",
    distLy: 6500,
    ra: 83.63,
    dec: 22.01,
    sceneDist: 2800,
    scale: 500,
  },
  {
    file: "B33.jpg",
    key: "b33",
    nameZh: "马头星云",
    nameEn: "Horsehead Nebula",
    catalog: "Barnard 33",
    typeZh: "暗星云",
    typeEn: "Dark Nebula",
    distLy: 1300,
    ra: 85.25,
    dec: -2.46,
    sceneDist: 2300,
    scale: 480,
  },
  {
    file: "M57.jpg",
    key: "m57",
    nameZh: "环状星云",
    nameEn: "Ring Nebula",
    catalog: "M57",
    typeZh: "行星状星云",
    typeEn: "Planetary Nebula",
    distLy: 2500,
    ra: 283.40,
    dec: 33.03,
    sceneDist: 2600,
    scale: 420,
  },
  {
    file: "M16.jpg",
    key: "m16",
    nameZh: "鹰星云",
    nameEn: "Eagle Nebula",
    catalog: "M16",
    typeZh: "发射星云",
    typeEn: "Emission Nebula",
    distLy: 7000,
    ra: 274.72,
    dec: -13.84,
    sceneDist: 2700,
    scale: 600,
  },
  {
    file: "M20.jpg",
    key: "m20",
    nameZh: "三叶星云",
    nameEn: "Trifid Nebula",
    catalog: "M20",
    typeZh: "发射/反射星云",
    typeEn: "Emission/Reflection Nebula",
    distLy: 5000,
    ra: 270.62,
    dec: -23.07,
    sceneDist: 2650,
    scale: 520,
  },
  {
    file: "NGC6960.jpg",
    key: "ngc6960",
    nameZh: "面纱星云",
    nameEn: "Veil Nebula",
    catalog: "NGC 6960",
    typeZh: "超新星遗迹",
    typeEn: "Supernova Remnant",
    distLy: 2100,
    ra: 311.43,
    dec: 30.97,
    sceneDist: 2550,
    scale: 650,
  },
  {
    file: "NGC6543.jpg",
    key: "ngc6543",
    nameZh: "猫眼星云",
    nameEn: "Cat's Eye Nebula",
    catalog: "NGC 6543",
    typeZh: "行星状星云",
    typeEn: "Planetary Nebula",
    distLy: 4400,
    ra: 269.64,
    dec: 66.63,
    sceneDist: 2450,
    scale: 430,
  },
];

function raDecToPosition(raDeg, decDeg, distance) {
  const ra = THREE.MathUtils.degToRad(raDeg);
  const dec = THREE.MathUtils.degToRad(decDeg);
  const cosDec = Math.cos(dec);
  return new THREE.Vector3(
    distance * cosDec * Math.sin(ra),
    distance * Math.sin(dec),
    distance * cosDec * Math.cos(ra),
  );
}

function processNebulaTexture(texture) {
  const img = texture.image;
  if (!img || !img.width) return;

  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  ctx.drawImage(img, 0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const px = imgData.data;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;
  const innerR = maxR * 0.28;
  const fadeStartR = maxR * 0.65;
  const brightnessThreshold = 18;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      if (dist > innerR) {
        if (dist >= fadeStartR) {
          const t = (dist - fadeStartR) / (maxR - fadeStartR);
          const edgeFade = 1 - t * t;
          luminance *= edgeFade;
        }

        if (luminance < brightnessThreshold) {
          px[i + 3] = 0;
        } else {
          const alphaBoost = Math.min(255, luminance);
          px[i + 3] = alphaBoost;
        }
      } else {
        if (luminance < brightnessThreshold * 0.7) {
          px[i + 3] = 0;
        } else {
          px[i + 3] = Math.min(255, luminance);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  texture.image = c;
  texture.needsUpdate = true;
}

let tipElement = null;
let currentNebula = null;
const _frustum = new THREE.Frustum();
const _projMatrix = new THREE.Matrix4();
const _worldPos = new THREE.Vector3();
const _screenPos = new THREE.Vector3();
const _halfW = new THREE.Vector2();

function createTipElement() {
  if (tipElement) return;
  tipElement = document.createElement("div");
  tipElement.id = "nebula-tip";
  tipElement.style.cssText =
    "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);" +
    "background:rgba(0,0,0,0.78);border:1px solid rgba(120,120,200,0.35);" +
    "border-radius:12px;padding:14px 24px;color:#ccc;" +
    "font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;" +
    "pointer-events:none;z-index:100;opacity:0;" +
    "transition:opacity 0.5s ease;text-align:center;" +
    "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);";
  document.body.appendChild(tipElement);
}

function updateTipContent(nebula) {
  if (!tipElement || !nebula) return;
  const lang = getLang();
  const name = lang === "zh" ? nebula.nameZh : nebula.nameEn;
  const altName = lang === "zh" ? nebula.nameEn : nebula.nameZh;
  const type = lang === "zh" ? nebula.typeZh : nebula.typeEn;
  const distStr = nebula.distLy.toLocaleString();

  tipElement.innerHTML =
    '<div style="font-size:19px;margin-bottom:7px;color:#fff;">' +
    "\u{1F30C} " +
    name +
    ' <span style="color:#777;font-size:13px;">(' +
    altName +
    " / " +
    nebula.catalog +
    ")</span>" +
    "</div>" +
    '<div style="color:#999;line-height:1.5;">' +
    t("nebulaDistance") +
    ": " +
    distStr +
    " " +
    t("nebulaUnitLy") +
    " &nbsp;|&nbsp; " +
    t("nebulaType") +
    ": " +
    type +
    "</div>";
}

function showTip(nebula) {
  if (currentNebula === nebula) return;
  currentNebula = nebula;
  updateTipContent(nebula);
  if (tipElement) tipElement.style.opacity = "1";
}

function hideTip() {
  if (!currentNebula) return;
  currentNebula = null;
  if (tipElement) tipElement.style.opacity = "0";
}

export function createNebulaSystem() {
  createTipElement();

  const group = new THREE.Group();
  group.name = "NebulaSystem";

  const loader = new THREE.TextureLoader();
  const nebulae = [];

  for (const data of NEBULAE_DATA) {
    const texture = loader.load("./textures/" + data.file, (tex) => {
      processNebulaTexture(tex);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.38,
      depthTest: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    const pos = raDecToPosition(data.ra, data.dec, data.sceneDist);
    sprite.position.copy(pos);
    sprite.scale.set(data.scale, data.scale, 1);

    sprite.userData.nebulaData = data;
    nebulae.push(sprite);
    group.add(sprite);
  }

  group.userData.materials = nebulae.map((s) => s.material);

  function updateHover(camera) {
    if (!tipElement) return;

    if (!group.visible) {
      hideTip();
      return;
    }

    _projMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    _frustum.setFromProjectionMatrix(_projMatrix);

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    _halfW.set(screenW / 2, screenH / 2);

    let bestNebula = null;
    let bestDist = Infinity;

    for (const sprite of nebulae) {
      sprite.getWorldPosition(_worldPos);

      if (!_frustum.containsPoint(_worldPos)) continue;

      _screenPos.copy(_worldPos).project(camera);

      const sx = _screenPos.x * _halfW.x + _halfW.x;
      const sy = -_screenPos.y * _halfW.y + _halfW.y;
      const dx = sx - _halfW.x;
      const dy = sy - _halfW.y;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);

      const maxDist = Math.min(_halfW.x, _halfW.y) * 0.55;
      if (distToCenter < maxDist && distToCenter < bestDist) {
        bestDist = distToCenter;
        bestNebula = sprite;
      }
    }

    if (bestNebula) {
      showTip(bestNebula.userData.nebulaData);
    } else {
      hideTip();
    }
  }

  return { group, updateHover };
}