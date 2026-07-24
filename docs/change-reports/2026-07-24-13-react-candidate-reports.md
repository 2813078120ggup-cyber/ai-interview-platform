# React 候选人报告与能力仪表盘迁移（第 4 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增单场面试报告页面，使用既有 `/v1/interviews/{id}/report` 接口。
- 在报告尚未生成时自动每 5 秒轮询，并提供手动刷新入口。
- 报告页展示综合评分、四项能力得分、进度条、优势、待提升项与行动建议。
- 新增候选人能力仪表盘，使用既有 `/v1/reports/my/summary` 接口展示历史趋势与相对上一份报告的变化。
- 新增 React 路由：`/candidate/interviews/:id/report`、`/candidate/reports`。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```

## 兼容性

本模块仅增加 `frontend-react` 迁移目录，未替换当前线上 Vue/Docker 前端。
