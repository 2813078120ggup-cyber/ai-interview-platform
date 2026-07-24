-- Extends the v1 question-bank model without modifying existing records.

CREATE TABLE IF NOT EXISTS `question_category` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT UNSIGNED DEFAULT NULL,
  `category_code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_question_category_code` (`category_code`),
  KEY `idx_question_category_parent_sort` (`parent_id`, `sort_order`),
  CONSTRAINT `fk_question_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `question_category` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_question_category_status` CHECK (`status` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Question category tree';

ALTER TABLE `question_bank`
  ADD COLUMN `category_id` BIGINT UNSIGNED DEFAULT NULL AFTER `id`,
  ADD COLUMN `position_id` BIGINT UNSIGNED DEFAULT NULL AFTER `category_id`,
  ADD KEY `idx_question_bank_category_status` (`category_id`, `status`),
  ADD KEY `idx_question_bank_position_status` (`position_id`, `status`),
  ADD CONSTRAINT `fk_question_bank_category` FOREIGN KEY (`category_id`) REFERENCES `question_category` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_question_bank_position` FOREIGN KEY (`position_id`) REFERENCES `job_position` (`id`) ON DELETE SET NULL;

ALTER TABLE `question`
  ADD COLUMN `source` VARCHAR(16) NOT NULL DEFAULT 'manual' AFTER `score`,
  ADD CONSTRAINT `chk_question_source` CHECK (`source` IN ('manual', 'ai'));

INSERT IGNORE INTO `permission` (`permission_code`, `permission_name`, `resource_type`, `description`) VALUES
  ('question:read', '查看题库', 'question', '查询题库、分类和题目'),
  ('question:write', '管理题库', 'question', '维护题库分类、题库和题目');
