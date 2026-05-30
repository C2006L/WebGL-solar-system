// ============================================================
// ui.js — UI 面板管理（v5：中英双语 i18n）
// ============================================================

import { BODIES } from "./constants.js";
import { t, getLang, toggleLang, onLangChange } from "./i18n.js";

function getBodyName(cfg) {
  return getLang() === "zh" && cfg.nameZh ? cfg.nameZh : cfg.name;
}

function getBodyDesc(cfg) {
  return getLang() === "zh" && cfg.descriptionZh
    ? cfg.descriptionZh
    : cfg.description;
}

function getBodyAtmosphere(cfg) {
  return getLang() === "zh" && cfg.atmosphereZh
    ? cfg.atmosphereZh
    : cfg.atmosphere;
}

function getBodyDiscovery(cfg) {
  return getLang() === "zh" && cfg.discoveryZh
    ? cfg.discoveryZh
    : cfg.discovery;
}

export function updateSpeedDisplay(value) {
  const el = document.getElementById("speed-display");
  if (el) el.textContent = value.toFixed(1) + "x";
}

export function updateFPS(fps) {
  const el = document.getElementById("fps-display");
  if (el) el.textContent = t("fps") + ": " + fps;
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

  const typeIcon =
    cfg.type === "star" ? "S" : cfg.type === "planet" ? "P" : "M";

  const typeT =
    cfg.type === "star"
      ? t("typeStar")
      : cfg.type === "planet"
        ? t("typePlanet")
        : t("typeMoon");

  panel.innerHTML = `
    <div class="ip-header" id="ip-drag-handle">
      <span class="ip-dot" style="background-color:${cfg.color}"></span>
      <span class="ip-icon">${typeIcon}</span>
      <span class="ip-name">${getBodyName(cfg)}</span>
      <span class="ip-type">${typeT}</span>
      <button class="ip-close" id="ip-close-btn">×</button>
    </div>
    <div class="ip-divider"></div>
    <div class="ip-core">
      <div class="ip-row"><span class="ip-label">${t("radius")}</span><span class="ip-val">${cfg.realRadius ? cfg.realRadius.toLocaleString() + " " + t("unitKm") : t("dash")}</span></div>
      <div class="ip-row"><span class="ip-label">${t("orbit")}</span><span class="ip-val">${cfg.realAU ? cfg.realAU + " AU" : cfg.type === "moon" ? cfg.orbitRadius.toFixed(1) + " " + t("simUnit") : t("dash")}</span></div>
      <div class="ip-row"><span class="ip-label">${t("period")}</span><span class="ip-val">${cfg.realPeriod ? formatPeriod(cfg.realPeriod) : t("dash")}</span></div>
    </div>
    <div class="ip-detail-section" id="ip-detail-section" style="display:none;">
      <div class="ip-divider"></div>
      <div class="ip-group-title">${t("groupPhysics")}</div>
      <div class="ip-row"><span class="ip-label">${t("mass")}</span><span class="ip-val">${cfg.mass ? (cfg.mass >= 1 ? cfg.mass.toLocaleString() + " " + t("unitEarth") : cfg.mass.toFixed(4) + " " + t("unitEarth")) : t("dash")}</span></div>
      <div class="ip-row"><span class="ip-label">${t("gravity")}</span><span class="ip-val">${cfg.gravity != null ? cfg.gravity + " m/s²" : t("dash")}</span></div>
      <div class="ip-row"><span class="ip-label">${t("temperature")}</span><span class="ip-val">${cfg.temperature || t("dash")}</span></div>
      <div class="ip-divider"></div>
      <div class="ip-group-title">${t("groupOrbit")}</div>
      <div class="ip-row"><span class="ip-label">${t("orbitalRadius")}</span><span class="ip-val">${cfg.realAU ? cfg.realAU + " AU" : t("dash")}</span></div>
      ${cfg.orbitalIncl != null ? '<div class="ip-row"><span class="ip-label">' + t("inclination") + '</span><span class="ip-val">' + cfg.orbitalIncl + "°</span></div>" : ""}
      ${cfg.selfRotationSpeed ? '<div class="ip-row"><span class="ip-label">' + t("rotation") + '</span><span class="ip-val">' + ((2 * Math.PI) / Math.abs(cfg.selfRotationSpeed)).toFixed(2) + " " + t("unitDay") + "</span></div>" : ""}
      ${cfg.axialTilt != null ? '<div class="ip-row"><span class="ip-label">' + t("axialTilt") + '</span><span class="ip-val">' + cfg.axialTilt + "°</span></div>" : ""}
      <div class="ip-divider"></div>
      <div class="ip-group-title">${t("groupFeatures")}</div>
      ${cfg.atmosphere ? '<div class="ip-row ip-row-wrap"><span class="ip-label">' + t("atmosphere") + '</span><span class="ip-val">' + getBodyAtmosphere(cfg) + "</span></div>" : ""}
      ${cfg.moonCount != null && cfg.moonCount > 0 ? '<div class="ip-row"><span class="ip-label">' + t("moons") + '</span><span class="ip-val">' + cfg.moonCount + " " + t("unitMoon") + "</span></div>" : ""}
      <div class="ip-row ip-row-wrap"><span class="ip-label">${t("description")}</span><span class="ip-val ip-desc">${getBodyDesc(cfg) || t("dash")}</span></div>
      ${cfg.discovery ? '<div class="ip-row"><span class="ip-label">' + t("discovery") + '</span><span class="ip-val">' + getBodyDiscovery(cfg) + "</span></div>" : ""}
    </div>
    <div class="ip-actions">
      <button class="ip-detail-btn" id="ip-detail-btn">${t("btnDetail")}</button>
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

function repositionPanel() {
  const panel = document.getElementById("object-info");
  if (!panel) return;
  const left = parseFloat(panel.style.left) || 0;
  const top = parseFloat(panel.style.top) || 0;
  const pw = panel.offsetWidth || 230;
  const ph = panel.offsetHeight || 150;
  let newLeft = left;
  let newTop = top;
  if (newLeft + pw > window.innerWidth - 10)
    newLeft = window.innerWidth - pw - 10;
  if (newTop + ph > window.innerHeight - 10)
    newTop = window.innerHeight - ph - 10;
  if (newLeft < 10) newLeft = 10;
  if (newTop < 10) newTop = 10;
  panel.style.left = newLeft + "px";
  panel.style.top = newTop + "px";
}

let _dragState = null;

function initDraggable() {
  const panel = document.getElementById("object-info");
  const handle = document.getElementById("ip-drag-handle");
  if (!panel || !handle) return;

  handle.addEventListener("mousedown", (e) => {
    if (e.target.closest(".ip-close")) return;
    _dragState = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: parseFloat(panel.style.left) || 0,
      origTop: parseFloat(panel.style.top) || 0,
    };
    handle.style.cursor = "grabbing";
    e.preventDefault();
  });
}

window.addEventListener("mousemove", (e) => {
  if (!_dragState) return;
  const panel = document.getElementById("object-info");
  if (!panel) return;
  const dx = e.clientX - _dragState.startX;
  const dy = e.clientY - _dragState.startY;
  let newLeft = _dragState.origLeft + dx;
  let newTop = _dragState.origTop + dy;
  const pw = panel.offsetWidth || 230;
  const ph = panel.offsetHeight || 150;
  if (newLeft < 0) newLeft = 0;
  if (newTop < 0) newTop = 0;
  if (newLeft + pw > window.innerWidth) newLeft = window.innerWidth - pw;
  if (newTop + ph > window.innerHeight) newTop = window.innerHeight - ph;
  panel.style.left = newLeft + "px";
  panel.style.top = newTop + "px";
});

window.addEventListener("mouseup", () => {
  if (_dragState) {
    const handle = document.getElementById("ip-drag-handle");
    if (handle) handle.style.cursor = "grab";
    _dragState = null;
  }
});

function setupPanelEvents(key) {
  const detailBtn = document.getElementById("ip-detail-btn");
  const closeBtn = document.getElementById("ip-close-btn");
  const detailSec = document.getElementById("ip-detail-section");
  const actions = document.querySelector("#object-info .ip-actions");

  if (detailBtn) {
    detailBtn.addEventListener("click", () => {
      isDetailOpen = !isDetailOpen;
      if (isDetailOpen) {
        detailSec.style.display = "block";
        if (actions) actions.style.display = "none";
        detailBtn.textContent = t("btnCollapse");
      } else {
        detailSec.style.display = "none";
        if (actions) actions.style.display = "flex";
        detailBtn.textContent = t("btnDetail");
      }
      repositionPanel();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      hideObjectInfo();
    });
  }

  initDraggable();
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
    return (
      days.toFixed(0) +
      " " +
      t("unitDay") +
      " (" +
      yr.toFixed(2) +
      " " +
      t("unitYear") +
      ")"
    );
  }
  return days.toFixed(1) + " " + t("unitDay");
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
    <div style="font-size:18px;color:#fff;margin-bottom:10px;">${t("helpTitle")}</div>
    <div><b>${t("helpDragLabel")}</b> — ${t("helpDragDesc")}</div>
    <div><b>${t("helpScrollLabel")}</b> — ${t("helpScrollDesc")}</div>
    <div><b>${t("helpRightDragLabel")}</b> — ${t("helpRightDragDesc")}</div>
    <div class="section-title">${t("helpKeyboard")}</div>
    <div><b>↑ / ↓</b> — ${t("helpSpeed")}</div>
    <div><b>Space</b> — ${t("helpSpace")}</div>
    <div><b>R</b> — ${t("helpReset")}</div>
    <div><b>1-2</b> — ${t("helpPresets")}</div>
    <div><b>O</b> — ${t("helpOrbits")}</div>
    <div><b>H</b> — ${t("helpHelp")}</div>
    <div><b>Esc</b> — ${t("helpEsc")}</div>
    <div class="section-title">${t("helpMouseSection")}</div>
    <div><b>${t("helpClickLabel")}</b> — ${t("helpClickDesc")}</div>
    <div><b>${t("helpDblClickLabel")}</b> — ${t("helpDblClickDesc")}</div>
    <div style="margin-top:14px;color:#777;font-size:11px;">${t("helpFooter")}</div>
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

export function updateLoadingText() {
  const el = document.getElementById("loading");
  if (el) {
    el.textContent = t("loading");
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

export function updateInfoPanel() {
  const speedLabel = document.getElementById("speed-label");
  if (speedLabel) speedLabel.textContent = t("speed");
  const helpHint = document.getElementById("help-hint");
  if (helpHint) helpHint.textContent = t("pressH");
}

export function createViewPresetButtons(onPresetClick) {
  const existing = document.getElementById("view-presets");
  const container = existing || document.createElement("div");
  container.id = "view-presets";
  container.innerHTML = "";

  const presets = [
    { key: "free", labelKey: "presetFree" },
    { key: "topDown", labelKey: "presetTop" },
  ];
  presets.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.dataset.presetKey = p.key;
    btn.textContent = t(p.labelKey);
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
  if (!existing) document.body.appendChild(container);
}

export function refreshPresetButtons() {
  const container = document.getElementById("view-presets");
  if (!container) return;
  const labelMap = { free: "presetFree", topDown: "presetTop" };
  container.querySelectorAll("button").forEach((btn) => {
    const key = btn.dataset.presetKey;
    if (key && labelMap[key]) btn.textContent = t(labelMap[key]);
  });
}

export function createLightToggleButton(onToggle) {
  const existing = document.getElementById("light-toggle");
  const container = existing || document.createElement("div");
  container.id = "light-toggle";
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.id = "light-toggle-btn";
  let isOn = false;
  btn.textContent = t("lightOff");
  btn.addEventListener("click", () => {
    isOn = !isOn;
    btn.textContent = isOn ? t("lightOn") : t("lightOff");
    btn.classList.toggle("active", isOn);
    onToggle(isOn);
  });
  container.appendChild(btn);
  if (!existing) document.body.appendChild(container);
}

export function refreshLightButton() {
  const btn = document.getElementById("light-toggle-btn");
  if (!btn) return;
  const isOn = btn.classList.contains("active");
  btn.textContent = isOn ? t("lightOn") : t("lightOff");
}

export function createOrbitToggleButton(onToggle) {
  const existing = document.getElementById("orbit-toggle");
  if (existing) return;
  const container = document.createElement("div");
  container.id = "orbit-toggle";
  const btn = document.createElement("button");
  let visible = true;
  btn.textContent = t("orbit") + ": " + t("hide");
  btn.addEventListener("click", () => {
    visible = !visible;
    btn.textContent = t("orbit") + ": " + (visible ? t("hide") : t("show"));
    onToggle(visible);
  });
  container.appendChild(btn);
  document.body.appendChild(container);
}

export function createLangToggleButton() {
  const existing = document.getElementById("lang-toggle");
  const container = existing || document.createElement("div");
  container.id = "lang-toggle";
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.id = "lang-toggle-btn";
  btn.textContent = t("langEn");
  btn.title = "Switch Language / 切换语言";
  btn.addEventListener("click", () => {
    toggleLang();
    refreshAllUI();
  });
  container.appendChild(btn);
  if (!existing) document.body.appendChild(container);
}

export function refreshLangButton() {
  const btn = document.getElementById("lang-toggle-btn");
  if (!btn) return;
  btn.textContent = getLang() === "zh" ? t("langEn") : t("langZh");
}

function refreshAllUI() {
  refreshPresetButtons();
  refreshLightButton();
  refreshLangButton();
  updateInfoPanel();
  refreshLabelTypes();
  refreshLabelNames();
  updateLoadingText();
}

onLangChange(refreshAllUI);

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

const TYPE_ICONS = { star: "S", planet: "P", moon: "M" };

let labelContainer = null;
let currentForceFollowKey = null;

export function createLabelNavigation(bodyRefs, onFocusBody, onForceFollow) {
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
    icon.textContent = TYPE_ICONS[cfg.type] || "-";

    const info = document.createElement("div");
    info.className = "body-label-info";

    const nameEl = document.createElement("div");
    nameEl.className = "body-label-name";
    nameEl.textContent = getBodyName(cfg);
    nameEl.dataset.rawNameEn = cfg.name;
    nameEl.dataset.rawNameZh = cfg.nameZh || "";

    const typeEl = document.createElement("div");
    typeEl.className = "body-label-type";
    typeEl.dataset.rawType = cfg.type;
    typeEl.dataset.realRadius = cfg.realRadius || "";
    typeEl.textContent = typeText(cfg.type, cfg.realRadius);

    info.appendChild(nameEl);
    info.appendChild(typeEl);

    label.appendChild(dot);
    label.appendChild(icon);
    label.appendChild(info);

    label.addEventListener("click", () => {
      if (onFocusBody) onFocusBody(item.key);
    });

    label.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (currentForceFollowKey === item.key) {
        label.classList.remove("force-follow-active");
        currentForceFollowKey = null;
        if (onForceFollow) onForceFollow(null, false);
      } else {
        if (currentForceFollowKey) {
          const prevLabel = labelContainer.querySelector(
            `[data-key="${currentForceFollowKey}"]`
          );
          if (prevLabel) prevLabel.classList.remove("force-follow-active");
        }
        label.classList.add("force-follow-active");
        currentForceFollowKey = item.key;
        if (onForceFollow) onForceFollow(item.key, true);
      }
    });

    labelContainer.appendChild(label);
  }

  document.body.appendChild(labelContainer);
  return labelContainer;
}

export function clearForceFollowHighlight() {
  if (currentForceFollowKey && labelContainer) {
    const prevLabel = labelContainer.querySelector(
      `[data-key="${currentForceFollowKey}"]`
    );
    if (prevLabel) prevLabel.classList.remove("force-follow-active");
    currentForceFollowKey = null;
  }
}

function typeText(rawType, realRadius) {
  const typeMap = {
    star: t("typeStar"),
    planet: t("typePlanet"),
    moon: t("typeMoon"),
  };
  const typeStr = typeMap[rawType] || rawType;
  return typeStr + (realRadius ? " · " + formatRadius(realRadius) : "");
}

function refreshLabelTypes() {
  if (!labelContainer) return;
  labelContainer.querySelectorAll(".body-label-type").forEach((el) => {
    const rawType = el.dataset.rawType;
    const realRadius = el.dataset.realRadius;
    if (rawType) {
      el.textContent = typeText(rawType, realRadius);
    }
  });
}

function refreshLabelNames() {
  if (!labelContainer) return;
  const isZh = getLang() === "zh";
  labelContainer.querySelectorAll(".body-label-name").forEach((el) => {
    if (isZh && el.dataset.rawNameZh) {
      el.textContent = el.dataset.rawNameZh;
    } else if (el.dataset.rawNameEn) {
      el.textContent = el.dataset.rawNameEn;
    }
  });
}

function formatRadius(km) {
  if (km >= 10000) return (km / 1000).toFixed(0) + " " + t("unitKkm");
  return km.toLocaleString() + " " + t("unitKm");
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
