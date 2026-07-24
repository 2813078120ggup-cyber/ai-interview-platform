# 模拟面试平台数据字典

## 1. 文档说明

- 数据库：MySQL 8.0+
- 存储引擎：InnoDB
- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_0900_ai_ci`
- DDL 文件：`01-schema_v1.sql`
- 主键类型：除关联表外统一使用 `BIGINT UNSIGNED AUTO_INCREMENT`
- 时间字段：使用 `DATETIME`，创建时间默认 `CURRENT_TIMESTAMP`
- 软删除：`deleted_at` 为空表示有效，非空表示已删除

## 2. 表清单

| 表名 | 表说明 |
|---|---|
| `user` | 系统用户表，保存候选人、面试官、HR 和管理员的公共账户信息 |
| `role` | 角色定义表 |
| `user_role` | 用户与角色的多对多关联表 |
| `question_bank` | 题库基本信息表 |
| `question` | 面试题目表 |
| `interview` | 面试场次及流程状态表 |
| `interview_question` | 面试与题目的关联表，保存抽题顺序及当次分值 |
| `interview_answer` | 候选人对面试题目的作答记录 |
| `evaluation` | 面试官或 AI 对单道面试题的评测记录 |
| `report` | 面试结束后生成的最终报告 |

## 3. 用户表 `user`

### 3.1 表说明

保存平台所有用户的账户资料、登录信息和状态。候选人、面试官、HR、管理员通过 `user_role` 关联不同角色。

### 3.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 用户主键 |
| `username` | VARCHAR(64) | 否 | 无 | UK | 登录用户名 |
| `password_hash` | VARCHAR(255) | 否 | 无 |  | 密码哈希值，禁止存储明文密码 |
| `real_name` | VARCHAR(64) | 否 | 无 |  | 用户真实姓名或显示名称 |
| `email` | VARCHAR(128) | 是 | NULL | UK | 电子邮箱 |
| `phone` | VARCHAR(32) | 是 | NULL | UK | 手机号码 |
| `avatar_url` | VARCHAR(512) | 是 | NULL |  | 头像资源地址 |
| `status` | TINYINT | 否 | 1 | 业务枚举 | 账户状态 |
| `last_login_at` | DATETIME | 是 | NULL |  | 最近一次成功登录时间 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间，数据更新时自动刷新 |
| `deleted_at` | DATETIME | 是 | NULL |  | 软删除时间 |

### 3.3 枚举值说明

| 字段 | 值 | 含义 |
|---|---:|---|
| `status` | 0 | 禁用 |
| `status` | 1 | 启用 |

### 3.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识用户 |
| `uk_user_username` | 唯一索引 | `username` | 保证用户名唯一，支持登录查询 |
| `uk_user_email` | 唯一索引 | `email` | 保证非空邮箱唯一 |
| `uk_user_phone` | 唯一索引 | `phone` | 保证非空手机号唯一 |
| `idx_user_status_created` | 普通联合索引 | `status, created_at` | 按账户状态和创建时间筛选用户 |

## 4. 角色表 `role`

### 4.1 表说明

定义平台角色。角色编码供程序鉴权使用，角色名称用于界面展示。

### 4.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 角色主键 |
| `role_code` | VARCHAR(32) | 否 | 无 | UK | 稳定的角色编码 |
| `role_name` | VARCHAR(64) | 否 | 无 | UK | 角色显示名称 |
| `description` | VARCHAR(255) | 是 | NULL |  | 角色说明 |
| `status` | TINYINT | 否 | 1 | 业务枚举 | 角色状态 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |

### 4.3 枚举值说明

`role_code` 为业务预置值，当前 DDL 未通过 `CHECK` 限制，可按权限体系扩展。

| 字段 | 值 | 含义 |
|---|---|---|
| `role_code` | `CANDIDATE` | 候选人 |
| `role_code` | `INTERVIEWER` | 面试官 |
| `role_code` | `HR` | 人力资源人员 |
| `role_code` | `ADMIN` | 系统管理员 |
| `status` | `0` | 禁用 |
| `status` | `1` | 启用 |

### 4.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识角色 |
| `uk_role_code` | 唯一索引 | `role_code` | 保证角色编码唯一 |
| `uk_role_name` | 唯一索引 | `role_name` | 保证角色名称唯一 |
| `idx_role_status` | 普通索引 | `status` | 按启用状态筛选角色 |

## 5. 用户角色关联表 `user_role`

### 5.1 表说明

实现用户与角色的多对多关系，并记录角色分配人和分配时间。

### 5.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `user_id` | BIGINT UNSIGNED | 否 | 无 | PK, FK | 用户 ID，引用 `user.id` |
| `role_id` | BIGINT UNSIGNED | 否 | 无 | PK, FK | 角色 ID，引用 `role.id` |
| `assigned_by` | BIGINT UNSIGNED | 是 | NULL | FK | 执行角色分配的用户 ID，引用 `user.id` |
| `assigned_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 角色分配时间 |

