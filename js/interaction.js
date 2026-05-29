// ============================================================
// interaction.js — 鼠标交互（v5：单击出卡片 + 双击仅聚焦）
// ============================================================

import * as THREE from "three";
import { BODIES } from "./constants.js";
import { showObjectInfo, hideObjectInfo } from "./ui.js";

const CLICK_DELAY = 220;

export function initInteraction(
  camera,
  renderer,
  bodyRefs,
  controls,
  onFocusBody,
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let clickTimer = null;
  let pendingPick = null;

  const pickable = [];
  for (const [key, val] of Object.entries(bodyRefs)) {
    if (val instanceof THREE.Mesh && BODIES[key]) {
      pickable.push({ mesh: val, key });
    }
  }

  function pick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      pickable.map((p) => p.mesh),
      false,
    );
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      return pickable.find((p) => p.mesh === obj) || null;
    }
    return null;
  }

  function isUIElement(event) {
    return (
      event.target.closest("#view-presets") ||
      event.target.closest("#orbit-toggle") ||
      event.target.closest("#light-toggle") ||
      event.target.closest("#object-info") ||
      event.target.closest(".help-overlay") ||
      event.target.closest("#body-labels") ||
      event.target.closest("#lang-toggle")
    );
  }

  window.addEventListener("click", (event) => {
    if (isUIElement(event)) return;

    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      return;
    }

    pendingPick = pick(event);
    clickTimer = setTimeout(() => {
      clickTimer = null;
      if (pendingPick && BODIES[pendingPick.key]) {
        const cfg = BODIES[pendingPick.key];
        showObjectInfo(pendingPick.key, event.clientX, event.clientY, cfg);
      } else {
        hideObjectInfo();
      }
      pendingPick = null;
    }, CLICK_DELAY);
  });

  window.addEventListener("dblclick", (event) => {
    if (isUIElement(event)) return;

    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    pendingPick = null;

    const result = pick(event);
    if (result && onFocusBody) {
      onFocusBody(result.key);
    }
  });

  window.addEventListener("contextmenu", () => {
    hideObjectInfo();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (onFocusBody) onFocusBody(null);
      hideObjectInfo();
    }
  });
}
