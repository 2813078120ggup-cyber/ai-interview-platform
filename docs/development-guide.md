# 开发指南

## 本地启动

1. 在仓库根目录执行 `docker compose up -d`，启动 MySQL 和 Redis。
2. 后端进入 `backend` 后执行 `mvn spring-boot:run`，默认监听 `8080`。
3. 前端进入 `frontend` 后执行 `npm install`、`npm run dev`，默认监听 `5173`。

后端个人配置请从 `backend/src/main/resources/application-local.yml.example` 复制出
`application-local.yml`，该文件已被 Git 忽略。

## 模块边界

后端按业务领域组织，公共能力仅放在 `common`：

- `user`：用户、登录、角色与权限
- `question` 与 `interview`：题库、面试编排、作答流程
- `ai`、`evaluation` 与 `report`：模型接入、评分与报告
- `admin`：跨领域的后台管理功能

接口统一以 `/api` 为前缀，返回 `ApiResponse`；数据库变更使用 `docs/database` 下的版本化 SQL 文件。

## 提交与集成

- 从 `develop` 切出 `feature/<scope>-<feature>` 分支开发。
- 每个提交只解决一个可验证的目的，使用 `feat:`、`fix:`、`docs:`、`refactor:` 等前缀。
- 合并前至少运行与改动相关的后端测试或前端构建，并在 PR 中写明数据库变更和接口影响。
