# React 面试间迁移（第 3 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增候选人对话式 AI 面试间，复用既有面试、题目、作答、AI 开场、AI 追问与结束面试接口。
- 支持题目进度、倒计时、选择题与文本作答，以及每题随机 2–5 次受控 AI 追问。
- 增加 AI 面试官语音朗读开关、摄像头本地预览，以及 HTTP/HTTPS 安全上下文提示。
- 为 React 路由增加 `/candidate/interviews/:id/room`，使候选人大厅的“开始面试”按钮可进入新页面。

## 安全与部署说明

- 浏览器的摄像头和麦克风在公网场景只能由 HTTPS 页面调用；HTTP 页面会明确提示这一限制。
- 摄像头流只在当前浏览器中预览，本模块不会上传视频。
- React 前端仍处于独立的 `frontend-react` 目录；当前在线 Docker 的 Vue 前端未被替换，待迁移完成、验收后再切换构建入口。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
