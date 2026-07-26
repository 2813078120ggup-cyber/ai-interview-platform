# 讯飞 Web SDK Demo 参数对齐

日期：2026-07-26  
范围：`frontend-react/src/pages/interview-room.tsx`

## 变更

- 逐项对照用户提供的 `guides (2).zip` 中官方 React Demo 的启动配置。
- 将面试间的 `stream` 参数收敛为官方 Demo 的最小形态：
  `protocol: 'xrtc'` 与 `alpha: 1`。
- 删除额外的 `fps`；不传 `bitrate`。
- 保留后端签发的短期 `signedUrl`，避免在浏览器暴露 API Secret；这与 Demo 的 API 初始化流程等价，但更适合生产环境。
- 增加不含密钥与签名 URL 的浏览器诊断日志：`[iFlytek Avatar] official-demo global params`，可在 DevTools 验证实际传给 SDK 的全局参数。

## 原因

本项目随 SDK 3.1.0-1011 使用的内部实现会把传入的 `stream.bitrate`
从 bps 转换为 kbps。若传入通用文档中的 `2000`，SDK 实际发送的值为
`1`，会触发服务端“bitrate 必须大于等于 200”的校验失败。未传该字段时，
SDK 使用内置默认值 `1000000` bps，并发送约 `976` kbps。

## 验证

- `npm.cmd run build`：通过。
- 首次启动后在浏览器开发者工具 Console 中确认日志仅包含：
  `stream: { protocol: 'xrtc', alpha: 1 }`。
- 若仍出现相同的 bitrate 错误，说明浏览器或正在运行的前端仍在使用旧构建；
  请硬刷新或重启本地 Vite 服务后重试。
