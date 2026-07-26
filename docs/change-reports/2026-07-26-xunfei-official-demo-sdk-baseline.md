# 讯飞虚拟人官方 Demo SDK 基线替换

## 目标

将面试页面的虚拟人初始化改为直接遵循用户提供的 `guides (2).zip` 中
`avatar-sdk-demo` React 示例，先确保 Web SDK 的播放器能够按官方方式挂载到页面。

## 本次变更

- 将官方 `avatar-sdk-web_3.1.0.1011` ESM 包及 XRTC / WebRTC 动态播放器分包放入
  `frontend-react/public/sdk/avatar-sdk-web_3.1.0.1011/`。
- 面试页改为在运行时从该官方路径加载 SDK，避免 Vite 转换 `public` 下的 ESM 文件。
- 初始化顺序统一为官方 Demo 的：`new AvatarPlatform()`、`setApiInfo()`、
  `setGlobalParams()`、`start({ wrapper })`。
- 使用 `xrtc + alpha: 1`，不显式传入码率。官方 3.1 SDK 会保留其内置的
  `1,000,000 bps` 默认值（约 `976 kbps`）；传入 `2000` 会在 SDK 内部被
  `/1024` 转换成约 `1 kbps`，反而触发服务端 `>= 200` 的校验失败。
- 去除先前额外的播放器构造参数及非 Demo 必需的 TTS 细节参数，减少与 SDK 版本差异有关的干扰。

## 安全边界

官方 Demo 为便于演示会在浏览器填写 `apiSecret`。正式项目不向浏览器暴露长期密钥：
后端只生成短期 `signedUrl`，前端仍由官方 SDK 负责 `start / writeText / recorder / stop`。

## 验证

在 `frontend-react` 执行：

```powershell
npm.cmd run build
```

构建通过。实际画面是否出现仍取决于讯飞控制台中同一接口服务的 AppID、API Key、
API Secret、服务 ID、形象 ID、发音人及在线虚拟人授权状态；SDK 已不再使用项目自定义的
WebSocket 驱动流程。