### 5.3 枚举值说明

无枚举字段。

### 5.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 联合主键 | `user_id, role_id` | 防止同一用户重复分配同一角色 |
| `idx_user_role_role` | 普通索引 | `role_id` | 查询拥有指定角色的用户 |
| `idx_user_role_assigned_by` | 普通索引 | `assigned_by` | 查询某个操作人执行的角色分配 |

### 5.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_user_role_user` | `user_id` | `user.id` | CASCADE | RESTRICT |
| `fk_user_role_role` | `role_id` | `role.id` | CASCADE | RESTRICT |
| `fk_user_role_assigned_by` | `assigned_by` | `user.id` | SET NULL | RESTRICT |

## 6. 题库表 `question_bank`

### 6.1 表说明

保存题库名称、编码、可见范围、状态和创建人。一个题库可以包含多道题目。

### 6.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 题库主键 |
| `bank_code` | VARCHAR(64) | 否 | 无 | UK | 稳定的题库编码 |
| `name` | VARCHAR(128) | 否 | 无 |  | 题库名称 |
| `description` | VARCHAR(500) | 是 | NULL |  | 题库说明 |
| `visibility` | TINYINT | 否 | 0 | 业务枚举 | 题库可见范围 |
| `status` | TINYINT | 否 | 1 | 业务枚举 | 题库状态 |
| `created_by` | BIGINT UNSIGNED | 否 | 无 | FK | 创建人 ID，引用 `user.id` |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |
| `deleted_at` | DATETIME | 是 | NULL |  | 软删除时间 |

### 6.3 枚举值说明

| 字段 | 值 | 含义 |
|---|---:|---|
| `visibility` | 0 | 私有，仅创建人可使用 |
| `visibility` | 1 | 组织或团队内共享 |
| `visibility` | 2 | 平台公开 |
| `status` | 0 | 禁用 |
| `status` | 1 | 启用 |

### 6.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识题库 |
| `uk_question_bank_code` | 唯一索引 | `bank_code` | 保证题库编码唯一 |
| `idx_question_bank_creator` | 普通索引 | `created_by` | 查询用户创建的题库 |
| `idx_question_bank_status_visibility` | 普通联合索引 | `status, visibility` | 筛选可用题库及其可见范围 |

### 6.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_question_bank_creator` | `created_by` | `user.id` | RESTRICT | RESTRICT |

## 7. 题目表 `question`

### 7.1 表说明

保存题干、题型、难度、标准答案、评分模板和标签等信息。题目必须归属于一个题库。

