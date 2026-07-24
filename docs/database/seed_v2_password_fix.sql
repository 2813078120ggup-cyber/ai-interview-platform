-- Fix passwords for accounts already inserted by an earlier seed_v2.sql.
-- All listed test accounts will use the plaintext password: password

UPDATE `user`
SET `password_hash` = '$2a$10$27RjyF/XNbZUA5FD8bZvr.prelYf4keaWUO.V1RAJdEtG.QlJeYUC',
    `status` = 1,
    `updated_at` = CURRENT_TIMESTAMP
WHERE `username` IN (
  'admin_zhang', 'admin_li',
  'interviewer_wang', 'interviewer_chen', 'interviewer_zhao',
  'candidate_liu', 'candidate_sun', 'candidate_zhou', 'candidate_wu', 'candidate_xu'
);
