# 管理端控制台与面试回顾优化报告

日期：2026-07-24  
分支：`test`

## 问题

1. 管理员后台没有独立工作台，左侧“工作台”、候选人及评测报告入口在部分页面中是无跳转的静态元素。
2. 面试管理中的“查看回顾”使用了 `/admin/interviews/:id/room`，但该路由没有管理员专属页面，容易落入候选人面试流程或显示异常。
3. 管理端各页面缺少统一的导航、主题切换与顶部操作区，和候选人端的产品体验不一致。

## 修改

- 新增 `AdminPageShell`，提供统一的浅色/深色主题、状态提示、管理员菜单、顶部搜索和用户入口。
- 新增 `/admin/workspace` 管理工作台：展示面试总量、待开始、进行中、已完成，以及最近面试和候选人运营快捷入口。
- 新增 `/admin/interviews/:id/review` 管理员专属回顾页：查看面试元数据、题目、候选人作答与逐题 AI 评价。
- 保留 `/admin/interviews/:id/room` 作为兼容路由，但改为渲染管理员回顾页，避免任何管理员操作进入候选人面试房间。
- 所有管理端页面统一由 `AdminPageShell` 承载；既有页面不重写业务逻辑，兼容其旧布局并由新壳层接管导航。
- 完成面试的“查看报告”继续使用管理端 `/admin/reports?interviewId=...`，报告详情只在管理端呈现。

## 验证

- `frontend-react`: `npm run build` 通过。
- `backend`: `mvn -q test` 通过。
- 后端测试仍有既存 MyBatis-Plus 联表实体缺少 `@TableId` 的警告，本次未改变该行为。

## 影响范围

- `frontend-react/src/app.tsx`
- `frontend-react/src/components/admin-page-shell.tsx`
- `frontend-react/src/pages/admin-workspace.tsx`
- `frontend-react/src/pages/admin-interview-review.tsx`

## 配置说明

工作区中的 `backend/src/main/resources/application.yml` 含有未提交的本地配置变更；该文件未纳入本次提交，以避免将本地密钥或环境配置推送至远程仓库。