### 7.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 题目主键 |
| `bank_id` | BIGINT UNSIGNED | 否 | 无 | FK | 所属题库 ID，引用 `question_bank.id` |
| `question_type` | VARCHAR(20) | 否 | 无 | 业务枚举 | 题目类型 |
| `difficulty` | TINYINT | 否 | 2 | CHECK | 难度，只允许 1、2、3 |
| `content` | TEXT | 否 | 无 |  | 题干内容 |
| `options` | JSON | 是 | NULL |  | 选择题选项数组，非选择题可为空 |
| `correct_answer` | JSON | 是 | NULL |  | 标准答案，候选人接口不得返回该字段 |
| `answer_template` | TEXT | 是 | NULL |  | 参考答案或评分模板 |
| `explanation` | TEXT | 是 | NULL |  | 答案解析 |
| `tags` | JSON | 是 | NULL |  | 标签数组，例如技术方向和知识点 |
| `score` | DECIMAL(6,2) | 否 | 10.00 | CHECK | 默认满分，必须大于或等于 0 |
| `sort_order` | INT | 否 | 0 |  | 题目在题库中的排序值 |
| `status` | TINYINT | 否 | 1 | 业务枚举 | 题目状态 |
| `created_by` | BIGINT UNSIGNED | 否 | 无 | FK | 创建人 ID，引用 `user.id` |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |
| `deleted_at` | DATETIME | 是 | NULL |  | 软删除时间 |

### 7.3 枚举值说明

`question_type` 和 `status` 为业务约定；`difficulty` 由数据库 `CHECK` 约束强制限制。

| 字段 | 值 | 含义 |
|---|---|---|
| `question_type` | `single_choice` | 单选题 |
| `question_type` | `multiple_choice` | 多选题 |
| `question_type` | `true_false` | 判断题 |
| `question_type` | `short_answer` | 简答题 |
| `question_type` | `coding` | 编程题 |
| `difficulty` | `1` | 简单 |
| `difficulty` | `2` | 中等 |
| `difficulty` | `3` | 困难 |
| `status` | `0` | 草稿 |
| `status` | `1` | 已发布 |
| `status` | `2` | 已归档 |

### 7.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识题目 |
| `idx_question_bank_status_order` | 普通联合索引 | `bank_id, status, sort_order, id` | 查询题库中的有效题目并按顺序分页 |
| `idx_question_type_difficulty` | 普通联合索引 | `question_type, difficulty` | 按题型和难度抽题 |
| `idx_question_creator` | 普通索引 | `created_by` | 查询用户创建的题目 |

### 7.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_question_bank` | `bank_id` | `question_bank.id` | RESTRICT | RESTRICT |
| `fk_question_creator` | `created_by` | `user.id` | RESTRICT | RESTRICT |

## 8. 面试表 `interview`

### 8.1 表说明

保存面试预约、候选人、面试官、面试类型、会议地址和流程状态，是面试业务的核心表。

### 8.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 面试主键 |
| `title` | VARCHAR(200) | 否 | 无 |  | 面试标题 |
| `candidate_id` | BIGINT UNSIGNED | 否 | 无 | FK | 候选人 ID，引用 `user.id` |
| `interviewer_id` | BIGINT UNSIGNED | 否 | 无 | FK | 面试官 ID，引用 `user.id` |
| `scheduled_at` | DATETIME | 否 | 无 |  | 预约开始时间 |
| `duration` | INT UNSIGNED | 否 | 60 | CHECK | 计划时长，单位为分钟，必须大于 0 |
| `started_at` | DATETIME | 是 | NULL |  | 实际开始时间 |
| `ended_at` | DATETIME | 是 | NULL | CHECK | 实际结束时间，不得早于实际开始时间 |
| `status` | TINYINT | 否 | 0 | CHECK | 面试状态，只允许 0、1、2、3 |
| `type` | VARCHAR(20) | 否 | 无 | 业务枚举 | 面试类型 |
| `meeting_url` | VARCHAR(512) | 是 | NULL |  | 在线面试房间地址 |
| `remark` | VARCHAR(500) | 是 | NULL |  | 内部备注 |
| `created_by` | BIGINT UNSIGNED | 否 | 无 | FK | 创建人 ID，引用 `user.id` |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |

### 8.3 枚举值说明

`status` 由数据库 `CHECK` 约束强制限制；`type` 为业务约定。

