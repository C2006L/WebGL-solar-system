# WebGL Solar System 🌌

基于 Three.js 的 WebGL 太阳系模拟，包含完整8大行星、程序化纹理、轨道倾角、大气散射效果。

![Solar System](https://img.shields.io/badge/Three.js-r160-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 功能特性

- 🌞 **完整8大行星** - 水星、金星、地球、火星、木星、土星、天王星、海王星
- 🔬 **真实天文数据** - 轨道周期、半径、倾角
- 🎨 **程序化纹理** - Canvas 2D 生成行星纹理 + 凹凸贴图
- 🌊 **地球大气** - Fresnel 散射效果模拟
- ☀️ **太阳日冕** - 多层光晕着色器
- 🪐 **土星光环** - 半透明程序化环带
- ☄️ **小行星带** - 2000 粒子，火星与木星之间
- 📐 **轨道倾角** - 真实轨道倾角与轴倾角可视化
- 🎮 **交互控制** - 鼠标拖拽、视角预设、速度调节

## 操作说明

| 按键     | 功能                                |
| -------- | ----------------------------------- |
| 鼠标拖拽 | 旋转视角                            |
| 滚轮     | 缩放                                |
| ↑ / ↓    | 加速 / 减速                         |
| Space    | 暂停 / 继续                         |
| 1-4      | 切换视角（自由/俯视/跟随地球/太阳） |
| O        | 显示/隐藏轨道                       |
| H        | 帮助面板                            |
| R        | 重置                                |

## 本地运行

```bash
# 方法1: Python
python -m http.server 3000

# 方法2: Node.js
npx serve
```

然后访问 http://localhost:3000

## 技术栈

- Three.js r160
- WebGL
- ES Modules (无构建工具)
- Canvas 2D 程序化纹理

## 预览

点击查看：https://C2006L.github.io/WebGL-solar-system/
