// ============================================================
// ui.js — UI 面板管理（v4：标签导航 + 聚焦联动）
// ============================================================

import { BODIES } from './constants.js';

export function updateSpeedDisplay(value) {
    const el = document.getElementById('speed-display');
    if (el) el.textContent = value.toFixed(1) + 'x';
}

export function updateFPS(fps) {
    const el = document.getElementById('fps-display');
    if (el) el.textContent = 'FPS: ' + fps;
}

export function highlightPresetButton(presetKey) {
    const container = document.getElementById('view-presets');
    if (!container) return;
    const indexMap = { free: 0, topDown: 1 };
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
        <div><b>1-2</b> — Camera presets (Free/Top)</div>
        <div><b>O</b> — Toggle orbit lines</div>
        <div><b>H</b> — Toggle this help</div>
        <div><b>Esc</b> — Cancel focus</div>
        <div class="section-title">Mouse</div>
        <div><b>Click planet</b> — Show info</div>
        <div><b>Double-click</b> — Focus on body</div>
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

export function createLightToggleButton(onToggle) {
    const container = document.createElement('div');
    container.id = 'light-toggle';
    const btn = document.createElement('button');
    let isOn = false;
    btn.textContent = '💡 开灯';
    btn.addEventListener('click', () => {
        isOn = !isOn;
        btn.textContent = isOn ? '💡 关灯' : '💡 开灯';
        btn.classList.toggle('active', isOn);
        onToggle(isOn);
    });
    container.appendChild(btn);
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

// ---- 右侧星体标签导航系统 ----

const LABEL_ORDER = [
    { key: 'sun', indent: 0 },
    { key: 'mercury', indent: 0 },
    { key: 'venus', indent: 0 },
    { key: 'earth', indent: 0 },
    { key: 'moon', indent: 1 },
    { key: 'mars', indent: 0 },
    { key: 'jupiter', indent: 0 },
    { key: 'io', indent: 1 },
    { key: 'europa', indent: 1 },
    { key: 'ganymede', indent: 1 },
    { key: 'callisto', indent: 1 },
    { key: 'saturn', indent: 0 },
    { key: 'uranus', indent: 0 },
    { key: 'neptune', indent: 0 },
];

const TYPE_ICONS = { star: '★', planet: '●', moon: '○' };

let labelContainer = null;

export function createLabelNavigation(bodyRefs, onFocusBody) {
    labelContainer = document.createElement('div');
    labelContainer.id = 'body-labels';

    for (const item of LABEL_ORDER) {
        const cfg = BODIES[item.key];
        if (!cfg || !bodyRefs[item.key]) continue;

        const label = document.createElement('div');
        label.className = 'body-label' + (item.indent > 0 ? ' moon' : '');
        label.dataset.key = item.key;

        const dot = document.createElement('span');
        dot.className = 'body-label-dot';
        dot.style.backgroundColor = cfg.color;

        const icon = document.createElement('span');
        icon.className = 'body-label-icon';
        icon.textContent = TYPE_ICONS[cfg.type] || '●';

        const info = document.createElement('div');
        info.className = 'body-label-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'body-label-name';
        nameEl.textContent = cfg.name;

        const typeEl = document.createElement('div');
        typeEl.className = 'body-label-type';
        typeEl.textContent = cfg.type + (cfg.realRadius ? ' · ' + formatRadius(cfg.realRadius) : '');

        info.appendChild(nameEl);
        info.appendChild(typeEl);

        label.appendChild(dot);
        label.appendChild(icon);
        label.appendChild(info);

        label.addEventListener('click', () => {
            if (onFocusBody) onFocusBody(item.key);
        });

        labelContainer.appendChild(label);
    }

    document.body.appendChild(labelContainer);
    return labelContainer;
}

function formatRadius(km) {
    if (km >= 10000) return (km / 1000).toFixed(0) + 'k km';
    return km.toLocaleString() + ' km';
}

export function highlightLabel(bodyKey) {
    if (!labelContainer) return;
    labelContainer.querySelectorAll('.body-label').forEach(el => {
        el.classList.toggle('active', el.dataset.key === bodyKey);
    });
}

export function clearLabelHighlight() {
    if (!labelContainer) return;
    labelContainer.querySelectorAll('.body-label').forEach(el => {
        el.classList.remove('active');
    });
}

function bindCloseBtn() {
    const btn = document.getElementById('object-info-close');
    if (btn) btn.addEventListener('click', hideObjectInfo);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCloseBtn);
} else {
    bindCloseBtn();
}