| 字段 | 值 | 含义 |
|---|---|---|
| `status` | `0` | 待开始（pending） |
| `status` | `1` | 进行中（in_progress） |
| `status` | `2` | 已结束（completed） |
| `status` | `3` | 已取消（cancelled） |
| `type` | `tech` | 技术面试 |
| `type` | `hr` | HR 面试 |
| `type` | `comprehensive` | 综合面试 |

### 8.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识面试 |
| `idx_interview_candidate` | 普通联合索引 | `candidate_id, scheduled_at` | 查询候选人的面试安排 |
| `idx_interview_interviewer` | 普通联合索引 | `interviewer_id, scheduled_at` | 查询面试官的面试日程 |
| `idx_interview_status_scheduled` | 普通联合索引 | `status, scheduled_at` | 查询指定状态和时间范围的面试 |
| `idx_interview_creator` | 普通索引 | `created_by` | 查询用户创建的面试 |

### 8.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_interview_candidate` | `candidate_id` | `user.id` | RESTRICT | RESTRICT |
| `fk_interview_interviewer` | `interviewer_id` | `user.id` | RESTRICT | RESTRICT |
| `fk_interview_creator` | `created_by` | `user.id` | RESTRICT | RESTRICT |

## 9. 面试题目关联表 `interview_question`

### 9.1 表说明

实现面试与题目的多对多关系，保存题目在某次面试中的顺序、满分和内容快照，防止题库修改影响历史面试。

### 9.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 面试题目记录主键 |
| `interview_id` | BIGINT UNSIGNED | 否 | 无 | FK, UK | 面试 ID，引用 `interview.id` |
| `question_id` | BIGINT UNSIGNED | 否 | 无 | FK, UK | 题目 ID，引用 `question.id` |
| `sequence_no` | INT UNSIGNED | 否 | 无 | UK | 题目在本次面试中的顺序号 |
| `max_score` | DECIMAL(6,2) | 否 | 10.00 | CHECK | 该题在本次面试中的满分，必须大于或等于 0 |
| `question_snapshot` | JSON | 是 | NULL |  | 题目内容快照，可保存题干、选项和评分模板 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |

### 9.3 枚举值说明

无枚举字段。

### 9.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识面试题目记录 |
| `uk_interview_question` | 唯一联合索引 | `interview_id, question_id` | 防止同一道题在同一次面试中重复出现 |
| `uk_interview_sequence` | 唯一联合索引 | `interview_id, sequence_no` | 保证同一次面试中的题目顺序唯一 |
| `idx_interview_question_question` | 普通索引 | `question_id` | 查询某道题被哪些面试使用 |

### 9.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_interview_question_interview` | `interview_id` | `interview.id` | CASCADE | RESTRICT |
| `fk_interview_question_question` | `question_id` | `question.id` | RESTRICT | RESTRICT |

## 10. 面试作答表 `interview_answer`

### 10.1 表说明

保存候选人对一道面试题的文本、结构化数据或音频作答。每条面试题目记录最多对应一份作答。

### 10.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 作答主键 |
| `interview_question_id` | BIGINT UNSIGNED | 否 | 无 | FK, UK | 面试题目记录 ID，引用 `interview_question.id` |
| `answer_content` | TEXT | 是 | NULL |  | 文本作答内容 |
| `answer_data` | JSON | 是 | NULL |  | 结构化答案、选择项或代码运行数据 |
| `audio_url` | VARCHAR(512) | 是 | NULL |  | 音频或录音资源地址 |
| `duration_seconds` | INT UNSIGNED | 是 | NULL |  | 作答用时，单位为秒 |
| `answered_at` | DATETIME | 是 | NULL |  | 提交时间 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |

### 10.3 枚举值说明

无枚举字段。

### 10.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识作答 |
| `uk_answer_interview_question` | 唯一索引 | `interview_question_id` | 保证每道面试题最多保存一份作答 |

