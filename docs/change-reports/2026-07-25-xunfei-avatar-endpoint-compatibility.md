# 2026-07-25 讯飞虚拟人地址兼容修复

## 背景

管理后台系统设置中，讯飞虚拟人 Provider 的 Base URL 仍显示为：

```text
https://vms.cn-huadong-1.xf-yun.com
```

但当前接入的是讯飞“在线虚拟人驱动 / Web API 实时交互”，应使用：

```text
wss://avatar.cn-huadong-1.xf-yun.com/v1/interact
```

如果继续使用旧 `vms` 域名，后端会连接到错误的接口族，导致虚拟人无法正常启动或继续降级为本地数字人。

## 本次修改

- 后端讯飞虚拟人客户端增加 Base URL 自动兼容：
  - `vms.cn-huadong-1.xf-yun.com` 自动转换为 `avatar.cn-huadong-1.xf-yun.com`
  - `http://` 自动转换为 `ws://`
  - `https://` 自动转换为 `wss://`
  - 自动补齐 `/v1/interact`
  - 自动移除旧 HTTP 接口路径 `/v1/private/vms2d_start` / `/v1/private/vms2d_ctrl`

- 新初始化的讯飞虚拟人 Provider 默认地址改为：

```text
wss://avatar.cn-huadong-1.xf-yun.com/v1/interact
```

## 影响范围

- 已填写旧 `vms` 地址的环境无需手动改数据库，后端会自动转换。
- 新环境默认展示正确 WebSocket 地址。
- APPID、API Key、API Secret、接口服务 ID、虚拟人形象 ID、发音人配置保持不变。

## 验证

已执行：

```bash
mvn -q -DskipTests package
```

结果：通过。

## 后续建议

建议管理后台手动把 Base URL 改成：

```text
wss://avatar.cn-huadong-1.xf-yun.com/v1/interact
```

这样排查问题时更直观。
