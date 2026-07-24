# 项目结构

```text
ai-interview-platform/
├── backend/                     # Spring Boot API
│   └── src/main/java/com/gc/aiinterview/
│       ├── common/               # 通用响应、异常、基础设施
│       ├── user/                 # 用户与权限
│       ├── question/             # 题库
│       ├── interview/            # 面试流程
│       ├── ai/                   # AI 服务适配
│       ├── evaluation/           # 评分
│       ├── report/               # 报告
│       └── admin/                # 后台管理
├── frontend/                    # Vue 3 Web 应用
│   └── src/
│       ├── api/                 # HTTP 客户端与接口封装
│       ├── components/          # 跨模块组件
│       └── modules/             # 领域模块
├── docs/                        # 需求、设计与开发文档
└── docker-compose.yml           # 本地 MySQL、Redis
```

业务代码不得直接依赖其他领域模块的持久化实现；需要跨模块协作时，通过服务接口或明确的 DTO 进行交互。
