# 2026-07-25 AI 个性化训练计划与面试官风格模式

## 本次目标

实现两个产品能力：

1. 报告页支持基于评测结果生成“我的提升计划”。
2. AI 面试支持面试官性格/场景风格选择，并让后端 DeepSeek 提示词按风格执行。

## 已完成

### 1. 个性化训练计划

- 在报告接口新增 `POST /v1/interviews/{interviewId}/report/training-plan`。
- DeepSeek 已配置时，后端会根据报告中的综合分、专业能力、表达能力、逻辑思维、应变能力、优势、短板和建议生成 JSON 训练计划。
- DeepSeek 不可用或超时时，系统自动退回规则版训练计划，避免用户点击后无结果。
- 训练计划包含：
  - 当前最优先提升结论
  - 7 天训练周期
  - 训练重点
  - 每日训练任务
  - 推荐题库 / 训练方向
  - 推荐模拟面试方式
  - 可衡量完成标准
- 候选人报告页与管理员报告弹层均可生成训练计划。

### 2. AI 面试官风格模式

- 新增可选风格：
  - 温和型
  - 压迫型
  - 大厂技术面
  - HR 综合面
  - 项目深挖型
  - 校招基础型
- 候选人创建模拟练习时可选择面试官风格。
- 管理员创建正式 AI 面试时可指定面试官风格。
- 后端创建面试时将风格写入面试备注标记 `interviewerStyle=...`。
- AI 开场题与 AI 追问任务会读取当前面试风格，并注入 DeepSeek system/user prompt。
- 选择题仍保持不调用 AI 追问的现有逻辑。

## 关键文件

- `backend/src/main/java/com/tyut/aiinterview/ai/DeepSeekGateway.java`
- `backend/src/main/java/com/tyut/aiinterview/ai/AiTaskService.java`
- `backend/src/main/java/com/tyut/aiinterview/interview/InterviewDtos.java`
- `backend/src/main/java/com/tyut/aiinterview/interview/InterviewService.java`
- `backend/src/main/java/com/tyut/aiinterview/report/ReportController.java`
- `backend/src/main/java/com/tyut/aiinterview/report/ReportDtos.java`
- `backend/src/main/java/com/tyut/aiinterview/report/ReportService.java`
- `frontend-react/src/lib/interviewer-styles.ts`
- `frontend-react/src/components/report-detail-view.tsx`
- `frontend-react/src/pages/candidate-lobby.tsx`
- `frontend-react/src/pages/candidate-report.tsx`
- `frontend-react/src/pages/admin-interviews.tsx`
- `frontend-react/src/app.tsx`
- `frontend-react/src/pages/candidate-library.tsx`

## 验证

- 后端：`mvn -q -DskipTests package` 通过。
- 前端：`npm run build` 通过。

## 说明

- 当前训练计划不落库，属于按需生成/查看能力，后续如果要做长期学习闭环，可以新增 `training_plan` 表记录计划完成状态。
- 大厂技术面作为默认风格，兼容旧数据和旧入口。
