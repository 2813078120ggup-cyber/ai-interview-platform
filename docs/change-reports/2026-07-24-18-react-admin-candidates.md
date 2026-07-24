# React 管理端候选人管理迁移（第 9 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增 `/admin/candidates` 管理端候选人目录页。
- 对接用户分页、角色列表、新建用户和账号启停接口。
- 仅展示具备 `CANDIDATE` 角色的账号。
- 支持搜索、按账号状态筛选、创建候选人及启用/停用账号。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test\frontend-react
npm run build
```
