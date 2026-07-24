# Docker 生产部署配置变更报告

**日期：** 2026-07-24  
**分支：** `test`  
**范围：** 容器化交付配置

## 变更内容

- 将原先仅包含 MySQL、Redis 的 Compose 文件扩展为完整应用编排：MySQL、Redis、Spring Boot 后端和 Vue/Nginx 前端。
- 新增后端 Java 17 多阶段构建镜像，运行阶段使用非 root 用户。
- 新增前端 Node 构建 + Nginx 运行镜像；Nginx 提供 SPA 路由回退、`/api` 反向代理和 100 MB 上传限制。
- 新增 `.env.example`，把数据库密码、Redis 密码、JWT 密钥与 DeepSeek Key 置于部署时环境变量中，避免写入版本库或镜像。
- 将 MySQL、Redis 改为仅在 Docker 私有网络中暴露；外部仅发布前端 HTTP 端口。
- 为 MySQL、Redis 添加健康检查，后端在依赖可用后才启动。
- 新增服务器部署、更新、日志查看和数据持久化说明。

## 安全与运行影响

- 首次启动会执行 `docs/database` 中的初始化 SQL，已有数据库卷不会再次初始化。
- `.env` 文件受到 `.gitignore` 保护，但仍须在服务器执行 `chmod 600 .env`。
- 生产部署前必须替换所有示例密码，并使用至少 32 字符的随机 JWT 密钥。
- 没有使用 `docker compose down -v`，以免误删 MySQL、Redis 和上传媒体数据。

## 验证方式

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

后端健康完成后，访问 `http://<server>/`；API 请求应通过 Nginx 的 `/api` 转发至后端。
