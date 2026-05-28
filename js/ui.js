// ============================================================
// ui.js — UI 面板管理（v4：标签导航 + 聚焦联动）
// ============================================================

import { BODIES } from "./constants.js";

export function updateSpeedDisplay(value) {
  const el = document.getElementById("speed-display");
  if (el) el.textContent = value.toFixed(1) + "x";
}

export function updateFPS(fps) {
  const el = document.getElementById("fps-display");
  if (el) el.textContent = "FPS: " + fps;
}

export function highlightPresetButton(presetKey) {
  const container = document.getElementById("view-presets");
  if (!container) return;
  const indexMap = { free: 0, topDown: 1 };
  const idx = indexMap[presetKey];
  const buttons = container.querySelectorAll("button");
  buttons.forEach((b, i) => b.classList.toggle("active", i === idx));
}

let activeInfoKey = null;
let isDetailOpen = false;

export function showObjectInfo(key, x, y, cfg) {
  activeInfoKey = key;
  isDetailOpen = false;
  const panel = ensureInfoPanel();

  const typeLabel =
    cfg.type === "star" ? "Star" : cfg.type === "planet" ? "Planet" : "Moon";
  const typeIcon =
    cfg.type === "star" ? "★" : cfg.type === "planet" ? "●" : "○";

  panel.innerHTML = `
    <div class="ip-header">
      <span class="ip-dot" style="background-color:${cfg.color}"></span>
      <span class="ip-icon">${typeIcon}</span>
      <span class="ip-name">${cfg.name}</span>
      <span class="ip-type">${typeLabel}</span>
      <button class="ip-close" id="ip-close-btn">×</button>
    </div>
    <div class="ip-divider"></div>
    <div class="ip-core">
      <div class="ip-row"><span class="ip-label">半径</span><span class="ip-val">${cfg.realRadius ? cfg.realRadius.toLocaleString() + " km" : "—"}</span></div>
      <div class="ip-row"><span class="ip-label">轨道</span><span class="ip-val">${cfg.realAU ? cfg.realAU + " AU" : cfg.type === "moon" ? cfg.orbitRadius.toFixed(1) + " (sim)" : "—"}</span></div>
      <div class="ip-row"><span class="ip-label">公转</span><span class="ip-val">${cfg.realPeriod ? formatPeriod(cfg.realPeriod) : "—"}</span></div>
    </div>
    <div class="ip-detail-section" id="ip-detail-section" style="display:none;">
      <div class="ip-divider"></div>
      <div class="ip-group-title">物理参数</div>
      <div class="ip-row"><span class="ip-label">质量</span><span class="ip-val">${cfg.mass ? (cfg.mass >= 1 ? cfg.mass.toLocaleString() + " 地球" : cfg.mass.toFixed(4) + " 地球") : "—"}</span></div>
      <div class="ip-row"><span class="ip-label">重力</span><span class="ip-val">${cfg.gravity != null ? cfg.gravity + " m/s²" : "—"}</span></div>
      <div class="ip-row"><span class="ip-label">温度</span><span class="ip-val">${cfg.temperature || "—"}</span></div>
      <div class="ip-divider"></div>
      <div class="ip-group-title">轨道数据</div>
      <div class="ip-row"><span class="ip-label">轨道半径</span><span class="ip-val">${cfg.realAU ? cfg.realAU + " AU" : "—"}</span></div>
      ${cfg.orbitalIncl != null ? '<div class="ip-row"><span class="ip-label">轨道倾角</span><span class="ip-val">' + cfg.orbitalIncl + "°</span></div>" : ""}
      ${cfg.selfRotationSpeed ? '<div class="ip-row"><span class="ip-label">自转周期</span><span class="ip-val">' + ((2 * Math.PI) / Math.abs(cfg.selfRotationSpeed)).toFixed(2) + " 天</span></div>" : ""}
      ${cfg.axialTilt != null ? '<div class="ip-row"><span class="ip-label">轴倾角</span><span class="ip-val">' + cfg.axialTilt + "°</span></div>" : ""}
      <div class="ip-divider"></div>
      <div class="ip-group-title">特征</div>
      ${cfg.atmosphere ? '<div class="ip-row ip-row-wrap"><span class="ip-label">大气</span><span class="ip-val">' + cfg.atmosphere + "</span></div>" : ""}
      ${cfg.moonCount != null && cfg.moonCount > 0 ? '<div class="ip-row"><span class="ip-label">卫星</span><span class="ip-val">' + cfg.moonCount + " 颗</span></div>" : ""}
      <div class="ip-row ip-row-wrap"><span class="ip-label">描述</span><span class="ip-val ip-desc">${cfg.description || "—"}</span></div>
      ${cfg.discovery ? '<div class="ip-row"><span class="ip-label">发现</span><span class="ip-val">' + cfg.discovery + "</span></div>" : ""}
      <div style="margin-top:12px; text-align:center;">
        <button class="ip-focus-btn" id="ip-focus-btn">🎯 聚焦此星球</button>
      </div>
    </div>
    <div class="ip-actions">
      <button class="ip-detail-btn" id="ip-detail-btn">📋 详情</button>
    </div>
  `;

  positionPanel(x, y);
  panel.classList.add("visible");

  setupPanelEvents(key);
}