### 10.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_answer_interview_question` | `interview_question_id` | `interview_question.id` | CASCADE | RESTRICT |

## 11. 评测表 `evaluation`

### 11.1 表说明

保存面试官或 AI 对单道面试题作答的评分和评语。评分维度包括专业能力、表达能力、逻辑思维和应变能力；人工可以确认或调整 AI 结果。

### 11.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 评测主键 |
| `interview_question_id` | BIGINT UNSIGNED | 否 | 无 | FK | 被评测的面试题目记录 ID |
| `evaluator_id` | BIGINT UNSIGNED | 是 | NULL | FK, CHECK | 人工评测人 ID；AI 评测时必须为空 |
| `source` | VARCHAR(10) | 否 | 无 | CHECK | 评测来源，只允许 `human` 或 `ai` |
| `professional_score` | DECIMAL(5,2) | 否 | 无 | CHECK | 专业能力得分，范围 0 至 100 |
| `expression_score` | DECIMAL(5,2) | 否 | 无 | CHECK | 表达能力得分，范围 0 至 100 |
| `logic_score` | DECIMAL(5,2) | 否 | 无 | CHECK | 逻辑思维得分，范围 0 至 100 |
| `adaptability_score` | DECIMAL(5,2) | 否 | 无 | CHECK | 应变能力得分，范围 0 至 100 |
| `overall_score` | DECIMAL(5,2) | 否 | 无 | CHECK | 综合得分，范围 0 至 100 |
| `comment` | TEXT | 是 | NULL |  | 评测意见 |
| `status` | TINYINT | 否 | 0 | CHECK | 评测确认状态 |
| `confirmed_by` | BIGINT UNSIGNED | 是 | NULL | FK | 确认或调整 AI 评测的用户 ID |
| `confirmed_at` | DATETIME | 是 | NULL |  | 确认或调整时间 |
| `created_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 创建时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |

### 11.3 枚举值说明

| 字段 | 值 | 含义 |
|---|---|---|
| `source` | `human` | 面试官人工评测，`evaluator_id` 必须非空 |
| `source` | `ai` | AI 自动评测，`evaluator_id` 必须为空 |
| `status` | `0` | 待确认 |
| `status` | `1` | 已确认 |
| `status` | `2` | 已人工调整 |

### 11.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识评测记录 |
| `idx_evaluation_question_source` | 普通联合索引 | `interview_question_id, source` | 查询一道面试题的人工及 AI 评测 |
| `idx_evaluation_evaluator` | 普通索引 | `evaluator_id` | 查询面试官提交的评测 |
| `idx_evaluation_confirmed_by` | 普通索引 | `confirmed_by` | 查询用户确认或调整的 AI 评测 |

### 11.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_evaluation_interview_question` | `interview_question_id` | `interview_question.id` | CASCADE | RESTRICT |
| `fk_evaluation_evaluator` | `evaluator_id` | `user.id` | SET NULL | RESTRICT |
| `fk_evaluation_confirmer` | `confirmed_by` | `user.id` | SET NULL | RESTRICT |

## 12. 面试报告表 `report`

### 12.1 表说明

保存一次面试的综合评分、各维度得分、优缺点、改进建议和 PDF 地址。一次面试最多对应一份最终报告。

### 12.2 字段列表

