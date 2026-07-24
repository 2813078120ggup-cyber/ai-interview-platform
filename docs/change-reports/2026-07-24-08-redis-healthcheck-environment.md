# Redis 健康检查环境变量修复报告

**日期：** 2026-07-24  
**分支：** `test`  
**范围：** Docker Compose Redis 服务

## 问题

Redis 容器启动后被 Docker Compose 判定为 `unhealthy`，从而阻塞依赖 Redis 健康状态的后端服务启动。

## 原因

Redis 的启动命令从 Compose 变量中获得了密码，但容器环境中未声明 `REDIS_PASSWORD`。健康检查中的 `redis-cli -a "$REDIS_PASSWORD" ping` 因此无法读取密码。

## 修改

为 Redis 服务显式注入 `REDIS_PASSWORD` 环境变量，使启动命令与健康检查使用同一密码来源。

## 验证方式

```bash
docker compose up -d --no-build --force-recreate redis
docker compose ps
```

预期 Redis 状态变为 `healthy`，随后后端与前端可以正常启动。
