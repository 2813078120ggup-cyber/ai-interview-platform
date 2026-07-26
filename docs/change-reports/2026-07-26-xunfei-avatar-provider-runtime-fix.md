# 2026-07-26 讯飞虚拟人 Provider 运行时修复报告

## 现象

讯飞交互日志可以创建会话，但会话在 0–1 秒内结束，页面显示 `avatar authentication failed`，没有画面与声音。

## 根因

1. 运行时按 `voiceDefault` 选择任意 `virtual-human` Provider，而系统设置页面维护的是 `xunfei-virtual-human`。当历史 Provider 仍启用时，面试间可能实际发送了另一套形象 ID / 发音人；这与交互日志中的资源不一致。
2. Provider 编辑接口把留空的 App ID、API Key、API Secret 写成空值，和页面“留空则不修改”的约定相冲突。仅修改形象或音色后，已经保存的鉴权信息可能被清空。

## 本次修改

- 运行时优先且固定选择编码为 `xunfei-virtual-human`、已启用的 Provider；仅在该记录不存在时兼容单一旧 Provider。
- 不再回退到任何旧的通用虚拟人 Provider。若指定讯飞 Provider 不存在、停用或未配置，页面会直接给出 Provider 编码与必填资源提示，避免悄悄发起一条使用错误形象的会话。
- 空白密钥字段改为保留原有密文，避免误清空讯飞鉴权材料。
- 签名生成前对 API Key / API Secret 做非空与去空白校验，避免生成不可用签名。
- 面试间展示当前实际使用的形象 ID 与发音人，并把 `11203`、`11200`、`10104` 转换为可操作的提示。

## 讯飞 SDK 鉴权说明

当前 Web SDK 的 `signedUrl` 仍使用 SDK 所需的 `api_key` HMAC 格式；没有改用旧 Java 2D Demo 的 `hmac username` 格式。两套接口协议不同，混用会造成鉴权失败。

## 上线后核对

1. 系统设置中仅启用 `xunfei-virtual-human`，确认接口服务 ID、App ID、API Key、API Secret、形象 ID、发音人来自同一讯飞接口服务。
2. 在面试间点击“启动虚拟人”后，页面会显示实际提交的形象 ID 与发音人；它应与讯飞交互日志一致。
3. 若仍返回 `11200`，说明当前形象 ID 或发音人没有被该接口服务授权，需要在讯飞控制台换为已授权资源；代码无法绕过讯飞授权。
## Minimal SDK startup profile (2026-07-26 follow-up)

- The first connection now sends only required SDK parameters: `stream` (XRTC/alpha/fps/bitrate), `avatar` (avatar_id/720x1280), and `tts` (vcn/speed/pitch/volume).
- Optional `subtitle`, `audio`, and `air` are intentionally excluded until the configured avatar completes base video and text-driven playback.
- The SDK converts supplied bps bitrate to protocol kbps. `800000 bps` produces about 781 kbps and remains above the 200 kbps platform minimum.
- The browser retains the detailed SDK error event so a rejected `start()` cannot hide the numeric iFlytek code or requested avatar/voice values.
