-- Compatible migration for existing v1 database.

CREATE TABLE IF NOT EXISTS `permission` (
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

CREATE TABLE IF NOT EXISTS `role_permission` (
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `permission_id`),
  KEY `idx_role_permission_permission` (`permission_id`),
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Role and permission relation';

CREATE TABLE IF NOT EXISTS `job_position` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `position_code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `department` VARCHAR(128) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `competency_model` JSON DEFAULT NULL,
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

INSERT IGNORE INTO `permission` (`permission_code`, `permission_name`, `resource_type`, `description`) VALUES
  ('user:read', '查看用户', 'user', '查询用户与用户详情'),
  ('user:write', '管理用户', 'user', '创建用户、停用用户和分配角色'),
  ('role:read', '查看角色', 'role', '查询角色与权限字典'),
  ('role:write', '管理角色', 'role', '创建、更新角色与分配权限'),
  ('position:read', '查看岗位', 'position', '查询岗位'),
  ('position:write', '管理岗位', 'position', '创建、更新和删除岗位');
