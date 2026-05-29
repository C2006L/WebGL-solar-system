// ============================================================
// i18n.js — 国际化语言资源（中英双语）
// ============================================================

let _currentLang = "zh";

const STRINGS = {
  zh: {
    loading: "加载太阳系...",
    loadingError: "加载失败，请按 F12 查看详情",
    fps: "帧率",
    speed: "速度",
    pressH: "按 H 查看帮助",
    typeStar: "恒星",
    typePlanet: "行星",
    typeMoon: "卫星",

    radius: "半径",
    orbit: "轨道",
    period: "公转",
    dash: "—",
    simUnit: "(模拟)",

    groupPhysics: "物理参数",
    groupOrbit: "轨道数据",
    groupFeatures: "特征",
    mass: "质量",
    gravity: "重力",
    temperature: "温度",
    orbitalRadius: "轨道半径",
    inclination: "轨道倾角",
    rotation: "自转周期",
    axialTilt: "轴倾角",
    atmosphere: "大气",
    moons: "卫星",
    description: "描述",
    discovery: "发现",

    unitEarth: "地球",
    unitDay: "天",
    unitYear: "年",
    unitMoon: "颗",
    unitKm: "km",
    unitKkm: "万 km",

    btnDetail: "查看详情",
    btnCollapse: "收起面板",

    presetFree: "自由视角",
    presetTop: "俯视视角",

    lightOn: "关闭银河",
    lightOff: "银河",
    hide: "隐藏",
    show: "显示",

    langZh: "中文",
    langEn: "EN",

    helpTitle: "操作说明",
    helpMouse: "鼠标操作",
    helpDragLabel: "鼠标拖拽",
    helpDragDesc: "旋转视图",
    helpScrollLabel: "滚轮",
    helpScrollDesc: "缩放视图",
    helpRightDragLabel: "右键拖拽",
    helpRightDragDesc: "平移视图",
    helpKeyboard: "键盘操作",
    helpSpeed: "加速 / 减速",
    helpSpace: "暂停 / 恢复",
    helpReset: "重置模拟",
    helpPresets: "相机预设 (自由/俯视)",
    helpOrbits: "切换轨道线",
    helpHelp: "切换帮助面板",
    helpEsc: "取消聚焦",
    helpMouseSection: "鼠标操作",
    helpClickLabel: "单击星球",
    helpClickDesc: "查看信息",
    helpDblClickLabel: "双击星球",
    helpDblClickDesc: "聚焦天体",
    helpFooter: "22个天体 · 双击聚焦 · 点击空白处关闭面板",
  },

  en: {
    loading: "Loading Solar System...",
    loadingError: "Error loading. Press F12 for details.",
    fps: "FPS",
    speed: "Speed",
    pressH: "Press H for Help",
    typeStar: "Star",
    typePlanet: "Planet",
    typeMoon: "Moon",

    radius: "Radius",
    orbit: "Orbit",
    period: "Period",
    dash: "—",
    simUnit: "(sim)",

    groupPhysics: "Physical",
    groupOrbit: "Orbital Data",
    groupFeatures: "Features",
    mass: "Mass",
    gravity: "Gravity",
    temperature: "Temperature",
    orbitalRadius: "Orbital Radius",
    inclination: "Inclination",
    rotation: "Rotation",
    axialTilt: "Axial Tilt",
    atmosphere: "Atmosphere",
    moons: "Moons",
    description: "Description",
    discovery: "Discovered",

    unitEarth: "Earth",
    unitDay: "d",
    unitYear: "yr",
    unitMoon: "",
    unitKm: "km",
    unitKkm: "k km",

    btnDetail: "View Details",
    btnCollapse: "Collapse",

    presetFree: "Free View",
    presetTop: "Top View",

    lightOn: "Galaxy Off",
    lightOff: "Galaxy",
    hide: "Hide",
    show: "Show",

    langZh: "中文",
    langEn: "EN",

    helpTitle: "Controls",
    helpMouse: "Mouse",
    helpDragLabel: "Mouse Drag",
    helpDragDesc: "Rotate view",
    helpScrollLabel: "Scroll",
    helpScrollDesc: "Zoom in/out",
    helpRightDragLabel: "Right Drag",
    helpRightDragDesc: "Pan",
    helpKeyboard: "Keyboard",
    helpSpeed: "Speed up / slow down",
    helpSpace: "Pause / Resume",
    helpReset: "Reset simulation",
    helpPresets: "Camera presets (Free/Top)",
    helpOrbits: "Toggle orbit lines",
    helpHelp: "Toggle this help",
    helpEsc: "Cancel focus",
    helpMouseSection: "Mouse",
    helpClickLabel: "Click planet",
    helpClickDesc: "Show info",
    helpDblClickLabel: "Double-click",
    helpDblClickDesc: "Focus on body",
    helpFooter:
      "22 celestial bodies · double-click to focus · click anywhere to close",
  },
};

export function t(key) {
  return STRINGS[_currentLang][key] || key;
}

export function getLang() {
  return _currentLang;
}

export function setLang(lang) {
  if (lang === "zh" || lang === "en") {
    _currentLang = lang;
  }
}

export function toggleLang() {
  _currentLang = _currentLang === "zh" ? "en" : "zh";
  return _currentLang;
}

const _listeners = [];

export function onLangChange(fn) {
  _listeners.push(fn);
}

export function notifyLangChange() {
  _listeners.forEach((fn) => fn());
}
