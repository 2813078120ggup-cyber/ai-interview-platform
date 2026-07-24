# 能力报告嵌入候选人工作台（第 14 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 能力报告路由 `/reports` 与 `/candidate/reports` 改为使用候选人工作台壳层。
- 保留左侧固定菜单、AI 服务状态卡和顶部工具栏。
- 能力仪表盘仅在右侧主内容区切换显示，与 AI 面试大厅保持一致的布局体验。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
