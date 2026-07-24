CREATE TABLE IF NOT EXISTS `user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `username`      VARCHAR(64)     NOT NULL COMMENT 'Login name',
  `password_hash` VARCHAR(255)    NOT NULL COMMENT 'Password hash, never store plaintext',
  `real_name`     VARCHAR(64)     NOT NULL COMMENT 'Display name',
  `email`         VARCHAR(128)    DEFAULT NULL COMMENT 'Email address',
  `phone`         VARCHAR(32)     DEFAULT NULL COMMENT 'Phone number',
  `avatar_url`    VARCHAR(512)    DEFAULT NULL COMMENT 'Avatar URL',
  `status`        TINYINT         NOT NULL DEFAULT 1 COMMENT '0 disabled, 1 enabled',
  `last_login_at` DATETIME        DEFAULT NULL COMMENT 'Last successful login time',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  `deleted_at`    DATETIME        DEFAULT NULL COMMENT 'Soft-delete time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`),
  UNIQUE KEY `uk_user_email` (`email`),
  UNIQUE KEY `uk_user_phone` (`phone`),
  KEY `idx_user_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='System users';

CREATE TABLE IF NOT EXISTS `role` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `role_code`   VARCHAR(32)     NOT NULL COMMENT 'Stable role code, e.g. CANDIDATE',
  `role_name`   VARCHAR(64)     NOT NULL COMMENT 'Role display name',
  `description` VARCHAR(255)    DEFAULT NULL COMMENT 'Role description',
  `status`      TINYINT         NOT NULL DEFAULT 1 COMMENT '0 disabled, 1 enabled',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  UNIQUE KEY `uk_role_name` (`role_name`),
  KEY `idx_role_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='User roles';

