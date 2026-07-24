-- AI interview platform demo seed data (MySQL 8.0+).
-- Run after 01-schema_v1.sql on an empty database.  This script creates:
-- 10 users, 5 question banks, 50 questions, 20 interviews, 20 answers,
-- 20 evaluations, and 20 reports.
-- All demo accounts use one BCrypt hash.  The plaintext credential is not stored
-- in this file; set/reset it through the application password-encoder if needed.

SET NAMES utf8mb4;
START TRANSACTION;

-- Roles
INSERT INTO `role` (`role_code`, `role_name`, `description`, `status`) VALUES
  ('CANDIDATE', '候选人', '参加模拟面试并提交作答', 1),
  ('INTERVIEWER', '面试官', '主持面试并进行人工评价', 1),
  ('HR', '人力资源', '创建和管理面试及报告', 1),
  ('ADMIN', '管理员', '平台管理与异常处理', 1)
ON DUPLICATE KEY UPDATE
  `role_name` = VALUES(`role_name`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`);

-- The value below is a valid BCrypt ($2a$, cost 10) password hash.
INSERT INTO `user`
  (`username`, `password_hash`, `real_name`, `email`, `phone`, `status`, `last_login_at`, `created_at`, `updated_at`)
VALUES
  ('admin_zhang', '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '张敏', 'admin.zhang@example.test', '13800001001', 1, '2026-06-20 09:15:00', '2026-01-05 09:00:00', '2026-06-20 09:15:00'),
  ('admin_li',    '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '李晨', 'admin.li@example.test',    '13800001002', 1, '2026-06-21 10:20:00', '2026-01-06 09:00:00', '2026-06-21 10:20:00'),
  ('interviewer_wang', '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '王磊', 'wang.lei@example.test', '13800001003', 1, '2026-06-22 11:00:00', '2026-01-10 09:00:00', '2026-06-22 11:00:00'),
  ('interviewer_chen','$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '陈静', 'chen.jing@example.test','13800001004', 1, '2026-06-22 14:30:00', '2026-01-10 09:00:00', '2026-06-22 14:30:00'),
  ('interviewer_zhao','$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '赵凯', 'zhao.kai@example.test', '13800001005', 1, '2026-06-23 09:45:00', '2026-01-11 09:00:00', '2026-06-23 09:45:00'),
  ('candidate_liu', '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '刘洋', 'liu.yang@example.test', '13800001006', 1, '2026-06-18 16:00:00', '2026-02-01 09:00:00', '2026-06-18 16:00:00'),
  ('candidate_sun', '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '孙悦', 'sun.yue@example.test',  '13800001007', 1, '2026-06-19 13:10:00', '2026-02-01 09:00:00', '2026-06-19 13:10:00'),
  ('candidate_zhou','$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '周航', 'zhou.hang@example.test','13800001008', 1, '2026-06-20 18:25:00', '2026-02-02 09:00:00', '2026-06-20 18:25:00'),
  ('candidate_wu',  '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '吴倩', 'wu.qian@example.test',  '13800001009', 1, '2026-06-21 12:40:00', '2026-02-02 09:00:00', '2026-06-21 12:40:00'),
  ('candidate_xu',  '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC', '许博', 'xu.bo@example.test',     '13800001010', 1, '2026-06-22 17:50:00', '2026-02-03 09:00:00', '2026-06-22 17:50:00');

SET @admin_1 := (SELECT id FROM `user` WHERE username = 'admin_zhang');
SET @admin_2 := (SELECT id FROM `user` WHERE username = 'admin_li');
SET @interviewer_1 := (SELECT id FROM `user` WHERE username = 'interviewer_wang');
SET @interviewer_2 := (SELECT id FROM `user` WHERE username = 'interviewer_chen');
SET @interviewer_3 := (SELECT id FROM `user` WHERE username = 'interviewer_zhao');

INSERT INTO `user_role` (`user_id`, `role_id`, `assigned_by`, `assigned_at`)
SELECT u.id, r.id, @admin_1, '2026-02-03 10:00:00'
FROM `user` u JOIN `role` r ON (u.username IN ('admin_zhang', 'admin_li') AND r.role_code = 'ADMIN')
   OR (u.username IN ('interviewer_wang', 'interviewer_chen', 'interviewer_zhao') AND r.role_code = 'INTERVIEWER')
   OR (u.username IN ('candidate_liu', 'candidate_sun', 'candidate_zhou', 'candidate_wu', 'candidate_xu') AND r.role_code = 'CANDIDATE');

INSERT INTO `user_role` (`user_id`, `role_id`, `assigned_by`, `assigned_at`)
SELECT @admin_1, id, @admin_1, '2026-02-03 10:00:00' FROM `role` WHERE role_code = 'HR';
INSERT INTO `user_role` (`user_id`, `role_id`, `assigned_by`, `assigned_at`)
SELECT @admin_2, id, @admin_1, '2026-02-03 10:00:00' FROM `role` WHERE role_code = 'HR';

-- Five question banks
INSERT INTO `question_bank` (`bank_code`, `name`, `description`, `visibility`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
  ('JAVA_CORE_2026', 'Java 核心基础题库', 'Java 语言、集合与并发基础', 2, 1, @interviewer_1, '2026-02-05 10:00:00', '2026-02-05 10:00:00'),
  ('SPRING_2026', 'Spring 与微服务题库', 'Spring Boot、事务和服务治理', 1, 1, @interviewer_2, '2026-02-06 10:00:00', '2026-02-06 10:00:00'),
  ('MYSQL_2026', 'MySQL 数据库题库', 'MySQL 8.0、索引与事务', 2, 1, @interviewer_3, '2026-02-07 10:00:00', '2026-02-07 10:00:00'),
  ('ALGORITHM_2026', '算法与数据结构题库', '常用数据结构、算法复杂度和编码题', 1, 1, @interviewer_1, '2026-02-08 10:00:00', '2026-02-08 10:00:00'),
  ('HR_GENERAL_2026', '综合素质题库', '沟通协作、职业规划和场景题', 2, 1, @interviewer_2, '2026-02-09 10:00:00', '2026-02-09 10:00:00');

-- Fifty questions, ten in each bank.
INSERT INTO `question`
  (`bank_id`, `question_type`, `difficulty`, `content`, `options`, `correct_answer`, `answer_template`, `explanation`, `tags`, `score`, `sort_order`, `status`, `created_by`, `created_at`, `updated_at`)
VALUES
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'single_choice', 1, 'Java 中哪个关键字用于继承类？', JSON_ARRAY(JSON_OBJECT('key','A','text','extends'),JSON_OBJECT('key','B','text','implements'),JSON_OBJECT('key','C','text','inherit'),JSON_OBJECT('key','D','text','super')), JSON_ARRAY('A'), NULL, 'extends 用于类继承，implements 用于实现接口。', JSON_ARRAY('Java','OOP'), 10, 1, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'short_answer', 2, '请说明 HashMap 在 JDK 8 中的底层结构和扩容机制。', NULL, JSON_ARRAY('数组','链表','红黑树','负载因子','扩容'), '应说明数组加链表加红黑树、阈值和扩容过程。', '考察集合实现原理。', JSON_ARRAY('Java','Collection','HashMap'), 15, 2, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'true_false', 1, 'Java 的 String 对象是不可变对象。', JSON_ARRAY(JSON_OBJECT('key','true','text','正确'),JSON_OBJECT('key','false','text','错误')), JSON_ARRAY(true), NULL, 'String 的值创建后不可修改。', JSON_ARRAY('Java','String'), 10, 3, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'short_answer', 2, 'volatile 关键字解决了哪些并发问题？', NULL, JSON_ARRAY('可见性','有序性','不保证原子性'), '应区分可见性、有序性与原子性。', 'volatile 不保证复合操作的原子性。', JSON_ARRAY('Java','Concurrency'), 15, 4, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'multiple_choice', 2, '下列哪些属于 Java 线程的状态？', JSON_ARRAY(JSON_OBJECT('key','A','text','NEW'),JSON_OBJECT('key','B','text','RUNNABLE'),JSON_OBJECT('key','C','text','BLOCKED'),JSON_OBJECT('key','D','text','FINISHED')), JSON_ARRAY('A','B','C'), NULL, 'Thread.State 中没有 FINISHED，终止状态为 TERMINATED。', JSON_ARRAY('Java','Thread'), 10, 5, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'coding', 3, '编写一个线程安全的单例模式实现，并说明为什么安全。', NULL, JSON_ARRAY('双重检查','volatile','私有构造'), '可使用静态内部类、枚举或带 volatile 的双重检查锁。', '考察并发下对象发布与初始化安全。', JSON_ARRAY('Java','DesignPattern','Concurrency'), 20, 6, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'short_answer', 2, 'equals 与 hashCode 为什么需要同时重写？', NULL, JSON_ARRAY('相等对象','相同哈希值','HashMap'), '应说明哈希容器通过 hashCode 定位并通过 equals 比较。', '违反约定会导致集合查询异常。', JSON_ARRAY('Java','OOP'), 15, 7, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'single_choice', 1, 'ArrayList 默认实现的底层数据结构是？', JSON_ARRAY(JSON_OBJECT('key','A','text','动态数组'),JSON_OBJECT('key','B','text','双向链表'),JSON_OBJECT('key','C','text','哈希表'),JSON_OBJECT('key','D','text','红黑树')), JSON_ARRAY('A'), NULL, 'ArrayList 由可扩容数组实现。', JSON_ARRAY('Java','Collection'), 10, 8, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'short_answer', 3, '请说明 JVM 内存区域以及一次对象创建的大致过程。', NULL, JSON_ARRAY('堆','栈','方法区','程序计数器','对象分配'), '覆盖运行时数据区、分配、初始化和引用建立。', '考察 JVM 基础与对象生命周期。', JSON_ARRAY('Java','JVM'), 20, 9, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'JAVA_CORE_2026'), 'true_false', 1, 'finally 块中的代码一定会被执行。', JSON_ARRAY(JSON_OBJECT('key','true','text','正确'),JSON_OBJECT('key','false','text','错误')), JSON_ARRAY(false), NULL, 'JVM 退出或线程被强制终止等场景下不一定执行。', JSON_ARRAY('Java','Exception'), 10, 10, 1, @interviewer_1, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),

  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'short_answer', 2, 'Spring IOC 容器的核心职责是什么？', NULL, JSON_ARRAY('对象管理','依赖注入','生命周期'), '说明 Bean 的创建、装配及生命周期管理。', '考察 IOC 与 DI 基本概念。', JSON_ARRAY('Spring','IOC'), 15, 1, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'short_answer', 3, 'Spring 事务传播行为 REQUIRED 的含义是什么？', NULL, JSON_ARRAY('当前事务','加入','新建事务'), '存在事务时加入，否则新建事务。', '考察声明式事务边界。', JSON_ARRAY('Spring','Transaction'), 15, 2, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'single_choice', 1, '@RestController 等价于以下哪两个注解组合？', JSON_ARRAY(JSON_OBJECT('key','A','text','@Controller + @ResponseBody'),JSON_OBJECT('key','B','text','@Service + @ResponseBody'),JSON_OBJECT('key','C','text','@Component + @RequestBody'),JSON_OBJECT('key','D','text','@Configuration + @Bean')), JSON_ARRAY('A'), NULL, '@RestController 组合了 @Controller 与 @ResponseBody。', JSON_ARRAY('Spring','Web'), 10, 3, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'short_answer', 2, 'Spring Boot 自动配置是如何生效的？', NULL, JSON_ARRAY('自动配置类','条件注解','配置文件'), '说明自动配置导入、条件装配和外部化配置。', '考察 Spring Boot 启动机制。', JSON_ARRAY('SpringBoot','AutoConfiguration'), 15, 4, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'true_false', 1, '同一个类中方法互相调用可以触发 Spring AOP 代理。', JSON_ARRAY(JSON_OBJECT('key','true','text','正确'),JSON_OBJECT('key','false','text','错误')), JSON_ARRAY(false), NULL, '自调用绕过代理，通常不能触发切面。', JSON_ARRAY('Spring','AOP'), 10, 5, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'short_answer', 3, '如何处理服务间调用的超时、重试和熔断？', NULL, JSON_ARRAY('超时','重试','熔断','幂等'), '说明合理超时、有限重试、熔断降级和幂等设计。', '考察微服务稳定性。', JSON_ARRAY('Microservice','Resilience'), 20, 6, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'multiple_choice', 2, '下列哪些注解可用于 Spring 组件扫描？', JSON_ARRAY(JSON_OBJECT('key','A','text','@Component'),JSON_OBJECT('key','B','text','@Service'),JSON_OBJECT('key','C','text','@Repository'),JSON_OBJECT('key','D','text','@Entity')), JSON_ARRAY('A','B','C'), NULL, '前三者属于组件注解，@Entity 用于 JPA 实体。', JSON_ARRAY('Spring','Annotation'), 10, 7, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'short_answer', 2, '请描述一次 HTTP 请求在 Spring MVC 中的处理流程。', NULL, JSON_ARRAY('DispatcherServlet','HandlerMapping','Controller','MessageConverter'), '覆盖前端控制器、映射、处理器和响应转换。', '考察 Web 框架流程。', JSON_ARRAY('SpringMVC','Web'), 15, 8, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'coding', 3, '设计一个接口幂等控制方案。', NULL, JSON_ARRAY('幂等键','唯一约束','状态机'), '可基于请求幂等键、数据库唯一索引或分布式锁实现。', '考察分布式业务设计。', JSON_ARRAY('Spring','Distributed'), 20, 9, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'SPRING_2026'), 'single_choice', 1, 'Spring 中默认单例 Bean 的作用域是？', JSON_ARRAY(JSON_OBJECT('key','A','text','singleton'),JSON_OBJECT('key','B','text','prototype'),JSON_OBJECT('key','C','text','request'),JSON_OBJECT('key','D','text','session')), JSON_ARRAY('A'), NULL, '默认 scope 为 singleton。', JSON_ARRAY('Spring','Bean'), 10, 10, 1, @interviewer_2, '2026-02-11 09:00:00', '2026-02-11 09:00:00'),

  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'short_answer', 2, 'MySQL 联合索引最左前缀原则是什么？', NULL, JSON_ARRAY('联合索引','最左列','索引利用'), '说明查询条件需从索引最左列开始以充分利用索引。', '考察索引设计。', JSON_ARRAY('MySQL','Index'), 15, 1, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'short_answer', 3, 'InnoDB 的 MVCC 如何实现一致性读？', NULL, JSON_ARRAY('隐藏字段','undo log','Read View'), '说明版本链、undo log 和 Read View 的作用。', '考察事务隔离实现。', JSON_ARRAY('MySQL','Transaction','MVCC'), 20, 2, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'single_choice', 1, 'InnoDB 默认的事务隔离级别是？', JSON_ARRAY(JSON_OBJECT('key','A','text','READ UNCOMMITTED'),JSON_OBJECT('key','B','text','READ COMMITTED'),JSON_OBJECT('key','C','text','REPEATABLE READ'),JSON_OBJECT('key','D','text','SERIALIZABLE')), JSON_ARRAY('C'), NULL, 'InnoDB 默认隔离级别为可重复读。', JSON_ARRAY('MySQL','Transaction'), 10, 3, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'short_answer', 2, '什么情况下索引会失效？请举例。', NULL, JSON_ARRAY('函数','隐式转换','范围条件','like'), '应列举函数计算、隐式转换、前导通配符等典型情况。', '考察 SQL 调优基础。', JSON_ARRAY('MySQL','Index','SQL'), 15, 4, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'true_false', 1, '执行 DELETE 后表空间一定会立即归还给操作系统。', JSON_ARRAY(JSON_OBJECT('key','true','text','正确'),JSON_OBJECT('key','false','text','错误')), JSON_ARRAY(false), NULL, 'DELETE 通常只标记记录，空间是否回收取决于表和操作。', JSON_ARRAY('MySQL','Storage'), 10, 5, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'short_answer', 3, '如何定位并优化一条慢 SQL？', NULL, JSON_ARRAY('慢日志','EXPLAIN','索引','执行计划'), '从慢日志定位，使用 EXPLAIN 分析并调整索引或 SQL。', '考察性能排查能力。', JSON_ARRAY('MySQL','Performance'), 20, 6, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'multiple_choice', 2, '下列哪些属于 InnoDB 锁类型？', JSON_ARRAY(JSON_OBJECT('key','A','text','记录锁'),JSON_OBJECT('key','B','text','间隙锁'),JSON_OBJECT('key','C','text','临键锁'),JSON_OBJECT('key','D','text','页锁')), JSON_ARRAY('A','B','C'), NULL, 'InnoDB 常见锁包括记录锁、间隙锁和临键锁。', JSON_ARRAY('MySQL','Lock'), 10, 7, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'short_answer', 2, '请比较 CHAR 与 VARCHAR 的适用场景。', NULL, JSON_ARRAY('定长','变长','存储','查询'), '说明 CHAR 适合定长字段，VARCHAR 适合长度变化较大的字段。', '考察字段设计。', JSON_ARRAY('MySQL','DataType'), 15, 8, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'coding', 3, '为订单列表设计索引并说明设计依据。', NULL, JSON_ARRAY('查询条件','排序','覆盖索引'), '根据高频过滤和排序字段设计联合索引，并验证执行计划。', '考察索引建模能力。', JSON_ARRAY('MySQL','Index','Design'), 20, 9, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'MYSQL_2026'), 'single_choice', 1, 'EXPLAIN 输出中 type 为 const 通常表示？', JSON_ARRAY(JSON_OBJECT('key','A','text','常量条件命中主键或唯一索引'),JSON_OBJECT('key','B','text','全表扫描'),JSON_OBJECT('key','C','text','索引合并'),JSON_OBJECT('key','D','text','无法使用索引')), JSON_ARRAY('A'), NULL, 'const 表示可用常量比较快速定位一行。', JSON_ARRAY('MySQL','EXPLAIN'), 10, 10, 1, @interviewer_3, '2026-02-12 09:00:00', '2026-02-12 09:00:00'),

  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'short_answer', 1, '数组和链表在随机访问上的时间复杂度分别是多少？', NULL, JSON_ARRAY('数组O(1)','链表O(n)'), '数组按下标访问 O(1)，链表需要遍历为 O(n)。', '考察基础复杂度分析。', JSON_ARRAY('Algorithm','DataStructure'), 10, 1, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'coding', 2, '实现二分查找，并说明循环不变量。', NULL, JSON_ARRAY('left','right','mid','有序数组'), '正确处理边界并维持目标位于搜索区间内的不变量。', '考察边界控制。', JSON_ARRAY('Algorithm','BinarySearch'), 15, 2, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'single_choice', 1, '使用队列实现 BFS 时，节点访问顺序通常是？', JSON_ARRAY(JSON_OBJECT('key','A','text','按层访问'),JSON_OBJECT('key','B','text','沿分支到底'),JSON_OBJECT('key','C','text','随机访问'),JSON_OBJECT('key','D','text','按权重访问')), JSON_ARRAY('A'), NULL, '广度优先搜索按层逐步扩展。', JSON_ARRAY('Algorithm','Graph','BFS'), 10, 3, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'short_answer', 2, '快速排序平均时间复杂度和最坏时间复杂度分别是多少？', NULL, JSON_ARRAY('O(nlogn)','O(n2)','pivot'), '平均 O(n log n)，极端划分下最坏 O(n²)。', '考察排序算法特征。', JSON_ARRAY('Algorithm','Sort'), 15, 4, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'true_false', 1, '栈遵循先进先出的访问规则。', JSON_ARRAY(JSON_OBJECT('key','true','text','正确'),JSON_OBJECT('key','false','text','错误')), JSON_ARRAY(false), NULL, '栈遵循后进先出规则。', JSON_ARRAY('Algorithm','Stack'), 10, 5, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'coding', 3, '给定字符串，找出无重复字符的最长子串长度。', NULL, JSON_ARRAY('滑动窗口','哈希表','双指针'), '使用滑动窗口与哈希表记录字符最近位置。', '考察滑动窗口建模。', JSON_ARRAY('Algorithm','SlidingWindow'), 20, 6, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'short_answer', 2, '什么场景适合使用动态规划？', NULL, JSON_ARRAY('最优子结构','重叠子问题','状态转移'), '指出最优子结构和重叠子问题，并给出状态定义。', '考察问题抽象能力。', JSON_ARRAY('Algorithm','DP'), 15, 7, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'multiple_choice', 2, '下列哪些是平衡二叉搜索树？', JSON_ARRAY(JSON_OBJECT('key','A','text','AVL树'),JSON_OBJECT('key','B','text','红黑树'),JSON_OBJECT('key','C','text','B树'),JSON_OBJECT('key','D','text','普通二叉树')), JSON_ARRAY('A','B','C'), NULL, 'AVL、红黑树和 B 树均通过不同方式维持平衡。', JSON_ARRAY('Algorithm','Tree'), 10, 8, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'short_answer', 3, '请分析 LRU 缓存的常见实现及复杂度。', NULL, JSON_ARRAY('哈希表','双向链表','O(1)'), '哈希表定位节点，双向链表维护访问顺序，读写均可 O(1)。', '考察组合数据结构设计。', JSON_ARRAY('Algorithm','Cache'), 20, 9, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'ALGORITHM_2026'), 'single_choice', 1, '哈希表查询的平均时间复杂度通常为？', JSON_ARRAY(JSON_OBJECT('key','A','text','O(1)'),JSON_OBJECT('key','B','text','O(log n)'),JSON_OBJECT('key','C','text','O(n)'),JSON_OBJECT('key','D','text','O(n log n)')), JSON_ARRAY('A'), NULL, '良好哈希分布下平均查询复杂度为 O(1)。', JSON_ARRAY('Algorithm','Hash'), 10, 10, 1, @interviewer_1, '2026-02-13 09:00:00', '2026-02-13 09:00:00'),

  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 1, '请用两分钟介绍自己，并突出与岗位相关的经历。', NULL, JSON_ARRAY('结构','经历','岗位匹配'), '表达应有结构，突出成果和岗位匹配度。', '考察表达与自我认知。', JSON_ARRAY('HR','Communication'), 15, 1, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 2, '描述一次你推动跨团队协作并解决分歧的经历。', NULL, JSON_ARRAY('背景','行动','结果','复盘'), '使用 STAR 结构说明沟通方式、行动和量化结果。', '考察协作与影响力。', JSON_ARRAY('HR','Collaboration'), 15, 2, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 2, '面对紧急且需求不明确的任务，你会如何推进？', NULL, JSON_ARRAY('澄清目标','拆分任务','风险沟通','反馈'), '应说明目标澄清、计划拆分、风险同步和持续反馈。', '考察抗压和问题解决能力。', JSON_ARRAY('HR','ProblemSolving'), 15, 3, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'single_choice', 1, 'STAR 行为面试法中的 R 代表什么？', JSON_ARRAY(JSON_OBJECT('key','A','text','Result'),JSON_OBJECT('key','B','text','Risk'),JSON_OBJECT('key','C','text','Role'),JSON_OBJECT('key','D','text','Review')), JSON_ARRAY('A'), NULL, 'STAR 分别为情境、任务、行动和结果。', JSON_ARRAY('HR','STAR'), 10, 4, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 3, '如果你与直属上级对技术方案意见不同，会如何处理？', NULL, JSON_ARRAY('事实','方案对比','沟通','决策执行'), '基于数据比较方案，充分沟通后尊重并执行最终决策。', '考察职业成熟度。', JSON_ARRAY('HR','Conflict'), 20, 5, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'true_false', 1, '行为面试回答只要描述任务即可，不需要说明结果。', JSON_ARRAY(JSON_OBJECT('key','true','text','正确'),JSON_OBJECT('key','false','text','错误')), JSON_ARRAY(false), NULL, '高质量行为面试回答应明确行动和结果。', JSON_ARRAY('HR','STAR'), 10, 6, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 2, '你未来三年的职业规划是什么？', NULL, JSON_ARRAY('目标','路径','学习','岗位匹配'), '规划应具体、可执行，并与岗位发展方向关联。', '考察稳定性和成长动机。', JSON_ARRAY('HR','Career'), 15, 7, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 2, '讲述一次你犯错后如何补救并复盘的经历。', NULL, JSON_ARRAY('承担责任','补救','复盘','预防'), '应展现责任感、补救措施和预防机制。', '考察责任意识。', JSON_ARRAY('HR','Ownership'), 15, 8, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'multiple_choice', 1, '有效反馈通常应具备哪些特点？', JSON_ARRAY(JSON_OBJECT('key','A','text','具体'),JSON_OBJECT('key','B','text','及时'),JSON_OBJECT('key','C','text','基于事实'),JSON_OBJECT('key','D','text','人身评价')), JSON_ARRAY('A','B','C'), NULL, '反馈应具体、及时、基于事实，避免人身评价。', JSON_ARRAY('HR','Feedback'), 10, 9, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00'),
  ((SELECT id FROM question_bank WHERE bank_code = 'HR_GENERAL_2026'), 'short_answer', 3, '请说明你选择本岗位的原因，以及你能带来的价值。', NULL, JSON_ARRAY('动机','匹配','价值','案例'), '结合岗位需要，说明个人动机、能力匹配和可验证价值。', '考察动机与岗位匹配。', JSON_ARRAY('HR','Motivation'), 20, 10, 1, @interviewer_2, '2026-02-14 09:00:00', '2026-02-14 09:00:00');

-- Twenty completed interviews.
INSERT INTO `interview`
  (`title`, `candidate_id`, `interviewer_id`, `scheduled_at`, `duration`, `started_at`, `ended_at`, `status`, `type`, `meeting_url`, `remark`, `created_by`, `created_at`, `updated_at`)
VALUES
  ('Java 后端初试 - 刘洋 - 01', (SELECT id FROM `user` WHERE username='candidate_liu'), @interviewer_1, '2026-03-01 09:00:00', 60, '2026-03-01 09:02:00', '2026-03-01 09:58:00', 2, 'tech', 'https://meeting.example.test/interview/001', '技术基础良好', @admin_1, '2026-02-25 10:00:00', '2026-03-01 10:00:00'),
  ('Java 后端初试 - 孙悦 - 02', (SELECT id FROM `user` WHERE username='candidate_sun'), @interviewer_2, '2026-03-02 09:00:00', 60, '2026-03-02 09:01:00', '2026-03-02 09:57:00', 2, 'tech', 'https://meeting.example.test/interview/002', '表达清晰', @admin_1, '2026-02-25 10:00:00', '2026-03-02 10:00:00'),
  ('Java 后端初试 - 周航 - 03', (SELECT id FROM `user` WHERE username='candidate_zhou'), @interviewer_3, '2026-03-03 09:00:00', 60, '2026-03-03 09:03:00', '2026-03-03 09:59:00', 2, 'tech', 'https://meeting.example.test/interview/003', '集合基础扎实', @admin_2, '2026-02-25 10:00:00', '2026-03-03 10:00:00'),
  ('Java 后端初试 - 吴倩 - 04', (SELECT id FROM `user` WHERE username='candidate_wu'), @interviewer_1, '2026-03-04 09:00:00', 60, '2026-03-04 09:00:00', '2026-03-04 09:56:00', 2, 'tech', 'https://meeting.example.test/interview/004', '并发知识待加强', @admin_2, '2026-02-25 10:00:00', '2026-03-04 10:00:00'),
  ('Java 后端初试 - 许博 - 05', (SELECT id FROM `user` WHERE username='candidate_xu'), @interviewer_2, '2026-03-05 09:00:00', 60, '2026-03-05 09:02:00', '2026-03-05 09:58:00', 2, 'tech', 'https://meeting.example.test/interview/005', '线程模型理解较好', @admin_1, '2026-02-25 10:00:00', '2026-03-05 10:00:00'),
  ('Spring 专项面试 - 刘洋 - 06', (SELECT id FROM `user` WHERE username='candidate_liu'), @interviewer_2, '2026-03-06 14:00:00', 60, '2026-03-06 14:01:00', '2026-03-06 14:57:00', 2, 'tech', 'https://meeting.example.test/interview/006', 'IOC 理解到位', @admin_1, '2026-02-26 10:00:00', '2026-03-06 15:00:00'),
  ('Spring 专项面试 - 孙悦 - 07', (SELECT id FROM `user` WHERE username='candidate_sun'), @interviewer_3, '2026-03-07 14:00:00', 60, '2026-03-07 14:02:00', '2026-03-07 14:58:00', 2, 'tech', 'https://meeting.example.test/interview/007', '事务知识良好', @admin_1, '2026-02-26 10:00:00', '2026-03-07 15:00:00'),
  ('Spring 专项面试 - 周航 - 08', (SELECT id FROM `user` WHERE username='candidate_zhou'), @interviewer_1, '2026-03-08 14:00:00', 60, '2026-03-08 14:00:00', '2026-03-08 14:55:00', 2, 'tech', 'https://meeting.example.test/interview/008', 'Web 流程清楚', @admin_2, '2026-02-26 10:00:00', '2026-03-08 15:00:00'),
  ('Spring 专项面试 - 吴倩 - 09', (SELECT id FROM `user` WHERE username='candidate_wu'), @interviewer_2, '2026-03-09 14:00:00', 60, '2026-03-09 14:01:00', '2026-03-09 14:56:00', 2, 'tech', 'https://meeting.example.test/interview/009', '服务治理可提升', @admin_2, '2026-02-26 10:00:00', '2026-03-09 15:00:00'),
  ('Spring 专项面试 - 许博 - 10', (SELECT id FROM `user` WHERE username='candidate_xu'), @interviewer_3, '2026-03-10 14:00:00', 60, '2026-03-10 14:02:00', '2026-03-10 14:58:00', 2, 'tech', 'https://meeting.example.test/interview/010', '注解使用熟练', @admin_1, '2026-02-26 10:00:00', '2026-03-10 15:00:00'),
  ('MySQL 专项面试 - 刘洋 - 11', (SELECT id FROM `user` WHERE username='candidate_liu'), @interviewer_3, '2026-03-11 10:00:00', 60, '2026-03-11 10:01:00', '2026-03-11 10:57:00', 2, 'tech', 'https://meeting.example.test/interview/011', '索引设计合理', @admin_1, '2026-02-27 10:00:00', '2026-03-11 11:00:00'),
  ('MySQL 专项面试 - 孙悦 - 12', (SELECT id FROM `user` WHERE username='candidate_sun'), @interviewer_1, '2026-03-12 10:00:00', 60, '2026-03-12 10:03:00', '2026-03-12 10:59:00', 2, 'tech', 'https://meeting.example.test/interview/012', '事务原理掌握较好', @admin_2, '2026-02-27 10:00:00', '2026-03-12 11:00:00'),
  ('MySQL 专项面试 - 周航 - 13', (SELECT id FROM `user` WHERE username='candidate_zhou'), @interviewer_2, '2026-03-13 10:00:00', 60, '2026-03-13 10:00:00', '2026-03-13 10:54:00', 2, 'tech', 'https://meeting.example.test/interview/013', 'SQL 优化经验一般', @admin_2, '2026-02-27 10:00:00', '2026-03-13 11:00:00'),
  ('MySQL 专项面试 - 吴倩 - 14', (SELECT id FROM `user` WHERE username='candidate_wu'), @interviewer_3, '2026-03-14 10:00:00', 60, '2026-03-14 10:02:00', '2026-03-14 10:58:00', 2, 'tech', 'https://meeting.example.test/interview/014', '锁机制理解清晰', @admin_1, '2026-02-27 10:00:00', '2026-03-14 11:00:00'),
  ('MySQL 专项面试 - 许博 - 15', (SELECT id FROM `user` WHERE username='candidate_xu'), @interviewer_1, '2026-03-15 10:00:00', 60, '2026-03-15 10:01:00', '2026-03-15 10:57:00', 2, 'tech', 'https://meeting.example.test/interview/015', '存储结构基础可用', @admin_1, '2026-02-27 10:00:00', '2026-03-15 11:00:00'),
  ('综合素质面试 - 刘洋 - 16', (SELECT id FROM `user` WHERE username='candidate_liu'), @interviewer_2, '2026-03-16 15:00:00', 45, '2026-03-16 15:01:00', '2026-03-16 15:42:00', 2, 'comprehensive', 'https://meeting.example.test/interview/016', '目标明确', @admin_2, '2026-02-28 10:00:00', '2026-03-16 16:00:00'),
  ('综合素质面试 - 孙悦 - 17', (SELECT id FROM `user` WHERE username='candidate_sun'), @interviewer_3, '2026-03-17 15:00:00', 45, '2026-03-17 15:00:00', '2026-03-17 15:43:00', 2, 'comprehensive', 'https://meeting.example.test/interview/017', '协作案例完整', @admin_2, '2026-02-28 10:00:00', '2026-03-17 16:00:00'),
  ('综合素质面试 - 周航 - 18', (SELECT id FROM `user` WHERE username='candidate_zhou'), @interviewer_1, '2026-03-18 15:00:00', 45, '2026-03-18 15:02:00', '2026-03-18 15:41:00', 2, 'comprehensive', 'https://meeting.example.test/interview/018', '需加强冲突处理', @admin_1, '2026-02-28 10:00:00', '2026-03-18 16:00:00'),
  ('综合素质面试 - 吴倩 - 19', (SELECT id FROM `user` WHERE username='candidate_wu'), @interviewer_2, '2026-03-19 15:00:00', 45, '2026-03-19 15:01:00', '2026-03-19 15:42:00', 2, 'comprehensive', 'https://meeting.example.test/interview/019', '表达自然', @admin_1, '2026-02-28 10:00:00', '2026-03-19 16:00:00'),
  ('综合素质面试 - 许博 - 20', (SELECT id FROM `user` WHERE username='candidate_xu'), @interviewer_3, '2026-03-20 15:00:00', 45, '2026-03-20 15:00:00', '2026-03-20 15:44:00', 2, 'comprehensive', 'https://meeting.example.test/interview/020', '职业规划清晰', @admin_2, '2026-02-28 10:00:00', '2026-03-20 16:00:00');

-- One selected question for each interview; this deliberately yields 20 interview_question rows.
INSERT INTO `interview_question` (`interview_id`, `question_id`, `sequence_no`, `max_score`, `question_snapshot`, `created_at`)
SELECT i.id, q.id, 1, q.score, JSON_OBJECT('content', q.content, 'question_type', q.question_type, 'score', q.score), i.started_at
FROM (
  SELECT 'Java 后端初试 - 刘洋 - 01' AS title, 'Java 中哪个关键字用于继承类？' AS question_content UNION ALL
  SELECT 'Java 后端初试 - 孙悦 - 02', '请说明 HashMap 在 JDK 8 中的底层结构和扩容机制。' UNION ALL
  SELECT 'Java 后端初试 - 周航 - 03', 'Java 的 String 对象是不可变对象。' UNION ALL
  SELECT 'Java 后端初试 - 吴倩 - 04', 'volatile 关键字解决了哪些并发问题？' UNION ALL
  SELECT 'Java 后端初试 - 许博 - 05', '下列哪些属于 Java 线程的状态？' UNION ALL
  SELECT 'Spring 专项面试 - 刘洋 - 06', 'Spring IOC 容器的核心职责是什么？' UNION ALL
  SELECT 'Spring 专项面试 - 孙悦 - 07', 'Spring 事务传播行为 REQUIRED 的含义是什么？' UNION ALL
  SELECT 'Spring 专项面试 - 周航 - 08', '@RestController 等价于以下哪两个注解组合？' UNION ALL
  SELECT 'Spring 专项面试 - 吴倩 - 09', 'Spring Boot 自动配置是如何生效的？' UNION ALL
  SELECT 'Spring 专项面试 - 许博 - 10', '同一个类中方法互相调用可以触发 Spring AOP 代理。' UNION ALL
  SELECT 'MySQL 专项面试 - 刘洋 - 11', 'MySQL 联合索引最左前缀原则是什么？' UNION ALL
  SELECT 'MySQL 专项面试 - 孙悦 - 12', 'InnoDB 的 MVCC 如何实现一致性读？' UNION ALL
  SELECT 'MySQL 专项面试 - 周航 - 13', 'InnoDB 默认的事务隔离级别是？' UNION ALL
  SELECT 'MySQL 专项面试 - 吴倩 - 14', '什么情况下索引会失效？请举例。' UNION ALL
  SELECT 'MySQL 专项面试 - 许博 - 15', '执行 DELETE 后表空间一定会立即归还给操作系统。' UNION ALL
  SELECT '综合素质面试 - 刘洋 - 16', '请用两分钟介绍自己，并突出与岗位相关的经历。' UNION ALL
  SELECT '综合素质面试 - 孙悦 - 17', '描述一次你推动跨团队协作并解决分歧的经历。' UNION ALL
  SELECT '综合素质面试 - 周航 - 18', '面对紧急且需求不明确的任务，你会如何推进？' UNION ALL
  SELECT '综合素质面试 - 吴倩 - 19', 'STAR 行为面试法中的 R 代表什么？' UNION ALL
  SELECT '综合素质面试 - 许博 - 20', '如果你与直属上级对技术方案意见不同，会如何处理？'
) AS mapping
JOIN `interview` i ON i.title = mapping.title
JOIN `question` q ON q.content = mapping.question_content;

-- Candidate answers: exactly one answer for each selected interview question.
INSERT INTO `interview_answer` (`interview_question_id`, `answer_content`, `answer_data`, `audio_url`, `duration_seconds`, `answered_at`, `created_at`, `updated_at`)
SELECT iq.id,
       CONCAT('候选人围绕题目“', q.content, '”进行了结构化回答，说明了核心概念、实际项目经验和边界条件。'),
       JSON_OBJECT('format', 'text', 'submitted', true, 'confidence', 'medium'),
       CONCAT('https://media.example.test/answers/', LPAD(iq.id, 4, '0'), '.mp3'),
       145 + MOD(iq.id * 17, 180),
       DATE_ADD(i.started_at, INTERVAL 15 MINUTE),
       DATE_ADD(i.started_at, INTERVAL 15 MINUTE),
       DATE_ADD(i.started_at, INTERVAL 15 MINUTE)
FROM `interview_question` iq
JOIN `interview` i ON i.id = iq.interview_id
JOIN `question` q ON q.id = iq.question_id;

-- Exactly 20 evaluations.  Odd records are human-confirmed; even records are AI evaluations confirmed by an administrator.
INSERT INTO `evaluation`
  (`interview_question_id`, `evaluator_id`, `source`, `professional_score`, `expression_score`, `logic_score`, `adaptability_score`, `overall_score`, `comment`, `status`, `confirmed_by`, `confirmed_at`, `created_at`, `updated_at`)
SELECT iq.id,
       CASE WHEN MOD(iq.id, 2) = 1 THEN i.interviewer_id ELSE NULL END,
       CASE WHEN MOD(iq.id, 2) = 1 THEN 'human' ELSE 'ai' END,
       72 + MOD(iq.id * 7, 23),
       70 + MOD(iq.id * 5, 25),
       71 + MOD(iq.id * 9, 22),
       69 + MOD(iq.id * 11, 24),
       72 + MOD(iq.id * 8, 22),
       CASE WHEN MOD(iq.id, 2) = 1 THEN '回答覆盖了关键知识点，能够结合实际场景进行说明。'
            ELSE 'AI 分析显示候选人表达完整、逻辑连贯，建议继续加强复杂场景的深度分析。' END,
       CASE WHEN MOD(iq.id, 2) = 1 THEN 1 ELSE 2 END,
       CASE WHEN MOD(iq.id, 2) = 1 THEN i.interviewer_id ELSE @admin_1 END,
       DATE_ADD(i.ended_at, INTERVAL 30 MINUTE),
       DATE_ADD(i.ended_at, INTERVAL 20 MINUTE),
       DATE_ADD(i.ended_at, INTERVAL 30 MINUTE)
FROM `interview_question` iq
JOIN `interview` i ON i.id = iq.interview_id;

-- One published report for every completed interview (20 reports).
INSERT INTO `report`
  (`interview_id`, `total_score`, `professional_score`, `expression_score`, `logic_score`, `adaptability_score`, `summary`, `strengths`, `weaknesses`, `improvement_suggestions`, `generation_method`, `generated_by`, `pdf_url`, `status`, `published_at`, `generated_at`, `updated_at`)
SELECT i.id,
       74 + MOD(i.id * 3, 20),
       73 + MOD(i.id * 5, 21),
       72 + MOD(i.id * 7, 22),
       74 + MOD(i.id * 4, 20),
       71 + MOD(i.id * 6, 23),
       CONCAT('候选人在“', i.title, '”中完成了预设问题作答，整体表现达到岗位基础要求。'),
       '基础知识较扎实，能够清晰阐述自己的思路，并结合过往项目进行举例。',
       '在复杂边界条件和方案权衡方面的论述仍可更加深入。',
       '建议持续练习系统设计与复杂问题拆解，并在回答中补充量化结果。',
       CASE WHEN MOD(i.id, 2) = 0 THEN 'ai' ELSE 'manual' END,
       CASE WHEN MOD(i.id, 2) = 0 THEN NULL ELSE i.interviewer_id END,
       CONCAT('https://reports.example.test/interview/', i.id, '.pdf'),
       1,
       DATE_ADD(i.ended_at, INTERVAL 1 HOUR),
       DATE_ADD(i.ended_at, INTERVAL 45 MINUTE),
       DATE_ADD(i.ended_at, INTERVAL 1 HOUR)
FROM `interview` i
WHERE i.status = 2;

COMMIT;

-- Verification queries (optional):
-- SELECT COUNT(*) AS users FROM `user`;
-- SELECT COUNT(*) AS banks FROM question_bank;
-- SELECT COUNT(*) AS questions FROM question;
-- SELECT COUNT(*) AS interviews FROM interview;
-- SELECT COUNT(*) AS answers FROM interview_answer;
-- SELECT COUNT(*) AS evaluations FROM evaluation;
-- SELECT COUNT(*) AS reports FROM report;
