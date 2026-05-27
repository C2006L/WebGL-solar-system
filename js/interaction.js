// ============================================================
// interaction.js — 鼠标交互（v4：双击聚焦 + Escape取消 + 标签联动）
// ============================================================

import * as THREE from "three";
import { BODIES } from "./constants.js";
import { showObjectInfo, hideObjectInfo } from "./ui.js";

export function initInteraction(camera, renderer, bodyRefs, controls, onFocusBody) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

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

  window.addEventListener("click", (event) => {
    if (
      event.target.closest("#view-presets") ||
      event.target.closest("#orbit-toggle") ||
      event.target.closest("#object-info") ||
      event.target.closest(".help-overlay") ||
      event.target.closest("#body-labels")
    )
      return;

    const result = pick(event);
    if (result && BODIES[result.key]) {
      const cfg = BODIES[result.key];
      showObjectInfo(cfg.name, cfg.description, {
        type: cfg.type,
        realRadius: cfg.realRadius || null,
        realAU: cfg.realAU || null,
        realPeriod: cfg.realPeriod || null,
        rotationPeriod: cfg.selfRotationSpeed
          ? ((2 * Math.PI) / Math.abs(cfg.selfRotationSpeed)).toFixed(1)
          : null,
      });
    } else {
      hideObjectInfo();
    }
  });

  window.addEventListener("dblclick", (event) => {
    if (
      event.target.closest("#view-presets") ||
      event.target.closest("#orbit-toggle") ||
      event.target.closest("#object-info") ||
      event.target.closest(".help-overlay") ||
      event.target.closest("#body-labels")
    )
      return;

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
    }
  });
}