| 字段名 | 数据类型 | 允许空 | 默认值 | 键/约束 | 说明 |
|---|---|---|---|---|---|
| `id` | BIGINT UNSIGNED | 否 | 自增 | PK | 报告主键 |
| `interview_id` | BIGINT UNSIGNED | 否 | 无 | FK, UK | 面试 ID，引用 `interview.id` |
| `total_score` | DECIMAL(5,2) | 否 | 无 | CHECK | 综合评分，范围 0 至 100 |
| `professional_score` | DECIMAL(5,2) | 是 | NULL | CHECK | 专业能力得分，范围 0 至 100 |
| `expression_score` | DECIMAL(5,2) | 是 | NULL | CHECK | 表达能力得分，范围 0 至 100 |
| `logic_score` | DECIMAL(5,2) | 是 | NULL | CHECK | 逻辑思维得分，范围 0 至 100 |
| `adaptability_score` | DECIMAL(5,2) | 是 | NULL | CHECK | 应变能力得分，范围 0 至 100 |
| `summary` | TEXT | 否 | 无 |  | 综合评价摘要 |
| `strengths` | TEXT | 是 | NULL |  | 优势分析 |
| `weaknesses` | TEXT | 是 | NULL |  | 不足分析 |
| `improvement_suggestions` | TEXT | 是 | NULL |  | 改进建议 |
| `generation_method` | VARCHAR(10) | 否 | `ai` | CHECK | 报告生成方式 |
| `generated_by` | BIGINT UNSIGNED | 是 | NULL | FK | 手动编辑人或操作人 ID |
| `pdf_url` | VARCHAR(512) | 是 | NULL |  | 导出的 PDF 资源地址 |
| `status` | TINYINT | 否 | 0 | CHECK | 报告状态，草稿或已发布 |
| `published_at` | DATETIME | 是 | NULL |  | 报告发布时间，仅已发布报告有值 |
| `generated_at` | DATETIME | 否 | CURRENT_TIMESTAMP |  | 报告生成时间 |
| `updated_at` | DATETIME | 否 | CURRENT_TIMESTAMP | ON UPDATE | 最近更新时间 |

### 12.3 枚举值说明

| 字段 | 值 | 含义 |
|---|---|---|
| `generation_method` | `ai` | AI 自动生成 |
| `generation_method` | `manual` | HR 或其他授权用户手动编辑 |
| `status` | `0` | 草稿，仅 HR 和管理员可查看 |
| `status` | `1` | 已发布，候选人可查看自己的报告 |

### 12.4 索引说明

| 索引名 | 类型 | 索引字段 | 说明 |
|---|---|---|---|
| `PRIMARY` | 主键索引 | `id` | 唯一标识报告 |
| `uk_report_interview` | 唯一索引 | `interview_id` | 保证一次面试最多生成一份最终报告 |
| `idx_report_generated_at` | 普通索引 | `generated_at` | 按生成时间查询报告 |
| `idx_report_generated_by` | 普通索引 | `generated_by` | 查询用户生成或编辑的报告 |
| `idx_report_status_published_at` | 普通联合索引 | `status, published_at` | 按发布状态和时间查询报告 |

### 12.5 外键说明

| 外键名 | 字段 | 引用 | 删除策略 | 更新策略 |
|---|---|---|---|---|
| `fk_report_interview` | `interview_id` | `interview.id` | CASCADE | RESTRICT |
| `fk_report_generator` | `generated_by` | `user.id` | SET NULL | RESTRICT |

## 13. 关系概览

| 父表 | 子表 | 关系 | 关联字段 |
|---|---|---|---|
| `user` | `user_role` | 一对多 | `user.id = user_role.user_id` |
| `role` | `user_role` | 一对多 | `role.id = user_role.role_id` |
| `user` | `question_bank` | 一对多 | `user.id = question_bank.created_by` |
| `question_bank` | `question` | 一对多 | `question_bank.id = question.bank_id` |
| `user` | `question` | 一对多 | `user.id = question.created_by` |
| `user` | `interview` | 一对多 | `user.id = interview.candidate_id` |
| `user` | `interview` | 一对多 | `user.id = interview.interviewer_id` |
| `interview` | `interview_question` | 一对多 | `interview.id = interview_question.interview_id` |
| `question` | `interview_question` | 一对多 | `question.id = interview_question.question_id` |
| `interview_question` | `interview_answer` | 一对零或一 | `interview_question.id = interview_answer.interview_question_id` |
| `interview_question` | `evaluation` | 一对多 | `interview_question.id = evaluation.interview_question_id` |
| `interview` | `report` | 一对零或一 | `interview.id = report.interview_id` |
