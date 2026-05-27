// ============================================================
// ui.js — UI 面板管理（v3：DOM-safe + 按钮联动）
// ============================================================

export function updateSpeedDisplay(value) {
    const el = document.getElementById('speed-display');
    if (el) el.textContent = value.toFixed(1) + 'x';
}

export function updateFPS(fps) {
    const el = document.getElementById('fps-display');
    if (el) el.textContent = 'FPS: ' + fps;
}

/**
 * 高亮指定预设按钮（键盘切换视角时同步 UI）
 */
export function highlightPresetButton(presetKey) {
    const container = document.getElementById('view-presets');
    if (!container) return;
    const indexMap = { free: 0, topDown: 1, followEarth: 2, sunView: 3 };
    const idx = indexMap[presetKey];
    const buttons = container.querySelectorAll('button');
    buttons.forEach((b, i) => b.classList.toggle('active', i === idx));
}

export function showObjectInfo(name, description, stats = {}) {
    const panel = document.getElementById('object-info');
    const nameEl = document.getElementById('object-info-name');
    const detailsEl = document.getElementById('object-info-details');
    if (!panel || !nameEl || !detailsEl) return;

    nameEl.textContent = name;
    let html = `<div style="color:#aaa;margin-bottom:6px;">${description}</div>`;

    if (stats.type) {
        html += `<div style="color:#ffb800;">Type: ${stats.type}</div>`;
    }
    if (stats.realRadius) {
        html += `<div>Radius: ${stats.realRadius.toLocaleString()} km</div>`;
    }
    if (stats.realAU) {
        html += `<div>Orbit: ${stats.realAU} AU</div>`;
    }
    if (stats.realPeriod) {
        const yr = stats.realPeriod / 365.25;
        html += `<div>Period: ${stats.realPeriod.toFixed(0)} days${yr > 1 ? ' (' + yr.toFixed(2) + ' yr)' : ''}</div>`;
    }
    if (stats.rotationPeriod) {
        html += `<div>Rotation: ${stats.rotationPeriod} days</div>`;
    }
    panel.classList.add('visible');
}

export function hideObjectInfo() {
    const panel = document.getElementById('object-info');
    if (panel) panel.classList.remove('visible');
}

export function toggleHelp() {
    const existing = document.querySelector('.help-overlay');
    if (existing) { existing.remove(); return; }

    const div = document.createElement('div');
    div.className = 'help-overlay';
    div.innerHTML = `
        <div style="font-size:18px;color:#fff;margin-bottom:10px;">Controls</div>
        <div><b>Mouse Drag</b> — Rotate view</div>
        <div><b>Scroll</b> — Zoom in/out</div>
        <div><b>Right Drag</b> — Pan</div>
        <div class="section-title">Keyboard</div>
        <div><b>↑ / ↓</b> — Speed up / slow down</div>
        <div><b>Space</b> — Pause / Resume</div>
        <div><b>R</b> — Reset simulation</div>
        <div><b>1-4</b> — Camera presets (Free/Top/Earth/Sun)</div>
        <div><b>O</b> — Toggle orbit lines</div>
        <div><b>H</b> — Toggle this help</div>
        <div class="section-title">Mouse</div>
        <div><b>Click planet</b> — Show info</div>
        <div><b>Double-click</b> — Focus on object</div>
        <div style="margin-top:14px;color:#777;font-size:11px;">Click anywhere to close</div>
    `;
    div.addEventListener('click', () => div.remove());
    document.body.appendChild(div);
}

export function hideLoading() {
    const el = document.getElementById('loading');
    if (el) { el.style.opacity = '0'; setTimeout(() => { if(el.parentNode) el.remove(); }, 500); }
}

setTimeout(function() {
    var el = document.getElementById('loading');
    if (el) { console.warn('Loading timeout — forcing hide'); el.style.opacity = '0'; setTimeout(() => { if(el && el.parentNode) el.remove(); }, 500); }
}, 8000);

export function createViewPresetButtons(onPresetClick) {
    const container = document.createElement('div');
    container.id = 'view-presets';
    const presets = [
        { key: 'free', label: '1 Free' },
        { key: 'topDown', label: '2 Top' },
        { key: 'followEarth', label: '3 Earth' },
        { key: 'sunView', label: '4 Sun' },
    ];
    presets.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
            container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onPresetClick(p.key);
        });
        if (i === 0) btn.classList.add('active');
        container.appendChild(btn);
    });
    document.body.appendChild(container);
}

export function createOrbitToggleButton(onToggle) {
    const container = document.createElement('div');
    container.id = 'orbit-toggle';
    const btn = document.createElement('button');
    let visible = true;
    btn.textContent = 'O Orbits';
    btn.addEventListener('click', () => {
        visible = !visible;
        btn.textContent = 'O ' + (visible ? 'Hide' : 'Show') + ' Orbits';
        onToggle(visible);
    });
    container.appendChild(btn);
    document.body.appendChild(container);
}

// DOM 就绪后才绑定关闭按钮
function bindCloseBtn() {
    const btn = document.getElementById('object-info-close');
    if (btn) btn.addEventListener('click', hideObjectInfo);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCloseBtn);
} else {
    bindCloseBtn();
}