function ensureInfoPanel() {
  let panel = document.getElementById("object-info");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "object-info";
    document.body.appendChild(panel);
  }
  return panel;
}

function positionPanel(x, y) {
  const panel = document.getElementById("object-info");
  if (!panel) return;
  const pw = panel.offsetWidth || 230;
  const ph = panel.offsetHeight || 150;
  let left = x + 30;
  let top = y - ph - 20;
  if (left + pw > window.innerWidth - 180) left = x - pw - 30;
  if (top < 10) top = y + 30;
  if (left < 10) left = 10;
  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.style.right = "auto";
  panel.style.transform = "none";
}

function setupPanelEvents(key) {
  const detailBtn = document.getElementById("ip-detail-btn");
  const focusBtn = document.getElementById("ip-focus-btn");
  const closeBtn = document.getElementById("ip-close-btn");
  const detailSec = document.getElementById("ip-detail-section");
  const actions = document.querySelector("#object-info .ip-actions");

  if (detailBtn) {
    detailBtn.addEventListener("click", () => {
      isDetailOpen = !isDetailOpen;
      if (isDetailOpen) {
        detailSec.style.display = "block";
        if (actions) actions.style.display = "none";
        detailBtn.textContent = "📋 收起";
      } else {
        detailSec.style.display = "none";
        if (actions) actions.style.display = "flex";
        detailBtn.textContent = "📋 详情";
      }
      positionPanel(
        parseFloat(document.getElementById("object-info").style.left || 0),
        parseFloat(document.getElementById("object-info").style.top || 0),
      );
    });
  }

  if (focusBtn) {
    focusBtn.addEventListener("click", () => {
      if (window._onFocusBody) window._onFocusBody(key);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      hideObjectInfo();
    });
  }
}

export function hideObjectInfo() {
  activeInfoKey = null;
  isDetailOpen = false;
  const panel = document.getElementById("object-info");
  if (panel) panel.classList.remove("visible");
}

function formatPeriod(days) {
  if (days >= 365.25) {
    const yr = days / 365.25;
    return days.toFixed(0) + " 天 (" + yr.toFixed(2) + " 年)";
  }
  return days.toFixed(1) + " 天";
}

export function toggleHelp() {
  const existing = document.querySelector(".help-overlay");
  if (existing) {
    existing.remove();
    return;
  }

  const div = document.createElement("div");
  div.className = "help-overlay";
  div.innerHTML = `
        <div style="font-size:18px;color:#fff;margin-bottom:10px;">Controls</div>
        <div><b>Mouse Drag</b> — Rotate view</div>
        <div><b>Scroll</b> — Zoom in/out</div>
        <div><b>Right Drag</b> — Pan</div>
        <div class="section-title">Keyboard</div>
        <div><b>↑ / ↓</b> — Speed up / slow down</div>
        <div><b>Space</b> — Pause / Resume</div>
        <div><b>R</b> — Reset simulation</div>
        <div><b>1-2</b> — Camera presets (Free/Top)</div>
        <div><b>O</b> — Toggle orbit lines</div>
        <div><b>H</b> — Toggle this help</div>
        <div><b>Esc</b> — Cancel focus</div>
        <div class="section-title">Mouse</div>
        <div><b>Click planet</b> — Show info</div>
        <div><b>Double-click</b> — Focus on body</div>
        <div style="margin-top:14px;color:#777;font-size:11px;">22 celestial bodies · double-click to focus · click anywhere to close</div>
    `;
  div.addEventListener("click", () => div.remove());
  document.body.appendChild(div);
}

export function hideLoading() {
  const el = document.getElementById("loading");
  if (el) {
    el.style.opacity = "0";
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 500);
  }
}

setTimeout(function () {
  var el = document.getElementById("loading");
  if (el) {
    console.warn("Loading timeout — forcing hide");
    el.style.opacity = "0";
    setTimeout(() => {
      if (el && el.parentNode) el.remove();
    }, 500);
  }
}, 8000);

