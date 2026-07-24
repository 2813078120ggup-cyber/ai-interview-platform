# React Docker 构建入口切换（第 12 个模块）

日期：2026-07-24  
分支：`test`

## 本次变更

- 新增 `frontend-react` 的生产 Dockerfile、Nginx 配置和 Docker 忽略文件。
- `docker-compose.yml` 的 `frontend` 服务构建上下文切换为 `./frontend-react`。
- Nginx 保持 `/api/` 反向代理到 `backend:8080`，前端路由继续使用 SPA 回退。

## 部署影响

- 下次执行 `docker compose build frontend` 或 `docker compose up -d --build` 时，将构建 React 19 前端。
- 原 `frontend`（Vue）目录未删除；若需紧急回退，只需将构建上下文改回 `./frontend` 后重建。

## 验证

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test
docker compose config
cd frontend-react
npm run build
```
