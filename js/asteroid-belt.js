// ============================================================
// asteroid-belt.js — 小行星带（v3：3000粒子 + 动画旋转）
// ============================================================

import * as THREE from 'three';
import { SCENE } from './constants.js';

export function createAsteroidBelt(count = SCENE.ASTEROID_COUNT) {
    const group = new THREE.Group();
    group.name = 'AsteroidBelt';

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const minR = SCENE.ASTEROID_MIN_R;
    const maxR = SCENE.ASTEROID_MAX_R;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minR + Math.random() * (maxR - minR);
        const y = (Math.random() - 0.5) * 0.9;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        const brightness = 0.45 + Math.random() * 0.35;
        const warmTint = Math.random() * 0.1;
        colors[i * 3] = brightness + warmTint;
        colors[i * 3 + 1] = brightness * 0.88;
        colors[i * 3 + 2] = brightness * 0.82;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 16;
    spriteCanvas.height = 16;
    const sctx = spriteCanvas.getContext('2d');
    const sg = sctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    sg.addColorStop(0, 'rgba(255,255,255,0.9)');
    sg.addColorStop(0.3, 'rgba(255,240,220,0.5)');
    sg.addColorStop(0.7, 'rgba(180,160,140,0.15)');
    sg.addColorStop(1, 'rgba(100,80,60,0)');
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 16, 16);
    const spriteTex = new THREE.Texture(spriteCanvas);
    spriteTex.needsUpdate = true;

    const mat = new THREE.PointsMaterial({
        size: 0.08,
        map: spriteTex,
        vertexColors: true,
        blending: THREE.NormalBlending,
        depthWrite: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    group.add(points);

    return group;
}