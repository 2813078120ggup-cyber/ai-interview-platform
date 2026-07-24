-- Fixed role model: ADMIN controls the platform, CANDIDATE participates in AI interviews.
START TRANSACTION;
DELETE FROM `user_role`;
DELETE FROM `role_permission`;
DELETE FROM `role`;
INSERT INTO `role` (`id`,`role_code`,`role_name`,`description`,`status`) VALUES
  (1,'ADMIN','Administrator','Platform administration and AI interview management',1),
  (2,'CANDIDATE','Candidate','Participates in AI practice interviews',1);
INSERT INTO `user_role` (`user_id`,`role_id`,`assigned_at`)
  SELECT `id`, CASE WHEN `username` IN ('admin_li','admin_zhang') THEN 1 ELSE 2 END, NOW() FROM `user` WHERE `status`=1;
UPDATE `interview` SET `interviewer_id` = 2 WHERE `interviewer_id` NOT IN (1,2);
INSERT IGNORE INTO `permission` (`permission_code`,`permission_name`,`resource_type`,`description`) VALUES
  ('ai_interview:manage','管理 AI 面试','interview','管理员创建和管理 AI 面试');
COMMIT;
