# React 前端发布手册（第 13 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增 React 前端的云服务器发布手册。
- 采用本地 `git archive`、SCP 上传方式，适配服务器无法稳定拉取 GitHub 的现状。
- 明确仅重建 `frontend` 容器，避免触碰数据库、Redis、后端和持久化数据。
- 提供备份、验证和 Vue 前端回退步骤。

详见：[React 前端发布手册](../deployment/REACT_FRONTEND_ROLLOUT.md)。
