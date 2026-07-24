CREATE TABLE IF NOT EXISTS `media_file` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `owner_id` BIGINT UNSIGNED NOT NULL, `bucket_name` VARCHAR(128) NOT NULL,
  `object_key` VARCHAR(512) NOT NULL, `original_name` VARCHAR(255) DEFAULT NULL, `content_type` VARCHAR(128) NOT NULL,
  `media_type` VARCHAR(16) NOT NULL, `size_bytes` BIGINT UNSIGNED NOT NULL, `duration_seconds` INT UNSIGNED DEFAULT NULL,
  `checksum_sha256` CHAR(64) DEFAULT NULL, `status` TINYINT NOT NULL DEFAULT 0, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL, PRIMARY KEY (`id`), UNIQUE KEY `uk_media_object` (`bucket_name`,`object_key`),
  KEY `idx_media_owner_type_created` (`owner_id`,`media_type`,`created_at`), CONSTRAINT `fk_media_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_media_type` CHECK (`media_type` IN ('audio','video','image','pdf')), CONSTRAINT `chk_media_status` CHECK (`status` IN (0,1,2,3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `interview_answer` ADD COLUMN `media_id` BIGINT UNSIGNED DEFAULT NULL AFTER `interview_question_id`, ADD COLUMN `transcript` TEXT DEFAULT NULL AFTER `answer_data`, ADD KEY `idx_answer_media` (`media_id`), ADD CONSTRAINT `fk_answer_media` FOREIGN KEY (`media_id`) REFERENCES `media_file` (`id`) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS `ai_task` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `interview_id` BIGINT UNSIGNED DEFAULT NULL, `answer_id` BIGINT UNSIGNED DEFAULT NULL,
  `task_type` VARCHAR(32) NOT NULL, `dedupe_key` VARCHAR(128) DEFAULT NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0, `max_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 3, `scheduled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` DATETIME DEFAULT NULL, `finished_at` DATETIME DEFAULT NULL, `input_payload` JSON DEFAULT NULL, `output_payload` JSON DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL, `created_by` BIGINT UNSIGNED DEFAULT NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `uk_ai_task_dedupe` (`dedupe_key`),
  KEY `idx_ai_task_status_schedule` (`status`,`scheduled_at`,`id`), KEY `idx_ai_task_interview_type` (`interview_id`,`task_type`),
  CONSTRAINT `fk_ai_task_interview` FOREIGN KEY (`interview_id`) REFERENCES `interview` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_task_answer` FOREIGN KEY (`answer_id`) REFERENCES `interview_answer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_task_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_ai_task_status` CHECK (`status` IN ('PENDING','RUNNING','SUCCESS','FAILED','CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `permission` (`permission_code`,`permission_name`,`resource_type`,`description`) VALUES
  ('media:write','上传媒体','media','上传并关联面试媒体'), ('ai:execute','执行 AI 任务','ai','创建并查询 AI 转写、追问和播报任务');
