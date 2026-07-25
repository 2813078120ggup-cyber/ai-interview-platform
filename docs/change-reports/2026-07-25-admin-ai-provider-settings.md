# 2026-07-25 管理后台系统设置与 Provider 配置管理报告

## ① 问题

项目已经接入 DeepSeek，并计划接入讯飞虚拟人、语音识别、语音朗读等能力，但管理后台没有统一入口展示和管理这些 AI 服务配置。

## ② 为什么是问题

- 管理员无法直观看到当前启用的模型、语音和虚拟人配置。
- 后续接入讯飞虚拟人、ASR、TTS 时，如果配置分散在代码或环境变量中，维护成本高。
- 演示时缺少“系统能力配置中心”，产品完整度不足。

## ③ 如何修改

- 管理后台新增“系统设置”菜单。
- 新增 `/admin/settings` 页面。
- 页面支持展示以下配置类型：
  - 大模型 Provider
  - 讯飞虚拟人 Provider
  - 浏览器语音 Provider
  - 语音识别 Provider
- 支持前端交互：
  - 新增 Provider
  - 编辑 Provider
  - 删除 Provider
  - 启用 / 停用 Provider
  - 设置文字默认 Provider
  - 设置语音默认 Provider
  - 模拟测试 Provider
  - API Key / API Secret / APP ID 脱敏展示
- 当前版本使用浏览器本地状态保存配置，避免将真实密钥硬编码到前端代码中。
- 操作会记录到前端操作日志中，便于管理后台审计展示。

## ④ 验证结果

- 已执行 `npm run build`。
- TypeScript 编译通过。
- Vite 生产构建通过。
- 构建仅存在 chunk size 提示，不影响运行。

## ⑤ 影响范围

- 新增文件：
  - `frontend-react/src/pages/admin-settings.tsx`
- 修改文件：
  - `frontend-react/src/app.tsx`
  - `frontend-react/src/components/admin-page-shell.tsx`
- 不影响现有登录、面试、题库、候选人、报告功能。

## ⑥ 后续建议

当前版本先完成前端配置管理体验。下一步建议补充后端持久化：

- 新增 `system_config` 或 `ai_provider_config` 表。
- 后端使用加密方式保存 API Key / API Secret。
- 增加配置连通性测试接口。
- DeepSeek、讯飞虚拟人、ASR、TTS 调用统一从配置中心读取。
