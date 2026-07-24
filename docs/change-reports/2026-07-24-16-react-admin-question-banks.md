# React 管理端题库管理迁移（第 7 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增 `/admin/question-banks` React 管理端题库页面。
- 对接既有题库分页查询与新建题库接口。
- 支持题库名称/编码搜索、启用状态筛选、题库卡片视图。
- 支持新建题库：编码、名称、说明与可见范围。

## 范围说明

题目编辑、分类管理和题库删除接口已存在，但为保证本次变更可审查且风险可控，下一模块再单独迁移题目维护页。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
