// ============================================================
// constants.js — 全局配置（v3：完整 8 行星 + 科学数据）
// ============================================================

export const SIM = {
    BASE_SPEED: 1.0,
    SPEED_STEP: 0.4,
    MIN_SPEED: 0.0,
    MAX_SPEED: 5.0,
    MAX_DELTA: 0.1,
};

// ---- 天体物理参数 ----
// size          : 可视化半径（对数压缩，保持相对顺序）
// orbitRadius   : 公转轨道半径 = realAU × SCALE
// orbitSpeed    : 角速度 ∝ 1/realPeriod
// orbitalIncl   : 轨道倾角（度，相对黄道面）
// axialTilt     : 自转轴倾角（度）
// 数据来源      : NASA Planetary Fact Sheet
// ============================================================
const SCALE = 7; // 1 AU = 7 单位

export const BODIES = {
    sun: {
        name: 'Sun', size: 2.5, orbitRadius: 0, orbitSpeed: 0,
        orbitalIncl: 0, axialTilt: 7.25,
        selfRotationSpeed: 0.15, type: 'star',
        realAU: 0, realPeriod: 0, realRadius: 696340,
        color: '#fffbe0',
        description: 'G-type main-sequence star (G2V). Surface temp: 5,778 K. Contains 99.86% of Solar System mass.',
    },
    mercury: {
        name: 'Mercury', size: 0.18, orbitRadius: 0.387 * SCALE,
        orbitSpeed: 2 * Math.PI / (88.0),
        orbitalIncl: 7.0, axialTilt: 0.03,
        selfRotationSpeed: 2 * Math.PI / (58.6),
        type: 'planet', realAU: 0.387, realPeriod: 88.0, realRadius: 2440,
        color: '#b0a090',
        description: 'Smallest planet. No atmosphere. Extreme temperature range: -180°C to 430°C.',
    },
    venus: {
        name: 'Venus', size: 0.60, orbitRadius: 0.723 * SCALE,
        orbitSpeed: 2 * Math.PI / (224.7),
        orbitalIncl: 3.4, axialTilt: 177.4,
        selfRotationSpeed: -(2 * Math.PI / (243.0)),
        type: 'planet', realAU: 0.723, realPeriod: 224.7, realRadius: 6052,
        color: '#e8d5a8',
        description: 'Hottest planet (462°C). Thick CO₂ atmosphere. Retrograde rotation (sun rises in west).',
    },
    earth: {
        name: 'Earth', size: 0.65, orbitRadius: 1.0 * SCALE,
        orbitSpeed: 2 * Math.PI / (365.25),
        orbitalIncl: 0.0, axialTilt: 23.44,
        selfRotationSpeed: 2 * Math.PI / (1.0),
        type: 'planet', realAU: 1.0, realPeriod: 365.25, realRadius: 6371,
        color: '#1a6fb5',
        description: 'Only known planet with life. 71% ocean surface. Atmosphere: N₂ 78%, O₂ 21%.',
    },
    moon: {
        name: 'Moon', size: 0.18, orbitRadius: 1.6,
        orbitSpeed: 2 * Math.PI / (27.3),
        orbitalIncl: 5.14, axialTilt: 6.68,
        selfRotationSpeed: 2 * Math.PI / (27.3),
        type: 'moon', realAU: 0, realPeriod: 27.3, realRadius: 1737,
        color: '#aaaaaa',
        description: 'Earth\'s only natural satellite. Tidally locked. Surface: basaltic maria + anorthositic highlands.',
    },
    mars: {
        name: 'Mars', size: 0.40, orbitRadius: 1.524 * SCALE,
        orbitSpeed: 2 * Math.PI / (687.0),
        orbitalIncl: 1.85, axialTilt: 25.19,
        selfRotationSpeed: 2 * Math.PI / (1.026),
        type: 'planet', realAU: 1.524, realPeriod: 687.0, realRadius: 3390,
        color: '#c1440e',
        description: 'The Red Planet. Iron oxide surface. Olympus Mons: tallest volcano (21.9 km).',
    },
    jupiter: {
        name: 'Jupiter', size: 1.80, orbitRadius: 5.203 * SCALE,
        orbitSpeed: 2 * Math.PI / (4331),
        orbitalIncl: 1.3, axialTilt: 3.13,
        selfRotationSpeed: 2 * Math.PI / (0.414),
        type: 'planet', realAU: 5.203, realPeriod: 4331, realRadius: 69911,
        color: '#d4a574',
        description: 'Largest planet. Great Red Spot: storm lasting 350+ years. 95 known moons.',
    },
    saturn: {
        name: 'Saturn', size: 1.55, orbitRadius: 9.537 * SCALE,
        orbitSpeed: 2 * Math.PI / (10747),
        orbitalIncl: 2.5, axialTilt: 26.73,
        selfRotationSpeed: 2 * Math.PI / (0.444),
        type: 'planet', realAU: 9.537, realPeriod: 10747, realRadius: 58232,
        color: '#e8d5a0',
        description: 'Famous ring system (ice + rock). Least dense planet (could float in water).',
    },
    uranus: {
        name: 'Uranus', size: 0.95, orbitRadius: 19.19 * SCALE,
        orbitSpeed: 2 * Math.PI / (30589),
        orbitalIncl: 0.77, axialTilt: 97.77,
        selfRotationSpeed: 2 * Math.PI / (0.718),
        type: 'planet', realAU: 19.19, realPeriod: 30589, realRadius: 25362,
        color: '#7ec8e3',
        description: 'Ice giant. Rotates on its side (98° tilt). Methane atmosphere absorbs red light → cyan color.',
    },
    neptune: {
        name: 'Neptune', size: 0.90, orbitRadius: 30.07 * SCALE,
        orbitSpeed: 2 * Math.PI / (59800),
        orbitalIncl: 1.77, axialTilt: 28.32,
        selfRotationSpeed: 2 * Math.PI / (0.671),
        type: 'planet', realAU: 30.07, realPeriod: 59800, realRadius: 24622,
        color: '#3355cc',
        description: 'Windiest planet (2,100 km/h). Last true planet. Discovered mathematically (1846).',
    },
};

// ---- 相机预设 ----
export const CAMERA_PRESETS = {
    free:    { name: 'Free Orbit',   position: [6, 8, 25], target: [0, 0, 0] },
    topDown: { name: 'Top Down',     position: [0, 35, 0.5], target: [0, 0, 0] },
    followEarth: { name: 'Follow Earth', position: [2, 1.5, 4], target: [0, 0, 0], isDynamic: true },
    sunView: { name: 'Sun View',     position: [1.5, 1, 5], target: [0, 0, 0] },
};

// ---- 场景常量 ----
export const SCENE = {
    STAR_COUNT: 3000,
    STAR_RADIUS: 80,
    ORBIT_SEGMENTS: 256,
    ASTEROID_COUNT: 2000,
    ASTEROID_MIN_R: 2.1 * SCALE,
    ASTEROID_MAX_R: 3.3 * SCALE,
};