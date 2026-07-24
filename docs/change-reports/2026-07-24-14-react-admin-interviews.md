# React 管理端面试管理迁移（第 5 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增 React 管理端核心页面：`/admin/interviews`。
- 对接既有面试、候选人、题目和题库接口，不调整后端数据模型。
- 支持按主题/候选人搜索，按预约时间范围和状态筛选，默认按时间倒序展示。
- 支持创建面试：候选人下拉选择、自定义多题选择、题库随机抽题、预约时间、时长。
- 已结束场次显示“查看报告”，未结束场次显示“查看回顾”。

## 说明

- 这是管理端迁移的核心第一页；报告中心、题库和用户管理会在后续独立模块迁移。
- React 前端仍位于独立的 `frontend-react` 目录，当前线上 Vue/Docker 构建不受影响。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
