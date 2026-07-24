# React 登录与角色入口迁移（第 11 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增 React 登录/注册页面与本地会话存储。
- 登录后根据角色自动路由：`ADMIN` 进入 `/admin/interviews`，候选人进入 `/candidate/interviews`。
- 新增路由保护：未登录用户跳转登录页；非管理员不能访问管理端路由。
- 复用既有 `/v1/auth/login`、`/v1/auth/register` 接口，不改动认证后端。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
