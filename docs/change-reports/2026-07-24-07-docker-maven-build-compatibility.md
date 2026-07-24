# Docker Maven 构建兼容性修复报告

**日期：** 2026-07-24  
**分支：** `test`  
**范围：** 后端容器镜像构建

## 问题

Docker 构建在 `mvn dependency:go-offline` 阶段失败，导致后端镜像无法生成。

## 原因

`dependency:go-offline` 会额外解析 Maven 插件及其传递依赖。该预下载步骤不参与最终编译，且在不同 Maven 仓库网络环境中容易因插件解析差异而失败。

## 修改

- 移除独立的 `dependency:go-offline` 层。
- 保留 `mvn -B -ntp clean package -DskipTests` 作为唯一 Maven 容器构建步骤，由 Maven 在实际打包时解析所需依赖。

## 验证

- 本地 `mvn test` 已通过，2 个测试全部成功。
- 前端生产构建已通过。
- 修改后需在 Docker Desktop 中重新执行 `docker compose build backend --progress=plain` 验证容器内 Maven 下载与打包。
