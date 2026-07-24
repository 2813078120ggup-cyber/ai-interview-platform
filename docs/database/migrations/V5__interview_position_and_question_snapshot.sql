-- Adds the v2 interview extensions while preserving existing interview records.

ALTER TABLE `interview`
  ADD COLUMN `position_id` BIGINT UNSIGNED DEFAULT NULL AFTER `id`,
  ADD KEY `idx_interview_position_status` (`position_id`, `status`, `scheduled_at`),
  ADD CONSTRAINT `fk_interview_position` FOREIGN KEY (`position_id`) REFERENCES `job_position` (`id`) ON DELETE SET NULL;

ALTER TABLE `interview_question`
  ADD COLUMN `source` VARCHAR(16) NOT NULL DEFAULT 'bank' AFTER `question_snapshot`,
  ADD CONSTRAINT `chk_interview_question_source` CHECK (`source` IN ('bank', 'ai_follow_up'));

INSERT IGNORE INTO `permission` (`permission_code`, `permission_name`, `resource_type`, `description`) VALUES
  ('interview:read', '查看面试', 'interview', '查询本人或授权范围内的面试与作答'),
  ('interview:write', '管理面试', 'interview', '创建、排期、取消和执行面试流程');
