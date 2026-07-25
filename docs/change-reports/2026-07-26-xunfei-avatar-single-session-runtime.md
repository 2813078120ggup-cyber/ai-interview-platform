# 2026-07-26：讯飞虚拟人单会话面试运行时改造

## 改造目标

将面试房间的实时交互统一为讯飞 Web SDK，移除浏览器语音、服务端虚拟人 WebSocket 和 DeepSeek 追问混用造成的重复会话、并发路数残留与状态冲突。

## 运行时职责

| 场景 | 当前实现 |
| --- | --- |
| 虚拟人画面、题目播报 | 讯飞 Web SDK / XRTC |
| 文本回答后的面试追问 | 讯飞 `writeText(..., { nlp: true })` |
| 语音回答与转写 | 讯飞 `createRecorder()` / `startRecord(..., { nlp: true })` |
| 选择题 | 直接保存并进入下一题，不调用 AI |
| AI 面试教练悬浮助手 | DeepSeek |
| AI 评分、报告和提升计划 | 既有 DeepSeek 异步能力，不参与实时面试会话 |

## 关键实现

- 后端只为 Web SDK 生成短期签名 URL，不再建立第二条服务端虚拟人 WebSocket 会话。
- 前端 SDK 使用 XRTC、透明背景 `alpha: 1`、720×1280（宽高均为 4 的倍数）。
- 面试结束、路由卸载、重连前统一执行 `recorder.stopRecord()`、`avatar.stop()`、`avatar.destroy()`，释放讯飞并发路数。
- 自动播放受限时提供“恢复声音”，调用 SDK 播放器 `resume()`。
- SDK 的 `asr` 事件只更新候选人草稿；`nlp` 事件只追加讯飞面试官追问。

## 上线前检查

1. 接口服务 ID、App ID、API Key、API Secret 必须来自同一个讯飞接口服务。
2. 虚拟人形象 ID 和 `vcn` 必须已获授权。
3. 接口服务需开通在线虚拟人、文本交互/NLP 与 ASR；缺少其中任一项会导致追问或语音转写不可用。
4. 麦克风必须在 HTTPS 或 localhost 下使用。
5. 出现 `11203` 时，在讯飞交互平台终止所有“持续中”会话，检查授权路数，并确认本次页面退出已执行 `stop`。

## 验证结果

- 前端：`npm run build` 通过。
- 后端：`mvn -q -DskipTests package` 通过。

## 2026-07-26 补丁：Vite 公共 ESM SDK 加载

- SDK 目录保持在 `frontend-react/public/sdk/`，保证 `index.js` 与 XRTC/WebRTC 动态播放器分包同目录部署。
- 不再让 Vite 在源码转换期解析 `/public` 中的 SDK；前端使用浏览器绝对 URL 与 `@vite-ignore` 在运行时导入入口文件。
- 这样开发服务器和生产 Nginx 都以静态资源方式提供 SDK，同时 SDK 的内部相对动态导入路径保持正确。
