# React 全局视觉体系升级（第 10 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 将全局基础色调整为“深石墨 + 克制翡翠（Graphite & Jade）”体系。
- 页面背景采用轻量径向渐变，提升层次但不影响内容可读性。
- 升级 Button、Card、Badge 的圆角、边框、阴影、悬停与键盘焦点表现。
- 同步调整深色模式 token，保证明暗模式保持同一设计语言。

## 设计原则

- 保留 Emerald/Teal 的 AI 产品识别，不使用传统后台蓝灰模板。
- 使用低饱和中性色作为大面积背景，仅让翡翠色承担重点操作和状态表达。
- 动效以 150–200ms 的微位移和阴影变化为主，避免视觉噪声。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