CREATE TABLE IF NOT EXISTS `user_role` (
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT 'User id',
  `role_id`     BIGINT UNSIGNED NOT NULL COMMENT 'Role id',
  `assigned_by` BIGINT UNSIGNED DEFAULT NULL COMMENT 'Operator user id',
  `assigned_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Assignment time',
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `idx_user_role_role` (`role_id`),
  KEY `idx_user_role_assigned_by` (`assigned_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='User-role many-to-many mapping';

CREATE TABLE IF NOT EXISTS `question_bank` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `bank_code`   VARCHAR(64)     NOT NULL COMMENT 'Stable bank code',
  `name`        VARCHAR(128)    NOT NULL COMMENT 'Bank name',
  `description` VARCHAR(500)    DEFAULT NULL COMMENT 'Bank description',
  `visibility`  TINYINT         NOT NULL DEFAULT 0 COMMENT '0 private, 1 shared, 2 public',
  `status`      TINYINT         NOT NULL DEFAULT 1 COMMENT '0 disabled, 1 enabled',
  `created_by`  BIGINT UNSIGNED NOT NULL COMMENT 'Creator user id',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  `deleted_at`  DATETIME        DEFAULT NULL COMMENT 'Soft-delete time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_question_bank_code` (`bank_code`),
  KEY `idx_question_bank_creator` (`created_by`),
  KEY `idx_question_bank_status_visibility` (`status`, `visibility`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Question banks';

CREATE TABLE IF NOT EXISTS `question` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `bank_id`         BIGINT UNSIGNED NOT NULL COMMENT 'Question bank id',
  `question_type`   VARCHAR(20)     NOT NULL COMMENT 'single_choice, multiple_choice, true_false, short_answer, coding',
  `difficulty`      TINYINT         NOT NULL DEFAULT 2 COMMENT '1 easy, 2 medium, 3 hard',
  `content`         TEXT            NOT NULL COMMENT 'Question body',
  `options`         JSON            DEFAULT NULL COMMENT 'Choice options as a JSON array',
  `correct_answer`  JSON            DEFAULT NULL COMMENT 'Canonical answer, protected from candidate APIs',
  `answer_template` TEXT            DEFAULT NULL COMMENT 'Expected answer or grading template',
  `explanation`     TEXT            DEFAULT NULL COMMENT 'Answer explanation',
  `tags`            JSON            DEFAULT NULL COMMENT 'Tags as a JSON array',
  `score`           DECIMAL(6,2)    NOT NULL DEFAULT 10.00 COMMENT 'Default maximum score',
  `sort_order`      INT             NOT NULL DEFAULT 0 COMMENT 'Order within bank',
  `status`          TINYINT         NOT NULL DEFAULT 1 COMMENT '0 draft, 1 published, 2 archived',
  `created_by`      BIGINT UNSIGNED NOT NULL COMMENT 'Creator user id',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  `deleted_at`      DATETIME        DEFAULT NULL COMMENT 'Soft-delete time',
  PRIMARY KEY (`id`),
  KEY `idx_question_bank_status_order` (`bank_id`, `status`, `sort_order`, `id`),
  KEY `idx_question_type_difficulty` (`question_type`, `difficulty`),
  KEY `idx_question_creator` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Interview questions';

CREATE TABLE IF NOT EXISTS `interview` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `title`          VARCHAR(200)    NOT NULL COMMENT 'Interview title',
  `candidate_id`   BIGINT UNSIGNED NOT NULL COMMENT 'Candidate user id',
  `interviewer_id` BIGINT UNSIGNED NOT NULL COMMENT 'Interviewer user id',
  `scheduled_at`   DATETIME        NOT NULL COMMENT 'Scheduled start time',
  `duration`       INT UNSIGNED    NOT NULL DEFAULT 60 COMMENT 'Planned duration in minutes',
  `started_at`     DATETIME        DEFAULT NULL COMMENT 'Actual start time',
  `ended_at`       DATETIME        DEFAULT NULL COMMENT 'Actual end time',
  `status`         TINYINT         NOT NULL DEFAULT 0 COMMENT '0 pending, 1 in_progress, 2 completed, 3 cancelled',
  `type`           VARCHAR(20)     NOT NULL COMMENT 'tech, hr, comprehensive',
  `meeting_url`    VARCHAR(512)    DEFAULT NULL COMMENT 'Online interview room URL',
  `remark`         VARCHAR(500)    DEFAULT NULL COMMENT 'Internal note',
  `created_by`     BIGINT UNSIGNED NOT NULL COMMENT 'Creator user id',
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`),
  KEY `idx_interview_candidate` (`candidate_id`, `scheduled_at`),
  KEY `idx_interview_interviewer` (`interviewer_id`, `scheduled_at`),
  KEY `idx_interview_status_scheduled` (`status`, `scheduled_at`),
  KEY `idx_interview_creator` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Interview sessions';

CREATE TABLE IF NOT EXISTS `interview_question` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `interview_id`      BIGINT UNSIGNED NOT NULL COMMENT 'Interview id',
  `question_id`       BIGINT UNSIGNED NOT NULL COMMENT 'Question id',
  `sequence_no`       INT UNSIGNED    NOT NULL COMMENT 'Question order in this interview',
  `max_score`         DECIMAL(6,2)    NOT NULL DEFAULT 10.00 COMMENT 'Maximum score for this interview',
  `question_snapshot` JSON            DEFAULT NULL COMMENT 'Optional immutable snapshot of question content',
  `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_interview_question` (`interview_id`, `question_id`),
  UNIQUE KEY `uk_interview_sequence` (`interview_id`, `sequence_no`),
  KEY `idx_interview_question_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Questions selected for an interview';

CREATE TABLE IF NOT EXISTS `interview_answer` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `interview_question_id` BIGINT UNSIGNED NOT NULL COMMENT 'Interview question id',
  `answer_content`        TEXT            DEFAULT NULL COMMENT 'Candidate text answer',
  `answer_data`           JSON            DEFAULT NULL COMMENT 'Structured answer, code, or selected options',
  `audio_url`             VARCHAR(512)    DEFAULT NULL COMMENT 'Optional answer recording URL',
  `duration_seconds`      INT UNSIGNED    DEFAULT NULL COMMENT 'Answer duration in seconds',
  `answered_at`           DATETIME        DEFAULT NULL COMMENT 'Submission time',
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_answer_interview_question` (`interview_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Candidate answers';

CREATE TABLE IF NOT EXISTS `evaluation` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `interview_question_id` BIGINT UNSIGNED NOT NULL COMMENT 'Evaluated interview question id',
  `evaluator_id`          BIGINT UNSIGNED DEFAULT NULL COMMENT 'Human evaluator user id; null for AI',
  `source`                VARCHAR(10)     NOT NULL COMMENT 'human or ai',
  `professional_score`    DECIMAL(5,2)    NOT NULL COMMENT 'Professional ability score, 0-100',
  `expression_score`      DECIMAL(5,2)    NOT NULL COMMENT 'Communication score, 0-100',
  `logic_score`           DECIMAL(5,2)    NOT NULL COMMENT 'Logical thinking score, 0-100',
  `adaptability_score`    DECIMAL(5,2)    NOT NULL COMMENT 'Adaptability score, 0-100',
  `overall_score`         DECIMAL(5,2)    NOT NULL COMMENT 'Overall score, 0-100',
  `comment`               TEXT            DEFAULT NULL COMMENT 'Evaluation comment',
  `status`                TINYINT         NOT NULL DEFAULT 0 COMMENT '0 pending, 1 confirmed, 2 adjusted',
  `confirmed_by`          BIGINT UNSIGNED DEFAULT NULL COMMENT 'User who confirmed or adjusted AI result',
  `confirmed_at`          DATETIME        DEFAULT NULL COMMENT 'Confirmation time',
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`),
  KEY `idx_evaluation_question_source` (`interview_question_id`, `source`),
  KEY `idx_evaluation_evaluator` (`evaluator_id`),
  KEY `idx_evaluation_confirmed_by` (`confirmed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Human and AI question evaluations';

CREATE TABLE IF NOT EXISTS `report` (
  `id`                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `interview_id`            BIGINT UNSIGNED NOT NULL COMMENT 'Interview id',
  `total_score`             DECIMAL(5,2)    NOT NULL COMMENT 'Overall interview score, 0-100',
  `professional_score`      DECIMAL(5,2)    DEFAULT NULL COMMENT 'Professional ability score, 0-100',
  `expression_score`        DECIMAL(5,2)    DEFAULT NULL COMMENT 'Communication score, 0-100',
  `logic_score`             DECIMAL(5,2)    DEFAULT NULL COMMENT 'Logical thinking score, 0-100',
  `adaptability_score`      DECIMAL(5,2)    DEFAULT NULL COMMENT 'Adaptability score, 0-100',
  `summary`                 TEXT            NOT NULL COMMENT 'Overall summary',
  `strengths`               TEXT            DEFAULT NULL COMMENT 'Candidate strengths',
  `weaknesses`              TEXT            DEFAULT NULL COMMENT 'Candidate weaknesses',
  `improvement_suggestions` TEXT            DEFAULT NULL COMMENT 'Improvement suggestions',
  `generation_method`       VARCHAR(10)     NOT NULL DEFAULT 'ai' COMMENT 'ai or manual',
  `generated_by`            BIGINT UNSIGNED DEFAULT NULL COMMENT 'Manual editor or operator user id',
  `pdf_url`                 VARCHAR(512)    DEFAULT NULL COMMENT 'Exported PDF URL',
  `generated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Generation time',
  `updated_at`              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_interview` (`interview_id`),
  KEY `idx_report_generated_at` (`generated_at`),
  KEY `idx_report_generated_by` (`generated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Final interview reports';