export function createViewPresetButtons(onPresetClick) {
  const container = document.createElement("div");
  container.id = "view-presets";
  const presets = [
    { key: "free", label: "1 Free" },
    { key: "topDown", label: "2 Top" },
  ];
  presets.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.textContent = p.label;
    btn.addEventListener("click", () => {
      container
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onPresetClick(p.key);
    });
    if (i === 0) btn.classList.add("active");
    container.appendChild(btn);
  });
  document.body.appendChild(container);
}

export function createLightToggleButton(onToggle) {
  const container = document.createElement("div");
  container.id = "light-toggle";
  const btn = document.createElement("button");
  let isOn = false;
  btn.textContent = "💡 开灯";
  btn.addEventListener("click", () => {
    isOn = !isOn;
    btn.textContent = isOn ? "💡 关灯" : "💡 开灯";
    btn.classList.toggle("active", isOn);
    onToggle(isOn);
  });
  container.appendChild(btn);
  document.body.appendChild(container);
}

export function createOrbitToggleButton(onToggle) {
  const container = document.createElement("div");
  container.id = "orbit-toggle";
  const btn = document.createElement("button");
  let visible = true;
  btn.textContent = "O Orbits";
  btn.addEventListener("click", () => {
    visible = !visible;
    btn.textContent = "O " + (visible ? "Hide" : "Show") + " Orbits";
    onToggle(visible);
  });
  container.appendChild(btn);
  document.body.appendChild(container);
}

// ---- 右侧星体标签导航系统 ----

const LABEL_ORDER = [
  { key: "sun", indent: 0 },
  { key: "mercury", indent: 0 },
  { key: "venus", indent: 0 },
  { key: "earth", indent: 0 },
  { key: "moon", indent: 1 },
  { key: "mars", indent: 0 },
  { key: "phobos", indent: 1 },
  { key: "deimos", indent: 1 },
  { key: "jupiter", indent: 0 },
  { key: "io", indent: 1 },
  { key: "europa", indent: 1 },
  { key: "ganymede", indent: 1 },
  { key: "callisto", indent: 1 },
  { key: "saturn", indent: 0 },
  { key: "titan", indent: 1 },
  { key: "rhea", indent: 1 },
  { key: "dione", indent: 1 },
  { key: "tethys", indent: 1 },
  { key: "enceladus", indent: 1 },
  { key: "mimas", indent: 1 },
  { key: "uranus", indent: 0 },
  { key: "neptune", indent: 0 },
];

const TYPE_ICONS = { star: "★", planet: "●", moon: "○" };

let labelContainer = null;

export function createLabelNavigation(bodyRefs, onFocusBody) {
  labelContainer = document.createElement("div");
  labelContainer.id = "body-labels";

  for (const item of LABEL_ORDER) {
    const cfg = BODIES[item.key];
    if (!cfg || !bodyRefs[item.key]) continue;

    const label = document.createElement("div");
    label.className = "body-label" + (item.indent > 0 ? " moon" : "");
    label.dataset.key = item.key;

    const dot = document.createElement("span");
    dot.className = "body-label-dot";
    dot.style.backgroundColor = cfg.color;

    const icon = document.createElement("span");
    icon.className = "body-label-icon";
    icon.textContent = TYPE_ICONS[cfg.type] || "●";

    const info = document.createElement("div");
    info.className = "body-label-info";

    const nameEl = document.createElement("div");
    nameEl.className = "body-label-name";
    nameEl.textContent = cfg.name;

    const typeEl = document.createElement("div");
    typeEl.className = "body-label-type";
    typeEl.textContent =
      cfg.type + (cfg.realRadius ? " · " + formatRadius(cfg.realRadius) : "");

    info.appendChild(nameEl);
    info.appendChild(typeEl);

    label.appendChild(dot);
    label.appendChild(icon);
    label.appendChild(info);

    label.addEventListener("click", () => {
      if (onFocusBody) onFocusBody(item.key);
    });

    labelContainer.appendChild(label);
  }

  document.body.appendChild(labelContainer);
  return labelContainer;
}

function formatRadius(km) {
  if (km >= 10000) return (km / 1000).toFixed(0) + "k km";
  return km.toLocaleString() + " km";
}

export function highlightLabel(bodyKey) {
  if (!labelContainer) return;
  labelContainer.querySelectorAll(".body-label").forEach((el) => {
    el.classList.toggle("active", el.dataset.key === bodyKey);
  });
}

export function clearLabelHighlight() {
  if (!labelContainer) return;
  labelContainer.querySelectorAll(".body-label").forEach((el) => {
    el.classList.remove("active");
  });
}

}
