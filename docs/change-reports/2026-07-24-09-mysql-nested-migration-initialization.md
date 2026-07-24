# MySQL 嵌套迁移初始化修复报告

**日期：** 2026-07-24  
**分支：** `test`  
**范围：** Docker 首次数据库初始化

## 问题

首次启动容器后，`ai_task` 表不存在，导致后端 AI 任务调度器持续报数据库错误。

## 原因

MySQL 官方镜像仅自动执行 `/docker-entrypoint-initdb.d` 第一层的 SQL 与 Shell 文件。项目的 V2–V7 迁移位于 `migrations/` 子目录，因而不会自动运行。

## 修改

- 新增根层初始化脚本 `99-apply-migrations.sh`。
- 该脚本在基础 Schema 与测试数据之后按版本顺序执行 `migrations/V*.sql`。
- 该脚本只对首次创建 MySQL 数据卷生效；已有数据卷应由运维人员显式执行迁移，避免自动重复执行 `ALTER TABLE`。

## 验证方式

首次创建卷后执行：

```bash
docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE 'ai_task';"
```

预期返回 `ai_task`。
