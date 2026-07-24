-- Initial roles required by the application. Run after 01-schema_v1.sql.
INSERT INTO `role` (`role_code`, `role_name`, `description`, `status`) VALUES
  ('CANDIDATE', '候选人', '参加模拟面试并提交作答', 1),
  ('INTERVIEWER', '面试官', '主持面试并提交人工评测', 1),
  ('HR', '人力资源', '创建和管理面试及报告', 1),
  ('ADMIN', '管理员', '平台管理与异常处理', 1)
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`), `description` = VALUES(`description`), `status` = VALUES(`status`);
