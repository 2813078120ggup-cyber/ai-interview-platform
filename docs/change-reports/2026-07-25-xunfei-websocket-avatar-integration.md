# 2026-07-25 讯飞在线虚拟人 WebSocket 接入修正

## 背景

面试房间右侧虚拟人区域仍显示本地数字人兜底，并提示：

`讯飞虚拟人接口返回异常：400 / 10163`

继续排查后确认：当前控制台提供的是“面试交流 / 在线虚拟人驱动”能力，应使用讯飞 WebSocket 实时交互接口，而不是旧的 HTTP `vms2d_start` / `vms2d_ctrl` 调用方式。

## 本次修改

- 后端讯飞虚拟人客户端改为连接：

```text
wss://avatar.cn-huadong-1.xf-yun.com/v1/interact
```

- 改用 WebSocket 生命周期：
  - HMAC 鉴权连接
  - `start` 启动虚拟人
  - 读取 `stream_info` 中的 `stream_url`
  - `text_driver` 驱动虚拟人播报
  - 每 5 秒 `ping` 保活
  - 服务销毁时 `stop` 释放会话

- 参数结构调整为讯飞在线虚拟人 Web API 结构：
  - `header.scene_id` 使用管理后台配置的接口服务 ID
  - `parameter.avatar.avatar_id` 使用虚拟人形象 ID
  - `parameter.tts.vcn` 使用发音人/音色
  - 拉流协议先使用 `flv`，便于后续接网页播放器

## 影响范围

- 候选人面试房间右侧 AI 面试官虚拟人。
- 管理后台系统设置中的“讯飞虚拟人” Provider 配置。

## 验证

已执行：

```bash
mvn -q -DskipTests package
```

结果：通过。

## 后续说明

如果后端已能拿到 `stream_url`，但前端仍无法播放 FLV，需要继续引入 FLV 播放器库，或改用讯飞 Web SDK / XRTC 播放器。

如果仍出现 `22105 avatar error`，说明已进入讯飞在线虚拟人引擎初始化阶段，需检查：

- 当前 `avatar_id` 是否已授权并发布；
- 当前 `vcn` 是否已授权；
- `appId`、`apiKey`、`apiSecret`、`scene_id` 是否来自同一个接口服务；
- 是否存在残留会话或并发路数不足。
