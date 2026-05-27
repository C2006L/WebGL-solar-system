// ============================================================
// asteroid-belt.js — 小行星带（火星和木星之间）
// ============================================================

import * as THREE from 'three';
import { SCENE } from './constants.js';

export function createAsteroidBelt(count = SCENE.ASTEROID_COUNT) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const minR = SCENE.ASTEROID_MIN_R;
    const maxR = SCENE.ASTEROID_MAX_R;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minR + Math.random() * (maxR - minR);
        const y = (Math.random() - 0.5) * 0.8;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        const brightness = 0.4 + Math.random() * 0.3;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness * 0.9;
        colors[i * 3 + 2] = brightness * 0.85;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        blending: THREE.NormalBlending,
        depthWrite: true,
        transparent: true,
        opacity: 0.7,
    });

    return new THREE.Points(geo, mat);
}