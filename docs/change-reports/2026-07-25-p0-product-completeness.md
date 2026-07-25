# 2026-07-25 P0 产品完成度修复报告

## 本次目标

实现 P0 优先级能力，补齐系统从“看起来可用”到“真实可用”的关键闭环：

1. 系统设置接入后端持久化。
2. Provider 支持真实连通性测试。
3. 面试房间增加 AI 异常兜底。
4. 结束面试后展示报告生成进度。

## 主要改动

### 1. 系统设置后端持久化

- 新增 `ai_provider_config` 配置表。
- 新增 `AiProviderConfig` 实体和 Mapper。
- 新增 `AiProviderService` / `AiProviderController`。
- 提供管理端接口：
  - `GET /v1/admin/ai-providers`
  - `POST /v1/admin/ai-providers`
  - `PUT /v1/admin/ai-providers/{id}`
  - `DELETE /v1/admin/ai-providers/{id}`
  - `POST /v1/admin/ai-providers/{id}/test`
- 后端启动时会自动确保配置表存在，避免部署时漏执行 SQL。
- 密钥通过 AES-GCM 加密保存，前端只展示脱敏状态；编辑时保留星号脱敏值不会覆盖原密钥。

### 2. Provider 真实连通性测试

- LLM Provider 使用 `/chat/completions` 小请求验证大模型连通性。
- 浏览器语音 Provider 识别为客户端能力，返回本地可用说明。
- ASR / TTS / 虚拟人 Provider 进行 Base URL 与密钥配置校验，并返回 HTTP 状态与耗时。
- 前端“测试”按钮展示成功/失败、HTTP 状态、耗时和失败原因。

### 3. 面试房间异常兜底

- 主观题回答会先保存，再请求 AI 追问。
- AI 追问失败或超时不再阻断流程，页面提示“回答已保存，可继续下一题或稍后重试”。
- 选择题继续保持不调用 AI 面试官，提交后直接进入下一题。
- 语音朗读不支持时给出明确浏览器兼容提示。
- 摄像头和语音识别保留 HTTPS / localhost 访问限制提示。

### 4. 结束面试报告生成进度

- `POST /v1/interviews/{id}/end` 现在返回自动评测任务 ID。
- 新增 `GET /v1/interviews/{id}/evaluation-task` 查询该面试最新评测任务。
- 前端结束面试弹框增加状态流：
  - 锁定答案
  - AI 评分
  - 生成报告
- 报告生成成功后自动跳转候选人报告页。
- 报告生成失败时提供“返回大厅”和“稍后查看报告”入口。

## 涉及文件

- `backend/src/main/java/com/tyut/aiinterview/domain/AiProviderConfig.java`
- `backend/src/main/java/com/tyut/aiinterview/mapper/AiProviderConfigMapper.java`
- `backend/src/main/java/com/tyut/aiinterview/settings/*`
- `backend/src/main/java/com/tyut/aiinterview/ai/AiTaskService.java`
- `backend/src/main/java/com/tyut/aiinterview/interview/*`
- `backend/src/main/java/com/tyut/aiinterview/media/MediaController.java`
- `frontend-react/src/pages/admin-settings.tsx`
- `frontend-react/src/pages/interview-room.tsx`
- `docs/database/migrations/V8__ai_provider_config.sql`

## 验证结果

- 后端构建：`mvn -q -DskipTests package` 通过。
- 前端构建：`npm run build` 通过。
- 前端构建存在 Vite chunk size 提示，非本次阻断问题，可后续用路由懒加载优化。

## 注意事项

- `backend/src/main/resources/application.yml` 是本地运行配置改动，本次未纳入提交。
- 正式生产建议配置 `app.config-secret` 或环境变量 `JWT_SECRET`，保证配置密钥加密使用稳定密钥。
