-- AI multi-modal interview platform enterprise schema.
-- MySQL 8.0+, InnoDB, utf8mb4. Execute on a new empty database.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `real_name` VARCHAR(64) NOT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(32) DEFAULT NULL,
  `avatar_url` VARCHAR(512) DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0 disabled, 1 enabled',
  `last_login_at` DATETIME DEFAULT NULL,
  `password_changed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`),
  UNIQUE KEY `uk_user_email` (`email`),
  UNIQUE KEY `uk_user_phone` (`phone`),
  KEY `idx_user_status_created` (`status`, `created_at`),
  CONSTRAINT `chk_user_status` CHECK (`status` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='System accounts';

CREATE TABLE `role` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_code` VARCHAR(32) NOT NULL,
  `role_name` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  UNIQUE KEY `uk_role_name` (`role_name`),
  CONSTRAINT `chk_role_status` CHECK (`status` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='RBAC roles';

CREATE TABLE `permission` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_code` VARCHAR(96) NOT NULL,
  `permission_name` VARCHAR(96) NOT NULL,
  `resource_type` VARCHAR(32) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`),
  KEY `idx_permission_resource` (`resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Fine-grained RBAC permissions';

CREATE TABLE `user_role` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `assigned_by` BIGINT UNSIGNED DEFAULT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `idx_user_role_role` (`role_id`),
  KEY `idx_user_role_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_role_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='User and role relation';

CREATE TABLE `role_permission` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `permission_id`),
  KEY `idx_role_permission_permission` (`permission_id`),
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Role and permission relation';

CREATE TABLE `refresh_token` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME DEFAULT NULL,
  `client_ip` VARCHAR(64) DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_token_user_expiry` (`user_id`, `expires_at`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Rotating refresh tokens';

CREATE TABLE `job_position` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `position_code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `department` VARCHAR(128) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `competency_model` JSON DEFAULT NULL COMMENT 'Scoring dimensions and weights',
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_job_position_code` (`position_code`),
  KEY `idx_job_position_status_name` (`status`, `name`),
  CONSTRAINT `fk_job_position_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_job_position_status` CHECK (`status` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Interview job positions';

CREATE TABLE `question_category` (
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

CREATE TABLE `question_bank` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED DEFAULT NULL,
  `position_id` BIGINT UNSIGNED DEFAULT NULL,
  `bank_code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `visibility` TINYINT NOT NULL DEFAULT 0 COMMENT '0 private, 1 shared, 2 public',
  `status` TINYINT NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_question_bank_code` (`bank_code`),
  KEY `idx_question_bank_category_status` (`category_id`, `status`),
  KEY `idx_question_bank_position_status` (`position_id`, `status`),
  CONSTRAINT `fk_question_bank_category` FOREIGN KEY (`category_id`) REFERENCES `question_category` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_question_bank_position` FOREIGN KEY (`position_id`) REFERENCES `job_position` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_question_bank_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_question_bank_visibility` CHECK (`visibility` IN (0, 1, 2)),
  CONSTRAINT `chk_question_bank_status` CHECK (`status` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Question banks';

CREATE TABLE `question` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bank_id` BIGINT UNSIGNED NOT NULL,
  `question_type` VARCHAR(20) NOT NULL COMMENT 'single_choice,multiple_choice,true_false,short_answer,coding',
  `difficulty` TINYINT NOT NULL DEFAULT 2,
  `content` TEXT NOT NULL,
  `options` JSON DEFAULT NULL,
  `correct_answer` JSON DEFAULT NULL,
  `answer_template` TEXT DEFAULT NULL,
  `explanation` TEXT DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `score` DECIMAL(6,2) NOT NULL DEFAULT 10.00,
  `source` VARCHAR(16) NOT NULL DEFAULT 'manual' COMMENT 'manual or ai',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0 draft,1 published,2 archived',
  `created_by` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_question_bank_status_order` (`bank_id`, `status`, `sort_order`, `id`),
  KEY `idx_question_type_difficulty` (`question_type`, `difficulty`),
  KEY `idx_question_creator` (`created_by`),
  CONSTRAINT `fk_question_bank` FOREIGN KEY (`bank_id`) REFERENCES `question_bank` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_question_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_question_type` CHECK (`question_type` IN ('single_choice','multiple_choice','true_false','short_answer','coding')),
  CONSTRAINT `chk_question_difficulty` CHECK (`difficulty` IN (1, 2, 3)),
  CONSTRAINT `chk_question_score` CHECK (`score` >= 0),
  CONSTRAINT `chk_question_source` CHECK (`source` IN ('manual', 'ai')),
  CONSTRAINT `chk_question_status` CHECK (`status` IN (0, 1, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Interview questions';

CREATE TABLE `interview` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `position_id` BIGINT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `candidate_id` BIGINT UNSIGNED NOT NULL,
  `interviewer_id` BIGINT UNSIGNED NOT NULL,
  `scheduled_at` DATETIME NOT NULL,
  `duration` INT UNSIGNED NOT NULL DEFAULT 60,
  `started_at` DATETIME DEFAULT NULL,
  `ended_at` DATETIME DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0 pending,1 in_progress,2 completed,3 cancelled',
  `type` VARCHAR(20) NOT NULL COMMENT 'tech,hr,comprehensive,ai',
  `meeting_url` VARCHAR(512) DEFAULT NULL,
  `remark` VARCHAR(500) DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interview_candidate_scheduled` (`candidate_id`, `scheduled_at`),
  KEY `idx_interview_interviewer_scheduled` (`interviewer_id`, `scheduled_at`),
  KEY `idx_interview_position_status` (`position_id`, `status`, `scheduled_at`),
  KEY `idx_interview_status_scheduled` (`status`, `scheduled_at`),
  CONSTRAINT `fk_interview_position` FOREIGN KEY (`position_id`) REFERENCES `job_position` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_interview_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_interview_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_interview_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_interview_duration` CHECK (`duration` > 0),
  CONSTRAINT `chk_interview_status` CHECK (`status` IN (0, 1, 2, 3)),
  CONSTRAINT `chk_interview_type` CHECK (`type` IN ('tech', 'hr', 'comprehensive', 'ai')),
  CONSTRAINT `chk_interview_time` CHECK (`ended_at` IS NULL OR `started_at` IS NULL OR `ended_at` >= `started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Interview sessions';

CREATE TABLE `interview_question` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `interview_id` BIGINT UNSIGNED NOT NULL,
  `question_id` BIGINT UNSIGNED DEFAULT NULL,
  `sequence_no` INT UNSIGNED NOT NULL,
  `max_score` DECIMAL(6,2) NOT NULL DEFAULT 10.00,
  `question_snapshot` JSON NOT NULL COMMENT 'Immutable question payload',
  `source` VARCHAR(16) NOT NULL DEFAULT 'bank' COMMENT 'bank or ai_follow_up',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_interview_question` (`interview_id`, `question_id`),
  UNIQUE KEY `uk_interview_sequence` (`interview_id`, `sequence_no`),
  KEY `idx_interview_question_question` (`question_id`),
  CONSTRAINT `fk_interview_question_interview` FOREIGN KEY (`interview_id`) REFERENCES `interview` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_interview_question_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_interview_question_score` CHECK (`max_score` >= 0),
  CONSTRAINT `chk_interview_question_source` CHECK (`source` IN ('bank', 'ai_follow_up'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Question snapshots selected for an interview';

CREATE TABLE `media_file` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id` BIGINT UNSIGNED NOT NULL,
  `bucket_name` VARCHAR(128) NOT NULL,
  `object_key` VARCHAR(512) NOT NULL,
  `original_name` VARCHAR(255) DEFAULT NULL,
  `content_type` VARCHAR(128) NOT NULL,
  `media_type` VARCHAR(16) NOT NULL COMMENT 'audio,video,image,pdf',
  `size_bytes` BIGINT UNSIGNED NOT NULL,
  `duration_seconds` INT UNSIGNED DEFAULT NULL,
  `checksum_sha256` CHAR(64) DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0 pending,1 available,2 failed,3 deleted',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_media_object` (`bucket_name`, `object_key`),
  KEY `idx_media_owner_type_created` (`owner_id`, `media_type`, `created_at`),
  KEY `idx_media_checksum` (`checksum_sha256`),
  CONSTRAINT `fk_media_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_media_type` CHECK (`media_type` IN ('audio', 'video', 'image', 'pdf')),
  CONSTRAINT `chk_media_status` CHECK (`status` IN (0, 1, 2, 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Object storage media metadata';

CREATE TABLE `interview_answer` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `interview_question_id` BIGINT UNSIGNED NOT NULL,
  `media_id` BIGINT UNSIGNED DEFAULT NULL,
  `answer_content` TEXT DEFAULT NULL,
  `answer_data` JSON DEFAULT NULL,
  `transcript` TEXT DEFAULT NULL,
  `duration_seconds` INT UNSIGNED DEFAULT NULL,
  `answered_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_answer_interview_question` (`interview_question_id`),
  KEY `idx_answer_media` (`media_id`),
  CONSTRAINT `fk_answer_interview_question` FOREIGN KEY (`interview_question_id`) REFERENCES `interview_question` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answer_media` FOREIGN KEY (`media_id`) REFERENCES `media_file` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Candidate answers and transcription';

CREATE TABLE `ai_session` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `interview_id` BIGINT UNSIGNED NOT NULL,
  `session_type` VARCHAR(20) NOT NULL COMMENT 'interview,question_generation,evaluation',
  `model` VARCHAR(128) NOT NULL,
  `prompt_version` VARCHAR(64) NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0 closed,1 active,2 failed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_session_interview_type` (`interview_id`, `session_type`),
  CONSTRAINT `fk_ai_session_interview` FOREIGN KEY (`interview_id`) REFERENCES `interview` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ai_session_status` CHECK (`status` IN (0, 1, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI conversation session';

CREATE TABLE `ai_message` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(16) NOT NULL COMMENT 'system,user,assistant,tool',
  `message_type` VARCHAR(24) NOT NULL COMMENT 'question,answer,follow_up,evaluation,summary',
  `content` TEXT NOT NULL,
  `token_count` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_message_session_created` (`session_id`, `created_at`),
  CONSTRAINT `fk_ai_message_session` FOREIGN KEY (`session_id`) REFERENCES `ai_session` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ai_message_role` CHECK (`role` IN ('system', 'user', 'assistant', 'tool'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI conversation messages';

CREATE TABLE `ai_task` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `interview_id` BIGINT UNSIGNED DEFAULT NULL,
  `answer_id` BIGINT UNSIGNED DEFAULT NULL,
  `task_type` VARCHAR(32) NOT NULL,
  `dedupe_key` VARCHAR(128) DEFAULT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `max_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 3,
  `scheduled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` DATETIME DEFAULT NULL,
  `finished_at` DATETIME DEFAULT NULL,
  `input_payload` JSON DEFAULT NULL,
  `output_payload` JSON DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_task_dedupe` (`dedupe_key`),
  KEY `idx_ai_task_status_schedule` (`status`, `scheduled_at`, `id`),
  KEY `idx_ai_task_interview_type` (`interview_id`, `task_type`),
  CONSTRAINT `fk_ai_task_interview` FOREIGN KEY (`interview_id`) REFERENCES `interview` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_task_answer` FOREIGN KEY (`answer_id`) REFERENCES `interview_answer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_task_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_ai_task_status` CHECK (`status` IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Durable AI asynchronous tasks';

CREATE TABLE `evaluation` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `interview_question_id` BIGINT UNSIGNED NOT NULL,
  `evaluator_id` BIGINT UNSIGNED DEFAULT NULL,
  `source` VARCHAR(10) NOT NULL COMMENT 'human or ai',
  `professional_score` DECIMAL(5,2) NOT NULL,
  `expression_score` DECIMAL(5,2) NOT NULL,
  `logic_score` DECIMAL(5,2) NOT NULL,
  `adaptability_score` DECIMAL(5,2) NOT NULL,
  `overall_score` DECIMAL(5,2) NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `evidence` JSON DEFAULT NULL COMMENT 'Scoring evidence and citations',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0 pending,1 confirmed,2 adjusted',
  `confirmed_by` BIGINT UNSIGNED DEFAULT NULL,
  `confirmed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evaluation_question_source` (`interview_question_id`, `source`),
  KEY `idx_evaluation_evaluator` (`evaluator_id`),
  CONSTRAINT `fk_evaluation_question` FOREIGN KEY (`interview_question_id`) REFERENCES `interview_question` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_evaluation_confirmer` FOREIGN KEY (`confirmed_by`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_evaluation_source` CHECK (`source` IN ('human', 'ai')),
  CONSTRAINT `chk_evaluation_status` CHECK (`status` IN (0, 1, 2)),
  CONSTRAINT `chk_evaluation_scores` CHECK (`professional_score` BETWEEN 0 AND 100 AND `expression_score` BETWEEN 0 AND 100 AND `logic_score` BETWEEN 0 AND 100 AND `adaptability_score` BETWEEN 0 AND 100 AND `overall_score` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Human and AI evaluations';

CREATE TABLE `report` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `interview_id` BIGINT UNSIGNED NOT NULL,
  `total_score` DECIMAL(5,2) NOT NULL,
  `professional_score` DECIMAL(5,2) DEFAULT NULL,
  `expression_score` DECIMAL(5,2) DEFAULT NULL,
  `logic_score` DECIMAL(5,2) DEFAULT NULL,
  `adaptability_score` DECIMAL(5,2) DEFAULT NULL,
  `summary` TEXT NOT NULL,
  `strengths` TEXT DEFAULT NULL,
  `weaknesses` TEXT DEFAULT NULL,
  `improvement_suggestions` TEXT DEFAULT NULL,
  `generation_method` VARCHAR(10) NOT NULL DEFAULT 'ai',
  `generation_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `generated_by` BIGINT UNSIGNED DEFAULT NULL,
  `pdf_media_id` BIGINT UNSIGNED DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0 draft,1 published',
  `published_at` DATETIME DEFAULT NULL,
  `generated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_interview` (`interview_id`),
  KEY `idx_report_status_published` (`status`, `published_at`),
  CONSTRAINT `fk_report_interview` FOREIGN KEY (`interview_id`) REFERENCES `interview` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_generator` FOREIGN KEY (`generated_by`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_pdf_media` FOREIGN KEY (`pdf_media_id`) REFERENCES `media_file` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_report_method` CHECK (`generation_method` IN ('ai', 'manual')),
  CONSTRAINT `chk_report_status` CHECK (`status` IN (0, 1)),
  CONSTRAINT `chk_report_scores` CHECK (`total_score` BETWEEN 0 AND 100 AND (`professional_score` IS NULL OR `professional_score` BETWEEN 0 AND 100) AND (`expression_score` IS NULL OR `expression_score` BETWEEN 0 AND 100) AND (`logic_score` IS NULL OR `logic_score` BETWEEN 0 AND 100) AND (`adaptability_score` IS NULL OR `adaptability_score` BETWEEN 0 AND 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Final interview reports';

CREATE TABLE `operation_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `operator_id` BIGINT UNSIGNED DEFAULT NULL,
  `module` VARCHAR(64) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `resource_type` VARCHAR(64) DEFAULT NULL,
  `resource_id` BIGINT UNSIGNED DEFAULT NULL,
  `request_id` VARCHAR(64) DEFAULT NULL,
  `client_ip` VARCHAR(64) DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `detail` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_operation_log_operator_created` (`operator_id`, `created_at`),
  KEY `idx_operation_log_resource` (`resource_type`, `resource_id`),
  KEY `idx_operation_log_module_action_created` (`module`, `action`, `created_at`),
  CONSTRAINT `fk_operation_log_operator` FOREIGN KEY (`operator_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Auditable sensitive operations';
